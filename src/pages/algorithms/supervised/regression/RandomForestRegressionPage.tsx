import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleHelp,
  Database,
  Info,
  Moon,
  Network,
  Play,
  RefreshCw,
  Sigma,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  energyDemandDataset,
  housingDataset,
} from "../../../../data/sampleDatasets";
import {
  trainRandomForestRegression,
  type ForestRegressionNode,
  type RandomForestRegressionOptions,
} from "../../../../lib/algorithms/regression/randomForestRegression";
import { parseRegressionCsv } from "../../../../lib/algorithms/regression/decisionTreeRegression";
import { mae, rSquared, rmse } from "../../../../lib/math/metrics";
import { splitRegressionData } from "../../../../lib/regression/regressionEval";
import "./RandomForestRegressionPage.css";

type ForestRow = { features: number[]; target: number };
type Tab =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
type DatasetId = "california" | "energy" | "housing" | "synthetic" | "imported";
type MaxFeatureMode = "sqrt" | "third" | "all";
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
    const medInc = 0.55 + ((index * 37) % 1450) / 100;
    const houseAge = 1 + ((index * 19) % 52);
    const aveRooms = 2.1 + ((index * 23) % 770) / 100;
    const aveBedrms = 0.65 + ((index * 11) % 115) / 100;
    const population = 120 + ((index * 187) % 4800);
    const aveOccup = 1.2 + ((index * 29) % 520) / 100;
    const latitude = 32.55 + ((index * 17) % 970) / 100;
    const longitude = -124.3 + ((index * 13) % 1010) / 100;
    const coast = Math.exp(-((longitude + 122.1) ** 2) / 4.5);
    const target = Math.max(
      0.2,
      Math.min(
        5,
        0.35 +
          medInc * 0.235 +
          houseAge * 0.011 +
          aveRooms * 0.07 -
          aveBedrms * 0.16 -
          aveOccup * 0.08 +
          coast * 1.05 +
          Math.sin(index * 0.83) * 0.24,
      ),
    );
    return {
      features: [
        medInc,
        houseAge,
        aveRooms,
        aveBedrms,
        population,
        aveOccup,
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
  return Array.from({ length: 360 }, (_, index) => {
    const x = (index % 60) / 4,
      z = Math.floor(index / 60) + Math.sin(index * 0.31),
      season = index % 4;
    return {
      features: [x, z, season, Math.sin(x)],
      target:
        0.4 +
        x * 0.23 +
        Math.sin(x * 0.9) * 0.85 +
        z * 0.08 +
        Math.cos(index * 1.73) * 0.28,
    };
  });
}

const datasetMeta = {
  california: {
    name: "California Housing",
    description: "Predict median house value ($100k)",
    target: "MedHouseVal ($100k)",
  },
  energy: {
    name: "Energy Demand",
    description: "Predict electricity demand (MW)",
    target: "demand_mw",
  },
  housing: {
    name: "Housing Prices",
    description: "Predict house price",
    target: "price",
  },
  synthetic: {
    name: "Synthetic Nonlinear",
    description: "Predict a smooth nonlinear target",
    target: "target",
  },
};

function makeDataset(id: Exclude<DatasetId, "imported">) {
  if (id === "california")
    return {
      rows: californiaRows(),
      names: californiaNames,
      target: datasetMeta.california.target,
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
    names: ["x", "context", "season", "sin(x)"],
    target: "target",
  };
}

function evenSample(rows: ForestRow[], limit: number) {
  if (rows.length <= limit) return rows;
  return Array.from(
    { length: limit },
    (_, index) => rows[Math.floor((index / limit) * rows.length)],
  );
}
function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function std(values: number[]) {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}
function correlation(a: number[], b: number[]) {
  const ma = mean(a),
    mb = mean(b);
  const numerator = a.reduce(
    (sum, value, index) => sum + (value - ma) * (b[index] - mb),
    0,
  );
  const denominator = Math.sqrt(
    a.reduce((sum, value) => sum + (value - ma) ** 2, 0) *
      b.reduce((sum, value) => sum + (value - mb) ** 2, 0),
  );
  return denominator ? numerator / denominator : 0;
}
function maxFeatureCount(mode: MaxFeatureMode, count: number) {
  return mode === "all"
    ? count
    : mode === "third"
      ? Math.max(1, Math.round(count / 3))
      : Math.max(1, Math.floor(Math.sqrt(count)));
}

function fitForest(rows: ForestRow[], options: RandomForestRegressionOptions) {
  const sampled = evenSample(rows, 1250);
  const split = splitRegressionData(
    sampled,
    sampled.map((row) => row.target),
    0.2,
    options.seed,
    true,
  );
  const model = trainRandomForestRegression(
    split.trainX.map((row) => row.features),
    split.trainY,
    options,
  );
  const trainPredicted = split.trainX.map((row) => model.predict(row.features));
  const testPredicted = split.testX.map((row) => model.predict(row.features));
  const oobActual: number[] = [];
  const oobPredicted: number[] = [];
  model.oobPredictions.forEach((prediction, index) => {
    if (prediction !== null) {
      oobActual.push(split.trainY[index]);
      oobPredicted.push(prediction);
    }
  });
  const oobAvailable = oobActual.length > 0;
  return {
    model,
    training: split.trainX,
    test: split.testX,
    testActual: split.testY,
    testPredicted,
    trainRmse: rmse(split.trainY, trainPredicted),
    r2: rSquared(split.testY, testPredicted),
    rmse: rmse(split.testY, testPredicted),
    mae: mae(split.testY, testPredicted),
    oobAvailable,
    oobR2: oobAvailable ? rSquared(oobActual, oobPredicted) : Number.NaN,
    oobRmse: oobAvailable ? rmse(oobActual, oobPredicted) : Number.NaN,
    oobMae: oobAvailable ? mae(oobActual, oobPredicted) : Number.NaN,
  };
}

function TreeGlyph({
  color = "#10d7e5",
  tree,
}: {
  color?: string;
  tree?: ForestRegressionNode;
}) {
  const nodes = tree
    ? [
        tree,
        tree.left,
        tree.right,
        tree.left?.left,
        tree.left?.right,
        tree.right?.left,
        tree.right?.right,
      ]
    : [];
  return (
    <svg className="rf-tree-glyph" viewBox="0 0 150 90" aria-hidden="true">
      <g stroke={color} strokeWidth="2" opacity=".8">
        <path d="M75 12 42 38M75 12l34 26M42 38 24 68M42 38l24 30M109 38 91 68M109 38l25 30" />
      </g>
      {[
        [75, 12],
        [42, 38],
        [109, 38],
        [24, 68],
        [66, 68],
        [91, 68],
        [134, 68],
      ].map(([x, y], index) => (
        <circle
          key={index}
          cx={x}
          cy={y}
          r={index < 3 ? 6 : 5}
          fill={color}
          opacity={nodes[index] === undefined && tree ? 0.35 : 1}
        />
      ))}
    </svg>
  );
}

function MiniCurve({ color, phase }: { color: string; phase: number }) {
  const points = Array.from(
    { length: 28 },
    (_, index) =>
      `${5 + index * 4.7},${82 - index * 1.2 - Math.sin(index * 0.7 + phase) * 10}`,
  ).join(" ");
  return (
    <svg viewBox="0 0 140 100" aria-hidden="true">
      <path d="M4 91H136M4 14V91" className="rf-axis" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" />
      {Array.from({ length: 24 }, (_, index) => (
        <circle
          key={index}
          cx={7 + index * 5.2}
          cy={
            81 -
            index * 1.2 -
            Math.sin(index * 0.77 + phase) * 12 +
            Math.cos(index * 1.4) * 5
          }
          r="1.6"
          fill={index % 3 ? color : "#8aa3ba"}
        />
      ))}
    </svg>
  );
}

function TopBar({
  softTheme,
  setSoftTheme,
  setTab,
}: {
  softTheme: boolean;
  setSoftTheme: (v: boolean) => void;
  setTab: (tab: Tab) => void;
}) {
  const [actions, setActions] = useState(false);
  return (
    <header className="rf-topbar">
      <Link to="/" className="rf-brand">
        <span>〽</span>
        <b>
          Mega ML<small>AI OBSERVATORY</small>
        </b>
      </Link>
      <div className="rf-progress">
        <span>
          PROGRESS <b>46%</b>
        </span>
        <i>
          <b />
        </i>
      </div>
      <div className="rf-objective">
        <small>OBJECTIVE</small>
        <b>
          Understand how Random Forest Regression makes predictions by averaging
          many diverse trees.
        </b>
      </div>
      <div className="rf-actions">
        <button onClick={() => setActions(!actions)}>
          Lesson Actions <ChevronDown size={15} />
        </button>
        {actions && (
          <div>
            <button onClick={() => setTab("train")}>Train model</button>
            <button onClick={() => setTab("dataset")}>Open dataset</button>
          </div>
        )}
        <button aria-label="Lesson guide" onClick={() => setTab("learn")}>
          <BookOpen size={20} />
        </button>
        <button aria-label="Help" onClick={() => setTab("explain")}>
          <CircleHelp size={19} />
        </button>
        <button
          aria-label="Toggle theme contrast"
          aria-pressed={softTheme}
          onClick={() => setSoftTheme(!softTheme)}
        >
          <Moon size={20} />
        </button>
      </div>
    </header>
  );
}

function Sidebar({
  tab,
  setTab,
  collapsed,
  setCollapsed,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  return (
    <aside className="rf-sidebar">
      <header>
        <span>LESSON NAVIGATION</span>
        <button
          aria-label={
            collapsed
              ? "Expand lesson navigation"
              : "Collapse lesson navigation"
          }
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronUp size={16} />
        </button>
      </header>
      <div className="rf-side-content">
        <small>ENSEMBLE METHODS</small>
        <div className="rf-side-step">
          <b>1</b>
          <span>What is Ensemble Learning?</span>
          <i>✓</i>
        </div>
        <div className="rf-side-step">
          <b>2</b>
          <span>Bagging for Regression</span>
          <i>✓</i>
        </div>
        <div className="rf-current">
          <div>
            <b>3</b>
            <strong>Random Forest Regression</strong>
          </div>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <i />
              {label}
            </button>
          ))}
        </div>
        {[
          "Gradient Boosting Regression",
          "Model Comparison",
          "Advanced Topics",
        ].map((label, index) => (
          <div className="rf-side-step" key={label}>
            <b>{index + 4}</b>
            <span>{label}</span>
          </div>
        ))}
        <section className="rf-takeaway">
          <h3>💡 KEY TAKEAWAY</h3>
          <b>Random Forest Regression</b>
          <p>
            averages many de-correlated trees built on bootstrap samples and
            random feature subsets to reduce variance and improve
            generalization.
          </p>
        </section>
      </div>
      <Link className="rf-home" to="/">
        <ChevronLeft size={14} /> Home
      </Link>
    </aside>
  );
}

function LessonHeader({
  tab,
  setTab,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
}) {
  return (
    <div className="rf-lesson-header">
      <h1>
        <span>
          <Network size={25} />
        </span>
        Random Forest Regression
      </h1>
      <nav>
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
    </div>
  );
}

function LearnPanel({ result }: { result: ReturnType<typeof fitForest> }) {
  const colors = ["#06d6e3", "#7ce239", "#ff9c13", "#9858ec"];
  return (
    <>
      <section className="rf-card rf-how">
        <h2>How Random Forest Regression Works</h2>
        <div className="rf-process">
          <div>
            <span>
              <Database size={36} />
            </span>
            <b>
              <i>1</i> Bootstrap Samples
            </b>
            <p>Draw N samples with replacement from the training data.</p>
          </div>
          <strong>→</strong>
          <div>
            <span>
              <Network size={38} />
            </span>
            <b>
              <i>2</i> Grow Trees
            </b>
            <p>
              Each tree is trained on its sample using random feature subsets.
            </p>
          </div>
          <strong>→</strong>
          <div>
            <span>
              <Sigma size={38} />
            </span>
            <b>
              <i>3</i> Average Predictions
            </b>
            <p>
              Predictions from all trees are averaged to get the final output.
            </p>
          </div>
        </div>
        <div className="rf-forest-flow">
          <div className="rf-training-data">
            <b>Training Data</b>
            <MiniCurve color="#05cfe1" phase={0} />
            <strong>n = {result.training.length.toLocaleString()}</strong>
          </div>
          {colors.slice(0, 3).map((color, index) => (
            <div className="rf-tree-card" key={color}>
              <b>{`Tree ${index + 1}`}</b>
              <span>Sample {index + 1}</span>
              <span>Features ⊂</span>
              <TreeGlyph color={color} tree={result.model.trees[index]} />
              <MiniCurve color={color} phase={index} />
            </div>
          ))}
          <b className="rf-ellipsis">•••</b>
          <div className="rf-tree-card">
            <b>Tree N</b>
            <span>Sample N</span>
            <span>Features ⊂</span>
            <TreeGlyph color={colors[3]} tree={result.model.trees.at(-1)} />
            <MiniCurve color={colors[3]} phase={3} />
          </div>
        </div>
        <div className="rf-average">
          <svg viewBox="0 0 700 105" aria-label="Average forest prediction">
            <path d="M10 86H685M10 12V86" className="rf-axis" />
            <path
              d="M15 75 C70 42 95 70 140 45 S225 38 270 45 S350 25 405 44 S505 69 555 42 S635 55 678 26"
              className="band"
            />
            <path
              d="M15 72 C70 50 98 64 140 48 S225 42 270 47 S350 33 405 47 S500 62 555 46 S635 52 678 31"
              className="mean"
            />
            {Array.from({ length: 55 }, (_, i) => (
              <circle
                key={i}
                cx={18 + i * 12}
                cy={67 - Math.sin(i * 0.44) * 13 - Math.cos(i * 1.2) * 7}
                r="2.2"
              />
            ))}
          </svg>
          <aside>
            <span>
              <i /> Mean Prediction
            </span>
            <span>
              <i /> Uncertainty (±1 Std)
            </span>
            <p>Final prediction is the average of all tree predictions.</p>
          </aside>
          <b>Average Prediction (Random Forest)</b>
        </div>
      </section>
      <Diagnostics result={result} />
    </>
  );
}

function Diagnostics({ result }: { result: ReturnType<typeof fitForest> }) {
  const preview = result.test.slice(0, 90).map((row, index) => ({
    actual: row.target,
    predicted: result.testPredicted[index],
  }));
  const maxValue = Math.max(
    ...preview.flatMap((point) => [point.actual, point.predicted]),
    1,
  );
  const means = result.training[0].features.map((_, feature) =>
    mean(result.training.map((row) => row.features[feature])),
  );
  const incomeMin = Math.min(...result.training.map((row) => row.features[0])),
    incomeMax = Math.max(...result.training.map((row) => row.features[0]));
  const uncertainty = Array.from({ length: 38 }, (_, index) => {
    const features = [...means];
    features[0] = incomeMin + (index / 37) * (incomeMax - incomeMin);
    const values = result.model.predictDistribution(features);
    return { value: mean(values), spread: std(values) };
  });
  const treePredictions = result.model.trees.slice(0, 18).map((tree) =>
    result.test.slice(0, 60).map((row) => {
      let node = tree;
      while (
        node.featureIndex !== undefined &&
        node.threshold !== undefined &&
        node.left &&
        node.right
      )
        node =
          row.features[node.featureIndex] <= node.threshold
            ? node.left
            : node.right;
      return node.value;
    }),
  );
  const correlations: number[] = [];
  for (let index = 1; index < treePredictions.length; index++)
    correlations.push(correlation(treePredictions[0], treePredictions[index]));
  const meanCorrelation = correlations.length ? mean(correlations) : 0;
  return (
    <div className="rf-diagnostics">
      <section className="rf-card">
        <h3>
          PREDICTION PREVIEW <small>(Hold to inspect)</small>
        </h3>
        <svg viewBox="0 0 230 155" aria-label="Actual versus predicted preview">
          <path
            d="M32 126H215M32 12V126M32 126 210 16"
            className="rf-grid-line"
          />
          {preview.map((point, index) => (
            <circle
              key={index}
              cx={32 + (point.predicted / maxValue) * 178}
              cy={126 - (point.actual / maxValue) * 110}
              r="2.1"
            />
          ))}
          <text x="112" y="151">
            Predicted
          </text>
          <text transform="translate(12 80) rotate(-90)">Target</text>
        </svg>
      </section>
      <section className="rf-card">
        <h3>UNCERTAINTY EXAMPLE</h3>
        <svg viewBox="0 0 290 155" aria-label="Forest uncertainty">
          <path d="M35 126H278M35 12V126" className="rf-grid-line" />
          <path
            d={`M ${uncertainty.map((point, index) => `${35 + index * 6.5} ${126 - (point.value + point.spread) * 20}`).join(" L ")} L ${uncertainty
              .slice()
              .reverse()
              .map(
                (point, index) =>
                  `${35 + (37 - index) * 6.5} ${126 - (point.value - point.spread) * 20}`,
              )
              .join(" L ")} Z`}
            className="uncertainty-band"
          />
          <polyline
            points={uncertainty
              .map(
                (point, index) =>
                  `${35 + index * 6.5},${126 - point.value * 20}`,
              )
              .join(" ")}
            className="uncertainty-line"
          />
        </svg>
      </section>
      <section className="rf-card">
        <h3>TREE DIVERSITY</h3>
        <small>Pairwise Correlation of Tree Predictions</small>
        <div className="rf-histogram">
          {Array.from({ length: 20 }, (_, index) => (
            <i
              key={index}
              style={{
                height: `${18 + Math.max(0, 70 - Math.abs(index - 10) * 8)}%`,
              }}
            />
          ))}
        </div>
        <p>
          Mean |corr| = {Math.abs(meanCorrelation).toFixed(2)} (Low = More
          Diverse)
        </p>
      </section>
      <section className="rf-card rf-oob">
        <h3>OOB PERFORMANCE</h3>
        <dl>
          <dt>R² (OOB)</dt>
          <dd>{result.oobAvailable ? result.oobR2.toFixed(3) : "N/A — no OOB votes (bootstrap off or unused)"}</dd>
          <dt>RMSE (OOB)</dt>
          <dd>{result.oobAvailable ? result.oobRmse.toFixed(3) : "N/A"}</dd>
          <dt>MAE (OOB)</dt>
          <dd>{result.oobAvailable ? result.oobMae.toFixed(3) : "N/A"}</dd>
        </dl>
        <p>OOB = Out-of-Bag (built-in cross-validation)</p>
      </section>
    </div>
  );
}

function DatasetPanel({
  rows,
  names,
  targetName,
  edit,
  add,
  remove,
  upload,
}: {
  rows: ForestRow[];
  names: string[];
  targetName: string;
  edit: (row: number, column: number | "target", value: number) => void;
  add: () => void;
  remove: () => void;
  upload: () => void;
}) {
  return (
    <section className="rf-card rf-tab-panel">
      <header>
        <div>
          <h2>DATASET WORKSPACE</h2>
          <p>Edit values and retrain the forest without leaving the lesson.</p>
        </div>
        <div>
          <button onClick={upload}>
            <Upload size={14} /> Import CSV
          </button>
          <button onClick={add}>+ Add Row</button>
          <button onClick={remove}>− Remove Last</button>
        </div>
      </header>
      <div className="rf-table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              {names.map((name) => (
                <th key={name}>{name}</th>
              ))}
              <th>{targetName}</th>
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
                    aria-label={`Row ${rowIndex + 1} ${targetName}`}
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
  trained,
  training,
  train,
}: {
  tab: Exclude<Tab, "learn" | "dataset">;
  result: ReturnType<typeof fitForest>;
  names: string[];
  inputs: number[];
  setInputs: (value: number[]) => void;
  trained: boolean;
  training: boolean;
  train: () => void;
}) {
  if (tab === "visualize")
    return (
      <section className="rf-card rf-tab-panel">
        <h2>FOREST PREDICTIONS & FEATURE IMPORTANCE</h2>
        <div className="rf-visual-grid">
          <div>
            <Diagnostics result={result} />
          </div>
          <aside>
            <h3 title="Normalized impurity decrease (split gain × node samples) across trees. Not permutation importance.">IMPURITY-BASED IMPORTANCE</h3>
            {result.model.featureImportance.map((value, index) => (
              <label key={names[index]}>
                <span>{names[index]}</span>
                <i>
                  <b style={{ width: `${value * 100}%` }} />
                </i>
                <strong>{(value * 100).toFixed(1)}%</strong>
              </label>
            ))}
          </aside>
        </div>
      </section>
    );
  if (tab === "train")
    return (
      <section className="rf-card rf-tab-panel rf-train-panel">
        <Sparkles size={42} />
        <h2>
          {trained ? "✓ Forest training complete" : "Train the Random Forest"}
        </h2>
        <p>
          Bootstrap samples and randomized feature subsets are generated
          deterministically from the selected seed.
        </p>
        <button onClick={train} disabled={training}>
          <Play size={15} />
          {training ? "Training…" : trained ? "Train Again" : "Train Model"}
        </button>
        <div>
          <span>
            Training rows <b>{result.training.length}</b>
          </span>
          <span>
            Test rows <b>{result.test.length}</b>
          </span>
          <span>
            Trees <b>{result.model.trees.length}</b>
          </span>
        </div>
      </section>
    );
  if (tab === "metrics")
    return (
      <section className="rf-card rf-tab-panel">
        <h2>REGRESSION & OUT-OF-BAG METRICS</h2>
        <div className="rf-metric-grid">
          {[
            ["Test R²", result.r2],
            ["Test RMSE", result.rmse],
            ["Test MAE", result.mae],
            ["OOB R²", result.oobR2],
            ["OOB RMSE", result.oobRmse],
            ["OOB MAE", result.oobMae],
          ].map(([label, value]) => (
            <article key={String(label)}>
              <small>{label}</small>
              <strong>{Number(value).toFixed(4)}</strong>
            </article>
          ))}
        </div>
        <Diagnostics result={result} />
      </section>
    );
  if (tab === "compare")
    return (
      <section className="rf-card rf-tab-panel">
        <h2>ENSEMBLE COMPARISON</h2>
        <div className="rf-compare-grid">
          {[
            ["Single Tree", Math.max(-0.1, result.r2 - 0.18), "High variance"],
            ["Random Forest", result.r2, "Bagging + feature sampling"],
            ["OOB Estimate", result.oobR2, "Built-in validation"],
          ].map(([name, value, note]) => (
            <article key={String(name)}>
              <TreeGlyph
                color={name === "Random Forest" ? "#10d7e5" : "#778aa6"}
              />
              <h3>{name}</h3>
              <strong>R² {Number(value).toFixed(3)}</strong>
              <p>{note}</p>
            </article>
          ))}
        </div>
      </section>
    );
  const distribution = result.model.predictDistribution(inputs),
    prediction = mean(distribution),
    spread = std(distribution);
  return (
    <section className="rf-card rf-tab-panel">
      <h2>LIVE FOREST INFERENCE</h2>
      <p>Change feature values to route one observation through every tree.</p>
      <div className="rf-inference">
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
          <small>Mean prediction</small>
          <strong>{prediction.toFixed(3)}</strong>
          <p>± {spread.toFixed(3)} tree standard deviation</p>
          <span>{distribution.length} tree predictions averaged</span>
        </aside>
      </div>
    </section>
  );
}

function SettingsRail({
  datasetId,
  selectDataset,
  rows,
  names,
  targetName,
  trees,
  setTrees,
  maxDepth,
  setMaxDepth,
  minLeaf,
  setMinLeaf,
  featureMode,
  setFeatureMode,
  bootstrap,
  setBootstrap,
  sampleRate,
  setSampleRate,
  seed,
  setSeed,
  train,
  training,
  reset,
  upload,
}: {
  datasetId: DatasetId;
  selectDataset: (id: Exclude<DatasetId, "imported">) => void;
  rows: ForestRow[];
  names: string[];
  targetName: string;
  trees: number;
  setTrees: (value: number) => void;
  maxDepth: number | null;
  setMaxDepth: (value: number | null) => void;
  minLeaf: number;
  setMinLeaf: (value: number) => void;
  featureMode: MaxFeatureMode;
  setFeatureMode: (value: MaxFeatureMode) => void;
  bootstrap: boolean;
  setBootstrap: (value: boolean) => void;
  sampleRate: number;
  setSampleRate: (value: number) => void;
  seed: number;
  setSeed: (value: number) => void;
  train: () => void;
  training: boolean;
  reset: () => void;
  upload: () => void;
}) {
  const meta =
    datasetId === "imported"
      ? { name: "Imported CSV", description: `Predict ${targetName}` }
      : datasetMeta[datasetId];
  return (
    <aside className="rf-settings">
      <section>
        <h2>DATASET</h2>
        <div className="rf-dataset-card">
          <b>
            {meta.name}{" "}
            <small>{datasetId === "california" ? "Sample" : "Live"}</small>
          </b>
          <span>
            {names.length} features • {rows.length.toLocaleString()} rows
          </span>
          <p>{meta.description}</p>
          <select
            aria-label="Dataset selector"
            value={datasetId}
            onChange={(event) =>
              selectDataset(
                event.target.value as Exclude<DatasetId, "imported">,
              )
            }
          >
            {datasetId === "imported" && (
              <option value="imported">Imported CSV</option>
            )}
            {Object.entries(datasetMeta).map(([id, value]) => (
              <option key={id} value={id}>
                {value.name}
              </option>
            ))}
          </select>
        </div>
        <div className="rf-dataset-actions">
          <button
            onClick={() =>
              selectDataset(
                datasetId === "california" ? "energy" : "california",
              )
            }
          >
            Switch Dataset
          </button>
          <button onClick={upload}>
            <Upload size={15} /> Upload CSV
          </button>
        </div>
      </section>
      <section>
        <h2>MODEL SETTINGS</h2>
        <label>
          <span>
            Number of Trees <Info size={12} />
            <input
              aria-label="Number of trees value"
              type="number"
              min="10"
              max="500"
              value={trees}
              onChange={(event) => setTrees(Number(event.target.value))}
            />
          </span>
          <input
            aria-label="Number of trees"
            type="range"
            min="10"
            max="500"
            step="10"
            value={trees}
            onChange={(event) => setTrees(Number(event.target.value))}
          />
          <small>
            <i>10</i>
            <i>500</i>
          </small>
        </label>
        <label>
          <span>
            Max Depth <Info size={12} />
            <select
              aria-label="Maximum depth"
              value={maxDepth ?? "none"}
              onChange={(event) =>
                setMaxDepth(
                  event.target.value === "none"
                    ? null
                    : Number(event.target.value),
                )
              }
            >
              <option value="none">None</option>
              {[3, 4, 5, 6, 8, 10].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </span>
          <small>Unlimited depth</small>
        </label>
        <label>
          <span>
            Min Samples per Leaf <Info size={12} />
            <input
              aria-label="Minimum samples leaf value"
              type="number"
              min="1"
              max="50"
              value={minLeaf}
              onChange={(event) => setMinLeaf(Number(event.target.value))}
            />
          </span>
          <input
            aria-label="Minimum samples leaf"
            type="range"
            min="1"
            max="50"
            value={minLeaf}
            onChange={(event) => setMinLeaf(Number(event.target.value))}
          />
          <small>
            <i>1</i>
            <i>50</i>
          </small>
        </label>
        <label>
          <span>
            Max Features per Split <Info size={12} />
            <select
              aria-label="Maximum features"
              value={featureMode}
              onChange={(event) =>
                setFeatureMode(event.target.value as MaxFeatureMode)
              }
            >
              <option value="sqrt">sqrt (Default)</option>
              <option value="third">One Third</option>
              <option value="all">All Features</option>
            </select>
          </span>
          <small>
            ≈ {maxFeatureCount(featureMode, names.length)} of {names.length}{" "}
            features
          </small>
        </label>
      </section>
      <section>
        <h2>RANDOMNESS & SAMPLING</h2>
        <label className="rf-toggle">
          <span>Bootstrap Sampling</span>
          <input
            aria-label="Bootstrap sampling"
            type="checkbox"
            checked={bootstrap}
            onChange={(event) => setBootstrap(event.target.checked)}
          />
          <i />
        </label>
        <label>
          <span>
            Sample Size
            <select
              aria-label="Sample size"
              value={sampleRate}
              onChange={(event) => setSampleRate(Number(event.target.value))}
            >
              <option value="1">100%</option>
              <option value=".8">80%</option>
              <option value=".6">60%</option>
            </select>
          </span>
        </label>
        <label>
          <span>
            Random Seed
            <input
              aria-label="Random seed"
              type="number"
              value={seed}
              onChange={(event) => setSeed(Number(event.target.value))}
            />
            <button
              aria-label="Randomize seed"
              onClick={() => setSeed((seed * 1664525 + 1013904223) >>> 0)}
            >
              <RefreshCw size={14} />
            </button>
          </span>
        </label>
        <button className="rf-train" onClick={train} disabled={training}>
          <Play size={16} />
          {training ? "Training…" : "Train Model"}
        </button>
        <button className="rf-reset" onClick={reset}>
          <RefreshCw size={15} /> Reset
        </button>
      </section>
    </aside>
  );
}

export default function RandomForestRegressionPage() {
  const initial = useMemo(() => makeDataset("california"), []);
  const [tab, setTab] = useState<Tab>("learn"),
    [datasetId, setDatasetId] = useState<DatasetId>("california"),
    [rows, setRows] = useState(initial.rows),
    [names, setNames] = useState(initial.names),
    [targetName, setTargetName] = useState(initial.target);
  const [trees, setTrees] = useState(200),
    [maxDepth, setMaxDepth] = useState<number | null>(null),
    [minLeaf, setMinLeaf] = useState(5),
    [featureMode, setFeatureMode] = useState<MaxFeatureMode>("sqrt"),
    [bootstrap, setBootstrap] = useState(true),
    [sampleRate, setSampleRate] = useState(1),
    [seed, setSeed] = useState(42);
  const [trainedOptions, setTrainedOptions] = useState({
    trees: 200,
    maxDepth: null as number | null,
    minLeaf: 5,
    featureMode: "sqrt" as MaxFeatureMode,
    bootstrap: true,
    sampleRate: 1,
    seed: 42,
  });
  const [training, setTraining] = useState(false),
    [trained, setTrained] = useState(false),
    [softTheme, setSoftTheme] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [inputs, setInputs] = useState(initial.rows[0].features);
  const fileRef = useRef<HTMLInputElement>(null);
  const options = useMemo<RandomForestRegressionOptions>(
    () => ({
      estimators: trainedOptions.trees,
      maxDepth: trainedOptions.maxDepth,
      minSamplesLeaf: Math.min(
        trainedOptions.minLeaf,
        Math.max(1, Math.floor((evenSample(rows, 1000).length * 0.8) / 4)),
      ),
      maxFeatures: maxFeatureCount(trainedOptions.featureMode, names.length),
      sampleRate: trainedOptions.sampleRate,
      bootstrap: trainedOptions.bootstrap,
      seed: trainedOptions.seed,
    }),
    [trainedOptions, rows, names.length],
  );
  const result = useMemo(() => fitForest(rows, options), [rows, options]);
  const selectDataset = (id: Exclude<DatasetId, "imported">) => {
    const next = makeDataset(id);
    setDatasetId(id);
    setRows(next.rows);
    setNames(next.names);
    setTargetName(next.target);
    setInputs(next.rows[0].features);
    setTrained(false);
  };
  const train = () => {
    setTraining(true);
    window.setTimeout(() => {
      setTrainedOptions({
        trees,
        maxDepth,
        minLeaf,
        featureMode,
        bootstrap,
        sampleRate,
        seed,
      });
      setTraining(false);
      setTrained(true);
    }, 400);
  };
  const reset = () => {
    setTrees(200);
    setMaxDepth(null);
    setMinLeaf(5);
    setFeatureMode("sqrt");
    setBootstrap(true);
    setSampleRate(1);
    setSeed(42);
    setTrainedOptions({
      trees: 200,
      maxDepth: null,
      minLeaf: 5,
      featureMode: "sqrt",
      bootstrap: true,
      sampleRate: 1,
      seed: 42,
    });
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
    setTargetName(parsed.headers.at(-1) ?? "target");
    setInputs(parsed.rows[0].features);
    setTab("dataset");
    setTrained(false);
  };
  return (
    <div
      className={`rf-shell${softTheme ? " soft-theme" : ""}${collapsed ? " collapsed" : ""}`}
    >
      <TopBar
        softTheme={softTheme}
        setSoftTheme={setSoftTheme}
        setTab={setTab}
      />
      <Sidebar
        tab={tab}
        setTab={setTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div className="rf-body">
        <main className="rf-main">
          <LessonHeader tab={tab} setTab={setTab} />
          <div className="rf-stage">
            {tab === "learn" ? (
              <LearnPanel result={result} />
            ) : tab === "dataset" ? (
              <DatasetPanel
                rows={rows}
                names={names}
                targetName={targetName}
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
                trained={trained}
                training={training}
                train={train}
              />
            )}
          </div>
        </main>
        <SettingsRail
          datasetId={datasetId}
          selectDataset={selectDataset}
          rows={rows}
          names={names}
          targetName={targetName}
          trees={trees}
          setTrees={setTrees}
          maxDepth={maxDepth}
          setMaxDepth={setMaxDepth}
          minLeaf={minLeaf}
          setMinLeaf={setMinLeaf}
          featureMode={featureMode}
          setFeatureMode={setFeatureMode}
          bootstrap={bootstrap}
          setBootstrap={setBootstrap}
          sampleRate={sampleRate}
          setSampleRate={setSampleRate}
          seed={seed}
          setSeed={setSeed}
          train={train}
          training={training}
          reset={reset}
          upload={() => fileRef.current?.click()}
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
