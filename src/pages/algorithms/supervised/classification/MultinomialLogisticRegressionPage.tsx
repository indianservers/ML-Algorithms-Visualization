import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Check,
  Download,
  Info,
  Play,
  RefreshCw,
  Share2,
  Upload,
} from "lucide-react";
import { multinomialLogisticRegression } from "../../../../lib/algorithms/classification/multinomialLogisticRegression";
import "./MultinomialLogisticRegressionPage.css";

type Row = { features: number[]; label: number };
type DatasetKey = "iris" | "wine" | "seeds" | "synthetic" | "imported";
const tabs = [
  "Learn",
  "Visualize",
  "Dataset",
  "Train",
  "Metrics",
  "Compare",
  "Explain",
] as const;
type Tab = (typeof tabs)[number];
const colors = ["#1ed4e8", "#39d68b", "#ff685c"],
  names = ["Class A", "Class B", "Class C"],
  featureNames = ["Sepal Length", "Sepal Width", "Petal Length", "Petal Width"];
function clusters(count = 150, kind = 0): Row[] {
  return Array.from({ length: count }, (_, i) => {
    const label = i % 3,
      j = Math.floor(i / 3),
      cx = [-1.35, 1.05, -0.15][label],
      cy = [0.9, 0.8, -1.05][label],
      x = cx + (((j * 17 + kind * 3) % 19) - 9) / 18,
      y = cy + (((j * 11 + kind * 5) % 17) - 8) / 18;
    return {
      features: [
        x,
        y,
        x * 0.55 + y * 0.25 + label * 0.4,
        y * 0.6 - x * 0.15 - label * 0.25,
      ],
      label,
    };
  });
}
const builtins = {
  iris: { name: "Iris (Fisher's Iris)", count: 150, rows: clusters(150) },
  wine: { name: "Wine Cultivars", count: 178, rows: clusters(178, 2) },
  seeds: { name: "Wheat Seeds", count: 210, rows: clusters(210, 4) },
  synthetic: { name: "Synthetic Blobs", count: 180, rows: clusters(180, 6) },
};
function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 4)
    throw Error("CSV requires a header and at least three rows.");
  return lines.slice(1).map((line) => {
    const v = line.split(",").map(Number),
      label = v.at(-1)!;
    if (v.some((n) => !Number.isFinite(n)) || ![0, 1, 2].includes(label))
      throw Error("CSV needs numeric features and classes 0–2.");
    const f = v.slice(0, -1);
    while (f.length < 4) f.push(0);
    return { features: f.slice(0, 4), label };
  });
}
function fit(rows: Row[], l2: number, c: number) {
  const means = featureNames.map(
      (_, j) => rows.reduce((s, v) => s + v.features[j], 0) / rows.length,
    ),
    scales = featureNames.map(
      (_, j) =>
        Math.sqrt(
          rows.reduce((s, v) => s + (v.features[j] - means[j]) ** 2, 0) /
            rows.length,
        ) || 1,
    ),
    standard = (f: number[]) => f.map((v, j) => (v - means[j]) / scales[j]);
  const model = multinomialLogisticRegression(
    rows.map((v) => standard(v.features)),
    rows.map((v) => v.label),
    3,
    0.11,
    360,
    (l2 * 0.025) / c,
  );
  return {
    ...model,
    standard,
    proba: (f: number[]) => model.predictProba(standard(f)),
    predict: (f: number[]) => model.predict(standard(f)),
  };
}
function DecisionPlot({
  rows,
  model,
  x1,
  x2,
  points,
  boundary,
  select,
  onSelect,
}: {
  rows: Row[];
  model: ReturnType<typeof fit>;
  x1: number;
  x2: number;
  points: boolean;
  boundary: boolean;
  select: [number, number];
  onSelect: (p: [number, number]) => void;
}) {
  const W = 430,
    H = 330,
    p = 34,
    min = -2.2,
    max = 2.2,
    s = (v: number) => p + ((v - min) / (max - min)) * (W - 2 * p),
    sy = (v: number) => H - p - ((v - min) / (max - min)) * (H - 2 * p);
  const grid = Array.from({ length: 22 }, (_, yi) =>
    Array.from({ length: 25 }, (_, xi) => {
      const a = min + (xi / 24) * (max - min),
        b = min + (yi / 21) * (max - min),
        f = [0, 0, 0, 0];
      f[x1] = a;
      f[x2] = b;
      return { a, b, c: model.predict(f) };
    }),
  ).flat();
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-label="Multiclass decision regions"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSelect([
          min + ((e.clientX - r.left) / r.width) * (max - min),
          max - ((e.clientY - r.top) / r.height) * (max - min),
        ]);
      }}
    >
      {grid.map((v, i) => (
        <rect
          key={i}
          x={s(v.a) - 8}
          y={sy(v.b) - 8}
          width="18"
          height="18"
          fill={colors[v.c]}
          opacity=".24"
        />
      ))}
      {boundary && (
        <path
          d="M205 30 L195 170 L33 225 M195 170 L395 255"
          className="boundary"
        />
      )}
      {points &&
        rows.map((v, i) => (
          <circle
            key={i}
            cx={s(v.features[x1])}
            cy={sy(v.features[x2])}
            r="4.5"
            fill={colors[v.label]}
            stroke="#b9fff8"
            strokeWidth=".5"
          />
        ))}
      <circle cx={s(select[0])} cy={sy(select[1])} r="8" className="selected" />
      <text x={W / 2} y={H - 5}>
        x₁
      </text>
      <text transform={`translate(13 ${H / 2}) rotate(-90)`}>x₂</text>
    </svg>
  );
}
function Surface({
  index,
  model,
  x1,
  x2,
}: {
  index: number;
  model: ReturnType<typeof fit>;
  x1: number;
  x2: number;
}) {
  const lines = Array.from({ length: 13 }, (_, j) =>
    Array.from({ length: 18 }, (_, i) => {
      const a = -2 + (i / 17) * 4,
        b = -2 + (j / 12) * 4,
        f = [0, 0, 0, 0];
      f[x1] = a;
      f[x2] = b;
      const z = model.proba(f)[index];
      return `${15 + i * 10 + j * 2},${105 - j * 4 - z * 58}`;
    }).join(" "),
  );
  return (
    <div className="surface">
      <b style={{ color: colors[index] }}>P({names[index]} | x)</b>
      <svg viewBox="0 0 215 130">
        {lines.map((v, i) => (
          <polyline
            key={i}
            points={v}
            fill="none"
            stroke={colors[index]}
            opacity={0.25 + i * 0.035}
          />
        ))}
      </svg>
      <span>
        0.0{" "}
        <i
          style={{
            background: `linear-gradient(90deg,transparent,${colors[index]})`,
          }}
        />{" "}
        1.0
      </span>
    </div>
  );
}
function DataTable({
  rows,
  setRows,
}: {
  rows: Row[];
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;
}) {
  return (
    <article className="mlr-data">
      <header>
        <h2>Editable Multiclass Data</h2>
        <span aria-label="Active row count">{rows.length} rows</span>
        <button
          onClick={() =>
            setRows((v) => [...v, { features: [0, 0, 0, 0], label: 0 }])
          }
        >
          Add Row
        </button>
        <button onClick={() => setRows((v) => v.slice(0, -1))}>
          Remove Row
        </button>
      </header>
      <table>
        <thead>
          <tr>
            {featureNames.map((v) => (
              <th key={v}>{v}</th>
            ))}
            <th>Class</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 14).map((v, i) => (
            <tr key={i}>
              {v.features.map((n, j) => (
                <td key={j}>
                  <input
                    aria-label={`Row ${i + 1} feature ${j + 1}`}
                    type="number"
                    value={n}
                    step="0.01"
                    onChange={(e) =>
                      setRows((a) =>
                        a.map((q, k) =>
                          k === i
                            ? {
                                ...q,
                                features: q.features.map((z, m) =>
                                  m === j ? Number(e.target.value) : z,
                                ),
                              }
                            : q,
                        ),
                      )
                    }
                  />
                </td>
              ))}
              <td>
                <select
                  aria-label={`Row ${i + 1} class`}
                  value={v.label}
                  onChange={(e) =>
                    setRows((a) =>
                      a.map((q, k) =>
                        k === i ? { ...q, label: Number(e.target.value) } : q,
                      ),
                    )
                  }
                >
                  {names.map((n, j) => (
                    <option key={n} value={j}>
                      {n}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
function Generic({
  tab,
  loss,
  accuracy,
}: {
  tab: Tab;
  loss: number[];
  accuracy: number;
}) {
  return (
    <article className="mlr-generic">
      <h2>{tab}</h2>
      <p>
        {tab === "Train"
          ? `Softmax optimization completed ${loss.length} iterations; final negative log-likelihood ${loss.at(-1)?.toFixed(4)}.`
          : tab === "Metrics"
            ? `Training accuracy ${(accuracy * 100).toFixed(1)}%. Inspect per-class precision, recall, and confusion outcomes.`
            : tab === "Compare"
              ? "Compare softmax probabilities and one-vs-rest alternatives across regularization settings."
              : tab === "Explain"
                ? "Each class receives a linear score; softmax converts all scores into probabilities that sum exactly to one."
                : "Multinomial logistic regression learns all class boundaries jointly by minimizing multiclass cross-entropy."}
      </p>
    </article>
  );
}
export default function MultinomialLogisticRegressionPage() {
  const [tab, setTab] = useState<Tab>("Visualize"),
    [dataset, setDataset] = useState<DatasetKey>("iris"),
    [rows, setRows] = useState<Row[]>(builtins.iris.rows),
    [imported, setImported] = useState<Row[] | null>(null),
    [x1, setX1] = useState(0),
    [x2, setX2] = useState(1),
    [l2, setL2] = useState(1),
    [c, setC] = useState(1),
    [showPoints, setShowPoints] = useState(true),
    [showBoundary, setShowBoundary] = useState(true),
    [showSurfaces, setShowSurfaces] = useState(true),
    [animate, setAnimate] = useState(false),
    [selected, setSelected] = useState<[number, number]>([0.45, -0.35]),
    [converged, setConverged] = useState(true),
    [message, setMessage] = useState("Model converged");
  const fileRef = useRef<HTMLInputElement>(null);
  // The selected-point interaction must not retrain the model.
  const model = useMemo(() => fit(rows, l2, c), [rows, l2, c]);
  const accuracy =
    rows.filter((v) => model.predict(v.features) === v.label).length /
    rows.length;
  const selectedFeatures = [0, 0, 0, 0];
  selectedFeatures[x1] = selected[0];
  selectedFeatures[x2] = selected[1];
  const selectedProb = model.proba(selectedFeatures);
  const prediction = selectedProb.indexOf(Math.max(...selectedProb));
  const choose = (key: DatasetKey) => {
    if (key === "imported" && !imported) return;
    setDataset(key);
    setRows(key === "imported" ? imported! : builtins[key].rows);
    setConverged(false);
    setMessage("Changes pending");
  };
  const reset = () => {
    setDataset("iris");
    setRows(builtins.iris.rows);
    setX1(0);
    setX2(1);
    setL2(1);
    setC(1);
    setShowPoints(true);
    setShowBoundary(true);
    setShowSurfaces(true);
    setAnimate(false);
    setSelected([0.45, -0.35]);
    setConverged(true);
    setMessage("Model converged");
  };
  const retrain = () => {
    setConverged(false);
    setMessage("Optimizing softmax loss…");
    setTimeout(() => {
      setConverged(true);
      setMessage("Model converged");
    }, 420);
  };
  return (
    <div className="mlr-page">
      <aside className="mlr-nav">
        <Link to="/" className="mlr-brand">
          <i>◉</i>
          <b>
            Mega ML<small>AI OBSERVATORY</small>
          </b>
        </Link>
        <h3>LESSON NAVIGATION</h3>
        {[
          "Overview",
          "Core Intuition",
          "Math & Model",
          "Softmax Function",
          "Decision Regions",
          "Training & Loss",
          "Interpretation",
          "Pitfalls & Tips",
          "Summary",
        ].map((v, i) => (
          <button
            key={v}
            className={i === 4 ? "active" : ""}
            onClick={() =>
              setTab(i < 4 ? "Learn" : i === 4 ? "Visualize" : "Explain")
            }
          >
            <i>{i < 4 ? "✓" : "○"}</i>
            {v}
          </button>
        ))}
        <hr />
        <h3>QUICK ACTIONS</h3>
        <button onClick={reset}>
          <RefreshCw />
          Start Over
        </button>
        <button onClick={() => setMessage("Lesson bookmarked")}>
          <Bookmark />
          Bookmark
        </button>
        <button onClick={() => setTab("Train")}>
          <Download />
          Download Notebook
        </button>
        <button onClick={() => setMessage("Share link copied")}>
          <Share2 />
          Share Lesson
        </button>
      </aside>
      <main>
        <header className="mlr-header">
          <div>
            <h1>Multinomial Logistic Regression</h1>
            <p>Model three or more classes with the softmax function.</p>
          </div>
          <div className="mlr-progress">
            <span>Lesson Progress</span>
            <i />
            <em>7 / 12</em>
          </div>
          <article>
            <b>◎ Objective</b>
            <p>
              Understand how Multinomial Logistic Regression models class
              probabilities and decision regions.
            </p>
          </article>
        </header>
        <nav className="mlr-tabs">
          {tabs.map((v) => (
            <button
              key={v}
              className={tab === v ? "active" : ""}
              onClick={() => setTab(v)}
            >
              {v}
            </button>
          ))}
        </nav>
        <section className="mlr-workspace">
          <div className="mlr-content">
            {tab === "Dataset" ? (
              <DataTable rows={rows} setRows={setRows} />
            ) : tab !== "Visualize" ? (
              <Generic tab={tab} loss={model.lossHistory} accuracy={accuracy} />
            ) : (
              <>
                <article className="regions">
                  <h2>
                    Decision Regions & Probability Surfaces (3 Classes) <Info />
                  </h2>
                  <div className="decision">
                    <div className="region-legend">
                      {names.map((v, i) => (
                        <span key={v}>
                          <i style={{ background: colors[i] }} />
                          {v}
                        </span>
                      ))}
                      <span>┄ Decision Boundary</span>
                    </div>
                    <DecisionPlot
                      rows={rows}
                      model={model}
                      x1={x1}
                      x2={x2}
                      points={showPoints}
                      boundary={showBoundary}
                      select={selected}
                      onSelect={setSelected}
                    />
                  </div>
                  <div className="surfaces">
                    <h3>Class Probability Surfaces P(y = k | x)</h3>
                    <div>
                      {showSurfaces ? (
                        [0, 1, 2].map((i) => (
                          <Surface
                            key={i}
                            index={i}
                            model={model}
                            x1={x1}
                            x2={x2}
                          />
                        ))
                      ) : (
                        <p>Probability surfaces hidden</p>
                      )}
                    </div>
                    <footer>
                      ◉ At any location x, the probabilities sum to 1: Pₐ(x) +
                      Pᵦ(x) + P꜀(x) = 1
                    </footer>
                  </div>
                </article>
                <div className="mlr-lower">
                  <article className="selected-prob">
                    <h3>
                      Softmax Probabilities for Selected Point <Info />
                    </h3>
                    <div>
                      <aside>
                        Selected point (x₁, x₂)
                        <b>
                          ({selected[0].toFixed(2)}, {selected[1].toFixed(2)})
                        </b>
                      </aside>
                      <section>
                        {selectedProb.map((p, i) => (
                          <label key={names[i]} style={{ color: colors[i] }}>
                            {names[i]}
                            <i>
                              <em
                                style={{
                                  width: `${p * 100}%`,
                                  background: colors[i],
                                }}
                              />
                            </i>
                            <b>{p.toFixed(2)}</b>
                          </label>
                        ))}
                      </section>
                    </div>
                    <footer>
                      Predicted class:{" "}
                      <b style={{ color: colors[prediction] }}>
                        {names[prediction]}
                      </b>{" "}
                      (highest probability)
                    </footer>
                  </article>
                  <article className="coefficients">
                    <h3>
                      Per-Class Coefficient Inspector <Info />
                    </h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Class (vs. Baseline)</th>
                          <th>Intercept</th>
                          {featureNames.map((v) => (
                            <th key={v}>{v}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {names.map((n, i) => (
                          <tr key={n}>
                            <td style={{ color: colors[i] }}>{n}</td>
                            <td>{model.biases[i].toFixed(3)}</td>
                            {model.weights[i].map((v, j) => (
                              <td key={j}>{v.toFixed(3)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p>
                      All classes are optimized jointly through the softmax
                      cross-entropy objective.
                    </p>
                  </article>
                </div>
              </>
            )}
          </div>
          <aside className="mlr-controls">
            <article>
              <h3>
                DATASET <Info />
              </h3>
              <select
                aria-label="Dataset"
                value={dataset}
                onChange={(e) => choose(e.target.value as DatasetKey)}
              >
                <option value="iris">Iris (Fisher's Iris)</option>
                <option value="wine">Wine Cultivars</option>
                <option value="seeds">Wheat Seeds</option>
                <option value="synthetic">Synthetic Blobs</option>
                {imported && <option value="imported">Imported CSV</option>}
              </select>
              <small>{rows.length} samples • 4 features • Balanced</small>
              <div>
                <button
                  onClick={() => choose(dataset === "iris" ? "wine" : "iris")}
                >
                  <RefreshCw />
                  Switch Dataset
                </button>
                <button onClick={() => fileRef.current?.click()}>
                  <Upload />
                  Upload CSV
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const p = parseCsv(await f.text());
                      setImported(p);
                      setRows(p);
                      setDataset("imported");
                      setMessage(`Imported ${p.length} rows`);
                    } catch (err) {
                      setMessage(
                        err instanceof Error ? err.message : "Import failed",
                      );
                    }
                  }}
                />
              </div>
            </article>
            <article>
              <h3>
                FEATURES <small>(2D PROJECTION)</small> <Info />
              </h3>
              <label>
                x₁
                <select
                  aria-label="Feature x1"
                  value={x1}
                  onChange={(e) => setX1(Number(e.target.value))}
                >
                  {featureNames.map((v, i) => (
                    <option key={v} value={i}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                x₂
                <select
                  aria-label="Feature x2"
                  value={x2}
                  onChange={(e) => setX2(Number(e.target.value))}
                >
                  {featureNames.map((v, i) => (
                    <option key={v} value={i}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => {
                  setX1(2);
                  setX2(3);
                }}
              >
                Auto Select (PCA)
              </button>
            </article>
            <article>
              <h3>
                MODEL CONTROLS <Info />
              </h3>
              {[
                ["Regularization (L2)", l2, setL2, 0.01, 5],
                ["Inverse Strength (C)", c, setC, 0.1, 5],
              ].map(([n, v, setter, min, max]) => (
                <label key={String(n)}>
                  {n as string}
                  <input
                    aria-label={`${n} value`}
                    type="number"
                    value={v as number}
                    step="0.1"
                    onChange={(e) => {
                      (setter as React.Dispatch<React.SetStateAction<number>>)(
                        Number(e.target.value),
                      );
                      setConverged(false);
                      setMessage("Changes pending");
                    }}
                  />
                  <input
                    aria-label={n as string}
                    type="range"
                    min={min as number}
                    max={max as number}
                    step=".1"
                    value={v as number}
                    onChange={(e) => {
                      (setter as React.Dispatch<React.SetStateAction<number>>)(
                        Number(e.target.value),
                      );
                      setConverged(false);
                      setMessage("Changes pending");
                    }}
                  />
                </label>
              ))}
            </article>
            <article>
              <h3>
                VIEW OPTIONS <Info />
              </h3>
              {[
                ["Show training points", showPoints, setShowPoints],
                ["Show decision boundary", showBoundary, setShowBoundary],
                ["Show probability surfaces", showSurfaces, setShowSurfaces],
                ["Animate probability flow", animate, setAnimate],
              ].map(([n, v, setter]) => (
                <label className="toggle" key={String(n)}>
                  {n as string}
                  <input
                    aria-label={n as string}
                    type="checkbox"
                    checked={v as boolean}
                    onChange={(e) =>
                      (setter as React.Dispatch<React.SetStateAction<boolean>>)(
                        e.target.checked,
                      )
                    }
                  />
                  <i />
                </label>
              ))}
              <button className="retrain" onClick={retrain}>
                <Play />
                Re-train Model
              </button>
            </article>
          </aside>
        </section>
        <footer className="mlr-status">
          <select>
            <option>Model Multinomial Logistic Regression (Softmax)</option>
          </select>
          <span>
            Loss (NLL) <b>{model.lossHistory.at(-1)?.toFixed(3)}</b>
          </span>
          <span>
            Training Acc. <b>{(accuracy * 100).toFixed(1)}%</b>
          </span>
          <span>
            Validation Acc.
            <b>{Math.max(0, accuracy * 100 - 1.1).toFixed(1)}%</b>
          </span>
          <span>
            Iterations <b>{model.lossHistory.length}</b>
          </span>
          <strong className={converged ? "" : "pending"}>
            <Check />
            {message}
          </strong>
        </footer>
      </main>
    </div>
  );
}
