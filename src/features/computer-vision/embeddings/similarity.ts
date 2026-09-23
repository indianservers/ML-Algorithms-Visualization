import { pca } from "../../../lib/algorithms/dimensionality/pca";

export function l2(vector: number[]) {
  let sum = 0;
  for (const value of vector) sum += value * value;
  return Math.sqrt(sum) || 1e-8;
}

export function normalize(vector: number[]) {
  const n = l2(vector);
  return vector.map((value) => value / n);
}

export function cosine(a: number[], b: number[]) {
  const na = normalize(a);
  const nb = normalize(b);
  let sum = 0;
  for (let i = 0; i < na.length; i += 1) sum += (na[i] ?? 0) * (nb[i] ?? 0);
  return sum;
}

export function euclidean(a: number[], b: number[]) {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

function projectDown(vectors: number[][], dim = 48) {
  const width = vectors[0]?.length ?? 0;
  if (width <= dim) return vectors;
  let seed = 2166136261;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 10000) / 10000;
  };
  const basis = Array.from({ length: dim }, () => Array.from({ length: width }, () => rand() * 2 - 1));
  return vectors.map((vector) =>
    basis.map((row) => {
      let sum = 0;
      for (let i = 0; i < width; i += 1) sum += (vector[i] ?? 0) * (row[i] ?? 0);
      return sum;
    }),
  );
}

export function project2d(vectors: number[][]): Array<{ x: number; y: number }> {
  if (!vectors.length) return [];
  if (vectors.length === 1) return [{ x: 0, y: 0 }];
  const reduced = projectDown(vectors, 48);
  try {
    const result = pca(reduced, 2, "none");
    return result.projections.map((row) => ({ x: row[0] ?? 0, y: row[1] ?? 0 }));
  } catch {
    return vectors.map((_, index) => ({ x: index, y: 0 }));
  }
}

export function topK(
  query: number[],
  items: Array<{ id: string; vector: number[] }>,
  metric: "cosine" | "euclidean",
  k: number,
) {
  const scored = items.map((item) => ({
    id: item.id,
    score: metric === "cosine" ? cosine(query, item.vector) : -euclidean(query, item.vector),
    raw: metric === "cosine" ? cosine(query, item.vector) : euclidean(query, item.vector),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
