export type ArimaFit = {
  differenced: number[];
  acf: number[];
  pacf: number[];
  fitted: number[];
  residuals: number[];
  forecast: number[];
  lower: number[];
  upper: number[];
  coefficients: number[];
  sigma: number;
  aic: number;
  bic: number;
  logLikelihood: number;
};

export function differenceSeries(values: number[], order: number) {
  let result = [...values];
  for (let pass = 0; pass < Math.max(0, Math.round(order)); pass += 1) {
    result = result.slice(1).map((value, index) => value - result[index]);
  }
  return result;
}

export function autocorrelation(values: number[], maxLag: number) {
  const mean =
    values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const denominator =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) || 1;
  return Array.from({ length: Math.max(0, maxLag) + 1 }, (_, lag) => {
    let numerator = 0;
    for (let index = lag; index < values.length; index += 1) {
      numerator += (values[index] - mean) * (values[index - lag] - mean);
    }
    return numerator / denominator;
  });
}

export function partialAutocorrelation(values: number[], maxLag: number) {
  const rho = autocorrelation(values, maxLag);
  const result = [1];
  let previous: number[] = [];
  for (let order = 1; order <= maxLag; order += 1) {
    let numerator = rho[order];
    let denominator = 1;
    for (let j = 1; j < order; j += 1) {
      numerator -= previous[j - 1] * rho[order - j];
      denominator -= previous[j - 1] * rho[j];
    }
    const reflection =
      numerator / (Math.abs(denominator) < 1e-10 ? 1e-10 : denominator);
    const next = Array.from({ length: order }, (_, index) =>
      index === order - 1
        ? reflection
        : previous[index] - reflection * previous[order - index - 2],
    );
    previous = next;
    result.push(Math.max(-1, Math.min(1, reflection)));
  }
  return result;
}

function solve(matrix: number[][], vector: number[]) {
  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  for (let pivot = 0; pivot < augmented.length; pivot += 1) {
    let best = pivot;
    for (let row = pivot + 1; row < augmented.length; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[best][pivot]))
        best = row;
    }
    [augmented[pivot], augmented[best]] = [augmented[best], augmented[pivot]];
    const divisor = augmented[pivot][pivot] || 1e-8;
    for (let column = pivot; column <= augmented.length; column += 1)
      augmented[pivot][column] /= divisor;
    for (let row = 0; row < augmented.length; row += 1) {
      if (row === pivot) continue;
      const factor = augmented[row][pivot];
      for (let column = pivot; column <= augmented.length; column += 1) {
        augmented[row][column] -= factor * augmented[pivot][column];
      }
    }
  }
  return augmented.map((row) => row.at(-1) ?? 0);
}

function regress(features: number[][], targets: number[]) {
  const width = features[0]?.length ?? 0;
  if (!width) return [];
  const gram = Array.from({ length: width }, (_, i) =>
    Array.from(
      { length: width },
      (_, j) =>
        features.reduce((sum, row) => sum + row[i] * row[j], 0) +
        (i === j ? 1e-6 : 0),
    ),
  );
  const rhs = Array.from({ length: width }, (_, i) =>
    features.reduce((sum, row, index) => sum + row[i] * targets[index], 0),
  );
  return solve(gram, rhs);
}

function restoreForecast(original: number[], changes: number[], order: number) {
  if (order <= 0) return [...changes];
  const anchors: number[] = [original.at(-1) ?? 0];
  let current = [...original];
  for (let pass = 1; pass < order; pass += 1) {
    current = differenceSeries(current, 1);
    anchors.push(current.at(-1) ?? 0);
  }
  return changes.map((change) => {
    let value = change;
    for (let pass = order - 1; pass >= 0; pass -= 1) {
      anchors[pass] += value;
      value = anchors[pass];
    }
    return value;
  });
}

export function fitArima(
  values: number[],
  p: number,
  d: number,
  q: number,
  horizon: number,
  confidenceZ = 1.96,
): ArimaFit {
  const source = values.filter(Number.isFinite);
  const differenced = differenceSeries(source, d);
  const arOrder = Math.max(0, Math.min(8, Math.round(p)));
  const maOrder = Math.max(0, Math.min(8, Math.round(q)));
  const start = Math.max(1, arOrder, maOrder);
  let errors = Array(differenced.length).fill(0);
  let coefficients: number[] = [];
  let intercept = 0;

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const features: number[][] = [];
    const targets: number[] = [];
    for (let index = start; index < differenced.length; index += 1) {
      features.push([
        1,
        ...Array.from(
          { length: arOrder },
          (_, lag) => differenced[index - lag - 1] ?? 0,
        ),
        ...Array.from(
          { length: maOrder },
          (_, lag) => errors[index - lag - 1] ?? 0,
        ),
      ]);
      targets.push(differenced[index]);
    }
    coefficients = regress(features, targets);
    intercept = coefficients[0] ?? 0;
    errors = differenced.map((value, index) => {
      if (index < start) return 0;
      const row = [
        1,
        ...Array.from(
          { length: arOrder },
          (_, lag) => differenced[index - lag - 1] ?? 0,
        ),
        ...Array.from(
          { length: maOrder },
          (_, lag) => errors[index - lag - 1] ?? 0,
        ),
      ];
      return (
        value -
        row.reduce(
          (sum, feature, column) => sum + feature * (coefficients[column] ?? 0),
          0,
        )
      );
    });
  }

  const fittedDiff = differenced.map((value, index) => {
    if (index < start) return value;
    const row = [
      1,
      ...Array.from(
        { length: arOrder },
        (_, lag) => differenced[index - lag - 1] ?? 0,
      ),
      ...Array.from(
        { length: maOrder },
        (_, lag) => errors[index - lag - 1] ?? 0,
      ),
    ];
    return row.reduce(
      (sum, feature, column) => sum + feature * (coefficients[column] ?? 0),
      0,
    );
  });
  const history = [...differenced];
  const errorHistory = [...errors];
  const forecastDiff = Array.from(
    { length: Math.max(1, Math.round(horizon)) },
    () => {
      const ar = Array.from(
        { length: arOrder },
        (_, lag) =>
          (coefficients[1 + lag] ?? 0) *
          (history[history.length - lag - 1] ?? 0),
      ).reduce((sum, value) => sum + value, 0);
      const ma = Array.from(
        { length: maOrder },
        (_, lag) =>
          (coefficients[1 + arOrder + lag] ?? 0) *
          (errorHistory[errorHistory.length - lag - 1] ?? 0),
      ).reduce((sum, value) => sum + value, 0);
      const next = intercept + ar + ma;
      history.push(next);
      errorHistory.push(0);
      return next;
    },
  );
  const forecast = restoreForecast(source, forecastDiff, d);
  const usableErrors = errors.slice(start);
  const sigma = Math.sqrt(
    usableErrors.reduce((sum, value) => sum + value * value, 0) /
      Math.max(1, usableErrors.length),
  );
  const lower = forecast.map(
    (value, index) => value - confidenceZ * sigma * Math.sqrt(index + 1),
  );
  const upper = forecast.map(
    (value, index) => value + confidenceZ * sigma * Math.sqrt(index + 1),
  );
  const variance = Math.max(1e-12, sigma * sigma);
  const logLikelihood =
    -0.5 * usableErrors.length * (Math.log(2 * Math.PI * variance) + 1);
  const parameterCount = coefficients.length + 1;
  return {
    differenced,
    acf: autocorrelation(differenced, Math.min(36, differenced.length - 1)),
    pacf: partialAutocorrelation(
      differenced,
      Math.min(36, differenced.length - 1),
    ),
    fitted: fittedDiff,
    residuals: errors,
    forecast,
    lower,
    upper,
    coefficients,
    sigma,
    logLikelihood,
    aic: 2 * parameterCount - 2 * logLikelihood,
    bic:
      Math.log(Math.max(1, usableErrors.length)) * parameterCount -
      2 * logLikelihood,
  };
}
