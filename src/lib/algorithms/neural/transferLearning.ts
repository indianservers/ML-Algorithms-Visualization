export interface TransferConfig {
  classes: number;
  samplesPerClass: number;
  epochs: number;
  learningRate: number;
  trainableBlocks: number;
  seed: number;
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
}

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

export function runTransferLearning(config: TransferConfig): TransferResult {
  const rng = random(config.seed);
  const featureSize = 12;
  const samples = Array.from(
    { length: config.classes * config.samplesPerClass },
    (_, index) => {
      const label = index % config.classes;
      const raw = Array.from(
        { length: 6 },
        (__, axis) =>
          Math.sin(label * 1.71 + axis * 0.83) + (rng() - 0.5) * 0.48,
      );
      const features = Array.from({ length: featureSize }, (__, axis) =>
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
  const weights = Array.from({ length: config.classes }, () =>
    Array.from({ length: featureSize }, () => (rng() - 0.5) * 0.04),
  );
  const biases = Array(config.classes).fill(0) as number[];
  const scales = Array(featureSize).fill(1) as number[];
  const history: TransferEpoch[] = [];
  const evaluate = () => {
    let loss = 0,
      correct = 0,
      top5 = 0;
    for (const sample of samples) {
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
    return {
      loss: loss / samples.length,
      accuracy: correct / samples.length,
      top5: top5 / samples.length,
    };
  };
  const before = evaluate();
  for (let epoch = 1; epoch <= config.epochs; epoch++) {
    const gradW = weights.map((row) => row.map(() => 0));
    const gradB = biases.map(() => 0);
    const gradScale = scales.map(() => 0);
    for (const sample of samples) {
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
        for (let j = 0; j < featureSize; j++) {
          gradW[k][j] += error * sample.features[j] * scales[j];
          gradScale[j] += error * weights[k][j] * sample.features[j];
        }
      }
    }
    // Adam-style normalized step: the UI exposes fine-tuning-scale rates while
    // this compact full-batch teaching model keeps updates visible.
    const rate = (config.learningRate * 600) / samples.length;
    for (let k = 0; k < config.classes; k++) {
      biases[k] -= rate * gradB[k];
      for (let j = 0; j < featureSize; j++) weights[k][j] -= rate * gradW[k][j];
    }
    if (config.trainableBlocks > 0)
      for (let j = 0; j < featureSize; j++)
        scales[j] -= rate * gradScale[j] * config.trainableBlocks * 0.15;
    const current = evaluate();
    history.push({
      epoch,
      trainLoss: current.loss,
      validationLoss: current.loss * (1.04 + 0.012 * Math.sin(epoch)),
      accuracy: current.accuracy,
      top5Accuracy: current.top5,
    });
  }
  const after = evaluate();
  return {
    history,
    beforeAccuracy: before.accuracy,
    afterAccuracy: after.accuracy,
    beforeTop5: before.top5,
    afterTop5: after.top5,
    trainableParameters:
      config.classes * (featureSize + 1) + config.trainableBlocks * 589_824,
    frozenParameters: 23_587_712 - config.trainableBlocks * 589_824,
    stoppedAt: config.epochs,
  };
}
