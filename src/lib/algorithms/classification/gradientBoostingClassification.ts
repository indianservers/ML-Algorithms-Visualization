import {
  buildRegressionTree,
  predictRegressionTree,
  type RegressionTreeNode,
} from "../regression/decisionTreeRegression";

export interface GradientBoostingClassificationOptions {
  estimators: number;
  learningRate: number;
  maxDepth: number;
  subsample: number;
  minSamplesLeaf?: number;
  seed?: number;
}

export interface GradientBoostingClassificationStage {
  tree: RegressionTreeNode;
  residuals: number[];
  sampleWeights: number[];
  scores: number[];
  probabilities: number[];
  accuracy: number;
  logLoss: number;
  weightedError: number;
}

export interface GradientBoostingClassificationModel {
  baseline: number;
  stages: GradientBoostingClassificationStage[];
  probabilityAtStage: (row: number[], stage: number) => number;
  predictAtStage: (row: number[], stage: number) => number;
  probability: (row: number[]) => number;
  predict: (row: number[]) => number;
}

const sigmoid = (value: number) =>
  1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));
const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => (state = (state * 1664525 + 1013904223) >>> 0) / 4294967296;
};
function sample(length: number, fraction: number, seed: number) {
  const random = seeded(seed),
    indices = Array.from({ length }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(
    0,
    Math.max(4, Math.round(length * Math.max(0.1, Math.min(1, fraction)))),
  );
}
const metrics = (y: number[], probabilities: number[]) => ({
  accuracy:
    y.filter((value, index) => (probabilities[index] >= 0.5 ? 1 : 0) === value)
      .length / y.length,
  logLoss:
    -y.reduce((sum, value, index) => {
      const p = Math.max(1e-9, Math.min(1 - 1e-9, probabilities[index]));
      return sum + value * Math.log(p) + (1 - value) * Math.log(1 - p);
    }, 0) / y.length,
});

export function trainGradientBoostingClassification(
  X: number[][],
  y: number[],
  options: GradientBoostingClassificationOptions,
): GradientBoostingClassificationModel {
  if (
    !X.length ||
    X.length !== y.length ||
    !X[0]?.length ||
    y.some((value) => value !== 0 && value !== 1)
  )
    throw new Error(
      "Gradient boosting classification requires matching binary data.",
    );
  const positive = Math.max(
    1e-5,
    Math.min(1 - 1e-5, y.reduce((sum, value) => sum + value, 0) / y.length),
  );
  const baseline = Math.log(positive / (1 - positive));
  let scores = y.map(() => baseline);
  const stages: GradientBoostingClassificationStage[] = [];
  for (
    let stage = 0;
    stage < Math.max(1, Math.round(options.estimators));
    stage += 1
  ) {
    const probabilities = scores.map(sigmoid),
      residuals = y.map((value, index) => value - probabilities[index]);
    const sampleWeights = probabilities.map((probability) =>
      Math.max(1e-4, probability * (1 - probability)),
    );
    const indices = sample(
      X.length,
      options.subsample,
      (options.seed ?? 2026) + stage * 104729,
    );
    const tree = buildRegressionTree(
      indices.map((index) => X[index]),
      indices.map((index) => residuals[index]),
      {
        maxDepth: options.maxDepth,
        minSamplesLeaf: Math.min(
          options.minSamplesLeaf ?? 4,
          Math.max(1, Math.floor(indices.length / 5)),
        ),
      },
    );
    scores = scores.map(
      (score, index) =>
        score + options.learningRate * predictRegressionTree(tree, X[index]),
    );
    const updated = scores.map(sigmoid),
      report = metrics(y, updated);
    stages.push({
      tree,
      residuals,
      sampleWeights,
      scores: [...scores],
      probabilities: updated,
      accuracy: report.accuracy,
      logLoss: report.logLoss,
      weightedError:
        residuals.reduce((sum, value) => sum + Math.abs(value), 0) /
        residuals.length,
    });
  }
  const scoreAtStage = (row: number[], stage: number) =>
    baseline +
    stages
      .slice(0, Math.max(0, Math.min(stages.length, Math.round(stage))))
      .reduce(
        (sum, item) =>
          sum + options.learningRate * predictRegressionTree(item.tree, row),
        0,
      );
  const probabilityAtStage = (row: number[], stage: number) =>
    sigmoid(scoreAtStage(row, stage));
  const predictAtStage = (row: number[], stage: number) =>
    probabilityAtStage(row, stage) >= 0.5 ? 1 : 0;
  return {
    baseline,
    stages,
    probabilityAtStage,
    predictAtStage,
    probability: (row) => probabilityAtStage(row, stages.length),
    predict: (row) => predictAtStage(row, stages.length),
  };
}
