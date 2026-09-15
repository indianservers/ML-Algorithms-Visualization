import { mean, std, covariance } from "../../math/statistics";

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  predict: (x: number) => number;
  residuals: number[];
}

export function simpleLinearRegression(
  x: number[],
  y: number[],
): LinearRegressionResult {
  validateRegressionData(x.map(value => [value]), y, "Simple linear regression");
  const mx = mean(x),
    my = mean(y);
  const cov = covariance(x, y);
  const varX = x.reduce((s, xi) => s + (xi - mx) ** 2, 0) / x.length;
  const slope = varX === 0 ? 0 : cov / varX;
  const intercept = my - slope * mx;
  const predict = (xNew: number) => slope * xNew + intercept;
  const residuals = y.map((yi, i) => yi - predict(x[i]));
  return { slope, intercept, predict, residuals };
}

export interface MultipleRegressionResult {
  coefficients: number[];
  intercept: number;
  predict: (x: number[]) => number;
  residuals: number[];
}

export function multipleLinearRegression(
  X: number[][],
  y: number[],
): MultipleRegressionResult {
  validateRegressionData(X, y, "Multiple linear regression");
  const n = y.length;
  const p = X[0].length;
  // Add bias column
  const Xb = X.map((row) => [1, ...row]);
  const cols = p + 1;

  // Normal equations: beta = (X'X)^-1 X'y
  const XtX: number[][] = Array.from({ length: cols }, () =>
    Array(cols).fill(0),
  );
  const Xty: number[] = Array(cols).fill(0);

  for (let i = 0; i < n; i++) {
    for (let r = 0; r < cols; r++) {
      Xty[r] += Xb[i][r] * y[i];
      for (let c = 0; c < cols; c++) {
        XtX[r][c] += Xb[i][r] * Xb[i][c];
      }
    }
  }

  const beta = solveLinearSystem(XtX, Xty);
  const intercept = beta[0];
  const coefficients = beta.slice(1);
  const predict = (x: number[]) => {
    validatePredictionRow(x, p);
    return intercept + x.reduce((s, xi, i) => s + xi * coefficients[i], 0);
  };
  const residuals = y.map((yi, i) => yi - predict(X[i]));
  return { coefficients, intercept, predict, residuals };
}

export interface OlsDiagnostics extends MultipleRegressionResult {
  residualStd: number;
  coefficientStdErrors: number[];
  tStatistics: number[];
  rankWarning: boolean;
}

export function multipleLinearRegressionDiagnostics(
  X: number[][],
  y: number[],
): OlsDiagnostics {
  const fit = multipleLinearRegression(X, y);
  const n = y.length;
  const p = X[0].length;
  const df = n - p - 1;
  const sse = fit.residuals.reduce((sum, r) => sum + r * r, 0);
  const residualStd = df > 0 ? Math.sqrt(sse / df) : Number.NaN;
  const Xb = X.map((row) => [1, ...row]);
  const cols = p + 1;
  const XtX: number[][] = Array.from({ length: cols }, () => Array(cols).fill(0));
  for (let i = 0; i < n; i++) {
    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) XtX[r][c] += Xb[i][r] * Xb[i][c];
    }
  }
  const identity = Array.from({ length: cols }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === j ? 1 : 0)),
  );
  const inverse = identity.map((_, j) => solveLinearSystem(XtX, identity.map((row) => row[j])));
  const xtxInv = inverse[0].map((_, r) => inverse.map((col) => col[r]));
  const coefficientStdErrors = xtxInv.map((row, i) =>
    Number.isFinite(residualStd) ? residualStd * Math.sqrt(Math.max(row[i], 0)) : Number.NaN,
  );
  const betas = [fit.intercept, ...fit.coefficients];
  const tStatistics = betas.map((b, i) =>
    coefficientStdErrors[i] ? b / coefficientStdErrors[i] : Number.NaN,
  );
  const condProxy = Math.max(...xtxInv.map((row, i) => Math.abs(row[i])));
  return {
    ...fit,
    residualStd,
    coefficientStdErrors,
    tStatistics,
    rankWarning: !Number.isFinite(condProxy) || condProxy > 1e8,
  };
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const aug = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    if (Math.abs(aug[col][col]) < 1e-12) continue;
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col] / aug[col][col];
        for (let k = col; k <= n; k++) {
          aug[row][k] -= factor * aug[col][k];
        }
      }
    }
  }
  return aug.map((row, i) => row[n] / (row[i] || 1e-12));
}

export function ridgeRegression(
  X: number[][],
  y: number[],
  alpha: number,
): MultipleRegressionResult {
  validateRegressionData(X, y, "Ridge regression");
  if (!Number.isFinite(alpha) || alpha < 0)
    throw new Error("Ridge alpha must be non-negative");
  const n = y.length;
  const p = X[0].length;
  const Xb = X.map((row) => [1, ...row]);
  const cols = p + 1;

  const XtX: number[][] = Array.from({ length: cols }, () =>
    Array(cols).fill(0),
  );
  const Xty: number[] = Array(cols).fill(0);
  for (let i = 0; i < n; i++) {
    for (let r = 0; r < cols; r++) {
      Xty[r] += Xb[i][r] * y[i];
      for (let c = 0; c < cols; c++) XtX[r][c] += Xb[i][r] * Xb[i][c];
    }
  }
  for (let j = 1; j < cols; j++) XtX[j][j] += alpha;
  const beta = solveLinearSystem(XtX, Xty);
  const intercept = beta[0];
  const coefficients = beta.slice(1);
  const predict = (x: number[]) => {
    validatePredictionRow(x, p);
    return intercept + x.reduce((s, xi, i) => s + xi * coefficients[i], 0);
  };
  const residuals = y.map((yi, i) => yi - predict(X[i]));
  return { coefficients, intercept, predict, residuals };
}

export function lassoRegression(
  X: number[][],
  y: number[],
  alpha: number,
  maxIter = 1000,
  tol = 1e-4,
  standardize = true,
  fitIntercept = true,
): MultipleRegressionResult {
  validateRegressionData(X, y, "Lasso regression");
  validateCoordinateDescent(alpha, maxIter, tol);
  const n = y.length;
  const p = X[0].length;
  const mx = X[0].map((_, j) =>
    standardize && fitIntercept ? mean(X.map((row) => row[j])) : 0,
  );
  const sx = X[0].map((_, j) =>
    standardize ? std(X.map((row) => row[j])) || 1 : 1,
  );
  const Xs = X.map((row) => row.map((v, j) => (v - mx[j]) / sx[j]));
  const my = fitIntercept ? mean(y) : 0;
  const ys = y.map((v) => v - my);

  const w = Array(p).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    const wOld = [...w];
    for (let j = 0; j < p; j++) {
      const r = ys.map(
        (yi, i) =>
          yi - Xs[i].reduce((s, xij, k) => (k !== j ? s + xij * w[k] : s), 0),
      );
      const rho = Xs.map((row, i) => row[j] * r[i]).reduce((a, b) => a + b, 0);
      w[j] =
        softThreshold(rho / n, alpha) /
        ((Xs.map((row) => row[j] ** 2).reduce((a, b) => a + b, 0) / n) || 1e-12);
    }
    if (w.every((wj, j) => Math.abs(wj - wOld[j]) < tol)) break;
  }
  const coefficients = w.map((wj, j) => wj / sx[j]);
  const intercept = fitIntercept
    ? my - mx.reduce((s, mxj, j) => s + mxj * coefficients[j], 0)
    : 0;
  const predict = (x: number[]) => {
    validatePredictionRow(x, p);
    return intercept + x.reduce((s, xi, i) => s + xi * coefficients[i], 0);
  };
  const residuals = y.map((yi, i) => yi - predict(X[i]));
  return { coefficients, intercept, predict, residuals };
}

export function elasticNetRegression(
  X: number[][],
  y: number[],
  alpha: number,
  l1Ratio: number,
  maxIter = 1000,
  tol = 1e-4,
  standardize = true,
  fitIntercept = true,
): MultipleRegressionResult {
  validateRegressionData(X, y, "Elastic net regression");
  validateCoordinateDescent(alpha, maxIter, tol);
  if (!Number.isFinite(l1Ratio)) throw new Error("Elastic net l1Ratio must be finite");
  const n = y.length;
  const p = X[0].length;
  const ratio = Math.max(0, Math.min(1, l1Ratio));
  const mx = X[0].map((_, j) =>
    standardize && fitIntercept ? mean(X.map((row) => row[j])) : 0,
  );
  const sx = X[0].map((_, j) =>
    standardize ? std(X.map((row) => row[j])) || 1 : 1,
  );
  const Xs = X.map((row) => row.map((value, j) => (value - mx[j]) / sx[j]));
  const my = fitIntercept ? mean(y) : 0;
  const centeredY = y.map((value) => value - my);
  const weights = Array(p).fill(0);
  const fitted = Array(n).fill(0);
  const l1Penalty = alpha * ratio;
  const l2Penalty = alpha * (1 - ratio);

  for (let iteration = 0; iteration < maxIter; iteration++) {
    const previous = [...weights];
    for (let j = 0; j < p; j++) {
      let rho = 0;
      let norm = 0;
      for (let i = 0; i < n; i++) {
        const partial = centeredY[i] - fitted[i] + Xs[i][j] * weights[j];
        rho += Xs[i][j] * partial;
        norm += Xs[i][j] ** 2;
      }
      const nextWeight =
        softThreshold(rho / n, l1Penalty) / (norm / n + l2Penalty || 1e-12);
      const delta = nextWeight - weights[j];
      if (delta !== 0) {
        for (let i = 0; i < n; i++) fitted[i] += Xs[i][j] * delta;
      }
      weights[j] = nextWeight;
    }
    if (
      weights.every((weight, index) => Math.abs(weight - previous[index]) < tol)
    )
      break;
  }

  const coefficients = weights.map((weight, j) => weight / sx[j]);
  const intercept = fitIntercept
    ? my - mx.reduce((sum, value, j) => sum + value * coefficients[j], 0)
    : 0;
  const predict = (row: number[]) => {
    validatePredictionRow(row, p);
    return intercept + row.reduce((sum, value, j) => sum + value * coefficients[j], 0);
  };
  const residuals = y.map((value, i) => value - predict(X[i]));
  return { coefficients, intercept, predict, residuals };
}

function softThreshold(x: number, lambda: number): number {
  if (x > lambda) return x - lambda;
  if (x < -lambda) return x + lambda;
  return 0;
}

export function polynomialFeatures(x: number[], degree: number): number[][] {
  if (!x.every(Number.isFinite) || !Number.isInteger(degree) || degree < 0)
    throw new Error("Polynomial features require finite values and a non-negative integer degree");
  return x.map((xi) => Array.from({ length: degree }, (_, d) => xi ** (d + 1)));
}

function validateRegressionData(X: number[][], y: number[], name: string): void {
  if (!X.length || X.length !== y.length || !X[0]?.length)
    throw new Error(`${name} requires aligned non-empty data`);
  const width = X[0].length;
  if (!X.every(row => row.length === width && row.every(Number.isFinite)) || !y.every(Number.isFinite))
    throw new Error(`${name} requires finite rectangular data`);
}

function validatePredictionRow(row: number[], width: number): void {
  if (row.length !== width || !row.every(Number.isFinite))
    throw new Error(`Expected ${width} finite features`);
}

function validateCoordinateDescent(alpha: number, maxIter: number, tol: number): void {
  if (!Number.isFinite(alpha) || alpha < 0 || !Number.isInteger(maxIter) || maxIter < 1 ||
      !Number.isFinite(tol) || tol <= 0)
    throw new Error("Invalid coordinate-descent hyperparameters");
}
