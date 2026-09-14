export type ActivationFn = "step" | "sigmoid" | "tanh";

export interface PerceptronStep {
  epoch: number;
  weights: number[];
  bias: number;
  errors: number;
  predictions: number[];
}

export interface PerceptronTrainOptions {
  initialWeights?: number[];
  initialBias?: number;
  threshold?: number;
}

function activate(x: number, fn: ActivationFn): number {
  if (fn === "step") return x >= 0 ? 1 : 0;
  if (fn === "sigmoid") return 1 / (1 + Math.exp(-x));
  return Math.tanh(x);
}

export function trainPerceptron(
  X: number[][],
  y: number[],
  lr = 0.1,
  maxEpochs = 50,
  activation: ActivationFn = "step",
  options: PerceptronTrainOptions = {},
): { weights: number[]; bias: number; steps: PerceptronStep[] } {
  if (!X.length || !X[0]?.length || X.length !== y.length) {
    throw new Error(
      "Perceptron training requires aligned feature and label rows.",
    );
  }
  const p = X[0].length;
  let weights = Array.from(
    { length: p },
    (_, index) => options.initialWeights?.[index] ?? 0,
  );
  let bias = options.initialBias ?? 0;
  const threshold = options.threshold ?? 0;
  const steps: PerceptronStep[] = [];

  for (let epoch = 0; epoch < maxEpochs; epoch++) {
    let errors = 0;
    const predictions: number[] = [];
    for (let i = 0; i < X.length; i++) {
      const net = X[i].reduce((s, x, j) => s + x * weights[j], bias);
      const shiftedNet = net - threshold;
      const pred =
        activation === "step"
          ? shiftedNet >= 0
            ? 1
            : 0
          : activate(shiftedNet, activation) >=
              (activation === "sigmoid" ? 0.5 : 0)
            ? 1
            : 0;
      predictions.push(pred);
      const err = y[i] - pred;
      if (err !== 0) {
        errors++;
        weights = weights.map((w, j) => w + lr * err * X[i][j]);
        bias += lr * err;
      }
    }
    steps.push({
      epoch,
      weights: [...weights],
      bias,
      errors,
      predictions: [...predictions],
    });
    if (errors === 0) break;
  }
  return { weights, bias, steps };
}

export function predictPerceptron(
  x: number[],
  weights: number[],
  bias: number,
  threshold = 0,
): number {
  const net = x.reduce((s, xi, j) => s + xi * weights[j], bias);
  return net >= threshold ? 1 : 0;
}
