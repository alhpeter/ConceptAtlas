export const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export function jsonResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function readBody(req: Request, maxBytes = 700_000) {
  const length = Number(req.headers.get('content-length') || 0);
  if (length && length > maxBytes) throw new Error('Request is too large.');
  const text = await req.text();
  if (text.length > maxBytes) throw new Error('Request is too large.');
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    throw new Error('Invalid request body.');
  }
}

export function requireKey() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('Groq is not configured on the server yet. Add GROQ_API_KEY to your environment.');
  }
  return key;
}

export async function generateJson(
  systemInstruction: string,
  userPrompt: string,
  schema: Record<string, unknown>,
) {
  const key = requireKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 1000,
        reasoning_effort: 'low',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'conceptatlas_response',
            schema,
            strict: true,
          },
        },
      }),
      signal: controller.signal,
    });

    const raw = await response.text();
    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new Error('Groq returned an unreadable response.');
    }

    if (!response.ok) {
      let message = payload?.error?.message || `Groq request failed (${response.status}).`;
      if (response.status === 413 || /tokens per minute|TPM|Request too large/i.test(message)) {
        message = 'This syllabus request is too large for the current Groq rate limit. ConceptAtlas now compresses the syllabus automatically; try a shorter syllabus or retry.';
      }
      throw new Error(message);
    }

    const content = payload?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Groq returned an empty response.');

    try {
      return JSON.parse(content);
    } catch {
      throw new Error('Groq returned malformed structured data.');
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The Groq request timed out. Please retry.');
    }
    throw error instanceof Error ? error : new Error('Groq request failed. Please retry.');
  } finally {
    clearTimeout(timeout);
  }
}
