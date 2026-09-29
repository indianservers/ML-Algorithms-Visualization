import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { LabProgressMeter } from "../../../../components/common/LabChrome";
import { LabLessonPanel, useUrlTab } from "../../../../components/common/LabTabs";
import {
  Check,
  ChevronDown,
  Info,
  Lightbulb,
  Play,
  RefreshCw,
  Table2,
  Upload,
} from "lucide-react";
import { logisticRegression } from "../../../../lib/algorithms/classification/logisticRegression";
import { binaryMetrics, prAuc, rocCurve } from "../../../../lib/math/metrics";
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

type Point = { x: number; y: number; z?: number };
type DatasetKey = "reference" | "overlap" | "imported";
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

function sigmoid(z: number) {
  return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
}
function logitProbability(p: number) { return Math.log(p / (1 - p)); }
function decisionBoundary(beta0: number, beta1: number, threshold: number) {
  return Math.abs(beta1) < 1e-10 ? null : (logitProbability(threshold) - beta0) / beta1;
}
function outcome(actual: number, predicted: number): Outcome {
  return actual ? (predicted ? "TP" : "FN") : predicted ? "FP" : "TN";
}

// Fixed synthetic binary observations recreate the reference's 0–1 teaching
// example. Their observed class is sampled once, never derived from the live fit.
const referenceRows = (() => {
  let seed = 2026;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: 320 }, (_, i) => {
    const x = (i + random()) / 320;
    return { x, y: random() < sigmoid(12 * (x - 0.5)) ? 1 : 0 };
  });
})();

const datasets = {
  reference: {
    name: "Sigmoid reference (0–1)",
    feature: "Feature x",
    source: "Recommended",
    rows: referenceRows,
  },
  overlap: {
    name: "Overlapping binary classes",
    feature: "Feature x",
    source: "Lab",
    rows: datasetB1D(),
  },
};

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 5) throw Error("CSV requires a header and at least four labeled rows.");
  return lines.slice(1).map((line) => {
    const v = line.split(",").map(Number);
    if (!Number.isFinite(v[0]) || ![0, 1].includes(v.at(-1)!))
      throw Error("CSV needs a numeric feature and binary target.");
    return { x: v[0], y: v.at(-1)! };
  });
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
  return dataset.data.map((row) => {
    const x = Number(row[features[0]]);
    const yRaw = Number(row[target]);
    return {
      x: Number.isFinite(x) ? x : 0,
      y: yRaw >= 0.5 ? 1 : 0,
    };
  });
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
  const W = compact ? 400 : 1030, H = compact ? 400 : 430, L = compact ? 43 : 76, R = compact ? 12 : 36, T = compact ? 70 : 67, B = compact ? 54 : 63;
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
      <g clipPath="url(#lr-plot-clip)">
        <rect x={L} y={T} width={leftEdge - L} height={H - T - B} className={leftClass ? "lr-region-one" : "lr-region-zero"} />
        {visibleBoundary && <rect x={leftEdge} y={T} width={W - R - leftEdge} height={H - T - B} className={rightClass ? "lr-region-one" : "lr-region-zero"} />}
      </g>
      {[0, 0.5, 1].map((v) => (
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
      {rows.map((v, i) => {
        const predicted = proba(v.x) >= threshold ? 1 : 0;
        const result = outcome(v.y, predicted);
        const jitter = ((i * 73) % 17) / 17 * .045;
        return <circle key={i} cx={sx(v.x)} cy={sy(v.y ? .975 - jitter : .025 + jitter)} r={selectedIndex === i ? 6 : 3.5}
          className={`lr-observation ${v.y ? "pt-pos" : "pt-neg"}${selectedIndex === i ? " is-selected" : ""}${filterOutcome && filterOutcome !== result ? " is-dimmed" : ""}`}
          tabIndex={0} role="button" aria-label={`Sample ${i + 1}: actual class ${v.y}, predicted class ${predicted}, ${result}`}
          onClick={() => onSelect(i)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(i); } }}>
          <title>Sample #{i + 1} · x {v.x.toFixed(2)} · actual {v.y} · P {proba(v.x).toFixed(3)} · {result}</title>
        </circle>;
      })}
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

/* ---------------------------------------------------- probability bars */

function ProbabilityHistogram({
  scores,
  threshold,
}: {
  scores: number[];
  threshold: number;
}) {
  const bins = 20;
  const counts = new Array(bins).fill(0) as number[];
  scores.forEach((p) => {
    const i = Math.min(bins - 1, Math.max(0, Math.floor(p * bins)));
    counts[i] += 1;
  });
  const peak = Math.max(1, ...counts);
  const W = 240,
    H = 72,
    B = 16,
    bw = W / bins;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Predicted probability distribution">
      {counts.map((c, i) => {
        const h = (c / peak) * (H - B - 2);
        return (
          <rect
            key={i}
            x={i * bw + 0.6}
            y={H - B - h}
            width={bw - 1.2}
            height={h}
            className={(i + 0.5) / bins >= threshold ? "hb-pos" : "hb-neg"}
          />
        );
      })}
      <line x1="0" x2={W} y1={H - B} y2={H - B} stroke="currentColor" strokeOpacity="0.2" />
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <text key={t} x={t * W} y={H - 4} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"}>
          {t === 0 ? "0" : t.toFixed(2)}
        </text>
      ))}
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
    [selectedIndex, setSelectedIndex] = useState<number | null>(null),
    [filterOutcome, setFilterOutcome] = useState<Outcome | null>(null),
    [changeNote, setChangeNote] = useState("Move a control to see how probability and predicted classes change."),
    [l2, setL2] = useState(1),
    [trained, setTrained] = useState(true),
    [dataLoaded, setDataLoaded] = useState(false),
    [status, setStatus] = useState("Last trained: just now");
  const [predX, setPredX] = useState(0.5);
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

  const posScores = allScores.filter((_, i) => rows[i].y);
  const negScores = allScores.filter((_, i) => !rows[i].y);
  const mean = (list: number[]) =>
    list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
  const selected = selectedIndex === null ? null : rows[selectedIndex] ?? null;
  const selectedProbability = selected ? proba(selected.x) : 0;
  const selectedPredicted = selectedProbability >= threshold ? 1 : 0;
  const selectedOutcome = selected ? outcome(selected.y, selectedPredicted) : null;

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
    setTrained(false);
    setStatus("Dataset changed — retrain to refresh the fit");
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
    setPredX(0.5);
    setCoefficientOverride(null);
    setSelectedIndex(null);
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

  const bars = [
    ["Accuracy", metrics.accuracy],
    ["Precision (PPV)", metrics.precision],
    ["Recall (Sensitivity)", metrics.recall],
    ["F1 Score", metrics.f1],
  ] as const;

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

  return (
    <div className="logistic-page">
      <header className="lr-head">
        <div className="lr-head-icon">
          <svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M3 3v22h22" stroke="currentColor" strokeWidth="2"/><path d="M4 22C9 22 9 21 12 17S16 7 24 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
        </div>
        <div>
          <h1>Logistic Regression</h1>
          <p>
            Learn how logistic regression converts a linear score into probability and classifies binary outcomes.
          </p>
          <small className="lr-head-note">Logistic Regression predicts probability, then applies a threshold to determine the class.</small>
        </div>
        <div className="lr-progress">
          <span>
            Lesson Progress
          </span>
          <LabProgressMeter />
        </div>
        <button className="lr-resume" onClick={() => setStatus("Progress saved")}>
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

      <section className="lr-body">
        <div className="lr-main">
          {tab === "Learn" ? (
            <LabLessonPanel tab="Learn" route="/ml/supervised/logistic-regression" />
          ) : tab === "Dataset" ? (
            <DataTable rows={rows} setRows={setRows} feature={current.feature} />
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
                      <div><h2>Logistic Regression — Probability Curve &amp; Decision Boundary</h2><p>Each observation belongs to class 0 or 1. The sigmoid shows the model’s predicted probability P(y = 1 | x).</p></div>
                      <div className="lr-legend">
                        <span><i className="pos" />Actual class 1</span>
                        <span><i className="neg" />Actual class 0</span>
                        <span><i className="lr-legend-curve" />Predicted probability</span>
                        <span><i className="lr-legend-threshold" />Probability threshold</span>
                        <span><i className="lr-legend-boundary" />Decision boundary</span>
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
                      onProbe={(x) => { setPredX(x); setSelectedIndex(null); }}
                      onSelect={(index) => { setSelectedIndex(index); setPredX(rows[index].x); }}
                    />
                    <div className="lr-chart-footer">
                      <div className="lr-equations" aria-label="Logistic regression equations"><span>Linear score: <b>z = β₀ + β₁x</b></span><span>Probability: <b>P(y = 1 | x) = σ(z)</b></span><span>Sigmoid: <b>σ(z) = 1 / (1 + e⁻ᶻ)</b></span><span>Log-odds: <b>ln(P / (1 − P)) = β₀ + β₁x</b></span></div>
                      <p className="lr-boundary-note" title="The feature value where the predicted probability equals the chosen probability threshold.">Probability threshold <b>τ = {threshold.toFixed(2)}</b> <span>→</span> Decision boundary <b>{boundary === null ? "No finite x boundary" : `x = ${boundary.toFixed(2)}`}</b>{boundary !== null && (boundary < xMin || boundary > xMax) ? " (outside the visible feature range)" : ""}</p>
                      <p className="lr-chart-tip">Logistic Regression is a classification model: the curve gives probability; the threshold converts it into a class. Click a sample or the plot to inspect a value.</p>
                    </div>
                    {selected && <div className="lr-selected-sample" role="status"><strong>Sample #{selectedIndex! + 1}</strong><span>x = {selected.x.toFixed(2)}</span><span>Actual class {selected.y}</span><span>P(y = 1 | x) = {selectedProbability.toFixed(3)}</span><span>τ = {threshold.toFixed(2)}</span><span>Predicted class {selectedPredicted}</span><b>{selectedOutcome} · {selectedOutcome === "TP" ? "True Positive" : selectedOutcome === "TN" ? "True Negative" : selectedOutcome === "FP" ? "False Positive" : "False Negative"}</b></div>}
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
                <article className="lr-card">
                  <span className="lr-card-title">
                    Confusion Matrix (τ = {threshold.toFixed(2)})
                    <span title="Counts of actual classes versus model predictions at the current threshold."><Info /></span>
                  </span>
                  <table className="lr-confusion">
                    <caption>Predicted</caption>
                    <thead>
                      <tr>
                        <th className="corner" />
                        <th>Positive</th>
                        <th>Negative</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th>Positive</th>
                        <td className="hit"><button type="button" className={filterOutcome === "TP" ? "active" : ""} aria-pressed={filterOutcome === "TP"} onClick={() => setFilterOutcome(filterOutcome === "TP" ? null : "TP")}>TP {metrics.tp}</button></td>
                        <td className="miss"><button type="button" className={filterOutcome === "FN" ? "active" : ""} aria-pressed={filterOutcome === "FN"} onClick={() => setFilterOutcome(filterOutcome === "FN" ? null : "FN")}>FN {metrics.fn}</button></td>
                      </tr>
                      <tr>
                        <th>Negative</th>
                        <td className="miss"><button type="button" className={filterOutcome === "FP" ? "active" : ""} aria-pressed={filterOutcome === "FP"} onClick={() => setFilterOutcome(filterOutcome === "FP" ? null : "FP")}>FP {metrics.fp}</button></td>
                        <td className="hit"><button type="button" className={filterOutcome === "TN" ? "active" : ""} aria-pressed={filterOutcome === "TN"} onClick={() => setFilterOutcome(filterOutcome === "TN" ? null : "TN")}>TN {metrics.tn}</button></td>
                      </tr>
                    </tbody>
                  </table>
                  {filterOutcome && <p className="lr-filter-note">Showing {filterOutcome} samples. Click the cell again to clear.</p>}
                </article>

                <article className="lr-card">
                  <span className="lr-card-title">
                    Key Metrics
                    <Info />
                  </span>
                  <div className="lr-bars">
                    {bars.map(([label, value], i) => (
                      <label key={label}>
                        {label}
                        <strong>{(value * 100).toFixed(1)}%</strong>
                        <i>
                          <em
                            className={`b${i + 1}`}
                            style={{ width: `${value * 100}%` }}
                          />
                        </i>
                      </label>
                    ))}
                  </div>
                </article>

                <article className="lr-card">
                  <span className="lr-card-title">
                    Probability Overview
                    <Info />
                  </span>
                  <dl className="lr-stats">
                    <dt>Mean predicted probability</dt><dd>{mean(allScores).toFixed(2)}</dd>
                    <dt>Mean P (Positive)</dt>
                    <dd>{mean(posScores).toFixed(2)}</dd>
                    <dt>Mean P (Negative)</dt>
                    <dd>{mean(negScores).toFixed(2)}</dd>
                    <dt>Min / Max Probability</dt>
                    <dd>
                      {allScores.length
                        ? `${Math.min(...allScores).toFixed(2)} / ${Math.max(...allScores).toFixed(2)}`
                        : "—"}
                    </dd>
                    <dt>Test ROC-AUC / PR-AUC</dt>
                    <dd>
                      {roc ? roc.auc.toFixed(3) : "—"} /{" "}
                      {pr != null ? pr.toFixed(3) : "—"}
                    </dd>
                  </dl>
                  <div className="lr-histogram">
                    <ProbabilityHistogram
                      scores={allScores}
                      threshold={threshold}
                    />
                    <div style={{ textAlign: "center", fontSize: 10, color: "var(--lab-muted)" }}>
                      P(Positive)
                    </div>
                  </div>
                </article>

                <article className="lr-card">
                  <span className="lr-card-title">
                    Odds Insight
                    <Info />
                  </span>
                  <div className="lr-odds-row">
                    Probability at probe <b>{inspectP.toFixed(3)}</b>
                  </div>
                  <div className="lr-odds-row">
                    Odds P / (1 − P) <b>{Math.exp(Math.min(50, inspectZ)).toFixed(2)} : 1</b>
                  </div>
                  <div className="lr-odds-row">
                    Log-odds ln(P / (1 − P)) <b>{inspectZ.toFixed(3)}</b>
                  </div>
                  <div className="lr-odds-row">Linear predictor β₀ + β₁x <b>{inspectZ.toFixed(3)}</b></div>
                  <label className="lr-inline-field">
                    Inspect {current.feature}
                    <input
                      aria-label="Prediction feature value"
                      type="number"
                      value={predX}
                      onChange={(e) => setPredX(Number(e.target.value))}
                    />
                  </label>
                  <p className="lr-odds-sub" style={{ textAlign: "left", margin: 0 }}>
                    x = {predX.toFixed(2)} · predicted class {inspectClass} at τ = {threshold.toFixed(2)}
                  </p>
                  <div className="lr-callout">
                    <Lightbulb />
                    <span>
                      Odds &gt; 1 favor the positive class. Odds &lt; 1 favor
                      the negative class.
                    </span>
                  </div>
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
                    const p = parseCsv(await f.text());
                    setImported(p);
                    setImportedLabel(
                      f.name.replace(/\.csv$/i, "") || "Imported CSV",
                    );
                    setImportedFeature("Feature x");
                    setRows(p);
                    setDataset("imported");
                    setPredX(medianX(p));
                    setCoefficientOverride(null);
                    setSelectedIndex(null);
                    setFilterOutcome(null);
                    setChangeNote(`Imported ${p.length} labeled observations. The model fit and chart range updated.`);
                    setStatus(`Imported ${p.length} rows`);
                  } catch (err) {
                    setStatus(
                      err instanceof Error ? err.message : "Import failed",
                    );
                  }
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
