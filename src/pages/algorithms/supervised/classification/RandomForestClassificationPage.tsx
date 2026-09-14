import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Database,
  Expand,
  FileText,
  GitBranch,
  Lightbulb,
  Network,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trees,
  Upload,
  UserCircle,
} from "lucide-react";
import { irisDataset } from "../../../../data/sampleDatasets";
import {
  trainRandomForestClassification,
  type ClassificationTreeNode,
} from "../../../../lib/algorithms/classification/randomForestClassification";
import "./RandomForestClassificationPage.css";

type Row = { features: number[]; label: number };
type DatasetId = "iris" | "wine" | "seeds" | "synthetic" | "imported";
type TabId =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
type MaxFeatures = "sqrt" | "log2" | "all";
const COLORS = ["#32c7dc", "#55b947", "#8b57f0"];
const NAMES = ["Setosa", "Versicolor", "Virginica"];
const FEATURES = ["Sepal Length", "Sepal Width", "Petal Length", "Petal Width"];
const TABS: { id: TabId; label: string }[] = [
  { id: "learn", label: "Learn" },
  { id: "visualize", label: "Visualize" },
  { id: "dataset", label: "Dataset" },
  { id: "train", label: "Train" },
  { id: "metrics", label: "Metrics" },
  { id: "compare", label: "Compare" },
  { id: "explain", label: "Explain" },
];
const seeds = () =>
  (irisDataset.data as Record<string, unknown>[]).map((item) => ({
    features: [
      "sepal_length",
      "sepal_width",
      "petal_length",
      "petal_width",
    ].map((key) => Number(item[key])),
    label:
      item.species === "setosa" ? 0 : item.species === "versicolor" ? 1 : 2,
  }));
function irisRows() {
  const source = seeds();
  return [0, 1, 2].flatMap((label) => {
    const group = source.filter((row) => row.label === label);
    return Array.from({ length: 50 }, (_, index) => ({
      features: group[index % group.length].features.map(
        (value, feature) =>
          value +
          Math.sin((index + 3) * (feature + 2) * 1.17) *
            [0.32, 0.22, 0.29, 0.2][feature] +
          (index % 6 === 0 && label === 1
            ? [0, 0, 0.65, 0.3][feature]
            : index % 6 === 0 && label === 2
              ? [0, 0, -0.65, -0.3][feature]
              : 0),
      ),
      label,
    }));
  });
}
const BASE = irisRows();
function transform(source: Row[], kind: DatasetId): Row[] {
  return source.map((row, index) => {
    if (kind === "wine")
      return {
        features: [
          row.features[0] * 2 + 1,
          row.features[1] * 0.6,
          row.features[2] * 0.45,
          row.features[3] * 30 + 10,
        ],
        label: row.label,
      };
    if (kind === "seeds")
      return {
        features: [
          row.features[0] * 2.4,
          row.features[1] * 4,
          row.features[2] * 0.95 + 3,
          row.features[3] * 2.7,
        ],
        label: row.label,
      };
    if (kind === "synthetic") {
      const shift = row.label * 1.3;
      return {
        features: row.features.map(
          (value, feature) =>
            value +
            shift * (feature % 2 ? 0.5 : 1) +
            Math.cos(index * (feature + 1)) * 0.1,
        ),
        label: row.label,
      };
    }
    return { features: [...row.features], label: row.label };
  });
}
const BUILT_INS: Record<Exclude<DatasetId, "imported">, Row[]> = {
  iris: BASE,
  wine: transform(BASE, "wine"),
  seeds: transform(BASE, "seeds"),
  synthetic: transform(BASE, "synthetic"),
};
const LABELS: Record<DatasetId, string> = {
  iris: "Iris (Fisher's Iris)",
  wine: "Wine Classification",
  seeds: "Wheat Seeds",
  synthetic: "Synthetic Classes",
  imported: "Imported Dataset",
};
function treeDepth(node: ClassificationTreeNode): number {
  return !node.left || !node.right
    ? 0
    : 1 + Math.max(treeDepth(node.left), treeDepth(node.right));
}
function MiniTree({
  root,
  index,
  prediction,
  inBag,
}: {
  root: ClassificationTreeNode;
  index: number;
  prediction: number;
  inBag: number;
}) {
  const levels = Math.min(3, treeDepth(root));
  return (
    <article className="rfc-tree">
      <header>
        <b>Tree {index}</b>
        <span>In Bag: {inBag}%</span>
      </header>
      <svg viewBox="0 0 150 95">
        <line x1="75" y1="15" x2="47" y2="42" />
        <line x1="75" y1="15" x2="103" y2="42" />
        <line x1="47" y1="42" x2="29" y2="72" />
        <line x1="47" y1="42" x2="62" y2="72" />
        <line x1="103" y1="42" x2="89" y2="72" />
        <line x1="103" y1="42" x2="123" y2="72" />
        <circle cx="75" cy="15" r="6" />
        <circle cx="47" cy="42" r="6" />
        <circle cx="103" cy="42" r="6" />
        <circle cx="29" cy="72" r="6" className="c0" />
        <circle cx="62" cy="72" r="6" className="c1" />
        <circle cx="89" cy="72" r="6" className="c2" />
        <circle cx="123" cy="72" r="6" className={`c${prediction}`} />
        <text x="75" y="92" textAnchor="middle">
          depth {levels}
        </text>
      </svg>
      <strong style={{ color: COLORS[prediction] }}>{NAMES[prediction]}</strong>
    </article>
  );
}

export default function RandomForestClassificationPage() {
  const [tab, setTab] = useState<TabId>("visualize"),
    [datasetId, setDatasetId] = useState<DatasetId>("iris");
  const [rows, setRows] = useState<Row[]>(
      BASE.map((row) => ({ features: [...row.features], label: row.label })),
    ),
    [imported, setImported] = useState<Row[]>([]);
  const [estimators, setEstimators] = useState(100),
    [depth, setDepth] = useState(7),
    [maxFeatures, setMaxFeatures] = useState<MaxFeatures>("sqrt"),
    [bootstrap, setBootstrap] = useState(true),
    [minSplit, setMinSplit] = useState(2),
    [oob, setOob] = useState(true),
    [featureRate, setFeatureRate] = useState(0.58),
    [sampleTree, setSampleTree] = useState(7);
  const [query, setQuery] = useState([5.9, 3, 4.2, 1.5]),
    [trained, setTrained] = useState("Ready"),
    [tip, setTip] = useState(0),
    [toast, setToast] = useState(""),
    [sampleMode, setSampleMode] = useState<"inbag" | "oob">("oob");
  const uploadRef = useRef<HTMLInputElement>(null),
    X = useMemo(() => rows.map((row) => row.features), [rows]),
    y = useMemo(() => rows.map((row) => row.label), [rows]);
  const model = useMemo(
    () =>
      trainRandomForestClassification(X, y, {
        estimators,
        maxDepth: depth >= 12 ? null : depth,
        maxFeatures,
        bootstrap,
        minSamplesSplit: minSplit,
        featureSampleRate: featureRate,
        seed: 2026,
      }),
    [X, y, estimators, depth, maxFeatures, bootstrap, minSplit, featureRate],
  );
  const probabilities = model.predictProba(query),
    prediction = model.predict(query),
    treeVotes = model.treePredictions(query),
    voteCounts = [0, 1, 2].map(
      (label) => treeVotes.filter((value) => value === label).length,
    );
  const predictions = useMemo(
      () => X.map((row) => model.predict(row)),
      [X, model],
    ),
    accuracy =
      predictions.filter((value, index) => value === y[index]).length /
      y.length;
  const oobConfusion = useMemo(
    () =>
      Array.from({ length: 3 }, (_, actual) =>
        Array.from(
          { length: 3 },
          (_, pred) =>
            model.oobPredictions.filter(
              (value, index) => y[index] === actual && value === pred,
            ).length,
        ),
      ),
    [model.oobPredictions, y],
  );
  const region = useMemo(() => {
    const xFeature = 2,
      yFeature = 3,
      xs = X.map((row) => row[xFeature]),
      ys = X.map((row) => row[yFeature]),
      x0 = Math.min(...xs) - 0.5,
      x1 = Math.max(...xs) + 0.5,
      y0 = Math.min(...ys) - 0.3,
      y1 = Math.max(...ys) + 0.3,
      cols = 38,
      lines = 15,
      cells = [] as { x: number; y: number; label: number }[];
    for (let j = 0; j < lines; j++)
      for (let i = 0; i < cols; i++) {
        const sample = query.slice();
        sample[xFeature] = x0 + ((i + 0.5) / cols) * (x1 - x0);
        sample[yFeature] = y0 + ((j + 0.5) / lines) * (y1 - y0);
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
        x: ((row.features[xFeature] - x0) / (x1 - x0)) * 100,
        y: 100 - ((row.features[yFeature] - y0) / (y1 - y0)) * 100,
        label: row.label,
      })),
    };
  }, [X, model, query, rows]);
  const selectDataset = (next: DatasetId) => {
    const source = next === "imported" ? imported : BUILT_INS[next];
    if (!source.length) return;
    setDatasetId(next);
    setRows(
      source.map((row) => ({ features: [...row.features], label: row.label })),
    );
    setQuery(source[Math.floor(source.length / 2)].features.slice());
    setTrained("Ready");
  };
  const reset = () => {
    setTab("visualize");
    setDatasetId("iris");
    setRows(
      BASE.map((row) => ({ features: [...row.features], label: row.label })),
    );
    setEstimators(100);
    setDepth(7);
    setMaxFeatures("sqrt");
    setBootstrap(true);
    setMinSplit(2);
    setOob(true);
    setFeatureRate(0.58);
    setSampleTree(7);
    setSampleMode("oob");
    setQuery([5.9, 3, 4.2, 1.5]);
    setTrained("Ready");
    setToast("");
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const parsed = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter((values) => values.length >= 5 && values.every(Number.isFinite))
      .map((values) => ({
        features: values.slice(0, 4),
        label: Math.max(0, Math.min(2, Math.round(values[4]))),
      }));
    if (parsed.length < 3) {
      setToast("CSV needs four features and class");
      return;
    }
    setImported(parsed);
    setDatasetId("imported");
    setRows(parsed);
    setQuery(parsed[0].features.slice());
    setToast(`Imported ${parsed.length} samples`);
    event.target.value = "";
  };
  const updateRow = (index: number, feature: number, value: number) =>
    setRows((old) =>
      old.map((row, i) =>
        i === index
          ? {
              ...row,
              features: row.features.map((entry, j) =>
                j === feature ? value : entry,
              ),
            }
          : row,
      ),
    );
  const visual = (
    <>
      <section className="rfc-visual">
        <h2>
          <Trees /> FOREST PREDICTION VISUALIZER
        </h2>
        <div className="rfc-trees">
          {[0, 1, 2, 3].map((index) => (
            <MiniTree
              key={index}
              root={model.trees[index % model.trees.length].root}
              index={index + 1}
              prediction={treeVotes[index % treeVotes.length]}
              inBag={Math.round(
                (new Set(model.trees[index % model.trees.length].inBagIndices)
                  .size /
                  rows.length) *
                  100,
              )}
            />
          ))}
          <i>•••</i>
          <MiniTree
            root={model.trees.at(-1)!.root}
            index={estimators}
            prediction={treeVotes.at(-1)!}
            inBag={Math.round(
              (new Set(model.trees.at(-1)!.inBagIndices).size / rows.length) *
                100,
            )}
          />
        </div>
        <div className="rfc-vote">
          <h3>MAJORITY VOTE ({estimators} TREES)</h3>
          <div>
            {voteCounts.map((count, label) => (
              <span
                key={label}
                style={{
                  width: `${(count / estimators) * 100}%`,
                  background: COLORS[label],
                }}
              >
                {Math.round((count / estimators) * 100)}%
              </span>
            ))}
          </div>
          <footer>
            {NAMES.map((name, index) => (
              <b key={name} style={{ color: COLORS[index] }}>
                {name}
              </b>
            ))}
            <strong>
              <Check /> PREDICTION{" "}
              <em style={{ color: COLORS[prediction] }}>{NAMES[prediction]}</em>
            </strong>
          </footer>
        </div>
        <div className="rfc-region-card">
          <h3>DECISION BOUNDARY (2D PROJECTION: PETAL SPACE)</h3>
          <div className="rfc-region">
            {region.cells.map((cell, index) => (
              <i
                key={index}
                style={{
                  left: `${(cell.x / region.cols) * 100}%`,
                  top: `${((region.lines - 1 - cell.y) / region.lines) * 100}%`,
                  width: `${100 / region.cols + 0.2}%`,
                  height: `${100 / region.lines + 0.2}%`,
                  background: `${COLORS[cell.label]}32`,
                }}
              />
            ))}
            {region.points.map((point, index) => (
              <b
                key={index}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  background: COLORS[point.label],
                }}
              />
            ))}
            <span>PC 1 / petal length</span>
          </div>
          <aside>
            {NAMES.map((name, index) => (
              <p key={name}>
                <i style={{ background: COLORS[index] }} />
                {name}
              </p>
            ))}
          </aside>
          <footer>
            Background shows predicted class regions. Points are actual samples.
          </footer>
        </div>
      </section>
      <div className="rfc-bottom">
        <article className="rfc-vote-dist">
          <h3>
            VOTE DISTRIBUTION <small>(for selected point)</small>
          </h3>
          <div
            className="rfc-donut"
            style={{
              background: `conic-gradient(${COLORS[0]} 0 ${probabilities[0] * 100}%,${COLORS[1]} ${probabilities[0] * 100}% ${(probabilities[0] + probabilities[1]) * 100}%,${COLORS[2]} ${(probabilities[0] + probabilities[1]) * 100}% 100%)`,
            }}
          >
            <i />
          </div>
          <section>
            {voteCounts.map((count, index) => (
              <p key={index}>
                <i style={{ background: COLORS[index] }} />
                {NAMES[index]}
                <b>
                  {count} ({Math.round((count / estimators) * 100)}%)
                </b>
              </p>
            ))}
          </section>
          <footer>
            Selected point <button />
          </footer>
        </article>
        <article className="rfc-oob">
          <h3>OOB PERFORMANCE</h3>
          <div>
            <i />
            <b>{oob ? model.oobAccuracy.toFixed(3) : "Off"}</b>
            <span>OOB Accuracy</span>
          </div>
          <p>
            OOB Error: <b>{oob ? (1 - model.oobAccuracy).toFixed(3) : "Off"}</b>
          </p>
        </article>
        <article className="rfc-conf">
          <h3>CONFUSION MATRIX (OOB)</h3>
          <table>
            <thead>
              <tr>
                <th />
                <th>Setosa</th>
                <th>Versicolor</th>
                <th>Virginica</th>
              </tr>
            </thead>
            <tbody>
              {oobConfusion.map((line, index) => (
                <tr key={index}>
                  <th>{NAMES[index]}</th>
                  {line.map((value, j) => (
                    <td key={j}>{oob ? value : "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p>Accuracy: {oob ? model.oobAccuracy.toFixed(3) : "Off"}</p>
        </article>
        <article className="rfc-importance">
          <h3>FEATURE IMPORTANCE</h3>
          {model.featureImportance.map((value, index) => (
            <p key={index}>
              <span>{FEATURES[index]}</span>
              <i>
                <b
                  style={{
                    width: `${value * 100}%`,
                    background: COLORS[index % 3],
                  }}
                />
              </i>
              <em>{value.toFixed(2)}</em>
            </p>
          ))}
        </article>
      </div>
      <section className="rfc-summary">
        <b>DATASET SUMMARY</b>
        <span>{LABELS[datasetId]}</span>
        <span>
          Samples: {rows.length} &nbsp;•&nbsp; Features: 4 &nbsp;•&nbsp;
          Classes: 3 &nbsp;•&nbsp; Balanced
        </span>
        <button onClick={() => setTab("dataset")}>
          View Dataset <ChevronRight />
        </button>
      </section>
    </>
  );
  const panel = () => {
    if (tab === "visualize" || tab === "learn") return visual;
    if (tab === "dataset")
      return (
        <section className="rfc-generic rfc-data">
          <div className="rfc-title">
            <span>
              <Database /> Live Dataset
            </span>
            <button
              onClick={() =>
                setRows((old) => [
                  ...old,
                  { features: query.slice(), label: prediction },
                ])
              }
            >
              <Plus /> Add query
            </button>
          </div>
          <p>
            Edit samples directly; every bootstrap tree, OOB vote, region,
            metric, and importance value updates.
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
                            updateRow(
                              index,
                              feature,
                              Number(event.target.value),
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
                        <option value="0">Setosa</option>
                        <option value="1">Versicolor</option>
                        <option value="2">Virginica</option>
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
        <section className="rfc-generic rfc-train">
          <Trees />
          <h2>Bootstrap and grow the forest</h2>
          <p>
            Each genuine CART tree receives a sampled dataset and a random
            feature subset at every split. Out-of-bag rows provide validation
            without a separate holdout set.
          </p>
          <div>
            <article>
              <b>{estimators}</b>
              <span>Trees</span>
            </article>
            <article>
              <b>
                {model.trees.reduce(
                  (sum, tree) => sum + tree.oobIndices.length,
                  0,
                )}
              </b>
              <span>OOB evaluations</span>
            </article>
            <article>
              <b>{model.oobAccuracy.toFixed(3)}</b>
              <span>OOB accuracy</span>
            </article>
            <article>
              <b>{(accuracy * 100).toFixed(1)}%</b>
              <span>Training accuracy</span>
            </article>
          </div>
          <button
            onClick={() => {
              setTrained(
                `Trained ${estimators} trees with OOB ${model.oobAccuracy.toFixed(3)}`,
              );
              setToast("Random forest retrained");
            }}
          >
            <Play /> Train / Retrain Forest
          </button>
          <small>{trained}</small>
        </section>
      );
    if (tab === "metrics")
      return (
        <section className="rfc-generic">
          <div className="rfc-title">
            <span>
              <BarChart3 /> Forest Metrics
            </span>
          </div>
          <div className="rfc-metrics">
            <article>
              <b>{(accuracy * 100).toFixed(1)}%</b>
              <span>Training accuracy</span>
            </article>
            <article>
              <b>{model.oobAccuracy.toFixed(3)}</b>
              <span>OOB accuracy</span>
            </article>
            <article>
              <b>{(1 - model.oobAccuracy).toFixed(3)}</b>
              <span>OOB error</span>
            </article>
            <article>
              <b>{estimators}</b>
              <span>Estimators</span>
            </article>
          </div>
          {visual.props.children[1]}
        </section>
      );
    if (tab === "compare")
      return (
        <section className="rfc-generic">
          <div className="rfc-title">
            <span>
              <Network /> Feature Sampling Comparison
            </span>
          </div>
          <div className="rfc-compare">
            {(["sqrt", "log2", "all"] as MaxFeatures[]).map((option) => (
              <article
                key={option}
                className={maxFeatures === option ? "active" : ""}
                onClick={() => setMaxFeatures(option)}
              >
                <Trees />
                <h3>{option}</h3>
                <p>
                  {option === "all"
                    ? "Every feature competes at each split."
                    : `A ${option} subset competes at each split.`}
                </p>
                <button>Use strategy</button>
              </article>
            ))}
          </div>
        </section>
      );
    return (
      <section className="rfc-generic rfc-explain">
        <div className="rfc-title">
          <span>
            <FileText /> Live Forest Inference
          </span>
        </div>
        <div className="rfc-query">
          {FEATURES.map((name, index) => (
            <label key={name}>
              {name}
              <input
                aria-label={`Query ${name}`}
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
          ))}
        </div>
        <h2>
          Prediction:{" "}
          <span style={{ color: COLORS[prediction] }}>{NAMES[prediction]}</span>
        </h2>
        <div className="rfc-query-votes">
          {NAMES.map((name, index) => (
            <article key={name}>
              <b style={{ color: COLORS[index] }}>
                {Math.round(probabilities[index] * 100)}%
              </b>
              <span>{name}</span>
              <i>
                <em
                  style={{
                    width: `${probabilities[index] * 100}%`,
                    background: COLORS[index],
                  }}
                />
              </i>
            </article>
          ))}
        </div>
      </section>
    );
  };
  const sampleCount =
    sampleMode === "inbag"
      ? model.trees[sampleTree - 1]?.inBagIndices.length
      : model.trees[sampleTree - 1]?.oobIndices.length;
  return (
    <div className="rfc-page">
      <aside className="rfc-nav">
        <Link className="rfc-brand" to="/">
          <i>
            <Sparkles />
          </i>
          <span>
            <b>Mega ML</b>
            <small>AI OBSERVATORY</small>
          </span>
        </Link>
        <h3>LESSON NAVIGATION</h3>
        {[
          { n: "Overview", i: <BookOpen /> },
          { n: "Decision Tree Refresher", i: <GitBranch /> },
          { n: "Bootstrap Sampling", i: <RefreshCw /> },
          { n: "Feature Randomness", i: <Expand /> },
          { n: "Random Forest", i: <Trees /> },
          { n: "Out-of-Bag (OOB)", i: <CircleHelp /> },
          { n: "Hyperparameters", i: <Network /> },
          { n: "Strengths & Limits", i: <BarChart3 /> },
          { n: "Use Cases", i: <Database /> },
          { n: "Summary", i: <FileText /> },
        ].map((item, index) => (
          <button className={index === 4 ? "active" : ""} key={item.n}>
            {item.i}
            {item.n}
            {index > 0 && index < 4 ? <Check /> : <i />}
          </button>
        ))}
        <section className="rfc-tip">
          <span>
            <Lightbulb /> LESSON TIP
          </span>
          <p>
            {
              [
                "Hover over any tree or point to see how each model votes.",
                "Increase trees to stabilize the ensemble vote.",
                "OOB samples validate trees without a holdout set.",
                "Feature randomness decorrelates individual trees.",
                "Compare each tree with the forest decision.",
                "Use the query panel for live inference.",
              ][tip]
            }
          </p>
          <footer>
            <button
              aria-label="Previous tip"
              onClick={() => setTip((value) => (value + 5) % 6)}
            >
              <ChevronLeft />
            </button>
            <i>{tip + 1} / 6</i>
            <button
              aria-label="Next tip"
              onClick={() => setTip((value) => (value + 1) % 6)}
            >
              <ChevronRight />
            </button>
          </footer>
        </section>
        <Link className="rfc-user" to="/">
          <UserCircle />
          <span>
            <b>Mega ML Learner</b>
            <small>Data Explorer</small>
          </span>
          <ChevronDown />
        </Link>
      </aside>
      <main>
        <header className="rfc-header">
          <div>
            <h1>
              Random Forest Classification <span>Ready</span>
            </h1>
            <b>OBJECTIVE</b>
            <p>
              Build an ensemble of decision trees on bootstrap samples and
              feature subsets to improve accuracy
              <br />
              and control overfitting. Trees vote, the forest decides.
            </p>
          </div>
          <aside>
            <span>LESSON PROGRESS</span>
            <i>
              <b />
            </i>
            <strong>65%</strong>
            <button onClick={() => setToast("Documentation panel ready")}>
              <FileText /> Docs
            </button>
            <button
              aria-label="Fullscreen"
              onClick={() => document.documentElement.requestFullscreen?.()}
            >
              <Expand />
            </button>
          </aside>
          <label>
            <Sparkles />
            <span>
              <b>DATASET</b>
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
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </span>
          </label>
          <button
            className="rfc-upload"
            onClick={() => uploadRef.current?.click()}
          >
            <Upload /> Upload Dataset
          </button>
          <input
            ref={uploadRef}
            hidden
            type="file"
            accept=".csv,text/csv"
            onChange={upload}
          />
        </header>
        <nav className="rfc-tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="rfc-workspace">
          <div className="rfc-main">{panel()}</div>
          <aside className="rfc-controls">
            <h2>MODEL CONTROLS</h2>
            <section>
              <label>
                Forest Size (n_estimators)
                <input
                  aria-label="Forest Size numeric"
                  type="number"
                  min="10"
                  max="500"
                  value={estimators}
                  onChange={(event) =>
                    setEstimators(
                      Math.max(10, Math.min(500, Number(event.target.value))),
                    )
                  }
                />
              </label>
              <input
                aria-label="Forest Size slider"
                type="range"
                min="10"
                max="500"
                step="10"
                value={estimators}
                onChange={(event) => setEstimators(Number(event.target.value))}
              />
              <div>
                <span>10</span>
                <span>500</span>
              </div>
              <label>
                Max Depth
                <input
                  aria-label="Max Depth numeric"
                  type="number"
                  min="1"
                  max="12"
                  value={depth}
                  onChange={(event) => setDepth(Number(event.target.value))}
                />
              </label>
              <input
                aria-label="Max Depth slider"
                type="range"
                min="1"
                max="12"
                value={depth}
                onChange={(event) => setDepth(Number(event.target.value))}
              />
              <div>
                <span>1</span>
                <span>None</span>
              </div>
              <label>Max Features (per split)</label>
              <select
                aria-label="Max Features"
                value={maxFeatures}
                onChange={(event) =>
                  setMaxFeatures(event.target.value as MaxFeatures)
                }
              >
                <option value="sqrt">sqrt (default)</option>
                <option value="log2">log₂</option>
                <option value="all">All features</option>
              </select>
              <small>Number of features to consider at each split.</small>
            </section>
            <section>
              <label>
                Bootstrap Samples
                <button
                  className={bootstrap ? "on" : ""}
                  onClick={() => setBootstrap((value) => !value)}
                >
                  {bootstrap ? "On" : "Off"}
                  <i />
                </button>
              </label>
              <small>Sample with replacement for each tree.</small>
              <label>
                Min Samples Split
                <input
                  aria-label="Min Samples Split numeric"
                  type="number"
                  min="2"
                  max="20"
                  value={minSplit}
                  onChange={(event) => setMinSplit(Number(event.target.value))}
                />
              </label>
              <input
                aria-label="Min Samples Split slider"
                type="range"
                min="2"
                max="20"
                value={minSplit}
                onChange={(event) => setMinSplit(Number(event.target.value))}
              />
              <div>
                <span>2</span>
                <span>20</span>
              </div>
            </section>
            <hr />
            <h2>OOB & SAMPLING</h2>
            <section>
              <label>
                Out-of-Bag Scoring
                <button
                  className={oob ? "on" : ""}
                  onClick={() => setOob((value) => !value)}
                >
                  {oob ? "On" : "Off"}
                  <i />
                </button>
              </label>
              <label>
                OOB Score (Accuracy)
                <strong>{oob ? model.oobAccuracy.toFixed(3) : "Off"}</strong>
              </label>
              <label>
                Feature Sample Rate
                <input
                  aria-label="Feature Sample Rate numeric"
                  type="number"
                  min=".1"
                  max="1"
                  step=".01"
                  value={featureRate}
                  onChange={(event) =>
                    setFeatureRate(Number(event.target.value))
                  }
                />
              </label>
              <input
                aria-label="Feature Sample Rate slider"
                type="range"
                min=".1"
                max="1"
                step=".01"
                value={featureRate}
                onChange={(event) => setFeatureRate(Number(event.target.value))}
              />
              <div>
                <span>0.1</span>
                <span>1.0</span>
              </div>
              <label>
                View Sampling For
                <select
                  aria-label="View Sampling For"
                  value={sampleTree}
                  onChange={(event) =>
                    setSampleTree(Number(event.target.value))
                  }
                >
                  {Array.from(
                    { length: Math.min(estimators, 20) },
                    (_, index) => (
                      <option key={index} value={index + 1}>
                        Tree {index + 1}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <div className="rfc-sample-buttons">
                <button
                  className={sampleMode === "inbag" ? "active" : ""}
                  onClick={() => setSampleMode("inbag")}
                >
                  In-Bag Samples
                </button>
                <button
                  className={sampleMode === "oob" ? "active" : ""}
                  onClick={() => setSampleMode("oob")}
                >
                  OOB Samples
                </button>
              </div>
              <small className="rfc-sample-count">
                Tree {sampleTree}: {sampleCount ?? 0}{" "}
                {sampleMode === "inbag" ? "draws" : "held-out rows"}
              </small>
            </section>
            <button className="rfc-reset" onClick={reset}>
              <RefreshCw /> Reset Forest
            </button>
          </aside>
        </div>
      </main>
      {toast && (
        <div className="rfc-toast" onClick={() => setToast("")}>
          {toast}
        </div>
      )}
    </div>
  );
}
