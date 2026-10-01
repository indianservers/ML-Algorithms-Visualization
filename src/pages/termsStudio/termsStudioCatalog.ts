import type { TermLesson } from '../../data/termsStudio';
import { getGlossaryLabel, getGlossaryLane, type GlossaryPill, type GlossarySort } from '../../data/termsStudioGlossary';
import { matchTermsStudioQuery } from '../../data/termsStudioEnhance';

export const TERMS_PAGE_SIZE = 12;

export function filterTermsCatalog(lessons: TermLesson[], query: string, pill: GlossaryPill, letter: string, sort: GlossarySort): TermLesson[] {
  const needle = query.trim().toLowerCase();
  const searchMatches = needle ? new Set(matchTermsStudioQuery(needle).map((term) => term.slug)) : null;
  return lessons.filter((term) => {
    if (searchMatches && !searchMatches.has(term.slug) && !getGlossaryLane(term).toLowerCase().includes(needle)) return false;
    if (pill === 'Beginner' && term.badge !== 'Beginner') return false;
    if (pill !== 'All' && pill !== 'Beginner' && getGlossaryLane(term) !== pill) return false;
    return letter === 'All' || getGlossaryLabel(term).charAt(0).toUpperCase() === letter;
  }).sort((a, b) => {
    const labelA = getGlossaryLabel(a);
    const labelB = getGlossaryLabel(b);
    if (sort === 'za') return labelB.localeCompare(labelA);
    if (sort === 'beginner' && a.badge !== b.badge) return a.badge === 'Beginner' ? -1 : 1;
    if (sort === 'intermediate' && a.badge !== b.badge) return a.badge === 'Intermediate' ? -1 : 1;
    return labelA.localeCompare(labelB);
  });
}
