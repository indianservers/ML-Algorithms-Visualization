import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useLabNavigate } from "../../../lib/labNavigation";
import { Download, Maximize2, Upload } from "lucide-react";
import { evaluateMulticlass } from "../../../lib/evaluation/multiclassMetrics";
import "./ConfusionMatrixApprovedPage.css";

type Dataset = { name: string; labels: string[]; matrix: number[][] };
const datasets: Dataset[] = [
  {
    name: "Skin Lesion Classification (HAM10000)",
    labels: [
      "Melanoma",
      "Melanocytic Nevus",
      "Basal Cell Carcinoma",
      "Benign Keratosis",
      "Dermatofibroma",
    ],
    matrix: [
      [186, 36, 12, 16, 3],
      [28, 1234, 21, 48, 6],
      [9, 18, 298, 33, 3],
      [14, 41, 17, 354, 8],
      [2, 5, 1, 8, 184],
    ],
  },
  {
    name: "Iris Species",
    labels: ["Setosa", "Versicolor", "Virginica"],
    matrix: [
      [49, 1, 0],
      [0, 46, 4],
      [0, 3, 47],
    ],
  },
  {
    name: "News Topics",
    labels: ["World", "Sports", "Business", "Science"],
    matrix: [
      [210, 8, 14, 5],
      [6, 226, 4, 3],
      [18, 2, 198, 16],
      [4, 5, 12, 218],
    ],
  },
];
const colors = ["#ef4751", "#397df3", "#24b8b0", "#efa600", "#9554df"];
const expand = (dataset: Dataset) => {
  const actual: number[] = [],
    predicted: number[] = [];
  dataset.matrix.forEach((row, r) =>
    row.forEach((count, c) => {
      for (let i = 0; i < count; i++) {
        actual.push(r);
        predicted.push(c);
      }
    }),
  );
  return { actual, predicted };
};
const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

export default function ConfusionMatrixApprovedPage() {
  const [datasetIndex, setDatasetIndex] = useState(0),
    [imported, setImported] = useState<Dataset | null>(null),
    [trueFilter, setTrueFilter] = useState(-1),
    [predFilter, setPredFilter] = useState(-1),
    [view, setView] = useState<"counts" | "percent">("counts"),
    [normalize, setNormalize] = useState(false),
    [tab, setTab] = useState("Visualize"),
    [focus, setFocus] = useState(-1),
    [samplePage, setSamplePage] = useState(0),
    [message, setMessage] = useState("Interactive"),
    [editMode, setEditMode] = useState(false);
  const go = useLabNavigate();
  const fileRef = useRef<HTMLInputElement>(null),
    dataset = imported ?? datasets[datasetIndex],
    expanded = expand(dataset),
    result = evaluateMulticlass(
      expanded.actual,
      expanded.predicted,
      dataset.labels,
    );
  const visibleRows = result.matrix.map((row, r) =>
    row.map((value, c) =>
      (trueFilter < 0 || trueFilter === r) &&
      (predFilter < 0 || predFilter === c)
        ? value
        : 0,
    ),
  );
  const upload = async (file?: File) => {
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/),
      headers = lines[0].toLowerCase().split(","),
      aIndex = headers.findIndex(
        (x) => x.includes("actual") || x.includes("true"),
      ),
      pIndex = headers.findIndex((x) => x.includes("pred"));
    if (aIndex < 0 || pIndex < 0)
      return setMessage("CSV needs actual and predicted columns");
    const pairs = lines
        .slice(1)
        .map((line) => line.split(","))
        .filter((row) => row[aIndex] && row[pIndex]),
      labels = [...new Set(pairs.flatMap((row) => [row[aIndex], row[pIndex]]))],
      matrix = Array.from(
        { length: labels.length },
        () => Array(labels.length).fill(0) as number[],
      );
    pairs.forEach(
      (row) =>
        matrix[labels.indexOf(row[aIndex])][labels.indexOf(row[pIndex])]++,
    );
    setImported({ name: file.name, labels, matrix });
    setMessage(`${file.name} · ${pairs.length} predictions`);
  };
  return (
    <div className="cm-page">
      <aside className="cm-side">
        <Link to="/">
          Ⓜ <b>Mega ML</b>
          <small>AI Observatory</small>
        </Link>
        <button className="active">⌂ Home</button>
        <h4>LEARN</h4>
        {["◇ Courses", "▣ Playgrounds", "▤ Models"].map((x) => (
          <button onClick={() => go(x)} key={x}>
            {x}
          </button>
        ))}
        <h4>TOOLS</h4>
        {[
          "▣ Data Lab",
          "♧ Train",
          "✓ Evaluate",
          "➤ Deploy",
          "⌘ More Tools",
        ].map((x) => (
          <button
            className={x.includes("Evaluate") ? "active" : ""}
            onClick={() => go(x)}
            key={x}
          >
            {x}
          </button>
        ))}
        <h4>RESOURCES</h4>
        {["▤ Docs", "◇ Guides", "▱ API"].map((x) => (
          <button onClick={() => go(x)} key={x}>
            {x}
          </button>
        ))}
        <section>
          <small>Learning Progress</small>
          <p>Confusion Matrix</p>
          <progress value="65" max="100" /> 65%<button>Continue Lesson</button>
        </section>
        <button className="settings">⚙ Settings ↤</button>
      </aside>
      <header className="cm-head">
        <h1>
          Confusion Matrix <span>{message}</span>
        </h1>
        <p>
          Understand classification performance by exploring true vs. predicted
          outcomes.
        </p>
        <div>
          <select
            aria-label="Dataset"
            value={imported ? "imported" : datasetIndex}
            onChange={(e) => {
              setImported(null);
              setDatasetIndex(Number(e.target.value));
              setMessage("Dataset loaded");
            }}
          >
            {imported && <option value="imported">{imported.name}</option>}
            {datasets.map((x, i) => (
              <option value={i} key={x.name}>
                {x.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setDatasetIndex((datasetIndex + 1) % datasets.length);
              setImported(null);
              setMessage("Dataset switched");
            }}
          >
            ♧ Switch Dataset
          </button>
          <button onClick={() => fileRef.current?.click()}>
            <Upload /> Upload Dataset
          </button>
          <input
            ref={fileRef}
            hidden
            type="file"
            accept=".csv,.json"
            onChange={(e) => upload(e.target.files?.[0])}
          />
          <button onClick={() => setMessage("Theme toggled")}>☼</button>
          <button onClick={() => setMessage("Notifications opened")}>♧</button>
          <b>MM</b>
        </div>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Transform",
            "Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((x) => (
            <button
              className={tab === x ? "active" : ""}
              onClick={() => {
                setTab(x);
                setMessage(`${x} selected`);
              }}
              key={x}
            >
              {x}
            </button>
          ))}
        </nav>
      </header>
      <main>
        <section className="cm-matrix panel">
          <h2>Confusion Matrix ⓘ</h2>
          <div className="matrix-tools">
            View{" "}
            <button
              className={view === "counts" ? "active" : ""}
              onClick={() => setView("counts")}
            >
              Counts
            </button>
            <button
              className={view === "percent" ? "active" : ""}
              onClick={() => setView("percent")}
            >
              % of True
            </button>
            <button onClick={() => setMessage("Matrix downloaded")}>
              <Download />
            </button>
            <button onClick={() => setMessage("Fullscreen toggled")}>
              <Maximize2 />
            </button>
          </div>
          <div className="matrix-wrap">
            <b className="predicted">PREDICTED</b>
            <b className="truth">TRUE</b>
            <div
              className="column-labels"
              style={{
                gridTemplateColumns: `repeat(${dataset.labels.length},1fr)`,
              }}
            >
              {dataset.labels.map((label, i) => (
                <span style={{ color: colors[i] }} key={label}>
                  {label}
                </span>
              ))}
            </div>
            <div className="row-labels">
              {dataset.labels.map((label, i) => (
                <span style={{ color: colors[i] }} key={label}>
                  ● {label}
                </span>
              ))}
            </div>
            <div
              className="matrix-grid"
              style={{
                gridTemplateColumns: `repeat(${dataset.labels.length},1fr)`,
              }}
            >
              {visibleRows.flatMap((row, r) =>
                row.map((value, c) => {
                  const rowTotal = result.matrix[r].reduce((a, b) => a + b, 0),
                    share = value / Math.max(1, rowTotal),
                    display =
                      view === "percent" || normalize
                        ? pct(share)
                        : value.toLocaleString();
                  return (
                    <button
                      aria-label={`${dataset.labels[r]} predicted ${dataset.labels[c]}: ${value}`}
                      className={r === c ? "correct" : "error"}
                      style={
                        {
                          "--heat": String(0.08 + share * 0.8),
                        } as CSSProperties
                      }
                      onClick={() => {
                        setFocus(r * dataset.labels.length + c);
                        setSamplePage(0);
                      }}
                      key={`${r}-${c}`}
                    >
                      <b>{display}</b>
                      <small>{pct(share)}</small>
                    </button>
                  );
                }),
              )}
            </div>
            <div
              className="support"
              style={{
                gridTemplateColumns: `174px repeat(${dataset.labels.length},1fr)`,
              }}
            >
              Support (True)
              {result.classes.map((x) => (
                <b key={x.label}>{x.support.toLocaleString()}</b>
              ))}
            </div>
          </div>
          <footer>
            Total Samples: {result.total.toLocaleString()} · Accuracy:{" "}
            <b>{pct(result.accuracy)}</b> · Balanced Accuracy:{" "}
            {pct(result.balancedAccuracy)}
          </footer>
        </section>
        <section className="cm-gallery panel">
          <h2>
            Sample Gallery <small>(View linked samples)</small>
            <button>View All Samples</button>
          </h2>
          <div>
            <button onClick={() => setSamplePage(Math.max(0, samplePage - 1))}>
              ‹
            </button>
            {dataset.labels
              .slice(samplePage, samplePage + 5)
              .map((label, i) => (
                <article style={{ borderColor: colors[i] }} key={label}>
                  <figure
                    style={{
                      background: `radial-gradient(circle at ${35 + i * 9}% ${45 - i * 3}%,#6b3828 0 14%,#c28b78 15% 30%,#e4b3aa 31% 60%,#9c6b62)`,
                    }}
                  />
                  <b style={{ color: colors[i] }}>{label}</b>
                  <p>
                    True: {label}
                    <br />
                    Pred:{" "}
                    {focus >= 0
                      ? dataset.labels[focus % dataset.labels.length]
                      : label}
                  </p>
                </article>
              ))}
            <button
              onClick={() =>
                setSamplePage(
                  Math.min(
                    Math.max(0, dataset.labels.length - 1),
                    samplePage + 1,
                  ),
                )
              }
            >
              ›
            </button>
          </div>
        </section>
      </main>
      <aside className="cm-right">
        <section className="filters panel">
          <h2>
            Filters{" "}
            <button
              onClick={() => {
                setTrueFilter(-1);
                setPredFilter(-1);
                setNormalize(false);
                setView("counts");
              }}
            >
              Reset
            </button>
          </h2>
          <div>
            <label>
              True Label
              <select
                aria-label="True Label"
                value={trueFilter}
                onChange={(e) => setTrueFilter(Number(e.target.value))}
              >
                <option value="-1">All Classes</option>
                {dataset.labels.map((x, i) => (
                  <option value={i} key={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Predicted Label
              <select
                aria-label="Predicted Label"
                value={predFilter}
                onChange={(e) => setPredFilter(Number(e.target.value))}
              >
                <option value="-1">All Classes</option>
                {dataset.labels.map((x, i) => (
                  <option value={i} key={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Show Values As
              <select
                aria-label="Show Values As"
                value={view}
                onChange={(e) =>
                  setView(e.target.value as "counts" | "percent")
                }
              >
                <option value="counts">Counts</option>
                <option value="percent">% of True</option>
              </select>
            </label>
          </div>
          <label>
            Normalize
            <input
              aria-label="Normalize"
              type="checkbox"
              checked={normalize}
              onChange={(e) => setNormalize(e.target.checked)}
            />
          </label>
        </section>
        <section className="live panel">
          <h2>
            Live Metrics <small>(All Classes)</small>
          </h2>
          <div className="metric-cards">
            {[
              ["Accuracy", result.accuracy],
              ["Precision (Macro)", result.macroPrecision],
              ["Recall (Macro)", result.macroRecall],
              ["F1 Score (Macro)", result.macroF1],
              ["Specificity (Macro)", result.macroSpecificity],
            ].map(([label, value]) => (
              <article key={String(label)}>
                <small>{label}</small>
                <b>{pct(Number(value))}</b>
                <i>⌁⌁⌁</i>
              </article>
            ))}
            <article>
              <small>Class Focus</small>
              <select
                value={
                  focus < 0 ? -1 : Math.floor(focus / dataset.labels.length)
                }
                onChange={(e) =>
                  setFocus(Number(e.target.value) * dataset.labels.length)
                }
              >
                <option value="-1">All Classes</option>
                {dataset.labels.map((x, i) => (
                  <option value={i} key={x}>
                    {x}
                  </option>
                ))}
              </select>
            </article>
          </div>
          <table>
            <thead>
              <tr>
                <th />
                <th>Precision</th>
                <th>Recall</th>
                <th>Specificity</th>
                <th>F1 Score</th>
              </tr>
            </thead>
            <tbody>
              {result.classes.map((x, i) => (
                <tr key={x.label}>
                  <td style={{ color: colors[i] }}>● {x.label}</td>
                  <td>{x.precision.toFixed(2)}</td>
                  <td>{x.recall.toFixed(2)}</td>
                  <td>{x.specificity.toFixed(2)}</td>
                  <td>{x.f1.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <a href="?advanced=1" onClick={() => setEditMode(!editMode)}>
            Open Advanced Matrix Editor →
          </a>
          {editMode && (
            <p>
              Opening preserves manual TP/TN/FP/FN, loan threshold, formulas,
              and copy tools.
            </p>
          )}
        </section>
        <section className="insight panel">
          <h2>Key Insights</h2>
          <p>
            ⚠ Most confusion occurs between visually similar classes. Review the
            largest off-diagonal cell.
          </p>
          <p>
            ✓{" "}
            {[...result.classes].sort((a, b) => b.recall - a.recall)[0]?.label}{" "}
            has the strongest recall.
          </p>
          <p>ⓘ Consider more samples for the lowest-support class.</p>
        </section>
      </aside>
    </div>
  );
}
