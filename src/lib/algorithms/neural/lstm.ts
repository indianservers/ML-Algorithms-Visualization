export type LSTMGateActivation = "sigmoid" | "hard-sigmoid";
export type LSTMCandidateActivation = "tanh" | "relu";

export const LSTM_WEIGHT_KEYS = [
  "Wf",
  "Uf",
  "bf",
  "Wi",
  "Ui",
  "bi",
  "Wg",
  "Ug",
  "bg",
  "Wo",
  "Uo",
  "bo",
] as const;

export type LSTMWeightKey = (typeof LSTM_WEIGHT_KEYS)[number];

export interface LSTMStep {
  input: number;
  extra: number;
  forget: number;
  write: number;
  candidate: number;
  output: number;
  cell: number;
  hidden: number;
  retained: number;
  written: number;
  revealed: number;
  inputMasked: boolean;
  recurrentMasked: boolean;
}

export type LSTMOverrides = Record<
  number,
  Partial<Pick<LSTMStep, "forget" | "write" | "candidate" | "output">>
>;

export interface LSTMWeights {
  Wf: number;
  Uf: number;
  bf: number;
  Wi: number;
  Ui: number;
  bi: number;
  Wg: number;
  Ug: number;
  bg: number;
  Wo: number;
  Uo: number;
  bo: number;
}

export interface LSTMTrainEpoch {
  epoch: number;
  loss: number;
  forget: number;
  write: number;
  output: number;
}

export interface LSTMBpttRow {
  t: number;
  dHidden: number;
  dCell: number;
  forgetPath: number;
  note: string;
}

export interface SequenceModelRow {
  name: string;
  params: number;
  nextMae: number;
  lastError: number;
  persist: number;
  note: string;
}

const sigmoid = (value: number) =>
  1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));
const hardSigmoid = (value: number) =>
  Math.max(0, Math.min(1, value * 0.2 + 0.5));

export function defaultLstmWeights(
  units = 16,
  layers = 1,
  layerIndex = 0,
): LSTMWeights {
  const scale =
    Math.sqrt(16 / Math.max(1, units)) *
    (1 + (Math.max(1, layers) - 1) * 0.04) *
    (1 + layerIndex * 0.07);
  return {
    Wf: 0.7 * scale,
    Uf: 0.35 * scale,
    bf: 1.35,
    Wi: 0.9 * scale,
    Ui: 0.25 * scale,
    bi: -0.2,
    Wg: 1.1 * scale,
    Ug: 0.55 * scale,
    bg: -0.15,
    Wo: 0.45 * scale,
    Uo: 0.4 * scale,
    bo: 0.35,
  };
}

function runLstmLayer(
  inputs: number[],
  extras: number[],
  gateActivation: LSTMGateActivation,
  candidateActivation: LSTMCandidateActivation,
  peepholes: boolean,
  recurrentDropout: number,
  inputDropout: number,
  overrides: LSTMOverrides,
  weights: LSTMWeights,
): LSTMStep[] {
  const gate = gateActivation === "sigmoid" ? sigmoid : hardSigmoid;
  const candidateFn =
    candidateActivation === "tanh"
      ? Math.tanh
      : (value: number) => Math.max(0, value);
  const steps: LSTMStep[] = [];
  let cell = 0;
  let hidden = 0;

  inputs.forEach((rawInput, time) => {
    const extra = extras[time] ?? 0;
    const inputMask =
      inputDropout <= 0 || Math.sin((time + 1) * 19.17) > inputDropout * 2 - 1
        ? 1
        : 0;
    const recurrentMask =
      recurrentDropout <= 0 ||
      Math.cos((time + 1) * 13.11) > recurrentDropout * 2 - 1
        ? 1
        : 0;
    const input = rawInput * inputMask;
    const recurrent = hidden * recurrentMask;
    const previousCell = cell;
    const peephole = peepholes ? previousCell : 0;
    const defaults = {
      forget: gate(
        weights.Wf * input +
          weights.Uf * recurrent +
          weights.bf +
          0.2 * peephole +
          0.35 * extra,
      ),
      write: gate(
        weights.Wi * input +
          weights.Ui * recurrent +
          weights.bi +
          0.12 * peephole +
          0.28 * extra,
      ),
      candidate: candidateFn(
        weights.Wg * input + weights.Ug * recurrent + weights.bg + 0.22 * extra,
      ),
      output: gate(
        weights.Wo * input +
          weights.Uo * recurrent +
          weights.bo +
          0.18 * peephole +
          0.2 * extra,
      ),
    };
    const active = { ...defaults, ...overrides[time] };
    const retained = active.forget * previousCell;
    const written = active.write * active.candidate;
    cell = retained + written;
    const revealed = active.output * Math.tanh(cell);
    hidden = revealed;
    steps.push({
      input: rawInput,
      extra,
      ...active,
      cell,
      hidden,
      retained,
      written,
      revealed,
      inputMasked: inputMask === 0,
      recurrentMasked: recurrentMask === 0,
    });
  });
  return steps;
}

export function runLSTM(
  inputs: number[],
  gateActivation: LSTMGateActivation,
  candidateActivation: LSTMCandidateActivation,
  peepholes: boolean,
  recurrentDropout: number,
  inputDropout: number,
  overrides: LSTMOverrides = {},
  units = 16,
  layers = 1,
  weights = defaultLstmWeights(units, layers),
  extras: number[] = [],
) {
  let series = inputs;
  let steps: LSTMStep[] = [];
  const depth = Math.max(1, layers);
  for (let layer = 0; layer < depth; layer += 1) {
    steps = runLstmLayer(
      series,
      layer === 0 ? extras : [],
      gateActivation,
      candidateActivation,
      peepholes,
      layer === 0 ? recurrentDropout : 0,
      layer === 0 ? inputDropout : 0,
      layer === depth - 1 ? overrides : {},
      layer === 0 ? weights : defaultLstmWeights(units, layers, layer),
    );
    series = steps.map((step) => step.hidden);
  }
  return steps;
}

export function meanGate(
  steps: LSTMStep[],
  key: "forget" | "write" | "output" | "candidate" | "cell" | "hidden",
) {
  if (!steps.length) return 0;
  return steps.reduce((sum, step) => sum + step[key], 0) / steps.length;
}

export function diagnoseLSTM(
  steps: LSTMStep[],
  targets?: number[],
): {
  mae: number;
  forget: number;
  write: number;
  output: number;
  cellSpan: number;
  saturation: number;
  halfLife: number;
  lastError: number;
} {
  if (!steps.length) {
    return {
      mae: 0,
      forget: 0,
      write: 0,
      output: 0,
      cellSpan: 0,
      saturation: 0,
      halfLife: 0,
      lastError: 0,
    };
  }
  const mae =
    steps.reduce((sum, item, index) => {
      const target =
        targets?.[index] ??
        steps[index + 1]?.input ??
        item.input;
      return sum + Math.abs(item.hidden - target);
    }, 0) / steps.length;
  const cells = steps.map((item) => item.cell);
  const saturated = steps.filter(
    (step) =>
      step.forget <= 0.05 ||
      step.forget >= 0.95 ||
      step.output <= 0.05 ||
      step.output >= 0.95,
  ).length;
  const last = steps[steps.length - 1];
  const target =
    targets?.[targets.length - 1] ?? last?.input ?? 0;
  return {
    mae,
    forget: meanGate(steps, "forget"),
    write: meanGate(steps, "write"),
    output: meanGate(steps, "output"),
    cellSpan: Math.max(...cells) - Math.min(...cells),
    saturation: saturated / steps.length,
    halfLife: cellHalfLife(steps),
    lastError: Math.abs((last?.hidden ?? 0) - target),
  };
}

export function cellHalfLife(steps: LSTMStep[]) {
  if (steps.length < 2) return 0;
  let persist = 1;
  for (let index = 1; index < steps.length; index += 1) {
    persist *= steps[index]?.forget ?? 1;
    if (persist <= 0.5) return index;
  }
  return steps.length;
}

export function lstmEvents(steps: LSTMStep[]) {
  const events: { t: number; label: string }[] = [];
  steps.forEach((step, index) => {
    const previous = index > 0 ? steps[index - 1] : undefined;
    if (previous && Math.abs(step.forget - previous.forget) >= 0.18) {
      events.push({
        t: index,
        label:
          step.forget < previous.forget
            ? `Forget dropped to ${step.forget.toFixed(2)} — memory is being erased`
            : `Forget rose to ${step.forget.toFixed(2)} — cell will keep more of C`,
      });
    } else if (previous && Math.abs(step.write - previous.write) >= 0.2) {
      events.push({
        t: index,
        label: `Write spiked to ${step.write.toFixed(2)} — new content entering C`,
      });
    } else if (previous && Math.abs(step.cell - previous.cell) >= 0.28) {
      events.push({
        t: index,
        label: `Cell jumped ${step.cell >= previous.cell ? "+" : ""}${(step.cell - previous.cell).toFixed(2)}`,
      });
    }
  });
  return events;
}

export function runScalarRnn(inputs: number[], extra: number[] = []) {
  let hidden = 0;
  return inputs.map((input, time) => {
    hidden = Math.tanh(0.9 * input + 0.85 * hidden + 0.25 * (extra[time] ?? 0));
    return hidden;
  });
}

export function runScalarGru(inputs: number[], extra: number[] = []) {
  let hidden = 0;
  return inputs.map((input, time) => {
    const x = input + 0.3 * (extra[time] ?? 0);
    const update = sigmoid(0.72 * x + 0.38 * hidden);
    const reset = sigmoid(-0.45 * x + 0.51 * hidden);
    const candidate = Math.tanh(0.83 * x + 0.57 * reset * hidden);
    hidden = (1 - update) * hidden + update * candidate;
    return hidden;
  });
}

function conv1dNext(inputs: number[]) {
  return inputs.map((_, time) => {
    const a = inputs[time - 2] ?? 0;
    const b = inputs[time - 1] ?? 0;
    const c = inputs[time] ?? 0;
    return 0.25 * a + 0.5 * b + 0.25 * c;
  });
}

function causalAttention(inputs: number[]) {
  return inputs.map((_, time) => {
    const start = Math.max(0, time - 7);
    const window = inputs.slice(start, time + 1);
    const scores = window.map((value, index) => value + index * 0.05);
    const max = Math.max(...scores);
    const exps = scores.map((score) => Math.exp(score - max));
    const sum = exps.reduce((total, value) => total + value, 0) || 1;
    return window.reduce(
      (total, value, index) => total + value * ((exps[index] ?? 0) / sum),
      0,
    );
  });
}

function nextMae(preds: number[], truth: number[]) {
  if (truth.length < 2) return 0;
  let total = 0;
  for (let index = 0; index < truth.length - 1; index += 1) {
    total += Math.abs((preds[index] ?? 0) - (truth[index + 1] ?? 0));
  }
  return total / (truth.length - 1);
}

export function compareSequenceModels(
  inputs: number[],
  extras: number[],
  lstm: LSTMStep[],
  units: number,
  layers: number,
  targets?: number[],
): SequenceModelRow[] {
  const truth = targets ?? inputs;
  const rnn = runScalarRnn(inputs, extras);
  const gru = runScalarGru(inputs, extras);
  const conv = conv1dNext(inputs);
  const attn = causalAttention(inputs);
  const last = truth[truth.length - 1] ?? 0;
  const rnnPersist = rnn.reduce((product, hidden) => {
    const deriv = 1 - hidden * hidden;
    return product * Math.abs(0.85 * deriv);
  }, 1);
  return [
    {
      name: "LSTM",
      params: 4 * (units * (1 + units) + units) * Math.max(1, layers),
      nextMae: nextMae(
        lstm.map((step) => step.hidden),
        truth,
      ),
      lastError: Math.abs((lstm[lstm.length - 1]?.hidden ?? 0) - last),
      persist: lstm.reduce((product, step) => product * step.forget, 1),
      note: "Cell highway keeps early clues when forget stays high.",
    },
    {
      name: "Vanilla RNN",
      params: units * (1 + units) + units,
      nextMae: nextMae(rnn, truth),
      lastError: Math.abs((rnn[rnn.length - 1] ?? 0) - last),
      persist: rnnPersist,
      note: "Hidden state is squashed every step — gradients vanish.",
    },
    {
      name: "GRU",
      params: 3 * (units * (1 + units) + units),
      nextMae: nextMae(gru, truth),
      lastError: Math.abs((gru[gru.length - 1] ?? 0) - last),
      persist: gru.reduce((product, hidden, index) => {
        const previous = index > 0 ? gru[index - 1] ?? hidden : hidden;
        return product * Math.abs(1 - Math.min(1, Math.abs(hidden - previous)));
      }, 1),
      note: "Fewer gates than LSTM; no separate cell state.",
    },
    {
      name: "1-D conv (k=3)",
      params: 3 * units + units,
      nextMae: nextMae(conv, truth),
      lastError: Math.abs((conv[conv.length - 1] ?? 0) - last),
      persist: 0,
      note: "Fixed local window. Cannot wait an arbitrary delay.",
    },
    {
      name: "Tiny causal attention",
      params: 4 * units * units + 2 * units,
      nextMae: nextMae(attn, truth),
      lastError: Math.abs((attn[attn.length - 1] ?? 0) - last),
      persist: 1,
      note: "Sees the whole prefix at once. Better when context is long.",
    },
  ];
}

function predictionLoss(steps: LSTMStep[], targets: number[]) {
  if (!steps.length) return 0;
  let total = 0;
  let count = 0;
  steps.forEach((step, index) => {
    const target = targets[index] ?? targets[targets.length - 1];
    if (target === undefined) return;
    total += (step.hidden - target) ** 2;
    count += 1;
  });
  return count ? total / count : 0;
}

export function nextStepTargets(inputs: number[]) {
  return inputs.map((_, index) => inputs[index + 1] ?? inputs[index] ?? 0);
}

export function trainLstmWeights(
  inputs: number[],
  extras: number[],
  targets: number[],
  seed: LSTMWeights,
  gateActivation: LSTMGateActivation,
  candidateActivation: LSTMCandidateActivation,
  peepholes: boolean,
  units: number,
  layers: number,
  epochs = 40,
  learningRate = 0.12,
): { weights: LSTMWeights; history: LSTMTrainEpoch[] } {
  let weights = { ...seed };
  const history: LSTMTrainEpoch[] = [];
  const run = (candidate: LSTMWeights) =>
    runLSTM(
      inputs,
      gateActivation,
      candidateActivation,
      peepholes,
      0,
      0,
      {},
      units,
      layers,
      candidate,
      extras,
    );

  for (let epoch = 1; epoch <= epochs; epoch += 1) {
    const base = run(weights);
    const loss = predictionLoss(base, targets);
    const next = { ...weights };
    for (const key of LSTM_WEIGHT_KEYS) {
      const eps = 1e-3;
      const up = { ...weights, [key]: weights[key] + eps };
      const down = { ...weights, [key]: weights[key] - eps };
      const grad =
        (predictionLoss(run(up), targets) - predictionLoss(run(down), targets)) /
        (2 * eps);
      next[key] = weights[key] - learningRate * grad;
    }
    weights = next;
    const trained = run(weights);
    history.push({
      epoch,
      loss,
      forget: meanGate(trained, "forget"),
      write: meanGate(trained, "write"),
      output: meanGate(trained, "output"),
    });
  }
  return { weights, history };
}

export function bpttStrip(
  steps: LSTMStep[],
  target: number,
  count = 3,
): LSTMBpttRow[] {
  if (!steps.length) return [];
  const last = steps.length - 1;
  const rows: LSTMBpttRow[] = [];
  let dCellNext = 0;
  let forgetNext = 1;
  for (let t = last; t >= Math.max(0, last - count + 1); t -= 1) {
    const step = steps[t];
    if (!step) continue;
    const dHidden = t === last ? step.hidden - target : 0;
    const tanhC = Math.tanh(step.cell);
    const dCellFromH = dHidden * step.output * (1 - tanhC * tanhC);
    const dCell = dCellFromH + dCellNext * forgetNext;
    rows.unshift({
      t,
      dHidden,
      dCell,
      forgetPath: forgetNext,
      note:
        t === last
          ? "Loss hits h, then splits into o and C"
          : `dC flows back through fₜ₊₁=${forgetNext.toFixed(2)}`,
    });
    dCellNext = dCell;
    forgetNext = step.forget;
  }
  return rows;
}

export function gateCaption(
  key: "forget" | "write" | "candidate" | "output",
  value: number,
) {
  if (key === "forget") {
    return `keep ${(value * 100).toFixed(0)}% of yesterday’s memory`;
  }
  if (key === "write") {
    return `allow ${(value * 100).toFixed(0)}% of the candidate into C`;
  }
  if (key === "candidate") {
    return value >= 0
      ? `propose +${value.toFixed(2)} new content`
      : `propose ${value.toFixed(2)} (subtract from C)`;
  }
  return `reveal ${(value * 100).toFixed(0)}% of tanh(C) as h`;
}

export function activationGlyph(
  kind: "gate" | "candidate",
  gateActivation: LSTMGateActivation,
  candidateActivation: LSTMCandidateActivation,
) {
  if (kind === "candidate") {
    return candidateActivation === "tanh" ? "tanh" : "ReLU";
  }
  return gateActivation === "sigmoid" ? "σ" : "σ̂";
}
