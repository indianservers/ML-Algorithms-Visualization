import * as tf from "@tensorflow/tfjs";
import { reconstructionMse } from "../../dimensionality/dimensionalityPrep";

export type AutoencoderArchitecture = "dense" | "shallow";
export type AutoencoderOutput = "sigmoid" | "linear";
export interface AutoencoderResult {
  latent: number[][];
  reconstructions: number[][];
  traversal: number[][];
  losses: number[];
  mse: number;
  parameterCount: number;
  encoderWeights: { kernel: number[][]; bias: number[] }[];
  sampleErrors: number[];
}

function denseForward(input: number[], kernel: number[][], bias: number[], activation: "relu" | "linear" | "sigmoid") {
  const units = bias.length;
  const out = Array.from({ length: units }, (_, u) => {
    let sum = bias[u];
    for (let i = 0; i < input.length; i += 1) sum += input[i] * kernel[i][u];
    if (activation === "relu") return Math.max(0, sum);
    if (activation === "sigmoid") return 1 / (1 + Math.exp(-sum));
    return sum;
  });
  return out;
}

export function encodeWithWeights(samples: number[][], weights: AutoencoderResult["encoderWeights"]) {
  return samples.map((row) => {
    let current = row;
    weights.forEach((layer, index) => {
      const last = index === weights.length - 1;
      current = denseForward(current, layer.kernel, layer.bias, last ? "linear" : "relu");
    });
    return current;
  });
}

export async function trainAutoencoder(
  samples: number[][],
  latentDimension = 2,
  noiseStd = 0,
  architecture: AutoencoderArchitecture = "dense",
  learningRate = 0.001,
  batchSize = 32,
  epochs = 12,
  onEpoch?: (epoch: number, loss: number) => void,
  options?: {
    outputActivation?: AutoencoderOutput;
    shouldStop?: () => boolean;
  },
): Promise<AutoencoderResult> {
  if (samples.length < 2 || !samples[0]?.length)
    throw new Error("Autoencoder training requires a non-empty sample matrix.");
  await tf.ready();
  const outputActivation = options?.outputActivation ?? "sigmoid";
  const inputDimension = samples[0].length,
    input = tf.input({ shape: [inputDimension] }),
    hiddenUnits =
      architecture === "dense"
        ? Math.min(64, Math.max(16, Math.floor(inputDimension / 2)))
        : Math.min(32, Math.max(8, Math.floor(inputDimension / 4))),
    hidden = tf.layers
      .dense({ units: hiddenUnits, activation: "relu", name: "encoder_hidden" })
      .apply(input) as tf.SymbolicTensor,
    encoded = tf.layers
      .dense({ units: latentDimension, activation: "linear", name: "latent" })
      .apply(hidden) as tf.SymbolicTensor,
    decoderHidden = tf.layers
      .dense({ units: hiddenUnits, activation: "relu", name: "decoder_hidden" })
      .apply(encoded) as tf.SymbolicTensor,
    output = tf.layers
      .dense({
        units: inputDimension,
        activation: outputActivation,
        name: "reconstruction",
      })
      .apply(decoderHidden) as tf.SymbolicTensor,
    model = tf.model({ inputs: input, outputs: output }),
    encoder = tf.model({ inputs: input, outputs: encoded });
  model.compile({
    optimizer: tf.train.adam(learningRate),
    loss: "meanSquaredError",
  });
  const clean = tf.tensor2d(samples),
    noisy =
      noiseStd > 0
        ? tf.tidy(() => {
            const jittered = clean.add(tf.randomNormal(clean.shape, 0, noiseStd));
            return outputActivation === "sigmoid" ? jittered.clipByValue(0, 1) : jittered;
          })
        : clean.clone(),
    losses: number[] = [];
  await model.fit(noisy, clean, {
    epochs,
    batchSize: Math.min(batchSize, samples.length),
    shuffle: true,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (options?.shouldStop?.()) {
          model.stopTraining = true;
          return;
        }
        const loss = Number(logs?.loss || 0);
        losses.push(loss);
        onEpoch?.(epoch + 1, loss);
        await tf.nextFrame();
      },
    },
  });
  const reconstructionTensor = model.predict(clean) as tf.Tensor,
    latentTensor = encoder.predict(clean) as tf.Tensor,
    reconstructions = (await reconstructionTensor.array()) as number[][],
    latent = (await latentTensor.array()) as number[][];
  const hiddenLayer = model.getLayer("encoder_hidden") as tf.layers.Layer;
  const latentLayer = model.getLayer("latent") as tf.layers.Layer;
  const hiddenWeights = hiddenLayer.getWeights();
  const latentWeights = latentLayer.getWeights();
  const encoderWeights = [
    {
      kernel: (await hiddenWeights[0].array()) as number[][],
      bias: (await hiddenWeights[1].array()) as number[],
    },
    {
      kernel: (await latentWeights[0].array()) as number[][],
      bias: (await latentWeights[1].array()) as number[],
    },
  ];
  const minimum = Math.min(...latent.map((row) => row[0]));
  const maximum = Math.max(...latent.map((row) => row[0]));
  const traversalCodes = Array.from({ length: 7 }, (_, i) =>
    latent[0].map((value, dimension) =>
      dimension === 0 ? minimum + ((maximum - minimum) * i) / 6 : value,
    ),
  );
  const traversalInput = tf.tensor2d(traversalCodes);
  const traversalHidden = model.getLayer("decoder_hidden").apply(traversalInput) as tf.Tensor;
  const traversalTensor = model.getLayer("reconstruction").apply(traversalHidden) as tf.Tensor;
  const traversal = (await traversalTensor.array()) as number[][];
  const mse = reconstructionMse(samples, reconstructions);
  const sampleErrors = samples.map((row, i) =>
    row.reduce((sum, value, j) => sum + (value - reconstructions[i][j]) ** 2, 0) / row.length,
  );
  const parameterCount = model.countParams();
  reconstructionTensor.dispose();
  latentTensor.dispose();
  traversalInput.dispose();
  traversalHidden.dispose();
  traversalTensor.dispose();
  clean.dispose();
  noisy.dispose();
  model.dispose();
  return { latent, reconstructions, traversal, losses, mse, parameterCount, encoderWeights, sampleErrors };
}
