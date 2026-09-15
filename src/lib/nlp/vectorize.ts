import { emptyTokensMessage, preprocessDocument, type TextPrepOptions } from "./textPrep";

export interface VectorizerOptions extends Partial<TextPrepOptions> {
  binary?: boolean;
  minDf?: number;
  maxDf?: number;
  maxFeatures?: number;
  l2?: boolean;
  l1?: boolean;
}

export interface FittedVectorizer {
  vocabulary: string[];
  documentFrequency: Record<string, number>;
  nDocuments: number;
  binary: boolean;
  l2: boolean;
  l1: boolean;
  options: VectorizerOptions;
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length) throw new Error("Cosine similarity requires equal-length vectors.");
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function l2Normalize(row: number[]) {
  const n = Math.sqrt(row.reduce((s, v) => s + v * v, 0));
  if (n === 0) return row.map(() => 0);
  return row.map((v) => v / n);
}

export function l1Normalize(row: number[]) {
  const n = row.reduce((s, v) => s + Math.abs(v), 0);
  if (n === 0) return row.map(() => 0);
  return row.map((v) => v / n);
}

export function vectorNorm(row: number[], kind: "l1" | "l2" = "l2") {
  if (kind === "l1") return row.reduce((s, v) => s + Math.abs(v), 0);
  return Math.sqrt(row.reduce((s, v) => s + v * v, 0));
}

export function cosineParts(a: number[], b: number[]) {
  if (a.length !== b.length) throw new Error("Cosine similarity requires equal-length vectors.");
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const normA = Math.sqrt(na);
  const normB = Math.sqrt(nb);
  return { dot, normA, normB, cosine: normA === 0 || normB === 0 ? 0 : dot / (normA * normB) };
}

export function sparsity(matrix: number[][]) {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const total = rows * cols;
  const nnz = matrix.reduce((s, row) => s + row.filter((v) => v !== 0).length, 0);
  return { nnz, total, sparsity: total === 0 ? 0 : 1 - nnz / total };
}

export function oovStats(features: string[], vocabulary: string[]) {
  const known = new Set(vocabulary);
  const oov = features.filter((token) => !known.has(token));
  return { oovCount: oov.length, total: features.length, rate: features.length ? oov.length / features.length : 0, oov: [...new Set(oov)] };
}

function documentTokens(docs: string[], options: VectorizerOptions) {
  return docs.map((doc) => preprocessDocument(doc, options).features);
}

export function fitVocabulary(docs: string[], options: VectorizerOptions = {}): FittedVectorizer {
  const tokenized = documentTokens(docs, options);
  const df = new Map<string, number>();
  const tf = new Map<string, number>();
  tokenized.forEach((tokens) => {
    const unique = new Set(tokens);
    unique.forEach((term) => df.set(term, (df.get(term) ?? 0) + 1));
    tokens.forEach((term) => tf.set(term, (tf.get(term) ?? 0) + 1));
  });
  const minDf = options.minDf ?? 1;
  const maxDf = options.maxDf ?? Infinity;
  let vocabulary = [...df.entries()]
    .filter(([, count]) => count >= minDf && count <= maxDf)
    .map(([term]) => term)
    .sort((a, b) => a.localeCompare(b));
  if (options.maxFeatures && vocabulary.length > options.maxFeatures) {
    vocabulary = [...tf.entries()]
      .filter(([term]) => {
        const count = df.get(term) ?? 0;
        return count >= minDf && count <= maxDf;
      })
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, options.maxFeatures)
      .map(([term]) => term)
      .sort((a, b) => a.localeCompare(b));
  }
  const documentFrequency = Object.fromEntries(vocabulary.map((term) => [term, df.get(term) ?? 0]));
  return {
    vocabulary,
    documentFrequency,
    nDocuments: docs.length,
    binary: Boolean(options.binary),
    l2: Boolean(options.l2),
    l1: Boolean(options.l1),
    options,
  };
}

export function countVector(tokens: string[], model: FittedVectorizer) {
  const counts = new Map<string, number>();
  const oov: string[] = [];
  const known = new Set(model.vocabulary);
  tokens.forEach((token) => {
    if (!known.has(token)) {
      oov.push(token);
      return;
    }
    counts.set(token, (counts.get(token) ?? 0) + 1);
  });
  const row = model.vocabulary.map((term) => {
    const value = counts.get(term) ?? 0;
    return model.binary ? (value > 0 ? 1 : 0) : value;
  });
  return { row, oov: [...new Set(oov)] };
}

export function bagOfWordsMatrix(docs: string[], options: VectorizerOptions = {}) {
  const model = fitVocabulary(docs, options);
  const tokenized = documentTokens(docs, options);
  const matrix = tokenized.map((tokens) => countVector(tokens, model));
  return {
    ...model,
    matrix: matrix.map((item) => item.row),
    oov: matrix.map((item) => item.oov),
    messages: tokenized.map((tokens) => emptyTokensMessage(tokens)),
  };
}

export function idfValue(nDocuments: number, df: number) {
  return Math.log((1 + nDocuments) / (1 + df)) + 1;
}

export function transformTfIdf(docs: string[], model: FittedVectorizer) {
  const tokenized = documentTokens(docs, model.options);
  return tokenized.map((tokens) => {
    const counted = countVector(tokens, { ...model, binary: false });
    const raw = model.vocabulary.map((term, j) => counted.row[j] * idfValue(model.nDocuments, model.documentFrequency[term] ?? 0));
    const normalized = model.l1 ? l1Normalize(raw) : model.l2 ? l2Normalize(raw) : raw;
    return {
      raw,
      normalized: model.l1 ? l1Normalize(raw) : model.l2 ? l2Normalize(raw) : raw,
      tf: counted.row,
      oov: counted.oov,
      tokens,
    };
  });
}

export function tfidfMatrix(docs: string[], options: VectorizerOptions = {}) {
  const model = fitVocabulary(docs, options);
  const rows = transformTfIdf(docs, model);
  return { model, rows };
}

export function inspectTerm(docs: string[], model: FittedVectorizer, docIndex: number, term: string) {
  const tokens = documentTokens(docs, model.options)[docIndex] ?? [];
  const tf = tokens.filter((item) => item === term).length;
  const df = model.documentFrequency[term] ?? 0;
  const idf = idfValue(model.nDocuments, df);
  const raw = tf * idf;
  return { tf, df, n: model.nDocuments, idf, raw, inVocab: model.vocabulary.includes(term) };
}
