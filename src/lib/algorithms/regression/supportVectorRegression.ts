export type SvrKernel = "linear" | "rbf" | "polynomial";

export interface SupportVectorRegressionOptions {
  kernel: SvrKernel;
  c: number;
  epsilon: number;
  gamma: number;
  degree?: number;
  epochs?: number;
  learningRate?: number;
}

export interface SupportVectorRegressionModel {
  kernel: SvrKernel;
  c: number;
  epsilon: number;
  gamma: number;
  degree: number;
  coefficients: number[];
  bias: number;
  supportIndices: number[];
  boundaryIndices: number[];
  lossHistory: number[];
  predict: (row: number[]) => number;
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function kernelValue(
  left: number[],
  right: number[],
  kernel: SvrKernel,
  gamma: number,
  degree: number,
) {
  const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
  if (kernel === "linear") return dot;
  if (kernel === "polynomial")
    return (gamma * dot + 1) ** degree;
  const squaredDistance = left.reduce(
    (sum, value, index) => sum + (value - right[index]) ** 2,
    0,
  );
  return Math.exp(-gamma * squaredDistance);
}

export function trainSupportVectorRegression(
  X: number[][],
  y: number[],
  options: SupportVectorRegressionOptions,
): SupportVectorRegressionModel {
  if (!X.length || X.length !== y.length || !X[0]?.length) {
    throw new Error(
      "SVR requires aligned, non-empty feature and target arrays.",
    );
  }
  const width = X[0].length;
  if (!X.every((row) => row.length === width && row.every(Number.isFinite)) ||
      !y.every(Number.isFinite))
    throw new Error("SVR requires finite rectangular data.");
  if (!Number.isFinite(options.c) || options.c <= 0 ||
      !Number.isFinite(options.epsilon) || options.epsilon < 0 ||
      !Number.isFinite(options.gamma) || options.gamma <= 0)
    throw new Error("SVR requires C > 0, epsilon >= 0, and gamma > 0.");

  const featureMeans = X[0].map((_, column) =>
    mean(X.map((row) => row[column])),
  );
  const featureScales = X[0].map((_, column) => {
    const variance = mean(
      X.map((row) => (row[column] - featureMeans[column]) ** 2),
    );
    return Math.sqrt(variance) || 1;
  });
  const targetMean = mean(y);
  const targetScale =
    Math.sqrt(mean(y.map((value) => (value - targetMean) ** 2))) || 1;
  const scaledX = X.map((row) =>
    row.map(
      (value, column) => (value - featureMeans[column]) / featureScales[column],
    ),
  );
  const scaledY = y.map((value) => (value - targetMean) / targetScale);
  const scaledEpsilon = options.epsilon / targetScale;
  const degree = options.degree ?? 3;
  if (!Number.isInteger(degree) || degree < 1)
    throw new Error("SVR polynomial degree must be a positive integer.");
  const matrix = scaledX.map((left) =>
    scaledX.map((right) =>
      kernelValue(left, right, options.kernel, options.gamma, degree),
    ),
  );
  const coefficients = Array(X.length).fill(0) as number[];
  let bias = 0;
  const epochs = options.epochs ?? 260;
  const rate =
    options.learningRate ??
    (options.kernel === "polynomial"
      ? 0.00005
      : options.kernel === "linear"
        ? 0.0005
        : 0.035);
  if (!Number.isInteger(epochs) || epochs < 1 || !Number.isFinite(rate) || rate <= 0)
    throw new Error("SVR epochs and learning rate must be positive.");
  const lossHistory: number[] = [];

  for (let epoch = 0; epoch < epochs; epoch++) {
    const predictions = matrix.map((row) =>
      row.reduce(
        (sum, value, index) => sum + value * coefficients[index],
        bias,
      ),
    );
    const slopes = predictions.map((prediction, index) => {
      const error = prediction - scaledY[index];
      return Math.abs(error) <= scaledEpsilon ? 0 : Math.sign(error);
    });
    const previousCoefficients = [...coefficients];
    if (epoch % 5 === 0 || epoch === epochs - 1) {
      const regularization = previousCoefficients.reduce((sum, coefficient, row) =>
        sum + 0.5 * coefficient * matrix[row].reduce(
          (inner, value, column) => inner + value * previousCoefficients[column], 0), 0);
      const epsilonLoss = mean(predictions.map((prediction, index) =>
        Math.max(0, Math.abs(prediction - scaledY[index]) - scaledEpsilon)));
      lossHistory.push(regularization + options.c * epsilonLoss);
    }
    for (let column = 0; column < coefficients.length; column++) {
      const lossGradient = matrix.reduce(
        (sum, row, index) => sum + row[column] * slopes[index],
        0,
      );
      const regularizationGradient = matrix[column].reduce(
        (sum, value, index) => sum + value * previousCoefficients[index], 0);
      coefficients[column] = previousCoefficients[column] - rate *
        (regularizationGradient + (options.c * lossGradient) / X.length);
    }
    bias -=
      (rate * options.c * slopes.reduce((sum, value) => sum + value, 0)) /
      X.length;
  }

  const predictScaled = (row: number[]) => {
    if (row.length !== width || !row.every(Number.isFinite))
      throw new Error(`Expected ${width} finite features.`);
    const scaled = row.map(
      (value, column) => (value - featureMeans[column]) / featureScales[column],
    );
    return scaledX.reduce(
      (sum, supportRow, index) =>
        sum +
        coefficients[index] *
          kernelValue(
            supportRow,
            scaled,
            options.kernel,
            options.gamma,
            degree,
          ),
      bias,
    );
  };
  const predict = (row: number[]) =>
    targetMean + targetScale * predictScaled(row);
  const residuals = X.map((row, index) => y[index] - predict(row));
  const tolerance = Math.max(options.epsilon * 0.08, targetScale * 0.006);
  const supportIndices = residuals
    .map((residual, index) => ({ residual, index }))
    .filter(({ residual }) => Math.abs(residual) >= options.epsilon - tolerance)
    .map(({ index }) => index);
  const boundaryIndices = residuals
    .map((residual, index) => ({ residual, index }))
    .filter(
      ({ residual }) =>
        Math.abs(Math.abs(residual) - options.epsilon) <= tolerance,
    )
    .map(({ index }) => index);

  return {
    kernel: options.kernel,
    c: options.c,
    epsilon: options.epsilon,
    gamma: options.gamma,
    degree,
    coefficients,
    bias,
    supportIndices,
    boundaryIndices,
    lossHistory,
    predict,
  };
}
