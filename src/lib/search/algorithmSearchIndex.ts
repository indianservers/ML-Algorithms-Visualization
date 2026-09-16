// Searchable view of the algorithm catalogue. Labels, routes, categories and
// difficulty badges come from `navigation.ts`; descriptions, synonyms and topical
// tags come from `algorithmSearchMeta.ts`. Nothing here is hand-duplicated.

import { navigationData, type BadgeType, type NavItem } from '../../data/navigation';
import { algorithmSearchMeta, categorySearchMeta } from '../../data/algorithmSearchMeta';
import { getImplementationStatus, type ImplementationStatus } from '../../data/implementationStatus';
import {
  searchDocuments,
  tokenizeQuery,
  type SearchDocument,
  type SearchHit,
} from './matchAlgorithms';

export type AlgorithmLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export const LEVEL_OF_BADGE: Record<BadgeType, AlgorithmLevel> = {
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  Advanced: 'Advanced',
  Concept: 'Intermediate',
  'Browser Trainable': 'Advanced',
  'Browser Inference': 'Advanced',
  Educational: 'Beginner',
  'Educational Simplified': 'Beginner',
};

export interface AlgorithmSearchEntry extends NavItem {
  category: string;
  section: string;
  level: AlgorithmLevel;
  status: ImplementationStatus;
  description: string;
  synonyms: string[];
  tags: string[];
  categoryIndex: number;
  itemIndex: number;
  document: SearchDocument;
}

function buildEntry(
  item: NavItem,
  category: string,
  categoryIndex: number,
  itemIndex: number,
): AlgorithmSearchEntry {
  const categoryMeta = categorySearchMeta[category];
  const meta = algorithmSearchMeta[item.route];
  const section = categoryMeta?.section ?? category;
  const level = LEVEL_OF_BADGE[item.badge];
  const status = getImplementationStatus(item.route);
  const description = meta?.description ?? `${item.label} · ${section}.`;
  const synonyms = meta?.synonyms ?? [];
  const tags = [
    ...(meta?.tags ?? []),
    ...(categoryMeta?.tags ?? []),
    level.toLowerCase(),
    item.badge.toLowerCase(),
    status.toLowerCase(),
  ];

  return {
    ...item,
    category,
    section,
    level,
    status,
    description,
    synonyms,
    tags: [...new Set(tags)],
    categoryIndex,
    itemIndex,
    document: {
      name: item.label,
      aliases: synonyms,
      category,
      section,
      level,
      tags,
      description,
      route: item.route,
    },
  };
}

export const algorithmSearchIndex: AlgorithmSearchEntry[] = navigationData.flatMap(
  (group, categoryIndex) =>
    group.items.map((item, itemIndex) => buildEntry(item, group.category, categoryIndex, itemIndex)),
);

const byRoute = new Map(algorithmSearchIndex.map((entry) => [entry.route, entry]));

export function getAlgorithmSearchEntry(route: string) {
  return byRoute.get(route);
}

export interface AlgorithmSearchOptions {
  /** Difficulty pill; `All` (the default) leaves the level axis untouched. */
  level?: AlgorithmLevel | 'All';
  /** Restrict to these `navigation.ts` categories. */
  categories?: readonly string[];
  badge?: BadgeType | 'All';
  status?: ImplementationStatus | 'All';
  limit?: number;
}

export function searchAlgorithmHits(
  query: string,
  options: AlgorithmSearchOptions = {},
): Array<SearchHit<AlgorithmSearchEntry>> {
  const { level = 'All', categories, badge = 'All', status = 'All', limit } = options;

  const pool = algorithmSearchIndex.filter(
    (entry) =>
      (level === 'All' || entry.level === level) &&
      (badge === 'All' || entry.badge === badge) &&
      (status === 'All' || entry.status === status) &&
      (!categories || categories.includes(entry.category)),
  );

  const hits = searchDocuments(pool, query, (entry) => entry.document);
  return limit === undefined ? hits : hits.slice(0, limit);
}

/** Text query AND the structural filters, ranked best first. */
export function searchAlgorithms(
  query: string,
  options: AlgorithmSearchOptions = {},
): AlgorithmSearchEntry[] {
  return searchAlgorithmHits(query, options).map((hit) => hit.item);
}

/**
 * Same ranking, regrouped for category-shaped surfaces (nav trees, catalogs).
 * Without a query the groups stay in `navigation.ts` order; with one they are
 * ordered by their strongest hit so the most relevant section leads.
 */
export function searchAlgorithmsByCategory(query: string, options: AlgorithmSearchOptions = {}) {
  const grouped = new Map<string, { items: AlgorithmSearchEntry[]; best: number }>();
  for (const { item, score } of searchAlgorithmHits(query, options)) {
    const bucket = grouped.get(item.category);
    if (bucket) {
      bucket.items.push(item);
      bucket.best = Math.max(bucket.best, score);
    } else {
      grouped.set(item.category, { items: [item], best: score });
    }
  }

  const groups = navigationData
    .map((group) => ({
      category: group.category,
      icon: group.icon,
      items: grouped.get(group.category)?.items ?? [],
      best: grouped.get(group.category)?.best ?? 0,
    }))
    .filter((group) => group.items.length > 0);

  return tokenizeQuery(query).length > 0
    ? groups.sort((a, b) => b.best - a.best)
    : groups;
}
