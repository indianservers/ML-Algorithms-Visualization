import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BarChart3,
  Bookmark,
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Crosshair,
  Database,
  FileText,
  FlaskConical,
  Home,
  Lightbulb,
  Minus,
  Moon,
  Network,
  Play,
  Plus,
  RotateCcw,
  Share2,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import { knnPredict } from "../../../../lib/algorithms/classification/knn";
import "./KNNClassificationPage.css";

type DistanceMetric = "euclidean" | "manhattan" | "cosine";
type TabId =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
type DatasetId = "iris" | "blobs" | "wine" | "moons" | "imported";
type Point = { x: number; y: number; label: number };

const COLORS = ["#3b82f6", "#ec4899", "#22c55e"];
const FILLS = ["#122b5b", "#3a153e", "#103b35"];
const IRIS_NAMES = ["Setosa", "Versicolor", "Virginica"];
const GENERIC_NAMES = ["Class A", "Class B", "Class C"];
const seeded = (seed: number) => {
  const value = Math.sin(seed * 999.91) * 43758.5453;
  return value - Math.floor(value);
};
function cloud(
  cx: number,
  cy: number,
  label: number,
  count: number,
  seed: number,
  sx: number,
  sy: number,
): Point[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = seeded(seed + index * 3) * Math.PI * 2;
    const radius = Math.sqrt(seeded(seed + index * 3 + 1));
    return {
      x:
        cx +
        Math.cos(angle) * radius * sx +
        (seeded(seed + index * 3 + 2) - 0.5) * sx * 0.25,
      y: cy + Math.sin(angle) * radius * sy,
      label,
    };
  });
}
function irisData(): Point[] {
  return [
    ...cloud(1.55, 0.28, 0, 50, 4, 0.62, 0.2),
    ...cloud(4.35, 1.34, 1, 50, 108, 1.12, 0.5),
    ...cloud(5.45, 2.02, 2, 50, 212, 1.25, 0.52),
  ];
}
function blobData(): Point[] {
  return [
    ...cloud(-2.3, -1.1, 0, 30, 13, 1.25, 1.05),
    ...cloud(2.1, -0.2, 1, 30, 67, 1.25, 1.1),
    ...cloud(-0.2, 2.6, 2, 30, 121, 1.25, 1.05),
  ];
}
function wineData(): Point[] {
  return [
    ...cloud(13.7, 2.1, 0, 30, 26, 0.7, 0.7),
    ...cloud(12.4, 2.7, 1, 30, 80, 0.75, 0.75),
    ...cloud(13.1, 3.9, 2, 30, 134, 0.7, 0.85),
  ];
}
function moonData(): Point[] {
  return Array.from({ length: 90 }, (_, index) => {
    const label = index % 3;
    const step = Math.floor(index / 3);
    const angle = (step / 29) * Math.PI;
    const jitter = (seeded(index + 81) - 0.5) * 0.12;
    if (label === 0)
      return { x: Math.cos(angle) * 2, y: Math.sin(angle) + jitter, label };
    if (label === 1)
      return {
        x: 1.1 - Math.cos(angle) * 2,
        y: 0.45 - Math.sin(angle) + jitter,
        label,
      };
    return {
      x: Math.cos(angle) * 1.35 + 0.5,
      y: Math.sin(angle) * 0.7 + 1.15 + jitter,
      label,
    };
  });
}
const BUILT_INS: Record<Exclude<DatasetId, "imported">, Point[]> = {
  iris: irisData(),
  blobs: blobData(),
  wine: wineData(),
  moons: moonData(),
};
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "learn", label: "Learn", icon: <Lightbulb /> },
  { id: "visualize", label: "Visualize", icon: <Sparkles /> },
  { id: "dataset", label: "Dataset", icon: <Database /> },
  { id: "train", label: "Train", icon: <Play /> },
  { id: "metrics", label: "Metrics", icon: <BarChart3 /> },
  { id: "compare", label: "Compare", icon: <Network /> },
  { id: "explain", label: "Explain", icon: <FileText /> },
];
const clampOddK = (value: number, limit: number) => {
  const bounded = Math.max(1, Math.min(Math.min(15, limit), Math.round(value)));
  return bounded % 2 === 0 ? Math.max(1, bounded - 1) : bounded;
};
const pct = (value: number) => `${Math.round(value * 100)}%`;

export default function KNNClassificationPage() {
  const [tab, setTab] = useState<TabId>("learn");
  const [datasetId, setDatasetId] = useState<DatasetId>("iris");
  const [points, setPoints] = useState<Point[]>(
    BUILT_INS.iris.map((point) => ({ ...point })),
  );
  const [imported, setImported] = useState<Point[]>([]);
  const [k, setK] = useState(5);
  const [metric, setMetric] = useState<DistanceMetric>("euclidean");
  const [query, setQuery] = useState({ x: 4.4, y: 1.6 });
  const [radius, setRadius] = useState(1.3);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [tip, setTip] = useState(0);
  const [trainedAt, setTrainedAt] = useState(
    "Ready — KNN stores the current examples",
  );
  const [toast, setToast] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const trainX = useMemo(
    () => points.map((point) => [point.x, point.y]),
    [points],
  );
  const trainY = useMemo(() => points.map((point) => point.label), [points]);
  const safeK = Math.min(k, Math.max(1, points.length));
  const prediction = useMemo(
    () =>
      points.length
        ? knnPredict(trainX, trainY, [query.x, query.y], safeK, metric)
        : null,
    [metric, points.length, query.x, query.y, safeK, trainX, trainY],
  );
  const names = datasetId === "iris" ? IRIS_NAMES : GENERIC_NAMES;
  const domain = useMemo(() => {
    const xs = points.map((point) => point.x).concat(query.x);
    const ys = points.map((point) => point.y).concat(query.y);
    const xMin = Math.min(...xs),
      xMax = Math.max(...xs),
      yMin = Math.min(...ys),
      yMax = Math.max(...ys);
    const xPad = Math.max(0.4, (xMax - xMin) * 0.1),
      yPad = Math.max(0.25, (yMax - yMin) * 0.12);
    return {
      xMin: xMin - xPad,
      xMax: xMax + xPad,
      yMin: yMin - yPad,
      yMax: yMax + yPad,
    };
  }, [points, query.x, query.y]);
  const grid = useMemo(() => {
    if (!showBoundary || !points.length) return [];
    const columns = 39,
      rows = 21,
      xStep = (domain.xMax - domain.xMin) / columns,
      yStep = (domain.yMax - domain.yMin) / rows;
    const cells: { x: number; y: number; label: number }[] = [];
    for (let row = 0; row < rows; row += 1)
      for (let column = 0; column < columns; column += 1) {
        const x = domain.xMin + (column + 0.5) * xStep,
          y = domain.yMin + (row + 0.5) * yStep;
        cells.push({
          x: column,
          y: row,
          label: knnPredict(trainX, trainY, [x, y], safeK, metric)
            .predictedClass,
        });
      }
    return cells;
  }, [domain, metric, safeK, showBoundary, points.length, trainX, trainY]);
  const looAccuracy = useMemo(() => {
    if (points.length < 2) return 0;
    let correct = 0;
    points.forEach((point, index) => {
      const other = points.filter((_, itemIndex) => itemIndex !== index);
      const result = knnPredict(
        other.map((item) => [item.x, item.y]),
        other.map((item) => item.label),
        [point.x, point.y],
        Math.min(safeK, other.length),
        metric,
      );
      if (result.predictedClass === point.label) correct += 1;
    });
    return correct / points.length;
  }, [metric, points, safeK]);
  const votes = [0, 1, 2].map((label) => prediction?.votes[label] ?? 0);
  const winningVotes = prediction
    ? (prediction.votes[prediction.predictedClass] ?? 0)
    : 0;
  const confidence = prediction ? winningVotes / safeK : 0;
  const kthDistance = prediction?.neighbors.at(-1)?.distance ?? 0;
  const setDataset = (next: DatasetId) => {
    const source = next === "imported" ? imported : BUILT_INS[next];
    if (!source.length) return;
    setDatasetId(next);
    setPoints(source.map((point) => ({ ...point })));
    if (next === "iris") setQuery({ x: 4.4, y: 1.6 });
    else
      setQuery({
        x: source.reduce((sum, point) => sum + point.x, 0) / source.length,
        y: source.reduce((sum, point) => sum + point.y, 0) / source.length,
      });
    setTrainedAt("Ready — KNN stores the current examples");
  };
  const reset = () => {
    setDatasetId("iris");
    setPoints(BUILT_INS.iris.map((point) => ({ ...point })));
    setK(5);
    setMetric("euclidean");
    setQuery({ x: 4.4, y: 1.6 });
    setRadius(1.3);
    setShowBoundary(true);
    setShowLinks(true);
    setTrainedAt("Ready — KNN stores the current examples");
  };
  const train = () => {
    setTrainedAt(
      `Indexed ${points.length} samples • LOO accuracy ${pct(looAccuracy)}`,
    );
    setToast("KNN model updated from the live dataset");
    window.setTimeout(() => setToast(""), 1800);
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/);
    const parsed = lines
      .slice(1)
      .map((line) => line.split(","))
      .map((columns) => ({
        x: Number(columns[0]),
        y: Number(columns[1]),
        label: Math.max(0, Math.min(2, Number(columns[2]))),
      }))
      .filter(
        (point) =>
          Number.isFinite(point.x) &&
          Number.isFinite(point.y) &&
          Number.isInteger(point.label),
      );
    if (parsed.length < 3) {
      setToast("CSV needs x, y, class columns and at least 3 rows");
      return;
    }
    setImported(parsed);
    setDatasetId("imported");
    setPoints(parsed);
    setK(clampOddK(k, parsed.length));
    setQuery({
      x: parsed.reduce((sum, point) => sum + point.x, 0) / parsed.length,
      y: parsed.reduce((sum, point) => sum + point.y, 0) / parsed.length,
    });
    setToast(`Imported ${parsed.length} samples`);
    event.target.value = "";
  };
  const updatePoint = (index: number, key: keyof Point, value: number) =>
    setPoints((current) =>
      current.map((point, itemIndex) =>
        itemIndex === index
          ? {
              ...point,
              [key]:
                key === "label"
                  ? Math.max(0, Math.min(2, Math.round(value)))
                  : value,
            }
          : point,
      ),
    );
  const project = (point: { x: number; y: number }) => ({
    x: 48 + ((point.x - domain.xMin) / (domain.xMax - domain.xMin)) * 834,
    y: 374 - ((point.y - domain.yMin) / (domain.yMax - domain.yMin)) * 330,
  });
  const queryPixel = project(query),
    xScale = 834 / (domain.xMax - domain.xMin),
    yScale = 330 / (domain.yMax - domain.yMin);
  const plotClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * 930,
      svgY = ((event.clientY - rect.top) / rect.height) * 410;
    if (svgX < 48 || svgX > 882 || svgY < 44 || svgY > 374) return;
    setQuery({
      x: domain.xMin + ((svgX - 48) / 834) * (domain.xMax - domain.xMin),
      y: domain.yMin + ((374 - svgY) / 330) * (domain.yMax - domain.yMin),
    });
  };

  const mainPlot = (
    <section className="knn-plot-card">
      <div className="knn-card-title">
        <span>
          <Crosshair /> Feature Space
        </span>
        <small>Click anywhere to move the query point</small>
        <div className="knn-plot-legend">
          {[0, 1, 2].map((label) => (
            <i key={label}>
              <b style={{ background: COLORS[label] }} />
              {names[label]}
            </i>
          ))}
          <i>
            <b className="query-dot" />
            Query
          </i>
        </div>
      </div>
      <svg
        className="knn-chart"
        viewBox="0 0 930 410"
        onClick={plotClick}
        role="img"
        aria-label="Interactive KNN feature-space plot"
      >
        <defs>
          <clipPath id="knn-clip">
            <rect x="48" y="44" width="834" height="330" rx="4" />
          </clipPath>
        </defs>
        <rect
          x="48"
          y="44"
          width="834"
          height="330"
          rx="4"
          fill="#08162c"
          stroke="#284467"
        />
        <g clipPath="url(#knn-clip)">
          {grid.map((cell, index) => (
            <rect
              key={index}
              x={48 + cell.x * (834 / 39)}
              y={44 + (20 - cell.y) * (330 / 21)}
              width={834 / 39 + 0.6}
              height={330 / 21 + 0.6}
              fill={FILLS[cell.label]}
              opacity=".82"
            />
          ))}
          {Array.from({ length: 9 }, (_, index) => (
            <line
              key={`v${index}`}
              x1={48 + index * 104.25}
              x2={48 + index * 104.25}
              y1="44"
              y2="374"
              stroke="#28405f"
              strokeWidth=".8"
            />
          ))}
          {Array.from({ length: 7 }, (_, index) => (
            <line
              key={`h${index}`}
              x1="48"
              x2="882"
              y1={44 + index * 55}
              y2={44 + index * 55}
              stroke="#28405f"
              strokeWidth=".8"
            />
          ))}
          {showLinks &&
            prediction?.neighbors.map((neighbor) => {
              const target = project(points[neighbor.index]);
              return (
                <line
                  key={`link${neighbor.index}`}
                  x1={queryPixel.x}
                  y1={queryPixel.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="#e7f0ff"
                  strokeWidth="1.4"
                  opacity=".55"
                  strokeDasharray="5 4"
                />
              );
            })}
          <ellipse
            cx={queryPixel.x}
            cy={queryPixel.y}
            rx={Math.max(3, radius * xScale)}
            ry={Math.max(3, radius * yScale)}
            fill="none"
            stroke="#f7c948"
            strokeWidth="1.4"
            strokeDasharray="5 4"
            opacity=".65"
          />
          <ellipse
            cx={queryPixel.x}
            cy={queryPixel.y}
            rx={Math.max(3, kthDistance * xScale)}
            ry={Math.max(3, kthDistance * yScale)}
            fill="none"
            stroke="#7dd3fc"
            strokeWidth="1.7"
            opacity=".72"
          />
          {points.map((point, index) => {
            const pixel = project(point),
              neighbor = prediction?.neighbors.some(
                (item) => item.index === index,
              );
            return (
              <circle
                key={index}
                cx={pixel.x}
                cy={pixel.y}
                r={neighbor ? 6.6 : 4.3}
                fill={COLORS[point.label]}
                stroke={neighbor ? "#fff" : "#102344"}
                strokeWidth={neighbor ? 2 : 1}
                opacity=".95"
              >
                <title>{`${names[point.label]} · (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`}</title>
              </circle>
            );
          })}
          <circle
            cx={queryPixel.x}
            cy={queryPixel.y}
            r="11"
            fill={COLORS[prediction?.predictedClass ?? 0]}
            stroke="#fff"
            strokeWidth="2.5"
          />
          <path
            d={`M${queryPixel.x - 16},${queryPixel.y}h32M${queryPixel.x},${queryPixel.y - 16}v32`}
            stroke="#fff"
            strokeWidth="2"
          />
        </g>
        <text x="465" y="403" textAnchor="middle">
          Feature 1
        </text>
        <text x="15" y="210" textAnchor="middle" transform="rotate(-90 15 210)">
          Feature 2
        </text>
        <text x="48" y="393">
          {domain.xMin.toFixed(1)}
        </text>
        <text x="866" y="393">
          {domain.xMax.toFixed(1)}
        </text>
        <text x="26" y="374">
          {domain.yMin.toFixed(1)}
        </text>
        <text x="26" y="50">
          {domain.yMax.toFixed(1)}
        </text>
      </svg>
    </section>
  );

  const genericPanel = () => {
    if (tab === "dataset")
      return (
        <section className="knn-wide-card knn-dataset-card">
          <div className="knn-section-heading">
            <span>
              <Database /> Live Dataset
            </span>
            <button
              onClick={() =>
                setPoints((current) => [
                  ...current,
                  {
                    x: query.x,
                    y: query.y,
                    label: prediction?.predictedClass ?? 0,
                  },
                ])
              }
            >
              <Plus /> Add query
            </button>
          </div>
          <p>
            Edit any value, add the current query, or remove samples. Every
            prediction and metric updates immediately.
          </p>
          <div className="knn-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Feature 1</th>
                  <th>Feature 2</th>
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
                        aria-label={`Feature 1 row ${index + 1}`}
                        type="number"
                        step=".1"
                        value={Number(point.x.toFixed(3))}
                        onChange={(event) =>
                          updatePoint(index, "x", Number(event.target.value))
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Feature 2 row ${index + 1}`}
                        type="number"
                        step=".1"
                        value={Number(point.y.toFixed(3))}
                        onChange={(event) =>
                          updatePoint(index, "y", Number(event.target.value))
                        }
                      />
                    </td>
                    <td>
                      <select
                        aria-label={`Class row ${index + 1}`}
                        value={point.label}
                        onChange={(event) =>
                          updatePoint(
                            index,
                            "label",
                            Number(event.target.value),
                          )
                        }
                      >
                        <option value="0">{names[0]}</option>
                        <option value="1">{names[1]}</option>
                        <option value="2">{names[2]}</option>
                      </select>
                    </td>
                    <td>
                      <button
                        aria-label={`Remove row ${index + 1}`}
                        disabled={points.length <= 3}
                        onClick={() =>
                          setPoints((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Minus />
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
        <section className="knn-wide-card knn-train-card">
          <BrainCircuit />
          <h2>KNN is a lazy learner</h2>
          <p>
            There are no coefficients to optimize. Training validates and
            indexes the live samples; inference performs the real distance
            calculation when you move the query.
          </p>
          <div className="knn-training-flow">
            <b>
              1<span>Store {points.length} labeled samples</span>
            </b>
            <i>→</i>
            <b>
              2<span>Measure {metric} distance</span>
            </b>
            <i>→</i>
            <b>
              3<span>Vote among K = {safeK}</span>
            </b>
          </div>
          <button onClick={train}>
            <Play /> Train / Re-index Model
          </button>
          <small>{trainedAt}</small>
        </section>
      );
    if (tab === "metrics")
      return (
        <section className="knn-wide-card">
          <div className="knn-section-heading">
            <span>
              <BarChart3 /> Model Metrics
            </span>
          </div>
          <div className="knn-metric-grid">
            <article>
              <strong>{pct(looAccuracy)}</strong>
              <span>Leave-one-out accuracy</span>
            </article>
            <article>
              <strong>{pct(confidence)}</strong>
              <span>Query vote confidence</span>
            </article>
            <article>
              <strong>{kthDistance.toFixed(3)}</strong>
              <span>Kth-neighbor distance</span>
            </article>
            <article>
              <strong>{points.length}</strong>
              <span>Training samples</span>
            </article>
          </div>
          <div className="knn-class-bars">
            {[0, 1, 2].map((label) => {
              const count = points.filter(
                (point) => point.label === label,
              ).length;
              return (
                <div key={label}>
                  <span>{names[label]}</span>
                  <i>
                    <b
                      style={{
                        width: `${(count / points.length) * 100}%`,
                        background: COLORS[label],
                      }}
                    />
                  </i>
                  <em>{count}</em>
                </div>
              );
            })}
          </div>
        </section>
      );
    if (tab === "compare")
      return (
        <section className="knn-wide-card">
          <div className="knn-section-heading">
            <span>
              <Network /> Distance Comparison
            </span>
          </div>
          <div className="knn-compare-grid">
            {(["euclidean", "manhattan", "cosine"] as DistanceMetric[]).map(
              (option) => {
                const result = knnPredict(
                    trainX,
                    trainY,
                    [query.x, query.y],
                    safeK,
                    option,
                  ),
                  vote = result.votes[result.predictedClass] ?? 0;
                return (
                  <article
                    className={metric === option ? "active" : ""}
                    key={option}
                    onClick={() => setMetric(option)}
                  >
                    <Crosshair />
                    <h3>{option}</h3>
                    <strong style={{ color: COLORS[result.predictedClass] }}>
                      {names[result.predictedClass]}
                    </strong>
                    <span>
                      {vote}/{safeK} neighbor votes
                    </span>
                    <button>Use metric</button>
                  </article>
                );
              },
            )}
          </div>
        </section>
      );
    if (tab === "explain")
      return (
        <section className="knn-wide-card knn-explain-card">
          <div className="knn-section-heading">
            <span>
              <FileText /> How this prediction was made
            </span>
          </div>
          <div>
            <article>
              <b>01</b>
              <h3>Measure distance</h3>
              <p>
                The app calculates the {metric} distance from (
                {query.x.toFixed(2)}, {query.y.toFixed(2)}) to every live
                sample.
              </p>
            </article>
            <article>
              <b>02</b>
              <h3>Select neighbors</h3>
              <p>
                The {safeK} shortest distances are retained. The outer blue ring
                reaches the current Kth neighbor.
              </p>
            </article>
            <article>
              <b>03</b>
              <h3>Majority vote</h3>
              <p>
                {names[prediction?.predictedClass ?? 0]} wins with{" "}
                {winningVotes} of {safeK} votes, producing {pct(confidence)}{" "}
                confidence.
              </p>
            </article>
          </div>
        </section>
      );
    return mainPlot;
  };

  return (
    <div className="knn-page">
      <aside className="knn-nav">
        <Link className="knn-brand" to="/">
          <i>
            <BrainCircuit />
          </i>
          <span>
            <b>
              ML<span>Studio</span>
            </b>
            <small>Interactive Learning</small>
          </span>
        </Link>
        <h3>LESSON OUTLINE</h3>
        {TABS.map((item, index) => (
          <button
            key={item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            <i>{tab === item.id ? <Check /> : index + 1}</i>
            {item.label}
            <ChevronRight />
          </button>
        ))}
        <section className="knn-side-progress">
          <div className="knn-ring">
            <span>72%</span>
          </div>
          <div>
            <b>Lesson progress</b>
            <small>5 of 7 sections explored</small>
          </div>
        </section>
        <section className="knn-tip">
          <span>
            <Lightbulb /> QUICK TIP
          </span>
          <p>
            {
              [
                "Try an odd K to avoid tied votes.",
                "Click the chart to test a new point.",
                "Compare distance metrics on the same query.",
              ][tip]
            }
          </p>
          <footer>
            <button
              aria-label="Previous tip"
              onClick={() => setTip((value) => (value + 2) % 3)}
            >
              <ChevronLeft />
            </button>
            <i>{tip + 1} / 3</i>
            <button
              aria-label="Next tip"
              onClick={() => setTip((value) => (value + 1) % 3)}
            >
              <ChevronRight />
            </button>
          </footer>
        </section>
        <Link className="knn-home" to="/">
          <Home /> Back to Home
        </Link>
      </aside>
      <main>
        <header className="knn-header">
          <div>
            <p>
              SUPERVISED LEARNING <span>•</span> CLASSIFICATION
            </p>
            <h1>KNN Classification</h1>
          </div>
          <section>
            <div className="knn-mini-ring">
              <span>5/7</span>
            </div>
            <p>
              <b>Your Progress</b>
              <span>Two sections to mastery</span>
            </p>
          </section>
          <article>
            <Award />
            <p>
              <b>+25 XP</b>
              <span>Complete this lesson</span>
            </p>
          </article>
          <button
            aria-label="Bookmark lesson"
            onClick={() => setToast("Lesson bookmarked")}
          >
            <Bookmark />
          </button>
          <button
            aria-label="Share lesson"
            onClick={() => setToast("Share link copied")}
          >
            <Share2 />
          </button>
          <button
            aria-label="Toggle theme"
            onClick={() => setToast("Dark learning mode is active")}
          >
            <Moon />
          </button>
          <button aria-label="Lesson help" onClick={() => setTab("explain")}>
            <CircleHelp />
          </button>
        </header>
        <nav className="knn-tabs">
          <div>
            {TABS.map((item) => (
              <button
                key={item.id}
                className={tab === item.id ? "active" : ""}
                onClick={() => setTab(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
          <label>
            <Database />
            <select
              aria-label="Dataset"
              value={datasetId}
              onChange={(event) => setDataset(event.target.value as DatasetId)}
            >
              <option value="iris">Iris (2 Features)</option>
              <option value="blobs">Synthetic Blobs</option>
              <option value="wine">Wine Chemistry</option>
              <option value="moons">Three Moons</option>
              {imported.length > 0 && (
                <option value="imported">Imported CSV</option>
              )}
            </select>
          </label>
          <button
            className="knn-upload"
            onClick={() => uploadRef.current?.click()}
          >
            <Upload /> Upload
          </button>
          <input
            ref={uploadRef}
            type="file"
            accept=".csv,text/csv"
            onChange={upload}
            hidden
          />
        </nav>
        <div className="knn-workspace">
          <div className="knn-center">
            {genericPanel()}
            <div className="knn-lower">
              <article className="knn-neighbors">
                <h3>
                  <Target /> Nearest Neighbor Details <span>K = {safeK}</span>
                </h3>
                <div className="knn-neighbor-head">
                  <span>#</span>
                  <span>Class</span>
                  <span>Distance</span>
                  <span>Weight</span>
                </div>
                {prediction?.neighbors.slice(0, 5).map((neighbor, index) => (
                  <div key={neighbor.index}>
                    <i>{index + 1}</i>
                    <span>
                      <b style={{ background: COLORS[neighbor.label] }} />
                      {names[neighbor.label]}
                    </span>
                    <em>{neighbor.distance.toFixed(3)}</em>
                    <strong>
                      {(1 / (neighbor.distance + 0.01)).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </article>
              <article className="knn-vote">
                <h3>
                  <BarChart3 /> Majority Vote
                </h3>
                <div
                  className="knn-donut"
                  style={{
                    background: `conic-gradient(${COLORS[0]} 0 ${(votes[0] / safeK) * 100}%, ${COLORS[1]} ${(votes[0] / safeK) * 100}% ${((votes[0] + votes[1]) / safeK) * 100}%, ${COLORS[2]} ${((votes[0] + votes[1]) / safeK) * 100}% 100%)`,
                  }}
                >
                  <span>
                    <b>{names[prediction?.predictedClass ?? 0]}</b>
                    <small>
                      {winningVotes} / {safeK} votes
                    </small>
                  </span>
                </div>
                <div>
                  {votes.map((vote, label) => (
                    <i key={label}>
                      <b style={{ background: COLORS[label] }} />
                      {names[label]} <em>{vote}</em>
                    </i>
                  ))}
                </div>
              </article>
              <article className="knn-boundary">
                <h3>
                  <Network /> Decision Boundary
                </h3>
                <p>
                  <span className="region blue" /> Setosa region
                </p>
                <p>
                  <span className="region pink" /> Versicolor region
                </p>
                <p>
                  <span className="region green" /> Virginica region
                </p>
                <label>
                  <input
                    type="checkbox"
                    checked={showBoundary}
                    onChange={(event) => setShowBoundary(event.target.checked)}
                  />{" "}
                  Show class regions
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showLinks}
                    onChange={(event) => setShowLinks(event.target.checked)}
                  />{" "}
                  Connect neighbors
                </label>
              </article>
              <article className="knn-how">
                <h3>
                  <Lightbulb /> How to Explore
                </h3>
                <p>
                  <b>1</b> Click the plot to place a query.
                </p>
                <p>
                  <b>2</b> Change K and watch the vote.
                </p>
                <p>
                  <b>3</b> Compare distance metrics.
                </p>
                <button onClick={() => setTab("explain")}>
                  Open explanation <ChevronRight />
                </button>
              </article>
            </div>
          </div>
          <aside className="knn-controls">
            <div className="knn-controls-title">
              <FlaskConical />
              <span>
                <b>Experiment Controls</b>
                <small>Fine-tune your classifier</small>
              </span>
              <button aria-label="Reset experiment" onClick={reset}>
                <RotateCcw />
              </button>
            </div>
            <section>
              <h3>QUERY POINT</h3>
              <div className="knn-query-inputs">
                <label>
                  Feature X
                  <input
                    aria-label="Query X"
                    type="number"
                    step=".1"
                    value={Number(query.x.toFixed(2))}
                    onChange={(event) =>
                      setQuery((current) => ({
                        ...current,
                        x: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  Feature Y
                  <input
                    aria-label="Query Y"
                    type="number"
                    step=".1"
                    value={Number(query.y.toFixed(2))}
                    onChange={(event) =>
                      setQuery((current) => ({
                        ...current,
                        y: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              </div>
              <button
                className="knn-reset-point"
                onClick={() => setQuery({ x: 4.4, y: 1.6 })}
              >
                <Crosshair /> Reset Point
              </button>
            </section>
            <section>
              <h3>NUMBER OF NEIGHBORS (K)</h3>
              <div className="knn-stepper">
                <button
                  aria-label="Decrease K"
                  onClick={() =>
                    setK((value) => clampOddK(value - 2, points.length))
                  }
                >
                  <Minus />
                </button>
                <input
                  aria-label="K numeric"
                  type="number"
                  min="1"
                  max={Math.min(15, points.length)}
                  step="2"
                  value={safeK}
                  onChange={(event) =>
                    setK(clampOddK(Number(event.target.value), points.length))
                  }
                />
                <button
                  aria-label="Increase K"
                  onClick={() =>
                    setK((value) => clampOddK(value + 2, points.length))
                  }
                >
                  <Plus />
                </button>
              </div>
              <input
                aria-label="K slider"
                type="range"
                min="1"
                max={Math.min(15, points.length)}
                step="2"
                value={safeK}
                onChange={(event) =>
                  setK(clampOddK(Number(event.target.value), points.length))
                }
              />
              <div className="knn-range-label">
                <span>1</span>
                <b>K = {safeK}</b>
                <span>{Math.min(15, points.length)}</span>
              </div>
            </section>
            <section>
              <h3>DISTANCE METRIC</h3>
              <div className="knn-metric-options">
                {(["euclidean", "manhattan", "cosine"] as DistanceMetric[]).map(
                  (option) => (
                    <button
                      key={option}
                      className={metric === option ? "active" : ""}
                      onClick={() => setMetric(option)}
                    >
                      <i>{metric === option && <Check />}</i>
                      <span>
                        <b>{option[0].toUpperCase() + option.slice(1)}</b>
                        <small>
                          {option === "euclidean"
                            ? "Straight-line distance"
                            : option === "manhattan"
                              ? "Grid-based distance"
                              : "Angular similarity"}
                        </small>
                      </span>
                    </button>
                  ),
                )}
              </div>
            </section>
            <section>
              <h3>NEIGHBORHOOD RADIUS</h3>
              <div className="knn-radius-value">
                <span>Radius</span>
                <input
                  aria-label="Radius numeric"
                  type="number"
                  min=".2"
                  max="4"
                  step=".1"
                  value={radius}
                  onChange={(event) => setRadius(Number(event.target.value))}
                />
              </div>
              <input
                aria-label="Radius slider"
                type="range"
                min=".2"
                max="4"
                step=".1"
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
              />
            </section>
            <section className="knn-live-result">
              <span>
                <Sparkles /> LIVE PREDICTION
              </span>
              <div>
                <i
                  style={{
                    background: COLORS[prediction?.predictedClass ?? 0],
                  }}
                />
                <p>
                  <b>{names[prediction?.predictedClass ?? 0]}</b>
                  <small>
                    {pct(confidence)} confidence • {winningVotes}/{safeK} votes
                  </small>
                </p>
              </div>
            </section>
          </aside>
        </div>
        <footer className="knn-status">
          <span>
            <i /> Model ready
          </span>
          <p>{trainedAt}</p>
          <button onClick={train}>
            <Play /> Update Classifier
          </button>
        </footer>
      </main>
      {toast && <div className="knn-toast">{toast}</div>}
    </div>
  );
}
