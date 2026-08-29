import { z } from 'zod';
import type { CourseGraph, Evaluation, Lesson, DiagnosticQuestion, RetestQuestion, ResourcePack } from '../types';

export const conceptSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  difficulty: z.number().int().min(1).max(5)
});

export const relationshipSchema = z.object({
  source: z.string().min(1), target: z.string().min(1), type: z.literal('prerequisite'), confidence: z.number().min(0).max(1)
});

export const courseGraphSchema = z.object({
  course_title: z.string().min(1).max(160),
  concepts: z.array(conceptSchema).min(2).max(30),
  relationships: z.array(relationshipSchema).max(100),
  sequence: z.array(z.string()).min(2).max(30)
});

const diagnosticSchema = z.object({ question: z.string().min(8).max(700), why_this_question: z.string().min(8).max(400), expected_signal: z.string().min(8).max(500), concept_id: z.string().min(1) });
const evaluationSchema = z.object({ correct: z.boolean(), mastery_estimate: z.number().min(0).max(1), misconception: z.string().min(1).max(320), identified_gap: z.string().min(1).max(160), identified_gap_id: z.string().min(1), explanation: z.string().min(1).max(500), recommended_action: z.string().min(1).max(180) });
const lessonSchema = z.object({ title: z.string().min(1).max(140), why_it_matters: z.string().min(1).max(500), explanation: z.string().min(1).max(1200), worked_example: z.string().min(1).max(1200), analogy: z.string().min(1).max(500), check_question: z.string().min(8).max(500) });
const retestSchema = z.object({ question: z.string().min(8).max(700), expected_signal: z.string().min(8).max(500), concept_id: z.string().min(1) });
const resourceSchema = z.object({ title: z.string().min(1).max(180), url: z.string().url().max(600), provider: z.string().min(1).max(100), type: z.enum(['free','paid','practice','book','project','video','other']), why: z.string().min(1).max(320), cost_note: z.string().max(120).optional() });
const resourcePackSchema = z.object({ concept: z.string().min(1).max(120), level: z.string().min(1).max(60), summary: z.string().min(1).max(500), resources: z.array(resourceSchema).max(10) });

export function validateGraph(input: unknown): CourseGraph {
  const parsed = courseGraphSchema.parse(input);
  const ids = new Set<string>();
  const concepts = parsed.concepts.filter((concept) => {
    const normalized = concept.id.trim().toLowerCase();
    if (ids.has(normalized)) return false;
    ids.add(normalized); return true;
  });
  const validIds = new Set(concepts.map((c) => c.id));
  const edgeKeys = new Set<string>();
  const relationships = parsed.relationships.filter((edge) => {
    if (!validIds.has(edge.source) || !validIds.has(edge.target) || edge.source === edge.target) return false;
    const key = `${edge.source}->${edge.target}`;
    if (edgeKeys.has(key)) return false;
    edgeKeys.add(key); return true;
  });
  const sequence = parsed.sequence.filter((id, i, arr) => validIds.has(id) && arr.indexOf(id) === i);
  const missing = concepts.map((c) => c.id).filter((id) => !sequence.includes(id));
  return { course_title: parsed.course_title, concepts, relationships, sequence: [...sequence, ...missing] };
}
export function validateDiagnostic(input: unknown): DiagnosticQuestion { return diagnosticSchema.parse(input); }
export function validateEvaluation(input: unknown): Evaluation { return evaluationSchema.parse(input); }
export function validateLesson(input: unknown): Lesson { return lessonSchema.parse(input); }
export function validateRetest(input: unknown): RetestQuestion { return retestSchema.parse(input); }
export function validateResourcePack(input: unknown): ResourcePack { return resourcePackSchema.parse(input); }
