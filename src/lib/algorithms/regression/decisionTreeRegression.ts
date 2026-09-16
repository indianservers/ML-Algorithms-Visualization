export interface RegressionTreeNode {
  id: string;
  depth: number;
  samples: number;
  value: number;
  impurity: number;
  gain: number;
  featureIndex?: number;
  threshold?: number;
  left?: RegressionTreeNode;
  right?: RegressionTreeNode;
}

export interface RegressionTreeOptions {
  maxDepth: number;
  minSamplesLeaf: number;
  minSamplesSplit?: number;
  costComplexity?: number;
  preferredSplits?: Array<{ featureIndex: number; threshold: number }>;
  preferredSplitsByNode?: Record<
    string,
    { featureIndex: number; threshold: number }
  >;
  sampleWeights?: number[];
  leafMode?: "mean" | "newton";
}

export interface ParsedRegressionCsv {
  headers: string[];
  rows: Array<{ features: number[]; target: number }>;
}

export function parseRegressionCsv(text: string): ParsedRegressionCsv | null {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 3) return null;
  const headers = lines[0].split(",").map((item) => item.trim());
  if (headers.length < 2) return null;
  const values = lines
    .slice(1)
    .map((line) => line.split(",").map(Number))
    .filter(
      (row) => row.length === headers.length && row.every(Number.isFinite),
    );
  if (values.length < 2) return null;
  return {
    headers,
    rows: values.map((value) => ({
      features: value.slice(0, -1),
      target: value.at(-1) ?? 0,
    })),
  };
}

interface Split {
  featureIndex: number;
  threshold: number;
  gain: number;
  leftIndices: number[];
  rightIndices: number[];
}

function weightAt(weights: number[] | undefined, index: number) {
  return Math.max(1e-12, weights?.[index] ?? 1);
}

function mean(values: number[], weights?: number[]) {
  if (!values.length) return 0;
  if (!weights) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  let sum = 0;
  let total = 0;
  values.forEach((value, index) => {
    const weight = weightAt(weights, index);
    sum += weight * value;
    total += weight;
  });
  return sum / total;
}

function newtonLeaf(values: number[], weights?: number[]) {
  const residualSum = values.reduce((sum, value) => sum + value, 0);
  const total = weights
    ? weights.reduce((sum, value) => sum + Math.max(1e-12, value), 0)
    : values.length;
  return residualSum / (total || 1);
}

function variance(values: number[], weights?: number[]) {
  if (!values.length) return 0;
  const average = mean(values, weights);
  if (!weights) {
    return (
      values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
      values.length
    );
  }
  let sse = 0;
  let total = 0;
  values.forEach((value, index) => {
    const weight = weightAt(weights, index);
    sse += weight * (value - average) ** 2;
    total += weight;
  });
  return sse / total;
}

function splitAt(
  X: number[][],
  y: number[],
  featureIndex: number,
  threshold: number,
  minSamplesLeaf: number,
  sampleWeights?: number[],
): Split | null {
  const leftIndices: number[] = [];
  const rightIndices: number[] = [];
  X.forEach((row, index) => {
    (row[featureIndex] <= threshold ? leftIndices : rightIndices).push(index);
  });
  if (
    leftIndices.length < minSamplesLeaf ||
    rightIndices.length < minSamplesLeaf
  )
    return null;
  const leftWeights = sampleWeights
    ? leftIndices.map((index) => sampleWeights[index] ?? 1)
    : undefined;
  const rightWeights = sampleWeights
    ? rightIndices.map((index) => sampleWeights[index] ?? 1)
    : undefined;
  const parentVariance = variance(y, sampleWeights);
  const leftVariance = variance(
    leftIndices.map((index) => y[index]),
    leftWeights,
  );
  const rightVariance = variance(
    rightIndices.map((index) => y[index]),
    rightWeights,
  );
  const leftMass = leftWeights
    ? leftWeights.reduce((sum, value) => sum + value, 0)
    : leftIndices.length;
  const rightMass = rightWeights
    ? rightWeights.reduce((sum, value) => sum + value, 0)
    : rightIndices.length;
  const totalMass = leftMass + rightMass || 1;
  const gain =
    parentVariance -
    (leftMass / totalMass) * leftVariance -
    (rightMass / totalMass) * rightVariance;
  return { featureIndex, threshold, gain, leftIndices, rightIndices };
}

function bestSplit(
  X: number[][],
  y: number[],
  minSamplesLeaf: number,
  sampleWeights?: number[],
): Split | null {
  const featureCount = X[0]?.length ?? 0;
  const parentVariance = variance(y, sampleWeights);
  let best: Split | null = null;

  for (let featureIndex = 0; featureIndex < featureCount; featureIndex++) {
    const ordered = X.map((row, index) => ({
      value: row[featureIndex],
      target: y[index],
      weight: weightAt(sampleWeights, index),
      index,
    })).sort((a, b) => a.value - b.value);
    let leftSum = 0;
    let leftSquareSum = 0;
    let leftWeight = 0;
    const totalSum = ordered.reduce(
      (sum, item) => sum + item.weight * item.target,
      0,
    );
    const totalSquareSum = ordered.reduce(
      (sum, item) => sum + item.weight * item.target ** 2,
      0,
    );
    const totalWeight = ordered.reduce((sum, item) => sum + item.weight, 0);

    for (let splitIndex = 0; splitIndex < ordered.length - 1; splitIndex++) {
      const item = ordered[splitIndex];
      leftSum += item.weight * item.target;
      leftSquareSum += item.weight * item.target ** 2;
      leftWeight += item.weight;
      const leftCount = splitIndex + 1;
      const rightCount = ordered.length - leftCount;
      if (leftCount < minSamplesLeaf || rightCount < minSamplesLeaf) continue;
      if (item.value === ordered[splitIndex + 1].value) continue;
      const rightSum = totalSum - leftSum;
      const rightSquareSum = totalSquareSum - leftSquareSum;
      const rightWeight = totalWeight - leftWeight;
      if (leftWeight <= 0 || rightWeight <= 0) continue;
      const leftVariance = Math.max(
        0,
        leftSquareSum / leftWeight - (leftSum / leftWeight) ** 2,
      );
      const rightVariance = Math.max(
        0,
        rightSquareSum / rightWeight - (rightSum / rightWeight) ** 2,
      );
      const gain =
        parentVariance -
        (leftWeight / totalWeight) * leftVariance -
        (rightWeight / totalWeight) * rightVariance;
      if (!best || gain > best.gain) {
        best = {
          featureIndex,
          threshold: (item.value + ordered[splitIndex + 1].value) / 2,
          gain,
          leftIndices: ordered.slice(0, leftCount).map((entry) => entry.index),
          rightIndices: ordered.slice(leftCount).map((entry) => entry.index),
        };
      }
    }
  }
  return best;
}

export function buildRegressionTree(
  X: number[][],
  y: number[],
  options: RegressionTreeOptions,
  depth = 0,
  id = "root",
): RegressionTreeNode {
  const node: RegressionTreeNode = {
    id,
    depth,
    samples: y.length,
    value:
      options.leafMode === "newton"
        ? newtonLeaf(y, options.sampleWeights)
        : mean(y, options.sampleWeights),
    impurity: variance(y, options.sampleWeights),
    gain: 0,
  };
  const minSplit = options.minSamplesSplit ?? 2;
  if (
    depth >= options.maxDepth ||
    y.length < minSplit ||
    y.length < options.minSamplesLeaf * 2 ||
    node.impurity <= 1e-12
  )
    return node;

  const preferred =
    options.preferredSplitsByNode?.[id] ?? options.preferredSplits?.[depth];
  const split = preferred
    ? splitAt(
        X,
        y,
        preferred.featureIndex,
        preferred.threshold,
        options.minSamplesLeaf,
        options.sampleWeights,
      )
    : bestSplit(X, y, options.minSamplesLeaf, options.sampleWeights);
  if (!split || split.gain <= (options.costComplexity ?? 0)) return node;

  node.featureIndex = split.featureIndex;
  node.threshold = split.threshold;
  node.gain = split.gain;
  const childOptions = (indices: number[]): RegressionTreeOptions => ({
    ...options,
    sampleWeights: options.sampleWeights
      ? indices.map((index) => options.sampleWeights?.[index] ?? 1)
      : undefined,
  });
  node.left = buildRegressionTree(
    split.leftIndices.map((index) => X[index]),
    split.leftIndices.map((index) => y[index]),
    childOptions(split.leftIndices),
    depth + 1,
    `${id}L`,
  );
  node.right = buildRegressionTree(
    split.rightIndices.map((index) => X[index]),
    split.rightIndices.map((index) => y[index]),
    childOptions(split.rightIndices),
    depth + 1,
    `${id}R`,
  );
  return node;
}

export function predictRegressionTree(node: RegressionTreeNode, row: number[]) {
  let current = node;
  while (
    current.featureIndex !== undefined &&
    current.threshold !== undefined &&
    current.left &&
    current.right
  ) {
    current =
      row[current.featureIndex] <= current.threshold
        ? current.left
        : current.right;
  }
  return current.value;
}

export function regressionTreeDepth(node: RegressionTreeNode): number {
  if (!node.left || !node.right) return node.depth;
  return Math.max(
    regressionTreeDepth(node.left),
    regressionTreeDepth(node.right),
  );
}

export function regressionTreeLeaves(node: RegressionTreeNode): number {
  if (!node.left || !node.right) return 1;
  return regressionTreeLeaves(node.left) + regressionTreeLeaves(node.right);
}

export function flattenRegressionTree(node: RegressionTreeNode) {
  const result: RegressionTreeNode[] = [];
  const visit = (current: RegressionTreeNode) => {
    result.push(current);
    if (current.left) visit(current.left);
    if (current.right) visit(current.right);
  };
  visit(node);
  return result;
}

export function regressionTreePath(node: RegressionTreeNode, row: number[]) {
  const result: RegressionTreeNode[] = [];
  let current = node;
  while (current) {
    result.push(current);
    if (
      current.featureIndex === undefined ||
      current.threshold === undefined ||
      !current.left ||
      !current.right
    )
      break;
    current =
      row[current.featureIndex] <= current.threshold
        ? current.left
        : current.right;
  }
  return result;
}
