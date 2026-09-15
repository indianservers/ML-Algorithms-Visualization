import { sigmoid, mean } from "../../math/statistics";

export interface LogisticRegressionResult {
  weights: number[];
  bias: number;
  predict: (x: number[]) => number;
  predictProba: (x: number[]) => number;
  lossHistory: number[];
}

export function logisticRegression(
  X: number[][],
  y: number[],
  lr = 0.1,
  maxIter = 1000,
  onStep?: (
    iter: number,
    loss: number,
    weights: number[],
    bias: number,
  ) => void,
  l2 = 0,
): LogisticRegressionResult {
  if (!X.length || !X[0]?.length) throw new Error('Logistic regression requires a non-empty feature matrix');
  if (X.length !== y.length) throw new Error('Logistic regression requires one label per sample');
  const width = X[0].length;
  if (!X.every(row => row.length === width && row.every(Number.isFinite))) throw new Error('Logistic regression requires a rectangular matrix of finite values');
  if (!y.every(value => value === 0 || value === 1)) throw new Error('Logistic regression requires binary labels');
  if (!Number.isFinite(lr) || lr <= 0 || !Number.isInteger(maxIter) || maxIter < 1 || !Number.isFinite(l2) || l2 < 0) throw new Error('Invalid logistic regression hyperparameters');
  const p = X[0].length;
  let weights = Array(p).fill(0);
  let bias = 0;
  const lossHistory: number[] = [];

  for (let iter = 0; iter < maxIter; iter++) {
    const probs = X.map((xi) =>
      sigmoid(xi.reduce((s, v, j) => s + v * weights[j], bias)),
    );
    const loss =
      -mean(
        y.map((yi, i) => {
          const p = Math.min(Math.max(probs[i], 1e-15), 1 - 1e-15);
          return yi * Math.log(p) + (1 - yi) * Math.log(1 - p);
        }),
      ) +
      0.5 * l2 * weights.reduce((sum, weight) => sum + weight * weight, 0);
    lossHistory.push(loss);

    const diffs = probs.map((pi, i) => pi - y[i]);
    const dw = weights.map((_, j) => mean(diffs.map((d, i) => d * X[i][j])));
    const db = mean(diffs);
    weights = weights.map((w, j) => w - lr * (dw[j] + l2 * w));
    bias -= lr * db;

    if (onStep && iter % 50 === 0) onStep(iter, loss, weights, bias);
  }

  const predictProba = (x: number[]) => {
    if (x.length !== p || !x.every(Number.isFinite)) throw new Error(`Expected ${p} finite features`);
    return sigmoid(x.reduce((s, v, j) => s + v * weights[j], bias));
  };
  const predict = (x: number[], threshold = 0.5, mapExtra?: unknown) => {
    const cut =
      mapExtra === undefined && Number.isFinite(threshold) && threshold >= 0 && threshold <= 1
        ? threshold
        : 0.5;
    if (mapExtra === undefined && threshold !== cut) {
      throw new Error("Logistic threshold must be in [0, 1]");
    }
    return predictProba(x) >= cut ? 1 : 0;
  };
  return { weights, bias, predict, predictProba, lossHistory };
}
