import { DIAGNOSTIC_SYSTEM, PREREQUISITE_SYSTEM } from '../src/lib/prompts';
import { validateDiagnostic } from '../src/lib/validation';
import { errorResponse, generateJson, jsonResponse, readBody } from './_lib';

const schema = { type: 'object', additionalProperties: false, properties: { question: {type:'string'}, why_this_question:{type:'string'}, expected_signal:{type:'string'}, concept_id:{type:'string'} }, required:['question','why_this_question','expected_signal','concept_id'] };
export default async function handler(req: Request) {
  if (req.method !== 'POST') return errorResponse('Method not allowed.', 405);
  try {
    const b = await readBody(req);
    if (!b.targetConcept || !b.graph) return errorResponse('Missing diagnosis context.');
    const p = `Target concept: ${JSON.stringify(b.targetConcept)}\nDirect prerequisites: ${JSON.stringify(b.prerequisites || [])}\nGraph: ${JSON.stringify(b.graph)}\nCreate a single short applied diagnostic question. Choose a prerequisite signal where appropriate. Return concept_id matching a supplied concept id.`;
    const result = await generateJson(DIAGNOSTIC_SYSTEM + '\n' + PREREQUISITE_SYSTEM, p, schema);
    return jsonResponse(validateDiagnostic(result));
  } catch (e) { return errorResponse(e instanceof Error ? e.message : 'Diagnosis failed.', 500); }
}
