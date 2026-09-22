import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LabProgressMeter } from "../../../../components/common/LabChrome";
import { LabLessonPanel, useUrlTab } from "../../../../components/common/LabTabs";
import {
  BookOpen,
  Bot,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Database,
  GitBranch,
  HelpCircle,
  Moon,
  Network,
  Play,
  RefreshCw,
  Sparkles,
  Upload,
  UserCircle,
} from "lucide-react";
import {
  datasetAPerfectBinary,
  datasetBOverlappingBinary,
  datasetCXor,
  datasetDTwoMoons,
  datasetECircles,
} from "../../../../lib/classification/classificationDatasets";
import { binaryMetrics, logLoss } from "../../../../lib/math/metrics";
import { classificationSplit } from "../../../../lib/classification/classificationEval";
import { trainGradientBoostingClassification } from "../../../../lib/algorithms/classification/gradientBoostingClassification";
import { useTheme } from "../../../../stores/uiStore";
import "./GradientBoostingClassificationPage.css";

type Point = { x: number; y: number; label: number };
type Dataset = "moons" | "circles" | "blobs" | "linear" | "xor" | "imported";
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
  moons: "Two Moons (Noisy)",
  circles: "Concentric Circles",
  blobs: "Gaussian Blobs",
  linear: "Linear Separation",
  xor: "XOR regions",
  imported: "Imported Dataset",
};
const jitter = (i: number, k = 1) => Math.sin(i * 73.13 * k) * 0.5 + 0.5;
function makeData(kind: Exclude<Dataset, "imported">): Point[] {
  if (kind === "moons") return datasetDTwoMoons(90, 9);
  if (kind === "circles") return datasetECircles(90, 13);
  if (kind === "linear") return datasetAPerfectBinary();
  if (kind === "xor") return datasetCXor();
  return datasetBOverlappingBinary();
}
const BUILT = {
  moons: makeData("moons"),
  circles: makeData("circles"),
  blobs: makeData("blobs"),
  linear: makeData("linear"),
  xor: makeData("xor"),
};
const C0 = "#18cdb6",
  C1 = "#ff626d";

function MiniPlot({
  points,
  predict,
  weights = true,
  boundary = true,
}: {
  points: Point[];
  predict: (p: Point) => number;
  weights?: boolean;
  boundary?: boolean;
}) {
  const grid = Array.from({ length: 12 * 12 }, (_, i) => {
    const x = -2 + (((i % 12) + 0.5) / 12) * 4,
      y = -1.7 + ((Math.floor(i / 12) + 0.5) / 12) * 3.4;
    return { x, y, label: predict({ x, y, label: 0 }) };
  });
  return (
    <div className="gbc-mini">
      {boundary &&
        grid.map((g, i) => (
          <i
            key={i}
            style={{
              left: `${((g.x + 2) / 4) * 100}%`,
              top: `${((1.7 - g.y) / 3.4) * 100}%`,
              background: g.label ? `${C1}25` : `${C0}20`,
            }}
          />
        ))}
      {points
        .filter((_, i) => i % 10 === 0)
        .map((p, i) => (
          <b
            key={i}
            style={{
              left: `${((p.x + 2) / 4) * 100}%`,
              top: `${((1.7 - p.y) / 3.4) * 100}%`,
              borderColor: p.label ? C1 : C0,
              background: weights ? "transparent" : p.label ? C1 : C0,
            }}
          />
        ))}
    </div>
  );
}

export default function GradientBoostingClassificationLesson() {
  const [tab, setTab] = useUrlTab<Tab>("visualize");
  const [dataset, setDataset] = useState<Dataset>("moons"),
    [points, setPoints] = useState<Point[]>(BUILT.moons),
    [imported, setImported] = useState<Point[]>([]);
  const [estimators, setEstimators] = useState(5),
    [stage, setStage] = useState(5),
    [rate, setRate] = useState(0.5),
    [depth, setDepth] = useState(2),
    [subsample, setSubsample] = useState(1),
    [showWeights, setShowWeights] = useState(true),
    [showBoundary, setShowBoundary] = useState(true);
  const [query, setQuery] = useState({ x: 0.25, y: 0.1 }),
    [trained, setTrained] = useState("Ready"),
    [toast, setToast] = useState("");
  const { theme, toggleTheme } = useTheme();
  const lightTheme = theme === "light";
  const uploadRef = useRef<HTMLInputElement>(null);
  const X = useMemo(() => points.map((p) => [p.x, p.y]), [points]),
    y = useMemo(() => points.map((p) => p.label), [points]);
  const split = useMemo(() => {
    try {
      return classificationSplit(X, y, 0.2, 42);
    } catch {
      return null;
    }
  }, [X, y]);
  const model = useMemo(
    () =>
      trainGradientBoostingClassification(split?.trainX ?? X, split?.trainY ?? y, {
        estimators,
        learningRate: rate,
        maxDepth: depth,
        subsample,
        minSamplesLeaf: 5,
        seed: 2026,
      }),
    [X, y, split, estimators, rate, depth, subsample],
  );
  const current = Math.min(stage, model.stages.length),
    last = model.stages.at(-1)!,
    trainPred = (split?.trainX ?? X).map((row) => model.predictAtStage(row, current)),
    testPred = (split?.testX ?? X).map((row) => model.predictAtStage(row, current)),
    metrics = binaryMetrics(split?.testY ?? y, testPred);
  const trainLogLoss = logLoss(
    split?.trainY ?? y,
    (split?.trainX ?? X).map((row) => model.probabilityAtStage(row, current)),
  );
  const testLogLoss = logLoss(
    split?.testY ?? y,
    (split?.testX ?? X).map((row) => model.probabilityAtStage(row, current)),
  );
  const trainAcc =
    trainPred.filter((value, index) => value === (split?.trainY ?? y)[index]).length /
    trainPred.length;
  const choose = (next: Dataset) => {
    const source = next === "imported" ? imported : BUILT[next];
    if (!source.length) return;
    setDataset(next);
    setPoints(source.map((p) => ({ ...p })));
    setTrained("Ready");
  };
  const reset = () => {
    setDataset("moons");
    setPoints(BUILT.moons.map((p) => ({ ...p })));
    setEstimators(5);
    setStage(5);
    setRate(0.5);
    setDepth(2);
    setSubsample(1);
    setShowWeights(true);
    setShowBoundary(true);
    setQuery({ x: 0.25, y: 0.1 });
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
    setStage(Math.min(stage, estimators));
    setToast(`Imported ${rows.length} samples`);
    e.target.value = "";
  };
  const stagePredict = (count: number) => (p: Point) =>
    model.predictAtStage([p.x, p.y], Math.min(count, model.stages.length));
  const card = (index: number) => (
    <article className="gbc-learner">
      <header>
        <i>{index + 1}</i>
        <span>
          <b>
            {index === 0 ? "Initial Model (Bias)" : `Weak Learner ${index}`}
          </b>
          <small>Tree Depth: {index ? depth : 1}</small>
        </span>
      </header>
      <MiniPlot
        points={points}
        predict={stagePredict(index)}
        weights={showWeights}
        boundary={showBoundary}
      />
      <hr />
      <p>
        Weighted Error{" "}
        <b>
          {index
            ? (model.stages[index - 1]?.weightedError ?? 0).toFixed(3)
            : (model.stages[0]?.weightedError ?? 0).toFixed(3)}
        </b>
      </p>
      <hr />
      <p>Sample Weights</p>
      <div className="gbc-bars">
        {Array.from({ length: 24 }, (_, i) => (
          <i
            key={i}
            style={{
              height: `${10 + (model.stages[Math.max(0, index - 1)]?.sampleWeights[i * 3] ?? 0.2) * 65}%`,
              background: i > 14 ? "#ff922f" : "#8390a4",
            }}
          />
        ))}
      </div>
    </article>
  );
  const visual = (
    <>
      <section className="gbc-visual">
        <header>
          <div>
            <h1>Gradient Boosting Classification</h1>
            <p>
              Watch how each weak learner focuses on mistakes and improves the
              ensemble.
            </p>
          </div>
          <label>
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
          </label>
          <button onClick={() => uploadRef.current?.click()}>
            <Upload /> Upload Dataset
          </button>
          <input
            hidden
            ref={uploadRef}
            type="file"
            accept=".csv,text/csv"
            onChange={upload}
          />
        </header>
        <div className="gbc-sequence">
          {[0, 1, 2, 3, 4].map((index) => (
            <span className="gbc-stage-wrap" key={index}>
              {card(index)}
              {index < 4 && (
                <i className="gbc-plus">
                  +<small>{index ? rate.toFixed(2) : "0.65"} →</small>
                </i>
              )}
            </span>
          ))}
          <article className="gbc-ensemble">
            <h2>
              Ensemble <small>(After {current} Trees)</small>
            </h2>
            <h3>Ensemble Score F(x)</h3>
            <MiniPlot
              points={points}
              predict={stagePredict(current)}
              weights={false}
            />
            <dl>
              <div>
                <dt>Train accuracy</dt>
                <dd>{trainAcc.toFixed(3)}</dd>
              </div>
              <div>
                <dt>Test accuracy</dt>
                <dd>{metrics.accuracy.toFixed(3)}</dd>
              </div>
              <div>
                <dt>Train log loss</dt>
                <dd>{trainLogLoss.toFixed(3)}</dd>
              </div>
              <div>
                <dt>Test log loss</dt>
                <dd>{testLogLoss.toFixed(3)}</dd>
              </div>
              <div>
                <dt>Total Estimators</dt>
                <dd>{estimators}</dd>
              </div>
            </dl>
            <button onClick={() => setStage(estimators)}>
              <Play /> View Full Evolution
            </button>
          </article>
        </div>
      </section>
      <section className="gbc-diagnostics">
        <article>
          <h3>
            Sample Weights Evolution <CircleHelp />
          </h3>
          <p>
            <i /> High Weight <i /> Low Weight
          </p>
          <div className="gbc-heat">
            {Array.from({ length: 6 * 18 }, (_, i) => (
              <i
                key={i}
                style={{
                  background:
                    i % 6 > Math.floor(i / 18) ? "#f05c36" : "#526078",
                }}
              />
            ))}
          </div>
          <footer>Init 1 2 3 4 5</footer>
        </article>
        <article>
          <h3>
            Ensemble Score F(x) Distribution <CircleHelp />
          </h3>
          <div className="gbc-hist">
            {Array.from({ length: 26 }, (_, i) => (
              <i
                key={i}
                style={{
                  height: `${15 + Math.sin(i * 0.6) ** 2 * 65}%`,
                  background: i < 13 ? C0 : C1,
                }}
              />
            ))}
          </div>
          <footer>Class 0 Class 1</footer>
        </article>
        <article>
          <h3>
            Decision Boundary Evolution <CircleHelp />
          </h3>
          <div className="gbc-evolve">
            {[0, 1, 2, 3, 4, 5].map((s) => (
              <MiniPlot
                key={s}
                points={points}
                predict={stagePredict(s)}
                weights={false}
              />
            ))}
          </div>
          <footer>
            Model complexity increases → boundary becomes more precise
          </footer>
        </article>
        <article>
          <h3>
            Training Progress <CircleHelp />
          </h3>
          <svg viewBox="0 0 330 130">
            <polyline
              points={model.stages
                .map((s, i) => `${18 + i * 58},${15 + s.logLoss * 100}`)
                .join(" ")}
              className="loss"
            />
            <polyline
              points={model.stages
                .map((s, i) => `${18 + i * 58},${120 - s.accuracy * 100}`)
                .join(" ")}
              className="acc"
            />
          </svg>
        </article>
      </section>
      <footer className="gbc-summary">
        <Database />
        <span>
          Dataset: <b>{LABELS[dataset]}</b>
        </span>
        <em>Binary Classification</em>
        <span>
          Samples: {points.length} • Features: 2 • Classes: 2 (Balanced) •
          Noise: 0.20
        </span>
        <button onClick={() => setTab("dataset")}>
          Change Dataset <ChevronDown />
        </button>
      </footer>
    </>
  );
  const content = () => {
    if (tab === "learn")
      return (
        <LabLessonPanel
          tab="Learn"
          route="/ml/supervised/gradient-boosting-classification"
        />
      );
    if (tab === "visualize") return visual;
    if (tab === "dataset")
      return (
        <section className="gbc-generic gbc-data">
          <h2>Live Dataset</h2>
          <p>
            Edit the samples driving every residual, tree, score, metric, and
            boundary.
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
                        <option value="0">Class 0</option>
                        <option value="1">Class 1</option>
                      </select>
                    </td>
                    <td>
                      <button
                        aria-label={`Remove row ${i + 1}`}
                        disabled={points.length <= 4}
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
        <section className="gbc-generic gbc-center">
          <GitBranch />
          <h2>Fit residual learners sequentially</h2>
          <p>
            Each CART learner fits the current negative log-loss gradient, then
            contributes at the selected learning rate.
          </p>
          <button
            onClick={() => {
              setTrained(
                `Trained ${model.stages.length} stages · log loss ${last.logLoss.toFixed(3)}`,
              );
              setToast("Gradient boosting retrained");
            }}
          >
            <Play /> Train / Retrain
          </button>
          <small>{trained}</small>
        </section>
      );
    if (tab === "metrics")
      return (
        <section className="gbc-generic">
          <h2>Ensemble Metrics</h2>
          <div className="gbc-metrics">
            {[
              ["Test accuracy", metrics.accuracy],
              ["Precision", metrics.precision],
              ["Recall", metrics.recall],
              ["F1", metrics.f1],
              ["Test log loss", testLogLoss],
            ].map(([name, value]) => (
              <article key={name as string}>
                <b>
                  {String(name).includes("log loss")
                    ? (value as number).toFixed(3)
                    : `${((value as number) * 100).toFixed(1)}%`}
                </b>
                <span>{name}</span>
              </article>
            ))}
          </div>
        </section>
      );
    if (tab === "compare")
      return (
        <section className="gbc-generic">
          <h2>Depth Comparison</h2>
          <div className="gbc-compare">
            {[1, 2, 3, 4].map((value) => (
              <article
                className={depth === value ? "active" : ""}
                key={value}
                onClick={() => setDepth(value)}
              >
                <GitBranch />
                <h3>Depth {value}</h3>
                <p>
                  {value < 3
                    ? "Simple weak learners with smoother boundaries."
                    : "More expressive learners with sharper boundaries."}
                </p>
                <button>Use depth</button>
              </article>
            ))}
          </div>
        </section>
      );
    return (
      <section className="gbc-generic">
        <h2>Live Ensemble Inference</h2>
        <div className="gbc-query">
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
        </div>
        <h3>
          Prediction:{" "}
          <b>Class {model.predictAtStage([query.x, query.y], current)}</b>
        </h3>
        <p>
          Probability:{" "}
          {(
            model.probabilityAtStage([query.x, query.y], current) * 100
          ).toFixed(1)}
          %
        </p>
      </section>
    );
  };
  return (
    <div className={`gbc-page ${lightTheme ? "light" : ""}`}>
      <header className="gbc-top">
        <Link to="/" className="gbc-brand">
          <Sparkles />
          <span>
            <b>Mega ML</b>
            <small>AI OBSERVATORY</small>
          </span>
        </Link>
        <section>
          <b>LESSON PROGRESS</b>
          <LabProgressMeter />
        </section>
        <article>
          <b>OBJECTIVE</b>
          <p>
            Understand how Gradient Boosting builds a strong classifier by
            sequentially
            <br />
            fitting weak learners to correct mistakes.
          </p>
        </article>
        <nav>
          <button
            aria-label="Help"
            onClick={() => setToast("Help center ready")}
          >
            <HelpCircle />
          </button>
          <button
            aria-label="Guide"
            onClick={() => setToast("Lesson guide ready")}
          >
            <BookOpen />
          </button>
          <button
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            <Moon />
          </button>
          <button
            aria-label="Profile"
            onClick={() => setToast("Learner profile ready")}
          >
            <UserCircle />
          </button>
        </nav>
      </header>
      <aside className="gbc-nav">
        <h3>LESSONS</h3>
        {[
          "1. Introduction",
          "2. Core Idea",
          "3. Weak Learners",
          "4. Algorithm Steps",
          "5. Gradient Boosting Classification",
          "6. Hyperparameters",
          "7. Practical Tips",
        ].map((name, i) => (
          <button className={i === 4 ? "active" : ""} key={name}>
            <GitBranch />
            {name}
            {i === 4 && <i />}
          </button>
        ))}
        <hr />
        <h3>REFERENCE</h3>
        {["Math & Intuition", "When to Use", "Pitfalls", "Further Reading"].map(
          (name) => (
            <button key={name}>
              <CircleHelp />
              {name}
            </button>
          ),
        )}
        <section>
          <Bot />
          <span>
            Need help?<small>Ask the AI Tutor</small>
          </span>
        </section>
      </aside>
      <main>
        <nav className="gbc-tabs">
          {TABS.map(([id, name]) => (
            <button
              className={tab === id ? "active" : ""}
              key={id}
              onClick={() => setTab(id)}
            >
              <Network />
              {name}
            </button>
          ))}
        </nav>
        <div className="gbc-work">
          <div className="gbc-main">{content()}</div>
          <aside className="gbc-controls">
            <h3>CONTROLS</h3>
            <label>
              Stage{" "}
              <b>
                {current} / {estimators}
              </b>
            </label>
            <input
              aria-label="Stage slider"
              type="range"
              min="1"
              max={estimators}
              value={current}
              onChange={(e) => setStage(Number(e.target.value))}
            />
            <div>
              <span>1</span>
              <span>{estimators}</span>
            </div>
            <div className="gbc-stage-buttons">
              <button aria-label="First stage" onClick={() => setStage(1)}>
                <ChevronFirst />
              </button>
              <button
                aria-label="Previous stage"
                onClick={() => setStage((v) => Math.max(1, v - 1))}
              >
                <ChevronLeft />
              </button>
              <button
                aria-label="Play stages"
                onClick={() => setStage((v) => Math.min(estimators, v + 1))}
              >
                <Play />
              </button>
              <button
                aria-label="Next stage"
                onClick={() => setStage((v) => Math.min(estimators, v + 1))}
              >
                <ChevronRight />
              </button>
              <button
                aria-label="Last stage"
                onClick={() => setStage(estimators)}
              >
                <ChevronLast />
              </button>
            </div>
            <hr />
            <label>
              Learning Rate (γ){" "}
              <input
                aria-label="Learning Rate numeric"
                type="number"
                min=".01"
                max="1"
                step=".01"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
            </label>
            <input
              aria-label="Learning Rate slider"
              type="range"
              min=".01"
              max="1"
              step=".01"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <div>
              <span>0.01</span>
              <span>0.10</span>
              <span>1.00</span>
            </div>
            <label>Max Depth</label>
            <div className="gbc-depths">
              {[1, 2, 3, 4].map((v) => (
                <button
                  className={depth === v ? "active" : ""}
                  key={v}
                  onClick={() => setDepth(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            <hr />
            <label>
              Subsample{" "}
              <input
                aria-label="Subsample numeric"
                type="number"
                min=".25"
                max="1"
                step=".05"
                value={subsample}
                onChange={(e) => setSubsample(Number(e.target.value))}
              />
            </label>
            <input
              aria-label="Subsample slider"
              type="range"
              min=".25"
              max="1"
              step=".05"
              value={subsample}
              onChange={(e) => setSubsample(Number(e.target.value))}
            />
            <div>
              <span>0.25</span>
              <span>0.50</span>
              <span>0.75</span>
              <span>1.00</span>
            </div>
            <label>
              Show Sample Weights{" "}
              <button
                className={showWeights ? "on" : ""}
                onClick={() => setShowWeights((v) => !v)}
              >
                <i />
              </button>
            </label>
            <label>
              Show Decision Boundary{" "}
              <button
                className={showBoundary ? "on" : ""}
                onClick={() => setShowBoundary((v) => !v)}
              >
                <i />
              </button>
            </label>
            <button className="gbc-reset" onClick={reset}>
              <RefreshCw /> Reset Visualization
            </button>
          </aside>
        </div>
      </main>
      {toast && (
        <div className="gbc-toast" onClick={() => setToast("")}>
          {toast}
        </div>
      )}
    </div>
  );
}
