import { useEffect, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Download, Moon, Play, RotateCcw, Save, Settings } from "lucide-react";
import TensorFlowDeepLearningLab from "../shared/TensorFlowDeepLearningLab";
import {
  runGRU,
  type GRUActivation,
  type GRUPrecision,
} from "../../../lib/algorithms/neural/gru";
import "./GRUPage.css";

const datasets = [
  {
    name: "Sentiment (Text)",
    rows: [
      "The stock market rallied today on strong earnings",
      "Earnings beat expectations again",
      "Inflation fears weigh on markets",
      "Company outlook remains strong",
      "Investors remain cautious today",
    ],
    labels: ["POS", "POS", "NEG", "POS", "NEG"],
  },
  {
    name: "News Headlines",
    rows: [
      "Markets climb after strong report",
      "Demand slows across the region",
      "New product wins broad praise",
      "Costs pressure quarterly profit",
      "Analysts raise growth forecasts",
    ],
    labels: ["POS", "NEG", "POS", "NEG", "POS"],
  },
  {
    name: "Product Reviews",
    rows: [
      "Battery life exceeded expectations",
      "The screen failed after a week",
      "Fast delivery and solid quality",
      "Support never answered my call",
      "Setup was simple and quick",
    ],
    labels: ["POS", "NEG", "POS", "NEG", "POS"],
  },
];

export default function GRUPage() {
  const [advanced, setAdvanced] = useState(false),
    [dataset, setDataset] = useState(datasets[0]),
    [source, setSource] = useState("Built-in"),
    [sequenceLength, setSequenceLength] = useState(8),
    [step, setStep] = useState(3),
    [playing, setPlaying] = useState(false),
    [autoPlay, setAutoPlay] = useState(false),
    [speed, setSpeed] = useState(1),
    [initialHidden, setInitialHidden] = useState(0),
    [gateBias, setGateBias] = useState(0),
    [weightScale, setWeightScale] = useState(1),
    [activation, setActivation] = useState<GRUActivation>("tanh"),
    [precision, setPrecision] = useState<GRUPrecision>("float32"),
    [detailed, setDetailed] = useState(false),
    [toast, setToast] = useState("Framework: TensorFlow.js · Device: GPU");
  const tokens = dataset.rows[0]
    .replace(/[^a-z\s]/gi, "")
    .split(/\s+/)
    .filter(Boolean);
  while (tokens.length < sequenceLength) tokens.push(...tokens);
  const visibleTokens = tokens.slice(0, sequenceLength),
    result = runGRU(
      visibleTokens,
      initialHidden,
      gateBias,
      weightScale,
      activation,
      precision,
    ),
    active = result[step],
    previous = result[step - 1],
    maxStep = result.length - 1;
  useEffect(() => {
    if (!playing && !autoPlay) return;
    const timer = window.setInterval(
      () => setStep((value) => (value >= maxStep ? 0 : value + 1)),
      700 / speed,
    );
    return () => clearInterval(timer);
  }, [playing, autoPlay, speed, maxStep]);
  const reset = () => {
    setDataset(datasets[0]);
    setSource("Built-in");
    setSequenceLength(8);
    setStep(3);
    setPlaying(false);
    setAutoPlay(false);
    setSpeed(1);
    setInitialHidden(0);
    setGateBias(0);
    setWeightScale(1);
    setActivation("tanh");
    setPrecision("float32");
    setDetailed(false);
    setToast("GRU visualizer reset");
  };
  const switchDataset = () => {
    const index =
      (datasets.findIndex((item) => item.name === dataset.name) + 1) %
      datasets.length;
    setDataset(datasets[index]);
    setSource("Built-in");
    setStep(0);
    setToast(`${datasets[index].name} loaded`);
  };
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        let rows: string[];
        try {
          const parsed = JSON.parse(text);
          rows = (Array.isArray(parsed) ? parsed : parsed.rows).map(String);
        } catch {
          rows = text.split(/\r?\n/).map((row) => row.split(",")[0]);
        }
        rows = rows.filter((row) => row.trim()).slice(0, 12);
        if (!rows.length) return setToast("No text rows found");
        setDataset({
          name: file.name,
          rows,
          labels: rows.map((_, index) => (index % 2 ? "NEG" : "POS")),
        });
        setSource("Imported");
        setStep(0);
        setToast(`${file.name}: ${rows.length} rows loaded`);
      })
      .catch(() => setToast("Could not read dataset"));
    event.target.value = "";
  };
  if (advanced)
    return (
      <div className="gru-advanced">
        <button onClick={() => setAdvanced(false)}>
          ← Return to GRU Visualizer
        </button>
        <TensorFlowDeepLearningLab mode="gru" />
      </div>
    );
  const retention = Math.round(active.update * 100),
    longGRU =
      result
        .slice(step)
        .reduce((sum, value) => sum + Math.abs(value.hidden), 0) /
      Math.max(1, result.length - step),
    longRNN =
      result
        .slice(step)
        .reduce((sum, value) => sum + Math.abs(value.simpleRNN), 0) /
      Math.max(1, result.length - step);
  return (
    <div className="gru-page">
      <aside className="gru-side">
        <Link to="/">
          ◆ <b>Mega ML</b>
          <small>AI Observatory</small>
        </Link>
        {[
          "⌂ Overview",
          "♧ Playground",
          "◇ Models",
          "▤ Datasets",
          "⚗ Experiments",
          "▣ Notebooks",
          "⌘ Deployments",
          "⌘ Algorithms",
          "⚙ Settings",
        ].map((item) => (
          <button
            className={item.includes("Overview") ? "active" : ""}
            onClick={() => setToast(item)}
            key={item}
          >
            {item}
          </button>
        ))}
        <p>
          ◉ <b>Mega ML</b>
          <small>Pro Plan ›</small>
        </p>
      </aside>
      <header className="gru-head">
        <h1>
          GRU <small>Gated Recurrent Unit</small>
          <em>Lesson</em>
        </h1>
        <p>
          Explore how GRU gates control the flow of information and update the
          hidden state across time.
        </p>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Build / Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((tab) => (
            <button
              className={tab === "Visualize" ? "active" : ""}
              onClick={() =>
                tab === "Build / Train"
                  ? setAdvanced(true)
                  : setToast(`${tab} selected`)
              }
              key={tab}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div>
          <button onClick={() => setToast("Theme toggled")}>
            <Moon />
          </button>
          <button onClick={() => setToast("Help opened")}>?</button>
          <button onClick={() => setToast("Settings opened")}>
            <Settings />
          </button>
        </div>
      </header>
      <main>
        <section className="gru-toolbar panel">
          <button onClick={reset}>
            <RotateCcw /> Reset
          </button>
          <button onClick={() => setStep(Math.min(maxStep, step + 1))}>
            <Play /> Step
          </button>
          <label>
            Auto Play{" "}
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={(e) => setAutoPlay(e.target.checked)}
            />
          </label>
          <label>
            Speed{" "}
            <input
              aria-label="Playback speed"
              type="range"
              min="0.5"
              max="2"
              step="0.5"
              value={speed}
              onInput={(e) => setSpeed(Number(e.currentTarget.value))}
            />{" "}
            {speed.toFixed(1)}x
          </label>
          <span>
            View{" "}
            <button
              className={!detailed ? "active" : ""}
              onClick={() => setDetailed(false)}
            >
              Compact
            </button>
            <button
              className={detailed ? "active" : ""}
              onClick={() => setDetailed(true)}
            >
              Detailed
            </button>
          </span>
        </section>
        <section className="gru-timeline panel">
          <h3>SEQUENCE TIMELINE</h3>
          <div>
            {visibleTokens.map((token, index) => (
              <button
                className={index === step ? "active" : ""}
                onClick={() => setStep(index)}
                key={`${token}-${index}`}
              >
                <small>t = {index + 1}</small>
                <b>{token}</b>
                <i>•</i>
              </button>
            ))}
          </div>
        </section>
        <section className={`gru-cell panel ${detailed ? "detailed" : ""}`}>
          <h3>GRU CELL AT t = {step + 1}</h3>
          <div className="gru-cell-flow">
            <div className="state">
              hₜ₋₁
              <b>{previous?.hidden.toFixed(2) ?? initialHidden.toFixed(2)}</b>
            </div>
            <div className="input">
              xₜ<b>{active.input.toFixed(2)}</b>
            </div>
            <div className="gate update">
              UPDATE GATE <i>zₜ</i>
              <b>{active.update.toFixed(2)}</b>
              <meter min="0" max="1" value={active.update} />
            </div>
            <div className="gate reset">
              RESET GATE <i>rₜ</i>
              <b>{active.reset.toFixed(2)}</b>
              <meter min="0" max="1" value={active.reset} />
            </div>
            <div className="candidate">
              h̃ₜ<b>{active.candidate.toFixed(2)}</b>
              <small>{activation}</small>
            </div>
            <div className="result-state">
              hₜ<b>{active.hidden.toFixed(2)}</b>
            </div>
            <p>
              zₜ = σ(Wz xₜ + Uz hₜ₋₁ + bz)
              <br />
              rₜ = σ(Wr xₜ + Ur hₜ₋₁ + br)
              <br />
              h̃ₜ = {activation}(Wh xₜ + Uh(rₜ ⊙ hₜ₋₁))
              <br />
              hₜ = (1 − zₜ) ⊙ hₜ₋₁ + zₜ ⊙ h̃ₜ
            </p>
          </div>
          <div className="gru-charts">
            <article>
              <h3>GATE ACTIVATIONS OVER TIME</h3>
              <div className="gate-bars">
                {result.map((value, index) => (
                  <span className={index === step ? "active" : ""} key={index}>
                    <i style={{ height: `${value.update * 72}px` }} />
                    <b style={{ height: `${value.reset * 72}px` }} />
                    <small>t={index + 1}</small>
                  </span>
                ))}
              </div>
            </article>
            <article>
              <h3>HIDDEN STATE (hₜ)</h3>
              <svg viewBox="0 0 520 105">
                <polyline
                  points={result
                    .map(
                      (value, index) =>
                        `${20 + index * (480 / Math.max(1, maxStep))},${50 - value.hidden * 42}`,
                    )
                    .join(" ")}
                />
                {result.map((value, index) => (
                  <circle
                    key={index}
                    cx={20 + index * (480 / Math.max(1, maxStep))}
                    cy={50 - value.hidden * 42}
                    r="4"
                  />
                ))}
              </svg>
            </article>
          </div>
        </section>
        <section className="gru-compare panel">
          <h3>COMPARE WITH SIMPLE RNN ⓘ</h3>
          <div>
            <h3>CURRENT STEP (t = {step + 1})</h3>
            <table>
              <tbody>
                <tr>
                  <th>Model</th>
                  <th>Hidden State</th>
                  <th>Retention</th>
                  <th>Gradient Flow</th>
                </tr>
                <tr>
                  <td>GRU</td>
                  <td>{active.hidden.toFixed(2)}</td>
                  <td>{retention}%</td>
                  <td>● Stable</td>
                </tr>
                <tr>
                  <td>Simple RNN</td>
                  <td>{active.simpleRNN.toFixed(2)}</td>
                  <td>{Math.round(retention * 0.45)}%</td>
                  <td>● Weak</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3>HIDDEN STATE TRAJECTORY</h3>
            <svg viewBox="0 0 340 100">
              <polyline
                className="gru-line"
                points={result
                  .map((v, i) => `${15 + i * 43},${48 - v.hidden * 35}`)
                  .join(" ")}
              />
              <polyline
                className="rnn-line"
                points={result
                  .map((v, i) => `${15 + i * 43},${48 - v.simpleRNN * 35}`)
                  .join(" ")}
              />
            </svg>
          </div>
          <div>
            <h3>LONG-TERM RETENTION</h3>
            <label>
              GRU <meter min="0" max="1" value={longGRU} />
              {longGRU.toFixed(2)}
            </label>
            <label>
              Simple RNN <meter min="0" max="1" value={longRNN} />
              {longRNN.toFixed(2)}
            </label>
          </div>
        </section>
      </main>
      <aside className="gru-controls">
        <section className="panel">
          <header>
            <h2>PARAMETER INSPECTOR</h2>
            <button onClick={() => setToast("Preset selected")}>
              Presets⌄
            </button>
          </header>
          <label>
            Initial Hidden State (h₀)
            <input
              aria-label="Initial hidden state"
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={initialHidden}
              onInput={(e) => setInitialHidden(Number(e.currentTarget.value))}
            />
            <b>{initialHidden.toFixed(2)}</b>
          </label>
          <label>
            Gate Bias (bz, br)
            <input
              aria-label="Gate bias"
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={gateBias}
              onInput={(e) => setGateBias(Number(e.currentTarget.value))}
            />
            <b>{gateBias.toFixed(2)}</b>
          </label>
          <label>
            Weight Scale (All W, U)
            <input
              aria-label="Weight scale"
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={weightScale}
              onInput={(e) => setWeightScale(Number(e.currentTarget.value))}
            />
            <b>{weightScale.toFixed(2)}</b>
          </label>
          <label>
            Activation
            <select
              value={activation}
              onChange={(e) => setActivation(e.target.value as GRUActivation)}
            >
              <option value="tanh">tanh</option>
              <option value="relu">ReLU</option>
              <option value="sigmoid">Sigmoid</option>
            </select>
          </label>
          <label>
            Numeric Precision
            <select
              value={precision}
              onChange={(e) => setPrecision(e.target.value as GRUPrecision)}
            >
              <option value="float32">float32</option>
              <option value="float16">float16</option>
            </select>
          </label>
          <button onClick={() => setToast("Advanced settings expanded")}>
            ⌃ Advanced
          </button>
        </section>
        <section className="panel dataset">
          <header>
            <h2>DATASET</h2>
            <button onClick={() => setToast("Dataset help")}>?</button>
          </header>
          <p>
            Sample: <b>{dataset.name}</b>
          </p>
          <label>
            Source
            <select
              value={source}
              onChange={(event) => {
                if (event.target.value === "Built-in") {
                  setSource("Built-in");
                  setDataset(datasets[0]);
                  setStep(0);
                } else {
                  setToast(
                    "Upload a CSV, JSON, or TXT file to use Imported data",
                  );
                }
              }}
            >
              <option>Built-in</option>
              <option>Imported</option>
            </select>
          </label>
          <label>
            Sequence Length
            <select
              value={sequenceLength}
              onChange={(e) => {
                setSequenceLength(Number(e.target.value));
                setStep(0);
              }}
            >
              {[4, 5, 6, 7, 8].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <h3>Preview</h3>
          {dataset.rows.slice(0, 5).map((row, index) => (
            <p className="preview" key={row}>
              <i>{index + 1}</i>
              {row}
              <b className={dataset.labels[index] === "POS" ? "pos" : "neg"}>
                {dataset.labels[index]}
              </b>
            </p>
          ))}
          <label className="upload">
            Upload Dataset <small>.csv, .json, .txt</small>
            <input type="file" accept=".csv,.json,.txt" onChange={upload} />
          </label>
          <button onClick={switchDataset}>⇄ Switch Dataset</button>
        </section>
      </aside>
      <footer>
        <span>{toast}</span>
        <button onClick={() => setToast("Results exported")}>
          <Download /> Export
        </button>
        <button onClick={() => setToast("Experiment saved")}>
          <Save /> Save Experiment
        </button>
      </footer>
    </div>
  );
}
