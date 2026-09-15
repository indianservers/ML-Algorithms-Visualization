import { multipleLinearRegression } from "../algorithms/regression/linearRegression";
import { rSquared } from "../math/metrics";
import { regressionMetrics, type RegressionMetricBundle } from "./regressionEval";

export function varianceInflationFactors(X: number[][]): number[] {
  if (!X.length || !X[0]?.length) return [];
  const p = X[0].length;
  if (p === 1) return [1];
  return Array.from({ length: p }, (_, j) => {
    const yj = X.map((row) => row[j]);
    if (yj.every((value) => value === yj[0])) return Number.POSITIVE_INFINITY;
    const others = X.map((row) => row.filter((_, k) => k !== j));
    try {
      const fit = multipleLinearRegression(others, yj);
      const predicted = others.map((row) => fit.predict(row));
      const r2 = rSquared(yj, predicted);
      if (!Number.isFinite(r2) || r2 >= 1) return Number.POSITIVE_INFINITY;
      return 1 / (1 - r2);
    } catch {
      return Number.POSITIVE_INFINITY;
    }
  });
}

export function actualVsPredictedPoints(actual: number[], predicted: number[]) {
  return actual.map((y, i) => ({ actual: y, predicted: predicted[i] }));
}

export function downsample<T>(items: T[], limit = 400): T[] {
  if (items.length <= limit) return items;
  const stride = items.length / limit;
  return Array.from({ length: limit }, (_, i) => items[Math.floor(i * stride)]!);
}

export function evaluateSplit(
  trainY: number[],
  trainPred: number[],
  testY: number[],
  testPred: number[],
  numFeatures?: number,
): { train: RegressionMetricBundle; test: RegressionMetricBundle; gap: number | null } {
  const train = regressionMetrics(trainY, trainPred, numFeatures);
  const test = regressionMetrics(testY, testPred, numFeatures);
  const gap =
    train.r2 === null || test.r2 === null ? null : train.r2 - test.r2;
  return { train, test, gap };
}
