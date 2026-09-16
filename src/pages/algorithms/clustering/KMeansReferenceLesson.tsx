import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resolveNavRoute } from "../../../lib/labNavigation";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  CircleHelp,
  Database,
  FileText,
  FlaskConical,
  HelpCircle,
  Maximize2,
  Moon,
  Network,
  Notebook,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { kmeans, kmeansWithRestarts } from "../../../lib/algorithms/clustering/kmeans";
import {
  datasetAWellSeparatedBlobs,
  datasetBFourBlobs,
  datasetETwoMoons,
  datasetFConcentricCircles,
  datasetGNoisyBlobs,
  datasetIElongated,
} from "../../../lib/clustering/clusteringDatasets";
import "./KMeansReferenceLesson.css";
import { useTheme } from "../../../stores/uiStore";

type Shape = "blobs" | "rings" | "mixed" | "elongated" | "four";
type Tool = "select" | "add" | "remove";
type Camera = { minX: number; maxX: number; minY: number; maxY: number };

function fitCamera(samples: Array<{ x: number; y: number }>, pad = 0.28): Camera {
  const xs = samples.map((sample) => sample.x);
  const ys = samples.map((sample) => sample.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  return {
    minX: minX - spanX * pad,
    maxX: maxX + spanX * pad,
    minY: minY - spanY * pad,
    maxY: maxY + spanY * pad,
  };
}

function zoomCamera(base: Camera, zoom: number): Camera {
  const cx = (base.minX + base.maxX) / 2;
  const cy = (base.minY + base.maxY) / 2;
  const halfX = (base.maxX - base.minX) / 2 / zoom;
  const halfY = (base.maxY - base.minY) / 2 / zoom;
  return {
    minX: cx - halfX,
    maxX: cx + halfX,
    minY: cy - halfY,
    maxY: cy + halfY,
  };
}
type Props = { onAdvanced: () => void };
const COLORS = [
  "#24c6e8",
  "#d527a9",
  "#ffb30d",
  "#8067ed",
  "#2bde8c",
  "#ff6b6b",
  "#4ade80",
  "#f97316",
  "#38bdf8",
  "#e879f9",
];
const MAX_K = 10;
const clusterColor = (index: number) => COLORS[((index % COLORS.length) + COLORS.length) % COLORS.length];
function makePoints(shape: Shape) {
  const source =
    shape === "rings"
      ? datasetFConcentricCircles()
      : shape === "mixed"
        ? [...datasetETwoMoons(), ...datasetGNoisyBlobs().slice(-8)]
        : shape === "elongated"
          ? datasetIElongated()
          : shape === "four"
            ? datasetBFourBlobs()
            : datasetAWellSeparatedBlobs();
  return source.map((point) => [point.x, point.y]);
}
const distance = (a: number[], b: number[]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);
export default function KMeansReferenceLesson({ onAdvanced }: Props) {
  const [points, setPoints] = useState(() => makePoints("blobs")),
    [shape, setShape] = useState<Shape>("blobs"),
    [k, setK] = useState(3),
    [init, setInit] = useState<"random" | "kmeans++">("kmeans++"),
    [seed, setSeed] = useState(42),
    [step, setStep] = useState(3),
    [speed, setSpeed] = useState(1),
    [playing, setPlaying] = useState(false),
    [tool, setTool] = useState<Tool>("select"),
    [zoom, setZoom] = useState(1),
    [manual, setManual] = useState<number[][] | null>(null),
    [dragging, setDragging] = useState<number | null>(null),
    [toast, setToast] = useState("");
  const { theme, toggleTheme } = useTheme();
  const light = theme === "light";
  const navigate = useNavigate();
  const go = (label: string) => {
    const route = resolveNavRoute(label);
    if (route) navigate(route);
  };
  const plotRef = useRef<HTMLDivElement>(null);
  const safeK = Math.max(1, Math.min(k, Math.max(1, points.length)));
  const result = useMemo(
    () => kmeans(points, safeK, 50, init, seed),
    [points, safeK, init, seed],
  );
  const maxStep = Math.max(1, result.steps.length),
    active = result.steps[Math.min(step, result.steps.length - 1)] ?? result.steps[0],
    centroids = manual ?? active.centroids;
  const assignments = useMemo(
    () =>
      points.map((point) =>
        centroids.reduce(
          (best, c, index) =>
            distance(point, c) < distance(point, centroids[best])
              ? index
              : best,
          0,
        ),
      ),
    [points, centroids],
  );
  const inertia = points.reduce(
      (sum, p, i) => sum + distance(p, centroids[assignments[i]]) ** 2,
      0,
    ),
    initial = result.steps[0]?.inertia || inertia,
    delta = initial ? ((inertia - initial) / initial) * 100 : 0;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setStep((current) => (current >= maxStep - 1 ? 0 : current + 1)),
      Math.max(140, 800 / speed),
    );
    return () => window.clearInterval(timer);
  }, [playing, speed, maxStep]);
  const setDataset = (next: Shape) => {
    setShape(next);
    setPoints(makePoints(next));
    setStep(0);
    setManual(null);
    setZoom(1);
  };
  const changeK = (next: number) => {
    setK(Math.max(2, Math.min(MAX_K, Math.min(next, Math.max(2, points.length)))));
    setManual(null);
    setStep(10_000);
    setZoom(1);
  };
  const plotSamples = useMemo(
    () => [
      ...points.map(([x, y]) => ({ x, y })),
      ...centroids.map(([x, y]) => ({ x, y })),
    ],
    [points, centroids],
  );
  const fitted = useMemo(() => fitCamera(plotSamples), [plotSamples]);
  const camera = useMemo(() => zoomCamera(fitted, zoom), [fitted, zoom]);
  const plotAt = (x: number, y: number) => ({
    left: ((x - camera.minX) / Math.max(1e-6, camera.maxX - camera.minX)) * 100,
    top: ((camera.maxY - y) / Math.max(1e-6, camera.maxY - camera.minY)) * 100,
  });
  const coords = (event: React.PointerEvent | React.MouseEvent) => {
    const rect = plotRef.current!.getBoundingClientRect();
    return [
      camera.minX + ((event.clientX - rect.left) / rect.width) * (camera.maxX - camera.minX),
      camera.maxY - ((event.clientY - rect.top) / rect.height) * (camera.maxY - camera.minY),
    ];
  };
  const interact = (event: React.PointerEvent | React.MouseEvent) => {
    const value = coords(event);
    if (dragging !== null) {
      setManual(centroids.map((c, i) => (i === dragging ? value : c)));
      return;
    }
    if (tool === "add") setPoints([...points, value]);
    if (tool === "remove") {
      const nearest = points.reduce(
        (best, p, i) =>
          distance(p, value) < distance(points[best], value) ? i : best,
        0,
      );
      setPoints(points.filter((_, i) => i !== nearest));
    }
  };
  const counts = Array.from(
    { length: k },
    (_, cluster) => assignments.filter((value) => value === cluster).length,
  );
  return (
    <div className={`km-page ${light ? "light" : ""}`}>
      <header className="km-top">
        <Link to="/">
          <BrainCircuit />
          <b>AI Observatory</b>
        </Link>
        <span>
          ← Unsupervised Learning › <b>Clustering Lab</b>
        </span>
        <button onClick={() => go("Documentation")}>
          <FileText /> Docs
        </button>
        <button onClick={() => go("Help")}>
          <HelpCircle /> Help
        </button>
        <button onClick={toggleTheme}>
          {light ? <Moon /> : <Sun />}
        </button>
        <i>AI</i>
      </header>
      <aside className="km-nav">
        <h3>LEARNING PATH</h3>
        <button onClick={() => go("Overview")}>
          <BarChart3 /> Overview
        </button>
        <button onClick={() => go("Supervised Learning")}>
          <Network /> Supervised Learning ›
        </button>
        <button className="open" onClick={() => go("Unsupervised Learning")}>
          <Network /> Unsupervised Learning⌄
        </button>
        <section>
          <b>│ Clustering ⌃</b>
          <button className="active">● K-Means Clustering</button>
          <button onClick={() => go("DBSCAN")}>DBSCAN</button>
          <button onClick={() => go("Hierarchical Clustering")}>
            Hierarchical Clustering
          </button>
        </section>
        <button onClick={() => go("Dimensionality Reduction")}>
          <Sparkles /> Dimensionality Reduction ›
        </button>
        <button onClick={() => go("Anomaly Detection")}>
          <Network /> Anomaly Detection ›
        </button>
        <hr />
        <h3>LAB TOOLS</h3>
        <button onClick={() => go("Datasets")}>
          <Database /> Datasets
        </button>
        <button onClick={() => go("Visualizations")}>
          <BarChart3 /> Visualizations
        </button>
        <button onClick={() => go("Experiments")}>
          <FlaskConical /> Experiments
        </button>
        <button onClick={() => go("Notes")}>
          <Notebook /> Notes
        </button>
        <footer>
          <div>
            Progress <b>78%</b>
            <i>
              <em />
            </i>
          </div>
          <p>Next up</p>
          <b>DBSCAN Lab</b>
          <button onClick={() => go("Cheat Sheet")}>
            <FileText /> Cheat Sheet
          </button>
          <button onClick={onAdvanced}>
            <BrainCircuit /> Image Embeddings
          </button>
        </footer>
      </aside>
      <main>
        <section className="km-title">
          <div>
            <h1>
              K-Means Clustering <CircleHelp />
            </h1>
            <p>
              Group similar points together by minimizing within-cluster
              variance.
            </p>
          </div>
          {[
            ["Iteration", `${Math.min(step + 1, maxStep)} / ${maxStep}`],
            ["Inertia (SSE)", inertia.toFixed(2)],
            ["Δ Inertia", `${delta.toFixed(1)}%`],
          ].map((v, i) => (
            <article key={v[0]}>
              <small>{v[0]}</small>
              <b className={i === 2 ? "green" : ""}>
                {v[1]} {i === 1 && "↓"}
              </b>
            </article>
          ))}
        </section>
        <section
          className="km-plot"
          ref={plotRef}
          onPointerMove={(event) => dragging !== null && interact(event)}
          onPointerUp={() => setDragging(null)}
          onPointerLeave={() => setDragging(null)}
          onClick={(event) => dragging === null && interact(event)}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              {Array.from({ length: safeK }, (_, i) => (
                <radialGradient id={`g${i}`} key={i}>
                  <stop stopColor={clusterColor(i)} stopOpacity=".5" />
                  <stop offset="1" stopColor={clusterColor(i)} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>
            {centroids.map((c, i) => {
              const { left, top } = plotAt(c[0], c[1]);
              return (
                <circle
                  key={`glow-${i}`}
                  cx={left}
                  cy={top}
                  r="12"
                  fill={`url(#g${i})`}
                />
              );
            })}
            {points.map((p, i) => {
              const centroid = centroids[assignments[i]];
              if (!centroid) return null;
              const from = plotAt(p[0], p[1]);
              const to = plotAt(centroid[0], centroid[1]);
              return (
                <line
                  key={`link-${i}`}
                  x1={from.left}
                  y1={from.top}
                  x2={to.left}
                  y2={to.top}
                  stroke={clusterColor(assignments[i])}
                  strokeWidth="0.45"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.55"
                />
              );
            })}
          </svg>
          {points.map((p, i) => {
            const { left, top } = plotAt(p[0], p[1]);
            return (
              <i
                className="point"
                key={i}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  background: clusterColor(assignments[i]),
                  boxShadow: `0 0 10px ${clusterColor(assignments[i])}`,
                }}
              />
            );
          })}
          {centroids.map((c, i) => {
            const { left, top } = plotAt(c[0], c[1]);
            return (
              <button
                aria-label={`centroid ${i + 1}`}
                className="centroid"
                key={i}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setDragging(i);
                }}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  background: clusterColor(i),
                }}
              >
                ◇
              </button>
            );
          })}
          <div className="drag-tip">
            ☝ Drag centroids
            <br />
            to move them
          </div>
          <div className="plot-tools">
            {(["select", "add", "remove"] as Tool[]).map((name) => (
              <button
                key={name}
                className={tool === name ? "active" : ""}
                onClick={(e) => {
                  e.stopPropagation();
                  setTool(name);
                }}
              >
                {name === "add" ? (
                  <Plus />
                ) : name === "remove" ? (
                  <Trash2 />
                ) : (
                  "↖"
                )}{" "}
                {name[0].toUpperCase() + name.slice(1)} Point
              </button>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom((value) => Math.min(6, Number((value * 1.25).toFixed(2))));
              }}
            >
              <ZoomIn /> Zoom In
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom((value) => Math.max(0.5, Number((value / 1.25).toFixed(2))));
              }}
            >
              <ZoomOut /> Zoom Out
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(1);
              }}
            >
              <Maximize2 /> Fit Canvas
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setManual(null);
                setZoom(1);
              }}
            >
              <RefreshCw /> Reset View
            </button>
          </div>
          <div className="legend">
            {counts.map((count, i) => (
              <p key={i}>
                <i style={{ background: clusterColor(i) }} /> Cluster {i + 1}
                <b>{count}</b>
              </p>
            ))}
          </div>
        </section>
        <section className="km-bottom">
          <article className="loop">
            <h3>K-MEANS LOOP</h3>
            <aside>
              <b>
                <i className="cyan" />
                Assign
              </b>
              <p>Assign points to nearest centroid</p>
              <b>
                <i />
                Update
              </b>
              <p>Recompute centroids as mean of points</p>
            </aside>
            <div className="steps">
              {Array.from({ length: 12 }, (_, i) => (
                <button
                  key={i}
                  className={i === step ? "active" : i < step ? "done" : ""}
                  onClick={() => {
                    setStep(Math.min(i, maxStep - 1));
                    setManual(null);
                  }}
                >
                  {i + 1}
                  <small>{i % 2 ? "Update" : "Assign"}</small>
                </button>
              ))}
              <hr />
              <p>
                <b>
                  Iteration {step + 1} – {step % 2 ? "Update" : "Assign"}
                </b>
                <br />
                {step % 2
                  ? "Centroids move to the mean position of their assigned points."
                  : "Every point is assigned to its nearest centroid."}
              </p>
            </div>
          </article>
          <article className="curve">
            <h3>Inertia (SSE) over iterations</h3>
            <svg viewBox="0 0 260 130">
              <path d="M10 10V115H250" />
              <polyline
                points={Array.from({ length: 12 }, (_, i) => {
                  const stage =
                    result.steps[
                      Math.min(Math.floor(i / 2), result.steps.length - 1)
                    ] ?? result.steps.at(-1)!;
                  return `${12 + (i / 11) * 230},${12 + ((initial - stage.inertia) / (initial || 1)) * 95}`;
                }).join(" ")}
              />
            </svg>
          </article>
          <article className="summary">
            <h3>Convergence</h3>
            <p className="converged">
              <Check /> {result.converged ? "Converged" : "Iterating"}
              <small>Centroids stabilized.</small>
            </p>
            <h3>Cluster sizes</h3>
            {counts.map((count, i) => (
              <p key={i}>
                <i style={{ background: clusterColor(i) }} /> Cluster {i + 1}
                <b>
                  {count} · {((count / points.length) * 100).toFixed(1)}%
                </b>
              </p>
            ))}
          </article>
        </section>
        <footer className="km-tip">
          ⭐ Tips: Try different initializations or K values, drag centroids,
          add points, and observe how the algorithm adapts.
        </footer>
      </main>
      <aside className="km-controls">
        <h3>LAB CONTROLS</h3>
        <label>Number of clusters (K)</label>
        <div className="stepper">
          <button aria-label="Decrease clusters" onClick={() => changeK(k - 1)}>−</button>
          <b>{k}</b>
          <button aria-label="Increase clusters" onClick={() => changeK(k + 1)}>＋</button>
        </div>
        <label>Initialization ⓘ</label>
        <select
          value={init}
          onChange={(e) => setInit(e.target.value as typeof init)}
        >
          <option value="kmeans++">K-Means++</option>
          <option value="random">Random</option>
        </select>
        <button
          onClick={() =>
            setToast(
              `K-Means++ inertia ${kmeans(points, safeK, 50, "kmeans++", seed).inertia.toFixed(1)} vs random ${kmeans(points, safeK, 50, "random", seed).inertia.toFixed(1)}. Best of 4 restarts ${kmeansWithRestarts(points, safeK, 4, 50, init, seed).inertia.toFixed(1)}. Empty-cluster re-inits this run: ${result.emptyClusterResets}.`,
            )
          }
        >
          <RotateCcw /> Compare initializations
        </button>
        <p>
          Current run uses real iteration history (not interpolated frames).
          Empty centroids are replaced by the farthest observation, not NaN.
        </p>
        <table>
          <thead>
            <tr>
              <th>iter</th>
              <th>inertia</th>
              <th>move</th>
              <th>Δ assign</th>
            </tr>
          </thead>
          <tbody>
            {result.steps.slice(0, 8).map((item) => (
              <tr key={item.iteration}>
                <td>{item.iteration}</td>
                <td>{item.inertia.toFixed(2)}</td>
                <td>{item.maxMovement.toFixed(3)}</td>
                <td>{item.assignmentsChanged}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <label>Dataset shape ⓘ</label>
        <div className="shapes">
          {(["blobs", "rings", "mixed", "elongated", "four"] as Shape[]).map((item) => (
            <button
              aria-label={`${item} dataset`}
              className={shape === item ? "active" : ""}
              onClick={() => setDataset(item)}
              key={item}
            >
              {item === "blobs"
                ? "⠿"
                : item === "rings"
                  ? "◎"
                  : item === "mixed"
                    ? "◌◌"
                    : item === "elongated"
                      ? "═"
                      : "++++"}
            </button>
          ))}
        </div>
        <label>Speed ⓘ</label>
        <input
          aria-label="Speed"
          type="range"
          min=".5"
          max="3"
          step=".5"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <p>
          Slow <span>Normal</span> Fast
        </p>
        <label>Random seed ⓘ</label>
        <div className="seed">
          <input
            aria-label="Random seed"
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
          />
          <button onClick={() => setSeed(seed + 1)}>
            <RefreshCw />
          </button>
        </div>
        <button
          className="run"
          onClick={() => {
            setStep((current) => Math.min(maxStep - 1, current + 1));
            setManual(null);
          }}
        >
          Run iteration <ArrowRight />
        </button>
        <div className="play">
          <button onClick={() => setPlaying(!playing)}>
            {playing ? <Pause /> : <Play />} {playing ? "Pause" : "Auto-play"}
          </button>
          <button onClick={() => setStep(maxStep - 1)}>▶ To end</button>
        </div>
        <article>
          💡 Watch how points are assigned to the nearest centroid, then
          centroids update to the mean of their assigned points.
        </article>
      </aside>
      {toast && (
        <button className="km-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
