import { useMemo, useRef, useState } from "react";
import { useLabNavigate } from "../../../lib/labNavigation";
import { recurrentForecast } from "../../../lib/timeSeries/recurrentForecast";
import { TIME_SERIES_CATALOG, seriesValues } from "../../../lib/timeSeries/timeSeriesDatasets";
import { useActiveTimeSeries } from "../../../lib/timeSeries/useActiveTimeSeries";
import { LabLessonOrWork, labHide } from "../../../components/common/LabTabs";
import "./GRUForecastingApprovedPage.css";

const DATA = [
  {
    name: "Electricity Transformer Load",
    meta: "Freq: 15 min | Variables: 6 | Length: 52,560",
    values: Array.from(
      { length: 420 },
      (_, i) =>
        118 +
        31 * Math.sin((i * Math.PI * 2) / 48 - 1) +
        15 * Math.sin((i * Math.PI * 2) / 336) +
        8 * Math.cos(i * 0.55),
    ),
  },
  {
    name: "Traffic Sensor Volume",
    meta: "Freq: 30 min | Variables: 5 | Length: 35,040",
    values: Array.from(
      { length: 420 },
      (_, i) =>
        82 +
        24 * Math.sin((i * Math.PI * 2) / 48 - 0.7) +
        11 * Math.sin((i * Math.PI * 2) / 336) +
        5 * Math.cos(i * 0.43),
    ),
  },
  {
    name: "Wind Farm Output",
    meta: "Freq: 10 min | Variables: 8 | Length: 78,840",
    values: Array.from(
      { length: 420 },
      (_, i) =>
        105 +
        21 * Math.sin((i * Math.PI * 2) / 72) +
        18 * Math.sin(i * 0.12) +
        9 * Math.cos(i * 0.47),
    ),
  },
  ...TIME_SERIES_CATALOG.map((item) => ({
    name: item.name,
    meta: `${item.frequency} · ${item.points.length} observations`,
    values: seriesValues(item),
  })),
];
const line = (v: number[], w: number, h: number, lo: number, hi: number) =>
  v
    .map(
      (x, i) =>
        `${i ? "L" : "M"}${8 + (i / Math.max(1, v.length - 1)) * (w - 16)},${7 + ((hi - x) / (hi - lo || 1)) * (h - 14)}`,
    )
    .join(" ");
const Heat = ({
  values,
  color,
}: {
  values: number[];
  color: "green" | "orange";
}) => (
  <div className={`gf-heat ${color}`}>
    {Array.from({ length: 180 }, (_, i) => (
      <i
        key={i}
        style={{
          opacity:
            0.16 +
            0.8 *
              Math.abs(Math.sin(values[i % values.length] * (i + 1) * 0.17)),
        }}
      />
    ))}
  </div>
);

export default function GRUForecastingApprovedPage() {
  const [dataset, setDataset] = useState(0),
    [custom, setCustom] = useState<{ name: string; values: number[] } | null>(
      null,
    ),
    [tab, setTab] = useState("Learn"),
    [run, setRun] = useState("GRU-Run-042"),
    [lookback, setLookback] = useState(96),
    [horizon, setHorizon] = useState(24),
    [roll, setRoll] = useState(4),
    [layers, setLayers] = useState(2),
    [units, setUnits] = useState(64),
    [dropout, setDropout] = useState(0.2),
    [activation, setActivation] = useState("tanh"),
    [optimizer, setOptimizer] = useState("Adam"),
    [rate, setRate] = useState("0.001"),
    [loss, setLoss] = useState("MAE"),
    [batch, setBatch] = useState(64),
    [epochs, setEpochs] = useState(60),
    [early, setEarly] = useState(true),
    [patience, setPatience] = useState(8),
    [scaling, setScaling] = useState("Standard Scaler"),
    [status, setStatus] = useState(
      "Dataset: Electricity Transformer Load | Freq: 15 min | Last updated: 2 min ago",
    ),
    [collapsed, setCollapsed] = useState(false);
  const handoff = useActiveTimeSeries("/ml/time-series/gru-forecasting");
  const fileRef = useRef<HTMLInputElement>(null),
    source = DATA[dataset],
    values = custom?.values ?? handoff?.points.map((point) => point.value) ?? source.values,
    result = useMemo(
      () =>
        recurrentForecast(
          values,
          Math.min(lookback, values.length - 2),
          horizon,
          units,
          "gru",
        ),
      [values, lookback, horizon, units],
    );
  const recent = values.slice(-240),
    all = [...recent, ...result.predictions],
    lo = Math.min(...all),
    hi = Math.max(...all),
    gates = result.gateHistory.slice(-180),
    updates = gates.map((g) => g.update),
    resets = gates.map((g) => g.reset),
    last = gates.at(-1) ?? { update: 0.62, reset: 0.41, candidate: 0.53 },
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
  const upload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = String(reader.result)
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((r) => Number(r.split(",").at(-1)))
        .filter(Number.isFinite);
      if (parsed.length >= 24) {
        setCustom({ name: file.name, values: parsed });
        setStatus(`${file.name} · ${parsed.length} observations loaded`);
      } else setStatus("Upload needs at least 24 numeric rows");
    };
    reader.readAsText(file);
  };
  const act = useLabNavigate();
  return (
    <div className={`gf-page ${collapsed ? "gf-collapsed" : ""}`}>
      <aside className="gf-side">
        <a href="/" className="gf-brand">
          <i>✣</i>
          <span>
            <b>Mega ML</b>
            <small>AI Observatory</small>
          </span>
        </a>
        <button className="home" onClick={() => act("Home")}>
          ⌂ <span>Home</span>
        </button>
        <p>MODELING</p>
        <button className="active" onClick={() => act("Time Series")}>
          ⌁ <span>Time Series</span>⌃
        </button>
        {[
          "Forecasting",
          "Anomaly Detection",
          "Classification",
          "Regression",
          "Clustering",
          "Deep Learning",
        ].map((x) => (
          <button className="sub" key={x} onClick={() => act(x)}>
            <span>{x}</span>
          </button>
        ))}
        <p>DATA</p>
        {["▤ Datasets", "↥ Upload", "♧ Data Hub"].map((x) => (
          <button key={x} onClick={() => act(x.slice(2))}>
            {x.slice(0, 1)} <span>{x.slice(2)}</span>
          </button>
        ))}
        <p>TOOLS</p>
        {[
          "▣ Notebooks",
          "♧ Pipelines",
          "⌘ Experiments",
          "⌁ Model Registry",
        ].map((x) => (
          <button key={x} onClick={() => act(x.slice(2))}>
            {x.slice(0, 1)} <span>{x.slice(2)}</span>
          </button>
        ))}
        <footer>
          <button onClick={() => act("Help")}>
            ? <span>Help</span>
          </button>
          <button onClick={() => act("Settings")}>
            ⚙ <span>Settings</span>
          </button>
          <button onClick={() => setCollapsed((v) => !v)}>
            « <span>Collapse</span>
          </button>
        </footer>
      </aside>
      <header className="gf-head">
        <div>
          <small>Time Series › Deep Learning</small>
          <h1>GRU Forecasting ⓘ ☆</h1>
          <p>
            Compact gated recurrent unit for multivariate time series
            forecasting.
          </p>
        </div>
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
              {x}
            </button>
          ))}
        </nav>
        <button onClick={() => act("Experiments")}>Experiments</button>
        <button onClick={() => act("Theme")}>◔</button>
        <button onClick={() => act("Profile")}>MM</button>
      </header>
      <section className={`gf-toolbar card${labHide(tab, "Dataset", "Train")}`}>
        <label>
          Dataset
          <select
            aria-label="Dataset"
            value={dataset}
            onChange={(e) => {
              setDataset(+e.target.value);
              setCustom(null);
              setStatus(`${DATA[+e.target.value].name} loaded`);
            }}
          >
            {DATA.map((x, i) => (
              <option key={x.name} value={i}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <small>
          Sample ⌄ |{" "}
          {custom ? `${values.length} imported observations` : source.meta}
        </small>
        <button onClick={() => fileRef.current?.click()}>
          ♙ Upload Dataset
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <label>
          Run
          <select
            aria-label="Run"
            value={run}
            onChange={(e) => setRun(e.target.value)}
          >
            <option>GRU-Run-042</option>
            <option>GRU-Run-041</option>
            <option>GRU-Baseline</option>
          </select>
        </label>
        <b>Saved</b>
        <button
          onClick={() => {
            setStatus("Configuration reset");
            setLookback(96);
            setHorizon(24);
            setRoll(4);
          }}
        >
          Reset
        </button>
        <button
          className="primary"
          onClick={() =>
            setStatus(
              `GRU trained · ${epochs} epochs · MAE ${(result.std * 0.08).toFixed(2)}`,
            )
          }
        >
          Train / Update
        </button>
      </section>
      <main className="gf-main">
        <LabLessonOrWork tab={tab} route="/ml/time-series/gru-forecasting">
        <section className={`gf-chart card${labHide(tab, "Visualize", "Train")}`}>
          <header>
            <b>
              Forecast vs Actual <small>(Rolling Origin)</small>
            </b>
            <label>
              Lookback
              <select
                aria-label="Lookback"
                value={lookback}
                onChange={(e) => setLookback(+e.target.value)}
              >
                {[48, 96, 168].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Horizon
              <select
                aria-label="Horizon"
                value={horizon}
                onChange={(e) => setHorizon(+e.target.value)}
              >
                {[12, 24, 48].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Roll Step
              <input
                aria-label="Roll Step"
                type="number"
                min="1"
                max="12"
                value={roll}
                onChange={(e) => setRoll(+e.target.value)}
              />
            </label>
          </header>
          <p>
            ✦ Train <i>◆ Actual</i> <em>◆ GRU Forecast</em> ▣ 95% Interval
          </p>
          <svg viewBox="0 0 700 230" preserveAspectRatio="none">
            {[40, 90, 140, 190].map((y) => (
              <line key={y} x1="10" x2="690" y1={y} y2={y} />
            ))}
            <path className="actual" d={line(recent, 700, 230, lo, hi)} />
            <path
              className="forecast"
              d={line(result.predictions, 270, 230, lo, hi)}
              transform="translate(425 0)"
            />
            {result.lower.length ? (
              <path
                className="band"
                d={`${line(result.upper, 270, 230, lo, hi)} L270,220 ${line([...result.lower].reverse(), 270, 230, lo, hi)} Z`}
                transform="translate(425 0)"
              />
            ) : null}
          </svg>
          <footer>May 12 May 14 May 16 May 18 May 20 May 21</footer>
        </section>
        <section className={`gf-gates card${labHide(tab, "Visualize", "Train")}`}>
          <h3>Gate Activity Over Time ⓘ</h3>
          <p>{result.architecture}</p>
          {result.dataWarning ? <p>{result.dataWarning}</p> : null}
          <p>
            ■ Update Gate (zₜ) <b>■ Reset Gate (rₜ)</b>
          </p>
          <label>zₜ</label>
          <Heat values={updates} color="green" />
          <label>rₜ</label>
          <Heat values={resets} color="orange" />
          <footer>Gate Value 0 ━━━━━ 0.5 ━━━━━ 1.0</footer>
        </section>
        <section className={`gf-mechanics card${labHide(tab, "Visualize", "Train")}`}>
          <h3>
            Gated Recurrent Mechanics <small>(How GRU Decides)</small>
          </h3>
          <div>
            {[
              [
                "Update Gate (zₜ)",
                last.update,
                "Balances new information vs past memory.",
              ],
              [
                "Reset Gate (rₜ)",
                last.reset,
                "Controls how much past to forget.",
              ],
              [
                "Candidate State (h̃ₜ)",
                last.candidate,
                "New content proposed at time t.",
              ],
            ].map((x, i) => (
              <article key={String(x[0])}>
                <i
                  style={
                    { "--p": `${Number(x[1]) * 360}deg` } as React.CSSProperties
                  }
                >
                  {Number(x[1]).toFixed(2)}
                </i>
                <span>
                  <b>{x[0]}</b>
                  <p>{x[2]}</p>
                  <small>
                    {i === 0
                      ? "High = keep past, Low = update more."
                      : i === 1
                        ? "High = keep more past, Low = reset more."
                        : "Combined with gates to form hₜ."}
                  </small>
                </span>
              </article>
            ))}
          </div>
        </section>
        <section className={`gf-progress card${labHide(tab, "Train")}`}>
          <h3>Progress</h3>
          <div>
            <span>
              ✓ Data Loaded
              <br />✓ Transformed
              <br />✓ Model Trained
              <br />● Evaluated
              <br />● Ready to Forecast
            </span>
            <b>
              80%<small>ETA: 00:01:24</small>
            </b>
          </div>
        </section>
        <section className={`gf-metrics card${labHide(tab, "Metrics")}`}>
          <h3>
            Key Metrics <small>(Test Set)</small>
          </h3>
          <div>
            {[
              ["MAE", "9.54", "↓ 8.2%"],
              ["RMSE", "12.71", "↓ 7.6%"],
              ["MAPE", "6.83%", "↓ 9.1%"],
              ["sMAPE", "6.19%", "↓ 8.7%"],
              ["R²", "0.912", "↑ 2.4%"],
            ].map((x) => (
              <article key={x[0]}>
                <span>{x[0]}</span>
                <b>{x[1]}</b>
                <small>{x[2]}</small>
              </article>
            ))}
          </div>
          <small>vs Naive Seasonal</small>
        </section>
        <section className={`gf-compare card${labHide(tab, "Metrics")}`}>
          <h3>
            Model Comparison <small>(Horizon = {horizon})</small>
          </h3>
          {[
            ["GRU (This Model)", "9.54", "12.71", "6.83%", "0.912"],
            ["LSTM", "10.32", "13.89", "7.35%", "0.892"],
            ["TCN", "9.98", "13.21", "7.01%", "0.904"],
            ["SARIMA", "12.74", "16.98", "9.21%", "0.781"],
            ["Naive Seasonal", "15.86", "20.34", "11.42%", "0.624"],
          ].map((x, i) => (
            <p className={i === 0 ? "active" : ""} key={x[0]}>
              {x.map((v) => (
                <span key={v}>{v}</span>
              ))}
            </p>
          ))}
        </section>
        <section className={`gf-error card${labHide(tab, "Metrics")}`}>
          <h3>
            Error Distribution <small>(Test Set)</small>
          </h3>
          <div>
            {Array.from({ length: 32 }, (_, i) => (
              <i
                key={i}
                style={{ height: `${Math.exp(-(((i - 16) / 8) ** 2)) * 95}%` }}
              />
            ))}
          </div>
          <p>
            Mean Error <b>-0.21</b>
            <br />
            Std Dev <b>12.68</b>
          </p>
        </section>
        </LabLessonOrWork>
      </main>
      <aside className={`gf-config card${labHide(tab, "Train", "Transform", "Visualize")}`}>
        <h3>⌄ Model Configuration ⌁</h3>
        <label>
          Architecture
          <select
            aria-label="Architecture"
            value="GRU"
            onChange={() => undefined}
          >
            <option>GRU</option>
          </select>
        </label>
        <div>
          <label>
            Layers
            <input
              aria-label="Layers"
              type="number"
              min="1"
              max="4"
              value={layers}
              onChange={(e) => setLayers(+e.target.value)}
            />
          </label>
          <label>
            Hidden Units
            <input
              aria-label="Hidden Units"
              type="number"
              min="16"
              max="256"
              step="16"
              value={units}
              onChange={(e) => setUnits(+e.target.value)}
            />
          </label>
        </div>
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
          Activation
          <select
            aria-label="Activation"
            value={activation}
            onChange={(e) => setActivation(e.target.value)}
          >
            <option>tanh</option>
            <option>relu</option>
            <option>sigmoid</option>
          </select>
        </label>
        <div>
          <label>
            Optimizer
            <select
              aria-label="Optimizer"
              value={optimizer}
              onChange={(e) => setOptimizer(e.target.value)}
            >
              <option>Adam</option>
              <option>RMSprop</option>
              <option>SGD</option>
            </select>
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
        </div>
        <label>
          Loss
          <select
            aria-label="Loss"
            value={loss}
            onChange={(e) => setLoss(e.target.value)}
          >
            <option>MAE</option>
            <option>MSE</option>
            <option>Huber</option>
          </select>
        </label>
        <div>
          <label>
            Batch Size
            <input
              aria-label="Batch Size"
              type="number"
              min="16"
              max="256"
              step="16"
              value={batch}
              onChange={(e) => setBatch(+e.target.value)}
            />
          </label>
          <label>
            Epochs
            <input
              aria-label="Epochs"
              type="number"
              min="10"
              max="200"
              step="10"
              value={epochs}
              onChange={(e) => setEpochs(+e.target.value)}
            />
          </label>
        </div>
        <label className="switch">
          Early Stopping
          <input
            aria-label="Early Stopping"
            type="checkbox"
            checked={early}
            onChange={(e) => setEarly(e.target.checked)}
          />
        </label>
        <label>
          Patience
          <input
            aria-label="Patience"
            type="number"
            min="2"
            max="20"
            value={patience}
            onChange={(e) => setPatience(+e.target.value)}
          />
        </label>
        <hr />
        <label>
          Scaling
          <select
            aria-label="Scaling"
            value={scaling}
            onChange={(e) => setScaling(e.target.value)}
          >
            <option>Standard Scaler</option>
            <option>Min-Max Scaler</option>
            <option>Robust Scaler</option>
          </select>
        </label>
        <button onClick={() => act("Advanced Options")}>
          ♧ Advanced Options ⌃
        </button>
        <a href="?advanced=1">Open TensorFlow.js lab →</a>
      </aside>
      <footer className="gf-status">{status}</footer>
    </div>
  );
}
