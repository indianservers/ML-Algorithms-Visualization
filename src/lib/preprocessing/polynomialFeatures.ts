export type NumericRow = Record<string, number>;

export type PolynomialTerm = { name: string; powers: number[] };

function compositions(
  total: number,
  width: number,
  prefix: number[] = [],
): number[][] {
  if (width === 0) return total === 0 ? [prefix] : [];
  if (width === 1) return [[...prefix, total]];
  const out: number[][] = [];
  for (let value = total; value >= 0; value--)
    out.push(...compositions(total - value, width - 1, [...prefix, value]));
  return out;
}

export function polynomialTerms(
  features: string[],
  degree: number,
  includeBias = true,
  interactions = true,
): PolynomialTerm[] {
  if (!Number.isInteger(degree) || degree < 0)
    throw new Error("Polynomial degree must be a non-negative integer.");
  if (!features.length)
    return includeBias ? [{ name: "1", powers: [] }] : [];
  const terms: PolynomialTerm[] = includeBias
    ? [{ name: "1", powers: features.map(() => 0) }]
    : [];
  for (let d = 1; d <= degree; d++) {
    for (const powers of compositions(d, features.length)) {
      if (!interactions && powers.filter(Boolean).length > 1) continue;
      const parts = powers.flatMap((power, index) =>
        power ? [`${features[index]}${power > 1 ? `^${power}` : ""}`] : [],
      );
      terms.push({ name: parts.join(" × "), powers });
    }
  }
  return terms;
}

export function expandPolynomial(
  rows: NumericRow[],
  features: string[],
  degree: number,
  includeBias = true,
  interactions = true,
  scaling: "none" | "standardize" = "none",
) {
  const terms = polynomialTerms(features, degree, includeBias, interactions);
  const matrix = rows.map((row) =>
    terms.map((term) =>
      term.powers.reduce(
        (value, power, index) => value * row[features[index]] ** power,
        1,
      ),
    ),
  );
  if (scaling === "standardize" && matrix.length) {
    for (let column = 0; column < terms.length; column++) {
      if (terms[column].name === "1") continue;
      const mean =
        matrix.reduce((sum, row) => sum + row[column], 0) / matrix.length;
      const sd =
        Math.sqrt(
          matrix.reduce((sum, row) => sum + (row[column] - mean) ** 2, 0) /
            matrix.length,
        ) || 1;
      for (const row of matrix) row[column] = (row[column] - mean) / sd;
    }
  }
  return { terms, matrix };
}

function solve(a: number[][], b: number[]) {
  const n = b.length,
    aug = a.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++)
      if (Math.abs(aug[j][i]) > Math.abs(aug[pivot][i])) pivot = j;
    [aug[i], aug[pivot]] = [aug[pivot], aug[i]];
    const divisor = aug[i][i] || 1e-9;
    for (let k = i; k <= n; k++) aug[i][k] /= divisor;
    for (let j = 0; j < n; j++)
      if (j !== i) {
        const factor = aug[j][i];
        for (let k = i; k <= n; k++) aug[j][k] -= factor * aug[i][k];
      }
  }
  return aug.map((row) => row[n]);
}

export function fitPolynomial(
  rows: NumericRow[],
  target: string,
  features: string[],
  degree: number,
  interactions = true,
) {
  const { matrix, terms } = expandPolynomial(
    rows,
    features,
    degree,
    true,
    interactions,
    "standardize",
  );
  const y = rows.map((row) => row[target]);
  const p = terms.length,
    xtx = Array.from({ length: p }, () => Array(p).fill(0)),
    xty = Array(p).fill(0);
  for (let i = 0; i < matrix.length; i++)
    for (let j = 0; j < p; j++) {
      xty[j] += matrix[i][j] * y[i];
      for (let k = 0; k < p; k++) xtx[j][k] += matrix[i][j] * matrix[i][k];
    }
  for (let j = 1; j < p; j++) xtx[j][j] += 1e-5;
  const weights = solve(xtx, xty),
    predictions = matrix.map((row) =>
      row.reduce((sum, value, i) => sum + value * weights[i], 0),
    );
  const mean = y.reduce((a, b) => a + b, 0) / y.length;
  const errors = predictions.map((value, i) => value - y[i]);
  const mse = errors.reduce((sum, value) => sum + value * value, 0) / y.length;
  const total = y.reduce((sum, value) => sum + (value - mean) ** 2, 0) || 1;
  return {
    terms,
    predictions,
    weights,
    r2: 1 - errors.reduce((sum, value) => sum + value * value, 0) / total,
    rmse: Math.sqrt(mse),
    mae: errors.reduce((sum, value) => sum + Math.abs(value), 0) / y.length,
  };
}
