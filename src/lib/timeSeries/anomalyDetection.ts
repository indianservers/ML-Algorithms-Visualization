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
