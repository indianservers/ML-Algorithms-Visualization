import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LabProgressMeter } from "../../../../components/common/LabChrome";
import { useUrlTab } from "../../../../components/common/LabTabs";
import {
  Activity,
  BarChart3,
  Beaker,
  BookOpen,
  Box,
  BrainCircuit,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleHelp,
  FileText,
  GitBranch,
  Info,
  Lightbulb,
  Moon,
  Play,
  RotateCcw,
  Settings,
  Table2,
  Target,
  Upload,
} from "lucide-react";
import {
  energyDemandDataset,
  housingDataset,
} from "../../../../data/sampleDatasets";
import {
  buildRegressionTree,
  flattenRegressionTree,
  parseRegressionCsv,
  predictRegressionTree,
  regressionTreeDepth,
  regressionTreeLeaves,
  regressionTreePath,
  type RegressionTreeNode,
} from "../../../../lib/algorithms/regression/decisionTreeRegression";
import { mae, mse, rSquared, rmse } from "../../../../lib/math/metrics";
import "./DecisionTreeRegressionPage.css";

type TreeRow = { features: number[]; target: number };
type BuiltInDatasetId = "bike" | "energy" | "housing" | "synthetic";
type DatasetId = BuiltInDatasetId | "imported";
type Tab =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";

const tabs: Array<[Tab, string]> = [
  ["learn", "Learn"],
  ["visualize", "Visualize"],
  ["dataset", "Dataset"],
  ["train", "Train"],
  ["metrics", "Metrics"],
  ["compare", "Compare"],
  ["explain", "Explain"],
];

const jitter = (index: number, salt = 0) => {
  const value = Math.sin(index * 68.913 + salt * 23.177) * 41738.71;
  return (value - Math.floor(value)) * 2 - 1;
};

function bikeRows(count = 360): TreeRow[] {
  return Array.from({ length: count }, (_, index) => {
    const hour = index % 24;
    const day = Math.floor(index / 24);
    const season = Math.floor((day % 365) / 91.25);
    const temperature =
      15 +
      Math.sin((day / 365) * Math.PI * 2 - 1.1) * 16 +
      Math.sin((hour / 24) * Math.PI * 2 - 1.4) * 5;
    const humidity = Math.max(
      0.18,
      Math.min(
        0.96,
        0.58 -
          temperature * 0.008 +
          Math.cos(day / 17) * 0.15 +
          jitter(index) * 0.035,
      ),
    );
    const wind = 8 + ((index * 7) % 48) + jitter(index, 2) * 3;
    const workingDay = day % 7 < 5 ? 1 : 0;
    const feelsLike = temperature - wind * 0.05 + humidity * 2;
    const rain = humidity > 0.78 && index % 5 < 2 ? 1 : 0;
    const visibility = 10 - humidity * 4 - rain * 2;
    const trend = day / 365;
    const temperatureDemand = 850 - Math.abs(temperature - 23) * 28;
    const commute =
      workingDay && ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19))
        ? 175
        : 0;
    const target = Math.max(
      70,
      temperatureDemand +
        commute -
        humidity * 125 -
        wind * 2.4 -
        rain * 90 +
        trend * 34 +
        jitter(index, 9) * 65,
    );
    return {
      features: [
        temperature,
        humidity,
        wind,
        hour,
        workingDay,
        season,
        rain,
        feelsLike,
        visibility,
        trend,
      ],
      target,
    };
  });
}

function syntheticRows(count = 240): TreeRow[] {
  return Array.from({ length: count }, (_, index) => {
    const x = -4 + (index * 8) / (count - 1);
    const group = x < -1 ? 110 : x < 1.5 ? 260 : 480;
    return {
      features: [x, Math.sin(x), x * x, jitter(index)],
      target: group + jitter(index, 4) * 35,
    };
  });
}

const datasetFactories: Record<BuiltInDatasetId, () => TreeRow[]> = {
  bike: () => bikeRows(),
  energy: () =>
    (energyDemandDataset.data as Array<Record<string, number>>).map((row) => ({
      features: [
        row.temperature_c,
        row.humidity / 100,
        row.wind_kph,
        row.hour_of_day,
        row.is_weekend,
        0,
        0,
        row.temperature_c,
        8,
        0,
      ],
      target: row.demand_mw,
    })),
  housing: () =>
    (housingDataset.data as Array<Record<string, number>>).map((row) => ({
      features: [
        row.area_sqft,
        row.bedrooms,
        row.bathrooms,
        row.age_years,
        row.distance_center,
      ],
      target: row.price,
    })),
  synthetic: () => syntheticRows(),
};

const datasetMeta: Record<
  DatasetId,
  { name: string; target: string; features: string[]; description: string }
> = {
  bike: {
    name: "Bike Sharing Demand",
    target: "Count (Demand)",
    features: [
      "Temp (°C)",
      "Humidity",
      "Wind Speed (km/h)",
      "Hour",
      "Working Day",
      "Season",
      "Rain",
      "Feels Like",
      "Visibility",
      "Trend",
    ],
    description: "Hourly weather and calendar demand",
  },
  energy: {
    name: "Energy Demand",
    target: "Demand (MW)",
    features: [
      "Temp (°C)",
      "Humidity",
      "Wind Speed (km/h)",
      "Hour",
      "Weekend",
      "Season",
      "Rain",
      "Feels Like",
      "Visibility",
      "Trend",
    ],
    description: "Weather-driven grid demand",
  },
  housing: {
    name: "Housing Prices",
    target: "Price",
    features: ["Area", "Bedrooms", "Bathrooms", "Age", "Distance"],
    description: "Home characteristics and sale price",
  },
  synthetic: {
    name: "Synthetic Steps",
    target: "Target",
    features: ["Signal", "Seasonal", "Squared", "Noise"],
    description: "Controlled piecewise-constant signal",
  },
  imported: {
    name: "Imported CSV",
    target: "Target",
    features: [],
    description: "User-provided numeric regression data",
  },
};

function sampleRows(rows: TreeRow[], limit: number) {
  if (rows.length <= limit) return rows;
  const stride = rows.length / limit;
  return Array.from(
    { length: limit },
    (_, index) => rows[Math.floor(index * stride)],
  );
}

function fitTree(
  rows: TreeRow[],
  _datasetId: DatasetId,
  maxDepth: number,
  minLeaf: number,
  cost: number,
  _thresholds: number[],
) {
  const working = sampleRows(rows, 1200);
  const training = working.filter((_, index) => index % 5 !== 0);
  const test = working.filter((_, index) => index % 5 === 0);
  const actualLeaf = Math.max(
    1,
    Math.min(
      Math.round((minLeaf * training.length) / rows.length),
      Math.floor(training.length / 4),
    ),
  );
  const trainTargets = training.map((row) => row.target);
  const average =
    trainTargets.reduce((sum, value) => sum + value, 0) / trainTargets.length;
  const variance =
    trainTargets.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    trainTargets.length;
  const preferredSplitsByNode = undefined;
  const tree = buildRegressionTree(
    training.map((row) => row.features),
    trainTargets,
    {
      maxDepth,
      minSamplesLeaf: actualLeaf,
      minSamplesSplit: 4,
      costComplexity: cost * variance,
      preferredSplitsByNode,
    },
  );
  const predict = (features: number[]) => predictRegressionTree(tree, features);
  const trainPredictions = training.map((row) => predict(row.features));
  const testPredictions = test.map((row) => predict(row.features));
  const testActual = test.map((row) => row.target);
  return {
    tree,
    predict,
    training,
    test,
    trainMse: mse(trainTargets, trainPredictions),
    testMse: mse(testActual, testPredictions),
    testRmse: rmse(testActual, testPredictions),
    testMae: mae(testActual, testPredictions),
    testR2: rSquared(testActual, testPredictions),
  };
}

function Sidebar({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse: () => void;
}) {
  return (
    <aside className="tree-sidebar">
      <div className="tree-brand">
        <span>
          <BrainCircuit size={19} />
        </span>
        <div>
          <strong>Mega ML</strong>
          <small>AI OBSERVATORY</small>
        </div>
        <button
          aria-label={
            collapsed
              ? "Expand lesson navigation"
              : "Collapse lesson navigation"
          }
          onClick={onCollapse}
        >
          <ChevronUp size={14} />
          <ChevronDown size={14} />
        </button>
      </div>
      <section className="tree-lesson-progress">
        <small>Lesson 14 of 24</small>
        <strong>Regression with Trees</strong>
        <i>
          <b />
        </i>
      </section>
      <nav>
        <small>LESSON</small>
        <a href="#overview">
          <BookOpen size={15} />
          Overview
        </a>
        <a href="#why">
          <Beaker size={15} />
          Why Trees for Regression
        </a>
        <a href="#how">
          <GitBranch size={15} />
          How It Works
        </a>
        <a href="#bias">
          <Activity size={15} />
          Bias–Variance
        </a>
        <a href="#when">
          <Lightbulb size={15} />
          When to Use
        </a>
        <small>INTERACTIVE LAB</small>
        <span className="active">
          <Target size={15} />
          Decision Tree Regression
        </span>
        <Link to="/ml/supervised/random-forest-regression">
          <GitBranch size={15} />
          Random Forest Regression
        </Link>
        <Link to="/ml/supervised/gradient-boosting-regression">
          <Settings size={15} />
          Gradient Boosting
        </Link>
        <a href="#challenge">
          <Box size={15} />
          Challenge
        </a>
        <small>RESOURCES</small>
        <a href="#cheat">
          <FileText size={15} />
          Cheat Sheet
        </a>
        <a href="#formula">
          <Table2 size={15} />
          Formulae
        </a>
        <a href="#reading">
          <BookOpen size={15} />
          Further Reading
        </a>
      </nav>
      <Link className="tree-back" to="/">
        <ChevronLeft size={15} />
        Back to Path
      </Link>
    </aside>
  );
}

function TreeCanvas({
  tree,
  names,
  selectedNode,
  setSelectedNode,
  showSamples,
  setShowSamples,
  totalRows,
}: {
  tree: RegressionTreeNode;
  names: string[];
  selectedNode: string;
  setSelectedNode: (id: string) => void;
  showSamples: boolean;
  setShowSamples: (value: boolean) => void;
  totalRows: number;
}) {
  const byId = Object.fromEntries(
    flattenRegressionTree(tree).map((node) => [node.id, node]),
  );
  const specs = [
    { id: "root", x: 270, y: 50 },
    { id: "rootL", x: 150, y: 160 },
    { id: "rootR", x: 390, y: 160 },
    { id: "rootLL", x: 75, y: 285 },
    { id: "rootLR", x: 205, y: 285 },
    { id: "rootRL", x: 330, y: 285 },
    { id: "rootRR", x: 465, y: 285 },
    { id: "rootRLL", x: 285, y: 390 },
    { id: "rootRLR", x: 400, y: 390 },
  ];
  const positions = Object.fromEntries(specs.map((item) => [item.id, item]));
  const links = specs
    .filter((item) => item.id !== "root" && byId[item.id])
    .map((item) => {
      const parentId = item.id.slice(0, -1);
      return { from: positions[parentId], to: item };
    })
    .filter((item) => item.from);
  return (
    <section className="tree-card tree-canvas">
      <header>
        <h2>
          DECISION TREE <span>(Learned on Train Set)</span>
        </h2>
        <b>
          Depth {regressionTreeDepth(tree)} <i /> Leaves{" "}
          {regressionTreeLeaves(tree)}
        </b>
      </header>
      <label>
        <input
          type="checkbox"
          checked={showSamples}
          onChange={(event) => setShowSamples(event.target.checked)}
        />
        Show
        <br />
        samples
      </label>
      <svg
        viewBox="0 0 540 445"
        role="img"
        aria-label="Decision regression tree"
      >
        {links.map((link, index) => (
          <line
            key={index}
            x1={link.from.x}
            y1={link.from.y + 30}
            x2={link.to.x}
            y2={link.to.y - 30}
            className="tree-link"
          />
        ))}
        {specs.map((spec, index) => {
          const node = byId[spec.id];
          if (!node) return null;
          const internal = node.featureIndex !== undefined;
          const label = internal
            ? `${names[node.featureIndex!]} ≤ ${node.threshold!.toFixed(node.threshold! < 1 ? 2 : 1)}`
            : "Leaf prediction";
          return (
            <g
              key={spec.id}
              role="button"
              aria-label={`Tree node ${label}`}
              onClick={() => setSelectedNode(spec.id)}
              className={selectedNode === spec.id ? "selected" : ""}
            >
              <rect
                x={spec.x - 55}
                y={spec.y - 31}
                width="110"
                height="62"
                rx="10"
                className={`node node-${Math.min(index, 5)}`}
              />
              <text
                x={spec.x}
                y={spec.y - 13}
                textAnchor="middle"
                className="node-title"
              >
                {label}
              </text>
              {showSamples && (
                <text x={spec.x} y={spec.y + 7} textAnchor="middle">
                  n=
                  {Math.round(
                    (node.samples / tree.samples) * totalRows,
                  ).toLocaleString()}
                </text>
              )}
              <text
                x={spec.x}
                y={spec.y + 24}
                textAnchor="middle"
                className="node-value"
              >
                ŷ = {node.value.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
      <footer>
        <span>
          <i className="high" />
          Higher prediction
        </span>
        <span>
          <i className="low" />
          Lower prediction
        </span>
        <span>
          <b>n</b>Samples
        </span>
        <span>
          <b>ŷ</b>Mean target
        </span>
        <button onClick={() => setSelectedNode("root")}>
          <RotateCcw size={13} />
          Reset Tree Layout
        </button>
      </footer>
    </section>
  );
}

function PredictionChart({
  result,
  featureIndex,
  setFeatureIndex,
  names,
  targetName,
  rows,
}: {
  result: ReturnType<typeof fitTree>;
  featureIndex: number;
  setFeatureIndex: (value: number) => void;
  names: string[];
  targetName: string;
  rows: TreeRow[];
}) {
  const width = 520,
    height = 390,
    left = 48,
    top = 76,
    plotWidth = 455,
    plotHeight = 255;
  const visible = sampleRows(rows, 150);
  const values = visible.map((row) => row.features[featureIndex]);
  const targets = visible.map((row) => row.target);
  const minX = Math.min(...values),
    maxX = Math.max(...values),
    minY = Math.min(...targets),
    maxY = Math.max(...targets);
  const x = (value: number) =>
    left + ((value - minX) / (maxX - minX || 1)) * plotWidth;
  const y = (value: number) =>
    top + plotHeight - ((value - minY) / (maxY - minY || 1)) * plotHeight;
  const means = Array.from(
    { length: names.length },
    (_, column) =>
      rows.reduce((sum, row) => sum + row.features[column], 0) / rows.length,
  );
  const curve = Array.from({ length: 40 }, (_, index) => {
    const value = minX + (index / 39) * (maxX - minX);
    const features = [...means];
    features[featureIndex] = value;
    return { value, prediction: result.predict(features) };
  });
  let stepPath = `M ${x(curve[0].value)} ${y(curve[0].prediction)}`;
  curve.slice(1).forEach((point, index) => {
    const previous = curve[index];
    stepPath += ` L ${x(point.value)} ${y(previous.prediction)} L ${x(point.value)} ${y(point.prediction)}`;
  });
  return (
    <section className="tree-card tree-prediction">
      <header>
        <h2>
          PIECEWISE-CONSTANT PREDICTIONS <Info size={13} />
        </h2>
      </header>
      <div className="tree-feature-picker">
        <span>Feature</span>
        <select
          aria-label="Prediction feature"
          value={featureIndex}
          onChange={(event) => setFeatureIndex(Number(event.target.value))}
        >
          {names.map((name, index) => (
            <option value={index} key={name}>
              {name}
            </option>
          ))}
        </select>
        <span className="tree-target-chip">
          vs Target ({targetName.split(" ")[0]})
        </span>
      </div>
      <div className="tree-chart-legend">
        <span>
          <i />
          Train (actual)
        </span>
        <span>
          <i />
          Test (actual)
        </span>
        <span>
          <b />
          Tree prediction
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Piecewise constant prediction chart"
      >
        {Array.from({ length: 7 }, (_, index) => {
          const tx = left + (index / 6) * plotWidth;
          return (
            <line
              key={`v${index}`}
              x1={tx}
              y1={top}
              x2={tx}
              y2={top + plotHeight}
              className="grid"
            />
          );
        })}
        {Array.from({ length: 6 }, (_, index) => {
          const ty = top + (index / 5) * plotHeight;
          return (
            <line
              key={`h${index}`}
              x1={left}
              y1={ty}
              x2={left + plotWidth}
              y2={ty}
              className="grid"
            />
          );
        })}
        {visible.map((row, index) => (
          <circle
            key={index}
            cx={x(row.features[featureIndex])}
            cy={y(row.target)}
            r="2.8"
            className={index % 5 === 0 ? "test-point" : "train-point"}
          />
        ))}
        <path d={stepPath} className="prediction-line" />
        <text
          x={left + plotWidth / 2}
          y={height - 20}
          textAnchor="middle"
          className="axis-label"
        >
          {names[featureIndex]}
        </text>
        <text
          transform={`translate(14 ${top + plotHeight / 2}) rotate(-90)`}
          textAnchor="middle"
          className="axis-label"
        >
          {targetName}
        </text>
      </svg>
      <div className="tree-partial">
        <span>Other features (partial dependence)</span>
        {names
          .filter((_, index) => index !== featureIndex)
          .slice(0, 4)
          .map((name) => (
            <button
              key={name}
              onClick={() => setFeatureIndex(names.indexOf(name))}
            >
              {name}
            </button>
          ))}
      </div>
    </section>
  );
}

function TreeControls({
  thresholds,
  setThresholds,
  maxDepth,
  setMaxDepth,
  minLeaf,
  setMinLeaf,
  cost,
  setCost,
  onUpdate,
  training,
  mode,
  setMode,
  onReset,
}: {
  thresholds: number[];
  setThresholds: (v: number[]) => void;
  maxDepth: number;
  setMaxDepth: (v: number) => void;
  minLeaf: number;
  setMinLeaf: (v: number) => void;
  cost: number;
  setCost: (v: number) => void;
  onUpdate: () => void;
  training: boolean;
  mode: "manage" | "prune";
  setMode: (v: "manage" | "prune") => void;
  onReset: () => void;
}) {
  const controls = [
    { name: "Humidity", suffix: "", min: 0, max: 1, step: 0.01 },
    { name: "Temp (°C)", suffix: "", min: -10, max: 40, step: 0.5 },
    { name: "Wind Speed (km/h)", suffix: "", min: 0, max: 60, step: 0.5 },
    { name: "Hour", suffix: "", min: 0, max: 23, step: 0.5 },
  ];
  return (
    <section className="tree-card tree-controls">
      <header>
        <h2>TREE CONTROLS</h2>
      </header>
      <div className="tree-control-tabs">
        <button
          className={mode === "manage" ? "active" : ""}
          onClick={() => setMode("manage")}
        >
          Manage Splits
        </button>
        <button
          className={mode === "prune" ? "active" : ""}
          onClick={() => setMode("prune")}
        >
          Prune Tree
        </button>
      </div>
      <h3>
        Split Thresholds <Info size={13} />
      </h3>
      <p>CART chooses splits from the data. Depth and min-leaf rebuild the tree. These sliders are informational defaults only.</p>
      {controls.map((control, index) => (
        <label key={control.name}>
          <span>
            {control.name} ≤{" "}
            <input
              className="tree-threshold-value"
              aria-label={`${control.name} threshold value`}
              type="number"
              min={control.min}
              max={control.max}
              step={control.step}
              value={thresholds[index]}
              onChange={(event) =>
                setThresholds(
                  thresholds.map((value, i) =>
                    i === index ? Number(event.target.value) : value,
                  ),
                )
              }
            />
          </span>
          <input
            aria-label={`${control.name} threshold`}
            type="range"
            min={control.min}
            max={control.max}
            step={control.step}
            value={thresholds[index]}
            onChange={(event) =>
              setThresholds(
                thresholds.map((value, i) =>
                  i === index ? Number(event.target.value) : value,
                ),
              )
            }
          />
          <small>
            <i>{control.min.toFixed(index === 0 ? 2 : 1)}</i>
            <i>{control.max.toFixed(index === 0 ? 2 : 1)}</i>
          </small>
        </label>
      ))}
      <hr />
      <h3>Model Complexity</h3>
      <div className="tree-depth">
        <span>Max Depth</span>
        <div>
          {[1, 2, 3, 4, 5, 6].map((depth) => (
            <button
              key={depth}
              className={maxDepth === depth ? "active" : ""}
              onClick={() => setMaxDepth(depth)}
            >
              {depth}
            </button>
          ))}
        </div>
      </div>
      <label className="tree-min-leaf">
        <span>
          Min Samples Leaf{" "}
          <input
            aria-label="Minimum samples leaf value"
            type="number"
            min="1"
            max="500"
            value={minLeaf}
            onChange={(event) => setMinLeaf(Number(event.target.value))}
          />
        </span>
        <input
          aria-label="Minimum samples leaf"
          type="range"
          min="1"
          max="500"
          value={minLeaf}
          onChange={(event) => setMinLeaf(Number(event.target.value))}
        />
        <small>
          <i>1</i>
          <i>500</i>
        </small>
      </label>
      <label className="tree-cost">
        <span>
          Cost Complexity (α) <Info size={13} />
          <input
            aria-label="Cost complexity value"
            type="number"
            min="0"
            max="0.1"
            step="0.001"
            value={cost}
            onChange={(event) => setCost(Number(event.target.value))}
          />
        </span>
        <input
          aria-label="Cost complexity"
          type="range"
          min="0"
          max="0.1"
          step="0.001"
          value={cost}
          onChange={(event) => setCost(Number(event.target.value))}
        />
        <small>
          <i>0.000</i>
          <i>0.100</i>
        </small>
      </label>
      <button className="tree-update" onClick={onUpdate} disabled={training}>
        <RotateCcw size={14} />
        {training ? "Updating…" : "Update Tree"}
      </button>
      <button className="tree-hidden-reset" onClick={onReset}>
        Reset
      </button>
    </section>
  );
}

function DatasetOverview({
  rows,
  names,
  datasetName,
  targetName,
  onView,
}: {
  rows: TreeRow[];
  names: string[];
  datasetName: string;
  targetName: string;
  onView: () => void;
}) {
  const bins = Array(10).fill(0);
  const min = Math.min(...rows.map((row) => row.target)),
    max = Math.max(...rows.map((row) => row.target));
  rows.forEach((row) => {
    bins[
      Math.min(9, Math.floor(((row.target - min) / (max - min || 1)) * 10))
    ]++;
  });
  const peak = Math.max(...bins);
  return (
    <section className="tree-card tree-overview">
      <h2>DATASET OVERVIEW</h2>
      <div>
        <dl>
          <dt>Name</dt>
          <dd>{datasetName}</dd>
          <dt>Observations</dt>
          <dd>{rows.length.toLocaleString()}</dd>
          <dt>Features</dt>
          <dd>{names.length}</dd>
          <dt>Target</dt>
          <dd>{targetName}</dd>
        </dl>
        <aside>
          <span>Target distribution ({targetName.split(" ")[0]})</span>
          <div>
            {bins.map((value, index) => (
              <i
                key={index}
                style={{ height: `${Math.max(5, (value / peak) * 76)}%` }}
              />
            ))}
          </div>
        </aside>
      </div>
      <button onClick={onView}>
        <Table2 size={13} />
        View Dataset
      </button>
    </section>
  );
}

function NodeInspector({
  node,
  names,
  rootSamples,
  totalRows,
}: {
  node: RegressionTreeNode | undefined;
  names: string[];
  rootSamples: number;
  totalRows: number;
}) {
  return (
    <section className="tree-card tree-inspector">
      <h2>NODE INSPECTOR</h2>
      <p>
        {node
          ? node.featureIndex === undefined
            ? "Selected leaf prediction."
            : `Split on ${names[node.featureIndex]} ≤ ${node.threshold?.toFixed(2)}.`
          : "Select a node in the tree to inspect."}
      </p>
      <div>
        <span>
          Samples (n)
          <b>
            {node ? node.samples.toLocaleString() : "—"}
          </b>
        </span>
        <span>
          Mean Target (ŷ)<b>{node?.value.toFixed(1) ?? "—"}</b>
        </span>
        <span>
          Prediction Range
          <b>{node ? `±${Math.sqrt(node.impurity).toFixed(1)}` : "—"}</b>
        </span>
        <span>
          Depth<b>{node?.depth ?? "—"}</b>
        </span>
        <span>
          % of Data
          <b>
            {node ? `${Math.round((node.samples / rootSamples) * 100)}%` : "—"}
          </b>
        </span>
      </div>
    </section>
  );
}

function SplitHistory({
  tree,
  names,
  totalRows,
}: {
  tree: RegressionTreeNode;
  names: string[];
  totalRows: number;
}) {
  const splits = flattenRegressionTree(tree)
    .filter((node) => node.featureIndex !== undefined)
    .slice(0, 4);
  return (
    <section className="tree-card tree-history">
      <h2>
        SPLIT HISTORY <span>(Top to Bottom)</span>
      </h2>
      <div>
        {splits.map((node, index) => (
          <p key={node.id}>
            <b>{index + 1}</b>
            <span>
              {names[node.featureIndex!]} ≤{" "}
              {node.threshold!.toFixed(node.threshold! < 1 ? 2 : 1)}
            </span>
            <small>
              n=
              {Math.round(
                (node.samples / tree.samples) * totalRows,
              ).toLocaleString()}
            </small>
            <i>Impurity ↓ {node.gain.toFixed(1)}</i>
          </p>
        ))}
      </div>
    </section>
  );
}

function Legend() {
  return (
    <section className="tree-card tree-legend">
      <h2>LEGEND</h2>
      <p>
        <i className="train" />
        Actual (Train)
      </p>
      <p>
        <i className="test" />
        Actual (Test)
      </p>
      <p>
        <i className="line" />
        Tree Prediction
      </p>
      <p>
        <b>n</b>Number of samples
      </p>
      <p>
        <b>ŷ</b>Mean target (prediction)
      </p>
      <p>
        <span>↓</span>Impurity Reduction
      </p>
    </section>
  );
}

function DatasetPanel({
  rows,
  names,
  targetName,
  datasetId,
  onDataset,
  onEdit,
  onAdd,
  onRemove,
  onUpload,
}: {
  rows: TreeRow[];
  names: string[];
  targetName: string;
  datasetId: DatasetId;
  onDataset: (id: BuiltInDatasetId) => void;
  onEdit: (r: number, c: number | "target", v: number) => void;
  onAdd: () => void;
  onRemove: () => void;
  onUpload: () => void;
}) {
  return (
    <section className="tree-tab-panel">
      <div className="tree-tab-heading">
        <div>
          <h2>Dataset Explorer</h2>
          <p>Edit the live rows used to rebuild the tree.</p>
        </div>
        <div>
          <select
            aria-label="Dataset selector"
            value={datasetId}
            onChange={(event) =>
              onDataset(event.target.value as BuiltInDatasetId)
            }
          >
            {datasetId === "imported" && (
              <option value="imported">Imported CSV</option>
            )}
            {Object.entries(datasetMeta)
              .filter(([id]) => id !== "imported")
              .map(([id, meta]) => (
                <option key={id} value={id}>
                  {meta.name}
                </option>
              ))}
          </select>
          <button onClick={onUpload}>
            <Upload size={14} />
            Import CSV
          </button>
        </div>
      </div>
      <div className="tree-data-table">
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
            {rows.slice(0, 8).map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>{rowIndex + 1}</td>
                {row.features.map((value, column) => (
                  <td key={column}>
                    <input
                      aria-label={`Row ${rowIndex + 1} ${names[column]}`}
                      type="number"
                      step="any"
                      value={Number(value.toFixed(4))}
                      onChange={(event) =>
                        onEdit(rowIndex, column, Number(event.target.value))
                      }
                    />
                  </td>
                ))}
                <td>
                  <input
                    aria-label={`Row ${rowIndex + 1} ${targetName}`}
                    type="number"
                    step="any"
                    value={Number(row.target.toFixed(4))}
                    onChange={(event) =>
                      onEdit(rowIndex, "target", Number(event.target.value))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer>
        <span>Showing 8 of {rows.length.toLocaleString()} rows</span>
        <div>
          <button onClick={onAdd}>+ Add Row</button>
          <button onClick={onRemove}>− Remove Last</button>
        </div>
      </footer>
    </section>
  );
}

function GenericPanels({
  tab,
  result,
  names,
  inputs,
  setInputs,
  onVisualize,
  onTrain,
  training,
  trained,
  rows,
  maxDepth,
  minLeaf,
  cost,
  thresholds,
  datasetId,
}: {
  tab: Tab;
  result: ReturnType<typeof fitTree>;
  names: string[];
  inputs: number[];
  setInputs: (v: number[]) => void;
  onVisualize: () => void;
  onTrain: () => void;
  training: boolean;
  trained: boolean;
  rows: TreeRow[];
  maxDepth: number;
  minLeaf: number;
  cost: number;
  thresholds: number[];
  datasetId: DatasetId;
}) {
  if (tab === "learn")
    return (
      <section className="tree-tab-panel tree-learn">
        <h2>Regression trees partition feature space</h2>
        <p>
          Each split chooses a threshold that reduces target variance. Leaves
          predict the mean target of the observations that reach them.
        </p>
        <div>
          <article>
            <GitBranch />
            <strong>Recursive splitting</strong>
            <span>Creates interpretable regions.</span>
          </article>
          <article>
            <BarChart3 />
            <strong>Piecewise prediction</strong>
            <span>One mean value per leaf.</span>
          </article>
          <article>
            <Target />
            <strong>Variance reduction</strong>
            <span>Chooses useful thresholds.</span>
          </article>
        </div>
        <button onClick={onVisualize}>Open Visualization</button>
      </section>
    );
  if (tab === "train")
    return (
      <section className="tree-tab-panel tree-train">
        <div>
          <span className={trained ? "ready" : ""}>
            {training ? "…" : trained ? "✓" : "○"}
          </span>
          <h2>
            {training
              ? "Finding variance-reducing splits…"
              : trained
                ? "Tree training complete"
                : "Ready to train the tree"}
          </h2>
          <p>
            Build a depth-{maxDepth} CART regressor with at least {minLeaf}{" "}
            samples per leaf.
          </p>
          <button onClick={onTrain}>
            <Play size={15} />
            {training ? "Training…" : trained ? "Train Again" : "Train Tree"}
          </button>
        </div>
        <aside>
          <article>
            <small>Training rows</small>
            <strong>{result.training.length}</strong>
          </article>
          <article>
            <small>Test rows</small>
            <strong>{result.test.length}</strong>
          </article>
          <article>
            <small>Leaves</small>
            <strong>{regressionTreeLeaves(result.tree)}</strong>
          </article>
          <article>
            <small>Tree depth</small>
            <strong>{regressionTreeDepth(result.tree)}</strong>
          </article>
        </aside>
      </section>
    );
  if (tab === "metrics")
    return (
      <section className="tree-tab-panel">
        <div className="tree-metrics">
          {[
            ["RMSE", result.testRmse, "#51d6df"],
            ["MAE", result.testMae, "#8c6ef2"],
            ["R²", result.testR2, "#55da8c"],
            ["MSE", result.testMse, "#efa63a"],
          ].map(([label, value, color]) => (
            <article key={label as string}>
              <small>{label}</small>
              <strong style={{ color: color as string }}>
                {(value as number).toFixed(4)}
              </strong>
              <p>Held-out test set</p>
            </article>
          ))}
        </div>
      </section>
    );
  if (tab === "compare") {
    const models = [1, 2, 3, 4, 5, 6].map((depth) => ({
      depth,
      fit: fitTree(rows, datasetId, depth, minLeaf, cost, thresholds),
    }));
    return (
      <section className="tree-tab-panel">
        <div className="tree-tab-heading">
          <div>
            <h2>Depth Comparison</h2>
            <p>Compare genuine tree fits on the active train/test split.</p>
          </div>
        </div>
        <div className="tree-compare">
          {models.map(({ depth, fit }) => (
            <article key={depth}>
              <small>Depth {depth}</small>
              <strong>{fit.testRmse.toFixed(2)}</strong>
              <p>Test RMSE</p>
              <span>{regressionTreeLeaves(fit.tree)} leaves</span>
            </article>
          ))}
        </div>
      </section>
    );
  }
  const prediction = result.predict(inputs);
  return (
    <section className="tree-tab-panel tree-explain">
      <div>
        <h2>Live Tree Inference</h2>
        <p>
          Edit a new observation to follow a live decision path to its leaf
          prediction.
        </p>
        <div>
          {names.map((name, index) => (
            <label key={name}>
              {name}
              <input
                aria-label={`Prediction ${name}`}
                type="number"
                step="0.1"
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
      </div>
      <aside>
        <small>Predicted target</small>
        <strong>{prediction.toFixed(2)}</strong>
        <ol>
          {regressionTreePath(result.tree, inputs).map((node) => (
            <li key={node.id}>
              {node.featureIndex === undefined
                ? `Leaf ŷ = ${node.value.toFixed(2)} (n=${node.samples})`
                : `${names[node.featureIndex]} ${inputs[node.featureIndex] <= (node.threshold ?? 0) ? "≤" : ">"} ${node.threshold?.toFixed(2)}`}
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}

export default function DecisionTreeRegressionPage() {
  const [tab, setTab] = useUrlTab<Tab>("visualize");
  const [datasetId, setDatasetId] = useState<DatasetId>("bike");
  const [rows, setRows] = useState<TreeRow[]>(() => datasetFactories.bike());
  const [names, setNames] = useState(datasetMeta.bike.features);
  const [targetName, setTargetName] = useState(datasetMeta.bike.target);
  const [thresholds, setThresholds] = useState([0.62, 20.5, 23.5, 17.5]);
  const [maxDepth, setMaxDepth] = useState(3);
  const [minLeaf, setMinLeaf] = useState(50);
  const [cost, setCost] = useState(0);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [selectedNode, setSelectedNode] = useState("root");
  const [showSamples, setShowSamples] = useState(true);
  const [controlMode, setControlMode] = useState<"manage" | "prune">("manage");
  const [training, setTraining] = useState(false);
  const [trained, setTrained] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [softTheme, setSoftTheme] = useState(false);
  const [inputs, setInputs] = useState(rows[0].features);
  const fileRef = useRef<HTMLInputElement>(null);
  const result = useMemo(
    () => fitTree(rows, datasetId, maxDepth, minLeaf, cost, thresholds),
    [rows, datasetId, maxDepth, minLeaf, cost, thresholds],
  );
  const nodes = flattenRegressionTree(result.tree);
  const selected = nodes.find((node) => node.id === selectedNode);
  const dirty = () => setTrained(false);
  const selectDataset = (id: BuiltInDatasetId) => {
    const next = datasetFactories[id]();
    setDatasetId(id);
    setRows(next);
    setNames(datasetMeta[id].features);
    setTargetName(datasetMeta[id].target);
    setInputs(next[0].features);
    setFeatureIndex(0);
    setSelectedNode("root");
    dirty();
  };
  const reset = () => {
    const next = datasetFactories.bike();
    setDatasetId("bike");
    setRows(next);
    setNames(datasetMeta.bike.features);
    setTargetName(datasetMeta.bike.target);
    setThresholds([0.62, 20.5, 23.5, 17.5]);
    setMaxDepth(3);
    setMinLeaf(50);
    setCost(0);
    setFeatureIndex(0);
    setSelectedNode("root");
    setShowSamples(true);
    setControlMode("manage");
    setInputs(next[0].features);
    setTraining(false);
    setTrained(false);
  };
  const train = () => {
    setTraining(true);
    window.setTimeout(() => {
      setTraining(false);
      setTrained(true);
    }, 500);
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
    dirty();
  };
  const importCsv = async (file: File) => {
    const parsed = parseRegressionCsv(await file.text());
    if (!parsed) return;
    const imported = parsed.rows;
    setDatasetId("imported");
    setRows(imported);
    setNames(parsed.headers.slice(0, -1));
    setTargetName(parsed.headers.at(-1) ?? "target");
    setInputs(imported[0].features);
    setFeatureIndex(0);
    setTab("dataset");
    dirty();
  };
  return (
    <div
      className={`tree-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}${softTheme ? " soft-theme" : ""}`}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed((value) => !value)}
      />
      <main className="tree-main">
        <div className="tree-topbar">
          <div>
            <span>Supervised Learning</span>
            <b>›</b>
            <span>Regression</span>
            <b>›</b>
            <strong>Decision Tree Regression</strong>
          </div>
          <div>
            <label>
              Lesson Progress <LabProgressMeter />
            </label>
            <button aria-label="Help" onClick={() => setTab("learn")}>
              <CircleHelp size={16} />
            </button>
            <button
              aria-label="Settings"
              onClick={() => {
                setControlMode("manage");
              }}
            >
              <Settings size={16} />
            </button>
            <button
              aria-label="Toggle theme contrast"
              aria-pressed={softTheme}
              onClick={() => setSoftTheme((value) => !value)}
            >
              <Moon size={17} />
            </button>
          </div>
        </div>
        <header className="tree-header">
          <div>
            <h1>
              Decision Tree Regression{" "}
              <button onClick={() => setTab("learn")}>
                <Info size={13} />
                How it works
              </button>
            </h1>
            <p>
              Predict continuous values by recursively splitting the feature
              space into regions with similar targets.
            </p>
          </div>
          <nav aria-label="Lesson sections">
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
        </header>
        <div className="tree-dataset-bar">
          <span>Dataset</span>
          <select
            aria-label="Dataset quick selector"
            value={datasetId}
            onChange={(event) =>
              selectDataset(event.target.value as BuiltInDatasetId)
            }
          >
            {datasetId === "imported" && (
              <option value="imported">Imported CSV</option>
            )}
            {Object.entries(datasetMeta)
              .filter(([id]) => id !== "imported")
              .map(([id, meta]) => (
                <option value={id} key={id}>
                  {meta.name}
                </option>
              ))}
          </select>
          <span>
            Samples <b>{rows.length.toLocaleString()}</b>
          </span>
          <span>
            Features <b>{names.length}</b>
          </span>
          <span>
            Target <b>{targetName}</b>
          </span>
          <button onClick={() => fileRef.current?.click()}>
            <Upload size={14} />
            Switch / Upload
          </button>
        </div>
        <div className="tree-content">
          <div className="tree-workspace">
            {tab === "visualize" && (
              <>
                <div className="tree-top-grid">
                  <TreeCanvas
                    tree={result.tree}
                    names={names}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    showSamples={showSamples}
                    setShowSamples={setShowSamples}
                    totalRows={rows.length}
                  />
                  <PredictionChart
                    result={result}
                    featureIndex={featureIndex}
                    setFeatureIndex={setFeatureIndex}
                    names={names}
                    targetName={targetName}
                    rows={rows}
                  />
                </div>
                <div className="tree-bottom-grid">
                  <DatasetOverview
                    rows={rows}
                    names={names}
                    datasetName={
                      datasetId === "imported"
                        ? "Imported CSV"
                        : datasetMeta[datasetId].name
                    }
                    targetName={targetName}
                    onView={() => setTab("dataset")}
                  />
                  <NodeInspector
                    node={selected}
                    names={names}
                    rootSamples={result.tree.samples}
                    totalRows={rows.length}
                  />
                  <SplitHistory
                    tree={result.tree}
                    names={names}
                    totalRows={rows.length}
                  />
                </div>
              </>
            )}
            {tab === "dataset" && (
              <DatasetPanel
                rows={rows}
                names={names}
                targetName={targetName}
                datasetId={datasetId}
                onDataset={selectDataset}
                onEdit={edit}
                onAdd={() => {
                  setRows((current) => [
                    ...current,
                    { features: Array(names.length).fill(0), target: 0 },
                  ]);
                  dirty();
                }}
                onRemove={() => {
                  if (rows.length > 4) {
                    setRows((current) => current.slice(0, -1));
                    dirty();
                  }
                }}
                onUpload={() => fileRef.current?.click()}
              />
            )}
            {tab !== "visualize" && tab !== "dataset" && (
              <GenericPanels
                tab={tab}
                result={result}
                names={names}
                inputs={inputs}
                setInputs={setInputs}
                onVisualize={() => setTab("visualize")}
                onTrain={train}
                training={training}
                trained={trained}
                rows={rows}
                maxDepth={maxDepth}
                minLeaf={minLeaf}
                cost={cost}
                thresholds={thresholds}
                datasetId={datasetId}
              />
            )}
          </div>
          <aside className="tree-right">
            <TreeControls
              thresholds={thresholds}
              setThresholds={(values) => {
                setThresholds(values);
                dirty();
              }}
              maxDepth={maxDepth}
              setMaxDepth={(value) => {
                setMaxDepth(value);
                dirty();
              }}
              minLeaf={minLeaf}
              setMinLeaf={(value) => {
                setMinLeaf(value);
                dirty();
              }}
              cost={cost}
              setCost={(value) => {
                setCost(value);
                dirty();
              }}
              onUpdate={train}
              training={training}
              mode={controlMode}
              setMode={setControlMode}
              onReset={reset}
            />
            <Legend />
          </aside>
        </div>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importCsv(file);
            event.currentTarget.value = "";
          }}
        />
      </main>
    </div>
  );
}
