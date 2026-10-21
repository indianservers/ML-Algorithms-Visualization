import type { LabConfig } from "./types";
/** Conditional residual bootstrap using the same Holt-Winters state recurrences.
 * Samples in-history innovations, not future actuals. Parameter uncertainty is excluded.
 */
export function seasonalBootstrap(
  values: number[],
  fitted: {
    forecast: number[];
    level: number[];
    trend: number[];
    seasonal: number[];
    residuals: number[];
  },
  c: LabConfig,
) {
  const m = c.season,
    last = values.length - 1,
    mult = c.seasonalMode === "multiplicative";
  let seed = c.seed >>> 0;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let residual = fitted.residuals
    .slice(2 * m)
    .map((v, i) => (mult ? v / (values[2 * m + i] - v) : v))
    .filter(Number.isFinite);
  if (residual.length < 8) return { lower: [], upper: [] };
  if (!mult) {
    const mean = residual.reduce((a, b) => a + b, 0) / residual.length;
    residual = residual.map((v) => v - mean);
  }
  const paths = Array.from({ length: c.horizon }, () => [] as number[]);
  for (let draw = 0; draw < 160; draw++) {
    let level = fitted.level[last],
      trend = fitted.trend[last];
    const seasonal = Array(m).fill(0);
    for (let i = Math.max(0, values.length - m); i < values.length; i++)
      seasonal[i % m] = fitted.seasonal[i];
    for (let h = 0; h < c.horizon; h++) {
      const phase = (values.length + h) % m,
        season = seasonal[phase],
        predicted = mult ? (level + trend) * season : level + trend + season;
      const innovation = residual[Math.floor(random() * residual.length)];
      const observation = mult
        ? predicted * (1 + innovation)
        : predicted + innovation;
      if (!Number.isFinite(observation) || (mult && observation <= 0)) continue;
      paths[h].push(observation);
      const previous = level;
      level = mult
        ? c.alpha * (observation / season) + (1 - c.alpha) * (level + trend)
        : c.alpha * (observation - season) + (1 - c.alpha) * (level + trend);
      trend = c.beta * (level - previous) + (1 - c.beta) * trend;
      seasonal[phase] = mult
        ? c.gamma * (observation / level) + (1 - c.gamma) * season
        : c.gamma * (observation - level) + (1 - c.gamma) * season;
    }
  }
  if (paths.some((p) => p.length < 120)) return { lower: [], upper: [] };
  const quantile = (path: number[], q: number) => {
    const sorted = [...path].sort((a, b) => a - b);
    return sorted[
      Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))
    ];
  };
  return {
    lower: paths.map((p) => quantile(p, (1 - c.confidence) / 2)),
    upper: paths.map((p) => quantile(p, 1 - (1 - c.confidence) / 2)),
  };
}
