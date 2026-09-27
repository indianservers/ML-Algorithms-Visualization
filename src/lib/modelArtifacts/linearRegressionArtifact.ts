export interface LinearRegressionArtifact {
  format: "ml-suite-linear-regression-v1";
  algorithm: string;
  datasetName: string;
  createdAt: string;
  inputFeatures: string[];
  target: string;
  coefficients: {
    intercept: number;
    weights: number[];
  };
  trainingSamples: number;
  metrics?: Record<string, number | null>;
}

export function parseLinearRegressionArtifact(value: unknown): LinearRegressionArtifact {
  if (!value || typeof value !== "object") throw new Error("Invalid regression model file.");
  const artifact = value as LinearRegressionArtifact;
  if (
    artifact.format !== "ml-suite-linear-regression-v1" ||
    !Array.isArray(artifact.inputFeatures) || artifact.inputFeatures.length < 1 ||
    !artifact.inputFeatures.every((feature) => typeof feature === "string" && feature.length > 0) ||
    !artifact.coefficients || !Number.isFinite(artifact.coefficients.intercept) ||
    !Array.isArray(artifact.coefficients.weights) ||
    artifact.coefficients.weights.length !== artifact.inputFeatures.length ||
    !artifact.coefficients.weights.every(Number.isFinite)
  ) {
    throw new Error("This file does not contain a usable linear regression model.");
  }
  return artifact;
}

export function predictLinearRegression(artifact: LinearRegressionArtifact, values: number[]) {
  if (values.length !== artifact.inputFeatures.length || !values.every(Number.isFinite)) {
    throw new Error(`Enter ${artifact.inputFeatures.length} finite numeric feature values.`);
  }
  return artifact.coefficients.intercept + values.reduce((sum, value, index) =>
    sum + value * artifact.coefficients.weights[index], 0);
}
