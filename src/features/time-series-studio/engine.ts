import {
  movingAverage,
  movingAverageAnalysis,
  lagSeries,
  recursiveMovingAverageForecast,
} from "../../lib/timeSeries/movingAverage";
import { exponentialSmoothing } from "../../lib/timeSeries/exponentialSmoothing";
import { holtWinters } from "../../lib/timeSeries/holtWinters";
import {
  forecastMetrics,
  naiveForecast,
  seasonalNaiveForecast,
} from "../../lib/timeSeries/forecastMetrics";
import {
  detectRollingZScoreAnomalies,
  type AnomalyPoint,
} from "../../lib/timeSeries/anomalyDetection";
import { seasonalBootstrap } from "./seasonalBootstrap";
import { type LabConfig, type LabKind } from "./types";
export type ForecastResult = {
  fitted: number[];
  forecast: number[];
  lower: number[];
  upper: number[];
  components: Record<string, number[]>;
  note: string;
  duration: number | null;
  params?: number;
  memory?: number;
};
export function splitSeries(values: number[], holdout: number) {
  const origin = Math.max(8, Math.floor(values.length * (1 - holdout / 100)));
  const trainEnd = Math.max(6, Math.floor(origin * 0.8));
  return {
    train: values.slice(0, trainEnd),
    validation: values.slice(trainEnd, origin),
    test: values.slice(origin),
    origin,
    trainEnd,
    history: values.slice(0, origin),
  };
}
export function classicalFit(
  kind: LabKind,
  values: number[],
  c: LabConfig,
): ForecastResult {
  const start = performance.now();
  let result: ForecastResult;
  if (kind === "moving-average") {
    const r = movingAverageAnalysis(
      values,
      c.window,
      c.alignment === "leading" ? "trailing" : c.alignment,
      c.lag,
    );
    if (c.alignment === "leading") {
      r.average = lagSeries(
        movingAverage([...values].reverse(), c.window).reverse(),
        c.lag,
      );
      r.residual = values.map((v, i) => v - r.average[i]);
      r.absoluteResidual = r.residual.map(Math.abs);
    }
    // Evaluation remains causal even when the visualization demonstrates centered/leading smoothing.
    result = {
      fitted: r.average,
      forecast: recursiveMovingAverageForecast(values, c.window, c.horizon),
      lower: [],
      upper: [],
      components: {
        Residual: r.residual,
        "Absolute residual": r.absoluteResidual,
      },
      note: "Recursive trailing-window forecast. Centered and leading curves are retrospective smoothers, never used for holdout prediction.",
      duration: 0,
    };
  } else if (kind === "exponential-smoothing") {
    const input =
      c.initialization === "mean"
        ? [
            values
              .slice(0, Math.min(c.window, values.length))
              .reduce((a, b) => a + b, 0) / Math.min(c.window, values.length),
            ...values,
          ]
        : values;
    const r = exponentialSmoothing(input, c.alpha, c.horizon, c.confidence);
    const offset = c.initialization === "mean" ? 1 : 0;
    const warmup =
      c.initialization === "mean" ? Math.min(c.window, values.length) : 1;
    const fitted = r.oneStep
      .slice(offset)
      .map((value, i) => (i < warmup ? NaN : value));
    const residuals = values.map((value, i) => value - fitted[i]);
    const usable = residuals.filter(Number.isFinite);
    const sigma = Math.sqrt(
      usable.reduce((sum, error) => sum + error * error, 0) /
        Math.max(1, usable.length),
    );
    const z =
      c.confidence >= 0.99 ? 2.576 : c.confidence >= 0.95 ? 1.96 : 1.645;
    const widths = r.forecast.map(
      (_, i) => z * sigma * Math.sqrt(1 + i * c.alpha * c.alpha),
    );
    result = {
      fitted,
      forecast: r.forecast,
      lower:
        usable.length >= 2
          ? r.forecast.map((value, i) => value - widths[i])
          : [],
      upper:
        usable.length >= 2
          ? r.forecast.map((value, i) => value + widths[i])
          : [],
      components: {
        Level: r.level.slice(offset),
        Residual: residuals,
      },
      note: `SES forecasts are flat. The first ${warmup} initialization observation(s) are excluded from one-step forecasts, residual scores and interval estimation. Gaussian additive innovations; post-initialization residual RMSE estimates noise and interval width grows with horizon. At least two residuals are required for intervals. Initialization uses pre-test history only.`,
      duration: 0,
    };
  } else if (kind === "holt-winters") {
    if (values.length < 2 * c.season)
      throw new Error(
        `Holt–Winters needs at least two complete seasonal cycles (${2 * c.season} observations before the holdout). Reduce seasonal period or choose a longer dataset.`,
      );
    const r = holtWinters(
      values,
      c.season,
      c.alpha,
      c.beta,
      c.gamma,
      c.horizon,
      c.seasonalMode,
      {
        level: c.initialLevel ?? undefined,
        trend: c.initialTrend ?? undefined,
        neutralSeason: c.seasonalInit === "neutral",
      },
    );
    const interval = seasonalBootstrap(values, r, c);
    result = {
      fitted: r.fitted.map((v, i) => (i < 2 * c.season ? NaN : v)),
      forecast: r.forecast,
      ...interval,
      components: {
        Level: r.level,
        Trend: r.trend,
        Seasonality: r.seasonal,
        Residual: r.residuals.map((v, i) => (i < 2 * c.season ? NaN : v)),
      },
      note: `${c.seasonalMode === "additive" ? "Additive: level + trend + seasonal effect." : "Multiplicative: (level + trend) × seasonal factor; positive values required."} Initialization uses the first two training cycles. Conditional residual-bootstrap interval (160 deterministic paths), assuming exchangeable past innovations. Parameter uncertainty is excluded; actual holdout coverage is reported when available. Fewer than 8 post-initialization residuals makes intervals unavailable.`,
      duration: 0,
    };
  } else throw new Error("This model needs its fitted engine.");
  result.duration = performance.now() - start;
  return result;
}
export function optimizeClassical(
  kind: LabKind,
  train: number[],
  c: LabConfig,
) {
  let best = { ...c },
    loss = Infinity;
  const score = (candidate: LabConfig) => {
    try {
      const r = classicalFit(kind, train, candidate);
      const warmup =
        kind === "holt-winters" ? 2 * c.season : Math.max(1, c.window);
      const m = forecastMetrics(train.slice(warmup), r.fitted.slice(warmup));
      if (m.n && m.mse < loss) {
        loss = m.mse;
        best = candidate;
      }
    } catch {
      /* invalid candidates are not ranked */
    }
  };
  if (kind === "exponential-smoothing")
    for (let a = 1; a <= 19; a++) score({ ...c, alpha: a / 20 });
  else
    for (const alpha of [0.1, 0.3, 0.6, 0.9])
      for (const beta of [0.1, 0.3, 0.6])
        for (const gamma of [0.1, 0.3, 0.6])
          score({ ...c, alpha, beta, gamma });
  if (!Number.isFinite(loss))
    throw new Error(
      "No valid training configuration. Check seasonal period and training length.",
    );
  return best;
}
const median = (v: number[]) => {
  const a = [...v].sort((a, b) => a - b);
  return a.length % 2
    ? a[Math.floor(a.length / 2)]
    : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
};
export function detectCausal(values: number[], c: LabConfig): AnomalyPoint[] {
  if (c.detector === "zscore")
    return detectRollingZScoreAnomalies(values, c.window, c.threshold);
  return values.map((value, i) => {
    const past = values.slice(Math.max(0, i - c.window), i);
    let expected = NaN,
      scale = NaN,
      lower = NaN,
      upper = NaN;
    if (past.length >= Math.max(3, c.detector === "seasonal" ? c.season : 3)) {
      const mean = past.reduce((a, b) => a + b, 0) / past.length;
      if (c.detector === "modified") {
        expected = median(past);
        scale = 1.4826 * median(past.map((v) => Math.abs(v - expected)));
      } else if (c.detector === "iqr") {
        const a = [...past].sort((a, b) => a - b);
        const q1 = a[Math.floor((a.length - 1) * 0.25)],
          q3 = a[Math.floor((a.length - 1) * 0.75)];
        expected = median(past);
        scale = (q3 - q1) / 1.349;
        lower = q1 - c.threshold * (q3 - q1);
        upper = q3 + c.threshold * (q3 - q1);
      } else if (c.detector === "ewma") {
        expected = past.reduce(
          (level, v) => c.alpha * v + (1 - c.alpha) * level,
          past[0],
        );
        scale = Math.sqrt(
          past.reduce((s, v) => s + (v - expected) ** 2, 0) / past.length,
        );
      } else {
        const samePhase = [];
        for (
          let j = i - c.season;
          j >= Math.max(0, i - c.window);
          j -= c.season
        )
          samePhase.push(values[j]);
        expected = samePhase.length
          ? samePhase.reduce((a, b) => a + b, 0) / samePhase.length
          : mean;
        scale = Math.sqrt(
          past.reduce(
            (s, v, j) =>
              s + (v - (values[i - past.length + j - c.season] ?? v)) ** 2,
            0,
          ) / past.length,
        );
      }
      if (c.detector !== "iqr") {
        lower = expected - c.threshold * scale;
        upper = expected + c.threshold * scale;
      }
    }
    const anomaly =
      Number.isFinite(expected) && (value < lower || value > upper);
    const score = scale > 1e-10 ? Math.abs(value - expected) / scale : NaN;
    return {
      value,
      expected,
      lower,
      upper,
      deviation: value - expected,
      score,
      anomaly,
      contextual: c.detector === "seasonal" && anomaly,
      severity: !anomaly
        ? "normal"
        : !Number.isFinite(score) || score > c.threshold * 1.5
          ? "high"
          : "medium",
    };
  });
}
export function alertIndexes(points: AnomalyPoint[], cooldown: number) {
  let last = -Infinity;
  return points.flatMap((p, i) =>
    p.anomaly && i - last > cooldown ? ((last = i), [i]) : [],
  );
}
export function baselineResults(
  history: number[],
  actual: number[],
  horizon: number,
  season: number,
) {
  return [
    { name: "Naïve", forecast: naiveForecast(history, horizon) },
    {
      name: "Seasonal naïve",
      forecast: seasonalNaiveForecast(history, horizon, season),
    },
  ].map((r) => ({
    ...r,
    metrics: forecastMetrics(actual, r.forecast, history, season),
  }));
}
export { movingAverage };
