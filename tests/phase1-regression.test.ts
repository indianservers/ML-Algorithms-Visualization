import { describe, expect, it } from "vitest";
import {
  elasticNetRegression,
  lassoRegression,
  multipleLinearRegression,
  multipleLinearRegressionDiagnostics,
  polynomialFeatures,
  ridgeRegression,
  simpleLinearRegression,
} from "../src/lib/algorithms/regression/linearRegression";
import { trainGradientBoostingRegression } from "../src/lib/algorithms/regression/gradientBoostingRegression";
import {
  buildRegressionTree,
  predictRegressionTree,
  regressionTreePath,
} from "../src/lib/algorithms/regression/decisionTreeRegression";
import { trainRandomForestRegression } from "../src/lib/algorithms/regression/randomForestRegression";
import { trainSupportVectorRegression } from "../src/lib/algorithms/regression/supportVectorRegression";
import { mae, mse, rmse, rSquared } from "../src/lib/math/metrics";
import {
  fitStandardScalerTrainOnly,
  formatR2,
  inferenceRow,
  regressionMetrics,
  splitRegressionData,
} from "../src/lib/regression/regressionEval";
import { varianceInflationFactors } from "../src/lib/regression/regressionDiagnostics";
import {
  datasetAPerfectPositive,
  datasetBPerfectNegative,
  datasetFQuadratic,
  datasetIMulticollinearity,
  datasetJIrrelevantFeatures,
  datasetKPiecewise,
  datasetNConstantFeature,
  labPoints,
  labXy,
} from "../src/lib/regression/regressionDatasets";

describe("Phase 1 regression datasets and metrics", () => {
  it("recovers y = 1 + 2x on the perfect positive set", () => {
    const { x, y } = {
      x: labPoints(datasetAPerfectPositive).map((p) => p.x),
      y: labPoints(datasetAPerfectPositive).map((p) => p.y),
    };
    const model = simpleLinearRegression(x, y);
    expect(model.slope).toBeCloseTo(2, 8);
    expect(model.intercept).toBeCloseTo(1, 8);
    const pred = x.map(model.predict);
    expect(mae(y, pred)).toBeCloseTo(0, 10);
    expect(mse(y, pred)).toBeCloseTo(0, 10);
    expect(rmse(y, pred)).toBeCloseTo(0, 10);
    expect(rSquared(y, pred)).toBeCloseTo(1, 10);
    expect(regressionMetrics(y, pred).r2).toBe(1);
  });

  it("recovers a negative slope on the perfect negative set", () => {
    const pts = labPoints(datasetBPerfectNegative);
    const model = simpleLinearRegression(
      pts.map((p) => p.x),
      pts.map((p) => p.y),
    );
    expect(model.slope).toBeCloseTo(-2, 8);
    expect(rSquared(pts.map((p) => p.y), pts.map((p) => model.predict(p.x)))).toBeCloseTo(1, 8);
  });

  it("lets degree-2 polynomial beat degree-1 on y = x²", () => {
    const pts = labPoints(datasetFQuadratic());
    const x = pts.map((p) => p.x);
    const y = pts.map((p) => p.y);
    const linear = simpleLinearRegression(x, y);
    const poly = multipleLinearRegression(polynomialFeatures(x, 2), y);
    const linearPred = x.map(linear.predict);
    const polyPred = x.map((xi) => poly.predict(polynomialFeatures([xi], 2)[0]));
    expect(rSquared(y, polyPred)).toBeGreaterThan(0.99);
    expect(rSquared(y, linearPred)).toBeLessThan(rSquared(y, polyPred) - 0.2);
  });

  it("shrinks ridge coefficients as lambda grows", () => {
    const { X, y } = labXy(datasetJIrrelevantFeatures());
    const ols = ridgeRegression(X, y, 0);
    const heavy = ridgeRegression(X, y, 100);
    const mag = (c: number[]) => c.reduce((s, v) => s + Math.abs(v), 0);
    expect(mag(heavy.coefficients)).toBeLessThan(mag(ols.coefficients));
  });

  it("drives irrelevant lasso coefficients toward zero", () => {
    const { X, y } = labXy(datasetJIrrelevantFeatures());
    const model = lassoRegression(X, y, 0.8, 4000, 1e-5);
    expect(Math.abs(model.coefficients[0])).toBeGreaterThan(Math.abs(model.coefficients[1]));
    expect(Math.abs(model.coefficients[1])).toBeLessThan(0.15);
  });

  it("matches ridge at l1Ratio 0 and lasso at l1Ratio 1", () => {
    const { X, y } = labXy(datasetJIrrelevantFeatures());
    const ridge = ridgeRegression(X, y, 0.4);
    const enRidge = elasticNetRegression(X, y, 0.4, 0, 4000, 1e-5);
    const lasso = lassoRegression(X, y, 0.4, 4000, 1e-5);
    const enLasso = elasticNetRegression(X, y, 0.4, 1, 4000, 1e-5);
    const mag = (c: number[]) => c.reduce((s, v) => s + Math.abs(v), 0);
    expect(mag(enRidge.coefficients)).toBeLessThan(mag(ridgeRegression(X, y, 0).coefficients));
    expect(Math.abs(mag(enRidge.coefficients) - mag(ridge.coefficients)) / mag(ridge.coefficients)).toBeLessThan(0.6);
    lasso.coefficients.forEach((c, i) => expect(enLasso.coefficients[i]).toBeCloseTo(c, 1));
  });

  it("does not crash on multicollinear OLS", () => {
    const { X, y } = labXy(datasetIMulticollinearity());
    const model = multipleLinearRegressionDiagnostics(X, y);
    expect(model.predict(X[0])).toBeCloseTo(y[0], 4);
    expect(model.coefficients.every(Number.isFinite)).toBe(true);
  });

  it("follows the true CART path on piecewise data", () => {
    const { X, y } = labXy(datasetKPiecewise());
    const tree = buildRegressionTree(X, y, { maxDepth: 3, minSamplesLeaf: 2, minSamplesSplit: 4 });
    const row = X[0];
    const path = regressionTreePath(tree, row);
    expect(path.at(-1)?.value).toBeCloseTo(predictRegressionTree(tree, row), 10);
    expect(predictRegressionTree(tree, row)).toBeGreaterThan(7);
    expect(predictRegressionTree(tree, row)).toBeLessThan(9);
  });

  it("averages forest trees and grows with estimator count", () => {
    const { X, y } = labXy(datasetKPiecewise());
    const one = trainRandomForestRegression(X, y, {
      estimators: 1, maxDepth: 4, minSamplesLeaf: 2, maxFeatures: 1, sampleRate: 1, bootstrap: false, seed: 3,
    });
    const many = trainRandomForestRegression(X, y, {
      estimators: 12, maxDepth: 4, minSamplesLeaf: 2, maxFeatures: 1, sampleRate: 1, bootstrap: true, seed: 3,
    });
    expect(one.trees).toHaveLength(1);
    expect(many.trees).toHaveLength(12);
    const avg = many.predictDistribution(X[5]).reduce((s, v) => s + v, 0) / many.trees.length;
    expect(many.predict(X[5])).toBeCloseTo(avg, 8);
  });

  it("improves boosting RMSE across stages", () => {
    const { X, y } = labXy(datasetKPiecewise());
    const model = trainGradientBoostingRegression(X, y, {
      estimators: 8, learningRate: 0.4, maxDepth: 2, minSamplesLeaf: 2, subsample: 1, seed: 4,
    });
    expect(model.stages.at(-1)!.trainRmse).toBeLessThan(model.stages[0].trainRmse);
  });

  it("fits linear SVR on a line and RBF on a curve", () => {
    const lineX = datasetAPerfectPositive.rows.map((r) => [r.x]);
    const lineY = datasetAPerfectPositive.rows.map((r) => r.y);
    const linear = trainSupportVectorRegression(lineX, lineY, {
      kernel: "linear", c: 10, epsilon: 0.05, gamma: 1, epochs: 400, learningRate: 0.002,
    });
    expect(Math.abs(linear.predict([5]) - 11)).toBeLessThan(1.2);
    const curve = datasetFQuadratic();
    const rbf = trainSupportVectorRegression(
      curve.rows.map((r) => [r.x]),
      curve.rows.map((r) => r.y),
      { kernel: "rbf", c: 20, epsilon: 0.2, gamma: 0.4, epochs: 250 },
    );
    expect(rbf.supportIndices.length).toBeGreaterThan(0);
    expect(Number.isFinite(rbf.predict([0]))).toBe(true);
  });

  it("reports N/A R² for a non-perfect constant target while MAE stays defined", () => {
    const actual = [4, 4, 4, 4];
    const predicted = [4.5, 3.5, 4, 4];
    const metrics = regressionMetrics(actual, predicted);
    expect(metrics.targetVarianceZero).toBe(true);
    expect(metrics.r2).toBeNull();
    expect(metrics.mae).toBeCloseTo(0.25, 8);
    expect(Number.isFinite(metrics.rmse)).toBe(true);
  });

  it("formats a numerically perfect R² as 1.000", () => {
    expect(formatR2(0.999999999)).toBe("1.000");
  });

  it("reproduces a seeded train/test split without overlapping indices", () => {
    const { X, y } = labXy(datasetJIrrelevantFeatures());
    const a = splitRegressionData(X, y, 0.3, 11, true);
    const b = splitRegressionData(X, y, 0.3, 11, true);
    expect(a.trainIndices).toEqual(b.trainIndices);
    expect(a.testIndices).toEqual(b.testIndices);
    const overlap = a.trainIndices.filter((i) => a.testIndices.includes(i));
    expect(overlap).toHaveLength(0);
    expect(a.nTrain + a.nTest).toBe(y.length);
  });

  it("fits the scaler on train rows only", () => {
    const train = [[0], [2], [4]];
    const scaler = fitStandardScalerTrainOnly(train);
    expect(scaler.mean[0]).toBeCloseTo(2, 8);
    expect(scaler.transform([10])[0]).toBeCloseTo((10 - 2) / scaler.std[0], 8);
  });

  it("maps inference values by feature name, not form order", () => {
    const row = inferenceRow({ age: 10, area: 100, unused: 1 }, ["area", "age"]);
    expect(row).toEqual([100, 10]);
  });

  it("does not increase tree training RMSE when max depth grows on piecewise data", () => {
    const { X, y } = labXy(datasetKPiecewise());
    const shallow = buildRegressionTree(X, y, { maxDepth: 1, minSamplesLeaf: 2, minSamplesSplit: 4 });
    const deep = buildRegressionTree(X, y, { maxDepth: 8, minSamplesLeaf: 2, minSamplesSplit: 4 });
    const rmseOf = (tree: ReturnType<typeof buildRegressionTree>) =>
      rmse(y, X.map((row) => predictRegressionTree(tree, row)));
    expect(rmseOf(deep)).toBeLessThanOrEqual(rmseOf(shallow) + 1e-9);
  });

  it("reproduces a forest with the same seed", () => {
    const { X, y } = labXy(datasetKPiecewise());
    const opts = { estimators: 6, maxDepth: 3, minSamplesLeaf: 2, maxFeatures: 1, sampleRate: 1, bootstrap: true, seed: 9 };
    const a = trainRandomForestRegression(X, y, opts);
    const b = trainRandomForestRegression(X, y, opts);
    expect(a.predict(X[3])).toBeCloseTo(b.predict(X[3]), 10);
  });

  it("sums boosting stage contributions to the final prediction", () => {
    const { X, y } = labXy(datasetKPiecewise());
    const model = trainGradientBoostingRegression(X, y, {
      estimators: 5, learningRate: 0.3, maxDepth: 2, minSamplesLeaf: 2, subsample: 1, seed: 2,
    });
    expect(model.predict(X[4])).toBeCloseTo(model.predictAtStage(X[4], model.stages.length), 10);
  });

  it("computes VIF > 10 on duplicated area columns", () => {
    const { X } = labXy(datasetIMulticollinearity());
    const vif = varianceInflationFactors(X);
    expect(Math.max(...vif.filter(Number.isFinite), 0)).toBeGreaterThan(10);
  });

  it("handles a constant feature without exploding the scaler", () => {
    const { X, y } = labXy(datasetNConstantFeature());
    const scaler = fitStandardScalerTrainOnly(X);
    expect(scaler.std.every((s) => s >= 1 || Number.isFinite(s))).toBe(true);
    expect(ridgeRegression(scaler.transformAll(X), y, 1).coefficients.every(Number.isFinite)).toBe(true);
  });
});
