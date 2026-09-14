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
  costComplexity?: number;
  preferredSplits?: Array<{ featureIndex: number; threshold: number }>;
  preferredSplitsByNode?: Record<
    string,
    { featureIndex: number; threshold: number }
  >;
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

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values: number[]) {
  if (!values.length) return 0;
  const average = mean(values);
  return (
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    values.length
  );
}

function splitAt(
  X: number[][],
  y: number[],
  featureIndex: number,
  threshold: number,
  minSamplesLeaf: number,
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
  const parentVariance = variance(y);
  const leftVariance = variance(leftIndices.map((index) => y[index]));
  const rightVariance = variance(rightIndices.map((index) => y[index]));
  const gain =
    parentVariance -
    (leftIndices.length / y.length) * leftVariance -
    (rightIndices.length / y.length) * rightVariance;
  return { featureIndex, threshold, gain, leftIndices, rightIndices };
}

function bestSplit(
  X: number[][],
  y: number[],
  minSamplesLeaf: number,
): Split | null {
  const featureCount = X[0]?.length ?? 0;
  const parentVariance = variance(y);
  let best: Split | null = null;

  for (let featureIndex = 0; featureIndex < featureCount; featureIndex++) {
    const ordered = X.map((row, index) => ({
      value: row[featureIndex],
      target: y[index],
      index,
    })).sort((a, b) => a.value - b.value);
    let leftSum = 0;
    let leftSquareSum = 0;
    const totalSum = ordered.reduce((sum, item) => sum + item.target, 0);
    const totalSquareSum = ordered.reduce(
      (sum, item) => sum + item.target ** 2,
      0,
    );

    for (let splitIndex = 0; splitIndex < ordered.length - 1; splitIndex++) {
      const item = ordered[splitIndex];
      leftSum += item.target;
      leftSquareSum += item.target ** 2;
      const leftCount = splitIndex + 1;
      const rightCount = ordered.length - leftCount;
      if (leftCount < minSamplesLeaf || rightCount < minSamplesLeaf) continue;
      if (item.value === ordered[splitIndex + 1].value) continue;
      const rightSum = totalSum - leftSum;
      const rightSquareSum = totalSquareSum - leftSquareSum;
      const leftVariance = Math.max(
        0,
        leftSquareSum / leftCount - (leftSum / leftCount) ** 2,
      );
      const rightVariance = Math.max(
        0,
        rightSquareSum / rightCount - (rightSum / rightCount) ** 2,
      );
      const gain =
        parentVariance -
        (leftCount / ordered.length) * leftVariance -
        (rightCount / ordered.length) * rightVariance;
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
    value: mean(y),
    impurity: variance(y),
    gain: 0,
  };
  if (
    depth >= options.maxDepth ||
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
      )
    : bestSplit(X, y, options.minSamplesLeaf);
  if (!split || split.gain <= (options.costComplexity ?? 0)) return node;

  node.featureIndex = split.featureIndex;
  node.threshold = split.threshold;
  node.gain = split.gain;
  node.left = buildRegressionTree(
    split.leftIndices.map((index) => X[index]),
    split.leftIndices.map((index) => y[index]),
    options,
    depth + 1,
    `${id}L`,
  );
  node.right = buildRegressionTree(
    split.rightIndices.map((index) => X[index]),
    split.rightIndices.map((index) => y[index]),
    options,
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
