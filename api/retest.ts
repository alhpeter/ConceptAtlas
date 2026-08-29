import { RETEST_SYSTEM } from '../src/lib/prompts';
import { validateRetest } from '../src/lib/validation';
import { errorResponse, generateJson, jsonResponse, readBody } from './_lib';

const schema={type:'object',additionalProperties:false,properties:{question:{type:'string'},expected_signal:{type:'string'},concept_id:{type:'string'}},required:['question','expected_signal','concept_id']};
export default async function handler(req: Request){
  if(req.method!=='POST')return errorResponse('Method not allowed.',405);
  try{const b=await readBody(req);const result=await generateJson(RETEST_SYSTEM,`Course graph: ${JSON.stringify(b.graph)}\nTarget concept: ${JSON.stringify(b.targetConcept)}\nIdentified gap: ${JSON.stringify(b.gap)}\nPrevious diagnostic: ${JSON.stringify(b.previousQuestion)}\nCreate a fresh transfer question for the gap.`,schema);return jsonResponse(validateRetest(result));}
  catch(e){return errorResponse(e instanceof Error?e.message:'Retest generation failed.',500);}
}
