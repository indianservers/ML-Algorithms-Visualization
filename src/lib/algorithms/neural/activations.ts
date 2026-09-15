export function relu(value: number, alpha = 0) {
  if (value >= 0) return value;
  return alpha === 0 ? 0 : alpha * value;
}

export function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, value))));
}

export function tanhActivation(value: number) {
  return Math.tanh(value);
}

export function stableSoftmax(logits: number[]) {
  const max = Math.max(...logits.map((value) => (Number.isFinite(value) ? value : 0)));
  const exps = logits.map((value) =>
    Number.isFinite(value) ? Math.exp(value - max) : 0,
  );
  const total = exps.reduce((sum, value) => sum + value, 0) || 1;
  return exps.map((value) => value / total);
}

export function stableCrossEntropy(probabilities: number[], label: number) {
  const p = Math.max(1e-12, Math.min(1 - 1e-12, probabilities[label] ?? 0));
  return -Math.log(p);
}
