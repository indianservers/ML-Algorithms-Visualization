export type CVMetric = "accuracy" | "precision" | "recall" | "f1";
export interface CVRow {
  features: number[];
  label: number;
}
export interface FoldResult {
  fold: number;
  trainIndices: number[];
  validationIndices: number[];
  score: number;
  predictions: number[];
}
export interface CVResult {
  folds: FoldResult[];
  mean: number;
  variance: number;
  standardDeviation: number;
}

const shuffled = (values: number[], seed: number) => {
  const result = [...values];
  let state = seed >>> 0;
  const random = () =>
    (state = (1664525 * state + 1013904223) >>> 0) / 4294967296;
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const distance = (a: number[], b: number[]) =>
  Math.sqrt(a.reduce((sum, value, i) => sum + (value - b[i]) ** 2, 0));

export function crossValidate(
  rows: CVRow[],
  k = 5,
  stratify = true,
  shuffle = true,
  seed = 42,
  metric: CVMetric = "accuracy",
): CVResult {
  if (rows.length < 2) throw new Error("Cross-validation requires at least two rows");
  if (!Number.isInteger(k) || k < 2 || k > rows.length)
    throw new Error("Fold count must be an integer between 2 and the row count");
  const width = rows[0].features.length;
  if (
    !width ||
    !rows.every(
      (row) =>
        row.features.length === width &&
        row.features.every(Number.isFinite) &&
        Number.isFinite(row.label),
    )
  )
    throw new Error("Cross-validation requires rectangular finite features and labels");
  const boundedK = k;
  const buckets = Array.from({ length: boundedK }, () => [] as number[]);
  if (stratify) {
    const classes = [...new Set(rows.map((row) => row.label))];
    const smallestClass = Math.min(
      ...classes.map(
        (label) => rows.filter((row) => row.label === label).length,
      ),
    );
    if (smallestClass < boundedK)
      throw new Error("Stratified folds require at least k samples in every class");
    classes.forEach((label, classIndex) => {
      const indices = rows
        .map((row, index) => (row.label === label ? index : -1))
        .filter((index) => index >= 0);
      const ordered = shuffle
        ? shuffled(indices, seed + classIndex * 101)
        : indices;
      ordered.forEach((index, position) =>
        buckets[position % boundedK].push(index),
      );
    });
  } else {
    const indices = rows.map((_, index) => index),
      ordered = shuffle ? shuffled(indices, seed) : indices;
    ordered.forEach((index, position) =>
      buckets[position % boundedK].push(index),
    );
  }
  const folds = buckets.map((validationIndices, fold) => {
    const validationSet = new Set(validationIndices),
      trainIndices = rows
        .map((_, index) => index)
        .filter((index) => !validationSet.has(index));
    const classes = [
      ...new Set(trainIndices.map((index) => rows[index].label)),
    ];
    const centroids = classes.map((label) => {
      const group = trainIndices.filter((index) => rows[index].label === label);
      return {
        label,
        center: rows[0].features.map(
          (_, axis) =>
            group.reduce((sum, index) => sum + rows[index].features[axis], 0) /
            group.length,
        ),
      };
    });
    const predictions = validationIndices.map(
      (index) =>
        centroids.reduce(
          (best, item) =>
            distance(rows[index].features, item.center) < best.distance
              ? {
                  label: item.label,
                  distance: distance(rows[index].features, item.center),
                }
              : best,
          { label: centroids[0].label, distance: Infinity },
        ).label,
    );
    const actual = validationIndices.map((index) => rows[index].label),
      labels = [...new Set(rows.map((row) => row.label))];
    const stats = labels.map((label) => {
      let tp = 0,
        fp = 0,
        fn = 0;
      actual.forEach((value, i) => {
        if (value === label && predictions[i] === label) tp++;
        else if (value !== label && predictions[i] === label) fp++;
        else if (value === label) fn++;
      });
      return {
        precision: tp / Math.max(1, tp + fp),
        recall: tp / Math.max(1, tp + fn),
        f1: (2 * tp) / Math.max(1, 2 * tp + fp + fn),
      };
    });
    const accuracy =
        actual.filter((value, i) => value === predictions[i]).length /
        Math.max(1, actual.length),
      precision = stats.reduce((sum, x) => sum + x.precision, 0) / stats.length,
      recall = stats.reduce((sum, x) => sum + x.recall, 0) / stats.length,
      f1 = stats.reduce((sum, x) => sum + x.f1, 0) / stats.length;
    const score =
      metric === "accuracy"
        ? accuracy
        : metric === "precision"
          ? precision
          : metric === "recall"
            ? recall
            : f1;
    return {
      fold: fold + 1,
      trainIndices,
      validationIndices,
      score,
      predictions,
    };
  });
  const mean = folds.reduce((sum, fold) => sum + fold.score, 0) / folds.length;
  const variance =
    folds.reduce((sum, fold) => sum + (fold.score - mean) ** 2, 0) /
    folds.length;
  return { folds, mean, variance, standardDeviation: Math.sqrt(variance) };
}
