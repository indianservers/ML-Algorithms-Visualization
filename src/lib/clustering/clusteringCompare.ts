import { dbscan } from "../algorithms/clustering/dbscan";
import { fitGaussianMixture } from "../algorithms/clustering/gaussianMixture";
import { kmeans } from "../algorithms/clustering/kmeans";
import { trainKMedoids } from "../algorithms/clustering/kMedoids";
import { optics } from "../algorithms/clustering/optics";
import { spectralClustering } from "../algorithms/clustering/spectralClustering";
import {
  clusterSizes,
  daviesBouldinIndex,
  formatCl,
  silhouetteScore,
} from "./clusteringEval";

export type ClusterCompareRow = {
  algorithm: string;
  clusters: number;
  noise: number;
  silhouette: number | null;
  daviesBouldin: number | null;
  computeMs: number;
  note: string;
};

export function partitionQuality(X: number[][], labels: number[]) {
  const sizes = clusterSizes(labels);
  return {
    clusters: sizes.clusters,
    noise: sizes.noise,
    silhouette: silhouetteScore(X, labels),
    daviesBouldin: daviesBouldinIndex(X, labels),
  };
}

function timed<T>(fn: () => T): { value: T; computeMs: number } {
  const start = performance.now();
  const value = fn();
  return { value, computeMs: performance.now() - start };
}

export function compareClusteringSuite(
  X: number[][],
  seed = 42,
): ClusterCompareRow[] {
  const k = Math.max(2, Math.min(3, X.length));
  const rows: ClusterCompareRow[] = [];
  try {
    const { value, computeMs } = timed(() => kmeans(X, k, 25, "kmeans++", seed));
    const quality = partitionQuality(X, value.assignments);
    rows.push({
      algorithm: "K-Means",
      ...quality,
      computeMs,
      note: `Inertia ${formatCl(value.inertia, 1)} (not comparable across models)`,
    });
  } catch (error) {
    rows.push({
      algorithm: "K-Means",
      clusters: 0,
      noise: 0,
      silhouette: null,
      daviesBouldin: null,
      computeMs: 0,
      note: error instanceof Error ? error.message : "Failed",
    });
  }
  try {
    const { value, computeMs } = timed(() =>
      trainKMedoids(X, { k, maxIterations: 12, seed, metric: "euclidean", init: "kmedoids++" }),
    );
    const quality = partitionQuality(X, value.assignments);
    rows.push({
      algorithm: "K-Medoids",
      ...quality,
      computeMs,
      note: `Total cost ${formatCl(value.cost, 1)} (sum of distances to medoids)`,
    });
  } catch (error) {
    rows.push({
      algorithm: "K-Medoids",
      clusters: 0,
      noise: 0,
      silhouette: null,
      daviesBouldin: null,
      computeMs: 0,
      note: error instanceof Error ? error.message : "Failed",
    });
  }
  try {
    const { value, computeMs } = timed(() => dbscan(X, 0.6, 4));
    const quality = partitionQuality(X, value.labels);
    rows.push({
      algorithm: "DBSCAN",
      ...quality,
      computeMs,
      note: `eps=0.6, MinPts=4, noise ${quality.noise}`,
    });
  } catch (error) {
    rows.push({
      algorithm: "DBSCAN",
      clusters: 0,
      noise: 0,
      silhouette: null,
      daviesBouldin: null,
      computeMs: 0,
      note: error instanceof Error ? error.message : "Failed",
    });
  }
  if (X.every((row) => row.length === 2)) {
    try {
      const { value, computeMs } = timed(() =>
        fitGaussianMixture(X, k, 16, 1e-4, 1e-3, seed),
      );
      const quality = partitionQuality(X, value.assignments);
      rows.push({
        algorithm: "GMM",
        ...quality,
        computeMs,
        note: `LL ${formatCl(value.logLikelihood, 1)} (soft model; hard labels via argmax)`,
      });
    } catch (error) {
      rows.push({
        algorithm: "GMM",
        clusters: 0,
        noise: 0,
        silhouette: null,
        daviesBouldin: null,
        computeMs: 0,
        note: error instanceof Error ? error.message : "Failed",
      });
    }
  }
  if (X.length <= 260) {
    try {
      const { value, computeMs } = timed(() =>
        spectralClustering(X, k, 0.8, 8, "euclidean", "rbf", true, seed),
      );
      const quality = partitionQuality(X, value.labels);
      rows.push({
        algorithm: "Spectral",
        ...quality,
        computeMs,
        note: "Silhouette is on original features, not the embedding",
      });
    } catch (error) {
      rows.push({
        algorithm: "Spectral",
        clusters: 0,
        noise: 0,
        silhouette: null,
        daviesBouldin: null,
        computeMs: 0,
        note: error instanceof Error ? error.message : "Failed",
      });
    }
  }
  if (X.length <= 800) {
    try {
      const { value, computeMs } = timed(() => optics(X, 4, 2, 0.6, "euclidean"));
      const quality = partitionQuality(X, value.labels);
      rows.push({
        algorithm: "OPTICS",
        ...quality,
        computeMs,
        note: `Ordering size ${value.ordering.length}; extraction ε=0.6`,
      });
    } catch (error) {
      rows.push({
        algorithm: "OPTICS",
        clusters: 0,
        noise: 0,
        silhouette: null,
        daviesBouldin: null,
        computeMs: 0,
        note: error instanceof Error ? error.message : "Failed",
      });
    }
  }
  return rows;
}
