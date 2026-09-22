import * as tf from "@tensorflow/tfjs";
import { imageSample, sequenceSample } from "./toySamples";

export type TensorFlowLabMode = "cnn" | "rnn" | "lstm" | "gru";
export { imageSample, sequenceSample } from "./toySamples";

export function makeTrainingData(mode: TensorFlowLabMode, samples: number) {
  if (mode === "cnn") {
    const rows = Array.from({ length: samples }, (_, i) => imageSample(i));
    return {
      xs: tf.tensor4d(
        rows.flatMap((row) => row.values),
        [samples, 8, 8, 1],
      ),
      ys: tf.tensor2d(
        rows.flatMap((row) => (row.label === 1 ? [0, 1] : [1, 0])),
        [samples, 2],
      ),
      rows,
    };
  }
  const rows = Array.from({ length: samples }, (_, i) => sequenceSample(i));
  return {
    xs: tf.tensor3d(
      rows.flatMap((row) => row.values),
      [samples, 12, 1],
    ),
    ys: tf.tensor2d(
      rows.flatMap((row) => (row.label === 1 ? [0, 1] : [1, 0])),
      [samples, 2],
    ),
    rows,
  };
}

export function buildModel(
  mode: TensorFlowLabMode,
  units: number,
  learningRate: number,
) {
  const model = tf.sequential();
  if (mode === "cnn") {
    model.add(
      tf.layers.conv2d({
        inputShape: [8, 8, 1],
        filters: units,
        kernelSize: 3,
        activation: "relu",
        padding: "same",
      }),
    );
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(
      tf.layers.conv2d({
        filters: units * 2,
        kernelSize: 3,
        activation: "relu",
        padding: "same",
      }),
    );
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 128, activation: "relu" }));
  } else {
    const recurrent =
      mode === "lstm"
        ? tf.layers.lstm({ inputShape: [12, 1], units })
        : mode === "gru"
          ? tf.layers.gru({ inputShape: [12, 1], units })
          : tf.layers.simpleRNN({ inputShape: [12, 1], units });
    model.add(recurrent);
  }
  model.add(tf.layers.dense({ units: 2, activation: "softmax" }));
  model.compile({
    optimizer: tf.train.adam(learningRate),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });
  return model;
}
