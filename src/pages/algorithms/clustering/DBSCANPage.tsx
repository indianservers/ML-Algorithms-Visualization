import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CircleHelp,
  Lightbulb,
  RotateCcw,
  Share2,
  Sun,
  Upload,
} from "lucide-react";
import { dbscan } from "../../../lib/algorithms/clustering/dbscan";
import "./DBSCANPage.css";

type Point = { x: number; y: number };
type Dataset = "moons" | "blobs" | "rings" | "imported";
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
const rand = (i: number, salt: number) => {
  const value = Math.sin((i + 7) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};
function makeData(kind: Exclude<Dataset, "imported">, count = 1000): Point[] {
  return Array.from({ length: count }, (_, index) => {
    if (rand(index, 9) < 0.058)
      return { x: rand(index, 4) * 5 - 2.5, y: rand(index, 5) * 3.6 - 1.8 };
    const angle = rand(index, 1) * Math.PI;
    if (kind === "rings") {
      const radius = index % 2 ? 1.48 : 0.72;
      return {
        x: Math.cos(angle * 2) * radius + (rand(index, 2) - 0.5) * 0.13,
        y: Math.sin(angle * 2) * radius + (rand(index, 3) - 0.5) * 0.13,
      };
    }
    if (kind === "blobs") {
      const center = [
        [-1.25, 0.7],
        [0.2, -0.9],
        [1.45, 0.75],
      ][index % 3];
      return {
        x: center[0] + (rand(index, 2) - 0.5) * 0.8,
        y: center[1] + (rand(index, 3) - 0.5) * 0.8,
      };
    }
    const upper = index % 2 === 0;
    return {
      x:
        Math.cos(angle) +
        (upper ? -0.45 : 0.55) +
        (rand(index, 2) - 0.5) * 0.18,
      y:
        (upper ? Math.sin(angle) : -Math.sin(angle)) +
        (upper ? 0.12 : -0.12) +
        (rand(index, 3) - 0.5) * 0.18,
    };
  });
}
const BUILT = {
  moons: makeData("moons"),
  blobs: makeData("blobs"),
  rings: makeData("rings"),
};
const LABELS: Record<Dataset, string> = {
  moons: "Moons (Noisy)",
  blobs: "Gaussian Blobs",
  rings: "Concentric Rings",
  imported: "Imported CSV",
};

export default function DBSCANPage() {
  const [tab, setTab] = useState("Learn"),
    [dataset, setDataset] = useState<Dataset>("moons"),
    [points, setPoints] = useState<Point[]>(BUILT.moons),
    [imported, setImported] = useState<Point[]>([]),
    [epsilon, setEpsilon] = useState(0.35),
    [minimumPoints, setMinimumPoints] = useState(6),
    [step, setStep] = useState(7),
    [playing, setPlaying] = useState(false),
    [autoPlay, setAutoPlay] = useState(false),
    [speed, setSpeed] = useState(1),
    [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const result = useMemo(
    () =>
      dbscan(
        points.map((point) => [point.x * 5, point.y * 5]),
        epsilon,
        minimumPoints,
      ),
    [points, epsilon, minimumPoints],
  );
  const clusterSizes = result.labels.reduce<number[]>((sizes, label) => {
    if (label >= 0) sizes[label] = (sizes[label] || 0) + 1;
    return sizes;
  }, []);
  const visibleCount = Math.max(1, Math.round((points.length * step) / 18));
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
        <button onClick={() => setToast("Help opened")}>
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
      <main>
        <h1>
          DBSCAN <em>Density-Based Clustering</em>
        </h1>
        <nav className="db-tabs">
          {TABS.map((name) => (
            <button
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
              key={name}
            >
              {name}
            </button>
          ))}
        </nav>
        <section className="db-data">
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
        <section className="db-stage">
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
            {points.slice(0, visibleCount).map((point, index) => {
              const type = result.pointTypes[index],
                label = result.labels[index],
                color = label < 0 ? "#ff7183" : COLORS[label % COLORS.length];
              return (
                <i
                  className={type}
                  key={index}
                  style={{
                    left: `${((point.x + 2.6) / 5.2) * 100}%`,
                    top: `${((1.9 - point.y) / 3.8) * 100}%`,
                    borderColor: color,
                    background: type === "core" ? color : "transparent",
                  }}
                />
              );
            })}
            <span>
              ε-neighborhood
              <br />
              (ε)
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
        <section className="db-cards">
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
        <footer className="db-info">
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
