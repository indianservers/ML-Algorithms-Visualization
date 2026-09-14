import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Moon, Play, RotateCcw, Share2, Upload } from "lucide-react";
import TensorFlowDeepLearningLab from "../shared/TensorFlowDeepLearningLab";
import {
  runLSTM,
  type LSTMCandidateActivation,
  type LSTMGateActivation,
  type LSTMOverrides,
} from "../../../lib/algorithms/neural/lstm";
import "./LSTMPage.css";

const samples = [
  {
    name: "Synth. Sequence (Sine)",
    values: [0.23, -0.11, 0.42, -0.14, 0.08, 0.31, -0.27, 0.19, 0.05],
  },
  {
    name: "Temperature Cycle",
    values: [0.12, 0.28, 0.55, 0.81, 0.63, 0.24, -0.13, -0.38, -0.2],
  },
  {
    name: "Demand Pulse",
    values: [0.05, 0.08, 0.12, 0.72, 0.91, 0.48, 0.19, 0.11, 0.07],
  },
];

const clamp = (value: number, candidate = false) =>
  Math.max(candidate ? -1 : 0, Math.min(1, value));

export default function LSTMPage() {
  const [advanced, setAdvanced] = useState(false),
    [dataset, setDataset] = useState(samples[0]),
    [step, setStep] = useState(3),
    [playing, setPlaying] = useState(false),
    [autoAdvance, setAutoAdvance] = useState(false),
    [speed, setSpeed] = useState(1),
    [units, setUnits] = useState(16),
    [gateActivation, setGateActivation] =
      useState<LSTMGateActivation>("sigmoid"),
    [candidateActivation, setCandidateActivation] =
      useState<LSTMCandidateActivation>("tanh"),
    [peepholes, setPeepholes] = useState(true),
    [layers, setLayers] = useState(1),
    [recurrentDropout, setRecurrentDropout] = useState(0.1),
    [inputDropout, setInputDropout] = useState(0.1),
    [overrides, setOverrides] = useState<LSTMOverrides>({}),
    [toast, setToast] = useState("System status: all systems operational");
  const result = useMemo(
      () =>
        runLSTM(
          dataset.values,
          gateActivation,
          candidateActivation,
          peepholes,
          recurrentDropout,
          inputDropout,
          overrides,
          units,
          layers,
        ),
      [
        dataset,
        gateActivation,
        candidateActivation,
        peepholes,
        recurrentDropout,
        inputDropout,
        overrides,
        units,
        layers,
      ],
    ),
    active = result[step],
    previous = result[step - 1],
    maxStep = result.length - 1;

  useEffect(() => {
    if (!playing && !autoAdvance) return;
    const timer = window.setInterval(
      () => setStep((value) => (value >= maxStep ? 0 : value + 1)),
      900 / speed,
    );
    return () => window.clearInterval(timer);
  }, [playing, autoAdvance, speed, maxStep]);

  const setGate = (
    key: "forget" | "write" | "candidate" | "output",
    value: number,
  ) =>
    setOverrides((current) => ({
      ...current,
      [step]: { ...current[step], [key]: clamp(value, key === "candidate") },
    }));
  const resetGates = () =>
    setOverrides((current) => {
      const next = { ...current };
      delete next[step];
      return next;
    });
  const resetAll = () => {
    setDataset(samples[0]);
    setStep(3);
    setPlaying(false);
    setAutoAdvance(false);
    setSpeed(1);
    setUnits(16);
    setGateActivation("sigmoid");
    setCandidateActivation("tanh");
    setPeepholes(true);
    setLayers(1);
    setRecurrentDropout(0.1);
    setInputDropout(0.1);
    setOverrides({});
    setToast("LSTM simulation reset");
  };
  const switchDataset = () => {
    const index =
      (samples.findIndex((sample) => sample.name === dataset.name) + 1) %
      samples.length;
    setDataset(samples[index]);
    setOverrides({});
    setStep(3);
    setToast(`${samples[index].name} loaded`);
  };
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        let values: number[];
        try {
          const parsed = JSON.parse(text);
          values = (Array.isArray(parsed) ? parsed : parsed.values).map(Number);
        } catch {
          values = text
            .split(/[\s,]+/)
            .filter(Boolean)
            .map(Number);
        }
        values = values.filter(Number.isFinite).slice(0, 20);
        if (values.length < 4) {
          setToast("Sequence needs at least four numeric values");
          return;
        }
        setDataset({ name: file.name, values });
        setOverrides({});
        setStep(Math.min(3, values.length - 1));
        setToast(`${file.name}: ${values.length} values loaded`);
      })
      .catch(() => setToast("Could not read sequence file"));
    event.target.value = "";
  };

  if (advanced)
    return (
      <div className="lstm-advanced">
        <button onClick={() => setAdvanced(false)}>
          ← Return to LSTM Cell
        </button>
        <TensorFlowDeepLearningLab mode="lstm" />
      </div>
    );
  const gates = [
    {
      key: "forget" as const,
      label: "Forget Gate",
      symbol: "fₜ",
      color: "#42cb72",
    },
    {
      key: "write" as const,
      label: "Input Gate",
      symbol: "iₜ",
      color: "#ffad20",
    },
    {
      key: "candidate" as const,
      label: "Candidate",
      symbol: "c̃ₜ",
      color: "#ffd34e",
    },
    {
      key: "output" as const,
      label: "Output Gate",
      symbol: "oₜ",
      color: "#ff6574",
    },
  ];
  return (
    <div className="lstm-page">
      <aside className="lstm-side">
        <Link to="/">
          ▣ <b>Mega ML</b>
          <small>AI OBSERVATORY</small>
        </Link>
        {[
          "⌂ Home",
          "⌕ Discover",
          "▣ Learn",
          "▤ Datasets",
          "♧ Models",
          "⚗ Experiments",
          "◇ Deploy",
          "▥ Reports",
          "⌘ Playground",
        ].map((item) => (
          <button
            className={item.includes("Learn") ? "active" : ""}
            onClick={() => setToast(item)}
            key={item}
          >
            {item}
          </button>
        ))}
        <div className="lstm-system">
          <i /> System Status<small>All Systems Operational</small>
        </div>
        <button>◉ &nbsp; v2.4.1</button>
        <button>▣ &nbsp; Feedback</button>
      </aside>
      <header className="lstm-head">
        <h1>
          LSTM{" "}
          <small>Long Short-Term Memory networks for sequence modeling.</small>
        </h1>
        <nav>
          <button onClick={() => setToast("Documentation opened")}>
            <BookOpen /> Docs
          </button>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
          <button onClick={() => setToast("Theme toggled")}>
            <Moon />
          </button>
          <b>M</b>
        </nav>
      </header>
      <div className="lstm-tabs">
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
      </div>
      <main>
        <section className="lstm-cell panel">
          <header>
            <div>
              <h2>Interactive LSTM Cell</h2>
              <p>
                Adjust gate values and explore how information flows through an
                LSTM cell.
              </p>
            </div>
            <span>Time step (t) ⓘ</span>
            <button onClick={() => setStep(0)}>«</button>
            <button onClick={() => setStep(Math.max(0, step - 1))}>‹</button>
            <b>
              {step + 1} / {result.length}
            </b>
            <button onClick={() => setStep(Math.min(maxStep, step + 1))}>
              ›
            </button>
            <button onClick={() => setStep(maxStep)}>»</button>
            <label>
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
              />{" "}
              Auto-advance
            </label>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value="0.5">0.5x</option>
              <option value="1">1.0x</option>
              <option value="2">2.0x</option>
            </select>
          </header>
          <div className="cell-diagram">
            <div className="signal previous-cell">
              Cₜ₋₁<small>{previous?.cell.toFixed(2) ?? "0.00"}</small>
            </div>
            <div className="cell-shell">
              <div className="memory-line" />
              <div className="op mult">×</div>
              <div className="op plus">+</div>
              <div className="gate-nodes">
                {gates.map((gate) => (
                  <div style={{ borderColor: gate.color }} key={gate.key}>
                    <small>{gate.label}</small>
                    <i>{gate.symbol}</i>
                    <b>{active[gate.key].toFixed(2)}</b>
                  </div>
                ))}
              </div>
              <div className="activation-row">
                <span>σ</span>
                <span>σ</span>
                <span>tanh</span>
                <span>σ</span>
              </div>
              <div className="flow-lines">
                input + hidden state feed every gate · gates write and reveal
                memory
              </div>
            </div>
            <div className="signal current-cell">
              Cₜ<small>{active.cell.toFixed(2)}</small>
            </div>
            <div className="signal previous-hidden">
              hₜ₋₁<small>{previous?.hidden.toFixed(2) ?? "0.00"}</small>
            </div>
            <div className="signal current-hidden">
              hₜ<small>{active.hidden.toFixed(2)}</small>
            </div>
            <div className="signal current-input">
              xₜ<small>{active.input.toFixed(2)}</small>
            </div>
          </div>
          <div className="cell-legend">
            <span className="cyan">━ Cell State Flow</span>
            <span className="purple">━ Hidden State Flow</span>
            {gates.map((gate) => (
              <span key={gate.key}>□ {gate.label}</span>
            ))}
            <span>⊗ Multiply</span>
            <span>⊕ Add</span>
          </div>
        </section>
        <section className="lstm-timeline panel">
          <h2>Sequence Memory Timeline</h2>
          <p>
            See how cell state (memory) and hidden state evolve across the
            sequence.
          </p>
          <div
            className="timeline-grid"
            style={{
              gridTemplateColumns: `130px repeat(${result.length}, minmax(55px, 1fr))`,
            }}
          >
            <b>t</b>
            {result.map((_, i) => (
              <button
                className={i === step ? "active" : ""}
                onClick={() => setStep(i)}
                key={i}
              >
                {i}
              </button>
            ))}
            <b>xₜ (input)</b>
            {result.map((value, i) => (
              <span key={i}>{value.input.toFixed(2)}</span>
            ))}
            <b>Cₜ (cell state)</b>
            {result.map((value, i) => (
              <span className="cyan" key={i}>
                {value.cell.toFixed(2)}
              </span>
            ))}
            <b>hₜ (hidden state)</b>
            {result.map((value, i) => (
              <span className="purple" key={i}>
                {value.hidden.toFixed(2)}
              </span>
            ))}
          </div>
        </section>
        <section className="gate-editor panel">
          <header>
            <h2>
              Gate Values at t = {step} <small>(editable)</small>
            </h2>
            <p>Modify gate activations and see immediate effect on state.</p>
          </header>
          <div>
            {gates.map((gate) => (
              <label style={{ borderColor: gate.color }} key={gate.key}>
                <span>
                  {gate.label} <i>{gate.symbol}</i>
                </span>
                <strong>{active[gate.key].toFixed(2)}</strong>
                <button
                  onClick={() => setGate(gate.key, active[gate.key] - 0.05)}
                >
                  −
                </button>
                <button
                  onClick={() => setGate(gate.key, active[gate.key] + 0.05)}
                >
                  +
                </button>
                <input
                  aria-label={`${gate.label} value`}
                  type="range"
                  min={gate.key === "candidate" ? -1 : 0}
                  max="1"
                  step="0.01"
                  value={active[gate.key]}
                  onInput={(e) =>
                    setGate(gate.key, Number(e.currentTarget.value))
                  }
                />
              </label>
            ))}
          </div>
          <aside>
            <h3>Current Computation</h3>
            <p>
              Cₜ = <em>{active.forget.toFixed(2)}</em> ⊙{" "}
              {previous?.cell.toFixed(2) ?? "0.00"} +{" "}
              <em>{active.write.toFixed(2)}</em> ⊙ {active.candidate.toFixed(2)}
            </p>
            <p>
              hₜ = <em>{active.output.toFixed(2)}</em> ⊙ tanh(
              {active.cell.toFixed(2)})
            </p>
            <button onClick={resetGates}>
              <RotateCcw /> Reset to Default
            </button>
          </aside>
        </section>
        <section className="lstm-glance panel">
          <h2>At a Glance (t = {step})</h2>
          {[
            {
              label: "Cell State Cₜ",
              value: active.cell.toFixed(2),
              sub: `${(active.cell - (previous?.cell ?? 0)).toFixed(2)} vs t−1`,
            },
            {
              label: "Hidden State hₜ",
              value: active.hidden.toFixed(2),
              sub: `${(active.hidden - (previous?.hidden ?? 0)).toFixed(2)} vs t−1`,
            },
            {
              label: "Memory Retention",
              value: `${Math.round(active.forget * 100)}%`,
              sub: active.forget > 0.7 ? "High" : "Medium",
            },
            {
              label: "Information Written",
              value: `${Math.round(active.write * 100)}%`,
              sub: active.write > 0.6 ? "High" : "Medium",
            },
            {
              label: "Information Output",
              value: `${Math.round(active.output * 100)}%`,
              sub: active.output > 0.6 ? "Medium-High" : "Medium",
            },
          ].map((card) => (
            <div key={card.label}>
              <small>{card.label}</small>
              <b>{card.value}</b>
              <span>{card.sub}</span>
            </div>
          ))}
        </section>
        <section className="lstm-next panel">
          <h2>Next Steps</h2>
          <p>● Adjust gates and observe state changes.</p>
          <p>● Try different time steps or datasets.</p>
          <button onClick={() => setAdvanced(true)}>
            Go to Build / Train →
          </button>
        </section>
      </main>
      <aside className="lstm-controls">
        <section className="panel">
          <header>
            <h2>Parameters Inspector ⓘ</h2>
            <button onClick={resetAll}>Reset All</button>
          </header>
          <label>
            Units (hidden size)
            <span>
              <button onClick={() => setUnits(Math.max(4, units - 4))}>
                −
              </button>
              <input aria-label="Units hidden size" value={units} readOnly />
              <button onClick={() => setUnits(Math.min(64, units + 4))}>
                +
              </button>
            </span>
          </label>
          <label>
            Activation (gates)
            <select
              value={gateActivation}
              onChange={(e) =>
                setGateActivation(e.target.value as LSTMGateActivation)
              }
            >
              <option value="sigmoid">Sigmoid</option>
              <option value="hard-sigmoid">Hard Sigmoid</option>
            </select>
          </label>
          <label>
            Activation (candidate)
            <select
              value={candidateActivation}
              onChange={(e) =>
                setCandidateActivation(
                  e.target.value as LSTMCandidateActivation,
                )
              }
            >
              <option value="tanh">tanh</option>
              <option value="relu">ReLU</option>
            </select>
          </label>
          <label className="check">
            Peephole Connections
            <input
              type="checkbox"
              checked={peepholes}
              onChange={(e) => setPeepholes(e.target.checked)}
            />
          </label>
          <label>
            Layer
            <select
              value={layers}
              onChange={(e) => setLayers(Number(e.target.value))}
            >
              <option value="1">1 Layer</option>
              <option value="2">2 Layers</option>
              <option value="3">3 Layers</option>
            </select>
          </label>
          <label>
            Dropout (recurrent) <b>{recurrentDropout.toFixed(2)}</b>
            <input
              aria-label="Recurrent dropout"
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={recurrentDropout}
              onInput={(e) =>
                setRecurrentDropout(Number(e.currentTarget.value))
              }
            />
          </label>
          <label>
            Dropout (input) <b>{inputDropout.toFixed(2)}</b>
            <input
              aria-label="Input dropout"
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={inputDropout}
              onInput={(e) => setInputDropout(Number(e.currentTarget.value))}
            />
          </label>
          <button onClick={() => setToast("Advanced options toggled")}>
            › Advanced Options
          </button>
        </section>
        <section className="panel dataset">
          <header>
            <h2>Dataset</h2>
            <button onClick={switchDataset}>Switch</button>
          </header>
          <p>
            Sample: <b>{dataset.name}</b>
          </p>
          <small>Noisy sequence for memory prediction.</small>
          <dl>
            <div>
              <dt>Sequences</dt>
              <dd>1,000</dd>
            </div>
            <div>
              <dt>Seq. Length</dt>
              <dd>{dataset.values.length}</dd>
            </div>
            <div>
              <dt>Features</dt>
              <dd>1</dd>
            </div>
          </dl>
          <svg viewBox="0 0 280 55">
            <polyline
              points={dataset.values
                .map(
                  (value, index) =>
                    `${10 + index * (260 / Math.max(1, dataset.values.length - 1))},${29 - value * 25}`,
                )
                .join(" ")}
            />
          </svg>
          <div>
            <button onClick={() => setToast(dataset.values.join(", "))}>
              ◉ Preview
            </button>
            <label>
              <Upload /> Upload / Import
              <input type="file" accept=".csv,.txt,.json" onChange={upload} />
            </label>
          </div>
        </section>
        <section className="panel legend">
          <h3>Legend</h3>
          <p>Cₜ — Cell state (long-term memory)</p>
          <p>hₜ — Hidden state (short-term output)</p>
          <p>fₜ — Forget gate — what to forget</p>
          <p>iₜ — Input gate — what to write</p>
          <p>c̃ₜ — Candidate — new content</p>
          <p>oₜ — Output gate — what to output</p>
        </section>
      </aside>
      <footer>
        {toast}
        <button onClick={() => setPlaying(!playing)}>
          <Play /> {playing ? "Pause" : "Play sequence"}
        </button>
      </footer>
    </div>
  );
}
