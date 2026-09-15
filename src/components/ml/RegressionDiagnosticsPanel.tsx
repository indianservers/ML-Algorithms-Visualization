import type { ReactNode } from "react";
import {
  formatMetric,
  formatR2,
  METRIC_TOOLTIPS,
  residualDiagnostics,
  type ModelLifecycle,
  type RegressionMetricBundle,
} from "../../lib/regression/regressionEval";
import { downsample } from "../../lib/regression/regressionDiagnostics";
import "./RegressionDiagnosticsPanel.css";

type Props = {
  algorithm: string;
  dataset: string;
  samples: number;
  features: number;
  split?: string;
  seed?: number;
  state: ModelLifecycle;
  hyperparameters?: Array<[string, string]>;
  train?: RegressionMetricBundle | null;
  test?: RegressionMetricBundle | null;
  testActual?: number[];
  testPredicted?: number[];
  baselineRmse?: number | null;
  suitability?: string;
  complexity?: string;
  extra?: ReactNode;
};

function MiniScatter({
  xs,
  ys,
  diagonal,
  zeroLine,
  label,
}: {
  xs: number[];
  ys: number[];
  diagonal?: boolean;
  zeroLine?: boolean;
  label: string;
}) {
  const points = downsample(
    xs.map((x, i) => ({ x, y: ys[i] ?? 0 })),
    280,
  );
  const xMin = Math.min(...points.map((p) => p.x));
  const xMax = Math.max(...points.map((p) => p.x));
  const yMin = Math.min(...points.map((p) => p.y));
  const yMax = Math.max(...points.map((p) => p.y));
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  const sx = (x: number) => 18 + ((x - xMin) / xSpan) * 200;
  const sy = (y: number) => 118 - ((y - yMin) / ySpan) * 100;
  return (
    <svg viewBox="0 0 236 136" className="rdp-chart" aria-label={label}>
      {diagonal && (
        <line
          x1={sx(Math.min(xMin, yMin))}
          y1={sy(Math.min(xMin, yMin))}
          x2={sx(Math.max(xMax, yMax))}
          y2={sy(Math.max(xMax, yMax))}
          className="rdp-ref"
        />
      )}
      {zeroLine && <line x1="18" x2="218" y1={sy(0)} y2={sy(0)} className="rdp-ref" />}
      {points.map((point, i) => (
        <circle key={i} cx={sx(point.x)} cy={sy(point.y)} r="2.4" />
      ))}
    </svg>
  );
}

export function RegressionDiagnosticsPanel(props: Props) {
  const residuals =
    props.testActual && props.testPredicted
      ? residualDiagnostics(props.testActual, props.testPredicted)
      : null;
  const gap =
    props.train?.r2 != null && props.test?.r2 != null
      ? props.train.r2 - props.test.r2
      : null;
  const stateClass =
    props.state === "TRAINED"
      ? "ok"
      : props.state === "MODEL STALE"
        ? "stale"
        : props.state === "ERROR"
          ? "err"
          : "idle";

  return (
    <section className="rdp" aria-label="Regression diagnostics">
      <header>
        <div>
          <p>Model summary</p>
          <strong>{props.algorithm}</strong>
        </div>
        <span className={`rdp-state ${stateClass}`} title={props.state === "MODEL STALE" ? "Dataset or hyperparameters changed. Retrain required." : props.state}>
          {props.state === "MODEL STALE" ? "MODEL STALE — Retrain Required" : props.state}
        </span>
      </header>
      <dl className="rdp-meta">
        <div><dt>Dataset</dt><dd>{props.dataset}</dd></div>
        <div><dt>Samples</dt><dd>{props.samples}</dd></div>
        <div><dt>Features</dt><dd>{props.features}</dd></div>
        {props.split && <div><dt>Split</dt><dd>{props.split}</dd></div>}
        {props.seed !== undefined && <div><dt>Seed</dt><dd>{props.seed}</dd></div>}
        {props.complexity && <div><dt>Complexity</dt><dd>{props.complexity}</dd></div>}
      </dl>
      {props.hyperparameters?.length ? (
        <p className="rdp-hyps">
          {props.hyperparameters.map(([k, v]) => (
            <span key={k}><b>{k}</b> {v}</span>
          ))}
        </p>
      ) : null}
      {props.suitability && <p className="rdp-note">{props.suitability}</p>}
      {(props.train || props.test) && (
        <table className="rdp-metrics">
          <thead>
            <tr>
              <th />
              <th title={METRIC_TOOLTIPS.mae}>MAE</th>
              <th title={METRIC_TOOLTIPS.rmse}>RMSE</th>
              <th title={METRIC_TOOLTIPS.r2}>R²</th>
            </tr>
          </thead>
          <tbody>
            {props.train && (
              <tr>
                <th>Train</th>
                <td>{formatMetric(props.train.mae)}</td>
                <td>{formatMetric(props.train.rmse)}</td>
                <td>{formatR2(props.train.r2, props.train.targetVarianceZero)}</td>
              </tr>
            )}
            {props.test && (
              <tr>
                <th>Test</th>
                <td>{formatMetric(props.test.mae)}</td>
                <td>{formatMetric(props.test.rmse)}</td>
                <td>{formatR2(props.test.r2, props.test.targetVarianceZero)}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {gap !== null && (
        <p className="rdp-note" title={METRIC_TOOLTIPS.gap}>
          Generalization gap (train R² − test R²): {formatMetric(gap, 3)}. A small gap means more consistent scores; a large gap can indicate overfitting but is not automatic proof.
        </p>
      )}
      {props.baselineRmse != null && props.test && (
        <p className="rdp-note">
          Mean-baseline test RMSE {formatMetric(props.baselineRmse)}. Model improvement {formatMetric(props.baselineRmse - props.test.rmse)}.
        </p>
      )}
      {props.testActual && props.testPredicted && residuals && (
        <div className="rdp-plots">
          <figure>
            <figcaption>Actual vs predicted (test)</figcaption>
            <MiniScatter xs={props.testActual} ys={props.testPredicted} diagonal label="Actual versus predicted" />
          </figure>
          <figure>
            <figcaption>Residual vs predicted (test)</figcaption>
            <MiniScatter xs={props.testPredicted} ys={residuals.residuals} zeroLine label="Residuals versus predicted" />
          </figure>
          <dl>
            <div><dt>Mean residual</dt><dd>{formatMetric(residuals.mean, 4)}</dd></div>
            <div><dt>Largest +</dt><dd>{formatMetric(residuals.largestPositive)}</dd></div>
            <div><dt>Largest −</dt><dd>{formatMetric(residuals.largestNegative)}</dd></div>
          </dl>
        </div>
      )}
      {props.extra}
    </section>
  );
}
