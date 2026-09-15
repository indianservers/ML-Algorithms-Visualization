import type { Dataset } from "../../data/sampleDatasets";
import { irisDataset } from "../../data/sampleDatasets";

export type DimensionalityCatalogId =
  | "a-correlated-2d"
  | "b-plane-3d"
  | "c-hd-blobs"
  | "d-iris"
  | "e-digit-glyphs"
  | "f-swiss-roll"
  | "g-concentric"
  | "h-class-separable"
  | "i-noisy-hd"
  | "j-few-informative"
  | "k-imbalanced"
  | "l-constant-feature"
  | "m-extreme-scale"
  | "n-small-n-high-d";

export interface DimensionalityCatalogItem {
  id: DimensionalityCatalogId;
  name: string;
  description: string;
  X: number[][];
  y?: number[];
  featureNames: string[];
  targetName?: string;
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

function gaussian(rand: () => number) {
  const u = Math.max(1e-12, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function digitGlyph(label: number, variant: number) {
  const segments: Record<number, string[]> = {
    0: ["t", "ul", "ur", "ll", "lr", "b"],
    1: ["ur", "lr"],
    2: ["t", "ur", "m", "ll", "b"],
    3: ["t", "ur", "m", "lr", "b"],
    4: ["ul", "ur", "m", "lr"],
    5: ["t", "ul", "m", "lr", "b"],
    6: ["t", "ul", "m", "ll", "lr", "b"],
    7: ["t", "ur", "lr"],
    8: ["t", "ul", "ur", "m", "ll", "lr", "b"],
    9: ["t", "ul", "ur", "m", "lr", "b"],
  };
  const active = segments[label % 10];
  const rand = seeded(variant * 97 + label + 3);
  const pixels: number[] = [];
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const on =
        (active.includes("t") && y <= 1 && x > 1 && x < 6) ||
        (active.includes("m") && y >= 3 && y <= 4 && x > 1 && x < 6) ||
        (active.includes("b") && y >= 6 && x > 1 && x < 6) ||
        (active.includes("ul") && x <= 1 && y > 1 && y < 4) ||
        (active.includes("ur") && x >= 6 && y > 1 && y < 4) ||
        (active.includes("ll") && x <= 1 && y > 4 && y < 6) ||
        (active.includes("lr") && x >= 6 && y > 4 && y < 6);
      pixels.push(Math.max(0, Math.min(1, (on ? 0.92 : 0.04) + (rand() - 0.5) * 0.12)));
    }
  }
  return pixels;
}

function correlated2d(): DimensionalityCatalogItem {
  const rand = seeded(11);
  const X = Array.from({ length: 80 }, () => {
    const t = gaussian(rand) * 2;
    return [t, 0.95 * t + gaussian(rand) * 0.15];
  });
  return {
    id: "a-correlated-2d",
    name: "A — 2D correlated linear",
    description: "Two highly correlated numeric features for PCA alignment checks.",
    X,
    featureNames: ["x1", "x2"],
  };
}

function plane3d(): DimensionalityCatalogItem {
  const rand = seeded(13);
  const X = Array.from({ length: 90 }, () => {
    const u = gaussian(rand);
    const v = gaussian(rand);
    return [u, v, 0.4 * u + 0.3 * v + gaussian(rand) * 0.05];
  });
  return {
    id: "b-plane-3d",
    name: "B — 3D plane-like",
    description: "Most variance lies in a 2D subspace.",
    X,
    featureNames: ["x", "y", "z"],
  };
}

function hdBlobs(): DimensionalityCatalogItem {
  const rand = seeded(17);
  const centers = [
    Array.from({ length: 12 }, (_, j) => (j % 3 === 0 ? 3 : 0)),
    Array.from({ length: 12 }, (_, j) => (j % 3 === 1 ? 3 : 0)),
    Array.from({ length: 12 }, (_, j) => (j % 3 === 2 ? 3 : -2)),
    Array.from({ length: 12 }, () => -2.2),
  ];
  const X: number[][] = [];
  const y: number[] = [];
  centers.forEach((center, label) => {
    for (let i = 0; i < 28; i += 1) {
      X.push(center.map((value) => value + gaussian(rand) * 0.45));
      y.push(label);
    }
  });
  return {
    id: "c-hd-blobs",
    name: "C — High-dimensional blobs",
    description: "12 dimensions, 4 clusters.",
    X,
    y,
    featureNames: Array.from({ length: 12 }, (_, i) => `f${i + 1}`),
    targetName: "cluster",
  };
}

function irisLike(): DimensionalityCatalogItem {
  const rows = irisDataset.data;
  const X = rows.map((row) => [
    Number(row.sepal_length),
    Number(row.sepal_width),
    Number(row.petal_length),
    Number(row.petal_width),
  ]);
  const y = rows.map((row) =>
    row.species === "setosa" ? 0 : row.species === "versicolor" ? 1 : 2,
  );
  const rand = seeded(19);
  const expandedX: number[][] = [];
  const expandedY: number[] = [];
  for (let i = 0; i < 150; i += 1) {
    const base = X[i % X.length];
    expandedX.push(base.map((value) => value + (rand() - 0.5) * 0.08));
    expandedY.push(y[i % y.length]);
  }
  return {
    id: "d-iris",
    name: "D — Iris",
    description: "4 numeric features, 3 classes. Labels are coloring only for unsupervised methods.",
    X: expandedX,
    y: expandedY,
    featureNames: ["sepal_length", "sepal_width", "petal_length", "petal_width"],
    targetName: "species",
  };
}

function digitGlyphs(): DimensionalityCatalogItem {
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < 120; i += 1) {
    const label = i % 10;
    X.push(digitGlyph(label, i));
    y.push(label);
  }
  return {
    id: "e-digit-glyphs",
    name: "E — Digit-like glyphs",
    description: "Browser-safe 8×8 segment digits for t-SNE, UMAP, and autoencoders.",
    X,
    y,
    featureNames: Array.from({ length: 64 }, (_, i) => `p${i}`),
    targetName: "digit",
  };
}

function swissRoll(): DimensionalityCatalogItem {
  const rand = seeded(23);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < 160; i += 1) {
    const t = (1.5 * Math.PI) * (1 + 2 * rand());
    const height = 21 * rand();
    X.push([t * Math.cos(t), height, t * Math.sin(t)]);
    y.push(t > 6 ? 1 : 0);
  }
  return {
    id: "f-swiss-roll",
    name: "F — Swiss roll",
    description: "Classic nonlinear 3D manifold.",
    X,
    y,
    featureNames: ["x", "y", "z"],
    targetName: "roll",
  };
}

function concentric(): DimensionalityCatalogItem {
  const rand = seeded(29);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < 160; i += 1) {
    const label = i < 80 ? 0 : 1;
    const angle = rand() * Math.PI * 2;
    const radius = (label ? 2.2 : 0.9) + (rand() - 0.5) * 0.12;
    X.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
    y.push(label);
  }
  return {
    id: "g-concentric",
    name: "G — Concentric circles",
    description: "Nonlinear manifold for Kernel PCA.",
    X,
    y,
    featureNames: ["x", "y"],
    targetName: "ring",
  };
}

function classSeparable(): DimensionalityCatalogItem {
  const rand = seeded(31);
  const X: number[][] = [];
  const y: number[] = [];
  for (let label = 0; label < 4; label += 1) {
    for (let i = 0; i < 30; i += 1) {
      const a = gaussian(rand) + label * 2.4;
      const b = gaussian(rand) - label * 1.1;
      X.push([a, b, 0.2 * a + 0.1 * gaussian(rand), gaussian(rand) * 0.4]);
      y.push(label);
    }
  }
  return {
    id: "h-class-separable",
    name: "H — Class-separable supervised",
    description: "Four classes linearly separable in combinations of features. For LDA.",
    X,
    y,
    featureNames: ["f1", "f2", "f3", "noise"],
    targetName: "class",
  };
}

function noisyHd(): DimensionalityCatalogItem {
  const rand = seeded(37);
  const X = Array.from({ length: 80 }, () => {
    const signal = [gaussian(rand), gaussian(rand) * 0.6];
    return [
      signal[0],
      signal[1],
      signal[0] + signal[1],
      ...Array.from({ length: 9 }, () => gaussian(rand) * 1.8),
    ];
  });
  return {
    id: "i-noisy-hd",
    name: "I — Noisy high-dimensional",
    description: "A few informative directions plus strong noise. PCA / autoencoder denoising.",
    X,
    featureNames: Array.from({ length: 12 }, (_, i) => `f${i + 1}`),
  };
}

function fewInformative(): DimensionalityCatalogItem {
  const rand = seeded(41);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < 90; i += 1) {
    const label = i % 3;
    const informative = [label * 2 + gaussian(rand) * 0.3, (2 - label) + gaussian(rand) * 0.3];
    X.push([...informative, ...Array.from({ length: 10 }, () => gaussian(rand) * 0.15)]);
    y.push(label);
  }
  return {
    id: "j-few-informative",
    name: "J — Many features, few informative",
    description: "12 features; only the first two carry class structure.",
    X,
    y,
    featureNames: Array.from({ length: 12 }, (_, i) => `f${i + 1}`),
    targetName: "class",
  };
}

function imbalanced(): DimensionalityCatalogItem {
  const rand = seeded(43);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < 80; i += 1) {
    X.push([gaussian(rand) * 0.4, gaussian(rand) * 0.4, gaussian(rand) * 0.2]);
    y.push(0);
  }
  for (let i = 0; i < 12; i += 1) {
    X.push([3 + gaussian(rand) * 0.35, 3 + gaussian(rand) * 0.35, gaussian(rand) * 0.2]);
    y.push(1);
  }
  return {
    id: "k-imbalanced",
    name: "K — Imbalanced classes",
    description: "80 vs 12 observations. LDA must use actual class counts in scatter weights.",
    X,
    y,
    featureNames: ["x", "y", "z"],
    targetName: "class",
  };
}

function constantFeature(): DimensionalityCatalogItem {
  const rand = seeded(47);
  const X = Array.from({ length: 40 }, () => [gaussian(rand), 5, gaussian(rand) * 0.4]);
  return {
    id: "l-constant-feature",
    name: "L — Constant feature",
    description: "Middle column is constant. Standardization must not produce NaN.",
    X,
    featureNames: ["varying", "constant", "noise"],
  };
}

function extremeScale(): DimensionalityCatalogItem {
  const rand = seeded(53);
  const X = Array.from({ length: 50 }, () => [rand(), rand() * 1_000_000, rand() * 0.01]);
  return {
    id: "m-extreme-scale",
    name: "M — Extreme scale mix",
    description: "Feature ranges 0–1 vs 0–1e6. Scaling ON vs OFF must change PCA.",
    X,
    featureNames: ["unit", "huge", "tiny"],
  };
}

function smallNHighD(): DimensionalityCatalogItem {
  const rand = seeded(59);
  const X: number[][] = [];
  const y: number[] = [];
  for (let i = 0; i < 10; i += 1) {
    const label = i < 5 ? 0 : 1;
    X.push(Array.from({ length: 40 }, (_, j) => (j < 2 ? label * 2 + gaussian(rand) * 0.2 : gaussian(rand) * 0.05)));
    y.push(label);
  }
  return {
    id: "n-small-n-high-d",
    name: "N — Small N, high D",
    description: "10 samples × 40 features. LDA scatter can be singular; PCA uses rank ≤ N-1.",
    X,
    y,
    featureNames: Array.from({ length: 40 }, (_, i) => `f${i + 1}`),
    targetName: "class",
  };
}

const BUILDERS: Record<DimensionalityCatalogId, () => DimensionalityCatalogItem> = {
  "a-correlated-2d": correlated2d,
  "b-plane-3d": plane3d,
  "c-hd-blobs": hdBlobs,
  "d-iris": irisLike,
  "e-digit-glyphs": digitGlyphs,
  "f-swiss-roll": swissRoll,
  "g-concentric": concentric,
  "h-class-separable": classSeparable,
  "i-noisy-hd": noisyHd,
  "j-few-informative": fewInformative,
  "k-imbalanced": imbalanced,
  "l-constant-feature": constantFeature,
  "m-extreme-scale": extremeScale,
  "n-small-n-high-d": smallNHighD,
};

export function getDimensionalityCatalog(): DimensionalityCatalogItem[] {
  return (Object.keys(BUILDERS) as DimensionalityCatalogId[]).map((id) => BUILDERS[id]());
}

export function getDimensionalityDataset(id: DimensionalityCatalogId) {
  return BUILDERS[id]();
}

export function dimensionalityCatalogTables(): Dataset[] {
  return getDimensionalityCatalog().map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    type: item.y ? "classification" : "clustering",
    columns: item.targetName ? [...item.featureNames, item.targetName] : item.featureNames,
    data: item.X.map((row, i) => {
      const record: Record<string, unknown> = {};
      item.featureNames.forEach((name, j) => {
        record[name] = row[j];
      });
      if (item.targetName && item.y) record[item.targetName] = item.y[i];
      return record;
    }),
  }));
}

export function catalogToSamples(item: DimensionalityCatalogItem) {
  return item.X.map((values, i) => ({ values, label: item.y?.[i] ?? 0 }));
}
