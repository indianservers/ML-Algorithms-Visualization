import { describe, expect, it } from "vitest";
import {
  parseTSNEArtifact,
  projectWithTSNEArtifact,
  type TSNEArtifact,
} from "../src/lib/dimensionality/tsneArtifact";

const artifact: TSNEArtifact = {
  format: "ml-suite-tsne-reference-v1",
  algorithm: "t-SNE",
  datasetName: "Test",
  createdAt: "2026-01-01T00:00:00.000Z",
  inputDimensions: 2,
  metric: "euclidean",
  initialization: "pca",
  perplexity: 2,
  learningRate: 200,
  earlyExaggeration: 12,
  iterations: 300,
  seed: 42,
  inferenceMethod: "inverse-distance-neighbor-interpolation",
  referenceFeatures: [[0, 0], [2, 0], [0, 2]],
  embedding: [[0, 0], [10, 0], [0, 10]],
  labels: [0, 1, 2],
  quality: { trustworthiness: 1, continuity: 1, finalKl: 0, iterationsCompleted: 300 },
};

describe("t-SNE reference artifact", () => {
  it("returns saved coordinates for an exact reference sample", () => {
    expect(projectWithTSNEArtifact(artifact, [2, 0])).toMatchObject({
      position: [10, 0], exact: true,
    });
  });

  it("places a new point between nearby references", () => {
    const result = projectWithTSNEArtifact(artifact, [1, 0]);
    expect(result.exact).toBe(false);
    expect(result.position[0]).toBeGreaterThan(0);
    expect(result.position[0]).toBeLessThan(10);
    expect(result.position.every(Number.isFinite)).toBe(true);
  });

  it("rejects mismatched inputs and malformed exported data", () => {
    expect(() => projectWithTSNEArtifact(artifact, [1])).toThrow(/2 finite/);
    expect(() => parseTSNEArtifact({ ...artifact, embedding: [[0, 0]] })).toThrow(/usable/);
    expect(parseTSNEArtifact(JSON.parse(JSON.stringify(artifact))).embedding).toHaveLength(3);
  });
});
