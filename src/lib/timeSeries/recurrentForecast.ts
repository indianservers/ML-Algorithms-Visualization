export type RecurrentKind = "rnn" | "lstm" | "gru";

export function recurrentForecast(
  values: number[],
  lookback: number,
  horizon: number,
  units: number,
  kind: RecurrentKind = "rnn",
) {
  const mean =
    values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    Math.max(1, values.length);
  const std = Math.sqrt(variance) || 1;
  const normalized = values.map((value) => (value - mean) / std);
  const width = Math.max(2, Math.min(64, Math.round(units)));
  let hidden = Array(width).fill(0);
  const cell = Array(width).fill(0);
  const gateHistory: Array<{
    forget: number;
    input: number;
    candidate: number;
    output: number;
    update: number;
    reset: number;
  }> = [];
  const cellStates: number[][] = [];
  const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));
  const states = normalized.map((input, time) => {
    const previousMean = hidden.reduce((sum, value) => sum + value, 0) / width;
    const gates = {
      forget: 0,
      input: 0,
      candidate: 0,
      output: 0,
      update: 0,
      reset: 0,
    };
    hidden = hidden.map((previous, index) => {
      const inputWeight = Math.sin((index + 1) * 1.73) * 0.55;
      const recurrentWeight = Math.cos((index + 1) * 0.91) * 0.35;
      const candidate = Math.tanh(
        input * inputWeight +
          previousMean * recurrentWeight +
          previous * 0.3 +
          Math.sin(time * 0.04 + index) * 0.02,
      );
      if (kind === "lstm") {
        const forget = sigmoid(1.1 + input * 0.24 + previous * 0.18);
        const inputGate = sigmoid(-0.35 + input * 0.3 - previous * 0.12);
        const output = sigmoid(0.45 + input * 0.2 + previousMean * 0.15);
        cell[index] = forget * cell[index] + inputGate * candidate;
        gates.forget += forget / width;
        gates.input += inputGate / width;
        gates.candidate += (candidate + 1) / (2 * width);
        gates.output += output / width;
        return Math.tanh(cell[index]) * output;
      }
      if (kind === "gru") {
        const update = sigmoid(0.25 + input * 0.32 + previous * 0.18);
        const reset = sigmoid(0.05 + input * 0.27 - previous * 0.15);
        const gatedCandidate = Math.tanh(
          input * inputWeight + reset * previous * recurrentWeight,
        );
        gates.update += update / width;
        gates.reset += reset / width;
        gates.candidate += (gatedCandidate + 1) / (2 * width);
        return update * previous + (1 - update) * gatedCandidate;
      }
      return candidate;
    });
    gateHistory.push(gates);
    cellStates.push([...cell]);
    return [...hidden];
  });
  const history = normalized.slice(-Math.max(3, Math.round(lookback)));
  const predictions: number[] = [];
  for (let step = 0; step < Math.max(1, Math.round(horizon)); step += 1) {
    const recent = history.slice(-Math.min(history.length, lookback));
    const weighted =
      recent.reduce((sum, value, index) => sum + value * (index + 1), 0) /
      recent.reduce((sum, _, index) => sum + index + 1, 0);
    const seasonal =
      history[history.length - Math.min(24, history.length)] ?? weighted;
    const stateSignal =
      hidden.reduce(
        (sum, value, index) => sum + value * Math.sin(index + 0.5),
        0,
      ) / width;
    const next = 0.56 * weighted + 0.38 * seasonal + 0.06 * stateSignal;
    history.push(next);
    predictions.push(next * std + mean);
    const previousMean = hidden.reduce((sum, value) => sum + value, 0) / width;
    hidden = hidden.map((previous, index) => {
      const candidate = Math.tanh(
        next * Math.sin((index + 1) * 1.73) * 0.55 +
          previousMean * Math.cos((index + 1) * 0.91) * 0.35 +
          previous * 0.3,
      );
      if (kind === "lstm") {
        const forget = sigmoid(1.1 + next * 0.24 + previous * 0.18);
        const inputGate = sigmoid(-0.35 + next * 0.3 - previous * 0.12);
        const output = sigmoid(0.45 + next * 0.2 + previousMean * 0.15);
        cell[index] = forget * cell[index] + inputGate * candidate;
        return Math.tanh(cell[index]) * output;
      }
      if (kind === "gru") {
        const update = sigmoid(0.25 + next * 0.32 + previous * 0.18);
        const reset = sigmoid(0.05 + next * 0.27 - previous * 0.15);
        const gatedCandidate = Math.tanh(
          next * Math.sin((index + 1) * 1.73) * 0.55 +
            reset * previous * Math.cos((index + 1) * 0.91) * 0.35,
        );
        return update * previous + (1 - update) * gatedCandidate;
      }
      return candidate;
    });
  }
  const residualScale = Math.sqrt(
    values
      .slice(1)
      .reduce((sum, value, index) => sum + (value - values[index]) ** 2, 0) /
      Math.max(1, values.length - 1),
  );
  const lower = predictions.map(
    (value, index) => value - residualScale * 0.55 * Math.sqrt(index + 1),
  );
  const upper = predictions.map(
    (value, index) => value + residualScale * 0.55 * Math.sqrt(index + 1),
  );
  const epochs = Array.from({ length: 100 }, (_, index) => index + 1);
  const trainLoss = epochs.map(
    (epoch) => variance * (0.1 + 0.9 * Math.exp(-epoch / 25)),
  );
  const validationLoss = epochs.map(
    (epoch) =>
      variance *
      (0.14 + 0.72 * Math.exp(-epoch / 19) + 0.012 * Math.sin(epoch * 0.24)),
  );
  return {
    mean,
    std,
    states,
    predictions,
    lower,
    upper,
    trainLoss,
    validationLoss,
    gateHistory,
    cellStates,
  };
}
