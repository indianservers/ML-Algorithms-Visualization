import { describe, expect, it } from 'vitest';
import { termsStudioAlgorithmLessons, termsStudioLessons } from '../src/data/termsStudio';
import { termsStudioMoreLessons } from '../src/data/termsStudioMoreTerms';
import { termsStudioExpansionLessons } from '../src/data/termsStudioExpansionTerms';
import { termsStudioAdditionalLessons } from '../src/data/termsStudioAdditionalTerms';
import { termsStudioAiLessons } from '../src/data/termsStudioAiTerms';
import { getTermExamples } from '../src/data/termsStudioExamples';

describe('Terms Studio expanded catalog', () => {
  it('adds exactly 100 distinct AI, ML, and deep learning terms', () => {
    expect(termsStudioMoreLessons).toHaveLength(100);
    expect(termsStudioExpansionLessons).toHaveLength(100);
    expect(termsStudioAdditionalLessons).toHaveLength(100);
    expect(termsStudioAiLessons).toHaveLength(100);
    expect(termsStudioExpansionLessons.filter(term => term.category === 'hugging-face')).toHaveLength(20);
    expect(termsStudioExpansionLessons.filter(term => term.category === 'tasks')).toHaveLength(20);
    expect(termsStudioLessons).toHaveLength(499 + termsStudioAlgorithmLessons.length);
    const slugs = termsStudioLessons.map(term => term.slug);
    const labels = termsStudioLessons.map(term => term.label.toLowerCase());
    expect(slugs.filter((slug, index) => slugs.indexOf(slug) !== index)).toEqual([]);
    expect(labels.filter((label, index) => labels.indexOf(label) !== index)).toEqual([]);
  });

  it('gives each new term examples and working related-term links', () => {
    const slugs = new Set(termsStudioLessons.map(term => term.slug));
    const brokenLinks: string[] = [];
    const shortExamples: string[] = [];
    for (const term of [...termsStudioMoreLessons, ...termsStudioExpansionLessons, ...termsStudioAdditionalLessons, ...termsStudioAiLessons]) {
      expect(term.blurb.length, term.slug).toBeGreaterThan(25);
      expect(term.explanation[0]?.length, term.slug).toBeGreaterThan(25);
      expect(getTermExamples(term)).toHaveLength(2);
      for (const example of getTermExamples(term)) {
        if (example.description.length <= 50) shortExamples.push(`${term.slug}: ${example.description.length}`);
      }
      for (const related of term.related) {
        if (!slugs.has(related)) brokenLinks.push(`${term.slug} → ${related}`);
      }
    }
    expect(shortExamples).toEqual([]);
    expect(brokenLinks).toEqual([]);
  });
});
