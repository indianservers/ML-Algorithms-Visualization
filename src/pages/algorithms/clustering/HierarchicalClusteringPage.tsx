import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLabNavigate } from "../../../lib/labNavigation";
import {
  Bell,
  BrainCircuit,
  Check,
  ChevronDown,
  Database,
  HelpCircle,
  Network,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react";
import {
  cutHierarchy,
  trainHierarchicalClustering,
  type HierarchicalMetric,
  type HierarchicalModel,
  type LinkageMethod,
} from "../../../lib/algorithms/clustering/hierarchicalClustering";
import {
  datasetAWellSeparatedBlobs,
  datasetBFourBlobs,
  datasetETwoMoons,
  datasetHBridge,
  datasetIElongated,
  datasetLHighDimensional,
} from "../../../lib/clustering/clusteringDatasets";
import { compareClusteringSuite } from "../../../lib/clustering/clusteringCompare";
import {
  calinskiHarabaszIndex,
  daviesBouldinIndex,
  formatCl,
  projectPca2d,
  silhouetteScore,
} from "../../../lib/clustering/clusteringEval";
import { ClusteringDiagnosticsPanel } from "../../../components/ml/ClusteringDiagnosticsPanel";
import "./HierarchicalClusteringPage.css";
const EMPTY_HIER: HierarchicalModel = {
  sampleCount: 0,
  merges: [],
  maxDistance: 0,
};
type Point = { features: number[]; x: number; y: number };
type Dataset = "iris" | "wine" | "seeds" | "moons" | "four" | "highdim" | "imported";
type Tab =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
const COLORS = [
  "#25bed2",
  "#63c741",
  "#ffad19",
  "#ff5959",
  "#8b6ce8",
  "#2d8cff",
];
const TABS: Tab[] = [
  "learn",
  "visualize",
  "dataset",
  "train",
  "metrics",
  "compare",
  "explain",
];
function fromCloud(
  source: { x: number; y: number; features?: number[] }[],
): Point[] {
  if (source[0]?.features && source[0].features.length > 2) {
    const projected = projectPca2d(source.map((point) => point.features!));
    return source.map((point, index) => ({
      features: point.features!,
      x: projected[index][0],
      y: projected[index][1],
    }));
  }
  return source.map((point) => ({
    features: [point.x, point.y],
    x: point.x,
    y: point.y,
  }));
}
const BUILT = {
  iris: fromCloud(datasetAWellSeparatedBlobs()),
  wine: fromCloud(datasetHBridge()),
  seeds: fromCloud(datasetIElongated()),
  moons: fromCloud(datasetETwoMoons()),
  four: fromCloud(datasetBFourBlobs()),
  highdim: fromCloud(datasetLHighDimensional()),
};
const LABELS: Record<Dataset, string> = {
  iris: "Well-separated blobs",
  wine: "Bridge / chaining clusters",
  seeds: "Elongated clusters",
  moons: "Two moons",
  four: "Four blobs",
  highdim: "4D blobs (cluster all dims, PCA plot)",
  imported: "Imported Dataset",
};
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export default function HierarchicalClusteringPage() {
  const [tab, setTab] = useState<Tab>("visualize"),
    [dataset, setDataset] = useState<Dataset>("iris"),
    [points, setPoints] = useState<Point[]>(BUILT.iris),
    [imported, setImported] = useState<Point[]>([]),
    [linkage, setLinkage] = useState<LinkageMethod>("ward"),
    [metric, setMetric] = useState<HierarchicalMetric>("euclidean"),
    [cut, setCut] = useState(6.2),
    [maxClusters, setMaxClusters] = useState(0),
    [animate, setAnimate] = useState(true),
    [speed, setSpeed] = useState("1.0x"),
    [toast, setToast] = useState("");
  const go = useLabNavigate();
  const uploadRef = useRef<HTMLInputElement>(null);
  // Agglomerative fitting is cubic; keep it off unrelated UI renders.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const trained = useMemo(() => {
      try {
        return {
          model: trainHierarchicalClustering(
            points.map((p) => p.features),
            linkage,
            metric,
          ),
          error: "",
        };
      } catch (error) {
        return {
          model: { ...EMPTY_HIER, sampleCount: points.length },
          error: error instanceof Error ? error.message : "Hierarchical fit failed",
        };
      }
    }, [points, linkage, metric]),
    model = trained.model,
    normalizedCut = Math.min(model.maxDistance || 0, cut),
    cutResult = useMemo(
      () => cutHierarchy(model, normalizedCut, maxClusters || undefined),
      [model, normalizedCut, maxClusters],
    );
  const compareRows = useMemo(
    () =>
      points.length <= 120
        ? compareClusteringSuite(points.map((p) => p.features), 42)
        : [],
    [points],
  );
  const clusterCount = cutResult.clusters.length,
    summaries = cutResult.clusters.slice(0, 6).map((cluster, index) => {
      const members = cluster.members.map((i) => points[i]),
        pairs = members.flatMap((a, i) =>
          members.slice(i + 1).map((b) => dist(a, b)),
        ),
        average = pairs.length
          ? pairs.reduce((s, v) => s + v, 0) / pairs.length
          : 0;
      return {
        index,
        size: members.length,
        average,
        diameter: Math.max(0, ...pairs),
      };
    });
  const silhouette = silhouetteScore(
      points.map((point) => point.features),
      cutResult.assignments,
    ),
    calinski = calinskiHarabaszIndex(
      points.map((point) => point.features),
      cutResult.assignments,
    ),
    davies = daviesBouldinIndex(
      points.map((point) => point.features),
      cutResult.assignments,
    );
  const choose = (next: Dataset) => {
    const source = next === "imported" ? imported : BUILT[next];
    if (!source.length) return;
    setDataset(next);
    setPoints(source.map((p) => ({ ...p, features: [...p.features] })));
    setToast(`${LABELS[next]} loaded`);
  };
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter((v) => v.length >= 2 && v.every(Number.isFinite))
      .map((v) => ({ features: v, x: v[0], y: v[1] }));
    if (rows.length < 4) {
      setToast("CSV needs at least two numeric features");
      return;
    }
    setImported(rows);
    setDataset("imported");
    setPoints(rows);
    setToast(`Imported ${rows.length} samples`);
    e.target.value = "";
  };
  const nodePos = new Map<number, { x: number; y: number }>();
  points.forEach((_, i) =>
    nodePos.set(i, { x: 5 + (i / Math.max(1, points.length - 1)) * 90, y: 96 }),
  );
  const dendro = model.merges.map((merge) => {
    const a = nodePos.get(merge.left)!,
      b = nodePos.get(merge.right)!,
      y = 94 - (merge.distance / (model.maxDistance || 1)) * 86,
      x = (a.x + b.x) / 2;
    nodePos.set(merge.id, { x, y });
    return { ...merge, a, b, x, y };
  });
  return (
    <div className="hc-page">
      <aside className="hc-nav">
        <Link to="/">
          <BrainCircuit />
          <span>
            <b>Mega ML</b>
            <small>AI OBSERVATORY</small>
          </span>
        </Link>
        <h3>LESSONS</h3>
        <section>
          <h4>
            <Network />
            Unsupervised Learning ⌃
          </h4>
          {[
            "K-Means Clustering",
            "Hierarchical Clustering",
            "DBSCAN",
            "Gaussian Mixture Model",
            "Spectral Clustering",
          ].map((item, i) => (
            <button
              className={i === 1 ? "active" : i === 0 ? "done" : ""}
              key={item}
              onClick={() => go(item)}
            >
              <i /> {item}
              {i === 0 ? <Check /> : i === 1 ? <b /> : null}
            </button>
          ))}
        </section>
        {[
          "Supervised Learning",
          "Deep Learning",
          "Feature Engineering",
          "Model Evaluation",
          "MLOps",
        ].map((item) => (
          <button key={item} onClick={() => go(item)}>
            <Network />
            {item} ›
          </button>
        ))}
        <footer>
          <button onClick={() => go("Playground")}>
            ◉ Playground
          </button>
          <button onClick={() => go("Help & Resources")}>
            <HelpCircle />
            Help & Resources
          </button>
        </footer>
      </aside>
      <header className="hc-top">
        <div>
          <h1>
            Hierarchical Clustering <em>Unsupervised</em>
          </h1>
          <p>
            Objective: Understand nested groupings by progressively merging
            similar observations.
          </p>
        </div>
        <section>
          Lesson Progress{" "}
          <i>
            <b />
          </i>
          <strong>37%</strong>
        </section>
        <button onClick={() => setToast("Theme changed")}>
          <Sun />
        </button>
        <button onClick={() => setToast("Notifications opened")}>
          <Bell />
        </button>
        <i>MK</i>
        <ChevronDown />
      </header>
      <main>
        <nav>
          {TABS.map((item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        <section className="hc-work">
          {trained.error && <p role="alert">{trained.error}</p>}
          {tab === "compare" && (
            <ClusteringDiagnosticsPanel
              algorithm="Hierarchical"
              dataset={LABELS[dataset]}
              samples={points.length}
              features={points[0]?.features.length ?? 0}
              preprocessing={
                (points[0]?.features.length ?? 0) > 2
                  ? "All selected dimensions; scatter is PCA"
                  : "Raw coordinates"
              }
              status={trained.error ? "ERROR" : "READY"}
              clustersFound={clusterCount}
              extras={[
                ["silhouette", formatCl(silhouette)],
                ["calinskiHarabasz", formatCl(calinski, 1)],
                ["daviesBouldin", formatCl(davies)],
              ]}
              why={
                linkage === "single" && dataset === "wine"
                  ? "Single linkage can chain through the bridge, merging the two blobs earlier than complete linkage."
                  : `Cut height ${normalizedCut.toFixed(2)} yields ${clusterCount} clusters from the stored dendrogram (hierarchy is not refit when only the cut changes).`
              }
              compare={compareRows}
            />
          )}
          <header>
            <h2>♧ Linked Dendrogram & Scatter ⓘ</h2>
            <p>Drag the cut height line to form clusters.</p>
            <label>
              ▣ Animate Merges{" "}
              <button
                className={animate ? "on" : ""}
                onClick={() => setAnimate(!animate)}
              >
                <i />
              </button>
              <select value={speed} onChange={(e) => setSpeed(e.target.value)}>
                <option>0.5x</option>
                <option>1.0x</option>
                <option>2.0x</option>
              </select>
            </label>
          </header>
          <div className="dendro">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              {dendro.map((m, i) => (
                <path
                  key={i}
                  d={`M${m.a.x},${m.a.y}V${m.y}H${m.b.x}V${m.b.y}`}
                  className={`c${cutResult.assignments[m.members[0]] % COLORS.length}`}
                />
              ))}
            </svg>
            <span
              style={{
                top: `${94 - (normalizedCut / (model.maxDistance || 1)) * 86}%`,
              }}
            >
              <b>{normalizedCut.toFixed(1)}</b>
            </span>
          </div>
          <div className="hc-scatter">
            {points.map((p, i) => (
              <i
                key={i}
                style={{
                  left: `${((p.x + 7) / 14) * 100}%`,
                  top: `${((7 - p.y) / 14) * 100}%`,
                  background: COLORS[cutResult.assignments[i] % COLORS.length],
                }}
              />
            ))}
            {cutResult.clusters.slice(0, 6).map((cluster, i) => {
              const m = cluster.members.map((j) => points[j]),
                x = m.reduce((s, p) => s + p.x, 0) / m.length,
                y = m.reduce((s, p) => s + p.y, 0) / m.length;
              return (
                <b
                  key={i}
                  style={{
                    left: `${((x + 7) / 14) * 100}%`,
                    top: `${((7 - y) / 14) * 100}%`,
                    borderColor: COLORS[i],
                  }}
                >
                  ＋
                </b>
              );
            })}
          </div>
          <footer>
            <strong>Clusters at cut height (k={clusterCount})</strong>
            {summaries.map((s) => (
              <span key={s.index}>
                <i style={{ background: COLORS[s.index] }} />
                Cluster {s.index + 1} ({s.size})
              </span>
            ))}
          </footer>
        </section>
        <section className="hc-cards">
          <article>
            <h3>Cluster Summary (k={clusterCount})</h3>
            <div className="summary-head">Size · Avg. Distance · Diameter</div>
            {summaries.map((s) => (
              <p key={s.index}>
                <span>
                  <i style={{ background: COLORS[s.index] }} />
                  Cluster {s.index + 1}
                </span>
                <b>{s.size}</b>
                <b>{s.average.toFixed(2)}</b>
                <b>{s.diameter.toFixed(2)}</b>
              </p>
            ))}
          </article>
          <article>
            <h3>Merge Log (last 5)</h3>
            <div className="merge-head">
              Step · Merge · Distance · Cluster Size
            </div>
            {model.merges.slice(-8).map((m, i) => (
              <p
                className={
                  Math.abs(m.distance - normalizedCut) <
                  model.maxDistance * 0.08
                    ? "active"
                    : ""
                }
                key={m.step}
              >
                {m.step}
                <b>
                  {m.left}＋{m.right}
                </b>
                <span>{m.distance.toFixed(3)}</span>
                <em>{m.size}</em>
              </p>
            ))}
          </article>
          <article>
            <h3>Cluster Quality (k={clusterCount})</h3>
            {[
              ["Silhouette Score", silhouette, silhouette == null ? "N/A (<2 clusters)" : "Good"],
              ["Calinski-Harabasz", calinski, calinski == null ? "N/A" : "High"],
              ["Davies-Bouldin", davies, davies == null ? "N/A" : "Lower is better"],
            ].map((v) => (
              <p key={v[0] as string}>
                <span>{v[0] as string}</span>
                <b>
                  {typeof v[1] === "number" ? v[1].toFixed(2) : "N/A"}
                </b>
                <em>{v[2] as string}</em>
                <i>
                  <b
                    style={{
                      width: `${Math.min(100, Math.max(8, Number(v[1]) * 80))}%`,
                    }}
                  />
                </i>
              </p>
            ))}
          </article>
        </section>
      </main>
      <aside className="hc-controls">
        <article>
          <h2>Algorithm Controls</h2>
          <label>Linkage (Distance) ⓘ</label>
          <select
            value={linkage}
            onChange={(e) => setLinkage(e.target.value as LinkageMethod)}
          >
            <option value="ward">Ward (Minimum Variance)</option>
            <option value="single">Single</option>
            <option value="complete">Complete</option>
            <option value="average">Average</option>
          </select>
          <label>Distance Metric</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as HierarchicalMetric)}
          >
            <option value="euclidean">Euclidean</option>
            <option value="manhattan">Manhattan</option>
          </select>
          <label>
            Cut Height
            <input
              aria-label="Cut Height numeric"
              type="number"
              value={cut}
              min="0"
              step=".1"
              onChange={(e) => setCut(Number(e.target.value))}
            />
          </label>
          <input
            aria-label="Cut Height"
            type="range"
            min="0"
            max={model.maxDistance}
            step=".1"
            value={normalizedCut}
            onChange={(e) => setCut(Number(e.target.value))}
          />
          <p>
            0 <span>{model.maxDistance.toFixed(1)}</span>
          </p>
          <label>Max Clusters (optional)</label>
          <input
            aria-label="Max Clusters"
            placeholder="e.g., 4"
            value={maxClusters || ""}
            onChange={(e) => setMaxClusters(Number(e.target.value) || 0)}
          />
        </article>
        <article>
          <h2>Dataset</h2>
          <b>
            <i /> {LABELS[dataset]} <small>×</small>
          </b>
          <p>
            {points[0].features.length > 2
              ? `${points.length} samples · clustering uses ${points[0].features.length} features. Plot is a 2D projection.`
              : `${points.length} samples · ${points[0].features.length} features`}
          </p>
          <select
            value={dataset}
            onChange={(e) => choose(e.target.value as Dataset)}
          >
            {Object.entries(LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button onClick={() => uploadRef.current?.click()}>
            <Upload />
            Upload CSV
            <br />
            <small>or drag and drop</small>
          </button>
          <input ref={uploadRef} type="file" accept=".csv" onChange={upload} />
        </article>
        <article>
          <h2>Data Overview</h2>
          <p>
            Samples <b>{points.length}</b>
            <br />
            Features <b>{points[0].features.length}</b>
            <br />
            Missing Values <b>0%</b>
            <br />
            Feature Scale <b>Raw coordinates (no z-score)</b>
          </p>
          <button onClick={() => go("Dataset Library")}>
            <Database />
            View Dataset ↗
          </button>
        </article>
      </aside>
      <footer className="hc-footer">
        <Sparkles />
        <p>
          <b>What's happening?</b>
          <br />
          Cut height = {normalizedCut.toFixed(1)} forms {clusterCount} clusters.
          Drag the line to explore different granularities.
        </p>
        <span>Next: Compare linkage methods</span>
        <button onClick={() => setTab("compare")}>Go to Compare →</button>
      </footer>
      {toast && (
        <button className="hc-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
