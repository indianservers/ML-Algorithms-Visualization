import { useMemo, useRef, useState } from "react";
import { useLabNavigate } from "../../../lib/labNavigation";
import {
  recurrentForecast,
  type RecurrentKind,
} from "../../../lib/timeSeries/recurrentForecast";
import { TIME_SERIES_CATALOG, seriesValues } from "../../../lib/timeSeries/timeSeriesDatasets";
import { useActiveTimeSeries } from "../../../lib/timeSeries/useActiveTimeSeries";
import { LabLessonOrWork, labHide } from "../../../components/common/LabTabs";
import "./RNNForecastingApprovedPage.css";

const DATASETS = [
  {
    name: "Electricity Load – Hourly (2016–2023)",
    target: "Total Load (MW)",
    values: Array.from(
      { length: 168 },
      (_, i) =>
        39000 +
        14500 * Math.sin((i * Math.PI * 2) / 24 - 1.2) +
        5200 * Math.sin((i * Math.PI * 2) / 168) +
        2400 * Math.cos(i * 0.71),
    ),
  },
  {
    name: "Metro Traffic – Hourly (2019–2024)",
    target: "Traffic Volume",
    values: Array.from(
      { length: 168 },
      (_, i) =>
        3100 +
        1450 * Math.sin((i * Math.PI * 2) / 24 - 1) +
        520 * Math.sin((i * Math.PI * 2) / 168) +
        230 * Math.cos(i * 0.59),
    ),
  },
  {
    name: "Solar Generation – 30 min (2020–2024)",
    target: "Generation (MW)",
    values: Array.from({ length: 168 }, (_, i) =>
      Math.max(
        80,
        1800 +
          1600 * Math.sin((i * Math.PI * 2) / 48 - 1.6) +
          250 * Math.sin(i * 0.31),
      ),
    ),
  },
  ...TIME_SERIES_CATALOG.map((item) => ({
    name: item.name,
    target: "value",
    values: seriesValues(item),
  })),
];
function line(
  values: number[],
  w: number,
  h: number,
  lo: number,
  hi: number,
  pad = 8,
) {
  const span = hi - lo || 1;
  return values
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2)},${pad + ((hi - v) / span) * (h - pad * 2)}`,
    )
    .join(" ");
}
function MiniLine({
  values,
  color = "#3f87ff",
}: {
  values: number[];
  color?: string;
}) {
  const lo = Math.min(...values),
    hi = Math.max(...values);
  return (
    <svg viewBox="0 0 300 88" preserveAspectRatio="none">
      <path d={line(values, 300, 88, lo, hi)} style={{ stroke: color }} />
    </svg>
  );
}

export default function RNNForecastingApprovedPage() {
  const [dataset, setDataset] = useState(0),
    [custom, setCustom] = useState<{ name: string; values: number[] } | null>(
      null,
    ),
    [tab, setTab] = useState("Learn"),
    [lookback, setLookback] = useState(48),
    [horizon, setHorizon] = useState(24),
    [step, setStep] = useState(1),
    [target, setTarget] = useState("Total Load (MW)"),
    [scaling, setScaling] = useState("Standard Scaler"),
    [model, setModel] = useState("SimpleRNN (2 layers)"),
    [status, setStatus] = useState("Ready"),
    [collapsed, setCollapsed] = useState(false);
  const go = useLabNavigate();
  const handoff = useActiveTimeSeries("/ml/time-series/rnn-forecasting");
  const fileRef = useRef<HTMLInputElement>(null),
    source = DATASETS[dataset],
    values = custom?.values ?? handoff?.points.map((point) => point.value) ?? source.values,
    kind: RecurrentKind = model.startsWith("LSTM")
      ? "lstm"
      : model.startsWith("GRU")
        ? "gru"
        : "rnn";
  const sampledValues = useMemo(
    () => values.filter((_, index) => index % step === 0),
    [values, step],
  );
  const result = useMemo(
    () =>
      recurrentForecast(
        sampledValues,
        Math.min(lookback, sampledValues.length - 2),
        horizon,
        64,
        kind,
      ),
    [sampledValues, lookback, horizon, kind],
  );
  const forecastValues = [values.at(-1) ?? 0, ...result.predictions],
    all = [...values, ...forecastValues],
    lo = Math.min(...all),
    hi = Math.max(...all),
    split = (values.length / (values.length + horizon)) * 900;
  const band =
    result.lower.length && result.upper.length
      ? `${line([values.at(-1) ?? 0, ...result.upper], 900 - split + 10, 126, lo, hi, 5)} ${line(
          [values.at(-1) ?? 0, ...result.lower],
          900 - split + 10,
          126,
          lo,
          hi,
          5,
        )
          .split(" ")
          .reverse()
          .join(" ")} Z`
      : "";
  const tabs = [
      "Learn",
      "Visualize",
      "Dataset",
      "Transform",
      "Train",
      "Metrics",
      "Compare",
      "Explain",
    ],
    side = [
      "⌂ Home",
      "▣ Workbench",
      "▤ Datasets",
      "♧ Models",
      "▣ Algorithms",
      "⌘ Experiments",
      "⌁ Playground",
      "♧ Deployments",
      "♨ Monitoring",
      "▧ Reports",
      "⚙ Settings",
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
      if (parsed.length >= 24) {
        setCustom({ name: file.name, values: parsed });
        setStatus(`${file.name} · ${parsed.length} observations loaded`);
      } else setStatus("Upload needs at least 24 numeric rows");
    };
    reader.readAsText(file);
  };
  return (
    <div className={`rf-page ${collapsed ? "rf-collapsed" : ""}`}>
      <aside className="rf-side">
        <a className="rf-brand" href="/">
          <i>◉</i>
          <span>
            <b>Mega ML</b>
            <small>AI OBSERVATORY</small>
          </span>
        </a>
        {side.map((x, i) => (
          <button key={x} onClick={() => go(x)}>
            {x.slice(0, 1)}
            <span>{x.slice(2)}</span>
            {i === 1 || i === 4 ? <em>⌄</em> : null}
          </button>
        ))}
        <p>RECENT</p>
        {[
          "RNN Forecasting",
          "N-BEATS Load",
          "Prophet Energy",
          "TCN Anomaly",
          "LSTM Traffic",
        ].map((x, i) => (
          <button
            className={i === 0 ? "active" : ""}
            key={x}
            onClick={() => go(x)}
          >
            ▣<span>{x}</span>
          </button>
        ))}
        <button
          className="new"
          onClick={() => go("New Project")}
        >
          ＋ <span>New Project</span>
        </button>
        <footer>
          <button onClick={() => go("Docs")}>
            ▣ <span>Docs</span>
          </button>
          <button onClick={() => go("Support")}>
            ? <span>Support</span>
          </button>
          <button onClick={() => setCollapsed((v) => !v)}>
            ‹ <span>Collapse</span>
          </button>
        </footer>
      </aside>
      <header className="rf-top">
        <span>Deep Learning › RNN › Forecasting</span>
        <button onClick={() => go("Help")}>?</button>
        <button onClick={() => setStatus("Feedback opened")}>Feedback</button>
        <button onClick={() => setStatus("Theme changed")}>◔</button>
        <button onClick={() => setStatus("Profile opened")}>MM</button>
      </header>
      <section className="rf-head">
        <div>
          <h1>RNN Forecasting ☆ ⌕</h1>
          <p>
            Learn, visualize and build recurrent models for time series
            forecasting.
          </p>
        </div>
        <label>
          Dataset
          <select
            aria-label="Dataset"
            value={dataset}
            onChange={(e) => {
              setDataset(+e.target.value);
              setCustom(null);
              setTarget(DATASETS[+e.target.value].target);
              setStatus(`${DATASETS[+e.target.value].name} loaded`);
            }}
          >
            {DATASETS.map((x, i) => (
              <option value={i} key={x.name}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => fileRef.current?.click()}>↥ Upload</button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <button onClick={() => setStatus("More menu opened")}>⋮</button>
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
      </section>
      <main className="rf-main">
        <LabLessonOrWork tab={tab} route="/ml/time-series/rnn-forecasting">
        <section className={`rf-overview${labHide(tab, "Visualize", "Train")}`}>
          <aside>
            <article>
              <h3>◎ OBJECTIVE</h3>
              <p>
                Use a Recurrent Neural Network to learn from historical
                sequences and forecast future values across a rolling horizon.
              </p>
            </article>
            <article>
              <h3>◉ PROGRESS</h3>
              {[
                "Dataset loaded",
                "Windows prepared",
                "Model configured",
                "Trained",
                "Evaluated",
              ].map((x, i) => (
                <p key={x} className={i === 4 ? "pending" : ""}>
                  ● {x}
                </p>
              ))}
            </article>
          </aside>
          <article className="rf-model">
            <h3>MODEL OVERVIEW</h3>
            <small>
              How sequences flow through the RNN to produce forecasts.
            </small>
            <div className="rf-flow">
              <section>
                <b>
                  INPUT SEQUENCE <small>(lookback = {lookback})</small>
                </b>
                <MiniLine values={values.slice(-lookback)} />
                <footer>xₜ₋₄₇ xₜ₋₄₆ … xₜ₋₂ xₜ₋₁ xₜ</footer>
              </section>
              <strong>→</strong>
              <section className="rf-cells">
                <b>RECURRENT LAYER</b>
                <div>
                  {[47, 46, "…", 1, "t"].map((x, i) => (
                    <i key={i}>
                      h<sub>{typeof x === "number" ? `t-${x}` : x}</sub>
                    </i>
                  ))}
                </div>
                <p>↟ ↟ ↟ ↟</p>
              </section>
              <strong>→</strong>
              <section className="rf-horizon">
                <b>
                  FORECAST HORIZON <small>(h = {horizon})</small>
                </b>
                <div>
                  {[1, 2, "…", 23, 24].map((x, i) => (
                    <i key={i}>
                      ŷ<sub>t+{x}</sub>
                    </i>
                  ))}
                </div>
                <MiniLine values={result.predictions} />
              </section>
            </div>
            <footer>
              ━ Observed <span>━ Hidden State</span> <em>━ Forecast</em>
            </footer>
          </article>
        </section>
        <section className={`rf-rolling card${labHide(tab, "Visualize", "Train")}`}>
          <header>
            <b>
              ROLLING FORECAST <small>(Latest window)</small>
            </b>
            <span>
              ━ Observed ⋯ Actual <em>━ Forecast (mean)</em> <i>Prediction interval not available</i>
            </span>
          </header>
          <svg viewBox="0 0 900 126" preserveAspectRatio="none">
            {[18, 52, 86, 120].map((y) => (
              <line key={y} x1="10" x2="890" y1={y} y2={y} />
            ))}
            {band ? (
              <path
                d={band}
                transform={`translate(${split - 4} 0)`}
                className="band"
              />
            ) : null}
            <path d={line(values, 900, 126, lo, hi)} className="observed" />
            <line x1={split} x2={split} y1="4" y2="122" className="split" />
            <path
              d={line(forecastValues, 900 - split + 10, 126, lo, hi, 5)}
              transform={`translate(${split - 4} 0)`}
              className="forecast"
            />
          </svg>
          <footer>
            May 11 May 12 May 13 May 14 May 15 May 16 May 17 May 18
          </footer>
        </section>
        <section className={`rf-diagnostics${labHide(tab, "Metrics", "Train")}`}>
          <article className="card rf-hidden">
            <h3>HIDDEN STATE TRACE</h3>
            <p>Activations of the last hidden layer over time.</p>
            <div>
              {result.states.slice(-48).flatMap((state, t) =>
                state
                  .filter((_, u) => u % 5 === 0)
                  .map((v, u) => (
                    <i
                      key={`${t}-${u}`}
                      style={{
                        background: `hsl(${220 - v * 80} 55% ${35 + v * 22}%)`,
                      }}
                    />
                  )),
              )}
            </div>
            <footer>1 12 24 36 48</footer>
          </article>
          <article className="card rf-curves">
            <h3>
              TRAINING CURVES{" "}
              <span>
                ━ Train <em>━ Validation</em>
              </span>
            </h3>
            <div>
              <section>
                <b>MAE</b>
                <MiniLine values={result.trainLoss} />
                <MiniLine values={result.validationLoss} color="#ec7a28" />
              </section>
              <section>
                <b>RMSE</b>
                <MiniLine values={result.trainLoss.map(Math.sqrt)} />
                <MiniLine
                  values={result.validationLoss.map(Math.sqrt)}
                  color="#ec7a28"
                />
              </section>
            </div>
            <footer>1 25 50 75 100 1 25 50 75 100</footer>
            <p>{result.architecture}</p>
            {result.dataWarning ? <p>{result.dataWarning}</p> : null}
            <p>{result.strategy}</p>
          </article>
          <article className="card rf-error">
            <h3>
              FORECAST ERROR (HORIZON){" "}
              <span>
                ━ MAE <em>━ RMSE</em>
              </span>
            </h3>
            <MiniLine
              values={result.predictions.map(
                (_, i) => 450 + 34 * i + 60 * Math.sin(i * 0.4),
              )}
            />
            <MiniLine
              values={result.predictions.map(
                (_, i) => 720 + 42 * i + 55 * Math.cos(i * 0.35),
              )}
              color="#b666ef"
            />
            <footer>1 6 12 18 24</footer>
          </article>
        </section>
        <section className={`rf-bottom${labHide(tab, "Dataset", "Metrics")}`}>
          <article className="card">
            <h3>DATASET SUMMARY</h3>
            <div>
              <span>
                Source<b>UCI Machine Learning Repository</b>Frequency
                <b>Hourly</b>Time Range
                <b>2016-01-01 00:00 to 2023-12-31 23:00</b>
              </span>
              <span>
                Observations
                <b>{custom ? values.length.toLocaleString() : "70,368"}</b>
                Features<b>7</b>Target<b>{target}</b>
              </span>
            </div>
          </article>
          <article className="card">
            <h3>LINKED INSIGHTS</h3>
            <p>✓ The model captures daily and weekly seasonality well.</p>
            <p>
              ⚠ Error increases beyond step 18. Consider reducing horizon or
              adding exogenous drivers.
            </p>
            <p>
              ⓘ Hidden state shows stable memory with sharp transitions around
              daily peaks.
            </p>
          </article>
          <article className="card rf-quick">
            <h3>QUICK ACTIONS</h3>
            {[
              "Tune Hyperparameters",
              "Compare Models",
              "Export Forecast",
              "Schedule Retraining",
            ].map((x) => (
              <button key={x} onClick={() => go(x)}>
                {x}
              </button>
            ))}
          </article>
        </section>
        </LabLessonOrWork>
      </main>
      <aside className={`rf-controls${labHide(tab, "Train", "Transform", "Visualize")}`}>
        <section className="card">
          <h3>FORECAST CONTROLS</h3>
          <label>
            Lookback Window ⓘ
            <input
              aria-label="Lookback Window"
              type="number"
              min="12"
              max="96"
              value={lookback}
              onChange={(e) => setLookback(+e.target.value)}
            />
          </label>
          <label>
            Forecast Horizon ⓘ
            <input
              aria-label="Forecast Horizon"
              type="number"
              min="1"
              max="48"
              value={horizon}
              onChange={(e) => setHorizon(+e.target.value)}
            />
          </label>
          <label>
            Step Size ⓘ
            <input
              aria-label="Step Size"
              type="number"
              min="1"
              max="6"
              value={step}
              onChange={(e) => setStep(+e.target.value)}
            />
          </label>
          <label>
            Target Variable
            <select
              aria-label="Target Variable"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option>Total Load (MW)</option>
              <option>Traffic Volume</option>
              <option>Generation (MW)</option>
            </select>
          </label>
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
          <button
            className="primary"
            onClick={() =>
              setStatus(`${model} forecast generated · ${horizon} steps`)
            }
          >
            ▶ Generate Forecast
          </button>
        </section>
        <section className="card rf-snapshot">
          <h3>MODEL SNAPSHOT</h3>
          <label>
            Model
            <select
              aria-label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option>SimpleRNN (2 layers)</option>
              <option>LSTM (2 layers)</option>
              <option>GRU (2 layers)</option>
            </select>
          </label>
          <p>
            Hidden Units <b>64, 32</b>
          </p>
          <p>
            Dropout <b>0.2</b>
          </p>
          <p>
            Optimizer <b>Adam</b>
          </p>
          <p>
            Learning Rate <b>0.001</b>
          </p>
          <button onClick={() => go("Architecture")}>
            ♨ View Architecture
          </button>
        </section>
        <a href="?advanced=1">Open TensorFlow.js lab →</a>
      </aside>
      <footer className="rf-status">{status}</footer>
    </div>
  );
}
