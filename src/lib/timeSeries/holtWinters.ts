export type SeasonalityMode = "additive" | "multiplicative";

export function holtWinters(
  values: number[],
  seasonLength: number,
  alpha: number,
  beta: number,
  gamma: number,
  steps: number,
  mode: SeasonalityMode = "additive",
) {
  if (values.length < 2 || !values.every(Number.isFinite))
    throw new Error("Holt-Winters requires at least two finite observations");
  if (![alpha, beta, gamma].every((value) => Number.isFinite(value) && value >= 0 && value <= 1))
    throw new Error("Holt-Winters smoothing parameters must be between 0 and 1");
  if (!Number.isFinite(steps) || steps < 1)
    throw new Error("Forecast steps must be positive");
  if (mode === "multiplicative" && values.some((value) => value <= 0))
    throw new Error("Multiplicative Holt-Winters requires positive observations");
  const m = Math.max(2, Math.min(values.length, Math.round(seasonLength))),
    first = values.slice(0, m);
  let level = first.reduce((a, b) => a + b, 0) / m;
  let trend =
    values.length > m
      ? values
          .slice(0, m)
          .reduce((sum, value, i) => sum + (values[i + m] - value) / m, 0) / m
      : 0;
  const seasonal = first.map((value) =>
    mode === "additive" ? value - level : value / (level || 1),
  );
  const levels: number[] = [],
    trends: number[] = [],
    seasons: number[] = [],
    fitted: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const season = seasonal[i % m] ?? (mode === "additive" ? 0 : 1),
      previousLevel = level;
    fitted.push(
      mode === "additive" ? level + trend + season : (level + trend) * season,
    );
    level =
      mode === "additive"
        ? alpha * (values[i] - season) + (1 - alpha) * (level + trend)
        : alpha * (values[i] / (season || 1)) + (1 - alpha) * (level + trend);
    trend = beta * (level - previousLevel) + (1 - beta) * trend;
    seasonal[i % m] =
      mode === "additive"
        ? gamma * (values[i] - level) + (1 - gamma) * season
        : gamma * (values[i] / (level || 1)) + (1 - gamma) * season;
    levels.push(level);
    trends.push(trend);
    seasons.push(seasonal[i % m]);
  }
  const forecast = Array.from(
    { length: Math.max(1, Math.round(steps)) },
    (_, i) =>
      mode === "additive"
        ? level + (i + 1) * trend + seasonal[(values.length + i) % m]
        : (level + (i + 1) * trend) * seasonal[(values.length + i) % m],
  );
  const residuals = values.map((value, i) => value - fitted[i]),
    usable = residuals.slice(m);
  const mae =
      usable.reduce((s, v) => s + Math.abs(v), 0) / Math.max(1, usable.length),
    rmse = Math.sqrt(
      usable.reduce((s, v) => s + v * v, 0) / Math.max(1, usable.length),
    );
  const percentageErrors = usable
    .map((value, i) => values[i + m] === 0 ? undefined : Math.abs(value / values[i + m]))
    .filter((value): value is number => value !== undefined);
  const mape = percentageErrors.length
    ? (percentageErrors.reduce((sum, value) => sum + value, 0) / percentageErrors.length) * 100
    : 0;
  const smape =
    (usable.reduce(
      (s, v, i) =>
        s +
        (2 * Math.abs(v)) /
          (Math.abs(values[i + m]) + Math.abs(fitted[i + m]) || 1),
      0,
    ) /
      Math.max(1, usable.length)) *
    100;
  return {
    level: levels,
    trend: trends,
    seasonal: seasons,
    fitted,
    forecast,
    residuals,
    metrics: { mae, rmse, mape, smape },
    initialization:
      "Level = mean of the first seasonal cycle. Trend = average of first-to-second cycle differences. Seasonal indices = first cycle minus (or divided by) that initial level.",
  };
}
