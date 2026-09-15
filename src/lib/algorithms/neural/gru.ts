export type GRUActivation = "tanh" | "relu" | "sigmoid";
export type GRUPrecision = "float32" | "float16";

export interface GRUStep {
  input: number;
  update: number;
  reset: number;
  candidate: number;
  hidden: number;
  simpleRNN: number;
}

const sigmoid = (value: number) =>
  1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));
const activate = (value: number, mode: GRUActivation) =>
  mode === "relu"
    ? Math.max(0, value)
    : mode === "sigmoid"
      ? sigmoid(value)
      : Math.tanh(value);
const quantize = (value: number, precision: GRUPrecision) =>
  precision === "float16" ? Math.round(value * 1024) / 1024 : value;

export function tokenSignal(token: string) {
  const value = [...token].reduce(
    (sum, character, index) => sum + character.charCodeAt(0) * (index + 5),
    0,
  );
  return Math.sin(value * 0.017);
}

export function runGRU(
  tokens: string[],
  initialHidden: number,
  gateBias: number,
  weightScale: number,
  activation: GRUActivation,
  precision: GRUPrecision,
) {
  let hidden = initialHidden;
  let simple = initialHidden;
  const Wz = 0.72 * weightScale;
  const Uz = 0.38 * weightScale;
  const Wr = -0.45 * weightScale;
  const Ur = 0.51 * weightScale;
  const Wh = 0.83 * weightScale;
  const Uh = 0.57 * weightScale;
  return tokens.map((token): GRUStep => {
    const input = tokenSignal(token);
    const update = sigmoid(Wz * input + Uz * hidden + gateBias);
    const reset = sigmoid(Wr * input + Ur * hidden + gateBias);
    const candidate = activate(Wh * input + Uh * reset * hidden, activation);
    hidden = quantize((1 - update) * hidden + update * candidate, precision);
    simple = quantize(activate(Wh * input + Uh * simple, activation), precision);
    return { input, update, reset, candidate, hidden, simpleRNN: simple };
  });
}
