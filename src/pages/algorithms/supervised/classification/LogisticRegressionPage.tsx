import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { LabProgressMeter } from "../../../../components/common/LabChrome";
import { LabLessonPanel, useUrlTab } from "../../../../components/common/LabTabs";
import {
  Check,
  ChevronDown,
  Database,
  Info,
  Lightbulb,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  SkipForward,
  Table2,
  Upload,
} from "lucide-react";
import { logisticRegression } from "../../../../lib/algorithms/classification/logisticRegression";
import { binaryMetrics, logLoss, prAuc, rocCurve } from "../../../../lib/math/metrics";
import {
  applyThreshold,
  classificationSplit,
  fitStandardScaler,
  majorityBaseline,
  thresholdSweep,
} from "../../../../lib/classification/classificationEval";
import { datasetB1D } from "../../../../lib/classification/classificationDatasets";
import { ClassificationDiagnosticsPanel } from "../../../../components/ml/ClassificationDiagnosticsPanel";
import "./LogisticRegressionPage.css";
import { loadActiveDatasetMap } from "../../../../lib/experimentWorkspace";
import type { LoadedAlgorithmDataset } from "../../../../data/algorithmDatasets";
import { reportTrainingActivity } from "../../../../lib/trainingActivity";
import { EditableNumericScatter } from "../../../../components/dataset/EditableNumericScatter";

type Point = { x: number; y: number; z?: number };
type DatasetKey = "reference" | "loan" | "student" | "disease" | "purchase" | "overlap" | "separable" | "noisy" | "imported";
type View = "probability" | "logodds" | "both";
type Outcome = "TP" | "TN" | "FP" | "FN";

const tabs = [
  "Learn",
  "Visualize",
  "Dataset",
  "Train",
  "Metrics",
  "Compare",
  "Explain",
] as const;
type Tab = (typeof tabs)[number];
const lessonSteps = [
  "Inspect binary data", "Compute a linear score", "Understand log-odds", "Estimate the intercept", "Estimate the coefficient",
  "Apply sigmoid and classify", "Apply the probability threshold", "Derive the decision boundary", "Build the confusion matrix", "Evaluate the model",
];

function sigmoid(z: number) {
  return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
}
function logitProbability(p: number) { const safe = Math.min(1 - 1e-12, Math.max(1e-12, p)); return Math.log(safe / (1 - safe)); }
function decisionBoundary(beta0: number, beta1: number, threshold: number) {
  return Math.abs(beta1) < 1e-10 ? null : (logitProbability(threshold) - beta0) / beta1;
}
function outcome(actual: number, predicted: number): Outcome {
  return actual ? (predicted ? "TP" : "FN") : predicted ? "FP" : "TN";
}

function makeBinaryRows(seed: number, count: number, min: number, max: number, center: number, steepness: number, noise = 0): Point[] {
  let state = seed;
  const random = () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: count }, (_, index) => {
    const x = min + ((index + .15 + random() * .7) / count) * (max - min);
    const chance = Math.min(.98, Math.max(.02, sigmoid(steepness * (x - center)) * (1 - noise) + noise * .5));
    return { x: Number(x.toFixed(2)), y: random() < chance ? 1 : 0 };
  });
}

const referenceRows = makeBinaryRows(2026, 100, 2, 98, 58, .15, .14).map((row, index) => index === 62 ? { ...row, x: 62 } : row);

const datasets = {
  reference: {
    name: "Exam Pass vs Study Score",
    feature: "Study Score",
    source: "Recommended",
    rows: referenceRows,
  },
  loan: { name: "Loan Approval vs Credit Score", feature: "Credit Score", source: "Lab", rows: makeBinaryRows(2041, 100, 350, 850, 615, .025) },
  student: { name: "Student Risk Dataset", feature: "Attendance Score", source: "Lab", rows: makeBinaryRows(2042, 100, 5, 99, 60, -.12) },
  disease: { name: "Disease Risk vs Marker Score", feature: "Marker Score", source: "Lab", rows: makeBinaryRows(2043, 100, 1, 100, 55, .10) },
  purchase: { name: "Purchase vs Engagement Score", feature: "Engagement Score", source: "Lab", rows: makeBinaryRows(2044, 100, 0, 100, 52, .095) },
  overlap: {
    name: "Overlapping binary classes",
    feature: "Feature x",
    source: "Lab",
    rows: datasetB1D(),
  },
  separable: { name: "Highly Separable Dataset", feature: "Feature x", source: "Lab", rows: makeBinaryRows(2045, 100, 0, 100, 50, .42) },
  noisy: { name: "Noisy Dataset", feature: "Feature x", source: "Lab", rows: makeBinaryRows(2046, 100, 0, 100, 50, .08, .34) },
};

type CsvPreview = { name: string; columns: string[]; records: string[][] };

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { cell += '"'; index++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { cells.push(cell.trim()); cell = ""; }
    else cell += char;
  }
  if (quoted) throw Error("CSV has an unclosed quoted value.");
  cells.push(cell.trim());
  return cells;
}

function parseCsv(text: string, name: string): CsvPreview {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 5) throw Error("CSV requires a header and at least four labeled rows.");
  const columns = splitCsvLine(lines[0]);
  if (columns.length < 2 || columns.some(column => !column)) throw Error("CSV needs named feature and target columns.");
  const records = lines.slice(1).map(splitCsvLine);
  if (records.some(record => record.length !== columns.length)) throw Error("CSV rows must have the same number of columns as the header.");
  return { name, columns, records };
}

function binaryLabel(value: string): number | null {
  const label = value.trim().toLowerCase();
  if (["0", "no", "false", "fail", "denied", "negative", "low"].includes(label)) return 0;
  if (["1", "yes", "true", "pass", "approved", "positive", "high"].includes(label)) return 1;
  return null;
}

function csvPoints(preview: CsvPreview, featureIndex: number, targetIndex: number): Point[] {
  if (featureIndex === targetIndex) throw Error("Choose different feature and target columns.");
  const points = preview.records.map((record, index) => {
    const feature = record[featureIndex];
    const x = feature === "" ? NaN : Number(feature);
    const y = binaryLabel(record[targetIndex] ?? "");
    if (!Number.isFinite(x) || y === null) throw Error(`Row ${index + 2} needs a numeric feature and a binary target (0/1, Yes/No, or Pass/Fail).`);
    return { x, y };
  });
  if (new Set(points.map(point => point.y)).size !== 2) throw Error("The target must contain both binary classes.");
  return points;
}

function rowsFromLoaded(dataset: LoadedAlgorithmDataset): Point[] {
  const columns = dataset.columns.filter(Boolean);
  if (columns.length < 2 || dataset.data.length < 4) return [];
  const target =
    dataset.target && columns.includes(dataset.target)
      ? dataset.target
      : columns[columns.length - 1];
  if (!target) return [];
  const features = columns.filter((column) => column !== target);
  if (!features.length) return [];
  try {
    return csvPoints({ name: dataset.name, columns: [features[0], target], records: dataset.data.map(row => [String(row[features[0]] ?? ""), String(row[target] ?? "")]) }, 0, 1);
  } catch { return []; }
}

function featuresOf(row: Point) {
  return row.z === undefined ? [row.x] : [row.x, row.z];
}

function medianX(rows: Point[]) {
  if (!rows.length) return 0;
  const sorted = rows.map((r) => r.x).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function train(rows: Point[], l2: number) {
  if (rows.length < 4) {
    throw new Error("Need at least four labeled rows to train.");
  }
  const X = rows.map(featuresOf);
  const y = rows.map((v) => v.y);
  const split = classificationSplit(X, y, 0.2, 42);
  const scaler = fitStandardScaler(split.trainX);
  const model = logisticRegression(
    scaler.transformAll(split.trainX),
    split.trainY,
    0.12,
    650,
    undefined,
    l2 * 0.03,
  );
  const dim = split.trainX[0].length;
  const zMean =
    dim > 1
      ? split.trainX.reduce((s, row) => s + row[1], 0) / split.trainX.length
      : 0;
  const pad = (row: number[]) =>
    row.length === dim ? row : dim === 1 ? [row[0]] : [row[0], row[1] ?? zMean];
  const probaRow = (row: number[]) =>
    model.predictProba(scaler.transform(pad(row)));
  const logitRow = (row: number[]) => {
    const x = scaler.transform(pad(row));
    return x.reduce(
      (sum, value, j) => sum + value * model.weights[j],
      model.bias,
    );
  };
  return {
    ...model,
    split,
    scaler,
    probaRow,
    logitRow,
    proba: (x: number) => probaRow(dim === 1 ? [x] : [x, zMean]),
    logit: (x: number) => logitRow(dim === 1 ? [x] : [x, zMean]),
  };
}

function niceTicks(min: number, max: number, count = 5) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].find((m) => raw <= m * mag)! * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 0.001; v += step)
    out.push(Number(v.toFixed(10)));
  return out;
}

const fmtTick = (v: number) =>
  Math.abs(v) >= 10000
    ? `${Math.round(v / 1000)}k`
    : Number.isInteger(v)
      ? String(v)
      : v.toFixed(1);

/* --------------------------------------------------------- sigmoid plot */

function SigmoidPlot({
  rows,
  proba,
  threshold,
  feature,
  boundary,
  probeX,
  selectedIndex,
  filterOutcome,
  showRegions,
  showSampleLabels,
  onProbe,
  onSelect,
}: {
  rows: Point[];
  proba: (x: number) => number;
  threshold: number;
  feature: string;
  boundary: number | null;
  probeX: number;
  selectedIndex: number | null;
  filterOutcome: Outcome | null;
  showRegions: boolean;
  showSampleLabels: boolean;
  onProbe: (x: number) => void;
  onSelect: (index: number) => void;
}) {
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const W = compact ? 400 : 1030, H = compact ? 360 : 275, L = compact ? 43 : 70, R = compact ? 12 : 36, T = compact ? 55 : 36, B = compact ? 51 : 38;
  const xs = rows.map((v) => v.x);
  const rawMin = Math.min(...xs), rawMax = Math.max(...xs);
  const referenceScale = rawMin >= 0 && rawMax <= 1;
  const pad = (rawMax - rawMin || 1) * 0.04;
  const xmin = referenceScale ? 0 : rawMin - pad;
  const xmax = referenceScale ? 1 : rawMax + pad;
  const sx = (x: number) => L + ((x - xmin) / (xmax - xmin)) * (W - L - R);
  const sy = (p: number) => H - B - p * (H - T - B);
  const path = Array.from({ length: 240 }, (_, i) => {
    const x = xmin + (i / 239) * (xmax - xmin);
    return `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(proba(x)).toFixed(1)}`;
  }).join(" ");
  const visibleBoundary = boundary !== null && boundary >= xmin && boundary <= xmax;
  const leftEdge = visibleBoundary ? sx(boundary) : W - R;
  const leftClass = proba(xmin) >= threshold ? 1 : 0;
  const rightClass = proba(xmax) >= threshold ? 1 : 0;
  const ticks = referenceScale ? [0, .2, .4, .6, .8, 1] : niceTicks(rawMin, rawMax, compact ? 4 : 5);
  const decimals = referenceScale ? 2 : Math.abs(xmax - xmin) < 10 ? 2 : 1;
  const clickProbe = (event: MouseEvent<SVGRectElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const position = svg.createSVGPoint();
    position.x = event.clientX;
    position.y = event.clientY;
    const local = position.matrixTransform(svg.getScreenCTM()?.inverse());
    onProbe(Math.max(xmin, Math.min(xmax, xmin + ((local.x - L) / (W - L - R)) * (xmax - xmin))));
  };

  return (
    <svg
      className="lr-plot"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Sigmoid probability curve over ${feature}. Probability threshold ${threshold.toFixed(2)}. ${boundary === null ? "No finite decision boundary" : `Decision boundary x ${boundary.toFixed(decimals)}`}. Observations appear near actual class 0 or 1.`}
    >
      <defs><clipPath id="lr-plot-clip"><rect x={L} y={T} width={W - L - R} height={H - T - B} /></clipPath></defs>
      <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="transparent" className="lr-plot-hit-area" onClick={clickProbe} />
      {showRegions && <g clipPath="url(#lr-plot-clip)">
        <rect x={L} y={T} width={leftEdge - L} height={H - T - B} className={leftClass ? "lr-region-one" : "lr-region-zero"} />
        {visibleBoundary && <rect x={leftEdge} y={T} width={W - R - leftEdge} height={H - T - B} className={rightClass ? "lr-region-one" : "lr-region-zero"} />}
      </g>}
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} className="grid" />
          <text x={L - 16} y={sy(v) + 4} textAnchor="end">
            {v.toFixed(1)}
          </text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={sy(threshold)} y2={sy(threshold)} className="lr-probability-threshold" />
      <text x={W - R - 8} y={sy(threshold) - 9} textAnchor="end" className="lr-threshold-label">Probability threshold τ = {threshold.toFixed(2)}</text>
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} className="axis" />
      {ticks.map((t) => (
        <text key={t} x={sx(t)} y={H - B + 22} className="lr-axis-tick">
          {referenceScale ? t.toFixed(1) : fmtTick(t)}
        </text>
      ))}
      {visibleBoundary && (
        <>
          <line x1={sx(boundary)} x2={sx(boundary)} y1={T} y2={H-B} className="lr-decision-boundary" />
          <text x={Math.max(L+(compact ? 52 : 72), Math.min(W-R-(compact ? 52 : 72), sx(boundary)))} y={T-31} className="lr-boundary-label">Decision boundary</text>
          <text x={Math.max(L+(compact ? 52 : 72), Math.min(W-R-(compact ? 52 : 72), sx(boundary)))} y={T-13} className="lr-boundary-value">x = {boundary.toFixed(decimals)}</text>
          <circle cx={sx(boundary)} cy={sy(threshold)} r="6" className="lr-intersection" />
        </>
      )}
      <path d={path} className="sigmoid" />
      {showRegions && !compact && (visibleBoundary ? [
        { start: L, end: leftEdge, value: leftClass },
        { start: leftEdge, end: W - R, value: rightClass },
      ] : [{ start: L, end: W - R, value: leftClass }]).map((region, index) => region.end - region.start > 155 && (
        <g key={index} className={region.value ? "lr-region-label positive" : "lr-region-label negative"}>
          <text x={(region.start + region.end) / 2} y={sy(.74)}>Predicted Class {region.value}</text>
          <text x={(region.start + region.end) / 2} y={sy(.67)}>{region.value ? `P ≥ ${threshold.toFixed(2)}` : `P < ${threshold.toFixed(2)}`}</text>
        </g>
      ))}
      {rows.map((v, i) => {
        const predicted = proba(v.x) >= threshold ? 1 : 0;
        const result = outcome(v.y, predicted);
        const jitter = ((i * 73) % 17) / 17 * .045;
        return <circle key={i} cx={sx(v.x)} cy={sy(v.y ? .975 - jitter : .025 + jitter)} r={selectedIndex === i ? 6 : 3.5}
          className={`lr-observation ${v.y ? "pt-pos" : "pt-neg"}${selectedIndex === i ? " is-selected" : ""}${filterOutcome && filterOutcome !== result ? " is-dimmed" : ""}`}
          tabIndex={0} role="button" aria-label={`Sample ${i + 1}: actual class ${v.y}, predicted class ${predicted}, ${result}`}
          onClick={() => onSelect(i)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(i); } }}>
          <title>Sample #{i + 1} · x {v.x.toFixed(2)} · actual class {v.y} · P {proba(v.x).toFixed(3)} · threshold {threshold.toFixed(2)} · predicted class {predicted} · {result}</title>
        </circle>;
      })}
      {showSampleLabels && rows.filter((_, index) => index % Math.max(1, Math.floor(rows.length / 14)) === 0).map((sample, index) => <text key={index} x={sx(sample.x)} y={sy(sample.y ? .88 : .12)} className="lr-sample-label">{sample.y}</text>)}
      {probeX >= xmin && probeX <= xmax && <g className="lr-probe" aria-hidden="true"><line x1={sx(probeX)} x2={sx(probeX)} y1={sy(proba(probeX))} y2={H-B} /><circle cx={sx(probeX)} cy={sy(proba(probeX))} r="5" /></g>}
      <text x={(L + W - R) / 2} y={H - 10} className="axis-title">
        {feature}
      </text>
      <text
        transform={`translate(20 ${(T + H - B) / 2}) rotate(-90)`}
        className="axis-title"
      >
        Probability / Observed Class
      </text>
    </svg>
  );
}

/* -------------------------------------------------------- log-odds strip */

function LogOddsStrip({
  rows,
  logit,
  threshold,
}: {
  rows: Point[];
  logit: (x: number) => number;
  threshold: number;
}) {
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const W = compact ? 400 : 1030, H = compact ? 300 : 260;
  const L = compact ? 43 : 76, R = compact ? 12 : 36, T = 35, B = 48;
  const xs = rows.map((r) => r.x);
  const rawMin = Math.min(...xs), rawMax = Math.max(...xs);
  const referenceScale = rawMin >= 0 && rawMax <= 1;
  const pad = (rawMax - rawMin || 1) * .04;
  const xmin = referenceScale ? 0 : rawMin - pad;
  const xmax = referenceScale ? 1 : rawMax + pad;
  const cutoff = logitProbability(threshold);
  const bound = Math.max(2, Math.ceil(Math.max(Math.abs(cutoff), Math.abs(logit(xmin)), Math.abs(logit(xmax)))));
  const sx = (x: number) => L + ((x - xmin) / (xmax - xmin)) * (W - L - R);
  const sy = (z: number) => T + ((bound - z) / (2 * bound)) * (H - T - B);
  const boundary = Math.abs(logit(xmax) - logit(xmin)) < 1e-10 ? null : xmin + (cutoff - logit(xmin)) * (xmax - xmin) / (logit(xmax) - logit(xmin));
  const line = `M${sx(xmin)},${sy(logit(xmin))} L${sx(xmax)},${sy(logit(xmax))}`;
  const ticks = referenceScale ? [0, .2, .4, .6, .8, 1] : niceTicks(rawMin, rawMax, compact ? 4 : 6);

  return (
    <svg
      className="lr-plot"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Log-odds space showing the straight line z equals beta zero plus beta one x and classification cutoff z ${cutoff.toFixed(2)}`}
    >
      <line x1={L} x2={W-R} y1={sy(0)} y2={sy(0)} className="grid" />
      <line x1={L} x2={W-R} y1={sy(cutoff)} y2={sy(cutoff)} className="lr-probability-threshold" />
      <text x={W-R-5} y={sy(cutoff)-8} textAnchor="end" className="lr-threshold-label">τ = {threshold.toFixed(2)} → z = {cutoff.toFixed(2)}</text>
      <line x1={L} x2={W-R} y1={H-B} y2={H-B} className="axis" />
      {boundary !== null && boundary >= xmin && boundary <= xmax && <line x1={sx(boundary)} x2={sx(boundary)} y1={T} y2={H-B} className="lr-decision-boundary" />}
      <path d={line} className="lr-logit-line" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={H-B} y2={H-B+6} className="axis" />
          <text x={sx(t)} y={H-B+22}>
            {referenceScale ? t.toFixed(1) : fmtTick(t)}
          </text>
        </g>
      ))}
      {rows.filter((_, i) => i % Math.max(1, Math.floor(rows.length / 80)) === 0).map((r, i) => <circle key={i} cx={sx(r.x)} cy={sy(logit(r.x))} r="2.8" className={r.y ? "pt-pos" : "pt-neg"} />)}
      <text x={(L + W - R) / 2} y={H - 8} className="axis-title">
        Feature x
      </text>
      <text transform={`translate(${compact ? 17 : 22} ${(T+H-B)/2}) rotate(-90)`} className="axis-title">Log-odds z</text>
    </svg>
  );
}

/* ------------------------------------------------------------ data tabs */

function DataTable({
  rows,
  setRows,
  feature,
}: {
  rows: Point[];
  setRows: React.Dispatch<React.SetStateAction<Point[]>>;
  feature: string;
}) {
  return (
    <article className="lr-card lr-panel">
      <div className="lr-data-head">
        <h2>Editable Classification Data</h2>
        <span aria-label="Active row count">{rows.length} rows</span>
        <button onClick={() => setRows((v) => [...v, { x: medianX(v), y: 1 }])}>
          Add Row
        </button>
        <button disabled={rows.length <= 4} onClick={() => setRows((v) => v.slice(0, -1))}>
          Remove Row
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>{feature}</th>
            <th>Class</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 18).map((v, i) => (
            <tr key={i}>
              <td>
                <input
                  aria-label={`Row ${i + 1} feature`}
                  type="number"
                  value={v.x}
                  onChange={(e) =>
                    setRows((a) =>
                      a.map((p, j) =>
                        j === i ? { ...p, x: Number(e.target.value) } : p,
                      ),
                    )
                  }
                />
              </td>
              <td>
                <select
                  aria-label={`Row ${i + 1} class`}
                  value={v.y}
                  onChange={(e) =>
                    setRows((a) =>
                      a.map((p, j) =>
                        j === i ? { ...p, y: Number(e.target.value) } : p,
                      ),
                    )
                  }
                >
                  <option value="0">Negative</option>
                  <option value="1">Positive</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

function Generic({
  tab,
  loss,
  probability,
}: {
  tab: Tab;
  loss: number[];
  probability: number;
}) {
  return (
    <article className="lr-card lr-panel">
      <h2>{tab}</h2>
      <p>
        {tab === "Train"
          ? `Gradient descent completed ${loss.length} iterations. Final cross-entropy: ${loss.at(-1)?.toFixed(4)}.`
          : tab === "Metrics"
            ? "Explore threshold-sensitive accuracy, precision, recall, F1, and confusion outcomes."
            : tab === "Compare"
              ? "Compare probability estimates and class decisions across regularization strengths."
              : tab === "Explain"
                ? `Live example probability: ${(probability * 100).toFixed(1)}%.`
                : "Logistic regression maps a linear score through the sigmoid function to a calibrated class probability."}
      </p>
    </article>
  );
}

/* ------------------------------------------------------------------ page */

export default function LogisticRegressionPage() {
  const location = useLocation();
  const [tab, setTab] = useUrlTab<Tab>("Visualize");
  const [dataset, setDataset] = useState<DatasetKey>("reference"),
    [rows, setRows] = useState<Point[]>(referenceRows),
    [imported, setImported] = useState<Point[] | null>(null),
    [importedLabel, setImportedLabel] = useState("Imported CSV"),
    [importedFeature, setImportedFeature] = useState("Feature x"),
    [threshold, setThreshold] = useState(0.5),
    [view, setView] = useState<View>("probability"),
    [coefficientOverride, setCoefficientOverride] = useState<{ beta0: number; beta1: number } | null>(null),
    [selectedIndex, setSelectedIndex] = useState<number | null>(62),
    [filterOutcome, setFilterOutcome] = useState<Outcome | null>(null),
    [changeNote, setChangeNote] = useState("Move a control to see how probability and predicted classes change."),
    [l2, setL2] = useState(1),
    [trained, setTrained] = useState(true),
    [dataLoaded, setDataLoaded] = useState(false),
    [status, setStatus] = useState("Last trained: just now");
  const [predX, setPredX] = useState(62);
  const [step, setStep] = useState(5);
  const [playing, setPlaying] = useState(false);
  const [showRegions, setShowRegions] = useState(true);
  const [showSampleLabels, setShowSampleLabels] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [fitMode, setFitMode] = useState<"auto" | "manual">("auto");
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [csvFeatureIndex, setCsvFeatureIndex] = useState(0);
  const [csvTargetIndex, setCsvTargetIndex] = useState(1);
  const [csvError, setCsvError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null),
    appliedHandoffKey = useRef<string | null>(null),
    model = useMemo(() => {
      try {
        return train(rows, l2);
      } catch {
        return null;
      }
    }, [rows, l2]);

  const fittedBeta0 = model?.logit(0) ?? 0;
  const fittedBeta1 = model ? model.logit(1) - model.logit(0) : 0;
  const beta0 = coefficientOverride?.beta0 ?? fittedBeta0;
  const beta1 = coefficientOverride?.beta1 ?? fittedBeta1;
  const beta0Limit = Math.max(20, Math.ceil(Math.abs(fittedBeta0)) + 1);
  const beta1Limit = Math.max(20, Math.ceil(Math.abs(fittedBeta1)) + 1);
  const proba = (x: number) => sigmoid(beta0 + beta1 * x);
  const boundary = decisionBoundary(beta0, beta1, threshold);
  const testScores = model ? model.split.testX.map((row) => proba(row[0])) : [];
  const testPred = applyThreshold(testScores, threshold);
  const testMetrics = model ? binaryMetrics(model.split.testY, testPred) : null;
  const allScores = rows.map((row) => proba(row.x));
  const allPred = applyThreshold(allScores, threshold);
  const metrics = rows.length
    ? binaryMetrics(rows.map((row) => row.y), allPred)
    : {
        tp: 0,
        tn: 0,
        fp: 0,
        fn: 0,
        accuracy: 0,
        precision: 0,
        recall: 0,
        specificity: 0,
        f1: 0,
        balancedAccuracy: 0,
      };
  const roc = testScores.length
    ? rocCurve(model!.split.testY, testScores)
    : null;
  const pr = testScores.length ? prAuc(model!.split.testY, testScores) : null;
  const trainScores = model
    ? model.split.trainX.map((row) => proba(row[0]))
    : [];
  const trainMetrics = model
    ? binaryMetrics(model.split.trainY, applyThreshold(trainScores, threshold))
    : null;
  const sweep = model ? thresholdSweep(model.split.testY, testScores) : [];
  const baseline = model ? majorityBaseline(model.split.testY) : null;
  const inspectZ = beta0 + beta1 * predX;
  const inspectP = proba(predX);
  const inspectClass = inspectP >= threshold ? 1 : 0;
  const positive = rows.filter((v) => v.y).length / Math.max(1, rows.length);
  const testLogLoss = model && testScores.length ? logLoss(model.split.testY, testScores) : null;
  const testConfusion = testMetrics ?? metrics;
  const odds = Math.exp(Math.max(-50, Math.min(50, inspectZ)));
  const probeSample = selectedIndex === null ? null : rows[selectedIndex] ?? null;
  const probeOutcome = probeSample ? outcome(probeSample.y, inspectClass) : null;
  const classAtMin = proba(Math.min(...rows.map(row => row.x))) >= threshold ? 1 : 0;
  const classAtMax = proba(Math.max(...rows.map(row => row.x))) >= threshold ? 1 : 0;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStep(current => {
      if (current >= lessonSteps.length - 1) {
        setPlaying(false);
        return current;
      }
      return current + 1;
    }), 950);
    return () => window.clearInterval(timer);
  }, [playing]);

  const current =
    dataset === "imported"
      ? {
          name: importedLabel,
          feature: importedFeature,
          source: "Local",
          rows,
        }
      : datasets[dataset];

  const choose = (key: DatasetKey) => {
    if (key === "imported" && !imported) return;
    const next = key === "imported" ? imported! : datasets[key].rows;
    setDataset(key);
    setRows(next);
    // predX belongs to the old feature scale, so re-centre it on the new data.
    setPredX(medianX(next));
    setCoefficientOverride(null);
    setSelectedIndex(null);
    setFilterOutcome(null);
    setChangeNote(`Switched to ${key === "imported" ? importedLabel : datasets[key].name}. The model fit and axis range updated.`);
    setThreshold(0.5);
    setTrained(true);
    setStatus("Auto fit recalculated for the selected dataset");
  };

  const applyLoaded = (next: LoadedAlgorithmDataset) => {
    const points = rowsFromLoaded(next);
    if (!points.length) return;
    setImported(points);
    setImportedLabel(next.name);
    setImportedFeature(next.columns.find((column) => column && column !== next.target) ?? "Feature x");
    setRows(points);
    setDataset("imported");
    setDataLoaded(true);
    setTrained(true);
    setPredX(medianX(points));
    setCoefficientOverride(null);
    setSelectedIndex(null);
    setFilterOutcome(null);
    setStatus(`Loaded ${next.name} (${points.length} rows)`);
  };

  useEffect(() => {
    const apply = (next?: LoadedAlgorithmDataset | null) => {
      if (!next) return;
      const key = `${next.id}:${next.data.length}:${next.target ?? ""}`;
      if (appliedHandoffKey.current === key) return;
      appliedHandoffKey.current = key;
      applyLoaded(next);
    };
    apply(loadActiveDatasetMap()[location.pathname]);
    const onLoaded = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          route?: string;
          dataset?: LoadedAlgorithmDataset;
        }>
      ).detail;
      if (
        !detail?.dataset ||
        (detail.route && detail.route !== location.pathname)
      )
        return;
      apply(detail.dataset);
    };
    window.addEventListener("ml:algorithm-dataset-loaded", onLoaded);
    return () =>
      window.removeEventListener("ml:algorithm-dataset-loaded", onLoaded);
  }, [location.pathname]);

  const reset = () => {
    setDataset("reference");
    setRows(referenceRows);
    setThreshold(0.5);
    setView("probability");
    setL2(1);
    setPredX(62);
    setStep(5);
    setPlaying(false);
    setShowRegions(true);
    setShowSampleLabels(false);
    setManualOpen(false);
    setFitMode("auto");
    setCsvPreview(null);
    setCsvError("");
    setCoefficientOverride(null);
    setSelectedIndex(62);
    setFilterOutcome(null);
    setChangeNote("Restored the fitted reference model and probability threshold 0.50.");
    setTrained(true);
    setStatus("Last trained: just now");
  };

  const retrain = () => {
    setTrained(false);
    setStatus("Optimizing cross-entropy…");
    reportTrainingActivity({
      kind: "start",
      message: `Training started · ${rows.length} labeled rows · L2 ${l2.toFixed(2)}`,
      current: 0,
      total: 650,
    });
    const startedAt = performance.now();
    try {
      // Fit again on click. The preview stays live, while this trace describes
      // the model run the learner explicitly requested.
      const fitted = train(rows, l2);
      const history = fitted.lossHistory;
      for (const index of [0, 49, 149, 299, 449, history.length - 1]) {
        const loss = history[index];
        if (loss === undefined) continue;
        reportTrainingActivity({
          kind: "progress",
          message: `Recorded iteration ${index + 1}/${history.length} · cross-entropy ${loss.toFixed(4)}`,
          current: index + 1,
          total: history.length,
        });
      }
      const predictions = fitted.split.testX.map((row) => fitted.probaRow(row));
      const result = binaryMetrics(fitted.split.testY, applyThreshold(predictions, threshold));
      const fitMs = performance.now() - startedAt;
      setTrained(true);
      setCoefficientOverride(null);
      setStatus(`Trained on ${rows.length} samples`);
      reportTrainingActivity({
        kind: "complete",
        message: `Training completed · ${fitted.split.nTrain} train / ${fitted.split.nTest} test · accuracy ${(result.accuracy * 100).toFixed(1)}% · fit ${fitMs.toFixed(1)} ms`,
        current: history.length,
        total: history.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to fit this dataset.";
      setStatus(message);
      reportTrainingActivity({ kind: "error", message: `Training failed · ${message}` });
    }
  };

  const xMin = Math.min(...rows.map((v) => v.x));
  const xMax = Math.max(...rows.map((v) => v.x));
  const featureCount = rows.some((r) => r.z !== undefined) ? 2 : 1;
  const updateThreshold = (next: number) => {
    const previousBoundary = decisionBoundary(beta0, beta1, threshold);
    const nextBoundary = decisionBoundary(beta0, beta1, next);
    setThreshold(next);
    setChangeNote(`Probability threshold ${next > threshold ? "increased" : "decreased"} from ${threshold.toFixed(2)} to ${next.toFixed(2)}. ${previousBoundary !== null && nextBoundary !== null ? `The feature-space boundary moved from x = ${previousBoundary.toFixed(2)} to x = ${nextBoundary.toFixed(2)}.` : "The model has no finite feature-space boundary."}`);
  };
  const updateCoefficient = (key: "beta0" | "beta1", next: number) => {
    const old = key === "beta0" ? beta0 : beta1;
    const changed = { beta0, beta1, [key]: next };
    setCoefficientOverride(changed);
    const nextBoundary = decisionBoundary(changed.beta0, changed.beta1, threshold);
    setChangeNote(key === "beta1"
      ? `β1 ${next > old ? "increased" : "decreased"} from ${old.toFixed(2)} to ${next.toFixed(2)}. ${next < 0 ? "Probability now decreases as x increases." : next === 0 ? "Probability is constant across x." : `The sigmoid is ${Math.abs(next) > Math.abs(old) ? "steeper" : "flatter"}.`} ${nextBoundary === null ? "There is no finite decision boundary." : `Decision boundary: x = ${nextBoundary.toFixed(2)}.`}`
      : `β0 changed from ${old.toFixed(2)} to ${next.toFixed(2)}, shifting the sigmoid ${beta1 >= 0 ? (next > old ? "left" : "right") : (next > old ? "right" : "left")}. ${nextBoundary === null ? "There is no finite decision boundary." : `Decision boundary: x = ${nextBoundary.toFixed(2)}.`}`);
  };

  const commitCsv = (preview: CsvPreview, featureIndex: number, targetIndex: number) => {
    try {
      const points = csvPoints(preview, featureIndex, targetIndex);
      setImported(points);
      setImportedLabel(preview.name);
      setImportedFeature(preview.columns[featureIndex]);
      setRows(points);
      setDataset("imported");
      setPredX(medianX(points));
      setThreshold(.5);
      setCoefficientOverride(null);
      setSelectedIndex(null);
      setFilterOutcome(null);
      setTrained(true);
      setStatus(`Imported ${points.length} labeled observations`);
      setCsvPreview(null);
      setCsvError("");
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : "Import failed.");
    }
  };

  return (
    <div className="logistic-page">
      <div className="lr-breadcrumb">Supervised Learning <span>›</span> Logistic Regression <span>›</span> <strong>{tab}</strong></div>
      <header className="lr-head">
        <div className="lr-head-icon">
          <svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M6 5v26h25" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d="M8 27c8 0 8-17 18-17h4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round"/><circle cx="10" cy="23" r="2.4" fill="currentColor"/><circle cx="26" cy="11" r="2.4" fill="currentColor"/></svg>
        </div>
        <div>
          <h1>Logistic Regression</h1>
          <p>
            Learn how logistic regression converts a linear score into probability and classifies binary outcomes.
          </p>
        </div>
        <span className="lr-head-dataset">{dataset === "reference" ? "Student Risk Dataset" : current.name}</span>
        <div className="lr-progress">
          <span>
            Lesson Progress
          </span>
          <LabProgressMeter />
        </div>
        <button className="lr-resume" onClick={() => { setTab("Visualize"); setPlaying(true); }}>
          <Play />
          Resume
        </button>
      </header>

      <nav className="lr-tabs" aria-label="Lesson sections">
        {tabs.map((v) => (
          <button
            key={v}
            className={tab === v ? "active" : ""}
            aria-current={tab === v ? "page" : undefined}
            onClick={() => setTab(v)}
          >
            {v}
          </button>
        ))}
      </nav>

      {tab === "Visualize" && <div className="lr-dataset-toolbar">
        <strong>DATASET</strong>
        <Database aria-hidden="true" />
        <select aria-label="Dataset" value={dataset} onChange={event => choose(event.target.value as DatasetKey)}>
          {Object.entries(datasets).map(([key, item]) => <option key={key} value={key}>{item.name}</option>)}
          {imported && <option value="imported">{importedLabel}</option>}
        </select>
        <span>{rows.length} samples · {featureCount} feature{featureCount === 1 ? "" : "s"} · binary target</span>
        <div className="lr-toolbar-actions">
          <button onClick={reset}><RefreshCw />Reset Dataset</button>
          <button onClick={() => fileRef.current?.click()}><Upload />Upload CSV</button>
        </div>
      </div>}
      {tab === "Visualize" && csvPreview && <div className="lr-csv-preview" role="group" aria-label="Map CSV columns">
        <strong>Map columns from {csvPreview.name}</strong>
        <label>Numeric feature <select aria-label="CSV feature column" value={csvFeatureIndex} onChange={event => setCsvFeatureIndex(Number(event.target.value))}>{csvPreview.columns.map((column, index) => <option key={index} value={index}>{column}</option>)}</select></label>
        <label>Binary target <select aria-label="CSV target column" value={csvTargetIndex} onChange={event => setCsvTargetIndex(Number(event.target.value))}>{csvPreview.columns.map((column, index) => <option key={index} value={index}>{column}</option>)}</select></label>
        <button onClick={() => commitCsv(csvPreview, csvFeatureIndex, csvTargetIndex)}>Load {csvPreview.records.length} rows</button>
        <button onClick={() => { setCsvPreview(null); setCsvError(""); }}>Cancel</button>
      </div>}
      {csvError && <p className="lr-csv-error" role="alert">{csvError}</p>}

      <section className={`lr-body ${tab === "Visualize" ? "lr-visual-layout" : ""}`}>
        <div className="lr-main">
          {tab === "Learn" ? (
            <LabLessonPanel tab="Learn" route="/ml/supervised/logistic-regression" />
          ) : tab === "Dataset" ? (
            <div className="lr-editable-dataset">
              <EditableNumericScatter rows={rows} columns={["x", "y"]} target="y" onChange={edited => {
                const next = edited.map(row => ({ x: Number(row.x), y: Number(row.y) >= 0.5 ? 1 : 0 }));
                if (next.every(point => Number.isFinite(point.x))) setRows(next);
              }} />
              <DataTable rows={rows} setRows={setRows} feature={current.feature} />
            </div>
          ) : tab === "Explain" ? (
            <article className="lr-card lr-panel lr-inference">
              <h2>Live test / inference</h2>
              <p>Enter a new {current.feature} value. The fitted sigmoid estimates its class 1 probability, then applies the current decision threshold.</p>
              <label htmlFor="lr-inference-x">{current.feature}</label>
              <input id="lr-inference-x" type="number" step="any" value={predX} onChange={(event) => setPredX(Number(event.target.value))} />
              <div className="lr-inference-results" role="status">
                <div><span>Linear score (log odds)</span><strong>{inspectZ.toFixed(3)}</strong></div>
                <div><span>Class 1 probability</span><strong>{(inspectP * 100).toFixed(1)}%</strong></div>
                <div><span>Predicted class at {(threshold * 100).toFixed(0)}% threshold</span><strong>{inspectClass === 1 ? "Class 1 · Positive" : "Class 0 · Negative"}</strong></div>
              </div>
              <p>Prediction uses the current trained coefficients and threshold. Change either one to see the result update.</p>
            </article>
          ) : tab !== "Visualize" ? (
            <Generic
              tab={tab}
              loss={model?.lossHistory ?? []}
              probability={inspectP}
            />
          ) : (
            <>
              <article className={`lr-card lr-chart-card lr-chart-card--${view}`}>
                {view !== "logodds" && (
                  <>
                    <div className="lr-chart-head">
                      <h2>Probability Curve &amp; Decision Boundary</h2>
                      <div className="lr-playback" aria-label="Training walkthrough">
                        <button onClick={() => { setStep(0); setPlaying(true); }}><Play />Play</button>
                        <button onClick={() => setPlaying(value => !value)}>{playing ? <Pause /> : <Play />}{playing ? "Pause" : "Resume"}</button>
                        <button onClick={() => { setPlaying(false); setStep(value => Math.min(lessonSteps.length - 1, value + 1)); }}><SkipForward />Step</button>
                        <button onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw />Restart</button>
                        <span>Step {step + 1} / {lessonSteps.length} · {lessonSteps[step]}</span>
                      </div>
                      <div className="lr-legend">
                        <span><i className="neg" />Actual class 0 (Fail)</span>
                        <span><i className="pos" />Actual class 1 (Pass)</span>
                        <span><i className="lr-legend-curve" />Predicted probability (sigmoid)</span>
                        <span><i className="lr-legend-threshold" />Threshold (τ = {threshold.toFixed(2)})</span>
                        <span><i className="lr-legend-boundary" />Decision boundary ({boundary === null ? "none" : `x = ${boundary.toFixed(1)}`})</span>
                      </div>
                    </div>
                    <SigmoidPlot
                      rows={rows}
                      proba={proba}
                      threshold={threshold}
                      feature={current.feature}
                      boundary={boundary}
                      probeX={predX}
                      selectedIndex={selectedIndex}
                      filterOutcome={filterOutcome}
                      showRegions={showRegions}
                      showSampleLabels={showSampleLabels}
                      onProbe={(x) => { setPredX(x); setSelectedIndex(null); }}
                      onSelect={(index) => { setSelectedIndex(index); setPredX(rows[index].x); }}
                    />
                    <div className="lr-probe-tooltip" role="status">
                      <b>x = {predX.toFixed(1)}</b>
                      <span>Actual class = {probeSample ? (probeSample.y ? "Pass" : "Fail") : "unlabeled probe"}</span>
                      <span>P(y = 1) = {inspectP.toFixed(2)}</span>
                      <span>Threshold = {threshold.toFixed(2)}</span>
                      <span>Predicted = {inspectClass ? "Pass" : "Fail"}</span>
                      <strong>{probeOutcome ? `Result = ${probeOutcome} · ${probeOutcome === "TP" ? "True Positive" : probeOutcome === "TN" ? "True Negative" : probeOutcome === "FP" ? "False Positive" : "False Negative"}` : "Select an observed point to see TP / TN / FP / FN"}</strong>
                    </div>
                    <div className="lr-feature-strip" aria-label="Feature-Space Classification">
                      <strong>Feature-Space Classification <Info /></strong>
                      <div className="lr-strip-track">
                        {boundary !== null && boundary > xMin && boundary < xMax ? <>
                          <div className={classAtMin ? "positive" : "negative"} style={{ width: `${((boundary - xMin) / (xMax - xMin)) * 100}%` }}><b>Class {classAtMin} region</b><span>x &lt; {boundary.toFixed(1)} → predict {classAtMin}</span></div>
                          <div className={classAtMax ? "positive" : "negative"} style={{ flex: 1 }}><b>Class {classAtMax} region</b><span>x ≥ {boundary.toFixed(1)} → predict {classAtMax}</span></div>
                          <em style={{ left: `${((boundary - xMin) / (xMax - xMin)) * 100}%` }}>x = {boundary.toFixed(1)}</em>
                        </> : <div className={classAtMin ? "positive" : "negative"} style={{ width: "100%" }}><b>Class {classAtMin} across this range</b><span>{boundary === null ? "No finite decision boundary" : "Boundary is outside the visible data range"}</span></div>}
                      </div>
                    </div>
                    <div className="lr-plot-equations" aria-label="Logistic regression equations">z = β₀ + β₁x <span>·</span> P(y = 1 | x) = σ(z) <span>·</span> σ(z) = 1 / (1 + e⁻ᶻ)</div>
                  </>
                )}

                {view !== "probability" && (
                  <div className="lr-logodds">
                    <span className="lr-card-title">
                      Linear Log-Odds (Logit) Space
                      <span title="Logistic Regression is linear in log-odds: z = β₀ + β₁x. The sigmoid maps this score to probability."><Info /></span>
                    </span>
                    <p className="lr-logodds-copy">The logit is a straight line in x. The horizontal cutoff is logit(τ); its intersection with the line gives the same x boundary as the probability chart.</p>
                    <div className="lr-legend lr-logodds-legend">
                      <span><i className="pos" />Positive</span>
                      <span><i className="neg" />Negative</span>
                      <span><i className="hint" />Each dot is one sample</span>
                    </div>
                    <LogOddsStrip
                      rows={rows}
                      logit={(x) => beta0 + beta1 * x}
                      threshold={threshold}
                    />
                  </div>
                )}
              </article>

              <div className="lr-metrics">
                <article className="lr-card lr-analysis-confusion">
                  <span className="lr-card-title">
                    Confusion Matrix <span title="Held-out test set at the current threshold."><Info /></span>
                  </span>
                  <table className="lr-confusion">
                    <caption>Predicted</caption>
                    <thead>
                      <tr>
                        <th className="corner" />
                        <th>Negative</th>
                        <th>Positive</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th>Negative</th>
                        <td className="hit"><button type="button" className={filterOutcome === "TN" ? "active" : ""} aria-pressed={filterOutcome === "TN"} onClick={() => setFilterOutcome(filterOutcome === "TN" ? null : "TN")}>TN {testConfusion.tn}</button></td>
                        <td className="miss"><button type="button" className={filterOutcome === "FP" ? "active" : ""} aria-pressed={filterOutcome === "FP"} onClick={() => setFilterOutcome(filterOutcome === "FP" ? null : "FP")}>FP {testConfusion.fp}</button></td>
                      </tr>
                      <tr>
                        <th>Positive</th>
                        <td className="miss"><button type="button" className={filterOutcome === "FN" ? "active" : ""} aria-pressed={filterOutcome === "FN"} onClick={() => setFilterOutcome(filterOutcome === "FN" ? null : "FN")}>FN {testConfusion.fn}</button></td>
                        <td className="hit"><button type="button" className={filterOutcome === "TP" ? "active" : ""} aria-pressed={filterOutcome === "TP"} onClick={() => setFilterOutcome(filterOutcome === "TP" ? null : "TP")}>TP {testConfusion.tp}</button></td>
                      </tr>
                    </tbody>
                  </table>
                  {filterOutcome && <p className="lr-filter-note">Showing {filterOutcome} samples. Click the cell again to clear.</p>}
                </article>

                <article className="lr-card lr-analysis-metrics">
                  <span className="lr-card-title">
                    Metrics (Test Set) <Info />
                  </span>
                  <div className="lr-test-metrics">
                    <span>Accuracy <b>{(testConfusion.accuracy * 100).toFixed(1)}%</b></span>
                    <span>Precision <b>{(testConfusion.precision * 100).toFixed(1)}%</b></span>
                    <span>Recall <b>{(testConfusion.recall * 100).toFixed(1)}%</b></span>
                    <span>F1 Score <b>{(testConfusion.f1 * 100).toFixed(1)}%</b></span>
                    <span>Log Loss <b>{testLogLoss === null ? "—" : testLogLoss.toFixed(3)}</b></span>
                  </div>
                </article>

                <article className="lr-card lr-analysis-equation">
                  <span className="lr-card-title">Model Equation <Info /></span>
                  <div className="lr-big-equation">z = <em>{beta0.toFixed(2)}</em> {beta1 < 0 ? "−" : "+"} <strong>{Math.abs(beta1).toFixed(2)}x</strong></div>
                  <p>P(y = 1 | x) = σ(z)</p>
                  <p>σ(z) = 1 / (1 + e⁻ᶻ)</p>
                </article>

                <article className="lr-card lr-analysis-prediction">
                  <span className="lr-card-title">Prediction (at x = {predX.toFixed(1)}) <Info /></span>
                  <p>x = {predX.toFixed(1)}</p>
                  <p>z = {inspectZ.toFixed(2)}</p>
                  <p>P(y = 1) = {inspectP.toFixed(2)}</p>
                  <p>Prediction = <strong>{inspectClass ? "Positive" : "Negative"}</strong></p>
                </article>

                <article className="lr-card lr-analysis-insight">
                  <span className="lr-card-title">Log-Odds Insight <Info /></span>
                  <p className="lr-insight-formula">log(P / (1 − P)) = z</p>
                  <p>At x = {predX.toFixed(1)}, log({inspectP.toFixed(2)} / {(1 - inspectP).toFixed(2)}) = {inspectZ.toFixed(2)}</p>
                  <small>{inspectZ >= 0 ? "Positive log-odds favor class 1." : "Negative log-odds favor class 0."}</small>
                </article>
              </div>

              {model && (
                <ClassificationDiagnosticsPanel
                  algorithm="Logistic regression"
                  dataset={current.name}
                  samples={rows.length}
                  features={model.split.trainX[0]?.length ?? 1}
                  classes={model.split.nClasses}
                  split={`stratified ${model.split.nTrain}/${model.split.nTest}`}
                  seed={42}
                  state={trained ? "TRAINED" : "STALE — RETRAIN REQUIRED"}
                  scoreKind="probability"
                  train={
                    trainMetrics
                      ? {
                          accuracy: trainMetrics.accuracy,
                          f1: trainMetrics.f1,
                        }
                      : undefined
                  }
                  test={testMetrics ?? metrics}
                  rocAuc={roc?.auc}
                  prAuc={pr}
                  baselineAccuracy={baseline?.accuracy}
                  sweep={sweep}
                  suitability="Learns a linear log-odds surface. Works on linearly separable or overlapping classes; fails on XOR without extra features. Threshold changes labels without retraining."
                />
              )}
            </>
          )}
        </div>

        <aside className="lr-rail" aria-label="Lab settings">
          {tab === "Visualize" && <div className="lr-visual-rail">
            <section className="lr-card lr-model-controls">
              <h2>⚙ <span>MODEL CONTROLS</span></h2>
              <label className="lr-control-label" htmlFor="lr-fit-mode">Fit Mode</label>
              <select id="lr-fit-mode" value={fitMode} onChange={event => {
                const next = event.target.value as "auto" | "manual";
                setFitMode(next);
                setManualOpen(next === "manual");
                if (next === "auto") setCoefficientOverride(null);
              }}>
                <option value="auto">Auto Fit (Recommended)</option>
                <option value="manual">Manual Experiment</option>
              </select>
              <small className="lr-control-help">{fitMode === "auto" ? "Model coefficients are automatically estimated from the current dataset." : "Custom coefficients update the sigmoid without retraining."}</small>
              <div className="lr-coeff-cards">
                <div><span>Intercept (β₀)</span><strong>{beta0.toFixed(2)}</strong><small>{fitMode === "auto" ? "Calculated from current dataset" : "Manual value"}</small></div>
                <div><span>Coefficient (β₁)</span><strong>{beta1.toFixed(3)}</strong><small>{fitMode === "auto" ? "Calculated from current dataset" : "Manual value"}</small></div>
              </div>
              <label className="lr-control-label" htmlFor="lr-visual-threshold">Probability Threshold (τ) <output>{threshold.toFixed(2)}</output></label>
              <input id="lr-visual-threshold" aria-label="Probability Threshold" type="range" min="0.05" max="0.95" step="0.01" value={threshold} onChange={event => updateThreshold(Number(event.target.value))}/>
              <div className="lr-range-ends"><span>0.05</span><span>0.95</span></div>
              <label className="lr-control-label" htmlFor="lr-visual-prediction">Prediction X ({current.feature}) <output>{predX.toFixed(1)}</output></label>
              <input id="lr-visual-prediction" aria-label={`Prediction X ${current.feature}`} type="range" min={xMin} max={xMax} step={Math.max(.01, (xMax - xMin) / 1000)} value={Math.max(xMin, Math.min(xMax, predX))} onChange={event => { setPredX(Number(event.target.value)); setSelectedIndex(null); }}/>
              <div className="lr-range-ends"><span>{fmtTick(xMin)}</span><span>{fmtTick(xMax)}</span></div>
              <div className="lr-visual-toggles">
                <label><input type="checkbox" checked={showRegions} onChange={event => setShowRegions(event.target.checked)}/>Show Decision Regions</label>
                <label><input type="checkbox" checked={showSampleLabels} onChange={event => setShowSampleLabels(event.target.checked)}/>Show Sample Labels</label>
                <label><input type="checkbox" checked={view !== "probability"} onChange={event => setView(event.target.checked ? "both" : "probability")}/>Show Log-Odds</label>
              </div>
              <button className="lr-manual-toggle" aria-expanded={manualOpen} onClick={() => { setManualOpen(value => !value); setFitMode("manual"); }}>Manual Experiment (Custom β₀ &amp; β₁) <ChevronDown /></button>
              {manualOpen && <div className="lr-manual-fields">
                <label>Intercept β₀ <output>{beta0.toFixed(2)}</output><input aria-label="Intercept beta zero" type="range" min={-beta0Limit} max={beta0Limit} step="0.05" value={beta0} onChange={event => updateCoefficient("beta0", Number(event.target.value))}/></label>
                <label>Coefficient β₁ <output>{beta1.toFixed(3)}</output><input aria-label="Coefficient beta one" type="range" min={-beta1Limit} max={beta1Limit} step="0.005" value={beta1} onChange={event => updateCoefficient("beta1", Number(event.target.value))}/></label>
              </div>}
              <small className="lr-control-help" role="status">{changeNote}</small>
            </section>
            <div className="lr-summary-column">
              <section className="lr-card lr-odds-card"><h2>ODDS <small>(at x = {predX.toFixed(1)})</small></h2><strong>{odds >= 10000 ? odds.toExponential(2) : odds.toFixed(2)} : 1</strong><span>At current probe</span></section>
              <section className="lr-card lr-fit-card"><h2>FIT QUALITY</h2><svg viewBox="0 0 200 110" role="img" aria-label={`Test ROC AUC ${roc?.auc.toFixed(2) ?? "unavailable"}`}><path d="M20 100 A80 80 0 0 1 180 100" className="lr-gauge-track"/><path d="M20 100 A80 80 0 0 1 180 100" className="lr-gauge-value" style={{ strokeDasharray: `${Math.max(0, Math.min(1, roc?.auc ?? 0)) * 251} 251` }}/></svg><strong>{roc?.auc.toFixed(2) ?? "—"}</strong><span>Test ROC AUC</span></section>
            </div>
          </div>}
          <div className="lr-legacy-rail">
          <section>
            <header>
              <i>1</i>
              <b>Model Controls</b>
            </header>
            <div className="lr-field">
              <span>
                <label htmlFor="lr-threshold">Probability Threshold <span title="The probability cutoff used to turn P(y = 1 | x) into a predicted class."><Info /></span></label>
                <b>{threshold.toFixed(2)}</b>
              </span>
              <div className="lr-slider">
                0.05
                <input
                  id="lr-threshold"
                  aria-label="Probability Threshold"
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => updateThreshold(Number(e.target.value))}
                />
                0.95
              </div>
              <small>Predict class 1 if P(y = 1 | x) ≥ {threshold.toFixed(2)}</small>
            </div>
            <div className="lr-field">
              <span><label htmlFor="lr-beta0">Intercept β₀ <span title="The linear score when x is zero. Changing it shifts the sigmoid horizontally."><Info /></span></label><b>{beta0.toFixed(2)}</b></span>
              <div className="lr-slider">−{beta0Limit}<input id="lr-beta0" aria-label="Intercept beta zero" type="range" min={-beta0Limit} max={beta0Limit} step="0.05" value={beta0} onChange={(e) => updateCoefficient("beta0", Number(e.target.value))} />+{beta0Limit}</div>
            </div>
            <div className="lr-field">
              <span><label htmlFor="lr-beta1">Coefficient β₁ <span title="Controls how strongly x changes log-odds. Its sign sets the sigmoid direction; its magnitude sets steepness."><Info /></span></label><b>{beta1.toFixed(2)}</b></span>
              <div className="lr-slider">−{beta1Limit}<input id="lr-beta1" aria-label="Coefficient beta one" type="range" min={-beta1Limit} max={beta1Limit} step="0.05" value={beta1} onChange={(e) => updateCoefficient("beta1", Number(e.target.value))} />+{beta1Limit}</div>
            </div>
            <b>View</b>
            <div className="lr-segmented">
              {(
                [
                  ["probability", "Probability"],
                  ["logodds", "Log-Odds"],
                  ["both", "Both"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  className={view === key ? "active" : ""}
                  aria-pressed={view === key}
                  onClick={() => setView(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="lr-change-note" role="status"><Lightbulb /><span><b>What changed?</b>{changeNote}</span></div>
          </section>

          <section>
            <header>
              <i>2</i>
              <b>Dataset</b>
            </header>
            <div className="lr-dataset-pick">
              <span>
                <strong>{current.name}</strong>
                {current.source === "Recommended" && (
                  <em className="lr-badge">Recommended</em>
                )}
              </span>
              <small>
                N = {rows.length} samples • {featureCount} feature
                {featureCount > 1 ? "s" : ""}
              </small>
              <ChevronDown />
              <select
                aria-label="Dataset"
                value={dataset}
                onChange={(e) => choose(e.target.value as DatasetKey)}
              >
                <option value="reference">Sigmoid reference (0–1)</option>
                <option value="overlap">Overlapping binary classes</option>
                {imported && <option value="imported">{importedLabel}</option>}
              </select>
            </div>

            <div className="lr-button-row">
              <button
                onClick={() =>
                  choose(dataset === "reference" ? "overlap" : "reference")
                }
              >
                <RefreshCw />
                Switch Dataset
              </button>
              <button onClick={() => fileRef.current?.click()}>
                <Upload />
                Upload CSV
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const preview = parseCsv(await f.text(), f.name.replace(/\.csv$/i, "") || "Imported CSV");
                    setCsvError("");
                    if (preview.columns.length === 2) commitCsv(preview, 0, 1);
                    else { setCsvPreview(preview); setCsvFeatureIndex(0); setCsvTargetIndex(preview.columns.length - 1); }
                  } catch (err) {
                    setCsvError(err instanceof Error ? err.message : "Import failed");
                  }
                  e.target.value = "";
                }}
              />
            </div>

            <div className="lr-button-row">
              <Link to="/ml/lab/dataset-manager">Dataset Manager</Link>
              <button
                onClick={() => {
                  setDataLoaded(true);
                  setStatus(`${current.name} loaded and ready for training`);
                }}
              >
                Load
              </button>
            </div>

            <dl className="lr-facts">
              <div>
                <dt>Feature</dt>
                <dd>{current.feature}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>Numeric</dd>
              </div>
              <div>
                <dt>Range</dt>
                <dd>
                  {fmtTick(xMin)} – {fmtTick(xMax)}
                </dd>
              </div>
              <div>
                <dt>Positive Rate</dt>
                <dd>{(positive * 100).toFixed(0)}%</dd>
              </div>
            </dl>

            {dataLoaded && (
              <div className="lr-next-steps">
                <b>Next steps</b>
                <div>
                  <Link to="/ml/lab/algorithm-comparison">Dashboard</Link>
                  <Link to="/ml/preprocessing/missing-values">Statistics</Link>
                  <Link to="/ml/lab/dataset-manager">Data Grid</Link>
                </div>
              </div>
            )}
          </section>

          <section>
            <header>
              <i>3</i>
              <b>Model</b>
              <button className="reset" onClick={reset}>
                Reset
              </button>
            </header>
            <div className="lr-field">
              <span>
                Regularization (L2)
                <b>{l2.toFixed(1)}</b>
              </span>
              <div className="lr-slider">
                0.01
                <input
                  aria-label="L2 regularization"
                  type="range"
                  min="0.01"
                  max="10"
                  step="0.01"
                  value={l2}
                  onChange={(e) => {
                    setL2(Number(e.target.value));
                    setTrained(false);
                  }}
                />
                10
              </div>
            </div>
            <button className="lr-train" onClick={retrain}>
              <Play />
              Train Model
            </button>
            <div className="lr-status">
              <b>
                Model Status
                <span>{trained ? "● Trained" : "○ Pending"}</span>
              </b>
              <small>
                {status}
                {trained && <Check />}
              </small>
            </div>
          </section>
          </div>
        </aside>
      </section>

      <footer className="lr-statusbar">
        <b>
          Active Dataset: <strong>{current.name}</strong>
          {current.source === "Recommended" && (
            <em className="lr-badge">Recommended</em>
          )}
        </b>
        <span className="sep" />
        Samples: {rows.length}
        <span className="sep" />
        Features: {featureCount}
        <span className="sep" />
        Positive Rate: {(positive * 100).toFixed(0)}%
        <button onClick={() => setTab("Dataset")}>
          <Table2 />
          View Dataset
        </button>
      </footer>
    </div>
  );
}
