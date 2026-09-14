export interface ClassMetrics {
  label: string;
  precision: number;
  recall: number;
  specificity: number;
  f1: number;
  support: number;
}
export interface MulticlassResult {
  matrix: number[][];
  classes: ClassMetrics[];
  accuracy: number;
  balancedAccuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroSpecificity: number;
  macroF1: number;
  total: number;
}

export function evaluateMulticlass(
  actual: number[],
  predicted: number[],
  labels: string[],
): MulticlassResult {
  if (!labels.length) throw new Error("At least one class label is required");
  if (new Set(labels).size !== labels.length)
    throw new Error("Class labels must be unique");
  if (actual.length !== predicted.length)
    throw new Error("Actual and predicted arrays must match");
  if (!actual.length) throw new Error("At least one prediction is required");
  const validIndex = (value: number) =>
    Number.isInteger(value) && value >= 0 && value < labels.length;
  if (![...actual, ...predicted].every(validIndex))
    throw new Error("Class indices must be integers within the supplied labels");
  const n = labels.length,
    matrix = Array.from({ length: n }, () => Array(n).fill(0) as number[]);
  actual.forEach((value, index) => matrix[value][predicted[index]]++);
  const total = matrix.flat().reduce((sum, value) => sum + value, 0),
    correct = matrix.reduce((sum, row, i) => sum + row[i], 0);
  const classes = labels.map((label, i) => {
    const tp = matrix[i][i],
      fp = matrix.reduce((sum, row, r) => sum + (r === i ? 0 : row[i]), 0),
      fn = matrix[i].reduce((sum, value, c) => sum + (c === i ? 0 : value), 0),
      tn = total - tp - fp - fn;
    const precision = tp / Math.max(1, tp + fp),
      recall = tp / Math.max(1, tp + fn),
      specificity = tn / Math.max(1, tn + fp);
    return {
      label,
      precision,
      recall,
      specificity,
      f1: (2 * precision * recall) / Math.max(1e-12, precision + recall),
      support: tp + fn,
    };
  });
  const average = (
    key: keyof Pick<
      ClassMetrics,
      "precision" | "recall" | "specificity" | "f1"
    >,
  ) =>
    classes.reduce((sum, item) => sum + item[key], 0) /
    Math.max(1, classes.length);
  return {
    matrix,
    classes,
    accuracy: correct / Math.max(1, total),
    balancedAccuracy: average("recall"),
    macroPrecision: average("precision"),
    macroRecall: average("recall"),
    macroSpecificity: average("specificity"),
    macroF1: average("f1"),
    total,
  };
}
