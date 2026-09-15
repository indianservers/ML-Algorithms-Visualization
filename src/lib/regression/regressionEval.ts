import { mae, mse, rmse } from "../math/metrics";
import { studentTCritical } from "../math/studentT";
import { trainTestSplit } from "../preprocessing/trainTestSplit";

export interface RegressionMetricBundle {
  mae: number;
  mse: number;
  rmse: number;
  r2: number | null;
  adjustedR2: number | null;
  n: number;
  targetVarianceZero: boolean;
}

export const METRIC_TOOLTIPS = {
  mae: "Average absolute prediction error.",
  rmse: "Square root of average squared error; penalizes larger errors more strongly.",
  r2: "Fraction of target variance explained relative to a mean-baseline prediction. Not accuracy.",
  adjustedR2: "R² adjusted for the number of predictors and sample size.",
  gap: "Train R² minus test R². A large gap can indicate overfitting, but is not proof by itself.",
};

export function targetHasZeroVariance(actual: number[]): boolean {
  if (!actual.length) return true;
  return actual.every((value) => value === actual[0]);
}

export function regressionMetrics(
  actual: number[],
  predicted: number[],
  numFeatures?: number,
): RegressionMetricBundle {
  const n = actual.length;
  const meanY = n ? actual.reduce((s, v) => s + v, 0) / n : 0;
  const total = actual.reduce((sum, value) => sum + (value - meanY) ** 2, 0);
  const residual = actual.reduce((sum, value, i) => sum + (value - predicted[i]) ** 2, 0);
  const zeroVar = total === 0;
  let r2: number | null;
  if (zeroVar) r2 = residual === 0 ? 1 : null;
  else r2 = 1 - residual / total;
  let adjusted: number | null = null;
  if (
    r2 !== null &&
    numFeatures !== undefined &&
    Number.isInteger(numFeatures) &&
    numFeatures >= 0 &&
    n > numFeatures + 1
  ) {
    adjusted = 1 - (1 - r2) * (n - 1) / (n - numFeatures - 1);
  }
  return {
    mae: mae(actual, predicted),
    mse: mse(actual, predicted),
    rmse: rmse(actual, predicted),
    r2,
    adjustedR2: adjusted,
    n,
    targetVarianceZero: zeroVar,
  };
}

export function parseFiniteNumber(raw: string, label: string): number | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { error: `${label} cannot be blank.` };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { error: `${label} must be a finite number.` };
  return value;
}

export function validateFeatureMatrix(
  X: number[][],
  y: number[],
  minSamples = 2,
): string | null {
  if (!X.length || X.length !== y.length) return "Features and target must have the same number of samples.";
  if (X.length < minSamples) return `Need at least ${minSamples} samples.`;
  if (!X[0]?.length) return "Select at least one feature.";
  const width = X[0].length;
  if (X.some((row) => row.length !== width || row.some((v) => !Number.isFinite(v)))) {
    return "Feature matrix contains missing or non-finite values.";
  }
  if (y.some((v) => !Number.isFinite(v))) return "Target contains missing or non-finite values. Missing values are not silently filled with zero.";
  return null;
}

export function splitViabilityMessage(n: number, testSize: number, minTrain = 2): string | null {
  if (n < minTrain) return `At least ${minTrain} training observations are required for this configuration.`;
  if (!Number.isFinite(testSize) || testSize <= 0 || testSize >= 1) {
    return "Test fraction must be between 0 and 1.";
  }
  const testCount = Math.min(n - 1, Math.max(1, Math.round(n * testSize)));
  const trainCount = n - testCount;
  if (n < minTrain + 1) {
    return `At least ${minTrain + 1} observations are required to create a train/test split.`;
  }
  if (trainCount < minTrain) {
    return `Test split leaves too few training observations. At least ${minTrain} training observations are required.`;
  }
  return null;
}

export function splitRegressionData<T>(
  X: T[],
  y: number[],
  testSize = 0.2,
  seed = 42,
  shuffle = true,
) {
  if (!shuffle) {
    const n = X.length;
    const testCount = Math.min(n - 1, Math.max(1, Math.round(n * testSize)));
    const trainCount = n - testCount;
    const trainIndices = Array.from({ length: trainCount }, (_, i) => i);
    const testIndices = Array.from({ length: testCount }, (_, i) => trainCount + i);
    return {
      trainX: trainIndices.map((i) => X[i]),
      testX: testIndices.map((i) => X[i]),
      trainY: trainIndices.map((i) => y[i]),
      testY: testIndices.map((i) => y[i]),
      trainIndices,
      testIndices,
      n,
      nTrain: trainCount,
      nTest: testCount,
    };
  }
  const split = trainTestSplit(X, y, testSize, seed, false);
  return {
    ...split,
    n: X.length,
    nTrain: split.trainX.length,
    nTest: split.testX.length,
  };
}

export interface SimpleLinearBandPoint {
  x: number;
  yHat: number;
  meanLo: number;
  meanHi: number;
  predLo: number;
  predHi: number;
}

/**
 * 95% intervals for simple linear regression.
 * mean*: interval for E[Y|x]
 * pred*: prediction interval for a new observation
 */
export function simpleLinearIntervals(
  xs: number[],
  ys: number[],
  slope: number,
  intercept: number,
  grid: number[],
  level = 0.95,
): SimpleLinearBandPoint[] | null {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  let sxx = 0;
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    sxx += dx * dx;
    const residual = ys[i] - (intercept + slope * xs[i]);
    sse += residual * residual;
  }
  if (sxx <= 0) return null;
  const df = n - 2;
  const sigma = Math.sqrt(sse / df);
  const t = studentTCritical(df, level);
  if (!Number.isFinite(t) || !Number.isFinite(sigma)) return null;
  return grid.map((x) => {
    const yHat = intercept + slope * x;
    const leverage = 1 / n + ((x - mx) ** 2) / sxx;
    const meanHalf = t * sigma * Math.sqrt(leverage);
    const predHalf = t * sigma * Math.sqrt(1 + leverage);
    return {
      x,
      yHat,
      meanLo: yHat - meanHalf,
      meanHi: yHat + meanHalf,
      predLo: yHat - predHalf,
      predHi: yHat + predHalf,
    };
  });
}

export function formatMetric(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: digits });
  }
  return value.toFixed(digits);
}

export function formatR2(value: number | null | undefined, zeroVariance = false): string {
  if (zeroVariance && (value === null || value === undefined || value !== 1)) {
    return "N/A — target has zero variance";
  }
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return zeroVariance ? "N/A — target has zero variance" : "—";
  }
  if (Math.abs(value - 1) < 1e-8) return "1.000";
  if (Math.abs(value) < 1e-10) return "0.000";
  return value.toFixed(3);
}

export interface ResidualDiagnostics {
  mean: number;
  largestPositive: number;
  largestNegative: number;
  residuals: number[];
}

export function residualDiagnostics(actual: number[], predicted: number[]): ResidualDiagnostics {
  const residuals = actual.map((value, i) => value - predicted[i]);
  return {
    mean: residuals.reduce((s, v) => s + v, 0) / (residuals.length || 1),
    largestPositive: residuals.length ? Math.max(...residuals) : 0,
    largestNegative: residuals.length ? Math.min(...residuals) : 0,
    residuals,
  };
}

export function generalizationGap(trainR2: number | null, testR2: number | null): number | null {
  if (trainR2 === null || testR2 === null || !Number.isFinite(trainR2) || !Number.isFinite(testR2)) {
    return null;
  }
  return trainR2 - testR2;
}

export function meanBaselineMetrics(trainY: number[], testY: number[]) {
  if (!trainY.length || !testY.length) {
    throw new Error("Baseline requires non-empty train and test targets.");
  }
  const meanY = trainY.reduce((s, v) => s + v, 0) / trainY.length;
  const predicted = testY.map(() => meanY);
  return { meanY, ...regressionMetrics(testY, predicted) };
}

export interface ColumnStats {
  name: string;
  mean: number;
  std: number;
  min: number;
  max: number;
  missing: number;
}

export function columnStats(values: number[], name: string): ColumnStats {
  const finite = values.filter(Number.isFinite);
  const missing = values.length - finite.length;
  const mean = finite.length ? finite.reduce((s, v) => s + v, 0) / finite.length : Number.NaN;
  const std = finite.length
    ? Math.sqrt(finite.reduce((s, v) => s + (v - mean) ** 2, 0) / finite.length)
    : Number.NaN;
  return {
    name,
    mean,
    std,
    min: finite.length ? Math.min(...finite) : Number.NaN,
    max: finite.length ? Math.max(...finite) : Number.NaN,
    missing,
  };
}

export function inferenceRow(
  valuesByName: Record<string, number>,
  featureNames: string[],
): number[] | { error: string } {
  const row: number[] = [];
  for (const name of featureNames) {
    const value = valuesByName[name];
    if (!Number.isFinite(value)) {
      return { error: `Inference requires a finite value for "${name}". Feature order follows the trained model, not the form layout.` };
    }
    row.push(value);
  }
  return row;
}

export type ModelLifecycle = "NOT TRAINED" | "TRAINING" | "TRAINED" | "MODEL STALE" | "ERROR";

export function modelLifecycle(opts: {
  training?: boolean;
  error?: string | null;
  trained: boolean;
  stale: boolean;
}): ModelLifecycle {
  if (opts.training) return "TRAINING";
  if (opts.error) return "ERROR";
  if (!opts.trained) return "NOT TRAINED";
  if (opts.stale) return "MODEL STALE";
  return "TRAINED";
}

export function fitStandardScalerTrainOnly(trainX: number[][]) {
  if (!trainX.length || !trainX[0]?.length) {
    throw new Error("Scaler requires a non-empty training matrix.");
  }
  const width = trainX[0].length;
  const mean = Array.from(
    { length: width },
    (_, j) => trainX.reduce((sum, row) => sum + row[j], 0) / trainX.length,
  );
  const std = mean.map((m, j) => {
    const variance = trainX.reduce((sum, row) => sum + (row[j] - m) ** 2, 0) / trainX.length;
    return Math.sqrt(variance) || 1;
  });
  const transform = (row: number[]) => row.map((value, j) => (value - mean[j]) / std[j]);
  return { mean, std, transform, transformAll: (rows: number[][]) => rows.map(transform) };
}
