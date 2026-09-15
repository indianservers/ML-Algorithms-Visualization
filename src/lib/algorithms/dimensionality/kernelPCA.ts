export type KernelPCAKernel =
  "rbf" | "polynomial" | "sigmoid" | "laplacian" | "linear";

export const KERNEL_PCA_MAX_SAMPLES = 400;
export interface KernelPCAResult {
  kernel: number[][];
  centeredKernel: number[][];
  projection: number[][];
  eigenvalues: number[];
  explainedVariance: number[];
  transformedInput: number[][];
  vectors: number[][];
  trainX: number[][];
  kernelName: KernelPCAKernel;
  gamma: number;
  degree: number;
  coef0: number;
  center: boolean;
  rowMeans: number[];
  grandMean: number;
  inputMeans: number[];
  inputScales: number[];
  normalize: boolean;
}

const dot = (a: number[], b: number[]) =>
  a.reduce((sum, value, i) => sum + value * b[i], 0);
const norm = (values: number[]) => Math.sqrt(dot(values, values)) || 1;

export function rbfKernel(a: number[], b: number[], gamma: number) {
  const squared = a.reduce((s, value, i) => s + (value - b[i]) ** 2, 0);
  return Math.exp(-gamma * squared);
}

export function polynomialKernel(a: number[], b: number[], gamma: number, coef0: number, degree: number) {
  return (gamma * dot(a, b) + coef0) ** degree;
}

export function kernelSimilarity(
  a: number[],
  b: number[],
  kernel: KernelPCAKernel,
  gamma: number,
  degree: number,
  coef0: number,
) {
  const product = dot(a, b);
  const squared = a.reduce((s, value, i) => s + (value - b[i]) ** 2, 0);
  if (kernel === "linear") return product;
  if (kernel === "polynomial") return (gamma * product + coef0) ** degree;
  if (kernel === "sigmoid") return Math.tanh(gamma * product + coef0);
  if (kernel === "laplacian") return Math.exp(-gamma * Math.sqrt(squared));
  return Math.exp(-gamma * squared);
}

export function kernelPCA(
  X: number[][],
  components = 10,
  kernel: KernelPCAKernel = "rbf",
  gamma = 5,
  degree = 3,
  coef0 = 0,
  center = true,
  normalize = true,
): KernelPCAResult {
  if (X.length < 2)
    throw new Error("Kernel PCA requires at least two samples.");
  if (X.length > KERNEL_PCA_MAX_SAMPLES)
    throw new Error(
      `Kernel PCA builds an N×N kernel (~${((X.length * X.length * 8) / 1e6).toFixed(1)} MB). Limit is ${KERNEL_PCA_MAX_SAMPLES} samples in this browser lab.`,
    );
  const width = X[0]?.length;
  if (!width || !X.every((row) => row.length === width && row.every(Number.isFinite)))
    throw new Error("Kernel PCA requires a finite rectangular feature matrix.");
  if (!Number.isInteger(components) || components < 1 ||
      !Number.isFinite(gamma) || gamma < 0 || !Number.isInteger(degree) || degree < 1 ||
      !Number.isFinite(coef0))
    throw new Error("Invalid Kernel PCA hyperparameters.");
  const d = X[0].length,
    means = Array.from(
      { length: d },
      (_, j) => X.reduce((s, row) => s + row[j], 0) / X.length,
    ),
    scales = Array.from(
      { length: d },
      (_, j) =>
        Math.sqrt(
          X.reduce((s, row) => s + (row[j] - means[j]) ** 2, 0) / X.length,
        ) || 1,
    );
  const transformedInput = X.map((row) =>
    row.map((value, j) => (normalize ? (value - means[j]) / scales[j] : value)),
  );
  const kernelMatrix = transformedInput.map((row) =>
    transformedInput.map((other) => kernelSimilarity(row, other, kernel, gamma, degree, coef0)),
  );
  const rowMeans = kernelMatrix.map(
      (row) => row.reduce((s, v) => s + v, 0) / X.length,
    ),
    grand = rowMeans.reduce((s, v) => s + v, 0) / X.length;
  const centeredKernel = center
    ? kernelMatrix.map((row, i) =>
        row.map((value, j) => value - rowMeans[i] - rowMeans[j] + grand),
      )
    : kernelMatrix.map((row) => [...row]);
  const work = centeredKernel.map((row) => [...row]),
    eigenvalues: number[] = [],
    vectors: number[][] = [],
    count = Math.min(components, X.length);
  for (let component = 0; component < count; component += 1) {
    let vector = Array.from({ length: X.length }, (_, i) =>
      Math.sin((i + 1) * (component + 1) * 1.618),
    );
    for (let iteration = 0; iteration < 70; iteration += 1) {
      const next = work.map((row) => dot(row, vector));
      const magnitude = norm(next);
      if (!Number.isFinite(magnitude) || magnitude < 1e-12) break;
      vector = next.map((value) => value / magnitude);
    }
    const multiplied = work.map((row) => dot(row, vector)),
      value = Math.max(0, dot(vector, multiplied));
    if (!Number.isFinite(value)) continue;
    eigenvalues.push(value);
    vectors.push(vector);
    for (let i = 0; i < X.length; i += 1)
      for (let j = 0; j < X.length; j += 1)
        work[i][j] -= value * vector[i] * vector[j];
  }
  const ranked = eigenvalues
    .map((value, index) => ({ value, vector: vectors[index] }))
    .sort((a, b) => b.value - a.value);
  eigenvalues.splice(0, eigenvalues.length, ...ranked.map((item) => item.value));
  vectors.splice(0, vectors.length, ...ranked.map((item) => item.vector));
  const projection = X.map((_, i) =>
    vectors.map(
      (vector, c) => vector[i] * Math.sqrt(Math.max(eigenvalues[c], 0)),
    ).map((value) => (Number.isFinite(value) ? value : 0)),
  );
  const selectedTotal = eigenvalues.reduce((s, v) => s + v, 0),
    kernelTrace = centeredKernel.reduce((sum, row, i) => sum + row[i], 0),
    total = Math.max(selectedTotal, kernelTrace, 1e-12),
    explainedVariance = eigenvalues.map((value) => value / total);
  return {
    kernel: kernelMatrix,
    centeredKernel,
    projection,
    eigenvalues,
    explainedVariance,
    transformedInput,
    vectors,
    trainX: transformedInput,
    kernelName: kernel,
    gamma,
    degree,
    coef0,
    center,
    rowMeans,
    grandMean: grand,
    inputMeans: means,
    inputScales: scales,
    normalize,
  };
}

export function transformKernelPCA(Xnew: number[][], model: KernelPCAResult) {
  const mapped = Xnew.map((row) =>
    row.map((value, j) =>
      model.normalize ? (value - model.inputMeans[j]) / model.inputScales[j] : value,
    ),
  );
  return mapped.map((point) => {
    const k = model.trainX.map((train) =>
      kernelSimilarity(point, train, model.kernelName, model.gamma, model.degree, model.coef0),
    );
    const kMean = k.reduce((s, v) => s + v, 0) / k.length;
    const centered = model.center
      ? k.map((value, j) => value - kMean - model.rowMeans[j] + model.grandMean)
      : k;
    return model.vectors.map((vector, c) => {
      const score = centered.reduce((sum, value, i) => sum + value * vector[i], 0);
      const scaled = score / Math.sqrt(Math.max(model.eigenvalues[c], 1e-12));
      return Number.isFinite(scaled) ? scaled : 0;
    });
  });
}
