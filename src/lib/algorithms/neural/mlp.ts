export type MLPActivation = "relu" | "tanh" | "sigmoid" | "linear";
export type MLPOptimizer = "adam" | "sgd";

export interface MLPOptions {
  hidden: number[];
  activation: MLPActivation;
  learningRate: number;
  epochs: number;
  batchSize: number;
  l2: number;
  l1?: number;
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
      : activation === "linear"
        ? value
        : sigmoid(value);
const derivative = (value: number, activation: MLPActivation) => {
  if (activation === "relu") return value > 0 ? 1 : 0;
  if (activation === "linear") return 1;
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

export interface MLPState {
  weights: number[][][];
  biases: number[][];
  momentW: number[][][];
  velocityW: number[][][];
  momentB: number[][];
  velocityB: number[][];
  train: number[];
  validation: number[];
  trainLoss: number[];
  validationLoss: number[];
  epoch: number;
  update: number;
  X: number[][];
  y: number[];
}

export function createMLPState(
  X: number[][],
  y: number[],
  options: MLPOptions,
): MLPState {
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
  return {
    weights,
    biases,
    momentW: weights.map((matrix) => matrix.map((row) => row.map(() => 0))),
    velocityW: weights.map((matrix) => matrix.map((row) => row.map(() => 0))),
    momentB: biases.map((row) => row.map(() => 0)),
    velocityB: biases.map((row) => row.map(() => 0)),
    train,
    validation,
    trainLoss: [],
    validationLoss: [],
    epoch: 0,
    update: 0,
    X,
    y,
  };
}

export function stepMLP(state: MLPState, options: MLPOptions): MLPState {
  const { weights, biases, train, X, y } = state;
  const l1 = options.l1 ?? 0;
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
      state.update += 1;
      const scale = 1 / batch.length;
      for (let layer = 0; layer < weights.length; layer++) {
        for (let input = 0; input < weights[layer].length; input++)
          for (
            let output = 0;
            output < weights[layer][input].length;
            output++
          ) {
            const weight = weights[layer][input][output];
            const gradient =
              gradW[layer][input][output] * scale +
              options.l2 * weight +
              l1 * Math.sign(weight);
            if (options.optimizer === "adam") {
              state.momentW[layer][input][output] =
                0.9 * state.momentW[layer][input][output] + 0.1 * gradient;
              state.velocityW[layer][input][output] =
                0.999 * state.velocityW[layer][input][output] +
                0.001 * gradient * gradient;
              const correctedM =
                  state.momentW[layer][input][output] /
                  (1 - 0.9 ** state.update),
                correctedV =
                  state.velocityW[layer][input][output] /
                  (1 - 0.999 ** state.update);
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
              state.momentB[layer][output] =
                0.9 * state.momentB[layer][output] + 0.1 * gradient;
              state.velocityB[layer][output] =
                0.999 * state.velocityB[layer][output] +
                0.001 * gradient * gradient;
              biases[layer][output] -=
                (options.learningRate *
                  (state.momentB[layer][output] / (1 - 0.9 ** state.update))) /
                (Math.sqrt(
                  state.velocityB[layer][output] / (1 - 0.999 ** state.update),
                ) +
                  1e-8);
            } else biases[layer][output] -= options.learningRate * gradient;
          }
      }
    }
  state.epoch += 1;
  state.trainLoss = [
    ...state.trainLoss,
    lossFor(train, X, y, weights, biases, options.activation, options.l2),
  ];
  state.validationLoss = [
    ...state.validationLoss,
    lossFor(
      state.validation,
      X,
      y,
      weights,
      biases,
      options.activation,
      options.l2,
    ),
  ];
  return {
    ...state,
    epoch: state.epoch,
    trainLoss: state.trainLoss,
    validationLoss: state.validationLoss,
  };
}

export function snapshotMLP(
  state: MLPState,
  options: Pick<MLPOptions, "activation" | "useBias">,
): MLPResult {
  return {
    weights: state.weights,
    biases: state.biases,
    trainLoss: state.trainLoss,
    validationLoss: state.validationLoss,
    probabilities: state.X.map(
      (row) =>
        forwardMLP(row, state.weights, state.biases, options.activation)
          .probability,
    ),
    parameterCount:
      state.weights.flat(2).length +
      (options.useBias ? state.biases.flat().length : 0),
  };
}

export function diagnoseMLP(
  state: MLPState,
  activation: MLPActivation,
): {
  maxAbsWeight: number;
  meanAbsWeight: number;
  saturated: number;
  deadRelu: number;
  exploding: boolean;
  vanishing: boolean;
} {
  const values = state.weights.flat(2);
  const maxAbsWeight = values.reduce(
    (max, value) => Math.max(max, Math.abs(value)),
    0,
  );
  const meanAbsWeight =
    values.reduce((sum, value) => sum + Math.abs(value), 0) /
    Math.max(1, values.length);
  let saturated = 0;
  let deadRelu = 0;
  let counted = 0;
  for (const index of state.train.slice(0, 64)) {
    const pass = forwardMLP(
      state.X[index],
      state.weights,
      state.biases,
      activation,
    );
    pass.activations.slice(1, -1).forEach((layer) => {
      layer.forEach((value) => {
        counted += 1;
        if (activation === "relu" && value <= 0) deadRelu += 1;
        if (activation !== "relu" && Math.abs(value) > 0.95) saturated += 1;
      });
    });
  }
  return {
    maxAbsWeight,
    meanAbsWeight,
    saturated: counted ? saturated / counted : 0,
    deadRelu: counted ? deadRelu / counted : 0,
    exploding: maxAbsWeight > 8,
    vanishing: meanAbsWeight < 0.02 && state.epoch > 8,
  };
}

export function cloneWeights(weights: number[][][]): number[][][] {
  return weights.map((matrix) => matrix.map((row) => row.slice()));
}

export function cloneBiases(biases: number[][]): number[][] {
  return biases.map((row) => row.slice());
}

export function restoreMLPWeights(
  state: MLPState,
  weights: number[][][],
  biases: number[][],
  epoch: number,
): MLPState {
  return {
    ...state,
    weights: cloneWeights(weights),
    biases: cloneBiases(biases),
    epoch,
    trainLoss: state.trainLoss.slice(0, epoch),
    validationLoss: state.validationLoss.slice(0, epoch),
  };
}

export function reinitNeuron(
  state: MLPState,
  hiddenLayer: number,
  neuron: number,
  seed = 91,
): MLPState {
  const weights = cloneWeights(state.weights);
  const biases = cloneBiases(state.biases);
  const incoming = weights[hiddenLayer];
  const outgoing = weights[hiddenLayer + 1];
  if (!incoming || neuron < 0 || neuron >= (biases[hiddenLayer]?.length ?? 0)) {
    return state;
  }
  const random = makeRandom(seed + hiddenLayer * 17 + neuron);
  const scale = Math.sqrt(
    6 / (incoming.length + (outgoing?.[0]?.length ?? 1) + incoming[0].length),
  );
  for (const row of incoming) {
    if (row[neuron] !== undefined) row[neuron] = (random() * 2 - 1) * scale;
  }
  if (outgoing?.[neuron]) {
    for (let output = 0; output < outgoing[neuron].length; output += 1) {
      outgoing[neuron][output] = (random() * 2 - 1) * scale;
    }
  }
  if (biases[hiddenLayer]) biases[hiddenLayer][neuron] = 0;
  return { ...state, weights, biases };
}

export function deadReluNeurons(
  state: MLPState,
  activation: MLPActivation,
): Array<{ layer: number; index: number; fraction: number }> {
  if (activation !== "relu") return [];
  const hiddenLayers = Math.max(0, state.weights.length - 1);
  const hits = Array.from({ length: hiddenLayers }, (_, layer) =>
    Array.from({ length: state.weights[layer]?.[0]?.length ?? 0 }, () => 0),
  );
  const seen = state.train.slice(0, 80);
  for (const index of seen) {
    const row = state.X[index];
    if (!row) continue;
    const pass = forwardMLP(row, state.weights, state.biases, activation);
    for (let layer = 0; layer < hiddenLayers; layer += 1) {
      const values = pass.activations[layer + 1] ?? [];
      values.forEach((value, neuron) => {
        if (value <= 0 && hits[layer]) hits[layer][neuron] += 1;
      });
    }
  }
  const out: Array<{ layer: number; index: number; fraction: number }> = [];
  hits.forEach((layerHits, layer) => {
    layerHits.forEach((count, index) => {
      const fraction = seen.length ? count / seen.length : 0;
      if (fraction >= 0.85) out.push({ layer, index, fraction });
    });
  });
  return out;
}

export function featureImportanceMLP(state: MLPState): number[] {
  const weights = state.weights;
  if (!weights.length) return [];
  let score = Array(weights.at(-1)?.[0]?.length ?? 1).fill(1);
  for (let layer = weights.length - 1; layer >= 0; layer -= 1) {
    const incoming = weights[layer];
    const next = Array(incoming.length).fill(0);
    for (let input = 0; input < incoming.length; input += 1) {
      next[input] = incoming[input].reduce(
        (sum, weight, output) => sum + Math.abs(weight) * (score[output] ?? 0),
        0,
      );
    }
    score = next;
  }
  const total = score.reduce((sum, value) => sum + value, 0) || 1;
  return score.map((value) => value / total);
}

export function shouldEarlyStop(
  validationLoss: number[],
  patience = 8,
): boolean {
  if (validationLoss.length < patience + 6) return false;
  const window = validationLoss.slice(-patience);
  const first = window[0] ?? 0;
  const last = window.at(-1) ?? 0;
  const min = Math.min(...window);
  return last > first + 0.018 && last > min + 0.01;
}

export function findLearningRates(
  X: number[][],
  y: number[],
  options: MLPOptions,
  rates: number[] = [0.0001, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1],
  epochs = 20,
): Array<{ rate: number; loss: number }> {
  return rates.map((rate) => {
    let state = createMLPState(X, y, { ...options, learningRate: rate, seed: options.seed ?? 17 });
    for (let epoch = 0; epoch < epochs; epoch += 1)
      state = stepMLP(state, { ...options, learningRate: rate });
    return { rate, loss: state.trainLoss.at(-1) ?? 1 };
  });
}

export function trainMLP(
  X: number[][],
  y: number[],
  options: MLPOptions,
): MLPResult {
  let state = createMLPState(X, y, options);
  for (let epoch = 0; epoch < options.epochs; epoch += 1)
    state = stepMLP(state, options);
  return snapshotMLP(state, options);
}
