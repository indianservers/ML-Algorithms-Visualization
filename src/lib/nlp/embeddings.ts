import { cosineSimilarity } from "./vectorize";
import { pca } from "../algorithms/dimensionality/pca";

export const EMBEDDING_WORDS: Record<string, number[]> = {
  king: [1, 1, 0, 0, 0, 0, 0.8, 0],
  queen: [1, 0, 1, 0, 0, 0, 0.8, 0],
  man: [0, 1, 0, 0, 0, 0, 0.5, 0],
  woman: [0, 0, 1, 0, 0, 0, 0.5, 0],
  apple: [0, 0, 0, 1, 0, 0, 0.2, 0],
  orange: [0, 0, 0, 1, 0, 0, 0.2, 0.1],
  cat: [0, 0, 0, 0, 1, 0, 0.2, 1],
  dog: [0, 0, 0, 0, 1, 0, 0.3, 1],
  car: [0, 0, 0, 0, 0, 1, 0.7, 0],
  truck: [0, 0, 0, 0, 0, 1, 0.9, 0],
};

export const EMBEDDING_DIM_NAMES = [
  "royalty",
  "male",
  "female",
  "fruit",
  "animal",
  "vehicle",
  "size",
  "domestic",
];

export function getEmbedding(word: string) {
  return EMBEDDING_WORDS[word.toLowerCase()] ?? null;
}

export function nearestWords(word: string, k = 5) {
  const vector = getEmbedding(word);
  if (!vector) return [];
  return Object.entries(EMBEDDING_WORDS)
    .filter(([name]) => name !== word.toLowerCase())
    .map(([name, other]) => ({ word: name, cosine: cosineSimilarity(vector, other) }))
    .sort((a, b) => b.cosine - a.cosine)
    .slice(0, k);
}

export function analogy(a: string, b: string, c: string) {
  const va = getEmbedding(a);
  const vb = getEmbedding(b);
  const vc = getEmbedding(c);
  if (!va || !vb || !vc) return { vector: null as number[] | null, neighbors: [] as Array<{ word: string; cosine: number }> };
  const query = va.map((value, i) => value - vb[i] + vc[i]);
  const neighbors = Object.entries(EMBEDDING_WORDS)
    .filter(([name]) => ![a, b, c].map((item) => item.toLowerCase()).includes(name))
    .map(([name, other]) => ({ word: name, cosine: cosineSimilarity(query, other) }))
    .sort((x, y) => y.cosine - x.cosine)
    .slice(0, 5);
  return { vector: query, neighbors };
}

export function embeddingPcaPoints() {
  const names = Object.keys(EMBEDDING_WORDS);
  const X = names.map((name) => EMBEDDING_WORDS[name]);
  const result = pca(X, 2, "none");
  return names.map((name, i) => ({ word: name, x: result.projections[i][0], y: result.projections[i][1] ?? 0 }));
}

export function embeddingCoverage(tokens: string[]) {
  const found = tokens.filter((token) => getEmbedding(token));
  return {
    found: found.length,
    total: tokens.length,
    percent: tokens.length ? found.length / tokens.length : 0,
  };
}

export function cooccurrenceWindow(tokens: string[], index: number, window = 2) {
  return tokens
    .map((token, i) => ({ token, distance: Math.abs(i - index) }))
    .filter((item) => item.distance > 0 && item.distance <= window);
}
