export type PlaygroundDataset =
  | "linear"
  | "moons"
  | "circles"
  | "xor"
  | "spiral"
  | "gauss"
  | "unbalanced"
  | "imported";

export type FeatureId =
  | "x1"
  | "x2"
  | "x1sq"
  | "x2sq"
  | "x1x2"
  | "sinx1"
  | "sinx2";

export interface PlaygroundPoint {
  x: number;
  y: number;
  label: number;
}

export const FEATURE_CATALOG: Array<{
  id: FeatureId;
  label: string;
  latex: string;
  apply: (x: number, y: number) => number;
}> = [
  { id: "x1", label: "X₁", latex: "x_1", apply: (x) => x },
  { id: "x2", label: "X₂", latex: "x_2", apply: (_, y) => y },
  { id: "x1sq", label: "X₁²", latex: "x_1^2", apply: (x) => x * x },
  { id: "x2sq", label: "X₂²", latex: "x_2^2", apply: (_, y) => y * y },
  { id: "x1x2", label: "X₁X₂", latex: "x_1 x_2", apply: (x, y) => x * y },
  { id: "sinx1", label: "sin X₁", latex: "\\sin x_1", apply: (x) => Math.sin(x) },
  { id: "sinx2", label: "sin X₂", latex: "\\sin x_2", apply: (_, y) => Math.sin(y) },
];

export const DATASET_CATALOG: Array<{
  id: Exclude<PlaygroundDataset, "imported">;
  name: string;
  hint: string;
  why: string;
}> = [
  {
    id: "linear",
    name: "Line",
    hint: "A perceptron is enough",
    why: "If a 0-hidden net fails here, the rest of the knobs are the problem.",
  },
  {
    id: "gauss",
    name: "Two Gaussians",
    hint: "Soft overlap",
    why: "Noise here is honest — the classes share a border.",
  },
  {
    id: "moons",
    name: "Two moons",
    hint: "Needs a bend",
    why: "The classic playground shape. One hidden layer should do it.",
  },
  {
    id: "circles",
    name: "Circles",
    hint: "Radial feature",
    why: "X₁² + X₂² solves it without depth. Depth also works.",
  },
  {
    id: "xor",
    name: "XOR",
    hint: "The original depth test",
    why: "Linear models cannot do this. Two hidden units can.",
  },
  {
    id: "spiral",
    name: "Spiral",
    hint: "Needs width or features",
    why: "The playground that shames a tiny net. Add units or sin features.",
  },
  {
    id: "unbalanced",
    name: "Unbalanced",
    hint: "Accuracy lies",
    why: "90% majority. Watch F1 and the test set, not the pretty color.",
  },
];

const unit = (i: number, seed: number) => {
  const value = Math.sin((i + 31) * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export function expandFeatures(
  x: number,
  y: number,
  features: FeatureId[],
): number[] {
  const active = features.length ? features : (["x1", "x2"] as FeatureId[]);
  return active.map((id) => {
    const feature = FEATURE_CATALOG.find((item) => item.id === id);
    return feature ? feature.apply(x, y) : 0;
  });
}

export function makePlaygroundData(
  kind: Exclude<PlaygroundDataset, "imported">,
  noise = 0.15,
  seed = 1,
  count = 240,
  imbalance = kind === "unbalanced" ? 0.1 : 0.5,
): PlaygroundPoint[] {
  const n = Math.max(20, Math.round(count));
  const ratio = Math.min(0.92, Math.max(0.08, imbalance));
  const n1 = Math.max(2, Math.min(n - 2, Math.round(n * ratio)));
  return Array.from({ length: n }, (_, i) => {
    const e = (unit(i, seed + 2) - 0.5) * noise * 2;
    const label = i < n1 ? 1 : 0;
    const j = label ? i : i - n1;
    const nClass = label ? n1 : n - n1;
    const t = nClass > 1 ? j / (nClass - 1) : 0;
    if (kind === "linear") {
      const x = (unit(i, seed) - 0.5) * 3.4;
      const side = label ? 1 : -1;
      const y = 0.15 * x + side * (0.28 + unit(i, seed + 5) * 1.1);
      return { x: x + e, y: y + e, label };
    }
    if (kind === "gauss" || kind === "unbalanced") {
      return {
        x: (label ? 0.9 : -0.7) + (unit(i, seed + 3) - 0.5) * (0.9 + noise),
        y: (label ? 0.3 : -0.25) + (unit(i, seed + 8) - 0.5) * (kind === "unbalanced" ? 1.6 : 0.9 + noise),
        label,
      };
    }
    if (kind === "moons") {
      const a = t * Math.PI;
      return label
        ? { x: 1 - Math.cos(a) + e, y: -0.5 - Math.sin(a) + e, label }
        : { x: Math.cos(a) - 0.5 + e, y: Math.sin(a) + e, label };
    }
    if (kind === "circles") {
      const a = t * Math.PI * 2;
      const r = label ? 1.35 : 0.62;
      return { x: r * Math.cos(a) + e, y: r * Math.sin(a) + e, label };
    }
    if (kind === "xor") {
      const sx = j % 2 ? 1 : -1;
      const sy = label ? sx : -sx;
      return {
        x: sx + (unit(i, seed + 4) - 0.5) * 1.05,
        y: sy + (unit(i, seed + 7) - 0.5) * 1.05,
        label,
      };
    }
    const r = 0.18 + t * 1.35;
    const a = t * Math.PI * 3.2 + label * Math.PI;
    return { x: Math.cos(a) * r + e, y: Math.sin(a) * r + e, label };
  });
}

export function shuffleLabels(
  points: PlaygroundPoint[],
  seed = 3,
): PlaygroundPoint[] {
  return points.map((point, i) => ({
    ...point,
    label: unit(i, seed + 11) > 0.5 ? 1 - point.label : point.label,
  }));
}

export function playgroundMetrics(
  labels: number[],
  probabilities: number[],
  holdout: boolean[],
) {
  const score = (mask: boolean) => {
    let tp = 0,
      tn = 0,
      fp = 0,
      fn = 0,
      n = 0;
    labels.forEach((label, i) => {
      if (holdout[i] !== mask) return;
      n += 1;
      const pred = (probabilities[i] ?? 0) >= 0.5 ? 1 : 0;
      if (pred && label) tp += 1;
      else if (!pred && !label) tn += 1;
      else if (pred) fp += 1;
      else fn += 1;
    });
    const precision = tp / Math.max(1, tp + fp);
    const recall = tp / Math.max(1, tp + fn);
    return {
      n,
      tp,
      tn,
      fp,
      fn,
      accuracy: n ? (tp + tn) / n : 0,
      precision,
      recall,
      f1: (2 * precision * recall) / Math.max(1e-9, precision + recall),
    };
  };
  return { train: score(false), test: score(true) };
}
