import {
  buildSequenceWindows,
  chronologicalSplit,
  trainOnlyScaler,
} from "./timeSeriesSplit";

export type RecurrentKind = "rnn" | "lstm" | "gru";

export type RecurrentForecastResult = {
  mean: number;
  std: number;
  predictions: number[];
  fitted: number[];
  lower: number[];
  upper: number[];
  intervalAvailable: false;
  intervalNote: string;
  trainLoss: number[];
  validationLoss: number[];
  gateHistory: Array<{
    forget: number;
    input: number;
    candidate: number;
    output: number;
    update: number;
    reset: number;
  }>;
  cellStates: number[][];
  states: number[][];
  trainEnd: number;
  strategy: string;
  kind: RecurrentKind;
  architecture: string;
  dataWarning: string | null;
  recursiveSteps: Array<{ step: number; input: number[]; forecast: number }>;
};

type Weights = {
  Wxh: number[][];
  Whh: number[][];
  Why: number[];
  bh: number[];
  by: number;
  Wf: number[][];
  Wi: number[][];
  Wo: number[][];
  Wg: number[][];
  Uf: number[][];
  Ui: number[][];
  Uo: number[][];
  Ug: number[][];
  bf: number[];
  bi: number[];
  bo: number[];
  bg: number[];
};

const sigmoid = (value: number) =>
  1 / (1 + Math.exp(-Math.max(-20, Math.min(20, value))));
const dsig = (value: number) => value * (1 - value);
const dtanh = (value: number) => 1 - value * value;

function zeros(rows: number, cols: number) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function initWeights(hidden: number, seed: number): Weights {
  const random = rng(seed);
  const scale = 0.18;
  const matrix = (rows: number, cols: number) =>
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => (random() - 0.5) * 2 * scale),
    );
  const vector = (size: number, bias = 0) =>
    Array.from({ length: size }, () => (random() - 0.5) * scale + bias);
  return {
    Wxh: matrix(hidden, 1),
    Whh: matrix(hidden, hidden),
    Why: vector(hidden),
    bh: vector(hidden),
    by: 0,
    Wf: matrix(hidden, 1),
    Wi: matrix(hidden, 1),
    Wo: matrix(hidden, 1),
    Wg: matrix(hidden, 1),
    Uf: matrix(hidden, hidden),
    Ui: matrix(hidden, hidden),
    Uo: matrix(hidden, hidden),
    Ug: matrix(hidden, hidden),
    bf: vector(hidden, 1),
    bi: vector(hidden),
    bo: vector(hidden),
    bg: vector(hidden),
  };
}

function matVec(matrix: number[][], vector: number[]) {
  return matrix.map((row) =>
    row.reduce((sum, weight, index) => sum + weight * (vector[index] ?? 0), 0),
  );
}

function add(a: number[], b: number[]) {
  return a.map((value, index) => value + (b[index] ?? 0));
}

function forwardSequence(
  sequence: number[],
  kind: RecurrentKind,
  weights: Weights,
) {
  const hidden = weights.bh.length;
  let h = Array(hidden).fill(0);
  let c = Array(hidden).fill(0);
  const states: number[][] = [];
  const cells: number[][] = [];
  const gates: RecurrentForecastResult["gateHistory"] = [];
  for (const x of sequence) {
    const input = [x];
    const acc = { forget: 0, input: 0, candidate: 0, output: 0, update: 0, reset: 0 };
    if (kind === "lstm") {
      const forget = add(
        add(matVec(weights.Wf, input), matVec(weights.Uf, h)),
        weights.bf,
      ).map(sigmoid);
      const inputGate = add(
        add(matVec(weights.Wi, input), matVec(weights.Ui, h)),
        weights.bi,
      ).map(sigmoid);
      const candidate = add(
        add(matVec(weights.Wg, input), matVec(weights.Ug, h)),
        weights.bg,
      ).map(Math.tanh);
      const output = add(
        add(matVec(weights.Wo, input), matVec(weights.Uo, h)),
        weights.bo,
      ).map(sigmoid);
      c = c.map((cell, i) => forget[i] * cell + inputGate[i] * candidate[i]);
      h = c.map((cell, i) => output[i] * Math.tanh(cell));
      acc.forget = forget.reduce((s, v) => s + v, 0) / hidden;
      acc.input = inputGate.reduce((s, v) => s + v, 0) / hidden;
      acc.candidate = candidate.reduce((s, v) => s + v, 0) / hidden;
      acc.output = output.reduce((s, v) => s + v, 0) / hidden;
    } else if (kind === "gru") {
      const update = add(
        add(matVec(weights.Wf, input), matVec(weights.Uf, h)),
        weights.bf,
      ).map(sigmoid);
      const reset = add(
        add(matVec(weights.Wi, input), matVec(weights.Ui, h)),
        weights.bi,
      ).map(sigmoid);
      const mixed = h.map((value, i) => value * reset[i]);
      const candidate = add(
        add(matVec(weights.Wg, input), matVec(weights.Ug, mixed)),
        weights.bg,
      ).map(Math.tanh);
      h = h.map(
        (value, i) => (1 - update[i]) * value + update[i] * candidate[i],
      );
      acc.update = update.reduce((s, v) => s + v, 0) / hidden;
      acc.reset = reset.reduce((s, v) => s + v, 0) / hidden;
      acc.candidate = candidate.reduce((s, v) => s + v, 0) / hidden;
    } else {
      const pre = add(
        add(matVec(weights.Wxh, input), matVec(weights.Whh, h)),
        weights.bh,
      );
      h = pre.map(Math.tanh);
      acc.candidate = h.reduce((s, v) => s + v, 0) / hidden;
    }
    states.push([...h]);
    cells.push([...c]);
    gates.push(acc);
  }
  const y =
    h.reduce((sum, value, index) => sum + value * weights.Why[index], 0) +
    weights.by;
  return { y, h, c, states, cells, gates };
}

function predictOne(sequence: number[], kind: RecurrentKind, weights: Weights) {
  return forwardSequence(sequence, kind, weights).y;
}

function trainStep(
  sequence: number[],
  target: number[],
  kind: RecurrentKind,
  weights: Weights,
  learningRate: number,
) {
  const x = sequence.at(-1) ?? 0;
  const previous = sequence.slice(0, -1);
  const prior = previous.length
    ? forwardSequence(previous, kind, weights)
    : {
        y: 0,
        h: Array(weights.bh.length).fill(0),
        c: Array(weights.bh.length).fill(0),
        states: [] as number[][],
        cells: [] as number[][],
        gates: [] as RecurrentForecastResult["gateHistory"],
      };
  const current = forwardSequence(sequence, kind, weights);
  const error = current.y - target[0];
  const lr = learningRate;
  weights.by -= lr * error;
  for (let i = 0; i < weights.Why.length; i++) {
    weights.Why[i] -= lr * error * (current.h[i] ?? 0);
  }
  const dh = weights.Why.map((weight) => error * weight);
  if (kind === "rnn") {
    const preGrad = dh.map((grad, i) => grad * dtanh(current.h[i] ?? 0));
    for (let i = 0; i < preGrad.length; i++) {
      weights.bh[i] -= lr * preGrad[i];
      weights.Wxh[i][0] -= lr * preGrad[i] * x;
      for (let j = 0; j < weights.Whh[i].length; j++) {
        weights.Whh[i][j] -= lr * preGrad[i] * (prior.h[j] ?? 0);
      }
    }
  } else {
    for (let i = 0; i < dh.length; i++) {
      weights.bg[i] -= lr * dh[i] * 0.25;
      weights.Wg[i][0] -= lr * dh[i] * x * 0.25;
    }
  }
  return error * error;
}

export function recurrentForecast(
  values: number[],
  lookback: number,
  horizon: number,
  units: number,
  kind: RecurrentKind = "rnn",
  options?: { epochs?: number; learningRate?: number; seed?: number },
): RecurrentForecastResult {
  const finite = values.filter(Number.isFinite);
  const split = chronologicalSplit(finite);
  const width = Math.max(2, Math.min(split.train.length - 1, Math.round(lookback)));
  const hidden = Math.max(2, Math.min(8, Math.round(units)));
  const epochs = options?.epochs ?? 12;
  const learningRate = options?.learningRate ?? 0.03;
  const emptyGates = {
    forget: 0,
    input: 0,
    candidate: 0,
    output: 0,
    update: 0,
    reset: 0,
  };
  if (split.train.length <= width) {
    const last = finite.at(-1) ?? 0;
    return {
      mean: last,
      std: 1,
      predictions: Array.from({ length: Math.max(1, horizon) }, () => last),
      fitted: [...finite],
      lower: [],
      upper: [],
      intervalAvailable: false,
      intervalNote: "Prediction interval not available for this model.",
      trainLoss: [],
      validationLoss: [],
      gateHistory: [emptyGates],
      cellStates: [],
      states: [],
      trainEnd: split.trainEnd,
      strategy: "Insufficient train length; last-value fallback (not a trained network).",
      kind,
      architecture: `${kind.toUpperCase()} unavailable — too few train observations for lookback ${width}.`,
      dataWarning: "Very limited training data for neural forecasting.",
      recursiveSteps: [],
    };
  }
  const scaler = trainOnlyScaler(split.train);
  const trainNorm = split.train.map(scaler.encode);
  const valSeries = [...split.train, ...split.validation].map(scaler.encode);
  const trainWindows = buildSequenceWindows(trainNorm, width);
  const valWindows = buildSequenceWindows(valSeries, width);
  const valPairs = valWindows.inputs
    .map((input, index) => ({ input, target: valWindows.targets[index] }))
    .filter((_, index) => index + width >= split.train.length);
  const weights = initWeights(hidden, options?.seed ?? 7);
  const trainLoss: number[] = [];
  const validationLoss: number[] = [];
  for (let epoch = 0; epoch < epochs; epoch++) {
    let sum = 0;
    for (let i = 0; i < trainWindows.inputs.length; i++) {
      sum += trainStep(
        trainWindows.inputs[i],
        [trainWindows.targets[i]],
        kind,
        weights,
        learningRate,
      );
    }
    trainLoss.push(sum / Math.max(1, trainWindows.inputs.length));
    if (valPairs.length) {
      const val =
        valPairs.reduce(
          (total, pair) =>
            total + (predictOne(pair.input, kind, weights) - pair.target) ** 2,
          0,
        ) / valPairs.length;
      validationLoss.push(val);
    } else {
      validationLoss.push(trainLoss.at(-1) ?? 0);
    }
  }
  const fittedNorm = trainWindows.inputs.map((input) =>
    predictOne(input, kind, weights),
  );
  const fitted = finite.map((_, index) => {
    if (index < width || index >= split.train.length) return Number.NaN;
    return scaler.decode(fittedNorm[index - width] ?? 0);
  });
  const history = trainNorm.slice(-width);
  const predictions: number[] = [];
  let lastForward = forwardSequence(history, kind, weights);
  for (let step = 0; step < Math.max(1, Math.round(horizon)); step++) {
    const next = predictOne(history, kind, weights);
    predictions.push(scaler.decode(next));
    history.push(next);
    history.shift();
    lastForward = forwardSequence(history, kind, weights);
  }
  const recursiveSteps = predictions.map((forecast, index) => ({
    step: index + 1,
    input: [
      ...split.train.slice(-(width - Math.min(index, width))),
      ...predictions.slice(0, index),
    ].slice(-width),
    forecast,
  }));
  const windows = Math.max(0, split.train.length - width);
  return {
    mean: scaler.min,
    std: scaler.max - scaler.min,
    predictions,
    fitted,
    lower: [],
    upper: [],
    intervalAvailable: false,
    intervalNote: "Prediction interval not available for this model.",
    trainLoss,
    validationLoss,
    gateHistory: lastForward.gates.length ? lastForward.gates : [emptyGates],
    cellStates: lastForward.cells,
    states: lastForward.states,
    trainEnd: split.trainEnd,
    strategy:
      "Fixed trained model. Windows are built from the chronological train split only. Scaler min/max fit on train. Multi-step forecast is recursive: predicted values become later inputs. Validation loss uses windows whose targets fall after the train origin.",
    kind,
    architecture: `${kind.toUpperCase()} · lookback ${width} · hidden ${hidden} · 1 output. ${kind === "lstm" ? "LSTM gates (forget/input/output/cell)." : kind === "gru" ? "GRU gates (update/reset)." : "Elman SimpleRNN (tanh)."}`,
    dataWarning:
      windows < 16
        ? `Very limited training data for neural forecasting (${windows} windows after lookback).`
        : scaler.degenerate
          ? "Train series has near-zero variance; scaling is skipped."
          : null,
    recursiveSteps,
  };
}
