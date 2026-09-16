export interface ClassPoint {
  x: number;
  y: number;
  label: number;
}

export interface ClassRow {
  features: number[];
  label: number;
  labelName: string;
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

function cloud(
  cx: number,
  cy: number,
  label: number,
  count: number,
  seed: number,
  sx: number,
  sy: number,
): ClassPoint[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => {
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand());
    return {
      x: cx + Math.cos(angle) * radius * sx,
      y: cy + Math.sin(angle) * radius * sy,
      label,
    };
  });
}

export function datasetAPerfectBinary(): ClassPoint[] {
  return [
    ...cloud(-2.2, -2.0, 0, 40, 11, 0.55, 0.55),
    ...cloud(2.2, 2.0, 1, 40, 23, 0.55, 0.55),
  ];
}

export function datasetBOverlappingBinary(): ClassPoint[] {
  return [
    ...cloud(-0.4, -0.3, 0, 50, 31, 1.1, 1.0),
    ...cloud(0.5, 0.4, 1, 50, 47, 1.1, 1.0),
  ];
}

export function datasetCXor(): ClassPoint[] {
  return [
    ...cloud(-1.4, -1.4, 0, 22, 5, 0.45, 0.45),
    ...cloud(1.4, 1.4, 0, 22, 6, 0.45, 0.45),
    ...cloud(-1.4, 1.4, 1, 22, 7, 0.45, 0.45),
    ...cloud(1.4, -1.4, 1, 22, 8, 0.45, 0.45),
  ];
}

export function datasetDTwoMoons(count = 80, seed = 9): ClassPoint[] {
  const rand = seeded(seed);
  const half = Math.floor(count / 2);
  const points: ClassPoint[] = [];
  for (let i = 0; i < half; i++) {
    const t = (i / (half - 1)) * Math.PI;
    points.push({
      x: Math.cos(t) + (rand() - 0.5) * 0.18,
      y: Math.sin(t) + (rand() - 0.5) * 0.18,
      label: 0,
    });
  }
  for (let i = 0; i < count - half; i++) {
    const t = (i / (count - half - 1)) * Math.PI;
    points.push({
      x: 1 - Math.cos(t) + (rand() - 0.5) * 0.18,
      y: 0.5 - Math.sin(t) + (rand() - 0.5) * 0.18,
      label: 1,
    });
  }
  return points;
}

export function datasetECircles(count = 90, seed = 13): ClassPoint[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const inner = i < count / 2;
    const angle = rand() * Math.PI * 2;
    const radius = inner ? 0.35 + rand() * 0.35 : 1.15 + rand() * 0.35;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      label: inner ? 0 : 1,
    };
  });
}

export function datasetFThreeBlobs(): ClassPoint[] {
  return [
    ...cloud(-2.0, -1.6, 0, 30, 41, 0.55, 0.55),
    ...cloud(2.1, -1.4, 1, 30, 42, 0.55, 0.55),
    ...cloud(0.1, 2.0, 2, 30, 43, 0.55, 0.55),
  ];
}

/**
 * Blobs for an arbitrary number of classes, with centres spread evenly around
 * a circle so every class stays separable as `classCount` grows.
 */
export function datasetMultiClassBlobs(
  classCount: number,
  perClass = 26,
  seed = 401,
  spread = 0.62,
): ClassPoint[] {
  const classes = Math.max(2, Math.min(8, Math.round(classCount)));
  const ring = classes <= 3 ? 2.2 : 1.05 * classes;
  return Array.from({ length: classes }, (_, label) => {
    const angle = (label / classes) * Math.PI * 2 - Math.PI / 2;
    return cloud(
      Math.cos(angle) * ring,
      Math.sin(angle) * ring,
      label,
      perClass,
      seed + label * 37,
      spread,
      spread,
    );
  }).flat();
}

export function datasetHImbalanced(): ClassPoint[] {
  return [
    ...cloud(-1.2, 0, 0, 90, 71, 1.4, 1.2),
    ...cloud(2.4, 0.2, 1, 10, 72, 0.45, 0.45),
  ];
}

export function datasetINoisy(seed = 88): ClassPoint[] {
  const base = datasetAPerfectBinary();
  const rand = seeded(seed);
  return base.map((point, index) =>
    index % 9 === 0
      ? { ...point, label: 1 - point.label, y: point.y + (rand() - 0.5) }
      : point,
  );
}

export function pointsToRows(points: ClassPoint[], names = ["class 0", "class 1"]): ClassRow[] {
  return points.map((point) => ({
    features: [point.x, point.y],
    label: point.label,
    labelName: names[point.label] ?? `class ${point.label}`,
  }));
}

const IRIS_SPECIES = ["setosa", "versicolor", "virginica"] as const;

/** Published Fisher iris subset shipped with the app, plus class-conditional draws so labs have enough rows. */
export function datasetGIris(): ClassRow[] {
  const measured: ClassRow[] = [
    [5.1, 3.5, 1.4, 0.2, 0],
    [4.9, 3.0, 1.4, 0.2, 0],
    [4.7, 3.2, 1.3, 0.2, 0],
    [4.6, 3.1, 1.5, 0.2, 0],
    [5.0, 3.6, 1.4, 0.2, 0],
    [5.4, 3.9, 1.7, 0.4, 0],
    [4.6, 3.4, 1.4, 0.3, 0],
    [5.0, 3.4, 1.5, 0.2, 0],
    [4.4, 2.9, 1.4, 0.2, 0],
    [4.9, 3.1, 1.5, 0.1, 0],
    [7.0, 3.2, 4.7, 1.4, 1],
    [6.4, 3.2, 4.5, 1.5, 1],
    [6.9, 3.1, 4.9, 1.5, 1],
    [5.5, 2.3, 4.0, 1.3, 1],
    [6.5, 2.8, 4.6, 1.5, 1],
    [6.3, 3.3, 6.0, 2.5, 2],
    [5.8, 2.7, 5.1, 1.9, 2],
    [7.1, 3.0, 5.9, 2.1, 2],
    [6.3, 2.9, 5.6, 1.8, 2],
    [6.5, 3.0, 5.8, 2.2, 2],
  ].map(([a, b, c, d, label]) => ({
    features: [a, b, c, d],
    label,
    labelName: IRIS_SPECIES[label],
  }));
  const means = [0, 1, 2].map((label) => {
    const group = measured.filter((row) => row.label === label);
    return group[0].features.map(
      (_, j) => group.reduce((sum, row) => sum + row.features[j], 0) / group.length,
    );
  });
  const rand = seeded(150);
  const extra: ClassRow[] = [];
  for (let label = 0; label < 3; label++) {
    for (let i = 0; i < 30; i++) {
      extra.push({
        features: means[label].map((m, j) => m + (rand() - 0.5) * [0.28, 0.22, 0.35, 0.18][j]),
        label,
        labelName: IRIS_SPECIES[label],
      });
    }
  }
  return [...measured, ...extra];
}

export function irisPetalPoints(): ClassPoint[] {
  return datasetGIris().map((row) => ({
    x: row.features[2],
    y: row.features[3],
    label: row.label,
  }));
}

export function datasetJChurn(count = 120, seed = 64): ClassRow[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => {
    const age = 22 + rand() * 40;
    const income = 28000 + rand() * 90000;
    const usage = rand() * 80;
    const tenure = rand() * 12;
    const engagement = rand();
    const z =
      -1.2 +
      (age - 40) * -0.03 +
      (income - 60000) / 80000 +
      (usage - 40) * 0.04 +
      (4 - tenure) * 0.18 +
      (0.4 - engagement) * 1.6;
    const p = 1 / (1 + Math.exp(-z));
    const label = rand() < p ? 1 : 0;
    return {
      features: [age, income, usage, tenure, engagement],
      label,
      labelName: label ? "churn" : "stay",
    };
  });
}

export function datasetKCounts(count = 90, seed = 19): ClassRow[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => {
    const label = Math.floor(rand() * 3);
    const rates = [
      [8, 1, 2, 0.5],
      [1, 7, 3, 1],
      [2, 2, 9, 4],
    ][label];
    const features = rates.map((rate) => {
      let k = 0;
      const L = Math.exp(-rate);
      let p = 1;
      do {
        k += 1;
        p *= rand();
      } while (p > L);
      return k - 1;
    });
    return { features, label, labelName: `topic ${label}` };
  });
}

export function datasetLBernoulli(count = 80, seed = 27): ClassRow[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => {
    const label = rand() < 0.5 ? 0 : 1;
    const p = label
      ? [0.8, 0.7, 0.15, 0.2, 0.9]
      : [0.2, 0.25, 0.75, 0.8, 0.1];
    const features = p.map((prob) => (rand() < prob ? 1 : 0));
    return {
      features,
      label,
      labelName: label ? "spam" : "ham",
    };
  });
}

export function datasetA1D(): { x: number; y: number }[] {
  return datasetAPerfectBinary().map((p) => ({ x: p.x * 20 + 50, y: p.label }));
}

export function datasetB1D(): { x: number; y: number }[] {
  return datasetBOverlappingBinary().map((p) => ({
    x: p.x * 18 + 50,
    y: p.label,
  }));
}

export function datasetH1D(): { x: number; y: number }[] {
  return datasetHImbalanced().map((p) => ({ x: p.x * 16 + 50, y: p.label }));
}

export function datasetHSevere1D(): { x: number; y: number }[] {
  return Array.from({ length: 100 }, (_, i) => ({
    x: i < 95 ? 40 + (i % 20) : 78 + (i % 5),
    y: i < 95 ? 0 : 1,
  }));
}

export function datasetCXor1DFails(): { x: number; y: number; z: number }[] {
  return datasetCXor().map((p) => ({ x: p.x, z: p.y, y: p.label }));
}
