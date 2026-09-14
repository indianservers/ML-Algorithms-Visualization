export type CategoricalRow = Record<string, string>;

export function targetEncodeKFolds(rows: CategoricalRow[], feature: string, target: string, folds: number, smoothing: number, minSamples: number) {
  const positive = rows.map(row => /yes|true|1|churn/i.test(row[target]) ? 1 : 0);
  return rows.map((row, index) => {
    const fold = index % folds;
    let categorySum = 0;
    let categoryCount = 0;
    let trainingSum = 0;
    let trainingCount = 0;
    rows.forEach((candidate, candidateIndex) => {
      if (candidateIndex % folds === fold) return;
      trainingSum += positive[candidateIndex];
      trainingCount += 1;
      if (candidate[feature] === row[feature]) {
        categorySum += positive[candidateIndex];
        categoryCount += 1;
      }
    });
    const trainingMean = trainingSum / Math.max(1, trainingCount);
    return categoryCount < minSamples
      ? trainingMean
      : (categorySum + smoothing * trainingMean) / (categoryCount + smoothing);
  });
}

export function oneHotEncodeFeature(rows: CategoricalRow[], feature: string) {
  const categories = [...new Set(rows.map(row => row[feature]))];
  return rows.map(row => categories.map(category => row[feature] === category ? 1 : 0));
}

export function ordinalEncodeFeature(rows: CategoricalRow[], feature: string) {
  const categories = [...new Set(rows.map(row => row[feature]))];
  return rows.map(row => categories.indexOf(row[feature]));
}

export function frequencyEncodeFeature(rows: CategoricalRow[], feature: string) {
  const counts = new Map<string, number>();
  rows.forEach(row => counts.set(row[feature], (counts.get(row[feature]) ?? 0) + 1));
  return rows.map(row => (counts.get(row[feature]) ?? 0) / Math.max(1, rows.length));
}
