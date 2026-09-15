import { knnClassifyAll } from "../algorithms/classification/knn";
import { logisticRegression } from "../algorithms/classification/logisticRegression";
import { buildDecisionTree, predictTree } from "../algorithms/classification/decisionTree";
import { trainRandomForestClassification } from "../algorithms/classification/randomForestClassification";
import { trainSvmClassification } from "../algorithms/classification/svmClassification";
import { trainGradientBoostingClassification } from "../algorithms/classification/gradientBoostingClassification";
import { binaryMetrics } from "../math/metrics";
import { classificationSplit, fitStandardScaler } from "./classificationEval";

export function fairCompareClassifiers(
  X: number[][],
  y: number[],
  seed = 42,
) {
  const split = classificationSplit(X, y, 0.25, seed);
  const scaler = fitStandardScaler(split.trainX);
  const train = scaler.transformAll(split.trainX);
  const test = scaler.transformAll(split.testX);
  const logit = logisticRegression(train, split.trainY, 0.2, 400, undefined, 0.01);
  const tree = buildDecisionTree(split.trainX, split.trainY, 4, 2);
  const forest = trainRandomForestClassification(split.trainX, split.trainY, {
    estimators: 8,
    maxDepth: 4,
    maxFeatures: "sqrt",
    bootstrap: true,
    minSamplesSplit: 2,
    featureSampleRate: 1,
    seed,
  });
  const svm = trainSvmClassification(train, split.trainY, {
    C: 1,
    kernel: "rbf",
    gamma: 1,
    standardize: false,
    maxPasses: 4,
    maxIterations: 250,
  });
  const boosting = trainGradientBoostingClassification(split.trainX, split.trainY, {
    estimators: 6,
    learningRate: 0.4,
    maxDepth: 2,
    subsample: 1,
    seed,
  });
  const knnPred = knnClassifyAll(split.trainX, split.trainY, split.testX, Math.min(5, split.trainX.length));
  const score = (pred: number[]) => binaryMetrics(split.testY, pred);
  return {
    nTrain: split.nTrain,
    nTest: split.nTest,
    seed,
    models: {
      logistic: score(test.map((row) => logit.predict(row))),
      knn: score(knnPred),
      tree: score(split.testX.map((row) => predictTree(tree, row))),
      forest: score(split.testX.map((row) => forest.predict(row))),
      svm: score(test.map((row) => svm.predict(row))),
      boosting: score(split.testX.map((row) => boosting.predict(row))),
    },
  };
}
