import { mean } from '../../math/statistics';
import {
  applyFeatureScale,
  fitFeatureScale,
  invertFeatureScale,
  reconstructionMae,
  reconstructionMse,
  type FeatureScaleMode,
  type FittedFeatureScale,
} from '../../dimensionality/dimensionalityPrep';

export interface PCAResult {
  components: number[][];
  explainedVariance: number[];
  explainedVarianceRatio: number[];
  cumulativeExplainedVariance: number[];
  projections: number[][];
  covarianceMatrix: number[][];
  eigenvalues: number[];
  mean: number[];
  scale: FittedFeatureScale;
  reconstructed: number[][];
  reconstructionMse: number;
  reconstructionMae: number;
}

function covarianceMatrix(Xs: number[][]): number[][] {
  const n = Xs.length;
  const p = Xs[0].length;
  return Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) => {
      const mi = mean(Xs.map(row => row[i]));
      const mj = mean(Xs.map(row => row[j]));
      return Xs.reduce((s, row) => s + (row[i] - mi) * (row[j] - mj), 0) / (n - 1);
    })
  );
}

function powerIteration(A: number[][], numComponents: number, maxIter = 500): { vectors: number[][]; values: number[] } {
  const p = A.length;
  const vectors: number[][] = [];
  const values: number[] = [];
  const deflated = A.map(row => [...row]);

  for (let k = 0; k < numComponents; k++) {
    let v = Array.from({ length: p }, (_, index) => Math.sin((k + 1) * (index + 1) * 1.61803398875));
    let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    v = v.map(x => x / (norm || 1));

    for (let iter = 0; iter < maxIter; iter++) {
      const Av = deflated.map(row => row.reduce((s, x, j) => s + x * v[j], 0));
      norm = Math.sqrt(Av.reduce((s, x) => s + x * x, 0));
      if (norm < 1e-10) break;
      const vNew = Av.map(x => x / norm);
      if (v.reduce((s, x, j) => s + Math.abs(x - vNew[j]), 0) < 1e-8) { v = vNew; break; }
      v = vNew;
    }
    const pivot = v.reduce((best, value, index) => Math.abs(value) > Math.abs(v[best]) ? index : best, 0);
    if (v[pivot] < 0) v = v.map(value => -value);
    const eigenvalue = deflated.map((row, i) => row.reduce((s, x, j) => s + x * v[j], 0) * v[i]).reduce((a, b) => a + b, 0);
    vectors.push(v);
    values.push(Math.max(eigenvalue, 0));
    for (let i = 0; i < p; i++)
      for (let j = 0; j < p; j++)
        deflated[i][j] -= eigenvalue * v[i] * v[j];
  }
  return { vectors, values };
}

export function reconstructFromComponents(
  projections: number[][],
  components: number[][],
  colMeans: number[],
  scale: FittedFeatureScale,
) {
  const scaled = projections.map(scoreRow =>
    colMeans.map((center, featureIndex) =>
      center + components.reduce((sum, vector, componentIndex) => sum + scoreRow[componentIndex] * vector[featureIndex], 0),
    ),
  );
  return invertFeatureScale(scaled, scale);
}

export function transformPca(Xnew: number[][], model: PCAResult) {
  const scaled = applyFeatureScale(Xnew, model.scale);
  const centered = scaled.map(row => row.map((value, j) => value - model.mean[j]));
  return centered.map(row => model.components.map(vector => row.reduce((sum, value, j) => sum + value * vector[j], 0)));
}

export function pca(X: number[][], numComponents = 2, scale: FeatureScaleMode = 'none'): PCAResult {
  if (X.length < 2) throw new Error('PCA requires at least two samples');
  if (!X[0]?.length) throw new Error('PCA requires at least one feature');
  const width = X[0].length;
  if (!X.every(row => row.length === width && row.every(Number.isFinite))) throw new Error('PCA requires a rectangular matrix of finite values');
  if (!Number.isInteger(numComponents) || numComponents < 1) throw new Error('PCA component count must be a positive integer');
  const fitted = fitFeatureScale(X, scale);
  const Xs = applyFeatureScale(X, fitted);
  const p = Xs[0].length;
  const colMeans = Array.from({ length: p }, (_, j) => mean(Xs.map(row => row[j])));
  const Xc = Xs.map(row => row.map((v, j) => v - colMeans[j]));
  const cov = covarianceMatrix(Xc);
  const k = Math.min(numComponents, p, X.length - 1);
  const { vectors, values } = powerIteration(cov, k);
  const totalVar = cov.reduce((sum, row, i) => sum + row[i], 0) || 1;
  const projections = Xc.map(row =>
    vectors.map(v => row.reduce((s, x, j) => s + x * v[j], 0))
  );
  const ratios = values.map(v => v / totalVar);
  let cumulative = 0;
  const cumulativeExplainedVariance = ratios.map(ratio => {
    cumulative += ratio;
    return cumulative;
  });
  const reconstructed = reconstructFromComponents(projections, vectors, colMeans, fitted);
  return {
    components: vectors,
    explainedVariance: values,
    explainedVarianceRatio: ratios,
    cumulativeExplainedVariance,
    projections,
    covarianceMatrix: cov,
    eigenvalues: values,
    mean: colMeans,
    scale: fitted,
    reconstructed,
    reconstructionMse: reconstructionMse(X, reconstructed),
    reconstructionMae: reconstructionMae(X, reconstructed),
  };
}

export function pcaLoadings(result: PCAResult, featureNames: string[]) {
  return featureNames.map((name, j) => ({
    feature: name,
    loadings: result.components.map(vector => vector[j] ?? 0),
  }));
}

export function topLoadingFeatures(result: PCAResult, featureNames: string[], componentIndex: number, count = 3) {
  return featureNames
    .map((name, j) => ({ name, loading: result.components[componentIndex]?.[j] ?? 0 }))
    .sort((a, b) => Math.abs(b.loading) - Math.abs(a.loading))
    .slice(0, count);
}
