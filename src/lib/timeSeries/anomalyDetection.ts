import { movingAverage } from "./movingAverage";

export type AnomalyPoint = {
  value: number;
  expected: number;
  lower: number;
  upper: number;
  deviation: number;
  score: number;
  anomaly: boolean;
  contextual: boolean;
  severity: "normal" | "medium" | "high";
};

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

export function detectRollingZScoreAnomalies(
  values: number[],
  window: number,
  threshold: number,
): AnomalyPoint[] {
  const size = Math.max(3, Math.round(window));
  return values.map((value, index) => {
    if (index < size) {
      return {
        value,
        expected: Number.NaN,
        lower: Number.NaN,
        upper: Number.NaN,
        deviation: Number.NaN,
        score: Number.NaN,
        anomaly: false,
        contextual: false,
        severity: "normal" as const,
      };
    }
    const past = values.slice(index - size, index);
    const mean = past.reduce((sum, sample) => sum + sample, 0) / past.length;
    const variance =
      past.reduce((sum, sample) => sum + (sample - mean) ** 2, 0) / past.length;
    const std = Math.sqrt(variance);
    if (std < 1e-12) {
      const anomaly = Math.abs(value - mean) > 1e-9;
      return {
        value,
        expected: mean,
        lower: mean,
        upper: mean,
        deviation: value - mean,
        score: anomaly ? Number.NaN : 0,
        anomaly,
        contextual: false,
        severity: anomaly ? "high" : "normal",
      };
    }
    const score = (value - mean) / std;
    const anomaly = Math.abs(score) > threshold;
    return {
      value,
      expected: mean,
      lower: mean - threshold * std,
      upper: mean + threshold * std,
      deviation: value - mean,
      score: Math.abs(score),
      anomaly,
      contextual: false,
      severity: !anomaly ? "normal" : Math.abs(score) >= threshold * 1.5 ? "high" : "medium",
    };
  });
}

export function detectAdaptiveAnomalies(
  values: number[],
  window: number,
  sensitivity: number,
  contextual = true,
): AnomalyPoint[] {
  const radius = Math.max(2, Math.round(window / 2));
  return values.map((value, index) => {
    const neighbors = values
      .slice(
        Math.max(0, index - radius),
        Math.min(values.length, index + radius + 1),
      )
      .filter(
        (_, localIndex) => Math.max(0, index - radius) + localIndex !== index,
      );
    const expected = median(neighbors);
    const deviations = neighbors.map((sample) => Math.abs(sample - expected));
    const robustSigma = Math.max(0.5, median(deviations) * 1.4826);
    const score = Math.abs(value - expected) / robustSigma;
    const contextualScore =
      Math.abs(value - (values[index - 1] ?? expected)) / robustSigma;
    const eligible = index >= radius && index < values.length - radius;
    const isContextual =
      contextual &&
      eligible &&
      score > sensitivity * 0.72 &&
      contextualScore > sensitivity;
    const anomaly = eligible && (score > sensitivity || isContextual);
    return {
      value,
      expected,
      lower: expected - sensitivity * robustSigma,
      upper: expected + sensitivity * robustSigma,
      deviation: value - expected,
      score,
      anomaly,
      contextual: anomaly && isContextual && score <= sensitivity,
      severity: !anomaly
        ? "normal"
        : score >= sensitivity * 1.65
          ? "high"
          : "medium",
    };
  });
}

export function detectGlobalZScoreAnomalies(values: number[], threshold: number): AnomalyPoint[] {
  const finite = values.filter(Number.isFinite);
  const mean = finite.reduce((sum, value) => sum + value, 0) / Math.max(1, finite.length);
  const std = Math.sqrt(
    finite.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, finite.length),
  );
  return values.map((value) => {
    if (std < 1e-12) {
      const anomaly = Math.abs(value - mean) > 1e-9;
      return {
        value,
        expected: mean,
        lower: mean,
        upper: mean,
        deviation: value - mean,
        score: anomaly ? Number.NaN : 0,
        anomaly,
        contextual: false,
        severity: anomaly ? "high" : "normal",
      };
    }
    const score = (value - mean) / std;
    const anomaly = Math.abs(score) > threshold;
    return {
      value,
      expected: mean,
      lower: mean - threshold * std,
      upper: mean + threshold * std,
      deviation: value - mean,
      score: Math.abs(score),
      anomaly,
      contextual: false,
      severity: !anomaly ? "normal" : Math.abs(score) >= threshold * 1.5 ? "high" : "medium",
    };
  });
}

export function detectIqrAnomalies(values: number[], multiplier = 1.5): AnomalyPoint[] {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return [];
  const q = (p: number) => {
    const index = (sorted.length - 1) * p;
    const lo = Math.floor(index);
    const hi = Math.ceil(index);
    return (sorted[lo] ?? 0) + ((sorted[hi] ?? 0) - (sorted[lo] ?? 0)) * (index - lo);
  };
  const q1 = q(0.25);
  const q3 = q(0.75);
  const iqr = q3 - q1;
  const lower = q1 - multiplier * iqr;
  const upper = q3 + multiplier * iqr;
  const mid = (q1 + q3) / 2;
  return values.map((value) => {
    const anomaly = value < lower || value > upper;
    return {
      value,
      expected: mid,
      lower,
      upper,
      deviation: value - mid,
      score: iqr === 0 ? (anomaly ? Number.NaN : 0) : Math.abs(value - mid) / iqr,
      anomaly,
      contextual: false,
      severity: !anomaly ? "normal" : "high",
    };
  });
}

export function detectResidualAnomalies(
  values: number[],
  window: number,
  threshold: number,
): AnomalyPoint[] {
  const fitted = movingAverage(values, window, "trailing");
  const residuals = values.map((value, index) =>
    Number.isFinite(fitted[index]) ? value - fitted[index] : Number.NaN,
  );
  const proxy = residuals.map((value) => (Number.isFinite(value) ? value : 0));
  return detectRollingZScoreAnomalies(proxy, window, threshold).map((point, index) => ({
    ...point,
    value: values[index],
    expected: fitted[index],
    deviation: residuals[index],
  }));
}
