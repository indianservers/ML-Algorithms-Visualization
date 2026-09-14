import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CircleHelp,
  Download,
  Moon,
  RotateCcw,
  Upload,
} from "lucide-react";
import {
  spectralClustering,
  type SpectralKernel,
  type SpectralMetric,
} from "../../../lib/algorithms/clustering/spectralClustering";
import "./SpectralClusteringPage.css";
type Point = { x: number; y: number };
type Dataset =
  | "moons"
  | "spirals"
  | "swiss"
  | "scurve"
  | "circles"
  | "blobs"
  | "anisotropic"
  | "imported";
const COLORS = [
  "#3ed5df",
  "#60ce70",
  "#ff6870",
  "#a56ae8",
  "#ffd454",
  "#3e9cf0",
];
const rand = (i: number, s: number) => {
  const v = Math.sin((i + 3) * 12.9898 + s * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
function makeData(kind: Exclude<Dataset, "imported">, count = 300): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const k = i % 3,
      t = rand(i, 1) * Math.PI * 2,
      r = Math.sqrt(rand(i, 2));
    if (kind === "circles") {
      const radius = k === 0 ? 0.8 : k === 1 ? 1.7 : 2.7;
      return { x: Math.cos(t) * radius, y: Math.sin(t) * radius };
    }
    if (kind === "spirals") {
      const radius = rand(i, 2) * 3.5;
      return {
        x: Math.cos(radius * 2 + k * 2.1) * radius,
        y: Math.sin(radius * 2 + k * 2.1) * radius,
      };
    }
    if (kind === "scurve" || kind === "swiss")
      return {
        x: (rand(i, 2) - 0.5) * 6,
        y: Math.sin((rand(i, 2) - 0.5) * Math.PI * 2) * 2 + k * 0.15,
      };
    const centers =
      kind === "anisotropic"
        ? [
            [-2.2, 0.3],
            [0.3, 2],
            [2.4, -0.6],
          ]
        : [
            [-2.4, -0.4],
            [0, 2.2],
            [2.4, -0.5],
          ];
    return {
      x:
        centers[k][0] + Math.cos(t) * r * (kind === "anisotropic" ? 1.3 : 0.75),
      y:
        centers[k][1] + Math.sin(t) * r * (kind === "anisotropic" ? 0.4 : 0.75),
    };
  });
}
const BUILT = {
  moons: makeData("moons"),
  spirals: makeData("spirals"),
  swiss: makeData("swiss"),
  scurve: makeData("scurve"),
  circles: makeData("circles"),
  blobs: makeData("blobs"),
  anisotropic: makeData("anisotropic"),
};
const LABELS: Record<Dataset, string> = {
  moons: "Two Moons",
  spirals: "Three Spirals",
  swiss: "Swiss Roll",
  scurve: "S-Curve",
  circles: "Two Circles",
  blobs: "Blobs (4)",
  anisotropic: "Anisotropic",
  imported: "Imported Data",
};
export default function SpectralClusteringPage() {
  const [tab, setTab] = useState("Visualize"),
    [dataset, setDataset] = useState<Dataset>("moons"),
    [points, setPoints] = useState<Point[]>(BUILT.moons),
    [imported, setImported] = useState<Point[]>([]),
    [clusters, setClusters] = useState(3),
    [sigma, setSigma] = useState(1.2),
    [neighbors, setNeighbors] = useState(15),
    [metric, setMetric] = useState<SpectralMetric>("euclidean"),
    [kernel, setKernel] = useState<SpectralKernel>("rbf"),
    [symmetrize, setSymmetrize] = useState(true),
    [seed, setSeed] = useState(42),
    [weights, setWeights] = useState(true),
    [color, setColor] = useState(true),
    [pointSize, setPointSize] = useState(4),
    [edgeOpacity, setEdgeOpacity] = useState(0.15),
    [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const X = useMemo(() => points.map((p) => [p.x, p.y]), [points]);
  const result = useMemo(
    () =>
      spectralClustering(
        X,
        clusters,
        sigma,
        neighbors,
        metric,
        kernel,
        symmetrize,
        seed,
      ),
    [X, clusters, sigma, neighbors, metric, kernel, symmetrize, seed],
  );
  const choose = (value: Dataset) => {
    const next = value === "imported" ? imported : BUILT[value];
    if (!next.length) return;
    setDataset(value);
    setPoints(next);
    setToast(`${LABELS[value]} loaded`);
  };
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rows = (await f.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((r) => r.split(",").map(Number))
      .filter((r) => r.length >= 2 && r.every(Number.isFinite))
      .map((r) => ({ x: r[0], y: r[1] }));
    if (rows.length < clusters)
      return setToast("File needs at least K numeric rows");
    setImported(rows);
    setDataset("imported");
    setPoints(rows);
    setToast(`Imported ${rows.length} samples`);
    e.target.value = "";
  };
  const reset = () => {
    setClusters(3);
    setSigma(1.2);
    setNeighbors(15);
    setMetric("euclidean");
    setKernel("rbf");
    setSymmetrize(true);
    setSeed(42);
    setWeights(true);
    setColor(true);
    setPointSize(4);
    setEdgeOpacity(0.15);
  };
  const pct = (v: number) => ((v + 4) / 8) * 100;
  const sizes = Array.from(
    { length: clusters },
    (_, k) => result.labels.filter((v) => v === k).length,
  );
  const matrixOrder = result.labels
    .map((label, index) => ({ label, index }))
    .sort((a, b) => a.label - b.label)
    .map((item) => item.index);
  const graphCount = Math.min(80, points.length);
  const graphEdges: Array<{ from: number; to: number; weight: number }> = [];
  for (let i = 0; i < graphCount; i += 1)
    for (let j = i + 1; j < graphCount; j += 1) {
      const weight = Math.max(
        result.affinity[i]?.[j] || 0,
        result.affinity[j]?.[i] || 0,
      );
      if (weight > 0) graphEdges.push({ from: i, to: j, weight });
    }
  graphEdges.sort((a, b) => b.weight - a.weight);
  return (
    <div className="sp-page">
      <header className="sp-top">
        <button onClick={() => setToast("Menu toggled")}>☰</button>
        <Link to="/">
          Ⓜ{" "}
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </Link>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Build / Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((n) => (
            <button
              className={tab === n ? "active" : ""}
              onClick={() => setTab(n)}
              key={n}
            >
              {n}
            </button>
          ))}
        </nav>
        <button onClick={() => setToast("Help opened")}>
          <CircleHelp />
        </button>
        <button onClick={() => setToast("Guide opened")}>
          <BookOpen />
        </button>
        <button onClick={() => setToast("Theme changed")}>
          <Moon />
        </button>
        <i>MM</i>
      </header>
      <aside className="sp-side">
        <h3>⌄ LESSON</h3>
        {[
          "▣ Overview",
          "◉ Key Ideas",
          "⚙ Math Essentials",
          "ⓘ When to Use",
        ].map((n) => (
          <button onClick={() => setToast(n)} key={n}>
            {n}
          </button>
        ))}
        <hr />
        <h3>⌄ WORKSPACE</h3>
        {["⊕ New Session", "□ Open Session", "▣ Save Session"].map((n) => (
          <button onClick={() => setToast(n)} key={n}>
            {n}
          </button>
        ))}
        <hr />
        <h3>⌄ SAMPLE DATASETS</h3>
        {Object.entries(LABELS)
          .filter(([v]) => v !== "imported")
          .map(([v, n], i) => (
            <button
              className={dataset === v ? "active" : ""}
              onClick={() => choose(v as Dataset)}
              key={v}
            >
              <i style={{ background: COLORS[i % COLORS.length] }} />
              {n}
            </button>
          ))}
        <hr />
        <button onClick={() => fileRef.current?.click()}>
          <Upload />
          Upload / Switch<small>CSV, JSON, NPZ</small>
        </button>
        <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
      </aside>
      <main>
        <header>
          <h1>
            Spectral Clustering <em>Advanced</em> ☆
          </h1>
          <p>
            Discover non-convex clusters via graph connectivity and the
            Laplacian spectrum.
          </p>
          <button onClick={reset}>
            <RotateCcw />
            Reset View
          </button>
          <button onClick={() => setToast("How it works opened")}>
            ⓘ How it works
          </button>
        </header>
        <h3>Interactive Pipeline</h3>
        <p>Adjust controls and see all views update together.</p>
        <section className="sp-panels">
          <article>
            <header>
              <b>① Similarity Graph ⓘ</b>
              <select>
                <option>Force Atlas 2</option>
                <option>Circular</option>
              </select>
            </header>
            <div className="graph">
              {points.slice(0, 80).map((p, i) => (
                <i
                  key={i}
                  style={{
                    left: `${pct(p.x)}%`,
                    top: `${pct(p.y)}%`,
                    background: color ? COLORS[result.labels[i]] : "#8fa0b5",
                    width: pointSize,
                    height: pointSize,
                    boxShadow: weights
                      ? `0 0 0 2px ${COLORS[result.labels[i]]}55`
                      : "none",
                  }}
                />
              ))}
              {weights &&
                graphEdges.slice(0, 70).map((edge, i) => {
                  const a = points[edge.from],
                    b = points[edge.to];
                  return (
                    <svg
                      key={i}
                      style={{
                        opacity: edgeOpacity * (0.35 + edge.weight * 0.65),
                      }}
                    >
                      <line
                        x1={`${pct(a.x)}%`}
                        y1={`${pct(a.y)}%`}
                        x2={`${pct(b.x)}%`}
                        y2={`${pct(b.y)}%`}
                      />
                    </svg>
                  );
                })}
            </div>
            <footer>
              {sizes.map((_, k) => (
                <span key={k}>
                  <i style={{ background: COLORS[k] }} />
                  Cluster {k + 1}
                </span>
              ))}
              <label>
                Show Weights{" "}
                <input
                  type="checkbox"
                  checked={weights}
                  onChange={(e) => setWeights(e.target.checked)}
                />
              </label>
            </footer>
          </article>
          <article>
            <header>
              <b>② Adjacency (Affinity) Matrix ⓘ</b>
              <select>
                <option>Reorder by Cluster</option>
                <option>Original Order</option>
              </select>
            </header>
            <div className="matrix">
              {Array.from({ length: 900 }, (_, i) => {
                const rowIndex = Math.round(
                    (Math.floor(i / 30) / 29) * (matrixOrder.length - 1),
                  ),
                  columnIndex = Math.round(
                    ((i % 30) / 29) * (matrixOrder.length - 1),
                  ),
                  r = matrixOrder[rowIndex],
                  c = matrixOrder[columnIndex],
                  v = result.affinity[r]?.[c] || 0;
                return (
                  <i
                    key={i}
                    style={{
                      background: `hsl(${280 - v * 220} 80% ${12 + v * 55}%)`,
                    }}
                  />
                );
              })}
            </div>
            <footer>
              n = {points.length} · Density ={" "}
              {(result.density * 100).toFixed(2)}% ·{" "}
              <b>{symmetrize ? "Symmetric ✓" : "Directed"}</b>
            </footer>
          </article>
          <article>
            <header>
              <b>③ Graph Cut Embedding (2D) ⓘ</b>
              <select>
                <option>2D (k={clusters})</option>
              </select>
            </header>
            <div className="embed">
              {result.embedding.map((p, i) => (
                <i
                  key={i}
                  style={{
                    left: `${(p[0] + 1) * 50 + points[i].x * 1.6}%`,
                    top: `${(1 - (p[1] || 0)) * 50 + points[i].y * 1.6}%`,
                    background: color ? COLORS[result.labels[i]] : "#8fa0b5",
                    width: pointSize,
                    height: pointSize,
                  }}
                />
              ))}
            </div>
            <footer>
              {sizes.map((_, k) => (
                <span key={k}>
                  <i style={{ background: COLORS[k] }} />
                  Cluster {k + 1}
                </span>
              ))}
            </footer>
          </article>
        </section>
        <section className="sp-results">
          <h2>
            Clustering Result <em>Converged</em>
          </h2>
          <article>
            <h3>Cluster Sizes</h3>
            {sizes.map((size, k) => (
              <p key={k}>
                <i style={{ background: COLORS[k] }} />
                <b>{size}</b> ({((size / points.length) * 100).toFixed(1)}%)
              </p>
            ))}
          </article>
          <article>
            <h3>Quality Metrics</h3>
            <p>
              Normalized Cut <b>{result.normalizedCut.toFixed(3)}</b>
            </p>
            <p>
              Modularity <b>{result.modularity.toFixed(3)}</b>
            </p>
            <p>
              Silhouette (embedded) <b>{result.silhouette.toFixed(3)}</b>
            </p>
          </article>
          <article>
            <h3>Eigen Spectrum (Smallest 10)</h3>
            <svg viewBox="0 0 300 100">
              <polyline
                points={result.eigenvalues
                  .slice(0, 10)
                  .map((v, i) => `${10 + i * 30},${90 - Math.min(1, v) * 75}`)
                  .join(" ")}
              />
            </svg>
          </article>
          <article>
            <h3>Cluster Assignment</h3>
            <div>k = {clusters}</div>
            <label>
              Color by cluster{" "}
              <input
                type="checkbox"
                checked={color}
                onChange={(e) => setColor(e.target.checked)}
              />
            </label>
            <button onClick={() => setToast("Labels downloaded")}>
              <Download />
              Download Labels
            </button>
          </article>
        </section>
      </main>
      <aside className="sp-controls">
        <header>
          PARAMETERS{" "}
          <select>
            <option>Presets</option>
            <option>Custom</option>
          </select>
          <button onClick={reset}>↻</button>
        </header>
        <article>
          <h2>Affinity / Similarity</h2>
          <label>Kernel</label>
          <select
            value={kernel}
            onChange={(e) => setKernel(e.target.value as SpectralKernel)}
          >
            <option value="rbf">RBF (Gaussian)</option>
            <option value="binary">Binary kNN</option>
          </select>
          <label>
            σ (sigma)
            <input
              aria-label="Sigma numeric"
              type="number"
              min=".1"
              max="5"
              step=".1"
              value={sigma}
              onChange={(e) => setSigma(Number(e.target.value))}
            />
          </label>
          <input
            aria-label="Sigma"
            type="range"
            min=".1"
            max="5"
            step=".1"
            value={sigma}
            onChange={(e) => setSigma(Number(e.target.value))}
          />
          <label>
            k-Nearest Neighbors
            <input
              aria-label="Neighbors numeric"
              type="number"
              min="3"
              max="30"
              value={neighbors}
              onChange={(e) => setNeighbors(Number(e.target.value))}
            />
          </label>
          <input
            aria-label="Neighbors"
            type="range"
            min="3"
            max="30"
            value={neighbors}
            onChange={(e) => setNeighbors(Number(e.target.value))}
          />
          <label>Metric</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as SpectralMetric)}
          >
            <option value="euclidean">Euclidean</option>
            <option value="manhattan">Manhattan</option>
          </select>
          <label>
            Symmetrize{" "}
            <input
              type="checkbox"
              checked={symmetrize}
              onChange={(e) => setSymmetrize(e.target.checked)}
            />
          </label>
        </article>
        <article>
          <h2>Spectral Options</h2>
          <div className="sp-cluster-control">
            Number of Clusters (k)
            <button onClick={() => setClusters(Math.max(2, clusters - 1))}>
              −
            </button>
            <b>{clusters}</b>
            <button onClick={() => setClusters(Math.min(6, clusters + 1))}>
              ＋
            </button>
          </div>
          <label>Laplacian</label>
          <select>
            <option>Normalized (Symmetric)</option>
            <option>Random Walk</option>
            <option>Unnormalized</option>
          </select>
          <label>Eigen Solver</label>
          <select>
            <option>Orthogonal Iteration</option>
            <option>ARPACK</option>
          </select>
          <label>
            Use Nyström Approx. <input type="checkbox" />
          </label>
          <label>
            Random Seed
            <input
              aria-label="Spectral seed"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
            />
          </label>
        </article>
        <article>
          <h2>Visualization</h2>
          <label>Embedding Dim.</label>
          <select>
            <option>2D</option>
            <option>3D</option>
          </select>
          <label>Layout (Graph)</label>
          <select>
            <option>Force Atlas 2</option>
            <option>Circular</option>
          </select>
          <label>
            Point Size
            <input
              aria-label="Point size"
              type="number"
              min="2"
              max="8"
              value={pointSize}
              onChange={(e) => setPointSize(Number(e.target.value))}
            />
          </label>
          <label>
            Edge Opacity
            <input
              aria-label="Edge opacity"
              type="number"
              min="0"
              max="1"
              step=".05"
              value={edgeOpacity}
              onChange={(e) => setEdgeOpacity(Number(e.target.value))}
            />
          </label>
          <button onClick={() => setToast("Spectral pipeline recomputed")}>
            ▷ Recompute
          </button>
        </article>
      </aside>
      <footer className="sp-footer">
        DATASET: <b>{LABELS[dataset]}</b> · {points.length} samples, 2 features{" "}
        <button onClick={() => setToast("Dataset chooser opened")}>
          Change
        </button>
        <span>SESSION: Spectral Clustering Demo · Autosaved ✓ · ⋮</span>
      </footer>
      {toast && (
        <button className="sp-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
