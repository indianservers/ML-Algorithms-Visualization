export function mean(arr: number[]): number {
  assertFiniteArray(arr, "Mean");
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function variance(arr: number[]): number {
  const m = mean(arr);
  return arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
}

export function std(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

export function covariance(x: number[], y: number[]): number {
  assertPairedVectors(x, y, "Covariance");
  const mx = mean(x), my = mean(y);
  return x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0) / x.length;
}

export function correlation(x: number[], y: number[]): number {
  const sx = std(x), sy = std(y);
  if (sx === 0 || sy === 0) return 0;
  return covariance(x, y) / (sx * sy);
}

export function normalize(arr: number[]): number[] {
  assertFiniteArray(arr, "Normalization");
  const mn = Math.min(...arr), mx = Math.max(...arr);
  const range = mx - mn;
  if (range === 0) return arr.map(() => 0);
  return arr.map(v => (v - mn) / range);
}

export function standardize(arr: number[]): number[] {
  const m = mean(arr), s = std(arr);
  if (s === 0) return arr.map(() => 0);
  return arr.map(v => (v - m) / s);
}

export function median(arr: number[]): number {
  assertFiniteArray(arr, "Median");
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function mode(arr: number[]): number {
  assertFiniteArray(arr, "Mode");
  const freq: Map<number, number> = new Map();
  arr.forEach(v => freq.set(v, (freq.get(v) ?? 0) + 1));
  return [...freq.entries()].reduce((a, b) => b[1] > a[1] ? b : a)[0];
}

export function quantile(arr: number[], q: number): number {
  assertFiniteArray(arr, "Quantile");
  if (!Number.isFinite(q) || q < 0 || q > 1)
    throw new Error("Quantile probability must be between 0 and 1");
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function iqr(arr: number[]): number {
  return quantile(arr, 0.75) - quantile(arr, 0.25);
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function softmax(arr: number[]): number[] {
  if (!arr.length) return [];
  if (!arr.every(Number.isFinite)) throw new Error("Softmax requires finite values");
  const max = Math.max(...arr);
  const exps = arr.map(x => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

export function relu(x: number): number {
  return Math.max(0, x);
}

export function tanh(x: number): number {
  return Math.tanh(x);
}

export function dot(a: number[], b: number[]): number {
  assertPairedVectors(a, b, "Dot product");
  return a.reduce((s, ai, i) => s + ai * b[i], 0);
}

export function euclideanDistance(a: number[], b: number[]): number {
  assertPairedVectors(a, b, "Euclidean distance");
  return Math.sqrt(a.reduce((s, ai, i) => s + (ai - b[i]) ** 2, 0));
}

export function manhattanDistance(a: number[], b: number[]): number {
  assertPairedVectors(a, b, "Manhattan distance");
  return a.reduce((s, ai, i) => s + Math.abs(ai - b[i]), 0);
}

export function cosineDistance(a: number[], b: number[]): number {
  const dotAB = dot(a, b);
  const magA = Math.sqrt(dot(a, a));
  const magB = Math.sqrt(dot(b, b));
  if (magA === 0 || magB === 0) return 1;
  return 1 - dotAB / (magA * magB);
}

export function entropy(probs: number[]): number {
  assertProbabilityDistribution(probs, "Entropy");
  return -probs.filter(p => p > 0).reduce((s, p) => s + p * Math.log2(p), 0);
}

export function gini(probs: number[]): number {
  assertProbabilityDistribution(probs, "Gini impurity");
  return 1 - probs.reduce((s, p) => s + p * p, 0);
}

export function shuffle<T>(arr: T[], seed?: number): T[] {
  const result = [...arr];
  let s = seed ?? Date.now();
  const rng = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    // Divide by 2^32 so the generator is in [0, 1), as Fisher-Yates requires.
    return (s >>> 0) / 0x100000000;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function linspace(start: number, end: number, n: number): number[] {
  if (!Number.isFinite(start) || !Number.isFinite(end))
    throw new Error("Linspace endpoints must be finite");
  if (!Number.isInteger(n) || n < 0)
    throw new Error("Linspace length must be a non-negative integer");
  if (n === 0) return [];
  if (n === 1) return [start];
  const step = (end - start) / (n - 1);
  return Array.from({ length: n }, (_, i) => start + i * step);
}

function assertFiniteArray(values: number[], name: string): void {
  if (!values.length) throw new Error(`${name} requires at least one value`);
  if (!values.every(Number.isFinite)) throw new Error(`${name} requires finite values`);
}

function assertPairedVectors(a: number[], b: number[], name: string): void {
  assertFiniteArray(a, name);
  if (a.length !== b.length) throw new Error(`${name} requires vectors of equal length`);
  if (!b.every(Number.isFinite)) throw new Error(`${name} requires finite values`);
}

function assertProbabilityDistribution(values: number[], name: string): void {
  assertFiniteArray(values, name);
  if (values.some((value) => value < 0 || value > 1) ||
      Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) > 1e-9)
    throw new Error(`${name} requires probabilities that sum to 1`);
}
