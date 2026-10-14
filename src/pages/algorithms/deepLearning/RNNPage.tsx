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
import { RNNSequenceExplorer } from "./RNNSequenceExplorer";
import { DEEP_LEARNING_TABS, LabLessonPanel, isLabTab, useLabTabs } from "../../../components/common/LabTabs";
import { DeepLearningExtraPanel } from "../../../components/common/DeepLearningExtraPanel";
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
  const [speed, setSpeed] = useState(1000);
  const [beforeTraining, setBeforeTraining] = useState("");
  const [training, setTraining] = useState(false);
  const [trained, setTrained] = useState(false);
  const [modelDirty, setModelDirty] = useState(false);
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
    if (!weightsRef.current || weightsRef.current.Whh.length !== hiddenSize || weightsRef.current.Wxh[0]?.length !== inputSize || weightsRef.current.Why.length !== outputSize) {
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
        packed.ys,
      ),
    [packed, weights, activation, noise, dataset, vocab],
  );

  const maxStep = Math.max(0, (dataset.kind === "text" ? dataset.tokens.length : dataset.values.length) - 1);
  const visibleStep = Math.min(step, maxStep);
  const latest = history[history.length - 1];

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
      setStep(current => { if(current >= maxStep) {setPlaying(false); return maxStep;} return current+1; });
    }, speed);
    return () => window.clearInterval(timer);
  }, [playing, maxStep, speed]);
  useEffect(() => { if (isLabTab(tab, "Inference")) setTab("Build / Train"); }, [tab, setTab]);
  const comparison = useMemo(() => {
    const indices = Array.from({length:packed.view.length}, (_,i)=>i);
    for(let i=indices.length-1;i>0;i--) { const j=(i*17+5)%(i+1); [indices[i],indices[j]]=[indices[j]!,indices[i]!]; }
    const inputs=indices.map(i=>packed.view[i]!);
    const targets=indices.slice(1).map(i=>dataset.kind==='text'?vocab.indexOf(dataset.tokens[i]!):packed.view[i]?.[0]??0);
    return forwardRnn(inputs,weights,activation,noise,dataset.kind,vocab,targets);
  }, [packed,weights,activation,noise,dataset,vocab]);

  useEffect(
    () => () => {
      cancelRef.current = true;
    },
    [],
  );

  const rebuildWeights = () => {
    weightsRef.current = createRnnWeights(hiddenSize, inputSize, outputSize, init, 0);
    setHistory([]);
    setTrained(false); setModelDirty(true);
    setStatus("Weights reinitialized. Train to fit this dataset.");
  };

  const loadDataset = (sample: RnnLabDataset) => {
    setDataset(cloneDataset(sample));
    setStep(0);
    setBeforeTraining("");
    setPlaying(false);
    weightsRef.current = null;
    setHistory([]);
    setTrained(false); setModelDirty(true);
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
    setTrained(false); setModelDirty(true);
    setHistory([]);
    setStatus(`Edited text sequence · ${tokens.length} tokens. Train again.`);
  };

  const editValue = (index: number, next: number) => {
    setDataset((current) => {
      const values = [...current.values];
      values[index] = next;
      return { ...current, id: `${current.id.split("-edit")[0]}-edit`, values, tokens: values.map(String) };
    });
    setTrained(false); setModelDirty(true);
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
    setTrained(false); setModelDirty(true);
  };

  const removeRow = (index: number) => {
    setDataset((current) => {
      if (current.values.length <= 4) return current;
      const values = current.values.filter((_, i) => i !== index);
      const extras = current.extras.filter((_, i) => i !== index);
      const labels = current.labels.filter((_, i) => i !== index);
      return { ...current, values, extras, labels, tokens: values.map(String) };
    });
    setTrained(false); setModelDirty(true);
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
    setBeforeTraining(dataset.kind === "text" ? result.predictions[visibleStep]?.token ?? "" : denorm(result.predictions[visibleStep]?.value ?? 0, dataset.values).toFixed(2));
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
    setTrained(true); setModelDirty(false);
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
      const unknown = tokens.filter(token => !vocab.includes(token));
      if (unknown.length) {setInferText(`Unfamiliar tokens: ${[...new Set(unknown)].join(", ")}. Use words in the learned vocabulary.`); return;}
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
    <div className="rnn-lab" data-training-feedback="inline">
      <header className="rnn-compact-head"><Repeat size={22}/><h1>Recurrent Neural Network</h1><span>{training ? "Training" : trained ? "Trained" : modelDirty ? "Changes pending" : "Untrained"}</span></header>
      <nav className="rnn-tabs" role="tablist" aria-label="RNN lab tabs">
        {DEEP_LEARNING_TABS.filter(name => name !== "Inference").map((name) => (
          <button key={name} role="tab" disabled={training} aria-selected={tab === name} onClick={() => setTab(name)}>
            {name === "Build / Train" ? "Train and Test" : name}
          </button>
        ))}
      </nav>
      <DeepLearningExtraPanel tab={tab} route={ROUTE} />
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
              Backprop repeatedly applies recurrent weights and activation derivatives. Repeated shrinking can make early gradients tiny. That
              is the Hidden-state similarity chart on Visualize — it is this dataset's signed hidden-state cosine, not a direct measure of retained information.
            </p>
            <p>Open Dataset, pick Daily temperature, train, then check Metrics. Compare the original and shuffled sequence to explore sensitivity to order.</p>
          </article>
        </div>
      )}

      {isLabTab(tab, "Visualize") && <RNNSequenceExplorer dataset={dataset} result={result} step={visibleStep} setStep={setStep} playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} trained={trained} comparison={comparison} onDemo={() => {loadDataset(RNN_DATASETS[0]!);setSpeed(1800);setPlaying(true);}}/>}

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
            <h2>Train and Test</h2>
            <fieldset disabled={training}>
            <div className="rnn-actions">{[{name:"Quick demo",size:8,epochs:12},{name:"Small memory",size:4,epochs:24},{name:"Larger memory",size:16,epochs:36}].map(p => <button disabled={training} key={p.name} onClick={() => {setHiddenSize(p.size);setEpochs(p.epochs);setLearningRate(.08);weightsRef.current=null;setHistory([]);setTrained(false); setModelDirty(true);}}>{p.name}</button>)}</div>
            <p>Hidden size = number of memory features. Learning rate = size of each weight update. Activation shapes the memory values. Initialization sets the starting weights; orthogonal is a useful recurrent default.</p>
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
                  weightsRef.current=null; setHistory([]); setTrained(false); setModelDirty(true);
                }}
              />
            </label>
            <label>
              Activation
              <select value={activation} onChange={(event) => {setActivation(event.target.value as RNNActivation);setTrained(false);setModelDirty(true);setStatus("Activation changed. Train again.");}}>
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
                  weightsRef.current=null; setHistory([]); setTrained(false); setModelDirty(true);
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
                onChange={(event) => {setNoise(Number(event.target.value));setTrained(false);setModelDirty(true);}}
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
            </fieldset>
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
            {beforeTraining && <p>Before training at selected step: <b>{beforeTraining}</b> → Now: <b>{dataset.kind === "text" ? result.predictions[visibleStep]?.token : denorm(result.predictions[visibleStep]?.value ?? 0,dataset.values).toFixed(2)}</b></p>}
            <h3>Test the trained model</h3>
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
            <small>Final-state sensitivity propagated backward. A small norm alone does not measure retained information.</small>
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
            <p className="rnn-metric">{dataset.kind === "series" ? comparison.mae.toFixed(3) : `${(comparison.accuracy * 100).toFixed(0)}%`}</p>
            <small>Same weights, scrambled time. Compare the measured result; shuffling does not guarantee a worse score.</small>
          </article>
          <article className="rnn-card">
            <h3>Persistence baseline</h3>
            <p className="rnn-metric">{dataset.kind === "series" ? persistMae.toFixed(3) : "n/a"}</p>
            <small>Predict last value. Beat this or you did not learn recurrence.</small>
          </article>
          <article className="rnn-card" style={{ gridColumn: "1 / -1" }}>
            <h3>When to leave vanilla RNN</h3>
            <p>
              For long dependencies, compare vanilla RNN with LSTM/GRU; low similarity alone does not establish forgetting. This page
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
              {(result.decay[0] ?? 0).toFixed(2)}. These measure similarity and sensitivity; neither proves that the model forgot the sequence.
            </p>
          </article>
          <article className="rnn-card">
            <h3>How to read a good run</h3>
            <p>1. Dataset tab: pick a real series and edit a spike. 2. Train until loss drops. 3. Visualize: predicted line should chase the spike. 4. Compare: shuffled MAE should rise.</p>
            <p>Text runs are next-token only inside this vocabulary. Unfamiliar prompt tokens are flagged before inference.</p>
          </article>
        </div>
      )}
    </div>
  );
}
