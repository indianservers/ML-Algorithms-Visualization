import { describe, expect, it } from 'vitest';
import { termsStudioLessons } from '../src/data/termsStudio';
import { getGlossaryLabel, getGlossaryLane } from '../src/data/termsStudioGlossary';
import { filterTermsCatalog, TERMS_PAGE_SIZE } from '../src/pages/termsStudio/termsStudioCatalog';

describe('Terms Studio catalog', () => {
  it('uses the complete lesson dataset and starts with a compact page', () => {
    const all = filterTermsCatalog(termsStudioLessons, '', 'All', 'All', 'az');
    expect(all).toHaveLength(termsStudioLessons.length);
    expect(all.slice(0, TERMS_PAGE_SIZE)).toHaveLength(12);
  });

  it('searches names and aliases without case or surrounding-space sensitivity', () => {
    const matches = filterTermsCatalog(termsStudioLessons, '  LR  ', 'All', 'All', 'az');
    expect(matches.some((term) => term.slug === 'learning-rate')).toBe(true);
  });

  it('composes search, category, and letter filters', () => {
    const matches = filterTermsCatalog(termsStudioLessons, 'accur', 'Evaluation', 'A', 'az');
    expect(matches.map((term) => getGlossaryLabel(term))).toEqual(['Accuracy']);
    expect(matches.every((term) => getGlossaryLane(term) === 'Evaluation')).toBe(true);
    expect(filterTermsCatalog(termsStudioLessons, '', 'Evaluation', 'A', 'az').map((term) => getGlossaryLabel(term))).toContain('Accuracy');
    expect(filterTermsCatalog(termsStudioLessons, 'no-such-term-2468', 'All', 'All', 'az')).toHaveLength(0);
  });

  it('sorts both alphabetical directions', () => {
    const az = filterTermsCatalog(termsStudioLessons, '', 'All', 'All', 'az').map(getGlossaryLabel);
    const za = filterTermsCatalog(termsStudioLessons, '', 'All', 'All', 'za').map(getGlossaryLabel);
    expect(az).toEqual([...za].reverse());
  });
});
