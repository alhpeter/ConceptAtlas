import type { ConceptState, CourseGraph, ResourcePack } from '../types';

export const DEMO_GRAPH: CourseGraph = {
  course_title: 'Machine Learning Fundamentals',
  concepts: [
    { id: 'vectors', name: 'Vectors', description: 'Represent data as ordered numerical quantities.', difficulty: 2 },
    { id: 'matrices', name: 'Matrices', description: 'Organize numbers into structures used to transform and combine data.', difficulty: 2 },
    { id: 'linear-algebra', name: 'Linear Algebra', description: 'The mathematical toolkit behind vector and matrix operations.', difficulty: 3 },
    { id: 'derivatives', name: 'Derivatives', description: 'Measure how a function changes with respect to an input.', difficulty: 2 },
    { id: 'chain-rule', name: 'Chain Rule', description: 'Relates derivatives of composed functions.', difficulty: 3 },
    { id: 'gradients', name: 'Gradients', description: 'Collect partial derivatives to show the direction of steepest increase.', difficulty: 3 },
    { id: 'neural-networks', name: 'Neural Networks', description: 'Layered functions that transform inputs into predictions.', difficulty: 3 },
    { id: 'computational-graphs', name: 'Computational Graphs', description: 'Represent complex calculations as connected operations.', difficulty: 3 },
    { id: 'optimization', name: 'Optimization', description: 'Search for parameter values that reduce a chosen objective.', difficulty: 4 },
    { id: 'backpropagation', name: 'Backpropagation', description: 'Efficiently computes gradients through a neural network by propagating derivatives backward.', difficulty: 5 }
  ],
  relationships: [
    { source: 'vectors', target: 'linear-algebra', type: 'prerequisite', confidence: 0.98 },
    { source: 'matrices', target: 'linear-algebra', type: 'prerequisite', confidence: 0.98 },
    { source: 'derivatives', target: 'gradients', type: 'prerequisite', confidence: 0.95 },
    { source: 'derivatives', target: 'chain-rule', type: 'prerequisite', confidence: 0.97 },
    { source: 'linear-algebra', target: 'neural-networks', type: 'prerequisite', confidence: 0.91 },
    { source: 'chain-rule', target: 'computational-graphs', type: 'prerequisite', confidence: 0.77 },
    { source: 'neural-networks', target: 'computational-graphs', type: 'prerequisite', confidence: 0.82 },
    { source: 'gradients', target: 'optimization', type: 'prerequisite', confidence: 0.93 },
    { source: 'computational-graphs', target: 'backpropagation', type: 'prerequisite', confidence: 0.93 },
    { source: 'chain-rule', target: 'backpropagation', type: 'prerequisite', confidence: 0.98 },
    { source: 'gradients', target: 'backpropagation', type: 'prerequisite', confidence: 0.97 },
    { source: 'neural-networks', target: 'backpropagation', type: 'prerequisite', confidence: 0.91 },
    { source: 'optimization', target: 'backpropagation', type: 'prerequisite', confidence: 0.65 }
  ],
  sequence: ['vectors', 'matrices', 'linear-algebra', 'derivatives', 'gradients', 'chain-rule', 'neural-networks', 'computational-graphs', 'optimization', 'backpropagation']
};

export const INITIAL_CONCEPT_STATES: Record<string, ConceptState> = Object.fromEntries(
  DEMO_GRAPH.concepts.map((concept) => {
    const mastery = concept.id === 'chain-rule' ? 0.38 : concept.id === 'backpropagation' ? 0.51 : concept.id === 'optimization' ? 0.67 : 0.82;
    const status = mastery < 0.5 ? 'weak' : mastery < 0.75 ? 'developing' : 'strong';
    return [concept.id, { mastery, status } satisfies ConceptState];
  })
);

export const DEMO_QUESTIONS = {
  'backpropagation': {
    question: 'Suppose a model output depends on x through two nested functions, y = f(g(x)). Which idea lets you combine the local derivative of f with the local derivative of g, and why is that useful when computing gradients backward?',
    why_this_question: 'It distinguishes recognition of backpropagation vocabulary from understanding the dependency that makes backward differentiation work.',
    expected_signal: 'The student should connect composed derivatives to the chain rule and explain that local gradients can be multiplied along the path.',
    concept_id: 'chain-rule'
  },
  'chain-rule-retest': {
    question: 'A computational graph has z = 3x, then y = z². Without calculating the final number, explain how you would combine the local derivatives to get dy/dx.',
    expected_signal: 'The student should describe multiplying the local derivative dy/dz by dz/dx, demonstrating transfer rather than memorization.',
    concept_id: 'chain-rule'
  }
};

export const DEMO_RESOURCE_PACKS: Record<string, ResourcePack> = {
  'backpropagation': {
    concept: 'Backpropagation', level: 'Advanced', summary: 'Use one authoritative explanation, one visual lesson, and one small implementation project to turn the graph node into a learning task.',
    resources: [
      { title: 'Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html', provider: 'Andrej Karpathy', type: 'free', why: 'Free, code-first lessons that connect neural-network theory to working implementations.' },
      { title: 'The Deep Learning Book — Optimization for Training', url: 'https://www.deeplearningbook.org/', provider: 'Goodfellow, Bengio & Courville', type: 'book', why: 'A respected technical reference for the mathematical foundations behind training and gradients.' },
      { title: 'Neural Networks from Scratch', url: 'https://nnfs.io/', provider: 'Neural Networks from Scratch', type: 'practice', why: 'Hands-on implementation practice makes the backward pass concrete instead of purely symbolic.' },
      { title: 'Build backpropagation from scratch', url: 'https://github.com/karpathy/micrograd', provider: 'GitHub / micrograd', type: 'project', why: 'A small autograd engine is an excellent project for seeing the backward pass as real code.', cost_note: 'Free / open source' },
      { title: '3Blue1Brown — Neural Networks', url: 'https://www.3blue1brown.com/topics/neural-networks', provider: '3Blue1Brown', type: 'video', why: 'Visual intuition for gradients and neural networks before diving into implementation details.' },
      { title: 'Stanford CS231n', url: 'https://cs231n.github.io/', provider: 'Stanford', type: 'other', why: 'Course notes provide a structured bridge from intuition to implementation.' },
      { title: 'Deep Learning Specialization', url: 'https://www.coursera.org/specializations/deep-learning', provider: 'DeepLearning.AI / Coursera', type: 'paid', why: 'A structured paid path when a learner wants a full sequence rather than one topic.', cost_note: 'Paid; pricing varies' }
    ]
  },
  'chain-rule': {
    concept: 'Chain Rule', level: 'Intermediate', summary: 'Master composition of derivatives first; it is the smallest useful bridge into backpropagation.',
    resources: [
      { title: 'Essence of Calculus — Chain Rule', url: 'https://www.3blue1brown.com/topics/calculus', provider: '3Blue1Brown', type: 'free', why: 'Visual intuition makes composition and local rates of change easier to reason about.' },
      { title: 'Paul\'s Online Math Notes — Chain Rule', url: 'https://tutorial.math.lamar.edu/Classes/CalcI/ChainRule.aspx', provider: 'Paul Dawkins / Lamar University', type: 'free', why: 'Clear worked examples and practice-style explanations.' },
      { title: 'OpenStax Calculus Volume 1', url: 'https://openstax.org/details/books/calculus-volume-1', provider: 'OpenStax', type: 'book', why: 'Free textbook treatment with examples and exercises.', cost_note: 'Free' },
      { title: 'MIT OpenCourseWare — Single Variable Calculus', url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', provider: 'MIT OpenCourseWare', type: 'practice', why: 'Lectures, notes, and problems for deliberate practice.', cost_note: 'Free' },
      { title: 'Build a tiny gradient calculator', url: 'https://www.kaggle.com/learn', provider: 'Kaggle Learn', type: 'project', why: 'Use nested functions and numerical checks to connect symbolic rules to code.', cost_note: 'Free account' },
      { title: 'Calculus — Full Course', url: 'https://www.youtube.com/@3blue1brown/playlists', provider: '3Blue1Brown', type: 'video', why: 'Strong visual explanations for derivatives and composition.' },
      { title: 'Calculus Made Easy', url: 'https://www.coursera.org/courses?query=calculus', provider: 'Coursera', type: 'paid', why: 'Paid course options are useful when you want a guided sequence with graded work.', cost_note: 'Paid options; pricing varies' }
    ]
  }
};
