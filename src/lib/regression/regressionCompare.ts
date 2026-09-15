import {
  elasticNetRegression,
  lassoRegression,
  polynomialFeatures,
  ridgeRegression,
  simpleLinearRegression,
} from "../algorithms/regression/linearRegression";
import { buildRegressionTree, predictRegressionTree } from "../algorithms/regression/decisionTreeRegression";
import { trainRandomForestRegression } from "../algorithms/regression/randomForestRegression";
import { trainGradientBoostingRegression } from "../algorithms/regression/gradientBoostingRegression";
import { trainSupportVectorRegression } from "../algorithms/regression/supportVectorRegression";
import { splitRegressionData, regressionMetrics } from "./regressionEval";

export interface FairCompareRow {
  name: string;
  testMae: number;
  testRmse: number;
  testR2: number | null;
}

export function fairCompareModels(
  X: number[][],
  y: number[],
  seed = 42,
  testSize = 0.2,
): FairCompareRow[] {
  const split = splitRegressionData(X, y, testSize, seed, true);
  const p = X[0]?.length ?? 1;
  const rows: FairCompareRow[] = [];

  const push = (name: string, predict: (row: number[]) => number) => {
    const pred = split.testX.map(predict);
    const metrics = regressionMetrics(split.testY, pred, p);
    rows.push({
      name,
      testMae: metrics.mae,
      testRmse: metrics.rmse,
      testR2: metrics.r2,
    });
  };

  if (p === 1) {
    const linear = simpleLinearRegression(split.trainX.map((row) => row[0]), split.trainY);
    push("Linear", (row) => linear.predict(row[0]));
    const poly = ridgeRegression(
      polynomialFeatures(split.trainX.map((row) => row[0]), 3),
      split.trainY,
      0,
    );
    push("Polynomial (deg 3)", (row) => poly.predict(polynomialFeatures([row[0]], 3)[0]));
  } else {
    const ols = ridgeRegression(split.trainX, split.trainY, 0);
    push("Linear / OLS", (row) => ols.predict(row));
  }

  const ridge = ridgeRegression(split.trainX, split.trainY, 1);
  push("Ridge λ=1", (row) => ridge.predict(row));
  const lasso = lassoRegression(split.trainX, split.trainY, 0.2, 800, 1e-4);
  push("Lasso λ=0.2", (row) => lasso.predict(row));
  const elastic = elasticNetRegression(split.trainX, split.trainY, 0.2, 0.5, 800, 1e-4);
  push("Elastic Net", (row) => elastic.predict(row));

  const tree = buildRegressionTree(split.trainX, split.trainY, {
    maxDepth: 4,
    minSamplesLeaf: 2,
    minSamplesSplit: 4,
  });
  push("Decision Tree", (row) => predictRegressionTree(tree, row));

  const forest = trainRandomForestRegression(split.trainX, split.trainY, {
    estimators: 12,
    maxDepth: 4,
    minSamplesLeaf: 2,
    maxFeatures: Math.max(1, Math.floor(Math.sqrt(p))),
    sampleRate: 1,
    bootstrap: true,
    seed,
  });
  push("Random Forest", (row) => forest.predict(row));

  const boost = trainGradientBoostingRegression(split.trainX, split.trainY, {
    estimators: 8,
    learningRate: 0.2,
    maxDepth: 2,
    minSamplesLeaf: 2,
    subsample: 1,
    seed,
  });
  push("Gradient Boosting", (row) => boost.predict(row));

  const svr = trainSupportVectorRegression(split.trainX, split.trainY, {
    kernel: p === 1 ? "rbf" : "linear",
    c: 10,
    epsilon: 0.2,
    gamma: 0.4,
    epochs: 120,
  });
  push("SVR", (row) => svr.predict(row));

  return rows;
}
