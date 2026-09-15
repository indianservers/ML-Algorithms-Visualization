import {
  CLUSTER_METRIC_TOOLTIPS,
  formatCl,
} from "../../lib/clustering/clusteringEval";
import type { ClusterCompareRow } from "../../lib/clustering/clusteringCompare";
import "./ClusteringDiagnosticsPanel.css";

type Props = {
  algorithm: string;
  dataset: string;
  samples: number;
  features: number;
  preprocessing: string;
  seed?: number | string;
  status: string;
  iterations?: number | string;
  clustersFound: number;
  noise?: number;
  extras?: Array<[string, string]>;
  why?: string;
  compare?: ClusterCompareRow[];
};

export function ClusteringDiagnosticsPanel(props: Props) {
  return (
    <section className="kdp" aria-label="Clustering diagnostics">
      <header>
        <p>Model summary</p>
        <b>{props.algorithm}</b>
      </header>
      <dl className="kdp-meta">
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
          <dt>Preprocessing</dt>
          <dd>{props.preprocessing}</dd>
        </div>
        <div>
          <dt>Seed</dt>
          <dd>{props.seed ?? "n/a"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{props.status}</dd>
        </div>
        <div>
          <dt>Iterations</dt>
          <dd>{props.iterations ?? "n/a"}</dd>
        </div>
        <div>
          <dt>Clusters found</dt>
          <dd>{props.clustersFound}</dd>
        </div>
        {props.noise !== undefined && (
          <div>
            <dt>Noise</dt>
            <dd>{props.noise}</dd>
          </div>
        )}
        {props.extras?.map(([label, value]) => (
          <div key={label}>
            <dt title={CLUSTER_METRIC_TOOLTIPS[label as keyof typeof CLUSTER_METRIC_TOOLTIPS]}>
              {label}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {props.why && <p className="kdp-why">{props.why}</p>}
      {props.compare && props.compare.length > 0 && (
        <table className="kdp-compare">
          <caption>
            Same features; inertia/cost are not comparable across algorithms.
            Runtime is computation only (performance.now), not animation.
          </caption>
          <thead>
            <tr>
              <th>Model</th>
              <th>Clusters</th>
              <th>Noise</th>
              <th title={CLUSTER_METRIC_TOOLTIPS.silhouette}>Silhouette</th>
              <th title={CLUSTER_METRIC_TOOLTIPS.daviesBouldin}>DB</th>
              <th>ms</th>
            </tr>
          </thead>
          <tbody>
            {props.compare.map((row) => (
              <tr key={row.algorithm}>
                <td>{row.algorithm}</td>
                <td>{row.clusters}</td>
                <td>{row.noise}</td>
                <td>{formatCl(row.silhouette)}</td>
                <td>{formatCl(row.daviesBouldin)}</td>
                <td>{row.computeMs.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
