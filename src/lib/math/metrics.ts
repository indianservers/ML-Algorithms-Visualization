import { mean } from './statistics';

function validatePairs(actual: number[], predicted: number[], name: string) {
  if (actual.length === 0) throw new Error(`${name} requires at least one sample`);
  if (actual.length !== predicted.length) throw new Error(`${name} requires arrays of equal length`);
  if (![...actual, ...predicted].every(Number.isFinite)) throw new Error(`${name} requires finite values`);
}

function validateBinaryPairs(actual: number[], predicted: number[], name: string) {
  validatePairs(actual, predicted, name);
  if (!actual.every(value => value === 0 || value === 1)) throw new Error(`${name} requires binary actual labels`);
}

export function mse(actual: number[], predicted: number[]): number {
  validatePairs(actual, predicted, 'MSE');
  return mean(actual.map((a, i) => (a - predicted[i]) ** 2));
}

export function rmse(actual: number[], predicted: number[]): number {
  return Math.sqrt(mse(actual, predicted));
}

export function mae(actual: number[], predicted: number[]): number {
  validatePairs(actual, predicted, 'MAE');
  return mean(actual.map((a, i) => Math.abs(a - predicted[i])));
}

export function mape(actual: number[], predicted: number[]): number {
  validatePairs(actual, predicted, 'MAPE');
  const valid = actual.map((a, i) => ({ a, p: predicted[i] })).filter(x => x.a !== 0);
  if (valid.length === 0) return 0;
  return mean(valid.map(({ a, p }) => Math.abs((a - p) / a))) * 100;
}

export function rSquared(actual: number[], predicted: number[]): number {
  validatePairs(actual, predicted, 'R-squared');
  const m = mean(actual);
  const ssTot = actual.reduce((s, a) => s + (a - m) ** 2, 0);
  const ssRes = actual.reduce((s, a, i) => s + (a - predicted[i]) ** 2, 0);
  if (ssTot === 0) return ssRes === 0 ? 1 : 0;
  return 1 - ssRes / ssTot;
}

export function adjustedRSquared(actual: number[], predicted: number[], numFeatures: number): number {
  const n = actual.length;
  if (!Number.isInteger(numFeatures) || numFeatures < 0) throw new Error('Adjusted R-squared requires a non-negative integer feature count');
  if (n <= numFeatures + 1) throw new Error('Adjusted R-squared requires more samples than features plus one');
  const r2 = rSquared(actual, predicted);
  return 1 - (1 - r2) * (n - 1) / (n - numFeatures - 1);
}

export function confusionMatrix(actual: number[], predicted: number[]): number[][] {
  validatePairs(actual, predicted, 'Confusion matrix');
  const classes = [...new Set([...actual, ...predicted])].sort((a, b) => a - b);
  const n = classes.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const idx = new Map(classes.map((c, i) => [c, i]));
  actual.forEach((a, i) => {
    const ai = idx.get(a) ?? 0;
    const pi = idx.get(predicted[i]) ?? 0;
    matrix[ai][pi]++;
  });
  return matrix;
}

export function binaryMetrics(actual: number[], predicted: number[]): {
  tp: number; tn: number; fp: number; fn: number;
  accuracy: number; precision: number; recall: number; specificity: number; f1: number;
} {
  validateBinaryPairs(actual, predicted, 'Binary metrics');
  if (!predicted.every(value => value === 0 || value === 1)) throw new Error('Binary metrics requires binary predicted labels');
  let tp = 0, tn = 0, fp = 0, fn = 0;
  actual.forEach((a, i) => {
    const p = predicted[i];
    if (a === 1 && p === 1) tp++;
    else if (a === 0 && p === 0) tn++;
    else if (a === 0 && p === 1) fp++;
    else fn++;
  });
  const accuracy = (tp + tn) / (tp + tn + fp + fn) || 0;
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const specificity = tn / (tn + fp) || 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
  return { tp, tn, fp, fn, accuracy, precision, recall, specificity, f1 };
}

export function rocCurve(actual: number[], scores: number[]): { fpr: number[]; tpr: number[]; thresholds: number[]; auc: number } {
  validateBinaryPairs(actual, scores, 'ROC curve');
  const sorted = scores.map((s, i) => ({ s, a: actual[i] })).sort((a, b) => b.s - a.s);
  const totalPos = actual.filter(a => a === 1).length;
  const totalNeg = actual.length - totalPos;
  let tp = 0, fp = 0;
  const points: { fpr: number; tpr: number; t: number }[] = [{ fpr: 0, tpr: 0, t: Infinity }];
  for (let i = 0; i < sorted.length;) {
    const threshold = sorted[i].s;
    while (i < sorted.length && sorted[i].s === threshold) {
      if (sorted[i].a === 1) tp++; else fp++;
      i++;
    }
    points.push({ fpr: fp / (totalNeg || 1), tpr: tp / (totalPos || 1), t: threshold });
  }
  const fpr = points.map(p => p.fpr);
  const tpr = points.map(p => p.tpr);
  const thresholds = points.map(p => p.t);
  let auc = 0;
  for (let i = 1; i < fpr.length; i++) {
    auc += (fpr[i] - fpr[i - 1]) * (tpr[i] + tpr[i - 1]) / 2;
  }
  return { fpr, tpr, thresholds, auc };
}

export function precisionRecallCurve(actual: number[], scores: number[]): { precision: number[]; recall: number[]; thresholds: number[] } {
  validateBinaryPairs(actual, scores, 'Precision-recall curve');
  const sorted = scores.map((s, i) => ({ s, a: actual[i] })).sort((a, b) => b.s - a.s);
  const totalPos = actual.filter(a => a === 1).length;
  let tp = 0, fp = 0;
  const prec: number[] = [], rec: number[] = [], thr: number[] = [];
  for (let i = 0; i < sorted.length;) {
    const threshold = sorted[i].s;
    while (i < sorted.length && sorted[i].s === threshold) {
      if (sorted[i].a === 1) tp++; else fp++;
      i++;
    }
    prec.push(tp / (tp + fp));
    rec.push(tp / (totalPos || 1));
    thr.push(threshold);
  }
  return { precision: prec, recall: rec, thresholds: thr };
}

export function logLoss(actual: number[], probs: number[]): number {
  validateBinaryPairs(actual, probs, 'Log loss');
  if (!probs.every(value => value >= 0 && value <= 1)) throw new Error('Log loss probabilities must be between 0 and 1');
  const eps = 1e-15;
  return -mean(actual.map((a, i) => {
    const p = Math.min(Math.max(probs[i], eps), 1 - eps);
    return a * Math.log(p) + (1 - a) * Math.log(1 - p);
  }));
}
