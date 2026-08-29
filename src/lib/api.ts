import type { ApiResponse, CourseGraph, DiagnosticQuestion, Evaluation, Lesson, RetestQuestion, ResourcePack } from '../types';

async function post<T>(path: string, body: unknown, timeoutMs = 55_000): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    const raw = await response.text();
    let payload: ApiResponse<T> | { error?: string };
    try { payload = JSON.parse(raw); } catch { throw new Error(response.ok ? 'The server returned unreadable data. Please retry.' : `Request failed (${response.status}).`); }
    if (!response.ok || !('data' in payload) || !payload.data) throw new Error(('error' in payload && payload.error) || 'The AI request failed. Please retry.');
    return payload.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('The request timed out. Please retry.');
    throw error instanceof Error ? error : new Error('Something went wrong. Please retry.');
  } finally { window.clearTimeout(timeout); }
}

export const convertFile = async (file: File) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 55_000);
  try {
    const response = await fetch('/api/convert-file', { method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name) }, body: file, signal: controller.signal });
    const raw = await response.text();
    let payload: ApiResponse<{ markdown: string }> | { error?: string };
    try { payload = JSON.parse(raw); } catch { throw new Error('The document converter returned unreadable data.'); }
    if (!response.ok || !('data' in payload) || !payload.data?.markdown) throw new Error(('error' in payload && payload.error) || 'Could not convert the document.');
    return payload.data.markdown;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('Document conversion timed out.');
    throw error instanceof Error ? error : new Error('Could not convert the document.');
  } finally { window.clearTimeout(timeout); }
};

export const analyzeCourse = (sourceText: string) => post<CourseGraph>('/api/analyze-course', { sourceText }, 55_000);
export const diagnose = (payload: unknown) => post<DiagnosticQuestion>('/api/diagnose', payload);
export const evaluate = (payload: unknown) => post<Evaluation>('/api/evaluate', payload);
export const lesson = (payload: unknown) => post<Lesson>('/api/lesson', payload);
export const retest = (payload: unknown) => post<RetestQuestion>('/api/retest', payload);
export const discoverResources = (payload: unknown) => post<ResourcePack>('/api/resources', payload, 55_000);
