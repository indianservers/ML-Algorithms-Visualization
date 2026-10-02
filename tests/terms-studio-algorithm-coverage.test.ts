import { describe, expect, it } from 'vitest';
import { navigationData } from '../src/data/navigation';
import { getTermLesson, termsStudioAlgorithmLessons, termsStudioLessons, termsStudioSearchMeta, termRoute } from '../src/data/termsStudio';
import { getTermExamples } from '../src/data/termsStudioExamples';

const algorithmCategories = navigationData.filter(({ category }) => !['Terms Studio', 'Lab', 'Deployment'].includes(category));
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

describe('Terms Studio algorithm coverage', () => {
  it('has a named term and direct in-app lab link for every catalog algorithm', () => {
    for (const { items } of algorithmCategories) {
      for (const item of items) {
        const term = termsStudioLessons.find((entry) => normalize(entry.label) === normalize(item.label));
        expect(term, item.route).toBeDefined();
        expect(term?.labLinks.some((link) => link.route === item.route), item.route).toBe(true);
        expect(getTermLesson(term!.slug), item.route).toBe(term);
      }
    }
  });

  it('gives newly added algorithms full explanations and two examples', () => {
    expect(termsStudioAlgorithmLessons.length).toBeGreaterThan(100);
    for (const term of termsStudioAlgorithmLessons) {
      expect(term.blurb.length, term.slug).toBeGreaterThan(25);
      expect(term.explanation.length, term.slug).toBeGreaterThanOrEqual(3);
      expect(term.whenToUse.length, term.slug).toBeGreaterThan(20);
      expect(term.watchFor.length, term.slug).toBeGreaterThan(20);
      expect(getTermExamples(term).length, term.slug).toBeGreaterThanOrEqual(2);
      expect(term.labLinks[0]?.route, term.slug).toMatch(/^(\/ml\/|\/ai-algorithms\/)/);
    }
    expect(new Set(termsStudioLessons.map((term) => term.slug)).size).toBe(termsStudioLessons.length);
    expect(new Set(termsStudioLessons.map((term) => normalize(term.label))).size).toBe(termsStudioLessons.length);
  });

  it('includes the new algorithm terms in Terms Studio search data', () => {
    for (const label of ['Simple Linear Regression', 'Genetic Algorithm', 'Object Detection']) {
      const term = termsStudioLessons.find((entry) => entry.label === label);
      expect(term, label).toBeDefined();
      expect(termsStudioSearchMeta[termRoute(term!.slug)]?.description, label).toBeTruthy();
    }
  });
});
