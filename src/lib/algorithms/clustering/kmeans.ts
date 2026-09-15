import { euclideanDistance } from "../../math/statistics";

export interface KMeansStep {
  iteration: number;
  centroids: number[][];
  assignments: number[];
  inertia: number;
  maxMovement: number;
  assignmentsChanged: number;
}

export interface KMeansResult {
  centroids: number[][];
  assignments: number[];
  inertia: number;
  steps: KMeansStep[];
  converged: boolean;
  nInit: number;
  emptyClusterResets: number;
}

function randomCentroids(
  X: number[][],
  k: number,
  random: () => number,
): number[][] {
  if (k < 1 || k > X.length)
    throw new Error(
      `k must be between 1 and the number of samples (${X.length})`,
    );
  const indices = new Set<number>();
  while (indices.size < k) indices.add(Math.floor(random() * X.length));
  return [...indices].map((i) => [...X[i]]);
}

function kMeansPlusPlusCentroids(
  X: number[][],
  k: number,
  random: () => number,
): number[][] {
  if (k < 1 || k > X.length)
    throw new Error(
      `k must be between 1 and the number of samples (${X.length})`,
    );
  const centroids: number[][] = [X[Math.floor(random() * X.length)]];
  while (centroids.length < k) {
    const distances = X.map((x) =>
      Math.min(...centroids.map((c) => euclideanDistance(x, c) ** 2)),
    );
    const total = distances.reduce((a, b) => a + b, 0);
    if (total <= 1e-12) {
      centroids.push([...X[centroids.length % X.length]]);
      continue;
    }
    let r = random() * total;
    for (let i = 0; i < X.length; i++) {
      r -= distances[i];
      if (r <= 0) {
        centroids.push([...X[i]]);
        break;
      }
    }
  }
  return centroids;
}

function assignClusters(X: number[][], centroids: number[][]): number[] {
  return X.map((x) => {
    let minDist = Infinity,
      minIdx = 0;
    centroids.forEach((c, i) => {
      const d = euclideanDistance(x, c);
      if (d < minDist) {
        minDist = d;
        minIdx = i;
      }
    });
    return minIdx;
  });
}

function updateCentroids(
  X: number[][],
  assignments: number[],
  k: number,
): { centroids: number[][]; emptyClusterResets: number } {
  const dims = X[0].length;
  const sums = Array.from({ length: k }, () => Array(dims).fill(0));
  const counts = Array(k).fill(0);
  assignments.forEach((c, i) => {
    counts[c]++;
    X[i].forEach((v, d) => {
      sums[c][d] += v;
    });
  });
  let emptyClusterResets = 0;
  const occupied = sums.map((s, c) =>
    counts[c] > 0 ? s.map((v) => v / counts[c]) : null,
  );
  const filled = occupied.map((centroid, c) => {
    if (centroid) return centroid;
    emptyClusterResets += 1;
    const references = occupied.filter((value): value is number[] => value !== null);
    let farthest = X[0];
    let best = -1;
    X.forEach((row) => {
      const d = references.length
        ? Math.min(...references.map((ref) => euclideanDistance(row, ref)))
        : 0;
      if (d > best) {
        best = d;
        farthest = row;
      }
    });
    return [...farthest];
  });
  return { centroids: filled, emptyClusterResets };
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function calcInertia(
  X: number[][],
  assignments: number[],
  centroids: number[][],
): number {
  return X.reduce(
    (s, x, i) => s + euclideanDistance(x, centroids[assignments[i]]) ** 2,
    0,
  );
}

export function kmeans(
  X: number[][],
  k: number,
  maxIter = 100,
  init: "random" | "kmeans++" = "kmeans++",
  seed = 42,
  tolerance = 1e-4,
): KMeansResult {
  if (!X.length || !X[0]?.length)
    throw new Error("K-means requires a non-empty feature matrix");
  const width = X[0].length;
  if (!X.every((row) => row.length === width && row.every(Number.isFinite)))
    throw new Error("K-means requires a finite rectangular feature matrix");
  if (!Number.isInteger(k) || k < 1 || k > X.length ||
      !Number.isInteger(maxIter) || maxIter < 1 || !Number.isFinite(seed) ||
      !Number.isFinite(tolerance) || tolerance < 0)
    throw new Error("Invalid K-means hyperparameters");
  const random = seeded(seed);
  let centroids =
    init === "kmeans++"
      ? kMeansPlusPlusCentroids(X, k, random)
      : randomCentroids(X, k, random);
  const steps: KMeansStep[] = [];
  let assignments = assignClusters(X, centroids);
  let converged = false;
  let emptyClusterResets = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    const inertia = calcInertia(X, assignments, centroids);
    steps.push({
      iteration: iter,
      centroids: centroids.map((c) => [...c]),
      assignments: [...assignments],
      inertia,
      maxMovement: 0,
      assignmentsChanged: 0,
    });
    const updated = updateCentroids(X, assignments, k);
    emptyClusterResets += updated.emptyClusterResets;
    const newCentroids = updated.centroids;
    const newAssignments = assignClusters(X, newCentroids);
    const assignmentsChanged = newAssignments.reduce(
      (sum, a, i) => sum + (a !== assignments[i] ? 1 : 0),
      0,
    );
    const maxMovement = Math.max(
      0,
      ...centroids.map((centroid, i) =>
        euclideanDistance(centroid, newCentroids[i]),
      ),
    );
    steps[steps.length - 1].maxMovement = maxMovement;
    steps[steps.length - 1].assignmentsChanged = assignmentsChanged;
    centroids = newCentroids;
    assignments = newAssignments;
    if (!assignmentsChanged || maxMovement <= tolerance) {
      converged = true;
      break;
    }
  }

  const inertia = calcInertia(X, assignments, centroids);
  if (
    !steps.length ||
    Math.abs(steps[steps.length - 1].inertia - inertia) > 1e-12
  ) {
    steps.push({
      iteration: steps.length,
      centroids: centroids.map((centroid) => [...centroid]),
      assignments: [...assignments],
      inertia,
      maxMovement: 0,
      assignmentsChanged: 0,
    });
  }
  return {
    centroids,
    assignments,
    inertia,
    steps,
    converged,
    nInit: 1,
    emptyClusterResets,
  };
}

export function kmeansWithRestarts(
  X: number[][],
  k: number,
  nInit = 5,
  maxIter = 100,
  init: "random" | "kmeans++" = "kmeans++",
  seed = 42,
  tolerance = 1e-4,
) {
  const starts = Math.max(1, Math.round(nInit));
  let best = kmeans(X, k, maxIter, init, seed, tolerance);
  for (let i = 1; i < starts; i++) {
    const trial = kmeans(X, k, maxIter, init, seed + i * 9973, tolerance);
    if (trial.inertia < best.inertia) best = trial;
  }
  return { ...best, nInit: starts };
}

export function elbowMethod(X: number[][], maxK = 10): number[] {
  const upper = Math.min(maxK, X.length);
  if (!Number.isInteger(maxK) || upper < 1)
    throw new Error("Elbow method requires samples and maxK >= 1");
  return Array.from({ length: upper }, (_, i) => {
    const { inertia } = kmeans(X, i + 1, 50);
    return inertia;
  });
}
