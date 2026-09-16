export type MLPActivation = "relu" | "tanh" | "sigmoid";
export type MLPOptimizer = "adam" | "sgd";

export interface MLPOptions {
  hidden: number[];
  activation: MLPActivation;
  learningRate: number;
  epochs: number;
  batchSize: number;
  l2: number;
  optimizer: MLPOptimizer;
  useBias: boolean;
  seed?: number;
  validationSplit?: number;
}

export interface MLPResult {
  weights: number[][][];
  biases: number[][];
  trainLoss: number[];
  validationLoss: number[];
  probabilities: number[];
  parameterCount: number;
}

const sigmoid = (value: number) =>
  1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));
const activate = (value: number, activation: MLPActivation) =>
  activation === "relu"
    ? Math.max(0, value)
    : activation === "tanh"
      ? Math.tanh(value)
      : sigmoid(value);
const derivative = (value: number, activation: MLPActivation) => {
  if (activation === "relu") return value > 0 ? 1 : 0;
  const output = activate(value, activation);
  return activation === "tanh" ? 1 - output * output : output * (1 - output);
};
const makeRandom = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

export function forwardMLP(
  input: number[],
  weights: number[][][],
  biases: number[][],
  activation: MLPActivation,
): {
  probability: number;
  activations: number[][];
  preActivations: number[][];
} {
  const activations = [[...input]],
    preActivations: number[][] = [];
  for (let layer = 0; layer < weights.length; layer++) {
    const previous = activations[layer];
    const z = biases[layer].map((bias, output) =>
      weights[layer].reduce(
        (sum, row, inputIndex) => sum + row[output] * previous[inputIndex],
        bias,
      ),
    );
    preActivations.push(z);
    activations.push(
      layer === weights.length - 1
        ? z.map(sigmoid)
        : z.map((value) => activate(value, activation)),
    );
  }
  return {
    probability: activations.at(-1)?.[0] ?? 0,
    activations,
    preActivations,
  };
}

const lossFor = (
  indices: number[],
  X: number[][],
  y: number[],
  weights: number[][][],
  biases: number[][],
  activation: MLPActivation,
  l2: number,
) => {
  const dataLoss =
    indices.reduce((sum, index) => {
      const probability = Math.max(
        1e-7,
        Math.min(
          1 - 1e-7,
          forwardMLP(X[index], weights, biases, activation).probability,
        ),
      );
      return (
        sum -
        y[index] * Math.log(probability) -
        (1 - y[index]) * Math.log(1 - probability)
      );
    }, 0) / Math.max(1, indices.length);
  return (
    dataLoss +
    (l2 * weights.flat(2).reduce((sum, value) => sum + value * value, 0)) / 2
  );
};

export function trainMLP(
  X: number[][],
  y: number[],
  options: MLPOptions,
): MLPResult {
  if (
    X.length < 4 ||
    X.length !== y.length ||
    X.some((row) => row.length !== X[0].length)
  )
    throw new Error("MLP training requires aligned rectangular data.");
  const random = makeRandom(options.seed ?? 17),
    sizes = [X[0].length, ...options.hidden, 1];
  const weights = sizes
    .slice(0, -1)
    .map((inputSize, layer) =>
      Array.from({ length: inputSize }, () =>
        Array.from(
          { length: sizes[layer + 1] },
          () =>
            (random() * 2 - 1) * Math.sqrt(6 / (inputSize + sizes[layer + 1])),
        ),
      ),
    );
  const biases = sizes.slice(1).map((size) => Array(size).fill(0));
  const momentW = weights.map((matrix) =>
      matrix.map((row) => row.map(() => 0)),
    ),
    velocityW = weights.map((matrix) => matrix.map((row) => row.map(() => 0))),
    momentB = biases.map((row) => row.map(() => 0)),
    velocityB = biases.map((row) => row.map(() => 0));
  const split = Math.min(0.45, Math.max(0.05, options.validationSplit ?? 0.2));
  const validationEvery = Math.max(2, Math.round(1 / split)),
    validation = X.map((_, index) => index).filter(
      (index) => index % validationEvery === 0,
    ),
    train = X.map((_, index) => index).filter(
      (index) => index % validationEvery !== 0,
    );
  if (!train.length) {
    throw new Error(
      "MLP needs at least one training sample after the validation hold-out.",
    );
  }
  const trainLoss: number[] = [],
    validationLoss: number[] = [];
  let update = 0;
  for (let epoch = 0; epoch < options.epochs; epoch++) {
    for (let start = 0; start < train.length; start += options.batchSize) {
      const batch = train.slice(start, start + options.batchSize),
        gradW = weights.map((matrix) => matrix.map((row) => row.map(() => 0))),
        gradB = biases.map((row) => row.map(() => 0));
      for (const index of batch) {
        const pass = forwardMLP(X[index], weights, biases, options.activation),
          deltas: number[][] = Array(weights.length),
          last = weights.length - 1;
        deltas[last] = [pass.probability - y[index]];
        for (let layer = last; layer >= 0; layer--) {
          const previous = pass.activations[layer];
          for (let input = 0; input < weights[layer].length; input++)
            for (
              let output = 0;
              output < weights[layer][input].length;
              output++
            )
              gradW[layer][input][output] +=
                previous[input] * deltas[layer][output];
          for (let output = 0; output < deltas[layer].length; output++)
            gradB[layer][output] += deltas[layer][output];
          if (layer > 0)
            deltas[layer - 1] = weights[layer].map(
              (row, neuron) =>
                row.reduce(
                  (sum, weight, output) => sum + weight * deltas[layer][output],
                  0,
                ) *
                derivative(
                  pass.preActivations[layer - 1][neuron],
                  options.activation,
                ),
            );
        }
      }
      update++;
      const scale = 1 / batch.length;
      for (let layer = 0; layer < weights.length; layer++) {
        for (let input = 0; input < weights[layer].length; input++)
          for (
            let output = 0;
            output < weights[layer][input].length;
            output++
          ) {
            const gradient =
              gradW[layer][input][output] * scale +
              options.l2 * weights[layer][input][output];
            if (options.optimizer === "adam") {
              momentW[layer][input][output] =
                0.9 * momentW[layer][input][output] + 0.1 * gradient;
              velocityW[layer][input][output] =
                0.999 * velocityW[layer][input][output] +
                0.001 * gradient * gradient;
              const correctedM =
                  momentW[layer][input][output] / (1 - 0.9 ** update),
                correctedV =
                  velocityW[layer][input][output] / (1 - 0.999 ** update);
              weights[layer][input][output] -=
                (options.learningRate * correctedM) /
                (Math.sqrt(correctedV) + 1e-8);
            } else
              weights[layer][input][output] -= options.learningRate * gradient;
          }
        if (options.useBias)
          for (let output = 0; output < biases[layer].length; output++) {
            const gradient = gradB[layer][output] * scale;
            if (options.optimizer === "adam") {
              momentB[layer][output] =
                0.9 * momentB[layer][output] + 0.1 * gradient;
              velocityB[layer][output] =
                0.999 * velocityB[layer][output] + 0.001 * gradient * gradient;
              biases[layer][output] -=
                (options.learningRate *
                  (momentB[layer][output] / (1 - 0.9 ** update))) /
                (Math.sqrt(velocityB[layer][output] / (1 - 0.999 ** update)) +
                  1e-8);
            } else biases[layer][output] -= options.learningRate * gradient;
          }
      }
    }
    trainLoss.push(
      lossFor(train, X, y, weights, biases, options.activation, options.l2),
    );
    validationLoss.push(
      lossFor(
        validation,
        X,
        y,
        weights,
        biases,
        options.activation,
        options.l2,
      ),
    );
  }
  return {
    weights,
    biases,
    trainLoss,
    validationLoss,
    probabilities: X.map(
      (row) => forwardMLP(row, weights, biases, options.activation).probability,
    ),
    parameterCount:
      weights.flat(2).length + (options.useBias ? biases.flat().length : 0),
  };
}
