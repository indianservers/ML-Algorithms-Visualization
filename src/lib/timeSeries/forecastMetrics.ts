export interface ForecastMetricBundle {
  n: number;
  mae: number;
  mse: number;
  rmse: number;
  mape: number | null;
  smape: number;
  mase: number | null;
  me: number;
}

function pairs(actual: number[], predicted: number[]) {
  const a: number[] = [];
  const p: number[] = [];
  const n = Math.min(actual.length, predicted.length);
  for (let i = 0; i < n; i++) {
    if (Number.isFinite(actual[i]) && Number.isFinite(predicted[i])) {
      a.push(actual[i]);
      p.push(predicted[i]);
    }
  }
  return { a, p };
}

export function forecastMetrics(
  actual: number[],
  predicted: number[],
  insample?: number[],
  seasonalPeriod = 1,
): ForecastMetricBundle {
  const { a, p } = pairs(actual, predicted);
  const n = a.length;
  if (!n) {
    return {
      n: 0,
      mae: Number.NaN,
      mse: Number.NaN,
      rmse: Number.NaN,
      mape: null,
      smape: Number.NaN,
      mase: null,
      me: Number.NaN,
    };
  }
  const mae = a.reduce((sum, value, i) => sum + Math.abs(value - p[i]), 0) / n;
  const mse = a.reduce((sum, value, i) => sum + (value - p[i]) ** 2, 0) / n;
  const hasZeroActual = a.some((value) => value === 0);
  const mapeTerms = a
    .map((value, i) =>
      value === 0 ? null : Math.abs((value - p[i]) / value),
    )
    .filter((value): value is number => value !== null);
  const smape =
    (a.reduce((sum, value, i) => {
      const denom = Math.abs(value) + Math.abs(p[i]);
      return denom === 0 ? sum : sum + (2 * Math.abs(value - p[i])) / denom;
    }, 0) /
      n) *
    100;
  let mase: number | null = null;
  if (insample && insample.length > seasonalPeriod) {
    let scale = 0;
    let count = 0;
    for (let i = seasonalPeriod; i < insample.length; i++) {
      scale += Math.abs(insample[i] - insample[i - seasonalPeriod]);
      count += 1;
    }
    scale /= Math.max(1, count);
    mase = scale === 0 ? (mae === 0 ? 0 : null) : mae / scale;
  }
  return {
    n,
    mae,
    mse,
    rmse: Math.sqrt(mse),
    mape: hasZeroActual || !mapeTerms.length
      ? null
      : (mapeTerms.reduce((s, v) => s + v, 0) / mapeTerms.length) * 100,
    smape,
    mase,
    me: a.reduce((sum, value, i) => sum + (value - p[i]), 0) / n,
  };
}

export function naiveForecast(history: number[], horizon: number) {
  const last = history.at(-1);
  if (!Number.isFinite(last)) throw new Error("Naive forecast needs a finite last observation.");
  return Array.from({ length: Math.max(0, Math.round(horizon)) }, () => last as number);
}

export function seasonalNaiveForecast(
  history: number[],
  horizon: number,
  period: number,
) {
  const s = Math.max(1, Math.round(period));
  if (history.length < s) return naiveForecast(history, horizon);
  return Array.from({ length: Math.max(0, Math.round(horizon)) }, (_, i) => {
    const value = history[history.length - s + (i % s)];
    return Number.isFinite(value) ? value : (history.at(-1) as number);
  });
}
