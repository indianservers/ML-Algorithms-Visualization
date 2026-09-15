import { describe, expect, it } from "vitest";
import { binaryMetrics, confusionMatrix, rocCurve } from "../src/lib/math/metrics";
import {
  applyThreshold,
  fitStandardScaler,
} from "../src/lib/classification/classificationEval";
import {
  datasetAPerfectBinary,
  datasetCXor,
  datasetDTwoMoons,
  datasetGIris,
  datasetKCounts,
  datasetLBernoulli,
} from "../src/lib/classification/classificationDatasets";
import { logisticRegression } from "../src/lib/algorithms/classification/logisticRegression";
import { knnPredict } from "../src/lib/algorithms/classification/knn";
import {
  trainBernoulliNB,
  trainGaussianNB,
  trainMultinomialNB,
} from "../src/lib/algorithms/classification/naiveBayes";
import {
  buildDecisionTree,
  classificationTreePath,
  predictTree,
} from "../src/lib/algorithms/classification/decisionTree";
import { trainRandomForestClassification } from "../src/lib/algorithms/classification/randomForestClassification";
import { trainSvmClassification } from "../src/lib/algorithms/classification/svmClassification";
import { multinomialLogisticRegression } from "../src/lib/algorithms/classification/multinomialLogisticRegression";

describe("Phase 2 classification metrics and models", () => {
  it("matches the known confusion-matrix sanity case", () => {
    const actual = [0, 0, 1, 1];
    const predicted = [0, 1, 1, 1];
    const m = binaryMetrics(actual, predicted);
    expect(m.tp).toBe(2);
    expect(m.tn).toBe(1);
    expect(m.fp).toBe(1);
    expect(m.fn).toBe(0);
    expect(m.accuracy).toBe(0.75);
    expect(m.precision).toBeCloseTo(2 / 3, 10);
    expect(m.recall).toBe(1);
    expect(m.f1).toBeCloseTo(0.8, 10);
    expect(confusionMatrix(actual, predicted)).toEqual([
      [1, 1],
      [0, 2],
    ]);
  });

  it("applies a probability threshold without retraining", () => {
    const scores = [0.1, 0.4, 0.6, 0.9];
    expect(applyThreshold(scores, 0.5)).toEqual([0, 0, 1, 1]);
    expect(applyThreshold(scores, 0.8)).toEqual([0, 0, 0, 1]);
  });

  it("fits a scaler on train only", () => {
    const train = [
      [0, 0],
      [2, 2],
    ];
    const test = [[10, 10]];
    const scaler = fitStandardScaler(train);
    expect(scaler.mean[0]).toBe(1);
    const scaledTest = scaler.transform(test[0]);
    expect(scaledTest[0]).toBeGreaterThan(5);
  });

  it("keeps sigmoid probabilities in (0, 1) and classifies at 0.5", () => {
    const X = [
      [-3],
      [-2],
      [2],
      [3],
    ];
    const y = [0, 0, 1, 1];
    const model = logisticRegression(X, y, 0.4, 400);
    const p = model.predictProba([3]);
    expect(p).toBeGreaterThan(0.8);
    expect(model.predict([-3])).toBe(0);
    expect(model.predict([3], 1)).toBe(0);
    expect(model.predict([3], 0.1)).toBe(1);
  });

  it("selects the true nearest neighbors for K=1", () => {
    const trainX = [
      [0, 0],
      [10, 10],
    ];
    const trainY = [0, 1];
    const one = knnPredict(trainX, trainY, [0.1, 0.1], 1, "euclidean");
    expect(one.predictedClass).toBe(0);
    expect(one.neighbors[0].index).toBe(0);
    const far = knnPredict(trainX, trainY, [9, 9], 1, "manhattan");
    expect(far.predictedClass).toBe(1);
  });

  it("lets a depth-1 tree recover a single-feature split", () => {
    const X = [
      [0, 1],
      [0.2, 1],
      [5, 1],
      [5.2, 1],
    ];
    const y = [0, 0, 1, 1];
    const tree = buildDecisionTree(X, y, 1, 1, "gini");
    expect(predictTree(tree, [0.1, 1])).toBe(0);
    expect(predictTree(tree, [5.1, 1])).toBe(1);
    const path = classificationTreePath(tree, [5.1, 1]);
    expect(path[0].wentLeft).toBe(false);
  });

  it("aggregates forest votes and keeps feature importance non-negative", () => {
    const points = datasetAPerfectBinary();
    const X = points.map((p) => [p.x, p.y]);
    const y = points.map((p) => p.label);
    const forest = trainRandomForestClassification(X, y, {
      estimators: 5,
      maxDepth: 3,
      maxFeatures: "sqrt",
      bootstrap: true,
      minSamplesSplit: 2,
      featureSampleRate: 1,
      seed: 42,
    });
    expect(forest.predict([-2, -2])).toBe(0);
    expect(forest.predict([2, 2])).toBe(1);
    const proba = forest.predictProba([2, 2]);
    const sum = Object.values(proba).reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(1, 8);
    expect(forest.featureImportance.every((v) => v >= 0)).toBe(true);
  });

  it("rejects multinomial NB on negative counts and accepts count data", () => {
    expect(() => trainMultinomialNB([[-1, 2]], [0])).toThrow();
    const rows = datasetKCounts();
    const model = trainMultinomialNB(
      rows.map((r) => r.features),
      rows.map((r) => r.label),
    );
    const p = model.predictProba(rows[0].features);
    const sum = Object.values(p).reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(1, 8);
  });

  it("trains Bernoulli NB only on 0/1 features", () => {
    expect(() => trainBernoulliNB([[2, 0]], [0])).toThrow();
    const rows = datasetLBernoulli();
    const model = trainBernoulliNB(
      rows.map((r) => r.features),
      rows.map((r) => r.label),
    );
    expect([0, 1]).toContain(model.predict(rows[0].features));
  });

  it("computes a real ROC-AUC above chance on separable logistic scores", () => {
    const points = datasetAPerfectBinary();
    const X = points.map((p) => [p.x, p.y]);
    const y = points.map((p) => p.label);
    const model = logisticRegression(X, y, 0.2, 500);
    const scores = X.map((row) => model.predictProba(row));
    const roc = rocCurve(y, scores);
    expect(roc.auc).toBeGreaterThan(0.9);
  });

  it("shows linear SVM struggling on XOR relative to RBF", () => {
    const xor = datasetCXor();
    const X = xor.map((p) => [p.x, p.y]);
    const y = xor.map((p) => p.label);
    const linear = trainSvmClassification(X, y, {
      C: 1,
      kernel: "linear",
      gamma: 1,
      standardize: true,
      maxPasses: 4,
      maxIterations: 400,
    });
    const rbf = trainSvmClassification(X, y, {
      C: 2,
      kernel: "rbf",
      gamma: 2,
      standardize: true,
      maxPasses: 4,
      maxIterations: 400,
    });
    const acc = (model: { predict: (row: number[]) => number }) =>
      y.filter((label, i) => model.predict(X[i]) === label).length / y.length;
    expect(acc(rbf)).toBeGreaterThan(acc(linear));
    expect(rbf.supportIndices.length).toBeGreaterThan(0);
  });

  it("preserves three iris class labels in softmax probabilities", () => {
    const rows = datasetGIris();
    const X = rows.map((r) => r.features);
    const y = rows.map((r) => r.label);
    const model = multinomialLogisticRegression(X, y, 3, 0.08, 250, 0.01);
    const p = model.predictProba(X[0]);
    expect(p).toHaveLength(3);
    expect(p.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 6);
    expect(new Set(X.map(model.predict)).size).toBeGreaterThanOrEqual(2);
  });

  it("reproduces moons with KNN and Gaussian NB class counts", () => {
    const moons = datasetDTwoMoons(60, 9);
    const X = moons.map((p) => [p.x, p.y]);
    const y = moons.map((p) => p.label);
    const nb = trainGaussianNB(X, y);
    const p = nb.predictProba(X[0]);
    expect(Object.values(p).reduce((s, v) => s + v, 0)).toBeCloseTo(1, 8);
    const knn = knnPredict(X, y, X[0], 3, "euclidean", "distance");
    expect([0, 1]).toContain(knn.predictedClass);
  });
});
