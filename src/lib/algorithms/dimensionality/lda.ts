export type LDAPriors = "empirical" | "uniform";
export type LDACenter = "class" | "overall";

export interface LDAResult {
  direction: number[];
  scores: number[];
  predictions: number[];
  withinScatter: number[][];
  betweenScatter: number[][];
  eigenvalues: number[];
  accuracy: number;
  explained: number;
  classMeans: number[][];
  scoreMeans: number[];
  withinValue: number;
  betweenValue: number;
}

const zeros = (n: number) => Array.from({ length: n }, () => Array(n).fill(0));
const dot = (a: number[], b: number[]) =>
  a.reduce((sum, value, i) => sum + value * b[i], 0);
function inverse(matrix: number[][]) {
  const n = matrix.length,
    augmented = matrix.map((row, i) =>
      row.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))),
    );
  for (let column = 0; column < n; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < n; row += 1)
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column]))
        pivot = row;
    [augmented[column], augmented[pivot]] = [
      augmented[pivot],
      augmented[column],
    ];
    const divisor = augmented[column][column] || 1e-12;
    augmented[column] = augmented[column].map((value) => value / divisor);
    for (let row = 0; row < n; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map(
        (value, j) => value - factor * augmented[column][j],
      );
    }
  }
  return augmented.map((row) => row.slice(n));
}
const multiply = (a: number[][], b: number[][]) =>
  a.map((row) =>
    b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j], 0)),
  );

export function linearDiscriminantAnalysis(
  X: number[][],
  y: number[],
  regularization = 0,
  priors: LDAPriors = "empirical",
  standardize = true,
  centerMode: LDACenter = "class",
): LDAResult {
  if (X.length !== y.length || X.length < 3)
    throw new Error("LDA requires matching samples and labels.");
  const width = X[0]?.length;
  if (!width || !X.every((row) => row.length === width && row.every(Number.isFinite)) ||
      !y.every(Number.isFinite) || !Number.isFinite(regularization) || regularization < 0)
    throw new Error("LDA requires finite rectangular data and non-negative regularization.");
  const n = X.length,
    d = X[0].length,
    classes = [...new Set(y)].sort((a, b) => a - b);
  if (classes.length < 2) throw new Error("LDA requires at least two classes.");
  const means = Array.from(
      { length: d },
      (_, j) => X.reduce((sum, row) => sum + row[j], 0) / n,
    ),
    scales = Array.from(
      { length: d },
      (_, j) =>
        Math.sqrt(
          X.reduce((sum, row) => sum + (row[j] - means[j]) ** 2, 0) / n,
        ) || 1,
    ),
    data = X.map((row) =>
      row.map((value, j) =>
        standardize ? (value - means[j]) / scales[j] : value,
      ),
    );
  const overall = Array.from(
      { length: d },
      (_, j) => data.reduce((sum, row) => sum + row[j], 0) / n,
    ),
    classMeans = classes.map((label) => {
      const members = data.filter((_, i) => y[i] === label);
      return Array.from(
        { length: d },
        (_, j) =>
          members.reduce((sum, row) => sum + row[j], 0) / members.length,
      );
    });
  const withinScatter = zeros(d),
    betweenScatter = zeros(d);
  data.forEach((row, i) => {
    const classIndex = classes.indexOf(y[i]),
      reference = centerMode === "class" ? classMeans[classIndex] : overall;
    for (let a = 0; a < d; a += 1)
      for (let b = 0; b < d; b += 1)
        withinScatter[a][b] +=
          (row[a] - reference[a]) * (row[b] - reference[b]);
  });
  classes.forEach((label, classIndex) => {
    const count = y.filter((value) => value === label).length,
      weight = priors === "uniform" ? n / classes.length : count,
      delta = classMeans[classIndex].map((value, j) => value - overall[j]);
    for (let a = 0; a < d; a += 1)
      for (let b = 0; b < d; b += 1)
        betweenScatter[a][b] += weight * delta[a] * delta[b];
  });
  const trace = withinScatter.reduce((sum, row, i) => sum + row[i], 0) / d || 1,
    regularized = withinScatter.map((row, i) =>
      row.map(
        (value, j) => value + (i === j ? regularization * trace + 1e-8 : 0),
      ),
    ),
    operator = multiply(inverse(regularized), betweenScatter);
  let direction = Array.from({ length: d }, (_, i) => 1 / (i + 1));
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const next = operator.map((row) => dot(row, direction)),
      length = Math.sqrt(dot(next, next)) || 1;
    direction = next.map((value) => value / length);
  }
  if (
    direction[
      direction.reduce(
        (best, value, i) =>
          Math.abs(value) > Math.abs(direction[best]) ? i : best,
        0,
      )
    ] < 0
  )
    direction = direction.map((value) => -value);
  const scores = data.map((row) => dot(row, direction)),
    scoreMeans = classes.map((label) => {
      const values = scores.filter((_, i) => y[i] === label);
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    }),
    predictions = scores.map((score, i) => {
      let best = -1,
        bestDistance = Infinity;
      for (let j = 0; j < n; j += 1)
        if (j !== i) {
          const delta = Math.abs(score - scores[j]);
          if (delta < bestDistance) {
            bestDistance = delta;
            best = y[j];
          }
        }
      return best;
    }),
    accuracy = predictions.filter((value, i) => value === y[i]).length / n,
    withinValue = dot(
      direction,
      withinScatter.map((row) => dot(row, direction)),
    ),
    betweenValue = dot(
      direction,
      betweenScatter.map((row) => dot(row, direction)),
    ),
    explained = betweenValue / Math.max(1e-12, betweenValue + withinValue);
  const eigenvalues = [
    betweenValue / Math.max(1e-12, withinValue),
    ...Array(Math.max(0, d - 1)).fill(0),
  ];
  return {
    direction,
    scores,
    predictions,
    withinScatter,
    betweenScatter,
    eigenvalues,
    accuracy,
    explained,
    classMeans,
    scoreMeans,
    withinValue,
    betweenValue,
  };
}
