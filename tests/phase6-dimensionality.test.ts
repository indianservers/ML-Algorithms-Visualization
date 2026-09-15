import { describe, expect, it } from "vitest";
import { pca, transformPca } from "../src/lib/algorithms/dimensionality/pca";
import {
  KERNEL_PCA_MAX_SAMPLES,
  kernelPCA,
  rbfKernel,
  polynomialKernel,
} from "../src/lib/algorithms/dimensionality/kernelPCA";
import { tsne } from "../src/lib/algorithms/dimensionality/tsne";
import { umap } from "../src/lib/algorithms/dimensionality/umap";
import {
  LDA_TARGET_ERROR,
  linearDiscriminantAnalysis,
  maxLdaComponents,
  transformLda,
} from "../src/lib/algorithms/dimensionality/lda";
import { trainAutoencoder, encodeWithWeights } from "../src/lib/algorithms/dimensionality/autoencoder";
import {
  applyFeatureScale,
  componentsForVariance,
  fitFeatureScale,
  reconstructionMse,
} from "../src/lib/dimensionality/dimensionalityPrep";
import { getDimensionalityDataset } from "../src/lib/dimensionality/dimensionalityDatasets";
import { embeddingToLoadedDataset } from "../src/lib/dimensionality/dimensionalityExport";
import {
  componentOrthogonality,
  kernelCenteredMeans,
  kernelIsSymmetric,
  sameDirectionUpToSign,
} from "../src/lib/dimensionality/dimensionalityDiagnostics";

describe("Phase 6 dimensionality reduction", () => {
  it("centers features and sorts PCA eigenvalues", () => {
    const X = [
      [1, 2],
      [2, 4],
      [3, 6],
      [4, 8],
      [5, 9.8],
    ];
    const result = pca(X, 2, "none");
    const centeredMean =
      X.reduce((sum, row) => sum + (row[0] - result.mean[0]), 0) / X.length;
    expect(centeredMean).toBeCloseTo(0, 8);
    expect(result.eigenvalues[0]).toBeGreaterThan(result.eigenvalues[1]);
    expect(result.explainedVarianceRatio.reduce((s, v) => s + v, 0)).toBeGreaterThan(0.99);
    const pc1 = result.components[0];
    expect(Math.abs(pc1[0] * pc1[1])).toBeGreaterThan(0.2);
  });

  it("keeps PCA components approximately orthogonal and reconstructs", () => {
    const X = getDimensionalityDataset("a-correlated-2d").X;
    const result = pca(X, 2, "standard");
    const dot = result.components[0].reduce((s, v, i) => s + v * result.components[1][i], 0);
    expect(Math.abs(dot)).toBeLessThan(0.08);
    expect(result.reconstructionMse).toBeLessThan(1e-6);
    const one = pca(X, 1, "standard");
    expect(one.reconstructionMse).toBeGreaterThan(result.reconstructionMse - 1e-9);
    const mapped = transformPca([X[0]], result);
    expect(mapped[0]).toHaveLength(2);
    expect(mapped[0].every(Number.isFinite)).toBe(true);
  });

  it("selects components for a variance threshold from actual ratios", () => {
    const result = pca(getDimensionalityDataset("b-plane-3d").X, 3, "none");
    const k = componentsForVariance(result.explainedVarianceRatio, 0.95);
    expect(k).toBeGreaterThanOrEqual(1);
    expect(k).toBeLessThanOrEqual(3);
    expect(result.cumulativeExplainedVariance[k - 1]).toBeGreaterThanOrEqual(0.95 - 1e-6);
  });

  it("matches an analytic RBF kernel entry and polynomial kernel", () => {
    const a = [0, 0];
    const b = [1, 0];
    expect(rbfKernel(a, b, 0.5)).toBeCloseTo(Math.exp(-0.5), 10);
    expect(polynomialKernel([1, 2], [3, 4], 1, 1, 2)).toBeCloseTo((1 * 11 + 1) ** 2, 10);
    const kp = kernelPCA([[0, 0], [1, 0], [0, 1], [1, 1]], 2, "rbf", 1, 3, 0, true, true);
    expect(kp.kernel[0][1]).toBeCloseTo(rbfKernel(kp.transformedInput[0], kp.transformedInput[1], 1), 8);
    expect(kp.projection[0]).toHaveLength(2);
    expect(kp.projection.flat().every(Number.isFinite)).toBe(true);
  });

  it("changes Kernel PCA embeddings when gamma changes", () => {
    const X = getDimensionalityDataset("g-concentric").X.slice(0, 40);
    const low = kernelPCA(X, 2, "rbf", 0.05);
    const high = kernelPCA(X, 2, "rbf", 8);
    const drift = low.projection.reduce(
      (sum, row, i) => sum + Math.abs(row[0] - high.projection[i][0]),
      0,
    );
    expect(drift).toBeGreaterThan(0.01);
  });

  it("rejects invalid t-SNE perplexity and returns 2D embeddings", () => {
    const X = getDimensionalityDataset("d-iris").X.slice(0, 20);
    expect(() => tsne(X, 20, 200, 12, 20)).toThrow(/perplexity/i);
    const embedded = tsne(X, 5, 100, 8, 25, "euclidean", "pca", 7);
    expect(embedded.embedding).toHaveLength(20);
    expect(embedded.embedding[0]).toHaveLength(2);
    expect(embedded.klHistory.length).toBeGreaterThan(0);
    const again = tsne(X, 5, 100, 8, 25, "euclidean", "pca", 7);
    expect(embedded.embedding[0][0]).toBeCloseTo(again.embedding[0][0], 8);
  });

  it("enforces LDA max components and uses class labels", () => {
    expect(maxLdaComponents(4, 3)).toBe(2);
    expect(maxLdaComponents(10, 2)).toBe(1);
    expect(() => linearDiscriminantAnalysis([[1], [2], [3]], [0, 0, 0])).toThrow(LDA_TARGET_ERROR);
    const twoClass = linearDiscriminantAnalysis(
      [
        [0, 0],
        [0.1, -0.1],
        [0.2, 0.1],
        [4, 4],
        [4.1, 3.9],
        [3.8, 4.2],
      ],
      [0, 0, 0, 1, 1, 1],
    );
    expect(twoClass.maxComponents).toBe(1);
    expect(twoClass.projections[0]).toHaveLength(1);
    const mean0 = twoClass.scores.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
    const mean1 = twoClass.scores.slice(3).reduce((s, v) => s + v, 0) / 3;
    expect(Math.abs(mean1 - mean0)).toBeGreaterThan(0.5);
    const mapped = transformLda([[0, 0]], twoClass);
    expect(mapped[0]).toHaveLength(1);
    const iris = getDimensionalityDataset("d-iris");
    const lda = linearDiscriminantAnalysis(iris.X, iris.y!, 0, "empirical", true, "class", 10);
    expect(lda.projections[0].length).toBe(2);
  });

  it("standardizes constant columns without NaN", () => {
    const X = [
      [1, 5],
      [2, 5],
      [3, 5],
    ];
    const fitted = fitFeatureScale(X, "standard", ["a", "b"]);
    expect(fitted.constantFeatures).toContain("b");
    const scaled = applyFeatureScale(X, fitted);
    expect(scaled.every((row) => row[1] === 0)).toBe(true);
    expect(pca(X, 1, "standard").projections.flat().every(Number.isFinite)).toBe(true);
  });

  it("does not use labels inside unsupervised PCA", () => {
    const item = getDimensionalityDataset("d-iris");
    const unlabeled = pca(item.X, 2, "standard");
    const relabeled = pca(item.X, 2, "standard");
    expect(unlabeled.projections).toEqual(relabeled.projections);
  });

  it("UMAP embeddings are 2D and metric-sensitive", () => {
    const X = getDimensionalityDataset("g-concentric").X.slice(0, 30);
    const euclidean = umap(X, 5, 0.1, "euclidean", 3, 1, 40);
    const cosine = umap(X, 5, 0.1, "cosine", 3, 1, 40);
    expect(euclidean.embedding[0]).toHaveLength(2);
    const drift = euclidean.embedding.reduce(
      (sum, row, i) => sum + Math.abs(row[0] - cosine.embedding[i][0]),
      0,
    );
    expect(drift).toBeGreaterThan(0);
  });

  it("trains an autoencoder until reconstruction loss drops", async () => {
    const samples = Array.from({ length: 16 }, (_, i) => {
      const t = i / 15;
      return [t, 1 - t, t * t, 0.2];
    });
    const result = await trainAutoencoder(samples, 2, 0, "shallow", 0.05, 8, 6, undefined, {
      outputActivation: "linear",
    });
    expect(result.latent[0]).toHaveLength(2);
    expect(result.parameterCount).toBeGreaterThan(0);
    expect(result.losses.length).toBeGreaterThan(1);
    expect(result.losses.at(-1)!).toBeLessThan(result.losses[0] + 0.05);
    expect(reconstructionMse(samples, result.reconstructions)).toBeCloseTo(result.mse, 8);
  }, 30000);

  it("treats PCA component sign flips as the same direction", () => {
    const X = getDimensionalityDataset("a-correlated-2d").X;
    const result = pca(X, 1, "standard");
    expect(sameDirectionUpToSign(result.components[0], result.components[0].map((v) => -v))).toBe(true);
    expect(componentOrthogonality(pca(X, 2, "standard").components)).toBeLessThan(0.08);
  });

  it("centers and symmetrizes Kernel PCA kernels", () => {
    const X = getDimensionalityDataset("g-concentric").X.slice(0, 20);
    const kp = kernelPCA(X, 2, "rbf", 1);
    expect(kernelIsSymmetric(kp.kernel)).toBe(true);
    const means = kernelCenteredMeans(kp.centeredKernel);
    expect(means.maxAbsRowMean).toBeLessThan(1e-8);
    expect(means.maxAbsColMean).toBeLessThan(1e-8);
    expect(() => kernelPCA(Array.from({ length: KERNEL_PCA_MAX_SAMPLES + 1 }, () => [0, 1]), 2)).toThrow(/N×N/i);
  });

  it("does not leak labels into unsupervised embeddings", () => {
    const item = getDimensionalityDataset("d-iris");
    const shuffled = [...item.y!].reverse();
    const a = pca(item.X, 2, "standard").projections;
    const b = pca(item.X, 2, "standard").projections;
    expect(a).toEqual(b);
    const tsneA = tsne(item.X.slice(0, 25), 5, 80, 8, 20, "euclidean", "pca", 3);
    const tsneB = tsne(item.X.slice(0, 25), 5, 80, 8, 20, "euclidean", "pca", 3);
    expect(tsneA.embedding).toEqual(tsneB.embedding);
    expect(shuffled).not.toEqual(item.y);
  });

  it("stops t-SNE when shouldStop is true", () => {
    const X = getDimensionalityDataset("d-iris").X.slice(0, 12);
    const stopped = tsne(X, 4, 80, 8, 40, "euclidean", "pca", 1, () => true);
    expect(stopped.incomplete).toBe(true);
    expect(stopped.iterationsCompleted).toBeLessThan(40);
  });

  it("returns UMAP neighbor ranks and 2D shape", () => {
    const X = getDimensionalityDataset("g-concentric").X.slice(0, 24);
    const result = umap(X, 5, 0.1, "euclidean", 4, 1, 30);
    expect(result.embedding[0]).toHaveLength(2);
    expect(result.neighbors[0][0].rank).toBe(1);
    expect(result.neighbors[0][0].id).not.toBe(0);
  });

  it("handles singular-ish LDA with more features than samples", () => {
    const item = getDimensionalityDataset("n-small-n-high-d");
    const result = linearDiscriminantAnalysis(item.X, item.y!, 0, "empirical", true, "class", 3);
    expect(result.maxComponents).toBe(1);
    expect(result.projections[0]).toHaveLength(1);
    expect(result.projections.flat().every(Number.isFinite)).toBe(true);
  });

  it("exports reduced features with preserved sample ids and untransformed target", () => {
    const embedding = [[1, 2], [3, 4]];
    const dataset = embeddingToLoadedDataset({
      id: "pca-out",
      name: "Iris — PCA2",
      prefix: "PC",
      embedding,
      labels: ["setosa", "versicolor"],
      sampleIds: ["row-a", "row-b"],
      history: "Iris → standardize → PCA 4→2",
    });
    expect(dataset.columns).toEqual(["sample_id", "PC1", "PC2", "target"]);
    expect(dataset.data[0].sample_id).toBe("row-a");
    expect(dataset.data[0].target).toBe("setosa");
    expect(dataset.data[0].PC1).toBeCloseTo(1, 5);
  });

  it("matches autoencoder latent width to requested bottleneck", async () => {
    const samples = Array.from({ length: 12 }, (_, i) => [i / 11, 1 - i / 11, 0.25]);
    const result = await trainAutoencoder(samples, 2, 0, "shallow", 0.05, 6, 4, undefined, {
      outputActivation: "linear",
    });
    expect(result.latent[0]).toHaveLength(2);
    expect(result.reconstructions[0]).toHaveLength(3);
    const encoded = encodeWithWeights(samples.slice(0, 1), result.encoderWeights);
    expect(encoded[0]).toHaveLength(2);
  }, 30000);
});
