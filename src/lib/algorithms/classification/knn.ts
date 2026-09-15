import { euclideanDistance, manhattanDistance, cosineDistance } from '../../math/statistics';

export type DistanceMetric = 'euclidean' | 'manhattan' | 'cosine' | 'minkowski';
export type KnnWeight = 'uniform' | 'distance';

export interface KNNPrediction {
  predictedClass: number;
  neighbors: { index: number; distance: number; label: number }[];
  votes: Record<number, number>;
  tieBreak: string;
}

function minkowskiDistance(a: number[], b: number[], p: number) {
  return Math.pow(
    a.reduce((sum, value, i) => sum + Math.abs(value - b[i]) ** p, 0),
    1 / p,
  );
}

function getDistance(a: number[], b: number[], metric: DistanceMetric, p = 3): number {
  if (metric === 'manhattan') return manhattanDistance(a, b);
  if (metric === 'cosine') return cosineDistance(a, b);
  if (metric === 'minkowski') return minkowskiDistance(a, b, p);
  return euclideanDistance(a, b);
}

export function knnPredict(
  trainX: number[][],
  trainY: number[],
  queryPoint: number[],
  k: number,
  metric: DistanceMetric = 'euclidean',
  weights: KnnWeight = 'uniform',
  minkowskiP = 3,
): KNNPrediction {
  if (!trainX.length || !trainX[0]?.length) throw new Error('KNN requires a non-empty training matrix');
  if (trainX.length !== trainY.length) throw new Error('KNN requires one label per training sample');
  const width = trainX[0].length;
  if (!trainX.every(row => row.length === width && row.every(Number.isFinite)) || queryPoint.length !== width || !queryPoint.every(Number.isFinite)) throw new Error(`KNN requires rectangular finite inputs with ${width} features`);
  if (!trainY.every(Number.isInteger)) throw new Error('KNN requires integer class labels');
  if (!Number.isInteger(k) || k < 1 || k > trainX.length) throw new Error(`k must be an integer between 1 and ${trainX.length}`);
  const distances = trainX.map((x, i) => ({
    index: i,
    distance: getDistance(x, queryPoint, metric, minkowskiP),
    label: trainY[i],
  }));
  distances.sort((a, b) => a.distance - b.distance);
  const neighbors = distances.slice(0, k);
  const votes: Record<number, number> = {};
  neighbors.forEach((n) => {
    const weight =
      weights === 'distance' ? 1 / Math.max(n.distance, 1e-12) : 1;
    votes[n.label] = (votes[n.label] ?? 0) + weight;
  });
  const predictedClass = Object.keys(votes)
    .map(Number)
    .sort((a, b) => (votes[b] !== votes[a] ? votes[b] - votes[a] : a - b))[0];
  return { predictedClass, neighbors, votes, tieBreak: "highest vote, then lowest class id" };
}

export function knnClassifyAll(
  trainX: number[][],
  trainY: number[],
  testX: number[][],
  k: number,
  metric: DistanceMetric = 'euclidean',
  weights: KnnWeight = 'uniform',
): number[] {
  return testX.map(x => knnPredict(trainX, trainY, x, k, metric, weights).predictedClass);
}
