import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Box,
  Check,
  ChevronDown,
  ChevronLeft,
  CloudUpload,
  Database,
  Download,
  Ellipsis,
  FileText,
  FlaskConical,
  Home,
  Info,
  Lightbulb,
  Play,
  Rocket,
  RotateCcw,
  Save,
  Settings,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  energyDemandDataset,
  housingDataset,
} from "../../../../data/sampleDatasets";
import { elasticNetRegression } from "../../../../lib/algorithms/regression/linearRegression";
import { mae, mse, rSquared, rmse } from "../../../../lib/math/metrics";
import "./ElasticNetRegressionPage.css";

type ElasticRow = { features: number[]; target: number };
type BuiltInDatasetId = "california" | "housing" | "energy" | "sparse";
type DatasetId = BuiltInDatasetId | "imported";
type Tab =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
type PathMode = "combined" | "lasso" | "ridge";

const tabs: Array<[Tab, string]> = [
  ["learn", "Learn"],
  ["visualize", "Visualize"],
  ["dataset", "Dataset"],
  ["train", "Train"],
  ["metrics", "Metrics"],
  ["compare", "Compare"],
  ["explain", "Explain"],
];

const colors = [
  "#18dce5",
  "#19b5df",
  "#4c9ee8",
  "#4b83ea",
  "#7453db",
  "#895ce8",
  "#4eabbc",
  "#49d28c",
  "#ef973d",
  "#f24f66",
];

const alphaValues = Array.from(
  { length: 16 },
  (_, index) => 10 ** (-4 + index / 3),
);

const noise = (index: number, salt = 0) => {
  const raw = Math.sin(index * 73.173 + salt * 19.931) * 43217.381;
  return (raw - Math.floor(raw)) * 2 - 1;
};

function californiaRows(count = 240): ElasticRow[] {
  return Array.from({ length: count }, (_, index) => {
    const features = [
      Math.sin(index * 0.029),
      Math.cos(index * 0.043 + 0.3),
      Math.sin(index * 0.067 + 1.1),
      Math.cos(index * 0.083 + 2.2),
      Math.sin(index * 0.101 + 0.7),
      Math.cos(index * 0.127 + 1.8),
      Math.sin(index * 0.149 + 2.4),
      Math.cos(index * 0.173 + 0.9),
      Math.sin(index * 0.193 + 1.5),
      Math.cos(index * 0.211 + 2.7),
    ].map((value, column) => value + noise(index, column) * 0.055);
    const coefficients = [
      0.72, -0.52, 0.36, -0.25, -0.17, -0.12, 0.09, -0.07, 0, 0,
    ];
    return {
      features,
      target:
        2.85 +
        features.reduce(
          (sum, feature, column) => sum + feature * coefficients[column],
          0,
        ) +
        noise(index, 15) * 0.17,
    };
  });
}

function sparseRows(count = 180): ElasticRow[] {
  return Array.from({ length: count }, (_, index) => {
    const x = -3 + (index * 6) / (count - 1);
    const features = [
      x,
      x + noise(index) * 0.25,
      x * x,
      Math.sin(x),
      Math.cos(x),
      noise(index, 8),
    ];
    return {
      features,
      target:
        1.1 +
        1.35 * features[0] +
        0.42 * features[3] -
        0.3 * features[4] +
        noise(index, 9) * 0.28,
    };
  });
}

const datasetFactories: Record<BuiltInDatasetId, () => ElasticRow[]> = {
  california: () => californiaRows(),
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
  energy: () =>
    (energyDemandDataset.data as Array<Record<string, number>>).map((row) => ({
      features: [
        row.temperature_c,
        row.humidity,
        row.wind_kph,
        row.is_weekend,
        row.hour_of_day,
      ],
      target: row.demand_mw,
    })),
  sparse: () => sparseRows(),
};

const datasetMeta: Record<
  DatasetId,
  { name: string; target: string; features: string[]; description: string }
> = {
  california: {
    name: "California Housing",
    target: "MedHouseVal",
    features: [
      "MedInc",
      "HouseAge",
      "AveRooms",
      "AveBedrms",
      "Population",
      "AveOccup",
      "Latitude",
      "Longitude",
      "HouseValue",
      "NearBay",
    ],
    description: "Median House Value prediction",
  },
  housing: {
    name: "Housing Prices",
    target: "Price",
    features: ["Area", "Bedrooms", "Bathrooms", "Age", "Distance"],
    description: "Home characteristics and sale prices",
  },
  energy: {
    name: "Energy Demand",
    target: "Demand",
    features: ["Temperature", "Humidity", "Wind", "Weekend", "Hour"],
    description: "Weather-driven electricity demand",
  },
  sparse: {
    name: "Synthetic Sparse",
    target: "Target",
    features: ["Signal", "Correlated", "Squared", "Seasonal", "Cycle", "Noise"],
    description: "Controlled sparse correlated regression",
  },
  imported: {
    name: "Imported CSV",
    target: "Target",
    features: [],
    description: "User-provided numeric regression data",
  },
};

function sampledRows(rows: ElasticRow[], limit: number) {
  if (rows.length <= limit) return rows;
  const stride = rows.length / limit;
  return Array.from(
    { length: limit },
    (_, index) => rows[Math.floor(index * stride)],
  );
}

function fitElastic(
  rows: ElasticRow[],
  alpha: number,
  l1Ratio: number,
  targetStandardized: boolean,
  selected: boolean[],
  maxIter = 1200,
) {
  const activeIndices = selected
    .map((active, index) => (active ? index : -1))
    .filter((index) => index >= 0);
  if (!activeIndices.length) activeIndices.push(0);
  const working = sampledRows(rows, 900);
  const training = working.filter((_, index) => index % 5 !== 0);
  const test = working.filter((_, index) => index % 5 === 0);
  const trainTargets = training.map((row) => row.target);
  const targetMean = targetStandardized
    ? trainTargets.reduce((sum, value) => sum + value, 0) / trainTargets.length
    : 0;
  const targetStd = targetStandardized
    ? Math.sqrt(
        trainTargets.reduce(
          (sum, value) => sum + (value - targetMean) ** 2,
          0,
        ) / trainTargets.length,
      ) || 1
    : 1;
  const model = elasticNetRegression(
    training.map((row) => activeIndices.map((index) => row.features[index])),
    trainTargets.map((value) => (value - targetMean) / targetStd),
    alpha,
    l1Ratio,
    maxIter,
    1e-5,
    true,
    true,
  );
  const predict = (features: number[]) =>
    model.predict(activeIndices.map((index) => features[index])) * targetStd +
    targetMean;
  const coefficients = selected.map(() => 0);
  activeIndices.forEach((originalIndex, position) => {
    coefficients[originalIndex] = model.coefficients[position];
  });
  const trainActual = training.map((row) => row.target);
  const trainPredicted = training.map((row) => predict(row.features));
  const testActual = test.map((row) => row.target);
  const testPredicted = test.map((row) => predict(row.features));
  return {
    coefficients,
    intercept: model.intercept * targetStd + targetMean,
    predict,
    training,
    test,
    trainMse: mse(trainActual, trainPredicted),
    testMse: mse(testActual, testPredicted),
    testRmse: rmse(testActual, testPredicted),
    testMae: mae(testActual, testPredicted),
    testR2: rSquared(testActual, testPredicted),
  };
}

function coefficientPath(
  rows: ElasticRow[],
  l1Ratio: number,
  targetStandardized: boolean,
  selected: boolean[],
) {
  return alphaValues.map((alpha) => ({
    alpha,
    coefficients: fitElastic(
      rows,
      alpha,
      l1Ratio,
      targetStandardized,
      selected,
      220,
    ).coefficients,
  }));
}

function comparisonCurves(
  rows: ElasticRow[],
  targetStandardized: boolean,
  selected: boolean[],
  l1Ratio: number,
) {
  return (
    [
      ["elastic", l1Ratio],
      ["ridge", 0],
      ["lasso", 1],
    ] as const
  ).map(([kind, ratio]) => ({
    kind,
    points: alphaValues.map((alpha) => ({
      alpha,
      score: fitElastic(rows, alpha, ratio, targetStandardized, selected, 180)
        .testR2,
    })),
  }));
}

function Sidebar({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse: () => void;
}) {
  const items = [
    [Home, "Home"],
    [Sparkles, "Playground"],
    [Database, "Datasets"],
    [Box, "Models"],
    [Lightbulb, "Learning"],
    [FlaskConical, "Experiments"],
    [Rocket, "Deployments"],
    [FileText, "Reports"],
    [Settings, "Settings"],
  ] as const;
  return (
    <aside className={`elastic-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="elastic-brand">
        <span>
          <Activity size={21} />
        </span>
        {!collapsed && (
          <div>
            <strong>Mega ML</strong>
            <small>AI Observatory</small>
          </div>
        )}
        <button aria-label="Collapse sidebar" onClick={onCollapse}>
          <ChevronLeft size={15} />
        </button>
      </div>
      <nav>
        {items.map(([Icon, label]) => (
          <Link
            to={label === "Home" ? "/" : "#"}
            className={label === "Learning" ? "active" : ""}
            key={label}
            title={label}
          >
            <Icon size={15} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="elastic-workspace-switch">
        <small>Active Workspace</small>
        <strong>AI Observatory</strong>
        <ChevronDown size={13} />
      </div>
      <div className="elastic-user">
        <span>AD</span>
        {!collapsed && (
          <div>
            <strong>Alex Developer</strong>
            <small>Pro Plan</small>
          </div>
        )}
      </div>
    </aside>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2>
      {children}
      <Info size={13} />
    </h2>
  );
}

function PathChart({
  path,
  alpha,
  names,
  mode,
  setMode,
  targetStandardized,
  setTargetStandardized,
}: {
  path: ReturnType<typeof coefficientPath>;
  alpha: number;
  names: string[];
  mode: PathMode;
  setMode: (mode: PathMode) => void;
  targetStandardized: boolean;
  setTargetStandardized: (value: boolean) => void;
}) {
  const width = 850,
    height = 330,
    left = 100,
    top = 46,
    plotWidth = 700,
    plotHeight = 224;
  const cap = Math.max(
    ...path
      .flatMap((point) => point.coefficients)
      .map((value) => Math.abs(value)),
    0.1,
  );
  const x = (value: number) => left + ((Math.log10(value) + 4) / 5) * plotWidth;
  const y = (value: number) =>
    top + plotHeight / 2 - (value / cap) * (plotHeight / 2);
  const selectedX = x(Math.max(1e-4, Math.min(10, alpha)));
  return (
    <section className="elastic-card elastic-path-card">
      <header>
        <CardTitle>Coefficient Paths (Elastic Net)</CardTitle>
        <div className="elastic-path-tabs">
          {(["combined", "lasso", "ridge"] as PathMode[]).map((id) => (
            <button
              key={id}
              className={mode === id ? "active" : ""}
              onClick={() => setMode(id)}
            >
              {id === "combined"
                ? "Combined"
                : id === "lasso"
                  ? "L1 Path (Lasso)"
                  : "L2 Path (Ridge)"}
            </button>
          ))}
        </div>
        <label>
          Target Standardized{" "}
          <button
            role="switch"
            aria-checked={targetStandardized}
            className={targetStandardized ? "on" : ""}
            onClick={() => setTargetStandardized(!targetStandardized)}
          >
            <i />
          </button>
          <Info size={13} />
        </label>
      </header>
      <div className="elastic-path-body">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Elastic Net coefficient paths"
        >
          {[-1, -0.5, 0, 0.5, 1].map((tick) => {
            const ty = top + ((1 - tick) / 2) * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={left}
                  y1={ty}
                  x2={left + plotWidth}
                  y2={ty}
                  className="grid"
                />
                <text x={left - 16} y={ty + 4} textAnchor="end">
                  {tick.toFixed(tick % 1 ? 1 : 0)}
                </text>
              </g>
            );
          })}
          {[-4, -3, -2, -1, 0, 1].map((tick) => {
            const tx = left + ((tick + 4) / 5) * plotWidth;
            return (
              <g key={tick}>
                <line
                  x1={tx}
                  y1={top}
                  x2={tx}
                  y2={top + plotHeight}
                  className="grid vertical"
                />
                <text x={tx} y={top + plotHeight + 23} textAnchor="middle">
                  10<tspan baselineShift="super">{tick}</tspan>
                </text>
              </g>
            );
          })}
          {names.map((_, feature) => (
            <polyline
              key={feature}
              points={path
                .map(
                  (point) =>
                    `${x(point.alpha)},${y(point.coefficients[feature] ?? 0)}`,
                )
                .join(" ")}
              fill="none"
              stroke={colors[feature % colors.length]}
              strokeWidth="1.5"
            />
          ))}
          <line
            x1={selectedX}
            y1={top - 3}
            x2={selectedX}
            y2={top + plotHeight}
            className="selected"
          />
          <rect
            x={selectedX - 36}
            y={12}
            width="72"
            height="25"
            rx="5"
            className="alpha-tag"
          />
          <text
            x={selectedX}
            y={29}
            textAnchor="middle"
            className="alpha-label"
          >
            α = {alpha.toFixed(4)}
          </text>
          <text
            x={left + plotWidth / 2}
            y={height - 7}
            textAnchor="middle"
            className="axis"
          >
            Alpha (log scale)
          </text>
          <text
            transform={`translate(16 ${top + plotHeight / 2}) rotate(-90)`}
            textAnchor="middle"
            className="axis"
          >
            Standardized Coefficient
          </text>
        </svg>
        <aside>
          <small>Features</small>
          {names.map((name, index) => (
            <span key={name} className={index > 7 ? "highlight" : ""}>
              <i style={{ background: colors[index % colors.length] }} />
              {name}
            </span>
          ))}
        </aside>
      </div>
    </section>
  );
}

function MiniCurve({
  kind,
  points,
}: {
  kind: string;
  points: Array<{ alpha: number; score: number }>;
}) {
  const palette =
    kind === "elastic" ? "#18dce5" : kind === "ridge" ? "#9c69ef" : "#f2a02d";
  const width = 260,
    height = 155,
    left = 40,
    top = 28,
    plotWidth = 205,
    plotHeight = 92;
  const x = (alpha: number) => left + ((Math.log10(alpha) + 4) / 6) * plotWidth;
  const y = (score: number) =>
    top + (1 - Math.max(0, Math.min(1, score))) * plotHeight;
  const best = points.reduce(
    (winner, item) => (item.score > winner.score ? item : winner),
    points[0],
  );
  return (
    <article className="elastic-mini">
      <header>
        <strong>
          {kind === "elastic"
            ? "Elastic Net"
            : kind === "ridge"
              ? "Ridge (L2)"
              : "Lasso (L1)"}
        </strong>
        <span>
          Best R² <b>{best.score.toFixed(3)}</b>
        </span>
      </header>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${kind} model comparison`}
      >
        <defs>
          <linearGradient id={`fill-${kind}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={palette} stopOpacity=".22" />
            <stop offset="1" stopColor={palette} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1={left}
          y1={top}
          x2={left}
          y2={top + plotHeight}
          className="axis-line"
        />
        <line
          x1={left}
          y1={top + plotHeight}
          x2={left + plotWidth}
          y2={top + plotHeight}
          className="axis-line"
        />
        <polygon
          points={`${left},${top + plotHeight} ${points.map((item) => `${x(item.alpha)},${y(item.score)}`).join(" ")} ${left + plotWidth},${top + plotHeight}`}
          fill={`url(#fill-${kind})`}
        />
        <polyline
          points={points
            .map((item) => `${x(item.alpha)},${y(item.score)}`)
            .join(" ")}
          fill="none"
          stroke={palette}
          strokeWidth="2"
          strokeDasharray="5 3"
        />
        <line
          x1={x(best.alpha)}
          y1={top}
          x2={x(best.alpha)}
          y2={top + plotHeight}
          className="best-line"
        />
        <circle
          cx={x(best.alpha)}
          cy={y(best.score)}
          r="4.5"
          fill="white"
          stroke={palette}
          strokeWidth="2"
        />
        {[-4, -2, 0, 2].map((tick) => (
          <text
            key={tick}
            x={left + ((tick + 4) / 6) * plotWidth}
            y={top + plotHeight + 18}
            textAnchor="middle"
          >
            10<tspan baselineShift="super">{tick}</tspan>
          </text>
        ))}
        <text
          transform={`translate(12 ${top + plotHeight / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          R² (Test)
        </text>
      </svg>
    </article>
  );
}

function ModelComparison({
  curves,
}: {
  curves: ReturnType<typeof comparisonCurves>;
}) {
  return (
    <section className="elastic-card elastic-comparison">
      <header>
        <CardTitle>
          Model Comparison <span>(Test R² vs. Alpha)</span>
        </CardTitle>
      </header>
      <div>
        {curves.map((curve) => (
          <MiniCurve key={curve.kind} {...curve} />
        ))}
      </div>
    </section>
  );
}

function Insights({
  result,
  alpha,
  l1Ratio,
  featureCount,
}: {
  result: ReturnType<typeof fitElastic>;
  alpha: number;
  l1Ratio: number;
  featureCount: number;
}) {
  const selected = result.coefficients.filter(
    (value) => Math.abs(value) > 1e-4,
  ).length;
  const cards = [
    ["Best Model", "(Elastic Net)", result.testR2.toFixed(3), "R² (Test)"],
    [
      "Selected Features",
      "",
      `${selected} / ${featureCount}`,
      `${Math.round((selected / featureCount) * 100)}%`,
    ],
    [
      "Sparsity",
      "",
      `${Math.round((1 - selected / featureCount) * 100)}%`,
      "L1 Ratio Effect",
    ],
    ["Alpha (α)", "", alpha.toFixed(4), "Optimal"],
    ["L1 Ratio", "", l1Ratio.toFixed(2), "Mixing"],
  ];
  return (
    <section className="elastic-insights">
      <article>
        <h3>Key Insights</h3>
        <p>
          ⚯ Elastic Net balances L1 and L2 penalties to handle correlated
          features and perform selection.
        </p>
        <p>
          ◷ Best performance at α = {alpha.toFixed(4)}, L1 ratio ={" "}
          {l1Ratio.toFixed(2)}.
        </p>
        <p>
          ♙ {selected} of {featureCount} features retained with non-zero
          coefficients.
        </p>
      </article>
      <div>
        {cards.map(([title, sub, value, foot], index) => (
          <article key={title}>
            <small>
              {title} {sub && <b>{sub}</b>}
            </small>
            <strong className={`tone-${index}`}>{value}</strong>
            <p>{foot}</p>
            {index === 0 && (
              <em>
                RMSE (Test)<b>{result.testRmse.toFixed(3)}</b>
              </em>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

type ControlsProps = {
  alpha: number;
  setAlpha: (v: number) => void;
  l1Ratio: number;
  setL1Ratio: (v: number) => void;
  onReset: () => void;
};
function Controls({
  alpha,
  setAlpha,
  l1Ratio,
  setL1Ratio,
  onReset,
}: ControlsProps) {
  return (
    <section className="elastic-card elastic-controls">
      <header>
        <CardTitle>Regularization Controls</CardTitle>
        <button onClick={onReset}>Reset</button>
      </header>
      <label>
        Alpha (Overall Strength)
        <input
          aria-label="Alpha overall strength value"
          type="number"
          min="0.0001"
          max="100"
          step="0.0001"
          value={alpha}
          onChange={(e) => setAlpha(Math.max(0.0001, Number(e.target.value)))}
        />
      </label>
      <input
        aria-label="Alpha overall strength"
        type="range"
        min={-4}
        max={2}
        step={0.05}
        value={Math.log10(alpha)}
        onChange={(e) => setAlpha(10 ** Number(e.target.value))}
      />
      <div className="elastic-ticks">
        {[-4, -3, -2, -1, 0, 1, 2].map((tick) => (
          <span key={tick}>
            10<sup>{tick}</sup>
          </span>
        ))}
      </div>
      <hr />
      <label>
        L1 Ratio (Mixing)
        <input
          aria-label="L1 ratio value"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={l1Ratio}
          onChange={(e) =>
            setL1Ratio(Math.max(0, Math.min(1, Number(e.target.value))))
          }
        />
      </label>
      <input
        aria-label="L1 ratio mixing"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={l1Ratio}
        onChange={(e) => setL1Ratio(Number(e.target.value))}
      />
      <div className="elastic-ratio-ticks">
        <span>0.00</span>
        <span>0.25</span>
        <span>0.50</span>
        <span>0.75</span>
        <span>1.00</span>
      </div>
      <div className="elastic-extremes">
        <span>0 = Ridge (L2)</span>
        <span>1 = Lasso (L1)</span>
      </div>
    </section>
  );
}

function FeatureTable({
  names,
  coefficients,
  selected,
  setSelected,
}: {
  names: string[];
  coefficients: number[];
  selected: boolean[];
  setSelected: (values: boolean[]) => void;
}) {
  const active = selected.filter(Boolean).length;
  return (
    <section className="elastic-card elastic-feature-table">
      <header>
        <h2>Active Features ({names.length})</h2>
      </header>
      <div className="elastic-table-head">
        <span>Feature</span>
        <span>Coefficient</span>
        <span>|Coefficient|</span>
        <span>Selected</span>
      </div>
      <div className="elastic-table-body">
        {names.map((name, index) => (
          <div key={name}>
            <span>{name}</span>
            <b className={(coefficients[index] ?? 0) < 0 ? "negative" : ""}>
              {(coefficients[index] ?? 0).toFixed(3)}
            </b>
            <span>{Math.abs(coefficients[index] ?? 0).toFixed(3)}</span>
            <label>
              <input
                aria-label={`Select ${name}`}
                type="checkbox"
                checked={selected[index]}
                onChange={(event) =>
                  setSelected(
                    selected.map((value, i) =>
                      i === index ? event.target.checked : value,
                    ),
                  )
                }
              />
              <i>
                <Check size={11} />
              </i>
            </label>
          </div>
        ))}
      </div>
      <footer>
        <span>
          {active} / {names.length} features selected
        </span>
        <button
          onClick={() =>
            setSelected(coefficients.map((value) => Math.abs(value) > 1e-4))
          }
        >
          <SlidersHorizontal size={13} />
          Select Non-Zero
        </button>
      </footer>
    </section>
  );
}

function DatasetCard({
  datasetId,
  rows,
  names,
  onView,
  onChange,
  onUpload,
}: {
  datasetId: DatasetId;
  rows: ElasticRow[];
  names: string[];
  onView: () => void;
  onChange: () => void;
  onUpload: () => void;
}) {
  const meta = datasetMeta[datasetId];
  return (
    <section className="elastic-card elastic-dataset-card">
      <header>
        <CardTitle>Dataset</CardTitle>
      </header>
      <div className="elastic-dataset-info">
        <span>
          <Database size={17} />
        </span>
        <div>
          <strong>
            {meta.name}
            <i>Sample</i>
          </strong>
          <small>
            {rows.length.toLocaleString()} rows&nbsp; • &nbsp;{names.length}{" "}
            features
          </small>
          <small>{meta.description}</small>
        </div>
        <div>
          <button onClick={onView}>
            View Dataset <ChevronDown size={12} />
          </button>
          <button onClick={onChange}>
            Change Dataset <ChevronDown size={12} />
          </button>
        </div>
      </div>
      <div className="elastic-upload">
        <div>
          <strong>Upload your own dataset</strong>
          <small>CSV with header row. Max size 50MB.</small>
        </div>
        <button onClick={onUpload}>
          <CloudUpload size={14} />
          Upload CSV
        </button>
      </div>
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
  rows: ElasticRow[];
  names: string[];
  targetName: string;
  datasetId: DatasetId;
  onDataset: (id: BuiltInDatasetId) => void;
  onEdit: (row: number, column: number | "target", value: number) => void;
  onAdd: () => void;
  onRemove: () => void;
  onUpload: () => void;
}) {
  return (
    <section className="elastic-tab-panel">
      <div className="elastic-tab-heading">
        <div>
          <h2>Dataset Explorer</h2>
          <p>
            Edit features and targets; every fit uses the current live values.
          </p>
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
                <option value={id} key={id}>
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
      <div className="elastic-data-table">
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
                      onChange={(e) =>
                        onEdit(rowIndex, column, Number(e.target.value))
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
                    onChange={(e) =>
                      onEdit(rowIndex, "target", Number(e.target.value))
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

function TrainPanel({
  result,
  alpha,
  l1Ratio,
  training,
  trained,
  onTrain,
}: {
  result: ReturnType<typeof fitElastic>;
  alpha: number;
  l1Ratio: number;
  training: boolean;
  trained: boolean;
  onTrain: () => void;
}) {
  return (
    <section className="elastic-tab-panel elastic-train-panel">
      <div>
        <span className={trained ? "ready" : ""}>
          {training ? "…" : trained ? "✓" : "○"}
        </span>
        <h2>
          {training
            ? "Optimizing mixed penalties…"
            : trained
              ? "Elastic Net trained"
              : "Ready to train Elastic Net"}
        </h2>
        <p>
          Coordinate descent fits the live dataset with α = {alpha.toFixed(4)}{" "}
          and L1 ratio = {l1Ratio.toFixed(2)}.
        </p>
        <button onClick={onTrain} disabled={training}>
          <Play size={16} />
          {training ? "Training…" : trained ? "Train Again" : "Train Model"}
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
          <small>Active features</small>
          <strong>
            {
              result.coefficients.filter((value) => Math.abs(value) > 1e-4)
                .length
            }
          </strong>
        </article>
        <article>
          <small>Intercept</small>
          <strong>{result.intercept.toFixed(3)}</strong>
        </article>
      </aside>
    </section>
  );
}

function MetricsPanel({ result }: { result: ReturnType<typeof fitElastic> }) {
  const metrics = [
    ["Test R²", result.testR2, "#21d9de"],
    ["RMSE", result.testRmse, "#56dd8d"],
    ["MAE", result.testMae, "#9d70f3"],
    ["MSE", result.testMse, "#f2a13a"],
  ] as const;
  return (
    <section className="elastic-tab-panel">
      <div className="elastic-metrics">
        {metrics.map(([label, value, color]) => (
          <article key={label}>
            <small>{label}</small>
            <strong style={{ color }}>{value.toFixed(4)}</strong>
            <p>Held-out test data</p>
          </article>
        ))}
      </div>
      <div className="elastic-summary">
        <h2>Generalization</h2>
        <span>
          Training MSE <b>{result.trainMse.toFixed(4)}</b>
        </span>
        <span>
          Test MSE <b>{result.testMse.toFixed(4)}</b>
        </span>
        <span>
          Gap <b>{(result.testMse - result.trainMse).toFixed(4)}</b>
        </span>
      </div>
    </section>
  );
}

function ExplainPanel({
  result,
  names,
  targetName,
  inputs,
  setInputs,
}: {
  result: ReturnType<typeof fitElastic>;
  names: string[];
  targetName: string;
  inputs: number[];
  setInputs: (v: number[]) => void;
}) {
  return (
    <section className="elastic-tab-panel elastic-explain">
      <div>
        <h2>Live Elastic Net Inference</h2>
        <p>
          Change a feature value to recompute the prediction using the current
          selected model.
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
        <small>Predicted {targetName}</small>
        <strong>{result.predict(inputs).toFixed(4)}</strong>
        <p>
          {result.coefficients.filter((value) => Math.abs(value) > 1e-4).length}{" "}
          coefficients currently contribute
        </p>
      </aside>
    </section>
  );
}

export default function ElasticNetRegressionPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<Tab>("visualize");
  const [pathMode, setPathMode] = useState<PathMode>("combined");
  const [datasetId, setDatasetId] = useState<DatasetId>("california");
  const [rows, setRows] = useState<ElasticRow[]>(() =>
    datasetFactories.california(),
  );
  const [names, setNames] = useState(datasetMeta.california.features);
  const [targetName, setTargetName] = useState(datasetMeta.california.target);
  const [alpha, setAlphaState] = useState(0.0126);
  const [l1Ratio, setL1RatioState] = useState(0.65);
  const [targetStandardized, setTargetStandardizedState] = useState(true);
  const [selected, setSelectedState] = useState<boolean[]>([
    ...Array(8).fill(true),
    false,
    false,
  ]);
  const [training, setTraining] = useState(false);
  const [trained, setTrained] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");
  const [menuOpen, setMenuOpen] = useState(false);
  const [inputs, setInputs] = useState(rows[0].features);
  const fileRef = useRef<HTMLInputElement>(null);
  const effectiveRatio =
    pathMode === "lasso" ? 1 : pathMode === "ridge" ? 0 : l1Ratio;
  const result = useMemo(
    () => fitElastic(rows, alpha, l1Ratio, targetStandardized, selected),
    [rows, alpha, l1Ratio, targetStandardized, selected],
  );
  const path = useMemo(
    () => coefficientPath(rows, effectiveRatio, targetStandardized, selected),
    [rows, effectiveRatio, targetStandardized, selected],
  );
  const curves = useMemo(
    () => comparisonCurves(rows, targetStandardized, selected, l1Ratio),
    [rows, targetStandardized, selected, l1Ratio],
  );
  const dirty = () => {
    setTrained(false);
    setSaved(false);
  };
  const setAlpha = (value: number) => {
    setAlphaState(value);
    dirty();
  };
  const setL1Ratio = (value: number) => {
    setL1RatioState(value);
    dirty();
  };
  const setTargetStandardized = (value: boolean) => {
    setTargetStandardizedState(value);
    dirty();
  };
  const setSelected = (values: boolean[]) => {
    if (values.some(Boolean)) {
      setSelectedState(values);
      dirty();
    }
  };
  const selectDataset = (id: BuiltInDatasetId) => {
    const next = datasetFactories[id]();
    setDatasetId(id);
    setRows(next);
    setNames(datasetMeta[id].features);
    setTargetName(datasetMeta[id].target);
    setSelectedState(Array(datasetMeta[id].features.length).fill(true));
    setInputs(next[0].features);
    dirty();
  };
  const reset = () => {
    const next = datasetFactories.california();
    setDatasetId("california");
    setRows(next);
    setNames(datasetMeta.california.features);
    setTargetName(datasetMeta.california.target);
    setAlphaState(0.0126);
    setL1RatioState(0.65);
    setTargetStandardizedState(true);
    setSelectedState([...Array(8).fill(true), false, false]);
    setInputs(next[0].features);
    setTraining(false);
    setTrained(false);
    setSaved(false);
    setPathMode("combined");
    setMenuOpen(false);
  };
  const train = () => {
    setTraining(true);
    window.setTimeout(() => {
      setTraining(false);
      setTrained(true);
    }, 520);
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
    const lines = (await file.text()).trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 3) return;
    const headers = lines[0].split(",").map((value) => value.trim());
    const values = lines
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter(
        (row) => row.length === headers.length && row.every(Number.isFinite),
      );
    if (values.length < 2 || headers.length < 2) return;
    const imported = values.map((value) => ({
      features: value.slice(0, -1),
      target: value.at(-1) ?? 0,
    }));
    setDatasetId("imported");
    setRows(imported);
    setNames(headers.slice(0, -1));
    setTargetName(headers.at(-1) ?? "target");
    setSelectedState(Array(headers.length - 1).fill(true));
    setInputs(imported[0].features);
    setTab("dataset");
    dirty();
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* clipboard can be unavailable */
    }
    setShareLabel("Copied");
    window.setTimeout(() => setShareLabel("Share"), 900);
  };
  return (
    <div className={`elastic-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      />
      <main className="elastic-main">
        <div className="elastic-topbar">
          <div>
            <span>Learning</span>
            <b>›</b>
            <span>Regression</span>
            <b>›</b>
            <strong>Elastic Net Regression</strong>
          </div>
          <div>
            <button onClick={share}>
              <Share2 size={14} />
              {shareLabel}
            </button>
            <div className="elastic-menu">
              <button
                aria-label="More actions"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Ellipsis size={17} />
              </button>
              {menuOpen && (
                <div>
                  <button onClick={reset}>
                    <RotateCcw size={13} />
                    Reset Experiment
                  </button>
                  <button onClick={() => setMenuOpen(false)}>
                    <Download size={13} />
                    Export Summary
                  </button>
                </div>
              )}
            </div>
            <button
              className={saved ? "saved" : ""}
              onClick={() => setSaved(!saved)}
            >
              <Save size={14} />
              {saved ? "Saved" : "Save Experiment"}
            </button>
          </div>
        </div>
        <header className="elastic-header">
          <div>
            <h1>Elastic Net Regression</h1>
            <p>
              Elastic Net is a linear regression with combined L1 and L2
              regularization.
              <br />
              It handles correlated features and performs feature selection.
            </p>
          </div>
          <div>
            <span>
              <small>Model</small>
              <strong>
                {training ? "Training…" : trained ? "Trained" : "Not Trained"}
              </strong>
            </span>
            <span>
              <small>● &nbsp;Dataset</small>
              <strong>{datasetMeta[datasetId].name}</strong>
            </span>
          </div>
        </header>
        <nav className="elastic-tabs" aria-label="Lesson sections">
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
        <div className="elastic-content">
          <div className="elastic-workspace">
            {tab === "visualize" && (
              <>
                <PathChart
                  path={path}
                  alpha={alpha}
                  names={names}
                  mode={pathMode}
                  setMode={setPathMode}
                  targetStandardized={targetStandardized}
                  setTargetStandardized={setTargetStandardized}
                />
                <ModelComparison curves={curves} />
                <Insights
                  result={result}
                  alpha={alpha}
                  l1Ratio={l1Ratio}
                  featureCount={names.length}
                />
              </>
            )}
            {tab === "learn" && (
              <section className="elastic-tab-panel elastic-learn">
                <h2>Elastic Net combines two useful regularizers</h2>
                <p>
                  L1 regularization creates sparse models by setting weak
                  coefficients to zero. L2 regularization stabilizes groups of
                  correlated predictors. Elastic Net blends both with a single
                  mixing ratio.
                </p>
                <div>
                  <article>
                    <strong>L1 · Lasso</strong>
                    <p>Feature selection and sparsity.</p>
                  </article>
                  <article>
                    <strong>L2 · Ridge</strong>
                    <p>Stable correlated coefficients.</p>
                  </article>
                  <article>
                    <strong>Elastic Net</strong>
                    <p>A controlled balance of both.</p>
                  </article>
                </div>
                <button onClick={() => setTab("visualize")}>
                  Open Interactive Visualization
                </button>
              </section>
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
            {tab === "train" && (
              <TrainPanel
                result={result}
                alpha={alpha}
                l1Ratio={l1Ratio}
                training={training}
                trained={trained}
                onTrain={train}
              />
            )}
            {tab === "metrics" && <MetricsPanel result={result} />}
            {tab === "compare" && (
              <section className="elastic-tab-panel elastic-compare-panel">
                <h2>Elastic Net, Ridge, and Lasso</h2>
                <p>
                  Every curve below is fitted against the active train/test
                  split.
                </p>
                <ModelComparison curves={curves} />
              </section>
            )}
            {tab === "explain" && (
              <ExplainPanel
                result={result}
                names={names}
                targetName={targetName}
                inputs={inputs}
                setInputs={setInputs}
              />
            )}
          </div>
          <aside className="elastic-right">
            <Controls
              alpha={alpha}
              setAlpha={setAlpha}
              l1Ratio={l1Ratio}
              setL1Ratio={setL1Ratio}
              onReset={reset}
            />
            <FeatureTable
              names={names}
              coefficients={result.coefficients}
              selected={selected}
              setSelected={setSelected}
            />
            <DatasetCard
              datasetId={datasetId}
              rows={rows}
              names={names}
              onView={() => setTab("dataset")}
              onChange={() => setTab("dataset")}
              onUpload={() => fileRef.current?.click()}
            />
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
