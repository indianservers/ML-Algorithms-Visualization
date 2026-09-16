import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Database,
  Expand,
  FileText,
  GitBranch,
  Grid3X3,
  Lightbulb,
  LineChart,
  Network,
  Play,
  RefreshCw,
  Sparkles,
  Star,
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
import { binaryMetrics } from "../../../../lib/math/metrics";
import { classificationSplit } from "../../../../lib/classification/classificationEval";
import {
  trainSvmClassification,
  type SvmKernel,
} from "../../../../lib/algorithms/classification/svmClassification";
import "./SVMClassificationPage.css";
import { useTheme } from "../../../../stores/uiStore";

type Point = { x: number; y: number; label: number };
type Dataset = "moons" | "linear" | "circles" | "xor" | "overlap" | "imported";
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
  moons: "Moons",
  linear: "Linear Separation",
  circles: "Concentric Circles",
  xor: "XOR Classes",
  overlap: "Overlapping blobs",
  imported: "Imported Dataset",
};
const noise = (i: number, k = 1) => Math.sin(i * 91.17 * k) * 0.5 + 0.5;

function makeData(kind: Exclude<Dataset, "imported">): Point[] {
  if (kind === "moons") return datasetDTwoMoons(90, 9);
  if (kind === "linear") return datasetAPerfectBinary();
  if (kind === "xor") return datasetCXor();
  if (kind === "overlap") return datasetBOverlappingBinary();
  return datasetECircles(90, 13);
}

const BUILT_INS = {
  moons: makeData("moons"),
  linear: makeData("linear"),
  circles: makeData("circles"),
  xor: makeData("xor"),
  overlap: makeData("overlap"),
};

export default function SVMClassificationLesson() {
  const [tab, setTab] = useState<Tab>("visualize");
  const [dataset, setDataset] = useState<Dataset>("moons");
  const [points, setPoints] = useState<Point[]>(BUILT_INS.moons);
  const [imported, setImported] = useState<Point[]>([]);
  const [kernel, setKernel] = useState<SvmKernel>("linear");
  const [cValue, setCValue] = useState(1);
  const [gamma, setGamma] = useState(1);
  const [standardize, setStandardize] = useState(true);
  const [query, setQuery] = useState({ x: 0.2, y: 0.1 });
  const [trained, setTrained] = useState("Ready");
  const [toast, setToast] = useState("");
  const { theme, toggleTheme } = useTheme();
  const lightTheme = theme === "light";
  const uploadRef = useRef<HTMLInputElement>(null);
  const split = useMemo(() => {
    try {
      return classificationSplit(
        points.map((point) => [point.x, point.y]),
        points.map((point) => point.label),
        0.2,
        42,
      );
    } catch {
      return null;
    }
  }, [points]);
  const model = useMemo(
    () =>
      trainSvmClassification(
        split?.trainX ?? points.map((point) => [point.x, point.y]),
        split?.trainY ?? points.map((point) => point.label),
        {
          C: cValue,
          kernel,
          gamma,
          standardize,
          maxPasses: 5,
          maxIterations: 600,
        },
      ),
    [points, split, cValue, kernel, gamma, standardize],
  );
  const metrics = binaryMetrics(
    split?.testY ?? points.map((point) => point.label),
    (split?.testX ?? points.map((point) => [point.x, point.y])).map((row) =>
      model.predict(row),
    ),
  );
  const support = new Set(model.supportIndices);
  const bounds = useMemo(() => {
    const xs = points.map((point) => point.x),
      ys = points.map((point) => point.y);
    return {
      x0: Math.min(...xs) - 0.25,
      x1: Math.max(...xs) + 0.25,
      y0: Math.min(...ys) - 0.25,
      y1: Math.max(...ys) + 0.25,
    };
  }, [points]);
  const grid = useMemo(
    () =>
      Array.from({ length: 40 * 24 }, (_, index) => {
        const x =
          bounds.x0 + (((index % 40) + 0.5) / 40) * (bounds.x1 - bounds.x0);
        const y =
          bounds.y0 +
          ((Math.floor(index / 40) + 0.5) / 24) * (bounds.y1 - bounds.y0);
        return { x, y, score: model.score([x, y]) };
      }),
    [bounds, model],
  );
  const px = (x: number) => ((x - bounds.x0) / (bounds.x1 - bounds.x0)) * 100;
  const py = (y: number) => ((bounds.y1 - y) / (bounds.y1 - bounds.y0)) * 100;

  const chooseDataset = (next: Dataset) => {
    const data = next === "imported" ? imported : BUILT_INS[next];
    if (!data.length) return;
    setDataset(next);
    setPoints(data.map((point) => ({ ...point })));
    setTrained("Ready");
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const rows = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter((row) => row.length >= 3 && row.every(Number.isFinite))
      .map((row) => ({
        x: row[0],
        y: row[1],
        label: Math.round(row[2]) ? 1 : 0,
      }));
    if (rows.length < 4) {
      setToast("CSV needs x, y, and class columns");
      return;
    }
    setImported(rows);
    setDataset("imported");
    setPoints(rows);
    setToast(`Imported ${rows.length} samples`);
    event.target.value = "";
  };
  const reset = () => {
    setTab("visualize");
    setDataset("moons");
    setPoints(BUILT_INS.moons.map((point) => ({ ...point })));
    setKernel("linear");
    setCValue(1);
    setGamma(1);
    setStandardize(true);
    setQuery({ x: 0.2, y: 0.1 });
    setTrained("Ready");
    setToast("");
  };

  const plot = (
    <section className="svmc-plot">
      <header>
        <h2>Maximum-Margin Separating Hyperplane</h2>
        <span>
          <button
            aria-label="Reset plot"
            onClick={() => setQuery({ x: 0.2, y: 0.1 })}
          >
            <RefreshCw />
          </button>
          <button
            aria-label="Fullscreen plot"
            onClick={() => document.documentElement.requestFullscreen?.()}
          >
            <Expand />
          </button>
        </span>
      </header>
      <div className="svmc-legend">
        <span>
          <i />
          Decision Boundary (wᵀx + b = 0)
        </span>
        <span>
          <i />
          Margin Bounds (± 1 / ||w||)
        </span>
        <span>
          <i />
          Support Vectors
        </span>
      </div>
      <div className="svmc-chart">
        {grid.map((item, index) => (
          <i
            key={index}
            style={{
              left: `${px(item.x)}%`,
              top: `${py(item.y)}%`,
              background: item.score >= 0 ? "#09c8d70d" : "#ff624c0c",
            }}
          />
        ))}
        {points.map((point, index) => (
          <button
            aria-label={`Sample ${index + 1}`}
            key={index}
            className={`${point.label ? "one" : "zero"} ${support.has(index) ? "support" : ""}`}
            style={{ left: `${px(point.x)}%`, top: `${py(point.y)}%` }}
            onClick={() => setQuery({ x: point.x, y: point.y })}
          />
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {kernel === "linear" &&
            model.weights &&
            model.weights[1] !== 0 &&
            [-1, 0, 1].map((level) => {
              const ya =
                -(model.weights![0] * bounds.x0 + model.bias - level) /
                model.weights![1];
              const yb =
                -(model.weights![0] * bounds.x1 + model.bias - level) /
                model.weights![1];
              return (
                <line
                  key={level}
                  x1="0"
                  y1={py(ya)}
                  x2="100"
                  y2={py(yb)}
                  className={level === 0 ? "boundary" : "margin"}
                />
              );
            })}
        </svg>
        <b>x₂</b>
        <em>x₁</em>
      </div>
    </section>
  );

  const overview = (
    <div className="svmc-bottom">
      <article>
        <h3>🗂 Dataset Overview</h3>
        <b>
          {LABELS[dataset]} <small>• Sample</small>
        </b>
        <p>
          {dataset === "moons"
            ? "Two interleaving half circles. A classic non-linear classification problem."
            : "A live two-class dataset for margin learning."}
        </p>
        <dl>
          <div>
            <dt>Samples</dt>
            <dd>{points.length}</dd>
          </div>
          <div>
            <dt>Features</dt>
            <dd>2</dd>
          </div>
          <div>
            <dt>Classes</dt>
            <dd>2</dd>
          </div>
        </dl>
        <button onClick={() => setTab("dataset")}>
          Change Dataset <ChevronDown />
        </button>
      </article>
      <article>
        <h3>Decision Function</h3>
        <p className="svmc-formula">f(x) = wᵀx + b</p>
        <i className="svmc-scale" />
        <div className="svmc-scale-label">
          <span>
            -2
            <br />
            <b>&lt; 0</b>
          </span>
          <span>-1</span>
          <span>
            0<br />
            <b>0</b>
          </span>
          <span>1</span>
          <span>
            2<br />
            <b>&gt; 0</b>
          </span>
        </div>
        <footer>
          <b>Class 0</b>
          <b>Class 1</b>
        </footer>
      </article>
      <article>
        <h3>
          <Lightbulb /> Key Insight
        </h3>
        <p>
          SVM finds the hyperplane that maximizes the margin between classes.
          Only the support vectors (circled points) define the decision
          boundary. The larger the margin, the better the generalization.
        </p>
      </article>
    </div>
  );

  const content = () => {
    if (tab === "visualize")
      return (
        <>
          {plot}
          {overview}
          <footer className="svmc-hint">
            <Lightbulb />
            <b>Try it:</b> Adjust C to see how regularization affects the margin
            and misclassifications. Then switch kernels to handle non-linear
            boundaries.
          </footer>
        </>
      );
    if (tab === "learn")
      return (
        <section className="svmc-generic">
          <h2>How Support Vector Machines Learn</h2>
          <p>
            SVM selects the maximum-margin decision boundary. Samples on or
            inside the margin become support vectors; C controls violations
            while kernels create nonlinear boundaries through similarity
            functions.
          </p>
          {plot}
        </section>
      );
    if (tab === "dataset")
      return (
        <section className="svmc-generic svmc-data">
          <h2>Live Dataset</h2>
          <p>
            Edit samples directly; the SMO optimizer, support set, boundary, and
            metrics refit immediately.
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
                {points.map((point, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        aria-label={`X row ${index + 1}`}
                        type="number"
                        step=".1"
                        value={Number(point.x.toFixed(3))}
                        onChange={(event) =>
                          setPoints((old) =>
                            old.map((value, i) =>
                              i === index
                                ? { ...value, x: Number(event.target.value) }
                                : value,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Y row ${index + 1}`}
                        type="number"
                        step=".1"
                        value={Number(point.y.toFixed(3))}
                        onChange={(event) =>
                          setPoints((old) =>
                            old.map((value, i) =>
                              i === index
                                ? { ...value, y: Number(event.target.value) }
                                : value,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <select
                        aria-label={`Class row ${index + 1}`}
                        value={point.label}
                        onChange={(event) =>
                          setPoints((old) =>
                            old.map((value, i) =>
                              i === index
                                ? {
                                    ...value,
                                    label: Number(event.target.value),
                                  }
                                : value,
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
                        aria-label={`Remove row ${index + 1}`}
                        disabled={points.length <= 4}
                        onClick={() =>
                          setPoints((old) => old.filter((_, i) => i !== index))
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
        <section className="svmc-generic svmc-center">
          <Network />
          <h2>Optimize the maximum margin</h2>
          <p>
            The genuine SMO solver optimizes dual coefficients against the
            selected kernel and current data.
          </p>
          <div>
            <b>{model.supportIndices.length}</b> support vectors ·{" "}
            <b>{(metrics.accuracy * 100).toFixed(1)}%</b> test accuracy
            <small>
              {" "}
              · decision scores are not probabilities unless calibrated
            </small>
          </div>
          <button
            onClick={() => {
              setTrained(
                `Trained ${kernel.toUpperCase()} SVM with ${model.supportIndices.length} support vectors`,
              );
              setToast("SVM retrained");
            }}
          >
            <Play /> Retrain Model
          </button>
          <small>{trained}</small>
        </section>
      );
    if (tab === "metrics")
      return (
        <section className="svmc-generic">
          <h2>Classification Metrics</h2>
          <div className="svmc-metrics">
            {[
              ["Test accuracy", metrics.accuracy],
              ["Balanced accuracy", metrics.balancedAccuracy],
              ["Precision", metrics.precision],
              ["Recall", metrics.recall],
              ["F1", metrics.f1],
            ].map(([name, value]) => (
              <article key={name as string}>
                <b>{((value as number) * 100).toFixed(1)}%</b>
                <span>{name}</span>
              </article>
            ))}
          </div>
          {overview}
        </section>
      );
    if (tab === "compare")
      return (
        <section className="svmc-generic">
          <h2>Compare Kernels</h2>
          <div className="svmc-compare">
            {(["linear", "rbf", "polynomial", "sigmoid"] as SvmKernel[]).map(
              (value) => (
                <article
                  className={kernel === value ? "active" : ""}
                  key={value}
                  onClick={() => setKernel(value)}
                >
                  <GitBranch />
                  <h3>{value}</h3>
                  <p>
                    {value === "linear"
                      ? "Straight maximum-margin separator."
                      : "Nonlinear similarity boundary."}
                  </p>
                  <button>Use kernel</button>
                </article>
              ),
            )}
          </div>
        </section>
      );
    return (
      <section className="svmc-generic svmc-explain">
        <h2>Live SVM Inference</h2>
        <div className="svmc-query">
          <label>
            x₁
            <input
              aria-label="Query x1"
              type="number"
              step=".1"
              value={query.x}
              onChange={(event) =>
                setQuery((old) => ({ ...old, x: Number(event.target.value) }))
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
              onChange={(event) =>
                setQuery((old) => ({ ...old, y: Number(event.target.value) }))
              }
            />
          </label>
        </div>
        <div className="svmc-result">
          Prediction <b>Class {model.predict([query.x, query.y])}</b>
          <span>
            Decision score {model.score([query.x, query.y]).toFixed(3)}
          </span>
        </div>
        {plot}
      </section>
    );
  };

  return (
    <div className={`svmc-page ${lightTheme ? "light" : ""}`}>
      <aside className="svmc-nav">
        <Link className="svmc-brand" to="/">
          <i>M</i>
          <span>
            <b>Mega ML</b>
            <small>AI OBSERVATORY</small>
          </span>
        </Link>
        <Link className="svmc-back" to="/ml">
          <ChevronLeft /> Back to Curriculum
        </Link>
        <h3>SUPERVISED LEARNING</h3>
        {[
          ["Overview", BookOpen],
          ["Linear Regression", LineChart],
          ["Logistic Regression", BarChart3],
          ["Decision Tree", GitBranch],
          ["Random Forest", Grid3X3],
          ["SVM Classification", Sparkles],
          ["K-Nearest Neighbors", Network],
          ["Naive Bayes", Database],
        ].map(([name, Icon]) => (
          <button
            className={name === "SVM Classification" ? "active" : ""}
            key={name as string}
          >
            <Icon />
            {name as string}
          </button>
        ))}
        <h3>UNSUPERVISED LEARNING</h3>
        {["K-Means Clustering", "PCA", "DBSCAN"].map((name) => (
          <button key={name}>
            <Network />
            {name}
          </button>
        ))}
        <h3>RESOURCES</h3>
        {["Cheat Sheets", "Code Examples", "Research Papers"].map((name) => (
          <button key={name}>
            <FileText />
            {name}
          </button>
        ))}
        <div className="svmc-theme">
          {lightTheme ? "Light" : "Dark"}{" "}
          <button
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {lightTheme ? "◐" : "☼"}
          </button>
        </div>
        <Link className="svmc-user" to="/">
          <UserCircle />
          <b>Mega ML User</b>
          <ChevronDown />
        </Link>
      </aside>
      <main>
        <header className="svmc-header">
          <div>
            <span>Supervised Learning 〉 Classification</span>
            <h1>
              SVM Classification <Star />
            </h1>
            <p>
              <b>Objective:</b> Learn how Support Vector Machines find the
              maximum-margin hyperplane
              <br />
              that best separates classes.
            </p>
          </div>
          <aside>
            <span>Lesson Progress</span>
            <i>
              <b />
            </i>
            <em>68%</em>
            <button onClick={() => setToast("Lesson marked complete")}>
              <CheckCircle2 /> Mark Complete
            </button>
          </aside>
        </header>
        <div className="svmc-bar">
          <nav>
            {TABS.map(([id, name]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                {name}
              </button>
            ))}
          </nav>
          <label>
            Dataset:{" "}
            <select
              aria-label="Dataset"
              value={dataset}
              onChange={(event) => chooseDataset(event.target.value as Dataset)}
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
        </div>
        <div className="svmc-work">
          <div className="svmc-main">{content()}</div>
          <aside className="svmc-controls">
            <h2>Model Controls</h2>
            <h3>
              Kernel <CircleHelp />
            </h3>
            <div className="svmc-kernels">
              {(["linear", "rbf", "polynomial", "sigmoid"] as SvmKernel[]).map(
                (value) => (
                  <button
                    className={kernel === value ? "active" : ""}
                    key={value}
                    onClick={() => setKernel(value)}
                  >
                    <GitBranch />
                    <span>{value}</span>
                  </button>
                ),
              )}
            </div>
            <h3>Hyperparameters</h3>
            <label>
              C (Regularization) <CircleHelp />
              <input
                aria-label="C numeric"
                type="number"
                min=".001"
                max="1000"
                step=".1"
                value={Number(cValue.toFixed(3))}
                onChange={(event) =>
                  setCValue(Math.max(0.001, Number(event.target.value)))
                }
              />
            </label>
            <input
              aria-label="C slider"
              type="range"
              min="-3"
              max="3"
              step=".1"
              value={Math.log10(cValue)}
              onChange={(event) => setCValue(10 ** Number(event.target.value))}
            />
            <div>
              <span>1e-3</span>
              <span>1e-2</span>
              <span>1e-1</span>
              <span>1</span>
              <span>10</span>
              <span>100</span>
              <span>1e3</span>
            </div>
            <label>
              Gamma (RBF/Poly/Sigmoid) <CircleHelp />
              <input
                aria-label="Gamma numeric"
                type="number"
                min=".001"
                max="1000"
                step=".1"
                value={Number(gamma.toFixed(3))}
                onChange={(event) =>
                  setGamma(Math.max(0.001, Number(event.target.value)))
                }
              />
            </label>
            <input
              aria-label="Gamma slider"
              type="range"
              min="-3"
              max="3"
              step=".1"
              value={Math.log10(gamma)}
              onChange={(event) => setGamma(10 ** Number(event.target.value))}
            />
            <div>
              <span>1e-3</span>
              <span>1e-2</span>
              <span>1e-1</span>
              <span>1</span>
              <span>10</span>
              <span>100</span>
              <span>1e3</span>
            </div>
            <label>
              Standardize Features{" "}
              <button
                className={standardize ? "on" : ""}
                onClick={() => setStandardize((value) => !value)}
              >
                <i />
              </button>
            </label>
            <button
              className="svmc-train"
              onClick={() => {
                setTrained("Model retrained");
                setToast("SVM retrained");
              }}
            >
              <Play /> Retrain Model
            </button>
            <hr />
            <h3>Model Info</h3>
            <dl>
              <div>
                <dt>Support Vectors</dt>
                <dd>{model.supportIndices.length}</dd>
              </div>
              <div>
                <dt>Margin Width (2/||w||)</dt>
                <dd>{model.marginWidth.toFixed(3)}</dd>
              </div>
              <div>
                <dt>||w||</dt>
                <dd>
                  {model.marginWidth ? (2 / model.marginWidth).toFixed(3) : "0"}
                </dd>
              </div>
              <div>
                <dt>Bias (b)</dt>
                <dd>{model.bias.toFixed(3)}</dd>
              </div>
            </dl>
            <section>
              <h3>🏳 Margin Interpretation</h3>
              <i />
              <i />
              <p>
                Wider margin
                <br />→ higher confidence
                <br />→ better generalization
              </p>
            </section>
            <button className="svmc-reset" onClick={reset}>
              <RefreshCw /> Reset
            </button>
          </aside>
        </div>
      </main>
      {toast && (
        <div className="svmc-toast" onClick={() => setToast("")}>
          {toast}
        </div>
      )}
    </div>
  );
}
