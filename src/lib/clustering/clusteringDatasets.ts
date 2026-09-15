import {
  datasetAPerfectBinary,
  datasetBOverlappingBinary,
  datasetDTwoMoons,
  datasetECircles,
  datasetFThreeBlobs,
  datasetHImbalanced,
  datasetINoisy,
} from "../classification/classificationDatasets";

export type ClusterPoint = { x: number; y: number; features?: number[] };

export function asXY(points: ClusterPoint[]) {
  return points.map((point) => ({ x: point.x, y: point.y }));
}

export function asMatrix(points: ClusterPoint[]) {
  return points.map((point) => point.features ?? [point.x, point.y]);
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function cloud(
  cx: number,
  cy: number,
  count: number,
  seed: number,
  sx: number,
  sy: number,
): ClusterPoint[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => {
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand());
    return {
      x: cx + Math.cos(angle) * radius * sx,
      y: cy + Math.sin(angle) * radius * sy,
    };
  });
}

export function datasetAWellSeparatedBlobs(): ClusterPoint[] {
  return datasetFThreeBlobs().map(({ x, y }) => ({ x, y }));
}

export function datasetBFourBlobs(): ClusterPoint[] {
  return [
    ...cloud(-2.4, -2.2, 28, 11, 0.45, 0.45),
    ...cloud(2.4, -2.1, 28, 13, 0.45, 0.45),
    ...cloud(-2.3, 2.2, 28, 17, 0.45, 0.45),
    ...cloud(2.2, 2.3, 28, 19, 0.45, 0.45),
  ];
}

export function datasetCUnequalSizes(): ClusterPoint[] {
  return [
    ...cloud(-2.0, 0.2, 70, 21, 0.85, 0.75),
    ...cloud(2.1, 1.4, 28, 23, 0.5, 0.5),
    ...cloud(1.8, -1.8, 12, 29, 0.35, 0.35),
  ];
}

export function datasetDUnequalDensities(): ClusterPoint[] {
  return [
    ...cloud(-1.8, 0, 70, 31, 0.35, 0.35),
    ...cloud(2.2, 0.1, 28, 37, 1.35, 1.15),
  ];
}

export function datasetETwoMoons(): ClusterPoint[] {
  return datasetDTwoMoons(80, 9).map(({ x, y }) => ({ x, y }));
}

export function datasetFConcentricCircles(): ClusterPoint[] {
  return datasetECircles(80, 13).map(({ x, y }) => ({ x, y }));
}

export function datasetGNoisyBlobs(): ClusterPoint[] {
  const blobs = datasetAWellSeparatedBlobs();
  const noise = cloud(0, 0, 12, 41, 4.2, 3.6);
  return [...blobs, ...noise];
}

export function datasetHBridge(): ClusterPoint[] {
  const left = cloud(-2.2, 0, 36, 43, 0.55, 0.7);
  const right = cloud(2.2, 0, 36, 47, 0.55, 0.7);
  const bridge = Array.from({ length: 10 }, (_, i) => ({
    x: -1.4 + (i / 9) * 2.8,
    y: (i % 2 === 0 ? -0.08 : 0.08),
  }));
  return [...left, ...right, ...bridge];
}

export function datasetIElongated(): ClusterPoint[] {
  return [
    ...cloud(-1.6, 1.4, 36, 53, 1.6, 0.28),
    ...cloud(1.5, -1.3, 36, 59, 1.6, 0.28),
  ];
}

export function datasetJSinglePlusOutliers(): ClusterPoint[] {
  return [
    ...cloud(0, 0, 50, 61, 0.55, 0.55),
    { x: -4.5, y: 3.8 },
    { x: 4.8, y: -3.6 },
    { x: 4.2, y: 4.1 },
  ];
}

export function datasetKVariableDensity(): ClusterPoint[] {
  return [
    ...cloud(-2.4, 1.5, 55, 67, 0.28, 0.28),
    ...cloud(0.2, -0.4, 40, 71, 0.7, 0.7),
    ...cloud(2.6, 1.6, 22, 73, 1.15, 1.05),
  ];
}

export function datasetLHighDimensional(count = 72, seed = 81): ClusterPoint[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const group = i % 3;
    const center = [
      [0, 0, 0, 0],
      [3.2, 0.2, 2.8, -0.4],
      [0.3, 3.1, -0.2, 2.6],
    ][group];
    const features = center.map((c) => c + (rand() - 0.5) * 0.7);
    return { x: features[0], y: features[1], features };
  });
}

export function overlappingBlobs(): ClusterPoint[] {
  return datasetBOverlappingBinary().map(({ x, y }) => ({ x, y }));
}

export function compactBinary(): ClusterPoint[] {
  return datasetAPerfectBinary().map(({ x, y }) => ({ x, y }));
}

export function imbalancedBlobs(): ClusterPoint[] {
  return datasetHImbalanced().map(({ x, y }) => ({ x, y }));
}

export function noisyLabelsAsPoints(): ClusterPoint[] {
  return datasetINoisy().map(({ x, y }) => ({ x, y }));
}

export function datasetScaleMismatch(count = 60, seed = 91): ClusterPoint[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const group = i % 2;
    return {
      x: group + (rand() - 0.5) * 0.2,
      y: (group ? 8e5 : 2e5) + (rand() - 0.5) * 4e4,
    };
  });
}

export function datasetIdentical(count = 8): ClusterPoint[] {
  return Array.from({ length: count }, () => ({ x: 1.5, y: -0.25 }));
}
