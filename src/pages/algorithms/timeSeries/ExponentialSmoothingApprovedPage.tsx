/* eslint-disable no-irregular-whitespace */
import { useRef, useState } from "react";
import { useLabNavigate } from "../../../lib/labNavigation";
import { exponentialSmoothing } from "../../../lib/timeSeries/exponentialSmoothing";
import { chronologicalSplit } from "../../../lib/timeSeries/timeSeriesSplit";
import { forecastMetrics, naiveForecast } from "../../../lib/timeSeries/forecastMetrics";
import { TIME_SERIES_CATALOG } from "../../../lib/timeSeries/timeSeriesDatasets";
import {
  optimizeSesAlpha,
  splitRangeLabels,
} from "../../../lib/timeSeries/forecastDiagnostics";
import { useActiveTimeSeries } from "../../../lib/timeSeries/useActiveTimeSeries";
import { LabLessonOrWork, labHide } from "../../../components/common/LabTabs";
import "./ExponentialSmoothingApprovedPage.css";

type Point = { time: string; value: number };
const TABS = [
  "Learn",
  "Visualize",
  "Dataset",
  "Transform",
  "Train",
  "Metrics",
  "Compare",
  "Explain",
];
function make(seed: number, n = 144) {
  let s = seed >>> 0;
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  return Array.from({ length: n }, (_, i) => ({
    time: String(1949 + Math.floor(i / 12)),
    value:
      112 +
      i * 2.35 +
      58 * Math.sin(((i % 12) / 12) * Math.PI * 2) +
      (r() - 0.5) * 24,
  }));
}
const DATA = [
  {
    name: "Daily Airline Passengers",
    source: "Box & Jenkins (1976)",
    frequency: "Daily",
    periods: 1442,
    points: make(68),
  },
  {
    name: "Retail Sales Index",
    source: "Open retail sample",
    frequency: "Weekly",
    periods: 520,
    points: make(96, 160),
  },
  {
    name: "Cloud Request Volume",
    source: "Synthetic operations",
    frequency: "Hourly",
    periods: 2160,
    points: make(125, 180),
  },
  ...TIME_SERIES_CATALOG.map((item) => ({
    name: item.name,
    source: "Catalog",
    frequency: item.frequency,
    periods: item.points.length,
    points: item.points.map((point) => ({ time: point.date, value: point.value })),
  })),
];
function line(
  values: number[],
  w: number,
  h: number,
  min: number,
  max: number,
  offset = 0,
) {
  return values
    .map(
      (v, i) =>
        `${i ? "L" : "M"} ${offset + (i / Math.max(1, values.length - 1)) * w} ${h - ((v - min) / (max - min || 1)) * h}`,
    )
    .join(" ");
}
export default function ExponentialSmoothingApprovedPage() {
  const [dataset, setDataset] = useState(0),
    [uploaded, setUploaded] = useState<{
      name: string;
      points: Point[];
    } | null>(null),
    [tab, setTab] = useState("Learn"),
    [alpha, setAlpha] = useState(0.28),
    [horizon, setHorizon] = useState(12),
    [confidence, setConfidence] = useState(0.95),
    [animate, setAnimate] = useState(true),
    [showErrors, setShowErrors] = useState(true),
    [controlsOpen, setControlsOpen] = useState(true),
    [status, setStatus] = useState("Ready"),
    [collapsed, setCollapsed] = useState(false);
  const go = useLabNavigate();
  const handoff = useActiveTimeSeries("/ml/time-series/exponential-smoothing");
  const fileRef = useRef<HTMLInputElement>(null),
    points =
      uploaded?.points ??
      (handoff
        ? handoff.points.map((point) => ({ time: point.date, value: point.value }))
        : DATA[dataset].points),
    values = points.map((x) => x.value),
    split = chronologicalSplit(values),
    ranges = splitRangeLabels(
      points.map((point) => point.time),
      split.trainEnd,
      split.validationEnd,
    ),
    result = exponentialSmoothing(
      split.train.length ? split.train : values,
      alpha,
      horizon,
      confidence,
    ),
    holdout = [...split.validation, ...split.test],
    modelHoldout = result.forecast.slice(0, holdout.length),
    naiveHoldout = split.train.length
      ? naiveForecast(split.train, holdout.length)
      : [],
    holdoutMetrics = forecastMetrics(holdout, modelHoldout, split.train),
    naiveMetrics = forecastMetrics(holdout, naiveHoldout, split.train),
    all = [...values, ...result.forecast, ...result.lower, ...result.upper],
    min = Math.min(...all) * 0.9,
    max = Math.max(...all) * 1.05,
    last = result.level.at(-1) ?? 0,
    previous = result.level.at(-2) ?? 0;
  const upload = async (file?: File) => {
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/),
      rows = lines
        .slice(1)
        .map((line, i) => {
          const cells = line.split(",");
          return { time: cells[0] || String(i), value: Number(cells.at(-1)) };
        })
        .filter((x) => Number.isFinite(x.value));
    if (rows.length < 12) {
      setStatus("CSV needs at least 12 numeric observations");
      return;
    }
    setUploaded({ name: file.name, points: rows });
    setStatus(`${file.name} · ${rows.length} observations loaded`);
  };
  const reset = () => {
    setAlpha(0.28);
    setHorizon(12);
    setConfidence(0.95);
    setAnimate(true);
    setShowErrors(true);
    setStatus("Model reset");
  };
  const selectData = (i: number) => {
    setDataset(i);
    setUploaded(null);
    setStatus(`${DATA[i].name} loaded`);
  };
  return (
    <div className={`es-page ${collapsed ? "collapsed" : ""}`}>
      <aside className="es-side">
        <a href="/" className="logo">
          <i>⬡</i>
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </a>
        {[
          "⌂　Home",
          "▣　Learn",
          "▤　Datasets",
          "⌘　Playground",
          "◇　Models",
          "▱　Deployments",
          "▣　Experiments",
          "▤　Reports",
        ].map((x, i) => (
          <button
            className={i === 1 ? "active" : ""}
            key={x}
            onClick={() => go(x)}
          >
            {x}
          </button>
        ))}
        <small>Resources</small>
        {["▣　Docs", "⌘　Algorithms", "▤　Notebooks", "▦　API"].map((x) => (
          <button key={x} onClick={() => go(x)}>
            {x}
          </button>
        ))}
        <footer>
          <button onClick={() => go("Settings")}>
            ⚙　Settings
          </button>
          <button onClick={() => go("Help")}>?　Help</button>
          <button onClick={() => setCollapsed((v) => !v)}>
            ♧　Ada Lovelace　›<small>Pro Plan</small>
          </button>
        </footer>
      </aside>
      <header className="es-head">
        <p>
          Learn　›　Time Series　›　<b>Exponential Smoothing</b>
        </p>
        <p>
          Train: {ranges.train} · Validation: {ranges.validation} · Test:{" "}
          {ranges.test} · Forecast: {ranges.forecast} · FORECAST START after
          train
        </p>
        <p>
          Hold-out ME (actual − forecast):{" "}
          {Number.isFinite(holdoutMetrics.me) ? holdoutMetrics.me.toFixed(3) : "n/a"}.
          Positive means under-forecast on average.
        </p>
        <label>
          Dataset　
          <select
            aria-label="Dataset"
            value={dataset}
            onChange={(e) => selectData(+e.target.value)}
          >
            {DATA.map((d, i) => (
              <option value={i} key={d.name}>
                {d.name}　○
              </option>
            ))}
          </select>
          　ⓘ
        </label>
        <button onClick={() => fileRef.current?.click()}>☁ Upload CSV</button>
        <input
          ref={fileRef}
          hidden
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
        <button onClick={() => setStatus("Model exported")}>⇩</button>
        <button onClick={() => setStatus("Theme toggled")}>☀</button>
      </header>
      <section className="es-title">
        <h1>
          <i>〰</i> Exponential Smoothing
        </h1>
        <p>
          Adaptive forecasting that updates the level using recent observations.
        </p>
        <nav>
          {TABS.map((x) => (
            <button
              className={tab === x ? "active" : ""}
              key={x}
              onClick={() => {
                setTab(x);
                setStatus(`${x} selected`);
              }}
            >
              {x}
            </button>
          ))}
        </nav>
        <article>
          <h2>Objective</h2>
          <p>
            Explore how Exponential Smoothing updates the
            <br />
            level and generates forecasts with uncertainty.
          </p>
          <div>
            <b>Progress</b>
            <strong>75%</strong>
            <span>
              ✓ Understand concept
              <br />✓ Interact with model
              <br />✓ Explore errors
              <br />○ Compare & interpret
            </span>
          </div>
        </article>
      </section>
      <main className="es-main">
        <LabLessonOrWork tab={tab} route="/ml/time-series/exponential-smoothing">
        <section className={`forecast${labHide(tab, "Visualize", "Train")}`}>
          <h2>Forecast vs Actual　ⓘ</h2>
          <div className="legend">
            <span>● Actual</span>
            <span>● Level (ℓₜ)</span>
            <span>● One-step Forecast</span>
            <span>● Forecast (h-step)</span>
            <span>■ {Math.round(confidence * 100)}% Confidence Band</span>
          </div>
          <svg
            viewBox="0 0 1045 330"
            role="img"
            aria-label="Exponential smoothing forecast"
          >
            <g>
              {[60, 105, 150, 195, 240, 285].map((y) => (
                <line key={y} x1="50" x2="1030" y1={y} y2={y} />
              ))}
            </g>
            <path className="actual" d={line(values, 750, 270, min, max, 50)} />
            <path
              className="level"
              d={line(result.level, 750, 270, min, max, 50)}
            />
            <path
              className="one"
              d={line(result.oneStep, 750, 270, min, max, 50)}
            />
            <line className="horizon" x1="800" x2="800" y1="35" y2="305" />
            <path
              className="band"
              d={`${line(result.upper, 220, 270, min, max, 805)} L ${result.lower.map((v, i) => `${805 + ((result.lower.length - 1 - i) / Math.max(1, result.lower.length - 1)) * 220} ${270 - ((result.lower[result.lower.length - 1 - i] - min) / (max - min)) * 270}`).join(" L ")} Z`}
            />
            <path
              className="future"
              d={line(result.forecast, 220, 270, min, max, 805)}
            />
            <text x="805" y="43">
              Forecast Horizon
            </text>
          </svg>
          <aside>
            <small>Level Update</small>
            <p>ℓₜ　→　ℓₜ₊₁</p>
            <b>
              {previous.toFixed(2)}　→　{last.toFixed(2)}
            </b>
          </aside>
        </section>
        <section className={`errors${labHide(tab, "Visualize", "Train", "Metrics")}`}>
          <h2>One-step Errors　(eₜ = yₜ − ŷₜ)</h2>
          <svg viewBox="0 0 850 115" aria-label="One-step errors">
            <line x1="50" x2="840" y1="58" y2="58" />
            {showErrors && (
              <path
                d={line(
                  result.errors,
                  790,
                  90,
                  Math.min(...result.errors),
                  Math.max(...result.errors),
                  50,
                )}
              />
            )}
          </svg>
          <aside>
            <p>
              MAE (one-step) <b>{result.metrics.mae.toFixed(2)}</b>
            </p>
            <p>
              RMSE (one-step) <b>{result.metrics.rmse.toFixed(2)}</b>
            </p>
            <p>
              MAPE (one-step) <b>{Number.isFinite(result.metrics.mape) ? `${result.metrics.mape.toFixed(2)}%` : "n/a (zero actuals)"}</b>
            </p>
            <p>
              Bias <b>{result.metrics.bias.toFixed(2)}</b>
            </p>
            <p>
              Theil's U <b>{result.metrics.theilU.toFixed(3)}</b>
            </p>
            <p>
              Holdout RMSE <b>{Number.isFinite(holdoutMetrics.rmse) ? holdoutMetrics.rmse.toFixed(2) : "n/a"}</b>
            </p>
            <p>
              Naive RMSE <b>{Number.isFinite(naiveMetrics.rmse) ? naiveMetrics.rmse.toFixed(2) : "n/a"}</b>
            </p>
            <p>
              Initialization <b>first observation y₀</b>
            </p>
          </aside>
        </section>
        </LabLessonOrWork>
      </main>
      <aside className={`es-controls${labHide(tab, "Train", "Transform", "Visualize")}`}>
        <h2>
          Model Controls{" "}
          <button onClick={() => setControlsOpen((v) => !v)}>
            {controlsOpen ? "⌃" : "⌄"}
          </button>
        </h2>
        {controlsOpen && (
          <>
            <label>
              Smoothing (alpha, α)　ⓘ <b>{alpha.toFixed(2)}</b>
              <input
                aria-label="Smoothing alpha"
                type="range"
                min=".01"
                max=".99"
                step=".01"
                value={alpha}
                onInput={(e) => setAlpha(+e.currentTarget.value)}
                onChange={(e) => setAlpha(+e.target.value)}
              />
              <small>0.01　　　　　　　　　　　　　　　　　0.99</small>
            </label>
            <button
              type="button"
              onClick={() => {
                const fit = optimizeSesAlpha(
                  split.train.length ? split.train : values,
                );
                setAlpha(Math.min(0.99, Math.max(0.01, fit.alpha)));
                setStatus(
                  `Optimized α=${fit.alpha.toFixed(2)} on train SSE ${fit.trainSse.toFixed(2)} (RMSE ${fit.trainRmse.toFixed(3)})`,
                );
              }}
            >
              Optimize α on train SSE
            </button>
            <label>
              Animate Level Update{" "}
              <button
                aria-pressed={animate}
                onClick={() => setAnimate((v) => !v)}
              >
                {animate ? "●" : "○"}
              </button>
            </label>
            <label>
              Show One-step Errors{" "}
              <button
                aria-pressed={showErrors}
                onClick={() => setShowErrors((v) => !v)}
              >
                {showErrors ? "●" : "○"}
              </button>
            </label>
            <label>
              Forecast Horizon (h)　ⓘ <b>{horizon}</b>
              <input
                aria-label="Forecast horizon"
                type="range"
                min="1"
                max="24"
                value={horizon}
                onInput={(e) => setHorizon(+e.currentTarget.value)}
                onChange={(e) => setHorizon(+e.target.value)}
              />
              <small>1　　　　　　　　　　　　　　　　　24</small>
            </label>
            <label>
              Confidence Level　ⓘ
              <select
                aria-label="Confidence level"
                value={confidence}
                onChange={(e) => setConfidence(+e.target.value)}
              >
                <option value="0.9">90%</option>
                <option value="0.95">95%</option>
                <option value="0.99">99%</option>
              </select>
            </label>
            <article>
              <b>Formula</b>
              <p>Level update:　 ℓₜ = αyₜ + (1 − α)ℓₜ₋₁</p>
              <p>One-step forecast:　ŷₜ₊₁ = ℓₜ</p>
            </article>
            <article>
              <b>How it works</b>
              <p>
                ① Initialize level ℓ₀
                <br />② Update level with new observation yₜ
                <br />③ Forecast next value using updated level
                <br />④ Repeat
              </p>
            </article>
            <button className="reset" onClick={reset}>
              Reset model
            </button>
            <a href="?advanced=1">Open original lab →</a>
          </>
        )}
      </aside>
      <section className={`es-bottom${labHide(tab, "Dataset", "Metrics")}`}>
        <article>
          <h2>About Exponential Smoothing</h2>
          <p>
            Exponential Smoothing gives more weight to recent observations using
            a smoothing parameter α (0 &lt; α &lt; 1). Higher α reacts faster;
            lower α is smoother.
          </p>
          <button onClick={() => setStatus("Learn more opened")}>
            Learn more　→
          </button>
        </article>
        <article>
          <h2>Level (ℓₜ) – Recent Updates</h2>
          <table>
            <thead>
              <tr>
                <th>Time (t)</th>
                <th>Actual (yₜ)</th>
                <th>Level (ℓₜ)</th>
                <th>One-step Forecast</th>
              </tr>
            </thead>
            <tbody>
              {split.train.slice(-3).map((v, i) => {
                const j = split.train.length - 3 + i;
                return (
                  <tr className={i === 1 ? "active" : ""} key={j}>
                    <td>{j}</td>
                    <td>{v.toFixed(2)}</td>
                    <td>{result.level[j]?.toFixed(2) ?? "—"}</td>
                    <td>{result.oneStep[j]?.toFixed(2) ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>
        <article>
          <h2>One-step Errors (latest 6)</h2>
          <svg viewBox="0 0 330 100" aria-label="Latest error bars">
            {result.errors.slice(-6).map((v, i) => (
              <rect
                key={i}
                x={35 + i * 48}
                y={v > 0 ? 45 - Math.min(36, v / 3) : 45}
                width="16"
                height={Math.min(36, Math.abs(v) / 3)}
                className={v < 0 ? "neg" : ""}
              />
            ))}
          </svg>
        </article>
        <article>
          <h2>Dataset</h2>
          <b>{uploaded?.name ?? DATA[dataset].name}</b>
          <p>
            Source: {uploaded ? "Uploaded CSV" : DATA[dataset].source}
            <br />
            Frequency: {uploaded ? "Observed" : DATA[dataset].frequency}　
            Periods:{" "}
            {uploaded ? points.length : DATA[dataset].periods.toLocaleString()}
          </p>
          <button onClick={() => selectData((dataset + 1) % DATA.length)}>
            Switch Dataset　⌄
          </button>
        </article>
      </section>
      <div className="es-status">{status}</div>
    </div>
  );
}
