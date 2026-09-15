export type FeatureScaleMode = "none" | "standard" | "minmax";

export interface FittedFeatureScale {
  mode: FeatureScaleMode;
  mean: number[];
  std: number[];
  min: number[];
  max: number[];
  constantFeatures: string[];
}

export interface MatrixProfile {
  rows: number;
  features: number;
  originalDimensions: number;
  hasTarget: boolean;
  classes: number[];
  missingCells: number;
  constantFeatures: string[];
  scaling: FeatureScaleMode;
  highDimensional: boolean;
}

export const MAX_EMBEDDING_SAMPLES = 400;

export function assertNumericMatrix(X: number[][], label = "Features") {
  if (!X.length || !X[0]?.length) throw new Error(`${label} matrix is empty.`);
  const width = X[0].length;
  for (const row of X) {
    if (row.length !== width) throw new Error(`${label} must be rectangular.`);
    for (const value of row) {
      if (!Number.isFinite(value)) {
        throw new Error(
          "Missing or non-numeric values are not imputed. Encode categoricals or drop incomplete rows first.",
        );
      }
    }
  }
}

export function fitFeatureScale(
  X: number[][],
  mode: FeatureScaleMode,
  featureNames?: string[],
): FittedFeatureScale {
  assertNumericMatrix(X);
  const p = X[0].length;
  const n = X.length;
  const mean = Array.from({ length: p }, (_, j) => X.reduce((sum, row) => sum + row[j], 0) / n);
  const std = Array.from({ length: p }, (_, j) => {
    const variance = X.reduce((sum, row) => sum + (row[j] - mean[j]) ** 2, 0) / n;
    return Math.sqrt(variance);
  });
  const min = Array.from({ length: p }, (_, j) => Math.min(...X.map((row) => row[j])));
  const max = Array.from({ length: p }, (_, j) => Math.max(...X.map((row) => row[j])));
  const constantFeatures = std
    .map((value, j) => (value < 1e-12 ? featureNames?.[j] ?? `feature_${j + 1}` : null))
    .filter((name): name is string => Boolean(name));
  return { mode, mean, std, min, max, constantFeatures };
}

export function applyFeatureScale(X: number[][], fitted: FittedFeatureScale): number[][] {
  assertNumericMatrix(X);
  if (fitted.mode === "none") return X.map((row) => [...row]);
  return X.map((row) =>
    row.map((value, j) => {
      if (fitted.mode === "minmax") {
        const span = fitted.max[j] - fitted.min[j];
        return span < 1e-12 ? 0 : (value - fitted.min[j]) / span;
      }
      return fitted.std[j] < 1e-12 ? 0 : (value - fitted.mean[j]) / fitted.std[j];
    }),
  );
}

export function invertFeatureScale(X: number[][], fitted: FittedFeatureScale): number[][] {
  if (fitted.mode === "none") return X.map((row) => [...row]);
  return X.map((row) =>
    row.map((value, j) => {
      if (fitted.mode === "minmax") {
        const span = fitted.max[j] - fitted.min[j];
        return fitted.min[j] + value * (span < 1e-12 ? 0 : span);
      }
      return fitted.mean[j] + value * (fitted.std[j] < 1e-12 ? 0 : fitted.std[j]);
    }),
  );
}

export function correlationMatrix(X: number[][]): number[][] {
  assertNumericMatrix(X);
  const p = X[0].length;
  const cols = Array.from({ length: p }, (_, j) => X.map((row) => row[j]));
  const mean = cols.map((col) => col.reduce((sum, value) => sum + value, 0) / col.length);
  const std = cols.map((col, j) =>
    Math.sqrt(col.reduce((sum, value) => sum + (value - mean[j]) ** 2, 0) / col.length),
  );
  return Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) => {
      if (std[i] < 1e-12 || std[j] < 1e-12) return i === j ? 1 : 0;
      const cov =
        cols[i].reduce((sum, value, n) => sum + (value - mean[i]) * (cols[j][n] - mean[j]), 0) /
        cols[i].length;
      return cov / (std[i] * std[j]);
    }),
  );
}

export function featureStatistics(X: number[][], names: string[]) {
  return names.map((name, j) => {
    const values = X.map((row) => row[j]);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const std = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
    return { name, mean, std, min, max, constant: std < 1e-12 };
  });
}

export function profileMatrix(
  X: number[][],
  names: string[],
  labels: number[] | undefined,
  scaling: FeatureScaleMode,
): MatrixProfile {
  const fitted = fitFeatureScale(X, scaling, names);
  const classes = labels ? [...new Set(labels)].sort((a, b) => a - b) : [];
  return {
    rows: X.length,
    features: X[0]?.length ?? 0,
    originalDimensions: X[0]?.length ?? 0,
    hasTarget: Boolean(labels?.length),
    classes,
    missingCells: 0,
    constantFeatures: fitted.constantFeatures,
    scaling,
    highDimensional: (X[0]?.length ?? 0) > 2,
  };
}

export function reconstructionMse(original: number[][], reconstructed: number[][]) {
  const n = original.length * original[0].length;
  let total = 0;
  for (let i = 0; i < original.length; i += 1) {
    for (let j = 0; j < original[0].length; j += 1) {
      total += (original[i][j] - reconstructed[i][j]) ** 2;
    }
  }
  return total / n;
}

export function reconstructionMae(original: number[][], reconstructed: number[][]) {
  const n = original.length * original[0].length;
  let total = 0;
  for (let i = 0; i < original.length; i += 1) {
    for (let j = 0; j < original[0].length; j += 1) {
      total += Math.abs(original[i][j] - reconstructed[i][j]);
    }
  }
  return total / n;
}

export function neighborhoodPreservation(high: number[][], low: number[][], k = 10) {
  if (high.length !== low.length || high.length < 3) return 0;
  const neighbors = Math.max(1, Math.min(k, high.length - 1));
  const knn = (space: number[][]) =>
    space.map((point, i) =>
      space
        .map((other, j) => ({
          j,
          d: i === j ? Infinity : other.reduce((sum, value, dim) => sum + (value - point[dim]) ** 2, 0),
        }))
        .sort((a, b) => a.d - b.d)
        .slice(0, neighbors)
        .map((item) => item.j)
        .sort((a, b) => a - b),
    );
  const highN = knn(high);
  const lowN = knn(low);
  let overlap = 0;
  for (let i = 0; i < high.length; i += 1) {
    const set = new Set(highN[i]);
    overlap += lowN[i].filter((index) => set.has(index)).length;
  }
  return overlap / (high.length * neighbors);
}

export function subsampleIndices(n: number, limit: number, seed = 7) {
  if (n <= limit) return Array.from({ length: n }, (_, i) => i);
  let state = seed >>> 0;
  const rand = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, limit).sort((a, b) => a - b);
}

export function componentsForVariance(ratios: number[], threshold: number) {
  let cumulative = 0;
  for (let i = 0; i < ratios.length; i += 1) {
    cumulative += ratios[i];
    if (cumulative >= threshold) return i + 1;
  }
  return ratios.length;
}

export function constantFeatureWarning(names: string[]) {
  if (!names.length) return null;
  return names.map((name) => `Feature ${name} is constant and contributes no variance.`).join(" ");
}
