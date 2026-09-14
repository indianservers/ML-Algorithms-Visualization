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
  GitBranch,
  Lightbulb,
  Moon,
  Network,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react";
import { irisDataset } from "../../../../data/sampleDatasets";
import {
  buildDecisionTree,
  predictTree,
  treeDepth,
  type SplitCriterion,
  type TreeNode,
} from "../../../../lib/algorithms/classification/decisionTree";
import "./DecisionTreeClassificationPage.css";

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
type DisplayNode = TreeNode & { pruned?: boolean };
const COLORS = ["#85dd54", "#32ced1", "#a85ce4"];
const FILLS = ["#315d27", "#17636c", "#50336f"];
const NAMES = ["setosa", "versicolor", "virginica"];
const FEATURES = [
  "sepal length (cm)",
  "sepal width (cm)",
  "petal length (cm)",
  "petal width (cm)",
];
const SHORT = ["sepal length", "sepal width", "petal length", "petal width"];
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "learn", label: "Learn", icon: <BookOpen /> },
  { id: "visualize", label: "Visualize", icon: <Sparkles /> },
  { id: "dataset", label: "Dataset", icon: <Database /> },
  { id: "train", label: "Train", icon: <Play /> },
  { id: "metrics", label: "Metrics", icon: <BarChart3 /> },
  { id: "compare", label: "Compare", icon: <Network /> },
  { id: "explain", label: "Explain", icon: <FileText /> },
];
const seedRows = () =>
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
function balancedIris(): Row[] {
  const seeds = seedRows();
  return [0, 1, 2].flatMap((label) => {
    const group = seeds.filter((row) => row.label === label);
    return Array.from({ length: 50 }, (_, index) => ({
      features: group[index % group.length].features.map(
        (value, feature) =>
          value +
          Math.sin((index + 2) * (feature + 1) * 1.31) *
            [0.35, 0.25, 0.32, 0.22][feature] +
          (index % 5 === 0 && label === 1
            ? [0, 0, 0.72, 0.32][feature]
            : index % 5 === 0 && label === 2
              ? [0, 0, -0.72, -0.32][feature]
              : 0),
      ),
      label,
    }));
  });
}
const BASE = balancedIris();
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
      const shift = row.label * 1.25;
      return {
        features: row.features.map(
          (value, feature) =>
            value +
            shift * (feature % 2 ? 0.45 : 1) +
            Math.cos(index * (feature + 1)) * 0.08,
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
  iris: "Iris (Fisher's Iris Dataset)",
  wine: "Wine Classification",
  seeds: "Wheat Seeds",
  synthetic: "Synthetic Classes",
  imported: "Imported CSV",
};
const majority = (node: TreeNode) =>
  Number(
    Object.entries(node.classCounts ?? { 0: 1 }).reduce((best, item) =>
      item[1] > best[1] ? item : best,
    )[0],
  );
function prune(node: TreeNode, alpha: number): DisplayNode {
  if (node.classLabel !== undefined || !node.left || !node.right)
    return { ...node };
  const left = prune(node.left, alpha),
    right = prune(node.right, alpha),
    n = node.samples ?? 1;
  const gain =
    (node.impurity ?? 0) -
    ((node.left.samples ?? 0) / n) * (node.left.impurity ?? 0) -
    ((node.right.samples ?? 0) / n) * (node.right.impurity ?? 0);
  if (gain < alpha)
    return {
      samples: node.samples,
      impurity: node.impurity,
      classCounts: node.classCounts,
      classLabel: majority(node),
      pruned: true,
    };
  return { ...node, left, right };
}
const leaves = (node: TreeNode): number =>
  node.classLabel !== undefined
    ? 1
    : (node.left ? leaves(node.left) : 0) +
      (node.right ? leaves(node.right) : 0);
const nodes = (node: TreeNode): number =>
  1 + (node.left ? nodes(node.left) : 0) + (node.right ? nodes(node.right) : 0);
function flatten(
  node: DisplayNode,
  result: {
    node: DisplayNode;
    depth: number;
    order: number;
    parent?: number;
    side?: "left" | "right";
  }[] = [],
  depth = 0,
  parent?: number,
  side?: "left" | "right",
) {
  const index = result.length;
  result.push({ node, depth, order: 0, parent, side });
  if (node.left)
    flatten(node.left as DisplayNode, result, depth + 1, index, "left");
  if (node.right)
    flatten(node.right as DisplayNode, result, depth + 1, index, "right");
  const atDepth = result.filter((item) => item.depth === depth);
  result[index].order = atDepth.indexOf(result[index]);
  return result;
}
function pathFor(
  node: TreeNode,
  query: number[],
  result: TreeNode[] = [],
): TreeNode[] {
  result.push(node);
  if (node.classLabel !== undefined) return result;
  return pathFor(
    query[node.featureIndex!] <= node.threshold! ? node.left! : node.right!,
    query,
    result,
  );
}
function importance(node: TreeNode, total: number, values = Array(4).fill(0)) {
  if (node.classLabel !== undefined || !node.left || !node.right) return values;
  const n = node.samples ?? 0;
  values[node.featureIndex!] +=
    Math.max(
      0,
      n * (node.impurity ?? 0) -
        (node.left.samples ?? 0) * (node.left.impurity ?? 0) -
        (node.right.samples ?? 0) * (node.right.impurity ?? 0),
    ) / total;
  importance(node.left, total, values);
  importance(node.right, total, values);
  return values;
}

function TreeView({
  root,
  showCounts,
  showImpurity,
  path,
  animate,
}: {
  root: DisplayNode;
  showCounts: boolean;
  showImpurity: boolean;
  path: Set<TreeNode>;
  animate: boolean;
}) {
  const flat = flatten(root);
  const maxDepth = Math.max(...flat.map((item) => item.depth));
  const positions = flat.map((item, index) => {
    const row = flat.filter((other) => other.depth === item.depth);
    return {
      ...item,
      index,
      x: 55 + (item.order + 0.5) * (490 / row.length),
      y: 33 + item.depth * (maxDepth > 2 ? 92 : 110),
    };
  });
  return (
    <svg
      className={`dt-tree-svg ${animate ? "animate" : ""}`}
      viewBox="0 0 600 390"
    >
      {positions.map((item) =>
        item.parent === undefined
          ? null
          : (() => {
              const parent = positions[item.parent!];
              return (
                <g key={`e${item.index}`}>
                  <line
                    x1={parent.x}
                    y1={parent.y + 27}
                    x2={item.x}
                    y2={item.y - 27}
                    stroke={
                      path.has(item.node)
                        ? COLORS[1]
                        : item.side === "left"
                          ? COLORS[0]
                          : "#ff5e6b"
                    }
                    strokeWidth={path.has(item.node) ? 2.2 : 1.3}
                  />
                  <text
                    x={
                      (parent.x + item.x) / 2 +
                      (item.side === "left" ? -12 : 12)
                    }
                    y={(parent.y + item.y) / 2 - 5}
                    fill={item.side === "left" ? COLORS[0] : "#ff6c78"}
                    fontSize="9"
                  >
                    {item.side === "left" ? "True" : "False"}
                  </text>
                </g>
              );
            })(),
      )}
      {positions.map((item) => {
        const leaf = item.node.classLabel !== undefined,
          label = leaf ? item.node.classLabel! : majority(item.node),
          active = path.has(item.node);
        return (
          <g
            key={item.index}
            transform={`translate(${item.x - 58} ${item.y - 27})`}
          >
            <rect
              width="116"
              height="55"
              rx="7"
              fill={leaf ? `${COLORS[label]}17` : "#0b1930"}
              stroke={active ? "#f6b941" : leaf ? COLORS[label] : "#7d9ccb"}
              strokeWidth={active ? 2 : 1.4}
            />
            {leaf ? (
              <>
                <text
                  x="58"
                  y="15"
                  textAnchor="middle"
                  fill="#d9e3f4"
                  fontSize="9"
                >
                  {showImpurity &&
                    `gini = ${(item.node.impurity ?? 0).toFixed(3)}`}
                </text>
                <text
                  x="58"
                  y="30"
                  textAnchor="middle"
                  fill="#d9e3f4"
                  fontSize="9"
                >
                  {showCounts && `samples = ${item.node.samples}`}
                </text>
                <text
                  x="58"
                  y="45"
                  textAnchor="middle"
                  fill={COLORS[label]}
                  fontSize="9"
                >
                  class = {NAMES[label]} ●
                </text>
              </>
            ) : (
              <>
                <text
                  x="58"
                  y="15"
                  textAnchor="middle"
                  fill="#e8eefb"
                  fontSize="9"
                  fontWeight="700"
                >
                  {FEATURES[item.node.featureIndex!]}
                </text>
                <text
                  x="58"
                  y="29"
                  textAnchor="middle"
                  fill="#dce5f6"
                  fontSize="9"
                >
                  ≤ {item.node.threshold?.toFixed(2)}
                </text>
                <text
                  x="58"
                  y="42"
                  textAnchor="middle"
                  fill="#a5b4ca"
                  fontSize="8"
                >
                  {showImpurity && `${item.node.impurity?.toFixed(3)} gini`}{" "}
                  {showCounts && `· ${item.node.samples} samples`}
                </text>
              </>
            )}
          </g>
        );
      })}
      <g transform="translate(150 373)">
        {NAMES.map((name, index) => (
          <g key={name} transform={`translate(${index * 110} 0)`}>
            <circle r="5" fill={COLORS[index]} />
            <text x="10" y="4" fill="#d0d9e8" fontSize="9">
              {name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function DecisionTreeClassificationPage() {
  const [tab, setTab] = useState<TabId>("visualize"),
    [datasetId, setDatasetId] = useState<DatasetId>("iris");
  const [rows, setRows] = useState<Row[]>(
      BASE.map((row) => ({ features: [...row.features], label: row.label })),
    ),
    [imported, setImported] = useState<Row[]>([]);
  const [maxDepth, setMaxDepth] = useState(3),
    [minSplit, setMinSplit] = useState(2),
    [minLeaf, setMinLeaf] = useState(1);
  const [criterion, setCriterion] = useState<SplitCriterion>("gini"),
    [alpha, setAlpha] = useState(0),
    [appliedAlpha, setAppliedAlpha] = useState(0);
  const [showCounts, setShowCounts] = useState(true),
    [showImpurity, setShowImpurity] = useState(true),
    [animate, setAnimate] = useState(true);
  const [axes, setAxes] = useState<[number, number]>([2, 3]),
    [query, setQuery] = useState([5.8, 2.7, 4.2, 1.3]),
    [trained, setTrained] = useState("Ready"),
    [toast, setToast] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null),
    X = useMemo(() => rows.map((row) => row.features), [rows]),
    y = useMemo(() => rows.map((row) => row.label), [rows]);
  const rawTree = useMemo(
    () =>
      buildDecisionTree(
        X,
        y,
        maxDepth,
        Math.max(minLeaf, Math.ceil(minSplit / 2)),
        criterion,
      ),
    [X, y, maxDepth, minLeaf, minSplit, criterion],
  );
  const tree = useMemo(
    () => prune(rawTree, appliedAlpha),
    [rawTree, appliedAlpha],
  );
  const prediction = predictTree(tree, query),
    path = new Set(pathFor(tree, query));
  const predicted = useMemo(
    () => X.map((row) => predictTree(tree, row)),
    [X, tree],
  );
  const confusion = useMemo(
    () =>
      Array.from({ length: 3 }, (_, a) =>
        Array.from(
          { length: 3 },
          (_, p) =>
            predicted.filter((value, index) => y[index] === a && value === p)
              .length,
        ),
      ),
    [predicted, y],
  );
  const classMetrics = [0, 1, 2].map((label) => {
    const tp = confusion[label][label],
      fp = confusion.reduce(
        (sum, row, index) => sum + (index === label ? 0 : row[label]),
        0,
      ),
      fn = confusion[label].reduce(
        (sum, value, index) => sum + (index === label ? 0 : value),
        0,
      ),
      precision = tp / (tp + fp) || 0,
      recall = tp / (tp + fn) || 0;
    return {
      precision,
      recall,
      f1:
        precision + recall
          ? (2 * precision * recall) / (precision + recall)
          : 0,
    };
  });
  const accuracy =
      predicted.filter((value, index) => value === y[index]).length / y.length,
    importances = importance(tree, rows.length),
    impTotal = importances.reduce((a, b) => a + b, 0) || 1;
  const region = useMemo(() => {
    const xs = X.map((row) => row[axes[0]]),
      ys = X.map((row) => row[axes[1]]),
      x0 = Math.min(...xs) - 0.3,
      x1 = Math.max(...xs) + 0.3,
      y0 = Math.min(...ys) - 0.2,
      y1 = Math.max(...ys) + 0.2,
      cols = 38,
      lines = 24,
      cells = [] as { x: number; y: number; label: number }[];
    for (let j = 0; j < lines; j++)
      for (let i = 0; i < cols; i++) {
        const sample = query.slice();
        sample[axes[0]] = x0 + ((i + 0.5) / cols) * (x1 - x0);
        sample[axes[1]] = y0 + ((j + 0.5) / lines) * (y1 - y0);
        cells.push({ x: i, y: j, label: predictTree(tree, sample) });
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
  }, [X, axes, query, rows, tree]);
  const splitRows = flatten(tree)
    .filter((item) => item.node.classLabel === undefined)
    .slice(0, 4);
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
    setMaxDepth(3);
    setMinSplit(2);
    setMinLeaf(1);
    setCriterion("gini");
    setAlpha(0);
    setAppliedAlpha(0);
    setShowCounts(true);
    setShowImpurity(true);
    setAnimate(true);
    setAxes([2, 3]);
    setQuery([5.8, 2.7, 4.2, 1.3]);
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

  const visualize = (
    <>
      <div className="dt-upper">
        <section className="dt-tree-card">
          <h2>
            Decision Tree <span>Depth {treeDepth(tree)}</span>
          </h2>
          <TreeView
            root={tree}
            showCounts={showCounts}
            showImpurity={showImpurity}
            path={path}
            animate={animate}
          />
        </section>
        <section className="dt-region-card">
          <h2>
            Decision Regions <small>(feature space)</small>
            <select
              aria-label="Region X axis"
              value={axes[0]}
              onChange={(event) =>
                setAxes([Number(event.target.value), axes[1]])
              }
            >
              {FEATURES.map((name, index) => (
                <option value={index} key={name}>
                  X: {name}
                </option>
              ))}
            </select>
          </h2>
          <div className="dt-region">
            {region.cells.map((cell, index) => (
              <i
                key={index}
                style={{
                  left: `${(cell.x / region.cols) * 100}%`,
                  top: `${((region.lines - 1 - cell.y) / region.lines) * 100}%`,
                  width: `${100 / region.cols + 0.15}%`,
                  height: `${100 / region.lines + 0.15}%`,
                  background: FILLS[cell.label],
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
            <span className="x-label">{FEATURES[axes[0]]}</span>
            <span className="y-label">{FEATURES[axes[1]]}</span>
          </div>
          <p>
            Background shows predicted class for any point in the feature space.
          </p>
        </section>
      </div>
      <div className="dt-lower">
        <article>
          <h3>CLASS PERFORMANCE</h3>
          <div className="dt-perf-head">
            <span>Class</span>
            <span>Precision</span>
            <span>Recall</span>
            <span>F1-Score</span>
          </div>
          {classMetrics.map((metric, label) => (
            <p key={label}>
              <span>
                <i style={{ background: COLORS[label] }} />
                {NAMES[label]}
              </span>
              <b>{metric.precision.toFixed(2)}</b>
              <b>{metric.recall.toFixed(2)}</b>
              <b>{metric.f1.toFixed(2)}</b>
            </p>
          ))}
          <p>
            <span>Macro Avg</span>
            <b>
              {(classMetrics.reduce((s, m) => s + m.precision, 0) / 3).toFixed(
                2,
              )}
            </b>
            <b>
              {(classMetrics.reduce((s, m) => s + m.recall, 0) / 3).toFixed(2)}
            </b>
            <b>{(classMetrics.reduce((s, m) => s + m.f1, 0) / 3).toFixed(2)}</b>
          </p>
        </article>
        <article>
          <h3>CONFUSION MATRIX ({rows.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Actual \ Pred</th>
                {NAMES.map((name) => (
                  <th key={name}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {confusion.map((line, index) => (
                <tr key={index}>
                  <th>{NAMES[index]}</th>
                  {line.map((value, j) => (
                    <td
                      key={j}
                      style={{
                        background:
                          index === j
                            ? `${COLORS[index]}55`
                            : value
                              ? "#341c35"
                              : "transparent",
                      }}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </article>
        <article>
          <h3>SPLIT SEQUENCE</h3>
          {splitRows.map((item, index) => (
            <p key={index}>
              <b>{index + 1}</b>
              <span>
                {SHORT[item.node.featureIndex!]} ≤{" "}
                {item.node.threshold?.toFixed(2)}
              </span>
              <em>gain = {(item.node.impurity ?? 0).toFixed(3)}</em>
            </p>
          ))}
          <button onClick={() => setTab("explain")}>
            View full tree <ChevronRight />
          </button>
        </article>
        <article>
          <h3>FEATURE IMPORTANCE</h3>
          {importances.map((value, index) => (
            <p key={index}>
              <span>{FEATURES[index]}</span>
              <i>
                <b style={{ width: `${(value / impTotal) * 100}%` }} />
              </i>
              <em>{(value / impTotal).toFixed(2)}</em>
            </p>
          ))}
        </article>
      </div>
    </>
  );
  const panel = () => {
    if (tab === "visualize" || tab === "learn") return visualize;
    if (tab === "dataset")
      return (
        <section className="dt-generic dt-data">
          <div className="dt-section-title">
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
            Edit samples directly; the CART tree, regions, confusion matrix, and
            importance update immediately.
          </p>
          <div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {SHORT.map((name) => (
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
                        <option value="0">setosa</option>
                        <option value="1">versicolor</option>
                        <option value="2">virginica</option>
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
        <section className="dt-generic dt-train">
          <GitBranch />
          <h2>Grow a CART classification tree</h2>
          <p>
            Every possible feature threshold is evaluated with the selected
            impurity criterion. The best split is applied recursively until the
            stopping controls are reached.
          </p>
          <div>
            <article>
              <b>{rows.length}</b>
              <span>Training samples</span>
            </article>
            <article>
              <b>{nodes(tree)}</b>
              <span>Tree nodes</span>
            </article>
            <article>
              <b>{leaves(tree)}</b>
              <span>Leaves</span>
            </article>
            <article>
              <b>{(accuracy * 100).toFixed(1)}%</b>
              <span>Accuracy</span>
            </article>
          </div>
          <button
            onClick={() => {
              setTrained(
                `Trained ${nodes(tree)} nodes at depth ${treeDepth(tree)}`,
              );
              setToast("Decision tree retrained");
            }}
          >
            <Play /> Train / Retrain Tree
          </button>
          <small>{trained}</small>
        </section>
      );
    if (tab === "metrics")
      return (
        <section className="dt-generic">
          <div className="dt-section-title">
            <span>
              <BarChart3 /> Classification Metrics
            </span>
          </div>
          <div className="dt-metric-grid">
            <article>
              <b>{(accuracy * 100).toFixed(1)}%</b>
              <span>Accuracy</span>
            </article>
            <article>
              <b>{treeDepth(tree)}</b>
              <span>Tree depth</span>
            </article>
            <article>
              <b>{leaves(tree)}</b>
              <span>Leaf nodes</span>
            </article>
            <article>
              <b>{(tree.impurity ?? 0).toFixed(3)}</b>
              <span>Root impurity</span>
            </article>
          </div>
          {visualize.props.children[1]}
        </section>
      );
    if (tab === "compare")
      return (
        <section className="dt-generic">
          <div className="dt-section-title">
            <span>
              <Network /> Criterion Comparison
            </span>
          </div>
          <div className="dt-compare">
            {(["gini", "entropy"] as SplitCriterion[]).map((value) => {
              const candidate = buildDecisionTree(
                  X,
                  y,
                  maxDepth,
                  Math.max(minLeaf, Math.ceil(minSplit / 2)),
                  value,
                ),
                score =
                  X.filter(
                    (row, index) => predictTree(candidate, row) === y[index],
                  ).length / y.length;
              return (
                <article
                  key={value}
                  className={criterion === value ? "active" : ""}
                  onClick={() => setCriterion(value)}
                >
                  <GitBranch />
                  <h3>{value}</h3>
                  <b>{(score * 100).toFixed(1)}% accuracy</b>
                  <span>
                    {nodes(candidate)} nodes · {leaves(candidate)} leaves
                  </span>
                  <button>Use criterion</button>
                </article>
              );
            })}
          </div>
        </section>
      );
    return (
      <section className="dt-generic dt-explain">
        <div className="dt-section-title">
          <span>
            <FileText /> Prediction Path
          </span>
        </div>
        <div className="dt-query">
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
        <div className="dt-path">
          {[...path].map((node, index) => (
            <article key={index}>
              <b>{index + 1}</b>
              {node.classLabel !== undefined ? (
                <span>Leaf → {NAMES[node.classLabel]}</span>
              ) : (
                <span>
                  {SHORT[node.featureIndex!]} (
                  {query[node.featureIndex!].toFixed(2)}){" "}
                  {query[node.featureIndex!] <= node.threshold! ? "≤" : "＞"}{" "}
                  {node.threshold?.toFixed(2)}
                </span>
              )}
            </article>
          ))}
        </div>
      </section>
    );
  };
  return (
    <div className="dt-page">
      <aside className="dt-nav">
        <Link className="dt-brand" to="/">
          <i>
            <BrainCircuit />
          </i>
          <span>
            <b>Mega ML</b>
            <small>AI Observatory</small>
          </span>
        </Link>
        <h3>LESSONS</h3>
        <button>
          <CircleHelp />
          0. Welcome
        </button>
        <button>
          <BookOpen />
          1. Decision Trees 101
          <ChevronDown />
        </button>
        <button className="open">
          <GitBranch />
          2. Building a Tree
          <ChevronDown />
        </button>
        <div>
          {[
            "2.1 How Splits Work",
            "2.2 Impurity & Information Gain",
            "2.3 Stopping Criteria",
            "2.4 Decision Tree Classification",
          ].map((name) => (
            <span className={name.startsWith("2.4") ? "active" : ""} key={name}>
              {name}
            </span>
          ))}
        </div>
        {[
          "3. Overfitting & Pruning",
          "4. Hyperparameters",
          "5. Interpretability",
          "6. Beyond Single Trees",
          "7. Next Steps",
        ].map((name) => (
          <button key={name}>
            <Network />
            {name}
            <ChevronRight />
          </button>
        ))}
        <section>
          <h3>COURSE PROGRESS</h3>
          <div>
            <b>42%</b>
            <i />
          </div>
          <p>12 / 28 Lessons Completed</p>
          <button>View Roadmap</button>
        </section>
      </aside>
      <main>
        <header className="dt-header">
          <div>
            <p>
              SUPERVISED LEARNING <span>›</span> DECISION TREE
            </p>
            <section>
              <i>
                <GitBranch />
              </i>
              <div>
                <h1>Decision Tree Classification</h1>
                <span>
                  Learn how decision trees split the feature space to predict
                  discrete class labels.
                </span>
              </div>
            </section>
          </div>
          <aside>
            <span>Lesson Progress</span>
            <i>
              <b />
            </i>
            <strong>62%</strong>
            <button>
              Resume <Play />
            </button>
            <CircleHelp />
            <button aria-label="Theme">
              <Sun />
              <Moon />
            </button>
          </aside>
        </header>
        <nav className="dt-tabs">
          {TABS.map((item) => (
            <button
              className={tab === item.id ? "active" : ""}
              key={item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="dt-workspace">
          <div className="dt-main">
            <section className="dt-dataset">
              <b>DATASET</b>
              <label>
                <span>🔮</span>
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
              </label>
              <span>{rows.length} samples • 4 features • 3 classes</span>
              <button onClick={reset}>Reset Dataset</button>
              <button onClick={() => uploadRef.current?.click()}>
                <Upload /> Upload CSV
              </button>
              <input
                ref={uploadRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={upload}
              />
            </section>
            {panel()}
            <section className="dt-hint">
              <CircleHelp />
              Decision trees create axis-aligned splits that partition the
              feature space into rectangles, assigning a class to each region.
              <span>
                <Lightbulb /> Need a hint?{" "}
                <button onClick={() => setTab("explain")}>
                  Show me how this tree was built
                </button>
              </span>
            </section>
          </div>
          <aside className="dt-controls">
            <section>
              <h3>TREE CONTROLS</h3>
              <label>
                Max Depth
                <input
                  aria-label="Max Depth numeric"
                  type="number"
                  min="1"
                  max="10"
                  value={maxDepth}
                  onChange={(event) => setMaxDepth(Number(event.target.value))}
                />
              </label>
              <input
                aria-label="Max Depth slider"
                type="range"
                min="1"
                max="10"
                value={maxDepth}
                onChange={(event) => setMaxDepth(Number(event.target.value))}
              />
              <div>
                <span>1</span>
                <span>10</span>
              </div>
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
              <label>
                Min Samples Leaf
                <input
                  aria-label="Min Samples Leaf numeric"
                  type="number"
                  min="1"
                  max="20"
                  value={minLeaf}
                  onChange={(event) => setMinLeaf(Number(event.target.value))}
                />
              </label>
              <input
                aria-label="Min Samples Leaf slider"
                type="range"
                min="1"
                max="20"
                value={minLeaf}
                onChange={(event) => setMinLeaf(Number(event.target.value))}
              />
              <div>
                <span>1</span>
                <span>20</span>
              </div>
              <select
                aria-label="Criterion"
                value={criterion}
                onChange={(event) =>
                  setCriterion(event.target.value as SplitCriterion)
                }
              >
                <option value="gini">Criterion (Gini)</option>
                <option value="entropy">Criterion (Entropy)</option>
              </select>
            </section>
            <section className="dt-gauge">
              <h3>IMPURITY ({criterion.toUpperCase()})</h3>
              <div>
                <i />
                <b>{(tree.impurity ?? 0).toFixed(3)}</b>
                <span>Weighted Avg. {criterion}</span>
              </div>
              <footer>
                <span>
                  0<br />
                  <small>Pure</small>
                </span>
                <span>
                  0.5
                  <br />
                  <small>More Impure</small>
                </span>
              </footer>
            </section>
            <section className="dt-prune">
              <h3>PRUNING</h3>
              <label>
                Cost Complexity (α)
                <input
                  aria-label="Cost Complexity numeric"
                  type="number"
                  min="0"
                  max=".05"
                  step=".001"
                  value={alpha}
                  onChange={(event) => setAlpha(Number(event.target.value))}
                />
              </label>
              <input
                aria-label="Cost Complexity slider"
                type="range"
                min="0"
                max=".05"
                step=".001"
                value={alpha}
                onChange={(event) => setAlpha(Number(event.target.value))}
              />
              <div>
                <span>0.000</span>
                <span>0.050</span>
              </div>
              <button onClick={() => setAppliedAlpha(alpha)}>
                Apply Pruning
              </button>
            </section>
            <button
              className="dt-retrain"
              onClick={() => {
                setTrained(`Trained ${nodes(tree)} nodes`);
                setToast("Tree retrained");
              }}
            >
              <RefreshCw /> Retrain Tree
            </button>
            <section className="dt-options">
              <h3>TREE OPTIONS</h3>
              <label>
                Show Sample Counts
                <button
                  className={showCounts ? "on" : ""}
                  onClick={() => setShowCounts((value) => !value)}
                >
                  <i />
                </button>
              </label>
              <label>
                Show Impurity
                <button
                  className={showImpurity ? "on" : ""}
                  onClick={() => setShowImpurity((value) => !value)}
                >
                  <i />
                </button>
              </label>
              <label>
                Animate Splits
                <button
                  className={animate ? "on" : ""}
                  onClick={() => setAnimate((value) => !value)}
                >
                  <i />
                </button>
              </label>
            </section>
          </aside>
        </div>
      </main>
      {toast && <div className="dt-toast">{toast}</div>}
    </div>
  );
}
