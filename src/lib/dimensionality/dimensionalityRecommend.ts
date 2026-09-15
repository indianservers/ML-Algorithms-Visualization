export const DIMENSIONALITY_ALGORITHMS = [
  {
    route: "/ml/dimensionality-reduction/pca",
    label: "PCA",
    kind: "linear",
  },
  {
    route: "/ml/dimensionality-reduction/kernel-pca",
    label: "Kernel PCA",
    kind: "nonlinear",
  },
  {
    route: "/ml/dimensionality-reduction/tsne",
    label: "t-SNE",
    kind: "visualize",
  },
  {
    route: "/ml/dimensionality-reduction/umap-concept",
    label: "UMAP",
    kind: "visualize",
  },
  {
    route: "/ml/dimensionality-reduction/lda",
    label: "LDA",
    kind: "supervised",
  },
  {
    route: "/ml/dimensionality-reduction/autoencoder",
    label: "Autoencoder",
    kind: "neural",
  },
] as const;

export interface DimensionalityRecommendProfile {
  rows: number;
  numericFeatures: number;
  hasClassLabels: boolean;
  classes: number;
}

export function recommendDimensionalityAlgorithms(profile: DimensionalityRecommendProfile) {
  return DIMENSIONALITY_ALGORITHMS.map((algorithm) => {
    let rank: "Highly recommended" | "Recommended" | "Limited" = "Recommended";
    const why: string[] = [];
    if (algorithm.kind === "linear") {
      rank = profile.numericFeatures >= 3 ? "Highly recommended" : "Recommended";
      why.push("Suitable for correlated numeric data and linear variance compression. Variance is not the same as predictive relevance.");
    }
    if (algorithm.kind === "nonlinear") {
      rank = profile.numericFeatures >= 2 ? "Recommended" : "Limited";
      why.push("Candidate when structure is nonlinear. Kernel matrices scale poorly with large N.");
    }
    if (algorithm.kind === "visualize") {
      rank = profile.rows > 800 ? "Limited" : "Recommended";
      why.push(
        algorithm.label === "t-SNE"
          ? "Best considered for visualization of local neighborhoods. Global distances are not faithfully preserved."
          : "Candidate for manifold visualization. Stochastic and parameter-sensitive; global distances still need care.",
      );
      if (profile.rows > 400) why.push("Large N: this browser lab subsamples or warns before a full embedding.");
    }
    if (algorithm.kind === "supervised") {
      if (!profile.hasClassLabels || profile.classes < 2) {
        rank = "Limited";
        why.push("LDA dimensionality reduction requires a categorical class target with at least two classes.");
      } else {
        rank = "Highly recommended";
        why.push(`Uses labels. Maximum meaningful axes: min(features, classes-1) = min(${profile.numericFeatures}, ${profile.classes - 1}).`);
      }
    }
    if (algorithm.kind === "neural") {
      if (profile.rows < 40) {
        rank = "Limited";
        why.push("Autoencoders need enough samples to train a bottleneck; tiny tables overfit easily.");
      } else {
        rank = "Recommended";
        why.push("Better when enough data exists and nonlinear compression is desired. Latent size is task-dependent.");
      }
    }
    return { ...algorithm, rank, why };
  });
}
