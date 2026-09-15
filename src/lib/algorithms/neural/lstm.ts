export type LSTMGateActivation = "sigmoid" | "hard-sigmoid";
export type LSTMCandidateActivation = "tanh" | "relu";

export interface LSTMStep {
  input: number;
  forget: number;
  write: number;
  candidate: number;
  output: number;
  cell: number;
  hidden: number;
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

const sigmoid = (value: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));
const hardSigmoid = (value: number) => Math.max(0, Math.min(1, value * 0.2 + 0.5));

export function defaultLstmWeights(units = 16, layers = 1): LSTMWeights {
  const scale = Math.sqrt(16 / Math.max(1, units)) * (1 + (Math.max(1, layers) - 1) * 0.04);
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
) {
  const gate = gateActivation === "sigmoid" ? sigmoid : hardSigmoid;
  const candidateFn =
    candidateActivation === "tanh"
      ? Math.tanh
      : (value: number) => Math.max(0, value);
  const steps: LSTMStep[] = [];
  let cell = 0;
  let hidden = 0;

  inputs.forEach((rawInput, time) => {
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
      forget: gate(weights.Wf * input + weights.Uf * recurrent + weights.bf + 0.2 * peephole),
      write: gate(weights.Wi * input + weights.Ui * recurrent + weights.bi + 0.12 * peephole),
      candidate: candidateFn(weights.Wg * input + weights.Ug * recurrent + weights.bg),
      output: gate(weights.Wo * input + weights.Uo * recurrent + weights.bo + 0.18 * peephole),
    };
    const active = { ...defaults, ...overrides[time] };
    cell = active.forget * previousCell + active.write * active.candidate;
    hidden = active.output * Math.tanh(cell);
    steps.push({ input: rawInput, ...active, cell, hidden });
  });
  return steps;
}
