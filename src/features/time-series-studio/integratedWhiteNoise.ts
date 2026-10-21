import type { LabConfig } from "./types";
/** Exact Gaussian ARIMA(0,d,0)(0,D,0)[s], avoiding CTSA's p=q=0 native edge case.
 * With no differences this is an estimated constant plus white noise.
 * With differences, innovations have zero mean (no drift). Forecast variance is
 * sigma² times the cumulative squared impulse response of the inverse polynomial.
 */
export function integratedWhiteNoise(values: number[], c: LabConfig) {
  let polynomial = [1];
  const multiply = (lag: number) => {
    const next = Array(polynomial.length + lag).fill(0);
    polynomial.forEach((v, i) => {
      next[i] += v;
      next[i + lag] -= v;
    });
    polynomial = next;
  };
  for (let i = 0; i < c.d; i++) multiply(1);
  for (let i = 0; i < c.D; i++) multiply(c.season);
  const offset = polynomial.length - 1;
  if (values.length < offset + 4)
    throw new Error(
      "Not enough observations after differencing for an innovation variance estimate.",
    );
  const differenced = values
    .slice(offset)
    .map((_, i) =>
      polynomial.reduce((s, v, j) => s + v * values[i + offset - j], 0),
    );
  const mean = offset
    ? 0
    : differenced.reduce((a, b) => a + b, 0) / differenced.length;
  const variance =
    differenced.reduce((s, v) => s + (v - mean) ** 2, 0) / differenced.length;
  const history = [...values],
    forecast: number[] = [],
    impulse = [1],
    errors: number[] = [];
  let cumulative = 0;
  for (let h = 0; h < c.horizon; h++) {
    if (h > 0)
      impulse[h] = -polynomial
        .slice(1)
        .reduce((s, v, j) => s + v * (impulse[h - j - 1] ?? 0), 0);
    cumulative += impulse[h] ** 2;
    errors.push(variance * cumulative);
    const next =
      mean -
      polynomial
        .slice(1)
        .reduce((s, v, j) => s + v * history[history.length - j - 1], 0);
    history.push(next);
    forecast.push(next);
  }
  return { forecast, variance: errors };
}
