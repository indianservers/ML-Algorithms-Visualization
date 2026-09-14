import { neighborhoodQuality } from "../../math/neighborhoodQuality";

export type TSNEMetric = "euclidean" | "manhattan";
export type TSNEInitialization = "pca" | "random";
export interface TSNEResult {
  embedding: number[][];
  snapshots: number[][][];
  klHistory: number[];
  trustworthiness: number;
  continuity: number;
}
const distance = (a: number[], b: number[], metric: TSNEMetric) =>
  metric === "manhattan"
    ? a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0)
    : Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
const rng = (seed: number) => {
  let value = seed >>> 0;
  return () => (value = (1664525 * value + 1013904223) >>> 0) / 4294967296;
};
function conditionalProbabilities(distances: number[][], perplexity: number) {
  const n = distances.length,
    target = Math.log(Math.min(perplexity, n - 1));
  return distances.map((row, i) => {
    let lo = -20,
      hi = 20,
      probabilities = Array(n).fill(0);
    for (let step = 0; step < 35; step += 1) {
      const beta = Math.exp((lo + hi) / 2);
      let total = 0;
      for (let j = 0; j < n; j += 1)
        if (j !== i) {
          probabilities[j] = Math.exp(-row[j] * row[j] * beta);
          total += probabilities[j];
        }
      total ||= 1;
      probabilities = probabilities.map((value) => value / total);
      const entropy = -probabilities.reduce(
        (sum, value) => (value > 0 ? sum + value * Math.log(value) : sum),
        0,
      );
      if (entropy > target) lo = (lo + hi) / 2;
      else hi = (lo + hi) / 2;
    }
    return probabilities;
  });
}
export function tsne(
  X: number[][],
  perplexity = 30,
  learningRate = 200,
  earlyExaggeration = 12,
  iterations = 350,
  metric: TSNEMetric = "euclidean",
  initialization: TSNEInitialization = "pca",
  seed = 42,
): TSNEResult {
  const n = X.length;
  if (n < 3) throw new Error("t-SNE requires at least three samples.");
  const width = X[0]?.length;
  if (!width || !X.every((row) => row.length === width && row.every(Number.isFinite)))
    throw new Error("t-SNE requires a finite rectangular feature matrix.");
  if (!Number.isFinite(perplexity) || perplexity <= 0 || perplexity >= n ||
      !Number.isFinite(learningRate) || learningRate <= 0 ||
      !Number.isFinite(earlyExaggeration) || earlyExaggeration <= 0 ||
      !Number.isInteger(iterations) || iterations < 1)
    throw new Error("Invalid t-SNE hyperparameters.");
  const distances = X.map((row) =>
      X.map((other) => distance(row, other, metric)),
    ),
    conditional = conditionalProbabilities(distances, perplexity),
    P = conditional.map((row, i) =>
      row.map((value, j) =>
        Math.max(1e-12, (value + conditional[j][i]) / (2 * n)),
      ),
    );
  const random = rng(seed),
    means = Array.from(
      { length: X[0].length },
      (_, d) => X.reduce((s, row) => s + row[d], 0) / n,
    );
  let Y = X.map((row) =>
    initialization === "pca"
      ? [
          (row[0] - means[0]) * 0.01,
          ((row[1] ?? row[0]) - (means[1] ?? means[0])) * 0.01,
        ]
      : [(random() - 0.5) * 0.02, (random() - 0.5) * 0.02],
  );
  const velocity = Y.map(() => [0, 0]);
  const snapshots: number[][][] = [Y.map((row) => [...row])],
    klHistory: number[] = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const numerator = Array.from({ length: n }, () => Array(n).fill(0));
    let total = 0;
    for (let i = 0; i < n; i += 1)
      for (let j = i + 1; j < n; j += 1) {
        const dx = Y[i][0] - Y[j][0],
          dy = Y[i][1] - Y[j][1],
          value = 1 / (1 + dx * dx + dy * dy);
        numerator[i][j] = numerator[j][i] = value;
        total += value * 2;
      }
    const gradient = Y.map(() => [0, 0]);
    let kl = 0;
    const exaggeration =
      iteration < Math.min(100, iterations * 0.3) ? earlyExaggeration : 1;
    for (let i = 0; i < n; i += 1)
      for (let j = i + 1; j < n; j += 1) {
        const q = Math.max(1e-12, numerator[i][j] / (total || 1)),
          p = P[i][j] * exaggeration,
          multiplier = 4 * (p - q) * numerator[i][j],
          dx = Y[i][0] - Y[j][0],
          dy = Y[i][1] - Y[j][1];
        gradient[i][0] += multiplier * dx;
        gradient[i][1] += multiplier * dy;
        gradient[j][0] -= multiplier * dx;
        gradient[j][1] -= multiplier * dy;
        kl += P[i][j] * Math.log(P[i][j] / q) * 2;
      }
    const momentum = iteration < 100 ? 0.5 : 0.8;
    for (let i = 0; i < n; i += 1)
      for (let d = 0; d < 2; d += 1) {
        velocity[i][d] =
          momentum * velocity[i][d] - learningRate * gradient[i][d];
        Y[i][d] += velocity[i][d];
      }
    const center = [
      Y.reduce((s, row) => s + row[0], 0) / n,
      Y.reduce((s, row) => s + row[1], 0) / n,
    ];
    Y = Y.map((row) => [row[0] - center[0], row[1] - center[1]]);
    klHistory.push(kl);
    if (
      (iteration + 1) % Math.max(1, Math.floor(iterations / 12)) === 0 ||
      iteration === iterations - 1
    )
      snapshots.push(Y.map((row) => [...row]));
  }
  const { trustworthiness, continuity } = neighborhoodQuality(X, Y, 10);
  return { embedding: Y, snapshots, klHistory, trustworthiness, continuity };
}
