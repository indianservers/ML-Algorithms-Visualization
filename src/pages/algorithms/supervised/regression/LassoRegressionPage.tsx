import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LabLessonPanel } from "../../../../components/common/LabTabs";
import {
  Beaker,
  BookOpen,
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleHelp,
  CloudUpload,
  Database,
  FlaskConical,
  FolderKanban,
  Gauge,
  GraduationCap,
  Home,
  Info,
  Network,
  Play,
  RotateCcw,
  Settings,
  Share2,
  Sparkles,
  Star,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import {
  energyDemandDataset,
  housingDataset,
} from "../../../../data/sampleDatasets";
import { lassoRegression } from "../../../../lib/algorithms/regression/linearRegression";
import { mae, mse, rSquared, rmse } from "../../../../lib/math/metrics";
import "./LassoRegressionPage.css";

type LassoRow = { features: number[]; target: number };
type BuiltInDatasetId = "california" | "housing" | "energy" | "linear";
type DatasetId = BuiltInDatasetId | "imported";
type SelectionMethod = "min" | "one-se" | "manual";
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
const featurePalette = [
  "#23d8e5",
  "#16aee8",
  "#8e55e8",
  "#e85db9",
  "#e8bd2e",
  "#f17d39",
  "#f64d67",
  "#41cf9f",
];
const lambdaValues = Array.from(
  { length: 17 },
  (_, index) => 10 ** (-6 + index * 0.5),
);

const deterministicNoise = (index: number, salt = 0) => {
  const value = Math.sin(index * 78.233 + salt * 31.177) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};

function californiaRows(count = 240): LassoRow[] {
  return Array.from({ length: count }, (_, index) => {
    const features = [
      Math.sin(index * 0.031),
      Math.cos(index * 0.047),
      Math.sin(index * 0.071 + 0.7),
      Math.cos(index * 0.019 + 1.2),
      Math.sin(index * 0.113 + 2.1),
      Math.cos(index * 0.089 + 0.4),
      Math.sin(index * 0.137 + 1.7),
      Math.cos(index * 0.157 + 2.8),
    ].map((value, column) => value + deterministicNoise(index, column) * 0.06);
    return {
      features,
      target:
        3.25 +
        0.82 * features[0] +
        0.66 * features[1] +
        0.42 * features[2] +
        0.31 * features[3] -
        0.28 * features[4] +
        0.21 * features[7] +
        deterministicNoise(index, 11) * 0.19,
    };
  });
}

function linearRows(count = 120): LassoRow[] {
  return Array.from({ length: count }, (_, index) => {
    const x = -3 + (index * 6) / (count - 1);
    const n = deterministicNoise(index);
    return {
      features: [x, x + n * 0.22, x * x, Math.sin(x)],
      target: 0.8 + 1.5 * x + 0.42 * Math.sin(x) + n * 0.35,
    };
  });
}

const datasetFactories: Record<BuiltInDatasetId, () => LassoRow[]> = {
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
  linear: () => linearRows(),
};

const datasetMeta: Record<
  DatasetId,
  { name: string; target: string; features: string[] }
> = {
  california: {
    name: "California Housing",
    target: "MEDV",
    features: ["MedInc", "LSTAT", "RM", "Age", "DIS", "Tax", "PTRATIO", "B"],
  },
  housing: {
    name: "Housing Prices",
    target: "Price",
    features: ["Area", "Beds", "Baths", "Age", "Distance"],
  },
  energy: {
    name: "Energy Demand",
    target: "Demand",
    features: ["Temp", "Humidity", "Wind", "Weekend", "Hour"],
  },
  linear: {
    name: "Synthetic Sparse",
    target: "Target",
    features: ["Signal", "Correlated", "Squared", "Seasonal"],
  },
  imported: {
    name: "Imported CSV",
    target: "Target",
    features: [],
  },
};

function sampledRows(rows: LassoRow[], limit: number) {
  if (rows.length <= limit) return rows;
  const stride = rows.length / limit;
  return Array.from(
    { length: limit },
    (_, index) => rows[Math.floor(index * stride)],
  );
}

function fitLasso(
  rows: LassoRow[],
  lambda: number,
  standardize: boolean,
  fitIntercept: boolean,
  maxIterations: number,
) {
  const working = sampledRows(rows, 900);
  const training = working.filter((_, index) => index % 5 !== 0);
  const test = working.filter((_, index) => index % 5 === 0);
  const model = lassoRegression(
    training.map((row) => row.features),
    training.map((row) => row.target),
    lambda,
    maxIterations,
    1e-5,
    standardize,
    fitIntercept,
  );
  const trainActual = training.map((row) => row.target);
  const trainPredicted = training.map((row) => model.predict(row.features));
  const testActual = test.map((row) => row.target);
  const testPredicted = test.map((row) => model.predict(row.features));
  return {
    model,
    training,
    test,
    trainMse: mse(trainActual, trainPredicted),
    testMse: mse(testActual, testPredicted),
    testRmse: rmse(testActual, testPredicted),
    testMae: mae(testActual, testPredicted),
    testR2: rSquared(testActual, testPredicted),
  };
}

function calculatePath(
  rows: LassoRow[],
  standardize: boolean,
  fitIntercept: boolean,
) {
  const working = sampledRows(rows, 600);
  return lambdaValues.map((lambda) => ({
    lambda,
    coefficients: lassoRegression(
      working.map((row) => row.features),
      working.map((row) => row.target),
      lambda,
      240,
      1e-4,
      standardize,
      fitIntercept,
    ).coefficients,
  }));
}

function calculateCrossValidation(
  rows: LassoRow[],
  standardize: boolean,
  fitIntercept: boolean,
) {
  const working = sampledRows(rows, 360);
  return lambdaValues.map((lambda) => {
    const foldLosses = Array.from({ length: 5 }, (_, fold) => {
      const training = working.filter((_, index) => index % 5 !== fold);
      const validation = working.filter((_, index) => index % 5 === fold);
      const model = lassoRegression(
        training.map((row) => row.features),
        training.map((row) => row.target),
        lambda,
        140,
        2e-4,
        standardize,
        fitIntercept,
      );
      return mse(
        validation.map((row) => row.target),
        validation.map((row) => model.predict(row.features)),
      );
    });
    const meanLoss =
      foldLosses.reduce((sum, loss) => sum + loss, 0) / foldLosses.length;
    const spread = Math.sqrt(
      foldLosses.reduce((sum, loss) => sum + (loss - meanLoss) ** 2, 0) /
        foldLosses.length,
    );
    return { lambda, meanLoss, spread };
  });
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
    [FlaskConical, "Experiments"],
    [Database, "Datasets"],
    [Boxes, "Models"],
    [FolderKanban, "Workspaces"],
    [Sparkles, "AutoML"],
  ] as const;
  return (
    <aside className={`lasso-sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="lasso-brand">
        <span className="lasso-brand-mark">
          <Network size={18} />
        </span>
        {!collapsed && (
          <span>
            <strong>Mega ML</strong>
            <small>AI OBSERVATORY</small>
          </span>
        )}
        <button aria-label="Collapse sidebar" onClick={onCollapse}>
          <ChevronLeft size={17} />
        </button>
      </div>
      <nav className="lasso-primary-nav">
        {items.map(([Icon, label]) => (
          <Link to={label === "Home" ? "/" : "#"} key={label} title={label}>
            <Icon size={15} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="lasso-learn-nav">
        <small>LEARN</small>
        <a href="#lesson">
          <GraduationCap size={15} />
          <span>All Lessons</span>
        </a>
        <button className="lasso-nav-group">
          <WandSparkles size={15} />
          <span>Linear Models</span>
          <ChevronUp size={14} />
        </button>
        <div className="lasso-subnav">
          <Link to="/ml/supervised/simple-linear-regression">
            Linear Regression
          </Link>
          <Link to="/ml/supervised/ridge-regression">Ridge Regression</Link>
          <span className="active">Lasso Regression</span>
          <Link to="/ml/supervised/elastic-net-regression">Elastic Net</Link>
          <Link to="/ml/supervised/polynomial-regression">
            Polynomial Regression
          </Link>
        </div>
        <button className="lasso-nav-group">
          <Boxes size={15} />
          <span>Tree Models</span>
          <ChevronDown size={14} />
        </button>
        <button className="lasso-nav-group">
          <Network size={15} />
          <span>Ensemble Models</span>
          <ChevronDown size={14} />
        </button>
        <button className="lasso-nav-group">
          <Gauge size={15} />
          <span>Clustering</span>
        </button>
        <button className="lasso-nav-group">
          <Beaker size={15} />
          <span>Deep Learning</span>
        </button>
      </div>
      <div className="lasso-sidebar-bottom">
        <a href="#playground">
          <WandSparkles size={15} />
          <span>Playground</span>
        </a>
        <a href="#settings">
          <Settings size={15} />
          <span>Settings</span>
        </a>
      </div>
      <div className="lasso-user">
        <span>MA</span>
        {!collapsed && (
          <div>
            <strong>Maya AI</strong>
            <small>Pro</small>
          </div>
        )}
      </div>
    </aside>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="lasso-panel-title">
      {children}
      <Info size={13} />
    </h2>
  );
}

function CoefficientPaths({
  path,
  selectedLambda,
  names,
}: {
  path: ReturnType<typeof calculatePath>;
  selectedLambda: number;
  names: string[];
}) {
  const width = 570,
    height = 282,
    left = 56,
    top = 48,
    plotWidth = 500,
    plotHeight = 188;
  const cap = Math.max(
    ...path
      .flatMap((point) => point.coefficients)
      .map((value) => Math.abs(value)),
    0.1,
  );
  const x = (lambda: number) =>
    left + ((Math.log10(lambda) + 6) / 8) * plotWidth;
  const y = (value: number) =>
    top + plotHeight / 2 - (value / cap) * (plotHeight / 2);
  const selectedX = x(selectedLambda);
  return (
    <section className="lasso-card lasso-path-card">
      <PanelTitle>Coefficient Paths</PanelTitle>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Lasso coefficient paths"
      >
        <text x={58} y={22}>
          Low λ
        </text>
        <text x={58} y={37}>
          Less Regularization
        </text>
        <text x={545} y={22} textAnchor="end">
          High λ
        </text>
        <text x={545} y={37} textAnchor="end">
          More Regularization
        </text>
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
              <text x={left - 14} y={ty + 4} textAnchor="end">
                {tick.toFixed(tick % 1 ? 1 : 0)}
              </text>
            </g>
          );
        })}
        {Array.from({ length: 9 }, (_, index) => index - 6).map((tick) => {
          const tx = left + ((tick + 6) / 8) * plotWidth;
          return (
            <g key={tick}>
              <line
                x1={tx}
                y1={top}
                x2={tx}
                y2={top + plotHeight}
                className="grid vertical"
              />
              <text x={tx} y={top + plotHeight + 21} textAnchor="middle">
                {tick}
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
                  `${x(point.lambda)},${y(point.coefficients[feature] ?? 0)}`,
              )
              .join(" ")}
            fill="none"
            stroke={featurePalette[feature % featurePalette.length]}
            strokeWidth="1.45"
          />
        ))}
        <line
          x1={selectedX}
          y1={top - 2}
          x2={selectedX}
          y2={top + plotHeight}
          className="selected-line"
        />
        <text
          x={selectedX}
          y={21}
          textAnchor="middle"
          className="selected-label"
        >
          Selected λ
        </text>
        <text
          x={selectedX}
          y={37}
          textAnchor="middle"
          className="selected-label"
        >
          {selectedLambda.toFixed(4)}
        </text>
        <text
          x={left + plotWidth / 2}
          y={height - 16}
          textAnchor="middle"
          className="axis-label"
        >
          Log(λ)
        </text>
        <text
          transform={`translate(13 ${top + plotHeight / 2}) rotate(-90)`}
          textAnchor="middle"
          className="axis-label"
        >
          Standardized Coefficient
        </text>
      </svg>
      <div className="lasso-legend">
        {names.slice(0, 8).map((name, index) => (
          <span key={name}>
            <i style={{ background: featurePalette[index] }} />
            {name}
          </span>
        ))}
      </div>
      <a href="#insights">
        How to read this plot <span>⌄</span>
      </a>
    </section>
  );
}

function GeometryPanel() {
  const [view, setView] = useState<"projection" | "constraint">("projection");
  return (
    <section className="lasso-card lasso-geometry-card">
      <div className="lasso-card-heading">
        <PanelTitle>L1 Geometry (2D)</PanelTitle>
        <select
          aria-label="Geometry view"
          value={view}
          onChange={(event) =>
            setView(event.target.value as "projection" | "constraint")
          }
        >
          <option value="projection">Feature Space Projection</option>
          <option value="constraint">Constraint Detail</option>
        </select>
      </div>
      <svg viewBox="0 0 370 296" role="img" aria-label="L1 constraint geometry">
        <defs>
          <linearGradient id="diamond" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#13d7d6" stopOpacity=".08" />
            <stop offset="1" stopColor="#13d7d6" stopOpacity=".42" />
          </linearGradient>
        </defs>
        <line x1="33" y1="211" x2="322" y2="211" className="geometry-axis" />
        <path d="M322 211l-7-4v8z" className="geometry-arrow" />
        <line x1="157" y1="273" x2="157" y2="55" className="geometry-axis" />
        <path d="M157 55l-4 7h8z" className="geometry-arrow" />
        <text x="330" y="215">
          β₁
        </text>
        <text x="150" y="45">
          β₂
        </text>
        <ellipse cx="253" cy="107" rx="91" ry="62" className="contour outer" />
        <ellipse cx="253" cy="107" rx="70" ry="45" className="contour" />
        <ellipse cx="253" cy="107" rx="46" ry="29" className="contour" />
        <polygon
          points={
            view === "projection"
              ? "157,153 216,212 157,271 98,212"
              : "157,137 232,212 157,287 82,212"
          }
          fill="url(#diamond)"
          className="diamond"
        />
        <line
          x1="157"
          y1="212"
          x2={view === "projection" ? "260" : "232"}
          y2={view === "projection" ? "113" : "212"}
          className="solution-line"
        />
        <circle
          cx={view === "projection" ? "260" : "232"}
          cy={view === "projection" ? "113" : "212"}
          r="6"
          className="solution-dot"
        />
      </svg>
      <div className="lasso-geometry-legend">
        <span>
          <i className="solid" />
          L1 Constraint (|β₁| + |β₂| ≤ t)
        </span>
        <span>
          <i className="dash" />
          Loss Contours
        </span>
        <span>
          <i className="dot" />
          Solution
        </span>
      </div>
    </section>
  );
}

function CrossValidation({
  values,
}: {
  values: ReturnType<typeof calculateCrossValidation>;
}) {
  const width = 570,
    height = 214,
    left = 56,
    top = 28,
    plotWidth = 500,
    plotHeight = 120;
  const logs = values.map((item) => Math.log10(Math.max(item.meanLoss, 1e-8)));
  const minLog = Math.min(...logs) - 0.18,
    maxLog = Math.max(...logs) + 0.18;
  const x = (lambda: number) =>
    left + ((Math.log10(lambda) + 6) / 8) * plotWidth;
  const y = (loss: number) =>
    top +
    ((maxLog - Math.log10(Math.max(loss, 1e-8))) / (maxLog - minLog || 1)) *
      plotHeight;
  const minIndex = values.reduce(
    (best, item, index) =>
      item.meanLoss < values[best].meanLoss ? index : best,
    0,
  );
  const threshold = values[minIndex].meanLoss + values[minIndex].spread;
  const oneSeIndex = values.reduce(
    (best, item, index) => (item.meanLoss <= threshold ? index : best),
    minIndex,
  );
  return (
    <section className="lasso-card lasso-cv-card">
      <PanelTitle>Cross-Validation (MSE)</PanelTitle>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Cross validation mean squared error"
      >
        {Array.from({ length: 4 }, (_, index) => index).map((tick) => {
          const ty = top + (tick * plotHeight) / 3;
          return (
            <line
              key={tick}
              x1={left}
              y1={ty}
              x2={left + plotWidth}
              y2={ty}
              className="grid"
            />
          );
        })}
        <polyline
          points={values
            .map((item) => `${x(item.lambda)},${y(item.meanLoss)}`)
            .join(" ")}
          fill="none"
          stroke="#2ed8df"
          strokeWidth="1.5"
        />
        {values.map((item) => {
          const px = x(item.lambda),
            py = y(item.meanLoss),
            err = Math.min(
              20,
              Math.max(4, (item.spread / (item.meanLoss || 1)) * 18),
            );
          return (
            <g key={item.lambda}>
              <line
                x1={px}
                y1={py - err}
                x2={px}
                y2={py + err}
                className="error-bar"
              />
              <circle cx={px} cy={py} r="4" className="cv-point" />
            </g>
          );
        })}
        <line
          x1={x(values[minIndex].lambda)}
          y1={top - 2}
          x2={x(values[minIndex].lambda)}
          y2={top + plotHeight}
          className="min-line"
        />
        <text
          x={x(values[minIndex].lambda)}
          y={17}
          textAnchor="middle"
          className="min-label"
        >
          λₘᵢₙ
        </text>
        <line
          x1={x(values[oneSeIndex].lambda)}
          y1={top - 2}
          x2={x(values[oneSeIndex].lambda)}
          y2={top + plotHeight}
          className="one-line"
        />
        <text
          x={x(values[oneSeIndex].lambda)}
          y={17}
          textAnchor="middle"
          className="one-label"
        >
          λ₁ₛₑ
        </text>
        {[-6, -5, -4, -3, -2, -1, 0, 1, 2].map((tick) => (
          <text
            key={tick}
            x={left + ((tick + 6) / 8) * plotWidth}
            y={top + plotHeight + 20}
            textAnchor="middle"
          >
            {tick}
          </text>
        ))}
        <text
          x={left + plotWidth / 2}
          y={height - 8}
          textAnchor="middle"
          className="axis-label"
        >
          Log(λ)
        </text>
        <text
          transform={`translate(13 ${top + plotHeight / 2}) rotate(-90)`}
          textAnchor="middle"
          className="axis-label"
        >
          Mean Squared Error
        </text>
      </svg>
      <div className="lasso-cv-legend">
        <span>
          <i />
          Mean CV MSE
        </span>
        <span>
          <b />
          ±1 Std. Error
        </span>
      </div>
    </section>
  );
}

function FeatureSelection({
  coefficients,
  names,
  lambda,
}: {
  coefficients: number[];
  names: string[];
  lambda: number;
}) {
  const selected = coefficients.filter(
    (value) => Math.abs(value) > 1e-4,
  ).length;
  return (
    <section className="lasso-card lasso-feature-card">
      <PanelTitle>Feature Selection at λ = {lambda.toFixed(4)}</PanelTitle>
      <div className="lasso-feature-chips">
        {names.map((name, index) => {
          const active = Math.abs(coefficients[index] ?? 0) > 1e-4;
          return (
            <span className={active ? "selected" : "zeroed"} key={name}>
              {active ? <Check size={14} /> : <X size={14} />} {name}
            </span>
          );
        })}
      </div>
      <div className="lasso-feature-summary">
        <span>
          Selected Features <b>{selected}</b>
        </span>
        <span>
          Zeroed Coefficients <b>{names.length - selected}</b>
        </span>
      </div>
    </section>
  );
}

function Insights() {
  return (
    <section className="lasso-insights" id="insights">
      <article>
        <h3>
          💡 <span>Key Insights</span>
        </h3>
        <p>☑ Lasso shrinks some coefficients exactly to zero.</p>
        <p>☑ Increase λ to simplify the model (more zeros).</p>
        <p>
          ☑ λ<sub>min</sub> minimizes prediction error.
        </p>
        <p>
          ☑ λ<sub>1se</sub> gives a sparser model within 1 standard error.
        </p>
      </article>
      <article>
        <h3>
          <span className="target-icon">◎</span> <span>When to Use Lasso</span>
        </h3>
        <p>• High-dimensional data (p &gt; n)</p>
        <p>• Feature selection & interpretability</p>
        <p>• Sparse true models</p>
        <p>• Collinear features</p>
      </article>
      <article>
        <h3>
          <span className="formula-icon">♨</span> <span>How Lasso Works</span>
        </h3>
        <p>Lasso adds an L1 penalty: minimize</p>
        <div className="lasso-formula">½ₘ ‖y − Xβ‖²₂ + λ ‖β‖₁</div>
        <p>
          The L1 penalty creates a diamond constraint,
          <br />
          pushing some coefficients to exactly zero.
        </p>
      </article>
    </section>
  );
}

type ControlRailProps = {
  lambda: number;
  setLambda: (value: number) => void;
  autoSelect: boolean;
  setAutoSelect: (value: boolean) => void;
  selectionMethod: SelectionMethod;
  setSelectionMethod: (value: SelectionMethod) => void;
  standardize: boolean;
  setStandardize: (value: boolean) => void;
  fitIntercept: boolean;
  setFitIntercept: (value: boolean) => void;
  maxIterations: number;
  setMaxIterations: (value: number) => void;
  onTrain: () => void;
  onReset: () => void;
  training: boolean;
  trained: boolean;
  datasetId: DatasetId;
  rows: LassoRow[];
  featureCount: number;
  targetName: string;
  onUseDataset: () => void;
  onUpload: () => void;
};

function ControlRail({
  lambda,
  setLambda,
  autoSelect,
  setAutoSelect,
  selectionMethod,
  setSelectionMethod,
  standardize,
  setStandardize,
  fitIntercept,
  setFitIntercept,
  maxIterations,
  setMaxIterations,
  onTrain,
  onReset,
  training,
  trained,
  datasetId,
  rows,
  featureCount,
  targetName,
  onUseDataset,
  onUpload,
}: ControlRailProps) {
  return (
    <aside className="lasso-control-rail">
      <section className="lasso-control-card">
        <h2>CONTROLS</h2>
        <label className="lasso-control-label">
          Regularization (λ) <Info size={13} />
        </label>
        <strong className="lasso-lambda-value">{lambda.toFixed(4)}</strong>
        <input
          aria-label="Regularization lambda"
          type="range"
          min={-6}
          max={2}
          step={0.1}
          value={Math.log10(lambda)}
          onChange={(event) => setLambda(10 ** Number(event.target.value))}
        />
        <div className="lasso-range-ticks">
          <span>1e−6</span>
          <span>1e−2</span>
          <span>1e2</span>
        </div>
        <label className="lasso-check">
          <input
            type="checkbox"
            checked={autoSelect}
            onChange={(event) => setAutoSelect(event.target.checked)}
          />
          <span>
            <Check size={12} />
          </span>
          Auto Select λ <Info size={13} />
        </label>
        <label className="lasso-method-label">
          Method
          <select
            aria-label="Lambda selection method"
            value={selectionMethod}
            onChange={(event) =>
              setSelectionMethod(event.target.value as SelectionMethod)
            }
          >
            <option value="min">5-Fold CV (Min MSE)</option>
            <option value="one-se">5-Fold CV (1-SE)</option>
            <option value="manual">Manual Selection</option>
          </select>
        </label>
        <hr />
        <label className="lasso-control-label">
          Standardization <Info size={13} />
        </label>
        <div className="lasso-switch-row">
          <span>Standardize Features</span>
          <button
            role="switch"
            aria-checked={standardize}
            onClick={() => setStandardize(!standardize)}
            className={standardize ? "on" : ""}
          >
            <i />
          </button>
        </div>
        <hr />
        <label className="lasso-control-label">
          Fit Intercept <Info size={13} />
        </label>
        <div className="lasso-switch-row">
          <span>Fit Intercept</span>
          <button
            role="switch"
            aria-checked={fitIntercept}
            onClick={() => setFitIntercept(!fitIntercept)}
            className={fitIntercept ? "on" : ""}
          >
            <i />
          </button>
        </div>
        <label className="lasso-method-label iterations">
          Max Iterations
          <select
            aria-label="Maximum iterations"
            value={maxIterations}
            onChange={(event) => setMaxIterations(Number(event.target.value))}
          >
            <option value={1000}>1,000</option>
            <option value={5000}>5,000</option>
            <option value={10000}>10,000</option>
          </select>
        </label>
        <button className="lasso-reset-button" onClick={onReset}>
          <RotateCcw size={14} />
          Reset to Defaults
        </button>
        <button
          className="lasso-train-button"
          onClick={onTrain}
          disabled={training}
        >
          <Play size={16} />
          {training ? "Training…" : trained ? "Retrain Model" : "Train Model"}
        </button>
      </section>
      <section className="lasso-dataset-card">
        <div className="lasso-dataset-heading">
          <h2>
            DATASET <Info size={13} />
          </h2>
          <button onClick={onUseDataset}>View Dataset</button>
        </div>
        <div className="lasso-dataset-name">
          <strong>{datasetMeta[datasetId]?.name ?? "Imported CSV"}</strong>
          <span>Sample</span>
        </div>
        <div className="lasso-dataset-stats">
          <span>
            Rows <b>{rows.length.toLocaleString()}</b>
          </span>
          <span>
            Features <b>{featureCount}</b>
          </span>
          <span>
            Target <b>{targetName}</b>
          </span>
        </div>
        <button className="lasso-use-button" onClick={onUseDataset}>
          <Upload size={14} />
          Use This Dataset
        </button>
        <button className="lasso-upload-button" onClick={onUpload}>
          <CloudUpload size={14} />
          Upload CSV
        </button>
      </section>
    </aside>
  );
}

type DatasetViewProps = {
  rows: LassoRow[];
  names: string[];
  targetName: string;
  datasetId: DatasetId;
  onDataset: (id: BuiltInDatasetId) => void;
  onEdit: (row: number, column: number | "target", value: number) => void;
  onAdd: () => void;
  onRemove: () => void;
  onUpload: () => void;
};
function DatasetView({
  rows,
  names,
  targetName,
  datasetId,
  onDataset,
  onEdit,
  onAdd,
  onRemove,
  onUpload,
}: DatasetViewProps) {
  return (
    <section className="lasso-tab-panel lasso-dataset-panel">
      <div className="lasso-tab-heading">
        <div>
          <h2>Dataset Explorer</h2>
          <p>
            Switch sources or edit numeric values. The model recomputes from the
            live table.
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
      <div className="lasso-table-wrap">
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
      <div className="lasso-table-actions">
        <span>Showing 8 of {rows.length.toLocaleString()} rows</span>
        <div>
          <button onClick={onAdd}>+ Add Row</button>
          <button onClick={onRemove} disabled={rows.length <= 4}>
            − Remove Last
          </button>
        </div>
      </div>
    </section>
  );
}

function TrainView({
  result,
  lambda,
  trained,
  training,
  onTrain,
}: {
  result: ReturnType<typeof fitLasso>;
  lambda: number;
  trained: boolean;
  training: boolean;
  onTrain: () => void;
}) {
  return (
    <section className="lasso-tab-panel lasso-train-panel">
      <div>
        <span className={`lasso-status-orb ${trained ? "ready" : ""}`}>
          {training ? "…" : trained ? "✓" : "○"}
        </span>
        <h2>
          {training
            ? "Optimizing sparse coefficients…"
            : trained
              ? "Model training complete"
              : "Ready to train Lasso"}
        </h2>
        <p>
          Coordinate descent minimizes prediction error while applying an L1
          penalty of λ = {lambda.toFixed(4)}.
        </p>
        <button onClick={onTrain} disabled={training}>
          <Play size={16} />
          {training ? "Training…" : trained ? "Train Again" : "Start Training"}
        </button>
      </div>
      <div className="lasso-train-facts">
        <span>
          <small>Training rows</small>
          <strong>{result.training.length}</strong>
        </span>
        <span>
          <small>Validation rows</small>
          <strong>{result.test.length}</strong>
        </span>
        <span>
          <small>Active coefficients</small>
          <strong>
            {
              result.model.coefficients.filter(
                (value) => Math.abs(value) > 1e-4,
              ).length
            }
          </strong>
        </span>
        <span>
          <small>Intercept</small>
          <strong>{result.model.intercept.toFixed(3)}</strong>
        </span>
      </div>
    </section>
  );
}

function MetricsView({ result }: { result: ReturnType<typeof fitLasso> }) {
  const metrics = [
    ["RMSE", result.testRmse, "#33d9e6"],
    ["MAE", result.testMae, "#9d70ff"],
    ["R²", result.testR2, "#36d89c"],
    ["MSE", result.testMse, "#f4bd43"],
  ] as const;
  return (
    <section className="lasso-tab-panel">
      <div className="lasso-metric-grid">
        {metrics.map(([label, value, color]) => (
          <article key={label}>
            <small>{label}</small>
            <strong style={{ color }}>{value.toFixed(4)}</strong>
            <p>Validation set</p>
          </article>
        ))}
      </div>
      <div className="lasso-metric-detail">
        <h2>Generalization Summary</h2>
        <div>
          <span>
            Training MSE <b>{result.trainMse.toFixed(4)}</b>
          </span>
          <span>
            Validation MSE <b>{result.testMse.toFixed(4)}</b>
          </span>
          <span>
            Generalization gap{" "}
            <b>{(result.testMse - result.trainMse).toFixed(4)}</b>
          </span>
        </div>
      </div>
    </section>
  );
}

function CompareView({
  rows,
  standardize,
  fitIntercept,
}: {
  rows: LassoRow[];
  standardize: boolean;
  fitIntercept: boolean;
}) {
  const values = [0.0001, 0.001, 0.01, 0.1, 1].map((lambda) => ({
    lambda,
    result: fitLasso(rows, lambda, standardize, fitIntercept, 1200),
  }));
  return (
    <section className="lasso-tab-panel">
      <div className="lasso-tab-heading">
        <div>
          <h2>Regularization Comparison</h2>
          <p>
            Compare sparsity and validation accuracy across five fitted Lasso
            models.
          </p>
        </div>
      </div>
      <div className="lasso-comparison-grid">
        {values.map(({ lambda, result }) => (
          <article key={lambda}>
            <small>λ = {lambda}</small>
            <strong>{result.testRmse.toFixed(3)}</strong>
            <p>Validation RMSE</p>
            <span>
              {
                result.model.coefficients.filter(
                  (value) => Math.abs(value) > 1e-4,
                ).length
              }{" "}
              active features
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExplainView({
  result,
  names,
  inputs,
  setInputs,
}: {
  result: ReturnType<typeof fitLasso>;
  names: string[];
  inputs: number[];
  setInputs: (values: number[]) => void;
}) {
  const prediction = result.model.predict(inputs);
  return (
    <section className="lasso-tab-panel lasso-explain-panel">
      <div>
        <h2>Live Sparse-Model Inference</h2>
        <p>
          Edit a new observation. Zeroed coefficients contribute nothing to this
          prediction.
        </p>
        <div className="lasso-input-grid">
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
        <strong>{prediction.toFixed(4)}</strong>
        <p>
          {
            result.model.coefficients.filter((value) => Math.abs(value) > 1e-4)
              .length
          }{" "}
          of {names.length} features selected
        </p>
      </aside>
    </section>
  );
}

export default function LassoRegressionPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<Tab>("learn");
  const [datasetId, setDatasetId] = useState<DatasetId>("california");
  const [rows, setRows] = useState<LassoRow[]>(() =>
    datasetFactories.california(),
  );
  const [names, setNames] = useState(datasetMeta.california.features);
  const [targetName, setTargetName] = useState(datasetMeta.california.target);
  const [lambda, setLambdaState] = useState(0.01);
  const [autoSelect, setAutoSelect] = useState(true);
  const [selectionMethod, setSelectionMethodState] =
    useState<SelectionMethod>("min");
  const [standardize, setStandardizeState] = useState(true);
  const [fitIntercept, setFitInterceptState] = useState(true);
  const [maxIterations, setMaxIterationsState] = useState(10000);
  const [training, setTraining] = useState(false);
  const [trained, setTrained] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");
  const [predictionInputs, setPredictionInputs] = useState<number[]>(
    rows[0].features,
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const path = useMemo(
    () => calculatePath(rows, standardize, fitIntercept),
    [rows, standardize, fitIntercept],
  );
  const crossValidation = useMemo(
    () => calculateCrossValidation(rows, standardize, fitIntercept),
    [rows, standardize, fitIntercept],
  );
  const result = useMemo(
    () => fitLasso(rows, lambda, standardize, fitIntercept, maxIterations),
    [rows, lambda, standardize, fitIntercept, maxIterations],
  );
  const markDirty = () => setTrained(false);
  const setLambda = (value: number) => {
    setLambdaState(value);
    markDirty();
  };
  const setStandardize = (value: boolean) => {
    setStandardizeState(value);
    markDirty();
  };
  const setFitIntercept = (value: boolean) => {
    setFitInterceptState(value);
    markDirty();
  };
  const setMaxIterations = (value: number) => {
    setMaxIterationsState(value);
    markDirty();
  };
  const setSelectionMethod = (value: SelectionMethod) => {
    setSelectionMethodState(value);
    setAutoSelect(value !== "manual");
    markDirty();
  };
  const selectDataset = (id: BuiltInDatasetId) => {
    const nextRows = datasetFactories[id]();
    setDatasetId(id);
    setRows(nextRows);
    setNames(datasetMeta[id].features);
    setTargetName(datasetMeta[id].target);
    setPredictionInputs(nextRows[0].features);
    markDirty();
  };
  const reset = () => {
    const nextRows = datasetFactories.california();
    setDatasetId("california");
    setRows(nextRows);
    setNames(datasetMeta.california.features);
    setTargetName(datasetMeta.california.target);
    setPredictionInputs(nextRows[0].features);
    setLambdaState(0.01);
    setAutoSelect(true);
    setSelectionMethodState("min");
    setStandardizeState(true);
    setFitInterceptState(true);
    setMaxIterationsState(10000);
    setTrained(false);
    setTraining(false);
  };
  const train = () => {
    setTraining(true);
    window.setTimeout(() => {
      if (autoSelect && selectionMethod !== "manual") {
        const best = crossValidation.reduce(
          (winner, item) => (item.meanLoss < winner.meanLoss ? item : winner),
          crossValidation[0],
        );
        if (selectionMethod === "min") {
          setLambdaState(best.lambda);
        } else {
          const threshold = best.meanLoss + best.spread;
          const oneSe = crossValidation.reduce(
            (winner, item) =>
              item.meanLoss <= threshold && item.lambda > winner.lambda
                ? item
                : winner,
            best,
          );
          setLambdaState(oneSe.lambda);
        }
      }
      setTraining(false);
      setTrained(true);
    }, 520);
  };
  const editRow = (
    rowIndex: number,
    column: number | "target",
    value: number,
  ) => {
    setRows((current) =>
      current.map((row, index) =>
        index !== rowIndex
          ? row
          : column === "target"
            ? { ...row, target: value }
            : {
                ...row,
                features: row.features.map((feature, featureIndex) =>
                  featureIndex === column ? value : feature,
                ),
              },
      ),
    );
    markDirty();
  };
  const importCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 3) return;
    const headers = lines[0].split(",").map((header) => header.trim());
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
    setRows(imported);
    setDatasetId("imported");
    setNames(headers.slice(0, -1));
    setTargetName(headers.at(-1) ?? "target");
    setPredictionInputs(imported[0].features);
    setTrained(false);
    setTab("dataset");
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* browser may deny clipboard */
    }
    setShareLabel("Copied");
    window.setTimeout(() => setShareLabel("Share"), 1000);
  };
  return (
    <div className={`lasso-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      />
      <main className="lasso-main">
        <header className="lasso-header">
          <div>
            <div className="lasso-title-row">
              <WandSparkles size={26} />
              <h1>Lasso Regression</h1>
              <button
                aria-label="Bookmark lesson"
                className={bookmarked ? "saved" : ""}
                onClick={() => setBookmarked(!bookmarked)}
              >
                <Star size={17} fill={bookmarked ? "currentColor" : "none"} />
              </button>
            </div>
            <p>L1 regularization for sparse, interpretable linear models</p>
          </div>
          <div className="lasso-header-actions">
            <button aria-label="Help" onClick={() => setTab("explain")}>
              <CircleHelp size={19} />
            </button>
            <button
              aria-label="Open lesson guide"
              onClick={() => setTab("learn")}
            >
              <BookOpen size={19} />
            </button>
            <button className="share" onClick={share}>
              <Share2 size={15} />
              {shareLabel}
            </button>
            <div className={`model-status ${trained ? "ready" : ""}`}>
              <small>Model Status</small>
              <strong>
                {training ? "Training…" : trained ? "Trained" : "Not Trained"}
              </strong>
            </div>
          </div>
        </header>
        <nav className="lasso-tabs" aria-label="Lesson sections">
          {tabs.map(([id, label]) => (
            <button
              className={tab === id ? "active" : ""}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
              key={id}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="lasso-content">
          <div className="lasso-workspace">
            {tab === "learn" && (
              <LabLessonPanel tab="Learn" route="/ml/supervised/lasso-regression" />
            )}
            {tab === "visualize" && (
              <>
                <div className="lasso-top-grid">
                  <CoefficientPaths
                    path={path}
                    selectedLambda={lambda}
                    names={names}
                  />
                  <GeometryPanel />
                </div>
                <div className="lasso-mid-grid">
                  <CrossValidation values={crossValidation} />
                  <FeatureSelection
                    coefficients={result.model.coefficients}
                    names={names}
                    lambda={lambda}
                  />
                </div>
                <Insights />
              </>
            )}
            {tab === "dataset" && (
              <DatasetView
                rows={rows}
                names={names}
                targetName={targetName}
                datasetId={datasetId}
                onDataset={selectDataset}
                onEdit={editRow}
                onAdd={() => {
                  setRows((current) => [
                    ...current,
                    { features: Array(names.length).fill(0), target: 0 },
                  ]);
                  markDirty();
                }}
                onRemove={() => {
                  setRows((current) => current.slice(0, -1));
                  markDirty();
                }}
                onUpload={() => fileRef.current?.click()}
              />
            )}{" "}
            {tab === "train" && (
              <TrainView
                result={result}
                lambda={lambda}
                trained={trained}
                training={training}
                onTrain={train}
              />
            )}{" "}
            {tab === "metrics" && <MetricsView result={result} />}{" "}
            {tab === "compare" && (
              <CompareView
                rows={rows}
                standardize={standardize}
                fitIntercept={fitIntercept}
              />
            )}{" "}
            {tab === "explain" && (
              <ExplainView
                result={result}
                names={names}
                inputs={predictionInputs}
                setInputs={setPredictionInputs}
              />
            )}
          </div>
          <ControlRail
            lambda={lambda}
            setLambda={setLambda}
            autoSelect={autoSelect}
            setAutoSelect={(value) => {
              setAutoSelect(value);
              if (value && selectionMethod === "manual") {
                setSelectionMethodState("min");
              }
              markDirty();
            }}
            selectionMethod={selectionMethod}
            setSelectionMethod={setSelectionMethod}
            standardize={standardize}
            setStandardize={setStandardize}
            fitIntercept={fitIntercept}
            setFitIntercept={setFitIntercept}
            maxIterations={maxIterations}
            setMaxIterations={setMaxIterations}
            onTrain={train}
            onReset={reset}
            training={training}
            trained={trained}
            datasetId={datasetId}
            rows={rows}
            featureCount={names.length}
            targetName={targetName}
            onUseDataset={() => setTab("dataset")}
            onUpload={() => fileRef.current?.click()}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          hidden
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
