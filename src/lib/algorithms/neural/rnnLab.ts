import {
  gruMachineLoadDataset,
  lstmRetailDemandDataset,
  recurrentTrafficDataset,
  timeSeriesSalesDataset,
  weatherDailyDataset,
} from "../../../data/sampleDatasets";

export type RnnLabKind = "text" | "series";

export interface RnnLabDataset {
  id: string;
  name: string;
  kind: RnnLabKind;
  blurb: string;
  tokens: string[];
  values: number[];
  extras: number[];
  labels: string[];
  featureNames: string[];
}

function takeColumn(rows: Array<Record<string, unknown>>, column: string, count: number) {
  const values = rows
    .map((row) => Number(row[column]))
    .filter((value) => Number.isFinite(value));
  return values.slice(Math.max(0, values.length - count));
}

function takeLabels(rows: Array<Record<string, unknown>>, column: string, count: number) {
  return rows
    .map((row) => String(row[column] ?? ""))
    .slice(Math.max(0, rows.length - count));
}

function series(
  id: string,
  name: string,
  blurb: string,
  rows: Array<Record<string, unknown>>,
  valueCol: string,
  labelCol: string,
  extraCol?: string,
  count = 24,
): RnnLabDataset {
  const values = takeColumn(rows, valueCol, count);
  const extras = extraCol ? takeColumn(rows, extraCol, count) : [];
  return {
    id,
    name,
    kind: "series",
    blurb,
    tokens: values.map((value) => String(value)),
    values,
    extras: extras.slice(0, values.length),
    labels: takeLabels(rows, labelCol, values.length),
    featureNames: extraCol ? [valueCol, extraCol] : [valueCol],
  };
}

function text(id: string, name: string, blurb: string, sentence: string): RnnLabDataset {
  const tokens = sentence.trim().split(/\s+/).filter(Boolean);
  return {
    id,
    name,
    kind: "text",
    blurb,
    tokens,
    values: tokens.map((_, index) => index),
    extras: [],
    labels: tokens.map((_, index) => `t${index}`),
    featureNames: ["token"],
  };
}

export function buildRnnDatasets(): RnnLabDataset[] {
  return [
    text(
      "nursery",
      "Nursery next-token",
      "Tiny language model: predict the next word in a repeating rhyme.",
      "the cat sat on the mat the cat sat on the rug the dog sat on the mat",
    ),
    text(
      "weather-phrase",
      "Weather caption tokens",
      "Short weather captions. Order matters: rain should follow clouds, not shuffle.",
      "clouds gather then rain falls over green hills then sun returns",
    ),
    series(
      "weather",
      "Daily temperature",
      "760-day weather table, last 24 readings. Target is tomorrow's °C.",
      weatherDailyDataset.data as Array<Record<string, unknown>>,
      "temperature_c",
      "day",
      "rainfall_mm",
      24,
    ),
    series(
      "traffic",
      "Hourly web traffic",
      "Business-hour visits with weekend drop. Target is the next hour's visits.",
      recurrentTrafficDataset.data as Array<Record<string, unknown>>,
      "visits",
      "hour",
      "conversions",
      24,
    ),
    series(
      "sales",
      "Monthly sales",
      "Seasonal retail sales with holiday spikes. Target is next month's sales.",
      timeSeriesSalesDataset.data as Array<Record<string, unknown>>,
      "sales",
      "month",
      undefined,
      24,
    ),
    series(
      "retail",
      "Weekly retail demand",
      "Weekly orders with promo pulses. Target is next week's orders.",
      lstmRetailDemandDataset.data as Array<Record<string, unknown>>,
      "orders",
      "week",
      "promo_index",
      24,
    ),
    series(
      "machine",
      "Machine load",
      "Shift-cycle load. A vanilla RNN should follow the cycle and struggle on long lags.",
      gruMachineLoadDataset.data as Array<Record<string, unknown>>,
      "load_kw",
      "minute",
      "temperature_c",
      24,
    ),
  ];
}

export const RNN_DATASETS = buildRnnDatasets();
