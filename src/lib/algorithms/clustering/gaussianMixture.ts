export type Covariance2D = [[number, number], [number, number]];
export interface GaussianMixtureState {
  iteration: number;
  weights: number[];
  means: number[][];
  covariances: Covariance2D[];
  responsibilities: number[][];
  logLikelihood: number;
}
export interface GaussianMixtureResult extends GaussianMixtureState {
  assignments: number[];
  history: GaussianMixtureState[];
  converged: boolean;
}
const sqDist = (a: number[], b: number[]) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
function pdf(point: number[], mean: number[], covariance: Covariance2D) {
  const [a, b] = covariance[0],
    d = covariance[1][1],
    det = Math.max(1e-9, a * d - b * b);
  const dx = point[0] - mean[0],
    dy = point[1] - mean[1];
  const exponent = (-0.5 * (d * dx * dx - 2 * b * dx * dy + a * dy * dy)) / det;
  return Math.exp(Math.max(-700, exponent)) / (2 * Math.PI * Math.sqrt(det));
}
function expectation(
  X: number[][],
  weights: number[],
  means: number[][],
  covariances: Covariance2D[],
) {
  return X.map((point) => {
    const raw = means.map(
      (mean, k) => weights[k] * pdf(point, mean, covariances[k]),
    );
    const total = raw.reduce((sum, value) => sum + value, 0);
    return total > 0 && Number.isFinite(total)
      ? raw.map((value) => value / total)
      : raw.map(() => 1 / raw.length);
  });
}
const cloneState = (state: GaussianMixtureState): GaussianMixtureState => ({
  ...state,
  weights: [...state.weights],
  means: state.means.map((mean) => [...mean]),
  covariances: state.covariances.map(
    (c) => [[...c[0]], [...c[1]]] as Covariance2D,
  ),
  responsibilities: state.responsibilities.map((row) => [...row]),
});
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function fitGaussianMixture(
  X: number[][],
  components = 4,
  maxIterations = 24,
  tolerance = 1e-4,
  regularization = 1e-3,
  seed = 42,
): GaussianMixtureResult {
  if (!Number.isInteger(components) || components < 1 || X.length < components ||
      X.some((row) => row.length !== 2 || !row.every(Number.isFinite)))
    throw new Error("GMM requires at least K two-dimensional samples.");
  if (!Number.isInteger(maxIterations) || maxIterations < 1 ||
      !Number.isFinite(tolerance) || tolerance < 0 ||
      !Number.isFinite(regularization) || regularization <= 0 ||
      !Number.isFinite(seed))
    throw new Error("GMM requires valid positive iteration and regularization settings.");
  const random = seeded(seed);
  const means = [[...X[Math.floor(random() * X.length)]]];
  while (means.length < components) {
    const next = X.reduce(
      (best, point) => {
        const score = Math.min(...means.map((mean) => sqDist(point, mean)));
        return score > best.score ? { point, score } : best;
      },
      { point: X[0], score: -1 },
    );
    means.push([...next.point]);
  }
  let state: GaussianMixtureState = {
    iteration: 0,
    weights: Array(components).fill(1 / components),
    means,
    covariances: Array.from(
      { length: components },
      () =>
        [
          [1, 0],
          [0, 1],
        ] as Covariance2D,
    ),
    responsibilities: X.map(() => Array(components).fill(1 / components)),
    logLikelihood: -Infinity,
  };
  const history: GaussianMixtureState[] = [];
  let converged = false;
  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const responsibilities = expectation(
      X,
      state.weights,
      state.means,
      state.covariances,
    );
    const counts = Array.from(
      { length: components },
      (_, k) => responsibilities.reduce((sum, row) => sum + row[k], 0) || 1e-12,
    );
    const nextMeans = counts.map((count, k) =>
      [0, 1].map(
        (dimension) =>
          responsibilities.reduce(
            (sum, row, index) => sum + row[k] * X[index][dimension],
            0,
          ) / count,
      ),
    );
    const covariances = counts.map((count, k) => {
      let xx = 0,
        xy = 0,
        yy = 0;
      X.forEach((point, index) => {
        const dx = point[0] - nextMeans[k][0],
          dy = point[1] - nextMeans[k][1],
          weight = responsibilities[index][k];
        xx += weight * dx * dx;
        xy += weight * dx * dy;
        yy += weight * dy * dy;
      });
      return [
        [xx / count + regularization, xy / count],
        [xy / count, yy / count + regularization],
      ] as Covariance2D;
    });
    const weights = counts.map((count) => count / X.length);
    const logLikelihood = X.reduce(
      (sum, point) =>
        sum +
        Math.log(
          nextMeans.reduce(
            (density, mean, k) =>
              density + weights[k] * pdf(point, mean, covariances[k]),
            0,
          ) + 1e-300,
        ),
      0,
    );
    const previous = state.logLikelihood;
    const finalResponsibilities = expectation(
      X,
      weights,
      nextMeans,
      covariances,
    );
    state = {
      iteration,
      weights,
      means: nextMeans,
      covariances,
      responsibilities: finalResponsibilities,
      logLikelihood,
    };
    history.push(cloneState(state));
    if (
      Number.isFinite(previous) &&
      Math.abs(logLikelihood - previous) <= tolerance * X.length * 2
    ) {
      converged = true;
      break;
    }
  }
  const assignments = state.responsibilities.map((row) =>
    row.reduce((best, value, index) => (value > row[best] ? index : best), 0),
  );
  return { ...state, assignments, history, converged };
}
