import { lazy, Suspense, useEffect, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Play, RotateCcw, Share2, Upload } from "lucide-react";
import { LAB_TABS, LabLessonOrWork, useLabTabs } from "../../../components/common/LabTabs";
import {
  runRNN,
  type RNNActivation,
  type RNNWeightInit,
} from "../../../lib/algorithms/neural/rnn";
import "./RNNPage.css";

const TensorFlowDeepLearningLab = lazy(
  () => import("../shared/TensorFlowDeepLearningLab"),
);

const sequences = [
  ["<s>", "the", "cat", "sat", "on", "mat", "</s>"],
  ["<s>", "a", "dog", "barked", "very", "loudly", "</s>"],
  ["<s>", "rain", "falls", "over", "green", "hills", "</s>"],
];

export default function RNNPage() {
  const { tab, setTab } = useLabTabs("Visualize");
  const [advanced, setAdvanced] = useState(false),
    [sequence, setSequence] = useState(sequences[0]),
    [sequenceLength, setSequenceLength] = useState(6),
    [hiddenSize, setHiddenSize] = useState(4),
    [activation, setActivation] = useState<RNNActivation>("tanh"),
    [init, setInit] = useState<RNNWeightInit>("orthogonal"),
    [biasMode, setBiasMode] = useState("Zeros"),
    [delay, setDelay] = useState(700),
    [noise, setNoise] = useState(0),
    [showState, setShowState] = useState(true),
    [showWeights, setShowWeights] = useState(true),
    [showGradients, setShowGradients] = useState(true),
    [step, setStep] = useState(5),
    [playing, setPlaying] = useState(false),
    [toast, setToast] = useState("");
  const tokens = sequence.slice(0, Math.min(sequenceLength, sequence.length)),
    result = runRNN(
      tokens,
      hiddenSize,
      activation,
      init,
      biasMode === "Constant 0.1" ? 0.1 : 0,
      noise,
    ),
    maxStep = tokens.length - 1,
    visibleStep = Math.min(step, maxStep),
    finalState = result.states[result.states.length - 1],
    decay = tokens.map((_, lag) => {
      const earlier =
          result.states[Math.max(1, result.states.length - 1 - lag)],
        dot = earlier.reduce(
          (sum, value, index) => sum + value * finalState[index],
          0,
        ),
        denom = Math.hypot(...earlier) * Math.hypot(...finalState) || 1;
      return Math.min(1, Math.abs(dot / denom) * Math.pow(0.86, lag));
    });

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setStep((current) => (current >= maxStep ? 0 : current + 1)),
      delay,
    );
    return () => window.clearInterval(timer);
  }, [playing, delay, maxStep]);

  const reset = () => {
    setSequence(sequences[0]);
    setSequenceLength(6);
    setHiddenSize(4);
    setActivation("tanh");
    setInit("orthogonal");
    setBiasMode("Zeros");
    setDelay(700);
    setNoise(0);
    setShowState(true);
    setShowWeights(true);
    setShowGradients(true);
    setStep(5);
    setPlaying(false);
    setToast("RNN simulation reset");
  };
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        let values: string[];
        try {
          const parsed = JSON.parse(text);
          values = Array.isArray(parsed)
            ? parsed.map(String)
            : String(parsed.sequence ?? "").split(/\s+/);
        } catch {
          values = text.split(/[\s,]+/);
        }
        values = values.filter(Boolean).slice(0, 12);
        if (values.length < 3) {
          setToast("Sequence file needs at least three tokens");
          return;
        }
        setSequence(values);
        setSequenceLength(Math.min(8, values.length));
        setStep(0);
        setToast(`${file.name}: ${values.length} tokens loaded`);
      })
      .catch(() => setToast("Could not read the sequence file"));
    event.target.value = "";
  };

  if (advanced)
    return (
      <div className="rnn-advanced">
        <button onClick={() => setAdvanced(false)}>
          ← Return to RNN Visualizer
        </button>
        <Suspense fallback={<p>Loading TensorFlow.js lab…</p>}>
          <TensorFlowDeepLearningLab mode="rnn" />
        </Suspense>
      </div>
    );
  return (
    <div className="rnn-page">
      <aside className="rnn-side">
        <Link to="/">
          ✣ <b>Mega ML</b>
          <small>AI Observatory</small>
        </Link>
        {[
          "⌂ Home",
          "♧ Explore",
          "◇ Learn",
          "▤ Datasets",
          "⌘ Models",
          "▦ Workspaces",
          "⚗ Experiments",
          "➤ Deployments",
          "▥ Reports",
          "⚙ Settings",
        ].map((item) => (
          <button
            className={item.includes("Learn") ? "active" : ""}
            onClick={() => setToast(item)}
            key={item}
          >
            {item}
          </button>
        ))}
        <p>
          Ⓜ Mega ML · <small>Pro</small>
        </p>
      </aside>
      <header className="rnn-head">
        <small>LEARN · SEQUENCES · RECURRENT MODELS</small>
        <h1>Recurrent Neural Network</h1>
        <p>
          Explore how RNNs process sequences by carrying a hidden state through
          time. Interact with the unrolled network to see information flow,
          state evolution, and the vanishing gradient problem.
        </p>
        <nav>
          <button onClick={() => setToast("Help opened")}>?</button>
          <button onClick={() => setToast("Guide opened")}>▣</button>
          <button onClick={() => setToast("Theme toggled")}>☾</button>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
        </nav>
      </header>
      <nav className="rnn-tabs" role="tablist" aria-label="RNN sections">
        {LAB_TABS.map((name) => (
          <button
            role="tab"
            aria-selected={tab === name}
            className={tab === name ? "active" : ""}
            onClick={() => {
              setTab(name);
              if (name === "Build / Train") setAdvanced(true);
            }}
            key={name}
          >
            {name}
          </button>
        ))}
      </nav>
      <LabLessonOrWork tab={tab} route="/ml/deep-learning/rnn">
      <main>
        <section className="unroll panel">
          <header>
            <div>
              <h2>RNN Unrolled Through Time · ⓘ</h2>
              <p>
                Each cell shares parameters and passes hidden state h through
                the sequence.
              </p>
            </div>
            <label>
              Sequence Length
              <select
                value={sequenceLength}
                onChange={(event) => {
                  setSequenceLength(Number(event.target.value));
                  setStep(0);
                }}
              >
                {[3, 4, 5, 6, 7, 8]
                  .filter((value) => value <= sequence.length)
                  .map((value) => (
                    <option key={value}>{value}</option>
                  ))}
              </select>
            </label>
            <label>
              Auto Play
              <button onClick={() => setPlaying((value) => !value)}>
                <Play /> {playing ? "Pause" : "Play"}
              </button>
            </label>
          </header>
          <div className="time-labels">
            {tokens.map((_, index) => (
              <b key={index}>t={index}</b>
            ))}
          </div>
          <div className="rnn-row states">
            <strong>
              Hidden State h<sub>t</sub>
            </strong>
            {tokens.map((_, time) => (
              <button
                className={time === visibleStep ? "current" : ""}
                key={time}
                onClick={() => setStep(time)}
              >
                {showState ? (
                  result.states[time + 1]
                    .slice(0, 4)
                    .map((value, index) => (
                      <i key={index}>{value.toFixed(2)}</i>
                    ))
                ) : (
                  <i>hidden</i>
                )}
              </button>
            ))}
          </div>
          <div className="rnn-row cells">
            <strong>
              RNN Cell
              <br />
              <small>(Shared)</small>
            </strong>
            {tokens.map((_, time) => (
              <button
                className={time === visibleStep ? "current" : ""}
                key={time}
                onClick={() => setStep(time)}
              >
                RNN
                <br />
                Cell
                {showWeights && time < tokens.length - 1 ? (
                  <small> Wₕₕ →</small>
                ) : null}
              </button>
            ))}
          </div>
          <div className="rnn-row tokens">
            <strong>
              Input Token x<sub>t</sub>
            </strong>
            {tokens.map((token, index) => (
              <b key={index}>{token}</b>
            ))}
          </div>
          <div className="rnn-row outputs">
            <strong>
              Output y<sub>t</sub>
              <small>(Optional)</small>
            </strong>
            {result.predictions.map((prediction, index) => (
              <b
                key={index}
                title={`${(prediction.probability * 100).toFixed(1)}%`}
              >
                {prediction.token}
              </b>
            ))}
          </div>
          <p className="legend">
            ▣ Hidden State (h<sub>t</sub>) · ▣ Input Token (x<sub>t</sub>) · ▣
            Output (y<sub>t</sub>)
          </p>
        </section>
        <section className="rnn-charts">
          <article className="panel">
            <h3>Hidden State Trajectories · ⓘ</h3>
            <svg viewBox="0 0 420 170">
              <path d="M30 10V145H410" />
              {Array.from({ length: Math.min(4, hiddenSize) }, (_, unit) => (
                <polyline
                  key={unit}
                  className={`h${unit}`}
                  points={result.states
                    .slice(1)
                    .map(
                      (state, index) =>
                        `${35 + index * 70},${78 - state[unit] * 62}`,
                    )
                    .join(" ")}
                />
              ))}
            </svg>
          </article>
          <article className="panel gradient">
            <h3>Gradient Flow (Vanishing Gradient) · ⓘ</h3>
            <p>Gradient norm w.r.t. early hidden states</p>
            <svg viewBox="0 0 330 170">
              <path d="M30 10V145H320" />
              {showGradients && (
                <polyline
                  points={result.gradientNorms
                    .map(
                      (value, index) =>
                        `${35 + index * 52},${140 - Math.min(1, value) * 120}`,
                    )
                    .join(" ")}
                />
              )}
            </svg>
            <b>
              Gradients{" "}
              {result.gradientNorms.at(-1)! < 0.1 ? "vanish" : "remain"} across
              long dependencies.
            </b>
          </article>
          <article className="panel decay">
            <h3>Information Decay · ⓘ</h3>
            <p>How much of the past influences the current state.</p>
            {decay.map((value, index) => (
              <label key={index}>
                Lag {index + 1}
                <i>
                  <span style={{ width: `${value * 100}%` }} />
                </i>
                <b>{value.toFixed(2)}</b>
              </label>
            ))}
          </article>
        </section>
        <section className="preview panel">
          <h3>
            Sample Data Preview ·
            <small>(Tiny Text – Next Token Prediction) · ⓘ</small>
          </h3>
          <div>
            <b>
              Input Sequence (x<sub>t</sub>)
            </b>
            {sequence.map((token, index) => (
              <i key={index}>{token}</i>
            ))}
          </div>
          <div>
            <b>
              Target (y<sub>t</sub>)
            </b>
            {sequence.slice(1).map((token, index) => (
              <i key={index}>{token}</i>
            ))}
          </div>
        </section>
      </main>
      <aside className="rnn-controls panel">
        <h2>
          PARAMETERS{" "}
          <button onClick={reset}>
            <RotateCcw /> Reset
          </button>
        </h2>
        <h3>◯ Architecture</h3>
        <label>
          Hidden Size (n)
          <input
            type="number"
            min="2"
            max="8"
            value={hiddenSize}
            onChange={(event) =>
              setHiddenSize(
                Math.max(2, Math.min(8, Number(event.target.value))),
              )
            }
          />
        </label>
        <label>
          Activation
          <select
            value={activation}
            onChange={(event) =>
              setActivation(event.target.value as RNNActivation)
            }
          >
            <option>tanh</option>
            <option>relu</option>
            <option>sigmoid</option>
          </select>
        </label>
        <label>
          RNN Type
          <select>
            <option>Vanilla RNN</option>
          </select>
        </label>
        <h3>◯ Initialization</h3>
        <label>
          Weight Init
          <select
            value={init}
            onChange={(event) => setInit(event.target.value as RNNWeightInit)}
          >
            <option value="orthogonal">Orthogonal</option>
            <option value="xavier">Xavier</option>
            <option value="small">Small Random</option>
          </select>
        </label>
        <label>
          Bias Init
          <select
            value={biasMode}
            onChange={(event) => setBiasMode(event.target.value)}
          >
            <option>Zeros</option>
            <option>Constant 0.1</option>
          </select>
        </label>
        <h3>◯ Simulation</h3>
        <label>
          Sequence Length{" "}
          <span>
            {sequenceLength}
            <input
              type="range"
              min="3"
              max={Math.min(8, sequence.length)}
              value={sequenceLength}
              onInput={(event) => {
                setSequenceLength(Number(event.currentTarget.value));
                setStep(0);
              }}
            />
          </span>
        </label>
        <label>
          Time Step Delay{" "}
          <span>
            {delay} ms
            <input
              type="range"
              min="200"
              max="1200"
              step="100"
              value={delay}
              onInput={(event) => setDelay(Number(event.currentTarget.value))}
            />
          </span>
        </label>
        <label>
          Noise on State{" "}
          <span>
            {noise.toFixed(2)}
            <input
              type="range"
              min="0"
              max=".5"
              step=".05"
              value={noise}
              onInput={(event) => setNoise(Number(event.currentTarget.value))}
            />
          </span>
        </label>
        <h3>◯ Visual Options</h3>
        <label>
          Show State Values
          <input
            type="checkbox"
            checked={showState}
            onChange={(event) => setShowState(event.target.checked)}
          />
        </label>
        <label>
          Show Weights (W_hh)
          <input
            type="checkbox"
            checked={showWeights}
            onChange={(event) => setShowWeights(event.target.checked)}
          />
        </label>
        <label>
          Show Gradients
          <input
            type="checkbox"
            checked={showGradients}
            onChange={(event) => setShowGradients(event.target.checked)}
          />
        </label>
        <label className="rnn-upload">
          <Upload /> Upload Your Sequence File<small>CSV, TXT or JSON</small>
          <input
            type="file"
            accept=".csv,.txt,.json,text/plain,application/json"
            onChange={upload}
          />
        </label>
        <label>
          Or use a sample dataset
          <select
            onChange={(event) => {
              const index = Number(event.target.value);
              setSequence(sequences[index]);
              setSequenceLength(6);
              setStep(0);
            }}
          >
            <option value="0">Tiny Text (Words)</option>
            <option value="1">Dog Sentence</option>
            <option value="2">Weather Phrase</option>
          </select>
        </label>
        <p>{tokens.length} tokens · next-token prediction</p>
      </aside>
      <footer>
        <b>● Ready</b>
        <span>
          Framework: <strong>Custom RNN</strong>
        </span>
        <span>
          Precision: <strong>FP32</strong>
        </span>
        <span>
          Device: <strong>CPU</strong>
        </span>
        <span>
          Steps: <strong>{visibleStep + 1}</strong>
        </span>
        <button onClick={reset}>
          <RotateCcw /> Reset Simulation
        </button>
      </footer>
      </LabLessonOrWork>
      {toast && (
        <button className="rnn-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
