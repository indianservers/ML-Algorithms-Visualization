import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { svmContours } from "./svmContours";
import { LabProgressMeter } from "../../../../components/common/LabChrome";
import { LabLessonPanel, useUrlTab } from "../../../../components/common/LabTabs";
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
  ["train", "Train and Test"],
  ["metrics", "Metrics"],
  ["compare", "Compare"],

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
  const [tab, setTab] = useUrlTab<Tab>("visualize");
  const [selected, setSelected] = useState<number | null>(null);
  const [degree, setDegree] = useState(3);
  const [coef0, setCoef0] = useState(1);
  const [revision, setRevision] = useState(0);
  const dragRef = useRef<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const dragBounds = useRef<{ x0: number; x1: number; y0: number; y1: number } | null>(null);
  useEffect(() => { if (tab === 'explain') setTab('train'); }, [tab, setTab]);
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
          degree,
          coef0,
          standardize,
          maxPasses: 5,
          maxIterations: 600,
        },
      ),
    [points, split, cValue, kernel, gamma, degree, coef0, standardize, revision],
  );
  const metrics = binaryMetrics(
    split?.testY ?? points.map((point) => point.label),
    (split?.testX ?? points.map((point) => [point.x, point.y])).map((row) =>
      model.predict(row),
    ),
  );
  const trainingRows = split?.trainX ?? points.map(point => [point.x, point.y]);
  const support = new Set(points.flatMap((point, index) => model.supportIndices.some(i => trainingRows[i]?.[0] === point.x && trainingRows[i]?.[1] === point.y) ? [index] : []));
  const signedScore = model.score([query.x, query.y]);
  const selectedPoint = selected === null ? null : points[selected];
  const comparison = useMemo(() => tab !== 'compare' ? [] : (['linear', 'rbf', 'polynomial', 'sigmoid'] as SvmKernel[]).map(value => {
    const start = performance.now();
    const trainedModel = trainSvmClassification(split?.trainX ?? points.map(point => [point.x, point.y]), split?.trainY ?? points.map(point => point.label), { C: cValue, kernel: value, gamma, degree, coef0, standardize, maxPasses: 5, maxIterations: 600 });
    const milliseconds = performance.now() - start;
    const test = split?.testX ?? [];
    const accuracy = test.length ? test.filter((row, i) => trainedModel.predict(row) === split!.testY[i]).length / test.length : null;
    return { kernel: value, accuracy, support: trainedModel.supportIndices.length, milliseconds };
  }), [tab, split, points, cValue, gamma, degree, coef0, standardize]);
  const bounds = useMemo(() => {
    if (dragBounds.current) return dragBounds.current;
    const xs = points.map((point) => point.x),
      ys = points.map((point) => point.y);
    return {
      x0: Math.min(...xs) - 0.25,
      x1: Math.max(...xs) + 0.25,
      y0: Math.min(...ys) - 0.25,
      y1: Math.max(...ys) + 0.25,
    };
  }, [points, revision]);
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
    setSelected(null);
    setDataset(next);
    setPoints(data.map((point) => ({ ...point })));
    setRevision(value => value + 1); setTrained("Ready");
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
    setSelected(null);
    setDegree(3); setCoef0(1);
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
        <h2>{kernel === 'linear' ? 'Linear separating boundary' : `${kernel.toUpperCase()} nonlinear boundary`}</h2>
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
          Decision boundary (score = 0)
        </span>
        <span>
          <i />
          {kernel === 'linear' ? 'Margin score contours (±1)' : 'Score contours (±1, not geometric distances)'}
        </span>
        <span>
          <i />
          Support Vectors
        </span>
      </div>
      <div className="svmc-chart" ref={plotRef}
        onPointerMove={event => {
          if (dragRef.current === null || !dragBounds.current || !plotRef.current) return;
          const rect = plotRef.current.getBoundingClientRect(), b = dragBounds.current;
          const x = b.x0 + Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * (b.x1 - b.x0);
          const y = b.y1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) * (b.y1 - b.y0);
          const index = dragRef.current;
          setPoints(current => current.map((point, i) => i === index ? { ...point, x, y } : point)); setQuery({ x, y });
        }} onPointerUp={() => { dragRef.current = null; dragBounds.current = null; setRevision(value => value + 1); }} onPointerCancel={() => { dragRef.current = null; dragBounds.current = null; setRevision(value => value + 1); }}
        onLostPointerCapture={() => { dragRef.current = null; dragBounds.current = null; }}>
        {grid.map((item, index) => (
          <i
            key={index}
            style={{
              left: `${px(item.x)}%`,
              top: `${py(item.y)}%`,
              background: item.score >= 0 ? "#d55e0028" : "#0072b228",
            }}
          />
        ))}
        {points.map((point, index) => (
          <button
            aria-label={`Sample ${index + 1}, actual class ${point.label}, predicted class ${model.predict([point.x, point.y])}${support.has(index) ? ", support vector" : ""}`}
            key={index}
            className={`${point.label ? "one" : "zero"} ${support.has(index) ? "support" : ""} ${selected === index ? "selected" : ""} ${((point.label ? 1 : -1) * model.score([point.x, point.y])) < 0 ? "misclassified" : ((point.label ? 1 : -1) * model.score([point.x, point.y])) < 1 ? "violation" : ""}`}
            data-x={point.x}
            data-y={point.y}
            style={{ left: `${px(point.x)}%`, top: `${py(point.y)}%` }}
            onClick={() => { setSelected(index); setQuery({ x: point.x, y: point.y }); }}
            onPointerDown={event => { event.preventDefault(); setSelected(index); setQuery({ x: point.x, y: point.y }); dragRef.current = index; dragBounds.current = bounds; plotRef.current?.setPointerCapture(event.pointerId); }}
            onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return; event.preventDefault(); const dx = (bounds.x1 - bounds.x0) / 100, dy = (bounds.y1 - bounds.y0) / 100; const x = point.x + (event.key === 'ArrowRight' ? dx : event.key === 'ArrowLeft' ? -dx : 0), y = point.y + (event.key === 'ArrowUp' ? dy : event.key === 'ArrowDown' ? -dy : 0); setPoints(current => current.map((entry, i) => i === index ? { ...entry, x, y } : entry)); setSelected(index); setQuery({ x, y }); }}

          />
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {[-1, 0, 1].map(level => <path key={level} d={svmContours(model.score, bounds, level)} className={level === 0 ? 'boundary' : 'margin'} vectorEffect="non-scaling-stroke" />)}

        </svg>
        <b>Feature 2 (original units)</b>
        <em>Feature 1 (original units)</em>
        {[0, .5, 1].map(t => <span className="svm-axis-tick" key={t} style={{ left: `${t * 100}%`, bottom: -18 }}>{(bounds.x0 + t * (bounds.x1 - bounds.x0)).toFixed(1)}</span>)}
        {[0, .5, 1].map(t => <span className="svm-axis-tick" key={`y${t}`} style={{ left: -14, top: `${t * 100}%` }}>{(bounds.y1 - t * (bounds.y1 - bounds.y0)).toFixed(1)}</span>)}
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
        <p className="svmc-formula">{kernel === "linear" ? "f(x) = wᵀz + b" : "f(x) = Σ αᵢyᵢ K(zᵢ, z) + b"}</p><p>{standardize ? "z is standardized using training-set means and scales. Plot axes remain in original units." : "z uses the original feature values."}</p>
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
          boundary. A wider margin alone does not guarantee better test performance. C, kernel choice, scaling and the data all matter.
        </p>
      </article>
    </div>
  );


  const inferencePanel = (
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
          Prediction <b style={{ color: model.predict([query.x, query.y]) ? '#d55e00' : '#0072b2' }}>Class {model.predict([query.x, query.y])}</b>
          <span>
            Decision score {model.score([query.x, query.y]).toFixed(3)}
          </span>
        </div>
      </section>
    );
  const content = () => {
    if (tab === "visualize")
      return (
        <>
          <section className="svm-selection" aria-live="polite">
            <h3>{selectedPoint ? `Sample ${selected! + 1} · Actual Class ${selectedPoint.label}` : 'Custom query'} → Predicted Class {model.predict([query.x, query.y])}</h3>
            <p>{selectedPoint ? selectedPoint.label === model.predict([query.x, query.y]) ? 'Correct classification' : 'Misclassified' : 'Enter a query in Train and Test.'} · Score {signedScore.toFixed(3)}</p>
            <p>Negative → Class 0. Positive → Class 1. Near zero → near the boundary. Scores are not calibrated probabilities.</p>
            {selectedPoint && <p>{support.has(selected!) ? 'Support vector: a nonzero dual coefficient makes this sample influence the boundary.' : 'Not a support vector, or this sample is in the held-out test set.'} {(selectedPoint.label ? 1 : -1) * signedScore < 0 ? 'Wrong side of the boundary.' : (selectedPoint.label ? 1 : -1) * signedScore < 1 ? 'Correct side, but inside the margin score contour.' : 'Outside the margin score contour.'}</p>}
          </section>
          {plot}
          <p className="svm-plot-help">Blue dots = Class 0 · Orange dots = Class 1 · Subtle ring = support vector. Select a point to inspect errors and margin violations. Tap or drag a point; arrow keys also move it.</p>
          <section className="svm-experiments"><h3>Three guided experiments</h3><button onClick={() => { chooseDataset('linear'); setKernel('linear'); }}>1. Separate linear classes</button><button onClick={() => { chooseDataset('moons'); setKernel('rbf'); }}>2. Fit Moons with RBF</button><p>3. Select a point near the boundary and drag it across. Inspect its score, support status, and the updated boundary.</p></section>
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
          <LabLessonPanel tab="Learn" route="/ml/supervised/svm-classification" />
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
        <><section className="svmc-generic svmc-center">
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
              setRevision(value => value + 1);
              setTrained(
                `Trained ${kernel.toUpperCase()} SVM with ${model.supportIndices.length} support vectors`,
              );
              setToast("SVM retrained");
            }}
          >
            <Play /> Retrain Model
          </button>
          <small role="status">{trained}</small>
        </section>{inferencePanel}{plot}</>
      );
    if (tab === "metrics")
      return (
        <section className="svmc-generic">
<h2>Classification Metrics</h2><p>{split ? 'Untouched test samples only. Precision, recall and F1 treat Class 1 as the positive class.' : 'No valid holdout split: metrics below describe the training samples.'}</p><h3>Confusion matrix</h3><table><thead><tr><th>Actual ↓ / Predicted →</th><th>Class 0</th><th>Class 1</th></tr></thead><tbody>{[0, 1].map(actual => <tr key={actual}><th>Class {actual}</th>{[0, 1].map(predicted => <td key={predicted}><button onClick={() => setToast(`Actual Class ${actual}, predicted Class ${predicted}: ${actual === predicted ? 'correct' : 'incorrect'} classifications`)}>{(split?.testY ?? points.map(point => point.label)).filter((label, index) => label === actual && model.predict((split?.testX ?? points.map(point => [point.x, point.y]))[index]) === predicted).length}</button></td>)}</tr>)}</tbody></table>
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
<h2>Compare Kernels</h2><p>Same 80/20 split, seed, C and preprocessing for every kernel. Timing is approximate and depends on this device.</p><table><thead><tr><th>Kernel</th><th>Test accuracy</th><th>Support vectors</th><th>Training time</th></tr></thead><tbody>{comparison.map(row => <tr key={row.kernel}><td>{row.kernel}</td><td>{row.accuracy === null ? 'Unavailable' : (row.accuracy * 100).toFixed(1) + '%'}</td><td>{row.support}</td><td>{row.milliseconds.toFixed(1)} ms</td></tr>)}</tbody></table>
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
    return null;
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
            <LabProgressMeter />
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
            <h3>Hyperparameters</h3><p>Settings retrain automatically. Retrain explicitly recomputes with the current settings. Higher C penalizes violations more; lower C allows more violations.</p>
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
                disabled={kernel === "linear"} aria-label="Gamma numeric"
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
              disabled={kernel === "linear"} aria-label="Gamma slider"
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
            <p>Gamma controls locality: larger values make similarity more local. Gamma has no effect for a linear kernel.</p>
            {kernel === 'polynomial' && <label>Polynomial degree<input aria-label="Polynomial degree" type="number" min="1" max="6" value={degree} onChange={event => setDegree(Math.max(1, Math.min(6, Number(event.target.value))))} /></label>}
            {(kernel === 'polynomial' || kernel === 'sigmoid') && <label>Kernel offset<input aria-label="Kernel offset" type="number" min="0" max="10" step=".1" value={coef0} onChange={event => setCoef0(Math.max(0, Math.min(10, Number(event.target.value))))} /></label>}
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
                setRevision(value => value + 1);
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
                <dt>{kernel === "linear" ? "Margin width in model coordinates" : "Feature-space margin width"}</dt>
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
                Compare held-out accuracy when changing margin settings.
                A wider margin is not a guarantee of confidence or generalization.
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
