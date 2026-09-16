export type ImageMatrix = number[][];

export function convolve2d(
  image: ImageMatrix,
  kernel: ImageMatrix,
  stride = 1,
  padding = 0,
  dilation = 1,
  bias = 0,
): ImageMatrix {
  if (
    !image.length ||
    !image[0]?.length ||
    !kernel.length ||
    !kernel[0]?.length
  )
    throw new Error(
      "Convolution requires non-empty image and kernel matrices.",
    );
  const paddedHeight = image.length + padding * 2,
    paddedWidth = image[0].length + padding * 2,
    padded = Array.from({ length: paddedHeight }, (_, row) =>
      Array.from({ length: paddedWidth }, (_, column) =>
        row >= padding &&
        row < image.length + padding &&
        column >= padding &&
        column < image[0].length + padding
          ? image[row - padding][column - padding]
          : 0,
      ),
    ),
    effectiveKernelHeight = (kernel.length - 1) * dilation + 1,
    effectiveKernelWidth = (kernel[0].length - 1) * dilation + 1,
    outputHeight =
      Math.floor((paddedHeight - effectiveKernelHeight) / stride) + 1,
    outputWidth = Math.floor((paddedWidth - effectiveKernelWidth) / stride) + 1;
  if (outputHeight < 1 || outputWidth < 1)
    throw new Error("The effective kernel is larger than the padded image.");
  return Array.from({ length: outputHeight }, (_, outputRow) =>
    Array.from(
      { length: outputWidth },
      (_, outputColumn) =>
        bias +
        kernel.reduce(
          (sum, kernelRow, row) =>
            sum +
            kernelRow.reduce(
              (inner, weight, column) =>
                inner +
                weight *
                  padded[outputRow * stride + row * dilation][
                    outputColumn * stride + column * dilation
                  ],
              0,
            ),
          0,
        ),
    ),
  );
}

export const reluMatrix = (matrix: ImageMatrix): ImageMatrix =>
  matrix.map((row) => row.map((value) => Math.max(0, value)));

export function maxPool2d(matrix: ImageMatrix, size = 2): ImageMatrix {
  return Array.from({ length: Math.floor(matrix.length / size) }, (_, row) =>
    Array.from({ length: Math.floor(matrix[0].length / size) }, (_, column) => {
      let maximum = -Infinity;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
          maximum = Math.max(
            maximum,
            matrix[row * size + y][column * size + x],
          );
      return maximum;
    }),
  );
}

export function convolutionPatch(
  image: ImageMatrix,
  kernel: ImageMatrix,
  outputRow: number,
  outputColumn: number,
  stride = 1,
  padding = 0,
  dilation = 1,
  bias = 0,
) {
  const patch = kernel.map((row, ky) =>
    row.map((_, kx) => {
      const y = outputRow * stride + ky * dilation - padding;
      const x = outputColumn * stride + kx * dilation - padding;
      if (y >= 0 && y < image.length && x >= 0 && x < (image[0]?.length ?? 0))
        return image[y][x];
      return 0;
    }),
  );
  const products = kernel.map((row, ky) =>
    row.map((weight, kx) => weight * patch[ky][kx]),
  );
  const sum = products.flat().reduce((total, value) => total + value, 0);
  return { patch, products, sum, bias, output: sum + bias };
}

export function normalizeFeatureMap(matrix: ImageMatrix): ImageMatrix {
  const values = matrix.flat(),
    minimum = Math.min(...values),
    maximum = Math.max(...values),
    range = maximum - minimum || 1;
  return matrix.map((row) => row.map((value) => (value - minimum) / range));
}

function nextUnit(seed: { value: number }) {
  seed.value = (seed.value * 1664525 + 1013904223) >>> 0;
  return seed.value / 0xffffffff;
}

export function makeKernelBank(
  filters: number,
  inChannels: number,
  seed = 1,
  size = 3,
): ImageMatrix[][] {
  const state = { value: seed >>> 0 || 1 };
  return Array.from({ length: filters }, () =>
    Array.from({ length: inChannels }, () =>
      Array.from({ length: size }, () =>
        Array.from({ length: size }, () => (nextUnit(state) - 0.5) * 1.4),
      ),
    ),
  );
}

export function makeDenseWeights(outputs: number, inputs: number, seed: number) {
  const state = { value: seed >>> 0 || 1 };
  const scale = Math.sqrt(2 / inputs);
  const weights = Array.from({ length: outputs }, () =>
    Array.from({ length: inputs }, () => (nextUnit(state) - 0.5) * 2 * scale),
  );
  const bias = Array.from({ length: outputs }, () => (nextUnit(state) - 0.5) * 0.1);
  return { weights, bias };
}

export function convolveVolume(
  volume: ImageMatrix[],
  kernels: ImageMatrix[],
  stride = 1,
  padding = 0,
  bias = 0,
): ImageMatrix {
  const maps = volume.map((channel, index) =>
    convolve2d(channel, kernels[index] ?? kernels[0], stride, padding, 1, 0),
  );
  return maps[0].map((row, y) =>
    row.map((_, x) => bias + maps.reduce((sum, map) => sum + map[y][x], 0)),
  );
}

export function applyBank(
  volume: ImageMatrix[],
  bank: ImageMatrix[][],
  stride = 1,
  padding = 0,
  biases?: number[],
): ImageMatrix[] {
  return bank.map((kernels, index) =>
    convolveVolume(volume, kernels, stride, padding, biases?.[index] ?? 0),
  );
}

export const reluVolume = (volume: ImageMatrix[]) => volume.map(reluMatrix);

export function maxPoolVolume(volume: ImageMatrix[], size = 2) {
  return volume.map((map) => maxPool2d(map, size));
}

export function batchNormVolume(volume: ImageMatrix[]) {
  return volume.map((map) => {
    const values = map.flat();
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance =
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    const scale = Math.sqrt(variance + 1e-5);
    return map.map((row) => row.map((value) => (value - mean) / scale));
  });
}

export function flattenVolume(volume: ImageMatrix[]) {
  return volume.flatMap((map) => map.flat());
}

export function denseForward(
  input: number[],
  weights: number[][],
  bias: number[],
  activate: "relu" | "none" = "none",
) {
  return weights.map((row, index) => {
    const logit = bias[index] + row.reduce((sum, weight, i) => sum + weight * (input[i] ?? 0), 0);
    return activate === "relu" ? Math.max(0, logit) : logit;
  });
}

export function softmax(logits: number[]) {
  const peak = Math.max(...logits);
  const exps = logits.map((value) => Math.exp(value - peak));
  const total = exps.reduce((sum, value) => sum + value, 0) || 1;
  return exps.map((value) => value / total);
}

export function volumeStats(volume: ImageMatrix[]) {
  const values = volume.flatMap((map) => map.flat());
  const mean = values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean,
    zeros: values.filter((value) => value <= 0).length / (values.length || 1),
  };
}
