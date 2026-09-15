import {
  cosineDistance,
  euclideanDistance,
  manhattanDistance,
} from "../math/statistics";

export type ClusterDistance = "euclidean" | "manhattan" | "minkowski" | "cosine";

export function minkowskiDistance(a: number[], b: number[], p = 3) {
  if (a.length !== b.length) throw new Error("Distance requires equal-length vectors");
  return Math.pow(
    a.reduce((sum, value, i) => sum + Math.abs(value - b[i]) ** p, 0),
    1 / p,
  );
}

export function clusterDistance(
  a: number[],
  b: number[],
  metric: ClusterDistance = "euclidean",
  p = 3,
) {
  if (metric === "manhattan") return manhattanDistance(a, b);
  if (metric === "cosine") return cosineDistance(a, b);
  if (metric === "minkowski") return minkowskiDistance(a, b, p);
  return euclideanDistance(a, b);
}

export function silhouetteScore(
  X: number[][],
  labels: number[],
  metric: ClusterDistance = "euclidean",
): number | null {
  const clusters = [...new Set(labels.filter((label) => label >= 0))];
  if (clusters.length < 2) return null;
  const scores: number[] = [];
  X.forEach((point, i) => {
    const own = labels[i];
    if (own < 0) return;
    const same = X.filter((_, j) => j !== i && labels[j] === own);
    const a = same.length
      ? same.reduce((sum, other) => sum + clusterDistance(point, other, metric), 0) /
        same.length
      : 0;
    const others = clusters
      .filter((cluster) => cluster !== own)
      .map((cluster) => {
        const group = X.filter((_, j) => labels[j] === cluster);
        return group.length
          ? group.reduce((sum, other) => sum + clusterDistance(point, other, metric), 0) /
            group.length
          : Infinity;
      });
    const b = Math.min(...others);
    scores.push(Number.isFinite(b) && Math.max(a, b) > 0 ? (b - a) / Math.max(a, b) : 0);
  });
  if (!scores.length) return null;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export function clusterSizes(labels: number[]) {
  const sizes: Record<string, number> = {};
  let noise = 0;
  labels.forEach((label) => {
    if (label < 0) {
      noise += 1;
      return;
    }
    const key = String(label);
    sizes[key] = (sizes[key] ?? 0) + 1;
  });
  return { sizes, noise, clusters: Object.keys(sizes).length };
}

export function samePartition(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const map = new Map<number, number>();
  for (let i = 0; i < a.length; i++) {
    const seen = map.get(a[i]);
    if (seen === undefined) map.set(a[i], b[i]);
    else if (seen !== b[i]) return false;
  }
  return new Set(map.values()).size === map.size;
}

export function fitClusterScaler(trainX: number[][]) {
  if (!trainX.length || !trainX[0]?.length) {
    throw new Error("Scaler requires a non-empty matrix.");
  }
  const width = trainX[0].length;
  const mean = Array.from(
    { length: width },
    (_, j) => trainX.reduce((sum, row) => sum + row[j], 0) / trainX.length,
  );
  const std = mean.map(
    (m, j) =>
      Math.sqrt(
        trainX.reduce((sum, row) => sum + (row[j] - m) ** 2, 0) / trainX.length,
      ) || 1,
  );
  const transform = (row: number[]) =>
    row.map((value, j) => (value - mean[j]) / std[j]);
  return { mean, std, transform, transformAll: (rows: number[][]) => rows.map(transform) };
}

export function kDistanceCurve(X: number[][], minPts: number) {
  const kth = Math.max(1, minPts - 1);
  return X.map((point, i) => {
    const distances = X.map((other, j) =>
      i === j ? Infinity : euclideanDistance(point, other),
    ).sort((a, b) => a - b);
    return distances[kth - 1] ?? Infinity;
  }).sort((a, b) => a - b);
}

export function assertClusterInputSize(n: number, max: number, algorithm: string) {
  if (n > max) {
    throw new Error(
      `${algorithm} is capped at ${max} samples in the browser lab (got ${n}). Downsample rather than silently approximating.`,
    );
  }
}

export const CLUSTER_METRIC_TOOLTIPS = {
  silhouette:
    "Compares cohesion within a cluster with separation from other clusters. Higher is generally better. Noise (label < 0) is excluded.",
  inertia:
    "Sum of squared distances from samples to assigned K-Means centroids. Lower is tighter for the same dataset and K.",
  daviesBouldin:
    "Average similarity between each cluster and its most similar other cluster. Lower is better.",
  calinskiHarabasz:
    "Ratio of between-cluster to within-cluster dispersion. Higher is generally better.",
  bic: "Likelihood-based model criterion with a stronger complexity penalty than AIC. Lower is preferred among comparable GMMs.",
  aic: "Likelihood minus a complexity penalty. Lower is preferred among comparable GMMs.",
};

export function formatCl(value: number | null | undefined, digits = 3) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  return value.toFixed(digits);
}

export function daviesBouldinIndex(X: number[][], labels: number[]): number | null {
  const clusters = [...new Set(labels.filter((label) => label >= 0))];
  if (clusters.length < 2) return null;
  const centroids = clusters.map((cluster) => {
    const members = X.filter((_, i) => labels[i] === cluster);
    return members[0].map(
      (_, d) => members.reduce((sum, row) => sum + row[d], 0) / members.length,
    );
  });
  const scatters = clusters.map((cluster, index) => {
    const members = X.filter((_, i) => labels[i] === cluster);
    return (
      members.reduce((sum, row) => sum + euclideanDistance(row, centroids[index]), 0) /
      members.length
    );
  });
  const scores = clusters.map((_, i) => {
    let worst = 0;
    clusters.forEach((__, j) => {
      if (i === j) return;
      const sep = euclideanDistance(centroids[i], centroids[j]) || 1e-12;
      worst = Math.max(worst, (scatters[i] + scatters[j]) / sep);
    });
    return worst;
  });
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export function calinskiHarabaszIndex(X: number[][], labels: number[]): number | null {
  const clusters = [...new Set(labels.filter((label) => label >= 0))];
  if (clusters.length < 2 || X.length <= clusters.length) return null;
  const overall = X[0].map((_, d) => X.reduce((sum, row) => sum + row[d], 0) / X.length);
  let between = 0;
  let within = 0;
  clusters.forEach((cluster) => {
    const members = X.filter((_, i) => labels[i] === cluster);
    const centroid = members[0].map(
      (_, d) => members.reduce((sum, row) => sum + row[d], 0) / members.length,
    );
    between += members.length * euclideanDistance(centroid, overall) ** 2;
    within += members.reduce((sum, row) => sum + euclideanDistance(row, centroid) ** 2, 0);
  });
  if (within <= 0) return null;
  return (between / (clusters.length - 1)) / (within / (X.length - clusters.length));
}

export function gmmInformationCriteria(
  logLikelihood: number,
  n: number,
  components: number,
  featureCount = 2,
) {
  const covarianceParams = (featureCount * (featureCount + 1)) / 2;
  const parameters =
    components * (featureCount + covarianceParams + 1) - 1;
  return {
    aic: 2 * parameters - 2 * logLikelihood,
    bic: parameters * Math.log(Math.max(2, n)) - 2 * logLikelihood,
    parameters,
  };
}

export function scatterPercents(
  x: number,
  y: number,
  points: Array<{ x: number; y: number }>,
  pad = 0.12,
) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1e-6, maxX - minX);
  const spanY = Math.max(1e-6, maxY - minY);
  const left = minX - spanX * pad;
  const right = maxX + spanX * pad;
  const bottom = minY - spanY * pad;
  const top = maxY + spanY * pad;
  return {
    left: ((x - left) / (right - left)) * 100,
    top: ((top - y) / (top - bottom)) * 100,
  };
}

export function projectPca2d(X: number[][]): number[][] {
  if (!X.length || X[0].length < 2) return X.map((row) => [row[0] ?? 0, row[1] ?? 0]);
  const mean = X[0].map((_, d) => X.reduce((sum, row) => sum + row[d], 0) / X.length);
  const centered = X.map((row) => row.map((value, d) => value - mean[d]));
  const width = X[0].length;
  const cov = Array.from({ length: width }, (_, i) =>
    Array.from(
      { length: width },
      (_, j) =>
        centered.reduce((sum, row) => sum + row[i] * row[j], 0) / X.length,
    ),
  );
  const power = (vector: number[]) => {
    const next = cov.map((row) => row.reduce((sum, value, i) => sum + value * vector[i], 0));
    const norm = Math.sqrt(next.reduce((sum, value) => sum + value * value, 0)) || 1;
    return next.map((value) => value / norm);
  };
  let first = Array.from({ length: width }, (_, i) => (i === 0 ? 1 : 0.01 * i));
  for (let i = 0; i < 40; i++) first = power(first);
  let second = Array.from({ length: width }, (_, i) => (i === 1 ? 1 : 0.02));
  for (let i = 0; i < 40; i++) {
    const projected = second.reduce((sum, value, d) => sum + value * first[d], 0);
    second = power(second.map((value, d) => value - projected * first[d]));
  }
  return centered.map((row) => [
    row.reduce((sum, value, d) => sum + value * first[d], 0),
    row.reduce((sum, value, d) => sum + value * second[d], 0),
  ]);
}
