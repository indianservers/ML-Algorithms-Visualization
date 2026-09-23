import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Play, Repeat, RotateCcw, Upload } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { LAB_TABS, LabLessonPanel, isLabTab, useLabTabs } from "../../../components/common/LabTabs";
import { Formula } from "../../../components/common/Formula";
import {
  createRnnWeights,
  encodeSeriesInputs,
  encodeTextInputs,
  forwardRnn,
  inferNext,
  trainRnnEpoch,
  type RNNActivation,
  type RNNTrainEpoch,
  type RNNWeightInit,
  type RNNWeights,
} from "../../../lib/algorithms/neural/rnn";
import { RNN_DATASETS, type RnnLabDataset } from "../../../lib/algorithms/neural/rnnLab";
import "./RNNPage.css";

const ROUTE = "/ml/deep-learning/rnn";

function cloneDataset(sample: RnnLabDataset): RnnLabDataset {
  return {
    ...sample,
    tokens: [...sample.tokens],
    values: [...sample.values],
    extras: [...sample.extras],
    labels: [...sample.labels],
    featureNames: [...sample.featureNames],
  };
}

function denorm(value: number, series: number[]) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  return ((value + 1) / 2) * span + min;
}

export default function RNNPage() {
  const { tab, setTab } = useLabTabs("Visualize", "", []);
  const [dataset, setDataset] = useState<RnnLabDataset>(() => cloneDataset(RNN_DATASETS[0]!));
  const [hiddenSize, setHiddenSize] = useState(8);
  const [activation, setActivation] = useState<RNNActivation>("tanh");
  const [init, setInit] = useState<RNNWeightInit>("orthogonal");
  const [learningRate, setLearningRate] = useState(0.08);
  const [epochs, setEpochs] = useState(24);
  const [noise, setNoise] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [training, setTraining] = useState(false);
  const [trained, setTrained] = useState(false);
  const [history, setHistory] = useState<RNNTrainEpoch[]>([]);
  const [prompt, setPrompt] = useState("");
  const [inferText, setInferText] = useState("");
  const [status, setStatus] = useState("Load a sequence, then train.");
  const [draft, setDraft] = useState("");
  const weightsRef = useRef<RNNWeights | null>(null);
  const cancelRef = useRef(false);

  const vocab = useMemo(
    () => (dataset.kind === "text" ? [...new Set(dataset.tokens)] : []),
    [dataset],
  );
  const inputSize = dataset.kind === "text" ? Math.max(1, vocab.length) : dataset.extras.length ? 2 : 1;
  const outputSize = dataset.kind === "text" ? Math.max(1, vocab.length) : 1;

  const packed = useMemo(() => {
    if (dataset.kind === "text") {
      const tokens = dataset.tokens;
      const xs = encodeTextInputs(tokens.slice(0, -1), vocab);
      const ys = tokens.slice(1).map((token) => Math.max(0, vocab.indexOf(token)));
      return { xs, ys, view: encodeTextInputs(tokens, vocab) };
    }
    const xsAll = encodeSeriesInputs(dataset.values, dataset.extras);
    return {
      xs: xsAll.slice(0, -1),
      ys: xsAll.slice(1).map((row) => row[0] ?? 0),
      view: xsAll,
    };
  }, [dataset, vocab]);

  const weights = useMemo(() => {
    if (!weightsRef.current) {
      weightsRef.current = createRnnWeights(hiddenSize, inputSize, outputSize, init, 0);
    }
    return weightsRef.current;
  }, [hiddenSize, inputSize, outputSize, init, dataset.id, trained, history.length]);

  const result = useMemo(
    () =>
      forwardRnn(
        packed.view,
        weights,
        activation,
        noise,
        dataset.kind,
        vocab,
        dataset.kind === "text"
          ? dataset.tokens.map((token) => Math.max(0, vocab.indexOf(token)))
          : packed.view.map((row) => row[0] ?? 0),
      ),
    [packed, weights, activation, noise, dataset, vocab],
  );

  const maxStep = Math.max(0, (dataset.kind === "text" ? dataset.tokens.length : dataset.values.length) - 1);
  const visibleStep = Math.min(step, maxStep);
  const latest = history[history.length - 1];

  const seriesChart = useMemo(() => {
    if (dataset.kind !== "series") return [];
    return dataset.values.map((value, index) => ({
      t: dataset.labels[index] || `t${index}`,
      actual: value,
      predicted: denorm(result.predictions[index]?.value ?? 0, dataset.values),
    }));
  }, [dataset, result.predictions]);

  const hiddenChart = useMemo(
    () =>
      result.states.slice(1).map((state, index) => ({
        t: index,
        h0: Number((state[0] ?? 0).toFixed(3)),
        h1: Number((state[1] ?? 0).toFixed(3)),
        h2: Number((state[2] ?? 0).toFixed(3)),
      })),
    [result.states],
  );

  const gradientChart = useMemo(
    () => result.gradientNorms.map((value, index) => ({ t: index, g: Number(value.toFixed(4)) })),
    [result.gradientNorms],
  );

  const shuffledMae = useMemo(() => {
    if (dataset.kind !== "series" || dataset.values.length < 4) return result.mae;
    const shuffled = [...dataset.values];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = (i * 17 + 5) % (i + 1);
      const held = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = held;
    }
    const xs = encodeSeriesInputs(shuffled, dataset.extras).slice(0, -1);
    const ys = encodeSeriesInputs(shuffled).slice(1).map((row) => row[0] ?? 0);
    const run = forwardRnn(xs, weights, activation, 0, "series", [], ys);
    return run.mae;
  }, [dataset, weights, activation, result.mae]);

  const persistMae = useMemo(() => {
    if (dataset.kind !== "series") return 0;
    const xs = encodeSeriesInputs(dataset.values);
    let err = 0;
    for (let i = 1; i < xs.length; i += 1) err += Math.abs((xs[i - 1]?.[0] ?? 0) - (xs[i]?.[0] ?? 0));
    return err / Math.max(1, xs.length - 1);
  }, [dataset]);

  useEffect(() => {
    setDraft(dataset.kind === "text" ? dataset.tokens.join(" ") : "");
  }, [dataset.id, dataset.kind]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setStep((current) => (current >= maxStep ? 0 : current + 1));
    }, 700);
    return () => window.clearInterval(timer);
  }, [playing, maxStep]);

  useEffect(
    () => () => {
      cancelRef.current = true;
    },
    [],
  );

  const rebuildWeights = () => {
    weightsRef.current = createRnnWeights(hiddenSize, inputSize, outputSize, init, 0);
    setHistory([]);
    setTrained(false);
    setStatus("Weights reinitialized. Train to fit this dataset.");
  };

  const loadDataset = (sample: RnnLabDataset) => {
    setDataset(cloneDataset(sample));
    setStep(Math.min(3, sample.tokens.length - 1));
    setPlaying(false);
    weightsRef.current = null;
    setHistory([]);
    setTrained(false);
    setInferText("");
    setStatus(`Loaded ${sample.name}. Edit it, then train.`);
  };

  const applyTextDraft = () => {
    const tokens = draft.trim().split(/\s+/).filter(Boolean);
    if (tokens.length < 4) {
      setStatus("Need at least four tokens.");
      return;
    }
    setDataset((current) => ({
      ...current,
      id: `${current.id}-edit`,
      tokens,
      values: tokens.map((_, index) => index),
      labels: tokens.map((_, index) => `t${index}`),
      extras: [],
    }));
    weightsRef.current = null;
    setTrained(false);
    setHistory([]);
    setStatus(`Edited text sequence · ${tokens.length} tokens. Train again.`);
  };

  const editValue = (index: number, next: number) => {
    setDataset((current) => {
      const values = [...current.values];
      values[index] = next;
      return { ...current, id: `${current.id.split("-edit")[0]}-edit`, values, tokens: values.map(String) };
    });
    setTrained(false);
    setStatus("Dataset edited. Train to refresh weights.");
  };

  const addRow = () => {
    setDataset((current) => {
      const last = current.values[current.values.length - 1] ?? 0;
      const values = [...current.values, last];
      const extras = current.extras.length ? [...current.extras, current.extras.at(-1) ?? 0] : [];
      const labels = [...current.labels, `t${values.length - 1}`];
      return { ...current, id: `${current.id.split("-edit")[0]}-edit`, values, extras, labels, tokens: values.map(String) };
    });
    setTrained(false);
  };

  const removeRow = (index: number) => {
    setDataset((current) => {
      if (current.values.length <= 4) return current;
      const values = current.values.filter((_, i) => i !== index);
      const extras = current.extras.filter((_, i) => i !== index);
      const labels = current.labels.filter((_, i) => i !== index);
      return { ...current, values, extras, labels, tokens: values.map(String) };
    });
    setTrained(false);
  };

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void file.text().then((text) => {
      const rows = text
        .trim()
        .split(/\r?\n/)
        .map((line) => line.split(/[\s,]+/).filter(Boolean));
      const header = rows[0] ?? [];
      const numeric = rows.filter((row) => Number.isFinite(Number(row[0])));
      if (numeric.length >= 4) {
        const values = numeric.map((row) => Number(row[0]));
        const extras = numeric.map((row) => Number(row[1])).filter((value) => Number.isFinite(value));
        loadDataset({
          id: "upload",
          name: file.name,
          kind: "series",
          blurb: "Uploaded numeric sequence. Last column extras are optional.",
          tokens: values.map(String),
          values,
          extras: extras.length === values.length ? extras : [],
          labels: values.map((_, index) => `${header[0] ?? "t"}${index + 1}`),
          featureNames: extras.length === values.length ? ["value", "extra"] : ["value"],
        });
        return;
      }
      const tokens = text.trim().split(/\s+/).filter(Boolean);
      if (tokens.length < 4) {
        setStatus("Need four numeric rows or four tokens.");
        return;
      }
      loadDataset({
        id: "upload-text",
        name: file.name,
        kind: "text",
        blurb: "Uploaded token sequence for next-word prediction.",
        tokens,
        values: tokens.map((_, index) => index),
        extras: [],
        labels: tokens.map((_, index) => `t${index}`),
        featureNames: ["token"],
      });
    });
    event.target.value = "";
  };

  const train = async () => {
    if (packed.xs.length < 3) {
      setStatus("Sequence is too short to train.");
      return;
    }
    cancelRef.current = false;
    setTraining(true);
    setStatus("Training vanilla RNN with BPTT…");
    let current = createRnnWeights(hiddenSize, inputSize, outputSize, init, 0);
    const nextHistory: RNNTrainEpoch[] = [];
    for (let epoch = 1; epoch <= epochs; epoch += 1) {
      if (cancelRef.current) break;
      const stepResult = trainRnnEpoch(packed.xs, packed.ys, current, activation, learningRate, dataset.kind);
      current = stepResult.weights;
      nextHistory.push({ epoch, ...stepResult.stats });
      weightsRef.current = current;
      setHistory([...nextHistory]);
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)));
    }
    setTrained(true);
    setTraining(false);
    const last = nextHistory[nextHistory.length - 1];
    setStatus(
      last
        ? `Trained ${nextHistory.length} epochs · loss ${last.loss.toFixed(3)} · ${dataset.kind === "text" ? `acc ${(last.accuracy * 100).toFixed(0)}%` : `MAE ${last.mae.toFixed(3)}`}`
        : "Training stopped.",
    );
  };

  const runInfer = () => {
    if (dataset.kind === "text") {
      const extra = prompt.trim().split(/\s+/).filter(Boolean);
      const tokens = extra.length ? extra : dataset.tokens;
      const xs = encodeTextInputs(tokens, vocab);
      const pred = inferNext(xs, weights, activation, "text", vocab);
      setInferText(`${tokens.join(" ")} → ${pred.token} (${(pred.probability * 100).toFixed(0)}%)`);
      return;
    }
    const pred = inferNext(packed.view, weights, activation, "series");
    setInferText(`Next ${dataset.featureNames[0]} ≈ ${denorm(pred.value, dataset.values).toFixed(2)}`);
  };

  const tokens = dataset.kind === "text" ? dataset.tokens : dataset.values.map((value) => value.toFixed(1));

  return (
    <div className="rnn-lab">
      <PageHeader
        title="Recurrent Neural Network"
        subtitle="Load a real sequence, edit it, train a vanilla RNN with BPTT, then watch hidden state, decay, and next-step inference update live."
        badge="Advanced"
        category="Deep Learning"
        icon={<Repeat size={22} />}
        showAlgorithmIntro={false}
        showAlgorithmTools={false}
      />
      <nav className="rnn-tabs" role="tablist" aria-label="RNN lab tabs">
        {LAB_TABS.map((name) => (
          <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </nav>
      <div className="rnn-strip">
        <span>
          Dataset <b>{dataset.name}</b>
        </span>
        <span>
          Steps <b>{tokens.length}</b>
        </span>
        <span>
          Hidden <b>{hiddenSize}</b>
        </span>
        <span className={trained ? "rnn-status" : "rnn-status stale"}>{status}</span>
      </div>

      {isLabTab(tab, "Learn") && (
        <div className="rnn-grid">
          <LabLessonPanel tab="Learn" route={ROUTE} />
          <article className="rnn-card">
            <h2>The notebook through time</h2>
            <p>
              A vanilla RNN reads one step, writes a hidden state, and hands that notebook to the next step. Same
              weights every time.
            </p>
            <Formula value="h_t = \tanh(W_{xh}x_t + W_{hh}h_{t-1} + b_h)" block />
            <p>Next-step output is a linear read of that hidden state. For words we softmax over the vocabulary; for numbers we regress the next value.</p>
          </article>
          <article className="rnn-card">
            <h3>Why long stories fade</h3>
            <p>
              Backprop multiplies W_hh at every lag. If those singular values sit below 1, early gradients vanish. That
              is the Information Decay chart on Visualize — it is this dataset's hidden-state cosine, not decoration.
            </p>
            <p>Open Dataset, pick Daily temperature, train, then check Metrics. Shuffle the series and the model should get worse if it actually used order.</p>
          </article>
        </div>
      )}

      {isLabTab(tab, "Visualize") && (
        <div className="rnn-grid">
          <article className="rnn-card">
            <header style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h2>Unrolled on {dataset.name}</h2>
                <p>Each cell shares W_hh. Click a step or play to walk the current sequence.</p>
              </div>
              <div className="rnn-actions">
                <button type="button" onClick={() => setPlaying((value) => !value)}>
                  <Play size={14} /> {playing ? "Pause" : "Play"}
                </button>
              </div>
            </header>
            <div className="rnn-unroll">
              {tokens.map((token, index) => (
                <button
                  type="button"
                  key={`${token}-${index}`}
                  className={`rnn-cell${index === visibleStep ? " on" : ""}`}
                  onClick={() => setStep(index)}
                >
                  <b>t={index}</b>
                  <strong>{token}</strong>
                  <i>
                    ŷ {dataset.kind === "text"
                      ? result.predictions[index]?.token
                      : denorm(result.predictions[index]?.value ?? 0, dataset.values).toFixed(1)}
                  </i>
                </button>
              ))}
            </div>
          </article>
          <div className="rnn-charts">
            <article className="rnn-card">
              <h3>Hidden trajectories</h3>
              <p>First three units of h_t on this dataset.</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={hiddenChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="h0" stroke="#2563eb" dot={false} />
                  <Line type="monotone" dataKey="h1" stroke="#059669" dot={false} />
                  <Line type="monotone" dataKey="h2" stroke="#d97706" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </article>
            <article className="rnn-card">
              <h3>Gradient flow</h3>
              <p>BPTT gradient norm walking backward from the last step.</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={gradientChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="g" stroke="#dc2626" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </article>
            <article className="rnn-card">
              <h3>Information decay</h3>
              <p>How much each past hidden state still matches the latest h_T.</p>
              {result.decay.map((value, index) => (
                <label className="rnn-bar" key={index}>
                  t={index}
                  <span>
                    <i style={{ width: `${Math.max(4, value * 100)}%` }} />
                  </span>
                  {value.toFixed(2)}
                </label>
              ))}
            </article>
          </div>
          {dataset.kind === "series" && (
            <article className="rnn-card">
              <h3>Live series vs prediction</h3>
              <p>Actual values and the RNN readout after the current weights (train to tighten the fit).</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={seriesChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" hide={seriesChart.length > 16} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="actual" stroke="#0f172a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="predicted" stroke="#2563eb" strokeDasharray="4 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </article>
          )}
        </div>
      )}

      {isLabTab(tab, "Dataset") && (
        <div className="rnn-grid two">
          <article className="rnn-card">
            <h2>RNN sequence library</h2>
            <p>Seven sequences built for recurrence: next-token text plus weather, traffic, sales, demand, and machine load.</p>
            <div className="rnn-data-grid">
              {RNN_DATASETS.map((sample) => (
                <button
                  type="button"
                  key={sample.id}
                  className={dataset.id.startsWith(sample.id) ? "on" : ""}
                  onClick={() => loadDataset(sample)}
                >
                  <b>{sample.name}</b>
                  <small>
                    {sample.kind} · {sample.kind === "text" ? sample.tokens.length : sample.values.length} steps
                  </small>
                  <em>{sample.blurb}</em>
                </button>
              ))}
            </div>
            <label className="rnn-actions" style={{ marginTop: 12 }}>
              <Upload size={14} /> Upload CSV / TXT / JSON
              <input type="file" accept=".csv,.txt,.json" onChange={upload} />
            </label>
          </article>
          <article className="rnn-card">
            <h3>Edit this dataset</h3>
            {dataset.kind === "text" ? (
              <>
                <p>Tokens are space-separated. Change the rhyme, then apply.</p>
                <textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
                <div className="rnn-actions">
                  <button type="button" onClick={applyTextDraft}>
                    Apply tokens
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Click a cell to edit the live series used for train / visualize / infer.</p>
                <table className="rnn-table">
                  <thead>
                    <tr>
                      <th>t</th>
                      <th>{dataset.featureNames[0]}</th>
                      {dataset.featureNames[1] && <th>{dataset.featureNames[1]}</th>}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.values.map((value, index) => (
                      <tr key={index} className={index === visibleStep ? "on" : ""} onClick={() => setStep(index)}>
                        <td>{dataset.labels[index] ?? index}</td>
                        <td>
                          <input
                            type="number"
                            value={value}
                            onChange={(event) => editValue(index, Number(event.target.value))}
                          />
                        </td>
                        {dataset.featureNames[1] && <td>{dataset.extras[index]?.toFixed?.(2) ?? "—"}</td>}
                        <td>
                          <button type="button" onClick={() => removeRow(index)}>
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rnn-actions">
                  <button type="button" className="ghost" onClick={addRow}>
                    Add step
                  </button>
                </div>
              </>
            )}
          </article>
        </div>
      )}

      {isLabTab(tab, "Build / Train") && (
        <div className="rnn-grid two">
          <article className="rnn-card">
            <h2>Build / train</h2>
            <p>Vanilla RNN, shared weights, real BPTT on the dataset in Dataset. Charts update every epoch.</p>
            <label>
              Hidden size {hiddenSize}
              <input
                type="range"
                min={4}
                max={16}
                value={hiddenSize}
                onChange={(event) => {
                  setHiddenSize(Number(event.target.value));
                  rebuildWeights();
                }}
              />
            </label>
            <label>
              Activation
              <select value={activation} onChange={(event) => setActivation(event.target.value as RNNActivation)}>
                <option value="tanh">tanh</option>
                <option value="relu">ReLU</option>
                <option value="sigmoid">sigmoid</option>
              </select>
            </label>
            <label>
              Init
              <select
                value={init}
                onChange={(event) => {
                  setInit(event.target.value as RNNWeightInit);
                  rebuildWeights();
                }}
              >
                <option value="orthogonal">Orthogonal W_hh</option>
                <option value="xavier">Xavier</option>
                <option value="small">Small random</option>
              </select>
            </label>
            <label>
              Epochs {epochs}
              <input type="range" min={6} max={60} value={epochs} onChange={(event) => setEpochs(Number(event.target.value))} />
            </label>
            <label>
              Learning rate {learningRate.toFixed(2)}
              <input
                type="range"
                min={0.01}
                max={0.2}
                step={0.01}
                value={learningRate}
                onChange={(event) => setLearningRate(Number(event.target.value))}
              />
            </label>
            <label>
              State noise {noise.toFixed(2)}
              <input
                type="range"
                min={0}
                max={0.4}
                step={0.05}
                value={noise}
                onChange={(event) => setNoise(Number(event.target.value))}
              />
            </label>
            <div className="rnn-actions">
              <button type="button" className="rnn-train" disabled={training} onClick={() => void train()}>
                {training ? "Training…" : "Train live"}
              </button>
              <button type="button" className="ghost" onClick={rebuildWeights}>
                <RotateCcw size={14} /> Reset weights
              </button>
            </div>
          </article>
          <article className="rnn-card">
            <h3>Live loss</h3>
            <p className="rnn-metric">
              {latest ? (dataset.kind === "text" ? `${(latest.accuracy * 100).toFixed(0)}% next-token` : latest.mae.toFixed(3) + " MAE") : "—"}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="epoch" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="loss" stroke="#2563eb" dot={false} />
                {dataset.kind === "series" ? (
                  <Line type="monotone" dataKey="mae" stroke="#d97706" dot={false} />
                ) : (
                  <Line type="monotone" dataKey="accuracy" stroke="#059669" dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
            <h3>Live inference</h3>
            {dataset.kind === "text" ? (
              <label>
                Prompt (blank = current sequence)
                <input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={dataset.tokens.slice(0, 6).join(" ")} />
              </label>
            ) : (
              <p>Predicts the next {dataset.featureNames[0]} from the edited series.</p>
            )}
            <div className="rnn-actions">
              <button type="button" onClick={runInfer}>
                Infer next
              </button>
            </div>
            {inferText ? <p><b>{inferText}</b></p> : null}
          </article>
        </div>
      )}

      {isLabTab(tab, "Metrics") && (
        <div className="rnn-grid three">
          <article className="rnn-card">
            <h3>Fit on this dataset</h3>
            <p className="rnn-metric">{result.loss.toFixed(3)}</p>
            <small>Mean train loss (CE for text, MSE for series)</small>
          </article>
          <article className="rnn-card">
            <h3>{dataset.kind === "text" ? "Next-token accuracy" : "Normalized MAE"}</h3>
            <p className="rnn-metric">
              {dataset.kind === "text" ? `${(result.accuracy * 100).toFixed(0)}%` : result.mae.toFixed(3)}
            </p>
            <small>Teacher-forced readout of the current weights.</small>
          </article>
          <article className="rnn-card">
            <h3>Last gradient norm</h3>
            <p className="rnn-metric">{(result.gradientNorms.at(-1) ?? 0).toFixed(4)}</p>
            <small>If this collapses while the sequence is long, you are seeing vanishing gradients.</small>
          </article>
          <article className="rnn-card" style={{ gridColumn: "1 / -1" }}>
            <h3>Per-step readout</h3>
            <table className="rnn-table">
              <thead>
                <tr>
                  <th>t</th>
                  <th>input</th>
                  <th>prediction</th>
                  <th>h₀</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token, index) => (
                  <tr key={index} className={index === visibleStep ? "on" : ""}>
                    <td>{index}</td>
                    <td>{token}</td>
                    <td>
                      {dataset.kind === "text"
                        ? result.predictions[index]?.token
                        : denorm(result.predictions[index]?.value ?? 0, dataset.values).toFixed(2)}
                    </td>
                    <td>{(result.states[index + 1]?.[0] ?? 0).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </div>
      )}

      {isLabTab(tab, "Compare") && (
        <div className="rnn-grid three">
          <article className="rnn-card">
            <h3>Trained order</h3>
            <p className="rnn-metric">{dataset.kind === "series" ? result.mae.toFixed(3) : `${(result.accuracy * 100).toFixed(0)}%`}</p>
            <small>True chronological sequence.</small>
          </article>
          <article className="rnn-card">
            <h3>Shuffled order</h3>
            <p className="rnn-metric">{dataset.kind === "series" ? shuffledMae.toFixed(3) : "n/a"}</p>
            <small>Same weights, scrambled time. A real RNN should do worse here.</small>
          </article>
          <article className="rnn-card">
            <h3>Persistence baseline</h3>
            <p className="rnn-metric">{dataset.kind === "series" ? persistMae.toFixed(3) : "n/a"}</p>
            <small>Predict last value. Beat this or you did not learn recurrence.</small>
          </article>
          <article className="rnn-card" style={{ gridColumn: "1 / -1" }}>
            <h3>When to leave vanilla RNN</h3>
            <p>
              If Information Decay on Visualize is already near zero by lag 6, LSTM/GRU gates are the next lab. This page
              stays a plain Elman RNN on purpose so that failure mode is visible.
            </p>
          </article>
        </div>
      )}

      {isLabTab(tab, "Explain") && (
        <div className="rnn-grid">
          <article className="rnn-card">
            <h2>What this model is doing at t={visibleStep}</h2>
            <p>
              Input <b>{tokens[visibleStep]}</b> updates h_t. The first hidden unit is{" "}
              <b>{(result.states[visibleStep + 1]?.[0] ?? 0).toFixed(3)}</b>. Predicted next is{" "}
              <b>
                {dataset.kind === "text"
                  ? result.predictions[visibleStep]?.token
                  : denorm(result.predictions[visibleStep]?.value ?? 0, dataset.values).toFixed(2)}
              </b>
              .
            </p>
            <p>
              Gradient at the earliest lag is {(result.gradientNorms.at(-1) ?? 0).toFixed(4)}. Decay at the first step is{" "}
              {(result.decay[0] ?? 0).toFixed(2)}. If both are tiny, the notebook forgot the start of {dataset.name}.
            </p>
          </article>
          <article className="rnn-card">
            <h3>How to read a good run</h3>
            <p>1. Dataset tab: pick a real series and edit a spike. 2. Train until loss drops. 3. Visualize: predicted line should chase the spike. 4. Compare: shuffled MAE should rise.</p>
            <p>Text runs are next-token only inside this vocabulary. A token you never trained on maps to the first vocab slot.</p>
          </article>
        </div>
      )}
    </div>
  );
}
