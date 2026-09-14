export interface ClassificationTreeNode {
  prediction: number;
  samples: number;
  impurity: number;
  classCounts: Record<number, number>;
  featureIndex?: number;
  threshold?: number;
  gain?: number;
  left?: ClassificationTreeNode;
  right?: ClassificationTreeNode;
}

export interface RandomForestClassificationOptions {
  estimators: number;
  maxDepth: number | null;
  maxFeatures: "sqrt" | "log2" | "all" | number;
  bootstrap: boolean;
  minSamplesSplit: number;
  featureSampleRate: number;
  seed?: number;
}

export interface ClassificationForestTree {
  root: ClassificationTreeNode;
  inBagIndices: number[];
  oobIndices: number[];
}

export interface RandomForestClassificationModel {
  classes: number[];
  trees: ClassificationForestTree[];
  featureImportance: number[];
  oobPredictions: Array<number | null>;
  oobAccuracy: number;
  predict: (x: number[]) => number;
  predictProba: (x: number[]) => Record<number, number>;
  treePredictions: (x: number[]) => number[];
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function counts(y: number[]) {
  const result: Record<number, number> = {};
  y.forEach((value) => {
    result[value] = (result[value] ?? 0) + 1;
  });
  return result;
}

function gini(y: number[]) {
  if (!y.length) return 0;
  return (
    1 -
    Object.values(counts(y)).reduce(
      (sum, value) => sum + (value / y.length) ** 2,
      0,
    )
  );
}

function majority(y: number[]) {
  return Number(
    Object.entries(counts(y)).reduce((best, item) =>
      item[1] > best[1] ? item : best,
    )[0],
  );
}

function shuffledFeatures(count: number, take: number, random: () => number) {
  const features = Array.from({ length: count }, (_, index) => index);
  for (let index = features.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [features[index], features[swap]] = [features[swap], features[index]];
  }
  return features.slice(0, Math.max(1, Math.min(count, take)));
}

function featureCount(
  option: RandomForestClassificationOptions["maxFeatures"],
  p: number,
  rate: number,
) {
  const base =
    option === "sqrt"
      ? Math.ceil(Math.sqrt(p))
      : option === "log2"
        ? Math.ceil(Math.log2(p))
        : option === "all"
          ? p
          : option;
  return Math.max(1, Math.min(p, Math.round(base * rate)));
}

function buildTree(
  X: number[][],
  y: number[],
  indices: number[],
  options: RandomForestClassificationOptions,
  random: () => number,
  importance: number[],
  depth = 0,
): ClassificationTreeNode {
  const nodeY = indices.map((index) => y[index]);
  const node: ClassificationTreeNode = {
    prediction: majority(nodeY),
    samples: indices.length,
    impurity: gini(nodeY),
    classCounts: counts(nodeY),
  };
  if (
    node.impurity <= 1e-12 ||
    indices.length < options.minSamplesSplit ||
    (options.maxDepth !== null && depth >= options.maxDepth)
  )
    return node;
  const features = shuffledFeatures(
    X[0].length,
    featureCount(options.maxFeatures, X[0].length, options.featureSampleRate),
    random,
  );
  let best: {
    feature: number;
    threshold: number;
    gain: number;
    left: number[];
    right: number[];
  } | null = null;
  for (const feature of features) {
    const sorted = [...new Set(indices.map((index) => X[index][feature]))].sort(
      (a, b) => a - b,
    );
    const candidates =
      sorted.length > 40
        ? Array.from(
            { length: 40 },
            (_, index) =>
              sorted[Math.floor(((index + 1) * sorted.length) / 41)],
          )
        : sorted.slice(1).map((value, index) => (sorted[index] + value) / 2);
    for (const threshold of candidates) {
      const left = indices.filter((index) => X[index][feature] <= threshold);
      const right = indices.filter((index) => X[index][feature] > threshold);
      if (!left.length || !right.length) continue;
      const gain =
        node.impurity -
        (left.length / indices.length) * gini(left.map((index) => y[index])) -
        (right.length / indices.length) * gini(right.map((index) => y[index]));
      if (!best || gain > best.gain)
        best = { feature, threshold, gain, left, right };
    }
  }
  if (!best || best.gain <= 1e-9) return node;
  node.featureIndex = best.feature;
  node.threshold = best.threshold;
  node.gain = best.gain;
  importance[best.feature] += best.gain * indices.length;
  node.left = buildTree(
    X,
    y,
    best.left,
    options,
    random,
    importance,
    depth + 1,
  );
  node.right = buildTree(
    X,
    y,
    best.right,
    options,
    random,
    importance,
    depth + 1,
  );
  return node;
}

export function predictClassificationTree(
  node: ClassificationTreeNode,
  x: number[],
): number {
  if (
    node.featureIndex === undefined ||
    node.threshold === undefined ||
    !node.left ||
    !node.right
  )
    return node.prediction;
  return predictClassificationTree(
    x[node.featureIndex] <= node.threshold ? node.left : node.right,
    x,
  );
}

export function trainRandomForestClassification(
  X: number[][],
  y: number[],
  options: RandomForestClassificationOptions,
): RandomForestClassificationModel {
  if (!X.length || X.length !== y.length || !X[0]?.length)
    throw new Error(
      "Random forest classification requires matching non-empty X and y arrays.",
    );
  const classes = [...new Set(y)].sort((a, b) => a - b);
  const importance = Array(X[0].length).fill(0);
  const trees: ClassificationForestTree[] = [];
  const oobVotes: number[][] = Array.from({ length: X.length }, () => []);
  for (
    let treeIndex = 0;
    treeIndex < Math.max(1, Math.round(options.estimators));
    treeIndex += 1
  ) {
    const random = seeded((options.seed ?? 731) + treeIndex * 7919);
    const inBagIndices = options.bootstrap
      ? Array.from({ length: X.length }, () => Math.floor(random() * X.length))
      : Array.from({ length: X.length }, (_, index) => index);
    const selected = new Set(inBagIndices);
    const oobIndices = Array.from(
      { length: X.length },
      (_, index) => index,
    ).filter((index) => !selected.has(index));
    const root = buildTree(X, y, inBagIndices, options, random, importance);
    trees.push({ root, inBagIndices, oobIndices });
    oobIndices.forEach((index) =>
      oobVotes[index].push(predictClassificationTree(root, X[index])),
    );
  }
  const voteWinner = (votes: number[]) =>
    classes.reduce(
      (best, value) =>
        votes.filter((vote) => vote === value).length >
        votes.filter((vote) => vote === best).length
          ? value
          : best,
      classes[0],
    );
  const oobPredictions = oobVotes.map((votes) =>
    votes.length ? voteWinner(votes) : null,
  );
  const covered = oobPredictions
    .map((value, index) => ({ value, index }))
    .filter(
      (item): item is { value: number; index: number } => item.value !== null,
    );
  const totalImportance =
    importance.reduce((sum, value) => sum + value, 0) || 1;
  const treePredictions = (x: number[]) =>
    trees.map((tree) => predictClassificationTree(tree.root, x));
  const predictProba = (x: number[]) => {
    const votes = treePredictions(x);
    const result: Record<number, number> = {};
    classes.forEach((value) => {
      result[value] =
        votes.filter((vote) => vote === value).length / votes.length;
    });
    return result;
  };
  const predict = (x: number[]) => voteWinner(treePredictions(x));
  return {
    classes,
    trees,
    featureImportance: importance.map((value) => value / totalImportance),
    oobPredictions,
    oobAccuracy: covered.length
      ? covered.filter((item) => item.value === y[item.index]).length /
        covered.length
      : 0,
    predict,
    predictProba,
    treePredictions,
  };
}
