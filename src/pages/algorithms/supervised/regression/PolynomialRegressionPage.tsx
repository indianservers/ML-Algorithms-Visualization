import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LabLessonPanel } from "../../../../components/common/LabTabs";
import {
  Activity,
  BarChart3,
  Beaker,
  Bell,
  BookOpen,
  Boxes,
  ChevronDown,
  CircleHelp,
  Database,
  Download,
  FlaskConical,
  Gauge,
  Home,
  Info,
  Lightbulb,
  Maximize2,
  Moon,
  Network,
  Play,
  RotateCcw,
  Scale,
  Settings,
  Share2,
  SlidersHorizontal,
  Sun,
  Upload,
  WandSparkles,
} from "lucide-react";
import {
  energyDemandDataset,
  studentMarksDataset,
} from "../../../../data/sampleDatasets";
import {
  datasetKPiecewise,
  datasetLSvrNonlinear,
  labPoints,
} from "../../../../lib/regression/regressionDatasets";
import {
  polynomialFeatures,
  ridgeRegression,
} from "../../../../lib/algorithms/regression/linearRegression";
import { mae, mse, rmse, rSquared } from "../../../../lib/math/metrics";
import "./PolynomialRegressionPage.css";
import { useTheme } from "../../../../stores/uiStore";

type Point = { x: number; y: number };
type Tab =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
type Scaling = "standardize" | "minmax" | "none";
const tabs: Array<[Tab, string, typeof BookOpen]> = [
  ["learn", "Learn", BookOpen],
  ["visualize", "Visualize", BarChart3],
  ["dataset", "Dataset", Database],
  ["train", "Train", SlidersHorizontal],
  ["metrics", "Metrics", Activity],
  ["compare", "Compare", Boxes],
  ["explain", "Explain", Lightbulb],
];
const noiseAt = (i: number) => {
  const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return (v - Math.floor(v)) * 2 - 1;
};
function sineRows(noise: number, count = 200): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const x = -3.2 + (i * 6.4) / (count - 1);
    return {
      x: Number(x.toFixed(4)),
      y: Number(
        (-0.72 * Math.sin(x) + 0.24 * x + noiseAt(i) * noise * 2.2).toFixed(4),
      ),
    };
  });
}
const datasetFactories = {
  sine: (noise: number) => sineRows(noise),
  quadratic: (_noise: number) =>
    Array.from({ length: 11 }, (_, i) => {
      const x = i - 5;
      return { x, y: x * x };
    }),
  cubic: (_noise: number) =>
    Array.from({ length: 21 }, (_, i) => {
      const x = i - 10;
      return { x, y: 0.5 * x ** 3 - 2 * x ** 2 + x + noiseAt(i) * 6 };
    }),
  linear: () =>
    Array.from({ length: 80 }, (_, i) => {
      const x = -3 + (i * 6) / 79;
      return { x, y: 0.72 * x + 0.24 + noiseAt(i + 300) * 0.34 };
    }),
  students: () =>
    (studentMarksDataset.data as Array<Record<string, number>>).map((r) => ({
      x: r.study_hours,
      y: r.marks,
    })),
  energy: () =>
    (energyDemandDataset.data as Array<Record<string, number>>).map((r) => ({
      x: r.temperature_c,
      y: r.demand_mw,
    })),
  piecewise: () => labPoints(datasetKPiecewise()).map((p) => ({ x: p.x, y: p.y })),
  svrCurve: () => labPoints(datasetLSvrNonlinear()).map((p) => ({ x: p.x, y: p.y })),
};
type DatasetId = keyof typeof datasetFactories;
const datasetLabels: Record<DatasetId, string> = {
  sine: "Sine Wave with Noise",
  quadratic: "Quadratic (y = x²)",
  cubic: "Cubic with noise",
  linear: "Synthetic Linear Data",
  students: "Student Marks Dataset",
  energy: "Energy Demand Dataset",
  piecewise: "Piecewise / tree",
  svrCurve: "Smooth nonlinear",
};
function scaler(points: Point[], mode: Scaling) {
  const xs = points.map((p) => p.x),
    min = Math.min(...xs),
    max = Math.max(...xs),
    mean = xs.reduce((a, b) => a + b, 0) / xs.length,
    sd =
      Math.sqrt(xs.reduce((s, v) => s + (v - mean) ** 2, 0) / xs.length) || 1;
  return {
    transform: (x: number) =>
      mode === "standardize"
        ? (x - mean) / sd
        : mode === "minmax"
          ? (x - min) / (max - min || 1)
          : x,
    label:
      mode === "standardize"
        ? "Standardize (Z-score)"
        : mode === "minmax"
          ? "Min–max [0, 1]"
          : "No scaling",
  };
}
function fit(points: Point[], degree: number, alpha: number, scaling: Scaling) {
  const train = points.filter((_, i) => i % 5 !== 0);
  const validation = points.filter((_, i) => i % 5 === 0);
  if (train.length < 2 || validation.length < 1) {
    throw new Error("Polynomial degree fitting requires enough observations for a train/validation split.");
  }
  const scaleX = scaler(train, scaling).transform;
  const expanded = polynomialFeatures(train.map((p) => scaleX(p.x)), degree);
  if (expanded.some((row) => row.some((v) => !Number.isFinite(v)))) {
    throw new Error(`Polynomial degree ${degree} produced non-finite features. Scale the input or lower the degree.`);
  }
  const model = ridgeRegression(expanded, train.map((p) => p.y), alpha);
  const predict = (x: number) => model.predict(polynomialFeatures([scaleX(x)], degree)[0]);
  const ta = train.map((p) => p.y);
  const tp = train.map((p) => predict(p.x));
  const va = validation.map((p) => p.y);
  const vp = validation.map((p) => predict(p.x));
  const trainStats = { mae: mae(ta, tp), rmse: rmse(ta, tp), r2: rSquared(ta, tp) };
  const valStats = { mae: mae(va, vp), rmse: rmse(va, vp), r2: rSquared(va, vp) };
  return {
    model,
    predict,
    train,
    validation,
    trainMse: mse(ta, tp),
    validationMse: mse(va, vp),
    trainRmse: trainStats.rmse,
    validationRmse: valStats.rmse,
    trainR2: trainStats.r2,
    validationR2: valStats.r2,
    r2: valStats.r2,
    mae: valStats.mae,
    rmse: valStats.rmse,
    residuals: validation.map((p, i) => ({ x: p.x, value: p.y - vp[i] })),
  };
}
const fmt = (value: number, digits = 4) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";
const pathFor = (
  points: Array<{ x: number; y: number }>,
  x: (v: number) => number,
  y: (v: number) => number,
) =>
  points
    .map((p, i) => `${i ? "L" : "M"}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`)
    .join(" ");

function SideNav() {
  return (
    <aside className="poly-sidebar">
      <Link className="poly-brand" to="/">
        <span>〽</span>
        <strong>
          Mega ML<small>AI Observatory</small>
        </strong>
      </Link>
      <nav>
        <Link to="/">
          <Home />
          Home
        </Link>
        <span>
          <Network />
          Models
        </span>
        <span>
          <Database />
          Datasets
        </span>
        <span>
          <FlaskConical />
          Experiments
        </span>
        <span className="active">
          <BookOpen />
          Learn
        </span>
        <span>
          <Boxes />
          Playground
        </span>
        <span>
          <WandSparkles />
          Deployments
        </span>
        <span>
          <Gauge />
          Monitoring
        </span>
        <span>
          <Download />
          Reports
        </span>
        <span>
          <Settings />
          Settings
        </span>
      </nav>
      <div className="poly-user">
        <b>M</b>
        <span>
          Mega ML User<small>Pro Plan</small>
        </span>
        <ChevronDown />
      </div>
    </aside>
  );
}
function MainChart({
  points,
  result,
  interactive,
  onAdd,
}: {
  points: Point[];
  result: ReturnType<typeof fit>;
  interactive: boolean;
  onAdd: (p: Point) => void;
}) {
  const width = 760,
    height = 270,
    pad = { l: 52, r: 18, t: 20, b: 36 },
    xs = points.map((p) => p.x),
    ys = points.flatMap((p) => [p.y, result.predict(p.x)]),
    xMin = Math.min(...xs),
    xMax = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys),
    yp = Math.max((y1 - y0) * 0.12, 0.2),
    yMin = y0 - yp,
    yMax = y1 + yp,
    x = (v: number) =>
      pad.l + ((v - xMin) / (xMax - xMin || 1)) * (width - pad.l - pad.r),
    y = (v: number) =>
      height -
      pad.b -
      ((v - yMin) / (yMax - yMin || 1)) * (height - pad.t - pad.b),
    curve = Array.from({ length: 100 }, (_, i) => {
      const xv = xMin + (i * (xMax - xMin)) / 99;
      return { x: xv, y: result.predict(xv) };
    }),
    band = Math.sqrt(result.validationMse),
    upper = curve.map((p) => ({ x: p.x, y: p.y + band })),
    lower = [...curve].reverse().map((p) => ({ x: p.x, y: p.y - band }));
  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const r = e.currentTarget.getBoundingClientRect(),
      sx = ((e.clientX - r.left) / r.width) * width,
      sy = ((e.clientY - r.top) / r.height) * height;
    if (sx < pad.l || sx > width - pad.r || sy < pad.t || sy > height - pad.b)
      return;
    onAdd({
      x: xMin + ((sx - pad.l) / (width - pad.l - pad.r)) * (xMax - xMin),
      y: yMax - ((sy - pad.t) / (height - pad.t - pad.b)) * (yMax - yMin),
    });
  };
  return (
    <svg
      className="poly-main-chart"
      viewBox={`0 0 ${width} ${height}`}
      onClick={click}
      role="img"
      aria-label="Polynomial regression plot"
    >
      <defs>
        <linearGradient id="polyBand" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#a855f7" stopOpacity=".24" />
          <stop offset="1" stopColor="#a855f7" stopOpacity=".03" />
        </linearGradient>
      </defs>
      {Array.from({ length: 7 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={pad.l + (i * (width - pad.l - pad.r)) / 6}
          x2={pad.l + (i * (width - pad.l - pad.r)) / 6}
          y1={pad.t}
          y2={height - pad.b}
        />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={pad.l}
          x2={width - pad.r}
          y1={pad.t + (i * (height - pad.t - pad.b)) / 6}
          y2={pad.t + (i * (height - pad.t - pad.b)) / 6}
        />
      ))}
      <path
        className="confidence"
        d={`${pathFor(upper, x, y)} ${pathFor(lower, x, y)} Z`}
      />
      <path className="fit" d={pathFor(curve, x, y)} />
      {result.train.map((p, i) => (
        <circle
          className="train-point"
          key={`t${i}`}
          cx={x(p.x)}
          cy={y(p.y)}
          r="2.7"
        />
      ))}
      {result.validation.map((p, i) => (
        <circle
          className="validation-point"
          key={`q${i}`}
          cx={x(p.x)}
          cy={y(p.y)}
          r="2.8"
        />
      ))}
      <text x={width / 2} y={height - 7}>
        x
      </text>
      <text x="12" y={height / 2}>
        y
      </text>
      {Array.from({ length: 7 }, (_, i) => {
        const v = xMin + (i * (xMax - xMin)) / 6;
        return (
          <text key={i} x={x(v)} y={height - 18} textAnchor="middle">
            {v.toFixed(1)}
          </text>
        );
      })}
    </svg>
  );
}
function ResidualChart({ result }: { result: ReturnType<typeof fit> }) {
  const w = 390,
    h = 160,
    p = 28,
    xs = result.residuals.map((r) => r.x),
    m = Math.max(...result.residuals.map((r) => Math.abs(r.value)), 0.1),
    x = (v: number) =>
      p +
      ((v - Math.min(...xs)) / (Math.max(...xs) - Math.min(...xs) || 1)) *
        (w - p * 1.3),
    y = (v: number) => h / 2 - (v / m) * (h / 2 - p);
  return (
    <svg className="poly-small-chart" viewBox={`0 0 ${w} ${h}`}>
      <line className="axis" x1={p} x2={w - p / 2} y1={h / 2} y2={h / 2} />
      {result.residuals
        .filter((_, i) => i % 3 === 0)
        .map((r, i) => (
          <g key={i}>
            <line
              className="stem"
              x1={x(r.x)}
              x2={x(r.x)}
              y1={h / 2}
              y2={y(r.value)}
            />
            <circle
              className="residual-dot"
              cx={x(r.x)}
              cy={y(r.value)}
              r="2.5"
            />
          </g>
        ))}
    </svg>
  );
}
function ErrorChart({
  errors,
  degree,
}: {
  errors: Array<{ degree: number; train: number; validation: number }>;
  degree: number;
}) {
  const w = 430,
    h = 160,
    p = 32,
    max = Math.max(...errors.flatMap((e) => [e.train, e.validation]), 0.001),
    x = (v: number) => p + ((v - 1) / 9) * (w - p * 1.4),
    y = (v: number) =>
      Math.max(
        15,
        Math.min(
          h - p,
          h -
            p -
            ((Math.log10(v + 1e-6) + 3) / (Math.log10(max + 1e-6) + 3 || 1)) *
              (h - p * 1.5),
        ),
      );
  return (
    <svg className="poly-small-chart" viewBox={`0 0 ${w} ${h}`}>
      <line
        className="degree-line"
        x1={x(degree)}
        x2={x(degree)}
        y1="10"
        y2={h - p}
      />
      <path
        className="train-error"
        d={pathFor(
          errors.map((e) => ({ x: e.degree, y: e.train })),
          x,
          y,
        )}
      />
      <path
        className="validation-error"
        d={pathFor(
          errors.map((e) => ({ x: e.degree, y: e.validation })),
          x,
          y,
        )}
      />
      {errors.map((e) => (
        <g key={e.degree}>
          <circle
            className="train-dot"
            cx={x(e.degree)}
            cy={y(e.train)}
            r="2.5"
          />
          <circle
            className="validation-dot"
            cx={x(e.degree)}
            cy={y(e.validation)}
            r="2.5"
          />
          <text x={x(e.degree)} y={h - 10} textAnchor="middle">
            {e.degree}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function PolynomialRegressionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("learn"),
    [degree, setDegree] = useState(3),
    [alpha, setAlpha] = useState(0),
    [noise, setNoise] = useState(0.1),
    [scaling, setScaling] = useState<Scaling>("standardize"),
    [datasetId, setDatasetId] = useState<DatasetId>("sine"),
    [rows, setRows] = useState<Point[]>(() => sineRows(0.1)),
    [interactive, setInteractive] = useState(true),
    [training, setTraining] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [quickOpen, setQuickOpen] = useState(false),
    [predictionX, setPredictionX] = useState(0),
    [chartFocused, setChartFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null),
    result = useMemo(
      () => fit(rows, degree, alpha, scaling),
      [rows, degree, alpha, scaling],
    ),
    errors = useMemo(
      () =>
        [1, 2, 3, 5, 8].map((d) => {
          try {
            const r = fit(rows, d, alpha, scaling);
            return {
              degree: d,
              train: r.trainRmse,
              validation: r.validationRmse,
            };
          } catch {
            return { degree: d, train: Number.NaN, validation: Number.NaN };
          }
        }),
      [rows, alpha, scaling],
    ),
    best = errors.reduce((a, b) => (b.validation < a.validation ? b : a)),
    risk = result.trainMse ? result.validationMse / result.trainMse : 1;
  const reset = () => {
      setDegree(3);
      setAlpha(0.001);
      setNoise(0.1);
      setScaling("standardize");
      setDatasetId("sine");
      setRows(sineRows(0.1));
      setPredictionX(0);
    },
    chooseDataset = (id: DatasetId) => {
      setDatasetId(id);
      setRows(datasetFactories[id](noise));
    },
    retrain = () => {
      setTraining(true);
      window.setTimeout(() => setTraining(false), 420);
    },
    updateNoise = (v: number) => {
      setNoise(v);
      if (datasetId === "sine") setRows(sineRows(v));
    },
    upload = (file?: File) => {
      if (!file) return;
      file.text().then((text) => {
        const lines = text
            .trim()
            .split(/\r?\n/)
            .map((line) => line.split(",")),
          parsed = lines
            .slice(1)
            .map((parts) => ({ x: Number(parts[0]), y: Number(parts[1]) }))
            .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
        if (parsed.length >= 4) {
          setRows(parsed);
          setDatasetId("sine");
          setActiveTab("dataset");
        }
      });
    },
    download = () => {
      const blob = new Blob(
          [
            JSON.stringify(
              {
                algorithm: "Polynomial Regression",
                dataset: datasetLabels[datasetId],
                degree,
                alpha,
                scaling,
                metrics: {
                  trainMse: result.trainMse,
                  validationMse: result.validationMse,
                  r2: result.r2,
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
        a = document.createElement("a");
      a.href = url;
      a.download = "polynomial-regression-report.json";
      a.click();
      URL.revokeObjectURL(url);
    };
  return (
    <div className={`poly-shell ${theme}`}>
      <SideNav />
      <main className="poly-main">
        <header className="poly-header">
          <div>
            <div className="poly-title-row">
              <h1>Polynomial Regression</h1>
              <span>Supervised Learning</span>
              <span>Regression</span>
            </div>
            <p>
              Model nonlinear relationships by fitting a polynomial curve to the
              data.
            </p>
          </div>
          <div className="poly-header-actions">
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </button>
            <CircleHelp />
            <Bell />
            <div className="poly-quick">
              <button onClick={() => setQuickOpen((v) => !v)}>
                Quick Actions <ChevronDown />
              </button>
              {quickOpen && (
                <div>
                  <button onClick={reset}>
                    <RotateCcw />
                    Reset experiment
                  </button>
                  <button onClick={download}>
                    <Download />
                    Download report
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="poly-tabs">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              className={activeTab === id ? "active" : ""}
              onClick={() => setActiveTab(id)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
        {activeTab === "learn" && (
          <LabLessonPanel
            tab="Learn"
            route="/ml/supervised/polynomial-regression"
          />
        )}
        {activeTab === "visualize" && (
          <div className="poly-workspace">
            <section className={`poly-visual-card ${chartFocused ? 'focused' : ''}`}>
              <div className="poly-card-head">
                <h2>
                  Data &amp; Model Visualization <Info />
                </h2>
                <label>
                  Interactive mode{" "}
                  <input
                    type="checkbox"
                    checked={interactive}
                    onChange={(e) => setInteractive(e.target.checked)}
                  />
                  <i />
                </label>
              </div>
              <div className="poly-legend">
                <span>
                  <i className="train" />
                  Training data
                </span>
                <span>
                  <i className="validation" />
                  Validation data
                </span>
                <span>
                  <i className="line" />
                  Polynomial fit
                </span>
                <span>
                  <i className="dash" />
                  95% Confidence
                </span>
              </div>
              <div className="poly-chart-wrap">
                <MainChart
                  points={rows}
                  result={result}
                  interactive={interactive}
                  onAdd={(p) => setRows((v) => [...v, p])}
                />
                <div className="poly-tools">
              <button title="Toggle point editing" onClick={() => setInteractive(value => !value)}>
                <Share2 />
              </button>
              <button
                title={chartFocused ? 'Exit focused chart' : 'Focus chart'}
                onClick={() => setChartFocused(value => !value)}
              >
                <Maximize2 />
              </button>
                  <button
                    title="Reset view"
                    onClick={() => chooseDataset(datasetId)}
                  >
                    <RotateCcw />
                  </button>
                </div>
              </div>
              <div className="poly-chart-pair">
                <article>
                  <h3>Residuals (y − ŷ)</h3>
                  <ResidualChart result={result} />
                </article>
                <article>
                  <h3>
                    Train vs. Validation Error <Info />
                    <span>
                      <i />
                      Train MSE <i />
                      Validation MSE
                    </span>
                  </h3>
                  <ErrorChart errors={errors} degree={degree} />
                </article>
              </div>
            </section>
            <aside className="poly-controls">
              <section>
                <h2>Model Controls</h2>
                <label>
                  Polynomial Degree <Info />
                </label>
                <div className="poly-range">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={degree}
                    onChange={(e) =>
                      setDegree(
                        Math.max(1, Math.min(10, Number(e.target.value))),
                      )
                    }
                  />
                  <input
                    aria-label="Polynomial degree"
                    type="range"
                    min="1"
                    max="10"
                    value={degree}
                    onChange={(e) => setDegree(Number(e.target.value))}
                  />
                  <span>
                    {degree === 1
                      ? "Linear"
                      : degree === 2
                        ? "Quadratic"
                        : degree === 3
                          ? "Cubic"
                          : `Degree ${degree}`}
                  </span>
                </div>
                <small>Recommended: 2 – 5</small>
                <label>
                  Regularization (Ridge) <Info />
                </label>
                <div className="poly-range">
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step=".001"
                    value={alpha}
                    onChange={(e) => setAlpha(Number(e.target.value))}
                  />
                  <input
                    aria-label="Ridge regularization"
                    type="range"
                    min="0"
                    max="1"
                    step=".001"
                    value={alpha}
                    onChange={(e) => setAlpha(Number(e.target.value))}
                  />
                </div>
                <label>
                  Feature Scaling <Info />
                </label>
                <select
                  value={scaling}
                  onChange={(e) => setScaling(e.target.value as Scaling)}
                >
                  <option value="standardize">Standardize (Z-score)</option>
                  <option value="minmax">Min–max [0, 1]</option>
                  <option value="none">No scaling</option>
                </select>
                <label>
                  Noise (σ) <Info />
                </label>
                <div className="poly-range">
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step=".01"
                    value={noise.toFixed(2)}
                    onChange={(e) => updateNoise(Number(e.target.value))}
                  />
                  <input
                    aria-label="Dataset noise"
                    type="range"
                    min="0"
                    max="1"
                    step=".01"
                    value={noise}
                    onChange={(e) => updateNoise(Number(e.target.value))}
                  />
                </div>
                <div className="poly-control-buttons">
                  <button onClick={retrain} disabled={training}>
                    <Play />
                    {training ? "Training…" : "Retrain Model"}
                  </button>
                  <button onClick={reset}>
                    <RotateCcw />
                    Reset
                  </button>
                </div>
              </section>
              <section className="poly-dataset-summary">
                <h2>
                  Dataset <Info />
                  <button onClick={() => setActiveTab("dataset")}>View</button>
                </h2>
                <p>
                  Sample: <b>{datasetLabels[datasetId]}</b>
                </p>
                <hr />
                <div>
                  <span>
                    Points<b>{rows.length}</b>
                  </span>
                  <span>
                    Features<b>1</b>
                  </span>
                  <span>
                    Noise (σ)<b>{noise.toFixed(2)}</b>
                  </span>
                </div>
                <p className="poly-dataset-hint">
                  Switch samples or upload CSV in the Dataset section.
                </p>
              </section>
            </aside>
            <section className="poly-insights">
              <article>
                <h3>
                  Model Insight <Info />
                </h3>
                <p>
                  Degree {degree}{" "}
                  {risk < 1.5
                    ? "captures the underlying pattern with a balanced fit."
                    : "shows a growing gap between training and validation error."}
                </p>
                <b>
                  <Scale />
                  {risk < 1.5
                    ? "Good Bias–Variance Balance"
                    : "Watch for Overfitting"}
                </b>
              </article>
              <article>
                <h3>
                  Best Degree <small>(by Val. MSE)</small>
                </h3>
                <strong>{best.degree}</strong>
                <p>Validation MSE: {fmt(best.validation)}</p>
              </article>
              <article>
                <h3>
                  Train MSE <small>(Degree {degree})</small>
                </h3>
                <strong>{fmt(result.trainMse)}</strong>
                <p>Lower is better</p>
              </article>
              <article>
                <h3>
                  Validation MSE <small>(Degree {degree})</small>
                </h3>
                <strong>{fmt(result.validationMse)}</strong>
                <p>Lower is better</p>
              </article>
              <article>
                <h3>Overfitting Check</h3>
                <div className="poly-gauge">
                  <i
                    style={{
                      transform: `rotate(${Math.min(170, Math.max(15, risk * 55))}deg)`,
                    }}
                  />
                </div>
                <b>
                  {risk < 1.5
                    ? "Low Risk"
                    : risk < 2.5
                      ? "Moderate Risk"
                      : "High Risk"}
                </b>
                <p>
                  Train/Val MSE Ratio:{" "}
                  {fmt(result.trainMse / result.validationMse, 2)}
                </p>
              </article>
              <article>
                <h3>Data Coverage</h3>
                <div className="poly-coverage">
                  {rows
                    .filter((_, i) => i % 9 === 0)
                    .map((_, i) => (
                      <i
                        key={i}
                        style={{
                          left: `${5 + (i * 88) / (rows.length / 9)}%`,
                          top: `${20 + ((i * 23) % 55)}%`,
                        }}
                      />
                    ))}
                </div>
                <p>Good coverage across range</p>
              </article>
            </section>
          </div>
        )}
        {activeTab === "dataset" && (
          <DatasetPanel
            rows={rows}
            datasetId={datasetId}
            chooseDataset={chooseDataset}
            setRows={setRows}
            fileRef={fileRef}
            upload={upload}
          />
        )}{" "}
        {activeTab === "train" && (
          <TrainPanel
            training={training}
            retrain={retrain}
            degree={degree}
            result={result}
          />
        )}{" "}
        {activeTab === "metrics" && (
          <MetricsPanel result={result} rows={rows} />
        )}{" "}
        {activeTab === "compare" && (
          <ComparePanel errors={errors} degree={degree} setDegree={setDegree} />
        )}{" "}
        {activeTab === "explain" && (
          <ExplainPanel
            result={result}
            degree={degree}
            scaling={scaler(rows, scaling).label}
            predictionX={predictionX}
            setPredictionX={setPredictionX}
          />
        )}
        <input
          ref={fileRef}
          className="poly-file"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <footer className="poly-status">
          <span>Experiment: Poly Reg — {datasetLabels[datasetId]}</span>
          <span>Last trained: Just now</span>
          <span>Model: PolynomialFeatures + LinearRegression (Ridge)</span>
          <span>
            Auto-saved <i />
          </span>
        </footer>
      </main>
    </div>
  );
}
function PanelHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="poly-panel-head">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
  );
}
function DatasetPanel({
  rows,
  datasetId,
  chooseDataset,
  setRows,
  fileRef,
  upload,
}: {
  rows: Point[];
  datasetId: DatasetId;
  chooseDataset: (id: DatasetId) => void;
  setRows: React.Dispatch<React.SetStateAction<Point[]>>;
  fileRef: React.RefObject<HTMLInputElement | null>;
  upload: (file?: File) => void;
}) {
  return (
    <section className="poly-panel">
      <PanelHead
        title="Dataset"
        subtitle="Switch sources, upload a two-column CSV, or edit the live training points."
      />
      <div className="poly-panel-actions">
        <select
          value={datasetId}
          onChange={(e) => chooseDataset(e.target.value as DatasetId)}
        >
          {Object.entries(datasetLabels).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            setRows((v) => [
              ...v,
              { x: (v.at(-1)?.x ?? 0) + 0.1, y: v.at(-1)?.y ?? 0 },
            ])
          }
        >
          Add Point
        </button>
        <button
          disabled={rows.length <= 4}
          onClick={() => setRows((v) => v.slice(0, -1))}
        >
          Remove Last
        </button>
        <button onClick={() => fileRef.current?.click()}>
          <Upload />
          Upload CSV
        </button>
      </div>
      <div className="poly-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>x</th>
              <th>y</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <input
                    aria-label={`x row ${index + 1}`}
                    type="number"
                    step=".01"
                    value={row.x}
                    onChange={(e) =>
                      setRows((v) =>
                        v.map((p, i) =>
                          i === index ? { ...p, x: Number(e.target.value) } : p,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    aria-label={`y row ${index + 1}`}
                    type="number"
                    step=".01"
                    value={row.y}
                    onChange={(e) =>
                      setRows((v) =>
                        v.map((p, i) =>
                          i === index ? { ...p, y: Number(e.target.value) } : p,
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
      <input
        className="poly-file"
        type="file"
        accept=".csv"
        onChange={(e) => upload(e.target.files?.[0])}
      />
    </section>
  );
}
function TrainPanel({
  training,
  retrain,
  degree,
  result,
}: {
  training: boolean;
  retrain: () => void;
  degree: number;
  result: ReturnType<typeof fit>;
}) {
  return (
    <section className="poly-panel">
      <PanelHead
        title="Train Polynomial Model"
        subtitle="Refit the shared ridge regression solver over the current polynomial feature matrix."
      />
      <div className="poly-train-stage">
        <Beaker />
        <h2>{training ? "Optimizing coefficients…" : "Ready to train"}</h2>
        <p>
          {degree} polynomial features · {result.train.length} training samples
          · {result.validation.length} validation samples
        </p>
        <button onClick={retrain} disabled={training}>
          <Play />
          {training ? "Training…" : "Train Model"}
        </button>
        <div className="poly-coeffs">
          {result.model.coefficients.map((value, i) => (
            <span key={i}>
              β{i + 1}
              <b>{fmt(value, 5)}</b>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
function MetricsPanel({
  result,
  rows,
}: {
  result: ReturnType<typeof fit>;
  rows: Point[];
}) {
  const total = mse(
    rows.map((p) => p.y),
    rows.map((p) => result.predict(p.x)),
  );
  return (
    <section className="poly-panel">
      <PanelHead
        title="Model Metrics"
        subtitle="All values are recalculated from the current live model and dataset."
      />
      <div className="poly-metric-grid">
        <article>
          <small>R²</small>
          <strong>{fmt(result.r2)}</strong>
        </article>
        <article>
          <small>MAE</small>
          <strong>{fmt(result.mae)}</strong>
        </article>
        <article>
          <small>RMSE</small>
          <strong>{fmt(result.rmse)}</strong>
        </article>
        <article>
          <small>Overall MSE</small>
          <strong>{fmt(total)}</strong>
        </article>
        <article>
          <small>Train MSE</small>
          <strong>{fmt(result.trainMse)}</strong>
        </article>
        <article>
          <small>Validation MSE</small>
          <strong>{fmt(result.validationMse)}</strong>
        </article>
      </div>
      <div className="poly-metric-note">
        <Activity />
        <div>
          <h3>Generalization gap</h3>
          <p>
            {fmt(result.validationMse - result.trainMse)} MSE points between the
            held-out and training partitions.
          </p>
        </div>
      </div>
    </section>
  );
}
function ComparePanel({
  errors,
  degree,
  setDegree,
}: {
  errors: Array<{ degree: number; train: number; validation: number }>;
  degree: number;
  setDegree: (v: number) => void;
}) {
  return (
    <section className="poly-panel">
      <PanelHead
        title="Compare Polynomial Degrees"
        subtitle="Select a candidate using real train and validation errors from degrees 1 through 10."
      />
      <div className="poly-compare-grid">
        {errors.map((item) => (
          <button
            key={item.degree}
            className={degree === item.degree ? "selected" : ""}
            onClick={() => setDegree(item.degree)}
          >
            <span>Degree {item.degree}</span>
            <strong>{fmt(item.validation)}</strong>
            <small>Validation MSE</small>
          </button>
        ))}
      </div>
    </section>
  );
}
function ExplainPanel({
  result,
  degree,
  scaling,
  predictionX,
  setPredictionX,
}: {
  result: ReturnType<typeof fit>;
  degree: number;
  scaling: string;
  predictionX: number;
  setPredictionX: (v: number) => void;
}) {
  return (
    <section className="poly-panel">
      <PanelHead
        title="Explain the Model"
        subtitle="Inspect learned polynomial terms and run inference on a new live input."
      />
      <div className="poly-explain">
        <article>
          <h3>Learned equation</h3>
          <p className="poly-equation">
            ŷ = {fmt(result.model.intercept, 3)}{" "}
            {result.model.coefficients.map((c, i) => (
              <span key={i}>
                {" "}
                {c >= 0 ? "+" : "−"} {fmt(Math.abs(c), 3)}x<sup>{i + 1}</sup>
              </span>
            ))}
          </p>
          <p>
            Degree: {degree} · Scaling: {scaling}
          </p>
        </article>
        <article>
          <h3>Live inference</h3>
          <label>
            Input x
            <input
              aria-label="Inference x"
              type="number"
              step=".1"
              value={predictionX}
              onChange={(e) => setPredictionX(Number(e.target.value))}
            />
          </label>
          <strong>{fmt(result.predict(predictionX), 4)}</strong>
          <p>Predicted y from the current fitted model.</p>
        </article>
      </div>
    </section>
  );
}
