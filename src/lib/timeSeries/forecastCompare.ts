import { chronologicalSplit } from "./timeSeriesSplit";
import { forecastMetrics, naiveForecast, seasonalNaiveForecast } from "./forecastMetrics";
import { recursiveMovingAverageForecast } from "./movingAverage";
import { exponentialSmoothing } from "./exponentialSmoothing";
import { holtWinters } from "./holtWinters";
import { fitArima } from "./arima";
import { recurrentForecast } from "./recurrentForecast";
import { driftForecast, splitRangeLabels } from "./forecastDiagnostics";

export function compareForecastModels(
  values: number[],
  horizon: number,
  season = 12,
  timestamps: string[] = [],
) {
  const split = chronologicalSplit(values);
  const origin = split.train;
  const actual = [...split.validation, ...split.test].slice(0, horizon);
  const h = Math.max(1, actual.length || horizon);
  const naive = naiveForecast(origin, h);
  const seasonal = seasonalNaiveForecast(origin, h, season);
  const drift = driftForecast(origin, h);
  const ma = recursiveMovingAverageForecast(origin, Math.min(7, origin.length), h);
  const es = exponentialSmoothing(origin, 0.3, h);
  let hw: number[] = naive;
  try {
    hw = holtWinters(
      origin,
      Math.min(season, Math.max(2, origin.length)),
      0.3,
      0.2,
      0.3,
      h,
    ).forecast;
  } catch {
    hw = naive;
  }
  const arima = fitArima(origin, 1, 1, 1, h);
  const rnn = recurrentForecast(origin, Math.min(8, origin.length - 2), h, 4, "rnn", {
    epochs: 5,
    seed: 3,
  });
  const lstm = recurrentForecast(origin, Math.min(8, origin.length - 2), h, 4, "lstm", {
    epochs: 5,
    seed: 3,
  });
  const gru = recurrentForecast(origin, Math.min(8, origin.length - 2), h, 4, "gru", {
    epochs: 5,
    seed: 3,
  });
  const models = [
    { name: "Naive", forecast: naive },
    { name: "Seasonal naive", forecast: seasonal },
    { name: "Drift", forecast: drift },
    { name: "Moving average", forecast: ma },
    { name: "Exponential smoothing", forecast: es.forecast },
    { name: "Holt-Winters", forecast: hw },
    { name: "ARIMA(1,1,1)", forecast: arima.forecast },
    { name: "RNN", forecast: rnn.predictions, kind: rnn.kind },
    { name: "LSTM", forecast: lstm.predictions, kind: lstm.kind },
    { name: "GRU", forecast: gru.predictions, kind: gru.kind },
  ].map((model) => ({
    ...model,
    metrics: forecastMetrics(
      actual.length ? actual : model.forecast,
      model.forecast.slice(0, h),
      origin,
      season,
    ),
  }));
  const ranked = [...models].sort(
    (a, b) => (a.metrics.rmse || Infinity) - (b.metrics.rmse || Infinity),
  );
  return {
    trainEnd: split.trainEnd,
    validationEnd: split.validationEnd,
    testLength: actual.length,
    ranges: splitRangeLabels(
      timestamps.length ? timestamps : values.map((_, i) => String(i)),
      split.trainEnd,
      split.validationEnd,
    ),
    models,
    bestRmseName: ranked[0]?.name ?? null,
    wording: ranked[0]
      ? `Lowest RMSE on current test window: ${ranked[0].name}`
      : "No ranking available",
  };
}
