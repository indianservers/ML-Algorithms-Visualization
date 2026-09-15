import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLabNavigate } from "../../../lib/labNavigation";
import { Download, Save, Share2, Star, Upload } from "lucide-react";
import { optics, type OpticsMetric, type OpticsResult } from "../../../lib/algorithms/clustering/optics";
import {
  datasetETwoMoons,
  datasetFConcentricCircles,
  datasetGNoisyBlobs,
  datasetKVariableDensity,
} from "../../../lib/clustering/clusteringDatasets";
import { fitClusterScaler } from "../../../lib/clustering/clusteringEval";
import "./OPTICSPage.css";

type Point = { x: number; y: number };
type Dataset = "aggregation" | "moons" | "rings" | "blobs" | "imported";
const COLORS = [
  "#20d5e5",
  "#ff7b45",
  "#f8cf28",
  "#53d56e",
  "#ff647d",
  "#a66aea",
];
const BUILT = {
  aggregation: datasetKVariableDensity(),
  moons: datasetETwoMoons(),
  rings: datasetFConcentricCircles(),
  blobs: datasetGNoisyBlobs(),
};
const NAMES: Record<Dataset, string> = {
  aggregation: "Variable-density clusters",
  moons: "Two moons",
  rings: "Concentric circles",
  blobs: "Noisy blobs",
  imported: "Imported Data",
};

export default function OPTICSPage() {
  const [tab, setTab] = useState("Visualize"),
    [dataset, setDataset] = useState<Dataset>("aggregation"),
    [points, setPoints] = useState<Point[]>(BUILT.aggregation),
    [imported, setImported] = useState<Point[]>([]),
    [minPts, setMinPts] = useState(5),
    [autoDistance, setAutoDistance] = useState(true),
    [maxDistance, setMaxDistance] = useState(2.45),
    [epsilon, setEpsilon] = useState(0.62),
    [metric, setMetric] = useState<OpticsMetric>("euclidean"),
    [extract, setExtract] = useState(true),
    [highlight, setHighlight] = useState("all"),
    [showCore, setShowCore] = useState(true),
    [showPath, setShowPath] = useState(true),
    [logScale, setLogScale] = useState(true),
    [standardize, setStandardize] = useState(false),
    [selected, setSelected] = useState(0),
    [toast, setToast] = useState("");
  const go = useLabNavigate();
  const fileRef = useRef<HTMLInputElement>(null),
    X = useMemo(() => {
      const raw = points.map((p) => [p.x, p.y]);
      return standardize ? fitClusterScaler(raw).transformAll(raw) : raw;
    }, [points, standardize]);
  const fitted = useMemo(() => {
    try {
      return {
        result: optics(
          X,
          Math.max(2, Math.min(minPts, points.length)),
          autoDistance ? 2.45 : maxDistance,
          extract ? epsilon : -1,
          metric,
        ),
        error: "",
      };
    } catch (error) {
      const empty: OpticsResult = {
        ordering: [],
        reachability: [],
        coreDistances: [],
        labels: points.map(() => -1),
        core: points.map(() => false),
        clusterCount: 0,
        noiseCount: points.length,
      };
      return {
        result: empty,
        error: error instanceof Error ? error.message : "OPTICS failed",
      };
    }
  }, [
    X,
    minPts,
    autoDistance,
    maxDistance,
    epsilon,
    metric,
    extract,
    points.length,
    points,
  ]);
  const result = fitted.result;
  const choose = (kind: Dataset) => {
    const next = kind === "imported" ? imported : BUILT[kind];
    if (!next.length) return;
    setDataset(kind);
    setPoints(next);
    setToast(`${NAMES[kind]} loaded`);
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const rows = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((row) => row.split(",").map(Number))
      .filter((row) => row.length >= 2 && row.every(Number.isFinite))
      .map(([x, y]) => ({ x, y }));
    if (rows.length < 2)
      return setToast("File needs at least two numeric rows");
    setImported(rows);
    setDataset("imported");
    setPoints(rows);
    setMinPts(Math.max(2, Math.min(5, rows.length)));
    setToast(`Imported ${rows.length} points`);
    event.target.value = "";
  };
  const reset = () => {
    setMinPts(Math.max(2, Math.min(5, points.length)));
    setAutoDistance(true);
    setMaxDistance(2.45);
    setEpsilon(0.62);
    setMetric("euclidean");
    setExtract(true);
    setHighlight("all");
    setShowCore(true);
    setShowPath(true);
    setLogScale(true);
  };
  const exportLabels = () => {
    const blob = new Blob(
      [
        "x,y,cluster,core\n" +
          points
            .map(
              (p, i) => `${p.x},${p.y},${result.labels[i]},${result.core[i]}`,
            )
            .join("\n"),
      ],
      { type: "text/csv" },
    );
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = "optics-labels.csv";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    setToast("Labels exported");
  };
  const sizes = Array.from(
      { length: result.clusterCount },
      (_, cluster) => result.labels.filter((label) => label === cluster).length,
    ),
    coreCounts = sizes.map(
      (_, cluster) =>
        result.labels.filter((label, i) => label === cluster && result.core[i])
          .length,
    );
  const px = (x: number) => ((x + 8) / 16) * 100,
    py = (y: number) => ((8 - y) / 16) * 100,
    finiteReach = result.reachability.filter(Number.isFinite),
    cap = Math.max(epsilon * 1.5, ...finiteReach, 1);
  const reachY = (value: number) => {
    const bounded = Number.isFinite(value) ? value : cap;
    return logScale
      ? 92 -
          ((Math.log10(Math.max(0.01, bounded)) + 2) / (Math.log10(cap) + 2)) *
            80
      : 92 - (bounded / cap) * 80;
  };
  return (
    <div className="op-page">
      <aside className="op-side">
        <Link to="/">
          ◉{" "}
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </Link>
        {[
          ["⌂", "Home"],
          ["◉", "Explore"],
          ["▤", "Data"],
          ["◇", "Models"],
          ["□", "Workspaces"],
          ["⚗", "Experiments"],
          ["▣", "Reports"],
        ].map(([icon, name]) => (
          <button key={name} onClick={() => go(name)}>
            <i>{icon}</i>
            {name}
          </button>
        ))}
        <footer>
          {["▤ Docs", "⚗ API", "⚙ Settings"].map((name) => (
            <button key={name} onClick={() => go(name)}>
              {name}
            </button>
          ))}
          <p>
            Ⓜ <b>Mega ML Team</b> <em>Pro</em>
          </p>
        </footer>
      </aside>
      <header className="op-head">
        <h1>
          OPTICS <Star />
        </h1>
        <p>
          Density-based clustering that discovers clusters of varying density.
        </p>
        <div>
          <button onClick={() => setToast("View saved")}>
            <Save /> Save View
          </button>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
          <button className="primary" onClick={exportLabels}>
            <Download /> Export⌄
          </button>
        </div>
      </header>
      <main>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Build / Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((name) => (
            <button
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
              key={name}
            >
              {name}
            </button>
          ))}
        </nav>
        <section className="op-data">
          <b>Dataset</b>
          <select
            value={dataset}
            onChange={(e) => choose(e.target.value as Dataset)}
          >
            {Object.entries(NAMES)
              .filter(([key]) => key !== "imported" || imported.length)
              .map(([key, name]) => (
                <option value={key} key={key}>
                  {name}
                </option>
              ))}
          </select>
          <span>{points.length.toLocaleString()} points • 2 features</span>
          <button onClick={() => fileRef.current?.click()}>
            <Upload /> Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
          <button onClick={() => setToast("Dataset switched")}>⟳ Switch</button>
          <label>
            Scaling{" "}
            <select
              aria-label="Feature scaling"
              value={standardize ? "z" : "none"}
              onChange={(event) => setStandardize(event.target.value === "z")}
            >
              <option value="none">None (raw coordinates)</option>
              <option value="z">Standardize (z-score)</option>
            </select>
          </label>
        </section>
        <section className="op-visuals">
          <article className="op-spatial">
            <h2>Spatial View ⓘ</h2>
            <div className="op-tools">▣ ⌕ ⊕ ✋ ⌂ ⛶</div>
            <div className="op-grid">
              {showPath &&
                result.ordering.slice(1, 180).map((index, order) => {
                  const previous = result.ordering[order];
                  return (
                    <svg key={`l${index}`}>
                      <line
                        x1={`${px(points[previous].x)}%`}
                        y1={`${py(points[previous].y)}%`}
                        x2={`${px(points[index].x)}%`}
                        y2={`${py(points[index].y)}%`}
                      />
                    </svg>
                  );
                })}
              {points.map((point, i) => {
                const label = result.labels[i],
                  visible = highlight === "all" || highlight === String(label);
                return (
                  <i
                    key={i}
                    className={result.core[i] && showCore ? "core" : ""}
                    onClick={() => setSelected(i)}
                    style={{
                      left: `${px(point.x)}%`,
                      top: `${py(point.y)}%`,
                      background:
                        label >= 0 && visible
                          ? COLORS[label % COLORS.length]
                          : "#9aa5b4",
                      opacity: visible ? 0.95 : 0.12,
                    }}
                  />
                );
              })}
            </div>
            <b className="op-x">Feature 1</b>
            <b className="op-y">Feature 2</b>
            <p>
              {fitted.error ? `${fitted.error} ` : ""}
              Point {selected}: order {result.ordering.indexOf(selected)}, core
              distance{" "}
              {Number.isFinite(result.coreDistances[selected])
                ? result.coreDistances[selected].toFixed(3)
                : "∞"}
              , reachability{" "}
              {Number.isFinite(
                result.reachability[result.ordering.indexOf(selected)],
              )
                ? result.reachability[
                    result.ordering.indexOf(selected)
                  ].toFixed(3)
                : "∞"}
              , cluster {result.labels[selected] ?? "n/a"}, neighbors in max-ε{" "}
              {X.filter(
                (row, j) =>
                  j !== selected &&
                  Math.hypot(
                    row[0] - X[selected][0],
                    row[1] - X[selected][1],
                  ) <= (autoDistance ? 2.45 : maxDistance),
              ).length}
            </p>
            <p>
              Undefined reachability is plotted at the finite cap, never as 0.
            </p>
          </article>
          <article className="op-reach">
            <h2>Reachability Plot ⓘ</h2>
            <div className="reach-chart">
              <span className="axis-y">
                Reachability Distance {logScale ? "(log scale)" : ""}
              </span>
              <svg viewBox="0 0 600 330" preserveAspectRatio="none">
                <line
                  className="threshold"
                  x1="42"
                  x2="590"
                  y1={reachY(epsilon) * 3.3}
                  y2={reachY(epsilon) * 3.3}
                />
                {result.ordering.slice(1).map((index, order) => {
                  const prior = result.reachability[order],
                    current = result.reachability[order + 1],
                    label = result.labels[index];
                  return (
                    <line
                      key={order}
                      x1={42 + (order / result.ordering.length) * 548}
                      x2={42 + ((order + 1) / result.ordering.length) * 548}
                      y1={reachY(prior) * 3.3}
                      y2={reachY(current) * 3.3}
                      stroke={
                        label >= 0 ? COLORS[label % COLORS.length] : "#55a0ff"
                      }
                    />
                  );
                })}
              </svg>
              <b>Points (Ordered)</b>
            </div>
            <footer>
              <span>━ Reachability</span>
              <span>━ Ordering Path</span>
              <span>┈ Threshold (ε)</span>
              <span>○ Core Points</span>
              <span>× Noise</span>
            </footer>
          </article>
        </section>
        <section className="op-summary">
          <div>
            <h2>Cluster Summary ⓘ</h2>
            <div className="cluster-cards">
              {sizes.slice(0, 6).map((size, cluster) => (
                <article key={cluster} style={{ borderColor: COLORS[cluster] }}>
                  <b style={{ color: COLORS[cluster] }}>
                    Cluster {cluster + 1}
                  </b>
                  <strong>{size} pts</strong>
                  <span>{((size / points.length) * 100).toFixed(1)}%</span>
                  <small>
                    Core: {coreCounts[cluster]}
                    <br />
                    Border: {size - coreCounts[cluster]}
                  </small>
                </article>
              ))}
              <article>
                <b>Noise</b>
                <strong>{result.noiseCount} pts</strong>
                <span>
                  {((result.noiseCount / points.length) * 100).toFixed(1)}%
                </span>
                <small>Outliers</small>
              </article>
            </div>
          </div>
          <aside>
            <h2>Quick Stats ⓘ</h2>
            <p>
              Total Points <b>{points.length.toLocaleString()}</b>
            </p>
            <p>
              Clusters <b>{result.clusterCount}</b>
            </p>
            <p>
              Noise <b>{result.noiseCount}</b>
            </p>
            <p>
              Ordering Length <b>{result.ordering.length}</b>
            </p>
          </aside>
        </section>
        <p className="op-tip">
          OPTICS discovers the intrinsic cluster structure. Use ε (epsilon) on
          the reachability plot to extract clusters.
        </p>
      </main>
      <aside className="op-controls">
        <nav>
          <button className="active">Parameters</button>
          <button onClick={() => setToast("Inspector opened")}>
            Inspector
          </button>
        </nav>
        <article>
          <h3>OPTICS Parameters</h3>
          <label>
            MinPts (min samples) ⓘ{" "}
            <input
              aria-label="MinPts numeric"
              type="number"
              min="3"
              max={Math.min(100, points.length)}
              value={minPts}
              onChange={(e) => setMinPts(Number(e.target.value))}
            />
          </label>
          <input
            aria-label="MinPts"
            type="range"
            min="3"
            max={Math.min(100, points.length)}
            value={minPts}
            onChange={(e) => setMinPts(Number(e.target.value))}
          />
          <small>3 ------------------------------ 100</small>
          <label>
            Max Distance ⓘ{" "}
            <select
              disabled={autoDistance}
              value={autoDistance ? "auto" : "custom"}
              onChange={() => undefined}
            >
              <option value="auto">Auto (by data)</option>
              <option value="custom">Custom</option>
            </select>
            <input
              aria-label="Auto max distance"
              type="checkbox"
              checked={autoDistance}
              onChange={(e) => setAutoDistance(e.target.checked)}
            />
          </label>
          {!autoDistance && (
            <input
              aria-label="Max distance"
              type="number"
              min="0.1"
              step="0.1"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
            />
          )}
          <label>
            Distance Metric
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as OpticsMetric)}
            >
              <option value="euclidean">Euclidean</option>
              <option value="manhattan">Manhattan</option>
            </select>
          </label>
        </article>
        <article>
          <h3>⌄ Cluster Extraction</h3>
          <label>
            Epsilon (ε) – Reachability Threshold ⓘ{" "}
            <input
              aria-label="Extract clusters"
              type="checkbox"
              checked={extract}
              onChange={(e) => setExtract(e.target.checked)}
            />
          </label>
          <input
            aria-label="Epsilon numeric"
            type="number"
            min="0.05"
            max="3"
            step="0.01"
            value={epsilon}
            onChange={(e) => setEpsilon(Number(e.target.value))}
          />
          <input
            aria-label="Epsilon"
            type="range"
            min="0.05"
            max="3"
            step="0.01"
            value={epsilon}
            onChange={(e) => setEpsilon(Number(e.target.value))}
          />
          <label>
            Extract DBSCAN* Clusters{" "}
            <input
              aria-label="DBSCAN extraction"
              type="checkbox"
              checked={extract}
              onChange={(e) => setExtract(e.target.checked)}
            />
          </label>
          <label>
            Highlight
            <select
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
            >
              <option value="all">All clusters</option>
              {sizes.map((_, i) => (
                <option value={i} key={i}>
                  Cluster {i + 1}
                </option>
              ))}
            </select>
          </label>
        </article>
        <article>
          <h3>⌄ Styling</h3>
          <p>Color palette is the lab vivid set (pastel is not a second renderer).</p>
          <label>
            Show Core Points{" "}
            <input
              type="checkbox"
              checked={showCore}
              onChange={(e) => setShowCore(e.target.checked)}
            />
          </label>
          <label>
            Show Ordering Path{" "}
            <input
              type="checkbox"
              checked={showPath}
              onChange={(e) => setShowPath(e.target.checked)}
            />
          </label>
          <label>
            Log Scale (Reachability){" "}
            <input
              type="checkbox"
              checked={logScale}
              onChange={(e) => setLogScale(e.target.checked)}
            />
          </label>
        </article>
        <footer>
          <button
            className="primary"
            onClick={() => setToast("OPTICS recomputed")}
          >
            ⟳ Recompute
          </button>
          <button onClick={reset}>↶ Reset</button>
        </footer>
      </aside>
      <footer className="op-status">
        ▱ Dataset: <b>{NAMES[dataset]}</b>
        <span>
          Metric: <b>{metric === "euclidean" ? "Euclidean" : "Manhattan"}</b>
          {" | "}☷ MinPts: <b>{minPts}</b> {" | "}ε: <b>{epsilon}</b> {" | "}
          <i>✓ Updated just now</i>
        </span>
      </footer>
      {toast && (
        <button className="op-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
