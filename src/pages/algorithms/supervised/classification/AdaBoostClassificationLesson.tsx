import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  GitBranch,
  Lightbulb,
  MoreVertical,
  Play,
  RefreshCw,
  Sparkles,
  SwitchCamera,
  Upload,
} from "lucide-react";
import {
  datasetAPerfectBinary,
  datasetCXor,
  datasetDTwoMoons,
  datasetINoisy,
} from "../../../../lib/classification/classificationDatasets";
import { binaryMetrics } from "../../../../lib/math/metrics";
import { trainAdaBoostClassification } from "../../../../lib/algorithms/classification/adaBoostClassification";
import { LabProgressMeter } from "../../../../components/common/LabChrome";
import { LabLessonPanel, useUrlTab } from "../../../../components/common/LabTabs";
import { exportWorkspaceReport } from "../../../../lib/labWorkspace";
import "./AdaBoostClassificationPage.css";

type Point = { x: number; y: number; label: number };
type Dataset = "spiral" | "moons" | "blobs" | "outliers" | "imported";
type Tab =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
const TABS: [Tab, string][] = [
  ["learn", "Learn"],
  ["visualize", "Visualize"],
  ["dataset", "Dataset"],
  ["train", "Train"],
  ["metrics", "Metrics"],
  ["compare", "Compare"],
  ["explain", "Explain"],
];
const LABELS: Record<Dataset, string> = {
  spiral: "XOR regions",
  moons: "Two Moons",
  blobs: "Gaussian Blobs",
  outliers: "Noisy Outliers",
  imported: "Imported Dataset",
};
const rand = (i: number, k = 1) => Math.sin(i * 77.13 * k) * 0.5 + 0.5;
function makeData(kind: Exclude<Dataset, "imported">): Point[] {
  if (kind === "moons") return datasetDTwoMoons(90, 9);
  if (kind === "blobs") return datasetAPerfectBinary();
  if (kind === "outliers") return datasetINoisy();
  return datasetCXor();
}
const BUILT = {
  spiral: makeData("spiral"),
  moons: makeData("moons"),
  blobs: makeData("blobs"),
  outliers: makeData("outliers"),
};

function AdaPlot({
  points,
  predict,
  weights,
  boundary = true,
  highlight = true,
  compact = false,
}: {
  points: Point[];
  predict: (p: Point) => number;
  weights: number[];
  boundary?: boolean;
  highlight?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`ada-plot ${compact ? "compact" : ""}`}>
      {boundary &&
        Array.from({ length: 16 * 16 }, (_, i) => {
          const x = -2.4 + ((i % 16) + 0.5) * (4.8 / 16),
            y = -1.8 + (Math.floor(i / 16) + 0.5) * (3.6 / 16),
            label = predict({ x, y, label: 0 });
          return (
            <em
              key={`g${i}`}
              className={label ? "one" : "zero"}
              style={{
                left: `${((x + 2.4) / 4.8) * 100}%`,
                top: `${((1.8 - y) / 3.6) * 100}%`,
                width: compact ? 8 : 12,
                height: compact ? 8 : 12,
                opacity: 0.18,
                borderRadius: 0,
              }}
            />
          );
        })}
      {points
        .filter((_, i) => i % (compact ? 8 : 3) === 0)
        .map((p, j) => {
          const i = j * (compact ? 8 : 3),
            wrong = predict(p) !== p.label,
            size = compact ? 4 : 5 + Math.min(12, (weights[i] ?? 0) * 800);
          return (
            <i
              key={i}
              className={`${p.label ? "one" : "zero"} ${wrong && highlight ? "wrong" : ""}`}
              style={{
                left: `${((p.x + 2.4) / 4.8) * 100}%`,
                top: `${((1.8 - p.y) / 3.6) * 100}%`,
                width: size,
                height: size,
              }}
            />
          );
        })}
      {false && <span />}
    </div>
  );
}

export default function AdaBoostClassificationLesson() {
  const [tab, setTab] = useUrlTab<Tab>("visualize");
  const [dataset, setDataset] = useState<Dataset>("spiral"),
    [points, setPoints] = useState<Point[]>(BUILT.spiral),
    [imported, setImported] = useState<Point[]>([]);
  const [rounds, setRounds] = useState(6),
    [round, setRound] = useState(3),
    [rate, setRate] = useState(1),
    [early, setEarly] = useState(false),
    [pointSize, setPointSize] = useState("weight"),
    [highlight, setHighlight] = useState(true),
    [boundary, setBoundary] = useState(true),
    [axis, setAxis] = useState("auto");
  const [query, setQuery] = useState({ x: -0.73, y: 0.21 }),
    [trained, setTrained] = useState("Ready"),
    [toast, setToast] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const X = useMemo(() => points.map((p) => [p.x, p.y]), [points]),
    y = useMemo(() => points.map((p) => p.label), [points]);
  const model = useMemo(
    () =>
      trainAdaBoostClassification(X, y, {
        rounds,
        learningRate: rate,
        earlyStopping: early,
      }),
    [X, y, rounds, rate, early],
  );
  const current = Math.max(1, Math.min(round, model.rounds.length)),
    active = model.rounds[current - 1],
    predictions = X.map((row) => model.predictAtRound(row, current)),
    metrics = binaryMetrics(y, predictions);
  const choose = (next: Dataset) => {
    const source = next === "imported" ? imported : BUILT[next];
    if (!source.length) return;
    setDataset(next);
    setPoints(source.map((p) => ({ ...p })));
    setTrained("Ready");
  };
  const reset = () => {
    setDataset("spiral");
    setPoints(BUILT.spiral.map((p) => ({ ...p })));
    setRounds(6);
    setRound(3);
    setRate(1);
    setEarly(false);
    setPointSize("weight");
    setHighlight(true);
    setBoundary(true);
    setAxis("auto");
    setQuery({ x: -0.73, y: 0.21 });
    setTrained("Ready");
    setToast("");
  };
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter((v) => v.length >= 3 && v.every(Number.isFinite))
      .map((v) => ({ x: v[0], y: v[1], label: Math.round(v[2]) ? 1 : 0 }));
    if (rows.length < 4) {
      setToast("CSV needs x, y, and class");
      return;
    }
    setImported(rows);
    setDataset("imported");
    setPoints(rows);
    setToast(`Imported ${rows.length} samples`);
    e.target.value = "";
  };
  const predictAt = (count: number) => (p: Point) =>
    model.predictAtRound([p.x, p.y], count);
  const visualization = (
    <>
      <section className="ada-visual">
        <header>
          <span>
            Round {current} / {model.rounds.length}
          </span>
          <button
            aria-label="Previous round"
            onClick={() => setRound((v) => Math.max(1, v - 1))}
          >
            <ChevronLeft />
          </button>
          <button
            aria-label="Next round"
            onClick={() =>
              setRound((v) => Math.min(model.rounds.length, v + 1))
            }
          >
            <ChevronRight />
          </button>
          <h3>
            Weighted Data Distribution <small>(Point size ∝ weight)</small>
          </h3>
        </header>
        <div className="ada-main-viz">
          <aside>
            <article>
              <h4>Current Weak Learner</h4>
              <p>
                Decision Stump (Feature: x
                <sub>{active.stump.featureIndex + 1}</sub>)
              </p>
              <p>Threshold: {active.stump.threshold.toFixed(2)}</p>
              <i>
                <b
                  style={{
                    left: `${Math.max(0, Math.min(100, ((active.stump.threshold + 2.4) / 4.8) * 100))}%`,
                  }}
                />
              </i>
              <footer>
                <span>≤ {active.stump.threshold.toFixed(2)}</span>
                <span>&gt; {active.stump.threshold.toFixed(2)}</span>
              </footer>
            </article>
            <article>
              <h4>Weighted Error</h4>
              <strong>{active.weightedError.toFixed(2)}</strong>
              <i>
                <b style={{ width: `${active.weightedError * 100}%` }} />
              </i>
              <p>
                α<sub>{current}</sub> (vote weight){" "}
                <b>{active.alpha.toFixed(2)}</b>
              </p>
            </article>
          </aside>
          <div className="ada-scatter">
            <AdaPlot
              points={points}
              predict={predictAt(current)}
              weights={
                pointSize === "weight"
                  ? active.weightsBefore
                  : points.map(() => 0.005)
              }
              boundary={boundary}
              highlight={highlight}
            />
            <b>x₂</b>
            <em>x₁</em>
            <section>
              <p>
                <i />
                Class +1
              </p>
              <p>
                <i />
                Class -1
              </p>
              <p>
                <i />
                Misclassified
              </p>
              <p>
                <i />
                Higher Weight
              </p>
            </section>
          </div>
        </div>
        <table className="ada-weight-table">
          <caption>
            Round {current} weight update (misclassified samples usually gain
            relative weight)
          </caption>
          <thead>
            <tr>
              <th>#</th>
              <th>w before</th>
              <th>h(x)</th>
              <th>ok?</th>
              <th>w after</th>
            </tr>
          </thead>
          <tbody>
            {points.slice(0, 8).map((point, index) => {
              const pred = active.predictions[index];
              const ySigned = point.label ? 1 : -1;
              const ok = pred === ySigned;
              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{active.weightsBefore[index].toFixed(3)}</td>
                  <td>{pred}</td>
                  <td>{ok ? "yes" : "no"}</td>
                  <td>{active.weightsAfter[index].toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <footer>
          {model.rounds.map((item, i) => (
            <button
              className={i + 1 === current ? "active" : ""}
              key={i}
              onClick={() => setRound(i + 1)}
            >
              <i>{i + 1}</i>
              <span>
                α<sub>{i + 1}</sub> = {item.alpha.toFixed(2)}
                <small>err = {item.weightedError.toFixed(2)}</small>
              </span>
            </button>
          ))}
        </footer>
      </section>
      <section className="ada-sequence">
        <div>
          <h3>Weak-Learner Sequence</h3>
          <section>
            {model.rounds.map((item, i) => (
              <article
                className={i + 1 === current ? "active" : ""}
                key={i}
                onClick={() => setRound(i + 1)}
              >
                <b>Round {i + 1}</b>
                <span>α = {item.alpha.toFixed(2)}</span>
                <AdaPlot
                  compact
                  points={points}
                  predict={predictAt(i + 1)}
                  weights={item.weightsBefore}
                />
              </article>
            ))}
          </section>
          <footer>
            Focus: All points <span>Focus: Harder (misclassified) points</span>
          </footer>
        </div>
        <aside>
          <h3>Vote Contribution (α)</h3>
          {model.rounds.map((item, i) => (
            <p key={i}>
              Round {i + 1}
              <i>
                <b
                  style={{
                    width: `${Math.min(100, Math.abs(item.alpha) * 70)}%`,
                  }}
                />
              </i>
              <span>{item.alpha.toFixed(2)}</span>
            </p>
          ))}
          <small>Stronger votes have more influence.</small>
        </aside>
      </section>
      <section className="ada-bottom">
        <article>
          <h3>
            Model Performance <small>(on training data)</small>
          </h3>
          <p>
            In-sample accuracy <b>{(metrics.accuracy * 100).toFixed(2)}%</b>
          </p>
          <p>
            Weighted Error (Final Round){" "}
            <b>{model.rounds.at(-1)!.weightedError.toFixed(2)}</b>
          </p>
          <p>
            Margin (Avg){" "}
            <b>
              {(
                model.rounds.reduce((s, r) => s + Math.abs(r.alpha), 0) /
                model.rounds.length
              ).toFixed(2)}
            </b>
          </p>
        </article>
        <article>
          <h3>
            Prediction <small>(New Point)</small>
          </h3>
          <div>
            <label>
              x₁
              <input
                aria-label="Query x1"
                type="number"
                step=".1"
                value={query.x}
                onChange={(e) =>
                  setQuery((v) => ({ ...v, x: Number(e.target.value) }))
                }
              />
            </label>
            <label>
              x₂
              <input
                aria-label="Query x2"
                type="number"
                step=".1"
                value={query.y}
                onChange={(e) =>
                  setQuery((v) => ({ ...v, y: Number(e.target.value) }))
                }
              />
            </label>
            <b>→ Class {model.predict([query.x, query.y]) ? "+1" : "-1"}</b>
          </div>
          <p>
            Confidence{" "}
            <b>
              {Math.min(
                0.99,
                0.5 + Math.abs(model.score([query.x, query.y])) / 5,
              ).toFixed(2)}
            </b>
          </p>
        </article>
        <article className="ada-glance">
          <h3>Round story</h3>
          <p>
            Misclassified points gain weight. The next stump is trained on those
            weights. α is that stump’s vote in the final sign(Σ α h) ensemble.
          </p>
        </article>
      </section>
    </>
  );
  const content = () => {
    if (tab === "learn")
      return (
        <LabLessonPanel
          tab="Learn"
          route="/ml/supervised/adaboost-classification"
        />
      );
    if (tab === "visualize") return visualization;
    if (tab === "dataset")
      return (
        <section className="ada-generic ada-data">
          <h2>Live Dataset</h2>
          <p>
            Edit the samples that drive every stump, weight update, error, and
            vote.
          </p>
          <button
            onClick={() =>
              setPoints((old) => [
                ...old,
                { ...query, label: model.predict([query.x, query.y]) },
              ])
            }
          >
            Add query
          </button>
          <div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>x₁</th>
                  <th>x₂</th>
                  <th>Class</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {points.map((p, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <input
                        aria-label={`X row ${i + 1}`}
                        type="number"
                        step=".1"
                        value={Number(p.x.toFixed(3))}
                        onChange={(e) =>
                          setPoints((old) =>
                            old.map((v, j) =>
                              j === i ? { ...v, x: Number(e.target.value) } : v,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Y row ${i + 1}`}
                        type="number"
                        step=".1"
                        value={Number(p.y.toFixed(3))}
                        onChange={(e) =>
                          setPoints((old) =>
                            old.map((v, j) =>
                              j === i ? { ...v, y: Number(e.target.value) } : v,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <select
                        aria-label={`Class row ${i + 1}`}
                        value={p.label}
                        onChange={(e) =>
                          setPoints((old) =>
                            old.map((v, j) =>
                              j === i
                                ? { ...v, label: Number(e.target.value) }
                                : v,
                            ),
                          )
                        }
                      >
                        <option value="0">Class -1</option>
                        <option value="1">Class +1</option>
                      </select>
                    </td>
                    <td>
                      <button
                        aria-label={`Remove row ${i + 1}`}
                        onClick={() =>
                          setPoints((old) => old.filter((_, j) => j !== i))
                        }
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    if (tab === "train")
      return (
        <section className="ada-generic ada-center">
          <GitBranch />
          <h2>Train weighted decision stumps</h2>
          <p>
            Each genuine stump minimizes weighted error. AdaBoost increases the
            influence of mistakes before fitting the next learner.
          </p>
          <button
            onClick={() => {
              setTrained(
                `Trained ${model.rounds.length} rounds · accuracy ${(metrics.accuracy * 100).toFixed(1)}%`,
              );
              setToast("AdaBoost updated");
            }}
          >
            <Play /> Run / Update Visualization
          </button>
          <small>{trained}</small>
        </section>
      );
    if (tab === "metrics")
      return (
        <section className="ada-generic">
          <h2>Ensemble Metrics</h2>
          <div className="ada-metrics">
            {[
              ["In-sample accuracy", metrics.accuracy],
              ["Precision", metrics.precision],
              ["Recall", metrics.recall],
              ["F1", metrics.f1],
            ].map(([name, value]) => (
              <article key={name as string}>
                <b>{((value as number) * 100).toFixed(1)}%</b>
                <span>{name}</span>
              </article>
            ))}
          </div>
        </section>
      );
    if (tab === "compare")
      return (
        <section className="ada-generic">
          <h2>Learning-Rate Comparison</h2>
          <div className="ada-compare">
            {[0.25, 0.5, 1, 1.5].map((value) => (
              <article
                className={rate === value ? "active" : ""}
                key={value}
                onClick={() => setRate(value)}
              >
                <GitBranch />
                <h3>η = {value}</h3>
                <p>
                  {value < 1
                    ? "Conservative votes and smoother learning."
                    : "Stronger round contributions."}
                </p>
                <button>Use rate</button>
              </article>
            ))}
          </div>
        </section>
      );
    return (
      <section className="ada-generic">
        <h2>Live AdaBoost Inference</h2>
        <div className="ada-query">
          <label>
            x₁
            <input
              aria-label="Explain query x1"
              type="number"
              step=".1"
              value={query.x}
              onChange={(e) =>
                setQuery((v) => ({ ...v, x: Number(e.target.value) }))
              }
            />
          </label>
          <label>
            x₂
            <input
              aria-label="Explain query x2"
              type="number"
              step=".1"
              value={query.y}
              onChange={(e) =>
                setQuery((v) => ({ ...v, y: Number(e.target.value) }))
              }
            />
          </label>
        </div>
        <h3>
          Prediction:{" "}
          <b>Class {model.predict([query.x, query.y]) ? "+1" : "-1"}</b>
        </h3>
        <p>Ensemble score: {model.score([query.x, query.y]).toFixed(3)}</p>
      </section>
    );
  };
  return (
    <div className="ada-page">
      <header className="ada-top">
        <Link to="/">
          <Sparkles />
          <span>
            <b>Mega ML</b>
            <small>OBSERVATORY</small>
          </span>
        </Link>
        <section>
          <span>Lesson Progress</span>
          <LabProgressMeter />
        </section>
        <p>
          <b>Objective</b> Understand how AdaBoost combines weak learners by
          focusing on hard examples.
        </p>
        <button
          onClick={() =>
            exportWorkspaceReport({
              title: "AdaBoost Classification",
              route: "/ml/supervised/adaboost-classification",
              tab,
            })
          }
        >
          <Download /> Export Report
        </button>
        <MoreVertical />
      </header>
      <aside className="ada-nav">
        <h3>
          LESSON NAVIGATION <ChevronDown />
        </h3>
        <button>
          Introduction <Check />
        </button>
        <section>
          <h4>1. Core Concepts</h4>
          {[
            "What is AdaBoost?",
            "How AdaBoost Works",
            "Weak Learners (Stumps)",
            "Weight Updates",
            "Final Prediction",
          ].map((name, i) => (
            <button className={i === 1 ? "active" : ""} key={name}>
              • {name}
            </button>
          ))}
        </section>
        {[
          "2. Interactive Demo",
          "3. Advanced Topics",
          "4. Real-World Impact",
          "5. Summary",
        ].map((name) => (
          <button key={name}>
            {name}
            <i />
          </button>
        ))}
        <hr />
        <h3>QUICK ACTIONS</h3>
        <button onClick={reset}>
          <RefreshCw /> Restart Lesson
        </button>
        <button onClick={() => setToast("Notebook download prepared")}>
          <Download /> Download Notebook
        </button>
        <button onClick={() => setToast("Lesson bookmarked")}>
          <Bookmark /> Bookmark Lesson
        </button>
        <footer>
          <Bot />
          <span>
            Need Help?<small>Open AI Tutor</small>
          </span>
        </footer>
      </aside>
      <main>
        <header className="ada-hero">
          <i>
            <Sparkles />
          </i>
          <div>
            <h1>
              AdaBoost Classification <em>Supervised Learning</em>
            </h1>
            <p>
              AdaBoost builds a strong classifier by iteratively training weak
              learners on reweighted data, focusing more on the examples
              <br />
              that previous learners got wrong.
            </p>
          </div>
        </header>
        <nav className="ada-tabs">
          {TABS.map(([id, name]) => (
            <button
              className={tab === id ? "active" : ""}
              key={id}
              onClick={() => setTab(id)}
            >
              {name}
            </button>
          ))}
        </nav>
        <div className="ada-work">
          <div className="ada-main">{content()}</div>
          <aside className="ada-controls">
            <h3>
              DATASET <CircleHelp />
            </h3>
            <select
              aria-label="Dataset"
              value={dataset}
              onChange={(e) => choose(e.target.value as Dataset)}
            >
              {Object.entries(LABELS)
                .filter(([id]) => id !== "imported" || imported.length)
                .map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
            </select>
            <p>Samples: {points.length} Features: 2 Classes: 2</p>
            <div>
              <button
                onClick={() => setToast("Choose a dataset from the menu")}
              >
                <SwitchCamera /> Switch Dataset
              </button>
              <button onClick={() => uploadRef.current?.click()}>
                <Upload /> Upload CSV
              </button>
              <input
                hidden
                ref={uploadRef}
                type="file"
                accept=".csv,text/csv"
                onChange={upload}
              />
            </div>
            <hr />
            <h3>VISUALIZATION CONTROLS</h3>
            <label>
              Point Size
              <select
                aria-label="Point Size"
                value={pointSize}
                onChange={(e) => setPointSize(e.target.value)}
              >
                <option value="weight">Weight</option>
                <option value="uniform">Uniform</option>
              </select>
            </label>
            <label>
              Misclassified Highlight
              <button
                className={highlight ? "on" : ""}
                onClick={() => setHighlight((v) => !v)}
              >
                <i />
                ON
              </button>
            </label>
            <label>
              Decision Boundary
              <button
                className={boundary ? "on" : ""}
                onClick={() => setBoundary((v) => !v)}
              >
                <i />
                ON
              </button>
            </label>
            <label>
              Axes Range
              <select
                aria-label="Axes Range"
                value={axis}
                onChange={(e) => setAxis(e.target.value)}
              >
                <option value="auto">Auto</option>
                <option value="fixed">Fixed ±2</option>
              </select>
            </label>
            <hr />
            <h3>TRAINING CONTROLS</h3>
            <label>
              Rounds (T){" "}
              <input
                aria-label="Rounds numeric"
                type="number"
                min="1"
                max="12"
                value={rounds}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setRounds(v);
                  setRound(Math.min(round, v));
                }}
              />
            </label>
            <input
              aria-label="Rounds slider"
              type="range"
              min="1"
              max="12"
              value={rounds}
              onChange={(e) => {
                const v = Number(e.target.value);
                setRounds(v);
                setRound(Math.min(round, v));
              }}
            />
            <label>
              Learning Rate (ν){" "}
              <input
                aria-label="Learning Rate numeric"
                type="number"
                min=".1"
                max="2"
                step=".1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
            </label>
            <input
              aria-label="Learning Rate slider"
              type="range"
              min=".1"
              max="2"
              step=".1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <label>
              Early Stopping{" "}
              <button
                className={early ? "on" : ""}
                onClick={() => setEarly((v) => !v)}
              >
                <i />
              </button>
            </label>
            <button
              className="ada-run"
              onClick={() => {
                setTrained("Updated");
                setToast("AdaBoost updated");
              }}
            >
              <Play /> Run / Update Visualization
            </button>
            <button className="ada-reset" onClick={reset}>
              <RefreshCw /> Reset
            </button>
            <section>
              <Lightbulb /> AdaBoost increases weights of misclassified points,
              forcing future learners to focus on them.
            </section>
          </aside>
        </div>
      </main>
      {toast && (
        <div className="ada-toast" onClick={() => setToast("")}>
          {toast}
        </div>
      )}
    </div>
  );
}
