import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLabNavigate } from "../../../lib/labNavigation";
import {
  BookOpen,
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  Download,
  HelpCircle,
  Lightbulb,
  Network,
  Pause,
  Play,
  RefreshCw,
  Upload,
} from "lucide-react";
import {
  kMedoidsDistance,
  trainKMedoids,
  type KMedoidsMetric,
} from "../../../lib/algorithms/clustering/kMedoids";
import {
  datasetAWellSeparatedBlobs,
  datasetBFourBlobs,
  datasetCUnequalSizes,
  datasetGNoisyBlobs,
  datasetIElongated,
} from "../../../lib/clustering/clusteringDatasets";
import { scatterPercents } from "../../../lib/clustering/clusteringEval";
import "./KMedoidsPage.css";
type Point = { x: number; y: number; outlier: boolean };
type DataKey = "mall" | "customers" | "traffic" | "elongated" | "four" | "imported";
type Tab =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
const COLORS = ["#25c5d8", "#6bce43", "#ff9909", "#8a6cf0", "#ef4f8f"];
function tagged(
  source: { x: number; y: number }[],
  outlierFrom = Number.POSITIVE_INFINITY,
): Point[] {
  return source.map((point, index) => ({
    x: point.x,
    y: point.y,
    outlier: index >= outlierFrom,
  }));
}
const BUILT = {
  mall: tagged(datasetAWellSeparatedBlobs()),
  customers: tagged(datasetCUnequalSizes()),
  traffic: tagged(
    datasetGNoisyBlobs(),
    datasetAWellSeparatedBlobs().length,
  ),
  elongated: tagged(datasetIElongated()),
  four: tagged(datasetBFourBlobs()),
};
const LABELS: Record<DataKey, string> = {
  mall: "Well-separated blobs",
  customers: "Unequal cluster sizes",
  traffic: "Noisy blobs with outliers",
  elongated: "Elongated clusters",
  four: "Four blobs",
  imported: "Imported Dataset",
};
const TABS: Tab[] = [
  "learn",
  "visualize",
  "dataset",
  "train",
  "metrics",
  "compare",
  "explain",
];
export default function KMedoidsPage() {
  const [tab, setTab] = useState<Tab>("visualize"),
    [dataKey, setDataKey] = useState<DataKey>("mall"),
    [points, setPoints] = useState<Point[]>(BUILT.mall),
    [imported, setImported] = useState<Point[]>([]),
    [k, setK] = useState(3),
    [metric, setMetric] = useState<KMedoidsMetric>("euclidean"),
    [init, setInit] = useState<"random" | "kmedoids++">("kmedoids++"),
    [maxIterations, setMaxIterations] = useState(100),
    [step, setStep] = useState(2),
    [auto, setAuto] = useState(true),
    [delay, setDelay] = useState(800),
    [playing, setPlaying] = useState(false),
    [showDistances, setShowDistances] = useState(false),
    [view, setView] = useState("clusters"),
    [scale, setScale] = useState("standard"),
    [toast, setToast] = useState("");
  const go = useLabNavigate();
  const uploadRef = useRef<HTMLInputElement>(null),
    X = useMemo(() => points.map((p) => [p.x, p.y]), [points]);
  const safeK = Math.max(1, Math.min(k, Math.max(1, X.length)));
  const result = useMemo(
      () => trainKMedoids(X, { k: safeK, maxIterations, metric, init, seed: 42 }),
      [X, safeK, maxIterations, metric, init],
    ),
    phase = Math.min(step, Math.max(0, result.steps.length - 1)),
    active = result.steps[phase] ?? result.steps.at(-1)!,
    medoidSet = new Set(active.medoidIndices);
  const previous = result.steps[Math.max(0, phase - 1)],
    improvement = previous ? previous.cost - active.cost : 0;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setStep((current) =>
          current >= result.steps.length - 1 ? 0 : current + 1,
        ),
      delay,
    );
    return () => clearInterval(timer);
  }, [playing, delay, result.steps.length]);
  const choose = (next: DataKey) => {
    const source = next === "imported" ? imported : BUILT[next];
    if (!source.length) return;
    setDataKey(next);
    setPoints(source.map((p) => ({ ...p })));
    setStep(0);
  };
  const reset = () => {
    choose("mall");
    setK(3);
    setMetric("euclidean");
    setInit("kmedoids++");
    setMaxIterations(100);
    setStep(2);
    setAuto(true);
    setDelay(800);
    setPlaying(false);
    setShowDistances(false);
  };
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const parsed = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter((v) => v.length >= 2 && v.slice(0, 2).every(Number.isFinite))
      .map((v) => ({ x: v[0], y: v[1], outlier: Boolean(v[2]) }));
    if (parsed.length < 4) {
      setToast("CSV requires numeric x and y columns");
      return;
    }
    setImported(parsed);
    setDataKey("imported");
    setPoints(parsed);
    setStep(0);
    setToast(`Imported ${parsed.length} points`);
    e.target.value = "";
  };
  const removedResult = useMemo(() => {
    const removed = points.filter((point) => !point.outlier);
    return trainKMedoids(
      removed.map((point) => [point.x, point.y]),
      { k: Math.min(safeK, Math.max(1, removed.length)), maxIterations, metric, init, seed: 42 },
    );
  }, [points, k, maxIterations, metric, init]);
  return (
    <div className="kmed-page">
      <header className="kmed-top">
        <Link to="/">
          <BrainCircuit />
          <span>
            <b>Mega ML</b>
            <small>AI OBSERVATORY</small>
          </span>
        </Link>
        <section>
          Lesson Progress{" "}
          <i>
            <b />
          </i>
          <strong>42%</strong>
        </section>
        <p>
          <b>Objective</b>Understand how K-Medoids forms robust clusters using
          actual data points.
        </p>
        <button aria-label="Reading" onClick={() => go("Reading")}>
          <BookOpen />
        </button>
        <button aria-label="Hints" onClick={() => go("Hints")}>
          <Lightbulb />
        </button>
        <button aria-label="Code" onClick={() => go("Code")}>
          <Code2 />
        </button>
      </header>
      <aside className="kmed-nav">
        <h3>LESSON NAVIGATION</h3>
        <button onClick={() => setToast("Overview opened")}>
          <Network />
          Overview
        </button>
        <button onClick={() => setToast("Why K-Medoids opened")}>
          <Network />
          Why K-Medoids?
        </button>
        <button className="open">
          <CircleHelp />
          How It Works ⌃
        </button>
        <section>
          {[
            "1. Initialize Medoids",
            "2. Assign to Nearest Medoid",
            "3. Swap & Improve",
            "4. Converge",
          ].map((item, i) => (
            <button
              key={item}
              className={phase === i + 1 ? "active" : ""}
              onClick={() => setStep(Math.min(result.steps.length - 1, i + 1))}
            >
              {item}
            </button>
          ))}
        </section>
        {["Robustness to Outliers", "Complexity", "Use Cases", "Summary"].map(
          (item) => (
            <button key={item} onClick={() => setToast(item)}>
              <Network />
              {item}
            </button>
          ),
        )}
        <button
          className="download"
          onClick={() => setToast("Notes downloaded")}
        >
          <Download />
          Download Notes
        </button>
        <article>
          <small>DATASET</small>
          <b>
            {LABELS[dataKey]} <i>● Active</i>
          </b>
          <div>
            <span>
              Samples<b>{points.length}</b>
            </span>
            <span>
              Features<b>2</b>
            </span>
            <span>
              Outliers
              <b>
                {Math.round(
                  (points.filter((p) => p.outlier).length / points.length) *
                    100,
                )}
                %
              </b>
            </span>
          </div>
            Customer / spend labels are illustrative. Clustering uses the current 2D points; medoids are actual observations.
          <select
            value={dataKey}
            onChange={(e) => choose(e.target.value as DataKey)}
          >
            {Object.entries(LABELS).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </article>
        <article className="upload" onClick={() => uploadRef.current?.click()}>
          <small>UPLOAD DATASET</small>
          <Upload />
          <p>
            Drag & drop CSV
            <br />
            <b>or click to browse</b>
          </p>
          <input ref={uploadRef} type="file" accept=".csv" onChange={upload} />
        </article>
      </aside>
      <main>
        <header>
          <h1>
            K - Medoids <em>Robust Clustering</em>
          </h1>
          <p>
            K-Medoids chooses cluster centers from actual data points (medoids)
            to minimize the total dissimilarity.
            <br />
            It is robust to outliers and works with any distance metric.
          </p>
        </header>
        <nav>
          {TABS.map((item) => (
            <button
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
              key={item}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        <section className="kmed-plot">
          <div className="k-label">k = {k} ✎</div>
          {points.map((p, i) => {
            const cluster = active.assignments[i] ?? 0,
              medoid = medoidSet.has(i);
            return (
              <span
                key={i}
                className={`${p.outlier ? "outlier" : "point"} ${medoid ? "medoid" : ""}`}
                style={{
                  left: `${scatterPercents(p.x, p.y, points).left}%`,
                  top: `${scatterPercents(p.x, p.y, points).top}%`,
                  background: p.outlier ? "transparent" : COLORS[cluster],
                  borderColor: COLORS[cluster],
                }}
              >
                {p.outlier ? "×" : medoid ? "●" : ""}
              </span>
            );
          })}
          {showDistances &&
            points.map((p, i) => {
              const m = X[active.medoidIndices[active.assignments[i]]];
              return (
                <i
                  key={i}
                  style={{
                    left: `${scatterPercents(p.x, p.y, points).left}%`,
                    top: `${scatterPercents(p.x, p.y, points).top}%`,
                    width: `${Math.min(40, kMedoidsDistance([p.x, p.y], m, metric) * 8)}%`,
                    transform: `rotate(${(Math.atan2(-(m[1] - p.y), m[0] - p.x) * 180) / Math.PI}deg)`,
                    background: COLORS[active.assignments[i]],
                  }}
                />
              );
            })}
          <article>
            <b>Step {phase + 1} of {result.steps.length}</b>
            <h3>
              {
                [
                  "Initialize Medoids",
                  "Assign to Nearest Medoid",
                  "Swap & Improve",
                  "Converge Check",
                  "Final Assignment",
                  "Done",
                ][phase]
              }
            </h3>
            <p>
              Evaluate swaps between medoids and non-medoid points. Keep the
              swap that reduces total cost.
            </p>
            <div>
              <button onClick={() => setStep(Math.max(0, step - 1))}>
                <ChevronLeft />
                Back
              </button>
              <button onClick={() => setStep(Math.min(5, step + 1))}>
                Next
                <ChevronRight />
              </button>
            </div>
            <button onClick={() => setPlaying(!playing)}>
              {playing ? <Pause /> : <Play />}
              {playing ? "Pause" : "Play"}
            </button>
          </article>
          <footer>
            <label>
              View
              <select
                aria-label="Plot view"
                value={view}
                onChange={(e) => setView(e.target.value)}
              >
                <option value="clusters">Clusters & Medoids</option>
                <option value="medoids">Medoids Only</option>
              </select>
            </label>
            <label>
              Scale
              <select
                aria-label="Plot scale"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
              >
                <option>Standard</option>
                <option>Normalized</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={showDistances}
                onChange={(e) => setShowDistances(e.target.checked)}
              />
              Show Distances
            </label>
          </footer>
        </section>
        <section className="kmed-cards">
          <article>
            <h3>
              COST COMPARISON <small>(Lower is better)</small>
            </h3>
            <div>
              <span>
                Current Cost
                <b>{previous?.cost.toFixed(2) ?? active.cost.toFixed(2)}</b>
              </span>
              <span>
                Best Cost<b>{active.cost.toFixed(2)}</b>
              </span>
              <span>
                Improvement
                <b>{improvement ? `-${improvement.toFixed(2)}` : "–"}</b>
              </span>
            </div>
            <svg viewBox="0 0 300 40">
              <polyline
                points={result.steps
                  .map(
                    (s, i) =>
                      `${(i / Math.max(1, result.steps.length - 1)) * 290 + 5},${35 - ((result.steps[0].cost - s.cost) / Math.max(1, result.steps[0].cost - result.cost)) * 30}`,
                  )
                  .join(" ")}
              />
            </svg>
          </article>
          <article>
            <h3>BEST SWAP CANDIDATE</h3>
            <div className="swap">
              <b>P{active.swap?.medoidIndex ?? active.medoidIndices[0]}</b> ↔{" "}
              <b>P{active.swap?.candidateIndex ?? active.medoidIndices[1]}</b>
              <span>
                Improvement
                <strong>
                  {improvement ? `-${improvement.toFixed(2)}` : "Converged"}
                </strong>
                New Cost<strong>{active.cost.toFixed(2)}</strong>
              </span>
            </div>
            <button onClick={() => setStep(Math.min(5, step + 1))}>
              Apply Swap
            </button>
          </article>
          <article>
            <h3>OUTLIER ROBUSTNESS</h3>
            <div className="donut">
              {Math.round(
                (points.filter((p) => p.outlier).length / points.length) * 100,
              )}
              %<small>Outliers</small>
            </div>
            <p>
              Outliers have limited influence since medoids must be real points
              within clusters.
            </p>
            <b>
              Cost Impact (with outliers)
              <strong>{result.cost.toFixed(2)}</strong>Cost Impact (outliers
              removed)<strong>{removedResult.cost.toFixed(2)}</strong>
              <em>
                Δ{" "}
                {(
                  ((result.cost - removedResult.cost) / result.cost) *
                  100
                ).toFixed(2)}
                %
              </em>
            </b>
          </article>
        </section>
        <footer className="kmed-tip">
          ⓘ K-Medoids minimizes total dissimilarity using actual data points as
          centers — making it robust to outliers and suitable for any distance
          metric.
          <button onClick={() => setToast("Fullscreen toggled")}>
            ⛶ Fullscreen
          </button>
          <button onClick={() => go("Help")}>
            <HelpCircle />
            Help
          </button>
        </footer>
      </main>
      <aside className="kmed-controls">
        <h3>
          CONTROLS{" "}
          <button onClick={reset}>
            <RefreshCw />
            Reset
          </button>
        </h3>
        <label>K (Number of Clusters)</label>
        <div className="stepper">
          <button onClick={() => setK(Math.max(2, k - 1))}>−</button>
          <b>{k}</b>
          <button onClick={() => setK(Math.min(5, k + 1))}>＋</button>
        </div>
        <label>Distance Metric</label>
        <select
          aria-label="Distance Metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value as KMedoidsMetric)}
        >
          <option value="euclidean">Euclidean</option>
          <option value="manhattan">Manhattan</option>
          <option value="chebyshev">Chebyshev</option>
        </select>
        <label>Initialization</label>
        <select
          aria-label="Initialization"
          value={init}
          onChange={(e) => setInit(e.target.value as typeof init)}
        >
          <option value="kmedoids++">K-Medoids++</option>
          <option value="random">Random</option>
        </select>
        <label>
          Max Iterations
          <input
            aria-label="Max Iterations numeric"
            type="number"
            min="5"
            max="100"
            step="5"
            value={maxIterations}
            onChange={(e) => setMaxIterations(Number(e.target.value))}
          />
        </label>
        <input
          aria-label="Max Iterations"
          type="range"
          min="5"
          max="100"
          step="5"
          value={maxIterations}
          onChange={(e) => setMaxIterations(Number(e.target.value))}
        />
        <div className="switch">
          <button className={auto ? "on" : ""} onClick={() => setAuto(!auto)}>
            <i />
          </button>
          Auto Step ⓘ
        </div>
        <label>
          Step Delay
          <input
            aria-label="Step Delay numeric"
            type="number"
            min="200"
            max="1500"
            step="100"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
          />
        </label>
        <input
          aria-label="Step Delay"
          type="range"
          min="200"
          max="1500"
          step="100"
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
        />
        <h4>STEP THROUGH ALGORITHM</h4>
        {[
          "Initialize",
          "Assign",
          "Swap & Improve",
          "Converge Check",
          "Final Assignment",
          "Done",
        ].map((item, i) => (
          <button
            className={`phase ${phase === i ? "active" : ""}`}
            onClick={() => setStep(i)}
            key={item}
          >
            <b>{i + 1}</b>
            {item}
            {i < phase && <Check />}
          </button>
        ))}
        <h4>ACTIONS</h4>
        <div className="actions">
          <button onClick={() => setStep(5)}>Run to Completion</button>
          <button
            onClick={() => setInit(init === "random" ? "kmedoids++" : "random")}
          >
            Randomize Medoids
          </button>
        </div>
      </aside>
      {toast && (
        <button className="kmed-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
