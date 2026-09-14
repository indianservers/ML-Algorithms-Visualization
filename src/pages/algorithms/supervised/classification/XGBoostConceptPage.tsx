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
import { trainXGBoostRegression } from "../../../../lib/algorithms/regression/xgboostRegression";
import "./XGBoostConceptPage.css";

type Row = { features: number[]; target: number };
type Dataset = "california" | "energy" | "housing" | "synthetic" | "imported";
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
const NAMES = [
  "MedInc",
  "HouseAge",
  "AveRooms",
  "AveBedrms",
  "Population",
  "AveOccup",
  "Latitude",
  "Longitude",
];
const LABELS: Record<Dataset, string> = {
  california: "California Housing (Regression)",
  energy: "Energy Efficiency",
  housing: "Compact Housing",
  synthetic: "Synthetic Nonlinear",
  imported: "Imported Dataset",
};
const noise = (i: number, k: number) => Math.sin(i * 91.73 * k) * 0.5 + 0.5;
function makeRows(kind: Exclude<Dataset, "imported">, count = 320): Row[] {
  return Array.from({ length: count }, (_, i) => {
    const a = noise(i + 1, 1.1),
      b = noise(i + 3, 1.7),
      c = noise(i + 5, 2.3),
      d = noise(i + 9, 3.1);
    const features =
      kind === "energy"
        ? [
            a * 1.2,
            b * 50,
            c * 8,
            d * 4,
            a * 500,
            b * 5,
            30 + c * 20,
            -120 + d * 10,
          ]
        : [
            0.6 + a * 7.5,
            4 + b * 46,
            2.2 + c * 6,
            0.7 + d * 1.2,
            250 + a * 4300,
            1.2 + b * 4,
            32 + c * 10,
            -124 + d * 10,
          ];
    let target =
      0.35 +
      features[0] * 0.42 +
      Math.sin(features[2]) * 0.35 -
      features[5] * 0.08 +
      (noise(i, 4.3) - 0.5) * 0.32;
    if (kind === "housing")
      target =
        0.6 + features[0] * 0.3 + features[2] * 0.12 - features[1] * 0.006;
    if (kind === "synthetic")
      target =
        1.2 +
        Math.sin(features[0]) +
        0.07 * features[2] ** 2 -
        0.16 * features[5];
    if (kind === "energy")
      target = 8 + features[1] * 0.28 + features[2] * 1.4 - features[3] * 0.6;
    return { features, target };
  });
}
const BUILT = {
  california: makeRows("california"),
  energy: makeRows("energy", 168),
  housing: makeRows("housing", 150),
  synthetic: makeRows("synthetic", 280),
};
const metrics = (actual: number[], predicted: number[]) => {
  const average = actual.reduce((s, v) => s + v, 0) / actual.length,
    mse =
      actual.reduce((s, v, i) => s + (v - predicted[i]) ** 2, 0) /
      actual.length,
    mae =
      actual.reduce((s, v, i) => s + Math.abs(v - predicted[i]), 0) /
      actual.length,
    total = actual.reduce((s, v) => s + (v - average) ** 2, 0) || 1;
  return { rmse: Math.sqrt(mse), mae, r2: 1 - (mse * actual.length) / total };
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
    [dataset, setDataset] = useState<Dataset>("california"),
    [rows, setRows] = useState<Row[]>(BUILT.california),
    [imported, setImported] = useState<Row[]>([]);
  const [rate, setRate] = useState(0.1),
    [depth, setDepth] = useState(6),
    [subsample, setSubsample] = useState(0.8),
    [colsample, setColsample] = useState(0.8),
    [minChild, setMinChild] = useState(1),
    [lambda, setLambda] = useState(1),
    [alpha, setAlpha] = useState(0),
    [trees, setTrees] = useState(60);
  const [trained, setTrained] = useState("Ready"),
    [toast, setToast] = useState(""),
    [light, setLight] = useState(false),
    [metricName, setMetricName] = useState("RMSE"),
    [query, setQuery] = useState(BUILT.california[0].features.slice());
  const uploadRef = useRef<HTMLInputElement>(null),
    X = useMemo(() => rows.map((r) => r.features), [rows]),
    y = useMemo(() => rows.map((r) => r.target), [rows]);
  const model = useMemo(
    () =>
      trainXGBoostRegression(X, y, {
        estimators: trees,
        learningRate: rate,
        maxDepth: depth,
        subsample,
        colsample,
        minChildWeight: minChild,
        lambda,
        alpha,
        gamma: 0.1,
        validationFraction: 0.2,
        seed: 2026,
      }),
    [X, y, trees, rate, depth, subsample, colsample, minChild, lambda, alpha],
  );
  const predictions = useMemo(() => X.map(model.predict), [X, model]),
    report = metrics(y, predictions),
    root = model.stages[0].tree,
    left = root.left,
    right = root.right;
  const best =
    model.stages.reduce(
      (bestIndex, item, index, all) =>
        item.validationRmse < all[bestIndex].validationRmse ? index : bestIndex,
      0,
    ) + 1;
  const importance = model.featureImportance
    .map((value, index) => ({
      value,
      name: NAMES[index] ?? `Feature ${index + 1}`,
    }))
    .sort((a, b) => b.value - a.value);
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
    choose("california");
    setRate(0.1);
    setDepth(6);
    setSubsample(0.8);
    setColsample(0.8);
    setMinChild(1);
    setLambda(1);
    setAlpha(0);
    setTrees(60);
    setMetricName("RMSE");
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
              Gradient boosting with regularization, shrinkage, and column
              subsampling.
            </p>
          </div>
          <span>
            Lesson Progress{" "}
            <i>
              <b />
            </i>{" "}
            68%
          </span>
          <button onClick={() => setLight(!light)}>
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
                  Predicted value <b>{model.predict(query).toFixed(3)}</b>
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
                Grad: {left?.gradient.toFixed(2) ?? root.gradient.toFixed(2)}
                <br />
                Hess: {left?.hessian.toFixed(2) ?? root.hessian.toFixed(2)}
              </span>
              <span>
                <b>Right Child</b>N: {right?.samples ?? 0}
                <br />
                Grad: {right?.gradient.toFixed(2) ?? "0.00"}
                <br />
                Hess: {right?.hessian.toFixed(2) ?? "0.00"}
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
              — Train RMSE · <span>— Valid RMSE</span>
            </div>
            <Sparkline
              train={model.stages.map((s) => s.trainRmse)}
              valid={model.stages.map((s) => s.validationRmse)}
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
                RMSE<b>{report.rmse.toFixed(3)}</b>
              </span>
              <span>
                MAE<b>{report.mae.toFixed(3)}</b>
              </span>
              <span>
                R²<b>{report.r2.toFixed(3)}</b>
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
          <input value="Median House Value" readOnly />
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
              <option>reg:squarederror</option>
            </select>
          </label>
          <label>
            Metric
            <select
              value={metricName}
              onChange={(event) => setMetricName(event.target.value)}
            >
              <option>RMSE</option>
              <option>MAE</option>
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
