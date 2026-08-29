import { RESOURCE_SYSTEM } from '../src/lib/prompts';
import { validateResourcePack } from '../src/lib/validation';
import { errorResponse, jsonResponse, readBody, requireKey } from './_lib';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function extractSearchUrls(message: any): string[] {
  const found: string[] = [];
  const tools = message?.executed_tools;
  if (!Array.isArray(tools)) return found;
  for (const tool of tools) {
    const results = tool?.search_results?.results;
    if (!Array.isArray(results)) continue;
    for (const item of results) {
      if (typeof item?.url === 'string' && /^https?:\/\//i.test(item.url)) found.push(item.url);
    }
  }
  return [...new Set(found)];
}

function normalizeResources(raw: any, sourceUrls: string[], concept: string) {
  const resources = Array.isArray(raw?.resources) ? raw.resources : [];
  const allowed = new Set(sourceUrls);
  const safe = resources
    .filter((r: any) => typeof r?.title === 'string' && typeof r?.url === 'string' && allowed.has(r.url))
    .map((r: any) => ({
      title: r.title.slice(0, 180),
      url: r.url,
      provider: String(r.provider || 'Web source').slice(0, 100),
      type: ['free','paid','practice','book','project','video','other'].includes(r.type) ? r.type : 'other',
      why: String(r.why || 'Relevant to this roadmap concept.').slice(0, 320),
      ...(r.cost_note ? { cost_note: String(r.cost_note).slice(0, 120) } : {})
    }));
  return validateResourcePack({
    concept: String(raw?.concept || concept).slice(0, 120),
    level: String(raw?.level || 'Recommended').slice(0, 60),
    summary: String(raw?.summary || `A focused set of resources for ${concept}.`).slice(0, 500),
    resources: safe.slice(0, 8)
  });
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return errorResponse('Method not allowed.', 405);
  try {
    const body = await readBody(req, 40_000);
    const concept = typeof body.concept === 'string' ? body.concept.trim() : '';
    if (!concept) return errorResponse('A concept is required.');
    const roadmap = typeof body.roadmap === 'string' ? body.roadmap.slice(0, 5000) : '';
    const level = Number(body.difficulty || 3);
    const key = requireKey();
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Groq-Model-Version': 'latest' },
      body: JSON.stringify({
        model: 'groq/compound-mini',
        messages: [
          { role: 'system', content: RESOURCE_SYSTEM },
          { role: 'user', content: `Find the best learning resources for this roadmap node.\nConcept: ${concept}\nDifficulty: ${level}/5\nRoadmap context: ${roadmap}\nSearch the web, then return JSON with: concept, level, summary, resources[]. Each resource must have title, url, provider, type, why, and optional cost_note. Use only URLs actually found in your web search. Keep it concise.` }
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 1200,
        temperature: 0.1
      })
    });
    const raw = await response.text();
    let payload: any;
    try { payload = JSON.parse(raw); } catch { throw new Error('Groq returned an unreadable resource response.'); }
    if (!response.ok) throw new Error(payload?.error?.message || `Groq resource search failed (${response.status}).`);
    const message = payload?.choices?.[0]?.message;
    let parsed: any;
    try { parsed = JSON.parse(String(message?.content || '').trim()); } catch { throw new Error('Groq returned malformed resource data.'); }
    return jsonResponse(normalizeResources(parsed, extractSearchUrls(message), concept));
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Resource discovery failed.', 500);
  }
}
