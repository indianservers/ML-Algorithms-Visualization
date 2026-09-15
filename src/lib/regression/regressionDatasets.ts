export interface LabDataset {
  id: string;
  name: string;
  description: string;
  features: string[];
  target: string;
  labels: Record<string, string>;
  rows: Array<Record<string, number>>;
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

function zipRows(columns: Record<string, number[]>): Array<Record<string, number>> {
  const keys = Object.keys(columns);
  const n = columns[keys[0]]?.length ?? 0;
  return Array.from({ length: n }, (_, i) => {
    const row: Record<string, number> = {};
    for (const key of keys) row[key] = columns[key][i];
    return row;
  });
}

const PERFECT_X = [1, 2, 3, 4, 5, 6, 7, 8];

export const datasetAPerfectPositive: LabDataset = {
  id: "A",
  name: "Perfect positive linear",
  description: "y = 1 + 2x with no noise. OLS should recover intercept ≈ 1, slope ≈ 2, R² ≈ 1.",
  features: ["x"],
  target: "y",
  labels: { x: "x", y: "y" },
  rows: zipRows({ x: PERFECT_X, y: PERFECT_X.map((x) => 1 + 2 * x) }),
};

export const datasetBPerfectNegative: LabDataset = {
  id: "B",
  name: "Perfect negative linear",
  description: "y = 20 − 2x. Slope should be negative and R² ≈ 1.",
  features: ["x"],
  target: "y",
  labels: { x: "x", y: "y" },
  rows: zipRows({ x: PERFECT_X, y: PERFECT_X.map((x) => 20 - 2 * x) }),
};

export function datasetCNoisyLinear(count = 40, seed = 42, noise = 1.2): LabDataset {
  const rand = seeded(seed);
  const x = Array.from({ length: count }, (_, i) => i + 1);
  const y = x.map((xi) => 5 + 3 * xi + (rand() * 2 - 1) * noise);
  return {
    id: "C",
    name: "Noisy linear",
    description: "Approximate y = 5 + 3x + noise with a fixed seed.",
    features: ["x"],
    target: "y",
    labels: { x: "x", y: "y" },
    rows: zipRows({ x, y }),
  };
}

export function datasetDWeakRelationship(count = 30, seed = 7): LabDataset {
  const rand = seeded(seed);
  const x = Array.from({ length: count }, (_, i) => i + 1);
  const y = Array.from({ length: count }, () => 10 + rand() * 8);
  return {
    id: "D",
    name: "Weak relationship",
    description: "X has almost no predictive power for Y. Expect a low R².",
    features: ["x"],
    target: "y",
    labels: { x: "x", y: "y" },
    rows: zipRows({ x, y }),
  };
}

export const datasetEOutliers: LabDataset = {
  id: "E",
  name: "Outlier linear",
  description: "Mostly y = 2 + 1.5x, plus two severe outliers that inflate RMSE.",
  features: ["x"],
  target: "y",
  labels: { x: "x", y: "y" },
  rows: zipRows({
    x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    y: [3.5, 5, 6.5, 8, 9.5, 11, 12.5, 40, 15.5, -8],
  }),
};

export function datasetFQuadratic(): LabDataset {
  const x = Array.from({ length: 11 }, (_, i) => i - 5);
  return {
    id: "F",
    name: "Quadratic (y ≈ x²)",
    description: "Linear regression should fit poorly; polynomial degree 2 should fit well.",
    features: ["x"],
    target: "y",
    labels: { x: "x", y: "y" },
    rows: zipRows({ x, y: x.map((xi) => xi * xi) }),
  };
}

export function datasetGCubic(seed = 11): LabDataset {
  const rand = seeded(seed);
  const x = Array.from({ length: 21 }, (_, i) => i - 10);
  const y = x.map((xi) => 0.5 * xi ** 3 - 2 * xi ** 2 + xi + (rand() * 2 - 1) * 8);
  return {
    id: "G",
    name: "Cubic with noise",
    description: "y ≈ 0.5x³ − 2x² + x + noise.",
    features: ["x"],
    target: "y",
    labels: { x: "x", y: "y" },
    rows: zipRows({ x, y }),
  };
}

export const datasetHHousing: LabDataset = {
  id: "H",
  name: "Multivariate housing",
  description: "Deterministic housing table: area, bedrooms, age, distance → price.",
  features: ["area", "bedrooms", "age", "distance_to_city"],
  target: "price",
  labels: {
    area: "Area (sqft)",
    bedrooms: "Bedrooms",
    age: "Age (years)",
    distance_to_city: "Distance to city",
    price: "Price",
  },
  rows: [
    { area: 1500, bedrooms: 3, age: 10, distance_to_city: 5, price: 250000 },
    { area: 2000, bedrooms: 4, age: 5, distance_to_city: 8, price: 320000 },
    { area: 1200, bedrooms: 2, age: 20, distance_to_city: 3, price: 180000 },
    { area: 2500, bedrooms: 5, age: 2, distance_to_city: 12, price: 420000 },
    { area: 1800, bedrooms: 3, age: 8, distance_to_city: 6, price: 290000 },
    { area: 1100, bedrooms: 2, age: 30, distance_to_city: 2, price: 160000 },
    { area: 3000, bedrooms: 5, age: 1, distance_to_city: 15, price: 510000 },
    { area: 1600, bedrooms: 3, age: 12, distance_to_city: 7, price: 265000 },
    { area: 2200, bedrooms: 4, age: 6, distance_to_city: 9, price: 355000 },
    { area: 900, bedrooms: 2, age: 40, distance_to_city: 1, price: 135000 },
    { area: 1750, bedrooms: 3, age: 9, distance_to_city: 5, price: 280000 },
    { area: 2800, bedrooms: 5, age: 3, distance_to_city: 11, price: 460000 },
    { area: 1400, bedrooms: 3, age: 15, distance_to_city: 4, price: 225000 },
    { area: 2100, bedrooms: 4, age: 7, distance_to_city: 10, price: 340000 },
    { area: 1300, bedrooms: 2, age: 25, distance_to_city: 3, price: 195000 },
    { area: 2400, bedrooms: 4, age: 4, distance_to_city: 10, price: 390000 },
    { area: 1700, bedrooms: 3, age: 18, distance_to_city: 6, price: 255000 },
    { area: 2600, bedrooms: 5, age: 2, distance_to_city: 13, price: 445000 },
  ],
};

export function datasetIMulticollinearity(): LabDataset {
  const area = [900, 1100, 1300, 1500, 1700, 1900, 2100, 2300, 2500, 2700, 2900, 3100];
  const rooms = [2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5];
  const age = [30, 28, 22, 18, 14, 12, 9, 7, 5, 3, 2, 1];
  const areaSqm = area.map((v) => Number((v * 0.092903).toFixed(3)));
  const price = area.map((a, i) => 40000 + 140 * a + 8000 * rooms[i] - 1200 * age[i]);
  return {
    id: "I",
    name: "Multicollinear predictors",
    description: "area_sqft and area_sqm are nearly linear transforms of each other.",
    features: ["area_sqft", "area_sqm", "rooms", "age"],
    target: "price",
    labels: {
      area_sqft: "Area (sqft)",
      area_sqm: "Area (sqm, converted)",
      rooms: "Rooms",
      age: "Age",
      price: "Price",
    },
    rows: zipRows({ area_sqft: area, area_sqm: areaSqm, rooms, age, price }),
  };
}

export function datasetJIrrelevantFeatures(seed = 19): LabDataset {
  const rand = seeded(seed);
  const n = 48;
  const signal = Array.from({ length: n }, (_, i) => 1 + i * 0.4);
  const noise1 = Array.from({ length: n }, () => rand() * 10);
  const noise2 = Array.from({ length: n }, () => rand() * 10);
  const noise3 = Array.from({ length: n }, () => rand() * 10);
  const y = signal.map((s, i) => 2 + 1.7 * s + (rand() * 2 - 1) * 0.4 + 0 * noise1[i]);
  return {
    id: "J",
    name: "Useful + irrelevant features",
    description: "Only `signal` drives y. Lasso / Elastic Net should shrink the noise columns.",
    features: ["signal", "noise_a", "noise_b", "noise_c"],
    target: "y",
    labels: {
      signal: "Signal",
      noise_a: "Noise A",
      noise_b: "Noise B",
      noise_c: "Noise C",
      y: "y",
    },
    rows: zipRows({ signal, noise_a: noise1, noise_b: noise2, noise_c: noise3, y }),
  };
}

export function datasetKPiecewise(): LabDataset {
  const x = Array.from({ length: 36 }, (_, i) => -6 + i * (12 / 35));
  const y = x.map((xi) => (xi < -1 ? 8 : xi < 2 ? 20 : 42) + 0.15 * xi);
  return {
    id: "K",
    name: "Piecewise / tree",
    description: "Step relationship in x. Trees and boosting should outperform a single line.",
    features: ["x"],
    target: "y",
    labels: { x: "x", y: "y" },
    rows: zipRows({ x, y }),
  };
}

export function datasetLSvrNonlinear(seed = 23): LabDataset {
  const rand = seeded(seed);
  const x = Array.from({ length: 50 }, (_, i) => -3 + (i * 6) / 49);
  const y = x.map((xi) => Math.sin(1.4 * xi) + 0.15 * xi + (rand() * 2 - 1) * 0.12);
  return {
    id: "L",
    name: "Smooth nonlinear (SVR)",
    description: "Noisy sine. Linear SVR underfits; RBF should follow the curve.",
    features: ["x"],
    target: "y",
    labels: { x: "x", y: "y" },
    rows: zipRows({ x, y }),
  };
}

export function datasetMConstantTarget(): LabDataset {
  const x = Array.from({ length: 12 }, (_, i) => i + 1);
  return {
    id: "M",
    name: "Constant target",
    description: "y is identical for every row. MAE/RMSE remain defined; R² is not informative.",
    features: ["x"],
    target: "y",
    labels: { x: "x", y: "y" },
    rows: zipRows({ x, y: x.map(() => 7) }),
  };
}

export function datasetNConstantFeature(): LabDataset {
  const x = Array.from({ length: 16 }, (_, i) => i);
  const constFeat = x.map(() => 3);
  const y = x.map((xi) => 2 + 1.5 * xi);
  return {
    id: "N",
    name: "Constant feature + signal",
    description: "One column never changes. Scalers must avoid divide-by-zero.",
    features: ["signal", "constant"],
    target: "y",
    labels: { signal: "Signal", constant: "Constant", y: "y" },
    rows: zipRows({ signal: x, constant: constFeat, y }),
  };
}

export const PHASE1_UNIVARIATE = {
  A: datasetAPerfectPositive,
  B: datasetBPerfectNegative,
  C: datasetCNoisyLinear(),
  D: datasetDWeakRelationship(),
  E: datasetEOutliers,
  F: datasetFQuadratic(),
  G: datasetGCubic(),
  K: datasetKPiecewise(),
  L: datasetLSvrNonlinear(),
};

export function labXy(dataset: LabDataset, features = dataset.features) {
  const X = dataset.rows.map((row) => features.map((name) => row[name]));
  const y = dataset.rows.map((row) => row[dataset.target]);
  return { X, y, features };
}

export function labPoints(dataset: LabDataset, xName = dataset.features[0]) {
  return dataset.rows.map((row, id) => ({
    id,
    x: row[xName],
    y: row[dataset.target],
  }));
}
