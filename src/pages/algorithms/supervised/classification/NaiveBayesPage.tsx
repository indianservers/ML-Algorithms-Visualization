import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  FileText,
  FlaskConical,
  Home,
  Menu,
  Moon,
  Network,
  Play,
  Plus,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Upload,
} from "lucide-react";
import { irisDataset } from "../../../../data/sampleDatasets";
import { trainGaussianNB } from "../../../../lib/algorithms/classification/naiveBayes";
import "./NaiveBayesPage.css";

type Row = { features: number[]; label: number };
type DatasetId = "iris" | "wine" | "clusters" | "diagnostic" | "imported";
type TabId =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
const COLORS = ["#24c7a1", "#f5ae28", "#ff5f59"];
const FILLS = ["#12463f", "#59451f", "#5b292e"];
const CLASSES = ["A (setosa)", "B (versicolor)", "C (virginica)"];
const FEATURES = ["Sepal Length", "Sepal Width", "Petal Length", "Petal Width"];
const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "learn", label: "Learn", icon: <BookOpen /> },
  { id: "visualize", label: "Visualize", icon: <Sparkles /> },
  { id: "dataset", label: "Dataset", icon: <Database /> },
  { id: "train", label: "Train", icon: <Play /> },
  { id: "metrics", label: "Metrics", icon: <BarChart3 /> },
  { id: "compare", label: "Compare", icon: <Network /> },
  { id: "explain", label: "Explain", icon: <FileText /> },
];
const gaussian = (x: number, mean: number, variance: number) =>
  Math.exp(-((x - mean) ** 2) / (2 * variance)) /
  Math.sqrt(2 * Math.PI * variance);
const irisRows = (): Row[] => {
  const seedRows = (irisDataset.data as Record<string, unknown>[]).map(
    (item) => ({
      features: [
        "sepal_length",
        "sepal_width",
        "petal_length",
        "petal_width",
      ].map((key) => Number(item[key])),
      label:
        item.species === "setosa" ? 0 : item.species === "versicolor" ? 1 : 2,
    }),
  );
  return [0, 1, 2].flatMap((label) => {
    const group = seedRows.filter((row) => row.label === label);
    return Array.from({ length: 50 }, (_, index) => ({
      features: group[index % group.length].features.map(
        (value, feature) =>
          value + Math.sin((index + 1) * (feature + 2) * 1.73) * 0.035,
      ),
      label,
    }));
  });
};
const transformRows = (source: Row[], kind: DatasetId): Row[] =>
  source.map((row, index) => {
    if (kind === "wine")
      return {
        features: [
          row.features[0] * 2.1 + 1.2,
          row.features[1] * 0.65,
          row.features[2] * 0.42,
          row.features[3] * 34 + 12,
        ],
        label: row.label,
      };
    if (kind === "diagnostic")
      return {
        features: [
          row.features[0] * 15 + 30,
          row.features[1] * 8 + 4,
          row.features[2] * 60 + 80,
          row.features[3] * 20 + 5,
        ],
        label: row.label,
      };
    if (kind === "clusters") {
      const shift = row.label * 1.4;
      return {
        features: [
          row.features[0] + shift + Math.sin(index) * 0.2,
          row.features[1] - shift * 0.3,
          row.features[2] + shift,
          row.features[3] + shift * 0.25,
        ],
        label: row.label,
      };
    }
    return { features: [...row.features], label: row.label };
  });
const BASE = irisRows();
const BUILT_INS: Record<Exclude<DatasetId, "imported">, Row[]> = {
  iris: BASE,
  wine: transformRows(BASE, "wine"),
  clusters: transformRows(BASE, "clusters"),
  diagnostic: transformRows(BASE, "diagnostic"),
};
const LABELS: Record<DatasetId, string> = {
  iris: "Fisher's Iris (150 samples)",
  wine: "Wine Chemistry (150 samples)",
  clusters: "Gaussian Clusters (150 samples)",
  diagnostic: "Diagnostic Measures (150 samples)",
  imported: "Imported CSV",
};

function Bell({
  color,
  value,
  mean,
}: {
  color: string;
  value: number;
  mean: number;
}) {
  const offset = Math.max(15, Math.min(85, 50 + (value - mean) * 17));
  return (
    <svg viewBox="0 0 126 38" aria-hidden="true">
      <path
        d="M4 34 C28 34 34 5 63 5 C92 5 98 34 122 34"
        fill={`${color}25`}
        stroke={color}
        strokeWidth="1.4"
      />
      <line
        x1={offset}
        x2={offset}
        y1="4"
        y2="36"
        stroke={color}
        strokeDasharray="3 2"
      />
      <circle cx={offset} cy="26" r="2" fill={color} />
    </svg>
  );
}

export default function NaiveBayesPage() {
  const [tab, setTab] = useState<TabId>("visualize");
  const [datasetId, setDatasetId] = useState<DatasetId>("iris");
  const [rows, setRows] = useState<Row[]>(
    BASE.map((row) => ({ features: [...row.features], label: row.label })),
  );
  const [imported, setImported] = useState<Row[]>([]);
  const [query, setQuery] = useState([5.8, 2.7, 4.2, 1.3]);
  const [active, setActive] = useState([true, true, true, false]);
  const [priorMode, setPriorMode] = useState<"empirical" | "uniform">(
    "empirical",
  );
  const [smoothing, setSmoothing] = useState(1);
  const [axes, setAxes] = useState<[number, number]>([2, 3]);
  const [showRegions, setShowRegions] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [trained, setTrained] = useState("Gaussian Naive Bayes");
  const [toast, setToast] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const X = useMemo(() => rows.map((row) => row.features), [rows]);
  const y = useMemo(() => rows.map((row) => row.label), [rows]);
  const model = useMemo(() => trainGaussianNB(X, y), [X, y]);
  const evidence = useMemo(
    () =>
      model.classes.map((label) => {
        const prior =
          priorMode === "uniform"
            ? 1 / model.classes.length
            : model.priors[label];
        const likelihoods = query.map((value, feature) =>
          active[feature]
            ? gaussian(
                value,
                model.means[label][feature],
                model.variances[label][feature] + smoothing * 1e-4,
              )
            : 1,
        );
        const logJoint =
          Math.log(prior) +
          likelihoods.reduce((sum, value) => sum + Math.log(value + 1e-300), 0);
        return {
          label,
          prior,
          likelihoods,
          logJoint,
          joint: Math.exp(logJoint),
        };
      }),
    [active, model, priorMode, query, smoothing],
  );
  const posteriors = useMemo(() => {
    const max = Math.max(...evidence.map((item) => item.logJoint));
    const values = evidence.map((item) => Math.exp(item.logJoint - max));
    const total = values.reduce((a, b) => a + b, 0);
    return values.map((value) => value / total);
  }, [evidence]);
  const predicted = posteriors.indexOf(Math.max(...posteriors));
  const predictions = useMemo(
    () => X.map((item) => model.predict(item)),
    [X, model],
  );
  const accuracy =
    predictions.filter((value, index) => value === y[index]).length / y.length;
  const boundary = useMemo(() => {
    const xs = X.map((row) => row[axes[0]]),
      ys = X.map((row) => row[axes[1]]);
    const x0 = Math.min(...xs) - 0.3,
      x1 = Math.max(...xs) + 0.3,
      y0 = Math.min(...ys) - 0.2,
      y1 = Math.max(...ys) + 0.2,
      cols = 24,
      lines = 14;
    const cells = [] as { x: number; y: number; label: number }[];
    for (let j = 0; j < lines; j++)
      for (let i = 0; i < cols; i++) {
        const sample = query.slice();
        sample[axes[0]] = x0 + ((i + 0.5) / cols) * (x1 - x0);
        sample[axes[1]] = y0 + ((j + 0.5) / lines) * (y1 - y0);
        cells.push({ x: i, y: j, label: model.predict(sample) });
      }
    return {
      x0,
      x1,
      y0,
      y1,
      cols,
      lines,
      cells,
      points: rows.map((row) => ({
        x: ((row.features[axes[0]] - x0) / (x1 - x0)) * 100,
        y: 100 - ((row.features[axes[1]] - y0) / (y1 - y0)) * 100,
        label: row.label,
      })),
    };
  }, [X, axes, model, query, rows]);
  const selectDataset = (next: DatasetId) => {
    const source = next === "imported" ? imported : BUILT_INS[next];
    if (!source.length) return;
    setDatasetId(next);
    setRows(
      source.map((row) => ({ features: [...row.features], label: row.label })),
    );
    setQuery(source[Math.floor(source.length / 2)].features.slice());
    setTrained("Gaussian Naive Bayes");
  };
  const reset = () => {
    setDatasetId("iris");
    setRows(
      BASE.map((row) => ({ features: [...row.features], label: row.label })),
    );
    setQuery([5.8, 2.7, 4.2, 1.3]);
    setActive([true, true, true, false]);
    setPriorMode("empirical");
    setSmoothing(1);
    setAxes([2, 3]);
    setShowRegions(true);
    setShowPoints(true);
    setTrained("Gaussian Naive Bayes");
    setToast("");
    setTab("visualize");
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const parsed = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter((cols) => cols.length >= 5 && cols.every(Number.isFinite))
      .map((cols) => ({
        features: cols.slice(0, 4),
        label: Math.max(0, Math.min(2, Math.round(cols[4]))),
      }));
    if (parsed.length < 3) {
      setToast("CSV needs four numeric features and class");
      return;
    }
    setImported(parsed);
    setDatasetId("imported");
    setRows(parsed);
    setQuery(parsed[0].features.slice());
    setToast(`Imported ${parsed.length} samples`);
    event.target.value = "";
  };
  const changeAxis = (slot: 0 | 1, value: number) =>
    setAxes((old) =>
      slot === 0
        ? [value, value === old[1] ? (value + 1) % 4 : old[1]]
        : [value === old[0] ? (value + 1) % 4 : old[0], value],
    );

  const workflow = (
    <section className="nb-action">
      <div className="nb-action-title">
        <span>
          <BrainCircuit /> Naive Bayes In Action
        </span>
        <p>
          Toggle feature evidence to see how likelihoods multiply into posterior
          probabilities.
        </p>
        <div>
          {CLASSES.map((name, index) => (
            <i key={name}>
              <b style={{ background: COLORS[index] }} />
              {`Class ${name}`}
            </i>
          ))}
        </div>
      </div>
      <div className="nb-flow">
        <article>
          <b>
            1. Priors <em>P(Cₖ)</em>
          </b>
          <small>Class prevalence (from data)</small>
          {evidence.map((item) => (
            <p key={item.label}>
              <strong style={{ color: COLORS[item.label] }}>
                {(item.prior * 100).toFixed(1)}%
              </strong>
              <i>
                <b
                  style={{
                    width: `${item.prior * 100}%`,
                    background: COLORS[item.label],
                  }}
                />
              </i>
              <span>{(item.prior * 100).toFixed(1)}%</span>
            </p>
          ))}
        </article>
        <i>→</i>
        <article>
          <b>
            2. Likelihoods <em>P(xⱼ | Cₖ)</em>
          </b>
          <small>Per-feature likelihood curves</small>
          <div className="nb-mini-bells">
            {evidence.map((item) => (
              <Bell
                key={item.label}
                color={COLORS[item.label]}
                value={query[2]}
                mean={model.means[item.label][2]}
              />
            ))}
          </div>
        </article>
        <i>→</i>
        <article>
          <b>
            3. Joint Likelihood <em>P(x | Cₖ)</em>
          </b>
          <small>Multiply likelihoods (naive)</small>
          <div className="nb-joint-top">
            {evidence.map((item) => (
              <strong key={item.label} style={{ color: COLORS[item.label] }}>
                {String.fromCharCode(65 + item.label)}{" "}
                <span>{item.joint.toExponential(3)}</span>
              </strong>
            ))}
          </div>
        </article>
        <i>→</i>
        <article>
          <b>
            4. Posterior <em>P(Cₖ | x)</em>
          </b>
          <small>Normalize to get posteriors</small>
          <div className="nb-joint-top">
            {posteriors.map((value, index) => (
              <strong key={index} style={{ color: COLORS[index] }}>
                {String.fromCharCode(65 + index)}{" "}
                <span>{value.toFixed(3)}</span>
              </strong>
            ))}
          </div>
        </article>
      </div>
      <div className="nb-evidence">
        <aside>
          <h3>FEATURE EVIDENCE (x)</h3>
          {FEATURES.map((feature, index) => (
            <div key={feature}>
              <button
                className={active[index] ? "on" : ""}
                onClick={() =>
                  setActive((old) =>
                    old.map((value, i) => (i === index ? !value : value)),
                  )
                }
              >
                <i />
              </button>
              <label>
                <span>{feature} (cm)</span>
                <input
                  aria-label={feature}
                  type="number"
                  step=".1"
                  value={query[index]}
                  onChange={(event) =>
                    setQuery((old) =>
                      old.map((value, i) =>
                        i === index ? Number(event.target.value) : value,
                      ),
                    )
                  }
                />
              </label>
              <input
                aria-label={`${feature} slider`}
                type="range"
                min={
                  datasetId === "iris"
                    ? index === 0
                      ? 4
                      : index === 1
                        ? 2
                        : 0
                    : Math.min(...X.map((row) => row[index]))
                }
                max={Math.max(...X.map((row) => row[index]))}
                step=".1"
                value={query[index]}
                onChange={(event) =>
                  setQuery((old) =>
                    old.map((value, i) =>
                      i === index ? Number(event.target.value) : value,
                    ),
                  )
                }
              />
            </div>
          ))}
        </aside>
        <main>
          <h3>
            PER-FEATURE LIKELIHOODS <em>P(xⱼ | Cₖ)</em>
          </h3>
          <header>
            {CLASSES.map((name, index) => (
              <b key={name} style={{ color: COLORS[index] }}>
                Class {name}
              </b>
            ))}
          </header>
          {FEATURES.map((_, feature) => (
            <div className={active[feature] ? "" : "ignored"} key={feature}>
              {evidence.map((item) => (
                <span key={item.label}>
                  {active[feature] ? (
                    <>
                      <Bell
                        color={COLORS[item.label]}
                        value={query[feature]}
                        mean={model.means[item.label][feature]}
                      />
                      <b>{item.likelihoods[feature].toFixed(4)}</b>
                    </>
                  ) : (
                    <i>—</i>
                  )}
                </span>
              ))}
            </div>
          ))}
          <section className="nb-joint-row">
            <label>
              JOINT LIKELIHOOD <em>P(x | Cₖ) = ∏ P(xⱼ | Cₖ)</em>
            </label>
            <div>
              {evidence.map((item) => (
                <b key={item.label} style={{ color: COLORS[item.label] }}>
                  {item.joint.toExponential(3)}
                </b>
              ))}
            </div>
          </section>
          <section className="nb-posterior-row">
            <label>
              POSTERIOR <em>P(Cₖ | x) ∝ P(Cₖ) P(x | Cₖ)</em>
            </label>
            <div>
              {posteriors.map((value, index) => (
                <span key={index}>
                  <b style={{ color: COLORS[index] }}>{value.toFixed(3)}</b>
                  <i>
                    <em
                      style={{
                        width: `${value * 100}%`,
                        background: COLORS[index],
                      }}
                    />
                  </i>
                </span>
              ))}
            </div>
          </section>
        </main>
      </div>
      <footer>
        <Trophy />
        <b>
          PREDICTION:{" "}
          <span style={{ color: COLORS[predicted] }}>
            Class {CLASSES[predicted]}
          </span>
        </b>
        <em>
          CONFIDENCE:{" "}
          <strong>{(posteriors[predicted] * 100).toFixed(1)}%</strong>
        </em>
      </footer>
    </section>
  );

  const tabPanel = () => {
    if (tab === "visualize" || tab === "learn") return workflow;
    if (tab === "dataset")
      return (
        <section className="nb-generic nb-data">
          <div className="nb-section-title">
            <span>
              <Database /> Live Dataset
            </span>
            <button
              onClick={() =>
                setRows((old) => [
                  ...old,
                  { features: query.slice(), label: predicted },
                ])
              }
            >
              <Plus /> Add evidence
            </button>
          </div>
          <p>
            Edit training samples directly. Parameters, likelihoods, boundaries,
            and predictions refit immediately.
          </p>
          <div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {FEATURES.map((name) => (
                    <th key={name}>{name}</th>
                  ))}
                  <th>Class</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    {row.features.map((value, feature) => (
                      <td key={feature}>
                        <input
                          aria-label={`Feature ${feature + 1} row ${index + 1}`}
                          type="number"
                          step=".1"
                          value={Number(value.toFixed(3))}
                          onChange={(event) =>
                            setRows((old) =>
                              old.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      features: item.features.map((entry, j) =>
                                        j === feature
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
                      <select
                        aria-label={`Class row ${index + 1}`}
                        value={row.label}
                        onChange={(event) =>
                          setRows((old) =>
                            old.map((item, i) =>
                              i === index
                                ? { ...item, label: Number(event.target.value) }
                                : item,
                            ),
                          )
                        }
                      >
                        <option value="0">A</option>
                        <option value="1">B</option>
                        <option value="2">C</option>
                      </select>
                    </td>
                    <td>
                      <button
                        aria-label={`Remove row ${index + 1}`}
                        disabled={rows.length <= 3}
                        onClick={() =>
                          setRows((old) => old.filter((_, i) => i !== index))
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
        <section className="nb-generic nb-train">
          <BrainCircuit />
          <h2>Fit Gaussian class distributions</h2>
          <p>
            Training estimates a prior, mean, and variance for every feature
            within every class. The shared model evaluates posteriors in
            log-space for numerical stability.
          </p>
          <div>
            {model.classes.map((label) => (
              <article key={label}>
                <b style={{ color: COLORS[label] }}>Class {CLASSES[label]}</b>
                <span>Prior {(model.priors[label] * 100).toFixed(1)}%</span>
                <span>
                  {rows.filter((row) => row.label === label).length} samples
                </span>
              </article>
            ))}
          </div>
          <button
            onClick={() => {
              setTrained(`Refit on ${rows.length} live samples`);
              setToast("Gaussian model trained");
            }}
          >
            <Play /> Train Model
          </button>
          <small>{trained}</small>
        </section>
      );
    if (tab === "metrics")
      return (
        <section className="nb-generic">
          <div className="nb-section-title">
            <span>
              <BarChart3 /> Performance Metrics
            </span>
          </div>
          <div className="nb-metrics">
            <article>
              <b>{(accuracy * 100).toFixed(1)}%</b>
              <span>Training accuracy</span>
            </article>
            <article>
              <b>{rows.length}</b>
              <span>Samples</span>
            </article>
            <article>
              <b>{active.filter(Boolean).length}/4</b>
              <span>Active features</span>
            </article>
            <article>
              <b>{(posteriors[predicted] * 100).toFixed(1)}%</b>
              <span>Query confidence</span>
            </article>
          </div>
        </section>
      );
    if (tab === "compare")
      return (
        <section className="nb-generic">
          <div className="nb-section-title">
            <span>
              <Network /> Prior Comparison
            </span>
          </div>
          <div className="nb-compare">
            {["empirical", "uniform"].map((mode) => (
              <article
                className={priorMode === mode ? "active" : ""}
                key={mode}
                onClick={() => setPriorMode(mode as "empirical" | "uniform")}
              >
                <FlaskConical />
                <h3>{mode} priors</h3>
                <p>
                  {mode === "empirical"
                    ? "Estimate class prevalence from the current data."
                    : "Give every class equal starting probability."}
                </p>
                <button>Use priors</button>
              </article>
            ))}
          </div>
        </section>
      );
    return (
      <section className="nb-generic nb-explain">
        <div className="nb-section-title">
          <span>
            <FileText /> Formula Walkthrough
          </span>
        </div>
        <div>
          <article>
            <b>1</b>
            <h3>Start with priors</h3>
            <p>
              P(Cₖ) represents how frequent each class is before seeing the
              query.
            </p>
          </article>
          <article>
            <b>2</b>
            <h3>Multiply evidence</h3>
            <p>
              Gaussian likelihoods model every active feature independently
              within each class.
            </p>
          </article>
          <article>
            <b>3</b>
            <h3>Normalize</h3>
            <p>
              Log-sum-exp turns joint scores into posterior probabilities that
              sum to one.
            </p>
          </article>
        </div>
      </section>
    );
  };

  return (
    <div className="nb-page">
      <aside className="nb-nav">
        <Link to="/" className="nb-brand">
          <i>
            <Network />
          </i>
          <span>
            <b>
              Mega ML <em>✦</em>
            </b>
            <small>AI OBSERVATORY</small>
          </span>
        </Link>
        <label>
          <Search />
          <input placeholder="Search lessons..." />
          <kbd>⌘ K</kbd>
        </label>
        <h3>LEARNING PATH</h3>
        <button>
          <ChevronDown /> 1. Foundations <span>8</span>
        </button>
        <button className="section">
          <ChevronDown /> 2. Supervised <span>12</span>
        </button>
        <div className="nb-lessons">
          {[
            "Linear Regression",
            "Logistic Regression",
            "Decision Trees",
            "Random Forest",
            "k-Nearest Neighbors",
            "Support Vector Machines",
            "Naive Bayes",
            "Gradient Boosting",
            "Neural Networks",
            "XGBoost",
            "LightGBM",
          ].map((name) => (
            <i className={name === "Naive Bayes" ? "active" : ""} key={name}>
              {name}
              {name === "Naive Bayes" && <b />}
            </i>
          ))}
        </div>
        {[
          "3. Unsupervised",
          "4. Deep Learning",
          "5. MLOps",
          "6. Advanced Topics",
        ].map((name, index) => (
          <button key={name}>
            <ChevronRight />
            {name}
            <span>{[7, 9, 6, 6][index]}</span>
          </button>
        ))}
        <Link className="nb-notes" to="/">
          <FileText /> My Notes
        </Link>
      </aside>
      <main>
        <header className="nb-header">
          <div>
            <h1>Naive Bayes</h1>
            <p>Probabilistic classification with conditional independence.</p>
          </div>
          <section>
            <label>LESSON PROGRESS</label>
            <i>
              <b />
            </i>
            <strong>62%</strong>
          </section>
          <article>
            <b>OBJECTIVE</b>
            <p>
              See how class likelihoods are computed from feature evidence and
              combined with priors to get posteriors.
            </p>
          </article>
          <button>
            <SlidersHorizontal /> Lesson Mode <ChevronDown />
          </button>
          <button
            aria-label="Theme"
            onClick={() => setToast("Dark observatory mode is active")}
          >
            <Moon />
          </button>
          <button aria-label="Menu">
            <Menu />
          </button>
        </header>
        <nav className="nb-tabs">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              onClick={() => setTab(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="nb-workspace">
          <div className="nb-center">
            {tabPanel()}
            <div className="nb-bottom">
              <article className="nb-donut-card">
                <h3>POSTERIOR DISTRIBUTION</h3>
                <div
                  className="nb-donut"
                  style={{
                    background: `conic-gradient(${COLORS[0]} 0 ${posteriors[0] * 100}%,${COLORS[1]} ${posteriors[0] * 100}% ${(posteriors[0] + posteriors[1]) * 100}%,${COLORS[2]} ${(posteriors[0] + posteriors[1]) * 100}% 100%)`,
                  }}
                >
                  <span>P(Cₖ | x)</span>
                </div>
                <div>
                  {posteriors.map((value, index) => (
                    <p key={index}>
                      <i style={{ background: COLORS[index] }} />
                      {String.fromCharCode(65 + index)}{" "}
                      <b>{(value * 100).toFixed(1)}%</b>
                    </p>
                  ))}
                </div>
              </article>
              <article>
                <h3>
                  LOG PROBABILITIES <small>(numerically stable)</small>
                </h3>
                {evidence.map((item) => (
                  <p key={item.label}>
                    <i style={{ background: COLORS[item.label] }} />{" "}
                    {CLASSES[item.label]} <b>{item.logJoint.toFixed(3)}</b>
                  </p>
                ))}
              </article>
              <article>
                <h3>EVIDENCE SUMMARY</h3>
                <p>
                  Active features <b>{active.filter(Boolean).length} / 4</b>
                </p>
                <p>
                  Independence assumption <b>Naive</b>
                </p>
                <p>
                  Working in log-space <b>Yes</b>
                </p>
                <p>
                  Normalization <b>Softmax</b>
                </p>
              </article>
              <article className="nb-formula">
                <h3>FORMULA RECAP</h3>
                <b>
                  P(Cₖ | x) = <span>P(Cₖ) ∏ᵢ P(xᵢ | Cₖ)</span> / Σⱼ P(Cⱼ) ∏ᵢ
                  P(xᵢ | Cⱼ)
                </b>
                <p>
                  Assumes features are conditionally independent given the
                  class.
                </p>
              </article>
            </div>
          </div>
          <aside className="nb-controls">
            <section>
              <h3>DATASET</h3>
              <select
                aria-label="Dataset"
                value={datasetId}
                onChange={(event) =>
                  selectDataset(event.target.value as DatasetId)
                }
              >
                {Object.entries(LABELS)
                  .filter(([key]) => key !== "imported" || imported.length)
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
              <div>
                <span>Switch dataset</span>
                <button onClick={() => uploadRef.current?.click()}>
                  <Upload /> Upload CSV
                </button>
                <input
                  ref={uploadRef}
                  hidden
                  type="file"
                  accept=".csv,text/csv"
                  onChange={upload}
                />
              </div>
            </section>
            <section>
              <h3>MODEL CONTROLS</h3>
              <label>
                Priors <CircleHelp />
                <select
                  aria-label="Priors"
                  value={priorMode}
                  onChange={(event) =>
                    setPriorMode(event.target.value as "empirical" | "uniform")
                  }
                >
                  <option value="empirical">From data (empirical)</option>
                  <option value="uniform">Uniform (equal)</option>
                </select>
              </label>
              <label>
                Smoothing <CircleHelp />
                <select
                  aria-label="Smoothing"
                  value={smoothing}
                  onChange={(event) => setSmoothing(Number(event.target.value))}
                >
                  <option value="0">None</option>
                  <option value="0.1">Variance ε = 0.1</option>
                  <option value="1">Laplace (α = 1)</option>
                </select>
              </label>
              <label>
                Distribution <CircleHelp />
                <select aria-label="Distribution" value="gaussian" disabled>
                  <option>Gaussian</option>
                </select>
              </label>
            </section>
            <section className="nb-boundary">
              <h3>
                DECISION BOUNDARY (2D) <CircleHelp />
              </h3>
              <label>
                X axis
                <select
                  aria-label="X axis"
                  value={axes[0]}
                  onChange={(event) =>
                    changeAxis(0, Number(event.target.value))
                  }
                >
                  {FEATURES.map((name, index) => (
                    <option value={index} key={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Y axis
                <select
                  aria-label="Y axis"
                  value={axes[1]}
                  onChange={(event) =>
                    changeAxis(1, Number(event.target.value))
                  }
                >
                  {FEATURES.map((name, index) => (
                    <option value={index} key={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="nb-checks">
                <label>
                  <input
                    type="checkbox"
                    checked={showRegions}
                    onChange={(event) => setShowRegions(event.target.checked)}
                  />{" "}
                  Show decision regions
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showPoints}
                    onChange={(event) => setShowPoints(event.target.checked)}
                  />{" "}
                  Show training points
                </label>
              </div>
              <div className="nb-boundary-chart">
                {showRegions &&
                  boundary.cells.map((cell, index) => (
                    <i
                      key={index}
                      style={{
                        left: `${(cell.x / boundary.cols) * 100}%`,
                        top: `${((boundary.lines - 1 - cell.y) / boundary.lines) * 100}%`,
                        width: `${100 / boundary.cols + 0.2}%`,
                        height: `${100 / boundary.lines + 0.3}%`,
                        background: FILLS[cell.label],
                      }}
                    />
                  ))}
                {showPoints &&
                  boundary.points.map((point, index) => (
                    <b
                      key={index}
                      style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        background: COLORS[point.label],
                      }}
                    />
                  ))}
                <span className="x-label">{FEATURES[axes[0]]} (cm)</span>
                <span className="y-label">{FEATURES[axes[1]]} (cm)</span>
              </div>
            </section>
          </aside>
        </div>
        <footer className="nb-status">
          <Link to="/">
            <Home /> Naive Bayes
          </Link>
          <span>
            <i /> Dataset: <b>{LABELS[datasetId]}</b>
          </span>
          <span>
            <BrainCircuit /> Model: <b>{trained}</b>
          </span>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
          <button onClick={reset}>
            <RotateCcw /> Reset
          </button>
        </footer>
      </main>
      {toast && <div className="nb-toast">{toast}</div>}
    </div>
  );
}
