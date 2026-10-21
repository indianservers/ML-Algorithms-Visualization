import type * as TF from "@tensorflow/tfjs";
import type { LayersModel, Tensor } from "@tensorflow/tfjs";
import { splitSeries, type ForecastResult } from "./engine";
import type { LabConfig, NeuralKind } from "./types";
export type StateFrame = {
  input: number;
  hidden: number[];
  cell: number[];
  gates: Record<string, number[]>;
};
export type TrainingEpoch = { epoch: number; loss: number; validation: number };
export type NeuralSession = {
  model: LayersModel;
  config: LabConfig;
  kind: NeuralKind;
  mean: number;
  scale: number;
  parameters: number;
  bytes: number;
  backend: string;
  frames: StateFrame[];
  predict: (history: number[], horizon: number) => Promise<number[]>;
  dispose: () => void;
  save: () => Promise<void>;
  export: () => Promise<void>;
};
const activate = (x: number, kind: string) =>
  kind === "relu" ? Math.max(0, x) : Math.tanh(x);
const sigmoid = (x: number) =>
  1 / (1 + Math.exp(-Math.max(-40, Math.min(40, x))));
/** TF.js uses [input, forget, candidate, output] for LSTM and [update, reset, candidate] for GRU. */
export function inspectCell(
  values: number[],
  kind: NeuralKind,
  units: number,
  activation: string,
  kernel: number[][],
  recurrent: number[][],
  bias: number[],
): StateFrame[] {
  let hidden = Array(units).fill(0),
    cell = Array(units).fill(0);
  const frames: StateFrame[] = [];
  for (const input of values) {
    const previous = [...hidden];
    const affine = (gate: number, j: number, state = previous) =>
      input * kernel[0][gate * units + j] +
      state.reduce((s, h, k) => s + h * recurrent[k][gate * units + j], 0) +
      (bias[gate * units + j] ?? 0);
    const gates: Record<string, number[]> = {};
    if (kind === "lstm") {
      const ig = Array.from({ length: units }, (_, j) => sigmoid(affine(0, j))),
        fg = Array.from({ length: units }, (_, j) => sigmoid(affine(1, j))),
        candidate = Array.from({ length: units }, (_, j) =>
          activate(affine(2, j), activation),
        ),
        og = Array.from({ length: units }, (_, j) => sigmoid(affine(3, j)));
      cell = cell.map((c, j) => fg[j] * c + ig[j] * candidate[j]);
      hidden = cell.map((c, j) => og[j] * activate(c, activation));
      Object.assign(gates, {
        Input: ig,
        Forget: fg,
        Candidate: candidate,
        Output: og,
      });
    } else if (kind === "gru") {
      const update = Array.from({ length: units }, (_, j) =>
          sigmoid(affine(0, j)),
        ),
        reset = Array.from({ length: units }, (_, j) => sigmoid(affine(1, j))),
        candidate = Array.from({ length: units }, (_, j) =>
          activate(
            affine(
              2,
              j,
              previous.map((h, k) => h * reset[k]),
            ),
            activation,
          ),
        );
      hidden = previous.map(
        (h, j) => update[j] * h + (1 - update[j]) * candidate[j],
      );
      Object.assign(gates, {
        Update: update,
        Reset: reset,
        Candidate: candidate,
      });
    } else
      hidden = Array.from({ length: units }, (_, j) =>
        activate(affine(0, j), activation),
      );
    frames.push({ input, hidden: [...hidden], cell: [...cell], gates });
  }
  return frames;
}
export async function createSession(
  tf: typeof TF,
  model: LayersModel,
  config: LabConfig,
  kind: NeuralKind,
  mean: number,
  scale: number,
  history: number[],
): Promise<NeuralSession> {
  const predict = async (values: number[], horizon: number) => {
    if (values.length < config.lookback)
      throw new Error("Not enough observations for this model lookback.");
    const window = values
        .slice(-config.lookback)
        .map((v) => (v - mean) / scale),
      forecast: number[] = [];
    for (let step = 0; step < horizon; step++) {
      const output = tf.tidy(
        () =>
          model.predict(tf.tensor3d(window, [1, config.lookback, 1])) as Tensor,
      );
      const next = (await output.data())[0];
      output.dispose();
      if (!Number.isFinite(next))
        throw new Error("Nonfinite model prediction. Lower the learning rate.");
      forecast.push(next * scale + mean);
      window.shift();
      window.push(next);
      if (step % 8 === 0) await tf.nextFrame();
    }
    return forecast;
  };
  const weights = model.layers[0].getWeights();
  const kernel = (await weights[0].array()) as number[][],
    recurrent = (await weights[1].array()) as number[][],
    bias = Array.from(await weights[2].data());
  const frames = inspectCell(
    history.slice(-config.lookback).map((v) => (v - mean) / scale),
    kind,
    config.units,
    config.activation,
    kernel,
    recurrent,
    bias,
  );
  const parameters = model.countParams();
  let disposed = false;
  const optimizer = model.optimizer;
  return {
    model,
    config: { ...config },
    kind,
    mean,
    scale,
    parameters,
    bytes: parameters * 4,
    backend: tf.getBackend(),
    frames,
    predict,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      model.dispose();
      optimizer?.dispose();
    },
    save: async () => {
      await model.save(`indexeddb://aimers-ts-${kind}`);
      localStorage.setItem(
        `aimers-ts-model-${kind}`,
        JSON.stringify({ config, kind, mean, scale }),
      );
    },
    export: async () => {
      await model.save(`downloads://aimers-${kind}-forecast`);
    },
  };
}
export async function trainNeural(
  values: number[],
  config: LabConfig,
  kind: NeuralKind,
  onEpoch: (epoch: TrainingEpoch) => void,
  signal: AbortSignal,
): Promise<{ session: NeuralSession; result: ForecastResult }> {
  const tf = await import("@tensorflow/tfjs");
  await tf.ready();
  const start = performance.now();
  const split = splitSeries(values, config.holdout);
  if (config.lookback >= split.train.length - 1)
    throw new Error(
      `Lookback ${config.lookback} leaves no training windows in ${split.train.length} training observations.`,
    );
  const mean =
    config.scaling === "standard"
      ? split.train.reduce((a, b) => a + b, 0) / split.train.length
      : config.scaling === "minmax"
        ? Math.min(...split.train)
        : 0;
  const scale =
    config.scaling === "standard"
      ? Math.sqrt(
          split.train.reduce((s, v) => s + (v - mean) ** 2, 0) /
            split.train.length,
        ) || 1
      : config.scaling === "minmax"
        ? Math.max(...split.train) - mean || 1
        : 1;
  const normalized = values.map((v) => (v - mean) / scale);
  const windows = (from: number, to: number) => {
    const xs: number[][][] = [],
      ys: number[][] = [];
    for (let i = Math.max(from, config.lookback); i < to; i += config.stride) {
      xs.push(normalized.slice(i - config.lookback, i).map((v) => [v]));
      ys.push([normalized[i]]);
    }
    if (!xs.length)
      throw new Error(
        "The selected split has no sequence windows. Reduce lookback or stride.",
      );
    return { xs: tf.tensor3d(xs), ys: tf.tensor2d(ys) };
  };
  const train = windows(config.lookback, split.trainEnd),
    validation = windows(split.trainEnd, split.origin);
  const model = tf.sequential();
  let best: Tensor[] = [];
  let bestLoss = Infinity,
    stale = 0;
  const abort = () => {
    model.stopTraining = true;
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    for (let layer = 0; layer < config.layers; layer++) {
      const args = {
        units: config.units,
        inputShape: layer === 0 ? [config.lookback, 1] : undefined,
        returnSequences: layer < config.layers - 1,
        activation: config.activation,
        recurrentActivation: "sigmoid" as const,
        kernelInitializer: tf.initializers.glorotUniform({
          seed: config.seed + layer,
        }),
        recurrentInitializer: tf.initializers.orthogonal({
          seed: config.seed + layer + 10,
        }),
        dropout: config.dropout,
        unitForgetBias: true,
      };
      model.add(
        kind === "lstm"
          ? tf.layers.lstm(args)
          : kind === "gru"
            ? tf.layers.gru(args)
            : tf.layers.simpleRNN(args),
      );
    }
    model.add(
      tf.layers.dense({
        units: 1,
        kernelInitializer: tf.initializers.glorotUniform({
          seed: config.seed + 100,
        }),
      }),
    );
    const optimizer =
      config.optimizer === "sgd"
        ? tf.train.sgd(config.learningRate)
        : config.optimizer === "rmsprop"
          ? tf.train.rmsprop(config.learningRate)
          : tf.train.adam(config.learningRate);
    model.compile({ optimizer, loss: config.loss });
    if (signal.aborted) throw new Error("Training cancelled.");
    await model.fit(train.xs, train.ys, {
      epochs: config.epochs,
      batchSize: config.batch,
      shuffle: false,
      validationData: [validation.xs, validation.ys],
      yieldEvery: "batch",
      callbacks: {
        onBatchEnd: async () => {
          if (signal.aborted) model.stopTraining = true;
          await tf.nextFrame();
        },
        onEpochEnd: async (epoch, logs) => {
          const loss = Number(logs?.loss),
            val = Number(logs?.val_loss);
          if (!Number.isFinite(loss) || !Number.isFinite(val)) {
            model.stopTraining = true;
            throw new Error(
              "Training diverged. Reduce learning rate or scale the target.",
            );
          }
          onEpoch({ epoch: epoch + 1, loss, validation: val });
          if (val < bestLoss - 1e-8) {
            bestLoss = val;
            stale = 0;
            best.forEach((t) => t.dispose());
            best = model.getWeights().map((t) => t.clone());
          } else stale++;
          if (
            signal.aborted ||
            (config.earlyStopping && stale >= config.patience)
          )
            model.stopTraining = true;
          await tf.nextFrame();
        },
      },
    });
    if (signal.aborted) throw new Error("Training cancelled.");
    if (config.earlyStopping && best.length) model.setWeights(best);
    const session = await createSession(
      tf,
      model,
      config,
      kind,
      mean,
      scale,
      split.history,
    );
    const forecast = await session.predict(split.history, config.horizon);
    return {
      session,
      result: {
        fitted: [],
        forecast,
        lower: [],
        upper: [],
        components: {},
        params: session.parameters,
        memory: session.bytes,
        duration: performance.now() - start,
        note: `Real TensorFlow.js ${kind.toUpperCase()}, ${config.layers} recurrent layer(s). Training uses only the training prefix; validation targets occur strictly after it. Scaler fits training values only. Recursive point forecasts; no calibrated neural prediction interval is available. Weight storage: float32, excluding activations/optimizer/browser overhead.`,
      },
    };
  } catch (error) {
    model.optimizer?.dispose();
    model.dispose();
    throw error;
  } finally {
    train.xs.dispose();
    train.ys.dispose();
    validation.xs.dispose();
    validation.ys.dispose();
    best.forEach((t) => t.dispose());
    signal.removeEventListener("abort", abort);
  }
}
export async function reloadNeural(kind: NeuralKind, history: number[]) {
  const metadata = JSON.parse(
    localStorage.getItem(`aimers-ts-model-${kind}`) ?? "null",
  );
  if (!metadata) throw new Error("No saved model for this architecture.");
  const tf = await import("@tensorflow/tfjs");
  const model = await tf.loadLayersModel(`indexeddb://aimers-ts-${kind}`);
  return createSession(
    tf,
    model,
    metadata.config,
    kind,
    metadata.mean,
    metadata.scale,
    history,
  );
}
