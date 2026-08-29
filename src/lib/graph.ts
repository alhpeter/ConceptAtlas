import type { CourseGraph, MasteryStatus } from '../types';

export function ancestors(graph: CourseGraph, targetId: string): string[] {
  const found = new Set<string>();
  const queue = [targetId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of graph.relationships) {
      if (edge.target === current && !found.has(edge.source)) {
        found.add(edge.source);
        queue.push(edge.source);
      }
    }
  }
  return [...found];
}

export function directPrerequisites(graph: CourseGraph, targetId: string) {
  return graph.relationships.filter((edge) => edge.target === targetId).sort((a, b) => b.confidence - a.confidence);
}

export function masteryStatus(value: number): Exclude<MasteryStatus, 'selected'> {
  if (value < 0.5) return 'weak';
  if (value < 0.75) return 'developing';
  return 'strong';
}

export function recommendNextPrerequisite(graph: CourseGraph, states: Record<string, { mastery: number }>, targetId: string) {
  const candidates = directPrerequisites(graph, targetId);
  if (!candidates.length) return null;
  const downstreamCount = (id: string) => graph.relationships.filter((e) => e.source === id).length;
  const maxDownstream = Math.max(1, ...candidates.map((e) => downstreamCount(e.source)));
  return candidates.map((edge) => {
    const mastery = states[edge.source]?.mastery ?? 0.55;
    const gap = 1 - mastery;
    const unlock = downstreamCount(edge.source) / maxDownstream;
    const score = gap * 0.55 + edge.confidence * 0.30 + unlock * 0.15;
    return { ...edge, mastery, gap, unlock, score };
  }).sort((a, b) => b.score - a.score)[0] ?? null;
}

export function roadmapOrder(graph: CourseGraph): string[] {
  const valid = graph.sequence?.filter((id) => graph.concepts.some((c) => c.id === id)) ?? [];
  const seen = new Set(valid);
  const fallback = graph.concepts.map((c) => c.id).filter((id) => !seen.has(id));
  return [...valid, ...fallback];
}
