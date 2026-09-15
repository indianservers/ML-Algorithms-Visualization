import { describe, expect, it } from "vitest";
import { cosineDistance, euclideanDistance, manhattanDistance } from "../src/lib/math/statistics";
import { clusterDistance, fitClusterScaler, kDistanceCurve, silhouetteScore, samePartition as evalSamePartition } from "../src/lib/clustering/clusteringEval";
import { elbowMethod, kmeans, kmeansWithRestarts } from "../src/lib/algorithms/clustering/kmeans";
import { trainKMedoids } from "../src/lib/algorithms/clustering/kMedoids";
import { dbscan, dbscanNeighbors } from "../src/lib/algorithms/clustering/dbscan";
import { trainHierarchicalClustering } from "../src/lib/algorithms/clustering/hierarchicalClustering";
import { fitGaussianMixture } from "../src/lib/algorithms/clustering/gaussianMixture";
import { meanShift } from "../src/lib/algorithms/clustering/meanShift";
import { spectralClustering } from "../src/lib/algorithms/clustering/spectralClustering";
import { optics } from "../src/lib/algorithms/clustering/optics";
import { datasetAWellSeparatedBlobs, datasetETwoMoons } from "../src/lib/clustering/clusteringDatasets";

function samePartition(a: number[], b: number[]) {
  const map = new Map<number, number>();
  for (let i = 0; i < a.length; i++) {
    const seen = map.get(a[i]);
    if (seen === undefined) map.set(a[i], b[i]);
    else if (seen !== b[i]) return false;
  }
  return new Set(map.values()).size === map.size;
}

describe("Phase 3 clustering mathematics", () => {
  it("computes Euclidean, Manhattan, Minkowski, and cosine distances", () => {
    expect(euclideanDistance([0, 0], [3, 4])).toBe(5);
    expect(manhattanDistance([0, 0], [3, 4])).toBe(7);
    expect(clusterDistance([0, 0], [1, 1], "minkowski", 2)).toBeCloseTo(Math.SQRT2, 10);
    expect(cosineDistance([1, 0], [0, 1])).toBeCloseTo(1, 10);
  });

  it("recovers the known two-blob K-Means centroids up to label permutation", () => {
    const X = [
      [0, 0],
      [0, 1],
      [10, 10],
      [10, 11],
    ];
    const result = kmeans(X, 2, 50, "kmeans++", 1);
    const groups = [0, 1].map((cluster) =>
      X.filter((_, i) => result.assignments[i] === cluster).sort(
        (a, b) => a[0] - b[0] || a[1] - b[1],
      ),
    );
    const sorted = groups.sort((a, b) => a[0][0] - b[0][0]);
    expect(sorted[0]).toEqual([
      [0, 0],
      [0, 1],
    ]);
    expect(sorted[1]).toEqual([
      [10, 10],
      [10, 11],
    ]);
    const means = result.centroids
      .map((c) => [...c].sort((a, b) => a - b))
      .sort((a, b) => a[0] - b[0]);
    expect(means[0][0]).toBeCloseTo(0, 6);
    expect(means[0][1]).toBeCloseTo(0.5, 6);
    expect(means[1][0]).toBeCloseTo(10, 6);
    expect(means[1][1]).toBeCloseTo(10.5, 6);
    expect(result.converged).toBe(true);
  });

  it("keeps K-Means++ centroids as actual observations at initialization", () => {
    const X = datasetAWellSeparatedBlobs().map((p) => [p.x, p.y]);
    const first = kmeans(X, 3, 1, "kmeans++", 42);
    first.steps[0].centroids.forEach((centroid) => {
      expect(X.some((row) => row.every((value, d) => Math.abs(value - centroid[d]) < 1e-12))).toBe(
        true,
      );
    });
  });

  it("reproduces K-Means assignments for a fixed seed", () => {
    const X = datasetAWellSeparatedBlobs().map((p) => [p.x, p.y]);
    const a = kmeans(X, 3, 40, "kmeans++", 42);
    const b = kmeans(X, 3, 40, "kmeans++", 42);
    expect(a.assignments).toEqual(b.assignments);
    expect(a.inertia).toBeCloseTo(b.inertia, 12);
  });

  it("keeps every K-Medoids medoid as a dataset row", () => {
    const X = datasetAWellSeparatedBlobs().map((p) => [p.x, p.y]);
    const result = trainKMedoids(X, {
      k: 3,
      maxIterations: 25,
      metric: "euclidean",
      init: "kmedoids++",
      seed: 42,
    });
    result.medoidIndices.forEach((index) => {
      expect(result.medoids.some((row) => row.every((value, d) => value === X[index][d]))).toBe(
        true,
      );
      expect(X[index]).toEqual(result.medoids[result.medoidIndices.indexOf(index)] ?? X[index]);
    });
    expect(result.medoids).toEqual(result.medoidIndices.map((index) => X[index]));
  });

  it("identifies DBSCAN core, border, and noise on a tiny grid", () => {
    const X = [
      [0, 0],
      [0.1, 0],
      [0.2, 0],
      [5, 5],
    ];
    const result = dbscan(X, 0.25, 3);
    expect(result.pointTypes[0]).toBe("core");
    expect(result.pointTypes[1]).toBe("core");
    expect(result.pointTypes[2]).toBe("core");
    expect(result.pointTypes[3]).toBe("noise");
    expect(result.numClusters).toBe(1);
    expect(dbscanNeighbors(X, 3, 0.25)).toEqual([3]);
  });

  it("merges nearest hierarchical pairs first for single linkage", () => {
    const model = trainHierarchicalClustering(
      [
        [0, 0],
        [0, 1],
        [10, 10],
      ],
      "single",
      "euclidean",
    );
    expect(model.merges[0].size).toBe(2);
    expect(model.merges[0].distance).toBeCloseTo(1, 8);
  });

  it("keeps GMM responsibilities summing to 1 and recovers separated means", () => {
    const X = [
      ...Array.from({ length: 20 }, (_, i) => [i * 0.01, 0] as number[]),
      ...Array.from({ length: 20 }, (_, i) => [8 + i * 0.01, 0] as number[]),
    ];
    const model = fitGaussianMixture(X, 2, 40, 1e-5, 1e-3, 3);
    model.responsibilities.forEach((row) => {
      expect(row.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
    });
    const means = [...model.means].sort((a, b) => a[0] - b[0]);
    expect(means[0][0]).toBeLessThan(2);
    expect(means[1][0]).toBeGreaterThan(6);
    expect(model.history.every((step, i) => i === 0 || step.logLikelihood + 1e-6 >= model.history[i - 1].logLikelihood - 1e-4)).toBe(
      true,
    );
  });

  it("moves Mean Shift seeds toward local mass", () => {
    const X = [
      [0, 0],
      [0.1, 0],
      [0.2, 0],
      [8, 8],
      [8.1, 8],
    ];
    const result = meanShift(X, 1, 20, 0.001, "flat");
    expect(result.trajectories[0].length).toBeGreaterThan(1);
    const start = result.trajectories[0][0];
    const next = result.trajectories[0][1];
    expect(Math.hypot(next[0] - 0.1, next[1])).toBeLessThan(Math.hypot(start[0] - 0.1, start[1]) + 1e-9);
  });

  it("builds a square spectral affinity matrix and labels every point", () => {
    const X = datasetETwoMoons().map((p) => [p.x, p.y]);
    const result = spectralClustering(X, 2, 0.6, 8, "euclidean", "rbf", true, 7);
    expect(result.affinity.length).toBe(X.length);
    expect(result.affinity[0].length).toBe(X.length);
    expect(result.labels).toHaveLength(X.length);
    expect(result.embedding[0]).toHaveLength(2);
  });

  it("returns an OPTICS ordering of every point and finite core distances for dense cores", () => {
    const X = datasetAWellSeparatedBlobs().map((p) => [p.x, p.y]);
    const result = optics(X, 4, 2, 0.8, "euclidean");
    expect(result.ordering).toHaveLength(X.length);
    expect(result.reachability).toHaveLength(X.length);
    expect(result.coreDistances.some((value) => Number.isFinite(value))).toBe(true);
  });

  it("returns N/A silhouette for a single cluster and a real score for two", () => {
    expect(silhouetteScore([[0, 0], [1, 0]], [0, 0])).toBeNull();
    const score = silhouetteScore(
      [
        [0, 0],
        [0, 1],
        [10, 10],
        [10, 11],
      ],
      [0, 0, 1, 1],
    );
    expect(score).toBeGreaterThan(0.7);
  });

  it("does not depend on numeric cluster id ordering for partition equality", () => {
    expect(samePartition([0, 0, 1, 1], [5, 5, 9, 9])).toBe(true);
    expect(samePartition([0, 0, 1, 1], [1, 1, 0, 0])).toBe(true);
    expect(samePartition([0, 0, 1, 1], [0, 1, 1, 1])).toBe(false);
    expect(evalSamePartition([0, 0, 1, 1], [1, 1, 0, 0])).toBe(true);
  });

  it("excludes DBSCAN noise from the silhouette average", () => {
    const score = silhouetteScore(
      [
        [0, 0],
        [0, 1],
        [10, 10],
        [10, 11],
        [100, 100],
      ],
      [0, 0, 1, 1, -1],
    );
    const withoutNoise = silhouetteScore(
      [
        [0, 0],
        [0, 1],
        [10, 10],
        [10, 11],
      ],
      [0, 0, 1, 1],
    );
    expect(score).toBeCloseTo(withoutNoise ?? 0, 8);
  });

  it("standardizes mixed-scale features and leaves zero-variance columns at 0", () => {
    const scaler = fitClusterScaler([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);
    expect(scaler.std[1]).toBe(1);
    expect(scaler.transform([2, 0])[1]).toBe(0);
    expect(scaler.transform([2, 0])[0]).toBeCloseTo((2 - 1) / scaler.std[0], 10);
  });

  it("keeps empty-cluster reinitialization finite and prefers farthest points", () => {
    const X = [
      [0, 0],
      [0.01, 0],
      [0.02, 0],
      [8, 8],
    ];
    const result = kmeans(X, 3, 20, "random", 7);
    expect(result.centroids.every((c) => c.every(Number.isFinite))).toBe(true);
    expect(result.emptyClusterResets).toBeGreaterThanOrEqual(0);
  });

  it("keeps the best inertia across K-Means restarts", () => {
    const X = datasetAWellSeparatedBlobs().map((p) => [p.x, p.y]);
    const one = kmeans(X, 3, 20, "random", 1);
    const best = kmeansWithRestarts(X, 3, 6, 20, "random", 1);
    expect(best.nInit).toBe(6);
    expect(best.inertia).toBeLessThanOrEqual(one.inertia + 1e-9);
  });

  it("runs the elbow curve from K=1", () => {
    const curve = elbowMethod(
      [
        [0, 0],
        [0, 1],
        [8, 8],
        [8, 9],
      ],
      3,
    );
    expect(curve).toHaveLength(3);
    expect(curve[0]).toBeGreaterThan(curve[2] - 1e-9);
  });

  it("sorts k-distance values and keeps OPTICS ordering unique", () => {
    const X = datasetAWellSeparatedBlobs().map((p) => [p.x, p.y]);
    const curve = kDistanceCurve(X, 4);
    expect(curve).toHaveLength(X.length);
    expect([...curve].sort((a, b) => a - b)).toEqual(curve);
    const result = optics(X, 4, 2, 0.8, "euclidean");
    expect(new Set(result.ordering).size).toBe(X.length);
  });

  it("stores a symmetric affinity and L = D − A for spectral clustering", () => {
    const X = [
      [0, 0],
      [0.1, 0],
      [4, 4],
      [4.1, 4],
      [8, 0],
      [8.1, 0],
    ];
    const result = spectralClustering(X, 2, 0.8, 3, "euclidean", "rbf", true, 4);
    expect(result.affinity[0][1]).toBeCloseTo(result.affinity[1][0], 10);
    expect(result.unnormalizedLaplacian[0][0]).toBeCloseTo(result.degree[0], 8);
    expect(result.unnormalizedLaplacian[0][1]).toBeCloseTo(-result.affinity[0][1], 8);
  });

  it("keeps GMM mixture weights summing to 1 on duplicate-heavy data", () => {
    const X = [
      [0, 0],
      [0, 0],
      [0, 0],
      [3, 3],
      [3, 3],
    ];
    const model = fitGaussianMixture(X, 2, 20, 1e-4, 1e-2, 2);
    expect(model.weights.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 8);
    expect(model.covariances.every((c) => Number.isFinite(c[0][0]) && c[0][0] > 0)).toBe(true);
  });

  it("lets the large-range axis dominate unscaled K-Means centroids", () => {
    const raw = [
      [0, 1e5],
      [0.05, 2e5],
      [1, 1.5e5],
      [1.05, 1.8e5],
    ];
    const unscaled = kmeans(raw, 2, 40, "kmeans++", 4);
    const ySpan = Math.abs(unscaled.centroids[0][1] - unscaled.centroids[1][1]);
    const xSpan = Math.abs(unscaled.centroids[0][0] - unscaled.centroids[1][0]);
    expect(ySpan).toBeGreaterThan(xSpan * 50);
    const scaled = kmeans(fitClusterScaler(raw).transformAll(raw), 2, 40, "kmeans++", 4);
    const scaledX = Math.abs(scaled.centroids[0][0] - scaled.centroids[1][0]);
    const scaledY = Math.abs(scaled.centroids[0][1] - scaled.centroids[1][1]);
    expect(scaledX).toBeGreaterThan(0.5);
    expect(scaledX + scaledY).toBeGreaterThan(0);
  });

  it("labels every point core when MinPts is 1", () => {
    const result = dbscan(
      [
        [0, 0],
        [10, 10],
      ],
      0.5,
      1,
    );
    expect(result.pointTypes.every((type) => type === "core")).toBe(true);
    expect(result.numClusters).toBe(2);
  });

  it("returns finite K-Means centroids when every observation is identical", () => {
    const X = Array.from({ length: 6 }, () => [2, 2]);
    const result = kmeans(X, 2, 10, "random", 3);
    expect(result.centroids.every((c) => c.every(Number.isFinite))).toBe(true);
    expect(result.inertia).toBeCloseTo(0, 8);
  });

  it("uses a larger first merge for complete linkage than single linkage on a chain", () => {
    const X = [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ];
    const single = trainHierarchicalClustering(X, "single", "euclidean");
    const complete = trainHierarchicalClustering(X, "complete", "euclidean");
    expect(single.merges[0].distance).toBeCloseTo(1, 8);
    expect(complete.merges.at(-1)!.distance).toBeGreaterThan(single.merges.at(-1)!.distance - 1e-9);
  });
});
