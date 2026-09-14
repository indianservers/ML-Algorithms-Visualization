import { shuffle } from '../math/statistics';

export interface SplitResult<T> {
  trainX: T[];
  testX: T[];
  trainY: number[];
  testY: number[];
  trainIndices: number[];
  testIndices: number[];
}

export function trainTestSplit<T>(
  X: T[],
  y: number[],
  testSize = 0.2,
  randomState?: number,
  stratify = false
): SplitResult<T> {
  const n = X.length;
  if (n < 2) throw new Error('Train/test split requires at least two samples');
  if (y.length !== n) throw new Error('Train/test split requires one label per sample');
  if (!Number.isFinite(testSize) || testSize <= 0 || testSize >= 1) throw new Error('testSize must be between 0 and 1');
  let indices = Array.from({ length: n }, (_, i) => i);

  if (stratify) {
    const classMap: Record<number, number[]> = {};
    y.forEach((yi, i) => { classMap[yi] = [...(classMap[yi] ?? []), i]; });
    const testIndices: number[] = [];
    const trainIndices: number[] = [];
    Object.entries(classMap).forEach(([classLabel, idxs], classOffset) => {
      const shuffled = shuffle(idxs, randomState === undefined ? undefined : randomState + Number(classLabel) + classOffset);
      const rawClassTestCount = Math.round(idxs.length * testSize);
      const classTestCount = idxs.length <= 1 ? 0 : Math.min(idxs.length - 1, Math.max(1, rawClassTestCount));
      testIndices.push(...shuffled.slice(0, classTestCount));
      trainIndices.push(...shuffled.slice(classTestCount));
    });
    if (!testIndices.length) testIndices.push(trainIndices.shift() as number);
    return {
      trainX: trainIndices.map(i => X[i]),
      testX: testIndices.map(i => X[i]),
      trainY: trainIndices.map(i => y[i]),
      testY: testIndices.map(i => y[i]),
      trainIndices,
      testIndices,
    };
  } else {
    indices = shuffle(indices, randomState);
  }

  const testCount = Math.min(n - 1, Math.max(1, Math.round(n * testSize)));
  const testIndices = indices.slice(0, testCount);
  const trainIndices = indices.slice(testCount);

  return {
    trainX: trainIndices.map(i => X[i]),
    testX: testIndices.map(i => X[i]),
    trainY: trainIndices.map(i => y[i]),
    testY: testIndices.map(i => y[i]),
    trainIndices,
    testIndices,
  };
}

export function kFoldSplit<T>(X: T[], y: number[], k: number, randomState?: number): SplitResult<T>[] {
  const n = X.length;
  if (n < 2) throw new Error('K-fold split requires at least two samples');
  if (y.length !== n) throw new Error('K-fold split requires one label per sample');
  if (!Number.isInteger(k) || k < 2 || k > n) throw new Error(`k must be an integer between 2 and ${n}`);
  const indices = shuffle(Array.from({ length: n }, (_, i) => i), randomState);
  const baseFoldSize = Math.floor(n / k);
  const remainder = n % k;
  let cursor = 0;
  return Array.from({ length: k }, (_, fold) => {
    const foldSize = baseFoldSize + (fold < remainder ? 1 : 0);
    const testIndices = indices.slice(cursor, cursor + foldSize);
    cursor += foldSize;
    const testSet = new Set(testIndices);
    const trainIndices = indices.filter(i => !testSet.has(i));
    return {
      trainX: trainIndices.map(i => X[i]),
      testX: testIndices.map(i => X[i]),
      trainY: trainIndices.map(i => y[i]),
      testY: testIndices.map(i => y[i]),
      trainIndices,
      testIndices,
    };
  });
}
