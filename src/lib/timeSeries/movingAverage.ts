export type MovingAverageAlignment = "trailing" | "centered";

export function movingAverage(
  values: number[],
  window: number,
  alignment: MovingAverageAlignment = "trailing",
) {
  const size = Math.max(1, Math.min(values.length || 1, Math.round(window)));
  return values.map((_, index) => {
    const start =
      alignment === "centered"
        ? Math.min(
            Math.max(0, index - Math.floor((size - 1) / 2)),
            Math.max(0, values.length - size),
          )
        : Math.max(0, index - size + 1);
    const end = alignment === "centered" ? start + size : index + 1;
    const slice = values.slice(start, end);
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
    absoluteResidual: residual.map((value) => Math.abs(value)),
  };
}
