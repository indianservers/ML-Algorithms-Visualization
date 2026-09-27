import type { TSNEInitialization, TSNEMetric, TSNEResult } from "../algorithms/dimensionality/tsne";

export interface TSNEArtifact {
  format: "ml-suite-tsne-reference-v1";
  algorithm: "t-SNE";
  datasetName: string;
  createdAt: string;
  inputDimensions: number;
  metric: TSNEMetric;
  initialization: TSNEInitialization;
  perplexity: number;
  learningRate: number;
  earlyExaggeration: number;
  iterations: number;
  seed: number;
  inferenceMethod: "inverse-distance-neighbor-interpolation";
  referenceFeatures: number[][];
  embedding: number[][];
  labels: number[];
  quality: {
    trustworthiness: number;
    continuity: number;
    finalKl: number;
    iterationsCompleted: number;
  };
}

export function createTSNEArtifact(options: {
  datasetName: string;
  features: number[][];
  labels: number[];
  result: TSNEResult;
  metric: TSNEMetric;
  initialization: TSNEInitialization;
  perplexity: number;
  learningRate: number;
  earlyExaggeration: number;
  iterations: number;
}): TSNEArtifact {
  const { features, labels, result } = options;
  if (result.incomplete || result.embedding.length !== features.length) {
    throw new Error("A completed t-SNE fit is required before export or inference.");
  }
  return {
    format: "ml-suite-tsne-reference-v1",
    algorithm: "t-SNE",
    datasetName: options.datasetName,
    createdAt: new Date().toISOString(),
    inputDimensions: features[0]?.length ?? 0,
    metric: options.metric,
    initialization: options.initialization,
    perplexity: options.perplexity,
    learningRate: options.learningRate,
    earlyExaggeration: options.earlyExaggeration,
    iterations: options.iterations,
    seed: 42,
    inferenceMethod: "inverse-distance-neighbor-interpolation",
    referenceFeatures: features.map((row) => [...row]),
    embedding: result.embedding.map((row) => [...row]),
    labels: [...labels],
    quality: {
      trustworthiness: result.trustworthiness,
      continuity: result.continuity,
      finalKl: result.klHistory.at(-1) ?? 0,
      iterationsCompleted: result.iterationsCompleted,
    },
  };
}

export function parseTSNEArtifact(value: unknown): TSNEArtifact {
  if (!value || typeof value !== "object") throw new Error("Invalid t-SNE model file.");
  const artifact = value as TSNEArtifact;
  const features = artifact.referenceFeatures;
  const embedding = artifact.embedding;
  const width = artifact.inputDimensions;
  if (
    artifact.format !== "ml-suite-tsne-reference-v1" ||
    artifact.algorithm !== "t-SNE" ||
    !Number.isInteger(width) || width < 1 ||
    !["euclidean", "manhattan"].includes(artifact.metric) ||
    !Array.isArray(features) || features.length < 3 || features.length > 800 ||
    !Array.isArray(embedding) || embedding.length !== features.length ||
    !features.every((row) => Array.isArray(row) && row.length === width && row.every(Number.isFinite)) ||
    !embedding.every((row) => Array.isArray(row) && row.length === 2 && row.every(Number.isFinite))
  ) {
    throw new Error("This file does not contain a usable t-SNE reference model.");
  }
  return artifact;
}

function distance(a: number[], b: number[], metric: TSNEMetric) {
  return metric === "manhattan"
    ? a.reduce((sum, value, index) => sum + Math.abs(value - b[index]), 0)
    : Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));
}

export function projectWithTSNEArtifact(artifact: TSNEArtifact, point: number[]) {
  if (point.length !== artifact.inputDimensions || !point.every(Number.isFinite)) {
    throw new Error(`Enter ${artifact.inputDimensions} finite numeric feature values.`);
  }
  const neighbors = artifact.referenceFeatures
    .map((features, index) => ({ index, distance: distance(point, features, artifact.metric) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.min(5, artifact.referenceFeatures.length));
  if (neighbors[0].distance === 0) {
    return { position: [...artifact.embedding[neighbors[0].index]], neighbors, exact: true };
  }
  const weights = neighbors.map((neighbor) => 1 / Math.max(neighbor.distance, 1e-9) ** 2);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const position = [0, 1].map((axis) =>
    neighbors.reduce((sum, neighbor, index) =>
      sum + (weights[index] / total) * artifact.embedding[neighbor.index][axis], 0),
  );
  return { position, neighbors, exact: false };
}
