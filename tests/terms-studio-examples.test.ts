import { describe, expect, it } from 'vitest';
import { termsStudioLessons } from '../src/data/termsStudio';
import { getTermExamples } from '../src/data/termsStudioExamples';
import { getTermEnhance } from '../src/data/termsStudioEnhance';

describe('Terms Studio examples', () => {
  it('gives every term one to three concrete, distinct examples', () => {
    expect(termsStudioLessons.length).toBeGreaterThan(90);
    for (const term of termsStudioLessons) {
      const examples = getTermExamples(term);
      expect(examples.length, term.slug).toBeGreaterThanOrEqual(1);
      expect(examples.length, term.slug).toBeLessThanOrEqual(3);
      expect(new Set(examples.map(example => example.description)).size, term.slug).toBe(examples.length);
      for (const example of examples) {
        const detail = [example.description, ...(example.steps ?? []), example.takeaway ?? ''].join(' ');
        expect(detail.trim().length, term.slug).toBeGreaterThan(50);
        expect(example.description.trim(), term.slug).not.toBe(term.blurb.trim());
      }
    }
    const missingKeyIdeas = termsStudioLessons.filter(term => {
      const extra = getTermEnhance(term);
      return ![extra.sixty.what, extra.sixty.why, ...term.explanation].some(item => item && item !== term.blurb);
    }).map(term => term.slug);
    expect(missingKeyIdeas).toEqual([]);
  });
});
