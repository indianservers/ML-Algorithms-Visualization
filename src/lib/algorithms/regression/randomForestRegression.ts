export interface ForestRegressionNode {
  value: number;
  samples: number;
  impurity: number;
  gain: number;
  featureIndex?: number;
  threshold?: number;
  left?: ForestRegressionNode;
  right?: ForestRegressionNode;
}

export interface RandomForestRegressionOptions {
  estimators: number;
  maxDepth: number | null;
  minSamplesLeaf: number;
  maxFeatures: number;
  sampleRate: number;
  bootstrap: boolean;
  seed: number;
}

export interface RandomForestRegressionModel {
  trees: ForestRegressionNode[];
  treeFeatures: number[][];
  featureImportance: number[];
  oobPredictions: Array<number | null>;
  predict: (row: number[]) => number;
  predictDistribution: (row: number[]) => number[];
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

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values: number[]) {
  if (!values.length) return 0;
  const mean = average(values);
  return average(values.map((value) => (value - mean) ** 2));
}

function shuffle<T>(values: T[], random: () => number) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function candidateThresholds(values: number[]) {
  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (unique.length < 2) return [];
  const count = Math.min(6, unique.length - 1);
  const thresholds: number[] = [];
  for (let index = 1; index <= count; index++) {
    const position = Math.min(
      unique.length - 1,
      Math.max(1, Math.floor((index / (count + 1)) * unique.length)),
    );
    thresholds.push((unique[position - 1] + unique[position]) / 2);
  }
  return [...new Set(thresholds)];
}

function buildTree(
  X: number[][],
  y: number[],
  indices: number[],
  features: number[],
  options: RandomForestRegressionOptions,
  depth: number,
): ForestRegressionNode {
  const targets = indices.map((index) => y[index]);
  const impurity = variance(targets);
  const node: ForestRegressionNode = {
    value: average(targets),
    samples: indices.length,
    impurity,
    gain: 0,
  };
  const depthLimit = options.maxDepth ?? 6;
  if (
    depth >= depthLimit ||
    indices.length < options.minSamplesLeaf * 2 ||
    impurity < 1e-10
  )
    return node;

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
    const thresholds = candidateThresholds(
      indices.map((index) => X[index][featureIndex]),
    );
    for (const threshold of thresholds) {
      const left: number[] = [];
      const right: number[] = [];
      indices.forEach((index) =>
        (X[index][featureIndex] <= threshold ? left : right).push(index),
      );
      if (
        left.length < options.minSamplesLeaf ||
        right.length < options.minSamplesLeaf
      )
        continue;
      const gain =
        impurity -
        (left.length / indices.length) *
          variance(left.map((index) => y[index])) -
        (right.length / indices.length) *
          variance(right.map((index) => y[index]));
      if (!best || gain > best.gain)
        best = { featureIndex, threshold, gain, left, right };
    }
  }
  if (!best || best.gain <= 1e-9) return node;
  node.featureIndex = best.featureIndex;
  node.threshold = best.threshold;
  node.gain = best.gain;
  node.left = buildTree(X, y, best.left, features, options, depth + 1);
  node.right = buildTree(X, y, best.right, features, options, depth + 1);
  return node;
}

export function predictForestTree(tree: ForestRegressionNode, row: number[]) {
  let node = tree;
  while (
    node.featureIndex !== undefined &&
    node.threshold !== undefined &&
    node.left &&
    node.right
  ) {
    node = row[node.featureIndex] <= node.threshold ? node.left : node.right;
  }
  return node.value;
}

function collectImportance(node: ForestRegressionNode, totals: number[]) {
  if (node.featureIndex !== undefined) {
    totals[node.featureIndex] += node.gain * node.samples;
  }
  if (node.left) collectImportance(node.left, totals);
  if (node.right) collectImportance(node.right, totals);
}

export function trainRandomForestRegression(
  X: number[][],
  y: number[],
  options: RandomForestRegressionOptions,
): RandomForestRegressionModel {
  if (!X.length || X.length !== y.length)
    throw new Error(
      "Random forest requires matching non-empty X and y arrays.",
    );
  const featureCount = X[0].length;
  const treeCount = Math.max(1, Math.round(options.estimators));
  const sampleCount = Math.max(
    options.minSamplesLeaf * 2,
    Math.round(X.length * options.sampleRate),
  );
  const trees: ForestRegressionNode[] = [];
  const treeFeatures: number[][] = [];
  const oobVotes: number[][] = Array.from({ length: X.length }, () => []);
  const featureImportance = Array(featureCount).fill(0);

  for (let treeIndex = 0; treeIndex < treeCount; treeIndex++) {
    const random = seededRandom(options.seed + treeIndex * 7919);
    const allIndices = Array.from({ length: X.length }, (_, index) => index);
    const chosen = new Set<number>();
    const sample: number[] = [];
    if (options.bootstrap) {
      for (let index = 0; index < sampleCount; index++) {
        const selected = Math.floor(random() * X.length);
        sample.push(selected);
        chosen.add(selected);
      }
    } else {
      shuffle(allIndices, random)
        .slice(0, Math.min(sampleCount, X.length))
        .forEach((index) => {
          sample.push(index);
          chosen.add(index);
        });
    }
    const features = shuffle(allIndices.slice(0, featureCount), random).slice(
      0,
      Math.max(1, Math.min(featureCount, Math.round(options.maxFeatures))),
    );
    const tree = buildTree(X, y, sample, features, options, 0);
    trees.push(tree);
    treeFeatures.push(features);
    collectImportance(tree, featureImportance);
    allIndices.forEach((index) => {
      if (!chosen.has(index)) {
        oobVotes[index].push(predictForestTree(tree, X[index]));
      }
    });
  }
  const importanceTotal =
    featureImportance.reduce((sum, value) => sum + value, 0) || 1;
  const predictDistribution = (row: number[]) =>
    trees.map((tree) => predictForestTree(tree, row));
  return {
    trees,
    treeFeatures,
    featureImportance: featureImportance.map(
      (value) => value / importanceTotal,
    ),
    oobPredictions: oobVotes.map((values) =>
      values.length ? average(values) : null,
    ),
    predictDistribution,
    predict: (row) => average(predictDistribution(row)),
  };
}
