import { chronologicalSplit, walkForwardOrigins } from "./timeSeriesSplit";
import { forecastMetrics, type ForecastMetricBundle } from "./forecastMetrics";

export type ModelFitState =
  | "NOT_FITTED"
  | "FITTING"
  | "FITTED"
  | "STALE"
  | "FORECASTING"
  | "ERROR";

export function splitRangeLabels(
  timestamps: string[],
  trainEnd: number,
  validationEnd: number,
) {
  const label = (start: number, end: number) => {
    if (start >= end || !timestamps[start] || !timestamps[end - 1]) return "n/a";
    return `${timestamps[start]} – ${timestamps[end - 1]}`;
  };
  return {
    train: label(0, trainEnd),
    validation: label(trainEnd, validationEnd),
    test: label(validationEnd, timestamps.length),
    forecast: timestamps.at(-1) ? `after ${timestamps.at(-1)}` : "n/a",
  };
}

export function driftForecast(history: number[], horizon: number) {
  if (history.length < 2) {
    const last = history.at(-1) ?? 0;
    return Array.from({ length: Math.max(0, horizon) }, () => last);
  }
  const first = history[0];
  const last = history.at(-1)!;
  const slope = (last - first) / (history.length - 1);
  return Array.from(
    { length: Math.max(0, Math.round(horizon)) },
    (_, h) => last + (h + 1) * slope,
  );
}

export function forecastErrorTable(
  timestamps: string[],
  actual: number[],
  forecast: number[],
) {
  const n = Math.min(timestamps.length, actual.length, forecast.length);
  return Array.from({ length: n }, (_, i) => {
    const error = actual[i] - forecast[i];
    const pct =
      actual[i] === 0 || !Number.isFinite(actual[i])
        ? null
        : (error / actual[i]) * 100;
    return {
      timestamp: timestamps[i],
      actual: actual[i],
      forecast: forecast[i],
      error,
      absoluteError: Math.abs(error),
      squaredError: error * error,
      percentageError: pct,
    };
  }).sort((a, b) => b.absoluteError - a.absoluteError);
}

export function walkForwardEvaluate(
  values: number[],
  minTrain: number,
  horizon: number,
  predict: (train: number[], horizon: number) => number[],
  mode: "expanding" | "rolling" = "expanding",
) {
  const origins = walkForwardOrigins(values.length, minTrain, horizon);
  const rows: Array<{ origin: number; actual: number; forecast: number }> = [];
  const window = minTrain;
  for (const origin of origins) {
    const train =
      mode === "expanding"
        ? values.slice(0, origin)
        : values.slice(Math.max(0, origin - window), origin);
    const forecast = predict(train, horizon);
    const actual = values[origin];
    if (Number.isFinite(actual) && Number.isFinite(forecast[0])) {
      rows.push({ origin, actual, forecast: forecast[0] });
    }
  }
  return {
    mode,
    rows,
    metrics: forecastMetrics(
      rows.map((row) => row.actual),
      rows.map((row) => row.forecast),
      values.slice(0, minTrain),
    ),
  };
}

export function chronologicalIntegrity<T>(
  train: T[],
  validation: T[],
  test: T[],
  time: (item: T) => number,
) {
  const lastTrain = train.length ? time(train.at(-1)!) : -Infinity;
  const firstVal = validation.length ? time(validation[0]) : Infinity;
  const lastVal = validation.length ? time(validation.at(-1)!) : lastTrain;
  const firstTest = test.length ? time(test[0]) : Infinity;
  return lastTrain < firstVal && lastVal < firstTest;
}

export function acfConfidenceBound(n: number) {
  return 1.96 / Math.sqrt(Math.max(1, n));
}

export type AnomalyBenchmark = {
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
  detected: number;
};

export function anomalyBenchmark(
  predicted: boolean[],
  labelled: number[],
): AnomalyBenchmark {
  const truth = new Set(labelled);
  let tp = 0;
  let fp = 0;
  predicted.forEach((flag, index) => {
    if (flag && truth.has(index)) tp += 1;
    else if (flag) fp += 1;
  });
  const fn = [...truth].filter((index) => !predicted[index]).length;
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return {
    tp,
    fp,
    fn,
    precision,
    recall,
    f1,
    detected: predicted.filter(Boolean).length,
  };
}

export function withBias(metrics: ForecastMetricBundle, actual: number[], forecast: number[]) {
  const n = Math.min(actual.length, forecast.length);
  let sum = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (Number.isFinite(actual[i]) && Number.isFinite(forecast[i])) {
      sum += actual[i] - forecast[i];
      count += 1;
    }
  }
  return {
    ...metrics,
    me: count ? sum / count : Number.NaN,
    meConvention: "ME = mean(actual − forecast). Positive ⇒ under-forecast on average.",
  };
}

export function optimizeSesAlpha(values: number[]) {
  let best = 0.3;
  let bestSse = Infinity;
  for (let a = 0.05; a <= 1.0001; a += 0.05) {
    let level = values[0] ?? 0;
    let sse = 0;
    for (let i = 1; i < values.length; i++) {
      const pred = level;
      sse += (values[i] - pred) ** 2;
      level = a * values[i] + (1 - a) * level;
    }
    if (sse < bestSse) {
      bestSse = sse;
      best = a > 1 ? 1 : Number(a.toFixed(2));
    }
  }
  return {
    alpha: best,
    trainSse: bestSse,
    trainRmse: Math.sqrt(bestSse / Math.max(1, values.length - 1)),
  };
}

export function suggestArimaOrder(acf: number[], pacf: number[], differenced: number[]) {
  const bound = acfConfidenceBound(differenced.length);
  let p = 0;
  for (let lag = 1; lag < Math.min(pacf.length, 4); lag++) {
    if (Math.abs(pacf[lag] ?? 0) > bound) p = lag;
    else break;
  }
  let q = 0;
  for (let lag = 1; lag < Math.min(acf.length, 4); lag++) {
    if (Math.abs(acf[lag] ?? 0) > bound) q = lag;
    else break;
  }
  return {
    p: Math.min(2, p),
    d: 0,
    q: Math.min(2, q),
    heuristic: true,
    note: "Heuristic from ACF/PACF crossing approximate ±1.96/√N bounds. Not guaranteed optimal. Do not tune on the test set.",
  };
}

export function recursiveForecastTrace(
  window: number[],
  steps: number[],
) {
  return steps.map((forecast, index) => ({
    step: index + 1,
    input: [...window.slice(index), ...steps.slice(0, index)],
    forecast,
  }));
}

export { chronologicalSplit };
