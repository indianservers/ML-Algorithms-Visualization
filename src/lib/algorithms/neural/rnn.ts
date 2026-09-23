export type RNNActivation = "tanh" | "relu" | "sigmoid";
export type RNNWeightInit = "orthogonal" | "xavier" | "small";
export type RNNTask = "text" | "series";

export interface RNNWeights {
  Wxh: number[][];
  Whh: number[][];
  Why: number[][];
  bh: number[];
  by: number[];
}

export interface RNNPrediction {
  token: string;
  probability: number;
  value: number;
}

export interface RNNResult {
  states: number[][];
  inputs: number[][];
  outputs: number[][];
  predictions: RNNPrediction[];
  gradientNorms: number[];
  decay: number[];
  loss: number;
  accuracy: number;
  mae: number;
  recurrentWeights: number[][];
  inputWeights: number[][];
}

export interface RNNTrainEpoch {
  epoch: number;
  loss: number;
  accuracy: number;
  mae: number;
  gradNorm: number;
}

function zeros(rows: number, cols: number) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function vector(size: number, value = 0) {
  return Array(size).fill(value);
}

function add(a: number[], b: number[]) {
  return a.map((value, index) => value + (b[index] ?? 0));
}

function scale(a: number[], factor: number) {
  return a.map((value) => value * factor);
}

function mul(mat: number[][], vec: number[]) {
  return mat.map((row) => row.reduce((sum, weight, index) => sum + weight * (vec[index] ?? 0), 0));
}

function transposeMul(mat: number[][], vec: number[]) {
  const cols = mat[0]?.length ?? 0;
  const out = vector(cols);
  for (let row = 0; row < mat.length; row += 1) {
    const scaleVal = vec[row] ?? 0;
    const line = mat[row];
    if (!line) continue;
    for (let col = 0; col < cols; col += 1) out[col] += (line[col] ?? 0) * scaleVal;
  }
  return out;
}

function outerAdd(acc: number[][], left: number[], right: number[]) {
  for (let i = 0; i < left.length; i += 1) {
    const row = acc[i];
    if (!row) continue;
    const scaleVal = left[i] ?? 0;
    for (let j = 0; j < right.length; j += 1) row[j] += scaleVal * (right[j] ?? 0);
  }
}

function orthogonalMatrix(size: number) {
  const rows: number[][] = [];
  for (let row = 0; row < size; row += 1) {
    const vectorRow = Array.from({ length: size }, (_, column) =>
      Math.sin((row + 1) * (column + 2) * 1.37 + row * 0.41),
    );
    for (const basis of rows) {
      const projection = vectorRow.reduce((sum, value, index) => sum + value * basis[index], 0);
      for (let index = 0; index < size; index += 1) vectorRow[index] -= projection * basis[index];
    }
    const norm = Math.hypot(...vectorRow) || 1;
    rows.push(vectorRow.map((value) => value / norm));
  }
  return rows;
}

function initMatrix(rows: number, cols: number, init: RNNWeightInit, salt: number) {
  if (init === "orthogonal" && rows === cols) {
    return orthogonalMatrix(rows).map((row) => row.map((value) => value * 0.78));
  }
  const scaleVal = init === "xavier" ? Math.sqrt(1 / Math.max(1, cols)) : init === "small" ? 0.12 : Math.sqrt(2 / Math.max(1, cols));
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, column) => Math.sin((row + 1) * 17 + (column + 1) * 31 + salt) * scaleVal),
  );
}

export const activate = (value: number, activation: RNNActivation) =>
  activation === "relu"
    ? Math.max(0, value)
    : activation === "sigmoid"
      ? 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, value))))
      : Math.tanh(value);

export const derivativeFromActivated = (state: number, activation: RNNActivation) =>
  activation === "relu"
    ? (state > 0 ? 1 : 0)
    : activation === "sigmoid"
      ? state * (1 - state)
      : 1 - state * state;

export function createRnnWeights(
  hiddenSize: number,
  inputSize: number,
  outputSize: number,
  init: RNNWeightInit = "orthogonal",
  bias = 0,
): RNNWeights {
  return {
    Wxh: initMatrix(hiddenSize, inputSize, init === "orthogonal" ? "xavier" : init, 19),
    Whh: initMatrix(hiddenSize, hiddenSize, init, 5),
    Why: initMatrix(outputSize, hiddenSize, "xavier", 41),
    bh: vector(hiddenSize, bias),
    by: vector(outputSize, 0),
  };
}

export function encodeTextInputs(tokens: string[], vocab: string[]) {
  const indexOf = new Map(vocab.map((token, index) => [token, index]));
  return tokens.map((token) => {
    const x = vector(vocab.length);
    const index = indexOf.get(token) ?? 0;
    x[index] = 1;
    return x;
  });
}

export function encodeSeriesInputs(values: number[], extras: number[] = []) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const extraMin = extras.length ? Math.min(...extras) : 0;
  const extraMax = extras.length ? Math.max(...extras) : 1;
  const extraSpan = extraMax - extraMin || 1;
  return values.map((value, index) => {
    const x = [(value - min) / span * 2 - 1];
    if (extras.length) x.push(((extras[index] ?? extraMin) - extraMin) / extraSpan * 2 - 1);
    return x;
  });
}

function softmax(logits: number[]) {
  const peak = Math.max(...logits);
  const exps = logits.map((value) => Math.exp(value - peak));
  const total = exps.reduce((sum, value) => sum + value, 0) || 1;
  return exps.map((value) => value / total);
}

function clipMatrices(mats: number[][][], vectors: number[][], maxNorm = 5) {
  let sum = 0;
  for (const mat of mats) {
    for (const row of mat) for (const value of row) sum += value * value;
  }
  for (const vec of vectors) for (const value of vec) sum += value * value;
  const norm = Math.sqrt(sum);
  if (norm <= maxNorm || norm === 0) return;
  const factor = maxNorm / norm;
  for (const mat of mats) {
    for (const row of mat) {
      for (let i = 0; i < row.length; i += 1) row[i] *= factor;
    }
  }
  for (const vec of vectors) {
    for (let i = 0; i < vec.length; i += 1) vec[i] *= factor;
  }
}

export function forwardRnn(
  inputs: number[][],
  weights: RNNWeights,
  activation: RNNActivation,
  noise = 0,
  task: RNNTask = "series",
  vocab: string[] = [],
  targets?: number[],
): RNNResult {
  const hiddenSize = weights.bh.length;
  const states: number[][] = [vector(hiddenSize)];
  const outputs: number[][] = [];
  const predictions: RNNPrediction[] = [];
  let loss = 0;
  let hits = 0;
  let absErr = 0;

  for (let time = 0; time < inputs.length; time += 1) {
    const x = inputs[time] ?? vector(weights.Wxh[0]?.length ?? 1);
    const previous = states[states.length - 1] ?? vector(hiddenSize);
    const pre = add(add(mul(weights.Wxh, x), mul(weights.Whh, previous)), weights.bh).map(
      (value, unit) => value + noise * Math.sin((time + 1) * 13 + unit * 7),
    );
    const hidden = pre.map((value) => activate(value, activation));
    states.push(hidden);
    const logits = add(mul(weights.Why, hidden), weights.by);
    outputs.push(logits);

    if (task === "text" && vocab.length) {
      const probs = softmax(logits);
      const ranked = vocab
        .map((token, index) => ({ token, probability: probs[index] ?? 0, value: probs[index] ?? 0 }))
        .sort((a, b) => b.probability - a.probability);
      predictions.push(ranked[0] ?? { token: vocab[0] ?? "?", probability: 0, value: 0 });
      const targetIndex = targets?.[time];
      if (targetIndex != null && targetIndex >= 0) {
        const p = Math.max(1e-8, probs[targetIndex] ?? 1e-8);
        loss += -Math.log(p);
        if ((ranked[0]?.token ?? "") === vocab[targetIndex]) hits += 1;
      }
    } else {
      const value = logits[0] ?? 0;
      predictions.push({ token: value.toFixed(2), probability: 1, value });
      const target = targets?.[time];
      if (target != null) {
        const err = value - target;
        loss += 0.5 * err * err;
        absErr += Math.abs(err);
      }
    }
  }

  const denom = Math.max(1, inputs.length);
  const last = states[states.length - 1] ?? vector(hiddenSize);
  const hiddenStates = states.slice(1);
  const decay = hiddenStates.map((state, index) => {
    const lag = hiddenStates.length - 1 - index;
    const dot = state.reduce((sum, value, unit) => sum + value * (last[unit] ?? 0), 0);
    const denomDot = Math.hypot(...state) * Math.hypot(...last) || 1;
    return Math.min(1, Math.abs(dot / denomDot) * Math.pow(0.86, Math.max(0, lag)));
  });

  let gradient = vector(hiddenSize, 1 / Math.sqrt(hiddenSize));
  const gradientNorms = [Math.hypot(...gradient)];
  for (let time = states.length - 1; time > 1; time -= 1) {
    const local = (states[time] ?? []).map((value) => derivativeFromActivated(value, activation));
    gradient = Array.from({ length: hiddenSize }, (_, previousUnit) =>
      weights.Whh.reduce(
        (sum, row, currentUnit) =>
          sum + (gradient[currentUnit] ?? 0) * (local[currentUnit] ?? 0) * (row[previousUnit] ?? 0),
        0,
      ),
    );
    gradientNorms.push(Math.hypot(...gradient));
  }

  return {
    states,
    inputs,
    outputs,
    predictions,
    gradientNorms,
    decay,
    loss: loss / denom,
    accuracy: hits / denom,
    mae: absErr / denom,
    recurrentWeights: weights.Whh,
    inputWeights: weights.Wxh,
  };
}

export function trainRnnEpoch(
  inputs: number[][],
  targets: number[],
  weights: RNNWeights,
  activation: RNNActivation,
  learningRate: number,
  task: RNNTask,
): { weights: RNNWeights; stats: Omit<RNNTrainEpoch, "epoch"> } {
  const hiddenSize = weights.bh.length;
  const inputSize = weights.Wxh[0]?.length ?? 1;
  const outputSize = weights.by.length;
  const states = [vector(hiddenSize)];
  const xs: number[][] = [];
  const hs: number[][] = [];
  const ys: number[][] = [];

  for (let time = 0; time < inputs.length; time += 1) {
    const x = inputs[time] ?? vector(inputSize);
    const previous = states[states.length - 1] ?? vector(hiddenSize);
    const hidden = add(add(mul(weights.Wxh, x), mul(weights.Whh, previous)), weights.bh).map((value) =>
      activate(value, activation),
    );
    const logits = add(mul(weights.Why, hidden), weights.by);
    states.push(hidden);
    xs.push(x);
    hs.push(hidden);
    ys.push(logits);
  }

  const dWxh = zeros(hiddenSize, inputSize);
  const dWhh = zeros(hiddenSize, hiddenSize);
  const dWhy = zeros(outputSize, hiddenSize);
  const dbh = vector(hiddenSize);
  const dby = vector(outputSize);
  let dhNext = vector(hiddenSize);
  let loss = 0;
  let hits = 0;
  let absErr = 0;

  for (let time = xs.length - 1; time >= 0; time -= 1) {
    const logits = ys[time] ?? vector(outputSize);
    const hidden = hs[time] ?? vector(hiddenSize);
    const x = xs[time] ?? vector(inputSize);
    const previous = states[time] ?? vector(hiddenSize);
    const target = targets[time] ?? 0;
    let dy = vector(outputSize);

    if (task === "text") {
      const probs = softmax(logits);
      const p = Math.max(1e-8, probs[target] ?? 1e-8);
      loss += -Math.log(p);
      dy = probs.map((value, index) => value - (index === target ? 1 : 0));
      const predicted = probs.reduce((best, value, index) => (value > (probs[best] ?? -1) ? index : best), 0);
      if (predicted === target) hits += 1;
    } else {
      const value = logits[0] ?? 0;
      const err = value - target;
      loss += 0.5 * err * err;
      absErr += Math.abs(err);
      dy[0] = err;
    }

    outerAdd(dWhy, dy, hidden);
    for (let i = 0; i < dby.length; i += 1) dby[i] += dy[i] ?? 0;
    const dh = add(transposeMul(weights.Why, dy), dhNext);
    const dz = hidden.map((value, index) => (dh[index] ?? 0) * derivativeFromActivated(value, activation));
    for (let i = 0; i < dbh.length; i += 1) dbh[i] += dz[i] ?? 0;
    outerAdd(dWxh, dz, x);
    outerAdd(dWhh, dz, previous);
    dhNext = transposeMul(weights.Whh, dz);
  }

  clipMatrices([dWxh, dWhh, dWhy], [dbh, dby]);
  const next: RNNWeights = {
    Wxh: weights.Wxh.map((row, i) => row.map((value, j) => value - learningRate * (dWxh[i]?.[j] ?? 0))),
    Whh: weights.Whh.map((row, i) => row.map((value, j) => value - learningRate * (dWhh[i]?.[j] ?? 0))),
    Why: weights.Why.map((row, i) => row.map((value, j) => value - learningRate * (dWhy[i]?.[j] ?? 0))),
    bh: weights.bh.map((value, i) => value - learningRate * (dbh[i] ?? 0)),
    by: weights.by.map((value, i) => value - learningRate * (dby[i] ?? 0)),
  };
  const denom = Math.max(1, xs.length);
  const gradNorm = Math.hypot(
    ...dWxh.flat(),
    ...dWhh.flat(),
    ...dWhy.flat(),
    ...dbh,
    ...dby,
  );
  return {
    weights: next,
    stats: {
      loss: loss / denom,
      accuracy: hits / denom,
      mae: absErr / denom,
      gradNorm,
    },
  };
}

export function inferNext(
  inputs: number[][],
  weights: RNNWeights,
  activation: RNNActivation,
  task: RNNTask,
  vocab: string[] = [],
): RNNPrediction {
  const result = forwardRnn(inputs, weights, activation, 0, task, vocab);
  return result.predictions[result.predictions.length - 1] ?? { token: "?", probability: 0, value: 0 };
}

export function runRNN(
  tokens: string[],
  hiddenSize: number,
  activation: RNNActivation,
  init: RNNWeightInit,
  bias: number,
  noise: number,
  weights?: RNNWeights,
): RNNResult {
  const vocab = [...new Set(tokens)];
  const inputs = encodeTextInputs(tokens, vocab);
  const model =
    weights ?? createRnnWeights(hiddenSize, Math.max(1, vocab.length), Math.max(1, vocab.length), init, bias);
  const targets = tokens.slice(1).map((token) => Math.max(0, vocab.indexOf(token)));
  targets.push(targets[targets.length - 1] ?? 0);
  return forwardRnn(inputs, model, activation, noise, "text", vocab, targets);
}
