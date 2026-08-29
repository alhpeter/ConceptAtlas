import { LESSON_SYSTEM } from '../src/lib/prompts';
import { validateLesson } from '../src/lib/validation';
import { errorResponse, generateJson, jsonResponse, readBody } from './_lib';

const schema = {type:'object',additionalProperties:false,properties:{title:{type:'string'},why_it_matters:{type:'string'},explanation:{type:'string'},worked_example:{type:'string'},analogy:{type:'string'},check_question:{type:'string'}},required:['title','why_it_matters','explanation','worked_example','analogy','check_question']};
export default async function handler(req: Request) {
  if (req.method !== 'POST') return errorResponse('Method not allowed.', 405);
  try { const b=await readBody(req); const result=await generateJson(LESSON_SYSTEM,`Course: ${JSON.stringify(b.graph)}\nTarget: ${JSON.stringify(b.targetConcept)}\nEvaluation and likely gap: ${JSON.stringify(b.evaluation)}\nWrite a concise targeted lesson.`,schema); return jsonResponse(validateLesson(result)); }
  catch(e){ return errorResponse(e instanceof Error ? e.message : 'Lesson generation failed.',500); }
}
