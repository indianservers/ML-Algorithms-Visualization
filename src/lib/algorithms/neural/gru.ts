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

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));
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
  return tokens.map((token, time): GRUStep => {
    const input = tokenSignal(token);
    const update = sigmoid(
      weightScale * (0.72 * input + 0.38 * hidden) +
        gateBias +
        Math.sin(time * 1.7) * 0.12,
    );
    const reset = sigmoid(
      weightScale * (-0.45 * input + 0.51 * hidden) +
        gateBias -
        Math.cos(time * 1.1) * 0.1,
    );
    const candidate = activate(
      weightScale * (0.83 * input + 0.57 * reset * hidden),
      activation,
    );
    hidden = quantize((1 - update) * hidden + update * candidate, precision);
    simple = quantize(
      activate(weightScale * (0.83 * input + 0.57 * simple), activation),
      precision,
    );
    return { input, update, reset, candidate, hidden, simpleRNN: simple };
  });
}
