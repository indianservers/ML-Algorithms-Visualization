import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLabNavigate } from "../../../lib/labNavigation";
import {
  CircleHelp,
  Lightbulb,
  RotateCcw,
  Share2,
  Sun,
  Upload,
} from "lucide-react";
import { dbscan, dbscanNeighbors } from "../../../lib/algorithms/clustering/dbscan";
import {
  datasetAWellSeparatedBlobs,
  datasetETwoMoons,
  datasetFConcentricCircles,
  datasetGNoisyBlobs,
  datasetJSinglePlusOutliers,
  datasetKVariableDensity,
  datasetScaleMismatch,
} from "../../../lib/clustering/clusteringDatasets";
import {
  fitClusterScaler,
  kDistanceCurve,
  scatterPercents,
  silhouetteScore,
} from "../../../lib/clustering/clusteringEval";
import {
  LabLessonPanel,
  useLabTabs,
} from "../../../components/common/LabTabs";
import "./DBSCANPage.css";

type Point = { x: number; y: number };
type Dataset =
  | "moons"
  | "blobs"
  | "rings"
  | "density"
  | "outliers"
  | "scale"
  | "imported";
const COLORS = ["#3bd47e", "#ffb42b", "#5591ff", "#a77bff"];
const TABS = [
  "Learn",
  "Visualize",
  "Dataset",
  "Train",
  "Metrics",
  "Compare",
  "Explain",
];
const BUILT = {
  moons: datasetETwoMoons(),
  blobs: datasetAWellSeparatedBlobs(),
  rings: [...datasetFConcentricCircles(), ...datasetGNoisyBlobs().slice(-8)],
  density: datasetKVariableDensity(),
  outliers: datasetJSinglePlusOutliers(),
  scale: datasetScaleMismatch(),
};
const LABELS: Record<Dataset, string> = {
  moons: "Two moons",
  blobs: "Well-separated blobs",
  rings: "Concentric circles + noise",
  density: "Variable-density clusters",
  outliers: "One cluster + outliers",
  scale: "Unequal units (0–1 vs ~1e6)",
  imported: "Imported CSV",
};

export default function DBSCANPage() {
  const { tab, setTab, panel, layout, lesson } = useLabTabs(
      "Visualize",
      "Visualize",
      ["Learn", "Compare", "Explain"],
    ),
    [dataset, setDataset] = useState<Dataset>("moons"),
    [points, setPoints] = useState<Point[]>(BUILT.moons),
    [imported, setImported] = useState<Point[]>([]),
    [epsilon, setEpsilon] = useState(0.35),
    [minimumPoints, setMinimumPoints] = useState(6),
    [step, setStep] = useState(7),
    [playing, setPlaying] = useState(false),
    [autoPlay, setAutoPlay] = useState(false),
    [speed, setSpeed] = useState(1),
    [toast, setToast] = useState(""),
    [selected, setSelected] = useState(0),
    [standardize, setStandardize] = useState(false);
  const go = useLabNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const X = useMemo(() => {
    const raw = points.map((point) => [point.x, point.y]);
    return standardize ? fitClusterScaler(raw).transformAll(raw) : raw;
  }, [points, standardize]);
  const safeMinPts = Math.max(1, Math.min(minimumPoints, Math.max(1, points.length)));
  const safeEps = epsilon > 0 && Number.isFinite(epsilon) ? epsilon : 0.35;
  const result = useMemo(
    () => dbscan(X, safeEps, safeMinPts),
    [X, safeEps, safeMinPts],
  );
  const clusterSizes = result.labels.reduce<number[]>((sizes, label) => {
    if (label >= 0) sizes[label] = (sizes[label] || 0) + 1;
    return sizes;
  }, []);
  const expansion = result.expansionOrder.length
    ? result.expansionOrder
    : points.map((_, i) => i);
  const visibleCount = Math.max(
    1,
    Math.min(points.length, Math.round((expansion.length * step) / 18) || 1),
  );
  const visible = new Set(expansion.slice(0, visibleCount));
  const neighbors = dbscanNeighbors(X, selected, safeEps);
  const kDistances = useMemo(
    () => kDistanceCurve(X, safeMinPts),
    [X, safeMinPts],
  );
  const sil = useMemo(
    () => silhouetteScore(X, result.labels),
    [X, result.labels],
  );
  useEffect(() => {
    if (!playing && !autoPlay) return;
    const timer = window.setInterval(
      () =>
        setStep((current) => {
          if (current >= 18) {
            setPlaying(false);
            return 18;
          }
          return current + 1;
        }),
      Math.max(120, 700 / speed),
    );
    return () => window.clearInterval(timer);
  }, [playing, autoPlay, speed]);
  const choose = (value: Dataset) => {
    const next = value === "imported" ? imported : BUILT[value];
    if (!next.length) return;
    setDataset(value);
    setPoints(next);
    setStep(1);
    setToast(`${LABELS[value]} loaded`);
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
      .map((row) => ({ x: row[0], y: row[1] }));
    if (rows.length < 4)
      return setToast("CSV needs at least four numeric rows");
    setImported(rows);
    setDataset("imported");
    setPoints(rows);
    setStep(1);
    setToast(`Imported ${rows.length} points`);
    event.target.value = "";
  };
  const reset = () => {
    setEpsilon(0.35);
    setMinimumPoints(6);
    setStep(7);
    setPlaying(false);
    setAutoPlay(false);
    setSpeed(1);
    setDataset("moons");
    setPoints(BUILT.moons);
  };
  return (
    <div className="db-page">
      <aside className="db-side">
        <Link to="/">
          <i>◉</i>
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </Link>
        <h3>LESSON PATH</h3>
        <section>
          <h4>1. Learn Concepts ⌃</h4>
          {[
            "What is DBSCAN?",
            "Core, Border, Noise",
            "How it Works",
            "Pros & Cons",
          ].map((name, index) => (
            <button
              className={index === 0 ? "active" : ""}
              onClick={() => setToast(name)}
              key={name}
            >
              <i />
              {name}
            </button>
          ))}
        </section>
        {[
          ["2. Visualize", "Interactive Canvas", "Parameter Effects"],
          ["3. Train & Evaluate", "Run DBSCAN", "View Metrics"],
          ["4. Compare", "DBSCAN vs Others"],
          ["5. Explain", "Under the Hood"],
        ].map((group) => (
          <section key={group[0]}>
            <h4>{group[0]} ⌄</h4>
            {group.slice(1).map((name) => (
              <button onClick={() => setToast(name)} key={name}>
                <i />
                {name}
              </button>
            ))}
          </section>
        ))}
        <article>
          <Lightbulb />
          <b>Quick Tip</b>
          <p>
            A point is a <em>core point</em> if at least minPts points
            (including itself) are within ε distance.
          </p>
        </article>
        <Link className="back" to="/">
          ← Back to Modules
        </Link>
      </aside>
      <header className="db-top">
        <b className="brand">
          ◉ Mega ML<small>AI Observatory</small>
        </b>
        <button onClick={() => setToast("Menu toggled")}>☰</button>
        <section>
          <span>PROGRESS</span>
          <i>
            <b />
          </i>
          <strong>54%</strong>
        </section>
        <section>
          <span>OBJECTIVE</span>
          <p>
            Understand density-based clustering and how DBSCAN discovers
            clusters of arbitrary shape.
          </p>
        </section>
        <button onClick={() => go("Help")}>
          <CircleHelp />
        </button>
        <button onClick={() => setToast("Share link copied")}>
          <Share2 />
          Share
        </button>
        <button onClick={() => setToast("Theme changed")}>
          <Sun />
        </button>
      </header>
      <main className={layout.trim()}>
        <h1>
          DBSCAN <em>Density-Based Clustering</em>
        </h1>
        <nav className="db-tabs" role="tablist" aria-label="DBSCAN sections">
          {TABS.map((name) => (
            <button
              role="tab"
              aria-selected={tab === name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
              key={name}
            >
              {name}
            </button>
          ))}
        </nav>
        {lesson && <LabLessonPanel tab={tab} route="/ml/clustering/dbscan" />}
        <section className={`db-data${panel("Dataset")}`}>
          <b>Dataset</b>
          <select
            value={dataset}
            onChange={(event) => choose(event.target.value as Dataset)}
          >
            {Object.entries(LABELS).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <em>Recommended</em>
          <span>{points.length.toLocaleString()} points · 2 features</span>
          <button onClick={() => choose(dataset)}>↪ Switch Dataset</button>
          <button onClick={() => fileRef.current?.click()}>
            <Upload />
            Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
        </section>
        <section className={`db-stage${panel("Train")}`}>
          <aside>
            <b>☼ Step {step} of 18</b>
            <h3>
              {step < 5
                ? "Find an unvisited point"
                : step < 12
                  ? "Expanding Cluster 1"
                  : "Repeat until complete"}
            </h3>
            <p>
              From the current core point, all density-reachable core points are
              added to the cluster. The expansion continues.
            </p>
            <i />
            Current point
          </aside>
          <div className="db-plot">
            {points.map((point, index) => {
              const type = result.pointTypes[index],
                label = result.labels[index],
                color = label < 0 ? "#ff7183" : COLORS[label % COLORS.length];
              const pos = scatterPercents(point.x, point.y, points);
              const current = expansion[Math.min(visibleCount - 1, expansion.length - 1)] === index;
              return (
                <i
                  className={type}
                  key={index}
                  onClick={() => setSelected(index)}
                  style={{
                    left: `${pos.left}%`,
                    top: `${pos.top}%`,
                    borderColor: color,
                    background: type === "core" ? color : "transparent",
                    boxShadow: current || selected === index ? `0 0 0 6px ${color}55` : undefined,
                    opacity: visible.has(index) || type === "noise" ? 1 : 0.25,
                  }}
                />
              );
            })}
            <span>
              ε-neighborhood of point {selected}: {neighbors.length} neighbors
              <br />
              {result.pointTypes[selected] ?? "—"}
            </span>
          </div>
          <footer>
            {[
              ["core", "Core Point"],
              ["border", "Border Point"],
              ["noise", "Noise Point"],
              ["current", "Current Point"],
            ].map(([kind, name]) => (
              <span key={kind}>
                <i className={kind} />
                {name}
              </span>
            ))}
          </footer>
          <nav>
            <button onClick={() => setStep(1)}>↤</button>
            <button onClick={() => setStep(Math.max(1, step - 1))}>
              ← Step Back
            </button>
            <button
              className="play"
              onClick={() => {
                setPlaying(!playing);
                setStep(Math.min(18, step + 1));
              }}
            >
              {playing ? "Ⅱ Pause" : "▶ Play"}
            </button>
            <button onClick={() => setStep(Math.min(18, step + 1))}>
              Step Forward →
            </button>
            <button onClick={() => setStep(18)}>↦</button>
            <label>
              Speed{" "}
              <input
                aria-label="Speed"
                type="range"
                min=".5"
                max="2"
                step=".5"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              />
              {speed.toFixed(1)}x
            </label>
            <label>
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(event) => setAutoPlay(event.target.checked)}
              />
              Auto Play
            </label>
          </nav>
        </section>
        <section className={`db-cards${panel("Metrics")}`}>
          <article>
            <h3>Cluster Summary</h3>
            <div>
              {[
                ["Clusters", result.numClusters, ""],
                [
                  "Noise Points",
                  result.noisePoints.length,
                  `${((result.noisePoints.length / points.length) * 100).toFixed(1)}%`,
                ],
                [
                  "Core Points",
                  result.corePoints.length,
                  `${((result.corePoints.length / points.length) * 100).toFixed(1)}%`,
                ],
                [
                  "Border Points",
                  result.borderPoints.length,
                  `${((result.borderPoints.length / points.length) * 100).toFixed(1)}%`,
                ],
                ["Total Points", points.length.toLocaleString(), ""],
              ].map(([name, value, detail]) => (
                <span key={name}>
                  <small>{name}</small>
                  <b>{value}</b>
                  {detail && <em>({detail})</em>}
                </span>
              ))}
            </div>
          </article>
          <article>
            <h3>Cluster Sizes</h3>
            {clusterSizes.slice(0, 3).map((size, index) => (
              <p key={index}>
                <i style={{ background: COLORS[index] }} />
                Cluster {index + 1}
                <b>
                  {size} ({((size / points.length) * 100).toFixed(1)}%)
                </b>
              </p>
            ))}
            <p>
              <i className="noise" />
              Noise<b>{result.noisePoints.length}</b>
            </p>
            <p>
              Silhouette (noise excluded){" "}
              <b>{sil == null ? "N/A" : sil.toFixed(3)}</b>
            </p>
            <p>
              k-distance (MinPts={safeMinPts}) median{" "}
              <b>
                {kDistances.length
                  ? kDistances[Math.floor(kDistances.length / 2)].toFixed(3)
                  : "—"}
              </b>
            </p>
          </article>
          <article>
            <h3>Algorithm Status</h3>
            {[
              "Mark all points as unvisited",
              "Find unvisited point",
              "Retrieve ε-neighborhood",
              "Expand cluster",
              "Repeat until all points visited",
            ].map((name, index) => (
              <p
                className={
                  index === Math.min(4, Math.floor(step / 4))
                    ? "active"
                    : index < step / 4
                      ? "done"
                      : ""
                }
                key={name}
              >
                ○ {index + 1}. {name}
              </p>
            ))}
          </article>
        </section>
        <footer className={`db-info${panel("Train", "Dataset", "Metrics")}`}>
          ⓘ DBSCAN finds clusters of arbitrary shape and handles noise. It does
          not require the number of clusters in advance.
          <button onClick={() => setToast("Mathematical details opened")}>
            View Mathematical Details →
          </button>
        </footer>
      </main>
      <aside className="db-controls">
        <article>
          <h2>DBSCAN Parameters ⓘ</h2>
          <label>
            Standardize features
            <input
              aria-label="Standardize features"
              type="checkbox"
              checked={standardize}
              onChange={(event) => setStandardize(event.target.checked)}
            />
          </label>
          <p>
            {standardize
              ? "Clustering uses z-scored features. Scatter still shows original coordinates."
              : "Clustering uses raw coordinates. Unequal units can collapse neighborhoods onto the large-scale axis."}
          </p>
          <label>
            ε (epsilon)
            <input
              aria-label="Epsilon numeric"
              type="number"
              min=".05"
              max="1.5"
              step=".05"
              value={epsilon}
              onChange={(event) => setEpsilon(Number(event.target.value))}
            />
          </label>
          <input
            aria-label="Epsilon"
            type="range"
            min=".05"
            max="1.5"
            step=".05"
            value={epsilon}
            onChange={(event) => setEpsilon(Number(event.target.value))}
          />
          <p>
            .05 <span>1.50</span>
          </p>
          <label>
            minPts
            <input
              aria-label="Minimum points numeric"
              type="number"
              min="3"
              max="20"
              value={minimumPoints}
              onChange={(event) => setMinimumPoints(Number(event.target.value))}
            />
          </label>
          <input
            aria-label="Minimum points"
            type="range"
            min="3"
            max="20"
            value={minimumPoints}
            onChange={(event) => setMinimumPoints(Number(event.target.value))}
          />
          <p>
            3 <span>20</span>
          </p>
        </article>
        <article>
          <h2>Point Legend</h2>
          {[
            ["core", "Core Point", "≥ minPts points in ε-neighborhood"],
            ["border", "Border Point", "Fewer than minPts, but in ε of core"],
            ["noise", "Noise Point", "Not in ε-neighborhood of any core"],
          ].map(([kind, name, text]) => (
            <p key={kind}>
              <i className={kind} />
              <b>{name}</b>
              <span>{text}</span>
            </p>
          ))}
          <button onClick={reset}>
            <RotateCcw />
            Reset Visualization
          </button>
        </article>
        <article>
          <h2>Parameter Guidance ⓘ</h2>
          <p>Smaller ε → More clusters (or more noise)</p>
          <p>Larger ε → Fewer clusters (or one big cluster)</p>
          <p>Higher minPts → Stricter core definition</p>
          <button onClick={() => setToast("Examples displayed")}>
            ♙ Show Examples
          </button>
        </article>
      </aside>
      {toast && (
        <button className="db-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
