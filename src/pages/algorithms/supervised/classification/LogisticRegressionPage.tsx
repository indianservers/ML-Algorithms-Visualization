import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  Check,
  ChevronDown,
  CircleHelp,
  Info,
  Moon,
  Play,
  RefreshCw,
  Settings,
  Sun,
  Upload,
} from "lucide-react";
import { logisticRegression } from "../../../../lib/algorithms/classification/logisticRegression";
import { binaryMetrics } from "../../../../lib/math/metrics";
import "./LogisticRegressionPage.css";

type Point = { x: number; y: number };
type DatasetKey = "admissions" | "loans" | "churn" | "synthetic" | "imported";
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
const admissions = Array.from({ length: 120 }, (_, i) => {
  const x = 8 + ((i * 37) % 93),
    noise = ((i * 17) % 23) - 11;
  return { x, y: x + noise > 61 ? 1 : 0 };
});
const datasets = {
  admissions: {
    name: "University Admissions",
    feature: "Exam Score",
    source: "Recommended",
    rows: admissions,
  },
  loans: {
    name: "Loan Approval",
    feature: "Credit Score",
    source: "Finance",
    rows: Array.from({ length: 90 }, (_, i) => {
      const x = 300 + ((i * 53) % 551);
      return { x, y: x + ((i * 19) % 101) - 50 > 625 ? 1 : 0 };
    }),
  },
  churn: {
    name: "Customer Churn",
    feature: "Satisfaction",
    source: "Business",
    rows: Array.from({ length: 140 }, (_, i) => {
      const x = (i * 7) % 101;
      return { x, y: x + ((i * 11) % 31) - 15 < 48 ? 1 : 0 };
    }),
  },
  synthetic: {
    name: "Synthetic Binary",
    feature: "Feature x",
    source: "Generated",
    rows: Array.from({ length: 160 }, (_, i) => {
      const x = (i * 29) % 101;
      return { x, y: x + ((i * 13) % 25) - 12 > 55 ? 1 : 0 };
    }),
  },
};
const nav = [
  "Linear Regression",
  "Logistic Regression",
  "Decision Tree",
  "Random Forest",
  "SVM",
  "KNN",
  "Naive Bayes",
];
function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 3) throw Error("CSV requires a header and two rows.");
  return lines.slice(1).map((line) => {
    const v = line.split(",").map(Number);
    if (!Number.isFinite(v[0]) || ![0, 1].includes(v.at(-1)!))
      throw Error("CSV needs a numeric feature and binary target.");
    return { x: v[0], y: v.at(-1)! };
  });
}
function train(rows: Point[], l2: number) {
  const mean = rows.reduce((s, v) => s + v.x, 0) / rows.length,
    scale =
      Math.sqrt(
        rows.reduce((s, v) => s + (v.x - mean) ** 2, 0) / rows.length,
      ) || 1;
  const model = logisticRegression(
    rows.map((v) => [(v.x - mean) / scale]),
    rows.map((v) => v.y),
    0.12,
    650,
    undefined,
    l2 * 0.03,
  );
  return {
    ...model,
    mean,
    scale,
    proba: (x: number) => model.predictProba([(x - mean) / scale]),
  };
}

function ProbabilityChart({
  rows,
  proba,
  threshold,
  view,
}: {
  rows: Point[];
  proba: (x: number) => number;
  threshold: number;
  view: "probability" | "logodds" | "both";
}) {
  const W = 870,
    H = 420,
    l = 58,
    r = 90,
    t = 55,
    b = 48,
    xmin = Math.min(...rows.map((v) => v.x)),
    xmax = Math.max(...rows.map((v) => v.x));
  const sx = (x: number) => l + ((x - xmin) / (xmax - xmin || 1)) * (W - l - r),
    sy = (p: number) => H - b - p * (H - t - b);
  const curve = Array.from({ length: 100 }, (_, i) => {
    const x = xmin + (i / 99) * (xmax - xmin),
      p = proba(x);
    return { x, p, z: Math.log(Math.max(1e-6, p) / Math.max(1e-6, 1 - p)) };
  });
  const path = curve
    .map(
      (v, i) => `${i ? "L" : "M"}${sx(v.x).toFixed(1)},${sy(v.p).toFixed(1)}`,
    )
    .join(" ");
  const tx = Math.max(xmin, Math.min(xmax, threshold));
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-label="Logistic probability and log odds chart"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1={l} x2={W - r} y1={sy(v)} y2={sy(v)} className="grid" />
          <text x={l - 24} y={sy(v) + 4}>
            {v.toFixed(1)}
          </text>
        </g>
      ))}
      <line x1={l} x2={W - r} y1={H - b} y2={H - b} className="axis" />
      <line x1={l} x2={l} y1={t} y2={H - b} className="axis" />
      <line
        x1={l}
        x2={W - r}
        y1={sy(0.5)}
        y2={sy(0.5)}
        className="threshold-line"
      />
      <line
        x1={sx(tx)}
        x2={sx(tx)}
        y1={t - 10}
        y2={H - b}
        className="threshold-line"
      />
      {(view === "probability" || view === "both") && (
        <path d={path} className="sigmoid" />
      )}
      {rows.map((v, i) => (
        <circle
          key={i}
          cx={sx(v.x)}
          cy={sy(v.y)}
          r={i === 4 || i === 70 ? 7 : 4}
          className={v.y ? "positive" : "negative"}
        />
      ))}
      <rect
        x={sx(tx) - 45}
        y={10}
        width="90"
        height="28"
        rx="5"
        className="threshold-box"
      />
      <text x={sx(tx)} y={29} className="threshold-text">
        Threshold: {Math.round(threshold)}
      </text>
      <text x={(l + W - r) / 2} y={H - 10}>
        {view === "logodds" ? "Log-Odds (z)" : "Exam Score"}
      </text>
      <text transform={`translate(15 ${H / 2}) rotate(-90)`}>P(Admit)</text>
      <text x={W - r + 15} y={t + 8} className="formula">
        Sigmoid Function
      </text>
    </svg>
  );
}
function DataTable({
  rows,
  setRows,
}: {
  rows: Point[];
  setRows: React.Dispatch<React.SetStateAction<Point[]>>;
}) {
  return (
    <article className="lr-data">
      <header>
        <h2>Editable Classification Data</h2>
        <span aria-label="Active row count">{rows.length} rows</span>
        <button onClick={() => setRows((v) => [...v, { x: 60, y: 1 }])}>
          Add Row
        </button>
        <button onClick={() => setRows((v) => v.slice(0, -1))}>
          Remove Row
        </button>
      </header>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Class</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 18).map((v, i) => (
            <tr key={i}>
              <td>
                <input
                  aria-label={`Row ${i + 1} feature`}
                  type="number"
                  value={v.x}
                  onChange={(e) =>
                    setRows((a) =>
                      a.map((p, j) =>
                        j === i ? { ...p, x: Number(e.target.value) } : p,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <select
                  aria-label={`Row ${i + 1} class`}
                  value={v.y}
                  onChange={(e) =>
                    setRows((a) =>
                      a.map((p, j) =>
                        j === i ? { ...p, y: Number(e.target.value) } : p,
                      ),
                    )
                  }
                >
                  <option value="0">Negative</option>
                  <option value="1">Positive</option>
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
  probability,
}: {
  tab: Tab;
  loss: number[];
  probability: number;
}) {
  return (
    <article className="lr-generic">
      <h2>{tab}</h2>
      <p>
        {tab === "Train"
          ? `Gradient descent completed ${loss.length} iterations. Final cross-entropy: ${loss.at(-1)?.toFixed(4)}.`
          : tab === "Metrics"
            ? "Explore threshold-sensitive accuracy, precision, recall, F1, and confusion outcomes."
            : tab === "Compare"
              ? "Compare probability estimates and class decisions across regularization strengths."
              : tab === "Explain"
                ? `Live example probability: ${(probability * 100).toFixed(1)}%.`
                : "Logistic regression maps a linear score through the sigmoid function to a calibrated class probability."}
      </p>
    </article>
  );
}

export default function LogisticRegressionPage() {
  const [tab, setTab] = useState<Tab>("Visualize"),
    [dataset, setDataset] = useState<DatasetKey>("admissions"),
    [rows, setRows] = useState<Point[]>(admissions),
    [imported, setImported] = useState<Point[] | null>(null),
    [threshold, setThreshold] = useState(60),
    [view, setView] = useState<"probability" | "logodds" | "both">(
      "probability",
    ),
    [l2, setL2] = useState(1),
    [trained, setTrained] = useState(true),
    [dataLoaded, setDataLoaded] = useState(false),
    [status, setStatus] = useState("Last trained: just now"),
    [dark, setDark] = useState(true),
    [predX, setPredX] = useState(72);
  const fileRef = useRef<HTMLInputElement>(null),
    model = useMemo(() => train(rows, l2), [rows, l2]);
  const probabilityThreshold = model.proba(threshold),
    predictions = rows.map((v) =>
      model.proba(v.x) >= probabilityThreshold ? 1 : 0,
    ),
    metrics = binaryMetrics(
      rows.map((v) => v.y),
      predictions,
    ),
    probs = rows.map((v) => model.proba(v.x)),
    positive = rows.filter((v) => v.y).length / rows.length;
  const current =
    dataset === "imported"
      ? { name: "Imported CSV", feature: "Feature", source: "Local", rows }
      : datasets[dataset];
  const choose = (key: DatasetKey) => {
    if (key === "imported" && !imported) return;
    setDataset(key);
    setRows(key === "imported" ? imported! : datasets[key].rows);
    setTrained(false);
  };
  const reset = () => {
    setDataset("admissions");
    setRows(admissions);
    setThreshold(60);
    setView("probability");
    setL2(1);
    setPredX(72);
    setTrained(true);
    setStatus("Last trained: just now");
  };
  const retrain = () => {
    setTrained(false);
    setStatus("Optimizing cross-entropy…");
    setTimeout(() => {
      setTrained(true);
      setStatus(`Trained on ${rows.length} samples`);
    }, 400);
  };
  const cardMetrics = [
    ["Accuracy", metrics.accuracy],
    ["Precision (PPV)", metrics.precision],
    ["Recall (Sensitivity)", metrics.recall],
    ["F1 Score", metrics.f1],
  ] as const;
  return (
    <div className={`logistic-page ${dark ? "dark" : "light"}`}>
      <aside className="lesson-nav">
        <Link to="/" className="lr-brand">
          <i>◇</i>
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </Link>
        <small>⌄ LESSONS</small>
        <label>
          Supervised Learning <ChevronDown />
        </label>
        {nav.map((v, i) => (
          <button
            key={v}
            className={i === 1 ? "active" : ""}
            onClick={() => i === 1 && setTab("Visualize")}
          >
            <i className={i < 2 ? "cyan" : "yellow"}>✓</i>
            {v}
            {i === 1 && <em />}
          </button>
        ))}
        {[
          "Model Evaluation",
          "Unsupervised Learning",
          "Deep Learning",
          "MLOps",
        ].map((v) => (
          <label key={v}>
            {v}
            <ChevronDown />
          </label>
        ))}
        <div className="your-progress">
          <b>Your Progress</b>
          <span>24 / 36 lessons</span>
          <i />
        </div>
        <button className="notes">
          <BookOpen />
          Learning Notes
        </button>
        <footer>
          <Settings />
          <CircleHelp />
          <button aria-label="Toggle theme" onClick={() => setDark((v) => !v)}>
            {dark ? <Moon /> : <Sun />}
          </button>
        </footer>
      </aside>
      <main>
        <header className="lr-header">
          <div className="icon">⌁</div>
          <div>
            <h1>Logistic Regression</h1>
            <p>
              Objective: Learn how logistic regression models probability and
              makes classifications.
            </p>
          </div>
          <div className="lr-progress">
            <span>
              Lesson Progress <b>68%</b>
            </span>
            <i />
          </div>
          <button onClick={() => setStatus("Progress saved")}>
            <Play />
            Resume
          </button>
        </header>
        <nav className="lr-tabs">
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
        <section className="lr-workspace">
          <div className="lr-content">
            {tab === "Dataset" ? (
              <DataTable rows={rows} setRows={setRows} />
            ) : tab !== "Visualize" ? (
              <Generic
                tab={tab}
                loss={model.lossHistory}
                probability={model.proba(predX)}
              />
            ) : (
              <>
                <article className="probability-chart">
                  <header>
                    <b>
                      ⌁ 1D Feature Space: {current.feature} <Info />
                    </b>
                    <span>
                      <i className="pos" />
                      Positive (Admit) <i className="neg" /> Negative (Reject) ·
                      Drag to move points
                    </span>
                  </header>
                  <ProbabilityChart
                    rows={rows}
                    proba={model.proba}
                    threshold={threshold}
                    view={view}
                  />
                  <div className="logodds">
                    <b>
                      Log-Odds (Logit) Space <Info />
                    </b>
                    <div>
                      <span className="negative-zone">
                        Negative (z &lt; 0)<small>P &lt; 0.5</small>
                      </span>
                      <i />
                      <em>
                        z = 0<small>P = 0.5</small>
                      </em>
                      <i />
                      <span className="positive-zone">
                        Positive (z &gt; 0)<small>P &gt; 0.5</small>
                      </span>
                    </div>
                  </div>
                </article>
                <div className="metric-row">
                  <article>
                    <b>
                      Confusion Matrix (Threshold = {threshold}) <Info />
                    </b>
                    <table>
                      <thead>
                        <tr>
                          <th />
                          <th>Positive</th>
                          <th>Negative</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th>Positive</th>
                          <td>{metrics.tp}</td>
                          <td>{metrics.fn}</td>
                        </tr>
                        <tr>
                          <th>Negative</th>
                          <td>{metrics.fp}</td>
                          <td>{metrics.tn}</td>
                        </tr>
                      </tbody>
                    </table>
                  </article>
                  <article>
                    <b>
                      Key Metrics <Info />
                    </b>
                    {cardMetrics.map(([n, v], i) => (
                      <label key={n}>
                        {n}
                        <strong>{(v * 100).toFixed(1)}%</strong>
                        <i>
                          <em
                            style={{ width: `${v * 100}%` }}
                            className={`m${i}`}
                          />
                        </i>
                      </label>
                    ))}
                  </article>
                  <article>
                    <b>
                      Probability Overview <Info />
                    </b>
                    <dl>
                      <dt>Mean P(Admit) (Positive)</dt>
                      <dd>
                        {(
                          probs
                            .filter((_, i) => rows[i].y)
                            .reduce((a, b) => a + b, 0) /
                          (rows.filter((v) => v.y).length || 1)
                        ).toFixed(2)}
                      </dd>
                      <dt>Mean P(Admit) (Negative)</dt>
                      <dd>
                        {(
                          probs
                            .filter((_, i) => !rows[i].y)
                            .reduce((a, b) => a + b, 0) /
                          (rows.filter((v) => !v.y).length || 1)
                        ).toFixed(2)}
                      </dd>
                      <dt>Min / Max Probability</dt>
                      <dd>
                        {Math.min(...probs).toFixed(2)} /{" "}
                        {Math.max(...probs).toFixed(2)}
                      </dd>
                    </dl>
                    <div className="histogram">
                      {probs.slice(0, 22).map((p, i) => (
                        <i key={i} style={{ height: `${12 + p * 45}px` }} />
                      ))}
                    </div>
                  </article>
                  <article>
                    <b>
                      Odds Insight <Info />
                    </b>
                    <p>
                      Odds at Threshold{" "}
                      <strong>
                        {(
                          probabilityThreshold /
                          (1 - probabilityThreshold)
                        ).toFixed(2)}{" "}
                        : 1
                      </strong>
                    </p>
                    <p>
                      Live P({predX}){" "}
                      <strong>{(model.proba(predX) * 100).toFixed(1)}%</strong>
                    </p>
                    <label>
                      Exam score
                      <input
                        aria-label="Prediction exam score"
                        type="number"
                        value={predX}
                        onChange={(e) => setPredX(Number(e.target.value))}
                      />
                    </label>
                  </article>
                </div>
              </>
            )}
          </div>
          <aside className="lr-controls">
            <article>
              <header>
                <i>1</i>
                <b>Controls</b>
              </header>
              <label>
                Decision Threshold
                <input
                  className="control-value"
                  aria-label="Decision threshold value"
                  type="number"
                  min="0"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
                <input
                  aria-label="Decision threshold"
                  type="range"
                  min="0"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
                <small>Classify as Positive if P(Admit) ≥ threshold</small>
              </label>
              <hr />
              <b>View</b>
              <div className="view-buttons">
                {(["probability", "logodds", "both"] as const).map((v) => (
                  <button
                    key={v}
                    className={view === v ? "active" : ""}
                    onClick={() => setView(v)}
                  >
                    {v === "logodds"
                      ? "Log-Odds"
                      : v[0].toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </article>
            <article>
              <header>
                <i>2</i>
                <b>Dataset</b>
              </header>
              <select
                aria-label="Dataset"
                value={dataset}
                onChange={(e) => choose(e.target.value as DatasetKey)}
              >
                <option value="admissions">University Admissions</option>
                <option value="loans">Loan Approval</option>
                <option value="churn">Customer Churn</option>
                <option value="synthetic">Synthetic Binary</option>
                {imported && <option value="imported">Imported CSV</option>}
              </select>
              <small>N = {rows.length} samples • 1 feature</small>
              <div className="dataset-workflow">
                <Link to="/ml/lab/dataset-manager">Go to datasets page</Link>
                <button
                  onClick={() => {
                    setDataLoaded(true);
                    setStatus(`${current.name} loaded and ready for training`);
                  }}
                >
                  Load
                </button>
              </div>
              <div>
                <button
                  onClick={() =>
                    choose(dataset === "admissions" ? "loans" : "admissions")
                  }
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
                      setStatus(`Imported ${p.length} rows`);
                    } catch (err) {
                      setStatus(
                        err instanceof Error ? err.message : "Import failed",
                      );
                    }
                  }}
                />
              </div>
              {dataLoaded && (
                <div className="dataset-next-steps">
                  <b>Next steps</b>
                  <Link to="/ml/supervised/logistic-regression">Visualize</Link>
                  <Link to="/ml/lab/algorithm-comparison">Dashboard</Link>
                  <Link to="/ml/preprocessing/missing-values">Statistics</Link>
                  <Link to="/ml/lab/dataset-manager">Data Grid</Link>
                </div>
              )}
              <dl>
                <dt>Feature</dt>
                <dd>{current.feature}</dd>
                <dt>Type</dt>
                <dd>Numeric</dd>
                <dt>Range</dt>
                <dd>
                  {Math.min(...rows.map((v) => v.x))} –{" "}
                  {Math.max(...rows.map((v) => v.x))}
                </dd>
                <dt>Positive Rate</dt>
                <dd>{(positive * 100).toFixed(0)}%</dd>
              </dl>
            </article>
            <article>
              <header>
                <i>3</i>
                <b>Model</b>
                <button className="model-reset" onClick={reset}>
                  Reset
                </button>
              </header>
              <label>
                Regularization (L2)
                <input
                  className="control-value"
                  aria-label="L2 regularization value"
                  type="number"
                  min="0.01"
                  max="10"
                  step="0.01"
                  value={l2}
                  onChange={(e) => {
                    setL2(Number(e.target.value));
                    setTrained(false);
                  }}
                />
                <input
                  aria-label="L2 regularization"
                  type="range"
                  min="0.01"
                  max="10"
                  step="0.01"
                  value={l2}
                  onChange={(e) => {
                    setL2(Number(e.target.value));
                    setTrained(false);
                  }}
                />
              </label>
              <button className="train" onClick={retrain}>
                <Play />
                Train Model
              </button>
              <div className="model-status">
                <b>
                  Model Status{" "}
                  <span>{trained ? "● Trained" : "○ Pending"}</span>
                </b>
                <small>{status}</small>
                {trained && <Check />}
              </div>
            </article>
          </aside>
        </section>
        <footer className="active-dataset">
          <b>
            Active Dataset: <span>{current.name}</span>
          </b>
          <i />
          Samples: {rows.length}
          <i />
          Features: 1<i />
          Positive Rate: {(positive * 100).toFixed(0)}%
          <button onClick={() => setTab("Dataset")}>
            <Calculator />
            View Dataset
          </button>
        </footer>
      </main>
    </div>
  );
}
