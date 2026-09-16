// Pure, dependency-free relevance matcher shared by every algorithm search box.
//
// Semantics: queries are split into tokens and every token must match somewhere
// in the document (AND). A document's score is the sum of the best field score
// per token, so the ranking order is name > alias > difficulty/category > tag >
// description > route, with an extra bonus when the whole query appears verbatim
// in the name.

export interface SearchDocument {
  name: string;
  aliases?: readonly string[];
  category?: string;
  section?: string;
  level?: string;
  tags?: readonly string[];
  description?: string;
  route?: string;
}

export interface SearchHit<T> {
  item: T;
  score: number;
}

const WEIGHT = {
  namePhrase: 700,
  nameExact: 1000,
  nameWordExact: 640,
  namePrefix: 520,
  nameWordPrefix: 460,
  acronym: 420,
  nameContains: 300,
  aliasPhrase: 330,
  aliasExact: 380,
  aliasWordExact: 320,
  aliasPrefix: 280,
  aliasContains: 220,
  levelExact: 190,
  contextWordExact: 180,
  contextWordPrefix: 140,
  contextContains: 110,
  tagExact: 90,
  tagPrefix: 70,
  tagContains: 55,
  descriptionContains: 35,
  routeContains: 25,
  fuzzy: 12,
};

const FUZZY_MIN_LENGTH = 6;

/** Lowercase, strip diacritics, and reduce every separator to a single space. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenizeQuery(query: string): string[] {
  const normalized = normalizeText(query);
  return normalized ? normalized.split(' ') : [];
}

interface PreparedDocument {
  name: string;
  nameWords: string[];
  nameCompact: string;
  acronym: string;
  aliases: string[];
  aliasWords: string[];
  context: string;
  contextWords: string[];
  level: string;
  tags: string[];
  tagWords: string[];
  description: string;
  route: string;
}

const compact = (value: string) => value.replace(/ /g, '');

const acronymOf = (words: string[]) => (words.length > 1 ? words.map((word) => word[0]).join('') : '');

const preparedCache = new WeakMap<SearchDocument, PreparedDocument>();

function prepare(document: SearchDocument): PreparedDocument {
  const cached = preparedCache.get(document);
  if (cached) return cached;

  const name = normalizeText(document.name);
  const nameWords = name ? name.split(' ') : [];
  const aliases = (document.aliases ?? []).map(normalizeText).filter(Boolean);
  const context = normalizeText([document.category, document.section].filter(Boolean).join(' '));
  const tags = (document.tags ?? []).map(normalizeText).filter(Boolean);

  const prepared: PreparedDocument = {
    name,
    nameWords,
    nameCompact: compact(name),
    acronym: acronymOf(nameWords),
    aliases,
    aliasWords: [...new Set(aliases.flatMap((alias) => [...alias.split(' '), compact(alias)]))],
    context,
    contextWords: context ? [...new Set(context.split(' '))] : [],
    level: normalizeText(document.level ?? ''),
    tags,
    tagWords: [...new Set(tags.flatMap((tag) => tag.split(' ')))],
    description: normalizeText(document.description ?? ''),
    route: normalizeText(document.route ?? ''),
  };
  preparedCache.set(document, prepared);
  return prepared;
}

/** True when `token` is reachable from `word` with a single edit. */
function withinOneEdit(token: string, word: string): boolean {
  if (Math.abs(token.length - word.length) > 1) return false;
  if (token === word) return true;

  const [shorter, longer] = token.length <= word.length ? [token, word] : [word, token];
  let shortIndex = 0;
  let longIndex = 0;
  let edits = 0;
  while (shortIndex < shorter.length && longIndex < longer.length) {
    if (shorter[shortIndex] === longer[longIndex]) {
      shortIndex += 1;
      longIndex += 1;
      continue;
    }
    if (++edits > 1) return false;
    if (shorter.length === longer.length) shortIndex += 1;
    longIndex += 1;
  }
  return edits + (longer.length - longIndex) + (shorter.length - shortIndex) <= 1;
}

function scoreToken(document: PreparedDocument, token: string): number {
  let best = 0;
  const raise = (weight: number) => {
    if (weight > best) best = weight;
  };

  if (document.name === token || document.nameCompact === token) raise(WEIGHT.nameExact);
  if (document.nameWords.includes(token)) raise(WEIGHT.nameWordExact);
  if (document.name.startsWith(token) || document.nameCompact.startsWith(token)) raise(WEIGHT.namePrefix);
  if (document.nameWords.some((word) => word.startsWith(token))) raise(WEIGHT.nameWordPrefix);
  if (document.acronym === token) raise(WEIGHT.acronym);
  if (document.nameCompact.includes(token)) raise(WEIGHT.nameContains);

  if (best < WEIGHT.aliasExact) {
    if (document.aliases.includes(token)) raise(WEIGHT.aliasExact);
    if (document.aliasWords.includes(token)) raise(WEIGHT.aliasWordExact);
    if (document.aliases.some((alias) => alias.startsWith(token))) raise(WEIGHT.aliasPrefix);
    if (document.aliases.some((alias) => alias.includes(token))) raise(WEIGHT.aliasContains);
  }

  if (document.level === token) raise(WEIGHT.levelExact);
  if (document.contextWords.includes(token)) raise(WEIGHT.contextWordExact);
  if (document.contextWords.some((word) => word.startsWith(token))) raise(WEIGHT.contextWordPrefix);
  if (document.context.includes(token)) raise(WEIGHT.contextContains);

  if (document.tags.includes(token)) raise(WEIGHT.tagExact);
  if (document.tagWords.some((word) => word.startsWith(token))) raise(WEIGHT.tagPrefix);
  if (document.tags.some((tag) => tag.includes(token))) raise(WEIGHT.tagContains);

  if (document.description.includes(token)) raise(WEIGHT.descriptionContains);
  if (document.route.includes(token)) raise(WEIGHT.routeContains);

  // Typo tolerance is a last resort so a near-miss never outranks a real match,
  // and only applies to long words where a single edit is unlikely to be chance.
  if (best === 0 && token.length >= FUZZY_MIN_LENGTH) {
    const near = [...document.nameWords, document.nameCompact, ...document.aliasWords];
    if (near.some((word) => word.length >= FUZZY_MIN_LENGTH && withinOneEdit(token, word))) {
      raise(WEIGHT.fuzzy);
    }
  }

  return best;
}

/** Relevance of one document for one query; 0 means "does not match". */
export function scoreDocument(document: SearchDocument, query: string): number {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return 0;

  const prepared = prepare(document);
  let total = 0;
  for (const token of tokens) {
    const score = scoreToken(prepared, token);
    if (score === 0) return 0;
    total += score;
  }

  if (tokens.length > 1) {
    const phrase = tokens.join(' ');
    if (prepared.name.includes(phrase)) total += WEIGHT.namePhrase;
    else if (prepared.aliases.some((alias) => alias.includes(phrase))) total += WEIGHT.aliasPhrase;
  }

  return total;
}

/**
 * Rank `items` against `query`. An empty query returns every item untouched in
 * its original order; otherwise only matches are returned, best first, with
 * ties falling back to the original order.
 */
export function searchDocuments<T>(
  items: readonly T[],
  query: string,
  toDocument: (item: T) => SearchDocument,
): Array<SearchHit<T>> {
  if (tokenizeQuery(query).length === 0) return items.map((item) => ({ item, score: 0 }));

  return items
    .map((item) => ({ item, score: scoreDocument(toDocument(item), query) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score);
}
