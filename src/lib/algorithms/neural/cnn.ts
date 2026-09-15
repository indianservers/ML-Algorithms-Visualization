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
