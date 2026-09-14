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

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));
const hardSigmoid = (value: number) =>
  Math.max(0, Math.min(1, value * 0.2 + 0.5));

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
) {
  const gate = gateActivation === "sigmoid" ? sigmoid : hardSigmoid;
  const candidate =
    candidateActivation === "tanh"
      ? Math.tanh
      : (value: number) => Math.max(0, value);
  const steps: LSTMStep[] = [];
  let cell = 0;
  let hidden = 0;
  const capacityScale = Math.sqrt(16 / Math.max(1, units));
  const depthScale = 1 + (Math.max(1, layers) - 1) * 0.04;

  inputs.forEach((rawInput, time) => {
    const inputMask =
      Math.sin((time + 1) * 19.17) > inputDropout * 2 - 1 ? 1 : 0;
    const recurrentMask =
      Math.cos((time + 1) * 13.11) > recurrentDropout * 2 - 1 ? 1 : 0;
    const input = rawInput * inputMask * capacityScale;
    const recurrent = hidden * recurrentMask * depthScale;
    const previousCell = cell;
    const defaults = {
      forget: gate(
        1.35 +
          input * 0.7 +
          recurrent * 0.35 +
          (peepholes ? previousCell * 0.2 : 0),
      ),
      write: gate(
        -0.2 +
          input * 0.9 +
          recurrent * 0.25 +
          (peepholes ? previousCell * 0.12 : 0),
      ),
      candidate: candidate(input * 1.1 + recurrent * 0.55 - 0.15),
      output: gate(
        0.35 +
          input * 0.45 +
          recurrent * 0.4 +
          (peepholes ? previousCell * 0.18 : 0),
      ),
    };
    const active = { ...defaults, ...overrides[time] };
    cell = active.forget * previousCell + active.write * active.candidate;
    hidden = active.output * Math.tanh(cell);
    steps.push({ input: rawInput, ...active, cell, hidden });
  });
  return steps;
}
