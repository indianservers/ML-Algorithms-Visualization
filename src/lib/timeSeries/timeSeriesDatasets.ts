import type { TimeFrequency } from "./timeSeriesSplit";

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface TimeSeriesCatalogItem {
  id: string;
  name: string;
  description: string;
  frequency: TimeFrequency;
  points: TimeSeriesPoint[];
  knownAnomalyIndexes?: number[];
}

const rng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

function monthly(start: string, n: number, value: (i: number) => number): TimeSeriesPoint[] {
  const date = new Date(start);
  return Array.from({ length: n }, (_, i) => {
    const current = new Date(date);
    current.setMonth(date.getMonth() + i);
    return { date: current.toISOString().slice(0, 10), value: value(i) };
  });
}

function daily(start: string, n: number, value: (i: number) => number): TimeSeriesPoint[] {
  const date = new Date(start);
  return Array.from({ length: n }, (_, i) => {
    const current = new Date(date);
    current.setDate(date.getDate() + i);
    return { date: current.toISOString().slice(0, 10), value: value(i) };
  });
}

export const TIME_SERIES_CATALOG: TimeSeriesCatalogItem[] = [
  {
    id: "linear-trend",
    name: "Linear trend",
    description: "y_t = 10 + 0.4 t + noise",
    frequency: "daily",
    points: daily("2024-01-01", 120, (i) => 10 + 0.4 * i + ((i * 17) % 7) / 10),
  },
  {
    id: "pure-seasonal",
    name: "Pure seasonal (period 12)",
    description: "Repeating 12-step seasonal pattern",
    frequency: "monthly",
    points: monthly("2018-01-01", 96, (i) => [10, 14, 18, 22, 20, 16, 12, 9, 8, 11, 15, 19][i % 12]),
  },
  {
    id: "trend-seasonal",
    name: "Trend + seasonality",
    description: "Holt-Winters style monthly series",
    frequency: "monthly",
    points: monthly(
      "2016-01-01",
      84,
      (i) => 40 + 0.35 * i + 12 * Math.sin((2 * Math.PI * i) / 12),
    ),
  },
  {
    id: "nonstationary-trend",
    name: "Non-stationary trend",
    description: "Quadratic drift for differencing",
    frequency: "daily",
    points: daily("2023-01-01", 100, (i) => 5 + 0.02 * i * i),
  },
  {
    id: "autoregressive",
    name: "AR(1) process",
    description: "y_t ≈ 0.8 y_{t-1} + noise",
    frequency: "daily",
    points: (() => {
      const random = rng(11);
      const values = [0];
      for (let i = 1; i < 120; i++) values.push(0.8 * values[i - 1] + (random() - 0.5));
      return daily("2024-01-01", 120, (i) => values[i]);
    })(),
  },
  {
    id: "moving-average-process",
    name: "MA(1) process",
    description: "y_t = e_t + 0.6 e_{t-1}",
    frequency: "daily",
    points: (() => {
      const random = rng(21);
      const e = Array.from({ length: 121 }, () => random() - 0.5);
      return daily("2024-01-01", 120, (i) => e[i + 1] + 0.6 * e[i]);
    })(),
  },
  {
    id: "structural-break",
    name: "Level-shift series",
    description: "Mean 20 then mean 50",
    frequency: "daily",
    points: daily("2024-01-01", 80, (i) => (i < 40 ? 20 : 50) + ((i * 3) % 5) / 10),
  },
  {
    id: "spike-anomalies",
    name: "Known spike anomalies",
    description: "Spikes at indexes 40, 78, 110",
    frequency: "daily",
    knownAnomalyIndexes: [40, 78, 110],
    points: daily("2024-01-01", 140, (i) => {
      const base = 30 + 4 * Math.sin(i / 6);
      if (i === 40 || i === 78 || i === 110) return base + 28;
      return base;
    }),
  },
  {
    id: "level-shift-anomaly",
    name: "Persistent level shift",
    description: "Sudden lasting mean change",
    frequency: "daily",
    points: daily("2024-03-01", 90, (i) => (i < 45 ? 12 : 31)),
  },
  {
    id: "multi-seasonal",
    name: "Two seasonal-like cycles",
    description: "Period 7 and period 28 mixed",
    frequency: "daily",
    points: daily(
      "2024-01-01",
      112,
      (i) => 50 + 8 * Math.sin((2 * Math.PI * i) / 7) + 5 * Math.sin((2 * Math.PI * i) / 28),
    ),
  },
  {
    id: "sine-wave",
    name: "Sine wave",
    description: "Clean periodic signal for recurrent labs",
    frequency: "hourly",
    points: daily("2024-01-01", 96, (i) => Math.sin((2 * Math.PI * i) / 12)),
  },
  {
    id: "sales-monthly",
    name: "Sales-like monthly",
    description: "date, sales with trend and season",
    frequency: "monthly",
    points: monthly("2019-01-01", 60, (i) => 200 + 3 * i + 40 * Math.sin((2 * Math.PI * i) / 12)),
  },
  {
    id: "daily-demand",
    name: "Daily demand with weekday",
    description: "Weekday structure",
    frequency: "daily",
    points: daily("2024-01-01", 84, (i) => {
      const weekday = (i + 1) % 7;
      return 80 + (weekday === 0 || weekday === 6 ? -18 : 8) + 4 * Math.sin(i / 5);
    }),
  },
  {
    id: "missing-timestamps",
    name: "Series with missing days",
    description: "Daily series with 7 dropped dates",
    frequency: "daily",
    points: daily("2024-01-01", 40, (i) => 15 + i).filter((_, i) => ![4, 5, 12, 18, 19, 27, 33].includes(i)),
  },
  {
    id: "irregular-intervals",
    name: "Irregular intervals",
    description: "Uneven spacing for warning tests",
    frequency: "unknown",
    points: [
      { date: "2024-01-01", value: 3 },
      { date: "2024-01-02", value: 4 },
      { date: "2024-01-08", value: 5 },
      { date: "2024-01-09", value: 6 },
      { date: "2024-02-01", value: 9 },
    ],
  },
  {
    id: "constant",
    name: "Constant series",
    description: "All values equal 10",
    frequency: "daily",
    points: daily("2024-01-01", 24, () => 10),
  },
  {
    id: "integer-trend",
    name: "Integer trend 1..100",
    description: "y_t = t",
    frequency: "daily",
    points: daily("2024-01-01", 100, (i) => i + 1),
  },
  {
    id: "seasonal-block",
    name: "Repeating 10,20,30,40",
    description: "Period 4 seasonal block",
    frequency: "quarterly",
    points: monthly("2020-01-01", 40, (i) => [10, 20, 30, 40][i % 4]),
  },
];

export function getTimeSeriesDataset(id: string) {
  const found = TIME_SERIES_CATALOG.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown time-series dataset: ${id}`);
  return found;
}

export function seriesValues(item: TimeSeriesCatalogItem) {
  return item.points.map((point) => point.value);
}

export function timeSeriesCatalogTables() {
  return TIME_SERIES_CATALOG.map((item) => ({
    id: `ts-${item.id}`,
    name: item.name,
    description: item.description,
    type: "timeSeries" as const,
    columns: ["date", "value"],
    data: item.points.map((point) => ({ date: point.date, value: point.value })),
  }));
}
