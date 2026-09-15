import { neighborhoodQuality } from "../../math/neighborhoodQuality";
import { pca } from "./pca";

export type UMAPMetric = "euclidean" | "manhattan" | "cosine";
export interface UMAPEdge {
  from: number;
  to: number;
  weight: number;
}
export interface UMAPNeighbor {
  rank: number;
  id: number;
  distance: number;
}
export interface UMAPResult {
  embedding: number[][];
  edges: UMAPEdge[];
  neighbors: UMAPNeighbor[][];
  trustworthiness: number;
  continuity: number;
  distanceCorrelation: number;
  incomplete: boolean;
}
const distance = (a: number[], b: number[], metric: UMAPMetric) => {
  if (metric === "manhattan")
    return a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0);
  if (metric === "cosine") {
    const dot = a.reduce((s, v, i) => s + v * b[i], 0),
      na = Math.sqrt(a.reduce((s, v) => s + v * v, 0)),
      nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    return 1 - dot / Math.max(1e-12, na * nb);
  }
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
};
const randomGenerator = (seed: number) => {
  let value = seed >>> 0;
  return () => (value = (1664525 * value + 1013904223) >>> 0) / 4294967296;
};
export function umap(
  X: number[][],
  neighbors = 15,
  minDist = 0.1,
  metric: UMAPMetric = "euclidean",
  seed = 42,
  spread = 1,
  iterations = 220,
  shouldStop?: () => boolean,
): UMAPResult {
  const n = X.length;
  if (n < 3) throw new Error("UMAP requires at least three samples.");
  const width = X[0]?.length;
  if (!width || !X.every((row) => row.length === width && row.every(Number.isFinite)))
    throw new Error("UMAP requires a finite rectangular feature matrix.");
  if (!Number.isInteger(neighbors) || neighbors < 2 || neighbors >= n)
    throw new Error(`UMAP n_neighbors must be in [2, N-1]. N=${n}.`);
  if (!Number.isFinite(minDist) || minDist < 0 ||
      !Number.isFinite(spread) || spread <= 0 ||
      !Number.isInteger(iterations) || iterations < 1)
    throw new Error("Invalid UMAP hyperparameters.");
  if (n > 800)
    throw new Error("This browser UMAP-like optimizer is limited to 800 samples.");
  const k = Math.min(Math.max(2, neighbors), n - 1),
    lists = X.map((row, i) =>
      X.map((other, j) => ({
        j,
        d: i === j ? Infinity : distance(row, other, metric),
      }))
        .sort((a, b) => a.d - b.d)
        .slice(0, k),
    );
  const directed = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const rho = lists[i][0].d;
    let lo = 1e-4,
      hi = 100;
    for (let step = 0; step < 30; step++) {
      const sigma = (lo + hi) / 2,
        sum = lists[i].reduce(
          (s, v) => s + Math.exp(-Math.max(0, v.d - rho) / sigma),
          0,
        );
      if (sum > Math.log2(k)) hi = sigma;
      else lo = sigma;
    }
    const sigma = (lo + hi) / 2;
    for (const item of lists[i])
      directed.set(
        `${i}:${item.j}`,
        Math.exp(-Math.max(0, item.d - rho) / sigma),
      );
  }
  const edges: UMAPEdge[] = [];
  for (let i = 0; i < n; i++)
    for (const item of lists[i])
      if (i < item.j) {
        const a = directed.get(`${i}:${item.j}`) || 0,
          b = directed.get(`${item.j}:${i}`) || 0,
          weight = a + b - a * b;
        if (weight > 0) edges.push({ from: i, to: item.j, weight });
      }
  const random = randomGenerator(seed);
  const pcaInit = pca(X, 2, "none").projections;
  const embedding = pcaInit.map((row) => [
    row[0] * 0.01 + (random() - 0.5) * 0.01,
    (row[1] ?? 0) * 0.01 + (random() - 0.5) * 0.01,
  ]);
  let incomplete = false;
  for (let iteration = 0; iteration < iterations; iteration++) {
    if (shouldStop?.()) {
      incomplete = true;
      break;
    }
    const rate = 0.8 * (1 - iteration / iterations) + 0.02;
    for (const edge of edges) {
      if (random() > edge.weight) continue;
      const a = embedding[edge.from],
        b = embedding[edge.to],
        dx = a[0] - b[0],
        dy = a[1] - b[1],
        dist2 = dx * dx + dy * dy + 1e-3,
        target = minDist * minDist,
        force = dist2 > target ? (-rate * edge.weight) / (1 + dist2) : 0;
      a[0] += force * dx;
      a[1] += force * dy;
      b[0] -= force * dx;
      b[1] -= force * dy;
      const negative = Math.floor(random() * n);
      if (negative !== edge.from) {
        const c = embedding[negative],
          rx = a[0] - c[0],
          ry = a[1] - c[1],
          r2 = rx * rx + ry * ry + 1e-3,
          repel = (rate * 0.15) / (r2 * (1 + r2));
        a[0] += repel * rx;
        a[1] += repel * ry;
        c[0] -= repel * rx;
        c[1] -= repel * ry;
      }
    }
  }
  const mean = [0, 1].map(
    (d) => embedding.reduce((s, row) => s + row[d], 0) / n,
  );
  embedding.forEach((row) => {
    row[0] = (row[0] - mean[0]) * spread;
    row[1] = (row[1] - mean[1]) * spread;
  });
  const { trustworthiness, continuity } = neighborhoodQuality(X, embedding, 10);
  const pairs = [] as Array<[number, number]>;
  for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 30)))
    for (let j = i + 1; j < n; j += Math.max(1, Math.floor(n / 30)))
      pairs.push([
        distance(X[i], X[j], metric),
        distance(embedding[i], embedding[j], "euclidean"),
      ]);
  const mx = pairs.reduce((s, p) => s + p[0], 0) / pairs.length,
    my = pairs.reduce((s, p) => s + p[1], 0) / pairs.length,
    cov = pairs.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0),
    sx = Math.sqrt(pairs.reduce((s, p) => s + (p[0] - mx) ** 2, 0)),
    sy = Math.sqrt(pairs.reduce((s, p) => s + (p[1] - my) ** 2, 0)),
    distanceCorrelation = cov / Math.max(1e-12, sx * sy);
  const neighborGraph = lists.map((row) =>
    row.map((item, rank) => ({ rank: rank + 1, id: item.j, distance: item.d })),
  );
  return {
    embedding,
    edges,
    neighbors: neighborGraph,
    trustworthiness,
    continuity,
    distanceCorrelation,
    incomplete,
  };
}
