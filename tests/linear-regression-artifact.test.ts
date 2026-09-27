import { describe, expect, it } from 'vitest';
import {
  parseLinearRegressionArtifact,
  predictLinearRegression,
  type LinearRegressionArtifact,
} from '../src/lib/modelArtifacts/linearRegressionArtifact';

const artifact: LinearRegressionArtifact = {
  format: 'ml-suite-linear-regression-v1',
  algorithm: 'Multiple Linear Regression',
  datasetName: 'Test',
  createdAt: '2026-01-01T00:00:00.000Z',
  inputFeatures: ['area', 'age'],
  target: 'price',
  coefficients: { intercept: 5, weights: [2, -1] },
  trainingSamples: 10,
};

describe('linear regression artifact', () => {
  it('predicts from the exported intercept and ordered weights', () => {
    expect(predictLinearRegression(artifact, [4, 3])).toBe(10);
  });

  it('validates input and exported model shape', () => {
    expect(() => predictLinearRegression(artifact, [4])).toThrow(/2 finite/);
    expect(() => parseLinearRegressionArtifact({ ...artifact, coefficients: { intercept: 5, weights: [2] } })).toThrow(/usable/);
    expect(parseLinearRegressionArtifact(JSON.parse(JSON.stringify(artifact))).inputFeatures).toEqual(['area', 'age']);
  });
});
