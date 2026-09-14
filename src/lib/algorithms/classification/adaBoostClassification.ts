export interface AdaBoostStump {
  featureIndex: number;
  threshold: number;
  polarity: 1 | -1;
}

export interface AdaBoostRound {
  stump: AdaBoostStump;
  weightedError: number;
  alpha: number;
  weightsBefore: number[];
  weightsAfter: number[];
  predictions: number[];
}

export interface AdaBoostClassificationModel {
  rounds: AdaBoostRound[];
  scoreAtRound: (row: number[], rounds: number) => number;
  predictAtRound: (row: number[], rounds: number) => number;
  score: (row: number[]) => number;
  predict: (row: number[]) => number;
}

const stumpVote = (stump: AdaBoostStump, row: number[]) =>
  (row[stump.featureIndex] <= stump.threshold ? -1 : 1) * stump.polarity;

export function trainAdaBoostClassification(
  X: number[][],
  labels: number[],
  options: { rounds: number; learningRate: number; earlyStopping?: boolean },
): AdaBoostClassificationModel {
  if (
    !X.length ||
    X.length !== labels.length ||
    !X[0]?.length ||
    labels.some((value) => value !== 0 && value !== 1)
  )
    throw new Error("AdaBoost requires matching binary data.");
  const width = X[0].length;
  if (!X.every((row) => row.length === width && row.every(Number.isFinite)) ||
      !Number.isFinite(options.learningRate) || options.learningRate <= 0 ||
      !Number.isInteger(options.rounds) || options.rounds < 1)
    throw new Error("AdaBoost requires finite rectangular data and positive hyperparameters.");
  const y = labels.map((value) => (value ? 1 : -1)),
    rounds: AdaBoostRound[] = [];
  let weights = labels.map(() => 1 / labels.length);
  for (
    let round = 0;
    round < Math.max(1, Math.round(options.rounds));
    round += 1
  ) {
    let best: {
      stump: AdaBoostStump;
      error: number;
      predictions: number[];
    } | null = null;
    for (let feature = 0; feature < X[0].length; feature += 1) {
      const values = [...new Set(X.map((row) => row[feature]))].sort(
        (a, b) => a - b,
      );
      const candidates =
        values.length > 50
          ? Array.from(
              { length: 50 },
              (_, i) => values[Math.floor(((i + 1) * values.length) / 51)],
            )
          : values.length === 1
            ? [values[0]]
            : values.slice(1).map((value, i) => (values[i] + value) / 2);
      for (const threshold of candidates)
        for (const polarity of [1, -1] as const) {
          const stump = { featureIndex: feature, threshold, polarity },
            predictions = X.map((row) => stumpVote(stump, row));
          const error = predictions.reduce(
            (sum, prediction, i) =>
              sum + (prediction !== y[i] ? weights[i] : 0),
            0,
          );
          if (!best || error < best.error) best = { stump, error, predictions };
        }
    }
    if (!best) break;
    const clipped = Math.max(1e-9, Math.min(1 - 1e-9, best.error));
    const alpha =
      options.learningRate * 0.5 * Math.log((1 - clipped) / clipped);
    const before = [...weights];
    weights = weights.map(
      (weight, i) => weight * Math.exp(-alpha * y[i] * best!.predictions[i]),
    );
    const total = weights.reduce((sum, value) => sum + value, 0) || 1;
    weights = weights.map((value) => value / total);
    rounds.push({
      stump: best.stump,
      weightedError: best.error,
      alpha,
      weightsBefore: before,
      weightsAfter: [...weights],
      predictions: best.predictions,
    });
    if (options.earlyStopping && best.error <= 1e-9) break;
  }
  const scoreAtRound = (row: number[], count: number) =>
    rounds
      .slice(0, Math.max(0, Math.min(rounds.length, Math.round(count))))
      .reduce((sum, item) => sum + item.alpha * stumpVote(item.stump, row), 0);
  const predictAtRound = (row: number[], count: number) =>
    scoreAtRound(row, count) >= 0 ? 1 : 0;
  return {
    rounds,
    scoreAtRound,
    predictAtRound,
    score: (row) => scoreAtRound(row, rounds.length),
    predict: (row) => predictAtRound(row, rounds.length),
  };
}
