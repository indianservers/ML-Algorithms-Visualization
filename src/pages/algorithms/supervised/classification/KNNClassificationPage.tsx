import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LabLessonPanel } from "../../../../components/common/LabTabs";
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
  Eraser,
  FileText,
  FlaskConical,
  Home,
  Lightbulb,
  Minus,
  Moon,
  MousePointer2,
  Network,
  PaintBucket,
  Play,
  Plus,
  RotateCcw,
  Share2,
  Shuffle,
  Sparkles,
  Sun,
  Target,
  Upload,
} from "lucide-react";
import {
  datasetCXor,
  datasetDTwoMoons,
  datasetECircles,
  datasetMultiClassBlobs,
  irisPetalPoints,
  datasetHImbalanced,
} from "../../../../lib/classification/classificationDatasets";
import { knnPredict, type DistanceMetric, type KnnWeight } from "../../../../lib/algorithms/classification/knn";
import { useTheme } from "../../../../stores/uiStore";
import "./KNNClassificationPage.css";

type TabId =
  | "learn"
  | "visualize"
  | "dataset"
  | "train"
  | "metrics"
  | "compare"
  | "explain";
type DatasetId = "iris" | "blobs" | "xor" | "moons" | "circles" | "imbalanced" | "imported";
type Point = { x: number; y: number; label: number };
/** Plot interaction mode: move the query/points, paint new samples, or erase. */
type Tool = "move" | "paint" | "erase";
type DragTarget = { kind: "query" } | { kind: "point"; index: number };
type Domain = { xMin: number; xMax: number; yMin: number; yMax: number };

const MAX_CLASSES = 6;
const COLORS = [
  "#3b82f6",
  "#ec4899",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#14b8a6",
];
const FILLS = [
  "#122b5b",
  "#3a153e",
  "#103b35",
  "#3b2a0b",
  "#2c1548",
  "#0c3733",
];
const IRIS_NAMES = ["Setosa", "Versicolor", "Virginica"];
const GENERIC_NAMES = [
  "Class A",
  "Class B",
  "Class C",
  "Class D",
  "Class E",
  "Class F",
];
const BUILT_INS: Record<Exclude<DatasetId, "imported" | "blobs">, Point[]> = {
  iris: irisPetalPoints(),
  xor: datasetCXor(),
  moons: datasetDTwoMoons(),
  circles: datasetECircles(),
  imbalanced: datasetHImbalanced(),
};
const makeBlobs = (classes: number, seed: number): Point[] =>
  datasetMultiClassBlobs(classes, 26, seed).map((point) => ({ ...point }));
const centroid = (list: Point[]) => ({
  x: list.reduce((sum, point) => sum + point.x, 0) / list.length,
  y: list.reduce((sum, point) => sum + point.y, 0) / list.length,
});
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "learn", label: "Learn", icon: <Lightbulb /> },
  { id: "visualize", label: "Visualize", icon: <Sparkles /> },
  { id: "dataset", label: "Dataset", icon: <Database /> },
  { id: "train", label: "Train", icon: <Play /> },
  { id: "metrics", label: "Metrics", icon: <BarChart3 /> },
  { id: "compare", label: "Compare", icon: <Network /> },
  { id: "explain", label: "Explain", icon: <FileText /> },
];
const clampK = (value: number, limit: number) =>
  Math.max(1, Math.min(Math.max(1, limit), Math.round(value) || 1));
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
  const [weight, setWeight] = useState<KnnWeight>("uniform");
  const [query, setQuery] = useState({ x: 4.4, y: 1.6 });
  const [radius, setRadius] = useState(1.3);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [tip, setTip] = useState(0);
  const [blobClasses, setBlobClasses] = useState(3);
  const [blobSeed, setBlobSeed] = useState(401);
  const [tool, setTool] = useState<Tool>("move");
  const [paintClass, setPaintClass] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  // Rescaling mid-gesture makes the dragged dot chase the cursor, so a drag
  // carries the axes it started with.
  const [drag, setDrag] = useState<{
    target: DragTarget;
    domain: Domain;
    points: Point[];
  } | null>(null);
  const [trainedAt, setTrainedAt] = useState(
    "Ready — KNN stores the current examples",
  );
  const [toast, setToast] = useState("");
  const { theme, toggleTheme } = useTheme();
  const light = theme === "light";
  const uploadRef = useRef<HTMLInputElement>(null);
  const trainX = useMemo(
    () => points.map((point) => [point.x, point.y]),
    [points],
  );
  const trainY = useMemo(() => points.map((point) => point.label), [points]);
  const safeK = Math.min(k, Math.max(1, points.length));
  const kCeiling = Math.min(25, Math.max(1, points.length));
  const prediction = useMemo(
    () =>
      points.length
        ? knnPredict(trainX, trainY, [query.x, query.y], safeK, metric, weight)
        : null,
    [metric, points.length, query.x, query.y, safeK, trainX, trainY, weight],
  );
  /** Highest label present, so every legend/vote/table view scales with the data. */
  const classCount = useMemo(
    () =>
      Math.max(
        2,
        Math.min(
          MAX_CLASSES,
          points.reduce((max, point) => Math.max(max, point.label), 0) + 1,
        ),
      ),
    [points],
  );
  const classIds = useMemo(
    () => Array.from({ length: classCount }, (_, index) => index),
    [classCount],
  );
  const names = useMemo(
    () =>
      datasetId === "iris"
        ? [...IRIS_NAMES, ...GENERIC_NAMES.slice(3)]
        : GENERIC_NAMES,
    [datasetId],
  );
  const liveDomain = useMemo<Domain>(() => {
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
  const domain = drag ? drag.domain : liveDomain;
  // The boundary costs 800+ predictions per pass, far too slow to redo on every
  // pointermove, so dragging a sample keeps the pre-drag snapshot on screen and
  // the real boundary is recomputed once the gesture ends.
  const boundaryPoints =
    drag?.target.kind === "point" ? drag.points : points;
  const boundaryX = useMemo(
    () => boundaryPoints.map((point) => [point.x, point.y]),
    [boundaryPoints],
  );
  const boundaryY = useMemo(
    () => boundaryPoints.map((point) => point.label),
    [boundaryPoints],
  );
  const grid = useMemo(() => {
    if (!showBoundary || !boundaryPoints.length) return [];
    const columns = 39,
      rows = 21,
      xStep = (domain.xMax - domain.xMin) / columns,
      yStep = (domain.yMax - domain.yMin) / rows;
    const boundaryK = Math.min(safeK, boundaryPoints.length);
    const cells: { x: number; y: number; label: number }[] = [];
    for (let row = 0; row < rows; row += 1)
      for (let column = 0; column < columns; column += 1) {
        const x = domain.xMin + (column + 0.5) * xStep,
          y = domain.yMin + (row + 0.5) * yStep;
        cells.push({
          x: column,
          y: row,
          label: knnPredict(
            boundaryX,
            boundaryY,
            [x, y],
            boundaryK,
            metric,
            weight,
          ).predictedClass,
        });
      }
    return cells;
  }, [
    boundaryPoints.length,
    boundaryX,
    boundaryY,
    domain,
    metric,
    safeK,
    showBoundary,
    weight,
  ]);
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
        weight,
      );
      if (result.predictedClass === point.label) correct += 1;
    });
    return correct / points.length;
  }, [metric, points, safeK, weight]);
  const votes = classIds.map((label) => prediction?.votes[label] ?? 0);
  const winningVotes = prediction
    ? (prediction.votes[prediction.predictedClass] ?? 0)
    : 0;
  const voteTotal = votes.reduce((sum, value) => sum + value, 0) || 1;
  const confidence = prediction ? winningVotes / voteTotal : 0;
  const kthDistance = prediction?.neighbors.at(-1)?.distance ?? 0;
  const pointsInRadius = points.filter(
    (point) => Math.hypot(point.x - query.x, point.y - query.y) <= radius,
  ).length;
  const voteGradient = useMemo(() => {
    let running = 0;
    const stops = votes.map((vote, label) => {
      const from = (running / voteTotal) * 100;
      running += vote;
      const to = (running / voteTotal) * 100;
      return `${COLORS[label]} ${from}% ${to}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [voteTotal, votes]);
  const loadPoints = (source: Point[], next: DatasetId) => {
    if (!source.length) return;
    setDatasetId(next);
    setPoints(source.map((point) => ({ ...point })));
    setQuery(next === "iris" ? { x: 4.4, y: 1.6 } : centroid(source));
    setK((value) => clampK(value, source.length));
    setPaintClass((value) =>
      Math.min(
        value,
        source.reduce((max, point) => Math.max(max, point.label), 0),
      ),
    );
    setTrainedAt("Ready — KNN stores the current examples");
  };
  const setDataset = (next: DatasetId) => {
    if (next === "blobs") {
      loadPoints(makeBlobs(blobClasses, blobSeed), "blobs");
      return;
    }
    loadPoints(next === "imported" ? imported : BUILT_INS[next], next);
  };
  /** Rebuild the synthetic dataset so KNN has `next` labelled groups to vote on. */
  const changeClasses = (next: number) => {
    const classes = Math.max(2, Math.min(MAX_CLASSES, Math.round(next)));
    if (classes === classCount && datasetId === "blobs") return;
    setBlobClasses(classes);
    loadPoints(makeBlobs(classes, blobSeed), "blobs");
    setToast(`Dataset rebuilt with ${classes} classes`);
    window.setTimeout(() => setToast(""), 1600);
  };
  const shuffleBlobs = () => {
    const seed = Math.floor(Math.random() * 9000) + 100;
    setBlobSeed(seed);
    loadPoints(makeBlobs(blobClasses, seed), "blobs");
  };
  const reset = () => {
    setDatasetId("iris");
    setPoints(BUILT_INS.iris.map((point) => ({ ...point })));
    setK(5);
    setMetric("euclidean");
    setWeight("uniform");
    setQuery({ x: 4.4, y: 1.6 });
    setRadius(1.3);
    setShowBoundary(true);
    setShowLinks(true);
    setTool("move");
    setPaintClass(0);
    setBlobClasses(3);
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
        label: Math.max(0, Math.min(MAX_CLASSES - 1, Number(columns[2]))),
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
    loadPoints(parsed, "imported");
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
                  ? Math.max(0, Math.min(MAX_CLASSES - 1, Math.round(value)))
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
  /** Screen position -> feature-space position, plus whether it hit the canvas. */
  const toData = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * 930,
      svgY = ((event.clientY - rect.top) / rect.height) * 410;
    return {
      inside: svgX >= 48 && svgX <= 882 && svgY >= 44 && svgY <= 374,
      x: domain.xMin + ((svgX - 48) / 834) * (domain.xMax - domain.xMin),
      y: domain.yMin + ((374 - svgY) / 330) * (domain.yMax - domain.yMin),
    };
  };
  const nearestIndex = (x: number, y: number, maxPixels = 13) => {
    let best = -1;
    let bestDistance = Infinity;
    points.forEach((point, index) => {
      const distance = Math.hypot(
        (point.x - x) * xScale,
        (point.y - y) * yScale,
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return bestDistance <= maxPixels ? best : -1;
  };
  const plotPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const at = toData(event);
    if (!at.inside) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (tool === "paint") {
      setPoints((current) => [
        ...current,
        { x: at.x, y: at.y, label: paintClass },
      ]);
      setTrainedAt(`Added a ${names[paintClass]} sample — re-index to refresh`);
      return;
    }
    if (tool === "erase") {
      const hit = nearestIndex(at.x, at.y, 18);
      if (hit < 0 || points.length <= 3) return;
      setPoints((current) =>
        current.filter((_, index) => index !== hit),
      );
      return;
    }
    const hit = nearestIndex(at.x, at.y);
    if (hit >= 0) {
      setDrag({
        target: { kind: "point", index: hit },
        domain: liveDomain,
        points,
      });
      return;
    }
    setQuery({ x: at.x, y: at.y });
    setDrag({ target: { kind: "query" }, domain: liveDomain, points });
  };
  const plotPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const at = toData(event);
    if (!drag) {
      const hit = at.inside && tool !== "paint" ? nearestIndex(at.x, at.y) : -1;
      setHoverIndex(hit >= 0 ? hit : null);
      return;
    }
    if (drag.target.kind === "query") {
      setQuery({ x: at.x, y: at.y });
      return;
    }
    const dragIndex = drag.target.index;
    setPoints((current) =>
      current.map((point, index) =>
        index === dragIndex ? { ...point, x: at.x, y: at.y } : point,
      ),
    );
  };
  const plotPointerUp = () => setDrag(null);
  const plotKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    const nudgeX = (domain.xMax - domain.xMin) / 60;
    const nudgeY = (domain.yMax - domain.yMin) / 60;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-nudgeX, 0],
      ArrowRight: [nudgeX, 0],
      ArrowUp: [0, nudgeY],
      ArrowDown: [0, -nudgeY],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const scale = event.shiftKey ? 5 : 1;
    setQuery((current) => ({
      x: current.x + move[0] * scale,
      y: current.y + move[1] * scale,
    }));
  };

  const mainPlot = (
    <section className="knn-plot-card">
      <div className="knn-card-title">
        <span>
          <Crosshair /> Feature Space
        </span>
        <small>
          {tool === "paint"
            ? `Click to add ${names[paintClass]} samples`
            : tool === "erase"
              ? "Click a sample to delete it"
              : "Drag the query or any sample • arrow keys nudge"}
        </small>
        <div className="knn-plot-legend">
          {classIds.map((label) => (
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
        className={`knn-chart tool-${tool}`}
        viewBox="0 0 930 410"
        tabIndex={0}
        onPointerDown={plotPointerDown}
        onPointerMove={plotPointerMove}
        onPointerUp={plotPointerUp}
        onPointerCancel={plotPointerUp}
        onPointerLeave={() => setHoverIndex(null)}
        onKeyDown={plotKeyDown}
        role="application"
        aria-label="Interactive KNN feature-space plot. Arrow keys move the query point."
      >
        <defs>
          <clipPath id="knn-clip">
            <rect x="48" y="44" width="834" height="330" rx="10" />
          </clipPath>
          <radialGradient id="knn-aurora-purple" cx=".84" cy=".42" r=".8">
            <stop className="aurora-purple-core" offset="0" />
            <stop className="aurora-purple-mid" offset=".48" />
            <stop className="aurora-purple-deep" offset="1" />
          </radialGradient>
          <radialGradient id="knn-aurora-teal" cx=".16" cy=".55" r=".85">
            <stop className="aurora-teal-core" offset="0" />
            <stop className="aurora-teal-edge" offset=".52" />
          </radialGradient>
          <radialGradient id="knn-query-bloom">
            <stop
              stopColor={COLORS[prediction?.predictedClass ?? 0]}
              stopOpacity=".5"
            />
            <stop
              offset="1"
              stopColor={COLORS[prediction?.predictedClass ?? 0]}
              stopOpacity="0"
            />
          </radialGradient>
        </defs>
        <g clipPath="url(#knn-clip)">
          <g className="knn-plot-surface">
            <rect
              className="knn-plot-base"
              x="48"
              y="44"
              width="834"
              height="330"
            />
            <rect
              className="knn-plot-wash"
              x="48"
              y="44"
              width="834"
              height="330"
            />
            <g className="knn-plot-regions">
              {grid.map((cell, index) => (
                <rect
                  key={index}
                  x={48 + cell.x * (834 / 39)}
                  y={44 + (20 - cell.y) * (330 / 21)}
                  width={834 / 39 + 0.6}
                  height={330 / 21 + 0.6}
                  fill={FILLS[cell.label]}
                />
              ))}
            </g>
          </g>
          {Array.from({ length: 9 }, (_, index) => (
            <line
              className="knn-plot-grid"
              key={`v${index}`}
              x1={48 + index * 104.25}
              x2={48 + index * 104.25}
              y1="44"
              y2="374"
              strokeWidth=".8"
            />
          ))}
          {Array.from({ length: 7 }, (_, index) => (
            <line
              className="knn-plot-grid"
              key={`h${index}`}
              x1="48"
              x2="882"
              y1={44 + index * 55}
              y2={44 + index * 55}
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
              ),
              highlighted = hoverIndex === index;
            return (
              <g key={index}>
                {highlighted && (
                  <circle
                    cx={pixel.x}
                    cy={pixel.y}
                    r="11"
                    fill="none"
                    stroke="#f7c948"
                    strokeWidth="1.6"
                  />
                )}
                <circle
                  cx={pixel.x}
                  cy={pixel.y}
                  r={highlighted ? 7.4 : neighbor ? 6.6 : 4.3}
                  fill={COLORS[point.label]}
                  stroke="#fff"
                  strokeWidth={neighbor || highlighted ? 2 : 1}
                  opacity=".95"
                  style={{
                    filter: `drop-shadow(0 0 ${neighbor || highlighted ? 8 : 5}px ${COLORS[point.label]})`,
                  }}
                >
                  <title>{`${names[point.label]} · (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`}</title>
                </circle>
              </g>
            );
          })}
          <circle
            cx={queryPixel.x}
            cy={queryPixel.y}
            r="58"
            fill="url(#knn-query-bloom)"
          />
          <circle
            cx={queryPixel.x}
            cy={queryPixel.y}
            r="11"
            fill={COLORS[prediction?.predictedClass ?? 0]}
            stroke="#fff"
            strokeWidth="2.5"
            style={{
              filter: `drop-shadow(0 0 18px ${COLORS[prediction?.predictedClass ?? 0]})`,
            }}
          />
          <path
            d={`M${queryPixel.x - 16},${queryPixel.y}h32M${queryPixel.x},${queryPixel.y - 16}v32`}
            stroke="#fff"
            strokeWidth="2"
          />
        </g>
        <rect
          className="knn-plot-frame"
          x="48"
          y="44"
          width="834"
          height="330"
          rx="10"
        />
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
    if (tab === "learn")
      return (
        <LabLessonPanel tab="Learn" route="/ml/supervised/knn-classification" />
      );
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
                        {classIds.map((label) => (
                          <option key={label} value={label}>
                            {names[label]}
                          </option>
                        ))}
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
              3
              <span>
                Vote among K = {safeK} over {classCount} classes
              </span>
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
              <span>Query vote proportion</span>
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
            {classIds.map((label) => {
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
            {(["euclidean", "manhattan", "cosine", "minkowski"] as DistanceMetric[]).map(
              (option) => {
                const result = knnPredict(
                    trainX,
                    trainY,
                    [query.x, query.y],
                    safeK,
                    option,
                    weight,
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
                {winningVotes.toFixed(2)} vote weight of {voteTotal.toFixed(2)}, producing a{" "}
                {pct(confidence)} vote proportion. Ties use the lowest class id.
              </p>
            </article>
          </div>
        </section>
      );
    return mainPlot;
  };

  return (
    <div className={`knn-page ${light ? "light" : ""}`}>
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
          <button aria-label="Toggle theme" onClick={toggleTheme}>
            {light ? <Moon /> : <Sun />}
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
              <option value="iris">Iris petals (real + draws)</option>
              <option value="blobs">Synthetic blobs (2-6 classes)</option>
              <option value="xor">XOR</option>
              <option value="moons">Two moons</option>
              <option value="circles">Concentric circles</option>
              <option value="imbalanced">Imbalanced binary</option>
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
                  <div
                    key={neighbor.index}
                    className={hoverIndex === neighbor.index ? "hovered" : ""}
                    onMouseEnter={() => setHoverIndex(neighbor.index)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <i>{index + 1}</i>
                    <span>
                      <b style={{ background: COLORS[neighbor.label] }} />
                      {names[neighbor.label]}
                    </span>
                    <em>{neighbor.distance.toFixed(3)}</em>
                    <strong>
                      {(weight === "distance"
                        ? 1 / Math.max(neighbor.distance, 1e-12)
                        : 1
                      ).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </article>
              <article className="knn-vote">
                <h3>
                  <BarChart3 /> Majority Vote
                </h3>
                <div className="knn-donut" style={{ background: voteGradient }}>
                  <span>
                    <b>{names[prediction?.predictedClass ?? 0]}</b>
                    <small>
                      {winningVotes.toFixed(2)} / {voteTotal.toFixed(2)} vote weight
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
                {classIds.map((label) => (
                  <p key={label}>
                    <span
                      className="region"
                      style={{ background: FILLS[label] }}
                    />{" "}
                    {names[label]} region
                  </p>
                ))}
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
                  <b>1</b> Drag the crosshair or any sample.
                </p>
                <p>
                  <b>2</b> Use Add to paint a new class.
                </p>
                <p>
                  <b>3</b> Change K and watch the vote flip.
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
              <h3>PLOT TOOL</h3>
              <div className="knn-tools">
                {(
                  [
                    ["move", "Move", <MousePointer2 key="m" />],
                    ["paint", "Add", <PaintBucket key="p" />],
                    ["erase", "Delete", <Eraser key="e" />],
                  ] as [Tool, string, React.ReactNode][]
                ).map(([id, label, icon]) => (
                  <button
                    key={id}
                    className={tool === id ? "active" : ""}
                    onClick={() => setTool(id)}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
              <p className="knn-tool-hint">
                {tool === "move"
                  ? "Drag the query crosshair or any training sample."
                  : tool === "paint"
                    ? "Click the plot to drop a new labelled sample."
                    : "Click a sample to remove it from the dataset."}
              </p>
            </section>
            <section>
              <h3>CLASSES IN DATASET</h3>
              <div className="knn-stepper">
                <button
                  aria-label="Fewer classes"
                  disabled={classCount <= 2}
                  onClick={() => changeClasses(classCount - 1)}
                >
                  <Minus />
                </button>
                <input
                  aria-label="Number of classes"
                  type="number"
                  min="2"
                  max={MAX_CLASSES}
                  value={classCount}
                  onChange={(event) => changeClasses(Number(event.target.value))}
                />
                <button
                  aria-label="More classes"
                  disabled={classCount >= MAX_CLASSES}
                  onClick={() => changeClasses(classCount + 1)}
                >
                  <Plus />
                </button>
              </div>
              <p className="knn-tool-hint">
                KNN is supervised, so these are labelled classes, not clusters.
                Changing the count rebuilds a synthetic dataset with that many
                groups.
              </p>
              <div className="knn-class-picker">
                {Array.from(
                  { length: Math.min(classCount + 1, MAX_CLASSES) },
                  (_, label) => (
                    <button
                      key={label}
                      className={paintClass === label ? "active" : ""}
                      style={{ borderColor: COLORS[label] }}
                      onClick={() => {
                        setPaintClass(label);
                        setTool("paint");
                      }}
                    >
                      <b style={{ background: COLORS[label] }} />
                      {label === classCount ? `New (${names[label]})` : names[label]}
                    </button>
                  ),
                )}
              </div>
              <button className="knn-reset-point" onClick={shuffleBlobs}>
                <Shuffle /> Resample Blobs
              </button>
            </section>
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
                onClick={() =>
                  setQuery(
                    datasetId === "iris" ? { x: 4.4, y: 1.6 } : centroid(points),
                  )
                }
              >
                <Crosshair /> Centre Query
              </button>
            </section>
            <section>
              <h3>NUMBER OF NEIGHBORS (K)</h3>
              <div className="knn-stepper">
                <button
                  aria-label="Decrease K"
                  onClick={() =>
                    setK((value) => clampK(value - 1, points.length))
                  }
                >
                  <Minus />
                </button>
                <input
                  aria-label="K numeric"
                  type="number"
                  min="1"
                  max={kCeiling}
                  value={safeK}
                  onChange={(event) =>
                    setK(clampK(Number(event.target.value), points.length))
                  }
                />
                <button
                  aria-label="Increase K"
                  onClick={() =>
                    setK((value) => clampK(value + 1, points.length))
                  }
                >
                  <Plus />
                </button>
              </div>
              <input
                aria-label="K slider"
                type="range"
                min="1"
                max={kCeiling}
                step="1"
                value={safeK}
                onChange={(event) =>
                  setK(clampK(Number(event.target.value), points.length))
                }
              />
              <div className="knn-range-label">
                <span>1</span>
                <b>
                  K = {safeK}
                  {safeK % 2 === 0 && classCount === 2 ? " (ties possible)" : ""}
                </b>
                <span>{kCeiling}</span>
              </div>
            </section>
            <section>
              <h3>DISTANCE METRIC</h3>
              <div className="knn-metric-options">
                {(["euclidean", "manhattan", "cosine", "minkowski"] as DistanceMetric[]).map(
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
                              : option === "minkowski"
                                ? "p-norm distance (p=3)"
                                : "Angular similarity"}
                        </small>
                      </span>
                    </button>
                  ),
                )}
              </div>
            </section>
            <section>
              <h3>VOTE WEIGHTS</h3>
              <div className="knn-metric-options">
                {(["uniform", "distance"] as KnnWeight[]).map((option) => (
                  <button
                    key={option}
                    className={weight === option ? "active" : ""}
                    onClick={() => setWeight(option)}
                  >
                    <i>{weight === option && <Check />}</i>
                    <span>
                      <b>{option}</b>
                      <small>
                        {option === "uniform"
                          ? "Each neighbor casts one vote"
                          : "Closer neighbors vote more strongly"}
                      </small>
                    </span>
                  </button>
                ))}
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
              <div className="knn-range-label">
                <span>0.2</span>
                <b>
                  {pointsInRadius} sample{pointsInRadius === 1 ? "" : "s"} inside
                </b>
                <span>4.0</span>
              </div>
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
                    {pct(confidence)} vote proportion • K={safeK}
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
