import {
  buildRegressionTree,
  predictRegressionTree,
  type RegressionTreeNode,
} from "./decisionTreeRegression";

export interface GradientBoostingRegressionOptions {
  estimators: number;
  learningRate: number;
  maxDepth: number;
  minSamplesLeaf: number;
  subsample: number;
  seed: number;
  validationFraction?: number;
  earlyStopping?: boolean;
  patience?: number;
}

export interface GradientBoostingStage {
  tree: RegressionTreeNode;
  residualsBefore: number[];
  predictions: number[];
  trainRmse: number;
  validationRmse: number | null;
}

export interface GradientBoostingRegressionModel {
  baseline: number;
  stages: GradientBoostingStage[];
  learningRate: number;
  maxDepth: number;
  featureImportance: number[];
  predict: (row: number[]) => number;
  predictAtStage: (row: number[], stage: number) => number;
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rmse(actual: number[], predicted: number[]) {
  return Math.sqrt(
    mean(actual.map((value, index) => (value - predicted[index]) ** 2)),
  );
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleIndices(length: number, fraction: number, seed: number) {
  const random = seededRandom(seed);
  const indices = Array.from({ length }, (_, index) => index);
  for (let index = indices.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [indices[index], indices[other]] = [indices[other], indices[index]];
  }
  return indices.slice(0, Math.max(2, Math.round(length * fraction)));
}

function collectImportance(node: RegressionTreeNode, totals: number[]) {
  if (node.featureIndex !== undefined) {
    totals[node.featureIndex] += node.gain * node.samples;
  }
  if (node.left) collectImportance(node.left, totals);
  if (node.right) collectImportance(node.right, totals);
}

export function trainGradientBoostingRegression(
  X: number[][],
  y: number[],
  options: GradientBoostingRegressionOptions,
): GradientBoostingRegressionModel {
  if (!X.length || X.length !== y.length)
    throw new Error(
      "Gradient boosting requires matching non-empty X and y arrays.",
    );
  const validationCount = Math.max(
    0,
    Math.min(
      X.length - 2,
      Math.round(X.length * (options.validationFraction ?? 0)),
    ),
  );
  const trainEnd = X.length - validationCount;
  const trainX = X.slice(0, trainEnd);
  const trainY = y.slice(0, trainEnd);
  const validationX = X.slice(trainEnd);
  const validationY = y.slice(trainEnd);
  const baseline = mean(trainY);
  let trainPredictions = trainY.map(() => baseline);
  let validationPredictions = validationY.map(() => baseline);
  const stages: GradientBoostingStage[] = [];
  const featureImportance = Array(X[0].length).fill(0);
  let bestValidation = Infinity;
  let staleStages = 0;

  for (let stageIndex = 0; stageIndex < options.estimators; stageIndex++) {
    const residuals = trainY.map(
      (target, index) => target - trainPredictions[index],
    );
    const indices = sampleIndices(
      trainX.length,
      Math.max(0.1, Math.min(1, options.subsample)),
      options.seed + stageIndex * 104729,
    );
    const tree = buildRegressionTree(
      indices.map((index) => trainX[index]),
      indices.map((index) => residuals[index]),
      {
        maxDepth: options.maxDepth,
        minSamplesLeaf: Math.min(
          options.minSamplesLeaf,
          Math.max(1, Math.floor(indices.length / 4)),
        ),
      },
    );
    const stagePredictions = trainX.map((row) =>
      predictRegressionTree(tree, row),
    );
    trainPredictions = trainPredictions.map(
      (prediction, index) =>
        prediction + options.learningRate * stagePredictions[index],
    );
    validationPredictions = validationPredictions.map(
      (prediction, index) =>
        prediction +
        options.learningRate * predictRegressionTree(tree, validationX[index]),
    );
    const validationRmse = validationY.length
      ? rmse(validationY, validationPredictions)
      : null;
    stages.push({
      tree,
      residualsBefore: residuals,
      predictions: [...trainPredictions],
      trainRmse: rmse(trainY, trainPredictions),
      validationRmse,
    });
    collectImportance(tree, featureImportance);
    if (validationRmse !== null) {
      if (validationRmse < bestValidation - 1e-8) {
        bestValidation = validationRmse;
        staleStages = 0;
      } else {
        staleStages += 1;
      }
      if (options.earlyStopping && staleStages >= (options.patience ?? 8))
        break;
    }
  }
  const importanceTotal =
    featureImportance.reduce((sum, value) => sum + value, 0) || 1;
  const predictAtStage = (row: number[], stage: number) => {
    const count = Math.max(0, Math.min(stages.length, Math.round(stage)));
    return (
      baseline +
      stages
        .slice(0, count)
        .reduce(
          (sum, item) =>
            sum + options.learningRate * predictRegressionTree(item.tree, row),
          0,
        )
    );
  };
  return {
    baseline,
    stages,
    learningRate: options.learningRate,
    maxDepth: options.maxDepth,
    featureImportance: featureImportance.map(
      (value) => value / importanceTotal,
    ),
    predictAtStage,
    predict: (row) => predictAtStage(row, stages.length),
  };
}
