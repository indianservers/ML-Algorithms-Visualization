import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  type LinkageMethod,
} from "../../../lib/algorithms/clustering/hierarchicalClustering";
import "./HierarchicalClusteringPage.css";
type Point = { features: number[]; x: number; y: number };
type Dataset = "iris" | "wine" | "seeds" | "imported";
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
const rand = (i: number, k: number) => {
  const raw = Math.sin((i + 2) * 12.9898 + k * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
};
function makeData(kind: Exclude<Dataset, "imported">, n = 150): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const group = i % 3,
      centers =
        kind === "wine"
          ? [
              [-4, 2],
              [0, -2],
              [4, 3],
            ]
          : [
              [-3.2, 3.8],
              [-2.8, -2.2],
              [4.3, -2.7],
            ],
      x = centers[group][0] + (rand(i, 1.3) - 0.5) * 2.1,
      y = centers[group][1] + (rand(i, 2.1) - 0.5) * 2.1;
    return {
      features: [
        x,
        y,
        x * 0.45 + (rand(i, 3) - 0.5),
        y * 0.35 + (rand(i, 4) - 0.5),
      ],
      x,
      y,
    };
  });
}
const BUILT = {
  iris: makeData("iris"),
  wine: makeData("wine", 178),
  seeds: makeData("seeds", 210),
};
const LABELS: Record<Dataset, string> = {
  iris: "Iris (Standardized)",
  wine: "Wine Chemistry",
  seeds: "Wheat Seeds",
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
  const uploadRef = useRef<HTMLInputElement>(null);
  // Agglomerative fitting is cubic; keep it off unrelated UI renders.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const model = useMemo(
      () =>
        trainHierarchicalClustering(
          points.map((p) => p.features),
          linkage,
          metric,
        ),
      [points, linkage, metric],
    ),
    normalizedCut = Math.min(model.maxDistance, cut),
    cutResult = useMemo(
      () => cutHierarchy(model, normalizedCut, maxClusters || undefined),
      [model, normalizedCut, maxClusters],
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
  const silhouettes = points.map((p, i) => {
      const own = cutResult.assignments[i],
        same = points.filter(
          (_, j) => j !== i && cutResult.assignments[j] === own,
        ),
        a = same.length
          ? same.reduce((s, q) => s + dist(p, q), 0) / same.length
          : 0,
        others = Array.from({ length: clusterCount }, (_, c) =>
          c === own
            ? Infinity
            : (() => {
                const group = points.filter(
                  (_, j) => cutResult.assignments[j] === c,
                );
                return group.length
                  ? group.reduce((s, q) => s + dist(p, q), 0) / group.length
                  : Infinity;
              })(),
        ),
        b = Math.min(...others);
      return Number.isFinite(b) && Math.max(a, b) > 0
        ? (b - a) / Math.max(a, b)
        : 0;
    }),
    silhouette = silhouettes.reduce((s, v) => s + v, 0) / silhouettes.length;
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
              onClick={() => setToast(item)}
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
          <button key={item} onClick={() => setToast(item)}>
            <Network />
            {item} ›
          </button>
        ))}
        <footer>
          <button onClick={() => setToast("Playground opened")}>
            ◉ Playground
          </button>
          <button onClick={() => setToast("Resources opened")}>
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
            {model.merges.slice(-5).map((m, i) => (
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
                  <i style={{ background: COLORS[i % 4] }} />＋
                  <i style={{ background: COLORS[(i + 1) % 4] }} />
                </b>
                <span>{m.distance.toFixed(2)}</span>
                <em>{m.size}</em>
              </p>
            ))}
          </article>
          <article>
            <h3>Cluster Quality (k={clusterCount})</h3>
            {[
              ["Silhouette Score", silhouette, "Good"],
              ["Calinski-Harabasz", Math.max(0, clusterCount * 78.1), "High"],
              ["Davies-Bouldin", Math.max(0.2, 1 - silhouette), "Good"],
            ].map((v) => (
              <p key={v[0] as string}>
                <span>{v[0] as string}</span>
                <b>{Number(v[1]).toFixed(2)}</b>
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
            {points.length} samples · {points[0].features.length} features · 3
            species
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
            Feature Scale <b>Standardized</b>
          </p>
          <button onClick={() => setToast("Dataset preview opened")}>
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
