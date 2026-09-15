import { useEffect, useMemo, useRef, useState } from "react";
import { useLabNavigate } from "../../../lib/labNavigation";
import {
  detectGlobalZScoreAnomalies,
  detectIqrAnomalies,
  detectResidualAnomalies,
  detectRollingZScoreAnomalies,
} from "../../../lib/timeSeries/anomalyDetection";
import { useActiveTimeSeries } from "../../../lib/timeSeries/useActiveTimeSeries";
import { anomalyBenchmark } from "../../../lib/timeSeries/forecastDiagnostics";
import { getTimeSeriesDataset, seriesValues, TIME_SERIES_CATALOG } from "../../../lib/timeSeries/timeSeriesDatasets";
import "./TimeSeriesAnomalyDetectionApprovedPage.css";

type DataSet = { name: string; signal: string; unit: string; values: number[] };
const makeSignal = (
  base: number,
  amplitude: number,
  length: number,
  spikes: Record<number, number>,
) =>
  Array.from(
    { length },
    (_, i) =>
      base +
      amplitude * Math.sin(i * 0.18) +
      amplitude * 0.42 * Math.sin(i * 0.73) +
      (spikes[i] ?? 0),
  );
const DATASETS: DataSet[] = [
  {
    name: "Server CPU Utilization",
    signal: "CPU Utilization (%)",
    unit: "%",
    values: makeSignal(34, 8, 180, {
      14: 11,
      23: -9,
      29: 12,
      36: 13,
      42: -11,
      47: -12,
      55: 49,
      63: 10,
      72: -11,
      78: 12,
      84: 14,
      91: -10,
      98: 28,
      106: -13,
      116: 12,
      121: -12,
      127: -10,
      136: 13,
      144: 42,
      148: 12,
      153: -12,
      162: 11,
      171: -10,
    }),
  },
  {
    name: "API Request Latency",
    signal: "Latency (ms)",
    unit: "ms",
    values: makeSignal(118, 21, 180, { 41: 145, 112: 92, 161: 174 }),
  },
  {
    name: "Payment Transactions",
    signal: "Transactions / min",
    unit: "tpm",
    values: makeSignal(680, 95, 180, { 63: -410, 126: 520, 169: -360 }),
  },
  {
    name: "Known spike anomalies",
    signal: "Value",
    unit: "",
    values: seriesValues(getTimeSeriesDataset("spike-anomalies")),
  },
  ...TIME_SERIES_CATALOG.filter((item) => item.id !== "spike-anomalies").map((item) => ({
    name: item.name,
    signal: "Value",
    unit: "",
    values: seriesValues(item),
  })),
];

function path(
  values: number[],
  width: number,
  height: number,
  lo: number,
  hi: number,
) {
  const span = hi - lo || 1;
  return values
    .map(
      (value, index) =>
        `${index ? "L" : "M"}${18 + (index / Math.max(1, values.length - 1)) * (width - 34)},${10 + ((hi - value) / span) * (height - 24)}`,
    )
    .join(" ");
}

export default function TimeSeriesAnomalyDetectionApprovedPage() {
  const [dataset, setDataset] = useState(0),
    [custom, setCustom] = useState<{ name: string; values: number[] } | null>(
      null,
    );
  const [tab, setTab] = useState("Visualize"),
    [model, setModel] = useState("Rolling Z-score"),
    [sensitivity, setSensitivity] = useState(2.5);
  const [windowSize, setWindowSize] = useState(6),
    [cooldown, setCooldown] = useState("5 min"),
    [contextual, setContextual] = useState(true),
    [showExpected, setShowExpected] = useState(true);
  const [live, setLive] = useState(true),
    [status, setStatus] = useState("Healthy"),
    [selected, setSelected] = useState<number | null>(null),
    [collapsed, setCollapsed] = useState(false);
  const go = useLabNavigate();
  const handoff = useActiveTimeSeries("/ml/time-series/anomaly-detection");
  const fileRef = useRef<HTMLInputElement>(null),
    source = DATASETS[dataset],
    values = custom?.values ?? handoff?.points.map((point) => point.value) ?? source.values;
  const points = useMemo(() => {
    const window = Math.max(8, windowSize * 2);
    if (model.startsWith("Global")) return detectGlobalZScoreAnomalies(values, sensitivity);
    if (model.startsWith("IQR")) return detectIqrAnomalies(values);
    if (model.startsWith("Residual")) return detectResidualAnomalies(values, window, sensitivity);
    return detectRollingZScoreAnomalies(values, window, sensitivity);
  }, [values, windowSize, sensitivity, model]);
  const anomalies = points
      .map((point, index) => ({ ...point, index }))
      .filter((point) => point.anomaly),
    highs = anomalies.filter((point) => point.severity === "high"),
    contexts = anomalies.filter((point) => point.contextual);
  const chosen =
    selected == null
      ? (highs[0] ?? anomalies[0])
      : points[selected]
        ? { ...points[selected], index: selected }
        : (highs[0] ?? anomalies[0]);
  const lo = Math.min(...values, ...points.map((point) => point.lower).filter(Number.isFinite)),
    hi = Math.max(...values, ...points.map((point) => point.upper).filter(Number.isFinite));
  const upper = path(
      points.map((point, index) =>
        Number.isFinite(point.upper) ? point.upper : values[index],
      ),
      960,
      226,
      lo,
      hi,
    ),
    lowerValues = points.map((point, index) =>
      Number.isFinite(point.lower) ? point.lower : values[index],
    ),
    lower = path(lowerValues, 960, 226, lo, hi),
    band = `${upper} ${lower.split(" ").reverse().join(" ")} Z`;
  const labelled = source.name.includes("Known spike")
    ? (getTimeSeriesDataset("spike-anomalies").knownAnomalyIndexes ?? [])
    : [];
  const bench = labelled.length
    ? anomalyBenchmark(
        points.map((point) => point.anomaly),
        labelled,
      )
    : null;
  const tabs = [
    "Learn",
    "Visualize",
    "Dataset",
    "Transform",
    "Train",
    "Metrics",
    "Compare",
    "Explain",
  ];
  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(
      () => setStatus("Live sample received"),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [live]);
  const upload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = String(reader.result)
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((row) => Number(row.split(",").at(-1)))
        .filter(Number.isFinite);
      if (parsed.length >= 12) {
        setCustom({ name: file.name, values: parsed });
        setStatus(`${file.name} · ${parsed.length} points loaded`);
      } else setStatus("Upload needs 12 numeric points");
    };
    reader.readAsText(file);
  };
  const side = [
    "⌂ Home",
    "◎ Observability",
    "▤ Datasets",
    "♧ Models",
    "◇ Experiments",
    "♧ Alerts",
    "◇ Deployments",
    "▧ Reports",
    "⚙ Settings",
  ];
  return (
    <div className={`ad-page ${collapsed ? "ad-collapsed" : ""}`}>
      <aside className="ad-side">
        <a href="/" className="ad-brand">
          <i>◇</i>
          <span>
            <b>Mega ML</b>
            <small>AI Observatory</small>
          </span>
        </a>
        {side.map((item, index) => (
          <button
            key={item}
            className={index === 1 ? "active" : ""}
            onClick={() => go(item)}
          >
            {item.slice(0, 1)}
            <span>{item.slice(2)}</span>
          </button>
        ))}
        <section>
          <small>Current Project</small>
          <b>
            AI Observatory <em>Pro</em>
          </b>
          <progress value="32" max="100" />
          <span>32% used</span>
        </section>
        <footer>
          <button onClick={() => setCollapsed((value) => !value)}>
            ‹ <span>Collapse</span>
          </button>
        </footer>
      </aside>
      <header className="ad-top">
        <section>
          <i>▰</i>
          <label>
            Dataset
            <select
              aria-label="Dataset"
              value={dataset}
              onChange={(event) => {
                setDataset(+event.target.value);
                setCustom(null);
                setStatus(`${DATASETS[+event.target.value].name} loaded`);
              }}
            >
              {DATASETS.map((item, index) => (
                <option value={index} key={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <small>{custom ? custom.name : "Sample"}</small>
          </label>
          <button onClick={() => fileRef.current?.click()}>
            ♟ Upload Dataset
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={(event) => upload(event.target.files?.[0])}
          />
        </section>
        <section className="ad-live">
          <b>● Live</b>
          <small>Streaming 1.2 pts/sec</small>
        </section>
        <button onClick={() => go("Documentation")}>▣</button>
        <button onClick={() => setStatus("Notifications opened")}>♧</button>
        <button onClick={() => setStatus("Profile opened")}>●</button>
      </header>
      <section className="ad-lesson">
        <div className="ad-title">
          <i>〽</i>
          <div>
            <h1>Time-Series Anomaly Detection</h1>
            <p>
              Detect unusual patterns in streaming signals using adaptive
              thresholds and context.
            </p>
          </div>
        </div>
        <section>
          <span>
            Lesson Progress <b>64%</b>
          </span>
          <progress value="64" max="100" />
          <small>Steps 4 / 6</small>
          <button onClick={() => setStatus("Lesson resumed")}>Resume</button>
        </section>
        <nav>
          {tabs.map((item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => {
                setTab(item);
                setStatus(`${item} selected`);
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      </section>
      <main className="ad-main">
        <section className="ad-toolbar">
          <label>
            Signal
            <select aria-label="Signal">
              <option>{source.signal}</option>
              <option>System Load</option>
              <option>Memory Pressure</option>
            </select>
          </label>
          <label>
            Window
            <select
              aria-label="Window"
              value={windowSize}
              onChange={(event) => setWindowSize(+event.target.value)}
            >
              <option value="3">3 Hours</option>
              <option value="6">6 Hours</option>
              <option value="12">12 Hours</option>
            </select>
          </label>
          <button
            className="pause"
            onClick={() => {
              setLive((value) => !value);
              setStatus(live ? "Stream paused" : "Stream resumed");
            }}
          >
            {live ? "Ⅱ" : "▶"}
          </button>
          <b className={live ? "is-live" : ""}>● {live ? "LIVE" : "PAUSED"}</b>
          <label className="timezone">
            Timezone
            <select aria-label="Timezone">
              <option>UTC</option>
              <option>IST</option>
              <option>EST</option>
            </select>
          </label>
          {["⌕+", "⌕", "⌕−", "↻", "⌗"].map((item, index) => (
            <button
              key={index}
              onClick={() => setStatus(`Chart tool ${index + 1} selected`)}
            >
              {item}
            </button>
          ))}
        </section>
        <section className="ad-chart">
          <svg
            viewBox="0 0 960 226"
            preserveAspectRatio="none"
            aria-label="Anomaly time-series chart"
          >
            {[18, 70, 122, 174, 222].map((y) => (
              <line key={y} x1="18" x2="944" y1={y} y2={y} className="grid" />
            ))}
            {[18, 150, 282, 414, 546, 678, 810, 942].map((x) => (
              <line key={x} x1={x} x2={x} y1="8" y2="222" className="grid" />
            ))}
            <path d={band} className="band" />
            <path
              d={path(
                points.map((point) => point.expected),
                960,
                226,
                lo,
                hi,
              )}
              className={showExpected ? "expected" : "hidden"}
            />
            <path d={path(values, 960, 226, lo, hi)} className="actual" />
            {points.map((point, index) =>
              point.anomaly ? (
                <circle
                  key={index}
                  cx={18 + (index / Math.max(1, points.length - 1)) * 926}
                  cy={10 + ((hi - point.value) / (hi - lo || 1)) * 202}
                  r="5"
                  className={point.contextual ? "context" : "anomaly"}
                  onClick={() => setSelected(index)}
                />
              ) : index % 24 === 0 ? (
                <circle
                  key={index}
                  cx={18 + (index / Math.max(1, points.length - 1)) * 926}
                  cy={10 + ((hi - point.value) / (hi - lo || 1)) * 202}
                  r="4"
                  className="normal"
                />
              ) : null,
            )}
          </svg>
          {chosen && (
            <article className="ad-tooltip">
              <b>● Anomaly Detected</b>
              <small>10:12:18 UTC</small>
              <span>
                Value{" "}
                <strong>
                  {chosen.value.toFixed(1)} {source.unit}
                </strong>
              </span>
              <span>
                Expected{" "}
                <strong>
                  {chosen.expected.toFixed(1)} {source.unit}
                </strong>
              </span>
              <span>
                Deviation{" "}
                <strong>
                  {chosen.deviation > 0 ? "+" : ""}
                  {chosen.deviation.toFixed(1)} {source.unit}
                </strong>
              </span>
              <span>
                Severity{" "}
                <strong>
                  {chosen.severity === "high" ? "High" : "Medium"}
                </strong>
              </span>
              <button
                onClick={() =>
                  setStatus(`Anomaly ${chosen.index} details opened`)
                }
              >
                View Details →
              </button>
            </article>
          )}
          <div className="ad-axis">
            08:00 09:00 10:00 11:00 12:00 13:00 14:00
          </div>
          <footer>
            ━ Actual <span>-- Expected</span> <i>■ Adaptive Threshold</i>{" "}
            <em>● Anomaly</em> <mark>● Context Anomaly</mark> <b>● Normal</b>
          </footer>
        </section>
        <section className="ad-summary card">
          <header>
            <b>Streaming Summary</b>
            <small>Updated now</small>
          </header>
          <div>
            {[
              ["Total Points", values.length * 144],
              ["Anomalies (24h)", anomalies.length],
              [
                "Anom. Rate",
                `${((anomalies.length / values.length) * 100).toFixed(2)}%`,
              ],
              ["Context Anomalies", contexts.length],
              ["Normal", values.length - anomalies.length],
              ["Data Quality", "99.7%"],
            ].map(([label, value]) => (
              <span key={label as string}>
                <small>{label as string}</small>
                <b>{value as string | number}</b>
              </span>
            ))}
          </div>
        </section>
        <section className="ad-timeline card">
          <header>
            <b>
              Anomaly Timeline <small>(Last 24h)</small>
            </b>
            <button onClick={() => setStatus("All anomalies opened")}>
              View All
            </button>
          </header>
          <div>
            {anomalies.slice(0, 18).map((point, index) => (
              <i
                key={index}
                style={{
                  left: `${5 + (index / Math.max(1, Math.min(17, anomalies.length - 1))) * 90}%`,
                  height: `${16 + Math.min(40, point.score * 5)}px`,
                }}
              />
            ))}
          </div>
          <footer>
            ● High ({highs.length}){" "}
            <span>● Medium ({anomalies.length - highs.length})</span>{" "}
            <b>● Context ({contexts.length})</b>
          </footer>
        </section>
        <section className="ad-alerts card">
          <header>
            <b>Recent Alerts</b>
            <button onClick={() => setStatus("All alerts opened")}>
              View All
            </button>
          </header>
          {anomalies.slice(0, 3).map((point, index) => (
            <article key={index}>
              <time>{["10:12:18", "11:33:42", "12:58:07"][index]}</time>
              <span>
                <b>
                  ●{" "}
                  {point.severity === "high"
                    ? "High anomaly detected"
                    : "Context anomaly detected"}
                </b>
                <small>
                  {source.signal} deviated to {point.value.toFixed(1)}
                </small>
              </span>
              <em>{point.severity}</em>
            </article>
          ))}
        </section>
        <section className="ad-insight card">
          <article>
            <h3>✦ Insight</h3>
            <b>{highs.length} high severity anomalies detected</b>
            <p>
              High anomalies are short-duration spikes around system load
              changes.
            </p>
            <button onClick={() => setStatus("Anomaly explanation opened")}>
              ✦ Explain
            </button>
          </article>
          <article>
            <h3>Top Contributing Factors</h3>
            {[
              ["System Load", 0.72],
              ["Deployments", 0.41],
              ["Time of Day", 0.28],
              ["Background Jobs", 0.19],
            ].map(([label, value]) => (
              <span key={label as string}>
                {label as string}
                <i>
                  <b style={{ width: `${(value as number) * 100}%` }} />
                </i>
                {value as number}
              </span>
            ))}
          </article>
          <article>
            <h3>Anomaly Breakdown (24h)</h3>
            <div className="ad-donut">
              <b>
                {anomalies.length}
                <small>Total</small>
              </b>
            </div>
            <p>
              ■ High {highs.length}
              <br />■ Medium {anomalies.length - highs.length}
              <br />■ Context {contexts.length}
            </p>
          </article>
          <article>
            <h3>Typical Pattern</h3>
            <svg viewBox="0 0 260 60" preserveAspectRatio="none">
              <path
                d={path(
                  source.values.slice(0, 48),
                  260,
                  60,
                  Math.min(...source.values),
                  Math.max(...source.values),
                )}
              />
            </svg>
            <p>
              Daily seasonality detected
              <br />
              Peak between 09:00 – 11:00 UTC
            </p>
          </article>
        </section>
      </main>
      <aside className="ad-controls">
        <section className="card">
          <h2>Detection Controls ⓘ</h2>
          {bench ? (
            <p>
              Known-anomaly benchmark (synthetic labels only): TP {bench.tp} FP{" "}
              {bench.fp} FN {bench.fn} · precision {bench.precision.toFixed(2)} ·
              recall {bench.recall.toFixed(2)} · F1 {bench.f1.toFixed(2)}
            </p>
          ) : null}
          <label>
            Model
            <select
              aria-label="Detection Model"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              <option>Rolling Z-score</option>
              <option>Global Z-score</option>
              <option>IQR</option>
              <option>Residual MA</option>
            </select>
          </label>
          <label>
            Sensitivity ⓘ{" "}
            <b>
              {sensitivity < 2 ? "High" : sensitivity < 3 ? "Medium" : "Low"} (
              {sensitivity.toFixed(1)}σ)
            </b>
            <input
              aria-label="Sensitivity"
              type="range"
              min="1"
              max="4"
              step="0.1"
              value={sensitivity}
              onInput={(event) =>
                setSensitivity(+(event.target as HTMLInputElement).value)
              }
              onChange={(event) => setSensitivity(+event.target.value)}
            />
          </label>
          <label>
            Alert Cooldown
            <select
              aria-label="Alert Cooldown"
              value={cooldown}
              onChange={(event) => setCooldown(event.target.value)}
            >
              <option>1 min</option>
              <option>5 min</option>
              <option>15 min</option>
            </select>
          </label>
          <label className="switch">
            Contextual Anomalies
            <input
              type="checkbox"
              aria-label="Contextual Anomalies"
              checked={contextual}
              onChange={(event) => setContextual(event.target.checked)}
            />
            <i />
          </label>
          <label className="switch">
            Show Expected
            <input
              type="checkbox"
              aria-label="Show Expected"
              checked={showExpected}
              onChange={(event) => setShowExpected(event.target.checked)}
            />
            <i />
          </label>
        </section>
        <section className="card ad-threshold">
          <h2>Threshold Band</h2>
          <p>
            ━ Upper Bound{" "}
            <b>
              {(chosen?.upper ?? 0).toFixed(1)} {source.unit}
            </b>
          </p>
          <p>
            -- Expected{" "}
            <b>
              {(chosen?.expected ?? 0).toFixed(1)} {source.unit}
            </b>
          </p>
          <p>
            ━ Lower Bound{" "}
            <b>
              {(chosen?.lower ?? 0).toFixed(1)} {source.unit}
            </b>
          </p>
          <button onClick={() => setStatus("Thresholds recalculated")}>
            ↻ Recalculate
          </button>
        </section>
      </aside>
      <footer className="ad-status">
        <span>
          Model Status <b>● {status}</b> Last retrained: 2h ago
        </span>
        <span>
          Drift <b>0.12 Low</b>
        </span>
        <span>
          Latency <b>42 ms</b>
        </span>
        <span>
          Throughput <b>1.2 pts/sec</b>
        </span>
        <a href="?advanced=1">Open original lab →</a>
      </footer>
    </div>
  );
}
