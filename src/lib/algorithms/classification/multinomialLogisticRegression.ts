export interface MultinomialLogisticRegressionResult {
  weights: number[][];
  biases: number[];
  lossHistory: number[];
  predictProba: (row: number[]) => number[];
  predict: (row: number[]) => number;
}

function probabilities(logits: number[]) {
  const maximum = Math.max(...logits);
  const exponents = logits.map((value) => Math.exp(value - maximum));
  const total = exponents.reduce((sum, value) => sum + value, 0);
  return exponents.map((value) => value / total);
}

export function multinomialLogisticRegression(
  X: number[][],
  y: number[],
  classCount: number,
  learningRate = 0.08,
  iterations = 500,
  l2 = 0,
): MultinomialLogisticRegressionResult {
  if (!X.length || X.length !== y.length || classCount < 2) {
    throw new Error(
      "Multinomial logistic regression requires aligned multiclass data.",
    );
  }
  const featureCount = X[0].length;
  if (!Number.isInteger(classCount) ||
      !featureCount ||
      !X.every((row) => row.length === featureCount && row.every(Number.isFinite)) ||
      !y.every((label) => Number.isInteger(label) && label >= 0 && label < classCount))
    throw new Error("Multinomial logistic regression requires finite rectangular data and valid class indices.");
  if (!Number.isFinite(learningRate) || learningRate <= 0 ||
      !Number.isInteger(iterations) || iterations < 1 ||
      !Number.isFinite(l2) || l2 < 0)
    throw new Error("Invalid multinomial logistic regression hyperparameters.");
  let weights = Array.from(
    { length: classCount },
    () => Array(featureCount).fill(0) as number[],
  );
  let biases = Array(classCount).fill(0) as number[];
  const lossHistory: number[] = [];

  for (let iteration = 0; iteration < iterations; iteration++) {
    const gradientWeights = Array.from(
      { length: classCount },
      () => Array(featureCount).fill(0) as number[],
    );
    const gradientBiases = Array(classCount).fill(0) as number[];
    let loss = 0;
    for (let rowIndex = 0; rowIndex < X.length; rowIndex++) {
      const scores = weights.map((classWeights, classIndex) =>
        classWeights.reduce(
          (sum, weight, feature) => sum + weight * X[rowIndex][feature],
          biases[classIndex],
        ),
      );
      const classProbabilities = probabilities(scores);
      loss -= Math.log(Math.max(1e-15, classProbabilities[y[rowIndex]]));
      for (let classIndex = 0; classIndex < classCount; classIndex++) {
        const error =
          classProbabilities[classIndex] - (y[rowIndex] === classIndex ? 1 : 0);
        gradientBiases[classIndex] += error;
        for (let feature = 0; feature < featureCount; feature++)
          gradientWeights[classIndex][feature] += error * X[rowIndex][feature];
      }
    }
    const penalty = weights
      .flat()
      .reduce((sum, weight) => sum + weight * weight, 0);
    lossHistory.push(loss / X.length + 0.5 * l2 * penalty);
    weights = weights.map((classWeights, classIndex) =>
      classWeights.map(
        (weight, feature) =>
          weight -
          learningRate *
            (gradientWeights[classIndex][feature] / X.length + l2 * weight),
      ),
    );
    biases = biases.map(
      (bias, classIndex) =>
        bias - (learningRate * gradientBiases[classIndex]) / X.length,
    );
  }

  const predictProba = (row: number[]) => {
    if (row.length !== featureCount || !row.every(Number.isFinite))
      throw new Error(`Expected ${featureCount} finite features.`);
    return probabilities(
      weights.map((classWeights, classIndex) =>
        classWeights.reduce(
          (sum, weight, feature) => sum + weight * row[feature],
          biases[classIndex],
        ),
      ),
    );
  };
  const predict = (row: number[]) => {
    const values = predictProba(row);
    return values.indexOf(Math.max(...values));
  };
  return { weights, biases, lossHistory, predictProba, predict };
}
