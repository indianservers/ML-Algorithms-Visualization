import { useEffect, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Upload,
} from "lucide-react";
import {
  convolve2d,
  normalizeFeatureMap,
  type ImageMatrix,
} from "../../../lib/algorithms/neural/cnn";
import "./ConvolutionVisualizerPage.css";

const baseImage: ImageMatrix = [
  [52, 55, 61, 66, 70, 61, 58],
  [63, 59, 55, 90, 109, 85, 69],
  [62, 59, 68, 113, 144, 104, 66],
  [63, 58, 71, 122, 154, 106, 70],
  [67, 61, 68, 104, 126, 88, 68],
  [79, 65, 60, 70, 77, 68, 58],
  [69, 63, 58, 55, 61, 63, 65],
];
const samples: ImageMatrix[] = [
  baseImage,
  baseImage.map((row, y) => row.map((_, x) => 35 + x * 28 + y * 3)),
  baseImage.map((row, y) => row.map((_, x) => ((x + y) % 2 ? 205 : 38))),
  baseImage.map((row, y) =>
    row.map((_, x) => 128 + Math.round(90 * Math.sin(x * y + y))),
  ),
];

function createKernel(size: number, preset: string): ImageMatrix {
  if (preset === "Blur")
    return Array.from({ length: size }, () =>
      Array(size).fill(1 / (size * size)),
    );
  if (preset === "Sharpen")
    return Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) =>
        x === Math.floor(size / 2) && y === Math.floor(size / 2)
          ? 2
          : -1 / (size * size - 1),
      ),
    );
  if (preset === "Emboss")
    return Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) =>
        x === y ? (x < size / 2 ? -1 : 1) : 0,
      ),
    );
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, (_, x) =>
      x < Math.floor(size / 2) ? -1 : x > Math.floor((size - 1) / 2) ? 1 : 0,
    ),
  );
}

function NumberGrid({
  matrix,
  highlight,
  heat = false,
}: {
  matrix: ImageMatrix;
  highlight?: Set<string>;
  heat?: boolean;
}) {
  const normalized = normalizeFeatureMap(matrix);
  return (
    <div
      className="cv-grid"
      style={{ gridTemplateColumns: `repeat(${matrix[0].length},1fr)` }}
    >
      {matrix.flatMap((row, y) =>
        row.map((value, x) => (
          <span
            key={`${y}:${x}`}
            className={highlight?.has(`${y}:${x}`) ? "focus" : ""}
            style={
              heat
                ? {
                    background: `linear-gradient(135deg, rgb(${Math.round(18 + normalized[y][x] * 225)} 45 ${Math.round(90 + normalized[y][x] * 145)}), #172553)`,
                  }
                : undefined
            }
          >
            {Math.abs(value) < 1 && value !== 0
              ? value.toFixed(2)
              : Math.round(value)}
          </span>
        )),
      )}
    </div>
  );
}

export default function ConvolutionVisualizerPage() {
  const [image, setImage] = useState<ImageMatrix>(baseImage),
    [sample, setSample] = useState(0),
    [kernelSize, setKernelSize] = useState(3),
    [preset, setPreset] = useState("Edge"),
    [kernel, setKernel] = useState<ImageMatrix>(() => createKernel(3, "Edge")),
    [stride, setStride] = useState(1),
    [padding, setPadding] = useState(0),
    [dilation, setDilation] = useState(1),
    [activation, setActivation] = useState("None (Linear)"),
    [bias, setBias] = useState(false),
    [normalize, setNormalize] = useState(false),
    [step, setStep] = useState(11),
    [playing, setPlaying] = useState(false),
    [toast, setToast] = useState("");

  let rawOutput: ImageMatrix = [[0]],
    configError = "";
  try {
    rawOutput = convolve2d(
      image,
      kernel,
      stride,
      padding,
      dilation,
      bias ? 10 : 0,
    );
  } catch (error) {
    configError =
      error instanceof Error ? error.message : "Invalid convolution settings.";
  }
  const activated = rawOutput.map((row) =>
      row.map((value) =>
        activation === "ReLU"
          ? Math.max(0, value)
          : activation === "Sigmoid"
            ? 1 / (1 + Math.exp(-value / 40))
            : activation === "Tanh"
              ? Math.tanh(value / 80)
              : value,
      ),
    ),
    output = normalize ? normalizeFeatureMap(activated) : activated,
    positions = output.length * output[0].length,
    safeStep = Math.min(step, positions - 1),
    outputRow = Math.floor(safeStep / output[0].length),
    outputColumn = safeStep % output[0].length,
    highlight = new Set<string>(),
    products = kernel.map((row, ky) =>
      row.map((weight, kx) => {
        const y = outputRow * stride + ky * dilation - padding,
          x = outputColumn * stride + kx * dilation - padding;
        if (y >= 0 && y < image.length && x >= 0 && x < image[0].length) {
          highlight.add(`${y}:${x}`);
          return image[y][x] * weight;
        }
        return 0;
      }),
    ),
    currentValue = output[outputRow][outputColumn],
    allValues = output.flat(),
    minimum = Math.min(...allValues),
    maximum = Math.max(...allValues);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setStep((current) => (current + 1 >= positions ? 0 : current + 1)),
      650,
    );
    return () => window.clearInterval(timer);
  }, [playing, positions]);

  const chooseKernel = (size: number, nextPreset = preset) => {
    setKernelSize(size);
    setKernel(createKernel(size, nextPreset));
    setStep(0);
  };
  const choosePreset = (nextPreset: string) => {
    setPreset(nextPreset);
    setKernel(createKernel(kernelSize, nextPreset));
    setStep(0);
  };
  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setToast("Image must be 10MB or smaller");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const uploaded = new Image();
      uploaded.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 7;
        canvas.height = 7;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(uploaded, 0, 0, 7, 7);
        const pixels = context.getImageData(0, 0, 7, 7).data;
        setImage(
          Array.from({ length: 7 }, (_, y) =>
            Array.from({ length: 7 }, (_, x) => {
              const index = (y * 7 + x) * 4;
              return Math.round(
                pixels[index] * 0.299 +
                  pixels[index + 1] * 0.587 +
                  pixels[index + 2] * 0.114,
              );
            }),
          ),
        );
        setSample(-1);
        setStep(0);
        setToast(`${file.name} sampled to a 7×7 grayscale grid`);
      };
      uploaded.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };
  const reset = () => {
    setImage(baseImage);
    setSample(0);
    setPreset("Edge");
    setKernelSize(3);
    setKernel(createKernel(3, "Edge"));
    setStride(1);
    setPadding(0);
    setDilation(1);
    setActivation("None (Linear)");
    setBias(false);
    setNormalize(false);
    setStep(11);
    setPlaying(false);
    setToast("Visualizer reset");
  };

  return (
    <div className="cv-page">
      <aside className="cv-side">
        <Link to="/">
          ◇ <b>Mega ML</b>
          <small>AI Observatory</small>
        </Link>
        {[
          "⌂ Home",
          "▱ Projects",
          "◇ Models",
          "▤ Datasets",
          "⚗ Experiments",
          "♧ Deployments",
          "⌁ Monitor",
          "⚙ Settings",
        ].map((item) => (
          <button key={item} onClick={() => setToast(item)}>
            {item}
          </button>
        ))}
        <button
          className="collapse"
          onClick={() => setToast("Navigation collapsed")}
        >
          ≪ Collapse
        </button>
      </aside>
      <header className="cv-top">
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
            key={tab}
            onClick={() => setToast(`${tab} view`)}
          >
            {tab}
          </button>
        ))}
        <span>
          ☼ · ☾ · ▢ · ? · <b>MM</b>
        </span>
      </header>
      <main>
        <section className="cv-title">
          <i>⠿</i>
          <div>
            <h1>Convolution Visualizer</h1>
            <p>
              Explore how a kernel slides over the input to produce a feature
              map.
            </p>
          </div>
          <nav>
            <button
              aria-label="Previous step"
              onClick={() => setStep(Math.max(0, safeStep - 1))}
            >
              <SkipBack />
            </button>
            <button
              aria-label={playing ? "Pause" : "Play"}
              className="active"
              onClick={() => setPlaying((value) => !value)}
            >
              {playing ? <Pause /> : <Play />}
            </button>
            <button
              aria-label="Next step"
              onClick={() => setStep(Math.min(positions - 1, safeStep + 1))}
            >
              <SkipForward />
            </button>
            <button onClick={reset}>
              <RotateCcw /> Reset
            </button>
          </nav>
        </section>
        <section className="cv-badges">
          <b>
            ◉ Step {safeStep + 1} / {positions}
          </b>
          <b>◉ Stride {stride}</b>
          <b>◉ Padding {padding}</b>
          <b>
            ▣ {kernelSize} × {kernelSize} Kernel
          </b>
        </section>
        {configError && (
          <button
            className="cv-error"
            onClick={() => {
              setDilation(1);
              setPadding(2);
            }}
          >
            {configError} Reset dilation/padding
          </button>
        )}
        <section className="cv-work panel">
          <article>
            <h3>
              INPUT IMAGE <small>(Grayscale) ⓘ</small>
            </h3>
            <NumberGrid matrix={image} highlight={highlight} />
            <p>□ Receptive Field · ▣ Center Pixel</p>
          </article>
          <strong>→</strong>
          <article className="cv-kernel">
            <h3>
              KERNEL <small>(Filter) ⓘ</small>
            </h3>
            <NumberGrid matrix={kernel} />
            <b>×</b>
            <h4>ELEMENT-WISE MULTIPLICATION</h4>
            <NumberGrid matrix={products} />
            <em>
              SUM ={" "}
              {currentValue.toFixed(
                normalize || activation !== "None (Linear)" ? 3 : 0,
              )}
            </em>
          </article>
          <strong>=</strong>
          <article>
            <h3>OUTPUT FEATURE MAP ⓘ</h3>
            <NumberGrid
              matrix={output}
              heat
              highlight={new Set([`${outputRow}:${outputColumn}`])}
            />
            <p>
              Output Size: {output[0].length} × {output.length} · Min{" "}
              {minimum.toFixed(1)} / Max {maximum.toFixed(1)}
            </p>
          </article>
        </section>
        <section className="cv-lower">
          <article className="panel">
            <h3>CONVOLUTION SUMMARY</h3>
            <dl>
              <dt>Input Size</dt>
              <dd>
                {image[0].length} × {image.length}
              </dd>
              <dt>Kernel Size</dt>
              <dd>
                {kernelSize} × {kernelSize}
              </dd>
              <dt>Stride</dt>
              <dd>{stride}</dd>
              <dt>Padding</dt>
              <dd>{padding}</dd>
              <dt>Output Size</dt>
              <dd>
                {output[0].length} × {output.length}
              </dd>
              <dt>Total Positions</dt>
              <dd>{positions}</dd>
              <dt>Current Position (x, y)</dt>
              <dd>
                ({outputColumn}, {outputRow})
              </dd>
              <dt>Current Output Value</dt>
              <dd>{currentValue.toFixed(2)}</dd>
            </dl>
          </article>
          <article className="panel evolution">
            <h3>
              OUTPUT EVOLUTION <small>(in scan order)</small>
            </h3>
            <div>
              {[
                0,
                1,
                Math.floor(positions / 3),
                safeStep,
                Math.floor((positions * 2) / 3),
                positions - 1,
              ]
                .filter(
                  (value, index, list) =>
                    value >= 0 &&
                    value < positions &&
                    list.indexOf(value) === index,
                )
                .map((index) => (
                  <button
                    className={index === safeStep ? "active" : ""}
                    onClick={() => setStep(index)}
                    key={index}
                  >
                    <b>{allValues[index].toFixed(1)}</b>
                    <small>Step {index + 1}</small>
                  </button>
                ))}
            </div>
            <input
              aria-label="Convolution step"
              type="range"
              min="0"
              max={positions - 1}
              value={safeStep}
              onChange={(event) => setStep(Number(event.target.value))}
            />
          </article>
          <article className="panel how">
            <h3>HOW IT WORKS</h3>
            <p>① The kernel slides over the input image.</p>
            <p>② Element-wise multiplication is performed.</p>
            <p>③ Results are summed to produce one value.</p>
            <p>④ The value is placed in the output map.</p>
            <p>⑤ Repeat for all positions.</p>
            <button
              onClick={() =>
                setToast(
                  "Convolution uses local shared weights to detect patterns.",
                )
              }
            >
              Learn more about convolution →
            </button>
          </article>
        </section>
      </main>
      <aside className="cv-controls">
        <section className="panel">
          <h2>
            PARAMETERS
            <select
              aria-label="Kernel preset"
              value={preset}
              onChange={(event) => choosePreset(event.target.value)}
            >
              <option>Edge</option>
              <option>Blur</option>
              <option>Sharpen</option>
              <option>Emboss</option>
            </select>
          </h2>
          <label>Kernel Size</label>
          <div className="seg">
            {[2, 3, 5, 7].map((value) => (
              <button
                className={kernelSize === value ? "active" : ""}
                onClick={() => chooseKernel(value)}
                key={value}
              >
                {value}×{value}
              </button>
            ))}
          </div>
          <label>Stride</label>
          <div className="seg">
            {[1, 2, 3].map((value) => (
              <button
                className={stride === value ? "active" : ""}
                onClick={() => {
                  setStride(value);
                  setStep(0);
                }}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
          <label>Padding</label>
          <div className="seg">
            {[0, 1, 2].map((value) => (
              <button
                className={padding === value ? "active" : ""}
                onClick={() => {
                  setPadding(value);
                  setStep(0);
                }}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
          <label>Dilation</label>
          <div className="seg">
            {[1, 2, 3].map((value) => (
              <button
                className={dilation === value ? "active" : ""}
                onClick={() => {
                  setDilation(value);
                  setStep(0);
                }}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
          <label>
            Activation
            <select
              value={activation}
              onChange={(event) => setActivation(event.target.value)}
            >
              <option>None (Linear)</option>
              <option>ReLU</option>
              <option>Sigmoid</option>
              <option>Tanh</option>
            </select>
          </label>
          <label>
            Bias
            <input
              type="checkbox"
              checked={bias}
              onChange={(event) => setBias(event.target.checked)}
            />
          </label>
          <label>
            Normalize Output
            <input
              type="checkbox"
              checked={normalize}
              onChange={(event) => setNormalize(event.target.checked)}
            />
          </label>
        </section>
        <section className="panel dataset">
          <h2>DATASET ⓘ</h2>
          <label>Sample Images</label>
          <div>
            {samples.map((matrix, index) => (
              <button
                className={sample === index ? "active" : ""}
                onClick={() => {
                  setSample(index);
                  setImage(matrix);
                  setStep(0);
                }}
                key={index}
              >
                <NumberGrid matrix={matrix} heat />
              </button>
            ))}
          </div>
          <label className="upload">
            <Upload /> Upload Image
            <input
              type="file"
              accept="image/png,image/jpeg,image/bmp,image/tiff"
              onChange={uploadImage}
            />
          </label>
          <small>Formats: PNG, JPG, BMP, TIFF · Max size: 10MB</small>
        </section>
      </aside>
      <footer>
        FP32⌄ · <b>● Ready</b>
      </footer>
      {toast && (
        <button className="cv-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
