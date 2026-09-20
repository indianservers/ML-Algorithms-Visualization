import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Share2, Sparkles, Upload } from "lucide-react";
import {
  trainAutoencoder,
  type AutoencoderArchitecture,
  type AutoencoderResult,
} from "../../../lib/algorithms/dimensionality/autoencoder";
import { getDimensionalityDataset } from "../../../lib/dimensionality/dimensionalityDatasets";
import "./AutoencoderDimensionalityPage.css";
import { LabLessonOrWork, labHide } from "../../../components/common/LabTabs";
type Sample = { pixels: number[]; label: number };
type Dataset = "digits" | "fashion" | "symbols" | "tabular" | "imported";
const COLORS = [
    "#ffc52f",
    "#8d52e8",
    "#bbc33b",
    "#35b46c",
    "#ef4065",
    "#50d1e2",
    "#d18a55",
    "#e75a97",
    "#8f69d9",
    "#3778e7",
  ],
  SEGMENTS: Record<number, string[]> = {
    0: ["t", "ul", "ur", "ll", "lr", "b"],
    1: ["ur", "lr"],
    2: ["t", "ur", "m", "ll", "b"],
    3: ["t", "ur", "m", "lr", "b"],
    4: ["ul", "ur", "m", "lr"],
    5: ["t", "ul", "m", "lr", "b"],
    6: ["t", "ul", "m", "ll", "lr", "b"],
    7: ["t", "ur", "lr"],
    8: ["t", "ul", "ur", "m", "ll", "lr", "b"],
    9: ["t", "ul", "ur", "m", "lr", "b"],
  },
  rand = (i: number, s: number) => {
    const v = Math.sin((i + 19) * 12.9898 + s * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
function digit(label: number, variant: number, style = 0) {
  const active = SEGMENTS[label],
    pixels: number[] = [];
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < 10; x++) {
      const segment =
        (active.includes("t") && y <= 1 && x > 1 && x < 8) ||
        (active.includes("m") && y >= 4 && y <= 5 && x > 1 && x < 8) ||
        (active.includes("b") && y >= 8 && x > 1 && x < 8) ||
        (active.includes("ul") && x <= 2 && y > 1 && y < 5) ||
        (active.includes("ur") && x >= 7 && y > 1 && y < 5) ||
        (active.includes("ll") && x <= 2 && y > 4 && y < 8) ||
        (active.includes("lr") && x >= 7 && y > 4 && y < 8);
      const base = segment ? 0.9 : 0;
      pixels.push(
        Math.max(
          0,
          Math.min(
            1,
            base + (rand(variant * 100 + y * 10 + x, style + 1) - 0.5) * 0.18,
          ),
        ),
      );
    }
  return pixels;
}
function makeData(style: number, n = 200): Sample[] {
  return Array.from({ length: n }, (_, i) => ({
    label: i % 10,
    pixels: digit(i % 10, i, style),
  }));
}
const noisy = getDimensionalityDataset("i-noisy-hd");
const BUILT = {
    digits: makeData(0),
    fashion: makeData(4),
    symbols: makeData(8),
    tabular: noisy.X.map((pixels, i) => ({ pixels, label: i % 3 })),
  },
  NAMES: Record<Dataset, string> = {
    digits: "Digit Glyphs",
    fashion: "Fashion-like Glyphs",
    symbols: "Symbol Grid",
    tabular: "Noisy high-D table (linear reconstruction)",
    imported: "Imported Data",
  };
function PixelImage({
  pixels,
  className = "",
}: {
  pixels: number[];
  className?: string;
}) {
  const side = Math.round(Math.sqrt(pixels.length));
  return (
    <div
      className={`ae-pixels ${className}`}
      style={{ gridTemplateColumns: `repeat(${side},1fr)` }}
    >
      {pixels.map((value, i) => (
        <i
          key={i}
          style={{
            background: `rgb(${Math.round(value * 255)} ${Math.round(value * 255)} ${Math.round(value * 255)})`,
          }}
        />
      ))}
    </div>
  );
}
export default function AutoencoderDimensionalityPage() {
  const [tab, setTab] = useState("Learn"),
    [dataset, setDataset] = useState<Dataset>("digits"),
    [samples, setSamples] = useState<Sample[]>(BUILT.digits),
    [imported, setImported] = useState<Sample[]>([]),
    [latentDimension, setLatentDimension] = useState(2),
    [noise, setNoise] = useState(0),
    [architecture, setArchitecture] =
      useState<AutoencoderArchitecture>("dense"),
    [learningRate, setLearningRate] = useState(0.001),
    [batchSize, setBatchSize] = useState(32),
    [epochs, setEpochs] = useState(12),
    [result, setResult] = useState<AutoencoderResult | null>(null),
    [training, setTraining] = useState(false),
    [progress, setProgress] = useState(0),
    [inspect, setInspect] = useState(0),
    [tfTensors, setTfTensors] = useState<number | null>(null),
    [status, setStatus] = useState<"NOT TRAINED" | "TRAINING" | "TRAINED" | "STALE" | "ERROR">("NOT TRAINED"),
    [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null),
    runId = useRef(0);
  const runTraining = useCallback(async () => {
    const id = ++runId.current;
    setTraining(true);
    setStatus("TRAINING");
    setProgress(0);
    try {
      const trained = await trainAutoencoder(
        samples.map((s) => s.pixels),
        latentDimension,
        noise,
        architecture,
        learningRate,
        batchSize,
        epochs,
        (epoch) => {
          if (id === runId.current) setProgress(epoch / epochs);
        },
        {
          outputActivation: dataset === "tabular" ? "linear" : "sigmoid",
          shouldStop: () => id !== runId.current,
        },
      );
      if (id === runId.current) {
        setResult(trained);
        setStatus("TRAINED");
        setToast("Autoencoder training complete");
      }
    } catch (error) {
      if (id === runId.current) {
        setStatus("ERROR");
        setToast(error instanceof Error ? error.message : "Training failed");
      }
    } finally {
      if (id === runId.current) setTraining(false);
    }
  }, [
    samples,
    latentDimension,
    noise,
    architecture,
    learningRate,
    batchSize,
    epochs,
    dataset,
  ]);
  useEffect(() => () => {
    runId.current += 1;
  }, []);
  const choose = (kind: Dataset) => {
      const next = kind === "imported" ? imported : BUILT[kind];
      if (!next.length) return;
      runId.current++;
      setDataset(kind);
      setSamples(next);
      setResult(null);
      setProgress(0);
      setToast(`${NAMES[kind]} loaded — train to update`);
      setStatus("STALE");
    },
    upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const rows = (await f.text())
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((r) => r.split(",").map(Number))
        .filter((r) => r.length >= 5 && r.every(Number.isFinite));
      if (rows.length < 2)
        return setToast("CSV needs pixel columns plus a label");
      const dimension = rows[0].length - 1,
        side = Math.sqrt(dimension);
      if (!Number.isInteger(side))
        return setToast("Pixel column count must form a square image");
      const next = rows.map((r) => ({
        pixels: r.slice(0, -1).map((v) => Math.max(0, Math.min(1, v))),
        label: r.at(-1) || 0,
      }));
      setImported(next);
      setDataset("imported");
      setSamples(next);
      setResult(null);
      setLatentDimension(Math.min(2, next.length));
      setToast(`Imported ${next.length} samples`);
      e.target.value = "";
    };
  const     reconstructions =
      result?.reconstructions || samples.map((s) => s.pixels),
    latent = result?.latent ?? [],
    coords = latent.flat().map(Math.abs),
    scale = Math.max(...coords, 1),
    mse = result?.mse ?? 0,
    psnr = mse > 0 ? 10 * Math.log10(1 / mse) : 0,
    imageSide = Math.round(Math.sqrt(samples[0].pixels.length)),
    sparsity =
      latent.flat().filter((v) => Math.abs(v) < 0.05).length /
      Math.max(1, latent.flat().length);
  return (
    <div className="ae-page">
      <aside className="ae-side">
        <Link to="/">
          ⌾{" "}
          <b>
            MEGA ML<small>AI OBSERVATORY</small>
          </b>
        </Link>
        {[
          "⌂ Home",
          "◉ Explore",
          "◇ Models",
          "▤ Datasets",
          "♧ Learn",
          "□ Projects",
          "▥ Benchmarks",
          "⌘ Playground",
        ].map((n) => (
          <button
            className={n.includes("Learn") ? "active" : ""}
            onClick={() => setToast(n)}
            key={n}
          >
            {n}
          </button>
        ))}
        <footer>
          <p>● All Systems Operational</p>
          <b>
            ◉ Observer<small>Pro Plan</small>
          </b>
        </footer>
      </aside>
      <header className="ae-head">
        <h1>Autoencoder □</h1>
        <p>
          Learn compact representations by reconstructing inputs through a
          bottleneck.
        </p>
        <button onClick={() => setToast("Explanation opened")}>
          ⓘ How Autoencoders Work
        </button>
        <div>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
          <button>☼</button>
          <select>
            <option>Starter</option>
            <option>Denoising</option>
          </select>
        </div>
      </header>
      <main>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Build / Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((n) => (
            <button
              className={tab === n ? "active" : ""}
              onClick={() => setTab(n)}
              key={n}
            >
              {n}
            </button>
          ))}
        </nav>
        <LabLessonOrWork tab={tab} route="/ml/dimensionality-reduction/autoencoder">
        <section className={`ae-pipeline${labHide(tab, "Visualize", "Train")}`}>
          <h4>MODEL PIPELINE</h4>
          <article>
            <b>Input</b>
            <small>
              {imageSide}×{imageSide}
            </small>
            <PixelImage pixels={samples[3].pixels} />
          </article>
          <strong>→</strong>
          <article className="encoder">
            <b>Encoder</b>
            <span>
              Dense ({architecture === "dense" ? 64 : 32})<br />
              ReLU
            </span>
          </article>
          <strong>→</strong>
          <article className="latent">
            <b>Latent Space</b>
            <small>
              z ∈ R<sup>{latentDimension}</sup>
            </small>
            <i />
            <i />
          </article>
          <strong>→</strong>
          <article className="decoder">
            <b>Decoder</b>
            <span>
              Dense ({architecture === "dense" ? 64 : 32})<br />
              ReLU
            </span>
          </article>
          <strong>→</strong>
          <article>
            <b>Reconstruction</b>
            <small>
              {imageSide}×{imageSide}
            </small>
            <PixelImage pixels={reconstructions[3]} />
          </article>
        </section>
        <section className={`ae-visuals${labHide(tab, "Visualize", "Train")}`}>
          <article>
            <h3>INPUT VS RECONSTRUCTION ⓘ</h3>
            <div className="ae-pairs">
              <b>Input</b>
              <b>Reconstruction</b>
              {samples.slice(0, 6).map((s, i) => (
                <div key={i}>
                  <PixelImage pixels={s.pixels} />
                  <PixelImage pixels={reconstructions[i]} />
                </div>
              ))}
            </div>
            <footer>
              MSE (avg) <b>{result ? mse.toFixed(4) : "Train model"}</b>
            </footer>
          </article>
          <article>
            <h3>LATENT SPACE (z) ⓘ</h3>
            <div className="ae-scatter">
              {latent.map((p, i) => (
                <i
                  key={i}
                  style={{
                    left: `${50 + ((p[0] || 0) / scale) * 42}%`,
                    top: `${50 - ((p[1] || 0) / scale) * 42}%`,
                    background: COLORS[samples[i].label % COLORS.length],
                  }}
                />
              ))}
            </div>
            <footer>Latent Dim: {latentDimension}</footer>
          </article>
          <article>
            <h3>LATENT TRAVERSAL ⓘ</h3>
            <select>
              <option>z₁ (horizontal)</option>
            </select>
            <div className="ae-traversal">
              {Array.from({ length: 4 }, (_, row) =>
                (
                  result?.traversal || samples.slice(0, 7).map((s) => s.pixels)
                ).map((pixels, i) => (
                  <PixelImage pixels={pixels} key={`${row}:${i}`} />
                )),
              )}
            </div>
            <footer>
              Vary one latent dimension while holding others fixed.
            </footer>
          </article>
        </section>
        <section className={`ae-results${labHide(tab, "Metrics")}`}>
          <article>
            <h3>RECONSTRUCTION QUALITY ⓘ</h3>
            {[
              ["MSE (avg)", mse.toFixed(4)],
              ["PSNR (dB)", psnr.toFixed(2)],
              ["Loss epochs", String(result?.losses.length || 0)],
              ["Sparsity (z)", sparsity.toFixed(2)],
            ].map(([n, v]) => (
              <div key={n}>
                <span>{n}</span>
                <b>{result ? v : "—"}</b>
              </div>
            ))}
          </article>
          <article>
            <h3>COMPRESSION ⓘ</h3>
            <p>
              Original Dim <b>{samples[0].pixels.length}</b> → Latent Dim{" "}
              <b>{latentDimension}</b>
              {" "}
              dimensional reduction{" "}
              <strong>
                {(((samples[0].pixels.length - latentDimension) / samples[0].pixels.length) * 100).toFixed(0)}%
              </strong>
              {" "}(not a file-size compression ratio)
            </p>
            {latentDimension >= samples[0].pixels.length && (
              <p>Latent space is not a compression bottleneck.</p>
            )}
            {result && (
              <div>
                <p>Sample {inspect} MSE {result.sampleErrors[inspect]?.toFixed(4)}</p>
                <input
                  type="range"
                  min={0}
                  max={samples.length - 1}
                  value={inspect}
                  onChange={(e) => setInspect(Number(e.target.value))}
                />
              </div>
            )}
          </article>
        </section>
        <footer>
          💡 TIP Try increasing latent dimensions to see richer representations,
          or add noise for denoising autoencoders.
        </footer>
        </LabLessonOrWork>
      </main>
      <aside className={`ae-controls${labHide(tab, "Train", "Transform", "Dataset", "Visualize")}`}>
        <section>
          <h3>DATASET ⓘ</h3>
          <select
            value={dataset}
            onChange={(e) => choose(e.target.value as Dataset)}
          >
            {Object.entries(NAMES)
              .filter(([k]) => k !== "imported" || imported.length)
              .map(([k, n]) => (
                <option value={k} key={k}>
                  {n}
                </option>
              ))}
          </select>
          <p>
            {samples.length} images · {imageSide}×{imageSide} ·{" "}
            {new Set(samples.map((s) => s.label)).size} classes
          </p>
          <button onClick={() => fileRef.current?.click()}>
            <Upload /> Upload Your Dataset
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
        </section>
        <section>
          <h3>MODEL CONTROLS ⓘ</h3>
          <label>
            Latent Dimension (dim(z)){" "}
            <input
              type="number"
              min="1"
              max="16"
              value={latentDimension}
              onChange={(e) => setLatentDimension(Number(e.target.value))}
            />
            <input
              aria-label="Latent dimension"
              type="range"
              min="1"
              max="16"
              value={latentDimension}
              onChange={(e) => setLatentDimension(Number(e.target.value))}
            />
          </label>
          <label>
            Noise Std Dev (σ){" "}
            <input
              type="number"
              min="0"
              max=".5"
              step=".01"
              value={noise}
              onChange={(e) => setNoise(Number(e.target.value))}
            />
            <input
              aria-label="Noise"
              type="range"
              min="0"
              max=".5"
              step=".01"
              value={noise}
              onChange={(e) => setNoise(Number(e.target.value))}
            />
          </label>
          <label>
            Architecture
            <select
              value={architecture}
              onChange={(e) =>
                setArchitecture(e.target.value as AutoencoderArchitecture)
              }
            >
              <option value="dense">Dense (MLP)</option>
              <option value="shallow">Shallow MLP</option>
            </select>
          </label>
        </section>
        <section>
          <h3>TRAINING CONTROLS ⓘ</h3>
          <label>
            Optimizer
            <select>
              <option>Adam</option>
            </select>
          </label>
          <label>
            Learning Rate
            <input
              type="number"
              min=".0001"
              max=".01"
              step=".0001"
              value={learningRate}
              onChange={(e) => setLearningRate(Number(e.target.value))}
            />
          </label>
          <label>
            Batch Size
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
            >
              <option>16</option>
              <option>32</option>
              <option>64</option>
            </select>
          </label>
          <label>
            Epochs
            <select
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
            >
              <option>4</option>
              <option>8</option>
              <option>12</option>
              <option>20</option>
            </select>
          </label>
          <button
            className="primary"
            disabled={training}
            onClick={() => void runTraining()}
          >
            <Sparkles /> {training ? "Training..." : "Train Model"}
          </button>
          <button
            disabled={!training}
            onClick={() => {
              runId.current++;
              setTraining(false);
              setToast("Training stopped");
            }}
          >
            ⊗ Stop
          </button>
          <button
            type="button"
            onClick={() => {
              runId.current++;
              setTraining(false);
              setResult(null);
              setProgress(0);
              setStatus("NOT TRAINED");
              setToast("Reset: model and latent vectors cleared");
            }}
          >
            Reset
          </button>
          <p>
            Training Progress <b>{Math.round(progress * 100)}%</b>
            <i>
              <span style={{ width: `${progress * 100}%` }} />
            </i>
            {Math.round(progress * epochs)} / {epochs} epochs
          </p>
        </section>
        <section>
          <h3>MODEL STATUS ⓘ</h3>
          <p>
            Parameters <b>{result?.parameterCount.toLocaleString() || "—"}</b>
          </p>
          <p>
            Model Size{" "}
            <b>
              {result
                ? `${((result.parameterCount * 4) / 1024 / 1024).toFixed(2)} MB`
                : "—"}
            </b>
          </p>
          <p>
            Last trained <b>{status}</b>
          </p>
          {tfTensors != null && (
            <p>tf.memory tensors after last train <b>{tfTensors}</b></p>
          )}
        </section>
      </aside>
      {toast && (
        <button className="ae-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
