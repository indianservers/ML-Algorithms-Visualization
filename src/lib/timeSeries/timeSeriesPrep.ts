import type { TimeFrequency } from "./timeSeriesSplit";
import { addPeriod } from "./timeSeriesSplit";

export type DuplicatePolicy = "keep-first" | "keep-last" | "mean";
export type ResampleAgg = "mean" | "sum" | "min" | "max";

export function sortChronologically<T extends { date: string }>(points: T[]) {
  const parsed = points.map((point, index) => ({
    point,
    index,
    time: new Date(point.date).getTime(),
  }));
  const invalid = parsed.filter((row) => Number.isNaN(row.time)).length;
  const sortedAlready = parsed.every(
    (row, i) => i === 0 || row.time >= parsed[i - 1].time,
  );
  const ordered = [...parsed].sort((a, b) => a.time - b.time || a.index - b.index);
  return {
    invalid,
    sortedAlready,
    points: ordered.map((row) => row.point),
  };
}

export function resolveDuplicateTimestamps<T extends { date: string; value: number }>(
  points: T[],
  policy: DuplicatePolicy,
) {
  const groups = new Map<string, T[]>();
  for (const point of points) {
    const key = point.date;
    const list = groups.get(key) ?? [];
    list.push(point);
    groups.set(key, list);
  }
  const resolved: T[] = [];
  let duplicates = 0;
  for (const [date, group] of groups) {
    if (group.length > 1) duplicates += group.length - 1;
    if (policy === "keep-first") resolved.push(group[0]);
    else if (policy === "keep-last") resolved.push(group.at(-1)!);
    else {
      const mean =
        group.reduce((sum, row) => sum + row.value, 0) / group.length;
      resolved.push({ ...group[0], date, value: mean });
    }
  }
  return { points: resolved, duplicates, policy };
}

export function resampleSeries(
  points: Array<{ date: string; value: number }>,
  frequency: TimeFrequency,
  agg: ResampleAgg,
) {
  if (frequency === "unknown") {
    throw new Error("Cannot resample without an explicit frequency.");
  }
  const sorted = sortChronologically(points).points.filter((point) =>
    Number.isFinite(point.value),
  );
  if (!sorted.length) return [];
  const buckets = new Map<string, number[]>();
  for (const point of sorted) {
    const date = new Date(point.date);
    let key = point.date.slice(0, 10);
    if (frequency === "weekly") {
      const day = date.getUTCDay();
      const monday = new Date(date);
      monday.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
      key = monday.toISOString().slice(0, 10);
    } else if (frequency === "monthly") {
      key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
    } else if (frequency === "quarterly") {
      const q = Math.floor(date.getUTCMonth() / 3) * 3;
      key = `${date.getUTCFullYear()}-${String(q + 1).padStart(2, "0")}-01`;
    } else if (frequency === "yearly") {
      key = `${date.getUTCFullYear()}-01-01`;
    }
    const values = buckets.get(key) ?? [];
    values.push(point.value);
    buckets.set(key, values);
  }
  return [...buckets.entries()].map(([date, values]) => {
    const value =
      agg === "sum"
        ? values.reduce((sum, sample) => sum + sample, 0)
        : agg === "min"
          ? Math.min(...values)
          : agg === "max"
            ? Math.max(...values)
            : values.reduce((sum, sample) => sum + sample, 0) / values.length;
    return { date, value };
  });
}

export function fillMissingDaily(
  points: Array<{ date: string; value: number }>,
  method: "leave" | "ffill" | "linear",
) {
  const sorted = sortChronologically(points).points;
  if (sorted.length < 2 || method === "leave") {
    return { points: sorted, inserted: 0, method };
  }
  const filled: Array<{ date: string; value: number }> = [];
  let inserted = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    filled.push(sorted[i]);
    const start = new Date(sorted[i].date);
    const end = new Date(sorted[i + 1].date);
    const gap = Math.round((end.getTime() - start.getTime()) / 86400000) - 1;
    for (let step = 1; step <= gap; step++) {
      const date = addPeriod(start, "daily", step);
      const t = step / (gap + 1);
      const value =
        method === "ffill"
          ? sorted[i].value
          : sorted[i].value + t * (sorted[i + 1].value - sorted[i].value);
      filled.push({ date: date.toISOString().slice(0, 10), value });
      inserted += 1;
    }
  }
  filled.push(sorted.at(-1)!);
  return { points: filled, inserted, method };
}
