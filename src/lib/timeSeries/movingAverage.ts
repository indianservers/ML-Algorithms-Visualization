export type MovingAverageAlignment = "trailing" | "centered";

export function movingAverage(
  values: number[],
  window: number,
  alignment: MovingAverageAlignment = "trailing",
  partialWindow = false,
) {
  if (!Number.isFinite(window) || window < 1) {
    throw new Error("Moving-average window must be at least 1.");
  }
  const size = Math.min(values.length || 1, Math.round(window));
  return values.map((_, index) => {
    if (alignment === "trailing") {
      if (!partialWindow && index < size - 1) return Number.NaN;
      const start = Math.max(0, index - size + 1);
      const slice = values.slice(start, index + 1);
      return slice.reduce((sum, value) => sum + value, 0) / slice.length;
    }
    const half = Math.floor((size - 1) / 2);
    const start = index - half;
    const end = start + size;
    if (!partialWindow && (start < 0 || end > values.length)) return Number.NaN;
    const slice = values.slice(Math.max(0, start), Math.min(values.length, end));
    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
  });
}

export function lagSeries(values: number[], lag: number) {
  const shift = Math.round(lag);
  return values.map((_, index) => values[index - shift] ?? Number.NaN);
}

export function movingAverageAnalysis(
  values: number[],
  window: number,
  alignment: MovingAverageAlignment,
  lag = 0,
) {
  const average = lagSeries(movingAverage(values, window, alignment), lag);
  const residual = values.map((value, index) =>
    Number.isFinite(average[index]) ? value - average[index] : Number.NaN,
  );
  return {
    average,
    residual,
    absoluteResidual: residual.map((value) =>
      Number.isFinite(value) ? Math.abs(value) : Number.NaN,
    ),
  };
}

export function inspectMovingAverageWindow(values: number[], window: number, index: number) {
  const size = Math.max(1, Math.round(window));
  if (index < size - 1 || index >= values.length) {
    return { observations: [] as number[], sum: Number.NaN, mean: Number.NaN };
  }
  const observations = values.slice(index - size + 1, index + 1);
  const sum = observations.reduce((total, value) => total + value, 0);
  return { observations, sum, mean: sum / observations.length };
}

export function recursiveMovingAverageForecast(
  values: number[],
  window: number,
  horizon: number,
) {
  const history = [...values];
  const size = Math.max(1, Math.round(window));
  const forecast: number[] = [];
  for (let step = 0; step < Math.max(0, Math.round(horizon)); step++) {
    const slice = history.slice(-size);
    const next = slice.reduce((sum, value) => sum + value, 0) / slice.length;
    forecast.push(next);
    history.push(next);
  }
  return forecast;
}
