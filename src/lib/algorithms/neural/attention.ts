export interface AttentionResult {
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
}

const hash = (token: string) =>
  [...token].reduce(
    (sum, character, index) => sum + character.charCodeAt(0) * (index + 3),
    11,
  );
const dot = (a: number[], b: number[]) =>
  a.reduce((sum, value, index) => sum + value * b[index], 0);

export function runAttention(
  tokens: string[],
  layer: number,
  head: number,
  temperature = 1,
  causal = false,
): AttentionResult {
  const dimension = 8;
  const embedding = tokens.map((token, position) =>
    Array.from({ length: dimension }, (_, feature) =>
      Math.sin(
        hash(token) * 0.037 + (position + 1) * 0.29 + (feature + 1) * 0.73,
      ),
    ),
  );
  const project = (salt: number) =>
    embedding.map((row) =>
      Array.from({ length: dimension }, (_, output) =>
        row.reduce(
          (sum, value, input) =>
            sum +
            (value *
              Math.sin(
                (input + 1) * (output + 2) * 0.41 +
                  layer * 0.31 +
                  head * 0.53 +
                  salt,
              )) /
              Math.sqrt(dimension),
          0,
        ),
      ),
    );
  const query = project(0.2),
    key = project(1.7),
    value = project(3.1);
  const scores = query.map((q, row) =>
    key.map((k, column) =>
      causal && column > row
        ? -Infinity
        : dot(q, k) / Math.sqrt(dimension) / Math.max(0.1, temperature),
    ),
  );
  const weights = scores.map((row) => {
    const finite = row.filter(Number.isFinite),
      maximum = Math.max(...finite);
    const exponential = row.map((score) =>
      Number.isFinite(score) ? Math.exp(score - maximum) : 0,
    );
    const total = exponential.reduce((sum, value) => sum + value, 0);
    return exponential.map((value) => value / total);
  });
  const output = weights.map((row) =>
    Array.from({ length: dimension }, (_, feature) =>
      row.reduce(
        (sum, weight, index) => sum + weight * value[index][feature],
        0,
      ),
    ),
  );
  return { query, key, value, scores, weights, output };
}

export function runMultiHeadAttention(
  tokens: string[],
  headCount: number,
  temperature: number,
  causal: boolean,
  dropout: number,
  bias: boolean,
  modelDim = 512,
): MultiHeadAttentionResult {
  const heads = Array.from({ length: headCount }, (_, index) =>
    runAttention(
      tokens,
      modelDim / 128 + (bias ? 1 : 0),
      index + 1,
      temperature,
      causal,
    ),
  );
  const averageWeights = tokens.map((_, row) =>
    tokens.map(
      (__, column) =>
        heads.reduce((sum, head, index) => {
          const keep =
            Math.sin((row + 1) * 17 + (column + 1) * 11 + index * 7) >
            dropout * 2 - 1;
          return sum + (keep ? head.weights[row][column] : 0);
        }, 0) / headCount,
    ),
  );
  const concatenated = tokens.map((_, row) =>
    heads.flatMap((head) => head.output[row]),
  );
  return { heads, averageWeights, concatenated };
}
