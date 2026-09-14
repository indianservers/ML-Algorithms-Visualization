export type SvmKernel = "linear" | "rbf" | "polynomial" | "sigmoid";

export interface SvmClassificationOptions {
  C: number;
  kernel: SvmKernel;
  gamma: number;
  degree?: number;
  coef0?: number;
  standardize?: boolean;
  tolerance?: number;
  maxPasses?: number;
  maxIterations?: number;
}

export interface SvmClassificationModel {
  alphas: number[];
  bias: number;
  supportIndices: number[];
  weights: number[] | null;
  marginWidth: number;
  score: (sample: number[]) => number;
  predict: (sample: number[]) => number;
}

function seeded(seed = 817) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function trainSvmClassification(
  X: number[][],
  labels: number[],
  options: SvmClassificationOptions,
): SvmClassificationModel {
  if (!X.length || X.length !== labels.length || !X[0]?.length)
    throw new Error(
      "SVM classification requires matching non-empty X and y arrays.",
    );
  const width = X[0].length;
  if (
    X.some(
      (row) =>
        row.length !== width || row.some((value) => !Number.isFinite(value)),
    )
  )
    throw new Error(
      "SVM classification requires a finite rectangular feature matrix.",
    );
  const classes = [...new Set(labels)].sort((a, b) => a - b);
  if (classes.length !== 2)
    throw new Error("SVM classification requires exactly two classes.");
  if (!labels.every(Number.isFinite) || !Number.isFinite(options.C) || options.C <= 0 ||
      !Number.isFinite(options.gamma) || options.gamma <= 0)
    throw new Error("SVM classification requires finite labels, C > 0, and gamma > 0.");
  const mean = Array.from(
    { length: width },
    (_, feature) => X.reduce((sum, row) => sum + row[feature], 0) / X.length,
  );
  const scale = mean.map(
    (value, feature) =>
      Math.sqrt(
        X.reduce((sum, row) => sum + (row[feature] - value) ** 2, 0) / X.length,
      ) || 1,
  );
  const normalize = (row: number[]) =>
    row.map((value, feature) =>
      options.standardize === false
        ? value
        : (value - mean[feature]) / scale[feature],
    );
  const samples = X.map(normalize);
  const y = labels.map((value) => (value === classes[1] ? 1 : -1));
  const gamma = Math.max(1e-6, options.gamma);
  const kernel = (a: number[], b: number[]) => {
    const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
    if (options.kernel === "linear") return dot;
    if (options.kernel === "polynomial")
      return (gamma * dot + (options.coef0 ?? 1)) ** (options.degree ?? 3);
    if (options.kernel === "sigmoid")
      return Math.tanh(gamma * dot + (options.coef0 ?? 0));
    return Math.exp(
      -gamma *
        a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0),
    );
  };
  const matrix = samples.map((a) => samples.map((b) => kernel(a, b)));
  const alphas = Array(X.length).fill(0);
  const C = Math.max(1e-4, options.C);
  const tolerance = options.tolerance ?? 1e-3;
  const random = seeded();
  let bias = 0;
  let passes = 0;
  let iterations = 0;
  const raw = (index: number) =>
    alphas.reduce(
      (sum, alpha, other) => sum + alpha * y[other] * matrix[other][index],
      bias,
    );
  while (
    passes < (options.maxPasses ?? 8) &&
    iterations < (options.maxIterations ?? 2500)
  ) {
    let changed = 0;
    for (let i = 0; i < samples.length; i += 1) {
      const errorI = raw(i) - y[i];
      if (!(
        (y[i] * errorI < -tolerance && alphas[i] < C) ||
        (y[i] * errorI > tolerance && alphas[i] > 0)
      ))
        continue;
      let j = i;
      while (j === i) j = Math.floor(random() * samples.length);
      const errorJ = raw(j) - y[j];
      const oldI = alphas[i];
      const oldJ = alphas[j];
      const low =
        y[i] === y[j] ? Math.max(0, oldI + oldJ - C) : Math.max(0, oldJ - oldI);
      const high =
        y[i] === y[j] ? Math.min(C, oldI + oldJ) : Math.min(C, C + oldJ - oldI);
      if (Math.abs(low - high) < 1e-12) continue;
      const eta = 2 * matrix[i][j] - matrix[i][i] - matrix[j][j];
      if (eta >= 0) continue;
      alphas[j] = Math.min(
        high,
        Math.max(low, oldJ - (y[j] * (errorI - errorJ)) / eta),
      );
      if (Math.abs(alphas[j] - oldJ) < 1e-5) {
        alphas[j] = oldJ;
        continue;
      }
      alphas[i] += y[i] * y[j] * (oldJ - alphas[j]);
      const b1 =
        bias -
        errorI -
        y[i] * (alphas[i] - oldI) * matrix[i][i] -
        y[j] * (alphas[j] - oldJ) * matrix[i][j];
      const b2 =
        bias -
        errorJ -
        y[i] * (alphas[i] - oldI) * matrix[i][j] -
        y[j] * (alphas[j] - oldJ) * matrix[j][j];
      bias =
        alphas[i] > 0 && alphas[i] < C
          ? b1
          : alphas[j] > 0 && alphas[j] < C
            ? b2
            : (b1 + b2) / 2;
      changed += 1;
    }
    passes = changed ? 0 : passes + 1;
    iterations += 1;
  }
  const supportIndices = alphas
    .map((alpha, index) => ({ alpha, index }))
    .filter((item) => item.alpha > 1e-5)
    .map((item) => item.index);
  const score = (sample: number[]) => {
    if (sample.length !== width || !sample.every(Number.isFinite))
      throw new Error(`Expected ${width} finite features.`);
    const normalized = normalize(sample);
    return supportIndices.reduce(
      (sum, index) =>
        sum + alphas[index] * y[index] * kernel(samples[index], normalized),
      bias,
    );
  };
  const weights =
    options.kernel === "linear"
      ? Array.from({ length: width }, (_, feature) =>
          alphas.reduce(
            (sum, alpha, index) =>
              sum + alpha * y[index] * samples[index][feature],
            0,
          ),
        )
      : null;
  const norm = weights
    ? Math.sqrt(weights.reduce((sum, value) => sum + value ** 2, 0))
    : Math.sqrt(Math.max(0, supportIndices.reduce(
        (outer, i) => outer + supportIndices.reduce(
          (inner, j) => inner + alphas[i] * y[i] * alphas[j] * y[j] * matrix[i][j],
          0,
        ),
        0,
      )));
  return {
    alphas,
    bias,
    supportIndices,
    weights,
    marginWidth: norm ? 2 / norm : 0,
    score,
    predict: (sample) => (score(sample) >= 0 ? classes[1] : classes[0]),
  };
}
