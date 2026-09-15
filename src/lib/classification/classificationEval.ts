import { binaryMetrics, confusionMatrix, prAuc, rocCurve } from "../math/metrics";
import { evaluateMulticlass } from "../evaluation/multiclassMetrics";
import { trainTestSplit } from "../preprocessing/trainTestSplit";

export function fitStandardScaler(trainX: number[][]) {
  if (!trainX.length || !trainX[0]?.length) {
    throw new Error("Scaler requires a non-empty training matrix.");
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

export function applyThreshold(probabilities: number[], threshold: number) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new Error("Threshold must be a finite number in [0, 1].");
  }
  return probabilities.map((p) => (p >= threshold ? 1 : 0));
}

export function binaryEvaluation(
  actual: number[],
  predicted: number[],
  scores?: number[],
) {
  const metrics = binaryMetrics(actual, predicted);
  return {
    ...metrics,
    matrix: confusionMatrix(actual, predicted),
    roc: scores ? rocCurve(actual, scores) : null,
    prAuc: scores ? prAuc(actual, scores) : null,
  };
}

export function requireTwoClasses(y: number[]) {
  const classes = new Set(y);
  if (classes.size < 2) {
    throw new Error("Supervised classification needs at least two classes. A one-class dataset cannot train a discriminator.");
  }
  return [...classes].sort((a, b) => a - b);
}

export function classCounts(y: number[]) {
  const counts: Record<number, number> = {};
  y.forEach((label) => {
    counts[label] = (counts[label] ?? 0) + 1;
  });
  return counts;
}

export function majorityBaseline(y: number[]) {
  const counts = classCounts(y);
  const majority = Number(
    Object.entries(counts).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))[0][0],
  );
  const accuracy = (counts[majority] ?? 0) / (y.length || 1);
  return { majority, accuracy };
}

export const CLF_METRIC_TOOLTIPS = {
  accuracy: "Fraction of predictions that are correct. Can look high on imbalanced data.",
  precision: "Among predicted positives, fraction that are truly positive.",
  recall: "Among actual positives, fraction correctly detected.",
  f1: "Harmonic mean of precision and recall. Not accuracy.",
  specificity: "Among actual negatives, fraction correctly identified.",
  balancedAccuracy: "Average of recall (sensitivity) and specificity.",
  rocAuc: "Ranking quality of scores across decision thresholds.",
  prAuc: "Area under the precision-recall curve. More informative than ROC-AUC when positives are rare.",
};

export function thresholdSweep(
  actual: number[],
  scores: number[],
  thresholds = [0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9],
) {
  return thresholds.map((threshold) => {
    const predicted = applyThreshold(scores, threshold);
    return { threshold, ...binaryMetrics(actual, predicted) };
  });
}

export function formatClf(value: number | null | undefined, digits = 3) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

export function formatPct(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function classificationSplit<T>(
  X: T[],
  y: number[],
  testSize = 0.2,
  seed = 42,
) {
  requireTwoClasses(y);
  const split = trainTestSplit(X, y, testSize, seed, true);
  return {
    ...split,
    n: X.length,
    nTrain: split.trainX.length,
    nTest: split.testX.length,
    nClasses: new Set(y).size,
    classCounts: classCounts(y),
  };
}

export function decisionGrid(
  predict: (row: number[]) => number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  columns = 36,
  rows = 24,
) {
  const cells: { x: number; y: number; label: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const x = x0 + ((c + 0.5) / columns) * (x1 - x0);
      const y = y0 + ((r + 0.5) / rows) * (y1 - y0);
      cells.push({ x, y, label: predict([x, y]) });
    }
  }
  return cells;
}

export { evaluateMulticlass };
