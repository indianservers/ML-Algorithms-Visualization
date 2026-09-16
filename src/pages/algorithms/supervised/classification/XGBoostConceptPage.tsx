import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BrainCircuit,
  Check,
  Download,
  GitBranch,
  Info,
  Moon,
  Network,
  Play,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { trainGradientBoostingClassification } from "../../../../lib/algorithms/classification/gradientBoostingClassification";
import { binaryMetrics } from "../../../../lib/math/metrics";
import {
  datasetAPerfectBinary,
  datasetCXor,
  datasetDTwoMoons,
  datasetECircles,
  datasetHImbalanced,
} from "../../../../lib/classification/classificationDatasets";
import "./XGBoostConceptPage.css";
import { useTheme } from "../../../../stores/uiStore";

type Row = { features: number[]; target: number };
type Dataset = "separable" | "moons" | "xor" | "imbalanced" | "circles" | "imported";
type Tab =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
const TABS: Tab[] = [
  "learn",
  "visualize",
  "dataset",
  "train",
  "metrics",
  "compare",
  "explain",
];
const NAMES = ["x1", "x2"];
const LABELS: Record<Dataset, string> = {
  separable: "Perfect separable binary",
  moons: "Two moons",
  xor: "XOR regions",
  imbalanced: "Imbalanced 90/10",
  circles: "Concentric circles",
  imported: "Imported Dataset",
};
function fromPoints(
  points: { x: number; y: number; label: number }[],
): Row[] {
  return points.map((point) => ({
    features: [point.x, point.y],
    target: point.label,
  }));
}
const BUILT = {
  separable: fromPoints(datasetAPerfectBinary()),
  moons: fromPoints(datasetDTwoMoons(90, 9)),
  xor: fromPoints(datasetCXor()),
  imbalanced: fromPoints(datasetHImbalanced()),
  circles: fromPoints(datasetECircles(90, 13)),
};
function Sparkline({ train, valid }: { train: number[]; valid: number[] }) {
  const points = (values: number[]) => {
    const max = Math.max(...values),
      min = Math.min(...values),
      span = max - min || 1;
    return values
      .map(
        (v, i) =>
          `${8 + (i / Math.max(1, values.length - 1)) * 224},${8 + ((max - v) / span) * 84}`,
      )
      .join(" ");
  };
  return (
    <svg className="xgb-chart" viewBox="0 0 240 104">
      <path d="M8 96H234M8 8V96" />
      <polyline className="valid" points={points(valid)} />
      <polyline points={points(train)} />
    </svg>
  );
}

export default function XGBoostConceptPage() {
  const [tab, setTab] = useState<Tab>("learn"),
    [dataset, setDataset] = useState<Dataset>("separable"),
    [rows, setRows] = useState<Row[]>(BUILT.separable),
    [imported, setImported] = useState<Row[]>([]);
  const [rate, setRate] = useState(0.1),
    [depth, setDepth] = useState(3),
    [subsample, setSubsample] = useState(0.8),
    [colsample, setColsample] = useState(0.8),
    [minChild, setMinChild] = useState(1),
    [lambda, setLambda] = useState(1),
    [alpha, setAlpha] = useState(0),
    [trees, setTrees] = useState(12);
  const [trained, setTrained] = useState("Ready"),
    [toast, setToast] = useState("");
  const { theme, toggleTheme } = useTheme();
  const light = theme === "light";
  const [metricName, setMetricName] = useState("logloss"),
    [query, setQuery] = useState(BUILT.separable[0].features.slice());
  const uploadRef = useRef<HTMLInputElement>(null),
    X = useMemo(() => rows.map((r) => r.features), [rows]),
    y = useMemo(
      () => rows.map((r) => (r.target >= 0.5 ? 1 : 0)),
      [rows],
    );
  const model = useMemo(
    () =>
      trainGradientBoostingClassification(X, y, {
        estimators: Math.max(1, Math.min(40, Math.round(trees))),
        learningRate: rate / (1 + lambda),
        maxDepth: Math.max(1, Math.round(depth)),
        subsample,
        minSamplesLeaf: Math.max(1, Math.round(minChild + alpha)),
        seed: 2026 + Math.round(colsample * 10),
      }),
    [X, y, trees, rate, depth, subsample, colsample, minChild, lambda, alpha],
  );
  const predictions = useMemo(() => X.map(model.predict), [X, model]);
  const probabilities = useMemo(() => X.map(model.probability), [X, model]);
  const report = binaryMetrics(y, predictions);
  const root = model.stages[0].tree,
    left = root.left,
    right = root.right;
  const best =
    model.stages.reduce(
      (bestIndex, item, index, all) =>
        item.logLoss < all[bestIndex].logLoss ? index : bestIndex,
      0,
    ) + 1;
  const importance = (() => {
    const width = X[0]?.length ?? 0;
    const gains = Array.from({ length: width }, () => 0);
    const walk = (node: { featureIndex?: number; left?: unknown; right?: unknown }) => {
      if (node.featureIndex !== undefined) gains[node.featureIndex] += 1;
      if (node.left) walk(node.left as typeof node);
      if (node.right) walk(node.right as typeof node);
    };
    model.stages.forEach((stage) => walk(stage.tree));
    const total = gains.reduce((s, v) => s + v, 0) || 1;
    return gains
      .map((value, index) => ({
        value: value / total,
        name: NAMES[index] ?? `Feature ${index + 1}`,
      }))
      .sort((a, b) => b.value - a.value);
  })();
  const choose = (next: Dataset) => {
    const source = next === "imported" ? imported : BUILT[next];
    if (!source.length) return;
    setDataset(next);
    setRows(
      source.map((row) => ({
        features: [...row.features],
        target: row.target,
      })),
    );
    setQuery(source[0].features.slice());
    setTrained("Ready");
  };
  const reset = () => {
    setTab("learn");
    choose("separable");
    setRate(0.1);
    setDepth(6);
    setSubsample(0.8);
    setColsample(0.8);
    setMinChild(1);
    setLambda(1);
    setAlpha(0);
    setTrees(60);
    setMetricName("logloss");
    setToast("");
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const parsed = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter((v) => v.length >= 3 && v.every(Number.isFinite))
      .map((v) => ({ features: v.slice(0, -1), target: v.at(-1)! }));
    if (parsed.length < 4) {
      setToast("CSV needs numeric features and a target");
      return;
    }
    setImported(parsed);
    setDataset("imported");
    setRows(parsed);
    setQuery(parsed[0].features.slice());
    setToast(`Imported ${parsed.length} rows`);
    event.target.value = "";
  };
  const slider = (
    label: string,
    value: number,
    setter: (n: number) => void,
    min: number,
    max: number,
    step: number,
  ) => (
    <label className="slider">
      <span>
        {label}
        <input
          aria-label={`${label} numeric`}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => setter(Number(event.target.value))}
        />
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setter(Number(e.target.value))}
      />
    </label>
  );
  return (
    <div className={`xgb-page ${light ? "light" : ""}`}>
      <aside className="xgb-nav">
        <Link to="/">
          <BrainCircuit />
          <span>
            <b>Mega ML</b>
            <small>AI Observatory</small>
          </span>
        </Link>
        <h3>LESSON NAVIGATION</h3>
        <button className="selected">
          <Network /> XGBoost Concept
        </button>
        <button onClick={() => setToast("Overview opened")}>
          <BookOpen /> Overview
        </button>
        <section>
          {[
            "Boosted Tree Pipeline",
            "Split-Gain & Regularization",
            "Learning Curve",
            "Feature Importance",
            "Hyperparameters",
            "Strengths & When to Use",
            "Limitations",
            "Further Reading",
          ].map((label, index) => (
            <button
              key={label}
              className={index ? "" : "active"}
              onClick={() => setToast(label)}
            >
              {index ? <SlidersHorizontal /> : <GitBranch />}
              {label}
              {!index && <i />}
            </button>
          ))}
        </section>
        <footer>
          <h3>LESSON TOOLS</h3>
          <button onClick={() => setToast("Notebook opened")}>
            ⌘ Notebook
          </button>
          <button onClick={() => setToast("Slides downloaded")}>
            <Download /> Download Slides
          </button>
          <button onClick={reset}>
            <RefreshCw /> Reset Lesson
          </button>
        </footer>
      </aside>
      <main>
        <header className="xgb-head">
          <div>
            <h1>XGBoost Concept ☆</h1>
            <p>
              Educational gradient-boosted trees for binary classification
              (not a full XGBoost/WASM runtime). Lambda shrinks the learning
              rate; alpha raises the minimum leaf size.
            </p>
          </div>
          <span>
            Lesson Progress{" "}
            <i>
              <b />
            </i>{" "}
            68%
          </span>
          <button onClick={toggleTheme}>
            <Moon />
          </button>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
        </header>
        <div className="xgb-objective">
          <Check />
          <b>Objective:</b> Build an accurate model by sequentially fitting
          trees to residual errors with regularized split-gain.
        </div>
        <nav className="xgb-tabs">
          {TABS.map((item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        <section className="xgb-work">
          <article className="xgb-pipeline">
            <h2>
              {tab === "dataset"
                ? "Editable Training Dataset"
                : tab === "train"
                  ? "Training Evolution"
                  : tab === "metrics"
                    ? "Model Diagnostics"
                    : tab === "compare"
                      ? "Baseline Comparison"
                      : tab === "explain"
                        ? "Prediction Explanation"
                        : "Boosted Tree Pipeline"}
            </h2>
            {tab === "dataset" ? (
              <div className="xgb-table">
                <table>
                  <thead>
                    <tr>
                      {rows[0].features.map((_, i) => (
                        <th key={i}>{NAMES[i] ?? `X${i + 1}`}</th>
                      ))}
                      <th>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 8).map((row, ri) => (
                      <tr key={ri}>
                        {row.features.map((value, fi) => (
                          <td key={fi}>
                            <input
                              aria-label={`row ${ri + 1} feature ${fi + 1}`}
                              value={value.toFixed(2)}
                              onChange={(e) =>
                                setRows((current) =>
                                  current.map((r, i) =>
                                    i === ri
                                      ? {
                                          ...r,
                                          features: r.features.map((v, j) =>
                                            j === fi
                                              ? Number(e.target.value)
                                              : v,
                                          ),
                                        }
                                      : r,
                                  ),
                                )
                              }
                            />
                          </td>
                        ))}
                        <td>
                          <input
                            aria-label={`row ${ri + 1} target`}
                            value={row.target.toFixed(2)}
                            onChange={(e) =>
                              setRows((current) =>
                                current.map((r, i) =>
                                  i === ri
                                    ? { ...r, target: Number(e.target.value) }
                                    : r,
                                ),
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div>
                  <button
                    onClick={() =>
                      setRows([
                        ...rows,
                        { features: rows[0].features.map(() => 0), target: 0 },
                      ])
                    }
                  >
                    + Add Row
                  </button>
                  <button
                    onClick={() =>
                      rows.length > 4 && setRows(rows.slice(0, -1))
                    }
                  >
                    Remove Last
                  </button>
                  <span>Showing 8 of {rows.length}</span>
                </div>
              </div>
            ) : tab === "explain" ? (
              <div className="xgb-explain">
                <div>
                  {query.map((value, index) => (
                    <label key={index}>
                      {NAMES[index] ?? `X${index + 1}`}
                      <input
                        type="number"
                        value={value.toFixed(2)}
                        onChange={(e) =>
                          setQuery(
                            query.map((v, i) =>
                              i === index ? Number(e.target.value) : v,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
                <strong>
                  Predicted class{" "}
                  <b>{model.predict(query)}</b>
                  {" · P(class 1) "}
                  <b>{model.probability(query).toFixed(3)}</b>
                </strong>
                <p>
                  Baseline {model.baseline.toFixed(3)} plus{" "}
                  {model.stages.length} regularized tree contributions.
                </p>
              </div>
            ) : (
              <>
                <div className="xgb-flow">
                  {[
                    ["1", "Initialize", `f₀(x) = ${model.baseline.toFixed(2)}`],
                    ["2", "Tree 1", "r₁ = −∇L(y,f₀)"],
                    ["3", "Tree 2", "r₂ = −∇L(y,f₁)"],
                    ["T", "Tree T", "rₜ = −∇L(y,fₜ₋₁)"],
                  ].map((v, i) => (
                    <div key={v[1]}>
                      <i>{v[0]}</i>
                      <b>{v[1]}</b>
                      <small>
                        {i
                          ? "Fit tree to residuals"
                          : "Start with base prediction"}
                      </small>
                      <strong>{v[2]}</strong>
                    </div>
                  ))}
                </div>
                <div className="xgb-minirow">
                  <div className="dots">
                    {predictions.slice(0, 52).map((v, i) => (
                      <i
                        key={i}
                        style={{
                          left: `${(i / 51) * 92 + 4}%`,
                          top: `${50 + Math.max(-39, Math.min(39, (y[i] - v) * 18))}%`,
                        }}
                      />
                    ))}
                  </div>
                  {model.stages.slice(0, 3).map((item, index) => (
                    <div className="tree" key={index}>
                      <i />
                      <span />
                      <span />
                      <small>h{index + 1}(x)</small>
                    </div>
                  ))}
                </div>
                <div className="xgb-equation">
                  fₜ(x) = f₀(x) + η Σ hₜ(x)
                  <span>η: learning rate (shrinkage) · T: number of trees</span>
                </div>
                <div className="xgb-residuals">
                  <b>
                    Residuals /<br />
                    Negative Gradients
                  </b>
                  {model.stages.slice(0, 4).map((item, index) => (
                    <div key={index}>
                      {item.residuals.slice(0, 30).map((v, i) => (
                        <i
                          key={i}
                          style={{
                            left: `${i * 3.1}%`,
                            top: `${48 - Math.max(-38, Math.min(38, v * 16))}%`,
                          }}
                        />
                      ))}
                      <small>r{index + 1}</small>
                    </div>
                  ))}
                </div>
              </>
            )}
          </article>
          <article className="xgb-gain">
            <h2>
              Split-Gain Inspector <Info />
            </h2>
            <p>Candidate Split</p>
            <b>
              {NAMES[root.featureIndex ?? 0]} &lt;{" "}
              {root.threshold?.toFixed(3) ?? "leaf"}
            </b>
            <div className="children">
              <span>
                <b>Left Child</b>N: {left?.samples ?? root.samples}
                <br />
                Score: {left?.value.toFixed(2) ?? root.value.toFixed(2)}
                <br />
                Impurity: {left?.impurity.toFixed(2) ?? root.impurity.toFixed(2)}
              </span>
              <span>
                <b>Right Child</b>N: {right?.samples ?? 0}
                <br />
                Score: {right?.value.toFixed(2) ?? "0.00"}
                <br />
                Impurity: {right?.impurity.toFixed(2) ?? "0.00"}
              </span>
            </div>
            <div className="formula">
              <small>Gain Calculation</small>
              <strong>
                Gain = ½ [ G²L/(HL+λ) + G²R/(HR+λ) − G²/(H+λ) ] − γ
              </strong>
              <p>With λ = {lambda.toFixed(1)}, γ = 0.1</p>
              <b>
                Gain = {root.gain.toFixed(3)}{" "}
                <em>✓ Split {root.gain > 0 ? "Accepted" : "Rejected"}</em>
              </b>
            </div>
            <button
              onClick={() =>
                setToast("Gain rewards useful splits and penalizes complexity")
              }
            >
              What is Gain? ⓘ
            </button>
          </article>
        </section>
        <section className="xgb-diagnostics">
          <article>
            <h2>
              Learning Curve <Info />
            </h2>
            <div className="legend">
              — Train log loss · <span>— Stage accuracy (1−acc scale)</span>
            </div>
            <Sparkline
              train={model.stages.map((s) => s.logLoss)}
              valid={model.stages.map((s) => 1 - s.accuracy)}
            />
            <b>
              Best Iteration <strong>{best}</strong>
            </b>
          </article>
          <article>
            <h2>
              Feature Importance (Gain) <Info />
            </h2>
            {importance.slice(0, 7).map((item) => (
              <div className="imp" key={item.name}>
                <span>{item.name}</span>
                <i>
                  <b style={{ width: `${Math.max(3, item.value * 100)}%` }} />
                </i>
                <em>{item.value.toFixed(3)}</em>
              </div>
            ))}
          </article>
          <article>
            <h2>
              Model Performance <Info />
            </h2>
            <div className="cards">
              <span>
                Acc<b>{report.accuracy.toFixed(3)}</b>
              </span>
              <span>
                F1<b>{report.f1.toFixed(3)}</b>
              </span>
              <span>
                Rec<b>{report.recall.toFixed(3)}</b>
              </span>
            </div>
            <div className="scatter">
              {predictions.slice(0, 90).map((value, index) => (
                <i
                  key={index}
                  style={{
                    left: `${5 + (index / 90) * 90}%`,
                    top: `${Math.max(5, Math.min(91, 50 - (value - y[index]) * 18))}%`,
                  }}
                />
              ))}
              <span />
            </div>
          </article>
        </section>
      </main>
      <aside className="xgb-controls">
        <h3>DATASET</h3>
        <select
          value={dataset}
          onChange={(e) => choose(e.target.value as Dataset)}
        >
          {Object.entries(LABELS).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
        <div>
          <button onClick={() => choose(dataset)}>Switch Dataset</button>
          <button onClick={() => uploadRef.current?.click()}>
            <Upload /> Upload CSV
          </button>
          <input ref={uploadRef} type="file" accept=".csv" onChange={upload} />
        </div>
        <label>
          TARGET
          <input value="Binary class (0/1)" readOnly />
        </label>
        <p>
          TRAIN / VALID SPLIT <span>80% · 20%</span>
        </p>
        <input type="range" value={80} readOnly />
        <hr />
        <h3>MODEL CONTROLS</h3>
        <div className="twocol">
          <label>
            Objective
            <select>
              <option>binary:logistic (educational GBT)</option>
            </select>
          </label>
          <label>
            Metric
            <select
              value={metricName}
              onChange={(event) => setMetricName(event.target.value)}
            >
              <option>logloss</option>
              <option>accuracy</option>
            </select>
          </label>
        </div>
        {slider("Learning Rate (η)", rate, setRate, 0.01, 0.5, 0.01)}
        {slider("Max Depth", depth, setDepth, 1, 10, 1)}
        {slider("Subsample (Rows)", subsample, setSubsample, 0.3, 1, 0.05)}
        {slider("Colsample (Features)", colsample, setColsample, 0.3, 1, 0.05)}
        {slider("Min Child Weight", minChild, setMinChild, 1, 10, 1)}
        {slider("Reg. Lambda (L2)", lambda, setLambda, 0, 5, 0.1)}
        {slider("Reg. Alpha (L1)", alpha, setAlpha, 0, 5, 0.1)}
        {slider("Number of Trees", trees, setTrees, 10, 200, 10)}
        <button
          className="train"
          onClick={() => {
            setTrained("Trained");
            setToast(`Trained ${model.stages.length} trees`);
          }}
        >
          <Play /> {trained === "Trained" ? "Retrain Model" : "Train Model"}
        </button>
        <article>
          <h2>Pipeline Summary</h2>
          {[
            "Gradient boosting on residuals",
            "Shrinkage (η) controls contribution",
            "Row & column subsampling",
            "L1/L2 regularization on leaves",
            "Split by regularized gain",
            "Handles non-linear interactions",
          ].map((item) => (
            <p key={item}>
              <Check /> {item}
            </p>
          ))}
        </article>
      </aside>
      {toast && (
        <button className="xgb-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
