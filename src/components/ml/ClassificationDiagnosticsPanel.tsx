import {
  CLF_METRIC_TOOLTIPS,
  formatClf,
  formatPct,
} from "../../lib/classification/classificationEval";
import "./ClassificationDiagnosticsPanel.css";

type SweepRow = {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
};

type TestMetrics = {
  accuracy: number;
  f1: number;
  balancedAccuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
};

type Props = {
  algorithm: string;
  dataset: string;
  samples: number;
  features: number;
  classes: number;
  split?: string;
  seed?: number;
  state: string;
  scoreKind: "probability" | "decision score" | "vote proportion" | "posterior probability";
  train?: { accuracy: number; f1?: number };
  test?: TestMetrics | null;
  rocAuc?: number | null;
  prAuc?: number | null;
  baselineAccuracy?: number | null;
  sweep?: SweepRow[];
  suitability?: string;
  extra?: React.ReactNode;
};

export function ClassificationDiagnosticsPanel(props: Props) {
  return (
    <section className="cdp" aria-label="Classification diagnostics">
      <header>
        <div>
          <p>Model summary</p>
          <strong>{props.algorithm}</strong>
        </div>
        <span className="cdp-state">{props.state}</span>
      </header>
      <dl className="cdp-meta">
        <div>
          <dt>Dataset</dt>
          <dd>{props.dataset}</dd>
        </div>
        <div>
          <dt>Samples</dt>
          <dd>{props.samples}</dd>
        </div>
        <div>
          <dt>Features</dt>
          <dd>{props.features}</dd>
        </div>
        <div>
          <dt>Classes</dt>
          <dd>{props.classes}</dd>
        </div>
        {props.split && (
          <div>
            <dt>Split</dt>
            <dd>{props.split}</dd>
          </div>
        )}
        {props.seed !== undefined && (
          <div>
            <dt>Seed</dt>
            <dd>{props.seed}</dd>
          </div>
        )}
        <div>
          <dt>Score type</dt>
          <dd>{props.scoreKind}</dd>
        </div>
      </dl>
      {props.suitability && <p className="cdp-note">{props.suitability}</p>}
      {(props.train || props.test) && (
        <table className="cdp-metrics">
          <thead>
            <tr>
              <th />
              <th title={CLF_METRIC_TOOLTIPS.accuracy}>Accuracy</th>
              <th title={CLF_METRIC_TOOLTIPS.f1}>F1</th>
              <th title={CLF_METRIC_TOOLTIPS.balancedAccuracy}>Bal. acc.</th>
            </tr>
          </thead>
          <tbody>
            {props.train && (
              <tr>
                <th>Train</th>
                <td>{formatPct(props.train.accuracy)}</td>
                <td>{formatPct(props.train.f1)}</td>
                <td>—</td>
              </tr>
            )}
            {props.test && (
              <tr>
                <th>Test</th>
                <td>{formatPct(props.test.accuracy)}</td>
                <td>{formatPct(props.test.f1)}</td>
                <td>{formatPct(props.test.balancedAccuracy)}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {props.test && (
        <p className="cdp-note">
          Test confusion (actual rows × predicted columns): TN {props.test.tn} · FP {props.test.fp} ·
          FN {props.test.fn} · TP {props.test.tp}. Precision {formatClf(props.test.precision)} · Recall{" "}
          {formatClf(props.test.recall)} · Specificity {formatClf(props.test.specificity)}.
        </p>
      )}
      {props.rocAuc != null && (
        <p className="cdp-note" title={CLF_METRIC_TOOLTIPS.rocAuc}>
          ROC-AUC {formatClf(props.rocAuc)}
        </p>
      )}
      {props.prAuc != null && (
        <p className="cdp-note" title={CLF_METRIC_TOOLTIPS.prAuc}>
          PR-AUC {formatClf(props.prAuc)} (not the same as ROC-AUC)
        </p>
      )}
      {props.baselineAccuracy != null && props.test && (
        <p className="cdp-note">
          Majority-class baseline accuracy {formatPct(props.baselineAccuracy)}. A model near this
          baseline may not be useful even if accuracy looks high.
        </p>
      )}
      {props.sweep?.length ? (
        <table className="cdp-metrics">
          <caption>Threshold explorer (same scores, no retrain)</caption>
          <thead>
            <tr>
              <th>t</th>
              <th>P</th>
              <th>R</th>
              <th>F1</th>
              <th>TP</th>
              <th>FP</th>
              <th>TN</th>
              <th>FN</th>
            </tr>
          </thead>
          <tbody>
            {props.sweep.map((row) => (
              <tr key={row.threshold}>
                <td>{row.threshold.toFixed(1)}</td>
                <td>{formatClf(row.precision, 2)}</td>
                <td>{formatClf(row.recall, 2)}</td>
                <td>{formatClf(row.f1, 2)}</td>
                <td>{row.tp}</td>
                <td>{row.fp}</td>
                <td>{row.tn}</td>
                <td>{row.fn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {props.extra}
    </section>
  );
}
