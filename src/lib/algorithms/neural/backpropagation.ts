export type BackpropActivation = "relu" | "tanh" | "sigmoid";

export interface BackpropResult {
  input: number[];
  target: number[];
  hiddenPre: number[];
  hidden: number[];
  output: number[];
  weights1: number[][];
  weights2: number[][];
  gradient1: number[][];
  gradient2: number[][];
  updated1: number[][];
  updated2: number[][];
  loss: number;
  hiddenDelta: number[];
  outputDelta: number[];
}

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));
const activate = (value: number, mode: BackpropActivation) =>
  mode === "relu"
    ? Math.max(0, value)
    : mode === "tanh"
      ? Math.tanh(value)
      : sigmoid(value);
const derivative = (pre: number, mode: BackpropActivation) =>
  mode === "relu"
    ? pre > 0
      ? 1
      : 0
    : mode === "tanh"
      ? 1 - Math.tanh(pre) ** 2
      : sigmoid(pre) * (1 - sigmoid(pre));

export function runBackpropagation(
  input: number[],
  target: number[],
  activation: BackpropActivation,
  learningRate: number,
): BackpropResult {
  if (!input.length || !target.length || ![...input, ...target].every(Number.isFinite))
    throw new Error("Backpropagation requires non-empty finite input and target vectors.");
  if (!Number.isFinite(learningRate) || learningRate <= 0)
    throw new Error("Learning rate must be a positive finite number.");
  const weights1 = input.map((_, i) =>
    Array.from(
      { length: 4 },
      (_, j) => Math.sin((i + 1) * 17 + (j + 1) * 29) * 0.65,
    ),
  );
  const weights2 = Array.from({ length: 4 }, (_, i) =>
    target.map((_, j) => Math.sin((i + 1) * 23 + (j + 1) * 31) * 0.55),
  );
  const hiddenPre = Array.from({ length: 4 }, (_, j) =>
    input.reduce((sum, value, i) => sum + value * weights1[i][j], 0),
  );
  const hidden = hiddenPre.map((value) => activate(value, activation));
  const output = target.map((_, j) =>
    hidden.reduce((sum, value, i) => sum + value * weights2[i][j], 0),
  );
  // d(MSE)/d(output_j) = 2(output_j - target_j) / outputCount.
  const outputDelta = output.map(
    (value, j) => (2 * (value - target[j])) / target.length,
  );
  const gradient2 = weights2.map((row, i) =>
    row.map((_, j) => hidden[i] * outputDelta[j]),
  );
  const hiddenDelta = hidden.map(
    (_, i) =>
      weights2[i].reduce((sum, weight, j) => sum + weight * outputDelta[j], 0) *
      derivative(hiddenPre[i], activation),
  );
  const gradient1 = weights1.map((row, i) =>
    row.map((_, j) => input[i] * hiddenDelta[j]),
  );
  const updated1 = weights1.map((row, i) =>
    row.map((weight, j) => weight - learningRate * gradient1[i][j]),
  );
  const updated2 = weights2.map((row, i) =>
    row.map((weight, j) => weight - learningRate * gradient2[i][j]),
  );
  const loss =
    output.reduce((sum, value, j) => sum + (value - target[j]) ** 2, 0) /
    target.length;
  return {
    input,
    target,
    hiddenPre,
    hidden,
    output,
    weights1,
    weights2,
    gradient1,
    gradient2,
    updated1,
    updated2,
    loss,
    hiddenDelta,
    outputDelta,
  };
}
