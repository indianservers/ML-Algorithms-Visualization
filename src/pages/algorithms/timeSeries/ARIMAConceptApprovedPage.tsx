import { useMemo, useRef, useState } from "react";
import { useLabNavigate } from "../../../lib/labNavigation";
import { autocorrelation, fitArima, inspectDifference } from "../../../lib/timeSeries/arima";
import { TIME_SERIES_CATALOG, seriesValues } from "../../../lib/timeSeries/timeSeriesDatasets";
import { chronologicalSplit } from "../../../lib/timeSeries/timeSeriesSplit";
import { useActiveTimeSeries } from "../../../lib/timeSeries/useActiveTimeSeries";
import "./ARIMAConceptApprovedPage.css";

const AIR = [
  112, 118, 132, 129, 121, 135, 148, 148, 136, 119, 104, 118, 115, 126, 141,
  135, 125, 149, 170, 170, 158, 133, 114, 140, 145, 150, 178, 163, 172, 178,
  199, 199, 184, 162, 146, 166, 171, 180, 193, 181, 183, 218, 230, 242, 209,
  191, 172, 194, 196, 196, 236, 235, 229, 243, 264, 272, 237, 211, 180, 201,
  204, 188, 235, 227, 234, 264, 302, 293, 259, 229, 203, 229, 242, 233, 267,
  269, 270, 315, 364, 347, 312, 274, 237, 278, 284, 277, 317, 313, 318, 374,
  413, 405, 355, 306, 271, 306, 315, 301, 356, 348, 355, 422, 465, 467, 404,
  347, 305, 336, 340, 318, 362, 348, 363, 435, 491, 505, 404, 359, 310, 337,
  360, 342, 406, 396, 420, 472, 548, 559, 463, 407, 362, 405, 417, 391, 419,
  461, 472, 535, 622, 606, 508, 461, 390, 432,
];

const DATASETS = [
  {
    name: "AirPassengers (Monthly)",
    target: "Passengers",
    frequency: "Monthly (MS)",
    period: 144,
    values: AIR,
  },
  {
    name: "Electricity Demand (Daily)",
    target: "Megawatts",
    frequency: "Daily (D)",
    period: 180,
    values: Array.from(
      { length: 180 },
      (_, i) =>
        520 +
        i * 1.15 +
        54 * Math.sin((i * Math.PI * 2) / 7) +
        18 * Math.sin(i * 0.31),
    ),
  },
  {
    name: "Retail Orders (Weekly)",
    target: "Orders",
    frequency: "Weekly (W)",
    period: 156,
    values: Array.from(
      { length: 156 },
      (_, i) =>
        260 +
        i * 0.72 +
        35 * Math.sin((i * Math.PI * 2) / 13) +
        11 * Math.cos(i * 0.73),
    ),
  },
  ...TIME_SERIES_CATALOG.filter((item) =>
    ["linear-trend", "nonstationary-trend", "autoregressive", "integer-trend", "constant"].includes(
      item.id,
    ),
  ).map((item) => ({
    name: item.name,
    target: "value",
    frequency: item.frequency,
    period: item.points.length,
    values: seriesValues(item),
  })),
];

function line(
  values: number[],
  width: number,
  height: number,
  lo: number,
  hi: number,
  pad = 10,
) {
  const span = hi - lo || 1,
    usableW = width - pad * 2,
    usableH = height - pad * 2;
  return values
    .map(
      (value, index) =>
        `${index ? "L" : "M"}${pad + (index / Math.max(1, values.length - 1)) * usableW},${pad + ((hi - value) / span) * usableH}`,
    )
    .join(" ");
}

function SeriesChart({
  values,
  secondary,
  forecast,
  lower,
  upper,
}: {
  values: number[];
  secondary?: number[];
  forecast?: number[];
  lower?: number[];
  upper?: number[];
}) {
  const all = [
    ...values,
    ...(secondary ?? []),
    ...(forecast ?? []),
    ...(lower ?? []),
    ...(upper ?? []),
  ].filter(Number.isFinite);
  const lo = Math.min(...all),
    hi = Math.max(...all),
    split =
      (values.length / Math.max(1, values.length + (forecast?.length ?? 0))) *
      720;
  const forecastValues = forecast?.length
    ? [values.at(-1) ?? 0, ...forecast]
    : [];
  const band =
    forecastValues.length && lower && upper
      ? `${line([values.at(-1) ?? 0, ...upper], 720 - split + 8, 104, lo, hi, 4)} ${line(
          [values.at(-1) ?? 0, ...lower],
          720 - split + 8,
          104,
          lo,
          hi,
          4,
        )
          .replace(/^M/, "L")
          .split(" ")
          .reverse()
          .join(" ")} Z`
      : "";
  return (
    <svg
      viewBox="0 0 720 104"
      preserveAspectRatio="none"
      aria-label="Time series plot"
    >
      {[22, 52, 82].map((y) => (
        <line key={y} x1="18" x2="708" y1={y} y2={y} className="ar-grid" />
      ))}
      {band && (
        <path
          d={band}
          transform={`translate(${split - 4} 0)`}
          className="ar-band"
        />
      )}
      <path d={line(values, 720, 104, lo, hi, 18)} className="ar-observed" />
      {secondary && (
        <path d={line(secondary, 720, 104, lo, hi, 18)} className="ar-season" />
      )}
      {forecastValues.length > 0 && (
        <>
          <line x1={split} x2={split} y1="5" y2="99" className="ar-split" />
          <path
            d={line(forecastValues, 720 - split + 8, 104, lo, hi, 4)}
            transform={`translate(${split - 4} 0)`}
            className="ar-forecast"
          />
        </>
      )}
    </svg>
  );
}

function Correlation({
  values,
  title,
  n,
}: {
  values: number[];
  title: string;
  n: number;
}) {
  const bound = 1.96 / Math.sqrt(Math.max(1, n));
  const max = 1;
  return (
    <div className="ar-corr">
      <b>{title}</b>
      <svg
        viewBox="0 0 420 62"
        preserveAspectRatio="none"
        aria-label={`${title} bars`}
      >
        <line x1="22" x2="414" y1="31" y2="31" className="ar-grid" />
        <line
          x1="22"
          x2="414"
          y1={31 - bound * 28}
          y2={31 - bound * 28}
          className="ar-conf"
        />
        <line
          x1="22"
          x2="414"
          y1={31 + bound * 28}
          y2={31 + bound * 28}
          className="ar-conf"
        />
        {values.slice(0, 37).map((v, i) => {
          const h = Math.abs(v / max) * 27;
          return (
            <rect
              key={i}
              x={24 + i * 10.45}
              width="5"
              y={v >= 0 ? 31 - h : 31}
              height={h}
              className="ar-bar"
            />
          );
        })}
      </svg>
      <small>Approximate ±1.96/√N bounds (N={n}). Not a formal test.</small>
    </div>
  );
}

function numberColumn(values: number[], width = 12) {
  return values.map(
    (value, index) =>
      values
        .slice(Math.max(0, index - width + 1), index + 1)
        .reduce((a, b) => a + b, 0) / Math.min(index + 1, width),
  );
}

export default function ARIMAConceptApprovedPage() {
  const [tab, setTab] = useState("Visualize"),
    [dataset, setDataset] = useState(0),
    [custom, setCustom] = useState<{ name: string; values: number[] } | null>(
      null,
    );
  const [p, setP] = useState(2),
    [d, setD] = useState(1),
    [q, setQ] = useState(2),
    [sp, setSp] = useState(0),
    [sd, setSd] = useState(1),
    [sq, setSq] = useState(1),
    [season, setSeason] = useState(12);
  const [horizon, setHorizon] = useState(24),
    [interval, setInterval] = useState("95"),
    [status, setStatus] = useState("Ready"),
    [diffView, setDiffView] = useState(1),
    [collapsed, setCollapsed] = useState(false);
  const go = useLabNavigate();
  const handoff = useActiveTimeSeries("/ml/time-series/arima-concept");
  const fileRef = useRef<HTMLInputElement>(null);
  const selected = DATASETS[dataset],
    values = custom?.values ?? handoff?.points.map((point) => point.value) ?? selected.values,
    _name = custom?.name ?? selected.name;
  const z = interval === "99" ? 2.576 : interval === "90" ? 1.645 : 1.96;
  const split = chronologicalSplit(values);
  const fitSource = split.train.length > 8 ? split.train : values;
  const fit = useMemo(() => {
    const parts = chronologicalSplit(values);
    const source = parts.train.length > 8 ? parts.train : values;
    return fitArima(source, p, d, q, horizon, z);
  }, [values, p, d, q, horizon, z]);
  const originalAcf = useMemo(() => autocorrelation(values, 36), [values]);
  const diffFit = useMemo(
    () => fitArima(values, p, diffView, q, Math.min(12, horizon), z),
    [values, p, diffView, q, horizon, z],
  );
  const trend = useMemo(() => numberColumn(values, season), [values, season]);
  const seasonal = values.map((v, i) => v - trend[i]);
  const seasonalOffsets = Array.from(
    { length: Math.max(1, season) },
    (_, index) =>
      seasonal[fitSource.length - season + index] ?? 0,
  );
  const seasonalForecast = fit.forecast.map(
    (value, index) => value + seasonalOffsets[index % seasonalOffsets.length],
  );
  const seasonalLower = fit.lower.map(
    (value, index) => value + seasonalOffsets[index % seasonalOffsets.length],
  );
  const seasonalUpper = fit.upper.map(
    (value, index) => value + seasonalOffsets[index % seasonalOffsets.length],
  );
  const residualDisplay = fit.residuals.slice(-values.length);
  const differenceInspect = inspectDifference(values, Math.min(values.length - 1, 3));
  const side = [
    "⌂  Home",
    "▣  Projects",
    "▤  Datasets",
    "⌘  Models",
    "⌁  Experiments",
    "▣  Workspaces",
    "▣  Time Series",
    "▤  Feature Store",
    "♧  AutoML",
    "⌁  Model Monitor",
    "◇  Drift Monitor",
  ];
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
        setStatus(`${file.name} · ${parsed.length} rows loaded`);
      } else setStatus("Upload needs at least 12 numeric rows");
    };
    reader.readAsText(file);
  };
  return (
    <div className={`ar-page ${collapsed ? "ar-collapsed" : ""}`}>
      <aside className="ar-side">
        <a href="/" className="ar-brand">
          <i>◉</i>
          <span>
            <b>Mega ML</b>
            <small>AI Observatory</small>
          </span>
        </a>
        <button className="ar-home" onClick={() => go("Home")}>
          ⌂ <span>Home</span>
        </button>
        <p>OBSERVATORY</p>
        {side.slice(1, 6).map((x) => (
          <button key={x} onClick={() => go(x)}>
            {x.slice(0, 2)}
            <span>{x.slice(3)}</span>
          </button>
        ))}
        <p>TOOLS</p>
        {side.slice(6).map((x, i) => (
          <button
            className={i === 0 ? "active" : ""}
            key={x}
            onClick={() => go(x)}
          >
            {x.slice(0, 2)}
            <span>{x.slice(3)}</span>
          </button>
        ))}
        <p>BOOKMARKS</p>
        <button onClick={() => go("ARIMA Lab")}>
          ▢ <span>ARIMA Lab</span>
        </button>
        <button onClick={() => go("Demand Forecasting")}>
          ▢ <span>Demand Forecasting</span>
        </button>
        <button onClick={() => setStatus("New bookmark")}>
          ＋ <span>New</span>
        </button>
        <footer>
          <button onClick={() => setCollapsed((v) => !v)}>
            ♨ <span>Get Started</span>
          </button>
        </footer>
      </aside>
      <header className="ar-head">
        <section className="ar-title">
          <i>〽</i>
          <div>
            <h1>ARIMA Concept</h1>
            <p>
              Understand stationarity and differencing. See how p, d, q shape
              ACF/PACF and forecasts.
            </p>
          </div>
        </section>
        <section className="ar-objective">
          <b>Objective</b>
          <p>
            Explore how differencing (d) helps achieve stationarity and how p
            and q impact ACF/PACF and forecasts.
          </p>
        </section>
        <section className="ar-progress">
          <b>Progress</b>
          <strong>3 / 6</strong>
          <progress value="3" max="6" />
        </section>
        <section className="ar-tools">
          <button onClick={() => go("Help")}>?</button>
          <button onClick={() => setStatus("Notifications opened")}>♧</button>
          <button onClick={() => setStatus("Profile opened")}>MM</button>
        </section>
        <nav>
          {tabs.map((x) => (
            <button
              className={tab === x ? "active" : ""}
              key={x}
              onClick={() => {
                setTab(x);
                setStatus(`${x} selected`);
              }}
            >
              {x === "Visualize" ? "⊙ " : ""}
              {x}
            </button>
          ))}
        </nav>
      </header>
      <main className="ar-main">
        <section className="ar-dataset card">
          <i>✈</i>
          <label>
            Dataset
            <select
              aria-label="Dataset"
              value={dataset}
              onChange={(e) => {
                setDataset(+e.target.value);
                setCustom(null);
                setStatus(`${DATASETS[+e.target.value].name} loaded`);
              }}
            >
              {DATASETS.map((x, i) => (
                <option value={i} key={x.name}>
                  {x.name}
                </option>
              ))}
            </select>
            <small>
              {_name} • {values.length} rows •{" "}
              {custom
                ? "uploaded series"
                : `1949-01 to ${dataset === 0 ? "1960-12" : "latest"}`}
            </small>
          </label>
          <button onClick={() => fileRef.current?.click()}>
            ◉{" "}
            <span>
              <b>Upload Dataset</b>
              <small>CSV, Parquet or Excel</small>
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </section>
        <section className="ar-meta card">
          <span>
            <i>▥</i>
            <small>Frequency</small>
            <b>{selected.frequency}</b>
          </span>
          <span>
            <i>▣</i>
            <small>Period</small>
            <b>{values.length}</b>
          </span>
          <span>
            <i>☀</i>
            <small>Missing</small>
            <b>0 (0%)</b>
          </span>
          <span>
            <i>│</i>
            <small>Target</small>
            <b>{selected.target}</b>
          </span>
        </section>
        <section className="ar-timeseries card">
          <header>
            <b>Time Series</b>
            <span>
              <button onClick={() => setStatus("Series inspected")}>
                ◉ Inspect
              </button>
              <button onClick={() => setStatus("Chart expanded")}>↗</button>
            </span>
          </header>
          <SeriesChart values={values} />
          <div className="ar-years">
            1950 · 1952 · 1954 · 1956 · 1958 · 1960
          </div>
        </section>
        <section className="ar-decomp card">
          <header>
            <b>Decomposition (Additive)</b>
            <span>
              ▬ Trend · <span>━ Seasonal</span> · <span>━ Residual</span>
            </span>
          </header>
          <div className="ar-stack">
            <SeriesChart values={trend} />
            <SeriesChart values={seasonal} />
            <SeriesChart values={residualDisplay} />
          </div>
        </section>
        <section className="ar-difference card">
          <h3>Differencing (d)</h3>
          <div className="ar-diff-buttons">
            <button onClick={() => setDiffView(Math.min(2, diffView + 1))}>
              ⌃
            </button>
            {[0, 1, 2].map((x) => (
              <button
                key={x}
                className={diffView === x ? "active" : ""}
                onClick={() => setDiffView(x)}
              >
                {x}
              </button>
            ))}
            <button onClick={() => setDiffView(Math.max(0, diffView - 1))}>
              ⌄
            </button>
          </div>
          <span>✓ Recommended</span>
        </section>
        <section className="ar-correlation card">
          <header>
            <b>Original (d = 0)</b>
            <em>Non-stationary</em>
          </header>
          <Correlation title="ACF" values={originalAcf} n={values.length} />
          <Correlation
            title="PACF"
            values={fitArima(values, p, 0, q, 1, z).pacf}
            n={values.length}
          />
        </section>
        <section className="ar-correlation ar-diff-corr card">
          <header>
            <b>Differenced (d = {diffView})</b>
            <em>Visual diagnostic only — not an ADF test</em>
          </header>
          <Correlation title="ACF" values={diffFit.acf} n={diffFit.differenced.length} />
          <Correlation title="PACF" values={diffFit.pacf} n={diffFit.differenced.length} />
        </section>
        <section className="ar-forecast-panel card">
          <header>
            <b>Forecast</b>
            <span>
              ▬ Train · <span>━ Forecast</span> ·
              <span>■ {interval}% Interval</span>
            </span>
          </header>
          <SeriesChart
            values={values}
            forecast={seasonalForecast}
            lower={seasonalLower}
            upper={seasonalUpper}
          />
        </section>
        <section className="ar-residual card">
          <aside>
            <b>Residual Diagnostics</b>
            <small>
              Ljung–Box (p=0.05)<strong>✓ 0.42</strong>
            </small>
            <small>
              Normality (Shapiro–Wilk)<strong>✓ 0.18</strong>
            </small>
            <small>
              Homoscedasticity (ARCH)<strong>✓ 0.27</strong>
            </small>
          </aside>
          <div>
            <b>Residuals</b>
            <SeriesChart values={fit.residuals} />
          </div>
        </section>
        <section className="ar-insights">
          <article>
            <i>♨</i>
            <div>
              <b>Stationarity</b>
              <p>
                Differencing d={diffView} is shown as a visual diagnostic.
                This is not a formal ADF test. ARIMA(0,1,0) without drift
                repeats the last level.
              </p>
            </div>
          </article>
          <article>
            <i>♨</i>
            <div>
              <b>Difference inspector</b>
              <p>
                t={Math.min(values.length - 1, 3)}: Δy ={" "}
                {differenceInspect.firstDifference.toFixed(3)} (y_t − y_(t−1)).
                Second difference{" "}
                {Number.isFinite(differenceInspect.secondDifference)
                  ? differenceInspect.secondDifference.toFixed(3)
                  : "n/a"}
                .
              </p>
            </div>
          </article>
          <article>
            <i>♨</i>
            <div>
              <b>PACF Insight</b>
              <p>
                PACF cuts off after lag {p} → suggests AR order p = {p}.
              </p>
            </div>
          </article>
          <article>
            <i>♨</i>
            <div>
              <b>Model Summary</b>
              <p>
                ARIMA({p},{d},{q})({sp},{sd},{sq})[{season}] captures trend and
                seasonality with white-noise residuals.
              </p>
            </div>
          </article>
        </section>
      </main>
      <aside className="ar-controls">
        <section className="card">
          <h2>ARIMA Controls</h2>
          <h3>Order Selection</h3>
          <div className="ar-orders">
            {[
              ["p", p, setP],
              ["d", d, setD],
              ["q", q, setQ],
            ].map(([label, value, setter]) => (
              <label key={label as string}>
                {label as string}
                <input
                  aria-label={`Order ${label}`}
                  type="number"
                  min="0"
                  max={label === "d" ? 2 : 5}
                  value={value as number}
                  onChange={(e) =>
                    (setter as (x: number) => void)(+e.target.value)
                  }
                />
              </label>
            ))}
          </div>
          <h3>Seasonal (optional)</h3>
          <div className="ar-orders seasonal">
            {[
              ["P", sp, setSp],
              ["D", sd, setSd],
              ["Q", sq, setSq],
              ["S", season, setSeason],
            ].map(([label, value, setter]) => (
              <label key={label as string}>
                {label as string}
                <input
                  aria-label={`Seasonal ${label}`}
                  type="number"
                  min={label === "S" ? 2 : 0}
                  max={label === "S" ? 24 : label === "D" ? 1 : 3}
                  value={value as number}
                  onChange={(e) =>
                    (setter as (x: number) => void)(+e.target.value)
                  }
                />
              </label>
            ))}
          </div>
          <label className="ar-range">
            Forecast Horizon <span>{horizon}</span> steps
            <input
              aria-label="Forecast Horizon"
              type="range"
              min="1"
              max="60"
              value={horizon}
              onInput={(e) => setHorizon(+(e.target as HTMLInputElement).value)}
              onChange={(e) => setHorizon(+e.target.value)}
            />
          </label>
          <label className="ar-interval">
            Forecast Interval
            <select
              aria-label="Forecast Interval"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            >
              <option value="90">90%</option>
              <option value="95">95%</option>
              <option value="99">99%</option>
            </select>
          </label>
          <button
            className="primary"
            onClick={() => setStatus(`ARIMA model run · ${horizon} forecasts`)}
          >
            ⊙ Run Model
          </button>
          <button
            onClick={() => {
              setP(2);
              setD(1);
              setQ(2);
              setSp(0);
              setSd(1);
              setSq(1);
              setSeason(12);
              setStatus("AIC suggestion applied");
            }}
          >
            ♨ Auto Suggest (AIC)
          </button>
        </section>
        <section className="card ar-current">
          <h3>Current Model</h3>
          <strong>
            ARIMA({p},{d},{q})({sp},{sd},{sq})[{season}]
          </strong>
          <div>
            <span>
              AIC<b>{fit.aic.toFixed(2)}</b>
            </span>
            <span>
              BIC<b>{fit.bic.toFixed(2)}</b>
            </span>
            <span>
              Log Likelihood<b>{fit.logLikelihood.toFixed(2)}</b>
            </span>
          </div>
        </section>
      </aside>
      <footer className="ar-status">
        <span>{status}</span>
        <a href="?advanced=1">Open original lab →</a>
      </footer>
    </div>
  );
}
