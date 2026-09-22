import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LabProgressMeter } from "../../../../components/common/LabChrome";
import { LabLessonPanel, useUrlTab } from "../../../../components/common/LabTabs";
import {
  Check,
  ChevronDown,
  Info,
  Lightbulb,
  LineChart,
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
import {
  datasetA1D,
  datasetB1D,
  datasetCXor1DFails,
  datasetH1D,
  datasetHSevere1D,
} from "../../../../lib/classification/classificationDatasets";
import { ClassificationDiagnosticsPanel } from "../../../../components/ml/ClassificationDiagnosticsPanel";
import "./LogisticRegressionPage.css";
import { loadActiveDatasetMap } from "../../../../lib/experimentWorkspace";
import type { LoadedAlgorithmDataset } from "../../../../data/algorithmDatasets";

type Point = { x: number; y: number; z?: number };
type DatasetKey =
  | "admissions"
  | "separable"
  | "overlap"
  | "imbalanced"
  | "severe"
  | "xor"
  | "imported";
type View = "probability" | "logodds" | "both";

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

const admissions = Array.from({ length: 120 }, (_, i) => {
  const x = 8 + ((i * 37) % 93),
    noise = ((i * 17) % 23) - 11;
  return { x, y: x + noise > 61 ? 1 : 0 };
});

const datasets = {
  admissions: {
    name: "University Admissions",
    feature: "Exam Score",
    source: "Recommended",
    rows: admissions,
  },
  separable: {
    name: "Perfect separable (lab A)",
    feature: "Feature x",
    source: "Lab",
    rows: datasetA1D(),
  },
  overlap: {
    name: "Overlapping binary (lab B)",
    feature: "Feature x",
    source: "Lab",
    rows: datasetB1D(),
  },
  imbalanced: {
    name: "Imbalanced 90/10 (lab H)",
    feature: "Feature x",
    source: "Lab",
    rows: datasetH1D(),
  },
  severe: {
    name: "Severe imbalance 95/5",
    feature: "Feature x",
    source: "Lab",
    rows: datasetHSevere1D(),
  },
  xor: {
    name: "XOR two features (lab C)",
    feature: "x1, x2",
    source: "Lab",
    rows: datasetCXor1DFails(),
  },
};

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 3) throw Error("CSV requires a header and two rows.");
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
    const point: Point = {
      x: Number.isFinite(x) ? x : 0,
      y: yRaw >= 0.5 ? 1 : 0,
    };
    if (features[1]) {
      const z = Number(row[features[1]]);
      if (Number.isFinite(z)) point.z = z;
    }
    return point;
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
}: {
  rows: Point[];
  proba: (x: number) => number;
  threshold: number;
  feature: string;
}) {
  const W = 1030,
    H = 300,
    L = 74,
    R = 168,
    T = 56,
    B = 56;
  const xs = rows.map((v) => v.x);
  const rawMin = Math.min(...xs),
    rawMax = Math.max(...xs);
  const pad = (rawMax - rawMin || 1) * 0.06;
  const xmin = rawMin - pad,
    xmax = rawMax + pad;

  const sx = (x: number) => L + ((x - xmin) / (xmax - xmin)) * (W - L - R);
  const sy = (p: number) => H - B - p * (H - T - B);

  const curve = Array.from({ length: 160 }, (_, i) => {
    const x = xmin + (i / 159) * (xmax - xmin);
    return { x, p: proba(x) };
  });
  const path = curve
    .map((v, i) => `${i ? "L" : "M"}${sx(v.x).toFixed(1)},${sy(v.p).toFixed(1)}`)
    .join(" ");

  // Decision boundary: the feature value where P crosses the threshold.
  let boundary: number | null = null;
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1],
      b = curve[i];
    if ((a.p - threshold) * (b.p - threshold) <= 0 && a.p !== b.p) {
      boundary = a.x + ((threshold - a.p) / (b.p - a.p)) * (b.x - a.x);
      break;
    }
  }

  const ticks = niceTicks(rawMin, rawMax, 5);

  return (
    <svg
      className="lr-plot"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Sigmoid probability curve over ${feature} with decision threshold at ${Math.round(threshold * 100)} percent`}
    >
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} className="grid" />
          <text x={L - 16} y={sy(v) + 4} textAnchor="end">
            {v.toFixed(1)}
          </text>
        </g>
      ))}

      <line x1={L} x2={W - R} y1={H - B} y2={H - B} className="axis" />

      {ticks.map((t) => (
        <text key={t} x={sx(t)} y={H - B + 22}>
          {fmtTick(t)}
        </text>
      ))}

      {boundary !== null && (
        <>
          <line
            x1={sx(boundary)}
            x2={sx(boundary)}
            y1={sy(threshold)}
            y2={H - B}
            className="threshold-line"
          />
          <line
            x1={sx(boundary)}
            x2={sx(boundary)}
            y1={T - 12}
            y2={sy(threshold)}
            className="threshold-stem"
          />
          <rect
            x={sx(boundary) - 55}
            y={T - 40}
            width="110"
            height="25"
            rx="5"
            className="threshold-pill"
          />
          <path
            d={`M${sx(boundary) - 5},${T - 15} L${sx(boundary)},${T - 9} L${sx(boundary) + 5},${T - 15} Z`}
            className="threshold-label"
          />
          <text x={sx(boundary)} y={T - 23} className="threshold-label">
            Threshold: {Math.round(threshold * 100)}
          </text>
          <circle
            cx={sx(boundary)}
            cy={sy(threshold)}
            r="5"
            className="cross-dot"
          />
        </>
      )}

      <path d={path} className="sigmoid" />

      {rows.map((v, i) => (
        <circle
          key={i}
          cx={sx(v.x)}
          cy={H - B}
          r="4.5"
          className={v.y ? "pt-pos" : "pt-neg"}
        />
      ))}

      <text x={(L + W - R) / 2} y={H - 10} className="axis-title">
        {feature}
      </text>
      <text
        transform={`translate(20 ${(T + H - B) / 2}) rotate(-90)`}
        className="axis-title"
      >
        P(Positive)
      </text>

      <text x={W - R + 12} y={T + 2} className="formula">
        Sigmoid Function
      </text>
      <text x={W - R + 12} y={T + 26} className="formula-math">
        σ(z) = 1 / (1 + e⁻ᶻ)
      </text>
    </svg>
  );
}

/* -------------------------------------------------------- log-odds strip */

function LogOddsStrip({
  rows,
  logit,
}: {
  rows: Point[];
  logit: (x: number) => number;
}) {
  const W = 1030,
    H = 150,
    L = 74,
    R = 74,
    axisY = 96;
  const zs = rows.map((r) => logit(r.x));
  const bound = Math.max(2, Math.ceil(Math.max(...zs.map(Math.abs)) || 2));
  const sx = (z: number) => L + ((z + bound) / (2 * bound)) * (W - L - R);
  const ticks = niceTicks(-bound, bound, 6).filter(
    (t) => t >= -bound && t <= bound,
  );

  return (
    <svg
      className="lr-plot"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Log-odds space showing each sample's linear score"
    >
      <text x={sx(-bound / 2)} y={30} className="zone-neg">
        Negative (z &lt; 0)
      </text>
      <text x={sx(-bound / 2)} y={48} className="zone-neg">
        P &lt; 0.5
      </text>
      <text x={sx(bound / 2)} y={30} className="zone-pos">
        Positive (z &gt; 0)
      </text>
      <text x={sx(bound / 2)} y={48} className="zone-pos">
        P &gt; 0.5
      </text>

      <text x={sx(0)} y={30} className="zone-zero">
        z = 0
      </text>
      <text x={sx(0)} y={48} className="zone-zero">
        P = 0.5
      </text>

      <line x1={L} x2={W - R} y1={axisY} y2={axisY} className="axis" />
      <line
        x1={sx(0)}
        x2={sx(0)}
        y1={58}
        y2={axisY}
        className="threshold-line"
      />

      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={axisY} y2={axisY + 6} className="axis" />
          <text x={sx(t)} y={axisY + 22}>
            {fmtTick(t)}
          </text>
        </g>
      ))}

      {rows.map((r, i) => {
        const z = Math.max(-bound, Math.min(bound, zs[i]));
        return (
          <circle
            key={i}
            cx={sx(z)}
            cy={axisY}
            r="4.5"
            className={r.y ? "pt-pos" : "pt-neg"}
          />
        );
      })}

      <circle cx={sx(0)} cy={axisY} r="4.5" className="cross-dot" />

      <text x={(L + W - R) / 2} y={H - 8} className="axis-title">
        Log-Odds (z)
      </text>
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
        <button onClick={() => setRows((v) => [...v, { x: 60, y: 1 }])}>
          Add Row
        </button>
        <button onClick={() => setRows((v) => v.slice(0, -1))}>
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
  const [dataset, setDataset] = useState<DatasetKey>("admissions"),
    [rows, setRows] = useState<Point[]>(admissions),
    [imported, setImported] = useState<Point[] | null>(null),
    [importedLabel, setImportedLabel] = useState("Imported CSV"),
    [threshold, setThreshold] = useState(0.5),
    [view, setView] = useState<View>("probability"),
    [l2, setL2] = useState(1),
    [trained, setTrained] = useState(true),
    [dataLoaded, setDataLoaded] = useState(false),
    [status, setStatus] = useState("Last trained: just now");
  const [predX, setPredX] = useState(72);
  const fileRef = useRef<HTMLInputElement>(null),
    appliedHandoffKey = useRef<string | null>(null),
    model = useMemo(() => {
      try {
        return train(rows, l2);
      } catch {
        return null;
      }
    }, [rows, l2]);

  const testScores = model
    ? model.split.testX.map((row) => model.probaRow(row))
    : [];
  const testPred = applyThreshold(testScores, threshold);
  const metrics = model
    ? binaryMetrics(model.split.testY, testPred)
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
    ? model.split.trainX.map((row) => model.probaRow(row))
    : [];
  const trainMetrics = model
    ? binaryMetrics(model.split.trainY, applyThreshold(trainScores, threshold))
    : null;
  const sweep = model ? thresholdSweep(model.split.testY, testScores) : [];
  const baseline = model ? majorityBaseline(model.split.testY) : null;
  const inspectZ = model ? model.logit(predX) : 0;
  const inspectP = model ? model.proba(predX) : 0;
  const inspectClass = inspectP >= threshold ? 1 : 0;
  const positive = rows.filter((v) => v.y).length / Math.max(1, rows.length);

  const allScores = model ? rows.map((r) => model.probaRow(featuresOf(r))) : [];
  const posScores = allScores.filter((_, i) => rows[i].y);
  const negScores = allScores.filter((_, i) => !rows[i].y);
  const mean = (list: number[]) =>
    list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;

  const current =
    dataset === "imported"
      ? {
          name: importedLabel,
          feature: "Feature",
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
    setTrained(false);
    setStatus("Dataset changed — retrain to refresh the fit");
  };

  const applyLoaded = (next: LoadedAlgorithmDataset) => {
    const points = rowsFromLoaded(next);
    if (!points.length) return;
    setImported(points);
    setImportedLabel(next.name);
    setRows(points);
    setDataset("imported");
    setDataLoaded(true);
    setTrained(true);
    setPredX(medianX(points));
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
    setDataset("admissions");
    setRows(admissions);
    setThreshold(0.5);
    setView("probability");
    setL2(1);
    setPredX(medianX(admissions));
    setTrained(true);
    setStatus("Last trained: just now");
  };

  const retrain = () => {
    setTrained(false);
    setStatus("Optimizing cross-entropy…");
    setTimeout(() => {
      setTrained(true);
      setStatus(`Trained on ${rows.length} samples`);
    }, 400);
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

  return (
    <div className="logistic-page">
      <header className="lr-head">
        <div className="lr-head-icon">
          <LineChart />
        </div>
        <div>
          <h1>Logistic Regression</h1>
          <p>
            Objective: Learn how logistic regression models probability and
            makes classifications.
          </p>
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
          ) : tab !== "Visualize" ? (
            <Generic
              tab={tab}
              loss={model?.lossHistory ?? []}
              probability={inspectP}
            />
          ) : (
            <>
              <article className="lr-card lr-chart-card">
                <div className="lr-chart-head">
                  <span className="lr-card-title">
                    <i className="dot" />
                    1D Feature Space: {current.feature}
                    <Info />
                  </span>
                  <div className="lr-legend">
                    <span>
                      <i className="pos" />
                      Positive
                    </span>
                    <span>
                      <i className="neg" />
                      Negative
                    </span>
                    <span>
                      <i className="hint" />
                      Each dot is one sample
                    </span>
                  </div>
                </div>

                {view !== "logodds" && (
                  <SigmoidPlot
                    rows={rows}
                    proba={(x) => model?.proba(x) ?? 0.5}
                    threshold={threshold}
                    feature={current.feature}
                  />
                )}

                <div className="lr-logodds">
                  <span className="lr-card-title">
                    Log-Odds (Logit) Space
                    <Info />
                  </span>
                  <LogOddsStrip
                    rows={rows}
                    logit={(x) => model?.logit(x) ?? 0}
                  />
                </div>
              </article>

              <div className="lr-metrics">
                <article className="lr-card">
                  <span className="lr-card-title">
                    Confusion Matrix (Threshold = {Math.round(threshold * 100)})
                    <Info />
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
                        <td className="hit">{metrics.tp}</td>
                        <td className="miss">{metrics.fn}</td>
                      </tr>
                      <tr>
                        <th>Negative</th>
                        <td className="miss">{metrics.fp}</td>
                        <td className="hit">{metrics.tn}</td>
                      </tr>
                    </tbody>
                  </table>
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
                    Odds at Threshold
                    <b>
                      {(threshold / Math.max(1e-6, 1 - threshold)).toFixed(2)} :
                      1
                    </b>
                  </div>
                  <p className="lr-odds-sub">(P = {threshold.toFixed(2)})</p>
                  <div className="lr-odds-row">
                    Odds at Mean (Positive)
                    <b>
                      {(
                        mean(posScores) / Math.max(1e-6, 1 - mean(posScores))
                      ).toFixed(2)}{" "}
                      : 1
                    </b>
                  </div>
                  <div className="lr-odds-row">
                    Odds at Mean (Negative)
                    <b>
                      {(
                        mean(negScores) / Math.max(1e-6, 1 - mean(negScores))
                      ).toFixed(2)}{" "}
                      : 1
                    </b>
                  </div>
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
                    z = {inspectZ.toFixed(2)} · P = {inspectP.toFixed(3)} ·
                    class {inspectClass}
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
                  test={metrics}
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
              <b>Controls</b>
            </header>
            <div className="lr-field">
              <span>
                Decision Threshold
                <b>{Math.round(threshold * 100)}</b>
              </span>
              <div className="lr-slider">
                0
                <input
                  aria-label="Decision threshold"
                  type="range"
                  min="5"
                  max="95"
                  step="1"
                  value={Math.round(threshold * 100)}
                  onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                />
                100
              </div>
              <small>Classify as Positive if P(Positive) ≥ threshold</small>
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
                <option value="admissions">University Admissions</option>
                <option value="separable">Perfect separable</option>
                <option value="overlap">Overlapping binary</option>
                <option value="imbalanced">Imbalanced 90/10</option>
                <option value="severe">Severe imbalance 95/5</option>
                <option value="xor">XOR (linear cannot solve)</option>
                {imported && <option value="imported">{importedLabel}</option>}
              </select>
            </div>

            <div className="lr-button-row">
              <button
                onClick={() =>
                  choose(dataset === "admissions" ? "overlap" : "admissions")
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
                    setRows(p);
                    setDataset("imported");
                    setPredX(medianX(p));
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
