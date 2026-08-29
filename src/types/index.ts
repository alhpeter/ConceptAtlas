export type MasteryStatus = 'strong' | 'developing' | 'weak' | 'selected';

export interface Concept {
  id: string;
  name: string;
  description: string;
  difficulty: number;
}

export interface Relationship {
  source: string;
  target: string;
  type: 'prerequisite';
  confidence: number;
}

export interface CourseGraph {
  course_title: string;
  concepts: Concept[];
  relationships: Relationship[];
  sequence: string[];
}

export interface ConceptState {
  mastery: number;
  status: Exclude<MasteryStatus, 'selected'>;
}

export interface DiagnosticQuestion {
  question: string;
  why_this_question: string;
  expected_signal: string;
  concept_id: string;
}

export interface Evaluation {
  correct: boolean;
  mastery_estimate: number;
  misconception: string;
  identified_gap: string;
  identified_gap_id: string;
  explanation: string;
  recommended_action: string;
}

export interface Lesson {
  title: string;
  why_it_matters: string;
  explanation: string;
  worked_example: string;
  analogy: string;
  check_question: string;
}

export interface RetestQuestion {
  question: string;
  expected_signal: string;
  concept_id: string;
}

export interface ResourceItem {
  title: string;
  url: string;
  provider: string;
  type: 'free' | 'paid' | 'practice' | 'book' | 'project' | 'video' | 'other';
  why: string;
  cost_note?: string;
}

export interface ResourcePack {
  concept: string;
  level: string;
  summary: string;
  resources: ResourceItem[];
}

export interface CourseContext {
  graph: CourseGraph;
  sourceText?: string;
}

export type FlowStep = 'idle' | 'diagnosing' | 'answering' | 'evaluating' | 'gap' | 'lesson' | 'retest' | 'complete';

export interface AppState {
  screen: 'home' | 'atlas';
  mode: 'demo' | 'upload';
  course: CourseContext | null;
  selectedConceptId: string | null;
  conceptStates: Record<string, ConceptState>;
  question: DiagnosticQuestion | null;
  evaluation: Evaluation | null;
  lesson: Lesson | null;
  retest: RetestQuestion | null;
  retestEvaluation: Evaluation | null;
  step: FlowStep;
  error: string | null;
  isBusy: boolean;
}

export interface ApiResponse<T> { data?: T; error?: string; }
