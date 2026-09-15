import { euclideanDistance } from "../../math/statistics";

export type PointType = "core" | "border" | "noise";

export interface DBSCANResult {
  labels: number[];
  pointTypes: PointType[];
  numClusters: number;
  corePoints: number[];
  borderPoints: number[];
  noisePoints: number[];
  expansionOrder: number[];
}

export function dbscanNeighbors(
  X: number[][],
  index: number,
  eps: number,
): number[] {
  if (!X[index] || !(eps > 0)) return [];
  return X.reduce<number[]>((neighbors, candidate, j) => {
    if (euclideanDistance(X[index], candidate) <= eps) neighbors.push(j);
    return neighbors;
  }, []);
}

export function dbscan(
  X: number[][],
  eps: number,
  minPts: number,
): DBSCANResult {
  if (!X.length || !X[0]?.length) {
    return {
      labels: [],
      pointTypes: [],
      numClusters: 0,
      corePoints: [],
      borderPoints: [],
      noisePoints: [],
      expansionOrder: [],
    };
  }
  if (!(eps > 0) || minPts < 1)
    throw new Error("DBSCAN requires eps > 0 and minPts >= 1.");
  const width = X[0].length;
  if (!Number.isFinite(eps) || !Number.isInteger(minPts) ||
      !X.every((row) => row.length === width && row.every(Number.isFinite)))
    throw new Error("DBSCAN requires finite rectangular data and an integer minPts.");
  const n = X.length;
  const labels = Array(n).fill(-1);
  const visited = Array(n).fill(false);
  const expansionOrder: number[] = [];
  let clusterID = 0;

  const neighborhoods = X.map((point) =>
    X.reduce<number[]>((neighbors, candidate, index) => {
      if (euclideanDistance(point, candidate) <= eps) neighbors.push(index);
      return neighbors;
    }, []),
  );

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    visited[i] = true;
    const neighbors = neighborhoods[i];
    if (neighbors.length < minPts) {
      labels[i] = -1;
    } else {
      labels[i] = clusterID;
      expansionOrder.push(i);
      const queue = [...neighbors];
      const queued = new Set(queue);
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const current = queue[cursor];
        if (!visited[current]) {
          visited[current] = true;
          if (neighborhoods[current].length >= minPts) {
            for (const neighbor of neighborhoods[current]) {
              if (!queued.has(neighbor)) {
                queued.add(neighbor);
                queue.push(neighbor);
              }
            }
          }
        }
        if (labels[current] < 0) {
          labels[current] = clusterID;
          expansionOrder.push(current);
        }
      }
      clusterID++;
    }
  }

  const pointTypes: PointType[] = X.map((_, i) => {
    const neighbors = neighborhoods[i];
    if (neighbors.length >= minPts) return "core";
    if (labels[i] >= 0) return "border";
    return "noise";
  });

  const corePoints = pointTypes
    .map((t, i) => (t === "core" ? i : -1))
    .filter((i) => i >= 0);
  const borderPoints = pointTypes
    .map((t, i) => (t === "border" ? i : -1))
    .filter((i) => i >= 0);
  const noisePoints = pointTypes
    .map((t, i) => (t === "noise" ? i : -1))
    .filter((i) => i >= 0);

  return {
    labels,
    pointTypes,
    numClusters: clusterID,
    corePoints,
    borderPoints,
    noisePoints,
    expansionOrder,
  };
}
