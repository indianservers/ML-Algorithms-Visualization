import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLabNavigate } from "../../../lib/labNavigation";
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
import {
  datasetAWellSeparatedBlobs,
  datasetETwoMoons,
  datasetFConcentricCircles,
  datasetIElongated,
} from "../../../lib/clustering/clusteringDatasets";
import {
  LAB_TABS,
  LabLessonPanel,
  isLabTab,
  useLabTabs,
} from "../../../components/common/LabTabs";
import { LabHeatmap } from "../../../components/common/LabHeatmap";
import { LabNodeGraph } from "../../../components/common/LabNodeGraph";
import { LabPipeline } from "../../../components/common/LabPipeline";
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
function makeManifold(kind: "spirals" | "swiss" | "scurve", count = 90): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const k = i % 3;
    if (kind === "spirals") {
      const radius = rand(i, 2) * 3.2;
      return {
        x: Math.cos(radius * 2 + k * 2.1) * radius,
        y: Math.sin(radius * 2 + k * 2.1) * radius,
      };
    }
    return {
      x: (rand(i, 2) - 0.5) * 6,
      y: Math.sin((rand(i, 2) - 0.5) * Math.PI * 2) * 2 + k * 0.15,
    };
  });
}
const BUILT = {
  moons: datasetETwoMoons(),
  spirals: makeManifold("spirals"),
  swiss: makeManifold("swiss"),
  scurve: makeManifold("scurve"),
  circles: datasetFConcentricCircles(),
  blobs: datasetAWellSeparatedBlobs(),
  anisotropic: datasetIElongated(),
};
const LABELS: Record<Dataset, string> = {
  moons: "Two moons",
  spirals: "Three spirals",
  swiss: "Swiss-like 2D fold",
  scurve: "S-curve fold",
  circles: "Concentric circles",
  blobs: "Well-separated blobs",
  anisotropic: "Elongated clusters",
  imported: "Imported Data",
};
export default function SpectralClusteringPage() {
  const { tab, setTab, panel, layout, lesson } = useLabTabs("Learn"),
    [dataset, setDataset] = useState<Dataset>("moons"),
    [points, setPoints] = useState<Point[]>(BUILT.moons),
    [imported, setImported] = useState<Point[]>([]),
    [clusters, setClusters] = useState(2),
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
    [toast, setToast] = useState(""),
    [stage, setStage] = useState(0),
    [playing, setPlaying] = useState(false),
    [picked, setPicked] = useState<number | null>(null);
  const go = useLabNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const X = useMemo(() => points.map((p) => [p.x, p.y]), [points]);
  const safeK = Math.max(2, Math.min(clusters, Math.max(2, X.length)));
  const fitted = useMemo(() => {
    try {
      return {
        result: spectralClustering(
          X,
          safeK,
          Math.max(1e-3, sigma),
          Math.max(1, Math.min(neighbors, X.length - 1)),
          metric,
          kernel,
          symmetrize,
          seed,
        ),
        error: "",
      };
    } catch (error) {
      return {
        result: null as ReturnType<typeof spectralClustering> | null,
        error: error instanceof Error ? error.message : "Spectral clustering failed",
      };
    }
  }, [X, safeK, sigma, neighbors, metric, kernel, symmetrize, seed]);
  const result = fitted.result;
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
    setStage(0);
    setPlaying(false);
  };
  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStage((current) => {
        if (current >= 5) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing]);
  if (!result) {
    return (
      <div className="sp-page">
        <main>
          <h1>Spectral Clustering</h1>
          <p role="alert">{fitted.error}</p>
          <button onClick={reset}>Reset</button>
        </main>
      </div>
    );
  }
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
  const SPECTRAL_STAGES = [
    "Data",
    "Similarity Graph",
    "Affinity Matrix",
    "Laplacian",
    "Eigenvector Embedding",
    "Final Clusters",
  ];
  const viewStage = isLabTab(tab, "Dataset") ? 0 : stage;
  const heatN = Math.min(16, result.affinity.length);
  const heatIdx = matrixOrder.slice(0, heatN);
  const affPreview = heatIdx.map((i) => heatIdx.map((j) => result.affinity[i]?.[j] ?? 0));
  const lapPreview = heatIdx.map((i) =>
    heatIdx.map((j) => result.unnormalizedLaplacian[i]?.[j] ?? 0),
  );
  const heatLabels = heatIdx.map((i) => String(i));
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
        <nav role="tablist" aria-label="Spectral Clustering sections">
          {LAB_TABS.map((n) => (
            <button
              role="tab"
              aria-selected={tab === n}
              className={tab === n ? "active" : ""}
              onClick={() => setTab(n)}
              key={n}
            >
              {n}
            </button>
          ))}
        </nav>
        <button onClick={() => go("Help")}>
          <CircleHelp />
        </button>
        <button onClick={() => go("Guide")}>
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
          <button onClick={() => go(n)} key={n}>
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
      <main className={layout.trim()}>
        <header className={panel("Visualize", "Dataset", "Build / Train", "Metrics").trim()}>
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
        {lesson && (
          <LabLessonPanel tab={tab} route="/ml/clustering/spectral-clustering" />
        )}
        <div className={panel("Visualize", "Build / Train").trim()}>
          <LabPipeline
            stages={SPECTRAL_STAGES}
            active={viewStage}
            onSelect={(index) => {
              setPlaying(false);
              setStage(index);
            }}
            playing={playing}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onStep={() => setStage((current) => Math.min(5, current + 1))}
            onReset={() => {
              setPlaying(false);
              setStage(0);
            }}
            note="Data → graph → affinity → Laplacian → eigenvectors → clusters. Edges are the strongest similarities only."
          />
        </div>
        <section
          className={`sp-panels${panel("Visualize", "Dataset", "Build / Train")}${layout}`}
        >
          {(viewStage === 0 || viewStage === 1 || viewStage === 5) && (
            <article>
              <header>
                <b>
                  {viewStage === 0
                    ? "① Data"
                    : viewStage === 1
                      ? "② Similarity graph (thinned edges)"
                      : "⑥ Final clusters"}
                </b>
              </header>
              <div className="graph">
                <LabNodeGraph
                  points={points.slice(0, graphCount)}
                  edges={graphEdges}
                  colors={viewStage === 5 && color ? COLORS : ["#8fa0b5"]}
                  labels={viewStage === 5 ? result.labels : points.map(() => 0)}
                  selected={picked}
                  onSelect={setPicked}
                  showEdges={viewStage >= 1 && weights}
                  maxEdges={Math.min(48, neighbors * 3)}
                />
              </div>
              <footer>
                {viewStage === 5 &&
                  sizes.map((_, k) => (
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
          )}
          {(viewStage === 2 || viewStage === 3) && (
            <article>
              <header>
                <b>
                  {viewStage === 2
                    ? "③ Affinity matrix (16×16 preview, cluster order)"
                    : "④ Unnormalized Laplacian L = D − A (preview)"}
                </b>
              </header>
              <LabHeatmap
                matrix={viewStage === 2 ? affPreview : lapPreview}
                rowLabels={heatLabels}
                colLabels={heatLabels}
                signed={viewStage === 3}
                selected={
                  picked != null && heatIdx.includes(picked)
                    ? { r: heatIdx.indexOf(picked), c: heatIdx.indexOf(picked) }
                    : null
                }
                onSelect={(cell) => setPicked(heatIdx[cell.r] ?? null)}
                caption="Preview of strongest-block samples so the grid stays readable."
              />
              <footer>
                n = {points.length} · Density ={" "}
                {(result.density * 100).toFixed(2)}% ·{" "}
                <b>{symmetrize ? "Symmetric ✓" : "Directed"}</b>
              </footer>
            </article>
          )}
          {viewStage === 4 && (
            <article>
              <header>
                <b>⑤ Eigenvector embedding (first two coordinates)</b>
              </header>
              <div className="embed">
                {result.embedding.map((p, i) => (
                  <i
                    key={i}
                    style={{
                      left: `${50 + (p[0] || 0) * 40}%`,
                      top: `${50 - (p[1] || 0) * 40}%`,
                      background: "#8fa0b5",
                      width: pointSize,
                      height: pointSize,
                    }}
                  />
                ))}
              </div>
              <footer>Uncolored on purpose — clustering happens after this map.</footer>
            </article>
          )}
        </section>
        <section className={`sp-results${panel("Metrics")}`}>
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
            <p>{result.laplacianForm}</p>
            <p>
              Affinity {result.affinity.length}×{result.affinity[0]?.length ?? 0};
              degree[0]={result.degree[0]?.toFixed(3)} ; L=D−A stored for
              inspection.
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
            σ (sigma) — RBF width for the similarity graph
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
          <p>
            Embedding uses the symmetric normalized affinity D^{-1/2} A D^{-1/2}.
            Unnormalized L = D − A is stored for inspection. Other Laplacian
            forms are not implemented in this lab.
          </p>
          <label>Eigen Solver</label>
          <p>Orthogonal iteration in the browser (ARPACK/Nyström are not used).</p>
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
        <button onClick={() => go("Dataset Library")}>
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
