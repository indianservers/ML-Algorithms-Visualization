import { trainTestSplit } from "./trainTestSplit";

export interface ThreeWaySplit<T> {
  train: T[];
  validation: T[];
  test: T[];
  trainIndices: number[];
  validationIndices: number[];
  testIndices: number[];
}

export function threeWaySplit<T>(
  rows: T[],
  labels: number[],
  validationRatio = 0.2,
  testRatio = 0.1,
  seed = 42,
  stratify = true,
): ThreeWaySplit<T> {
  if (rows.length !== labels.length)
    throw new Error("Rows and labels must have equal length");
  if (validationRatio < 0 || testRatio < 0 || validationRatio + testRatio >= 1)
    throw new Error("Split ratios must leave a non-empty training partition");
  const heldOutRatio = validationRatio + testRatio;
  const first = trainTestSplit(rows, labels, heldOutRatio, seed, stratify);
  if (!first.testX.length || testRatio === 0)
    return {
      train: first.trainX,
      validation: first.testX,
      test: [],
      trainIndices: first.trainIndices,
      validationIndices: first.testIndices,
      testIndices: [],
    };
  const relativeTest = testRatio / heldOutRatio;
  const second = trainTestSplit(
    first.testX,
    first.testY,
    relativeTest,
    seed + 7919,
    stratify,
  );
  const validationIndices = second.trainIndices.map(
    (index) => first.testIndices[index],
  );
  const testIndices = second.testIndices.map(
    (index) => first.testIndices[index],
  );
  return {
    train: first.trainX,
    validation: second.trainX,
    test: second.testX,
    trainIndices: first.trainIndices,
    validationIndices,
    testIndices,
  };
}

export function classDistribution(labels: number[], indices: number[]) {
  const counts = new Map<number, number>();
  for (const index of indices)
    counts.set(labels[index], (counts.get(labels[index]) ?? 0) + 1);
  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([label, count]) => ({
      label,
      count,
      share: indices.length ? count / indices.length : 0,
    }));
}
