import { describe, expect, it } from "vitest";
import {
  adjustedRSquared,
  binaryMetrics,
  confusionMatrix,
  logLoss,
  mae,
  mse,
  precisionRecallCurve,
  rSquared,
  rmse,
  rocCurve,
} from "../src/lib/math/metrics";
import {
  correlation,
  normalize,
  softmax,
  standardize,
} from "../src/lib/math/statistics";
import {
  elasticNetRegression,
  lassoRegression,
  multipleLinearRegression,
  polynomialFeatures,
  ridgeRegression,
  simpleLinearRegression,
} from "../src/lib/algorithms/regression/linearRegression";
import { logisticRegression } from "../src/lib/algorithms/classification/logisticRegression";
import {
  buildDecisionTree,
  predictTree,
} from "../src/lib/algorithms/classification/decisionTree";
import { knnPredict } from "../src/lib/algorithms/classification/knn";
import { trainGaussianNB } from "../src/lib/algorithms/classification/naiveBayes";
import { trainAdaBoostClassification } from "../src/lib/algorithms/classification/adaBoostClassification";
import { trainGradientBoostingClassification } from "../src/lib/algorithms/classification/gradientBoostingClassification";
import { trainRandomForestClassification } from "../src/lib/algorithms/classification/randomForestClassification";
import { trainSvmClassification } from "../src/lib/algorithms/classification/svmClassification";
import { dbscan } from "../src/lib/algorithms/clustering/dbscan";
import { kmeans } from "../src/lib/algorithms/clustering/kmeans";
import { trainKMedoids } from "../src/lib/algorithms/clustering/kMedoids";
import { fitGaussianMixture } from "../src/lib/algorithms/clustering/gaussianMixture";
import { meanShift } from "../src/lib/algorithms/clustering/meanShift";
import { trainHierarchicalClustering } from "../src/lib/algorithms/clustering/hierarchicalClustering";
import { spectralClustering } from "../src/lib/algorithms/clustering/spectralClustering";
import { optics } from "../src/lib/algorithms/clustering/optics";
import { pca } from "../src/lib/algorithms/dimensionality/pca";
import { kernelPCA } from "../src/lib/algorithms/dimensionality/kernelPCA";
import { linearDiscriminantAnalysis } from "../src/lib/algorithms/dimensionality/lda";
import { tsne } from "../src/lib/algorithms/dimensionality/tsne";
import { umap } from "../src/lib/algorithms/dimensionality/umap";
import { convolve2d, maxPool2d } from "../src/lib/algorithms/neural/cnn";
import { runBackpropagation } from "../src/lib/algorithms/neural/backpropagation";
import { runAttention, runMultiHeadAttention } from "../src/lib/algorithms/neural/attention";
import { trainPerceptron } from "../src/lib/algorithms/neural/perceptron";
import { createDefaultGrid, qLearning } from "../src/lib/algorithms/reinforcement/qLearning";
import { parseCSV, parseJSONDataset, toCSV } from "../src/lib/preprocessing/datasetIO";
import { kFoldSplit, trainTestSplit } from "../src/lib/preprocessing/trainTestSplit";
import { detectOutliers } from "../src/lib/preprocessing/outlierDetection";
import { expandPolynomial } from "../src/lib/preprocessing/polynomialFeatures";
import { differenceSeries, fitArima } from "../src/lib/timeSeries/arima";
import { exponentialSmoothing } from "../src/lib/timeSeries/exponentialSmoothing";
import { holtWinters } from "../src/lib/timeSeries/holtWinters";
import { movingAverage } from "../src/lib/timeSeries/movingAverage";
import { trainSupportVectorRegression } from "../src/lib/algorithms/regression/supportVectorRegression";
import { evaluateMulticlass } from "../src/lib/evaluation/multiclassMetrics";
import { crossValidate } from "../src/lib/evaluation/crossValidation";
import { polynomialTerms } from "../src/lib/preprocessing/polynomialFeatures";
import { euclideanDistance, linspace, median, quantile, shuffle } from "../src/lib/math/statistics";

const productionModules = import.meta.glob([
  "../src/lib/algorithms/**/*.ts",
  "../src/lib/evaluation/**/*.ts",
  "../src/lib/preprocessing/**/*.ts",
  "../src/lib/timeSeries/**/*.ts",
], { eager: true });

const separatedX = [[0, 0], [0, 1], [1, 0], [8, 8], [8, 9], [9, 8]];
const binaryY = [0, 0, 0, 1, 1, 1];

describe("production module coverage", () => {
  it("loads every algorithm, evaluation, preprocessing, and forecasting engine", () => {
    expect(Object.keys(productionModules).length).toBeGreaterThan(50);
    for (const [path, module] of Object.entries(productionModules)) {
      expect(Object.values(module as Record<string, unknown>).some(value => typeof value === "function"), path).toBe(true);
    }
  });
});

describe("metrics and statistics", () => {
  it("computes regression and classification metrics", () => {
    expect(mse([1, 2, 3], [1, 2, 3])).toBe(0);
    expect(rmse([1, 2, 3], [2, 2, 2])).toBeCloseTo(Math.sqrt(2 / 3));
    expect(mae([1, 2, 3], [2, 2, 2])).toBeCloseTo(2 / 3);
    expect(rSquared([1, 2, 3], [1, 2, 3])).toBe(1);
    expect(adjustedRSquared([1, 2, 3, 4], [1, 2, 3, 4], 1)).toBe(1);
    expect(confusionMatrix([0, 0, 1, 1], [0, 1, 0, 1])).toEqual([[1, 1], [1, 1]]);
    expect(binaryMetrics([0, 0, 1, 1], [0, 1, 0, 1]).accuracy).toBe(0.5);
    expect(logLoss([0, 1], [0.1, 0.9])).toBeLessThan(0.11);
    expect(rocCurve([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9]).auc).toBe(1);
    expect(precisionRecallCurve([0, 1], [0.1, 0.9]).recall.at(-1)).toBe(1);
    expect(correlation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(normalize([2, 4, 6])).toEqual([0, 0.5, 1]);
    expect(standardize([1, 2, 3]).reduce((a, b) => a + b, 0)).toBeCloseTo(0);
    expect(softmax([1, 2, 3]).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("rejects malformed metrics and handles constant targets correctly", () => {
    expect(() => mse([1], [])).toThrow(/equal length/);
    expect(() => logLoss([0, 1], [0.2, 1.2])).toThrow(/between 0 and 1/);
    expect(() => adjustedRSquared([1, 2], [1, 2], 1)).toThrow(/more samples/);
    expect(rSquared([2, 2], [1, 1])).toBe(0);
  });

  it("enforces mathematical domains instead of leaking NaN", () => {
    expect(() => median([])).toThrow(/at least one/);
    expect(() => quantile([1, 2], 1.1)).toThrow(/between 0 and 1/);
    expect(() => euclideanDistance([1, 2], [1])).toThrow(/equal length/);
    expect(linspace(0, 1, 0)).toEqual([]);
    expect(shuffle([0, 1, 2, 3], 123)).toEqual(shuffle([0, 1, 2, 3], 123));
  });

  it("rejects invalid multiclass indices rather than omitting observations", () => {
    expect(() => evaluateMulticlass([0, 2], [0, 1], ["a", "b"])).toThrow(/indices/);
    expect(evaluateMulticlass([0, 1], [0, 1], ["a", "b"]).total).toBe(2);
  });
});

describe("regression", () => {
  it("fits linear, regularized, and polynomial models", () => {
    const x = [0, 1, 2, 3, 4];
    const y = x.map((value) => 2 * value + 1);
    const simple = simpleLinearRegression(x, y);
    expect(simple.slope).toBeCloseTo(2);
    expect(simple.intercept).toBeCloseTo(1);
    const X = x.map((value) => [value, value * value]);
    const multi = multipleLinearRegression(X, y);
    expect(multi.predict([5, 25])).toBeCloseTo(11, 4);
    expect(ridgeRegression(X, y, 0.1).predict([2, 4])).toBeGreaterThan(4);
    expect(lassoRegression(X, y, 0.01).coefficients).toHaveLength(2);
    expect(elasticNetRegression(X, y, 0.01, 0.5).coefficients).toHaveLength(2);
    expect(polynomialFeatures([2], 3)).toEqual([[2, 4, 8]]);
  });

  it("keeps coordinate descent finite for constant columns and no-intercept models", () => {
    const constant = [[1], [1], [1], [1]];
    expect(lassoRegression(constant, [1, 2, 3, 4], 0).coefficients.every(Number.isFinite)).toBe(true);
    const throughOrigin = lassoRegression([[1], [2], [3]], [2, 4, 6], 0, 1000, 1e-7, true, false);
    expect(throughOrigin.intercept).toBe(0);
    expect(throughOrigin.coefficients[0]).toBeCloseTo(2, 3);
  });

  it("optimizes a mathematically consistent epsilon-insensitive SVR objective", () => {
    const X = Array.from({ length: 12 }, (_, i) => [i]);
    const y = X.map(([value]) => 1.5 * value - 2);
    const model = trainSupportVectorRegression(X, y, {
      kernel: "linear", c: 1, epsilon: 0.1, gamma: 1, epochs: 300, learningRate: 0.001,
    });
    expect(model.lossHistory.every(Number.isFinite)).toBe(true);
    expect(model.lossHistory.at(-1)!).toBeLessThan(model.lossHistory[0]);
    expect(Math.abs(model.predict([8]) - 10)).toBeLessThan(2);
    expect(() => model.predict([])).toThrow(/finite features/);
  });
});

describe("classification", () => {
  it("learns separable binary data across core classifiers", () => {
    const logistic = logisticRegression(separatedX, binaryY, 0.1, 400);
    expect(separatedX.map(logistic.predict)).toEqual(binaryY);
    const tree = buildDecisionTree(separatedX, binaryY, 3, 1);
    expect(separatedX.map((row) => predictTree(tree, row))).toEqual(binaryY);
    expect(knnPredict(separatedX, binaryY, [8.5, 8.5], 3).predictedClass).toBe(1);
    expect(trainGaussianNB(separatedX, binaryY).predict([0.2, 0.2])).toBe(0);
    expect(trainAdaBoostClassification(separatedX, binaryY, { rounds: 8, learningRate: 1 }).predict([8.5, 8.5])).toBe(1);
    expect(trainGradientBoostingClassification(separatedX, binaryY, { estimators: 8, learningRate: 0.2, maxDepth: 2, subsample: 1 }).predict([8.5, 8.5])).toBe(1);
    const forest = trainRandomForestClassification(separatedX, binaryY, { estimators: 15, maxDepth: 4, maxFeatures: "all", bootstrap: true, minSamplesSplit: 2, featureSampleRate: 1, seed: 7 });
    expect(forest.predict([8.5, 8.5])).toBe(1);
  });

  it("computes the nonlinear SVM margin in reproducing-kernel space", () => {
    const gamma = 0.4;
    const model = trainSvmClassification(separatedX, binaryY, {
      C: 2, kernel: "rbf", gamma, standardize: true, maxIterations: 1500,
    });
    const means = [0, 1].map(j => separatedX.reduce((sum, row) => sum + row[j], 0) / separatedX.length);
    const scales = means.map((mean, j) => Math.sqrt(separatedX.reduce((sum, row) => sum + (row[j] - mean) ** 2, 0) / separatedX.length) || 1);
    const scaled = separatedX.map(row => row.map((value, j) => (value - means[j]) / scales[j]));
    const signed = binaryY.map(value => value ? 1 : -1);
    const normSquared = model.supportIndices.reduce((outer, i) => outer + model.supportIndices.reduce((inner, j) => {
      const squared = scaled[i].reduce((sum, value, d) => sum + (value - scaled[j][d]) ** 2, 0);
      return inner + model.alphas[i] * signed[i] * model.alphas[j] * signed[j] * Math.exp(-gamma * squared);
    }, 0), 0);
    expect(model.marginWidth).toBeCloseTo(2 / Math.sqrt(normSquared), 8);
    expect(() => model.score([1])).toThrow(/finite features/);
  });
});

describe("clustering and dimensionality reduction", () => {
  it("finds the two obvious clusters", () => {
    expect(new Set(kmeans(separatedX, 2, 50, "kmeans++", 7).assignments).size).toBe(2);
    expect(dbscan(separatedX, 2, 2).numClusters).toBe(2);
    expect(new Set(trainKMedoids(separatedX, { k: 2, maxIterations: 20, metric: "euclidean", init: "kmedoids++", seed: 7 }).assignments).size).toBe(2);
    expect(new Set(fitGaussianMixture(separatedX, 2, 20).assignments).size).toBe(2);
    expect(meanShift(separatedX, 2).centers).toHaveLength(2);
    expect(trainHierarchicalClustering(separatedX).merges).toHaveLength(separatedX.length - 1);
    expect(spectralClustering(separatedX, 2, 1, 3, "euclidean", "rbf", true, 7).labels).toHaveLength(separatedX.length);
    expect(optics(separatedX, 2, Infinity, 2).ordering).toHaveLength(separatedX.length);
  });

  it("produces finite, correctly shaped embeddings", () => {
    const X = Array.from({ length: 12 }, (_, i) => [i, i % 3, Math.sin(i)]);
    const embeddings = [
      pca(X, 2).projections,
      kernelPCA(X, 2).projection,
      linearDiscriminantAnalysis(X, X.map((_, i) => i < 6 ? 0 : 1)).scores.map((value) => [value]),
      tsne(X, 3, 20, 4, 40, "euclidean", "pca", 7).embedding,
      umap(X, 4, 0.1, "euclidean", 7, 1, 40).embedding,
    ];
    for (const embedding of embeddings) {
      expect(embedding).toHaveLength(X.length);
      expect(embedding.flat().every(Number.isFinite)).toBe(true);
    }
  });

  it("does not normalize a partial kernel-PCA spectrum to 100 percent", () => {
    const X = [[-2, 0], [-1, 1], [0, 0], [1, -1], [2, 0]];
    const result = kernelPCA(X, 1, "rbf", 0.4);
    expect(result.explainedVariance).toHaveLength(1);
    expect(result.explainedVariance[0]).toBeGreaterThan(0);
    expect(result.explainedVariance[0]).toBeLessThan(1);
  });

  it("keeps PCA deterministic and rejects malformed matrices", () => {
    const X = [[1, 2], [2, 4], [3, 6]];
    expect(pca(X, 2)).toEqual(pca(X, 2));
    expect(() => pca([[1, 2]], 1)).toThrow(/two samples/);
    expect(() => pca([[1, 2], [3]], 1)).toThrow(/rectangular/);
  });

  it("returns a self-consistent EM solution and standard normalized cut", () => {
    const mixture = fitGaussianMixture(separatedX, 2, 30);
    expect(mixture.responsibilities.every((row) =>
      row.every((value) => value >= 0 && value <= 1) &&
      Math.abs(row.reduce((sum, value) => sum + value, 0) - 1) < 1e-9,
    )).toBe(true);
    expect(mixture.history.every((state, index, history) =>
      index === 0 || state.logLikelihood + 1e-8 >= history[index - 1].logLikelihood,
    )).toBe(true);
    const spectral = spectralClustering(separatedX, 2, 1, 3, "euclidean", "rbf", true, 7);
    const volumes = Array(2).fill(0) as number[];
    const cuts = Array(2).fill(0) as number[];
    spectral.affinity.forEach((row, i) => row.forEach((weight, j) => {
      volumes[spectral.labels[i]] += weight;
      if (spectral.labels[i] !== spectral.labels[j]) cuts[spectral.labels[i]] += weight;
    }));
    const expected = cuts.reduce((sum, cut, cluster) =>
      sum + cut / Math.max(1e-12, volumes[cluster]), 0);
    expect(spectral.normalizedCut).toBeCloseTo(expected, 10);
  });
});

describe("neural primitives and reinforcement learning", () => {
  it("computes convolution, pooling, attention, and perceptron outputs", () => {
    expect(convolve2d([[1, 2], [3, 4]], [[1]], 1, 0)).toEqual([[1, 2], [3, 4]]);
    expect(maxPool2d([[1, 2], [3, 4]], 2)).toEqual([[4]]);
    const attention = runAttention(["a", "b", "c"], 1, 1);
    expect(attention.weights.every((row) => Math.abs(row.reduce((a, b) => a + b, 0) - 1) < 1e-9)).toBe(true);
    expect(runMultiHeadAttention(["a", "b"], 2, 1, false, 0, true).heads).toHaveLength(2);
    const perceptron = trainPerceptron([[0], [1], [2], [3]], [0, 0, 1, 1], 0.1, 30);
    expect(perceptron.steps.length).toBeGreaterThan(0);
  });

  it("learns a useful deterministic grid-world policy", () => {
    const first = qLearning(createDefaultGrid(), 0.2, 0.95, 0.2, 400, 42);
    const second = qLearning(createDefaultGrid(), 0.2, 0.95, 0.2, 400, 42);
    expect(first).toEqual(second);
    expect(first.episodeRewards.slice(-50).reduce((a, b) => a + b, 0) / 50).toBeGreaterThan(5);
  });

  it("uses gradients that match the displayed mean-squared error", () => {
    const result = runBackpropagation([0.4, -0.2], [0.1, 0.8], "tanh", 0.05);
    result.outputDelta.forEach((delta, index) => {
      expect(delta).toBeCloseTo(
        (2 * (result.output[index] - result.target[index])) / result.target.length,
        12,
      );
    });
    result.gradient2.forEach((row, hidden) => row.forEach((gradient, output) => {
      expect(gradient).toBeCloseTo(result.hidden[hidden] * result.outputDelta[output], 12);
    }));
  });
});

describe("data, preprocessing, and time series", () => {
  it("round-trips quoted CSV and parses JSON", () => {
    const parsed = parseCSV('name,value\n"a,b",2\n"quoted ""name""",3');
    expect(parsed.data[0].name).toBe("a,b");
    expect(parseCSV(toCSV(parsed.columns, parsed.data))).toEqual(parsed);
    expect(parseJSONDataset('[{"x":1,"y":2}]').columns).toEqual(["x", "y"]);
  });

  it("splits without overlap and expands features", () => {
    const rows = Array.from({ length: 20 }, (_, i) => i);
    const labels = rows.map((i) => i % 2);
    const split = trainTestSplit(rows, labels, 0.25, 7, true);
    expect(new Set([...split.trainIndices, ...split.testIndices]).size).toBe(rows.length);
    expect(kFoldSplit(rows, labels, 5).flatMap((fold) => fold.testIndices).sort((a, b) => a - b)).toEqual(rows);
    expect(expandPolynomial([{ a: 2, b: 3 }], ["a", "b"], 2).matrix[0]).toContain(6);
    expect(detectOutliers([1, 1, 1, 1, 100], "iqr").at(-1)?.band).not.toBe("normal");
    expect(kFoldSplit(rows, labels, 5, 7)).toEqual(kFoldSplit(rows, labels, 5, 7));
    expect(() => trainTestSplit(rows, labels.slice(1))).toThrow(/one label/);
    expect(() => kFoldSplit(rows, labels, 21)).toThrow(/between 2 and 20/);
  });

  it("handles polynomial degree zero and validates cross-validation folds", () => {
    expect(polynomialTerms(["x"], 0, true)).toEqual([{ name: "1", powers: [0] }]);
    expect(polynomialTerms(["x"], 0, false)).toEqual([]);
    const rows = Array.from({ length: 6 }, (_, i) => ({ features: [i], label: i % 2 }));
    expect(() => crossValidate(rows, 2.5)).toThrow(/integer/);
    expect(() => crossValidate(rows, 4, true)).toThrow(/every class/);
  });

  it("returns stable forecasts with expected horizons", () => {
    const values = Array.from({ length: 30 }, (_, i) => 10 + i * 0.5 + Math.sin(i));
    expect(differenceSeries([1, 3, 6], 1)).toEqual([2, 3]);
    expect(movingAverage([1, 2, 3, 4], 2)).toEqual([1, 1.5, 2.5, 3.5]);
    expect(exponentialSmoothing(values, 0.3, 5).forecast).toHaveLength(5);
    expect(holtWinters(values, 5, 0.3, 0.1, 0.1, 4).forecast).toHaveLength(4);
    expect(fitArima(values, 1, 1, 0, 4).forecast).toHaveLength(4);
  });

  it("uses the correct one-step SES forecast variance", () => {
    const result = exponentialSmoothing([1, 3, 2, 5], 0.4, 3, 0.95);
    expect(result.upper[0] - result.forecast[0]).toBeCloseTo(1.96 * result.metrics.rmse, 12);
    expect(() => exponentialSmoothing([], 0.4, 2)).toThrow(/observations/);
  });
});

describe("performance guardrails", () => {
  it("keeps representative CPU algorithms interactive", () => {
    const X = Array.from({ length: 250 }, (_, i) => [Math.sin(i), Math.cos(i), i % 7]);
    const started = performance.now();
    kmeans(X, 4, 50, "kmeans++", 7);
    trainRandomForestClassification(X, X.map((_, i) => i % 2), { estimators: 20, maxDepth: 6, maxFeatures: "sqrt", bootstrap: true, minSamplesSplit: 2, featureSampleRate: 1, seed: 7 });
    expect(performance.now() - started).toBeLessThan(2500);
  });
});
