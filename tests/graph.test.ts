import { describe, expect, it } from 'vitest';
import { DEMO_GRAPH } from '../src/lib/demoCourse';
import { ancestors, directPrerequisites, masteryStatus } from '../src/lib/graph';

describe('graph reasoning', () => {
  it('finds prerequisite ancestors', () => expect(ancestors(DEMO_GRAPH,'backpropagation')).toContain('chain-rule'));
  it('sorts direct prerequisites by confidence', () => expect(directPrerequisites(DEMO_GRAPH,'backpropagation')[0].source).toBe('chain-rule'));
  it('maps mastery thresholds', () => { expect(masteryStatus(.38)).toBe('weak'); expect(masteryStatus(.6)).toBe('developing'); expect(masteryStatus(.9)).toBe('strong'); });
});
