import { describe, expect, it } from 'vitest';
import { aiVirtualLabs } from '../src/features/ai-virtual-labs/catalog';
import { learningContent } from '../src/features/ai-virtual-labs/learningCatalog';
import { answerCheck, decodeShare, dueLabs, emptyLearningStore, labComplete, labRecord, recordAction, encodeShare } from '../src/features/ai-virtual-labs/learningModel';

describe('AI virtual lab learning records', () => {
  it('covers every native lab with a valid concept check and known links', () => {
    const slugs = new Set(aiVirtualLabs.map((lab) => lab.slug));
    for (const lab of aiVirtualLabs) {
      const entry = learningContent(lab.slug);
      expect(entry.goal.length).toBeGreaterThan(15);
      expect(entry.check.options[entry.check.answer]).toBeTruthy();
      for (const link of [...entry.prerequisites, ...entry.related]) expect(slugs.has(link)).toBe(true);
    }
  });

  it('requires activity and a correct check for ordinary lab completion', () => {
    const now = Date.UTC(2026, 8, 27);
    let store = emptyLearningStore();
    store = answerCheck(store, 'uniform-cost-search', true, now);
    expect(labComplete(labRecord(store, 'uniform-cost-search'), 'uniform-cost-search')).toBe(false);
    store = recordAction(recordAction(store, 'uniform-cost-search'), 'uniform-cost-search');
    expect(labComplete(labRecord(store, 'uniform-cost-search'), 'uniform-cost-search')).toBe(true);
    expect(dueLabs(store, now)).toEqual([]);
    expect(dueLabs(store, now + 86400000)).toContain('uniform-cost-search');
  });

  it('round trips a Unicode share payload', () => {
    const payload = { title: 'Learn α and γ', seed: 2026 };
    expect(decodeShare(encodeShare(payload))).toEqual(payload);
    expect(decodeShare('%%%')).toBeNull();
  });
});
