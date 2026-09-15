export { tokenizeText as tokenize } from "../../nlp/textPrep";
export { fitVocabulary, tfidfMatrix, bagOfWordsMatrix, idfValue } from "../../nlp/vectorize";

import { tfidfMatrix } from "../../nlp/vectorize";

export function computeTFIDF(rawDocs: string[]) {
  const { model, rows } = tfidfMatrix(rawDocs, { lowercase: true, stripPunctuation: true, l2: false });
  const tfMatrix = rows.map((row) =>
    Object.fromEntries(model.vocabulary.map((term, j) => [term, row.tf[j]])),
  );
  const idf = Object.fromEntries(model.vocabulary.map((term) => [term, Math.log((1 + model.nDocuments) / (1 + (model.documentFrequency[term] ?? 0))) + 1]));
  const tfidf = rows.map((row) => Object.fromEntries(model.vocabulary.map((term, j) => [term, row.raw[j]])));
  const topKeywords = tfidf.map((row) =>
    Object.entries(row)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, score]) => ({ term, score: Number(score.toFixed(4)) })),
  );
  return { vocabulary: model.vocabulary, tfMatrix, idf, tfidfMatrix: tfidf, topKeywords };
}

export function buildVocabulary(docs: string[][]) {
  return [...new Set(docs.flat())].sort();
}
