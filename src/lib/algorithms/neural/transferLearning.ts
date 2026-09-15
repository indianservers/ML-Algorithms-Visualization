export interface TransferConfig {
  classes: number;
  samplesPerClass: number;
  epochs: number;
  learningRate: number;
  trainableBlocks: number;
  seed: number;
  batchSize?: number;
  earlyStopping?: boolean;
  patience?: number;
}

export interface TransferEpoch {
  epoch: number;
  trainLoss: number;
  validationLoss: number;
  accuracy: number;
  top5Accuracy: number;
}

export interface TransferResult {
  history: TransferEpoch[];
  beforeAccuracy: number;
  afterAccuracy: number;
  beforeTop5: number;
  afterTop5: number;
  trainableParameters: number;
  frozenParameters: number;
  stoppedAt: number;
  extractorUpdated: boolean;
}

const FEATURE_SIZE = 12;

const random = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const softmax = (values: number[]) => {
  const max = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((value) => value / sum);
};

type Sample = { label: number; features: number[] };

export function runTransferLearning(config: TransferConfig): TransferResult {
  const rng = random(config.seed);
  const samples: Sample[] = Array.from(
    { length: config.classes * config.samplesPerClass },
    (_, index) => {
      const label = index % config.classes;
      const raw = Array.from(
        { length: 6 },
        (__, axis) =>
          Math.sin(label * 1.71 + axis * 0.83) + (rng() - 0.5) * 0.48,
      );
      const features = Array.from({ length: FEATURE_SIZE }, (__, axis) =>
        Math.tanh(
          raw.reduce(
            (sum, value, j) =>
              sum + value * Math.sin((j + 1) * (axis + 2) * 0.37),
            0,
          ),
        ),
      );
      return { label, features };
    },
  );
  const shuffled = [...samples].sort(() => rng() - 0.5);
  const split = Math.max(1, Math.floor(shuffled.length * 0.8));
  const trainSet = shuffled.slice(0, split);
  const valSet = shuffled.slice(split);
  const weights = Array.from({ length: config.classes }, () =>
    Array.from({ length: FEATURE_SIZE }, () => (rng() - 0.5) * 0.04),
  );
  const biases = Array(config.classes).fill(0) as number[];
  const scales = Array(FEATURE_SIZE).fill(1) as number[];
  const unfreezeExtractor = config.trainableBlocks > 0;
  const history: TransferEpoch[] = [];
  const evaluate = (subset: Sample[]) => {
    let loss = 0,
      correct = 0,
      top5 = 0;
    for (const sample of subset) {
      const logits = weights.map((row, k) =>
        row.reduce(
          (sum, value, j) => sum + value * sample.features[j] * scales[j],
          biases[k],
        ),
      );
      const probabilities = softmax(logits);
      loss -= Math.log(Math.max(1e-9, probabilities[sample.label]));
      const order = probabilities
        .map((value, index) => ({ value, index }))
        .sort((a, b) => b.value - a.value);
      if (order[0].index === sample.label) correct++;
      if (
        order
          .slice(0, Math.min(5, config.classes))
          .some((entry) => entry.index === sample.label)
      )
        top5++;
    }
    const n = Math.max(1, subset.length);
    return {
      loss: loss / n,
      accuracy: correct / n,
      top5: top5 / n,
    };
  };
  const before = evaluate(valSet.length ? valSet : trainSet);
  const batchSize = Math.max(
    1,
    Math.min(config.batchSize ?? trainSet.length, trainSet.length),
  );
  const frozenScales = [...scales];
  let bestVal = Number.POSITIVE_INFINITY;
  let wait = 0;
  const patience = Math.max(1, Math.round(config.patience ?? 5));
  for (let epoch = 1; epoch <= config.epochs; epoch++) {
    const order = [...trainSet.keys()].sort(() => rng() - 0.5);
    for (let start = 0; start < order.length; start += batchSize) {
      const batch = order.slice(start, start + batchSize).map((i) => trainSet[i]);
      const gradW = weights.map((row) => row.map(() => 0));
      const gradB = biases.map(() => 0);
      const gradScale = scales.map(() => 0);
      for (const sample of batch) {
        const logits = weights.map((row, k) =>
          row.reduce(
            (sum, value, j) => sum + value * sample.features[j] * scales[j],
            biases[k],
          ),
        );
        const probabilities = softmax(logits);
        for (let k = 0; k < config.classes; k++) {
          const error = probabilities[k] - (k === sample.label ? 1 : 0);
          gradB[k] += error;
          for (let j = 0; j < FEATURE_SIZE; j++) {
            gradW[k][j] += error * sample.features[j] * scales[j];
            gradScale[j] += error * weights[k][j] * sample.features[j];
          }
        }
      }
      const rate = (config.learningRate * 80) / Math.max(1, batch.length);
      for (let k = 0; k < config.classes; k++) {
        biases[k] -= rate * gradB[k];
        for (let j = 0; j < FEATURE_SIZE; j++) weights[k][j] -= rate * gradW[k][j];
      }
      if (unfreezeExtractor)
        for (let j = 0; j < FEATURE_SIZE; j++)
          scales[j] -= rate * gradScale[j] * Math.min(4, config.trainableBlocks) * 0.15;
    }
    const trainMetrics = evaluate(trainSet);
    const valMetrics = evaluate(valSet.length ? valSet : trainSet);
    history.push({
      epoch,
      trainLoss: trainMetrics.loss,
      validationLoss: valMetrics.loss,
      accuracy: valMetrics.accuracy,
      top5Accuracy: valMetrics.top5,
    });
    if (config.earlyStopping) {
      if (valMetrics.loss + 1e-9 < bestVal) {
        bestVal = valMetrics.loss;
        wait = 0;
      } else {
        wait += 1;
        if (wait >= patience) break;
      }
    }
  }
  const after = evaluate(valSet.length ? valSet : trainSet);
  const headParameters = config.classes * (FEATURE_SIZE + 1);
  const extractorParameters = FEATURE_SIZE;
  const scalesChanged = scales.some((value, i) => Math.abs(value - frozenScales[i]) > 1e-12);
  return {
    history,
    beforeAccuracy: before.accuracy,
    afterAccuracy: after.accuracy,
    beforeTop5: before.top5,
    afterTop5: after.top5,
    trainableParameters: headParameters + (unfreezeExtractor ? extractorParameters : 0),
    frozenParameters: unfreezeExtractor ? 0 : extractorParameters,
    stoppedAt: history.at(-1)?.epoch ?? 0,
    extractorUpdated: scalesChanged,
  };
}
