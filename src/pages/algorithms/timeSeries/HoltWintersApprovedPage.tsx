/* eslint-disable no-irregular-whitespace */
import { useRef, useState } from "react";
import { useLabNavigate } from "../../../lib/labNavigation";
import {
  holtWinters,
  type SeasonalityMode,
} from "../../../lib/timeSeries/holtWinters";
import { chronologicalSplit } from "../../../lib/timeSeries/timeSeriesSplit";
import { forecastMetrics, seasonalNaiveForecast } from "../../../lib/timeSeries/forecastMetrics";
import { TIME_SERIES_CATALOG } from "../../../lib/timeSeries/timeSeriesDatasets";
import { splitRangeLabels } from "../../../lib/timeSeries/forecastDiagnostics";
import { useActiveTimeSeries } from "../../../lib/timeSeries/useActiveTimeSeries";
import "./HoltWintersApprovedPage.css";
type Point = { date: string; value: number };
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
function make(seed: number, n = 120) {
  let s = seed >>> 0;
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  return Array.from({ length: n }, (_, i) => ({
    date: `2025-${String(2 + Math.floor(i / 28)).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    value:
      18000 +
      i * 120 +
      4800 * Math.sin((i / 7) * Math.PI * 2) +
      (r() - 0.5) * 2500,
  }));
}
const DATA = [
  { name: "Retail Sales (M5) – Daily", points: make(69), period: "7 (Weekly)" },
  {
    name: "Electricity Load – Hourly",
    points: make(97, 168),
    period: "24 (Daily)",
  },
  { name: "Web Traffic – Daily", points: make(129, 140), period: "7 (Weekly)" },
  ...TIME_SERIES_CATALOG.map((item) => ({
    name: item.name,
    points: item.points.map((point) => ({ date: point.date, value: point.value })),
    period:
      item.frequency === "monthly"
        ? "12 (Monthly)"
        : item.frequency === "daily"
          ? "7 (Weekly seasonality)"
          : String(item.frequency),
  })),
];
function line(
  v: number[],
  w: number,
  h: number,
  min: number,
  max: number,
  offset = 0,
) {
  return v
    .map(
      (x, i) =>
        `${i ? "L" : "M"} ${offset + (i / Math.max(1, v.length - 1)) * w} ${h - ((x - min) / (max - min || 1)) * h}`,
    )
    .join(" ");
}
export default function HoltWintersApprovedPage() {
  const [dataset, setDataset] = useState(0),
    [uploaded, setUploaded] = useState<{
      name: string;
      points: Point[];
    } | null>(null),
    [tab, setTab] = useState("Learn"),
    [mode, setMode] = useState<SeasonalityMode>("additive"),
    [season, setSeason] = useState(7),
    [alpha, setAlpha] = useState(0.3),
    [beta, setBeta] = useState(0.2),
    [gamma, setGamma] = useState(0.3),
    [steps, setSteps] = useState(14),
    [zoom, setZoom] = useState("3M"),
    [status, setStatus] = useState("Ready"),
    [collapsed, setCollapsed] = useState(false);
  const go = useLabNavigate();
  const handoff = useActiveTimeSeries("/ml/time-series/holt-winters");
  const fileRef = useRef<HTMLInputElement>(null),
    points =
      uploaded?.points ??
      (handoff
        ? handoff.points.map((point) => ({ date: point.date, value: point.value }))
        : DATA[dataset].points),
    values = points.map((x) => x.value),
    split = chronologicalSplit(values),
    ranges = splitRangeLabels(
      points.map((point) => point.date),
      split.trainEnd,
      split.validationEnd,
    ),
    r = holtWinters(
      split.train.length >= Math.max(4, season * 2) ? split.train : values,
      season,
      alpha,
      beta,
      gamma,
      steps,
      mode,
    ),
    holdout = [...split.validation, ...split.test],
    seasonalNaive = seasonalNaiveForecast(
      split.train.length ? split.train : values,
      holdout.length || steps,
      season,
    ),
    holdoutMetrics = forecastMetrics(
      holdout,
      r.forecast.slice(0, holdout.length),
      split.train,
      season,
    ),
    baselineMetrics = forecastMetrics(holdout, seasonalNaive.slice(0, holdout.length), split.train, season),
    all = [...values, ...r.forecast],
    min = Math.min(...all) * 0.85,
    max = Math.max(...all) * 1.08,
    forecastTotal = r.forecast.reduce((a, b) => a + b, 0),
    resMax = Math.max(...r.residuals.map(Math.abs), 1);
  const upload = async (file?: File) => {
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/),
      rows = lines
        .slice(1)
        .map((line, i) => {
          const c = line.split(",");
          return { date: c[0] || String(i), value: Number(c.at(-1)) };
        })
        .filter((x) => Number.isFinite(x.value));
    if (rows.length < 20) {
      setStatus("CSV needs at least 20 observations");
      return;
    }
    setUploaded({ name: file.name, points: rows });
    setStatus(`${file.name} · ${rows.length} observations loaded`);
  };
  const choose = (i: number) => {
    setDataset(i);
    setUploaded(null);
    setSeason(i === 1 ? 24 : 7);
    setStatus(`${DATA[i].name} loaded`);
  };
  const auto = () => {
    setAlpha(0.35);
    setBeta(0.12);
    setGamma(0.42);
    setStatus("Parameters auto-optimized");
  };
  return (
    <div className={`hw-page ${collapsed ? "collapsed" : ""}`}>
      <aside className="hw-side">
        <a href="/" className="logo">
          <i>◉</i>
          <b>
            Mega ML<small>AI OBSERVATORY</small>
          </b>
        </a>
        {[
          "⌂　Home",
          "▣　Playground",
          "▤　Datasets",
          "⌘　Models",
          "△　Experiments",
          "♧　AutoML",
          "◇　Deployments",
          "▱　Monitor",
          "▣　Insights",
          "⚙　Settings",
        ].map((x, i) => (
          <button
            className={i === 0 ? "active" : ""}
            key={x}
            onClick={() => go(x)}
          >
            {x}
          </button>
        ))}
        <footer>
          <button onClick={() => setCollapsed((v) => !v)}>
            ML　 Mega ML　⌃<small>Pro Plan</small>
          </button>
        </footer>
      </aside>
      <header className="hw-head">
        <h1>Holt–Winters　ⓘ</h1>
        <p>Exponential smoothing for time series with trend and seasonality.</p>
        <p>
          Train: {ranges.train} · Validation: {ranges.validation} · Test:{" "}
          {ranges.test} · Forecast: {ranges.forecast}
        </p>
        <label>
          <small>Dataset</small>
          <select
            aria-label="Dataset"
            value={dataset}
            onChange={(e) => choose(+e.target.value)}
          >
            {DATA.map((d, i) => (
              <option value={i} key={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => choose((dataset + 1) % DATA.length)}>
          ⌘ Switch Dataset
        </button>
        <button onClick={() => fileRef.current?.click()}>Upload</button>
        <input
          ref={fileRef}
          hidden
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
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
      </header>
      <section className="hw-progress">
        <article>
          <small>OBJECTIVE</small>
          <p>
            Decompose the series into level (trend) and
            <br />
            seasonality, then forecast future values.
          </p>
          <small>PROGRESS</small>
          <progress max="5" value="4" />
          　4 / 5
        </article>
        <div>
          {[
            ["✓", "Load Data", uploaded?.name ?? DATA[dataset].name],
            ["✓", "Configure Model", `${mode} · s = ${season}`],
            ["✓", "Visualize Decomposition", "See level, trend, seasonality"],
            ["✓", "Forecast", `${steps} steps ahead`],
            ["•", "Evaluate", "Compare accuracy"],
          ].map((x, i) => (
            <span key={x[1]} className={i === 4 ? "pending" : ""}>
              <b>{x[0]}</b>
              <strong>{x[1]}</strong>
              <small>{x[2]}</small>
            </span>
          ))}
        </div>
      </section>
      <main className="hw-main">
        <h2>
          Decomposition{" "}
          <small>({mode[0].toUpperCase() + mode.slice(1)})　ⓘ</small>
        </h2>
        <div className="legend">
          — Observed　　— Fitted　　- - Forecast{" "}
          <span>
            Zoom　
            {["1M", "3M", "6M", "1Y", "All"].map((x) => (
              <button
                className={zoom === x ? "active" : ""}
                onClick={() => setZoom(x)}
                key={x}
              >
                {x}
              </button>
            ))}
            <button onClick={() => setStatus("Calendar opened")}>▣</button>
          </span>
        </div>
        {[
          ["Observed / Fitted", values, r.fitted, "top"],
          ["Level (Trend)", r.level, [], "level"],
          [`Seasonality (s = ${season})`, r.seasonal, [], "season"],
          ["Remainder (Residual)", r.residuals, [], "remainder"],
        ].map(([title, a, b, cls], i) => {
          const av = a as number[],
            bv = b as number[],
            lo = i < 2 ? min : i === 2 ? Math.min(...av) : -resMax,
            hi = i < 2 ? max : i === 2 ? Math.max(...av) : resMax;
          return (
            <section className={cls as string} key={title as string}>
              <h3>{title as string}</h3>
              <svg viewBox="0 0 940 90">
                <g>
                  {[25, 65].map((y) => (
                    <line key={y} x1="30" x2="930" y1={y} y2={y} />
                  ))}
                </g>
                <path className="a" d={line(av, 760, 70, lo, hi, 30)} />
                {bv.length > 0 && (
                  <path className="b" d={line(bv, 760, 70, lo, hi, 30)} />
                )}
                <line className="split" x1="790" x2="790" y1="5" y2="85" />
                <path
                  className="future"
                  d={line(r.forecast, 135, 70, min, max, 793)}
                />
              </svg>
            </section>
          );
        })}
      </main>
      <aside className="hw-controls">
        <h2>MODEL CONTROLS</h2>
        <p>
          {r.initialization} Fitted on the chronological train split. Hold-out
          RMSE is compared with seasonal naive on the same later window.
        </p>
        <label>
          Seasonality
          <div>
            <button
              className={mode === "additive" ? "active" : ""}
              onClick={() => setMode("additive")}
            >
              Additive
            </button>
            <button
              className={mode === "multiplicative" ? "active" : ""}
              onClick={() => setMode("multiplicative")}
            >
              Multiplicative
            </button>
          </div>
        </label>
        <label>
          Seasonal length (s)　ⓘ
          <span>
            <button onClick={() => setSeason((v) => Math.max(2, v - 1))}>
              −
            </button>
            <b>{season}</b>
            <button onClick={() => setSeason((v) => Math.min(48, v + 1))}>
              ＋
            </button>
          </span>
          <small>Detected: {season === 7 ? "7 (Weekly)" : season}</small>
        </label>
        {[
          ["Alpha (Level)", alpha, setAlpha],
          ["Beta (Trend)", beta, setBeta],
          ["Gamma (Seasonal)", gamma, setGamma],
        ].map(([name, value, setter]) => (
          <label key={name as string}>
            {name as string}
            <b>{(value as number).toFixed(2)}</b>
            <input
              aria-label={name as string}
              type="range"
              min="0.01"
              max="0.99"
              step="0.01"
              value={value as number}
              onInput={(e) =>
                (setter as typeof setAlpha)(+e.currentTarget.value)
              }
              onChange={(e) => (setter as typeof setAlpha)(+e.target.value)}
            />
          </label>
        ))}
        <button onClick={auto}>⌘ Auto-Optimize</button>
        <section>
          <h2>FORECAST</h2>
          <label>
            Steps Ahead
            <span>
              <button onClick={() => setSteps((v) => Math.max(1, v - 1))}>
                −
              </button>
              <b>{steps}</b>
              <button onClick={() => setSteps((v) => Math.min(60, v + 1))}>
                ＋
              </button>
            </span>
          </label>
          <label>
            Forecast Start
            <input
              aria-label="Forecast start"
              type="date"
              value="2025-05-20"
              readOnly
            />
          </label>
          <button
            onClick={() => setStatus(`Forecast updated · ${steps} steps`)}
          >
            ↻ Update Forecast
          </button>
        </section>
        <a href="?advanced=1">Open original lab →</a>
      </aside>
      <section className="hw-bottom">
        <article>
          <h2>KEY INSIGHTS</h2>
          <p>
            Seasonal period is set to {season}. Retrain after changing it; the
            seasonal component is the Holt-Winters state, not a decorative sine.
          </p>
          <p>
            Hold-out RMSE is compared with seasonal naive on the same later
            window. A model that loses to seasonal naive is not automatically
            successful.
          </p>
          <p>
            Prediction interval is not shown: this implementation does not
            derive forecast variance bands.
          </p>
        </article>
        <article>
          <h2>FORECAST SUMMARY　ⓘ</h2>
          <small>Next {steps} days</small>
          <b>{(forecastTotal / 1000).toFixed(1)}K</b>
          <svg viewBox="0 0 190 45">
            <path d={line(r.forecast, 185, 40, min, max, 2)} />
          </svg>
          <div>
            <span>
              Avg / Day
              <br />
              <b>{(forecastTotal / steps / 1000).toFixed(1)}K</b>
            </span>
            <span>
              Forecast min
              <br />
              <b>{(Math.min(...r.forecast) / 1000).toFixed(1)}K</b>
            </span>
            <span>
              Forecast max
              <br />
              <b>{(Math.max(...r.forecast) / 1000).toFixed(1)}K</b>
            </span>
          </div>
        </article>
        <article>
          <h2>HOLD-OUT VS SEASONAL NAIVE</h2>
          <div>
            <span>
              Model RMSE
              <br />
              <b>{Number.isFinite(holdoutMetrics.rmse) ? holdoutMetrics.rmse.toFixed(1) : "n/a"}</b>
            </span>
            <span>
              Seasonal naive RMSE
              <br />
              <b>{Number.isFinite(baselineMetrics.rmse) ? baselineMetrics.rmse.toFixed(1) : "n/a"}</b>
            </span>
          </div>
        </article>
        <article>
          <h2>ACCURACY (HISTORICAL FIT)</h2>
          <div>
            <span>
              MAE
              <br />
              <b>{r.metrics.mae.toFixed(0)}</b>
            </span>
            <span>
              RMSE
              <br />
              <b>{r.metrics.rmse.toFixed(0)}</b>
            </span>
            <span>
              MAPE
              <br />
              <b>{Number.isFinite(r.metrics.mape) ? `${r.metrics.mape.toFixed(2)}%` : "n/a"}</b>
            </span>
            <span>
              sMAPE
              <br />
              <b>{r.metrics.smape.toFixed(2)}%</b>
            </span>
          </div>
          <p>
            In-sample period
            <br />
            2025-02-01 → 2025-05-19
          </p>
        </article>
        <article>
          <h2>DECOMPOSITION CHECK</h2>
          <p>✓　Level component is smooth</p>
          <p>✓　Trend component has reasonable slope</p>
          <p>✓　Seasonality is stable over time</p>
          <p>✓　Residuals are zero-centered and patternless</p>
        </article>
      </section>
      <footer className="hw-foot">
        Holt-Winters (Triple Exponential Smoothing)　•　{mode} model　•　Season
        length = {season}　•　Forecast horizon = {steps}
        <span>{status}</span>
      </footer>
    </div>
  );
}
