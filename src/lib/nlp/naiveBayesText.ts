import { preprocessDocument, type TextPrepOptions } from "./textPrep";

export interface NaiveBayesModel {
  labels: string[];
  vocabulary: string[];
  priors: Record<string, number>;
  tokenCounts: Record<string, Record<string, number>>;
  classTotals: Record<string, number>;
  alpha: number;
  nTrain: number;
  options: Partial<TextPrepOptions>;
}

export function stratifiedSplit<T extends { label: string }>(rows: T[], seed = 7, testRatio = 0.25) {
  const byLabel = new Map<string, T[]>();
  rows.forEach((row) => {
    const list = byLabel.get(row.label) ?? [];
    list.push(row);
    byLabel.set(row.label, list);
  });
  let state = seed >>> 0;
  const rand = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const train: T[] = [];
  const test: T[] = [];
  byLabel.forEach((group) => {
    const shuffled = [...group];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const nTest = Math.max(1, Math.floor(shuffled.length * testRatio));
    test.push(...shuffled.slice(0, nTest));
    train.push(...shuffled.slice(nTest));
  });
  return { train, test };
}

export function trainMultinomialNB(
  rows: Array<{ text: string; label: string }>,
  alpha = 1,
  options: Partial<TextPrepOptions> = {},
  maxVocab = 400,
): NaiveBayesModel {
  if (rows.length < 2) throw new Error("Naive Bayes needs labeled training documents.");
  const tokenized = rows.map((row) => ({ ...row, tokens: preprocessDocument(row.text, options).features }));
  const df = new Map<string, number>();
  tokenized.forEach((row) => row.tokens.forEach((token) => df.set(token, (df.get(token) ?? 0) + 1)));
  const vocabulary = [...df.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxVocab)
    .map(([term]) => term)
    .sort((a, b) => a.localeCompare(b));
  const known = new Set(vocabulary);
  const labels = [...new Set(rows.map((row) => row.label))].sort();
  const tokenCounts: Record<string, Record<string, number>> = {};
  const classTotals: Record<string, number> = {};
  const priors: Record<string, number> = {};
  labels.forEach((label) => {
    const members = tokenized.filter((row) => row.label === label);
    priors[label] = members.length / rows.length;
    tokenCounts[label] = {};
    let total = 0;
    members.forEach((row) => {
      row.tokens.forEach((token) => {
        if (!known.has(token)) return;
        tokenCounts[label][token] = (tokenCounts[label][token] ?? 0) + 1;
        total += 1;
      });
    });
    classTotals[label] = total;
  });
  return { labels, vocabulary, priors, tokenCounts, classTotals, alpha, nTrain: rows.length, options };
}

export function logLikelihood(model: NaiveBayesModel, label: string, token: string) {
  const count = model.tokenCounts[label]?.[token] ?? 0;
  const total = model.classTotals[label] ?? 0;
  return Math.log((count + model.alpha) / (total + model.alpha * model.vocabulary.length));
}

export function predictMultinomialNB(
  text: string,
  model: NaiveBayesModel,
  options: Partial<TextPrepOptions> = model.options ?? {},
) {
  const tokens = preprocessDocument(text, options).features.filter((token) => model.vocabulary.includes(token));
  const logScores = model.labels.map((label) => {
    const prior = Math.log(Math.max(1e-12, model.priors[label] ?? 0));
    const likelihood = tokens.reduce((sum, token) => sum + logLikelihood(model, label, token), 0);
    return { label, score: prior + likelihood, prior, likelihood };
  });
  const max = Math.max(...logScores.map((item) => item.score));
  const exp = logScores.map((item) => ({ ...item, value: Math.exp(item.score - max) }));
  const total = exp.reduce((sum, item) => sum + item.value, 0) || 1;
  const probabilities = exp.map((item) => ({
    label: item.label,
    probability: item.value / total,
    logScore: item.score,
    logPrior: item.prior,
    logLikelihood: item.likelihood,
  }));
  const best = probabilities.reduce((a, b) => (a.probability >= b.probability ? a : b));
  const contributions = tokens.map((token) => ({
    token,
    values: Object.fromEntries(model.labels.map((label) => [label, logLikelihood(model, label, token)])),
  }));
  return { ...best, probabilities, contributions, tokens, oovIgnored: preprocessDocument(text, options).features.filter((t) => !model.vocabulary.includes(t)) };
}

export function classificationMetrics(actual: string[], predicted: string[]) {
  const labels = [...new Set([...actual, ...predicted])].sort();
  const matrix = labels.map((row) => labels.map((col) => actual.filter((a, i) => a === row && predicted[i] === col).length));
  const accuracy = actual.filter((label, i) => label === predicted[i]).length / Math.max(actual.length, 1);
  const perClass = labels.map((label, i) => {
    const tp = matrix[i][i];
    const fp = matrix.reduce((s, row) => s + row[i], 0) - tp;
    const fn = matrix[i].reduce((s, v) => s + v, 0) - tp;
    const precision = tp / (tp + fp || 1);
    const recall = tp / (tp + fn || 1);
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const support = actual.filter((v) => v === label).length;
    return { label, precision, recall, f1, support };
  });
  const macroF1 = perClass.reduce((s, item) => s + item.f1, 0) / Math.max(perClass.length, 1);
  const weightedF1 = perClass.reduce((s, item) => s + item.f1 * item.support, 0) / Math.max(actual.length, 1);
  return { accuracy, macroF1, weightedF1, perClass, labels, matrix };
}

export function majorityBaseline(labels: string[]) {
  const counts: Record<string, number> = {};
  labels.forEach((label) => {
    counts[label] = (counts[label] ?? 0) + 1;
  });
  const majority = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return majority ? majority[1] / labels.length : 0;
}

export function logLikelihoodRatio(model: NaiveBayesModel, token: string, positive: string, negative: string) {
  return logLikelihood(model, positive, token) - logLikelihood(model, negative, token);
}

export function tokenClassCounts(model: NaiveBayesModel, token: string) {
  return Object.fromEntries(
    model.labels.map((label) => [
      label,
      {
        count: model.tokenCounts[label]?.[token] ?? 0,
        smoothed: Math.exp(logLikelihood(model, label, token)),
      },
    ]),
  );
}
