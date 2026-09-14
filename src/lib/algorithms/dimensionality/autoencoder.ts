import * as tf from "@tensorflow/tfjs";

export type AutoencoderArchitecture = "dense" | "shallow";
export interface AutoencoderResult {
  latent: number[][];
  reconstructions: number[][];
  traversal: number[][];
  losses: number[];
  mse: number;
  parameterCount: number;
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
): Promise<AutoencoderResult> {
  if (samples.length < 2 || !samples[0]?.length)
    throw new Error("Autoencoder training requires a non-empty sample matrix.");
  await tf.ready();
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
        activation: "sigmoid",
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
        ? tf.tidy(() =>
            clean
              .add(tf.randomNormal(clean.shape, 0, noiseStd))
              .clipByValue(0, 1),
          )
        : clean.clone(),
    losses: number[] = [];
  await model.fit(noisy, clean, {
    epochs,
    batchSize: Math.min(batchSize, samples.length),
    shuffle: true,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
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
  const latentInput = tf.input({ shape: [latentDimension] }),
    decodedHidden = model
      .getLayer("decoder_hidden")
      .apply(latentInput) as tf.SymbolicTensor,
    decodedOutput = model
      .getLayer("reconstruction")
      .apply(decodedHidden) as tf.SymbolicTensor,
    decoder = tf.model({ inputs: latentInput, outputs: decodedOutput }),
    minimum = Math.min(...latent.map((row) => row[0])),
    maximum = Math.max(...latent.map((row) => row[0])),
    traversalCodes = Array.from({ length: 7 }, (_, i) =>
      latent[0].map((value, dimension) =>
        dimension === 0 ? minimum + ((maximum - minimum) * i) / 6 : value,
      ),
    ),
    traversalInput = tf.tensor2d(traversalCodes),
    traversalTensor = decoder.predict(traversalInput) as tf.Tensor,
    traversal = (await traversalTensor.array()) as number[][];
  const mse =
      samples.reduce(
        (sum, row, i) =>
          sum +
          row.reduce(
            (inner, value, j) => inner + (value - reconstructions[i][j]) ** 2,
            0,
          ),
        0,
      ) /
      (samples.length * inputDimension),
    parameterCount = model.countParams();
  clean.dispose();
  noisy.dispose();
  reconstructionTensor.dispose();
  latentTensor.dispose();
  traversalInput.dispose();
  traversalTensor.dispose();
  // Encoder and decoder reuse layers owned by `model`; disposing all three
  // attempts to dispose the same shared layers more than once in TensorFlow.js.
  model.dispose();
  return { latent, reconstructions, traversal, losses, mse, parameterCount };
}
