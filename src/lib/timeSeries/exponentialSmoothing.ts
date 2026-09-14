export function exponentialSmoothing(
  values: number[],
  alpha: number,
  horizon: number,
  confidence = 0.95,
) {
  if (!values.length || !values.every(Number.isFinite))
    throw new Error("Exponential smoothing requires finite observations");
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1)
    throw new Error("Alpha must be between 0 and 1");
  if (!Number.isFinite(horizon) || horizon < 1)
    throw new Error("Forecast horizon must be positive");
  const a = alpha;
  const level: number[] = [],
    oneStep: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (!i) {
      level.push(values[i]);
      oneStep.push(values[i]);
    } else {
      oneStep.push(level[i - 1]);
      level.push(a * values[i] + (1 - a) * level[i - 1]);
    }
  }
  const errors = values.map((value, i) => (i ? value - oneStep[i] : 0)),
    usable = errors.slice(1);
  const mae =
    usable.reduce((sum, value) => sum + Math.abs(value), 0) /
    Math.max(1, usable.length);
  const rmse = Math.sqrt(
    usable.reduce((sum, value) => sum + value * value, 0) /
      Math.max(1, usable.length),
  );
  const percentageErrors = usable
    .map((value, i) => values[i + 1] === 0 ? undefined : Math.abs(value / values[i + 1]))
    .filter((value): value is number => value !== undefined);
  const mape = percentageErrors.length
    ? (percentageErrors.reduce((sum, value) => sum + value, 0) / percentageErrors.length) * 100
    : 0;
  const bias =
    usable.reduce((sum, value) => sum + value, 0) / Math.max(1, usable.length);
  const naive = values.slice(1).map((value, i) => value - values[i]);
  const naiveRmse =
    Math.sqrt(
      naive.reduce((sum, value) => sum + value * value, 0) /
        Math.max(1, naive.length),
    ) || 1;
  const z = confidence >= 0.99 ? 2.576 : confidence >= 0.95 ? 1.96 : 1.645,
    base = level.at(-1) ?? 0;
  const forecast = Array.from({ length: Math.max(1, Math.round(horizon)) }, () => base);
  const lower = forecast.map(
    (value, i) => value - z * rmse * Math.sqrt(1 + i * a * a),
  );
  const upper = forecast.map(
    (value, i) => value + z * rmse * Math.sqrt(1 + i * a * a),
  );
  return {
    level,
    oneStep,
    errors,
    forecast,
    lower,
    upper,
    metrics: { mae, rmse, mape, bias, theilU: rmse / naiveRmse },
  };
}
