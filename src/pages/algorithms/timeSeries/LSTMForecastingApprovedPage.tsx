import { useMemo, useRef, useState } from "react";
import { useLabNavigate } from "../../../lib/labNavigation";
import { recurrentForecast } from "../../../lib/timeSeries/recurrentForecast";
import { TIME_SERIES_CATALOG, seriesValues } from "../../../lib/timeSeries/timeSeriesDatasets";
import { useActiveTimeSeries } from "../../../lib/timeSeries/useActiveTimeSeries";
import "./LSTMForecastingApprovedPage.css";

const SETS = [
  {
    name: "Electricity Load (Australia)",
    meta: "Hourly load · 2012–2014 · 3 Years",
    values: Array.from(
      { length: 336 },
      (_, i) =>
        112 +
        29 * Math.sin((i * Math.PI * 2) / 24 - 1.1) +
        13 * Math.sin((i * Math.PI * 2) / 168) +
        5 * Math.cos(i * 0.39),
    ),
  },
  {
    name: "Metro Traffic Volume",
    meta: "Hourly traffic · 2016–2018 · 2 Years",
    values: Array.from(
      { length: 336 },
      (_, i) =>
        74 +
        22 * Math.sin((i * Math.PI * 2) / 24 - 0.7) +
        8 * Math.sin((i * Math.PI * 2) / 168) +
        4 * Math.cos(i * 0.53),
    ),
  },
  {
    name: "Solar Power Output",
    meta: "Hourly generation · 2019–2021 · 2 Years",
    values: Array.from({ length: 336 }, (_, i) =>
      Math.max(
        3,
        64 +
          55 * Math.sin((i * Math.PI * 2) / 24 - 1.55) +
          6 * Math.cos(i * 0.31),
      ),
    ),
  },
  ...TIME_SERIES_CATALOG.map((item) => ({
    name: item.name,
    meta: `${item.frequency} · ${item.points.length} observations`,
    values: seriesValues(item),
  })),
];
const path = (v: number[], w: number, h: number, lo: number, hi: number) =>
  v
    .map(
      (x, i) =>
        `${i ? "L" : "M"}${(i / Math.max(1, v.length - 1)) * w},${6 + ((hi - x) / (hi - lo || 1)) * (h - 12)}`,
    )
    .join(" ");

export default function LSTMForecastingApprovedPage() {
  const [dataset, setDataset] = useState(0),
    [tab, setTab] = useState("Visualize"),
    [window, setWindow] = useState(168),
    [horizon, setHorizon] = useState(168),
    [step, setStep] = useState(24),
    [layers, setLayers] = useState(2),
    [units, setUnits] = useState(64),
    [dropout, setDropout] = useState(0.2),
    [rate, setRate] = useState("0.001"),
    [view, setView] = useState("Seasonal Weekly Pattern"),
    [gateOn, setGateOn] = useState(true),
    [cellOn, setCellOn] = useState(true),
    [uncertainty, setUncertainty] = useState(true),
    [custom, setCustom] = useState<{ name: string; values: number[] } | null>(
      null,
    ),
    [status, setStatus] = useState("Ready"),
    [collapsed, setCollapsed] = useState(false);
  const handoff = useActiveTimeSeries("/ml/time-series/lstm-forecasting");
  const fileRef = useRef<HTMLInputElement>(null),
    source = SETS[dataset],
    values = custom?.values ?? handoff?.points.map((point) => point.value) ?? source.values;
  const result = useMemo(
    () =>
      recurrentForecast(
        values,
        Math.min(window, values.length - 2),
        Math.max(1, Math.round(horizon / step)),
        units,
        "lstm",
      ),
    [values, window, horizon, step, units],
  );
  const observed = values.slice(-168),
    forecast = result.predictions,
    all = [...observed, ...forecast],
    lo = Math.min(...all),
    hi = Math.max(...all),
    gates = result.gateHistory.at(-1) ?? {
      forget: 0.86,
      input: 0.41,
      candidate: 0.62,
      output: 0.73,
      update: 0,
      reset: 0,
    };
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
      if (parsed.length >= 24) {
        setCustom({ name: file.name, values: parsed });
        setStatus(`${file.name} · ${parsed.length} observations loaded`);
      } else setStatus("Upload needs at least 24 numeric rows");
    };
    reader.readAsText(file);
  };
  const act = useLabNavigate(),
    tabs = [
      "Learn",
      "Visualize",
      "Dataset",
      "Transform",
      "Train",
      "Metrics",
      "Compare",
      "Explain",
    ];
  return (
    <div className={`lf-page ${collapsed ? "lf-collapsed" : ""}`}>
      <aside className="lf-side">
        <a href="/" className="lf-brand">
          <i>◉</i>
          <span>
            <b>Mega ML</b>
            <small>AI OBSERVATORY</small>
          </span>
        </a>
        <button className="active" onClick={() => act("Home")}>
          ⌂ <span>Home</span>
        </button>
        {[
          ["LEARN", "▦ All Lessons", "▤ Roadmap", "▮ Bookmarks"],
          ["LAB", "♧ Notebooks", "◇ Models", "♧ Experiments", "⬡ Deployments"],
          ["DATA", "▤ Datasets", "↥ Uploads"],
          ["RESOURCES", "▧ Docs", "▣ Glossary", "◆ What's New"],
        ].map((group) => (
          <section key={group[0]}>
            <p>{group[0]}</p>
            {group.slice(1).map((x) => (
              <button key={x} onClick={() => act(x.slice(2))}>
                {x.slice(0, 1)} <span>{x.slice(2)}</span>
              </button>
            ))}
          </section>
        ))}
        <button className="lf-fold" onClick={() => setCollapsed((v) => !v)}>
          « <span>Collapse</span>
        </button>
      </aside>
      <header className="lf-head">
        <div>
          <h1>
            LSTM Forecasting <small>Interactive Lesson</small>
          </h1>
          <p>
            Learn how LSTM networks capture temporal patterns and forecast
            future values with memory gates and uncertainty.
          </p>
        </div>
        <button onClick={() => act("Export")}>⇩ Export⌄</button>
        <button onClick={() => act("Theme")}>◔</button>
        <button onClick={() => act("Profile")}>ML</button>
      </header>
      <section className="lf-progress card">
        <article>
          <b>OBJECTIVE ⓘ</b>
          <p>
            Understand how LSTM uses gates and memory to capture seasonality and
            produce multi-step forecasts with uncertainty.
          </p>
        </article>
        <article>
          <b>PROGRESS</b>
          <div>
            {["Understand", "Visualize", "Configure", "Train", "Evaluate"].map(
              (x, i) => (
                <span className={i < 3 ? "done" : ""} key={x}>
                  <i>{i < 2 ? "✓" : "●"}</i>
                  {x}
                </span>
              ),
            )}
          </div>
        </article>
      </section>
      <section className="lf-data card">
        <b>DATASET</b>
        <div>
          ⌁{" "}
          <span>
            <strong>{custom?.name ?? source.name}</strong>
            <small>
              {custom ? `${values.length} imported rows` : source.meta}
            </small>
          </span>
          <button onClick={() => setDataset((dataset + 1) % SETS.length)}>
            Change
          </button>
        </div>
      </section>
      <nav className="lf-tabs">
        {tabs.map((x) => (
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
      <main className="lf-main">
        <section className="lf-work card">
          <header>
            <b>LSTM Seasonal Sequence → Multi-Step Forecast ⓘ</b>
            <select
              aria-label="View"
              value={view}
              onChange={(e) => setView(e.target.value)}
            >
              <option>Seasonal Weekly Pattern</option>
              <option>Daily Peaks</option>
              <option>Long-Term Trend</option>
            </select>
          </header>
          <div className="lf-flow">
            <article>
              <h3>
                <i>1</i> Input Sequence (Past)
              </h3>
              <svg viewBox="0 0 250 150" preserveAspectRatio="none">
                <path d={path(observed, 250, 150, lo, hi)} />
                <rect x="80" y="20" width="52" height="105" />
              </svg>
              <p>Past 7 Days ({window} hours)</p>
            </article>
            <strong>→</strong>
            <article className="lf-cell">
              <h3>
                <i>2</i> LSTM Cell (One Step)
              </h3>
              <div>
                <span>hₜ₋₁ ─⊗────⊕── hₜ</span>
                <span>Cₜ₋₁ ─────┼── Cₜ</span>
                <footer>
                  <b>
                    σ<small>Forget Gate</small>
                  </b>
                  <b>
                    σ<small>Input Gate</small>
                  </b>
                  <b>
                    tanh<small>Candidate</small>
                  </b>
                  <b>
                    σ<small>Output Gate</small>
                  </b>
                </footer>
              </div>
            </article>
            <strong>→</strong>
            <article>
              <h3>
                <i>3</i> Multi-step Forecast (Future)
              </h3>
              <svg viewBox="0 0 360 150" preserveAspectRatio="none">
                {uncertainty && result.intervalAvailable && (
                  <path
                    className="band"
                    d={`${path(result.upper, 360, 150, lo, hi)} L360,145 ${path([...result.lower].reverse(), 360, 150, lo, hi)} Z`}
                  />
                )}
                <path
                  className="forecast"
                  d={path(forecast, 360, 150, lo, hi)}
                />
              </svg>
              <p>Next 7 Days ({horizon} hours)</p>
              <p>{result.architecture}</p>
              {result.dataWarning ? <p>{result.dataWarning}</p> : null}
            </article>
          </div>
          <footer>
            ƒ Forget Gate 𝒊 Input Gate C̃ Candidate o Output Gate C Cell State h
            Hidden State
          </footer>
        </section>
        <section className="lf-states">
          <article className="card" style={{ opacity: gateOn ? 1 : 0.28 }}>
            <h3>
              Gate Activations <small>(Current Step t)</small>
            </h3>
            <div className="lf-rings">
              {[
                ["ƒ", gates.forget, "Forget Gate"],
                ["𝒊", gates.input, "Input Gate"],
                ["C̃", gates.candidate, "Candidate"],
                ["o", gates.output, "Output Gate"],
              ].map(([s, v, n]) => (
                <span
                  key={String(n)}
                  style={
                    { "--p": `${Number(v) * 360}deg` } as React.CSSProperties
                  }
                >
                  <i>
                    {s}
                    <b>{Number(v).toFixed(2)}</b>
                  </i>
                  <small>{n}</small>
                </span>
              ))}
            </div>
          </article>
          <article className="card" style={{ opacity: cellOn ? 1 : 0.28 }}>
            <h3>Cell State (Cₜ) Relevance</h3>
            <div className="lf-memory">
              Old
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} style={{ opacity: 0.35 + i / 18 }} />
              ))}
              Recent
            </div>
            <p>Higher values = more relevant to current forecast</p>
          </article>
          <article className="card">
            <h3>Hidden State (hₜ) Overview</h3>
            <svg viewBox="0 0 300 80" preserveAspectRatio="none">
              <path
                d={path(
                  result.states.slice(-80).map((s) => s[0] ?? 0),
                  300,
                  80,
                  -1,
                  1,
                )}
              />
            </svg>
          </article>
        </section>
        <section className="lf-insights">
          <h3>KEY INSIGHTS ⓘ</h3>
          {[
            [
              "⌁",
              "Seasonality Captured",
              "The model leverages same-time daily and weekly patterns.",
            ],
            [
              "▤",
              "Long-term Memory",
              "Important signals remain relevant in the cell state.",
            ],
            [
              "⌁",
              "Rising Uncertainty",
              "Prediction intervals widen with the forecast horizon.",
            ],
            [
              "⌘",
              "Multi-step Coherence",
              "Forecast maintains smooth dynamics across the horizon.",
            ],
          ].map((x) => (
            <article className="card" key={x[1]}>
              <i>{x[0]}</i>
              <b>{x[1]}</b>
              <p>{x[2]}</p>
            </article>
          ))}
        </section>
      </main>
      <aside className="lf-controls card">
        <h3>SEQUENCE & FORECAST SETTINGS</h3>
        <label>
          Input Window (past)
          <span>
            <input
              aria-label="Input Window"
              type="range"
              min="24"
              max="336"
              step="24"
              value={window}
              onChange={(e) => setWindow(+e.target.value)}
            />
            <b>{window}</b> hours
          </span>
        </label>
        <label>
          Forecast Horizon
          <span>
            <input
              aria-label="Forecast Horizon"
              type="range"
              min="24"
              max="336"
              step="24"
              value={horizon}
              onChange={(e) => setHorizon(+e.target.value)}
            />
            <b>{horizon}</b> hours
          </span>
        </label>
        <label>
          Forecast Step
          <span>
            <input
              aria-label="Forecast Step"
              type="range"
              min="1"
              max="24"
              value={step}
              onChange={(e) => setStep(+e.target.value)}
            />
            <b>{step}</b> hours
          </span>
        </label>
        <hr />
        <h3>MODEL CONTROLS</h3>
        <label>
          LSTM Layers
          <select
            aria-label="LSTM Layers"
            value={layers}
            onChange={(e) => setLayers(+e.target.value)}
          >
            {[1, 2, 3].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Hidden Units
          <select
            aria-label="Hidden Units"
            value={units}
            onChange={(e) => setUnits(+e.target.value)}
          >
            {[32, 64, 128].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Dropout
          <span>
            <input
              aria-label="Dropout"
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={dropout}
              onChange={(e) => setDropout(+e.target.value)}
            />
            <b>{dropout.toFixed(2)}</b>
          </span>
        </label>
        <label>
          Learning Rate
          <select
            aria-label="Learning Rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          >
            <option>0.0001</option>
            <option>0.001</option>
            <option>0.01</option>
          </select>
        </label>
        <hr />
        <h3>VISUAL CONTROLS</h3>
        {(
          [
            ["Show Gate Activations", gateOn, setGateOn],
            ["Show Cell State", cellOn, setCellOn],
            ["Show Uncertainty", uncertainty, setUncertainty],
          ] as const
        ).map(([n, v, set]) => (
          <label className="lf-switch" key={n}>
            {n}
            <input
              aria-label={n}
              type="checkbox"
              checked={v}
              onChange={(e) => set(e.target.checked)}
            />
          </label>
        ))}
        <hr />
        <h3>DATASET</h3>
        <p>
          <b>{custom?.name ?? source.name}</b>
          <small>{custom ? `${values.length} rows` : source.meta}</small>
        </p>
        <div className="lf-links">
          <button onClick={() => setDataset((dataset + 1) % SETS.length)}>
            Change
          </button>
          <button onClick={() => fileRef.current?.click()}>↥ Upload</button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </div>
        <button
          className="primary"
          onClick={() =>
            setStatus(
              `LSTM visualization updated · ${result.predictions.length} forecast points`,
            )
          }
        >
          ▷ Run / Update Visualization
        </button>
        <a href="?advanced=1">Open TensorFlow.js lab →</a>
      </aside>
      <footer className="lf-status">{status}</footer>
    </div>
  );
}
