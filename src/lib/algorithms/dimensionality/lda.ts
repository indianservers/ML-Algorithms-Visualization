export type LDAPriors = "empirical" | "uniform";
export type LDACenter = "class" | "overall";

export const LDA_TARGET_ERROR =
  "LDA dimensionality reduction requires a categorical class target with at least two classes.";

export interface LDAResult {
  direction: number[];
  components: number[][];
  scores: number[];
  projections: number[][];
  predictions: number[];
  withinScatter: number[][];
  betweenScatter: number[][];
  eigenvalues: number[];
  discriminativeRatio: number[];
  accuracy: number;
  explained: number;
  classMeans: number[][];
  scoreMeans: number[];
  withinValue: number;
  betweenValue: number;
  maxComponents: number;
  featureMeans: number[];
  featureScales: number[];
  standardize: boolean;
  classes: number[];
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

export function maxLdaComponents(nFeatures: number, nClasses: number) {
  return Math.max(0, Math.min(nFeatures, nClasses - 1));
}

function powerDirections(operator: number[][], count: number) {
  const d = operator.length;
  const work = operator.map((row) => [...row]);
  const vectors: number[][] = [];
  const values: number[] = [];
  for (let k = 0; k < count; k += 1) {
    let direction = Array.from({ length: d }, (_, i) => Math.sin((k + 1) * (i + 1) * 1.32));
    for (let iteration = 0; iteration < 120; iteration += 1) {
      const next = work.map((row) => dot(row, direction));
      const length = Math.sqrt(dot(next, next)) || 1;
      direction = next.map((value) => value / length);
    }
    const pivot = direction.reduce(
      (best, value, i) => (Math.abs(value) > Math.abs(direction[best]) ? i : best),
      0,
    );
    if (direction[pivot] < 0) direction = direction.map((value) => -value);
    const Av = work.map((row) => dot(row, direction));
    const eigenvalue = Math.max(0, dot(direction, Av));
    vectors.push(direction);
    values.push(eigenvalue);
    for (let i = 0; i < d; i += 1)
      for (let j = 0; j < d; j += 1)
        work[i][j] -= eigenvalue * direction[i] * direction[j];
  }
  return { vectors, values };
}

export function linearDiscriminantAnalysis(
  X: number[][],
  y: number[],
  regularization = 0,
  priors: LDAPriors = "empirical",
  standardize = true,
  centerMode: LDACenter = "class",
  nComponents?: number,
): LDAResult {
  if (X.length !== y.length || X.length < 3)
    throw new Error(LDA_TARGET_ERROR);
  const width = X[0]?.length;
  if (!width || !X.every((row) => row.length === width && row.every(Number.isFinite)) ||
      !y.every(Number.isFinite) || !Number.isFinite(regularization) || regularization < 0)
    throw new Error("LDA requires finite rectangular data and non-negative regularization.");
  const n = X.length,
    d = X[0].length,
    classes = [...new Set(y)].sort((a, b) => a - b);
  if (classes.length < 2 || classes.length === n) throw new Error(LDA_TARGET_ERROR);
  const maxComponents = maxLdaComponents(d, classes.length);
  if (maxComponents < 1) throw new Error(LDA_TARGET_ERROR);
  const requested = nComponents ?? maxComponents;
  if (!Number.isInteger(requested) || requested < 1)
    throw new Error("LDA component count must be a positive integer.");
  const kept = Math.min(requested, maxComponents);
  const featureMeans = Array.from(
      { length: d },
      (_, j) => X.reduce((sum, row) => sum + row[j], 0) / n,
    ),
    featureScales = Array.from(
      { length: d },
      (_, j) =>
        Math.sqrt(
          X.reduce((sum, row) => sum + (row[j] - featureMeans[j]) ** 2, 0) / n,
        ) || 1,
    ),
    data = X.map((row) =>
      row.map((value, j) =>
        standardize ? (value - featureMeans[j]) / featureScales[j] : value,
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
  void centerMode;
  const withinScatter = zeros(d),
    betweenScatter = zeros(d);
  data.forEach((row, i) => {
    const classIndex = classes.indexOf(y[i]),
      reference = classMeans[classIndex] ?? overall;
    for (let a = 0; a < d; a += 1)
      for (let b = 0; b < d; b += 1)
        withinScatter[a][b] +=
          (row[a] - reference[a]) * (row[b] - reference[b]);
  });
  classes.forEach((label, classIndex) => {
    const count = y.filter((value) => value === label).length,
      weight = count,
      delta = classMeans[classIndex].map((value, j) => value - overall[j]);
    for (let a = 0; a < d; a += 1)
      for (let b = 0; b < d; b += 1)
        betweenScatter[a][b] += weight * delta[a] * delta[b];
  });
  const rankRisk = n <= d + classes.length;
  const trace = withinScatter.reduce((sum, row, i) => sum + row[i], 0) / d || 1,
    ridge = regularization * trace + (rankRisk ? 1e-2 * trace : 1e-8),
    regularized = withinScatter.map((row, i) =>
      row.map((value, j) => value + (i === j ? ridge : 0)),
    ),
    operator = multiply(inverse(regularized), betweenScatter);
  const { vectors, values } = powerDirections(operator, kept);
  const direction = vectors[0];
  const projections = data.map((row) => vectors.map((vector) => dot(row, vector)));
  const scores = projections.map((row) => row[0]);
  const scoreMeans = classes.map((label) => {
      const valuesForClass = scores.filter((_, i) => y[i] === label);
      return valuesForClass.reduce((sum, value) => sum + value, 0) / valuesForClass.length;
    }),
    predictions = projections.map((point) => {
      let best = classes[0];
      let bestDistance = Infinity;
      classes.forEach((label, classIndex) => {
        const members = projections.filter((_, i) => y[i] === label);
        const centroid = point.map((_, dim) =>
          members.reduce((sum, row) => sum + row[dim], 0) / members.length,
        );
        const prior =
          priors === "uniform"
            ? 1 / classes.length
            : members.length / n;
        const distance =
          point.reduce((sum, value, dim) => sum + (value - centroid[dim]) ** 2, 0) -
          2 * Math.log(Math.max(1e-12, prior));
        if (distance < bestDistance) {
          bestDistance = distance;
          best = label;
        }
      });
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
  const valueSum = values.reduce((sum, value) => sum + value, 0) || 1;
  return {
    direction,
    components: vectors,
    scores,
    projections,
    predictions,
    withinScatter,
    betweenScatter,
    eigenvalues: values,
    discriminativeRatio: values.map((value) => value / valueSum),
    accuracy,
    explained,
    classMeans,
    scoreMeans,
    withinValue,
    betweenValue,
    maxComponents,
    featureMeans,
    featureScales,
    standardize,
    classes,
  };
}

export function transformLda(Xnew: number[][], model: LDAResult) {
  const scaled = Xnew.map((row) =>
    row.map((value, j) =>
      model.standardize ? (value - model.featureMeans[j]) / model.featureScales[j] : value,
    ),
  );
  return scaled.map((row) => model.components.map((vector) => dot(row, vector)));
}
