import { mean, variance } from '../../math/statistics';

export interface GaussianNBModel {
  classes: number[];
  priors: Record<number, number>;
  means: Record<number, number[]>;
  variances: Record<number, number[]>;
  predict: (x: number[]) => number;
  predictProba: (x: number[]) => Record<number, number>;
}

function gaussianPDF(x: number, mu: number, sigma2: number): number {
  if (sigma2 < 1e-9) return x === mu ? 1 : 0;
  return Math.exp(-((x - mu) ** 2) / (2 * sigma2)) / Math.sqrt(2 * Math.PI * sigma2);
}

export function trainGaussianNB(X: number[][], y: number[]): GaussianNBModel {
  if (!X.length || X.length !== y.length || !X[0]?.length)
    throw new Error('Gaussian Naive Bayes requires aligned non-empty data');
  const width = X[0].length;
  if (!X.every(row => row.length === width && row.every(Number.isFinite)) || !y.every(Number.isFinite))
    throw new Error('Gaussian Naive Bayes requires finite rectangular data');
  const classes = [...new Set(y)].sort((a, b) => a - b);
  if (classes.length < 2) {
    throw new Error("Supervised classification needs at least two classes. A one-class dataset cannot train a discriminator.");
  }
  const n = y.length;
  const priors: Record<number, number> = {};
  const means: Record<number, number[]> = {};
  const variances: Record<number, number[]> = {};

  classes.forEach(c => {
    const indices = y.map((yi, i) => yi === c ? i : -1).filter(i => i >= 0);
    priors[c] = indices.length / n;
    const classX = indices.map(i => X[i]);
    const p = X[0].length;
    means[c] = Array.from({ length: p }, (_, j) => mean(classX.map(row => row[j])));
    variances[c] = Array.from({ length: p }, (_, j) => variance(classX.map(row => row[j])) + 1e-9);
  });

  const predictProba = (x: number[]): Record<number, number> => {
    if (x.length !== width || !x.every(Number.isFinite))
      throw new Error(`Expected ${width} finite features`);
    const logProbs: Record<number, number> = {};
    classes.forEach(c => {
      let lp = Math.log(priors[c]);
      x.forEach((xi, j) => { lp += Math.log(gaussianPDF(xi, means[c][j], variances[c][j]) + 1e-300); });
      logProbs[c] = lp;
    });
    const maxLP = Math.max(...Object.values(logProbs));
    const expProbs: Record<number, number> = {};
    let total = 0;
    classes.forEach(c => { expProbs[c] = Math.exp(logProbs[c] - maxLP); total += expProbs[c]; });
    classes.forEach(c => { expProbs[c] /= total; });
    return expProbs;
  };

  const predict = (x: number[]) => {
    const probs = predictProba(x);
    return classes.reduce((best, c) => probs[c] > probs[best] ? c : best, classes[0]);
  };

  return { classes, priors, means, variances, predict, predictProba };
}

function logSumExp(values: number[]) {
  const max = Math.max(...values);
  return max + Math.log(values.reduce((sum, v) => sum + Math.exp(v - max), 0));
}

export interface DiscreteNBModel {
  variant: 'multinomial' | 'bernoulli';
  classes: number[];
  priors: Record<number, number>;
  logLikelihood: Record<number, number[]>;
  predict: (x: number[]) => number;
  predictProba: (x: number[]) => Record<number, number>;
}

export function trainMultinomialNB(X: number[][], y: number[], alpha = 1): DiscreteNBModel {
  if (!X.length || X.length !== y.length || !X[0]?.length)
    throw new Error('Multinomial Naive Bayes requires aligned non-empty data');
  const width = X[0].length;
  if (!X.every((row) => row.length === width && row.every((v) => Number.isFinite(v) && v >= 0)))
    throw new Error('Multinomial Naive Bayes requires nonnegative finite features');
  if (!Number.isFinite(alpha) || alpha < 0) throw new Error('Smoothing alpha must be >= 0');
  const classes = [...new Set(y)].sort((a, b) => a - b);
  if (classes.length < 2) {
    throw new Error("Supervised classification needs at least two classes. A one-class dataset cannot train a discriminator.");
  }
  const priors: Record<number, number> = {};
  const logLikelihood: Record<number, number[]> = {};
  classes.forEach((c) => {
    const rows = X.filter((_, i) => y[i] === c);
    priors[c] = rows.length / y.length;
    const totals = Array.from({ length: width }, (_, j) =>
      rows.reduce((sum, row) => sum + row[j], 0),
    );
    const denom = totals.reduce((sum, v) => sum + v, 0) + alpha * width;
    logLikelihood[c] = totals.map((count) => Math.log((count + alpha) / denom));
  });
  return discretePredict('multinomial', classes, priors, logLikelihood);
}

export function trainBernoulliNB(X: number[][], y: number[], alpha = 1): DiscreteNBModel {
  if (!X.length || X.length !== y.length || !X[0]?.length)
    throw new Error('Bernoulli Naive Bayes requires aligned non-empty data');
  const width = X[0].length;
  if (!X.every((row) => row.length === width && row.every((v) => v === 0 || v === 1)))
    throw new Error('Bernoulli Naive Bayes requires binary 0/1 features');
  if (!Number.isFinite(alpha) || alpha < 0) throw new Error('Smoothing alpha must be >= 0');
  const classes = [...new Set(y)].sort((a, b) => a - b);
  if (classes.length < 2) {
    throw new Error("Supervised classification needs at least two classes. A one-class dataset cannot train a discriminator.");
  }
  const priors: Record<number, number> = {};
  const logLikelihood: Record<number, number[]> = {};
  classes.forEach((c) => {
    const rows = X.filter((_, i) => y[i] === c);
    priors[c] = rows.length / y.length;
    logLikelihood[c] = Array.from({ length: width }, (_, j) => {
      const ones = rows.reduce((sum, row) => sum + row[j], 0);
      return Math.log((ones + alpha) / (rows.length + 2 * alpha));
    });
  });
  return discretePredict('bernoulli', classes, priors, logLikelihood);
}

function discretePredict(
  variant: 'multinomial' | 'bernoulli',
  classes: number[],
  priors: Record<number, number>,
  logLikelihood: Record<number, number[]>,
): DiscreteNBModel {
  const predictProba = (x: number[]): Record<number, number> => {
    const logs = classes.map((c) => {
      let lp = Math.log(priors[c]);
      if (variant === 'multinomial') {
        if (x.some((v) => !Number.isFinite(v) || v < 0))
          throw new Error('Multinomial Naive Bayes requires nonnegative features');
        x.forEach((count, j) => {
          lp += count * logLikelihood[c][j];
        });
      } else {
        if (x.some((v) => v !== 0 && v !== 1))
          throw new Error('Bernoulli Naive Bayes requires 0/1 features');
        x.forEach((bit, j) => {
          const logP = logLikelihood[c][j];
          lp += bit ? logP : Math.log(1 - Math.exp(logP));
        });
      }
      return lp;
    });
    const lse = logSumExp(logs);
    const result: Record<number, number> = {};
    classes.forEach((c, i) => {
      result[c] = Math.exp(logs[i] - lse);
    });
    return result;
  };
  const predict = (x: number[]) => {
    const probs = predictProba(x);
    return classes.reduce((best, c) => (probs[c] > probs[best] ? c : best), classes[0]);
  };
  return { variant, classes, priors, logLikelihood, predict, predictProba };
}
