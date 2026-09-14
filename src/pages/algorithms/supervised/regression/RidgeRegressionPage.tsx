import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Bookmark,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronLeft,
  CloudUpload,
  Database,
  Download,
  FileText,
  FlaskConical,
  Folder,
  GraduationCap,
  Home,
  Info,
  KeyRound,
  LineChart,
  Medal,
  MoreVertical,
  Network,
  Play,
  RotateCcw,
  Scale,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Trophy,
  Upload,
  Zap,
} from "lucide-react";
import {
  energyDemandDataset,
  housingDataset,
} from "../../../../data/sampleDatasets";
import { ridgeRegression } from "../../../../lib/algorithms/regression/linearRegression";
import { mae, mse, rSquared, rmse } from "../../../../lib/math/metrics";
import "./RidgeRegressionPage.css";

type RidgeRow = { features: number[]; target: number };
type DatasetId = "synthetic" | "housing" | "energy" | "linear";
type Tab =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";

const tabItems: Array<[Tab, string]> = [
  ["learn", "Learn"],
  ["visualize", "Visualize"],
  ["dataset", "Dataset"],
  ["train", "Train"],
  ["metrics", "Metrics"],
  ["compare", "Compare"],
  ["explain", "Explain"],
];

const noiseAt = (index: number) => {
  const value = Math.sin(index * 91.73 + 17.19) * 47358.234;
  return (value - Math.floor(value)) * 2 - 1;
};

function syntheticFeatures(x: number, n = 0) {
  return [
    x,
    x + n * 0.16,
    x * x,
    Math.sin(x),
    Math.cos(x),
    x ** 3 / 10,
    0.48 * x + n * 0.28,
    Math.sin(2 * x),
    Math.abs(x),
    1 / (1 + x * x),
  ];
}

function syntheticRows(count = 1000): RidgeRow[] {
  return Array.from({ length: count }, (_, index) => {
    const x =
      -3.2 + ((index % 200) * 6.4) / 199 + Math.floor(index / 200) * 0.006;
    const noise = noiseAt(index);
    return {
      features: syntheticFeatures(x, noise),
      target: 0.55 * x + 0.18 * x ** 3 + 0.28 * Math.sin(2 * x) + noise * 0.48,
    };
  });
}

const datasetFactories: Record<DatasetId, () => RidgeRow[]> = {
  synthetic: () => syntheticRows(),
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
  linear: () =>
    Array.from({ length: 120 }, (_, index) => {
      const x = -3 + (index * 6) / 119;
      return {
        features: [x, x + noiseAt(index) * 0.2, x * x],
        target: 1.4 * x + 0.5 + noiseAt(index + 30) * 0.55,
      };
    }),
};

const datasetMeta: Record<DatasetId, { name: string; description: string }> = {
  synthetic: {
    name: "Synthetic Nonlinear",
    description:
      "Correlated nonlinear features for shrinkage and bias–variance trade-offs.",
  },
  housing: {
    name: "Housing Prices",
    description: "Home characteristics predicting sale price.",
  },
  energy: {
    name: "Energy Demand",
    description: "Weather and calendar signals predicting grid demand.",
  },
  linear: {
    name: "Synthetic Linear",
    description: "Correlated linear features with deterministic noise.",
  },
};

function scaleRows(rows: RidgeRow[], enabled: boolean) {
  const width = rows[0]?.features.length ?? 0;
  const means = Array.from(
    { length: width },
    (_, column) =>
      rows.reduce((sum, row) => sum + row.features[column], 0) / rows.length,
  );
  const stds = means.map(
    (mean, column) =>
      Math.sqrt(
        rows.reduce((sum, row) => sum + (row.features[column] - mean) ** 2, 0) /
          rows.length,
      ) || 1,
  );
  return {
    means,
    stds,
    transform: (features: number[]) =>
      enabled
        ? features.map(
            (value, column) => (value - means[column]) / stds[column],
          )
        : features,
  };
}

function fitRidge(
  rows: RidgeRow[],
  lambda: number,
  standardized: boolean,
  intercept: boolean,
) {
  const training = rows.filter((_, index) => index % 5 !== 0);
  const test = rows.filter((_, index) => index % 5 === 0);
  const scaling = scaleRows(training, standardized);
  const model = ridgeRegression(
    training.map((row) => scaling.transform(row.features)),
    training.map((row) => row.target),
    lambda,
  );
  const predict = (features: number[]) =>
    model.predict(scaling.transform(features)) -
    (intercept ? 0 : model.intercept);
  const trainActual = training.map((row) => row.target),
    trainPredicted = training.map((row) => predict(row.features));
  const testActual = test.map((row) => row.target),
    testPredicted = test.map((row) => predict(row.features));
  return {
    model,
    predict,
    scaling,
    training,
    test,
    trainMse: mse(trainActual, trainPredicted),
    testMse: mse(testActual, testPredicted),
    testRmse: rmse(testActual, testPredicted),
    testMae: mae(testActual, testPredicted),
    testR2: rSquared(testActual, testPredicted),
  };
}

const lambdas = [1e-4, 1e-3, 1e-2, 0.1, 1, 10, 100, 1000];
const colors = [
  "#35d6e6",
  "#5e8dff",
  "#8557df",
  "#b858e5",
  "#ff667f",
  "#f49a39",
  "#e4d334",
  "#58d86c",
  "#2bcaaa",
  "#80d548",
];
const fmt = (value: number, digits = 3) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";
const pathFor = (
  points: Array<{ x: number; y: number }>,
  x: (value: number) => number,
  y: (value: number) => number,
) =>
  points
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${x(point.x).toFixed(1)},${y(point.y).toFixed(1)}`,
    )
    .join(" ");

function Sidebar() {
  const sections = [
    ["Home", Home],
    ["Projects", Folder],
    ["Datasets", Database],
    ["Models", Network],
    ["All Lessons", Boxes],
    ["My Progress", Target],
    ["Bookmarks", Bookmark],
    ["Linear Regression", Zap],
    ["Ridge Regression", Zap],
    ["Lasso Regression", Zap],
    ["Elastic Net", Zap],
    ["Logistic Regression", Trophy],
    ["Decision Trees", Network],
    ["Random Forest", Target],
    ["SVM", Network],
    ["K-Means", Boxes],
    ["Documentation", BookOpen],
    ["Cheat Sheets", FileText],
    ["Glossary", GraduationCap],
  ] as const;
  return (
    <aside className="ridge-sidebar">
      <Link to="/" className="ridge-brand">
        <span>〽</span>
        <strong>
          Mega ML<small>AI Observatory</small>
        </strong>
      </Link>
      <nav>
        {sections.map(([label, Icon], index) => (
          <div
            key={label}
            className={`${label === "Ridge Regression" ? "selected" : ""} ${[4, 7, 16].includes(index) ? "section-start" : ""}`}
          >
            {index === 4 && <small>LEARN</small>}
            {index === 7 && <small>ALGORITHMS</small>}
            {index === 16 && <small>RESOURCES</small>}
            {label === "Home" ? (
              <Link to="/">
                <Icon />
                {label}
              </Link>
            ) : (
              <span>
                <Icon />
                {label}
              </span>
            )}
          </div>
        ))}
      </nav>
      <div className="ridge-level">
        <p>
          <Medal />
          Level 12
        </p>
        <i>
          <b />
        </i>
        <small>3,250 / 5,000 XP</small>
      </div>
    </aside>
  );
}

function CoefficientPaths({
  paths,
  lambda,
}: {
  paths: Array<{ lambda: number; coefficients: number[] }>;
  lambda: number;
}) {
  const width = 455,
    height = 245,
    pad = { l: 55, r: 54, t: 14, b: 40 };
  const values = paths.flatMap((path) => path.coefficients),
    max = Math.max(...values.map(Math.abs), 0.1);
  const x = (value: number) =>
    pad.l + ((Math.log10(value) + 4) / 7) * (width - pad.l - pad.r);
  const y = (value: number) =>
    pad.t + ((max - value) / (max * 2)) * (height - pad.t - pad.b);
  const coefficientCount = paths[0]?.coefficients.length ?? 0;
  return (
    <svg
      className="ridge-chart coefficient-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Coefficient shrinkage paths"
    >
      {[-1, -0.5, 0, 0.5, 1].map((value) => (
        <line
          key={value}
          x1={pad.l}
          x2={width - pad.r}
          y1={y(value * max)}
          y2={y(value * max)}
        />
      ))}
      {lambdas.map((value) => (
        <g key={value}>
          <line x1={x(value)} x2={x(value)} y1={pad.t} y2={height - pad.b} />
          <text x={x(value)} y={height - 19} textAnchor="middle">
            10{Math.log10(value)}
          </text>
        </g>
      ))}
      {Array.from({ length: coefficientCount }, (_, column) => (
        <path
          key={column}
          style={{ stroke: colors[column] }}
          d={pathFor(
            paths.map((item) => ({
              x: item.lambda,
              y: item.coefficients[column],
            })),
            x,
            y,
          )}
        />
      ))}
      <line
        className="current"
        x1={x(lambda)}
        x2={x(lambda)}
        y1={pad.t}
        y2={height - pad.b}
      />
      <text className="axis-label" x={width / 2} y={height - 2}>
        λ (Regularization Strength)
      </text>
    <text
      className="axis-label rotate"
      x="12"
      y="125"
      textAnchor="middle"
      transform="rotate(-90 12 125)"
    >
        Standardized Coefficient Value
      </text>
      {Array.from({ length: Math.min(10, coefficientCount) }, (_, index) => (
        <g key={index}>
          <line
            style={{ stroke: colors[index] }}
            x1={width - 41}
            x2={width - 27}
            y1={18 + index * 18}
            y2={18 + index * 18}
          />
          <text x={width - 22} y={22 + index * 18}>
            X{index + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

function FittedCurve({
  rows,
  model,
  datasetId,
  range,
}: {
  rows: RidgeRow[];
  model: ReturnType<typeof fitRidge>;
  datasetId: DatasetId;
  range: number;
}) {
  const width = 520,
    height = 278,
    p = { l: 42, r: 15, t: 17, b: 35 },
    sample = rows
      .filter((_, i) => i % Math.max(1, Math.floor(rows.length / 120)) === 0)
      .slice(0, 160),
    xValues = rows.map((row) => row.features[0]),
    xMin0 = Math.min(...xValues),
    xMax0 = Math.max(...xValues),
    center = (xMin0 + xMax0) / 2,
    span = ((xMax0 - xMin0) / 2) * Math.max(0.35, range),
    xMin = center - span,
    xMax = center + span,
    means = model.scaling.means;
  const curve = Array.from({ length: 100 }, (_, index) => {
      const xv = xMin + (index * (xMax - xMin)) / 99;
      const features =
        datasetId === "synthetic"
          ? syntheticFeatures(xv)
          : means.map((value, column) => (column === 0 ? xv : value));
      return { x: xv, y: model.predict(features) };
    }),
    trueCurve =
      datasetId === "synthetic"
        ? curve.map((point) => ({
            x: point.x,
            y:
              0.55 * point.x +
              0.18 * point.x ** 3 +
              0.28 * Math.sin(2 * point.x),
          }))
        : [];
  const yValues = [...sample.map((r) => r.target), ...curve.map((r) => r.y)],
    yMin = Math.min(...yValues),
    yMax = Math.max(...yValues),
    x = (v: number) =>
      p.l + ((v - xMin) / (xMax - xMin || 1)) * (width - p.l - p.r),
    y = (v: number) =>
      height - p.b - ((v - yMin) / (yMax - yMin || 1)) * (height - p.t - p.b);
  return (
    <svg
      className="ridge-chart fit-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Current ridge fitted curve"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={p.l + (i * (width - p.l - p.r)) / 5}
          x2={p.l + (i * (width - p.l - p.r)) / 5}
          y1={p.t}
          y2={height - p.b}
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={p.l}
          x2={width - p.r}
          y1={p.t + (i * (height - p.t - p.b)) / 5}
          y2={p.t + (i * (height - p.t - p.b)) / 5}
        />
      ))}
      {sample.map((row, index) => {
        const test = rows.indexOf(row) % 5 === 0;
        return (
          <circle
            key={index}
            className={test ? "test-point" : "train-point"}
            cx={x(row.features[0])}
            cy={y(row.target)}
            r="3"
          />
        );
      })}
      <path className="ridge-fit" d={pathFor(curve, x, y)} />
      {trueCurve.length > 0 && (
        <path className="true-fit" d={pathFor(trueCurve, x, y)} />
      )}
      <text className="axis-label" x={width / 2} y={height - 4}>
        x
      </text>
      <text className="axis-label" x="8" y={height / 2}>
        y
      </text>
    </svg>
  );
}

function TradeoffChart({
  errors,
  lambda,
}: {
  errors: Array<{ lambda: number; train: number; test: number }>;
  lambda: number;
}) {
  const width = 500,
    height = 205,
    p = { l: 50, r: 20, t: 17, b: 35 },
    all = errors.flatMap((item) => [item.train, item.test]),
    min = Math.max(Math.min(...all), 1e-8),
    max = Math.max(...all),
    x = (v: number) => p.l + ((Math.log10(v) + 4) / 7) * (width - p.l - p.r),
    y = (v: number) =>
      p.t +
      ((Math.log10(max) - Math.log10(Math.max(v, min))) /
        (Math.log10(max) - Math.log10(min) || 1)) *
        (height - p.t - p.b);
  return (
    <svg className="ridge-chart trade-chart" viewBox={`0 0 ${width} ${height}`}>
      {lambdas.map((value) => (
        <g key={value}>
          <line x1={x(value)} x2={x(value)} y1={p.t} y2={height - p.b} />
          <text x={x(value)} y={height - 15} textAnchor="middle">
            10{Math.log10(value)}
          </text>
        </g>
      ))}
      <path
        className="train-line"
        d={pathFor(
          errors.map((item) => ({ x: item.lambda, y: item.train })),
          x,
          y,
        )}
      />
      <path
        className="test-line"
        d={pathFor(
          errors.map((item) => ({ x: item.lambda, y: item.test })),
          x,
          y,
        )}
      />
      {errors.map((item) => (
        <g key={item.lambda}>
          <circle
            className="train-dot"
            cx={x(item.lambda)}
            cy={y(item.train)}
            r="3"
          />
          <circle
            className="test-dot"
            cx={x(item.lambda)}
            cy={y(item.test)}
            r="3"
          />
        </g>
      ))}
      <line
        className="current"
        x1={x(lambda)}
        x2={x(lambda)}
        y1={p.t}
        y2={height - p.b}
      />
      <text className="axis-label" x={width / 2} y={height - 1}>
        λ (Regularization Strength)
      </text>
    </svg>
  );
}

export default function RidgeRegressionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("visualize"),
    [lambda, setLambda] = useState(0.1),
    [intercept, setIntercept] = useState(true),
    [standardized, setStandardized] = useState(true),
    [plotRange, setPlotRange] = useState(1),
    [datasetId, setDatasetId] = useState<DatasetId>("synthetic"),
    [rows, setRows] = useState<RidgeRow[]>(() => syntheticRows()),
    [training, setTraining] = useState(false),
    [bookmarked, setBookmarked] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [datasetOpen, setDatasetOpen] = useState(false),
    [shareLabel, setShareLabel] = useState("Share"),
    [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const result = useMemo(
    () => fitRidge(rows, lambda, standardized, intercept),
    [rows, lambda, standardized, intercept],
  );
  const paths = useMemo(
    () =>
      lambdas.map((value) => ({
        lambda: value,
        coefficients: fitRidge(rows, value, standardized, intercept).model
          .coefficients,
      })),
    [rows, standardized, intercept],
  );
  const errors = useMemo(
    () =>
      lambdas.map((value) => {
        const fitted = fitRidge(rows, value, standardized, intercept);
        return { lambda: value, train: fitted.trainMse, test: fitted.testMse };
      }),
    [rows, standardized, intercept],
  );
  const best = errors.reduce((a, b) => (b.test < a.test ? b : a));
  const reset = () => {
    setLambda(0.1);
    setIntercept(true);
    setStandardized(true);
    setPlotRange(1);
    setDatasetId("synthetic");
    setRows(syntheticRows());
  };
  const chooseDataset = (id: DatasetId) => {
    setDatasetId(id);
    setRows(datasetFactories[id]());
    setDatasetOpen(false);
  };
  const retrain = () => {
    setTraining(true);
    window.setTimeout(() => setTraining(false), 450);
  };
  const share = () => {
    setShareLabel("Copied");
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    window.setTimeout(() => setShareLabel("Share"), 1200);
  };
  const upload = (file?: File) => {
    if (!file) return;
    file.text().then((text) => {
      const matrix = text
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((line) => line.split(",").map(Number))
        .filter((row) => row.length >= 2 && row.every(Number.isFinite));
      if (matrix.length >= 5) {
        setRows(
          matrix.map((row) => ({
            features: row.slice(0, -1),
            target: row.at(-1) ?? 0,
          })),
        );
        setDatasetId("linear");
        setActiveTab("dataset");
      }
    });
  };
  const download = () => {
    const blob = new Blob(
        [
          JSON.stringify(
            {
              algorithm: "Ridge Regression",
              dataset: datasetMeta[datasetId].name,
              lambda,
              intercept,
              standardized,
              metrics: {
                rmse: result.testRmse,
                mae: result.testMae,
                r2: result.testR2,
              },
              coefficients: result.model.coefficients,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ridge-regression-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const residuals = result.test.map(
      (row) => row.target - result.predict(row.features),
    ),
    bias2 = (residuals.reduce((a, b) => a + b, 0) / residuals.length) ** 2,
    noiseVariance =
      residuals.reduce(
        (sum, value) =>
          sum +
          (value - residuals.reduce((a, b) => a + b, 0) / residuals.length) **
            2,
        0,
      ) / residuals.length,
    instability = Math.max(0, result.testMse - result.trainMse),
    total = bias2 + noiseVariance + instability || 1;
  return (
    <div className={`ridge-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar />
      <main className="ridge-main">
        <header className="ridge-header">
          <div>
            <h1>
              <button
                aria-label="Collapse lesson navigation"
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                <ChevronLeft />
              </button>
              Ridge Regression
            </h1>
            <p>
              L2 regularization that shrinks coefficients to reduce variance and
              improve generalization.
            </p>
          </div>
          <div>
            <button
              className={bookmarked ? "active" : ""}
              onClick={() => setBookmarked((v) => !v)}
            >
              <Bookmark />
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
            <button onClick={share}>
              <Share2 />
              {shareLabel}
            </button>
            <div className="ridge-menu">
              <button
                aria-label="More actions"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreVertical />
              </button>
              {menuOpen && (
                <div>
                  <button onClick={() => { reset(); setMenuOpen(false); }}>
                    <RotateCcw />
                    Reset
                  </button>
                  <button onClick={() => { download(); setMenuOpen(false); }}>
                    <Download />
                    Download report
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <nav className="ridge-tabs">
          {tabItems.map(([id, label]) => (
            <button
              key={id}
              className={activeTab === id ? "active" : ""}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        {activeTab === "visualize" && (
          <Visualize
            rows={rows}
            datasetId={datasetId}
            lambda={lambda}
            setLambda={setLambda}
            intercept={intercept}
            setIntercept={setIntercept}
            standardized={standardized}
            setStandardized={setStandardized}
            plotRange={plotRange}
            setPlotRange={setPlotRange}
            result={result}
            paths={paths}
            errors={errors}
            best={best}
            decomposition={{
              bias: (bias2 / total) * 100,
              variance: (instability / total) * 100,
              residual: (noiseVariance / total) * 100,
            }}
            reset={reset}
            datasetOpen={datasetOpen}
            setDatasetOpen={setDatasetOpen}
            chooseDataset={chooseDataset}
            fileRef={fileRef}
          />
        )}
        {activeTab === "learn" && <LearnPanel />}
        {activeTab === "dataset" && (
          <DatasetPanel
            rows={rows}
            setRows={setRows}
            datasetId={datasetId}
            chooseDataset={chooseDataset}
            fileRef={fileRef}
          />
        )}{" "}
        {activeTab === "train" && (
          <TrainPanel
            training={training}
            retrain={retrain}
            result={result}
            lambda={lambda}
          />
        )}{" "}
        {activeTab === "metrics" && <MetricsPanel result={result} />}{" "}
        {activeTab === "compare" && (
          <ComparePanel errors={errors} lambda={lambda} setLambda={setLambda} />
        )}{" "}
        {activeTab === "explain" && (
          <ExplainPanel result={result} rows={rows} />
        )}
        <input
          ref={fileRef}
          className="ridge-file"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => upload(event.target.files?.[0])}
        />
        <footer className="ridge-footer">
          <span>
            Algorithm: <b>Ridge Regression</b>
          </span>
          <span>
            Objective: <b>Minimize MSE with L2 penalty</b>
          </span>
          <span>
            Need help? View{" "}
            <button onClick={() => setActiveTab("explain")}>Explain</button> tab
            or <Link to="/documentation">Documentation</Link>
          </span>
        </footer>
      </main>
    </div>
  );
}

type VisualizeProps = {
  rows: RidgeRow[];
  datasetId: DatasetId;
  lambda: number;
  setLambda: (v: number) => void;
  intercept: boolean;
  setIntercept: (v: boolean) => void;
  standardized: boolean;
  setStandardized: (v: boolean) => void;
  plotRange: number;
  setPlotRange: (v: number) => void;
  result: ReturnType<typeof fitRidge>;
  paths: Array<{ lambda: number; coefficients: number[] }>;
  errors: Array<{ lambda: number; train: number; test: number }>;
  best: { lambda: number; train: number; test: number };
  decomposition: { bias: number; variance: number; residual: number };
  reset: () => void;
  datasetOpen: boolean;
  setDatasetOpen: (v: boolean) => void;
  chooseDataset: (id: DatasetId) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
};
function Visualize(props: VisualizeProps) {
  const {
    bias,
    variance,
    residual: irreducible,
  } = props.decomposition;
  return (
    <div className="ridge-workspace">
      <section className="ridge-path-card">
        <h2>
          Coefficient Paths <small>(Shrinkage)</small>
          <Info />
        </h2>
        <CoefficientPaths paths={props.paths} lambda={props.lambda} />
        <div className="ridge-inline-range">
          <i>λ</i>
          <input
            aria-label="Coefficient path lambda"
            type="range"
            min="-4"
            max="3"
            step=".05"
            value={Math.log10(props.lambda)}
            onChange={(event) =>
              props.setLambda(10 ** Number(event.target.value))
            }
          />
          <input
            aria-label="Lambda value"
            type="number"
            min=".0001"
            max="1000"
            step=".001"
            value={Number(props.lambda.toPrecision(4))}
            onChange={(event) =>
              props.setLambda(Math.max(0.0001, Number(event.target.value)))
            }
          />
        </div>
      </section>
      <section className="ridge-fit-card">
        <h2>
          Fitted Curve <small>(Current λ)</small>
          <Info />
        </h2>
        <div className="ridge-fit-legend">
          <span>
            <i />
            Training Data
          </span>
          <span>
            <i />
            Test Data
          </span>
          <span>
            <i />
            Ridge Fit
          </span>
          <span>
            <i />
            True Function
          </span>
        </div>
        <FittedCurve
          rows={props.rows}
          model={props.result}
          datasetId={props.datasetId}
          range={props.plotRange}
        />
        <div className="ridge-fit-metrics">
          <span>
            <i>RMSE (Test)</i>
            <b>{fmt(props.result.testRmse)}</b>
          </span>
          <span>
            <i>R² (Test)</i>
            <b>{fmt(props.result.testR2)}</b>
          </span>
          <span>
            <i>MAE (Test)</i>
            <b>{fmt(props.result.testMae)}</b>
          </span>
        </div>
      </section>
      <aside className="ridge-controls">
        <section>
          <h2>
            Controls{" "}
            <button onClick={props.reset}>
              <RotateCcw />
              Reset
            </button>
          </h2>
          <label>
            Regularization (λ) <Info />
          </label>
          <div className="ridge-gauge">
            <i
              style={{
              transform: `rotate(${-155 + ((Math.log10(props.lambda) + 4) / 7) * 130}deg)`,
              }}
            />
            <strong>
              {props.lambda < 0.001
                ? props.lambda.toExponential(1)
                : fmt(props.lambda, 3)}
            </strong>
            <small>Stronger Regularization →</small>
          </div>
          <label>
            L2 Penalty (λ ∑ wⱼ²) <Info />
          </label>
          <b className="ridge-lambda-value">
            {props.lambda < 0.001
              ? props.lambda.toExponential(1)
              : fmt(props.lambda, 3)}
          </b>
          <input
            aria-label="L2 penalty"
            type="range"
            min="-4"
            max="3"
            step=".05"
            value={Math.log10(props.lambda)}
            onChange={(event) =>
              props.setLambda(10 ** Number(event.target.value))
            }
          />
          <div className="ridge-range-label">
            <span>None</span>
            <span>Strong</span>
          </div>
          <div className="ridge-toggle-row">
            <label>
              Model Intercept (Bias) <Info />
            </label>
            <input
              aria-label="Model intercept"
              type="checkbox"
              checked={props.intercept}
              onChange={(event) => props.setIntercept(event.target.checked)}
            />
            <i />
          </div>
          <div className="ridge-intercept">
            Intercept Value{" "}
            <b>{fmt(props.intercept ? props.result.model.intercept : 0)}</b>
          </div>
          <div className="ridge-toggle-row">
            <label>
              Feature Standardization <Info />
            </label>
            <input
              aria-label="Feature standardization"
              type="checkbox"
              checked={props.standardized}
              onChange={(event) => props.setStandardized(event.target.checked)}
            />
            <i />
          </div>
          <p>
            Features are{" "}
            {props.standardized
              ? "standardized (mean=0, std=1)"
              : "used in their original units"}
            .
          </p>
          <label>
            Plot Range <Info />
          </label>
          <input
            aria-label="Plot range"
            type="range"
            min=".35"
            max="1.3"
            step=".05"
            value={props.plotRange}
            onChange={(event) => props.setPlotRange(Number(event.target.value))}
          />
          <div className="ridge-range-label">
            <span>Narrow</span>
            <span>Wide</span>
          </div>
        </section>
        <section className="ridge-dataset-card">
          <h2>
            Dataset <Info />
            <button onClick={() => props.setDatasetOpen(!props.datasetOpen)}>
              Open
            </button>
          </h2>
          <div className="ridge-selected-dataset">
            <b>
              {datasetMeta[props.datasetId].name}
              <small>{props.datasetId === "synthetic" && "Default"}</small>
            </b>
            <p>
              {props.rows.length.toLocaleString()} samples ·{" "}
              {props.rows[0]?.features.length ?? 0} features
            </p>
            <span>{datasetMeta[props.datasetId].description}</span>
          </div>
          <button
            className="ridge-other"
            onClick={() => props.setDatasetOpen(!props.datasetOpen)}
          >
            Other Datasets <ChevronDown />
          </button>
          {props.datasetOpen && (
            <div className="ridge-dataset-menu">
              {(Object.keys(datasetMeta) as DatasetId[]).map((id) => (
                <button key={id} onClick={() => props.chooseDataset(id)}>
                  {datasetMeta[id].name}
                </button>
              ))}
            </div>
          )}
          <button
            className="ridge-upload"
            onClick={() => props.fileRef.current?.click()}
          >
            <CloudUpload />
            <span>
              Upload Dataset<small>CSV, TSV up to 50MB</small>
            </span>
          </button>
        </section>
      </aside>
      <section className="ridge-tradeoff-card">
        <div>
          <h2>
            Bias–Variance Trade-off <Info />
          </h2>
          <TradeoffChart errors={props.errors} lambda={props.lambda} />
        </div>
        <div className="ridge-decomposition">
          <h3>
            Error Decomposition <small>(Current λ)</small>
            <Info />
          </h3>
          <p>
            Total Test MSE <b>{fmt(props.result.testMse)}</b>
          </p>
          <div>
            <span style={{ width: `${bias}%` }}>
              Bias²<b>{fmt(bias, 0)}%</b>
            </span>
            <span style={{ width: `${variance}%` }}>
              Variance<b>{fmt(variance, 0)}%</b>
            </span>
            <span style={{ width: `${irreducible}%` }}>
              Residual<b>{fmt(irreducible, 0)}%</b>
            </span>
          </div>
          <p>
            Ridge reduces variance by shrinking coefficients, at the cost of a
            possible increase in bias.
          </p>
          <small>Best tested λ: {props.best.lambda}</small>
        </div>
      </section>
      <section className="ridge-insights">
        <h2>
          <SlidersHorizontal />
          Key Insights
        </h2>
        <div>
          <article>
            <LineChart />
            <h3>Shrinkage Stabilizes Coefficients</h3>
            <p>
              Larger λ shrinks coefficients toward zero, reducing variance and
              overfitting.
            </p>
          </article>
          <article>
            <Scale />
            <h3>Find the Sweet Spot</h3>
            <p>
              An intermediate λ minimizes test error by balancing bias and
              variance.
            </p>
          </article>
          <article>
            <ShieldCheck />
            <h3>Handles Multicollinearity</h3>
            <p>
              Ridge keeps correlated features in the model but shrinks them
              stably.
            </p>
          </article>
          <article>
            <Activity />
            <h3>Underfit if Too Strong</h3>
            <p>
              Very large λ oversmooths the model, increasing bias and hurting
              performance.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="ridge-panel-head">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
  );
}
function LearnPanel() {
  return (
    <section className="ridge-panel">
      <PanelHeader
        title="Ridge Regression"
        subtitle="Learn why L2 regularization stabilizes correlated linear models."
      />
      <div className="ridge-learn-grid">
        <article>
          <KeyRound />
          <div>
            <h3>Objective</h3>
            <p>
              Minimize squared error plus λ times the sum of squared
              coefficients.
            </p>
          </div>
        </article>
        <article>
          <Scale />
          <div>
            <h3>Shrinkage</h3>
            <p>
              Increasing λ continuously pulls coefficients toward zero without
              removing features.
            </p>
          </div>
        </article>
        <article>
          <Network />
          <div>
            <h3>Multicollinearity</h3>
            <p>
              Correlated predictors share weight more stably than ordinary least
              squares.
            </p>
          </div>
        </article>
        <article>
          <Activity />
          <div>
            <h3>Trade-off</h3>
            <p>
              Moderate bias can substantially reduce variance and improve
              held-out performance.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
function DatasetPanel({
  rows,
  setRows,
  datasetId,
  chooseDataset,
  fileRef,
}: {
  rows: RidgeRow[];
  setRows: React.Dispatch<React.SetStateAction<RidgeRow[]>>;
  datasetId: DatasetId;
  chooseDataset: (id: DatasetId) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <section className="ridge-panel">
      <PanelHeader
        title="Dataset"
        subtitle="Switch sources, upload CSV, and edit every value used by the live ridge model."
      />
      <div className="ridge-panel-actions">
        <select
          value={datasetId}
          onChange={(event) => chooseDataset(event.target.value as DatasetId)}
        >
          {(Object.keys(datasetMeta) as DatasetId[]).map((id) => (
            <option key={id} value={id}>
              {datasetMeta[id].name}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            setRows((current) => [
              ...current,
              {
                features: Array(current[0]?.features.length ?? 1).fill(0),
                target: 0,
              },
            ])
          }
        >
          Add Row
        </button>
        <button
          disabled={rows.length <= 5}
          onClick={() => setRows((current) => current.slice(0, -1))}
        >
          Remove Last
        </button>
        <button onClick={() => fileRef.current?.click()}>
          <Upload />
          Upload CSV
        </button>
      </div>
      <div className="ridge-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              {rows[0]?.features.map((_, column) => (
                <th key={column}>x{column + 1}</th>
              ))}
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                {row.features.map((value, column) => (
                  <td key={column}>
                    <input
                      aria-label={`row ${index + 1} feature ${column + 1}`}
                      type="number"
                      step=".01"
                      value={value}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...item,
                                  features: item.features.map((entry, col) =>
                                    col === column
                                      ? Number(event.target.value)
                                      : entry,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                    />
                  </td>
                ))}
                <td>
                  <input
                    aria-label={`row ${index + 1} target`}
                    type="number"
                    step=".01"
                    value={row.target}
                    onChange={(event) =>
                      setRows((current) =>
                        current.map((item, rowIndex) =>
                          rowIndex === index
                            ? { ...item, target: Number(event.target.value) }
                            : item,
                        ),
                      )
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
function TrainPanel({
  training,
  retrain,
  result,
  lambda,
}: {
  training: boolean;
  retrain: () => void;
  result: ReturnType<typeof fitRidge>;
  lambda: number;
}) {
  return (
    <section className="ridge-panel">
      <PanelHeader
        title="Train Ridge Model"
        subtitle="Run the shared normal-equation ridge solver on the current training partition."
      />
      <div className="ridge-training">
        <FlaskConical />
        <h2>
          {training ? "Solving regularized coefficients…" : "Ready to train"}
        </h2>
        <p>
          λ = {fmt(lambda, 4)} · {result.training.length} training rows ·{" "}
          {result.model.coefficients.length} coefficients
        </p>
        <button disabled={training} onClick={retrain}>
          <Play />
          {training ? "Training…" : "Train Model"}
        </button>
        <div>
          {result.model.coefficients.map((value, index) => (
            <span key={index}>
              β{index + 1}
              <b>{fmt(value, 5)}</b>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
function MetricsPanel({ result }: { result: ReturnType<typeof fitRidge> }) {
  return (
    <section className="ridge-panel">
      <PanelHeader
        title="Model Metrics"
        subtitle="Held-out regression metrics computed from the current live model."
      />
      <div className="ridge-metric-grid">
        <article>
          <small>Test RMSE</small>
          <strong>{fmt(result.testRmse)}</strong>
        </article>
        <article>
          <small>Test MAE</small>
          <strong>{fmt(result.testMae)}</strong>
        </article>
        <article>
          <small>Test R²</small>
          <strong>{fmt(result.testR2)}</strong>
        </article>
        <article>
          <small>Test MSE</small>
          <strong>{fmt(result.testMse)}</strong>
        </article>
      </div>
    </section>
  );
}
function ComparePanel({
  errors,
  lambda,
  setLambda,
}: {
  errors: Array<{ lambda: number; train: number; test: number }>;
  lambda: number;
  setLambda: (v: number) => void;
}) {
  return (
    <section className="ridge-panel">
      <PanelHeader
        title="Compare Regularization Strengths"
        subtitle="Choose among real models fitted at eight logarithmic λ values."
      />
      <div className="ridge-compare-grid">
        {errors.map((item) => (
          <button
            key={item.lambda}
            className={
              Math.abs(Math.log10(lambda) - Math.log10(item.lambda)) < 0.01
                ? "selected"
                : ""
            }
            onClick={() => setLambda(item.lambda)}
          >
            <span>λ = {item.lambda}</span>
            <strong>{fmt(item.test)}</strong>
            <small>Test MSE</small>
            <i>Train: {fmt(item.train)}</i>
          </button>
        ))}
      </div>
    </section>
  );
}
function ExplainPanel({
  result,
  rows,
}: {
  result: ReturnType<typeof fitRidge>;
  rows: RidgeRow[];
}) {
  const [inputs, setInputs] = useState(() => [...(rows[0]?.features ?? [])]);
  const prediction = result.predict(inputs);
  return (
    <section className="ridge-panel">
      <PanelHeader
        title="Explain & Predict"
        subtitle="Inspect shrunken weights and run live inference with new feature values."
      />
      <div className="ridge-explain">
        <article>
          <h3>Coefficient profile</h3>
          {result.model.coefficients.map((value, index) => (
            <p key={index}>
              <span>β{index + 1}</span>
              <i>
                <b
                  style={{
                    width: `${Math.min(100, (Math.abs(value) / (Math.max(...result.model.coefficients.map(Math.abs)) || 1)) * 100)}%`,
                  }}
                />
              </i>
              <strong>{fmt(value, 5)}</strong>
            </p>
          ))}
        </article>
        <article>
          <h3>Live inference</h3>
          <div>
            {inputs.map((value, index) => (
              <label key={index}>
                x{index + 1}
                <input
                  aria-label={`Inference feature ${index + 1}`}
                  type="number"
                  step=".1"
                  value={value}
                  onChange={(event) =>
                    setInputs((current) =>
                      current.map((entry, column) =>
                        column === index ? Number(event.target.value) : entry,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </div>
          <strong>{fmt(prediction, 4)}</strong>
          <p>Prediction from the current ridge model.</p>
        </article>
      </div>
    </section>
  );
}
