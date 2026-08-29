import { EVALUATOR_SYSTEM } from '../src/lib/prompts';
import { validateEvaluation } from '../src/lib/validation';
import { errorResponse, generateJson, jsonResponse, readBody } from './_lib';

const schema = { type:'object', additionalProperties:false, properties:{ correct:{type:'boolean'}, mastery_estimate:{type:'number',minimum:0,maximum:1}, misconception:{type:'string',maxLength:320}, identified_gap:{type:'string',maxLength:160}, identified_gap_id:{type:'string'}, explanation:{type:'string',maxLength:500}, recommended_action:{type:'string',maxLength:180} }, required:['correct','mastery_estimate','misconception','identified_gap','identified_gap_id','explanation','recommended_action'] };
export default async function handler(req: Request) {
  if (req.method !== 'POST') return errorResponse('Method not allowed.', 405);
  try {
    const b = await readBody(req);
    if (!b.graph || !b.targetConcept || !b.diagnostic || typeof b.studentAnswer !== 'string') return errorResponse('Missing evaluation context.');
    const prompt = `Course graph: ${JSON.stringify(b.graph)}\nTarget concept: ${JSON.stringify(b.targetConcept)}\nDiagnostic: ${JSON.stringify(b.diagnostic)}\nStudent answer: ${b.studentAnswer.slice(0,5000)}\nPrior estimated mastery: ${Number(b.priorMastery ?? 0.5)}\nRetest: ${Boolean(b.retest)}\nDemo mode: ${Boolean(b.demoMode)}\nIdentify the smallest plausible prerequisite gap. Use an existing concept id whenever possible. For demo mode, stay tightly grounded in the supplied graph and student evidence; do not invent a gap that is not represented by the graph.`;
    const result = await generateJson(EVALUATOR_SYSTEM, prompt, schema);
    return jsonResponse(validateEvaluation(result));
  } catch (e) { return errorResponse(e instanceof Error ? e.message : 'Evaluation failed.', 500); }
}
