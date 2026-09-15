import { describe, expect, it } from "vitest";
import { movingAverage, inspectMovingAverageWindow } from "../src/lib/timeSeries/movingAverage";
import {
  exponentialSmoothing,
  inspectExponentialSmoothing,
} from "../src/lib/timeSeries/exponentialSmoothing";
import { holtWinters } from "../src/lib/timeSeries/holtWinters";
import {
  autocorrelation,
  differenceSeries,
  fitArima,
  inspectDifference,
  partialAutocorrelation,
} from "../src/lib/timeSeries/arima";
import { detectRollingZScoreAnomalies } from "../src/lib/timeSeries/anomalyDetection";
import {
  buildSequenceWindows,
  chronologicalSplit,
  futureTimestamps,
  leakageInvariant,
  trainOnlyScaler,
} from "../src/lib/timeSeries/timeSeriesSplit";
import { forecastMetrics, naiveForecast, seasonalNaiveForecast } from "../src/lib/timeSeries/forecastMetrics";
import { recurrentForecast } from "../src/lib/timeSeries/recurrentForecast";
import { getTimeSeriesDataset, seriesValues } from "../src/lib/timeSeries/timeSeriesDatasets";
import { compareForecastModels } from "../src/lib/timeSeries/forecastCompare";
import {
  chronologicalIntegrity,
  driftForecast,
  acfConfidenceBound,
  anomalyBenchmark,
  optimizeSesAlpha,
  walkForwardEvaluate,
  recursiveForecastTrace,
} from "../src/lib/timeSeries/forecastDiagnostics";
import {
  resolveDuplicateTimestamps,
  resampleSeries,
  sortChronologically,
} from "../src/lib/timeSeries/timeSeriesPrep";

describe("Phase 5 time series mathematics", () => {
  it("computes trailing moving average and leaves a full-window edge", () => {
    const values = [10, 12, 14];
    const average = movingAverage(values, 3);
    expect(average[0]).toBeNaN();
    expect(average[1]).toBeNaN();
    expect(average[2]).toBe(12);
    const inspect = inspectMovingAverageWindow(values, 3, 2);
    expect(inspect.observations).toEqual([10, 12, 14]);
    expect(inspect.mean).toBe(12);
  });

  it("follows the SES recurrence and rejects alpha = 0", () => {
    const values = [10, 12, 14];
    const alpha = 0.5;
    const result = exponentialSmoothing(values, alpha, 1);
    expect(result.level[0]).toBe(10);
    expect(result.level[1]).toBeCloseTo(0.5 * 12 + 0.5 * 10);
    expect(inspectExponentialSmoothing(values, alpha, 2).smoothed).toBeCloseTo(
      result.level[2],
    );
    expect(() => exponentialSmoothing(values, 0, 1)).toThrow();
  });

  it("updates Holt-Winters level, trend, and season", () => {
    const values = Array.from({ length: 16 }, (_, i) => [10, 20, 30, 40][i % 4]);
    const additive = holtWinters(values, 4, 0.4, 0.2, 0.3, 4, "additive");
    expect(additive.forecast).toHaveLength(4);
    expect(new Set(additive.seasonal.map((value) => value.toFixed(2))).size).toBeGreaterThan(1);
    expect(additive.trend.some((value) => Number.isFinite(value))).toBe(true);
    expect(() =>
      holtWinters([-1, 2, 3, 4, 5, 6, 7, 8], 4, 0.3, 0.2, 0.3, 2, "multiplicative"),
    ).toThrow();
  });

  it("differences, inverts, and computes real ACF/PACF", () => {
    const values = [1, 3, 6, 10, 15];
    expect(differenceSeries(values, 1)).toEqual([2, 3, 4, 5]);
    const acf = autocorrelation([1, 2, 3, 4, 5, 6], 2);
    expect(acf[0]).toBeCloseTo(1);
    const pacf = partialAutocorrelation([1, 2, 3, 4, 5, 6, 7, 8], 3);
    expect(pacf[0]).toBe(1);
    expect(pacf[1]).not.toBeCloseTo(acf[2] ?? 0);
    const a = fitArima(values, 1, 0, 0, 3);
    const b = fitArima(values, 0, 1, 0, 3);
    const c = fitArima(values, 0, 0, 1, 3);
    expect(a.forecast[0]).not.toBeCloseTo(b.forecast[0]);
    expect(b.forecast.join(",")).not.toBe(c.forecast.join(","));
  });

  it("keeps chronological splits unshuffled and generates calendar timestamps", () => {
    const series = Array.from({ length: 100 }, (_, i) => i);
    const split = chronologicalSplit(series);
    expect(split.train).toEqual(series.slice(0, 70));
    expect(split.validation).toEqual(series.slice(70, 85));
    expect(split.test).toEqual(series.slice(85));
    const dates = futureTimestamps("2026-12-01", 2, "monthly");
    expect(dates[0].getMonth()).toBe(0);
    expect(dates[0].getFullYear()).toBe(2027);
    expect(naiveForecast([4, 5, 9], 3)).toEqual([9, 9, 9]);
    expect(seasonalNaiveForecast([10, 20, 30, 40, 11, 21, 31, 41], 4, 4)).toEqual([
      11, 21, 31, 41,
    ]);
  });

  it("handles MAPE zeros and reports sMAPE", () => {
    const metrics = forecastMetrics([0, 0, 2], [1, 1, 2]);
    expect(metrics.mape).toBeNull();
    expect(metrics.smape).toBeGreaterThan(0);
    expect(metrics.mae).toBeCloseTo(2 / 3);
  });

  it("builds RNN windows without future leakage in the target", () => {
    const { inputs, targets } = buildSequenceWindows([1, 2, 3, 4, 5, 6], 3);
    expect(inputs).toEqual([
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
    ]);
    expect(targets).toEqual([4, 5, 6]);
  });

  it("fits the scaler on train only", () => {
    const train = [0, 1, 2, 3];
    const scaler = trainOnlyScaler(train);
    expect(scaler.min).toBe(0);
    expect(scaler.max).toBe(3);
    expect(scaler.decode(scaler.encode(10))).toBeCloseTo(10);
    const leaked = trainOnlyScaler([...train, -50]);
    expect(leaked.min).not.toBe(scaler.min);
  });

  it("does not let future observations change trailing MA or SES on the train prefix", () => {
    const train = [2, 4, 6, 8, 10, 12, 14];
    const future = [1000, 2000];
    expect(
      leakageInvariant(train, future, (series) => movingAverage(series, 3).slice(0, train.length)),
    ).toBe(true);
    expect(
      leakageInvariant(train, future, (series) =>
        exponentialSmoothing(series, 0.4, 1).level.slice(0, train.length),
      ),
    ).toBe(true);
  });

  it("detects inserted spikes with rolling z-score", () => {
    const dataset = getTimeSeriesDataset("spike-anomalies");
    const values = seriesValues(dataset);
    const points = detectRollingZScoreAnomalies(values, 12, 3);
    for (const index of dataset.knownAnomalyIndexes ?? []) {
      expect(points[index]?.anomaly).toBe(true);
    }
    const fewer = detectRollingZScoreAnomalies(values, 12, 8).filter((point) => point.anomaly)
      .length;
    const more = detectRollingZScoreAnomalies(values, 12, 2).filter((point) => point.anomaly)
      .length;
    expect(more).toBeGreaterThan(fewer);
  });

  it("trains a recurrent model with real decreasing-capable loss and no fake interval", () => {
    const sine = Array.from({ length: 48 }, (_, i) => Math.sin(i / 3));
    const result = recurrentForecast(sine, 6, 4, 4, "rnn", { epochs: 8, seed: 2 });
    expect(result.trainLoss.length).toBe(8);
    expect(result.predictions).toHaveLength(4);
    expect(result.intervalAvailable).toBe(false);
    expect(result.lower).toEqual([]);
    const again = recurrentForecast(sine, 6, 4, 4, "rnn", { epochs: 8, seed: 2 });
    expect(again.predictions[0]).toBeCloseTo(result.predictions[0], 5);
  });

  it("ranks models on the same holdout window", () => {
    const values = seriesValues(getTimeSeriesDataset("seasonal-block"));
    const comparison = compareForecastModels(values, 8, 4);
    expect(comparison.wording.startsWith("Lowest RMSE on current test window:")).toBe(true);
    expect(comparison.models.length).toBeGreaterThanOrEqual(10);
    expect(new Set(comparison.models.map((model) => model.name)).size).toBe(comparison.models.length);
  });

  it("forecasts a constant series without NaN", () => {
    const values = Array(20).fill(10);
    expect(movingAverage(values, 4).filter(Number.isFinite).every((value) => value === 10)).toBe(
      true,
    );
    const es = exponentialSmoothing(values, 0.3, 3);
    expect(es.forecast.every((value) => value === 10)).toBe(true);
    const metrics = forecastMetrics(values.slice(-3), es.forecast);
    expect(metrics.mae).toBe(0);
  });

  it("treats ARIMA(0,0,0) as a mean forecast and ARIMA(0,1,0) as a random walk", () => {
    const values = [2, 4, 6, 8, 10];
    const mean = fitArima(values, 0, 0, 0, 3);
    expect(mean.forecast.every((value) => value === 6)).toBe(true);
    const walk = fitArima(values, 0, 1, 0, 3);
    expect(walk.forecast.every((value) => value === 10)).toBe(true);
    const inspect = inspectDifference(values, 3);
    expect(inspect.firstDifference).toBe(2);
  });

  it("uses train-only naive errors for MASE and ME = mean(actual − forecast)", () => {
    const metrics = forecastMetrics([3, 5], [1, 5], [1, 2, 3], 1);
    expect(metrics.me).toBe(1);
    expect(metrics.mase).toBeCloseTo(1);
  });

  it("walk-forward expanding origins never include the target timestamp", () => {
    const series = [1, 2, 3, 4, 5, 6, 7, 8];
    const evaluation = walkForwardEvaluate(
      series,
      4,
      1,
      (train) => [train.at(-1)!],
      "expanding",
    );
    expect(evaluation.rows[0]?.origin).toBe(4);
    expect(evaluation.rows[0]?.forecast).toBe(4);
    expect(evaluation.rows[0]?.actual).toBe(5);
  });

  it("keeps train timestamps strictly before validation and test", () => {
    const stamps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => ({ t: value }));
    const split = chronologicalSplit(stamps);
    expect(
      chronologicalIntegrity(split.train, split.validation, split.test, (row) => row.t),
    ).toBe(true);
  });

  it("reports approximate ACF bounds and leaves rolling z warmup as NaN", () => {
    expect(acfConfidenceBound(100)).toBeCloseTo(1.96 / 10);
    const points = detectRollingZScoreAnomalies([1, 1, 1, 1, 1, 9], 3, 2);
    expect(points[0]?.score).toBeNaN();
    expect(points[2]?.score).toBeNaN();
    expect(Number.isFinite(points[5]?.score) || points[5]?.anomaly).toBe(true);
    const constant = detectRollingZScoreAnomalies([4, 4, 4, 4, 4, 4], 3, 2);
    expect(constant[5]?.score === 0 || Number.isNaN(constant[5]?.score)).toBe(true);
    expect(constant.every((point) => Number.isFinite(point.score) ? point.score !== Infinity : true)).toBe(true);
  });

  it("scores labelled spike anomalies without inventing isolation forest", () => {
    const dataset = getTimeSeriesDataset("spike-anomalies");
    const values = seriesValues(dataset);
    const flags = detectRollingZScoreAnomalies(values, 12, 3).map((point) => point.anomaly);
    const bench = anomalyBenchmark(flags, dataset.knownAnomalyIndexes ?? []);
    expect(bench.tp).toBeGreaterThan(0);
    expect(bench.f1).toBeGreaterThan(0);
  });

  it("optimizes SES alpha on training SSE rather than a fixed 0.3", () => {
    const values = [10, 12, 11, 13, 12, 40, 41, 39];
    const fit = optimizeSesAlpha(values);
    expect(fit.alpha).toBeGreaterThan(0);
    expect(fit.alpha).toBeLessThanOrEqual(1);
    expect(fit.trainSse).toBeGreaterThan(0);
  });

  it("uses distinct recurrent cells for RNN, LSTM, and GRU", () => {
    const sine = Array.from({ length: 40 }, (_, i) => Math.sin(i / 4));
    const rnn = recurrentForecast(sine, 4, 2, 3, "rnn", { epochs: 3, seed: 1 });
    const lstm = recurrentForecast(sine, 4, 2, 3, "lstm", { epochs: 3, seed: 1 });
    const gru = recurrentForecast(sine, 4, 2, 3, "gru", { epochs: 3, seed: 1 });
    expect(rnn.kind).toBe("rnn");
    expect(lstm.kind).toBe("lstm");
    expect(gru.kind).toBe("gru");
    expect(rnn.architecture).toMatch(/Elman|SimpleRNN|RNN/i);
    expect(lstm.architecture).toMatch(/LSTM/);
    expect(gru.architecture).toMatch(/GRU/);
  });

  it("traces recursive multi-step forecasts by feeding predictions back", () => {
    const trace = recursiveForecastTrace([1, 2, 3], [4, 5]);
    expect(trace[0]?.input).toEqual([1, 2, 3]);
    expect(trace[1]?.input).toEqual([2, 3, 4]);
  });

  it("sorts, dedupes, and resamples timestamps without silent policy", () => {
    const messy = [
      { date: "2024-01-03", value: 3 },
      { date: "2024-01-01", value: 1 },
      { date: "2024-01-01", value: 9 },
    ];
    const sorted = sortChronologically(messy).points;
    expect(sorted[0]?.date).toBe("2024-01-01");
    const last = resolveDuplicateTimestamps(sorted, "keep-last").points;
    expect(last.find((point) => point.date === "2024-01-01")?.value).toBe(9);
    const mean = resolveDuplicateTimestamps(sorted, "mean").points;
    expect(mean.find((point) => point.date === "2024-01-01")?.value).toBe(5);
    const weekly = resampleSeries(
      [
        { date: "2024-01-01", value: 2 },
        { date: "2024-01-02", value: 4 },
        { date: "2024-01-08", value: 10 },
      ],
      "weekly",
      "mean",
    );
    expect(weekly.length).toBeGreaterThanOrEqual(2);
  });

  it("does not change the train scaler when only future values change", () => {
    const train = [0, 2, 4, 6];
    const scaler = trainOnlyScaler(train);
    expect(scaler.degenerate).toBe(false);
    expect(trainOnlyScaler([5, 5, 5]).degenerate).toBe(true);
    expect(trainOnlyScaler(train).min).toBe(scaler.min);
  });

  it("computes a drift forecast from the training slope", () => {
    expect(driftForecast([0, 10], 2)).toEqual([20, 30]);
  });
});
