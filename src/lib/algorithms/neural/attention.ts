export interface AttentionResult {
  embeddings: number[][];
  query: number[][];
  key: number[][];
  value: number[][];
  scores: number[][];
  weights: number[][];
  output: number[][];
}

export interface MultiHeadAttentionResult {
  heads: AttentionResult[];
  averageWeights: number[][];
  concatenated: number[][];
  projected: number[][];
  headDim: number;
}

const hash = (token: string) =>
  [...token].reduce(
    (sum, character, index) => sum + character.charCodeAt(0) * (index + 3),
    11,
  );

export function embedTokens(tokens: string[], dimension: number): number[][] {
  return tokens.map((token, position) =>
    Array.from({ length: dimension }, (_, feature) =>
      Math.sin(hash(token) * 0.037 + (position + 1) * 0.29 + (feature + 1) * 0.73),
    ),
  );
}

export function projectionMatrix(
  rows: number,
  cols: number,
  salt: number,
): number[][] {
  const scale = Math.sqrt(2 / (rows + cols));
  return Array.from({ length: rows }, (_, i) =>
    Array.from(
      { length: cols },
      (_, j) => Math.sin((i + 1) * (j + 2) * 0.41 + salt) * scale,
    ),
  );
}

export function matMul(a: number[][], b: number[][]): number[][] {
  const width = b[0]?.length ?? 0;
  return a.map((row) =>
    Array.from({ length: width }, (_, j) =>
      row.reduce((sum, value, k) => sum + value * (b[k]?.[j] ?? 0), 0),
    ),
  );
}

export function softmaxRow(row: number[]): number[] {
  const finite = row.filter(Number.isFinite);
  const maximum = finite.length ? Math.max(...finite) : 0;
  const exponential = row.map((score) =>
    Number.isFinite(score) ? Math.exp(score - maximum) : 0,
  );
  const total = exponential.reduce((sum, value) => sum + value, 0) || 1;
  return exponential.map((value) => value / total);
}

export function scaledDotProductAttention(
  query: number[][],
  key: number[][],
  value: number[][],
  causal = false,
  temperature = 1,
): { scores: number[][]; weights: number[][]; output: number[][] } {
  const dk = query[0]?.length || 1;
  const scale = Math.sqrt(dk) * Math.max(0.1, temperature);
  const scores = query.map((q, row) =>
    key.map((k, column) => {
      if (causal && column > row) return Number.NEGATIVE_INFINITY;
      return (
        q.reduce((sum, value, i) => sum + value * k[i], 0) / scale
      );
    }),
  );
  const weights = scores.map(softmaxRow);
  const output = weights.map((row) =>
    Array.from({ length: value[0].length }, (_, feature) =>
      row.reduce((sum, weight, index) => sum + weight * value[index][feature], 0),
    ),
  );
  return { scores, weights, output };
}

export function runAttention(
  tokens: string[],
  layer: number,
  head: number,
  temperature = 1,
  causal = false,
  dimension = 8,
): AttentionResult {
  if (!tokens.length) {
    return {
      embeddings: [],
      query: [],
      key: [],
      value: [],
      scores: [],
      weights: [],
      output: [],
    };
  }
  const embeddings = embedTokens(tokens, dimension);
  const WQ = projectionMatrix(dimension, dimension, layer * 1.7 + head * 0.2);
  const WK = projectionMatrix(dimension, dimension, layer * 1.7 + head * 1.7);
  const WV = projectionMatrix(dimension, dimension, layer * 1.7 + head * 3.1);
  const query = matMul(embeddings, WQ);
  const key = matMul(embeddings, WK);
  const value = matMul(embeddings, WV);
  const { scores, weights, output } = scaledDotProductAttention(
    query,
    key,
    value,
    causal,
    temperature,
  );
  return { embeddings, query, key, value, scores, weights, output };
}

export function runMultiHeadAttention(
  tokens: string[],
  headCount: number,
  temperature: number,
  causal: boolean,
  dropout: number,
  bias: boolean,
  modelDim = 64,
  outputDropout = 0,
): MultiHeadAttentionResult {
  if (!Number.isInteger(headCount) || headCount < 1) {
    throw new Error("Head count must be a positive integer.");
  }
  if (modelDim % headCount !== 0) {
    throw new Error("Embedding dimension must be divisible by the number of heads.");
  }
  const headDim = modelDim / headCount;
  const embeddings = embedTokens(tokens, modelDim);
  const salt = (bias ? 1 : 0) + modelDim * 0.01;
  const WQ = projectionMatrix(modelDim, modelDim, 2.1 + salt);
  const WK = projectionMatrix(modelDim, modelDim, 4.7 + salt);
  const WV = projectionMatrix(modelDim, modelDim, 8.3 + salt);
  const WO = projectionMatrix(modelDim, modelDim, 11.9 + salt);
  const Q = matMul(embeddings, WQ);
  const K = matMul(embeddings, WK);
  const V = matMul(embeddings, WV);
  const heads = Array.from({ length: headCount }, (_, head) => {
    const slice = (matrix: number[][]) =>
      matrix.map((row) => row.slice(head * headDim, (head + 1) * headDim));
    const query = slice(Q);
    const key = slice(K);
    const value = slice(V);
    const { scores, weights, output } = scaledDotProductAttention(
      query,
      key,
      value,
      causal,
      temperature,
    );
    const dropped =
      dropout <= 0
        ? weights
        : weights.map((row, r) => {
            const masked = row.map((weight, c) => {
              const keep =
                Math.sin((r + 1) * 17 + (c + 1) * 11 + head * 7) >
                dropout * 2 - 1;
              return keep ? weight : 0;
            });
            const total = masked.reduce((sum, value) => sum + value, 0);
            return total > 0
              ? masked.map((value) => value / total)
              : softmaxRow(row);
          });
    const droppedOutput =
      dropout <= 0
        ? output
        : dropped.map((row) =>
            Array.from({ length: headDim }, (_, feature) =>
              row.reduce(
                (sum, weight, index) => sum + weight * value[index][feature],
                0,
              ),
            ),
          );
    return {
      embeddings: slice(embeddings),
      query,
      key,
      value,
      scores,
      weights: dropped,
      output: droppedOutput,
    };
  });
  const averageWeights = tokens.map((_, row) =>
    tokens.map(
      (__, column) =>
        heads.reduce((sum, head) => sum + head.weights[row][column], 0) /
        headCount,
    ),
  );
  const concatenated = tokens.map((_, row) =>
    heads.flatMap((head) => head.output[row]),
  );
  const projectedRaw = matMul(concatenated, WO);
  const projected =
    outputDropout <= 0
      ? projectedRaw
      : projectedRaw.map((row, r) =>
          row.map((value, c) => {
            const keep =
              Math.sin((r + 1) * 13 + (c + 1) * 19 + modelDim) >
              outputDropout * 2 - 1;
            return keep ? value / Math.max(1e-6, 1 - outputDropout) : 0;
          }),
        );
  return { heads, averageWeights, concatenated, projected, headDim };
}
