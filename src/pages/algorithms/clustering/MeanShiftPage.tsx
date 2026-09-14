import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Moon,
  Rocket,
  RotateCcw,
  Target,
  Upload,
} from "lucide-react";
import {
  meanShift,
  type MeanShiftKernel,
} from "../../../lib/algorithms/clustering/meanShift";
import "./MeanShiftPage.css";

type Point = { x: number; y: number };
type Dataset = "mixed" | "density" | "anisotropic" | "imported";
const COLORS = [
  "#16d7ac",
  "#ff766c",
  "#ffc13c",
  "#2ec5ff",
  "#a77bff",
  "#f45cd0",
];
const rand = (i: number, salt: number) => {
  const value = Math.sin((i + 5) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};
function makeData(kind: Exclude<Dataset, "imported">): Point[] {
  const centers =
    kind === "density"
      ? [
          [-3, 1.6],
          [-0.8, -0.7],
          [2.8, 1.2],
          [2, -2.4],
        ]
      : [
          [-3.2, 0.6],
          [-1.1, 2.6],
          [2.8, 1.1],
          [1.5, -2.6],
        ];
  const sizes = [45, 66, 38, 51];
  return sizes.flatMap((size, cluster) =>
    Array.from({ length: size }, (_, local) => {
      const i = cluster * 100 + local,
        angle = rand(i, 1) * Math.PI * 2,
        radius =
          Math.sqrt(rand(i, 2)) *
          (kind === "density" ? 0.42 + cluster * 0.11 : 0.65);
      const stretch = kind === "anisotropic" ? [1.5, 0.45] : [1, 1];
      return {
        x: centers[cluster][0] + Math.cos(angle) * radius * stretch[0],
        y: centers[cluster][1] + Math.sin(angle) * radius * stretch[1],
      };
    }),
  );
}
const BUILT = {
  mixed: makeData("mixed"),
  density: makeData("density"),
  anisotropic: makeData("anisotropic"),
};
const LABELS: Record<Dataset, string> = {
  mixed: "Two Moons + Blobs",
  density: "Multi-density Peaks",
  anisotropic: "Anisotropic Groups",
  imported: "Imported Data",
};

export default function MeanShiftPage() {
  const [tab, setTab] = useState("Visualize"),
    [dataset, setDataset] = useState<Dataset>("mixed"),
    [points, setPoints] = useState<Point[]>(BUILT.mixed),
    [imported, setImported] = useState<Point[]>([]),
    [bandwidth, setBandwidth] = useState(1.25),
    [maxIterations, setMaxIterations] = useState(40),
    [tolerance, setTolerance] = useState(0.001),
    [kernel, setKernel] = useState<MeanShiftKernel>("epanechnikov"),
    [frame, setFrame] = useState(12),
    [running, setRunning] = useState(false),
    [showTrajectories, setShowTrajectories] = useState(true),
    [showKernels, setShowKernels] = useState(true),
    [showHeatmap, setShowHeatmap] = useState(false),
    [autoAnimate, setAutoAnimate] = useState(true),
    [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const X = useMemo(() => points.map((point) => [point.x, point.y]), [points]);
  const result = useMemo(
    () => meanShift(X, bandwidth, maxIterations, tolerance, kernel),
    [X, bandwidth, maxIterations, tolerance, kernel],
  );
  const activeFrame = Math.min(frame, result.iterations),
    positions = result.trajectories.map(
      (path) => path[Math.min(activeFrame, path.length - 1)],
    );
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () =>
        setFrame((value) =>
          value >= result.iterations ? (setRunning(false), value) : value + 1,
        ),
      450,
    );
    return () => window.clearInterval(timer);
  }, [running, result.iterations]);
  const choose = (value: Dataset) => {
    const next = value === "imported" ? imported : BUILT[value];
    if (!next.length) return;
    setDataset(value);
    setPoints(next);
    setFrame(0);
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
    setFrame(0);
    setToast(`Imported ${rows.length} points`);
    event.target.value = "";
  };
  const reset = () => {
    setBandwidth(1.25);
    setMaxIterations(40);
    setTolerance(0.001);
    setKernel("epanechnikov");
    setFrame(12);
    setRunning(false);
    setShowTrajectories(true);
    setShowKernels(true);
    setShowHeatmap(false);
    setAutoAnimate(true);
  };
  const pct = (value: number, axis: "x" | "y") =>
    axis === "x" ? (value + 5) * 10 : (5 - value) * 10;
  const sizes = result.assignments.reduce<number[]>((values, cluster) => {
    values[cluster] = (values[cluster] || 0) + 1;
    return values;
  }, []);
  return (
    <div className="ms-page">
      <aside className="ms-side">
        <Link to="/">
          <i>◇</i>
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </Link>
        <h3>LESSONS</h3>
        <b>FOUNDATIONS</b>
        {[
          "1. What is Clustering?",
          "2. K-Means",
          "3. Hierarchical",
          "4. Mean Shift",
          "5. DBSCAN",
          "6. Gaussian Mixture",
        ].map((name, index) => (
          <button
            className={index === 3 ? "active" : index < 3 ? "done" : ""}
            onClick={() => setToast(name)}
            key={name}
          >
            {name}
            {index < 3 ? "✓" : index === 3 ? "●" : ""}
          </button>
        ))}
        <b>ADVANCED</b>
        {["7. Spectral Clustering", "8. OPTICS", "9. BIRCH"].map((name) => (
          <button onClick={() => setToast(name)} key={name}>
            {name}
          </button>
        ))}
        <b>RESOURCES</b>
        {["▤ Cheat Sheet", "▧ Key Formulas", "▤ Further Reading"].map(
          (name) => (
            <button onClick={() => setToast(name)} key={name}>
              {name}
            </button>
          ),
        )}
        <article>
          <Rocket />
          <b>Practice Mode</b>
          <p>Test your understanding with guided challenges.</p>
          <button onClick={() => setToast("Practice started")}>
            Start Practice
          </button>
        </article>
        <Link className="path" to="/">
          ← Back to Path
        </Link>
      </aside>
      <header className="ms-top">
        <div>
          <h1>
            Mean Shift <em>Unsupervised</em>
          </h1>
          <p>
            Discover density peaks by iteratively shifting kernel windows toward
            higher density regions.
          </p>
        </div>
        <section>
          Lesson Progress{" "}
          <i>
            <b />
          </i>
          <strong>65%</strong>
        </section>
        <button onClick={() => setToast("Roadmap opened")}>
          <BookOpen />
          Lesson Roadmap
        </button>
        <button onClick={() => setToast("Theme changed")}>
          <Moon />
        </button>
      </header>
      <main>
        <nav>
          {["Learn", "Visualize", "Dataset", "Train", "Metrics", "Compare"].map(
            (name) => (
              <button
                className={tab === name ? "active" : ""}
                onClick={() => setTab(name)}
                key={name}
              >
                {name}
              </button>
            ),
          )}
          <span>
            <Target />
            <b>Objective</b>See how kernels move to density peaks and converge.
          </span>
        </nav>
        <section className="ms-data">
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
          <button onClick={() => setToast("Sample datasets opened")}>
            ◉ Sample Datasets
          </button>
          <button onClick={() => fileRef.current?.click()}>
            <Upload />
            Upload Data
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
        </section>
        <section className={`ms-plot ${showHeatmap ? "heat" : ""}`}>
          <header>
            <b>
              Iteration {activeFrame} / {maxIterations}
            </b>
            <div>
              {Array.from({ length: 14 }, (_, index) => (
                <i
                  className={
                    index <= (activeFrame / Math.max(1, maxIterations)) * 13
                      ? "done"
                      : ""
                  }
                  key={index}
                />
              ))}
            </div>
            <button onClick={reset}>
              <RotateCcw />
              Reset View
            </button>
          </header>
          <div className="canvas">
            {points.map((point, index) => (
              <i
                className="datum"
                style={{
                  left: `${pct(point.x, "x")}%`,
                  top: `${pct(point.y, "y")}%`,
                }}
                key={index}
              />
            ))}
            {showTrajectories &&
              positions.map((position, index) => {
                const start = points[index];
                return (
                  <svg
                    key={index}
                    style={{
                      left: `${pct(Math.min(start.x, position[0]), "x")}%`,
                      top: `${pct(Math.max(start.y, position[1]), "y")}%`,
                      width: `${Math.abs(position[0] - start.x) * 10}%`,
                      height: `${Math.abs(position[1] - start.y) * 10}%`,
                    }}
                  >
                    <line x1="0" y1="100%" x2="100%" y2="0" />
                  </svg>
                );
              })}
            {positions.map(
              (position, index) =>
                index % 5 === 0 && (
                  <i
                    className="moving"
                    key={`m${index}`}
                    style={{
                      left: `${pct(position[0], "x")}%`,
                      top: `${pct(position[1], "y")}%`,
                      borderColor:
                        COLORS[result.assignments[index] % COLORS.length],
                    }}
                  />
                ),
            )}
            {result.centers.map((center, index) => (
              <b
                key={index}
                style={{
                  left: `${pct(center[0], "x")}%`,
                  top: `${pct(center[1], "y")}%`,
                  color: COLORS[index % COLORS.length],
                }}
              >
                {showKernels && (
                  <i
                    style={{
                      width: `${bandwidth * 55}px`,
                      height: `${bandwidth * 55}px`,
                    }}
                  />
                )}
                ●
              </b>
            ))}
          </div>
          <aside>
            <span>
              <i />
              Kernel (current)
            </span>
            <span>--- Kernel (trajectory)</span>
            <span>• Data point</span>
            <span>◉ Converged center</span>
          </aside>
        </section>
        <section className="ms-timeline">
          <button onClick={() => setRunning(!running)}>
            {running ? "Ⅱ" : "▶"}
          </button>
          {[0, 5, 10, 15, 20, 30, result.iterations].map((value, index) => (
            <button
              className={
                index === 6
                  ? activeFrame === result.iterations
                    ? "active"
                    : ""
                  : activeFrame === value
                    ? "active"
                    : ""
              }
              onClick={() => setFrame(Math.min(value, result.iterations))}
              key={`${value}-${index}`}
            >
              {index === 6 ? "Converged" : `t = ${value}`}
            </button>
          ))}
        </section>
        <section className="ms-cards">
          <article>
            <h3>CONVERGENCE OVER TIME</h3>
            <svg viewBox="0 0 300 120">
              {result.displacementHistory.length > 1 && (
                <polyline
                  points={result.displacementHistory
                    .map(
                      (value, index) =>
                        `${15 + (index / Math.max(1, result.displacementHistory.length - 1)) * 270},${105 - Math.min(1, value / (result.displacementHistory[0] || 1)) * 90}`,
                    )
                    .join(" ")}
                />
              )}
            </svg>
          </article>
          <article>
            <h3>CLUSTER OUTPUT (CONVERGED)</h3>
            <div>
              {result.centers.slice(0, 4).map((center, index) => (
                <span style={{ borderColor: COLORS[index] }} key={index}>
                  <b style={{ color: COLORS[index] }}>● Cluster {index + 1}</b>
                  <strong>{sizes[index] || 0} pts</strong>
                  <small>
                    Center [{center.map((v) => v.toFixed(2)).join(", ")}]
                  </small>
                </span>
              ))}
            </div>
            <footer>
              Total Clusters <b>{result.centers.length}</b> · Total Points{" "}
              <b>{points.length}</b> · Noise Points <b>0</b> · Iterations{" "}
              <b>{result.iterations}</b> · Converged{" "}
              <b>{result.converged ? "✓ Yes" : "No"}</b>
            </footer>
          </article>
          <article>
            <h3>DENSITY LANDSCAPE</h3>
            <div>
              {result.centers.slice(0, 4).map((center, index) => (
                <i
                  key={index}
                  style={{
                    left: `${pct(center[0], "x")}%`,
                    top: `${pct(center[1], "y")}%`,
                    background: COLORS[index],
                  }}
                />
              ))}
            </div>
            <p>Bandwidth (h): {bandwidth.toFixed(2)}</p>
          </article>
        </section>
        <footer className="ms-tip">
          ⓘ Tip: Mean Shift finds density peaks without specifying cluster
          count. Try adjusting the bandwidth to explore different granularities.
        </footer>
      </main>
      <aside className="ms-controls">
        <h2>MEAN SHIFT CONTROLS</h2>
        <label>
          Bandwidth (h)
          <input
            aria-label="Bandwidth numeric"
            type="number"
            min=".1"
            max="5"
            step=".05"
            value={bandwidth}
            onChange={(event) => setBandwidth(Number(event.target.value))}
          />
        </label>
        <input
          aria-label="Bandwidth"
          type="range"
          min=".1"
          max="5"
          step=".05"
          value={bandwidth}
          onChange={(event) => setBandwidth(Number(event.target.value))}
        />
        <p>
          .10 <span>5.00</span>
        </p>
        <small>
          Larger bandwidth → smoother (fewer clusters)
          <br />
          Smaller bandwidth → more detail (more clusters)
        </small>
        <label>
          Max Iterations
          <input
            aria-label="Maximum iterations numeric"
            type="number"
            min="5"
            max="100"
            value={maxIterations}
            onChange={(event) => setMaxIterations(Number(event.target.value))}
          />
        </label>
        <input
          aria-label="Maximum iterations"
          type="range"
          min="5"
          max="100"
          value={maxIterations}
          onChange={(event) => setMaxIterations(Number(event.target.value))}
        />
        <p>
          5 <span>100</span>
        </p>
        <label>
          Convergence Epsilon
          <input
            aria-label="Convergence epsilon numeric"
            type="number"
            min=".0001"
            max=".01"
            step=".0001"
            value={tolerance}
            onChange={(event) => setTolerance(Number(event.target.value))}
          />
        </label>
        <input
          aria-label="Convergence epsilon"
          type="range"
          min=".0001"
          max=".01"
          step=".0001"
          value={tolerance}
          onChange={(event) => setTolerance(Number(event.target.value))}
        />
        <p>
          .0001 <span>.01</span>
        </p>
        <label>Kernel Type</label>
        <select
          value={kernel}
          onChange={(event) => setKernel(event.target.value as MeanShiftKernel)}
        >
          <option value="epanechnikov">Epanechnikov (default)</option>
          <option value="gaussian">Gaussian</option>
          <option value="flat">Flat / Uniform</option>
        </select>
        {[
          ["Show Trajectories", showTrajectories, setShowTrajectories],
          ["Show Kernels", showKernels, setShowKernels],
          ["Show Density Heatmap", showHeatmap, setShowHeatmap],
          ["Auto Animate", autoAnimate, setAutoAnimate],
        ].map(([name, checked, setter]) => (
          <label className="toggle" key={name as string}>
            {name as string}
            <input
              type="checkbox"
              checked={checked as boolean}
              onChange={(event) =>
                (setter as React.Dispatch<React.SetStateAction<boolean>>)(
                  event.target.checked,
                )
              }
            />
            <i />
          </label>
        ))}
        <footer>
          <button onClick={() => setRunning(!running)}>▷Ⅱ Run / Pause</button>
          <button
            onClick={() => setFrame(Math.min(result.iterations, frame + 1))}
          >
            ▷ Step
          </button>
        </footer>
      </aside>
      {toast && (
        <button className="ms-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
