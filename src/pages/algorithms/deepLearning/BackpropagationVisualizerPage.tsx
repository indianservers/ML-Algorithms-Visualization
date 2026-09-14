import { useEffect, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Play, Save, Sun } from "lucide-react";
import {
  runBackpropagation,
  type BackpropActivation,
} from "../../../lib/algorithms/neural/backpropagation";
import "./BackpropagationVisualizerPage.css";

const samples = [
  { input: [0.7, -1.2, 0.3], target: [0.5, -0.2] },
  { input: [-1, 0.8, 0.45], target: [-0.3, 0.7] },
  { input: [0.2, 0.9, -0.6], target: [0.8, 0.1] },
  { input: [-0.4, -0.2, 1.1], target: [-0.5, 0.4] },
  { input: [0.9, 0.1, -0.8], target: [0.2, 0.6] },
  { input: [-0.7, 1.2, 0.2], target: [0.6, -0.4] },
  { input: [0.35, -0.5, 0.95], target: [0.1, 0.9] },
  { input: [1, -0.3, -0.4], target: [-0.2, 0.3] },
];
const phases = [
  "Forward: inputs",
  "Compute hidden pre-activations",
  "Apply hidden activation",
  "Compute outputs",
  "Update W₂ (output layer weights)",
  "Compute output deltas",
  "Backpropagate hidden deltas",
  "Compute W₁ gradients",
  "Update W₁ weights",
  "Recompute output",
  "Measure new loss",
  "Step complete",
];

export default function BackpropagationVisualizerPage() {
  const [data, setData] = useState(samples),
    [sample, setSample] = useState(3),
    [step, setStep] = useState(3),
    [activation, setActivation] = useState<BackpropActivation>("relu"),
    [learningRate, setLearningRate] = useState(0.1),
    [speed, setSpeed] = useState(1),
    [playing, setPlaying] = useState(false),
    [auto, setAuto] = useState(false),
    [inspector, setInspector] = useState("Parameters"),
    [toast, setToast] = useState("Ready");
  const active = data[Math.min(sample, data.length - 1)],
    result = runBackpropagation(
      active.input,
      active.target,
      activation,
      learningRate,
    ),
    selectedGradient = result.gradient2[1][0],
    updated = result.updated2[1][0];
  useEffect(() => {
    if (!playing && !auto) return;
    const timer = setInterval(
      () => setStep((value) => (value >= 11 ? 0 : value + 1)),
      700 / speed,
    );
    return () => clearInterval(timer);
  }, [playing, auto, speed]);
  const reset = () => {
    setData(samples);
    setSample(3);
    setStep(3);
    setActivation("relu");
    setLearningRate(0.1);
    setSpeed(1);
    setPlaying(false);
    setAuto(false);
    setInspector("Parameters");
    setToast("Session reset");
  };
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        const rows = text
          .split(/\r?\n/)
          .map((line) => line.split(",").map(Number))
          .filter((row) => row.length >= 5 && row.every(Number.isFinite))
          .slice(0, 20);
        if (!rows.length) return setToast("CSV needs x1,x2,x3,y1,y2");
        setData(
          rows.map((row) => ({
            input: row.slice(0, 3),
            target: row.slice(3, 5),
          })),
        );
        setSample(0);
        setToast(`${file.name}: ${rows.length} samples loaded`);
      })
      .catch(() => setToast("Could not read CSV"));
    event.target.value = "";
  };
  return (
    <div className="backprop-page">
      <aside className="bp-side">
        <Link to="/">
          〽 <b>Mega ML</b>
          <small>AI OBSERVATORY</small>
        </Link>
        <button>ⓘ Overview</button>
        <h4>CORE</h4>
        {[
          "♧ Live Visualizer",
          "◉ Neurons",
          "⌘ Connections",
          "◇ Gradients",
          "⊙ Chain Rule",
        ].map((item) => (
          <button
            className={item.includes("Live") ? "active" : ""}
            onClick={() => setToast(item)}
            key={item}
          >
            {item}
          </button>
        ))}
        <h4>LEARN</h4>
        <button>▣ Lesson</button>
        <button>⌘ Key Equations</button>
        <h4>SETTINGS</h4>
        <button>⚙ Preferences</button>
        <button>◐ Theme</button>
        <p>
          ▣ <b>Mini Cheatsheet</b>
          <small>Backprop Essentials ›</small>
        </p>
      </aside>
      <header className="bp-head">
        <Link to="/">
          〽 <b>Mega ML</b>
          <small>AI OBSERVATORY</small>
        </Link>
        <nav>
          {[
            "▣ Learn",
            "▦ Visualize",
            "▤ Dataset",
            "◉ Build / Train",
            "▥ Metrics",
            "⌘ Compare",
            "? Explain",
          ].map((item) => (
            <button
              className={item.includes("Visualize") ? "active" : ""}
              onClick={() => setToast(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </nav>
        <div>
          <button onClick={() => setToast("Help opened")}>
            <HelpCircle />
          </button>
          <button onClick={() => setToast("Theme toggled")}>
            <Sun />
          </button>
          <button onClick={() => setToast("Session saved")}>
            <Save /> Save Session
          </button>
        </div>
      </header>
      <main>
        <section className="bp-title">
          <h1>
            Backpropagation Visualizer <small>Interactive</small>
          </h1>
          <p>
            See activations flow forward and gradients flow backward through the
            network. Understand the chain rule in action.
          </p>
          <div>
            <label>
              Architecture
              <select>
                <option>3 → 4 → 2</option>
              </select>
            </label>
            <label>
              Activation
              <select
                value={activation}
                onChange={(e) =>
                  setActivation(e.target.value as BackpropActivation)
                }
              >
                <option value="relu">ReLU</option>
                <option value="tanh">tanh</option>
                <option value="sigmoid">Sigmoid</option>
              </select>
            </label>
            <label>
              Loss
              <select>
                <option>MSE</option>
              </select>
            </label>
            <label>
              Mode
              <button
                className={!auto ? "active" : ""}
                onClick={() => setAuto(false)}
              >
                Single Step
              </button>
              <button
                className={auto ? "active" : ""}
                onClick={() => setAuto(true)}
              >
                Auto Play
              </button>
            </label>
          </div>
        </section>
        <section className="bp-step panel">
          <div>
            <h2>Step {step + 1} / 12</h2>
            <p>{phases[step]}</p>
          </div>
          <button onClick={() => setStep(0)}>Ⅰ‹</button>
          <button onClick={() => setStep(Math.max(0, step - 1))}>←</button>
          <button className="play" onClick={() => setPlaying(!playing)}>
            <Play />
          </button>
          <button onClick={() => setStep(Math.min(11, step + 1))}>→</button>
          <button onClick={() => setStep(11)}>›Ⅰ</button>
          <label>
            Speed
            <input
              aria-label="Playback speed"
              type="range"
              min=".5"
              max="2"
              step=".5"
              value={speed}
              onInput={(e) => setSpeed(Number(e.currentTarget.value))}
            />
            {speed}x
          </label>
        </section>
        <section className="bp-network panel">
          <p>
            Legend: <span>→ Forward Activation</span> —
            <i>⇢ Backward Gradient</i> — Weight — Gradient Magnitude
          </p>
          <div className="network">
            <div>
              <h3>Inputs — a⁰</h3>
              {result.input.map((value, i) => (
                <b className="input" key={i}>
                  x{i + 1}
                  <em>{value.toFixed(2)}</em>
                </b>
              ))}
            </div>
            <svg viewBox="0 0 650 300">
              {result.weights1.flatMap((row, i) =>
                row.map((weight, j) => (
                  <line
                    className="weight"
                    x1="20"
                    y1={50 + i * 80}
                    x2="310"
                    y2={30 + j * 65}
                    strokeWidth={0.5 + Math.abs(weight) * 2}
                    key={`a${i}${j}`}
                  />
                )),
              )}
              {result.weights2.flatMap((row, i) =>
                row.map((weight, j) => (
                  <line
                    className={step >= 4 ? "gradient" : "weight"}
                    x1="330"
                    y1={30 + i * 65}
                    x2="630"
                    y2={90 + j * 110}
                    strokeWidth={0.5 + Math.abs(weight) * 2}
                    key={`b${i}${j}`}
                  />
                )),
              )}
            </svg>
            <div>
              <h3>Hidden Layer (4) — a¹</h3>
              {result.hidden.map((value, i) => (
                <b className="hidden" key={i}>
                  h{i + 1}
                  <em>{value.toFixed(2)}</em>
                </b>
              ))}
            </div>
            <div>
              <h3>Output Layer (2) — a²</h3>
              {result.output.map((value, i) => (
                <b className="output" key={i}>
                  o{i + 1}
                  <em>{value.toFixed(2)}</em>
                </b>
              ))}
            </div>
            <div>
              <h3>Targets — y</h3>
              {result.target.map((value, i) => (
                <b className="target" key={i}>
                  {value.toFixed(2)}
                </b>
              ))}
            </div>
          </div>
          <footer>
            <span>Forward Pass →</span>
            <i>← Backward Pass</i>
          </footer>
        </section>
        <section className="bp-lower">
          <article className="panel">
            <h3>Gradient Magnitudes</h3>
            <div className="grad-matrix">
              {result.gradient1.flat().map((value, i) => (
                <span
                  style={{
                    opacity: 0.25 + Math.min(0.75, Math.abs(value) * 5),
                  }}
                  key={i}
                >
                  {Math.abs(value).toFixed(3)}
                </span>
              ))}
            </div>
            <div className="grad-matrix two">
              {result.gradient2.flat().map((value, i) => (
                <span key={i}>{Math.abs(value).toFixed(3)}</span>
              ))}
            </div>
          </article>
          <article className="panel">
            <h3>Activations (Forward)</h3>
            <div className="bars">
              {[...result.input, ...result.hidden, ...result.output].map(
                (value, i) => (
                  <span key={i}>
                    <i
                      style={{
                        height: `${Math.min(75, Math.abs(value) * 55)}px`,
                      }}
                    />
                    {value.toFixed(2)}
                  </span>
                ),
              )}
            </div>
          </article>
          <article className="panel">
            <h3>Weight Updates (This Step)</h3>
            <table>
              <tbody>
                <tr>
                  <th>Layer</th>
                  <th>Matrix</th>
                  <th>Updated Weights</th>
                  <th>Δ</th>
                </tr>
                <tr>
                  <td>Hidden → Output</td>
                  <td>W²</td>
                  <td>
                    {
                      result.gradient2.flat().filter((v) => Math.abs(v) > 1e-9)
                        .length
                    }{" "}
                    / 8
                  </td>
                  <td>
                    ↑ {result.gradient2.flat().filter((v) => v < 0).length} ↓{" "}
                    {result.gradient2.flat().filter((v) => v > 0).length}
                  </td>
                </tr>
                <tr>
                  <td>Input → Hidden</td>
                  <td>W¹</td>
                  <td>
                    {
                      result.gradient1.flat().filter((v) => Math.abs(v) > 1e-9)
                        .length
                    }{" "}
                    / 12
                  </td>
                  <td>
                    ↑ {result.gradient1.flat().filter((v) => v < 0).length} ↓{" "}
                    {result.gradient1.flat().filter((v) => v > 0).length}
                  </td>
                </tr>
              </tbody>
            </table>
          </article>
        </section>
      </main>
      <aside className="bp-inspector">
        <section className="panel">
          <div className="inspector-tabs">
            <button
              className={inspector === "Parameters" ? "active" : ""}
              onClick={() => setInspector("Parameters")}
            >
              Parameters
            </button>
            <button
              className={inspector === "Details" ? "active" : ""}
              onClick={() => setInspector("Details")}
            >
              Details
            </button>
          </div>
          {inspector === "Parameters" ? (
            <>
              <label>
                Sample{" "}
                <button onClick={() => setSample(Math.max(0, sample - 1))}>
                  ‹
                </button>
                <b>
                  #{sample + 1} / {data.length}
                </b>
                <button
                  onClick={() =>
                    setSample(Math.min(data.length - 1, sample + 1))
                  }
                >
                  ›
                </button>
              </label>
              <p>
                Input — x = [{active.input.map((v) => v.toFixed(2)).join(", ")}]
              </p>
              <p>
                Target — y = [
                {active.target.map((v) => v.toFixed(2)).join(", ")}]
              </p>
              <h3>
                Loss (MSE) <b>{result.loss.toFixed(4)}</b>
              </h3>
              <h3>Chain Rule (Selected Weight)</h3>
              <div className="chain">
                ∂L/∂w²₁₁ = ∂L/∂a²₁ · ∂a²₁/∂z²₁ · ∂z²₁/∂w²₁₁
              </div>
              <p>
                {result.outputDelta[0].toFixed(4)} × 1.0000 ×
                {result.hidden[1].toFixed(3)} = {selectedGradient.toFixed(4)}
              </p>
              <p>
                Gradient <b>{selectedGradient.toFixed(4)}</b>
              </p>
              <p>
                Weight <b>{result.weights2[1][0].toFixed(4)}</b>
              </p>
              <p>
                Updated Weight <b>{updated.toFixed(4)}</b>
              </p>
              <label>
                Learning Rate (η)
                <input
                  aria-label="Learning rate"
                  type="range"
                  min=".01"
                  max=".5"
                  step=".01"
                  value={learningRate}
                  onInput={(e) =>
                    setLearningRate(Number(e.currentTarget.value))
                  }
                />
                <b>{learningRate.toFixed(2)}</b>
              </label>
            </>
          ) : (
            <div className="details">
              <h3>Hidden Deltas</h3>
              {result.hiddenDelta.map((v, i) => (
                <p key={i}>
                  δh{i + 1} = {v.toFixed(5)}
                </p>
              ))}
              <h3>Output Deltas</h3>
              {result.outputDelta.map((v, i) => (
                <p key={i}>
                  δo{i + 1} = {v.toFixed(5)}
                </p>
              ))}
            </div>
          )}
        </section>
        <section className="panel dataset">
          <h3>Dataset</h3>
          <b>XOR (Toy)</b>
          <p>
            Classic non-linear dataset.
            <br />
            Good for learning backprop.
          </p>
          <div className="xor">
            ● ●
            <br />
            <br />● ●
          </div>
          <div>
            <button
              onClick={() => {
                setData(samples);
                setSample((sample + 1) % samples.length);
                setToast("Dataset switched");
              }}
            >
              Switch Dataset
            </button>
            <label>
              Upload / Use CSV
              <input type="file" accept=".csv" onChange={upload} />
            </label>
          </div>
          <label>
            Samples
              <select
                value={data.length}
                aria-readonly="true"
                onChange={() => undefined}
              >
              <option>{data.length}</option>
            </select>
          </label>
        </section>
      </aside>
      <footer className="bp-status">
        {toast}
        <button onClick={reset}>Reset Session</button>
      </footer>
    </div>
  );
}
