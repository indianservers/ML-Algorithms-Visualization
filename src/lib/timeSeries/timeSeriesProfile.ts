import type { TimeFrequency } from "./timeSeriesSplit";
import type { TimeSeriesPoint } from "./timeSeriesDatasets";
import { autocorrelation } from "./arima";

export interface TimeSeriesProfile {
  name: string;
  observations: number;
  start: string;
  end: string;
  min: number;
  max: number;
  mean: number;
  median: number;
  std: number;
  missingValues: number;
  duplicateTimestamps: number;
  missingTimestamps: number;
  sorted: boolean;
  frequency: TimeFrequency;
  warnings: string[];
  trendHint: "yes" | "no" | "unclear";
  seasonalityHint: "likely" | "not obvious";
  dominantLag: number | null;
  suggestedSeasonalPeriod: number | null;
  sufficiency: "ok" | "limited" | "too-short";
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function profileTimeSeries(
  name: string,
  points: TimeSeriesPoint[],
  frequency: TimeFrequency = "unknown",
): TimeSeriesProfile {
  const warnings: string[] = [];
  const times = points.map((point) => parseDate(point.date));
  if (times.some((time) => time === null)) warnings.push("Some timestamps could not be parsed.");
  const finiteTimes = times.filter((time): time is Date => time !== null);
  const sorted =
    finiteTimes.length < 2 ||
    finiteTimes.every((time, i) => i === 0 || time.getTime() >= finiteTimes[i - 1].getTime());
  if (!sorted) warnings.push("Timestamps are not chronological. Sort before training.");
  const stamp = points.map((point) => point.date);
  const duplicateTimestamps = stamp.length - new Set(stamp).size;
  if (duplicateTimestamps) warnings.push(`${duplicateTimestamps} duplicate timestamp(s).`);
  const values = points.map((point) => point.value);
  const missingValues = values.filter((value) => !Number.isFinite(value)).length;
  const finite = values.filter(Number.isFinite);
  const mean = finite.reduce((s, v) => s + v, 0) / Math.max(1, finite.length);
  const sortedVals = [...finite].sort((a, b) => a - b);
  const median = sortedVals.length
    ? sortedVals[Math.floor(sortedVals.length / 2)]
    : Number.NaN;
  const std = Math.sqrt(
    finite.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, finite.length),
  );
  let missingTimestamps = 0;
  if (frequency === "daily" && finiteTimes.length > 1) {
    const span =
      (finiteTimes.at(-1)!.getTime() - finiteTimes[0].getTime()) / 86400000;
    missingTimestamps = Math.max(0, Math.round(span + 1) - finiteTimes.length);
    if (missingTimestamps) {
      warnings.push(`Expected daily frequency. ${missingTimestamps} dates are missing.`);
    }
  }
  if (frequency === "unknown") warnings.push("Frequency is not confidently inferred.");
  let trendHint: TimeSeriesProfile["trendHint"] = "unclear";
  if (finite.length >= 8) {
    const first = finite.slice(0, Math.floor(finite.length / 3));
    const last = finite.slice(-Math.floor(finite.length / 3));
    const d =
      last.reduce((s, v) => s + v, 0) / last.length -
      first.reduce((s, v) => s + v, 0) / first.length;
    trendHint = Math.abs(d) > 0.25 * (std || 1) ? "yes" : "no";
  }
  const acf = finite.length > 8 ? autocorrelation(finite, Math.min(24, finite.length - 2)) : [1];
  const dominantLag =
    acf
      .map((value, lag) => ({ value, lag }))
      .slice(2)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]?.lag ?? null;
  const seasonalityHint =
    dominantLag && Math.abs(acf[dominantLag] ?? 0) > 0.35 ? "likely" : "not obvious";
  return {
    name,
    observations: points.length,
    start: points[0]?.date ?? "",
    end: points.at(-1)?.date ?? "",
    min: finite.length ? Math.min(...finite) : Number.NaN,
    max: finite.length ? Math.max(...finite) : Number.NaN,
    mean,
    median,
    std,
    missingValues,
    duplicateTimestamps,
    missingTimestamps,
    sorted,
    frequency,
    warnings,
    trendHint,
    seasonalityHint,
    dominantLag: seasonalityHint === "likely" ? dominantLag : null,
    suggestedSeasonalPeriod:
      frequency === "monthly"
        ? 12
        : frequency === "weekly"
          ? 52
          : frequency === "daily"
            ? 7
            : frequency === "hourly"
              ? 24
              : seasonalityHint === "likely"
                ? dominantLag
                : null,
    sufficiency:
      points.length < 10 ? "too-short" : points.length < 36 ? "limited" : "ok",
  };
}
