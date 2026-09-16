import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Moon, Play, RotateCcw, Share2, Upload } from "lucide-react";
import TensorFlowDeepLearningLab from "../shared/TensorFlowDeepLearningLab";
import { LAB_TABS, useLabTabs } from "../../../components/common/LabTabs";
import {
  activationGlyph,
  bpttStrip,
  compareSequenceModels,
  defaultLstmWeights,
  diagnoseLSTM,
  gateCaption,
  LSTM_WEIGHT_KEYS,
  lstmEvents,
  nextStepTargets,
  runLSTM,
  runScalarRnn,
  trainLstmWeights,
  type LSTMCandidateActivation,
  type LSTMGateActivation,
  type LSTMOverrides,
  type LSTMStep,
  type LSTMTrainEpoch,
  type LSTMWeights,
} from "../../../lib/algorithms/neural/lstm";
import {
  LSTM_SEQUENCES,
  type LSTMBeat,
  type LSTMLabSequence,
} from "../../../lib/algorithms/neural/lstmLab";
import {
  LSTMComparePanel,
  LSTMExplainPanel,
  LSTMLearnPanel,
} from "./LSTMLesson";
import "./LSTMPage.css";

const EMPTY_STEP: LSTMStep = {
  input: 0,
  extra: 0,
  forget: 0,
  write: 0,
  candidate: 0,
  output: 0,
  cell: 0,
  hidden: 0,
  retained: 0,
  written: 0,
  revealed: 0,
  inputMasked: false,
  recurrentMasked: false,
};

const padExtras = (values: number[], extras: number[]) =>
  values.map((_, index) => extras[index] ?? 0);

function Sparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? 80 : (index / (values.length - 1)) * 160 + 4;
      const y = 28 - ((value - min) / span) * 24;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 168 32" className="lstm-spark">
      <polyline points={points} stroke={color} />
    </svg>
  );
}

export default function LSTMPage() {
  const { tab, setTab } = useLabTabs("Visualize", "Visualize", []);
  const lesson = tab === "Learn" || tab === "Compare" || tab === "Explain";
  const [advanced, setAdvanced] = useState(false);
  const [dataset, setDataset] = useState<LSTMLabSequence>(LSTM_SEQUENCES[0] ?? {
    id: "sine",
    name: "Synth. Sequence (Sine)",
    kind: "toy",
    values: [0.23, -0.11, 0.42],
    extras: [],
    featureNames: ["x"],
    stress: "",
    highlight: 0,
  });
  const [step, setStep] = useState(3);
  const [playing, setPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [units, setUnits] = useState(16);
  const [gateActivation, setGateActivation] =
    useState<LSTMGateActivation>("sigmoid");
  const [candidateActivation, setCandidateActivation] =
    useState<LSTMCandidateActivation>("tanh");
  const [peepholes, setPeepholes] = useState(true);
  const [layers, setLayers] = useState(1);
  const [recurrentDropout, setRecurrentDropout] = useState(0.1);
  const [inputDropout, setInputDropout] = useState(0.1);
  const [overrides, setOverrides] = useState<LSTMOverrides>({});
  const [weights, setWeights] = useState<LSTMWeights>(() =>
    defaultLstmWeights(16, 1),
  );
  const [trainHistory, setTrainHistory] = useState<LSTMTrainEpoch[]>([]);
  const [trained, setTrained] = useState(false);
  const [beat, setBeat] = useState<LSTMBeat>(0);
  const [focusGate, setFocusGate] = useState<"forget" | "write" | "output" | "candidate" | null>(null);
  const [showRnn, setShowRnn] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [toast, setToast] = useState("System status: all systems operational");

  const extras = useMemo(
    () => padExtras(dataset.values, dataset.extras),
    [dataset],
  );
  const baselineWeights = useMemo(
    () => defaultLstmWeights(units, layers),
    [units, layers],
  );
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
        weights,
        extras,
      ),
    [
      dataset,
      extras,
      gateActivation,
      candidateActivation,
      peepholes,
      recurrentDropout,
      inputDropout,
      overrides,
      units,
      layers,
      weights,
    ],
  );
  const cleanResult = useMemo(
    () =>
      runLSTM(
        dataset.values,
        gateActivation,
        candidateActivation,
        peepholes,
        recurrentDropout,
        inputDropout,
        {},
        units,
        layers,
        weights,
        extras,
      ),
    [
      dataset,
      extras,
      gateActivation,
      candidateActivation,
      peepholes,
      recurrentDropout,
      inputDropout,
      units,
      layers,
      weights,
    ],
  );
  const maxStep = Math.max(0, result.length - 1);
  const safeStep = Math.min(step, maxStep);
  const active = result[safeStep] ?? EMPTY_STEP;
  const previous = safeStep > 0 ? result[safeStep - 1] : undefined;
  const targets = dataset.targets ?? nextStepTargets(dataset.values);
  const metrics = useMemo(
    () => diagnoseLSTM(result, targets),
    [result, targets],
  );
  const baselineMetrics = useMemo(
    () => diagnoseLSTM(cleanResult, targets),
    [cleanResult, targets],
  );
  const events = useMemo(() => lstmEvents(result), [result]);
  const rnnHidden = useMemo(
    () => runScalarRnn(dataset.values, extras),
    [dataset, extras],
  );
  const compareRows = useMemo(
    () =>
      compareSequenceModels(
        dataset.values,
        extras,
        result,
        units,
        layers,
        targets,
      ),
    [dataset, extras, result, units, layers, targets],
  );
  const bptt = useMemo(
    () => bpttStrip(result, targets[targets.length - 1] ?? 0, 3),
    [result, targets],
  );

  useEffect(() => {
    if (!playing && !autoAdvance) return;
    const timer = window.setInterval(() => {
      setStep((value) => {
        const next = value >= maxStep ? 0 : value + 1;
        const hit = events.find((event) => event.t === next);
        if (hit) {
          setPlaying(false);
          setAutoAdvance(false);
          setToast(hit.label);
        }
        return next;
      });
    }, 900 / speed);
    return () => window.clearInterval(timer);
  }, [playing, autoAdvance, speed, maxStep, events]);

  const setGate = (
    key: "forget" | "write" | "candidate" | "output",
    value: number,
  ) =>
    setOverrides((current) => ({
      ...current,
      [safeStep]: {
        ...current[safeStep],
        [key]: Math.max(key === "candidate" ? -1 : 0, Math.min(1, value)),
      },
    }));
  const resetGates = () =>
    setOverrides((current) => {
      const next = { ...current };
      delete next[safeStep];
      return next;
    });
  const loadSequence = (sample: LSTMLabSequence) => {
    setDataset(sample);
    setOverrides({});
    setStep(Math.min(sample.highlight, Math.max(0, sample.values.length - 1)));
    setToast(`${sample.name}: ${sample.stress}`);
  };
  const resetAll = () => {
    const first = LSTM_SEQUENCES[0];
    if (first) loadSequence(first);
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
    setWeights(defaultLstmWeights(16, 1));
    setTrainHistory([]);
    setTrained(false);
    setBeat(0);
    setFocusGate(null);
    setShowRnn(false);
    setQuizIndex(0);
    setQuizChoice(null);
    setToast("LSTM simulation reset");
  };
  const switchDataset = () => {
    const index =
      (LSTM_SEQUENCES.findIndex((sample) => sample.id === dataset.id) + 1) %
      LSTM_SEQUENCES.length;
    const next = LSTM_SEQUENCES[index];
    if (next) loadSequence(next);
  };
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        let values: number[] = [];
        let extra: number[] = [];
        try {
          const parsed: unknown = JSON.parse(text);
          if (Array.isArray(parsed)) {
            values = parsed.map(Number);
          } else if (parsed && typeof parsed === "object") {
            const record = parsed as { values?: unknown; extras?: unknown };
            values = Array.isArray(record.values)
              ? record.values.map(Number)
              : [];
            extra = Array.isArray(record.extras) ? record.extras.map(Number) : [];
          }
        } catch {
          const rows = text
            .trim()
            .split(/\r?\n/)
            .map((line) => line.split(/[\s,]+/).filter(Boolean).map(Number));
          values = rows.map((row) => row[0]).filter((value): value is number => Number.isFinite(value));
          extra = rows
            .map((row) => row[1])
            .filter((value): value is number => Number.isFinite(value));
        }
        values = values.filter(Number.isFinite).slice(0, 32);
        if (values.length < 4) {
          setToast("Sequence needs at least four numeric values");
          return;
        }
        loadSequence({
          id: "upload",
          name: file.name,
          kind: "real",
          values,
          extras: extra.slice(0, values.length),
          featureNames: extra.length ? ["x", "feature 2"] : ["x"],
          stress: extra.length
            ? "Uploaded two columns. Feature 2 feeds every gate as an extra term."
            : "Uploaded series. Click a row to inspect that timestep.",
          highlight: Math.min(3, values.length - 1),
        });
      })
      .catch(() => setToast("Could not read sequence file"));
    event.target.value = "";
  };
  const chooseTab = (next: string) => {
    setTab(next);
    if (next !== "Build / Train") setAdvanced(false);
  };
  const trainExplainer = () => {
    const { weights: next, history } = trainLstmWeights(
      dataset.values,
      extras,
      targets,
      weights,
      gateActivation,
      candidateActivation,
      peepholes,
      units,
      layers,
      40,
      0.12,
    );
    setWeights(next);
    setTrainHistory(history);
    setTrained(true);
    const last = history[history.length - 1];
    setToast(
      last
        ? `Trained 40 epochs · loss ${last.loss.toFixed(3)} · mean forget ${last.forget.toFixed(2)}`
        : "Training finished",
    );
  };

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
      </aside>
      <header className="lstm-head">
        <h1>
          LSTM{" "}
          <small>Long Short-Term Memory networks for sequence modeling.</small>
        </h1>
        <nav>
          <button onClick={() => chooseTab("Explain")}>
            <BookOpen /> Docs
          </button>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
          <button onClick={() => setToast("Theme is controlled from the suite bar")}>
            <Moon />
          </button>
          <b>M</b>
        </nav>
      </header>
      <nav className="lstm-tabs" role="tablist" aria-label="LSTM lab tabs">
        {LAB_TABS.map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            className={tab === name ? "active" : ""}
            onClick={() => chooseTab(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <main>
        {tab === "Learn" && (
          <LSTMLearnPanel
            active={active}
            previous={previous}
            step={safeStep}
            sequence={dataset}
            beat={beat}
            quizIndex={quizIndex}
            quizChoice={quizChoice}
            onBeat={setBeat}
            onOpenVisualize={(nextBeat, gate) => {
              setBeat(nextBeat);
              setFocusGate(gate ?? null);
              chooseTab("Visualize");
            }}
            onQuiz={(choice) => {
              setQuizChoice(choice);
              window.setTimeout(() => {
                setQuizIndex((index) => (index + 1) % 5);
                setQuizChoice(null);
              }, 1600);
            }}
          />
        )}
        {tab === "Compare" && (
          <LSTMComparePanel
            rows={compareRows}
            onOpenDataset={() => {
              const task = LSTM_SEQUENCES.find((sample) => sample.kind === "task");
              if (task) loadSequence(task);
              chooseTab("Dataset");
            }}
          />
        )}
        {tab === "Explain" && (
          <LSTMExplainPanel
            active={active}
            previous={previous}
            step={safeStep}
            onFocus={(gate) => {
              setFocusGate(gate);
              setBeat(gate === "forget" ? 0 : gate === "write" ? 1 : 3);
              chooseTab("Visualize");
            }}
          />
        )}
        {tab === "Dataset" && (
          <section className="lstm-data panel">
            <h2>Sequence library</h2>
            <p>
              Toys, suite datasets (weather, sales, retail demand), and classic
              memory tasks. Each card states the memory stress test.
            </p>
            <div className="lstm-data-grid">
              {LSTM_SEQUENCES.map((sample) => (
                <button
                  key={sample.id}
                  className={dataset.id === sample.id ? "active" : ""}
                  onClick={() => loadSequence(sample)}
                >
                  <b>{sample.name}</b>
                  <small>
                    {sample.values.length} steps · {sample.featureNames.length}{" "}
                    {sample.featureNames.length === 1 ? "feature" : "features"} · {sample.kind}
                  </small>
                  <Sparkline values={sample.values} color="#3486ff" />
                  <em>{sample.stress}</em>
                </button>
              ))}
            </div>
            <table>
              <thead>
                <tr>
                  <th>t</th>
                  <th>{dataset.featureNames[0] ?? "xₜ"}</th>
                  {dataset.featureNames[1] && <th>{dataset.featureNames[1]}</th>}
                  <th>Cₜ</th>
                  <th>hₜ</th>
                </tr>
              </thead>
              <tbody>
                {result.map((item, index) => (
                  <tr
                    key={index}
                    className={index === safeStep ? "active" : ""}
                    onClick={() => setStep(index)}
                  >
                    <td>{index}</td>
                    <td>{item.input.toFixed(2)}</td>
                    {dataset.featureNames[1] && <td>{item.extra.toFixed(2)}</td>}
                    <td>{item.cell.toFixed(2)}</td>
                    <td>{item.hidden.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              Current file: <b>{dataset.name}</b> · {dataset.values.length} values.
              Upload CSV/JSON (one column or x,feature2). Min 4 rows.
            </p>
            <label className="lstm-upload">
              <Upload /> Upload / Import
              <input type="file" accept=".csv,.txt,.json" onChange={upload} />
            </label>
          </section>
        )}
        {tab === "Build / Train" && (
          <section className="lstm-train panel">
            <article>
              <h2>Inspector architecture</h2>
              <p>
                Unrolled LSTM · {layers} layer{layers === 1 ? "" : "s"} · {units}{" "}
                hidden units · gate {gateActivation} · candidate {candidateActivation}
                {peepholes ? " · peepholes on" : ""}
                {trained ? " · explainer weights trained" : " · default weights"}.
              </p>
              <p>
                Fits the 12 visible scalars so the cell you are looking at is the
                model being trained. Target: {dataset.targets ? "task readout" : "next xₜ"}.
              </p>
              <button onClick={trainExplainer}>Train explainer (40 epochs)</button>
              <button onClick={() => setAdvanced((value) => !value)}>
                {advanced ? "Hide TensorFlow.js lab" : "Open TensorFlow.js Training Lab"}
              </button>
            </article>
            {trainHistory.length > 0 && (
              <article className="lstm-hist">
                <h2>Gate means over training</h2>
                <svg viewBox="0 0 320 90">
                  {(["forget", "write", "output"] as const).map((key, index) => {
                    const color = ["#42cb72", "#ffad20", "#ff6574"][index];
                    const points = trainHistory
                      .map((row, epoch) => {
                        const x = 8 + (epoch / Math.max(1, trainHistory.length - 1)) * 300;
                        const y = 80 - row[key] * 70;
                        return `${x},${y}`;
                      })
                      .join(" ");
                    return (
                      <polyline key={key} points={points} stroke={color} fill="none" />
                    );
                  })}
                </svg>
                <small>Green forget · amber write · red output. Loss ended at{" "}
                  {trainHistory[trainHistory.length - 1]?.loss.toFixed(3)}</small>
              </article>
            )}
            <article>
              <h2>BPTT through this cell</h2>
              <p>
                Last-step loss on the task/next-step target. dC flows backward
                through the forget gates — the reason LSTM exists.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>t</th>
                    <th>∂L/∂h</th>
                    <th>∂L/∂C</th>
                    <th>f path</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bptt.map((row) => (
                    <tr
                      key={row.t}
                      className={row.t === safeStep ? "active" : ""}
                      onClick={() => setStep(row.t)}
                    >
                      <td>{row.t}</td>
                      <td>{row.dHidden.toFixed(3)}</td>
                      <td>{row.dCell.toFixed(3)}</td>
                      <td>{row.forgetPath.toFixed(2)}</td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
            {advanced ? (
              <div className="lstm-tf">
                <TensorFlowDeepLearningLab mode="lstm" />
              </div>
            ) : (
              <article>
                <h2>Optional TensorFlow.js lab</h2>
                <p>
                  A separate LSTM classifier on 12-step synthetic sequences. It
                  does not overwrite the explainer weights above.
                </p>
              </article>
            )}
          </section>
        )}
        {tab === "Metrics" && (
          <section className="lstm-metrics panel">
            <h2>Sequence diagnostics</h2>
            <p>
              Forecast MAE is only the headline when the job is next-step
              prediction. Saturation and cell half-life describe the memory
              highway. Overrides are compared to the untouched run.
            </p>
            <div className="lstm-metric-cards">
              {[
                ["Next-step MAE", metrics.mae.toFixed(3), dataset.targets ? "not the task loss" : "hₜ vs xₜ₊₁"],
                ["Last |error|", metrics.lastError.toFixed(3), "copy / XOR / add score"],
                ["Gate saturation", `${Math.round(metrics.saturation * 100)}%`, "f or o near 0/1"],
                ["Cell half-life", `${metrics.halfLife} steps`, "forget product ≤ 0.5"],
                ["Mean forget", `${Math.round(metrics.forget * 100)}%`, "memory kept"],
                ["Cell span", metrics.cellSpan.toFixed(3), "max C − min C"],
              ].map(([label, value, sub]) => (
                <div key={label}>
                  <small>{label}</small>
                  <b>{value}</b>
                  <span>{sub}</span>
                </div>
              ))}
            </div>
            {Object.keys(overrides).length > 0 && (
              <p className="lstm-override">
                Gate override is on. Untouched run: MAE {baselineMetrics.mae.toFixed(3)} ·
                last |err| {baselineMetrics.lastError.toFixed(3)} · half-life{" "}
                {baselineMetrics.halfLife}. Current: MAE {metrics.mae.toFixed(3)} · last
                |err| {metrics.lastError.toFixed(3)} · half-life {metrics.halfLife}.
              </p>
            )}
            <table>
              <thead>
                <tr>
                  <th>t</th>
                  <th>x</th>
                  <th>f</th>
                  <th>i</th>
                  <th>c̃</th>
                  <th>o</th>
                  <th>C</th>
                  <th>h</th>
                </tr>
              </thead>
              <tbody>
                {result.map((item, index) => (
                  <tr
                    key={index}
                    className={index === safeStep ? "active" : ""}
                    onClick={() => setStep(index)}
                  >
                    <td>{index}</td>
                    <td>{item.input.toFixed(2)}</td>
                    <td>{item.forget.toFixed(2)}</td>
                    <td>{item.write.toFixed(2)}</td>
                    <td>{item.candidate.toFixed(2)}</td>
                    <td>{item.output.toFixed(2)}</td>
                    <td>{item.cell.toFixed(2)}</td>
                    <td>{item.hidden.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {tab === "Visualize" && (
          <>
            <section className="lstm-cell panel" data-beat={beat}>
              <header>
                <div>
                  <h2>Interactive LSTM Cell</h2>
                  <p>
                    Cₜ = {active.forget.toFixed(2)}×{previous?.cell.toFixed(2) ?? "0.00"} +{" "}
                    {active.write.toFixed(2)}×{active.candidate.toFixed(2)} ={" "}
                    {active.cell.toFixed(2)}. {dataset.stress}
                  </p>
                </div>
                <span>Time step (t)</span>
                <button onClick={() => setStep(0)}>«</button>
                <button onClick={() => setStep(Math.max(0, step - 1))}>‹</button>
                <b>
                  {safeStep + 1} / {result.length || 1}
                </b>
                <button onClick={() => setStep(Math.min(maxStep, safeStep + 1))}>
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
                <label>
                  <input
                    type="checkbox"
                    checked={showRnn}
                    onChange={(e) => setShowRnn(e.target.checked)}
                  />{" "}
                  vs RNN
                </label>
              </header>
              <div className="cell-diagram">
                <div className="signal previous-cell">
                  Cₜ₋₁<small>{previous?.cell.toFixed(2) ?? "0.00"}</small>
                </div>
                <div className="cell-shell">
                  <div className="memory-line" />
                  {peepholes && (
                    <div className="peepholes" aria-hidden>
                      <i />
                      <i />
                      <i />
                    </div>
                  )}
                  <div className={`op mult${beat === 0 ? " lit" : ""}`}>×</div>
                  <div className={`op plus${beat === 2 ? " lit" : ""}`}>+</div>
                  <div className="flow-products">
                    <b className={beat === 0 ? "lit" : ""}>
                      {active.retained.toFixed(2)}
                    </b>
                    <b className={beat === 1 ? "lit" : ""}>
                      {active.written.toFixed(2)}
                    </b>
                  </div>
                  <div className="gate-nodes">
                    {gates.map((gate) => (
                      <div
                        style={{ borderColor: gate.color }}
                        key={gate.key}
                        className={
                          focusGate === gate.key ||
                          (beat === 0 && gate.key === "forget") ||
                          (beat === 1 && (gate.key === "write" || gate.key === "candidate")) ||
                          (beat === 3 && gate.key === "output")
                            ? "lit"
                            : ""
                        }
                        onClick={() => {
                          setFocusGate(gate.key);
                          chooseTab("Explain");
                        }}
                      >
                        <small>{gate.label}</small>
                        <i>{gate.symbol}</i>
                        <b>{active[gate.key].toFixed(2)}</b>
                        <em>{gateCaption(gate.key, active[gate.key])}</em>
                      </div>
                    ))}
                  </div>
                  <div className="activation-row">
                    <span>{activationGlyph("gate", gateActivation, candidateActivation)}</span>
                    <span>{activationGlyph("gate", gateActivation, candidateActivation)}</span>
                    <span>
                      {activationGlyph("candidate", gateActivation, candidateActivation)}
                    </span>
                    <span>{activationGlyph("gate", gateActivation, candidateActivation)}</span>
                  </div>
                  <div className="flow-lines">
                    f⊙Cₜ₋₁={active.retained.toFixed(2)} · i⊙c̃={active.written.toFixed(2)} ·
                    o⊙tanh(C)={active.revealed.toFixed(2)}
                  </div>
                </div>
                <div className="signal current-cell">
                  Cₜ<small>{active.cell.toFixed(2)}</small>
                </div>
                <div
                  className={`signal previous-hidden${active.recurrentMasked ? " muted" : ""}`}
                >
                  hₜ₋₁<small>{previous?.hidden.toFixed(2) ?? "0.00"}</small>
                </div>
                <div className="signal current-hidden">
                  hₜ<small>{active.hidden.toFixed(2)}</small>
                </div>
                <div
                  className={`signal current-input${active.inputMasked ? " muted" : ""}`}
                >
                  xₜ<small>{active.input.toFixed(2)}</small>
                </div>
              </div>
              <div className="cell-legend">
                <span className="cyan">━ Cell State Flow</span>
                <span className="purple">━ Hidden State Flow</span>
                {peepholes && <span>Peepholes C→f,i,o on</span>}
                {(active.inputMasked || active.recurrentMasked) && (
                  <span>Dropout muted {active.inputMasked ? "x" : ""}
                    {active.recurrentMasked ? " h" : ""}</span>
                )}
                {gates.map((gate) => (
                  <span key={gate.key}>□ {gate.label}</span>
                ))}
              </div>
            </section>
            <section className="lstm-timeline panel">
              <h2>Sequence Memory Timeline</h2>
              <p>
                Sparklines for input, cell, and hidden
                {showRnn ? " — dashed RNN hidden fades on long gaps." : "."}
              </p>
              <div className="lstm-sparks">
                <label>
                  xₜ
                  <Sparkline values={result.map((item) => item.input)} color="#5398ff" />
                </label>
                <label>
                  Cₜ
                  <Sparkline values={result.map((item) => item.cell)} color="#40d8c3" />
                </label>
                <label>
                  hₜ
                  <Sparkline values={result.map((item) => item.hidden)} color="#c86ae5" />
                </label>
                {showRnn && (
                  <label>
                    RNN h
                    <Sparkline values={rnnHidden} color="#8892a8" />
                  </label>
                )}
              </div>
              <div
                className="timeline-grid"
                style={{
                  gridTemplateColumns: `130px repeat(${result.length}, minmax(55px, 1fr))`,
                }}
              >
                <b>t</b>
                {result.map((_, i) => (
                  <button
                    className={i === safeStep ? "active" : ""}
                    onClick={() => setStep(i)}
                    key={i}
                  >
                    {i}
                  </button>
                ))}
                <b>Cₜ</b>
                {result.map((value, i) => (
                  <span className="cyan" key={i}>
                    {value.cell.toFixed(2)}
                  </span>
                ))}
                <b>hₜ</b>
                {result.map((value, i) => (
                  <span className="purple" key={i}>
                    {value.hidden.toFixed(2)}
                  </span>
                ))}
                {showRnn && (
                  <>
                    <b>RNN h</b>
                    {rnnHidden.map((value, i) => (
                      <span key={i}>{value.toFixed(2)}</span>
                    ))}
                  </>
                )}
              </div>
            </section>
            <section className="gate-editor panel">
              <header>
                <h2>
                  Gate Values at t = {safeStep} <small>(editable)</small>
                </h2>
                <p>Overrides change Metrics before/after. Click a caption to open Explain.</p>
              </header>
              <div>
                {gates.map((gate) => (
                  <label style={{ borderColor: gate.color }} key={gate.key}>
                    <span>
                      {gate.label} <i>{gate.symbol}</i>
                    </span>
                    <strong>{active[gate.key].toFixed(2)}</strong>
                    <button onClick={() => setGate(gate.key, active[gate.key] - 0.05)}>
                      −
                    </button>
                    <button onClick={() => setGate(gate.key, active[gate.key] + 0.05)}>
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
                    <em>{gateCaption(gate.key, active[gate.key])}</em>
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
              <h2>At a Glance (t = {safeStep})</h2>
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
                  sub: gateCaption("forget", active.forget),
                },
                {
                  label: "Written",
                  value: active.written.toFixed(2),
                  sub: gateCaption("write", active.write),
                },
                {
                  label: "Revealed h",
                  value: active.revealed.toFixed(2),
                  sub: gateCaption("output", active.output),
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
              <p>● Train the explainer weights, then re-read the cell.</p>
              <p>● Load copy-memory and toggle vs RNN.</p>
              <button onClick={() => chooseTab("Build / Train")}>
                Go to Build / Train →
              </button>
            </section>
          </>
        )}
      </main>
      {!lesson && (
        <aside className="lstm-controls">
          <section className="panel">
            <header>
              <h2>Parameters Inspector</h2>
              <button onClick={resetAll}>Reset All</button>
            </header>
            <label>
              Units (hidden size)
              <span>
                <button onClick={() => setUnits(Math.max(4, units - 4))}>−</button>
                <input aria-label="Units hidden size" value={units} readOnly />
                <button onClick={() => setUnits(Math.min(64, units + 4))}>+</button>
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
          </section>
          <section className="panel lstm-weights">
            <header>
              <h2>Explainer weights</h2>
              <small>{trained ? "learned" : "default"}</small>
            </header>
            <dl>
              {LSTM_WEIGHT_KEYS.map((key) => {
                const value = weights[key];
                const delta = value - baselineWeights[key];
                return (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>
                      {value.toFixed(2)}
                      <small>
                        {delta >= 0 ? "+" : ""}
                        {delta.toFixed(2)}
                      </small>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
          <section className="panel dataset">
            <header>
              <h2>Dataset</h2>
              <button onClick={switchDataset}>Switch</button>
            </header>
            <p>
              Sample: <b>{dataset.name}</b>
            </p>
            <small>{dataset.stress}</small>
            <dl>
              <div>
                <dt>Kind</dt>
                <dd>{dataset.kind}</dd>
              </div>
              <div>
                <dt>Seq. Length</dt>
                <dd>{dataset.values.length}</dd>
              </div>
              <div>
                <dt>Features</dt>
                <dd>{dataset.featureNames.length}</dd>
              </div>
            </dl>
            <Sparkline values={dataset.values} color="#3486ff" />
            <div>
              <button onClick={() => chooseTab("Dataset")}>◉ Library</button>
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
            <p>fₜ — Forget gate — what to keep</p>
            <p>iₜ — Input gate — what to write</p>
            <p>c̃ₜ — Candidate — new content</p>
            <p>oₜ — Output gate — what to output</p>
          </section>
        </aside>
      )}
      <footer>
        {toast}
        <button onClick={() => setPlaying(!playing)}>
          <Play /> {playing ? "Pause" : "Play sequence"}
        </button>
      </footer>
    </div>
  );
}
