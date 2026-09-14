export type KMedoidsMetric = "euclidean" | "manhattan" | "chebyshev";
export interface KMedoidsOptions {
  k: number;
  maxIterations: number;
  metric: KMedoidsMetric;
  init: "random" | "kmedoids++";
  seed?: number;
}
export interface KMedoidsStep {
  iteration: number;
  medoidIndices: number[];
  assignments: number[];
  cost: number;
  swap?: {
    medoidIndex: number;
    candidateIndex: number;
    improvement: number;
    newCost: number;
  };
}
export interface KMedoidsResult {
  medoidIndices: number[];
  medoids: number[][];
  assignments: number[];
  cost: number;
  steps: KMedoidsStep[];
  converged: boolean;
}
export function kMedoidsDistance(
  a: number[],
  b: number[],
  metric: KMedoidsMetric,
) {
  const deltas = a.map((value, index) => Math.abs(value - b[index]));
  if (metric === "manhattan")
    return deltas.reduce((sum, value) => sum + value, 0);
  if (metric === "chebyshev") return Math.max(...deltas);
  return Math.sqrt(deltas.reduce((sum, value) => sum + value ** 2, 0));
}
const randomFor = (seed: number) => {
  let state = seed >>> 0;
  return () =>
    (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
};
function assign(matrix: number[][], medoids: number[]) {
  const assignments = matrix.map((row) =>
    medoids.reduce(
      (best, index, cluster) =>
        row[index] < row[medoids[best]] ? cluster : best,
      0,
    ),
  );
  const cost = matrix.reduce(
    (sum, row, index) => sum + row[medoids[assignments[index]]],
    0,
  );
  return { assignments, cost };
}
function initialize(X: number[][], options: KMedoidsOptions) {
  const random = randomFor(options.seed ?? 42);
  if (options.init === "random") {
    const pool = Array.from({ length: X.length }, (_, i) => i);
    for (let i = pool.length - 1; i; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, options.k);
  }
  const medoids = [Math.floor(random() * X.length)];
  while (medoids.length < options.k) {
    const distances = X.map(
      (row) =>
        Math.min(
          ...medoids.map((index) =>
            kMedoidsDistance(row, X[index], options.metric),
          ),
        ) ** 2,
    );
    let threshold = random() * distances.reduce((sum, value) => sum + value, 0),
      chosen = X.length - 1;
    for (let index = 0; index < X.length; index++)
      if ((threshold -= distances[index]) <= 0) {
        chosen = index;
        break;
      }
    if (!medoids.includes(chosen)) medoids.push(chosen);
  }
  return medoids;
}
export function trainKMedoids(
  X: number[][],
  options: KMedoidsOptions,
): KMedoidsResult {
  if (!X.length || options.k < 1 || options.k > X.length)
    throw new Error("K-Medoids requires non-empty data and a valid K.");
  const matrix = X.map((row) =>
    X.map((other) => kMedoidsDistance(row, other, options.metric)),
  );
  let medoidIndices = initialize(X, options),
    state = assign(matrix, medoidIndices);
  const steps: KMedoidsStep[] = [
    { iteration: 0, medoidIndices: [...medoidIndices], ...state },
  ];
  let converged = false;
  for (let iteration = 1; iteration <= options.maxIterations; iteration++) {
    let best: KMedoidsStep["swap"];
    const medoidSet = new Set(medoidIndices);
    for (let position = 0; position < medoidIndices.length; position++)
      for (let candidate = 0; candidate < X.length; candidate++) {
        if (medoidSet.has(candidate)) continue;
        const trial = [...medoidIndices];
        trial[position] = candidate;
        const next = assign(matrix, trial);
        const improvement = state.cost - next.cost;
        if (improvement > 1e-9 && (!best || improvement > best.improvement))
          best = {
            medoidIndex: medoidIndices[position],
            candidateIndex: candidate,
            improvement,
            newCost: next.cost,
          };
      }
    if (!best) {
      converged = true;
      break;
    }
    medoidIndices = medoidIndices.map((index) =>
      index === best!.medoidIndex ? best!.candidateIndex : index,
    );
    state = assign(matrix, medoidIndices);
    steps.push({
      iteration,
      medoidIndices: [...medoidIndices],
      ...state,
      swap: best,
    });
  }
  return {
    medoidIndices,
    medoids: medoidIndices.map((index) => [...X[index]]),
    ...state,
    steps,
    converged,
  };
}
