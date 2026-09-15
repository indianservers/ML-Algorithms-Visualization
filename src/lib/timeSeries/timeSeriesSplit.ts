export type TimeFrequency =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "unknown";

export interface ChronologicalSplit<T> {
  train: T[];
  validation: T[];
  test: T[];
  trainEnd: number;
  validationEnd: number;
}

export function chronologicalSplit<T>(
  series: T[],
  trainRatio = 0.7,
  validationRatio = 0.15,
): ChronologicalSplit<T> {
  if (series.length < 3) {
    return {
      train: [...series],
      validation: [],
      test: [],
      trainEnd: series.length,
      validationEnd: series.length,
    };
  }
  const trainEnd = Math.max(1, Math.floor(series.length * trainRatio));
  const validationEnd = Math.min(
    series.length,
    Math.max(trainEnd + 1, Math.floor(series.length * (trainRatio + validationRatio))),
  );
  return {
    train: series.slice(0, trainEnd),
    validation: series.slice(trainEnd, validationEnd),
    test: series.slice(validationEnd),
    trainEnd,
    validationEnd,
  };
}

export function walkForwardOrigins(
  length: number,
  minTrain: number,
  horizon = 1,
): number[] {
  const origins: number[] = [];
  for (let origin = minTrain; origin + horizon <= length; origin += 1) {
    origins.push(origin);
  }
  return origins;
}

export function addPeriod(date: Date, frequency: TimeFrequency, steps = 1) {
  const next = new Date(date.getTime());
  const n = Math.round(steps);
  if (frequency === "hourly") next.setHours(next.getHours() + n);
  else if (frequency === "daily") next.setDate(next.getDate() + n);
  else if (frequency === "weekly") next.setDate(next.getDate() + 7 * n);
  else if (frequency === "monthly") next.setMonth(next.getMonth() + n);
  else if (frequency === "quarterly") next.setMonth(next.getMonth() + 3 * n);
  else if (frequency === "yearly") next.setFullYear(next.getFullYear() + n);
  else next.setDate(next.getDate() + n);
  return next;
}

export function futureTimestamps(
  last: Date | string,
  horizon: number,
  frequency: TimeFrequency,
): Date[] {
  const start = last instanceof Date ? last : new Date(last);
  if (Number.isNaN(start.getTime())) throw new Error("Last timestamp is not a valid date.");
  return Array.from({ length: Math.max(0, Math.round(horizon)) }, (_, i) =>
    addPeriod(start, frequency, i + 1),
  );
}

export function buildSequenceWindows(values: number[], lookback: number) {
  const width = Math.round(lookback);
  if (!Number.isInteger(width) || width < 1) {
    throw new Error("Lookback must be a positive integer.");
  }
  if (values.length <= width) {
    return { inputs: [] as number[][], targets: [] as number[] };
  }
  const inputs: number[][] = [];
  const targets: number[] = [];
  for (let i = 0; i + width < values.length; i++) {
    inputs.push(values.slice(i, i + width));
    targets.push(values[i + width]);
  }
  return { inputs, targets };
}

export function trainOnlyScaler(train: number[]) {
  const finite = train.filter(Number.isFinite);
  if (!finite.length) throw new Error("Scaler requires finite training observations.");
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min;
  const degenerate = span < 1e-12;
  return {
    min,
    max,
    degenerate,
    encode: (value: number) => (degenerate ? 0 : (value - min) / Math.max(span, 1e-6)),
    decode: (value: number) => (degenerate ? min : value * Math.max(span, 1e-6) + min),
  };
}

export function leakageInvariant(
  train: number[],
  future: number[],
  fit: (series: number[]) => number[],
  epsilon = 1e-9,
) {
  const a = fit(train);
  const b = fit([...train, ...future]);
  return a.every(
    (value, i) =>
      (!Number.isFinite(value) && !Number.isFinite(b[i])) ||
      Math.abs(value - (b[i] ?? Number.NaN)) <= epsilon,
  );
}
