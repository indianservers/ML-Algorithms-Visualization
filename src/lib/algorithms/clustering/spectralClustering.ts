import { kmeans as clusterEmbedding } from "./kmeans";

export type SpectralMetric = "euclidean" | "manhattan";
export type SpectralKernel = "rbf" | "binary";
export interface SpectralResult {
  affinity: number[][];
  degree: number[];
  unnormalizedLaplacian: number[][];
  embedding: number[][];
  labels: number[];
  eigenvalues: number[];
  laplacianForm: string;
  normalizedCut: number;
  modularity: number;
  silhouette: number;
  density: number;
}
const distance = (a: number[], b: number[], metric: SpectralMetric) =>
  metric === "manhattan"
    ? a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0)
    : Math.sqrt(a.reduce((sum, value, i) => sum + (value - b[i]) ** 2, 0));
const random = (seed: number) => {
  let value = seed >>> 0;
  return () => (value = (1664525 * value + 1013904223) >>> 0) / 4294967296;
};
function multiply(matrix: number[][], vector: number[]) {
  return matrix.map((row) =>
    row.reduce((sum, value, i) => sum + value * vector[i], 0),
  );
}
function orthonormalize(vectors: number[][]) {
  const result: number[][] = [];
  for (const source of vectors) {
    const vector = [...source];
    for (const basis of result) {
      const projection = vector.reduce(
        (sum, value, i) => sum + value * basis[i],
        0,
      );
      vector.forEach((_, i) => {
        vector[i] -= projection * basis[i];
      });
    }
    const norm =
      Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    result.push(vector.map((value) => value / norm));
  }
  return result;
}
export function spectralClustering(
  X: number[][],
  clusters = 3,
  sigma = 1.2,
  neighbors = 15,
  metric: SpectralMetric = "euclidean",
  kernel: SpectralKernel = "rbf",
  symmetrize = true,
  seed = 42,
): SpectralResult {
  const n = X.length;
  if (n < clusters || clusters < 2)
    throw new Error("Spectral clustering requires n >= k >= 2.");
  if (n > 260)
    throw new Error(
      "Spectral clustering is capped at 260 samples in the browser lab because of the affinity/eigen decomposition.",
    );
  const width = X[0]?.length;
  if (!Number.isInteger(clusters) || !width ||
      !X.every((row) => row.length === width && row.every(Number.isFinite)) ||
      !Number.isFinite(sigma) || sigma <= 0 ||
      !Number.isInteger(neighbors) || neighbors < 1)
    throw new Error("Spectral clustering requires finite rectangular data and valid hyperparameters.");
  const affinity = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    const nearest = X.map((point, j) => ({
      j,
      d: i === j ? Infinity : distance(X[i], point, metric),
    }))
      .sort((a, b) => a.d - b.d)
      .slice(0, Math.min(neighbors, n - 1));
    nearest.forEach(({ j, d }) => {
      affinity[i][j] =
        kernel === "binary" ? 1 : Math.exp(-(d * d) / (2 * sigma * sigma));
    });
  }
  if (symmetrize)
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const value = Math.max(affinity[i][j], affinity[j][i]);
        affinity[i][j] = value;
        affinity[j][i] = value;
      }
  const degrees = affinity.map((row) =>
    row.reduce((sum, value) => sum + value, 0),
  );
  const unnormalizedLaplacian = degrees.map((degree, i) =>
    affinity[i].map((value, j) => (i === j ? degree : 0) - value),
  );
  const normalized = affinity.map((row, i) =>
    row.map(
      (value, j) => value / Math.sqrt(Math.max(1e-12, degrees[i] * degrees[j])),
    ),
  );
  const rng = random(seed),
    dimensions = Math.min(Math.max(clusters + 2, 10), n),
    initial = Array.from({ length: dimensions }, () =>
      Array.from({ length: n }, () => rng() - 0.5),
    );
  let vectors = orthonormalize(initial);
  for (let iteration = 0; iteration < 30; iteration++)
    vectors = orthonormalize(
      vectors.map((vector) => multiply(normalized, vector)),
    );
  const values = vectors.map((vector) =>
    vector.reduce(
      (sum, value, i) => sum + value * multiply(normalized, vector)[i],
      0,
    ),
  );
  const ranked = values
    .map((value, index) => ({ value, vector: vectors[index] }))
    .sort((a, b) => b.value - a.value);
  const selected = ranked.slice(0, clusters),
    embedding = Array.from({ length: n }, (_, i) =>
      selected.map((item) => item.vector[i]),
    );
  embedding.forEach((row) => {
    const norm =
      Math.sqrt(row.reduce((sum, value) => sum + value * value, 0)) || 1;
    row.forEach((_, i) => {
      row[i] /= norm;
    });
  });
  const { assignments: labels } = clusterEmbedding(
    embedding,
    clusters,
    80,
    "kmeans++",
    seed,
  );
  const volume = degrees.reduce((sum, value) => sum + value, 0) || 1;
  let modularity = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (labels[i] === labels[j])
        modularity += affinity[i][j] - (degrees[i] * degrees[j]) / volume;
    }
  // Ncut = sum_c cut(C_c, V − C_c) / vol(C_c).
  const normalizedCut = Array.from({ length: clusters }, (_, cluster) => {
    let clusterVolume = 0;
    let outgoing = 0;
    for (let i = 0; i < n; i++) {
      if (labels[i] !== cluster) continue;
      clusterVolume += degrees[i];
      for (let j = 0; j < n; j++)
        if (labels[j] !== cluster) outgoing += affinity[i][j];
    }
    return clusterVolume > 0 ? outgoing / clusterVolume : 0;
  }).reduce((sum, value) => sum + value, 0);
  const silhouettes = X.map((point, i) => {
    const own = labels[i],
      same = X.filter((_, j) => j !== i && labels[j] === own),
      a = same.length
        ? same.reduce((sum, other) => sum + distance(point, other, metric), 0) /
          same.length
        : 0,
      otherMeans = Array.from({ length: clusters }, (_, c) =>
        c === own
          ? Infinity
          : (() => {
              const group = X.filter((_, j) => labels[j] === c);
              return group.length
                ? group.reduce(
                    (sum, other) => sum + distance(point, other, metric),
                    0,
                  ) / group.length
                : Infinity;
            })(),
      ),
      b = Math.min(...otherMeans);
    return Number.isFinite(b) && Math.max(a, b) ? (b - a) / Math.max(a, b) : 0;
  });
  return {
    affinity,
    degree: degrees,
    unnormalizedLaplacian,
    embedding,
    labels,
    eigenvalues: ranked
      .map((item) => Math.max(0, 1 - item.value))
      .sort((a, b) => a - b),
    laplacianForm:
      "Embedding uses the symmetric normalized affinity D^{-1/2} A D^{-1/2}. Unnormalized L = D − A is also stored. Eigenvalues shown are 1 − λ of the normalized affinity (≈ Laplacian eigenvalues).",
    normalizedCut,
    modularity: modularity / volume,
    silhouette: silhouettes.reduce((sum, value) => sum + value, 0) / n,
    density:
      affinity.flat().filter((value) => value > 0).length /
      Math.max(1, n * (n - 1)),
  };
}
