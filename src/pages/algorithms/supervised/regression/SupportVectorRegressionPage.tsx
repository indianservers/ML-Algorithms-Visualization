import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Check,
  ChevronUp,
  Code2,
  FileText,
  Info,
  Maximize2,
  Moon,
  Play,
  RefreshCw,
  RotateCcw,
  Sigma,
  Sun,
  Upload,
} from "lucide-react";
import { mae, mse, rSquared } from "../../../../lib/math/metrics";
import {
  trainSupportVectorRegression,
  type SvrKernel,
} from "../../../../lib/algorithms/regression/supportVectorRegression";
import "./SupportVectorRegressionPage.css";

type Row = { x: number; y: number; temp: number; humidity: number };
type DatasetKey = "bike" | "energy" | "housing" | "synthetic" | "imported";
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
const lessons = [
  "What is SVR?",
  "Intuition & ε-Tube",
  "Mathematical Formulation",
  "Kernels in SVR",
  "Training & Complexity",
  "Hyperparameters",
  "Metrics & Evaluation",
  "Pros, Cons & Best Practices",
];

const wave = (count: number, kind = 0): Row[] =>
  Array.from({ length: count }, (_, i) => {
    const x = (i % 60) / 5.7;
    const temp = 8 + ((i * 7) % 25);
    const humidity = 35 + ((i * 11) % 58);
    const y =
      kind === 1
        ? 45 + 20 * Math.cos(x * 0.52) + 0.7 * temp
        : kind === 2
          ? 18 + 5.1 * x + (i % 4) * 5
          : 29 +
            18 * Math.sin(x * 0.62) +
            0.8 * temp -
            0.14 * humidity +
            (((i * 17) % 19) - 9) * 1.7;
    return { x, y: Number(y.toFixed(2)), temp, humidity };
  });
const builtins = {
  bike: {
    name: "Bike Sharing Demand",
    source: "Kaggle",
    count: "17,379",
    rows: wave(180),
  },
  energy: {
    name: "Energy Demand",
    source: "OpenML",
    count: "168",
    rows: wave(168, 1),
  },
  housing: {
    name: "Housing Prices",
    source: "Sample",
    count: "15",
    rows: wave(15, 2),
  },
  synthetic: {
    name: "Synthetic Wave",
    source: "Generated",
    count: "240",
    rows: wave(240),
  },
};

function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 3)
    throw new Error("CSV requires a header and at least two rows.");
  const headers = lines[0].split(",");
  const target = Math.max(
    1,
    headers.findIndex((v) => /target|count|price|demand|y/i.test(v)),
  );
  return lines.slice(1).map((line) => {
    const values = line.split(",").map(Number);
    if (values.some((v) => !Number.isFinite(v)))
      throw new Error("CSV values must be numeric.");
    return {
      x: values[0],
      y: values[target],
      temp: values[1] ?? 0,
      humidity: values[2] ?? 0,
    };
  });
}

function TubePlot({
  rows,
  predict,
  epsilon,
  support,
  margins,
}: {
  rows: Row[];
  predict: (x: number) => number;
  epsilon: number;
  support: Set<number>;
  margins: boolean;
}) {
  const W = 760,
    H = 315,
    l = 58,
    r = 46,
    t = 18,
    b = 42;
  const xmin = Math.min(...rows.map((v) => v.x)),
    xmax = Math.max(...rows.map((v) => v.x));
  const curve = Array.from({ length: 85 }, (_, i) => ({
    x: xmin + (i / 84) * (xmax - xmin),
    y: predict(xmin + (i / 84) * (xmax - xmin)),
  }));
  const ys = [
      ...rows.map((v) => v.y),
      ...curve.flatMap((v) => [v.y - epsilon, v.y + epsilon]),
    ],
    ymin = Math.min(...ys) - 4,
    ymax = Math.max(...ys) + 4;
  const sx = (x: number) => l + ((x - xmin) / (xmax - xmin || 1)) * (W - l - r),
    sy = (y: number) => H - b - ((y - ymin) / (ymax - ymin || 1)) * (H - t - b);
  const path = (off = 0) =>
    curve
      .map(
        (v, i) =>
          `${i ? "L" : "M"}${sx(v.x).toFixed(1)},${sy(v.y + off).toFixed(1)}`,
      )
      .join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-label="Epsilon insensitive SVR visualization"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={l}
          x2={W - r}
          y1={t + (i * (H - t - b)) / 4}
          y2={t + (i * (H - t - b)) / 4}
          className="grid"
        />
      ))}
      <line x1={l} x2={l} y1={t} y2={H - b} className="axis" />
      <line x1={l} x2={W - r} y1={H - b} y2={H - b} className="axis" />
      {margins && (
        <>
          <path d={path(epsilon)} className="margin" />
          <path d={path(-epsilon)} className="margin" />
        </>
      )}
      <path d={path()} className="prediction" />
      {rows.slice(0, 120).map((v, i) => {
        const pred = predict(v.x),
          outside = Math.abs(v.y - pred) > epsilon;
        return (
          <g key={i}>
            {outside && (
              <line
                x1={sx(v.x)}
                x2={sx(v.x)}
                y1={sy(pred + Math.sign(v.y - pred) * epsilon)}
                y2={sy(v.y)}
                className="loss"
              />
            )}
            <circle
              cx={sx(v.x)}
              cy={sy(v.y)}
              r={support.has(i) ? 5 : 3.4}
              className={
                support.has(i) ? "support" : outside ? "outside" : "inside"
              }
            />
          </g>
        );
      })}
      <text x={W / 2} y={H - 8}>
        Feature (x)
      </text>
      <text transform={`translate(14 ${H / 2}) rotate(-90)`}>Target (y)</text>
    </svg>
  );
}

function DataPanel({
  rows,
  setRows,
}: {
  rows: Row[];
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;
}) {
  return (
    <article className="svr-data">
      <header>
        <h2>Editable Training Data</h2>
        <span aria-label="Active row count">{rows.length} rows</span>
        <button
          onClick={() =>
            setRows((v) => [...v, { x: 5, y: 50, temp: 20, humidity: 60 }])
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
            <th>x</th>
            <th>target</th>
            <th>temperature</th>
            <th>humidity</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 14).map((row, i) => (
            <tr key={i}>
              {(["x", "y", "temp", "humidity"] as const).map((k) => (
                <td key={k}>
                  <input
                    aria-label={`Row ${i + 1} ${k}`}
                    type="number"
                    value={row[k]}
                    onChange={(e) =>
                      setRows((all) =>
                        all.map((v, j) =>
                          j === i ? { ...v, [k]: Number(e.target.value) } : v,
                        ),
                      )
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

export default function SupportVectorRegressionPage() {
  const [tab, setTab] = useState<Tab>("Visualize"),
    [dataset, setDataset] = useState<DatasetKey>("bike"),
    [rows, setRows] = useState<Row[]>(builtins.bike.rows),
    [imported, setImported] = useState<Row[] | null>(null);
  const [kernel, setKernel] = useState<SvrKernel>("rbf"),
    [c, setC] = useState(10),
    [epsilon, setEpsilon] = useState(5),
    [gamma, setGamma] = useState(1),
    [margins, setMargins] = useState(true),
    [trained, setTrained] = useState(true),
    [message, setMessage] = useState("Ready to visualize and explore."),
    [dark, setDark] = useState(true),
    [collapsed, setCollapsed] = useState(false),
    [px, setPx] = useState(5);
  const fileRef = useRef<HTMLInputElement>(null),
    sample = rows.slice(0, 160);
  const model = useMemo(
    () =>
      trainSupportVectorRegression(
        sample.map((v) => [v.x, v.temp, v.humidity]),
        sample.map((v) => v.y),
        { kernel, c, epsilon, gamma, epochs: 180 },
      ),
    [sample, kernel, c, epsilon, gamma],
  );
  const predictions = sample.map((v) =>
      model.predict([v.x, v.temp, v.humidity]),
    ),
    support = new Set(model.supportIndices);
  const current =
    dataset === "imported"
      ? { name: "Imported CSV", source: "Local", count: String(rows.length) }
      : builtins[dataset];
  const choose = (key: DatasetKey) => {
    if (key === "imported" && !imported) return;
    setDataset(key);
    setRows(key === "imported" ? imported! : builtins[key].rows);
    setTrained(false);
  };
  const reset = () => {
    setDataset("bike");
    setRows(builtins.bike.rows);
    setKernel("rbf");
    setC(10);
    setEpsilon(5);
    setGamma(1);
    setMargins(true);
    setPx(5);
    setTrained(true);
    setMessage("Ready to visualize and explore.");
  };
  const train = () => {
    setTrained(false);
    setMessage("Optimizing ε-insensitive objective…");
    setTimeout(() => {
      setTrained(true);
      setMessage(
        `Trained ${kernel.toUpperCase()} SVR on ${sample.length} rows.`,
      );
    }, 450);
  };
  const generic = (
    <article className="svr-generic">
      <h2>{tab}</h2>
      <p>
        {tab === "Train"
          ? "Retrain the kernel model using the live settings."
          : tab === "Metrics"
            ? `MAE ${mae(
                sample.map((v) => v.y),
                predictions,
              ).toFixed(3)} · MSE ${mse(
                sample.map((v) => v.y),
                predictions,
              ).toFixed(3)} · R² ${rSquared(
                sample.map((v) => v.y),
                predictions,
              ).toFixed(3)}`
            : tab === "Compare"
              ? "Compare Linear, Polynomial, and RBF kernels on the active data."
              : tab === "Explain"
                ? "Support vectors lie on or beyond the ε-insensitive tube and define the fitted function."
                : "SVR minimizes model complexity and deviations outside an ε-wide tube."}
      </p>
    </article>
  );
  return (
    <div className={`svr-page ${dark ? "dark" : "light"}`}>
      <header className="svr-header">
        <Link to="/" className="brand">
          <i>◒</i>
          <b>
            Mega ML<small>AI OBSERVATORY</small>
          </b>
        </Link>
        <div className="progress">
          <small>LESSON PROGRESS</small>
          <span>
            <i />
            <b>42%</b>
          </span>
        </div>
        <em>Lesson 12 / 28</em>
        <div className="actions">
          <button>
            <BookOpen size={18} />
            Docs
          </button>
          <button aria-label="Toggle theme" onClick={() => setDark((v) => !v)}>
            {dark ? <Sun /> : <Moon />}
          </button>
          <b>ML</b>
        </div>
      </header>
      <button
        aria-label="Collapse sidebar"
        className={`svr-rail-toggle ${collapsed ? "collapsed" : ""}`}
        onClick={() => setCollapsed((v) => !v)}
      >
        <ChevronUp />
      </button>
      <aside className={`svr-sidebar ${collapsed ? "collapsed" : ""}`}>
        {!collapsed && (
          <>
            <h3>LESSON OUTLINE</h3>
            {lessons.map((v, i) => (
              <button
                key={v}
                className={i === 1 ? "active" : ""}
                onClick={() =>
                  setTab(i === 0 ? "Learn" : i === 1 ? "Visualize" : "Explain")
                }
              >
                <i>{i + 1}</i>
                <span>{v}</span>
                {i === 0 && <Check />}
              </button>
            ))}
            <hr />
            <h3>QUICK ACTIONS</h3>
            <button onClick={() => setTab("Learn")}>
              <Sigma />
              <span>View Formula Sheet</span>
            </button>
            <button onClick={() => setTab("Explain")}>
              <FileText />
              <span>Algorithm Cheat Sheet</span>
            </button>
            <button onClick={() => setTab("Train")}>
              <Code2 />
              <span>Code Examples</span>
            </button>
            <button onClick={reset}>
              <RotateCcw />
              <span>Reset Visuals</span>
            </button>
          </>
        )}
      </aside>
      <main className={`svr-main ${collapsed ? "wide" : ""}`}>
        <section className="title">
          <div>
            <h1>
              Support Vector Regression <b>SVR</b>
            </h1>
            <p>
              Fit a function that deviates from actual targets by no more than
              ε, while staying as flat as possible.
            </p>
            <strong>
              ⚙ OBJECTIVE{" "}
              <span>
                Understand ε-insensitive loss, support vectors, and margin in
                regression.
              </span>
            </strong>
          </div>
          <div className="dataset-top">
            <label>DATASET</label>
            <span>
              <select
                aria-label="Dataset"
                value={dataset}
                onChange={(e) => choose(e.target.value as DatasetKey)}
              >
                <option value="bike">Bike Sharing Demand (Kaggle)</option>
                <option value="energy">Energy Demand (OpenML)</option>
                <option value="housing">Housing Prices (Sample)</option>
                <option value="synthetic">Synthetic Wave (Generated)</option>
                {imported && <option value="imported">Imported CSV</option>}
              </select>
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
                    setMessage(`Imported ${p.length} rows.`);
                  } catch (err) {
                    setMessage(
                      err instanceof Error ? err.message : "Import failed.",
                    );
                  }
                }}
              />
            </span>
          </div>
        </section>
        <nav className="svr-tabs">
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
        <section className="workspace">
          <div className="content">
            {tab === "Dataset" ? (
              <DataPanel rows={rows} setRows={setRows} />
            ) : tab !== "Visualize" ? (
              generic
            ) : (
              <>
                <article className="chart">
                  <header>
                    <b>
                      ε-INSENSITIVE TUBE <Info />
                    </b>
                    <button>
                      <Maximize2 />
                    </button>
                  </header>
                  <div className="legend">
                    <span>━ Prediction (f(x))</span>
                    <span>┄ ε-Tube (± ε)</span>
                    <span>◉ Support Vectors</span>
                    <span>● Inside Tube (Ignored)</span>
                    <span>● Outside Tube (Loss)</span>
                  </div>
                  <TubePlot
                    rows={sample}
                    predict={(x) => model.predict([x, 20, 60])}
                    epsilon={epsilon}
                    support={support}
                    margins={margins}
                  />
                  <footer>
                    💡 Support vectors are the points outside the ε-tube or on
                    its boundary. They define the model.
                  </footer>
                </article>
                <div className="diagnostics">
                  <article>
                    <b>
                      RESIDUALS (y − f(x)) <Info />
                    </b>
                    <div className="residuals">
                      {sample.slice(0, 45).map((v, i) => (
                        <i
                          key={i}
                          className={
                            Math.abs(v.y - predictions[i]) > epsilon
                              ? "out"
                              : ""
                          }
                          style={{
                            left: `${3 + i * 2.05}%`,
                            top: `${50 - Math.max(-38, Math.min(38, v.y - predictions[i]))}%`,
                          }}
                        />
                      ))}
                      <span />
                    </div>
                  </article>
                  <article>
                    <b>
                      MARGIN VIEW (ε) <Info />
                    </b>
                    <div className="margin-view">
                      <span>+ ε</span>
                      <i />
                      <strong>0</strong>
                      <i />
                      <span>− ε</span>
                    </div>
                  </article>
                  <article className="summary">
                    <div>
                      <b>
                        SUPPORT VECTORS <Info />
                      </b>
                      <strong>{model.supportIndices.length}</strong>
                      <small>OUTSIDE TUBE</small>
                      <em>
                        {model.supportIndices.length -
                          model.boundaryIndices.length}
                      </em>
                      <small>ON BOUNDARY</small>
                      <em>{model.boundaryIndices.length}</em>
                    </div>
                    <dl>
                      <b>MODEL SUMMARY</b>
                      <dt>Kernel</dt>
                      <dd>{kernel.toUpperCase()}</dd>
                      <dt>C</dt>
                      <dd>{c.toFixed(1)}</dd>
                      <dt>ε</dt>
                      <dd>{epsilon.toFixed(2)}</dd>
                      <dt>γ</dt>
                      <dd>{gamma.toFixed(2)}</dd>
                      <dt>Support Vectors</dt>
                      <dd>
                        {model.supportIndices.length} / {sample.length}
                      </dd>
                      <dt>Training MSE</dt>
                      <dd>
                        {mse(
                          sample.map((v) => v.y),
                          predictions,
                        ).toFixed(3)}
                      </dd>
                      <dt>R² Score</dt>
                      <dd>
                        {rSquared(
                          sample.map((v) => v.y),
                          predictions,
                        ).toFixed(3)}
                      </dd>
                    </dl>
                  </article>
                </div>
              </>
            )}
          </div>
          <aside className="controls">
            <header>
              <b>MODEL CONTROLS</b>
              <button onClick={reset}>
                <RefreshCw />
                Reset
              </button>
            </header>
            <label>
              Kernel <Info />
              <select
                aria-label="Kernel"
                value={kernel}
                onChange={(e) => {
                  setKernel(e.target.value as SvrKernel);
                  setTrained(false);
                }}
              >
                <option value="rbf">RBF</option>
                <option value="linear">Linear</option>
                <option value="polynomial">Polynomial</option>
              </select>
            </label>
            {[
              ["C (Regularization)", c, setC, 0.1, 30, 0.1],
              ["ε (Epsilon Tube)", epsilon, setEpsilon, 0.1, 15, 0.1],
              ["γ (Gamma)", gamma, setGamma, 0.05, 5, 0.05],
            ].map(([name, value, setter, min, max, step]) => (
              <label key={String(name)}>
                {name as string} <Info />
                <input
                  aria-label={`${name} value`}
                  type="number"
                  value={value as number}
                  step={step as number}
                  onChange={(e) =>
                    (setter as React.Dispatch<React.SetStateAction<number>>)(
                      Number(e.target.value),
                    )
                  }
                />
                <input
                  aria-label={name as string}
                  type="range"
                  min={min as number}
                  max={max as number}
                  step={step as number}
                  value={value as number}
                  onChange={(e) => {
                    (setter as React.Dispatch<React.SetStateAction<number>>)(
                      Number(e.target.value),
                    );
                    setTrained(false);
                  }}
                />
              </label>
            ))}
            <div className="toggle">
              <span>Show Margins (ε-Tube)</span>
              <input
                id="svr-show-margins"
                aria-label="Show margins"
                type="checkbox"
                checked={margins}
                onChange={(e) => setMargins(e.target.checked)}
              />
              <label htmlFor="svr-show-margins">
                <i />
              </label>
            </div>
            <div className="train-buttons">
              <button onClick={train}>
                <Play />
                Train Model
              </button>
              <button>⋮</button>
            </div>
            <div className={`trained ${trained ? "ready" : ""}`}>
              <Check />
              <span>
                <b>{trained ? "Model trained" : "Training pending"}</b>
                <small>{message}</small>
              </span>
            </div>
            <div className="inference">
              <b>LIVE INFERENCE</b>
              <label>
                Feature x
                <input
                  aria-label="Prediction feature x"
                  type="number"
                  value={px}
                  onChange={(e) => setPx(Number(e.target.value))}
                />
              </label>
              <strong>{model.predict([px, 20, 60]).toFixed(3)}</strong>
            </div>
          </aside>
        </section>
        <footer className="dataset-bar">
          <b>
            DATASET:{" "}
            <span>
              {current.name} ({current.source})
            </span>
          </b>
          <span>Samples: {current.count}</span>
          <span>Features: 16</span>
          <span>Target: Count</span>
          <button onClick={() => setTab("Dataset")}>View Dataset</button>
          <button
            onClick={() => choose(dataset === "bike" ? "energy" : "bike")}
          >
            Switch Dataset <RefreshCw />
          </button>
        </footer>
      </main>
    </div>
  );
}
