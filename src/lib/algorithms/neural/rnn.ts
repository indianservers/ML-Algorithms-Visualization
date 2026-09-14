export type RNNActivation = "tanh" | "relu" | "sigmoid";
export type RNNWeightInit = "orthogonal" | "xavier" | "small";

export interface RNNResult {
  states: number[][];
  predictions: Array<{ token: string; probability: number }>;
  gradientNorms: number[];
  recurrentWeights: number[][];
  inputWeights: number[][];
}

const hash = (text: string) =>
  [...text].reduce(
    (value, character, index) => value + character.charCodeAt(0) * (index + 3),
    17,
  );

function vectorForToken(token: string, size: number) {
  const seed = hash(token);
  return Array.from({ length: size }, (_, index) =>
    Math.sin(seed * 0.071 + index * 1.731),
  );
}

function orthogonalMatrix(size: number) {
  const rows: number[][] = [];
  for (let row = 0; row < size; row++) {
    const vector = Array.from({ length: size }, (_, column) =>
      Math.sin((row + 1) * (column + 2) * 1.37 + row * 0.41),
    );
    for (const basis of rows) {
      const projection = vector.reduce(
        (sum, value, index) => sum + value * basis[index],
        0,
      );
      for (let index = 0; index < size; index++)
        vector[index] -= projection * basis[index];
    }
    const norm = Math.hypot(...vector) || 1;
    rows.push(vector.map((value) => value / norm));
  }
  return rows;
}

function initializedMatrix(size: number, init: RNNWeightInit, salt: number) {
  if (init === "orthogonal")
    return orthogonalMatrix(size).map((row) =>
      row.map((value) => value * 0.78),
    );
  const scale = init === "xavier" ? Math.sqrt(1 / size) : 0.12;
  return Array.from({ length: size }, (_, row) =>
    Array.from(
      { length: size },
      (_, column) =>
        Math.sin((row + 1) * 17 + (column + 1) * 31 + salt) * scale,
    ),
  );
}

const activate = (value: number, activation: RNNActivation) =>
  activation === "relu"
    ? Math.max(0, value)
    : activation === "sigmoid"
      ? 1 / (1 + Math.exp(-value))
      : Math.tanh(value);

const derivative = (state: number, activation: RNNActivation) =>
  activation === "relu"
    ? state > 0
      ? 1
      : 0
    : activation === "sigmoid"
      ? state * (1 - state)
      : 1 - state * state;

export function runRNN(
  tokens: string[],
  hiddenSize: number,
  activation: RNNActivation,
  init: RNNWeightInit,
  bias: number,
  noise: number,
): RNNResult {
  const recurrentWeights = initializedMatrix(hiddenSize, init, 5),
    inputWeights = initializedMatrix(
      hiddenSize,
      init === "orthogonal" ? "xavier" : init,
      19,
    ),
    states: number[][] = [Array(hiddenSize).fill(0)],
    predictions: Array<{ token: string; probability: number }> = [],
    vocabulary = [...new Set(tokens)];
  for (let time = 0; time < tokens.length; time++) {
    const input = vectorForToken(tokens[time], hiddenSize),
      previous = states[states.length - 1],
      state = Array.from({ length: hiddenSize }, (_, unit) => {
        const inputSignal = inputWeights[unit].reduce(
            (sum, weight, index) => sum + weight * input[index],
            0,
          ),
          recurrentSignal = recurrentWeights[unit].reduce(
            (sum, weight, index) => sum + weight * previous[index],
            0,
          ),
          perturbation = noise * Math.sin((time + 1) * 13 + unit * 7);
        return activate(
          inputSignal + recurrentSignal + bias + perturbation,
          activation,
        );
      });
    states.push(state);
    const scores = vocabulary.map((token) => {
        const embedding = vectorForToken(token, hiddenSize);
        return state.reduce(
          (sum, value, index) => sum + value * embedding[index],
          0,
        );
      }),
      maximum = Math.max(...scores),
      exponentials = scores.map((score) => Math.exp(score - maximum)),
      total = exponentials.reduce((sum, value) => sum + value, 0),
      ranked = vocabulary
        .map((token, index) => ({
          token,
          probability: exponentials[index] / total,
        }))
        .sort((a, b) => b.probability - a.probability);
    predictions.push(ranked[0]);
  }

  let gradient = Array(hiddenSize).fill(1 / Math.sqrt(hiddenSize));
  const gradientNorms = [Math.hypot(...gradient)];
  for (let time = states.length - 1; time > 1; time--) {
    const local = states[time].map((value) => derivative(value, activation));
    gradient = Array.from({ length: hiddenSize }, (_, previousUnit) =>
      recurrentWeights.reduce(
        (sum, row, currentUnit) =>
          sum + gradient[currentUnit] * local[currentUnit] * row[previousUnit],
        0,
      ),
    );
    gradientNorms.push(Math.hypot(...gradient));
  }
  return { states, predictions, gradientNorms, recurrentWeights, inputWeights };
}
