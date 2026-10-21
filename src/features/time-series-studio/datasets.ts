import { TIME_SERIES_CATALOG } from "../../lib/timeSeries/timeSeriesDatasets";
import {
  parseCSV,
  type ParsedDataset,
} from "../../lib/preprocessing/datasetIO";
import {
  resolveDuplicateTimestamps,
  resampleSeries,
} from "../../lib/timeSeries/timeSeriesPrep";
import type { TimeFrequency } from "../../lib/timeSeries/timeSeriesSplit";
import sunspots from "./sunspots.csv?raw";
import co2 from "./co2.csv?raw";
import nile from "./nile.csv?raw";
export type StudioDataset = {
  id: string;
  name: string;
  description: string;
  frequency: TimeFrequency;
  period: number;
  unit: string;
  source: string;
  sourceUrl?: string;
  license: string;
  synthetic: boolean;
  table: ParsedDataset;
  dateColumn: string;
  target: string;
  knownAnomalies?: number[];
};
const historical = (
  id: string,
  name: string,
  raw: string,
  frequency: TimeFrequency,
  period: number,
  unit: string,
  description: string,
): StudioDataset => {
  const table = parseCSV(raw);
  table.data = table.data.map((row) => {
    const stamp = String(row[table.columns[0]]);
    return {
      ...row,
      [table.columns[0]]:
        stamp.length === 8
          ? `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`
          : `${stamp}-01-01`,
    };
  });
  return {
    id,
    name,
    description,
    frequency,
    period,
    unit,
    source: "statsmodels dataset collection; original observations retained",
    sourceUrl: `https://www.statsmodels.org/stable/datasets/generated/${id}.html`,
    license: "Public domain (see source documentation)",
    synthetic: false,
    table,
    dateColumn: table.columns[0],
    target: table.columns[1],
  };
};
export const STUDIO_DATASETS: StudioDataset[] = [
  ...TIME_SERIES_CATALOG.filter((d) => d.points.length >= 24).map((d) => ({
    id: d.id,
    name: `Synthetic · ${d.name}`,
    description: d.description,
    frequency: inferFrequency(d.points.map((p) => p.date)),
    period:
      d.id === "sine-wave" || d.frequency === "monthly"
        ? 12
        : d.id === "seasonal-block"
          ? 4
          : 7,
    unit: "value",
    source: "Deterministic local generator; educational simulation",
    license: "Project-generated synthetic data",
    synthetic: true,
    table: {
      columns: ["date", "value"],
      data: d.points.map((p) => ({ ...p })),
    },
    dateColumn: "date",
    target: "value",
    knownAnomalies: d.knownAnomalyIndexes,
  })),
  historical(
    "sunspots",
    "Sunspots · annual, 1700–2008",
    sunspots,
    "yearly",
    11,
    "sunspots",
    "National Geophysical Data Center annual sunspot activity. Cycles are not perfectly periodic.",
  ),
  historical(
    "nile",
    "Nile river flow · 1871–1970",
    nile,
    "yearly",
    1,
    "10⁸ m³",
    "Annual flow at Aswan, including a structural change near 1898.",
  ),
  historical(
    "co2",
    "Mauna Loa CO₂ · weekly, 1958–2001",
    co2,
    "weekly",
    52,
    "ppmv",
    "Keeling & Whorf (2004), CDIAC. Missing observations are preserved; choose a missing-value policy before fitting.",
  ),
];
export type DataPolicy = {
  missing: "reject" | "linear" | "forward";
  duplicates: "reject" | "keep-first" | "keep-last" | "mean";
  resample: TimeFrequency | "original";
};
export const DEFAULT_POLICY: DataPolicy = {
  missing: "reject",
  duplicates: "reject",
  resample: "original",
};
export function inferFrequency(dates: string[]): TimeFrequency {
  const gaps = dates
    .slice(1)
    .map((d, i) => (Date.parse(d) - Date.parse(dates[i])) / 86400000)
    .filter((g) => g > 0)
    .sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)] ?? 0;
  if (median > 0.03 && median < 0.06) return "hourly";
  if (median === 1) return "daily";
  if (median === 7) return "weekly";
  if (median >= 28 && median <= 31) return "monthly";
  if (median >= 89 && median <= 92) return "quarterly";
  if (median >= 365 && median <= 366) return "yearly";
  return "unknown";
}
function nextStamp(stamp: string, frequency: TimeFrequency) {
  const d = new Date(stamp);
  if (frequency === "hourly") d.setUTCHours(d.getUTCHours() + 1);
  else if (frequency === "daily") d.setUTCDate(d.getUTCDate() + 1);
  else if (frequency === "weekly") d.setUTCDate(d.getUTCDate() + 7);
  else if (frequency === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  else if (frequency === "quarterly") d.setUTCMonth(d.getUTCMonth() + 3);
  else if (frequency === "yearly") d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString();
}
function fillMissing(
  points: Array<{ date: string; value: number }>,
  policy: DataPolicy["missing"],
) {
  const count = points.filter((p) => !Number.isFinite(p.value)).length;
  if (count && policy === "reject")
    throw new Error(
      `${count} missing or nonnumeric observations. Choose an explicit interpolation policy.`,
    );
  return points.map((p, i) => {
    if (Number.isFinite(p.value)) return { ...p };
    let left = i - 1,
      right = i + 1;
    while (left >= 0 && !Number.isFinite(points[left].value)) left--;
    while (right < points.length && !Number.isFinite(points[right].value))
      right++;
    if (policy === "forward") {
      if (left < 0)
        throw new Error("Forward fill cannot fill leading missing values.");
      return { ...p, value: points[left].value };
    }
    if (left < 0 || right >= points.length)
      throw new Error(
        "Linear interpolation requires observed values on both sides.",
      );
    const fraction =
      (Date.parse(p.date) - Date.parse(points[left].date)) /
      (Date.parse(points[right].date) - Date.parse(points[left].date));
    return {
      ...p,
      value:
        points[left].value +
        fraction * (points[right].value - points[left].value),
    };
  });
}
export function prepareDataset(
  dataset: StudioDataset,
  target: string,
  dateColumn: string,
  policy: DataPolicy,
) {
  let points = dataset.table.data.map((row, index) => {
    const raw = String(row[dateColumn] ?? "");
    const date = new Date(raw);
    const iso = /^\d{4}(?:-\d{2}-\d{2}(?:[T ][0-9:.Z+-]+)?)?$/.test(raw);
    const calendar =
      raw.length >= 10 ? new Date(raw.slice(0, 10) + "T00:00:00Z") : date;
    const validCalendar =
      raw.length < 10 ||
      (Number.isFinite(calendar.getTime()) &&
        calendar.toISOString().slice(0, 10) === raw.slice(0, 10));
    if (!iso || !validCalendar || !Number.isFinite(date.getTime()))
      throw new Error(
        `Row ${index + 2}: invalid timestamp in ${dateColumn}. Use ISO dates.`,
      );
    const value = row[target];
    return {
      date: date.toISOString(),
      value: typeof value === "number" ? value : NaN,
    };
  });
  points.sort((a, b) => a.date.localeCompare(b.date));
  const duplicates = points.length - new Set(points.map((p) => p.date)).size;
  if (duplicates && policy.duplicates === "reject")
    throw new Error(
      `${duplicates} duplicate timestamps. Choose an explicit duplicate policy.`,
    );
  if (duplicates)
    points = resolveDuplicateTimestamps(
      points,
      policy.duplicates === "reject" ? "keep-first" : policy.duplicates,
    ).points;
  const missing = points.filter((p) => !Number.isFinite(p.value)).length;
  points = fillMissing(points, policy.missing);
  if (policy.resample !== "original")
    points = resampleSeries(points, policy.resample, "mean").map((p) => ({
      ...p,
      date: new Date(p.date).toISOString(),
    }));
  const frequency =
    policy.resample === "original"
      ? inferFrequency(points.map((p) => p.date))
      : policy.resample;
  let gaps = 0;
  if (frequency !== "unknown" && points.length) {
    const byStamp = new Map(points.map((p) => [p.date, p.value]));
    const grid = [];
    let stamp = points[0].date;
    const last = points.at(-1)!.date;
    while (stamp <= last && grid.length <= 20000) {
      if (!byStamp.has(stamp)) gaps++;
      grid.push({ date: stamp, value: byStamp.get(stamp) ?? NaN });
      stamp = nextStamp(stamp, frequency);
    }
    if (policy.resample !== "original")
      points = fillMissing(grid, policy.missing);
  }
  if (points.length < 12)
    throw new Error("At least 12 valid observations are needed.");
  if (points.length > 20000)
    throw new Error(
      "Choose at most 20,000 records for this browser workspace. Resample or upload a smaller period.",
    );
  return {
    points,
    missing,
    duplicates,
    frequency,
    gaps,
    regular:
      frequency !== "unknown" && (gaps === 0 || policy.resample !== "original"),
  };
}

export function uploadDataset(name: string, text: string): StudioDataset {
  const table = parseCSV(text.replace(/^\uFEFF/, ""));
  if (table.columns.length < 2 || table.data.length < 12)
    throw new Error(
      "CSV needs a header, a timestamp column, a numeric target, and at least 12 rows.",
    );
  const dateColumn =
    table.columns.find((c) => /date|time|year|period/i.test(c)) ??
    table.columns[0];
  const target =
    table.columns.find(
      (c) =>
        c !== dateColumn && table.data.some((r) => typeof r[c] === "number"),
    ) ?? table.columns[1];
  return {
    id: `upload-${Date.now()}`,
    name,
    description:
      "Your local CSV. Review column mapping and validation before fitting.",
    frequency: "unknown",
    period: 7,
    unit: "value",
    source:
      "User upload; stays in this browser unless you explicitly export it",
    license: "Provided by the uploader",
    synthetic: false,
    table,
    dateColumn,
    target,
  };
}
export function download(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
