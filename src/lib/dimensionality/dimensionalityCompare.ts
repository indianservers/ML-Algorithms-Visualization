import { pca } from "../algorithms/dimensionality/pca";
import { kernelPCA } from "../algorithms/dimensionality/kernelPCA";
import { tsne } from "../algorithms/dimensionality/tsne";
import { umap } from "../algorithms/dimensionality/umap";
import { linearDiscriminantAnalysis } from "../algorithms/dimensionality/lda";
import { neighborhoodAtK, distancePreservation, posthocKnnAccuracy } from "./dimensionalityDiagnostics";
import { subsampleIndices } from "./dimensionalityPrep";

export interface ReductionCompareRow {
  method: string;
  supervised: boolean;
  transformNew: "yes" | "no" | "limited";
  dimensions: number;
  runtimeMs: number;
  neighborhoodK: number;
  distancePreservation: number;
  posthocKnn: number | null;
  note: string;
}

export function compareReductionMethods(
  X: number[][],
  labels?: number[],
  options?: { maxSamples?: number },
): ReductionCompareRow[] {
  const limit = options?.maxSamples ?? 36;
  const ids = subsampleIndices(X.length, limit, 11);
  const Xs = ids.map((i) => X[i]);
  const ys = labels ? ids.map((i) => labels[i]) : undefined;
  const rows: ReductionCompareRow[] = [];
  const run = (method: string, fn: () => number[][], extra: Partial<ReductionCompareRow>) => {
    const start = performance.now();
    const embedding = fn();
    const runtimeMs = performance.now() - start;
    rows.push({
      method,
      supervised: false,
      transformNew: "no",
      dimensions: embedding[0]?.length ?? 0,
      runtimeMs,
      neighborhoodK: neighborhoodAtK(Xs, embedding, 5),
      distancePreservation: distancePreservation(Xs, embedding),
      posthocKnn: ys ? posthocKnnAccuracy(embedding, ys, 3) : null,
      note: "",
      ...extra,
    });
  };
  run("PCA", () => pca(Xs, 2, "standard").projections, {
    transformNew: "yes",
    note: "Linear variance; axes comparable only within this PCA fit.",
  });
  run("Kernel PCA (RBF)", () => kernelPCA(Xs, 2, "rbf", 1).projection, {
    transformNew: "limited",
    note: "Nonlinear kernel; not a reconstruction of input space.",
  });
  run("t-SNE", () => tsne(Xs, Math.min(8, Xs.length - 1), 120, 8, 40, "euclidean", "pca", 7).embedding, {
    transformNew: "no",
    note: "Local neighborhoods; axes have no original-feature meaning.",
  });
  run("UMAP-like", () => umap(Xs, Math.min(8, Xs.length - 1), 0.1, "euclidean", 7, 1, 50).embedding, {
    transformNew: "no",
    note: "Browser neighbor-graph optimizer, not official umap-js transform.",
  });
  if (ys && new Set(ys).size >= 2) {
    run("LDA", () => linearDiscriminantAnalysis(Xs, ys).projections, {
      supervised: true,
      transformNew: "yes",
      note: "Uses labels. Post-hoc kNN is not independent of the LDA objective.",
    });
  }
  return rows;
}
