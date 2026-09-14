import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Upload } from "lucide-react";
import { rocCurve } from "../../../lib/math/metrics";
import "./ROCAUCApprovedPage.css";

const makeScores = (n: number, quality: number, seed: number) => {
  let s = seed >>> 0;
  const random = () => (s = (1664525 * s + 1013904223) >>> 0) / 4294967296,
    actual: number[] = [],
    scores: number[] = [];
  for (let i = 0; i < n; i++) {
    const label = i % 2;
    actual.push(label);
    const center = label ? 0.5 + quality * 0.22 : 0.5 - quality * 0.22;
    scores.push(
      Math.max(
        0,
        Math.min(1, center + (random() - 0.5) * (0.9 - quality * 0.35)),
      ),
    );
  }
  return { actual, scores };
};
const datasets = [
  { name: "Heart Disease – Cleveland", ...makeScores(268, 0.67, 11) },
  { name: "Loan Approval", ...makeScores(320, 0.74, 23) },
  { name: "Fraud Detection", ...makeScores(420, 0.82, 37) },
];
const metricsAt = (actual: number[], scores: number[], threshold: number) => {
  let tp = 0,
    tn = 0,
    fp = 0,
    fn = 0;
  actual.forEach((label, i) => {
    const pred = scores[i] >= threshold ? 1 : 0;
    if (label && pred) tp++;
    else if (!label && !pred) tn++;
    else if (!label && pred) fp++;
    else fn++;
  });
  const tpr = tp / Math.max(1, tp + fn),
    fpr = fp / Math.max(1, fp + tn),
    precision = tp / Math.max(1, tp + fp),
    accuracy = (tp + tn) / Math.max(1, actual.length);
  return { tp, tn, fp, fn, tpr, fpr, precision, accuracy };
};
const prCurve = (actual: number[], scores: number[]) =>
  Array.from({ length: 51 }, (_, i) => {
    const threshold = i / 50,
      m = metricsAt(actual, scores, threshold);
    return { recall: m.tpr, precision: m.precision };
  }).sort((a, b) => a.recall - b.recall);
const path = (points: { x: number; y: number }[]) =>
  points
    .map((p, i) => `${i ? "L" : "M"}${40 + p.x * 315},${260 - p.y * 230}`)
    .join(" ");
const densityPath = (actual: number[], scores: number[], label: number) => {
  const bins = Array(24).fill(0) as number[];
  scores.forEach((score, index) => { if (actual[index] === label) bins[Math.min(23, Math.floor(score * 24))]++; });
  const max = Math.max(...bins, 1);
  return bins.map((count, index) => `${index ? "L" : "M"}${index * (400 / 23)},${220 - count / max * 150}`).join(" ");
};

export default function ROCAUCApprovedPage() {
  const [datasetIndex, setDatasetIndex] = useState(0),
    [custom, setCustom] = useState<{
      name: string;
      actual: number[];
      scores: number[];
    } | null>(null),
    [threshold, setThreshold] = useState(0.41),
    [curveMode, setCurveMode] = useState<"roc" | "pr">("roc"),
    [model, setModel] = useState("Logistic Regression"),
    [tab, setTab] = useState("Visualize"),
    [message, setMessage] = useState("Trained");
  const fileRef = useRef<HTMLInputElement>(null),
    dataset = custom ?? datasets[datasetIndex];
  const roc = rocCurve(dataset.actual, dataset.scores),
    pr = prCurve(dataset.actual, dataset.scores),
    metrics = metricsAt(dataset.actual, dataset.scores, threshold),
    best = roc.thresholds.reduce(
      (winner, t, i) =>
        roc.tpr[i] - roc.fpr[i] > winner.j
          ? { threshold: t, j: roc.tpr[i] - roc.fpr[i] }
          : winner,
      { threshold: 0.5, j: -Infinity },
    );
  const chartPath =
    curveMode === "roc"
      ? path(roc.fpr.map((x, i) => ({ x, y: roc.tpr[i] })))
      : path(pr.map((p) => ({ x: p.recall, y: p.precision })));
  const upload = async (file?: File) => {
    if (!file) return;
    const rows = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter((row) => row.length >= 2 && row.every(Number.isFinite));
    if (rows.length) {
      setCustom({
        name: file.name,
        actual: rows.map((r) => r[0]),
        scores: rows.map((r) => r[1]),
      });
      setMessage(`${file.name} · ${rows.length} scores`);
    }
  };
  return (
    <div className="roc-page">
      <aside className="roc-side">
        <Link to="/">
          ◒ <b>Mega ML</b>
          <small>AI OBSERVATORY</small>
        </Link>
        <button className="new">⌁ New Lesson</button>
        {[
          "⌂ Home",
          "♧ Learn",
          "▤ Datasets",
          "⌘ Models",
          "♙ Experiments",
          "◇ Playground",
          "♧ Deployments",
          "▣ Reports",
          "⚙ Settings",
        ].map((x) => (
          <button onClick={() => setMessage(`${x} opened`)} key={x}>
            {x}
          </button>
        ))}
        <section>
          <b>Progress</b>
          <p>ROC & AUC · 3 / 4</p>
          <progress max="100" value="75" /> 75%
          <small>
            ✓ Introduction
            <br />● Visualize
            <br />✓ Interpretation
            <br />○ Challenge
          </small>
        </section>
        <button className="help">? Help & Docs</button>
      </aside>
      <header className="roc-head">
        <h1>
          ROC & AUC <span>Interactive Lesson</span>
        </h1>
        <p>
          Explore the Receiver Operating Characteristic curve, threshold
          effects, and AUC.
        </p>
        <div>
          <label>
            Dataset
            <select
              aria-label="Dataset"
              value={custom ? "custom" : datasetIndex}
              onChange={(e) => {
                setCustom(null);
                setDatasetIndex(Number(e.target.value));
                setMessage("Dataset loaded");
              }}
            >
              {custom && <option value="custom">{custom.name}</option>}
              {datasets.map((x, i) => (
                <option value={i} key={x.name}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => fileRef.current?.click()}>
            <Upload /> Upload CSV
          </button>
          <input
            hidden
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={(e) => upload(e.target.files?.[0])}
          />
          <label>
            Model
            <select
              aria-label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option>Logistic Regression</option>
              <option>Random Forest</option>
              <option>Gradient Boosting</option>
            </select>
          </label>
          <b>{message} ✓</b>
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
        <section className="roc-summary panel">
          <article>
            <b>OBJECTIVE</b>
            <p>
              Understand how the decision threshold influences the trade-off
              between True Positive Rate and False Positive Rate, and how AUC
              summarizes overall model performance.
            </p>
          </article>
          {[
            ["AUC", roc.auc.toFixed(2), roc.auc > 0.8 ? "Good" : "Fair"],
            [
              "Youden's J",
              best.j.toFixed(2),
              `at threshold ${best.threshold.toFixed(2)}`,
            ],
            ["Best Threshold", best.threshold.toFixed(2), "Max J"],
            [
              "Accuracy @ 0.50",
              metricsAt(dataset.actual, dataset.scores, 0.5).accuracy.toFixed(
                2,
              ),
              "Good",
            ],
          ].map((x) => (
            <article key={x[0]}>
              <small>{x[0]}</small>
              <strong>{x[1]}</strong>
              <span>{x[2]}</span>
            </article>
          ))}
        </section>
        <section className="roc-work panel">
          <div className="curve">
            <h2>
              ROC Curve ⓘ{" "}
              <span>
                <button
                  className={curveMode === "roc" ? "active" : ""}
                  onClick={() => setCurveMode("roc")}
                >
                  ROC
                </button>
                <button
                  className={curveMode === "pr" ? "active" : ""}
                  onClick={() => setCurveMode("pr")}
                >
                  PR Curve
                </button>
              </span>
            </h2>
            <svg
              viewBox="0 0 400 310"
              role="img"
              aria-label={`${curveMode.toUpperCase()} curve`}
            >
              <line x1="40" y1="260" x2="355" y2="30" />
              <path d={chartPath} />
              <circle
                cx={40 + metrics.fpr * 315}
                cy={260 - metrics.tpr * 230}
                r="6"
              />
              <text x="190" y="210">
                AUC = {roc.auc.toFixed(2)}
              </text>
            </svg>
            <footer>
              {curveMode === "roc" ? "False Positive Rate (FPR)" : "Recall"}
            </footer>
          </div>
          <div className="scores">
            <h2>Score Distributions ⓘ</h2>
            <p>
              <span>● Positive (Disease)</span>
              <span>● Negative (No Disease)</span>
            </p>
            <svg viewBox="0 0 400 245">
              <path d={densityPath(dataset.actual, dataset.scores, 0)} />
              <path d={densityPath(dataset.actual, dataset.scores, 1)} />
              <line
                x1={threshold * 400}
                y1="20"
                x2={threshold * 400}
                y2="220"
              />
              <text x={Math.max(5, threshold * 400 - 32)} y="15">
                Threshold {threshold.toFixed(2)}
              </text>
            </svg>
            <div className="score-summary">
              <b>
                Negative
                <br />
                <small>N = {metrics.tn + metrics.fp}</small>
              </b>
              <b>
                TN
                <br />
                <small>{metrics.tn}</small>
              </b>
              <b>
                FP
                <br />
                <small>{metrics.fp}</small>
              </b>
              <b>
                TP
                <br />
                <small>{metrics.tp}</small>
              </b>
              <b>
                Positive
                <br />
                <small>N = {metrics.tp + metrics.fn}</small>
              </b>
            </div>
          </div>
        </section>
        <section className="walk panel">
          <h2>Threshold Walkthrough ⓘ</h2>
          <div>
            {[0.05, 0.25, best.threshold, 0.75, 0.95].map((t) => {
              const m = metricsAt(dataset.actual, dataset.scores, t);
              return (
                <button
                  className={Math.abs(t - threshold) < 0.02 ? "active" : ""}
                  onClick={() => setThreshold(t)}
                  key={t}
                >
                  <small>
                    {Math.abs(t - best.threshold) < 0.001
                      ? "Current"
                      : `Threshold ${t.toFixed(2)}`}
                  </small>
                  <b>
                    {t < 0.2
                      ? "High Recall"
                      : t > 0.9
                        ? "Very High Precision"
                        : Math.abs(t - best.threshold) < 0.001
                          ? "Best Youden's J"
                          : "Balanced"}
                  </b>
                  <span>
                    TPR <strong>{m.tpr.toFixed(2)}</strong> · FPR{" "}
                    <em>{m.fpr.toFixed(2)}</em>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        <section className="roc-info panel">
          {[
            [
              "AUC Interpretation",
              `${roc.auc.toFixed(2)} suggests the model ranks positives above negatives without choosing a threshold.`,
            ],
            [
              "What AUC Means",
              "Probability a random positive ranks above a random negative, counting ties as one-half.",
            ],
            [
              "When to Use",
              "Imbalanced datasets and binary classification problems.",
            ],
            [
              "★ Takeaway",
              "Use ROC & AUC to compare models independent of threshold.",
            ],
          ].map((x) => (
            <article key={x[0]}>
              <b>{x[0]}</b>
              <p>{x[1]}</p>
            </article>
          ))}
        </section>
      </main>
      <aside className="roc-controls">
        <section className="panel threshold">
          <h2>Threshold ⓘ</h2>
          <b>{threshold.toFixed(2)}</b>
          <input
            aria-label="Threshold"
            type="range"
            min="0"
            max="1"
            step=".01"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
          <span>
            0.00 <b>1.00</b>
          </span>
        </section>
        <section className="panel roc-confusion">
          <h2>
            Confusion Matrix <small>(@ {threshold.toFixed(2)}) ⓘ</small>
          </h2>
          <table>
            <tbody>
              <tr>
                <td>
                  TN
                  <br />
                  <b>{metrics.tn}</b>
                </td>
                <td>
                  FP
                  <br />
                  <b>{metrics.fp}</b>
                </td>
              </tr>
              <tr>
                <td>
                  FN
                  <br />
                  <b>{metrics.fn}</b>
                </td>
                <td>
                  TP
                  <br />
                  <b>{metrics.tp}</b>
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            TPR (Recall) <b>{metrics.tpr.toFixed(2)}</b> · FPR{" "}
            <b>{metrics.fpr.toFixed(2)}</b>
          </p>
          <p>
            Precision <b>{metrics.precision.toFixed(2)}</b> · Accuracy{" "}
            <b>{metrics.accuracy.toFixed(2)}</b>
          </p>
          <button onClick={() => setThreshold(best.threshold)}>
            ↻ Reset Threshold
          </button>
          <a href="?advanced=1">Open Advanced ROC Lab →</a>
        </section>
      </aside>
      <footer className="roc-footer">
        Interactive lesson · Move the threshold slider to see how the point
        moves along the ROC curve.
      </footer>
    </div>
  );
}
