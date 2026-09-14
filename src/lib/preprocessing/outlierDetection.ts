import { mean, quantile, std } from '../math/statistics';

export type OutlierMethod = 'iqr' | 'zscore';
export type OutlierBand = 'normal' | 'mild' | 'severe';

export interface OutlierResult {
  value: number;
  score: number;
  band: OutlierBand;
}

export function detectOutliers(values: number[], method: OutlierMethod, threshold = 1.5): OutlierResult[] {
  if (!values.length) return [];
  if (!values.every(Number.isFinite)) throw new Error('Outlier detection requires finite values');
  if (!Number.isFinite(threshold) || threshold <= 0) throw new Error('Outlier threshold must be positive');
  if (method === 'zscore') {
    const center = mean(values);
    const spread = std(values) || 1;
    return values.map(value => {
      const score = Math.abs((value - center) / spread);
      return { value, score, band: score > threshold * 2 ? 'severe' : score > threshold ? 'mild' : 'normal' };
    });
  }
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1 || 1;
  return values.map(value => {
    const score = value < q1 ? (q1 - value) / iqr : value > q3 ? (value - q3) / iqr : 0;
    return { value, score, band: score > threshold * 2 ? 'severe' : score > threshold ? 'mild' : 'normal' };
  });
}

export function capAtIqrFences(values: number[], multiplier = 1.5) {
  if (!values.length) return [];
  if (!values.every(Number.isFinite)) throw new Error('IQR capping requires finite values');
  if (!Number.isFinite(multiplier) || multiplier < 0) throw new Error('IQR multiplier must be non-negative');
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - multiplier * iqr;
  const upper = q3 + multiplier * iqr;
  return values.map(value => Math.max(lower, Math.min(upper, value)));
}
