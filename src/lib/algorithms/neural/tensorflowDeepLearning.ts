import * as tf from "@tensorflow/tfjs";

export type TensorFlowLabMode = "cnn" | "rnn" | "lstm" | "gru";

export function imageSample(index: number) {
  const label = index % 2;
  const values = Array.from({ length: 64 }, (_, i) => {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const signal =
      label === 1 ? Math.abs(col - 3.5) < 1.1 : Math.abs(row - 3.5) < 1.1;
    const noise = ((Math.sin(index * 17 + i * 3) + 1) / 2) * 0.18;
    return signal ? 0.82 + noise : noise;
  });
  return { values, label };
}

export function sequenceSample(index: number) {
  const label = index % 2;
  const values = Array.from({ length: 12 }, (_, t) => {
    const trend = label === 1 ? t / 11 : 1 - t / 11;
    return trend + Math.sin(index * 0.9 + t) * 0.05;
  });
  return { values, label };
}

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
