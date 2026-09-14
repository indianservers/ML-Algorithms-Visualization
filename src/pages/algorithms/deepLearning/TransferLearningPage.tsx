import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Database, Play, RotateCcw, Upload } from "lucide-react";
import { runTransferLearning } from "../../../lib/algorithms/neural/transferLearning";
import "./TransferLearningPage.css";

const datasets = [
  { name: "Oxford Flowers 102", icon: "🌼", images: 8189, classes: 102 },
  { name: "Stanford Dogs", icon: "🐕", images: 20580, classes: 120 },
  { name: "Food-101", icon: "🍜", images: 101000, classes: 101 },
];
const backbones = [
  { name: "ResNet-50", params: "23.6M", source: "ImageNet (1.2M images)" },
  { name: "MobileNetV3", params: "5.4M", source: "ImageNet (1.2M images)" },
  { name: "EfficientNet-B0", params: "5.3M", source: "ImageNet (1.2M images)" },
];
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export default function TransferLearningPage() {
  const [dataset, setDataset] = useState(0),
    [backbone, setBackbone] = useState(0),
    [blocks, setBlocks] = useState(2),
    [learningRate, setLearningRate] = useState(0.0001),
    [optimizer, setOptimizer] = useState("AdamW"),
    [batch, setBatch] = useState(32),
    [epochs, setEpochs] = useState(25),
    [earlyStopping, setEarlyStopping] = useState(true),
    [patience, setPatience] = useState(5),
    [run, setRun] = useState(1),
    [trained, setTrained] = useState(true),
    [message, setMessage] = useState("Run completed"),
    [activeTab, setActiveTab] = useState("Learn");
  const uploadRef = useRef<HTMLInputElement>(null);
  const data = datasets[dataset];
  const result = useMemo(
    () =>
      runTransferLearning({
        classes: Math.min(12, data.classes),
        samplesPerClass: Math.max(
          8,
          Math.round(data.images / data.classes / 8),
        ),
        epochs,
        learningRate,
        trainableBlocks: blocks,
        seed: 113 + dataset * 19 + backbone * 7 + run,
      }),
    [data, epochs, learningRate, blocks, dataset, backbone, run],
  );
  const history = result.history;
  const maxLoss = Math.max(...history.map((x) => x.validationLoss), 0.01);
  const line = (key: "trainLoss" | "validationLoss") =>
    history
      .map(
        (x, i) =>
          `${i ? "L" : "M"}${22 + (i / Math.max(1, history.length - 1)) * 185},${82 - (x[key] / maxLoss) * 62}`,
      )
      .join(" ");
  const reset = () => {
    setDataset(0);
    setBackbone(0);
    setBlocks(2);
    setLearningRate(0.0001);
    setOptimizer("AdamW");
    setBatch(32);
    setEpochs(25);
    setEarlyStopping(true);
    setPatience(5);
    setRun(1);
    setTrained(true);
    setMessage("Defaults restored");
  };
  const train = () => {
    setRun((value) => value + 1);
    setTrained(true);
    setMessage(`Fine-tuning complete · ${epochs} epochs`);
  };
  const upload = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    const rows = text.trim().split(/\r?\n/).length - 1;
    setMessage(`${file.name} loaded · ${Math.max(0, rows)} rows`);
    setTrained(false);
  };

  return (
    <div className="transfer-page">
      <aside className="transfer-side">
        <Link to="/">
          ◉ <b>Mega ML</b>
          <small>AI Observatory</small>
        </Link>
        <button>⌂ Home</button>
        <h4>EXPERIMENTS</h4>
        {["▦ Overview", "◇ Runs", "◇ Models", "▤ Datasets"].map((x) => (
          <button key={x}>{x}</button>
        ))}
        <h4>LEARN</h4>
        <button className="active">◎ Algorithms</button>
        <button>▣ Tutorials</button>
        <button>▱ Playground</button>
        <h4>DEPLOY</h4>
        {["⊕ Deployments", "⊕ Endpoints", "◉ Monitor"].map((x) => (
          <button key={x}>{x}</button>
        ))}
        <h4>ADMIN</h4>
        <button>⚙ Settings</button>
        <button>♙ Users</button>
        <section>
          ❄ AI Observatory
          <br />
          <span>◉ Pro</span>
        </section>
        <footer>? ♧ ♙ ●</footer>
      </aside>
      <header className="transfer-head">
        <div className="title-icon">▱</div>
        <h1>Transfer Learning</h1>
        <p>
          Leverage a pretrained model and fine-tune it on your target dataset.
        </p>
        <div className="head-actions">
          <button>Dataset⌄</button>
          <select
            aria-label="Dataset"
            value={dataset}
            onChange={(e) => {
              setDataset(Number(e.target.value));
              setTrained(false);
              setMessage("Dataset connected");
            }}
          >
            {datasets.map((x, i) => (
              <option value={i} key={x.name}>
                {x.icon} {x.name}
              </option>
            ))}
          </select>
          <button onClick={() => uploadRef.current?.click()}>
            <Upload /> Upload Dataset
          </button>
          <button onClick={() => setMessage("Documentation opened")}>
            <BookOpen /> Docs
          </button>
          <input
            ref={uploadRef}
            type="file"
            accept=".csv,.json"
            onChange={(e) => upload(e.target.files?.[0])}
            hidden
          />
        </div>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Transform",
            "Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((x) => (
            <button
              className={activeTab === x ? "active" : ""}
              onClick={() => {
                setActiveTab(x);
                setMessage(`${x} selected`);
              }}
              key={x}
            >
              {x}
            </button>
          ))}
        </nav>
      </header>
      <main>
        <section className="transfer-objective panel">
          <i>♙</i>
          <div>
            <small>OBJECTIVE</small>
            <p>
              Adapt a model pretrained on a large source dataset to perform well
              on your target dataset with less data and training.
            </p>
            <button>Learn more →</button>
          </div>
        </section>
        <section className="transfer-progress panel">
          <small>PROGRESS</small>
          <div>
            <b>① Select Backbone ✓</b>
            <b>② Connect Data ✓</b>
            <b className="active">③ Configure & Train</b>
            <b className={trained ? "done" : ""}>④ Evaluate</b>
          </div>
        </section>
        <section className="transfer-time panel">
          <i>◷</i>
          <div>
            <small>ESTIMATED TIME</small>
            <b>~ 8–15 min</b>
            <p>Depending on dataset & settings</p>
          </div>
        </section>
        <section className="architecture panel">
          <h3>Model Architecture ⓘ</h3>
          <label>
            Backbone
            <select
              aria-label="Backbone"
              value={backbone}
              onChange={(e) => {
                setBackbone(Number(e.target.value));
                setTrained(false);
              }}
            >
              {backbones.map((x, i) => (
                <option value={i} key={x.name}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <div className="backbone">
            <i>❄</i>
            <b>{backbones[backbone].name}</b>
            <span>Pretrained</span>
            <small>{backbones[backbone].source}</small>
          </div>
          <div className="architecture-flow">
            <div className="frozen">
              <b>FROZEN (Feature Extractor) 🔒</b>
              <section>
                {["Conv1", "Stage 1", "Stage 2", "Stage 3", "Stage 4"].map(
                  (x) => (
                    <i key={x}>{x}</i>
                  ),
                )}
              </section>
            </div>
            <em>→</em>
            <div className="trainable">
              <b>TRAINABLE (Task Adaptation) 🔥</b>
              <section>
                <i>
                  Global
                  <br />
                  Avg Pool
                </i>
                <i>
                  Dropout
                  <br />
                  (0.3)
                </i>
                <i>
                  FC
                  <br />({data.classes})
                </i>
              </section>
            </div>
          </div>
          <footer>
            <span>
              ■ Frozen Layer
              <br />
              <small>Weights not updated</small>
            </span>
            <span>
              ■ Trainable Layer
              <br />
              <small>Weights updated</small>
            </span>
            <span>🔒 Frozen · 🔥 Trainable</span>
          </footer>
        </section>
        <section className="training panel">
          <h3>Training Controls</h3>
          <label>
            Trainable Layers
            <select
              aria-label="Trainable Layers"
              value={blocks}
              onChange={(e) => {
                setBlocks(Number(e.target.value));
                setTrained(false);
              }}
            >
              <option value="0">Classifier Head Only</option>
              <option value="1">Last Block + Head</option>
              <option value="2">Last 2 Blocks + Head</option>
              <option value="4">All Blocks</option>
            </select>
          </label>
          <label>
            Learning Rate{" "}
            <input
              aria-label="Learning Rate"
              type="range"
              min="0.00001"
              max="0.001"
              step="0.00001"
              value={learningRate}
              onChange={(e) => {
                setLearningRate(Number(e.target.value));
                setTrained(false);
              }}
            />
            <span>{learningRate.toExponential(0)}</span>
          </label>
          <label>
            Optimizer
            <select
              aria-label="Optimizer"
              value={optimizer}
              onChange={(e) => {
                setOptimizer(e.target.value);
                setTrained(false);
              }}
            >
              <option>AdamW</option>
              <option>Adam</option>
              <option>SGD + Momentum</option>
            </select>
          </label>
          <div>
            <label>
              Batch Size
              <input
                aria-label="Batch Size"
                type="number"
                min="8"
                max="128"
                value={batch}
                onChange={(e) => setBatch(Number(e.target.value))}
              />
            </label>
            <label>
              Epochs
              <input
                aria-label="Epochs"
                type="number"
                min="1"
                max="100"
                value={epochs}
                onChange={(e) => {
                  setEpochs(Number(e.target.value));
                  setTrained(false);
                }}
              />
            </label>
          </div>
          <div>
            <label>
              Early Stopping
              <input
                aria-label="Early Stopping"
                type="checkbox"
                checked={earlyStopping}
                onChange={(e) => setEarlyStopping(e.target.checked)}
              />
            </label>
            <label>
              Patience
              <input
                aria-label="Patience"
                type="number"
                min="1"
                max="20"
                value={patience}
                onChange={(e) => setPatience(Number(e.target.value))}
              />
            </label>
          </div>
          <button className="train-button" onClick={train}>
            <Play /> Start Fine-Tuning
          </button>
          <button onClick={reset}>
            <RotateCcw /> Reset to Defaults
          </button>
        </section>
        <section className="comparison panel">
          <h3>Before vs After Fine-Tuning</h3>
          <div className="metric">
            <small>Top-1 Accuracy (Test)</small>
            <p>
              BEFORE <b>{formatPercent(result.beforeAccuracy)}</b>
            </p>
            <p>
              AFTER <b>{formatPercent(result.afterAccuracy)}</b>
            </p>
            <strong>
              +
              {((result.afterAccuracy - result.beforeAccuracy) * 100).toFixed(
                1,
              )}{" "}
              pp
            </strong>
          </div>
          <div className="metric">
            <small>Top-5 Accuracy (Test)</small>
            <p>
              BEFORE <b>{formatPercent(result.beforeTop5)}</b>
            </p>
            <p>
              AFTER <b>{formatPercent(result.afterTop5)}</b>
            </p>
            <strong>
              +{((result.afterTop5 - result.beforeTop5) * 100).toFixed(1)} pp
            </strong>
          </div>
          <div className="loss">
            <small>Validation Loss</small>
            <svg
              viewBox="0 0 230 92"
              role="img"
              aria-label="Training and validation loss"
            >
              <path d={line("validationLoss")} />
              <path className="after" d={line("trainLoss")} />
            </svg>
          </div>
        </section>
        <section className="insights panel">
          <h3>Insights</h3>
          <div>
            <p>
              ❄ Frozen layers preserve generic visual features learned from
              ImageNet.
            </p>
            <p>
              🔥 Fine-tuning the last blocks and head adapts features to{" "}
              {data.name}.
            </p>
            <p>▱ Large accuracy gains with minimal data and compute.</p>
            <p>💡 Try unfreezing more layers if the gap plateaus.</p>
          </div>
        </section>
      </main>
      <aside className="transfer-right">
        <section className="panel flow">
          <h3>Dataset Flow</h3>
          <article>
            <small>Source Dataset (Pretraining)</small>
            <b>
              <Database /> ImageNet
            </b>
            <p>1.2M images • 1,000 classes</p>
          </article>
          <i>↓</i>
          <strong>♧ → Transfer Knowledge</strong>
          <i>↓</i>
          <article className="target">
            <small>Target Dataset (Fine-tuning)</small>
            <b>
              {data.icon} {data.name}
            </b>
            <p>
              {data.images.toLocaleString()} images • {data.classes} classes
            </p>
          </article>
          <i>↓</i>
          <div className="split">
            <b>Data Split (Target)</b>
            <figure />
            <p>
              <span>■ Train</span>{" "}
              {Math.round(data.images * 0.8).toLocaleString()} (80%)
              <br />
              <span>■ Val</span>{" "}
              {Math.round(data.images * 0.1).toLocaleString()} (10%)
              <br />
              <span>■ Test</span>{" "}
              {Math.floor(data.images * 0.1).toLocaleString()} (10%)
            </p>
          </div>
          <button onClick={() => setMessage("Dataset preparation opened")}>
            View / Prep Dataset →
          </button>
        </section>
        <section className="panel quick">
          <h3>Quick Actions</h3>
          {["Visualize Features →", "Compare Runs →", "Export Model →"].map(
            (x) => (
              <button onClick={() => setMessage(x.replace(" →", ""))} key={x}>
                {x}
              </button>
            ),
          )}
        </section>
      </aside>
      <footer className="transfer-status">
        Run:{" "}
        <b>
          TL_{data.name.replaceAll(" ", "")}_{String(run).padStart(2, "0")}
        </b>
        <span>{trained ? "COMPLETED" : "READY"}</span> Backbone:{" "}
        <b>{backbones[backbone].name}</b> · Trainable:{" "}
        <b>{blocks === 0 ? "Head Only" : `Last ${blocks} Blocks + Head`}</b> ·
        Epochs: <b>{result.stoppedAt}</b> · Best Val Acc:{" "}
        <b>{formatPercent(result.afterAccuracy)}</b>
        <em>{message}</em>
      </footer>
    </div>
  );
}
