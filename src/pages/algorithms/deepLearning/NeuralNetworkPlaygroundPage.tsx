import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Share2,
  StepForward,
  Undo2,
  Upload,
} from "lucide-react";
import { LAB_TABS, useLabTabs } from "../../../components/common/LabTabs";
import {
  cloneBiases,
  cloneWeights,
  createMLPState,
  deadReluNeurons,
  diagnoseMLP,
  featureImportanceMLP,
  findLearningRates,
  forwardMLP,
  reinitNeuron,
  restoreMLPWeights,
  shouldEarlyStop,
  snapshotMLP,
  stepMLP,
  trainMLP,
  type MLPActivation,
  type MLPOptimizer,
  type MLPOptions,
  type MLPState,
} from "../../../lib/algorithms/neural/mlp";
import {
  DATASET_CATALOG,
  expandFeatures,
  FEATURE_CATALOG,
  makePlaygroundData,
  playgroundMetrics,
  shuffleLabels,
  type FeatureId,
  type PlaygroundDataset,
  type PlaygroundPoint,
} from "../../../lib/algorithms/neural/nnPlayground";
import "./NeuralNetworkPlaygroundPage.css";

const LR_PRESETS = [0.0001, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1];
const WORLD = { x0: -2.4, x1: 2.4, y0: -1.85, y1: 1.85 };
const TAB_ALIAS: Record<string, string> = {
  Learn: "learn",
  Visualize: "visualize",
  Dataset: "dataset",
  "Build / Train": "train",
  Metrics: "metrics",
  Compare: "compare",
  Explain: "explain",
};

function tabFromQuery(value: string | null) {
  if (!value) return "Visualize";
  const key = value.trim().toLowerCase();
  return (
    LAB_TABS.find(
      (name) => name.toLowerCase() === key || TAB_ALIAS[name] === key,
    ) ?? "Visualize"
  );
}

const STORAGE_KEY = "nnp-resume-lesson";
type PointView = "all" | "train" | "test";
type ViewBox = { x0: number; x1: number; y0: number; y1: number };

type ResumeLesson = {
  dataset: PlaygroundDataset;
  noise: number;
  count: number;
  split: number;
  seed: number;
  seedLock: boolean;
  imbalance: number;
  features: FeatureId[];
  hidden: number[];
  activation: MLPActivation;
  optimizer: MLPOptimizer;
  lr: number;
  batch: number;
  l1: number;
  l2: number;
  bias: boolean;
  points?: PlaygroundPoint[];
};

function readResume(): Partial<ResumeLesson> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ResumeLesson) : {};
  } catch {
    return {};
  }
}

function inView(view: ViewBox, x: number, y: number) {
  return x >= view.x0 && x <= view.x1 && y >= view.y0 && y <= view.y1;
}

function contourSegments(
  sample: (x: number, y: number) => number,
  view: ViewBox,
  width: number,
  height: number,
) {
  const cols = 26;
  const rows = 18;
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const at = (c: number, r: number) => {
    const x = view.x0 + ((c + 0.5) / cols) * (view.x1 - view.x0);
    const y = view.y1 - ((r + 0.5) / rows) * (view.y1 - view.y0);
    return { x, y, p: sample(x, y), cx: ((c + 0.5) / cols) * width, cy: ((r + 0.5) / rows) * height };
  };
  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < cols - 1; c += 1) {
      const a = at(c, r);
      const b = at(c + 1, r);
      const d = at(c, r + 1);
      const crossings: Array<{ x: number; y: number }> = [];
      const edge = (
        p: typeof a,
        q: typeof a,
      ) => {
        if ((p.p - 0.5) * (q.p - 0.5) > 0) return;
        const t = (0.5 - p.p) / (q.p - p.p || 1e-6);
        crossings.push({
          x: p.cx + (q.cx - p.cx) * t,
          y: p.cy + (q.cy - p.cy) * t,
        });
      };
      edge(a, b);
      edge(a, d);
      edge(b, at(c + 1, r + 1));
      edge(d, at(c + 1, r + 1));
      if (crossings.length >= 2) {
        lines.push({
          x1: crossings[0]?.x ?? 0,
          y1: crossings[0]?.y ?? 0,
          x2: crossings[1]?.x ?? 0,
          y2: crossings[1]?.y ?? 0,
        });
      }
    }
  }
  return lines;
}

function toSvg(x: number, y: number, w: number, h: number, view = WORLD) {
  return {
    cx: ((x - view.x0) / (view.x1 - view.x0)) * w,
    cy: ((view.y1 - y) / (view.y1 - view.y0)) * h,
  };
}

function fromSvg(cx: number, cy: number, w: number, h: number, view = WORLD) {
  return {
    x: view.x0 + (cx / w) * (view.x1 - view.x0),
    y: view.y1 - (cy / h) * (view.y1 - view.y0),
  };
}

function classColor(p: number, discretize: boolean) {
  const t = discretize ? (p >= 0.5 ? 1 : 0) : p;
  const warm = [240, 106, 77];
  const cool = [61, 139, 255];
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(cool[0], warm[0])},${mix(cool[1], warm[1])},${mix(cool[2], warm[2])})`;
}

function MiniShape({ kind }: { kind: Exclude<PlaygroundDataset, "imported"> }) {
  const pts = makePlaygroundData(kind, 0.08, 2, 36);
  return (
    <svg viewBox="0 0 72 48" className="nnp-mini" aria-hidden>
      {pts.map((p, i) => {
        const { cx, cy } = toSvg(p.x, p.y, 72, 48);
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="2"
            fill={p.label ? "#f06a4d" : "#3d8bff"}
          />
        );
      })}
    </svg>
  );
}

function LossChart({
  train,
  test,
  cursor,
  onScrub,
}: {
  train: number[];
  test: number[];
  cursor?: number;
  onScrub?: (epoch: number) => void;
}) {
  const values = [...train, ...test];
  const max = Math.max(0.2, ...values);
  const n = Math.max(train.length, test.length);
  const path = (series: number[]) =>
    series
      .map((value, i) => {
        const x = series.length < 2 ? 8 : 8 + (i / (series.length - 1)) * 220;
        const y = 88 - (value / max) * 76;
        return `${x},${y}`;
      })
      .join(" ");
  const pick = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!onScrub || n < 2) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 236;
    const t = Math.max(0, Math.min(1, (x - 8) / 220));
    onScrub(Math.round(t * (n - 1)) + 1);
  };
  const mark =
    cursor && n > 1 ? 8 + ((cursor - 1) / Math.max(1, n - 1)) * 220 : null;
  return (
    <svg
      viewBox="0 0 236 100"
      className="nnp-loss nnp-loss-scrub"
      onPointerDown={pick}
      onPointerMove={(event) => {
        if (event.buttons) pick(event);
      }}
    >
      <path d="M8 8V88H228" />
      {train.length > 1 && <polyline points={path(train)} />}
      {test.length > 1 && <polyline className="val" points={path(test)} />}
      {mark !== null && <line className="scrub" x1={mark} y1="8" x2={mark} y2="88" />}
    </svg>
  );
}

export default function NeuralNetworkPlaygroundPage() {
  const [params, setParams] = useSearchParams();
  const { tab, setTab } = useLabTabs(
    tabFromQuery(params.get("tab")),
    "Visualize",
    [],
  );
  const chooseTab = (next: string) => {
    setTab(next);
    const nextParams = new URLSearchParams(params);
    nextParams.set("tab", TAB_ALIAS[next] ?? next.toLowerCase());
    setParams(nextParams, { replace: true });
  };
  const saved = useMemo(() => readResume(), []);
  const [dataset, setDataset] = useState<PlaygroundDataset>(
    () =>
      (params.get("d") as PlaygroundDataset) || saved.dataset || "moons",
  );
  const [noise, setNoise] = useState(() => Number(params.get("n") ?? saved.noise ?? 0.12));
  const [count, setCount] = useState(() => Number(params.get("c") ?? saved.count ?? 220));
  const [split, setSplit] = useState(() => Number(params.get("s") ?? saved.split ?? 0.2));
  const [seed, setSeed] = useState(() => saved.seed ?? 7);
  const [seedLock, setSeedLock] = useState(() => saved.seedLock ?? false);
  const [imbalance, setImbalance] = useState(() => saved.imbalance ?? 0.5);
  const [points, setPoints] = useState<PlaygroundPoint[]>(() =>
    saved.points?.length
      ? saved.points
      : makePlaygroundData(
          ((params.get("d") as PlaygroundDataset) || saved.dataset || "moons") ===
            "imported"
            ? "moons"
            : (((params.get("d") as PlaygroundDataset) ||
                saved.dataset ||
                "moons") as Exclude<PlaygroundDataset, "imported">),
          Number(params.get("n") ?? saved.noise ?? 0.12),
          saved.seed ?? 7,
          Number(params.get("c") ?? saved.count ?? 220),
          saved.imbalance ?? 0.5,
        ),
  );
  const [imported, setImported] = useState<PlaygroundPoint[]>([]);
  const [features, setFeatures] = useState<FeatureId[]>(
    () => saved.features ?? ["x1", "x2"],
  );
  const [hidden, setHidden] = useState<number[]>(() => saved.hidden ?? [6, 4]);
  const [activation, setActivation] = useState<MLPActivation>(
    () => saved.activation ?? "tanh",
  );
  const [optimizer, setOptimizer] = useState<MLPOptimizer>(
    () => saved.optimizer ?? "adam",
  );
  const [lr, setLr] = useState(() => saved.lr ?? 0.03);
  const [batch, setBatch] = useState(() => saved.batch ?? 16);
  const [l2, setL2] = useState(() => saved.l2 ?? 0);
  const [l1, setL1] = useState(() => saved.l1 ?? 0);
  const [bias, setBias] = useState(() => saved.bias ?? true);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(12);
  const [maxEpochs, setMaxEpochs] = useState(400);
  const [discretize, setDiscretize] = useState(false);
  const [paint, setPaint] = useState<0 | 1>(1);
  const [brush, setBrush] = useState(0.12);
  const [pointView, setPointView] = useState<PointView>("all");
  const [showConfusion, setShowConfusion] = useState(false);
  const [showContour, setShowContour] = useState(true);
  const [earlyStop, setEarlyStop] = useState(true);
  const [view, setView] = useState<ViewBox>(WORLD);
  const [edgeTip, setEdgeTip] = useState<{
    w: number;
    x: number;
    y: number;
  } | null>(null);
  const [pulse, setPulse] = useState(-1);
  const [lrSweep, setLrSweep] = useState<Array<{ rate: number; loss: number }>>(
    [],
  );
  const [probe, setProbe] = useState({ x: 0.4, y: 0.2 });
  const [hover, setHover] = useState<{ layer: number; index: number } | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const snaps = useRef<
    Array<{ epoch: number; weights: number[][][]; biases: number[][] }>
  >([]);
  const undoStack = useRef<PlaygroundPoint[][]>([]);
  const redoStack = useRef<PlaygroundPoint[][]>([]);
  const skipReset = useRef(false);

  const options = useMemo<MLPOptions>(
    () => ({
      hidden,
      activation,
      optimizer,
      learningRate: lr,
      batchSize: batch,
      epochs: 1,
      l2,
      l1,
      useBias: bias,
      seed: 41,
      validationSplit: split,
    }),
    [hidden, activation, optimizer, lr, batch, l2, l1, bias, split],
  );

  const matrix = useMemo(
    () => ({
      X: points.map((p) => expandFeatures(p.x, p.y, features)),
      y: points.map((p) => p.label),
    }),
    [points, features],
  );

  const [state, setState] = useState<MLPState>(() =>
    createMLPState(
      makePlaygroundData("moons", 0.12, 7, 220).map((p) =>
        expandFeatures(p.x, p.y, ["x1", "x2"]),
      ),
      makePlaygroundData("moons", 0.12, 7, 220).map((p) => p.label),
      {
        hidden: [6, 4],
        activation: "tanh",
        optimizer: "adam",
        learningRate: 0.03,
        batchSize: 16,
        epochs: 1,
        l2: 0,
        useBias: true,
        seed: 41,
        validationSplit: 0.2,
      },
    ),
  );

  const recordSnap = (next: MLPState) => {
    snaps.current.push({
      epoch: next.epoch,
      weights: cloneWeights(next.weights),
      biases: cloneBiases(next.biases),
    });
    if (snaps.current.length > 200) {
      snaps.current = snaps.current
        .filter((_, i) => i % 2 === 0)
        .slice(-140);
    }
  };

  const resetNet = (
    nextPoints = points,
    nextFeatures = features,
    nextHidden = hidden,
  ) => {
    const X = nextPoints.map((p) => expandFeatures(p.x, p.y, nextFeatures));
    const next = createMLPState(
      X,
      nextPoints.map((p) => p.label),
      { ...options, hidden: nextHidden },
    );
    snaps.current = [
      {
        epoch: 0,
        weights: cloneWeights(next.weights),
        biases: cloneBiases(next.biases),
      },
    ];
    setState(next);
    setPlaying(false);
    setPulse(-1);
  };

  const runStep = (current: MLPState) => {
    const next = stepMLP(current, options);
    recordSnap(next);
    return next;
  };

  useEffect(() => {
    if (skipReset.current) {
      skipReset.current = false;
      return;
    }
    resetNet();
    // Fresh weights only when the hypothesis or the data change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features.join(","), hidden.join(","), activation, bias, split, matrix.X.length]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setState((current) => {
        if (current.epoch >= maxEpochs) {
          setPlaying(false);
          return current;
        }
        const next = runStep(current);
        if (earlyStop && shouldEarlyStop(next.validationLoss)) {
          setPlaying(false);
          setToast("Early stop — test loss rose. The net started memorizing.");
        }
        return next;
      });
    }, Math.max(16, 1000 / speed));
    return () => window.clearInterval(id);
  }, [playing, speed, options, maxEpochs, earlyStop]);

  useEffect(() => {
    if (pulse < 0) return;
    const last = hidden.length + 1;
    const id = window.setTimeout(() => {
      setPulse((layer) => (layer < last ? layer + 1 : -1));
    }, 95);
    return () => window.clearTimeout(id);
  }, [pulse, hidden.length]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            dataset,
            noise,
            count,
            split,
            seed,
            seedLock,
            imbalance,
            features,
            hidden,
            activation,
            optimizer,
            lr,
            batch,
            l1,
            l2,
            bias,
            points,
          } satisfies ResumeLesson),
        );
      } catch {
        /* quota */
      }
    }, 450);
    return () => window.clearTimeout(id);
  }, [
    dataset,
    noise,
    count,
    split,
    seed,
    seedLock,
    imbalance,
    features,
    hidden,
    activation,
    optimizer,
    lr,
    batch,
    l1,
    l2,
    bias,
    points,
  ]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)
        return;
      if (event.code === "Space") {
        event.preventDefault();
        setPlaying((value) => !value);
      }
      if (event.key === "n" || event.key === "N") {
        setState((current) => runStep(current));
        setPulse(0);
      }
      if ((event.key === "z" || event.key === "Z") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        event.shiftKey ? redoPoints() : undoPoints();
      }
      if ((event.key === "y" || event.key === "Y") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        redoPoints();
      }
      if (event.key === "r" || event.key === "R") resetNet();
      const digit = Number(event.key);
      if (digit >= 1 && digit <= LAB_TABS.length && !event.metaKey && !event.ctrlKey)
        chooseTab(LAB_TABS[digit - 1] ?? "Visualize");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const model = useMemo(
    () => snapshotMLP(state, { activation, useBias: bias }),
    [state.epoch, state.trainLoss, activation, bias, state],
  );
  const holdout = useMemo(
    () => points.map((_, i) => state.validation.includes(i)),
    [points, state.validation],
  );
  const metrics = useMemo(
    () => playgroundMetrics(points.map((p) => p.label), model.probabilities, holdout),
    [points, model.probabilities, holdout],
  );
  const health = useMemo(
    () => diagnoseMLP(state, activation),
    [state, activation],
  );
  const dead = useMemo(
    () => deadReluNeurons(state, activation),
    [state, activation],
  );
  const importance = useMemo(() => featureImportanceMLP(state), [state]);
  const probePass = useMemo(
    () =>
      forwardMLP(
        expandFeatures(probe.x, probe.y, features),
        state.weights,
        state.biases,
        activation,
      ),
    [probe, features, state.epoch, state.weights, state.biases, activation],
  );

  const compare = useMemo(() => {
    if (tab !== "Compare") return null;
    const X = matrix.X;
    const y = matrix.y;
    const shared = {
      activation,
      optimizer,
      learningRate: lr,
      batchSize: batch,
      epochs: 70,
      l2,
      l1,
      useBias: bias,
      seed: 41,
      validationSplit: split,
    };
    try {
      return {
        linear: trainMLP(X, y, { ...shared, hidden: [] }),
        tiny: trainMLP(X, y, { ...shared, hidden: [3] }),
        current: model,
      };
    } catch {
      return {
        linear: model,
        tiny: model,
        current: model,
      };
    }
  }, [tab, matrix, activation, optimizer, lr, batch, l2, l1, bias, split, model]);

  const sizes = [
    features.length,
    ...hidden,
    1,
  ];

  const commitPoints = (
    next: PlaygroundPoint[],
    record = true,
    nextHidden = hidden,
    nextFeatures = features,
  ) => {
    if (record) {
      undoStack.current.push(points);
      redoStack.current = [];
    }
    setPoints(next);
    resetNet(next, nextFeatures, nextHidden);
  };

  const undoPoints = () => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(points);
    setPoints(prev);
    resetNet(prev);
  };

  const redoPoints = () => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(points);
    setPoints(next);
    resetNet(next);
  };

  const loadDataset = (
    kind: PlaygroundDataset,
    nextNoise = noise,
    nextCount = count,
    nextImbalance = imbalance,
  ) => {
    if (kind === "imported") {
      if (!imported.length) return;
      setDataset(kind);
      commitPoints(imported);
      return;
    }
    const next = makePlaygroundData(kind, nextNoise, seed, nextCount, nextImbalance);
    setDataset(kind);
    commitPoints(next);
    setToast(`${DATASET_CATALOG.find((item) => item.id === kind)?.name} loaded`);
  };

  const regenerate = () => {
    if (dataset === "imported") return;
    const nextSeed = seedLock ? seed : seed + 1;
    if (!seedLock) setSeed(nextSeed);
    const next = makePlaygroundData(dataset, noise, nextSeed, count, imbalance);
    commitPoints(next);
  };

  const applyPreset = (id: "moons" | "linear" | "spiral") => {
    const presets = {
      moons: {
        dataset: "moons" as const,
        hidden: [6, 4],
        activation: "tanh" as const,
        features: ["x1", "x2"] as FeatureId[],
        lr: 0.03,
        noise: 0.12,
        count: 220,
        split: 0.2,
        l1: 0,
        l2: 0,
        imbalance: 0.5,
      },
      linear: {
        dataset: "xor" as const,
        hidden: [] as number[],
        activation: "linear" as const,
        features: ["x1", "x2"] as FeatureId[],
        lr: 0.1,
        noise: 0.05,
        count: 180,
        split: 0.2,
        l1: 0,
        l2: 0,
        imbalance: 0.5,
      },
      spiral: {
        dataset: "spiral" as const,
        hidden: [8, 8],
        activation: "tanh" as const,
        features: ["x1", "x2"] as FeatureId[],
        lr: 0.08,
        noise: 0,
        count: 90,
        split: 0.1,
        l1: 0,
        l2: 0,
        imbalance: 0.5,
      },
    };
    const preset = presets[id];
    skipReset.current = true;
    setDataset(preset.dataset);
    setHidden(preset.hidden);
    setActivation(preset.activation);
    setFeatures(preset.features);
    setLr(preset.lr);
    setNoise(preset.noise);
    setCount(preset.count);
    setSplit(preset.split);
    setL1(preset.l1);
    setL2(preset.l2);
    setImbalance(preset.imbalance);
    const next = makePlaygroundData(
      preset.dataset,
      preset.noise,
      seed,
      preset.count,
      preset.imbalance,
    );
    commitPoints(next, true, preset.hidden, preset.features);
    chooseTab("Visualize");
    setToast(
      id === "moons"
        ? "Solve moons — a bent net should fit train and test."
        : id === "linear"
          ? "Break with linear — XOR plus no hidden layer cannot fold."
          : "Overfit spiral — tiny data, deep net, almost no hold-out.",
    );
  };

  const scrubTo = (epoch: number) => {
    const snap =
      [...snaps.current].reverse().find((item) => item.epoch <= epoch) ??
      snaps.current[0];
    if (!snap) return;
    setPlaying(false);
    setState((current) =>
      restoreMLPWeights(current, snap.weights, snap.biases, snap.epoch),
    );
  };

  const share = async () => {
    const next = new URLSearchParams({
      d: dataset,
      n: String(noise),
      c: String(count),
      s: String(split),
      h: hidden.join("-"),
      a: activation,
      o: optimizer,
      lr: String(lr),
      tab: TAB_ALIAS[tab] ?? "visualize",
    });
    setParams(next, { replace: true });
    const url = `${window.location.origin}/ml/deep-learning/nn-playground?${next}`;
    await navigator.clipboard.writeText(url);
    setToast("Lesson URL copied — architecture and data travel with it");
  };

  const toggleFeature = (id: FeatureId) => {
    const next = features.includes(id)
      ? features.filter((item) => item !== id)
      : [...features, id];
    if (!next.length) return;
    setFeatures(next);
  };

  const addLayer = () => {
    if (hidden.length >= 4) return;
    setHidden([...hidden, Math.max(2, hidden.at(-1) ?? 4)]);
  };
  const removeLayer = (index: number) => {
    if (hidden.length <= 0) return;
    setHidden(hidden.filter((_, i) => i !== index));
  };
  const bumpNeuron = (index: number, delta: number) => {
    setHidden(
      hidden.map((value, i) =>
        i === index ? Math.max(1, Math.min(10, value + delta)) : value,
      ),
    );
  };

  const pointsRef = useRef(points);
  pointsRef.current = points;
  const paintBefore = useRef<PlaygroundPoint[] | null>(null);

  const beginPaint = () => {
    paintBefore.current = pointsRef.current;
  };

  const paintAt = (x: number, y: number, erase: boolean) => {
    setPoints((current) => {
      if (erase) return current.filter((p) => Math.hypot(p.x - x, p.y - y) > brush);
      if (current.some((p) => Math.hypot(p.x - x, p.y - y) < brush * 0.5))
        return current;
      const extra: PlaygroundPoint[] = [{ x, y, label: paint }];
      const rings = Math.max(0, Math.round(brush / 0.1) - 1);
      for (let i = 0; i < rings; i += 1) {
        const a = (i / Math.max(1, rings)) * Math.PI * 2;
        extra.push({
          x: x + Math.cos(a) * brush * 0.45,
          y: y + Math.sin(a) * brush * 0.45,
          label: paint,
        });
      }
      return [...current, ...extra];
    });
    setProbe({ x, y });
  };

  const endPaint = () => {
    if (paintBefore.current) {
      undoStack.current.push(paintBefore.current);
      redoStack.current = [];
      paintBefore.current = null;
    }
    resetNet(pointsRef.current);
  };

  const sabotageLabels = () => {
    commitPoints(shuffleLabels(points, seed + 19));
    setToast("Labels shuffled — the picture now lies on purpose.");
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const rows = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(",").map(Number))
      .filter((row) => row.length >= 3 && row.every(Number.isFinite));
    if (rows.length < 4) {
      setToast("CSV needs x, y, label columns");
      return;
    }
    const next = rows.map((row) => ({
      x: row[0] ?? 0,
      y: row[1] ?? 0,
      label: (row[2] ?? 0) >= 0.5 ? 1 : 0,
    }));
    setImported(next);
    setDataset("imported");
    setPoints(next);
    resetNet(next);
    setToast(`Imported ${next.length} points`);
    event.target.value = "";
  };

  const docked = tab === "Visualize";
  const trainLoss = state.trainLoss.at(-1) ?? 0.69;
  const testLoss = state.validationLoss.at(-1) ?? 0.69;

  const renderPlaygroundControls = () => (
    <>
        <section className="panel" data-guide="algo-params">
          <h3>Features</h3>
          <p>These are the real inputs. Uncheck X₁ and the net goes blind on that axis.</p>
          <div className="nnp-features">
            {FEATURE_CATALOG.map((item) => (
              <button
                key={item.id}
                type="button"
                className={features.includes(item.id) ? "on" : ""}
                onClick={() => toggleFeature(item.id)}
              >
                {item.label}
                {features.includes(item.id) && (
                  <i
                    className="nnp-imp"
                    style={{
                      width: `${Math.round((importance[features.indexOf(item.id)] ?? 0) * 100)}%`,
                    }}
                    title={`importance ${(importance[features.indexOf(item.id)] ?? 0).toFixed(2)}`}
                  />
                )}
              </button>
            ))}
          </div>
          <p className="nnp-hint">
            Bars are |w| paths into ŷ. {importance
              .map((value, i) => `${FEATURE_CATALOG.find((f) => f.id === features[i])?.label ?? "x"} ${(value * 100).toFixed(0)}%`)
              .join(" · ")}
          </p>
        </section>
        <section className="panel">
          <h3>Data</h3>
          <label>
            Noise
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={noise}
              onChange={(e) => {
                const value = Number(e.target.value);
                setNoise(value);
                if (dataset !== "imported")
                  loadDataset(dataset, value, count);
              }}
            />
            <b>{noise.toFixed(2)}</b>
          </label>
          <label>
            Points
            <input
              type="range"
              min="60"
              max="400"
              step="20"
              value={count}
              onChange={(e) => {
                const value = Number(e.target.value);
                setCount(value);
                if (dataset !== "imported")
                  loadDataset(dataset, noise, value);
              }}
            />
            <b>{count}</b>
          </label>
          <label>
            Test split
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
            />
            <b>{Math.round(split * 100)}%</b>
          </label>
          <label>
            Class 1 share
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={imbalance}
              onChange={(e) => {
                const value = Number(e.target.value);
                setImbalance(value);
                if (dataset !== "imported")
                  loadDataset(dataset, noise, count, value);
              }}
            />
            <b>{Math.round(imbalance * 100)}%</b>
          </label>
          <label>
            Lock seed
            <input
              type="checkbox"
              checked={seedLock}
              onChange={(e) => setSeedLock(e.target.checked)}
            />
          </label>
          <button type="button" onClick={regenerate}>Regenerate</button>
          <button type="button" onClick={sabotageLabels}>
            Shuffle labels
          </button>
        </section>
        <section className="panel">
          <h3>Training</h3>
          <label>
            Activation
            <select
              value={activation}
              onChange={(e) => setActivation(e.target.value as MLPActivation)}
            >
              <option value="tanh">Tanh</option>
              <option value="relu">ReLU</option>
              <option value="sigmoid">Sigmoid</option>
              <option value="linear">Linear</option>
            </select>
          </label>
          <label>
            Optimizer
            <select
              value={optimizer}
              onChange={(e) => setOptimizer(e.target.value as MLPOptimizer)}
            >
              <option value="adam">Adam</option>
              <option value="sgd">SGD</option>
            </select>
          </label>
          <label>
            Learning rate
            <select value={lr} onChange={(e) => setLr(Number(e.target.value))}>
              {LR_PRESETS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Batch
            <select
              value={batch}
              onChange={(e) => setBatch(Number(e.target.value))}
            >
              <option value={1}>1 (SGD)</option>
              <option value={8}>8</option>
              <option value={16}>16</option>
              <option value={32}>32</option>
            </select>
          </label>
          <label>
            L2
            <input
              type="range"
              min="0"
              max="0.1"
              step="0.005"
              value={l2}
              onChange={(e) => setL2(Number(e.target.value))}
            />
            <b>{l2.toFixed(3)}</b>
          </label>
          <label>
            L1
            <input
              type="range"
              min="0"
              max="0.05"
              step="0.005"
              value={l1}
              onChange={(e) => setL1(Number(e.target.value))}
            />
            <b>{l1.toFixed(3)}</b>
          </label>
          <label>
            Bias
            <input
              type="checkbox"
              checked={bias}
              onChange={(e) => setBias(e.target.checked)}
            />
          </label>
          <label>
            Max epochs
            <input
              type="number"
              min={20}
              max={2000}
              value={maxEpochs}
              onChange={(e) => setMaxEpochs(Number(e.target.value))}
            />
          </label>
          <label>
            Early stop
            <input
              type="checkbox"
              checked={earlyStop}
              onChange={(e) => setEarlyStop(e.target.checked)}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              const sweep = findLearningRates(matrix.X, matrix.y, options);
              setLrSweep(sweep);
              const best = [...sweep].sort((a, b) => a.loss - b.loss)[0];
              if (best) {
                setLr(best.rate);
                setToast(`LR finder: η=${best.rate} had the lowest 20-epoch loss.`);
              }
              chooseTab("Build / Train");
            }}
          >
            Find learning rate
          </button>
        </section>
        <section className="panel">
          <h3>Probe</h3>
          <label>
            X₁
            <input
              type="range"
              min="-2"
              max="2"
              step="0.05"
              value={probe.x}
              onChange={(e) =>
                setProbe({ ...probe, x: Number(e.target.value) })
              }
            />
          </label>
          <label>
            X₂
            <input
              type="range"
              min="-2"
              max="2"
              step="0.05"
              value={probe.y}
              onChange={(e) =>
                setProbe({ ...probe, y: Number(e.target.value) })
              }
            />
          </label>
          <p>
            ŷ = <b>{probePass.probability.toFixed(3)}</b> → class{" "}
            {probePass.probability >= 0.5 ? 1 : 0}
          </p>
        </section>
    </>
  );

  return (
    <div className={`nnp-page${docked ? "" : " lesson"}`}>
      <header className="nnp-head">
        <div>
          <p>Deep learning · live trainer</p>
          <h1>Neural Network Playground</h1>
        </div>
        <div className="nnp-transport" data-guide="algo-visualize">
          <button
            className={playing ? "live" : ""}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              setState((current) => runStep(current));
              setPulse(0);
            }}
          >
            <StepForward size={14} /> Step
          </button>
          <button onClick={() => resetNet()}>
            <RotateCcw size={14} /> Reset
          </button>
          <label>
            Speed
            <input
              type="range"
              min="2"
              max="40"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </label>
          <b>
            Epoch {state.epoch}
            <small>
              train {trainLoss.toFixed(3)} · test {testLoss.toFixed(3)}
            </small>
          </b>
        </div>
        <div className="nnp-presets">
          <button type="button" onClick={() => applyPreset("moons")}>
            Solve moons
          </button>
          <button type="button" onClick={() => applyPreset("linear")}>
            Break with linear
          </button>
          <button type="button" onClick={() => applyPreset("spiral")}>
            Overfit spiral
          </button>
        </div>
        <button onClick={share}>
          <Share2 size={14} /> Share lesson
        </button>
      </header>
      <nav
        className="nnp-tabs"
        role="tablist"
        aria-label="Playground tabs"
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          const index = LAB_TABS.indexOf(tab as (typeof LAB_TABS)[number]);
          let next = index;
          if (event.key === "ArrowRight") next = (index + 1) % LAB_TABS.length;
          else if (event.key === "ArrowLeft")
            next = (index - 1 + LAB_TABS.length) % LAB_TABS.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = LAB_TABS.length - 1;
          else return;
          event.preventDefault();
          const name = LAB_TABS[next] ?? "Visualize";
          chooseTab(name);
          window.setTimeout(
            () => document.getElementById(`nnp-tab-${TAB_ALIAS[name]}`)?.focus(),
            0,
          );
        }}
      >
        {LAB_TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            id={`nnp-tab-${TAB_ALIAS[name]}`}
            aria-controls={`nnp-panel-${TAB_ALIAS[name]}`}
            aria-selected={tab === name}
            tabIndex={tab === name ? 0 : -1}
            className={tab === name ? "active" : ""}
            onClick={() => chooseTab(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <main>
        {tab === "Learn" && (
          <PlaygroundLearn onOpen={chooseTab} />
        )}
        {tab === "Visualize" && (
          <section className="nnp-stage" id="nnp-panel-visualize" role="tabpanel">
            <article className="panel nnp-net-wrap">
              <header>
                <h2>Network</h2>
                <small>
                  {sizes.join(" – ")} · {model.parameterCount} weights
                </small>
              </header>
              <svg viewBox="0 0 420 280" className="nnp-net">
                {sizes.slice(0, -1).flatMap((n, layer) =>
                  Array.from({ length: n }, (_, i) =>
                    Array.from({ length: sizes[layer + 1] }, (_, j) => {
                      const w = state.weights[layer]?.[i]?.[j] ?? 0;
                      const x1 = 36 + layer * (348 / (sizes.length - 1));
                      const x2 = 36 + (layer + 1) * (348 / (sizes.length - 1));
                      const y1 = 28 + i * (224 / Math.max(1, n - 1));
                      const y2 =
                        28 + j * (224 / Math.max(1, sizes[layer + 1] - 1));
                      const heat = Math.min(1, Math.abs(w) / 2.2);
                      return (
                        <line
                          key={`${layer}-${i}-${j}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          className={w >= 0 ? "pos" : "neg"}
                          style={{
                            strokeWidth: 0.5 + Math.min(3.2, Math.abs(w) * 1.4),
                            stroke: w >= 0
                              ? `rgba(61,139,255,${0.25 + heat * 0.75})`
                              : `rgba(240,106,77,${0.25 + heat * 0.75})`,
                          }}
                          onMouseEnter={(event) =>
                            setEdgeTip({
                              w,
                              x: event.clientX,
                              y: event.clientY,
                            })
                          }
                          onMouseLeave={() => setEdgeTip(null)}
                        >
                          <title>
                            w = {w.toFixed(3)}
                          </title>
                        </line>
                      );
                    }),
                  ),
                )}
                {sizes.flatMap((n, layer) =>
                  Array.from({ length: n }, (_, i) => {
                    const cx = 36 + layer * (348 / Math.max(1, sizes.length - 1));
                    const cy = 28 + i * (224 / Math.max(1, n - 1));
                    const value =
                      hover?.layer === layer && hover.index === i
                        ? 1
                        : probePass.activations[layer]?.[i] ?? 0.5;
                    const isOut = layer === sizes.length - 1;
                    const deadUnit =
                      layer > 0 &&
                      !isOut &&
                      dead.some((item) => item.layer === layer - 1 && item.index === i);
                    return (
                      <g
                        key={`n-${layer}-${i}`}
                        className={`${pulse === layer ? "nnp-pulse" : ""}${deadUnit ? " nnp-dead" : ""}`}
                        onMouseEnter={() => setHover({ layer, index: i })}
                        onMouseLeave={() => setHover(null)}
                        onClick={() => {
                          if (deadUnit) {
                            setState((current) =>
                              reinitNeuron(current, layer - 1, i, seed + i),
                            );
                            setToast("Re-initialized a dead ReLU.");
                          }
                        }}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r="13"
                          fill={classColor(isOut ? probePass.probability : (value + 1) / 2, false)}
                          strokeDasharray={deadUnit ? "3 2" : undefined}
                        />
                        <text x={cx} y={cy + 4}>
                          {layer === 0
                            ? FEATURE_CATALOG.find((f) => f.id === features[i])
                                ?.label ?? "x"
                            : isOut
                              ? "ŷ"
                              : "h"}
                        </text>
                      </g>
                    );
                  }),
                )}
              </svg>
              <footer>
                <button onClick={addLayer}>+ Hidden layer</button>
                {hidden.map((units, i) => (
                  <span key={i}>
                    L{i + 1}
                    <button onClick={() => bumpNeuron(i, -1)}>−</button>
                    <b>{units}</b>
                    <button onClick={() => bumpNeuron(i, 1)}>+</button>
                    <button onClick={() => removeLayer(i)}>✕</button>
                  </span>
                ))}
              </footer>
            </article>
            <article className="panel nnp-field-wrap">
              <header>
                <h2>
                  {hover
                    ? `Neuron L${hover.layer} #${hover.index + 1}`
                    : "Decision field"}
                </h2>
                <label>
                  <input
                    type="checkbox"
                    checked={discretize}
                    onChange={(e) => setDiscretize(e.target.checked)}
                  />
                  Discretize
                </label>
              </header>
              <Field
                points={points}
                holdout={holdout}
                probabilities={model.probabilities}
                state={state}
                activation={activation}
                features={features}
                hover={hover}
                discretize={discretize}
                probe={probe}
                view={view}
                pointView={pointView}
                showConfusion={showConfusion}
                showContour={showContour}
                brush={brush}
                onView={setView}
                onPaintStart={beginPaint}
                onPaintAt={paintAt}
                onPaintEnd={endPaint}
                onProbe={setProbe}
              />
              <footer>
                <span>
                  Drag paints class {paint}. Shift-drag deletes. Wheel zooms.
                </span>
                <div className="nnp-field-tools">
                  <button type="button" onClick={() => setPaint(paint ? 0 : 1)}>
                    Brush: class {paint}
                  </button>
                  <label>
                    Size
                    <input
                      type="range"
                      min="0.06"
                      max="0.36"
                      step="0.02"
                      value={brush}
                      onChange={(e) => setBrush(Number(e.target.value))}
                    />
                  </label>
                  <select
                    value={pointView}
                    onChange={(e) => setPointView(e.target.value as PointView)}
                    aria-label="Show points"
                  >
                    <option value="all">All points</option>
                    <option value="train">Train only</option>
                    <option value="test">Test only</option>
                  </select>
                  <label>
                    <input
                      type="checkbox"
                      checked={showConfusion}
                      onChange={(e) => setShowConfusion(e.target.checked)}
                    />
                    FP/FN
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={showContour}
                      onChange={(e) => setShowContour(e.target.checked)}
                    />
                    0.5 contour
                  </label>
                  <button type="button" onClick={undoPoints} title="Undo paint">
                    <Undo2 size={12} />
                  </button>
                  <button type="button" onClick={redoPoints} title="Redo paint">
                    <Redo2 size={12} />
                  </button>
                </div>
              </footer>
            </article>
          </section>
        )}
        {tab === "Build / Train" && (
          <section className="nnp-train" id="nnp-panel-train" role="tabpanel">
            <article className="panel nnp-net-wrap">
              <header>
                <h2>Architecture</h2>
                <small>
                  {sizes.join(" – ")} · {model.parameterCount} weights · epoch {state.epoch}
                </small>
              </header>
              <p>
                Change depth or width here, then Play. Visualize keeps the
                decision field; this tab is the trainer.
              </p>
              <footer>
                <button type="button" onClick={addLayer}>+ Hidden layer</button>
                {hidden.map((units, i) => (
                  <span key={i}>
                    L{i + 1}
                    <button type="button" onClick={() => bumpNeuron(i, -1)}>−</button>
                    <b>{units}</b>
                    <button type="button" onClick={() => bumpNeuron(i, 1)}>+</button>
                    <button type="button" onClick={() => removeLayer(i)}>✕</button>
                  </span>
                ))}
              </footer>
            </article>
            <article className="panel nnp-metrics">
              <header>
                <h2>Live loss</h2>
                <small>
                  train {trainLoss.toFixed(3)} · test {testLoss.toFixed(3)}
                </small>
              </header>
              <LossChart
                train={state.trainLoss}
                test={state.validationLoss}
                cursor={state.epoch}
                onScrub={scrubTo}
              />
              <p className="nnp-hint">Drag the chart to rewind weights to that epoch.</p>
              <p>
                {health.exploding
                  ? "Weights are exploding. Drop the learning rate."
                  : health.vanishing
                    ? "Weights are fading. Try ReLU or a larger η."
                    : health.deadRelu > 0.45
                      ? "Many ReLUs are dead. Reset or shrink η."
                      : "Gradient health looks usable."}{" "}
                max |w| {health.maxAbsWeight.toFixed(2)}
              </p>
              {lrSweep.length > 0 && (
                <div className="nnp-lr-sweep">
                  <h3>Learning-rate finder</h3>
                  <p>20 epochs from the same init. Lower is better.</p>
                  <ul>
                    {lrSweep.map((item) => (
                      <li key={item.rate}>
                        <button type="button" onClick={() => setLr(item.rate)}>
                          η {item.rate}
                        </button>
                        <span
                          style={{
                            width: `${Math.max(8, 100 - item.loss * 80)}%`,
                          }}
                        />
                        <b>{item.loss.toFixed(3)}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
            <div className="nnp-train-dock">{renderPlaygroundControls()}</div>
          </section>
        )}
        {tab === "Dataset" && (
          <section className="nnp-data panel" id="nnp-panel-dataset" role="tabpanel" data-guide="algo-dataset">
            <h2>Shapes that ask different questions</h2>
            <div className="nnp-cards">
              {DATASET_CATALOG.map((item) => (
                <button
                  key={item.id}
                  className={dataset === item.id ? "active" : ""}
                  onClick={() => loadDataset(item.id)}
                >
                  <MiniShape kind={item.id} />
                  <b>{item.name}</b>
                  <small>{item.hint}</small>
                  <em>{item.why}</em>
                </button>
              ))}
            </div>
            <p>
              {points.length} points · {Math.round((1 - split) * 100)}% train ·
              noise {noise.toFixed(2)}
            </p>
            <button onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Upload x,y,label CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv" onChange={upload} hidden />
          </section>
        )}
        {tab === "Metrics" && (
          <section className="nnp-metrics panel" id="nnp-panel-metrics" role="tabpanel" data-guide="algo-metrics">
            <h2>Train can look perfect. Test is the grade.</h2>
            <LossChart
              train={state.trainLoss}
              test={state.validationLoss}
              cursor={state.epoch}
              onScrub={scrubTo}
            />
            <div className="nnp-statgrid">
              <article>
                <small>Train acc</small>
                <b>{(metrics.train.accuracy * 100).toFixed(1)}%</b>
              </article>
              <article>
                <small>Test acc</small>
                <b>{(metrics.test.accuracy * 100).toFixed(1)}%</b>
              </article>
              <article>
                <small>Test F1</small>
                <b>{metrics.test.f1.toFixed(3)}</b>
              </article>
              <article>
                <small>Params</small>
                <b>{model.parameterCount}</b>
              </article>
            </div>
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Pred 0</th>
                  <th>Pred 1</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>True 0</th>
                  <td>{metrics.test.tn}</td>
                  <td>{metrics.test.fp}</td>
                </tr>
                <tr>
                  <th>True 1</th>
                  <td>{metrics.test.fn}</td>
                  <td>{metrics.test.tp}</td>
                </tr>
              </tbody>
            </table>
            <p>
              {health.exploding
                ? "Weights are exploding. Drop the learning rate."
                : health.vanishing
                  ? "Weights are fading. Try ReLU or a larger η."
                  : health.deadRelu > 0.45
                    ? "Many ReLUs are dead. Reset or shrink η."
                    : "Gradient health looks usable."}{" "}
              max |w| {health.maxAbsWeight.toFixed(2)}
            </p>
          </section>
        )}
        {tab === "Compare" && compare && (
          <section className="nnp-lesson panel" id="nnp-panel-compare" role="tabpanel">
            <h2>Same data, three hypotheses</h2>
            <p>
              A linear net, a 3-unit net, and your current architecture after a
              short burst. If linear already wins, stop celebrating depth.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Hidden</th>
                  <th>Params</th>
                  <th>Final train loss</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Linear</td>
                  <td>—</td>
                  <td>{compare.linear.parameterCount}</td>
                  <td>{compare.linear.trainLoss.at(-1)?.toFixed(3)}</td>
                </tr>
                <tr>
                  <td>Tiny</td>
                  <td>3</td>
                  <td>{compare.tiny.parameterCount}</td>
                  <td>{compare.tiny.trainLoss.at(-1)?.toFixed(3)}</td>
                </tr>
                <tr>
                  <td>Yours</td>
                  <td>{hidden.join("–") || "—"}</td>
                  <td>{compare.current.parameterCount}</td>
                  <td>{compare.current.trainLoss.at(-1)?.toFixed(3) ?? "—"}</td>
                </tr>
              </tbody>
            </table>
            <p>
              Next: <Link to="/ml/deep-learning/mlp">MLP lesson</Link> ·{" "}
              <Link to="/ml/deep-learning/perceptron">Perceptron</Link> ·{" "}
              <Link to="/ml/deep-learning/network-builder">Network builder</Link>
            </p>
          </section>
        )}
        {tab === "Explain" && (
          <section className="nnp-lesson panel" id="nnp-panel-explain" role="tabpanel">
            <h2>What the probe just computed</h2>
            <p>
              Point ({probe.x.toFixed(2)}, {probe.y.toFixed(2)}) · features{" "}
              {probePass.activations[0].map((v) => v.toFixed(2)).join(", ")}
            </p>
            <p className="nnp-eq">
              z = W·h + b ··· σ(z) = {probePass.probability.toFixed(3)}
            </p>
            <p>
              Hidden activations:{" "}
              {probePass.activations
                .slice(1, -1)
                .map((layer, i) => `L${i + 1}[${layer.map((v) => v.toFixed(2)).join(" ")}]`)
                .join(" · ") || "none — this is a linear net"}
            </p>
            <p>
              Output is a sigmoid, so the field is P(class 1). Tanh/ReLU/linear
              only bend the hidden street. No nonlinearity in hidden layers
              collapses back to logistic regression.
            </p>
          </section>
        )}
      </main>
      {docked && (
        <aside className="nnp-controls">{renderPlaygroundControls()}</aside>
      )}
      <footer className="nnp-foot">
        Play trains live. Test points are hollow. Hover a neuron to see its
        field. Space / N / R for play, step, reset. Keys 1–7 switch tabs.
      </footer>
      {edgeTip && (
        <div
          className="nnp-edge-tip"
          style={{ left: edgeTip.x + 12, top: edgeTip.y + 12 }}
        >
          w = {edgeTip.w.toFixed(3)}
        </div>
      )}
      {toast && (
        <button className="nnp-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}

function PlaygroundLearn({ onOpen }: { onOpen: (tab: string) => void }) {
  return (
    <section
      className="nnp-lesson nnp-learn panel"
      id="nnp-panel-learn"
      role="tabpanel"
      data-guide="algo-idea"
    >
      <header className="nnp-learn-hero">
        <p>Lesson</p>
        <h2>Better than a static color field</h2>
        <p>
          TensorFlow Playground taught a generation that weights have colors.
          This lab keeps that, then adds what a classroom actually needs: live
          epochs you can pause, a held-out test set that can disagree with the
          painting, engineered features you can turn off, click-to-draw data,
          and a diagnosis when ReLU dies or weights explode.
        </p>
      </header>

      <div className="nnp-learn-grid">
        <article>
          <h3>What you are training</h3>
          <p>
            A small multilayer perceptron. Inputs are the features you enable
            (X₁, X₂, squares, product, sines). Hidden layers use tanh, ReLU,
            sigmoid, or linear. The last unit is a sigmoid, so the field is
            P(class 1).
          </p>
        </article>
        <article>
          <h3>One training step</h3>
          <p>
            Forward: z = W·h + b, then an activation. Loss: binary
            cross-entropy on a mini-batch. Backward: gradients flow to every
            weight. Update: Adam or SGD with optional L1 / L2. Play just
            repeats that step.
          </p>
        </article>
        <article>
          <h3>Train vs test</h3>
          <p>
            Hollow points never update weights. If train loss falls and test
            loss rises, the net memorized paint, not the rule. The examiner is
            always the test set.
          </p>
        </article>
        <article>
          <h3>Features vs depth</h3>
          <p>
            Circles often yield to X₁² + X₂² with no extra layer. XOR needs a
            hidden layer. Spiral wants width, sines, or patience. Architecture
            is a hypothesis — try the cheap feature first.
          </p>
        </article>
      </div>

      <section>
        <h3>Five experiments</h3>
        <p>Each one teaches a different failure mode. Change one knob at a time.</p>
        <ol className="nnp-learn-path">
          <li>
            <div>
              <b>Moons, default net</b>
              <span>Play until train and test drop together. That is a fit.</span>
            </div>
            <button type="button" onClick={() => onOpen("Visualize")}>
              Open Visualize
            </button>
          </li>
          <li>
            <div>
              <b>Circles, no extra features</b>
              <span>A deep tanh net can do it. X₁² + X₂² does it with one layer.</span>
            </div>
            <button type="button" onClick={() => onOpen("Dataset")}>
              Pick Circles
            </button>
          </li>
          <li>
            <div>
              <b>XOR, zero hidden units</b>
              <span>Linear fails on purpose. Add two hidden units and watch the field fold.</span>
            </div>
            <button type="button" onClick={() => onOpen("Build / Train")}>
              Open trainer
            </button>
          </li>
          <li>
            <div>
              <b>Unbalanced, watch F1</b>
              <span>Accuracy can look fine while the minority class is ignored.</span>
            </div>
            <button type="button" onClick={() => onOpen("Metrics")}>
              Open Metrics
            </button>
          </li>
          <li>
            <div>
              <b>Linear vs tiny vs yours</b>
              <span>If a 0-hidden net already wins, stop celebrating depth.</span>
            </div>
            <button type="button" onClick={() => onOpen("Compare")}>
              Open Compare
            </button>
          </li>
        </ol>
      </section>

      <section>
        <h3>How to read the picture</h3>
        <div className="nnp-learn-grid">
          <article>
            <h3>Blue / orange field</h3>
            <p>
              Color is P(class 1). Discretize snaps it to a hard boundary.
              Hover a hidden neuron to see <em>its</em> feature map instead of
              the output.
            </p>
          </article>
          <article>
            <h3>Edge thickness</h3>
            <p>
              Stroke width is |w|. Blue is positive, orange is negative. A
              dead ReLU often sits on a near-zero bundle.
            </p>
          </article>
          <article>
            <h3>Diagnosis line</h3>
            <p>
              Exploding: drop η. Vanishing: try ReLU or a larger η. Dead
              ReLU &gt; 45%: reset or shrink the rate. Compare max |w|.
            </p>
          </article>
          <article>
            <h3>Paint and delete</h3>
            <p>
              Click the field to add the current brush class. Shift-click
              removes the nearest point. Use it to stress-test a finished net.
            </p>
          </article>
        </div>
      </section>

      <section>
        <h3>Why this beats TensorFlow Playground</h3>
        <ul className="nnp-learn-list">
          <li>Play / Pause / Step with a live epoch counter and train + test loss.</li>
          <li>Held-out points (hollow) so you can see overfitting, not only a pretty fill.</li>
          <li>Feature chips you can disable — X₁ off makes the net blind on that axis.</li>
          <li>Neuron hover and click-to-edit width, plus a probe ŷ for any (X₁, X₂).</li>
          <li>Adam or SGD, L1 and L2, batch size, and a share URL that carries the lesson.</li>
          <li>Compare tab trains a linear net and a 3-unit net on the same data.</li>
        </ul>
      </section>

      <section>
        <h3>Keyboard</h3>
        <p className="nnp-eq">
          Space play/pause · N step · R reset · 1–7 tabs · Shift-click delete
        </p>
        <p>
          Next labs:{" "}
          <Link to="/ml/deep-learning/mlp">MLP lesson</Link>
          {" · "}
          <Link to="/ml/deep-learning/perceptron">Perceptron</Link>
          {" · "}
          <Link to="/ml/deep-learning/network-builder">Network builder</Link>
        </p>
      </section>
    </section>
  );
}

function Field({
  points,
  holdout,
  probabilities,
  state,
  activation,
  features,
  hover,
  discretize,
  probe,
  view,
  pointView,
  showConfusion,
  showContour,
  brush,
  onView,
  onPaintStart,
  onPaintAt,
  onPaintEnd,
  onProbe,
}: {
  points: PlaygroundPoint[];
  holdout: boolean[];
  probabilities: number[];
  state: MLPState;
  activation: MLPActivation;
  features: FeatureId[];
  hover: { layer: number; index: number } | null;
  discretize: boolean;
  probe: { x: number; y: number };
  view: ViewBox;
  pointView: PointView;
  showConfusion: boolean;
  showContour: boolean;
  brush: number;
  onView: (view: ViewBox) => void;
  onPaintStart: () => void;
  onPaintAt: (x: number, y: number, erase: boolean) => void;
  onPaintEnd: () => void;
  onProbe: (point: { x: number; y: number }) => void;
}) {
  const dragging = useRef(false);
  const sample = (x: number, y: number) => {
    const pass = forwardMLP(
      expandFeatures(x, y, features),
      state.weights,
      state.biases,
      activation,
    );
    if (hover && hover.layer < pass.activations.length) {
      const raw = pass.activations[hover.layer]?.[hover.index] ?? 0;
      const mapped =
        hover.layer === 0 || hover.layer === pass.activations.length - 1
          ? (raw + (hover.layer === 0 ? 2.4 : 0)) / (hover.layer === 0 ? 4.8 : 1)
          : (raw + 1) / 2;
      return Math.max(0, Math.min(1, mapped));
    }
    return pass.probability;
  };
  const cells = [];
  const cols = 34;
  const rows = 24;
  for (let row = 0; row < rows; row += 1)
    for (let col = 0; col < cols; col += 1) {
      const x = view.x0 + ((col + 0.5) / cols) * (view.x1 - view.x0);
      const y = view.y1 - ((row + 0.5) / rows) * (view.y1 - view.y0);
      const value = sample(x, y);
      cells.push(
        <rect
          key={`${col}-${row}`}
          x={(col / cols) * 440}
          y={(row / rows) * 300}
          width={440 / cols + 0.6}
          height={300 / rows + 0.6}
          fill={classColor(value, discretize)}
          opacity={0.22 + Math.abs(value - 0.5) * 0.7}
        />,
      );
    }
  const contour = showContour
    ? contourSegments(sample, view, 440, 300)
    : [];
  const probePx = toSvg(probe.x, probe.y, 440, 300, view);
  const zoomed =
    view.x1 - view.x0 < WORLD.x1 - WORLD.x0 - 0.12 ||
    view.y1 - view.y0 < WORLD.y1 - WORLD.y0 - 0.12;
  const locate = (event: ReactPointerEvent<SVGSVGElement> | WheelEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return fromSvg(
      event.clientX - box.left,
      event.clientY - box.top,
      box.width,
      box.height,
      view,
    );
  };
  const boundaryReadout = sample(probe.x, probe.y);
  return (
    <div className="nnp-field-frame">
      <svg
        viewBox="0 0 440 300"
        className="nnp-field"
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          onPaintStart();
          const { x, y } = locate(event);
          onPaintAt(x, y, event.shiftKey);
        }}
        onPointerMove={(event) => {
          const { x, y } = locate(event);
          if (event.altKey) onProbe({ x, y });
          if (dragging.current) onPaintAt(x, y, event.shiftKey);
        }}
        onPointerUp={() => {
          if (dragging.current) onPaintEnd();
          dragging.current = false;
        }}
        onPointerLeave={() => {
          if (dragging.current) onPaintEnd();
          dragging.current = false;
        }}
        onWheel={(event) => {
          event.preventDefault();
          const { x, y } = locate(event);
          const factor = event.deltaY < 0 ? 0.86 : 1.16;
          const nx = Math.max(0.7, (view.x1 - view.x0) * factor);
          const ny = Math.max(0.55, (view.y1 - view.y0) * factor);
          const cx = Math.min(
            WORLD.x1 - nx / 2,
            Math.max(WORLD.x0 + nx / 2, x),
          );
          const cy = Math.min(
            WORLD.y1 - ny / 2,
            Math.max(WORLD.y0 + ny / 2, y),
          );
          onView({
            x0: Math.max(WORLD.x0, cx - nx / 2),
            x1: Math.min(WORLD.x1, cx + nx / 2),
            y0: Math.max(WORLD.y0, cy - ny / 2),
            y1: Math.min(WORLD.y1, cy + ny / 2),
          });
        }}
      >
        {cells}
        {contour.map((line, i) => (
          <line
            key={`c-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="nnp-contour"
          />
        ))}
        {points.map((p, i) => {
          if (pointView === "train" && holdout[i]) return null;
          if (pointView === "test" && !holdout[i]) return null;
          if (!inView(view, p.x, p.y)) return null;
          const { cx, cy } = toSvg(p.x, p.y, 440, 300, view);
          const pred = (probabilities[i] ?? 0) >= 0.5 ? 1 : 0;
          const kind = pred === p.label ? (p.label ? "tp" : "tn") : pred ? "fp" : "fn";
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={holdout[i] ? 3.6 : 3.1}
                fill={p.label ? "#f06a4d" : "#3d8bff"}
                stroke={holdout[i] ? "#f4f7ff" : "transparent"}
                strokeWidth={holdout[i] ? 1.2 : 0}
              />
              {showConfusion && kind === "fp" && (
                <text className="nnp-glyph fp" x={cx} y={cy + 3}>×</text>
              )}
              {showConfusion && kind === "fn" && (
                <text className="nnp-glyph fn" x={cx} y={cy + 3}>+</text>
              )}
            </g>
          );
        })}
        <circle
          cx={probePx.cx}
          cy={probePx.cy}
          r={Math.max(4, (brush / (view.x1 - view.x0)) * 220)}
          className="probe"
        />
      </svg>
      <p className="nnp-boundary">
        P(class 1) at probe = {boundaryReadout.toFixed(3)}
        {showContour ? " · contour at 0.5" : ""}
      </p>
      {zoomed && (
        <button
          type="button"
          className="nnp-minimap"
          onClick={() => onView(WORLD)}
          aria-label="Reset field zoom"
        >
          <svg viewBox="0 0 88 60">
            <rect x="1" y="1" width="86" height="58" />
            {points.slice(0, 80).map((p, i) => {
              const { cx, cy } = toSvg(p.x, p.y, 88, 60);
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="1.1"
                  fill={p.label ? "#f06a4d" : "#3d8bff"}
                />
              );
            })}
            <rect
              className="window"
              x={((view.x0 - WORLD.x0) / (WORLD.x1 - WORLD.x0)) * 88}
              y={((WORLD.y1 - view.y1) / (WORLD.y1 - WORLD.y0)) * 60}
              width={((view.x1 - view.x0) / (WORLD.x1 - WORLD.x0)) * 88}
              height={((view.y1 - view.y0) / (WORLD.y1 - WORLD.y0)) * 60}
            />
          </svg>
        </button>
      )}
    </div>
  );
}
