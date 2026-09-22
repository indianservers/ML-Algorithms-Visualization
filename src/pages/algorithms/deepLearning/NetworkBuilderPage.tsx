import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  Eye,
  Play,
  Plus,
  RotateCcw,
  Save,
  Share2,
  Trash2,
} from "lucide-react";
import { LAB_TABS, LabLessonOrWork, useLabTabs } from "../../../components/common/LabTabs";
import {
  evaluateNetwork,
  MAX_NETWORK_LAYERS,
  type NetworkLayer,
} from "../../../lib/algorithms/neural/networkBuilder";
import "./NetworkBuilderPage.css";

const NetworkBuilderTensorFlowLab = lazy(
  () => import("./NetworkBuilderTensorFlowLab"),
);

const defaults: NetworkLayer[] = [
  { id: "input", type: "input", shape: [32, 32, 3] },
  {
    id: "conv1",
    type: "conv",
    filters: 32,
    kernel: 3,
    stride: 1,
    padding: "same",
    activation: "relu",
    bias: true,
  },
  { id: "bn1", type: "batchnorm" },
  { id: "pool1", type: "pool", size: 2, stride: 2 },
  {
    id: "conv2",
    type: "conv",
    filters: 64,
    kernel: 3,
    stride: 1,
    padding: "same",
    activation: "relu",
    bias: true,
  },
  { id: "pool2", type: "pool", size: 2, stride: 2 },
  {
    id: "conv3",
    type: "conv",
    filters: 128,
    kernel: 3,
    stride: 1,
    padding: "same",
    activation: "relu",
    bias: true,
  },
  { id: "gap", type: "globalavg" },
  { id: "drop", type: "dropout", rate: 0.2 },
  { id: "dense1", type: "dense", units: 128, activation: "relu", bias: true },
  { id: "output", type: "dense", units: 10, activation: "softmax", bias: true },
];
const datasets = [
  {
    name: "8×8 pattern images (TF lab)",
    shape: [8, 8, 1] as [number, number, number],
    classes: 2,
    count: "synthetic bars",
  },
  {
    name: "2D moons / XOR (dense sketch)",
    shape: [1, 1, 2] as [number, number, number],
    classes: 2,
    count: "tabular points",
  },
  {
    name: "Tiny 24×24 RGB sketch",
    shape: [24, 24, 3] as [number, number, number],
    classes: 5,
    count: "shape calculator only",
  },
];
const labels = ["✈", "🐦", "🚙", "🦌", "🐶", "🐸", "🐴", "⛵"];
const layerName = (l: NetworkLayer) =>
  l.type === "conv"
    ? "Conv2D"
    : l.type === "batchnorm"
      ? "BatchNorm2D"
      : l.type === "pool"
        ? "MaxPool2D"
        : l.type === "globalavg"
          ? "GlobalAvgPool2D"
          : l.type === "dropout"
            ? "Dropout"
            : l.type === "dense"
              ? "Dense"
              : "Input";
const shape = (v: number[]) => v.join("×");

export default function NetworkBuilderPage() {
  const { tab, setTab } = useLabTabs("Build / Train");
  const [advanced, setAdvanced] = useState(false),
    [layers, setLayers] = useState<NetworkLayer[]>(defaults),
    [selected, setSelected] = useState(defaults.length - 1),
    [dataset, setDataset] = useState(0),
    [zoom, setZoom] = useState(100),
    [toast, setToast] = useState("Auto-saved"),
    [preview, setPreview] = useState(false),
    [showCode, setShowCode] = useState(false);
  const evaluated = useMemo(() => evaluateNetwork(layers), [layers]);
  const active = evaluated[Math.min(selected, evaluated.length - 1)],
    total = evaluated.reduce((sum, x) => sum + x.parameters, 0),
    valid = evaluated.every((x) => x.valid);
  const replace = (next: NetworkLayer) =>
    setLayers((xs) => xs.map((x, i) => (i === selected ? next : x)));
  const loadDataset = (i: number) => {
    setDataset(i);
    setLayers((xs) =>
      xs.map((x) =>
        x.type === "input" ? { ...x, shape: datasets[i].shape } : x,
      ),
    );
    setToast(`${datasets[i].name} loaded`);
  };
  const add = (type: "conv" | "pool" | "dropout" | "dense") => {
    if (layers.length >= MAX_NETWORK_LAYERS) {
      setToast(`Layer cap ${MAX_NETWORK_LAYERS} reached`);
      return;
    }
    const id = `${type}-${Date.now()}`;
    const next: NetworkLayer =
      type === "conv"
        ? {
            id,
            type,
            filters: 32,
            kernel: 3,
            stride: 1,
            padding: "same",
            activation: "relu",
            bias: true,
          }
        : type === "pool"
          ? { id, type, size: 2, stride: 2 }
          : type === "dropout"
            ? { id, type, rate: 0.2 }
            : { id, type, units: 64, activation: "relu", bias: true };
    setLayers((xs) => [...xs.slice(0, -1), next, xs.at(-1)!]);
    setSelected(layers.length - 1);
    setToast(`${layerName(next)} added`);
  };
  if (advanced)
    return (
      <div className="builder-advanced">
        <button onClick={() => setAdvanced(false)}>
          ← Return to CNN Builder
        </button>
        <Suspense fallback={<p>Loading TensorFlow.js lab…</p>}>
          <NetworkBuilderTensorFlowLab />
        </Suspense>
      </div>
    );
  return (
    <div className="builder-page">
      <aside className="builder-side">
        <Link to="/">
          ◇ <b>Mega ML</b>
          <small>AI OBSERVATORY</small>
        </Link>
        <p>MM ◇</p>
        {[
          "⌂ Home",
          "⌘ Workspaces",
          "▣ Lessons",
          "♧ Playground",
          "▤ Datasets",
          "⌂ Upload",
          "◇ Model Zoo",
          "▱ My Models",
          "⚗ Experiments",
          "▣ Notebooks",
        ].map((x) => (
          <button onClick={() => setToast(x)} key={x}>
            {x}
          </button>
        ))}
        <button className="settings">⚙ Settings</button>
        <button>? Help</button>
      </aside>
      <header className="builder-head">
        <h1>Network Builder ⓘ</h1>
        <p>Design, validate and train neural architectures visually.</p>
        <div>
          <span>✓ {toast}</span>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
          <button
            onClick={() =>
              setToast(
                "In-memory architecture only — use the TF.js lab to export weights.",
              )
            }
          >
            <Save /> Export Model
          </button>
        </div>
        <nav role="tablist" aria-label="Network builder sections">
          {LAB_TABS.map((name) => (
            <button
              role="tab"
              aria-selected={tab === name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
              key={name}
            >
              {name}
            </button>
          ))}
        </nav>
      </header>
      <LabLessonOrWork tab={tab} route="/ml/deep-learning/network-builder">
      <aside className="builder-dataset panel">
        <h3>Sample Dataset</h3>
        <section>
          <label>
            {datasets[dataset].name}
            <select
              value={dataset}
              onChange={(e) => loadDataset(Number(e.target.value))}
            >
              {datasets.map((x, i) => (
                <option value={i} key={x.name}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <p>
            {datasets[dataset].count} • {datasets[dataset].classes} classes
          </p>
          <div>
            {labels.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </section>
        <button onClick={() => loadDataset((dataset + 1) % datasets.length)}>
          Switch Dataset
        </button>
        <button onClick={() => setAdvanced(true)}>
          ◉ Upload Custom Dataset
        </button>
        <div className="drop-zone">
          Drop layers here
          <br />
          or click <button onClick={() => add("conv")}>+ Add Block</button>
        </div>
      </aside>
      <main>
        <section className="builder-toolbar">
          <b>
            ✓ INPUT
            <br />
            <small>{shape(datasets[dataset].shape)}</small>
          </b>
          <button onClick={() => add("conv")}>
            <Plus /> Add Block
          </button>
          <span>● Unsaved changes</span>
          <button
            aria-label="Reset architecture"
            onClick={() => {
              setLayers([...defaults]);
              setSelected(defaults.length - 1);
            }}
          >
            <RotateCcw />
          </button>
          <button disabled>↷</button>
          <button
            onClick={() =>
              setToast(valid ? "Architecture is valid" : "Shape mismatch found")
            }
          >
            ✓ Validate
          </button>
          <button onClick={() => setShowCode(!showCode)}>
            <Code2 /> Code
          </button>
          <button onClick={() => setPreview(!preview)}>
            <Eye /> Preview
          </button>
        </section>
        <section
          className="builder-canvas panel"
          style={{ fontSize: `${zoom / 100}em` }}
        >
          <div className="layers">
            {evaluated.map((x, i) => (
              <button
                className={`${i === selected ? "selected" : ""} ${x.valid ? "valid" : "invalid"}`}
                onClick={() => setSelected(i)}
                key={x.layer.id}
              >
                <header>
                  {layerName(x.layer)} <i>{x.valid ? "●" : "!"}</i>
                </header>
                <p>
                  {x.layer.type === "conv"
                    ? `${x.layer.filters} Filters · ${x.layer.kernel}×${x.layer.kernel}, ${x.layer.padding}`
                    : x.layer.type === "pool"
                      ? `${x.layer.size}×${x.layer.size}, stride ${x.layer.stride}`
                      : x.layer.type === "dense"
                        ? `${x.layer.units} Units · ${x.layer.activation}`
                        : x.layer.type === "dropout"
                          ? `Rate ${x.layer.rate}`
                          : x.layer.type === "batchnorm"
                            ? "Momentum 0.1"
                            : x.layer.type === "input"
                              ? "Image"
                              : "Spatial mean"}
                </p>
                <footer>{shape(x.output)}</footer>
              </button>
            ))}
          </div>
          {showCode && (
            <pre>
              {evaluated
                .map(
                  (x) => `${layerName(x.layer)}(${JSON.stringify(x.output)})`,
                )
                .join("\n")}
            </pre>
          )}
          {preview && (
            <div className="preview-overlay">
              Live preview: {valid ? "tensor flow valid" : "fix invalid shapes"}
            </div>
          )}
          <div className="canvas-tools">
            <button onClick={() => setZoom(Math.max(60, zoom - 10))}>−</button>
            <b>{zoom}%</b>
            <button onClick={() => setZoom(Math.min(140, zoom + 10))}>
              ＋
            </button>
            <button onClick={() => setZoom(100)}>⌗</button>
            <button onClick={() => setToast("Template browser opened")}>
              ▣ Templates
            </button>
            <button
              onClick={() => {
                setLayers([defaults[0], defaults.at(-1)!]);
                setSelected(1);
              }}
            >
              <Trash2 /> Clear All
            </button>
            <button onClick={() => setToast("Layout optimized")}>
              ⌗ Layout
            </button>
          </div>
        </section>
        <section className="builder-bottom">
          <article className="panel">
            <h3>Architecture Overview</h3>
            <div>
              {evaluated.map((x, i) => (
                <i className={x.valid ? "valid" : ""} key={i} />
              ))}
            </div>
            <p>{evaluated.length} layers</p>
          </article>
          <article className="panel">
            <h3>Tensor Shape Flow</h3>
            <div>
              {evaluated.map((x, i) => (
                <span key={i}>
                  {shape(x.output)} {x.valid ? "✓" : "!"}
                </span>
              ))}
            </div>
            <p>● Valid · ◉ Broadcast · ● Mismatch</p>
          </article>
          <article className="panel validation">
            <h3>Quick Validation</h3>
            <b>{valid ? "✓" : "!"}</b>
            <strong>{valid ? "All good!" : "Needs attention"}</strong>
            <p>
              Tensor shapes and connections are {valid ? "valid" : "invalid"}.
            </p>
            <button
              onClick={() =>
                setToast(
                  valid ? "Full check passed" : "Full check found errors",
                )
              }
            >
              Run Full Check
            </button>
          </article>
          <article className="panel inference">
            <h3>Preview</h3>
            <p>
              This canvas counts shapes and parameters. Class scores appear
              only after you train in the TensorFlow.js lab (not a placeholder
              softmax).
            </p>
            <button onClick={() => setAdvanced(true)}>
              Open TensorFlow.js Training Lab
            </button>
          </article>
        </section>
      </main>
      <aside className="builder-inspector">
        <section className="panel">
          <h3>Layer Inspector</h3>
          <label>
            <select
              value={selected}
              onChange={(e) => setSelected(Number(e.target.value))}
            >
              {layers.map((x, i) => (
                <option value={i} key={x.id}>
                  {layerName(x)} {i === layers.length - 1 ? "(Output)" : ""}
                </option>
              ))}
            </select>
            {active.layer.type !== "input" && (
              <button
                aria-label="Delete layer"
                onClick={() => {
                  setLayers((xs) => xs.filter((_, i) => i !== selected));
                  setSelected(Math.max(0, selected - 1));
                }}
              >
                <Trash2 />
              </button>
            )}
          </label>
          <h4>CONFIGURATION</h4>
          {active.layer.type === "dense" && (
            <div className="inspector-fields">
              <label>
                Units{" "}
                <input
                  type="number"
                  min="1"
                  max="512"
                  value={active.layer.units}
                  onChange={(e) =>
                    replace({
                      ...active.layer,
                      units: Number(e.target.value),
                    } as NetworkLayer)
                  }
                />
              </label>
              <label>
                Activation
                <select
                  value={active.layer.activation}
                  onChange={(e) =>
                    replace({
                      ...active.layer,
                      activation: e.target.value,
                    } as NetworkLayer)
                  }
                >
                  <option>relu</option>
                  <option>softmax</option>
                  <option>sigmoid</option>
                </select>
              </label>
              <label>
                Use Bias
                <input
                  type="checkbox"
                  checked={active.layer.bias}
                  onChange={(e) =>
                    replace({
                      ...active.layer,
                      bias: e.target.checked,
                    } as NetworkLayer)
                  }
                />
              </label>
            </div>
          )}
          {active.layer.type === "conv" && (
            <div className="inspector-fields">
              <label>
                Filters
                <input
                  type="number"
                  min="1"
                  max="256"
                  value={active.layer.filters}
                  onChange={(e) =>
                    replace({
                      ...active.layer,
                      filters: Number(e.target.value),
                    } as NetworkLayer)
                  }
                />
              </label>
              <label>
                Kernel
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={active.layer.kernel}
                  onChange={(e) =>
                    replace({
                      ...active.layer,
                      kernel: Number(e.target.value),
                    } as NetworkLayer)
                  }
                />
              </label>
              <label>
                Stride
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={active.layer.stride}
                  onChange={(e) =>
                    replace({
                      ...active.layer,
                      stride: Number(e.target.value),
                    } as NetworkLayer)
                  }
                />
              </label>
              <label>
                Padding
                <select
                  value={active.layer.padding}
                  onChange={(e) =>
                    replace({
                      ...active.layer,
                      padding: e.target.value as "same" | "valid",
                    } as NetworkLayer)
                  }
                >
                  <option>same</option>
                  <option>valid</option>
                </select>
              </label>
            </div>
          )}
          <h4>I/O SHAPE</h4>
          <p>
            Input <b>{shape(active.input)}</b> {active.valid ? "✓" : "!"}
          </p>
          <p>
            Output <b>{shape(active.output)}</b> {active.valid ? "✓" : "!"}
          </p>
          <h4>PARAMETERS</h4>
          <p>
            Layer <b>{active.parameters.toLocaleString()}</b>
          </p>
        </section>
        <section className="panel summary">
          <h3>MODEL SUMMARY</h3>
          <p>
            Total Layers <b>{layers.length}</b>
          </p>
          <p>
            Total Parameters <b>{total.toLocaleString()}</b>
          </p>
          <p>
            Trainable <b>{total.toLocaleString()}</b>
          </p>
          <p>
            Memory (FP32) <b>~{((total * 4) / 1e6).toFixed(1)} MB</b>
          </p>
        </section>
        <section className="panel train">
          <h3>Train</h3>
          <label>
            Device
            <select>
              <option>Auto (GPU)</option>
              <option>CPU</option>
            </select>
          </label>
          <button onClick={() => setAdvanced(true)}>
            <Play /> Train Model
          </button>
          <p>Advanced Settings⌄</p>
        </section>
      </aside>
      </LabLessonOrWork>
    </div>
  );
}
