export interface XGBoostOptions {
  estimators: number;
  learningRate: number;
  maxDepth: number;
  subsample: number;
  colsample: number;
  minChildWeight: number;
  lambda: number;
  alpha: number;
  gamma: number;
  validationFraction?: number;
  seed?: number;
}

export interface XGBoostNode {
  id: string;
  depth: number;
  samples: number;
  gradient: number;
  hessian: number;
  weight: number;
  gain: number;
  featureIndex?: number;
  threshold?: number;
  left?: XGBoostNode;
  right?: XGBoostNode;
}

export interface XGBoostStage {
  tree: XGBoostNode;
  trainRmse: number;
  validationRmse: number;
  residuals: number[];
}

export interface XGBoostModel {
  baseline: number;
  stages: XGBoostStage[];
  featureImportance: number[];
  predict: (row: number[]) => number;
  predictAtStage: (row: number[], stage: number) => number;
}

const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;
const rmse = (actual: number[], predicted: number[]) =>
  Math.sqrt(
    mean(actual.map((value, index) => (value - predicted[index]) ** 2)),
  );
const soft = (value: number, alpha: number) =>
  Math.sign(value) * Math.max(0, Math.abs(value) - alpha);
const leafWeight = (
  gradient: number,
  hessian: number,
  options: XGBoostOptions,
) => -soft(gradient, options.alpha) / (hessian + options.lambda);
const score = (gradient: number, hessian: number, options: XGBoostOptions) =>
  soft(gradient, options.alpha) ** 2 / (hessian + options.lambda);

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffled(length: number, fraction: number, seed: number) {
  const values = Array.from({ length }, (_, index) => index);
  const random = seeded(seed);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [values[index], values[other]] = [values[other], values[index]];
  }
  return values.slice(0, Math.max(2, Math.round(length * fraction)));
}

function buildTree(
  X: number[][],
  gradients: number[],
  hessians: number[],
  indices: number[],
  features: number[],
  options: XGBoostOptions,
  depth = 0,
  id = "root",
): XGBoostNode {
  const gradient = indices.reduce((sum, index) => sum + gradients[index], 0);
  const hessian = indices.reduce((sum, index) => sum + hessians[index], 0);
  const node: XGBoostNode = {
    id,
    depth,
    samples: indices.length,
    gradient,
    hessian,
    weight: leafWeight(gradient, hessian, options),
    gain: 0,
  };
  if (depth >= options.maxDepth || indices.length < 4) return node;

  let best:
    | {
        featureIndex: number;
        threshold: number;
        gain: number;
        left: number[];
        right: number[];
      }
    | undefined;
  for (const featureIndex of features) {
    const ordered = indices
      .map((index) => ({ index, value: X[index][featureIndex] }))
      .sort((a, b) => a.value - b.value);
    let leftGradient = 0;
    let leftHessian = 0;
    for (let split = 0; split < ordered.length - 1; split += 1) {
      const current = ordered[split];
      leftGradient += gradients[current.index];
      leftHessian += hessians[current.index];
      if (current.value === ordered[split + 1].value) continue;
      const rightHessian = hessian - leftHessian;
      if (
        leftHessian < options.minChildWeight ||
        rightHessian < options.minChildWeight
      )
        continue;
      const rightGradient = gradient - leftGradient;
      const gain =
        0.5 *
          (score(leftGradient, leftHessian, options) +
            score(rightGradient, rightHessian, options) -
            score(gradient, hessian, options)) -
        options.gamma;
      if (!best || gain > best.gain) {
        best = {
          featureIndex,
          threshold: (current.value + ordered[split + 1].value) / 2,
          gain,
          left: ordered.slice(0, split + 1).map((entry) => entry.index),
          right: ordered.slice(split + 1).map((entry) => entry.index),
        };
      }
    }
  }
  if (!best || best.gain <= 0) return node;
  node.featureIndex = best.featureIndex;
  node.threshold = best.threshold;
  node.gain = best.gain;
  node.left = buildTree(
    X,
    gradients,
    hessians,
    best.left,
    features,
    options,
    depth + 1,
    `${id}L`,
  );
  node.right = buildTree(
    X,
    gradients,
    hessians,
    best.right,
    features,
    options,
    depth + 1,
    `${id}R`,
  );
  return node;
}

export function predictXGBoostTree(node: XGBoostNode, row: number[]) {
  let current = node;
  while (
    current.featureIndex !== undefined &&
    current.threshold !== undefined &&
    current.left &&
    current.right
  )
    current =
      row[current.featureIndex] <= current.threshold
        ? current.left
        : current.right;
  return current.weight;
}

function importance(node: XGBoostNode, totals: number[]) {
  if (node.featureIndex !== undefined) totals[node.featureIndex] += node.gain;
  if (node.left) importance(node.left, totals);
  if (node.right) importance(node.right, totals);
}

export function trainXGBoostRegression(
  X: number[][],
  y: number[],
  options: XGBoostOptions,
): XGBoostModel {
  if (!X.length || X.length !== y.length || !X[0]?.length)
    throw new Error(
      "XGBoost requires matching non-empty feature and target arrays.",
    );
  const validationCount = Math.max(
    1,
    Math.min(
      X.length - 2,
      Math.round(X.length * (options.validationFraction ?? 0.2)),
    ),
  );
  const trainCount = X.length - validationCount;
  const trainX = X.slice(0, trainCount);
  const trainY = y.slice(0, trainCount);
  const validationX = X.slice(trainCount);
  const validationY = y.slice(trainCount);
  const baseline = mean(trainY);
  let trainPredictions = trainY.map(() => baseline);
  let validationPredictions = validationY.map(() => baseline);
  const stages: XGBoostStage[] = [];
  const featureImportance = X[0].map(() => 0);
  const seed = options.seed ?? 2026;
  for (
    let stage = 0;
    stage < Math.max(1, Math.round(options.estimators));
    stage += 1
  ) {
    const gradients = trainPredictions.map(
      (prediction, index) => prediction - trainY[index],
    );
    const hessians = trainPredictions.map(() => 1);
    const rowIndices = shuffled(
      trainX.length,
      Math.max(0.1, Math.min(1, options.subsample)),
      seed + stage * 104729,
    );
    const featureIndices = shuffled(
      trainX[0].length,
      Math.max(0.1, Math.min(1, options.colsample)),
      seed + stage * 13007 + 17,
    );
    const tree = buildTree(
      trainX,
      gradients,
      hessians,
      rowIndices,
      featureIndices,
      options,
    );
    trainPredictions = trainPredictions.map(
      (prediction, index) =>
        prediction +
        options.learningRate * predictXGBoostTree(tree, trainX[index]),
    );
    validationPredictions = validationPredictions.map(
      (prediction, index) =>
        prediction +
        options.learningRate * predictXGBoostTree(tree, validationX[index]),
    );
    importance(tree, featureImportance);
    stages.push({
      tree,
      trainRmse: rmse(trainY, trainPredictions),
      validationRmse: rmse(validationY, validationPredictions),
      residuals: trainY.map(
        (target, index) => target - trainPredictions[index],
      ),
    });
  }
  const total = featureImportance.reduce((sum, value) => sum + value, 0) || 1;
  const predictAtStage = (row: number[], stage: number) =>
    baseline +
    stages
      .slice(0, Math.max(0, Math.min(stages.length, Math.round(stage))))
      .reduce(
        (sum, item) =>
          sum + options.learningRate * predictXGBoostTree(item.tree, row),
        0,
      );
  return {
    baseline,
    stages,
    featureImportance: featureImportance.map((value) => value / total),
    predictAtStage,
    predict: (row) => predictAtStage(row, stages.length),
  };
}
