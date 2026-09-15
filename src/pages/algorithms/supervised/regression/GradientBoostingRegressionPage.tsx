import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  Moon,
  Play,
  RefreshCw,
  Sparkles,
  Sun,
  TreePine,
  Upload,
} from "lucide-react";
import {
  energyDemandDataset,
  housingDataset,
} from "../../../../data/sampleDatasets";
import {
  trainGradientBoostingRegression,
  type GradientBoostingRegressionOptions,
} from "../../../../lib/algorithms/regression/gradientBoostingRegression";
import { parseRegressionCsv } from "../../../../lib/algorithms/regression/decisionTreeRegression";
import { mae, rSquared, rmse } from "../../../../lib/math/metrics";
import { splitRegressionData } from "../../../../lib/regression/regressionEval";
import "./GradientBoostingRegressionPage.css";

type BoostRow = { features: number[]; target: number };
type Tab =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
type DatasetId = "california" | "energy" | "housing" | "synthetic" | "imported";
const tabs: Array<[Tab, string]> = [
  ["learn", "Learn"],
  ["visualize", "Visualize"],
  ["dataset", "Dataset"],
  ["train", "Train"],
  ["metrics", "Metrics"],
  ["compare", "Compare"],
  ["explain", "Explain"],
];
const californiaNames = [
  "MedInc",
  "HouseAge",
  "AveRooms",
  "AveBedrms",
  "Population",
  "AveOccup",
  "Latitude",
  "Longitude",
];

function californiaRows() {
  return Array.from({ length: 240 }, (_, index) => {
    const income = 0.7 + ((index * 37) % 1250) / 100,
      age = 1 + ((index * 19) % 52),
      rooms = 2.2 + ((index * 23) % 710) / 100,
      beds = 0.7 + ((index * 11) % 100) / 100,
      population = 160 + ((index * 187) % 4200),
      occupancy = 1.3 + ((index * 29) % 430) / 100,
      latitude = 32.6 + ((index * 17) % 950) / 100,
      longitude = -124.2 + ((index * 13) % 980) / 100;
    const target = Math.max(
      0.5,
      Math.min(
        15,
        1.15 +
          income * 0.59 +
          rooms * 0.31 +
          age * 0.018 -
          beds * 0.29 -
          occupancy * 0.12 +
          Math.sin(index * 0.71) * 1.4 +
          Math.exp(-((longitude + 121.8) ** 2) / 5) * 2.2,
      ),
    );
    return {
      features: [
        income,
        age,
        rooms,
        beds,
        population,
        occupancy,
        latitude,
        longitude,
      ].map((value) => Number(value.toFixed(4))),
      target: Number(target.toFixed(4)),
    };
  });
}
function rowsFromRecords(records: Record<string, unknown>[], target: string) {
  const names = Object.keys(records[0] ?? {}).filter(
    (name) =>
      name !== target &&
      records.every((row) => Number.isFinite(Number(row[name]))),
  );
  return {
    names,
    rows: records.map((record) => ({
      features: names.map((name) => Number(record[name])),
      target: Number(record[target]),
    })),
  };
}
function syntheticRows() {
  return Array.from({ length: 320 }, (_, index) => {
    const x = (index % 80) / 6,
      z = Math.floor(index / 80) + Math.sin(index * 0.33);
    return {
      features: [x, z, Math.sin(x), index % 3],
      target:
        2 +
        x * 0.7 +
        Math.sin(x * 0.85) * 2 +
        z * 0.3 +
        Math.cos(index * 1.7) * 0.8,
    };
  });
}
const datasetMeta = {
  california: {
    name: "California Housing (Sample)",
    target: "MedHouseVal",
    description: "Regression",
  },
  energy: {
    name: "Energy Demand",
    target: "demand_mw",
    description: "Regression",
  },
  housing: {
    name: "Housing Prices",
    target: "price",
    description: "Regression",
  },
  synthetic: {
    name: "Synthetic Residuals",
    target: "target",
    description: "Regression",
  },
};
function makeDataset(id: Exclude<DatasetId, "imported">) {
  if (id === "california")
    return {
      rows: californiaRows(),
      names: californiaNames,
      target: "MedHouseVal",
    };
  if (id === "energy")
    return {
      ...rowsFromRecords(energyDemandDataset.data, "demand_mw"),
      target: "demand_mw",
    };
  if (id === "housing")
    return {
      ...rowsFromRecords(housingDataset.data, "price"),
      target: "price",
    };
  return {
    rows: syntheticRows(),
    names: ["x", "context", "sin(x)", "group"],
    target: "target",
  };
}
function sampleRows(rows: BoostRow[], limit = 160) {
  if (rows.length <= limit) return rows;
  return Array.from(
    { length: limit },
    (_, index) => rows[Math.floor((index / limit) * rows.length)],
  );
}
function fitBoost(
  rows: BoostRow[],
  options: GradientBoostingRegressionOptions,
) {
  const sampled = sampleRows(rows);
  const split = splitRegressionData(
    sampled.map((row) => row.features),
    sampled.map((row) => row.target),
    0.2,
    options.seed,
    true,
  );
  const model = trainGradientBoostingRegression(split.trainX, split.trainY, options);
  const trainPred = split.trainX.map((row) => model.predict(row));
  const testPred = split.testX.map((row) => model.predict(row));
  return {
    model,
    rows: sampled,
    predictions: sampled.map((row) => model.predict(row.features)),
    trainRmse: rmse(split.trainY, trainPred),
    testRmse: rmse(split.testY, testPred),
    rmse: rmse(split.testY, testPred),
    mae: mae(split.testY, testPred),
    r2: rSquared(split.testY, testPred),
    trainR2: rSquared(split.trainY, trainPred),
    testActual: split.testY,
    testPredicted: testPred,
  };
}
function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function Header({
  saved,
  setSaved,
  soft,
  setSoft,
  setTab,
}: {
  saved: boolean;
  setSaved: (value: boolean) => void;
  soft: boolean;
  setSoft: (value: boolean) => void;
  setTab: (tab: Tab) => void;
}) {
  return (
    <header className="gb-header">
      <Link to="/" className="gb-brand">
        <span>〽</span>
        <b>
          Mega ML<small>AI Observatory</small>
        </b>
      </Link>
      <div className="gb-title">
        <h1>Gradient Boosting Regression</h1>
        <p>
          <b>Objective:</b> See how weak trees are added sequentially to correct
          errors (residuals) and build a strong predictive model.
        </p>
      </div>
      <div className="gb-progress">
        <small>Lesson Progress</small>
        <div>
          <i>
            <b />
          </i>
          <strong>67%</strong>
        </div>
      </div>
      <button className="gb-resume" onClick={() => setSaved(!saved)}>
        <Clock3 size={14} />
        {saved ? "Saved for Later" : "Resume Later"}
      </button>
      <button aria-label="Help" onClick={() => setTab("explain")}>
        <Sun size={18} />
      </button>
      <button
        aria-label="Toggle theme contrast"
        aria-pressed={soft}
        onClick={() => setSoft(!soft)}
      >
        <Moon size={18} />
      </button>
    </header>
  );
}

function Sidebar({
  tab,
  setTab,
  auto,
  setAuto,
  collapsed,
  setCollapsed,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  auto: boolean;
  setAuto: (value: boolean) => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}) {
  const items = [
    "What is Gradient Boosting?",
    "Additive Modeling",
    "Sequential Trees",
    "Residuals Explained",
    "Learning Rate",
    "Hyperparameters",
    "Overfitting & Regularization",
    "Working with Real Data",
    "Metrics that Matter",
    "Model Interpretation",
    "Best Practices",
    "Summary",
  ];
  return (
    <aside className="gb-sidebar">
      <header>
        <span>LESSON OUTLINE</span>
        <b>7 / 12</b>
        <button
          aria-label={
            collapsed ? "Expand lesson outline" : "Collapse lesson outline"
          }
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft size={14} />
        </button>
      </header>
      <div className="gb-outline">
        {items.map((item, index) => (
          <button
            key={item}
            className={index === 2 ? "active" : ""}
            aria-current={index === 2 && tab === "learn" ? "step" : undefined}
            onClick={() =>
              index === 2
                ? setTab("learn")
                : setTab(index > 7 ? "metrics" : "visualize")
            }
          >
            <b>{index + 1}</b>
            <span>
              {item}
              {index === 2 && <small>You are here</small>}
            </span>
            {index < 2 && <i>✓</i>}
          </button>
        ))}
        <section>
          <h3>Key Takeaway</h3>
          <p>
            Each new tree focuses on what the current model gets wrong.
            Predictions are the sum of all previous trees.
          </p>
        </section>
      </div>
      <label className="gb-auto">
        <Sparkles size={13} />
        Auto-advance
        <input
          aria-label="Auto advance"
          type="checkbox"
          checked={auto}
          onChange={(event) => setAuto(event.target.checked)}
        />
        <i />
        <Info size={13} />
      </label>
    </aside>
  );
}

function StageChart({
  values,
  color,
  baseline = false,
}: {
  values: number[];
  color: string;
  baseline?: boolean;
}) {
  const min = Math.min(...values),
    max = Math.max(...values);
  const points = values
    .slice(0, 34)
    .map(
      (value, index) =>
        `${8 + index * 4.4},${60 - ((value - min) / (max - min || 1)) * 34}`,
    )
    .join(" ");
  return (
    <svg viewBox="0 0 160 75">
      <path d="M7 63H154" className="gb-axis" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={baseline ? 1.5 : 2.2}
      />
      {values.slice(0, 30).map((value, index) => (
        <circle
          key={index}
          cx={9 + index * 5}
          cy={43 - Math.sin(index * 0.7) * 12 - Math.cos(index * 1.43) * 7}
          r="1.8"
        />
      ))}
    </svg>
  );
}

function ResidualChart({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values.map(Math.abs), 1);
  return (
    <svg viewBox="0 0 145 73">
      <path d="M6 35H139M6 7V67" className="gb-axis" />
      {values.slice(0, 28).map((value, index) => (
        <circle
          key={index}
          cx={9 + index * 4.6}
          cy={35 - (value / max) * 25}
          r="1.8"
          fill={color}
        />
      ))}
    </svg>
  );
}

function BuildUpChart({ result }: { result: ReturnType<typeof fitBoost> }) {
  const colors = ["#1c6dc9", "#0cbecb", "#39bd5b", "#e6ad16", "#ef5963"];
  const rows = result.rows.slice(0, 105);
  const minX = Math.min(...rows.map((row) => row.features[0])),
    maxX = Math.max(...rows.map((row) => row.features[0])),
    minY = Math.min(...rows.map((row) => row.target)),
    maxY = Math.max(...rows.map((row) => row.target));
  const x = (value: number) => 12 + ((value - minX) / (maxX - minX || 1)) * 780,
    y = (value: number) => 105 - ((value - minY) / (maxY - minY || 1)) * 90;
  return (
    <svg viewBox="0 0 980 130" aria-label="Additive prediction build-up">
      <path d="M12 105H792M12 8V105" className="gb-axis" />
      {rows.map((row, index) => (
        <circle
          key={index}
          cx={x(row.features[0])}
          cy={y(row.target)}
          r="1.8"
        />
      ))}
      {[0, 1, 2, 3, 4].map((stage) => {
        const points = [...rows]
          .sort((a, b) => a.features[0] - b.features[0])
          .map(
            (row) =>
              `${x(row.features[0])},${y(result.model.predictAtStage(row.features, Math.min(stage, result.model.stages.length)))}`,
          )
          .join(" ");
        return (
          <polyline
            key={stage}
            points={points}
            fill="none"
            stroke={colors[stage]}
            strokeWidth={stage === 4 ? 2.8 : 1.2}
            opacity={stage === 4 ? 1 : 0.75}
          />
        );
      })}
      <g transform="translate(810 10)">
        {colors.map((color, index) => (
          <g key={color} transform={`translate(0 ${index * 20})`}>
            <line x1="0" y1="0" x2="30" y2="0" stroke={color} />
            <text x="38" y="4">
              Stage {index}
              {index === 4 ? " (Final)" : ""}
            </text>
          </g>
        ))}
      </g>
      <text x="383" y="126">
        Feature (x)
      </text>
    </svg>
  );
}

function LearnPanel({
  result,
  stage,
  names,
}: {
  result: ReturnType<typeof fitBoost>;
  stage: number;
  names: string[];
}) {
  const colors = ["#6280ff", "#12d3db", "#76d743", "#ffc21a", "#ff5c60"];
  const stages = [0, 1, 2, 3, 4];
  const stageRowCount =
    result.model.stages[0]?.predictions.length ?? result.rows.length;
  const sortedIndices = result.rows
    .slice(0, stageRowCount)
    .map((_, index) => index)
    .sort(
      (left, right) =>
        result.rows[left].features[0] - result.rows[right].features[0],
    );
  return (
    <>
      <section className="gb-sequential">
        <h2>
          Sequential Weak Trees Correcting Residuals <Info size={13} />
        </h2>
        <div className="gb-stage-row">
          {stages.map((item, index) => {
            const stageResult = result.model.stages[Math.max(0, item - 1)];
            const values =
              item === 0
                ? result.rows.map(() => result.model.baseline)
                : sortedIndices.map(
                    (rowIndex) =>
                      (stageResult?.predictions ?? result.predictions)[
                        rowIndex
                      ],
                  );
            return (
              <div
                className={`gb-stage-card${stage === item ? " selected" : ""}`}
                key={item}
              >
                <header>
                  <b>Stage {item}</b>
                  <span>{item === 0 ? "Baseline (Mean)" : `Tree ${item}`}</span>
                </header>
                <StageChart
                  values={values}
                  color={colors[index]}
                  baseline={item === 0}
                />
                <footer style={{ borderColor: colors[index] }}>
                  <strong>{item === 0 ? "𝓕₀(x)" : `νh${item}(x)`}</strong>
                  <span>
                    {item === 0
                      ? `Mean = ${result.model.baseline.toFixed(2)}`
                      : `ν = ${result.model.learningRate.toFixed(2)}`}
                  </span>
                </footer>
                {index < 4 && <i>+</i>}
              </div>
            );
          })}
        </div>
        <div className="gb-formula">
          <b>Final Prediction</b>
          <strong>ŷ(x) = F₀(x) + ∑ νhₘ(x)</strong>
          <span>
            hₘ(x) = weak learner (decision tree)
            <br />
            ν = learning rate
            <br />M = number of estimators (trees)
          </span>
        </div>
      </section>
      <section className="gb-residuals">
        <h2>
          Residuals After Each Stage <Info size={13} />
          <span>Better ⟶</span>
        </h2>
        <div>
          {stages.map((item, index) => {
            const values =
              item === 0
                ? result.rows.map((row) => row.target - result.model.baseline)
                : (result.model.stages[
                    Math.min(item - 1, result.model.stages.length - 1)
                  ]?.residualsBefore ?? []);
            const error =
              item === 0
                ? rmse(
                    result.rows.map((row) => row.target),
                    result.rows.map(() => result.model.baseline),
                  )
                : (result.model.stages[
                    Math.min(item - 1, result.model.stages.length - 1)
                  ]?.trainRmse ?? result.rmse);
            return (
              <article key={item}>
                <ResidualChart values={values} color={colors[index]} />
                <b style={{ color: colors[index] }}>RMSE: {error.toFixed(3)}</b>
                {index < 4 && <i>→</i>}
              </article>
            );
          })}
        </div>
      </section>
      <section className="gb-build">
        <h2>
          Additive Prediction Build-Up <Info size={13} />
        </h2>
        <BuildUpChart result={result} />
      </section>
      <Summary result={result} names={names} />
    </>
  );
}

function Summary({
  result,
  names,
}: {
  result: ReturnType<typeof fitBoost>;
  names: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const sorted = result.model.featureImportance
    .map((value, index) => ({
      name: names[index] ?? `Feature ${index + 1}`,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, showAll ? names.length : 5);
  return (
    <section className="gb-summary">
      <article>
        <h3>
          Performance (Final Stage) <Info size={12} />
        </h3>
        <div className="gb-metrics">
          <span>
            RMSE<b>{result.rmse.toFixed(3)}</b>
          </span>
          <span>
            MAE<b>{result.mae.toFixed(3)}</b>
          </span>
          <span>
            R²<b>{result.r2.toFixed(3)}</b>
          </span>
          <span>
            MAPE
            <b>
              {(
                result.mae /
                Math.max(
                  0.1,
                  mean(result.rows.map((row) => Math.abs(row.target))) * 100,
                )
              ).toFixed(2)}
              %
            </b>
          </span>
        </div>
      </article>
      <article>
        <h3>Model Summary</h3>
        <dl>
          <dt>Estimators (Trees)</dt>
          <dd>{result.model.stages.length}</dd>
          <dt>Learning Rate (ν)</dt>
          <dd>{result.model.learningRate.toFixed(2)}</dd>
          <dt>Max Depth</dt>
          <dd>{result.model.maxDepth}</dd>
          <dt>Train RMSE (Final)</dt>
          <dd>{result.rmse.toFixed(3)}</dd>
        </dl>
      </article>
      <article>
        <h3>
          Feature Importance <Info size={12} />
        </h3>
        {sorted.map((item) => (
          <label key={item.name}>
            <span>{item.name}</span>
            <i>
              <b style={{ width: `${item.value * 100}%` }} />
            </i>
            <strong>{item.value.toFixed(3)}</strong>
          </label>
        ))}
        <button onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Show Top Features" : "View All Features"}
        </button>
      </article>
      <article>
        <h3>What Just Happened?</h3>
        {[
          "Started with a constant prediction (mean).",
          "Each tree learned the residuals (errors) of the current model.",
          "New trees are added with a small learning rate.",
          "Predictions are the sum of all trees.",
          "Errors shrink stage by stage.",
        ].map((text) => (
          <p key={text}>
            <Check size={10} />
            {text}
          </p>
        ))}
      </article>
    </section>
  );
}

function DatasetPanel({
  rows,
  names,
  target,
  edit,
  add,
  remove,
  upload,
}: {
  rows: BoostRow[];
  names: string[];
  target: string;
  edit: (row: number, column: number | "target", value: number) => void;
  add: () => void;
  remove: () => void;
  upload: () => void;
}) {
  return (
    <section className="gb-panel">
      <header>
        <div>
          <h2>Dataset Workspace</h2>
          <p>Edit training values and rebuild every residual stage.</p>
        </div>
        <div>
          <button onClick={upload}>
            <Upload size={13} /> Import CSV
          </button>
          <button onClick={add}>+ Add Row</button>
          <button onClick={remove}>− Remove Last</button>
        </div>
      </header>
      <div className="gb-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              {names.map((name) => (
                <th key={name}>{name}</th>
              ))}
              <th>{target}</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>{rowIndex + 1}</td>
                {row.features.map((value, column) => (
                  <td key={column}>
                    <input
                      aria-label={`Row ${rowIndex + 1} ${names[column]}`}
                      type="number"
                      value={Number(value.toFixed(4))}
                      onChange={(event) =>
                        edit(rowIndex, column, Number(event.target.value))
                      }
                    />
                  </td>
                ))}
                <td>
                  <input
                    aria-label={`Row ${rowIndex + 1} ${target}`}
                    type="number"
                    value={Number(row.target.toFixed(4))}
                    onChange={(event) =>
                      edit(rowIndex, "target", Number(event.target.value))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GenericPanel({
  tab,
  result,
  names,
  inputs,
  setInputs,
  training,
  trained,
  train,
}: {
  tab: Exclude<Tab, "learn" | "dataset">;
  result: ReturnType<typeof fitBoost>;
  names: string[];
  inputs: number[];
  setInputs: (value: number[]) => void;
  training: boolean;
  trained: boolean;
  train: () => void;
}) {
  if (tab === "visualize")
    return (
      <section className="gb-panel">
        <h2>Stage-by-Stage Prediction Explorer</h2>
        <BuildUpChart result={result} />
        <div className="gb-large-residual">
          <ResidualChart
            values={result.model.stages.at(-1)?.residualsBefore ?? []}
            color="#8159f1"
          />
          <Summary result={result} names={names} />
        </div>
      </section>
    );
  if (tab === "train")
    return (
      <section className="gb-panel gb-train-panel">
        <TreePine size={46} />
        <h2>
          {trained
            ? "✓ Boosting training complete"
            : "Train the Additive Model"}
        </h2>
        <p>
          Each stage fits a CART tree to the residuals left by all previous
          stages.
        </p>
        <button onClick={train} disabled={training}>
          <Play size={14} />
          {training ? "Training…" : trained ? "Train Again" : "Train Model"}
        </button>
        <div>
          <span>
            Training rows <b>{result.rows.length}</b>
          </span>
          <span>
            Stages <b>{result.model.stages.length}</b>
          </span>
          <span>
            Final RMSE <b>{result.rmse.toFixed(3)}</b>
          </span>
        </div>
      </section>
    );
  if (tab === "metrics")
    return (
      <section className="gb-panel">
        <h2>Training and Validation Metrics</h2>
        <Summary result={result} names={names} />
        <div className="gb-loss-list">
          {result.model.stages.map((item, index) => (
            <span key={index}>
              Stage {index + 1}
              <b>{item.trainRmse.toFixed(4)}</b>
              <i
                style={{
                  width: `${Math.max(4, (item.trainRmse / (result.model.stages[0]?.trainRmse || 1)) * 100)}%`,
                }}
              />
            </span>
          ))}
        </div>
      </section>
    );
  if (tab === "compare")
    return (
      <section className="gb-panel">
        <h2>Model Comparison</h2>
        <div className="gb-compare">
          {[
            [
              "Baseline",
              Math.sqrt(
                mean(
                  result.rows.map(
                    (row) => (row.target - result.model.baseline) ** 2,
                  ),
                ),
              ),
            ],
            ["First Tree", result.model.stages[0]?.trainRmse ?? result.rmse],
            ["Boosted Model", result.rmse],
          ].map(([name, value], index) => (
            <article key={String(name)}>
              <TreePine size={40} />
              <h3>{name}</h3>
              <strong>RMSE {Number(value).toFixed(3)}</strong>
              <i>
                <b style={{ width: `${Math.max(8, 100 - index * 35)}%` }} />
              </i>
            </article>
          ))}
        </div>
      </section>
    );
  const stageValues = [
    result.model.baseline,
    ...result.model.stages.map((_, index) =>
      result.model.predictAtStage(inputs, index + 1),
    ),
  ];
  return (
    <section className="gb-panel">
      <h2>Live Boosted Inference</h2>
      <p>
        Edit one observation and inspect how each weak learner adds to its
        prediction.
      </p>
      <div className="gb-inference">
        <div>
          {names.map((name, index) => (
            <label key={name}>
              {name}
              <input
                aria-label={`Prediction ${name}`}
                type="number"
                value={Number((inputs[index] ?? 0).toFixed(3))}
                onChange={(event) => {
                  const next = [...inputs];
                  next[index] = Number(event.target.value);
                  setInputs(next);
                }}
              />
            </label>
          ))}
        </div>
        <aside>
          <small>Final prediction</small>
          <strong>{stageValues.at(-1)?.toFixed(3)}</strong>
          {stageValues.map((value, index) => (
            <span key={index}>
              Stage {index}
              <b>{value.toFixed(3)}</b>
            </span>
          ))}
        </aside>
      </div>
    </section>
  );
}

function Controls({
  datasetId,
  selectDataset,
  rows,
  names,
  target,
  estimators,
  setEstimators,
  learningRate,
  setLearningRate,
  maxDepth,
  setMaxDepth,
  subsample,
  setSubsample,
  early,
  setEarly,
  validation,
  setValidation,
  reset,
  upload,
  stage,
  setStage,
  showTree,
  setShowTree,
}: {
  datasetId: DatasetId;
  selectDataset: (id: Exclude<DatasetId, "imported">) => void;
  rows: BoostRow[];
  names: string[];
  target: string;
  estimators: number;
  setEstimators: (value: number) => void;
  learningRate: number;
  setLearningRate: (value: number) => void;
  maxDepth: number;
  setMaxDepth: (value: number) => void;
  subsample: number;
  setSubsample: (value: number) => void;
  early: boolean;
  setEarly: (value: boolean) => void;
  validation: number;
  setValidation: (value: number) => void;
  reset: () => void;
  upload: () => void;
  stage: number;
  setStage: (value: number) => void;
  showTree: boolean;
  setShowTree: (value: boolean) => void;
}) {
  return (
    <aside className="gb-controls">
      <section>
        <h2>
          Dataset <Info size={12} />
        </h2>
        <select
          aria-label="Dataset selector"
          value={datasetId}
          onChange={(event) =>
            selectDataset(event.target.value as Exclude<DatasetId, "imported">)
          }
        >
          {datasetId === "imported" && (
            <option value="imported">Imported CSV</option>
          )}
          {Object.entries(datasetMeta).map(([id, meta]) => (
            <option value={id} key={id}>
              {meta.name}
            </option>
          ))}
        </select>
        <p>
          {rows.length.toLocaleString()} rows • {names.length} features •{" "}
          {datasetId === "imported"
            ? target
            : datasetMeta[datasetId].description}
        </p>
        <div>
          <button
            onClick={() =>
              selectDataset(
                datasetId === "california" ? "energy" : "california",
              )
            }
          >
            <RefreshCw size={13} />
            Switch Dataset
          </button>
          <button onClick={upload}>
            <Upload size={13} />
            Upload CSV
          </button>
        </div>
      </section>
      <section>
        <h2>
          Model Controls <Info size={12} />
        </h2>
        <label>
          <span>
            Number of Estimators (Trees)
            <input
              aria-label="Number of estimators value"
              type="number"
              min="1"
              max="200"
              value={estimators}
              onChange={(event) => setEstimators(Number(event.target.value))}
            />
          </span>
          <input
            aria-label="Number of estimators"
            type="range"
            min="1"
            max="200"
            value={estimators}
            onChange={(event) => setEstimators(Number(event.target.value))}
          />
          <small>
            <i>1</i>
            <i>200</i>
          </small>
        </label>
        <label>
          <span>
            Learning Rate (ν)
            <input
              aria-label="Learning rate value"
              type="number"
              min=".01"
              max="1"
              step=".01"
              value={learningRate}
              onChange={(event) => setLearningRate(Number(event.target.value))}
            />
          </span>
          <input
            aria-label="Learning rate"
            type="range"
            min=".01"
            max="1"
            step=".01"
            value={learningRate}
            onChange={(event) => setLearningRate(Number(event.target.value))}
          />
          <small>
            <i>0.01</i>
            <i>1.00</i>
          </small>
        </label>
        <label>
          <span>
            Max Depth <Info size={11} />
            <input
              aria-label="Maximum depth value"
              type="number"
              min="1"
              max="10"
              value={maxDepth}
              onChange={(event) => setMaxDepth(Number(event.target.value))}
            />
          </span>
          <input
            aria-label="Maximum depth"
            type="range"
            min="1"
            max="10"
            value={maxDepth}
            onChange={(event) => setMaxDepth(Number(event.target.value))}
          />
          <small>
            <i>1</i>
            <i>10</i>
          </small>
        </label>
        <label>
          <span>
            Subsample
            <input
              aria-label="Subsample value"
              type="number"
              min=".1"
              max="1"
              step=".05"
              value={subsample}
              onChange={(event) => setSubsample(Number(event.target.value))}
            />
          </span>
          <input
            aria-label="Subsample"
            type="range"
            min=".1"
            max="1"
            step=".05"
            value={subsample}
            onChange={(event) => setSubsample(Number(event.target.value))}
          />
          <small>
            <i>0.10</i>
            <i>1.00</i>
          </small>
        </label>
        <label className="gb-check">
          <input
            aria-label="Use early stopping"
            type="checkbox"
            checked={early}
            onChange={(event) => setEarly(event.target.checked)}
          />
          Use Early Stopping
        </label>
        <label>
          <span>
            Validation Fraction
            <input
              aria-label="Validation fraction"
              type="number"
              min=".05"
              max=".4"
              step=".05"
              value={validation}
              onChange={(event) => setValidation(Number(event.target.value))}
            />
          </span>
        </label>
        <button className="gb-reset" onClick={reset}>
          <RefreshCw size={14} />
          Reset Model
        </button>
      </section>
      <section className="gb-explorer">
        <h2>
          Stage Explorer <Info size={12} />
        </h2>
        <div>
          <span>Go to Stage</span>
          <select
            aria-label="Go to stage"
            value={stage}
            onChange={(event) => setStage(Number(event.target.value))}
          >
            {Array.from({ length: estimators + 1 }, (_, index) => (
              <option value={index} key={index}>
                {index}
                {index === estimators ? " (Final)" : ""}
              </option>
            ))}
          </select>
          <button
            aria-label="Previous stage"
            onClick={() => setStage(Math.max(0, stage - 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Next stage"
            onClick={() => setStage(Math.min(estimators, stage + 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <label>
          Highlight Contribution
          <select
            aria-label="Highlight contribution"
            value={stage}
            onChange={(event) => setStage(Number(event.target.value))}
          >
            {Array.from({ length: estimators }, (_, index) => (
              <option value={index + 1} key={index}>
                Tree {index + 1} (νh{index + 1}(x))
              </option>
            ))}
          </select>
        </label>
        <label className="gb-tree-toggle">
          <TreePine size={14} />
          Show Tree Structure
          <input
            aria-label="Show tree structure"
            type="checkbox"
            checked={showTree}
            onChange={(event) => setShowTree(event.target.checked)}
          />
          <i />
        </label>
        {showTree && (
          <div className="gb-mini-tree">
            ●<br />
            ╱ ╲
            <br />● {"  "} ●
          </div>
        )}
      </section>
    </aside>
  );
}

export default function GradientBoostingRegressionPage() {
  const initial = useMemo(() => makeDataset("california"), []);
  const [tab, setTab] = useState<Tab>("learn"),
    [datasetId, setDatasetId] = useState<DatasetId>("california"),
    [rows, setRows] = useState(initial.rows),
    [names, setNames] = useState(initial.names),
    [target, setTarget] = useState(initial.target);
  const [estimators, setEstimators] = useState(4),
    [learningRate, setLearningRate] = useState(0.1),
    [maxDepth, setMaxDepth] = useState(3),
    [subsample, setSubsample] = useState(1),
    [early, setEarly] = useState(true),
    [validation, setValidation] = useState(0.2);
  const [trainedOptions, setTrainedOptions] = useState({
    estimators: 4,
    learningRate: 0.1,
    maxDepth: 3,
    subsample: 1,
    early: true,
    validation: 0.2,
  });
  const [stage, setStage] = useState(4),
    [showTree, setShowTree] = useState(false),
    [auto, setAuto] = useState(true),
    [collapsed, setCollapsed] = useState(false),
    [soft, setSoft] = useState(false),
    [saved, setSaved] = useState(false),
    [training, setTraining] = useState(false),
    [trained, setTrained] = useState(false),
    [inputs, setInputs] = useState(initial.rows[0].features);
  const fileRef = useRef<HTMLInputElement>(null);
  const options = useMemo<GradientBoostingRegressionOptions>(
    () => ({
      estimators: trainedOptions.estimators,
      learningRate: trainedOptions.learningRate,
      maxDepth: trainedOptions.maxDepth,
      minSamplesLeaf: 4,
      subsample: trainedOptions.subsample,
      seed: 42,
      validationFraction: trainedOptions.validation,
      earlyStopping: trainedOptions.early,
      patience: 10,
    }),
    [trainedOptions],
  );
  const result = useMemo(() => fitBoost(rows, options), [rows, options]);
  const selectDataset = (id: Exclude<DatasetId, "imported">) => {
    const next = makeDataset(id);
    setDatasetId(id);
    setRows(next.rows);
    setNames(next.names);
    setTarget(next.target);
    setInputs(next.rows[0].features);
    setTrained(false);
  };
  const train = () => {
    setTraining(true);
    window.setTimeout(() => {
      setTrainedOptions({
        estimators,
        learningRate,
        maxDepth,
        subsample,
        early,
        validation,
      });
      setStage(estimators);
      setTraining(false);
      setTrained(true);
    }, 400);
  };
  const reset = () => {
    setEstimators(4);
    setLearningRate(0.1);
    setMaxDepth(3);
    setSubsample(1);
    setEarly(true);
    setValidation(0.2);
    setTrainedOptions({
      estimators: 4,
      learningRate: 0.1,
      maxDepth: 3,
      subsample: 1,
      early: true,
      validation: 0.2,
    });
    setStage(4);
    setShowTree(false);
    selectDataset("california");
  };
  const edit = (rowIndex: number, column: number | "target", value: number) => {
    setRows((current) =>
      current.map((row, index) =>
        index !== rowIndex
          ? row
          : column === "target"
            ? { ...row, target: value }
            : {
                ...row,
                features: row.features.map((feature, i) =>
                  i === column ? value : feature,
                ),
              },
      ),
    );
    setTrained(false);
  };
  const importCsv = async (file: File) => {
    const parsed = parseRegressionCsv(await file.text());
    if (!parsed) return;
    setDatasetId("imported");
    setRows(parsed.rows);
    setNames(parsed.headers.slice(0, -1));
    setTarget(parsed.headers.at(-1) ?? "target");
    setInputs(parsed.rows[0].features);
    setTab("dataset");
    setTrained(false);
  };
  return (
    <div
      className={`gb-shell${soft ? " soft-theme" : ""}${collapsed ? " collapsed" : ""}`}
    >
      <Header
        saved={saved}
        setSaved={setSaved}
        soft={soft}
        setSoft={setSoft}
        setTab={setTab}
      />
      <Sidebar
        tab={tab}
        setTab={setTab}
        auto={auto}
        setAuto={setAuto}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div className="gb-body">
        <main>
          <nav className="gb-tabs">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="gb-content">
            {tab === "learn" ? (
              <LearnPanel
                result={result}
                stage={Math.min(stage, result.model.stages.length)}
                names={names}
              />
            ) : tab === "dataset" ? (
              <DatasetPanel
                rows={rows}
                names={names}
                target={target}
                edit={edit}
                add={() => {
                  setRows((current) => [
                    ...current,
                    { features: Array(names.length).fill(0), target: 0 },
                  ]);
                  setTrained(false);
                }}
                remove={() => {
                  if (rows.length > 4) {
                    setRows((current) => current.slice(0, -1));
                    setTrained(false);
                  }
                }}
                upload={() => fileRef.current?.click()}
              />
            ) : (
              <GenericPanel
                tab={tab}
                result={result}
                names={names}
                inputs={inputs}
                setInputs={setInputs}
                training={training}
                trained={trained}
                train={train}
              />
            )}
          </div>
        </main>
        <Controls
          datasetId={datasetId}
          selectDataset={selectDataset}
          rows={rows}
          names={names}
          target={target}
          estimators={estimators}
          setEstimators={setEstimators}
          learningRate={learningRate}
          setLearningRate={setLearningRate}
          maxDepth={maxDepth}
          setMaxDepth={setMaxDepth}
          subsample={subsample}
          setSubsample={setSubsample}
          early={early}
          setEarly={setEarly}
          validation={validation}
          setValidation={setValidation}
          reset={reset}
          upload={() => fileRef.current?.click()}
          stage={stage}
          setStage={setStage}
          showTree={showTree}
          setShowTree={setShowTree}
        />
      </div>
      <input
        ref={fileRef}
        hidden
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importCsv(file);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
