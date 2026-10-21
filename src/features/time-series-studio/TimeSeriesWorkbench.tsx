import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  ChartNoAxesCombined,
  Database,
  Lightbulb,
  MoreHorizontal,
  Network,
  Pause,
  Play,
  RotateCcw,
  Scale,
  Settings2,
  SkipBack,
  SkipForward,
  Target,
} from "lucide-react";
import {
  LABS,
  DEFAULT_CONFIG,
  fmt,
  isNeural,
  neuralKind,
  type LabConfig,
  type LabKind,
  type NeuralKind,
} from "./types";
import {
  DEFAULT_POLICY,
  STUDIO_DATASETS,
  prepareDataset,
  download,
  csvCell,
  type StudioDataset,
  type DataPolicy,
} from "./datasets";
import { Panel, Select, Slider, DatasetExplorer } from "./components";
import { ScientificChart, type ChartLine } from "./ScientificChart";
import { NeuralInspector } from "./NeuralInspector";
import { ConfigurationPanel } from "./ConfigurationPanel";
import { LESSONS } from "./lessons";
import {
  classicalFit,
  optimizeClassical,
  splitSeries,
  detectCausal,
  alertIndexes,
  baselineResults,
  type ForecastResult,
} from "./engine";
import { forecastMetrics } from "../../lib/timeSeries/forecastMetrics";
import {
  differenceSeries,
  autocorrelation,
  partialAutocorrelation,
} from "../../lib/timeSeries/arima";
import { futureTimestamps } from "../../lib/timeSeries/timeSeriesSplit";
import { fitStatistical } from "./statistical";
import { alphaScenarios, replayBenchmark } from "./comparison";
import {
  trainNeural,
  reloadNeural,
  type NeuralSession,
  type TrainingEpoch,
  type StateFrame,
} from "./neural";
import { readLoadedDataset } from "../../lib/timeSeries/useActiveTimeSeries";
import "./TimeSeriesWorkbench.css";
type Tab =
  | "Learn"
  | "Visualize"
  | "Dataset"
  | "Transform"
  | "Train"
  | "Metrics"
  | "Compare"
  | "Explain"
  | "More";
type Experiment = {
  id: string;
  name: string;
  kind: LabKind;
  architecture?: NeuralKind;
  dataset: string;
  target: string;
  key: string;
  config: LabConfig;
  result: ForecastResult;
  created: string;
  metrics: ReturnType<typeof forecastMetrics>;
};
const STORAGE = "aimers.ts.experiments.v1";
const COLORS = ["#2a9bff", "#27e4d5", "#c479ff", "#ffbc52", "#fb5a87"];
function loadExperiments(): Experiment[] {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE) ?? "[]");
    return Array.isArray(items)
      ? items
          .filter(
            (item) =>
              item &&
              typeof item.id === "string" &&
              item.config &&
              item.metrics &&
              Array.isArray(item.result?.forecast),
          )
          .slice(0, 40)
      : [];
  } catch {
    return [];
  }
}
function dataHash(points: Array<{ date: string; value: number }>) {
  let hash = 2166136261;
  for (const point of points) {
    for (const char of `${point.date}:${point.value};`) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
  }
  return (hash >>> 0).toString(16);
}
const tabIcons = {
  Learn: BookOpen,
  Visualize: ChartNoAxesCombined,
  Dataset: Database,
  Transform: Settings2,
  Train: Play,
  Metrics: Activity,
  Compare: Scale,
  Explain: Lightbulb,
  More: MoreHorizontal,
};
export default function TimeSeriesWorkbench({ kind }: { kind: LabKind }) {
  const meta = LABS[kind],
    lesson = LESSONS[kind],
    neural = isNeural(kind),
    anomaly = kind === "anomaly-detection";
  const [tab, setTab] = useState<Tab>("Visualize");
  const initialDataset = () => {
    try {
      const id = localStorage.getItem("aimers.ts.dataset");
      if (STUDIO_DATASETS.some((d) => d.id === id)) return id!;
    } catch {
      /* storage is optional */
    }
    return anomaly
      ? "spike-anomalies"
      : neural
        ? "sine-wave"
        : "trend-seasonal";
  };
  const [datasetId, setDatasetId] = useState(initialDataset);
  const [uploads, setUploads] = useState<StudioDataset[]>(() => {
    const active = readLoadedDataset(`/ml/time-series/${kind}`);
    if (!active) return [];
    const columns = active.columns ?? Object.keys(active.data[0] ?? {});
    return [
      {
        id: "handoff",
        name: active.name,
        description: "Opened from the application Dataset Library.",
        frequency: "unknown",
        period: 7,
        unit: "value",
        source:
          "Dataset Library handoff; provenance as provided in the library",
        license: "See originating dataset",
        synthetic: false,
        table: { columns, data: active.data },
        dateColumn:
          columns.find((c) => /date|time|year/i.test(c)) ?? columns[0],
        target:
          columns.find(
            (c) =>
              c !==
                (columns.find((c) => /date|time|year/i.test(c)) ??
                  columns[0]) &&
              active.data.some((r) => typeof r[c] === "number"),
          ) ?? columns[1],
      },
    ];
  });
  const [useHandoff, setUseHandoff] = useState(
    () => !!readLoadedDataset(`/ml/time-series/${kind}`),
  );
  const dataset =
    [...STUDIO_DATASETS, ...uploads].find(
      (d) => d.id === (useHandoff ? "handoff" : datasetId),
    ) ?? STUDIO_DATASETS[0];
  const [target, setTarget] = useState(""),
    [dateColumn, setDateColumn] = useState("");
  const resolvedTarget = target || dataset.target,
    resolvedDate = dateColumn || dataset.dateColumn;
  const [policy, setPolicy] = useState<DataPolicy>(DEFAULT_POLICY),
    [transform, setTransform] = useState("none");
  const [config, setConfig] = useState<LabConfig>(() => ({
    ...DEFAULT_CONFIG,
    season: Math.max(
      2,
      STUDIO_DATASETS.find((d) => d.id === initialDataset())?.period ?? 12,
    ),
    ...(new URLSearchParams(location.search).has("quick")
      ? { epochs: 1, units: 3, lookback: 6, horizon: 3 }
      : {}),
    window: anomaly ? 24 : 12,
  }));
  const [architecture, setArchitecture] = useState<NeuralKind>(
    neural ? neuralKind(kind) : "rnn",
  );
  const [rawVisible, setRawVisible] = useState(true),
    [modelVisible, setModelVisible] = useState(true),
    [bandVisible, setBandVisible] = useState(true),
    [windowVisible, setWindowVisible] = useState(true),
    [residualVisible, setResidualVisible] = useState(true);
  const [step, setStep] = useState(30),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(500),
    [frame, setFrame] = useState(0);
  const [injections, setInjections] = useState<
      Array<{ index: number; type: string }>
    >([]),
    [injectType, setInjectType] = useState("spike");
  const [trained, setTrained] = useState<ForecastResult | null>(null),
    [epochs, setEpochs] = useState<TrainingEpoch[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState(
      "Ready. Explore the data and adjust a parameter.",
    );
  const session = useRef<NeuralSession | null>(null),
    abort = useRef<AbortController | null>(null),
    generation = useRef(0);
  const [experiments, setExperiments] = useState<Experiment[]>(loadExperiments),
    [experimentName, setExperimentName] = useState(""),
    [comparison, setComparison] = useState<
      Array<{ name: string; result: ForecastResult }>
    >([]),
    [future, setFuture] = useState<number[]>([]),
    [inferenceMs, setInferenceMs] = useState<number | null>(null);
  const [answer, setAnswer] = useState(""),
    [answerMessage, setAnswerMessage] = useState(""),
    [challengeDone, setChallengeDone] = useState<string[]>([]),
    [winner, setWinner] = useState("");
  const [modelView, setModelView] = useState<{
    frames: StateFrame[];
    backend: string;
    inputShape: (number | null)[];
    outputShape: (number | null)[];
  } | null>(null);
  const [configured, setConfigured] = useState(false);
  const [alphaChoices, setAlphaChoices] = useState([0.1, 0.3, 0.7]);
  const prepared = useMemo(() => {
    try {
      return {
        ...prepareDataset(dataset, resolvedTarget, resolvedDate, policy),
        error: "",
      };
    } catch (e) {
      return {
        points: [],
        missing: 0,
        duplicates: 0,
        frequency: dataset.frequency,
        gaps: 0,
        regular: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, [dataset, resolvedTarget, resolvedDate, policy]);
  const points = useMemo(() => {
    let data = prepared.points.map((p) => ({ ...p }));
    if (transform === "log") {
      if (data.some((p) => p.value <= 0)) return [];
      data = data.map((p) => ({ ...p, value: Math.log(p.value) }));
    }
    if (transform === "difference")
      data = data
        .slice(1)
        .map((p, i) => ({ ...p, value: p.value - prepared.points[i].value }));
    const values = data.map((p) => p.value),
      mean = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length),
      scale = Math.max(
        1,
        Math.sqrt(
          values.reduce((s, v) => s + (v - mean) ** 2, 0) /
            Math.max(1, values.length),
        ),
      );
    for (const injection of injections)
      for (let i = injection.index; i < data.length; i++) {
        if (
          injection.type === "shift" ||
          i === injection.index ||
          (injection.type === "seasonal" && i < injection.index + config.season)
        )
          data[i].value +=
            (injection.type === "drop" ? -1 : 1) *
            scale *
            (injection.type === "shift"
              ? 2.5
              : injection.type === "seasonal"
                ? Math.sin(((i - injection.index + 1) * Math.PI) / 2) * 4
                : 7);
      }
    return data;
  }, [prepared.points, transform, injections, config.season]);
  const values = useMemo(() => points.map((p) => p.value), [points]);
  const split = useMemo(
    () => splitSeries(values, config.holdout),
    [values, config.holdout],
  );
  const dataError =
    prepared.error ||
    (transform === "log" && !points.length
      ? "Log transform requires strictly positive observations."
      : "");
  const regular = prepared.regular;
  const fitBlocked = !!dataError || policy.missing === "linear" || !regular;
  const computed = useMemo(() => {
    if (
      neural ||
      anomaly ||
      kind === "arima-concept" ||
      !split.history.length ||
      fitBlocked
    )
      return { result: null, error: "" };
    try {
      return { result: classicalFit(kind, split.history, config), error: "" };
    } catch (e) {
      return {
        result: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, [kind, neural, anomaly, split.history, config, fitBlocked]);
  const result = neural || kind === "arima-concept" ? trained : computed.result;
  const metrics = useMemo(
    () =>
      result
        ? forecastMetrics(
            split.test,
            result.forecast,
            split.history,
            config.season,
          )
        : null,
    [result, split.test, split.history, config.season],
  );
  const baselines = useMemo(
    () =>
      split.history.length
        ? baselineResults(
            split.history,
            split.test,
            config.horizon,
            config.season,
          )
        : [],
    [split, config.horizon, config.season],
  );
  const evaluationKey = `${dataHash(points)}:${resolvedTarget}:${transform}:${split.origin}:${config.horizon}:${config.season}`;
  const compatible = experiments.filter((e) => e.key === evaluationKey);
  const detector = useMemo(
    () => (anomaly ? detectCausal(values, config) : []),
    [anomaly, values, config],
  );
  const currentStep = Math.max(0, Math.min(step, values.length - 1));
  const displayedPoints = anomaly ? points.slice(0, currentStep + 1) : points;
  const shownDetector = detector.slice(0, displayedPoints.length),
    alerts = alertIndexes(shownDetector, config.cooldown);
  const nativeTruthAvailable =
    dataset.synthetic &&
    !!dataset.knownAnomalies &&
    policy.resample === "original" &&
    transform === "none" &&
    resolvedTarget === dataset.target &&
    resolvedDate === dataset.dateColumn;
  const benchmark = replayBenchmark(
    shownDetector.length,
    alerts,
    injections,
    config.season,
    nativeTruthAvailable ? dataset.knownAnomalies : [],
  );
  const selectedFrame =
    modelView?.frames[Math.min(frame, (modelView?.frames.length ?? 1) - 1)];
  const completion = [
    !!points.length,
    configured,
    !!result || (anomaly && currentStep >= config.window),
    !!metrics?.n || (anomaly && injections.length > 0),
    challengeDone.length > 0,
  ];
  const completionCount = completion.filter(Boolean).length;
  const invalidate = () => {
    generation.current++;
    abort.current?.abort();
    abort.current = null;
    session.current?.dispose();
    session.current = null;
    setTrained(null);
    setModelView(null);
    setEpochs([]);
    setFuture([]);
    setComparison([]);
    setBusy(false);
    setInferenceMs(null);
    setError("");
    setStatus("Configuration changed. Previous fitted results were cleared.");
  };
  const update = <K extends keyof LabConfig>(key: K, value: LabConfig[K]) => {
    invalidate();
    setConfigured(true);
    setConfig((c) => ({ ...c, [key]: value }));
  };
  const chooseDataset = (id: string) => {
    invalidate();
    setUseHandoff(false);
    setDatasetId(id);
    setTarget("");
    setDateColumn("");
    setPolicy(DEFAULT_POLICY);
    setTransform("none");
    setInjections([]);
    setPlaying(false);
    setStep(30);
    setChallengeDone([]);
    const next = [...STUDIO_DATASETS, ...uploads].find((d) => d.id === id);
    if (next) setConfig((c) => ({ ...c, season: Math.max(2, next.period) }));
    try {
      localStorage.setItem("aimers.ts.dataset", id);
    } catch {
      /* selection is optional */
    }
  };
  useEffect(
    () => () => {
      generation.current++;
      abort.current?.abort();
      session.current?.dispose();
    },
    [],
  );
  useEffect(() => {
    if (!playing || !values.length) return;
    const timer = setInterval(() => {
      if (neural && session.current) {
        setFrame((i) => (i + 1) % session.current!.frames.length);
      } else
        setStep((i) => {
          if (i >= values.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
    }, speed);
    return () => clearInterval(timer);
  }, [playing, speed, values.length, neural]);
  const run = async () => {
    if (fitBlocked) {
      setError(
        dataError ||
          (!regular
            ? "Regularize sampling in Dataset before fitting."
            : "Forecast evaluation is disabled for retrospective interpolation. Choose forward fill or repair the series before upload."),
      );
      return;
    }
    invalidate();
    const token = generation.current;
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setStatus(
      neural
        ? "Training real recurrent layers…"
        : "Fitting ARIMA/SARIMA in a background worker…",
    );
    try {
      if (neural) {
        const output = await trainNeural(
          values,
          config,
          architecture,
          (e) => {
            if (generation.current === token) setEpochs((h) => [...h, e]);
          },
          controller.signal,
        );
        if (generation.current !== token) {
          output.session.dispose();
          return;
        }
        session.current = output.session;
        setModelView({
          frames: output.session.frames,
          backend: output.session.backend,
          inputShape: output.session.model.inputs[0].shape,
          outputShape: output.session.model.outputs[0].shape,
        });
        setTrained(output.result);
        setFrame(0);
      } else {
        const output = await fitStatistical(
          split.history,
          config,
          controller.signal,
        );
        if (generation.current !== token) return;
        setTrained(output);
      }
      setStatus("Fit complete. Holdout forecasts and metrics are ready.");
    } catch (e) {
      if (generation.current === token) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("Fit did not complete. Review the error and configuration.");
      }
    } finally {
      if (generation.current === token) setBusy(false);
    }
  };
  const autoOptimize = () => {
    try {
      const next = optimizeClassical(kind, split.train, config);
      invalidate();
      setConfig(next);
      setStatus(
        "Optimized on training-only one-step squared error; holdout was not used.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const saveExperiment = () => {
    if (!result || !metrics?.n) return;
    const saved: Experiment = {
      id: crypto.randomUUID(),
      name:
        experimentName.trim() ||
        `${neural ? architecture.toUpperCase() : meta.title} · ${new Date().toLocaleTimeString()}`,
      kind,
      architecture: neural ? architecture : undefined,
      dataset: dataset.id,
      target: resolvedTarget,
      key: evaluationKey,
      config: { ...config },
      result,
      created: new Date().toISOString(),
      metrics,
    };
    const next = [saved, ...experiments].slice(0, 40);
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setExperiments(next);
      setStatus(
        "Experiment saved locally. Uploaded observations are not included.",
      );
    } catch {
      setError(
        "Browser storage is full or unavailable. Export the experiment instead.",
      );
    }
  };
  const runComparisons = async () => {
    const token = generation.current;
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError("");
    const rows: Array<{ name: string; result: ForecastResult }> = [];
    try {
      for (const model of [
        "moving-average",
        "exponential-smoothing",
        "holt-winters",
      ] as LabKind[]) {
        try {
          rows.push({
            name: LABS[model].title,
            result: classicalFit(model, split.history, config),
          });
        } catch {
          /* incompatible seasonal models are omitted */
        }
      }
      const statistical = await fitStatistical(
        split.history,
        config,
        controller.signal,
      );
      rows.push({
        name: `ARIMA (${config.p},${config.d},${config.q})`,
        result: statistical,
      });
    } catch (e) {
      if (generation.current === token)
        setError(
          `Statistical comparison unavailable: ${e instanceof Error ? e.message : String(e)}`,
        );
    } finally {
      if (generation.current === token) {
        setComparison(rows);
        setBusy(false);
        setStatus(
          "Compared compatible models at the identical origin, horizon, target and holdout. Saved neural experiments appear alongside them.",
        );
      }
    }
  };
  const infer = async () => {
    const fitted = session.current;
    if (busy || fitBlocked || (neural && !fitted)) return;
    const token = generation.current;
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    try {
      const start = performance.now();
      const forecast = neural
        ? await fitted!.predict(values, config.horizon)
        : kind === "arima-concept"
          ? (await fitStatistical(values, config, controller.signal)).forecast
          : classicalFit(kind, values, config).forecast;
      if (token === generation.current) {
        setFuture(forecast);
        setInferenceMs(performance.now() - start);
        setStatus(
          "Future forecast generated from latest observations. Neural weights remain frozen; classical states are refitted to available history. No future actuals exist for evaluation, and the earlier holdout metrics are unchanged.",
        );
      }
    } catch (e) {
      if (token === generation.current) setError(String(e));
    } finally {
      if (token === generation.current) setBusy(false);
    }
  };
  const restoreModel = async () => {
    invalidate();
    const token = generation.current;
    try {
      const model = await reloadNeural(architecture, split.history);
      if (token !== generation.current) {
        model.dispose();
        return;
      }
      const metadata = JSON.parse(
        localStorage.getItem(`aimers.ts.model-context.${architecture}`) ??
          "null",
      );
      if (
        !metadata ||
        metadata.dataHash !== dataHash(points) ||
        metadata.target !== resolvedTarget
      ) {
        model.dispose();
        throw new Error(
          "Saved model belongs to a different dataset/target. Select the original data.",
        );
      }
      session.current = model;
      setModelView({
        frames: model.frames,
        backend: model.backend,
        inputShape: model.model.inputs[0].shape,
        outputShape: model.model.outputs[0].shape,
      });
      setConfig(model.config);
      const forecast = await model.predict(
        splitSeries(values, model.config.holdout).history,
        model.config.horizon,
      );
      if (token !== generation.current) {
        model.dispose();
        return;
      }
      setTrained({
        fitted: [],
        forecast,
        lower: [],
        upper: [],
        components: {},
        duration: null,
        params: model.parameters,
        memory: model.bytes,
        note: "Reloaded actual model weights from IndexedDB. Original training duration is unavailable.",
      });
      setStatus("Model weights and scaling metadata reloaded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const saveModel = async () => {
    if (!session.current) return;
    try {
      await session.current.save();
      localStorage.setItem(
        `aimers.ts.model-context.${architecture}`,
        JSON.stringify({ dataHash: dataHash(points), target: resolvedTarget }),
      );
      setStatus("Actual model weights saved to browser IndexedDB.");
    } catch (e) {
      setError(String(e));
    }
  };
  const chartDates = useMemo(() => {
    const needed = Math.max(
      points.length,
      split.origin + (result?.forecast.length ?? 0),
    );
    const dates = points.map((p) => p.date);
    if (needed > dates.length && dates.length)
      dates.push(
        ...futureTimestamps(
          dates.at(-1)!,
          needed - dates.length,
          prepared.frequency,
        ).map((d) => d.toISOString()),
      );
    return dates;
  }, [points, split.origin, result, prepared.frequency]);
  const exportPredictions = () => {
    if (!result) return;
    download(
      "predictions.csv",
      [
        "timestamp,actual,forecast,lower,upper",
        ...result.forecast.map((v, i) =>
          [
            csvCell(chartDates[split.origin + i]),
            split.test[i] ?? "",
            v,
            result.lower[i] ?? "",
            result.upper[i] ?? "",
          ].join(","),
        ),
      ].join("\n"),
      "text/csv",
    );
  };
  const chartLines: ChartLine[] = [];
  if (rawVisible)
    chartLines.push({
      name: anomaly ? "Signal" : "Observed",
      values: anomaly ? displayedPoints.map((p) => p.value) : values,
      color: COLORS[0],
    });
  if (anomaly && modelVisible)
    chartLines.push({
      name: "Expected (past only)",
      values: shownDetector.map((p) => p.expected),
      color: COLORS[1],
    });
  if (anomaly)
    chartLines.push({
      name: "Point anomaly",
      values: shownDetector.map((p) => (p.anomaly ? p.value : NaN)),
      color: COLORS[4],
      scatter: true,
    });
  if (result && modelVisible) {
    if (result.fitted.length)
      chartLines.push({
        name:
          kind === "exponential-smoothing"
            ? "One-step forecast"
            : "Descriptive smoother",
        values: result.fitted,
        color: COLORS[1],
      });
    chartLines.push({
      name: neural
        ? `${architecture.toUpperCase()} holdout forecast`
        : "Holdout forecast",
      values: [...Array(split.origin).fill(NaN), ...result.forecast],
      color: COLORS[2],
      dashed: true,
    });
  }
  const alphaComparisons = useMemo(
    () =>
      kind === "exponential-smoothing" && !fitBlocked
        ? alphaScenarios(split.history, config, alphaChoices)
        : [],
    [kind, fitBlocked, split.history, config, alphaChoices],
  );
  if (
    tab === "Compare" &&
    kind === "exponential-smoothing" &&
    split.history.length
  )
    for (const [i, scenario] of alphaComparisons.entries()) {
      const r = scenario.result;
      chartLines.push({
        name: scenario.name,
        values: [...r.components.Level, ...r.forecast],
        color: COLORS[(i + 1) % COLORS.length],
      });
    }
  const allComparisons = [
    ...alphaComparisons,
    ...baselines.map((b) => ({
      name: b.name,
      result: {
        fitted: [],
        forecast: b.forecast,
        lower: [],
        upper: [],
        components: {},
        note: "Baseline",
        duration: null,
      } as ForecastResult,
    })),
    ...comparison,
    ...compatible.map((e) => ({ name: e.name, result: e.result })),
  ];
  const selectedWindow =
    kind === "moving-average"
      ? ((config.alignment === "trailing"
          ? [
              currentStep - config.window + 1 - config.lag,
              currentStep - config.lag,
            ]
          : config.alignment === "leading"
            ? [
                currentStep - config.lag,
                currentStep + config.window - 1 - config.lag,
              ]
            : [
                currentStep - Math.floor((config.window - 1) / 2) - config.lag,
                currentStep + Math.ceil((config.window - 1) / 2) - config.lag,
              ]) as [number, number])
      : undefined;
  const windowValues =
    selectedWindow &&
    selectedWindow[0] >= 0 &&
    selectedWindow[1] < values.length
      ? values.slice(selectedWindow[0], selectedWindow[1] + 1)
      : [];
  const windowSum = windowValues.reduce((a, b) => a + b, 0),
    windowMean = windowValues.length ? windowSum / windowValues.length : NaN;
  const fullSmoothing = useMemo(
    () =>
      (kind === "moving-average" || kind === "exponential-smoothing") &&
      values.length
        ? classicalFit(kind, values, config)
        : null,
    [kind, values, config],
  );
  const initialSesLevel =
    config.initialization === "mean"
      ? values.slice(0, config.window).reduce((sum, value) => sum + value, 0) /
        Math.min(values.length, config.window)
      : values[0];
  if (fullSmoothing && modelVisible && tab !== "Compare") {
    const line = chartLines.find((l) => l.name === "Descriptive smoother");
    if (line) line.values = fullSmoothing.fitted;
  }
  const residuals = result?.components.Residual ?? [];
  const tabs: Tab[] = [
    "Learn",
    "Visualize",
    "Dataset",
    "Transform",
    ...(neural || kind === "arima-concept" ? ["Train" as Tab] : []),
    "Metrics",
    "Compare",
    "Explain",
    "More",
  ];
  const numericExpected =
    kind === "moving-average"
      ? windowMean
      : kind === "exponential-smoothing"
        ? fullSmoothing?.components.Level[currentStep]
        : kind === "arima-concept"
          ? differenceSeries(values, config.d)[
              Math.min(currentStep, values.length - config.d - 1)
            ]
          : anomaly
            ? shownDetector[currentStep]?.upper
            : neural
              ? selectedFrame?.hidden.reduce((a, b) => a + b, 0) /
                (selectedFrame?.hidden.length || 1)
              : result?.components.Level[
                  Math.min(currentStep, split.origin - 1)
                ];
  const numericQuestion =
    kind === "moving-average"
      ? "Calculate the mean of the highlighted window."
      : kind === "exponential-smoothing"
        ? "Use the selected step’s update to report the new level."
        : kind === "arima-concept"
          ? "Report the selected observation of the differenced series."
          : anomaly
            ? "Calculate the upper threshold for the selected replay step."
            : neural
              ? "Calculate the mean hidden-state activation at the selected recurrent step."
              : "Report the selected level component from the decomposition.";
  const addChallenge = (id: string) =>
    setChallengeDone((v) => (v.includes(id) ? v : [...v, id]));
  const checkAnswer = () => {
    if (
      answer.trim() !== "" &&
      Number.isFinite(Number(answer)) &&
      Number.isFinite(numericExpected) &&
      Math.abs(Number(answer) - numericExpected!) <=
        Math.max(0.015, Math.abs(numericExpected!) * 0.002)
    ) {
      addChallenge("beginner");
      setAnswerMessage(
        "Correct: your calculation agrees with the current data and model.",
      );
    } else
      setAnswerMessage(
        "Not yet. Inspect the selected step and try again (rounding tolerance 0.2%).",
      );
  };
  const controls = (
    <ConfigurationPanel
      kind={kind}
      architecture={architecture}
      setArchitecture={(v) => {
        invalidate();
        setArchitecture(v);
      }}
      config={config}
      update={update}
      dataset={dataset}
      datasets={[...STUDIO_DATASETS, ...uploads]}
      chooseDataset={chooseDataset}
      openDataset={() => setTab("Dataset")}
      count={values.length}
      trainEnd={split.trainEnd}
      origin={split.origin}
      reset={() => {
        invalidate();
        setConfig({ ...DEFAULT_CONFIG, season: Math.max(2, dataset.period) });
        setInjections([]);
        setStep(30);
        setPlaying(false);
      }}
      optimize={autoOptimize}
      run={run}
      stop={() => {
        invalidate();
        setStatus(
          "Cancelled. Partial fits are not presented as complete results.",
        );
      }}
      busy={busy}
      blocked={fitBlocked}
      inject={() => {
        invalidate();
        setInjections((v) => [
          ...v,
          {
            index: Math.min(
              values.length - 1,
              Math.max(config.window + 1, currentStep),
            ),
            type: injectType,
          },
        ]);
        setStatus(
          "Injected a simulated disruption into a derived copy. Original data is unchanged.",
        );
      }}
      injectType={injectType}
      setInjectType={setInjectType}
      resetStream={() => {
        setInjections([]);
        setStep(config.window + 1);
        setPlaying(false);
      }}
      display={{
        raw: rawVisible,
        model: modelVisible,
        band: bandVisible,
        window: windowVisible,
        residual: residualVisible,
      }}
      setDisplay={(key, value) =>
        ({
          raw: setRawVisible,
          model: setModelVisible,
          band: setBandVisible,
          window: setWindowVisible,
          residual: setResidualVisible,
        })[key](value)
      }
    />
  );
  const learning = (
    <div className="tsw-learn-layout">
      <div>
        <Panel title="The idea, in plain words">
          <p>{lesson.problem}</p>
          <h3>Build the intuition</h3>
          <p>{lesson.intuition}</p>
          <div className="tsw-formula">{lesson.formula}</div>
          <p>{lesson.variables}</p>
          <h3>A worked numerical example</h3>
          <p>{lesson.example}</p>
        </Panel>
        <Panel title="How the algorithm executes">
          <ol className="tsw-numbered">
            {lesson.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <div className="tsw-form-grid">
            <div>
              <h3>Where to use it</h3>
              <p>{lesson.applications}</p>
              <h3>Strengths</h3>
              <p>{lesson.strengths}</p>
            </div>
            <div>
              <h3>Limitations</h3>
              <p>{lesson.limits}</p>
              <h3>Choose another method when…</h3>
              <p>{lesson.alternative}</p>
            </div>
          </div>
          <div className="tsw-warning">Common mistake: {lesson.mistake}</div>
        </Panel>
      </div>
      <div>
        <Panel title="Practice with real results">
          <h3>1 · Beginner: calculate a step</h3>
          <p>{numericQuestion}</p>
          <button onClick={() => setTab("Visualize")}>
            Inspect the current step
          </button>
          <label className="tsw-select">
            Your numeric answer
            <input
              aria-label="Challenge numeric answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <button
            disabled={!Number.isFinite(numericExpected)}
            onClick={checkAnswer}
          >
            Check calculation
          </button>
          <small>{answerMessage}</small>
          <hr />
          <h3>2 · Intermediate: improve the baseline</h3>
          <p>
            {anomaly
              ? "Inject a disruption and adjust the detector to identify it without flagging every observation."
              : "Tune parameters to achieve lower holdout RMSE than the naïve forecast on this dataset."}
          </p>
          <button
            onClick={() => {
              const passed = anomaly
                ? injections.some((v) => detector[v.index]?.anomaly) &&
                  detector.filter((d) => d.anomaly).length < values.length / 3
                : !!metrics?.n &&
                  metrics.rmse < (baselines[0]?.metrics.rmse ?? 0);
              if (passed) {
                addChallenge("intermediate");
                setAnswerMessage(
                  "Verified against actual current detections / holdout errors.",
                );
              } else
                setAnswerMessage(
                  "The current results do not meet the challenge yet. Explore another configuration.",
                );
            }}
          >
            Verify current result
          </button>
          <hr />
          <h3>3 · Advanced: compare experiments</h3>
          <p>
            {anomaly
              ? "Change the threshold, replay an injected anomaly, and quantify the number of alerts."
              : "Save two distinct configurations on the same evaluation window, then identify the lower holdout RMSE."}
          </p>
          {anomaly ? (
            <button
              onClick={() => {
                if (
                  injections.length &&
                  config.threshold !== DEFAULT_CONFIG.threshold &&
                  currentStep >= config.window &&
                  alerts.length > 0
                ) {
                  addChallenge("advanced");
                  setAnswerMessage(
                    `Verified ${alerts.length} alerts with threshold ${config.threshold}. Explain the tradeoff between misses and extra alerts.`,
                  );
                } else
                  setAnswerMessage(
                    "Inject, adjust the threshold, then replay until an alert appears.",
                  );
              }}
            >
              Verify anomaly investigation
            </button>
          ) : (
            <>
              <Select
                label="Best saved experiment"
                value={winner}
                options={[
                  { value: "", label: "Choose after comparing" },
                  ...compatible.map((e) => ({ value: e.id, label: e.name })),
                ]}
                onChange={setWinner}
              />
              <button
                onClick={() => {
                  const distinct = new Set(
                    compatible.map(
                      (e) =>
                        `${e.kind}:${e.architecture}:${JSON.stringify(e.config)}`,
                    ),
                  );
                  const best = [...compatible].sort(
                    (a, b) => a.metrics.rmse - b.metrics.rmse,
                  )[0];
                  if (distinct.size >= 2 && winner === best?.id) {
                    addChallenge("advanced");
                    setAnswerMessage(
                      "Correct. Lower holdout error wins this comparison, not necessarily every future dataset.",
                    );
                  } else
                    setAnswerMessage(
                      "Save two distinct configurations, inspect holdout errors, and try again.",
                    );
                }}
              >
                Check comparison
              </button>
            </>
          )}
          <p className="tsw-notice">
            {challengeDone.length} / 3 challenges verified from calculations and
            results.
          </p>
        </Panel>
      </div>
    </div>
  );
  const more = (
    <div className="tsw-learn-layout">
      <Panel title="Experiments and exports">
        <label className="tsw-select">
          Experiment name
          <input
            value={experimentName}
            onChange={(e) => setExperimentName(e.target.value)}
            placeholder={`${meta.title} experiment`}
          />
        </label>
        <div className="tsw-inline">
          <button disabled={!result || !metrics?.n} onClick={saveExperiment}>
            Save experiment locally
          </button>
          <button
            onClick={() =>
              download(
                "configuration.json",
                JSON.stringify(
                  {
                    kind,
                    architecture,
                    config,
                    dataset: dataset.id,
                    target: resolvedTarget,
                    policy,
                    transform,
                    seed: config.seed,
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            Export configuration JSON
          </button>
          <button disabled={!result} onClick={exportPredictions}>
            Prediction CSV
          </button>
          <button
            disabled={!metrics}
            onClick={() =>
              download(
                "metrics.csv",
                "metric,value\n" +
                  Object.entries(metrics ?? {})
                    .map(([k, v]) => `${k},${v ?? ""}`)
                    .join("\n"),
                "text/csv",
              )
            }
          >
            Metrics CSV
          </button>
          <button
            onClick={() =>
              download(
                "experiment-summary.json",
                JSON.stringify(
                  {
                    title: meta.title,
                    dataset: dataset.name,
                    target: resolvedTarget,
                    config,
                    transform,
                    policy,
                    metrics,
                    result,
                    created: new Date().toISOString(),
                    modelMetadata: session.current
                      ? {
                          mean: session.current.mean,
                          scale: session.current.scale,
                          backend: session.current.backend,
                        }
                      : null,
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            Experiment summary
          </button>
        </div>
        <p className="tsw-muted">
          History stores configurations and aggregate results, not uploaded raw
          observations. Exporting occurs only after you click an export button.
        </p>
        <div className="tsw-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Experiment</th>
                <th>Dataset</th>
                <th>RMSE</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.name}
                    <small>{e.created.slice(0, 19).replace("T", " ")}</small>
                  </td>
                  <td>{e.dataset}</td>
                  <td>{fmt(e.metrics.rmse)}</td>
                  <td>
                    <button
                      disabled={
                        e.dataset !== dataset.id ||
                        e.target !== resolvedTarget ||
                        e.kind !== kind
                      }
                      onClick={() => {
                        invalidate();
                        setConfig(e.config);
                        if (e.architecture) setArchitecture(e.architecture);
                        if (
                          e.key ===
                          `${dataHash(points)}:${resolvedTarget}:${transform}:${splitSeries(values, e.config.holdout).origin}:${e.config.horizon}:${e.config.season}`
                        )
                          setTrained(e.result);
                        setStatus(
                          "Experiment configuration reloaded. Retrain before inspecting neural weights.",
                        );
                      }}
                    >
                      Reload configuration
                    </button>
                    <button
                      onClick={() => {
                        const next = experiments.filter((v) => v.id !== e.id);
                        setExperiments(next);
                        try {
                          localStorage.setItem(STORAGE, JSON.stringify(next));
                        } catch {
                          /* view deletion still succeeds */
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Model weights and reproducibility">
        {neural ? (
          <>
            <p>
              Save/reload stores actual TensorFlow.js weights in IndexedDB.
              Downloads include model JSON and binary weights. Configuration and
              scaler metadata can be exported with the summary.
            </p>
            <div className="tsw-inline">
              <button disabled={!modelView} onClick={saveModel}>
                Save trained model
              </button>
              <button onClick={restoreModel}>Reload trained model</button>
              <button
                disabled={!modelView}
                onClick={() =>
                  session.current?.export().catch((e) => setError(String(e)))
                }
              >
                Download model weights
              </button>
            </div>
          </>
        ) : (
          <p>
            Classical experiments reproduce from the selected dataset,
            transformations, parameters and origin. Uploaded observations must
            be selected again after a reload.
          </p>
        )}
        <h3>Runtime and diagnostics</h3>
        {modelView && (
          <p data-testid="ts-model-shapes">
            Actual model input: [
            {modelView.inputShape.map((v) => v ?? "batch").join(", ")}] ·
            output: [{modelView.outputShape.map((v) => v ?? "batch").join(", ")}
            ]. Each forecast step consumes {config.lookback} observations of one
            target and predicts one value.
          </p>
        )}
        <p>{result?.note ?? "No fitted model yet."}</p>
        <p>
          Backend: {modelView?.backend ?? "Not initialized"} · parameters:{" "}
          {result?.params ?? "Unavailable"} · float32 weights:{" "}
          {result?.memory ? `${fmt(result.memory / 1024)} KiB` : "Unavailable"}{" "}
          (excluding activations, optimizer and browser overhead).
        </p>
        <p>
          ARIMA likelihood criteria and residuals are unavailable from the
          binding. Neural uncertainty intervals remain unavailable without a
          calibrated estimator.
        </p>
      </Panel>
    </div>
  );
  return (
    <div
      className="ts-workbench"
      data-training-feedback="inline"
      data-time-series-lab={kind}
    >
      <Link className="tsw-back" to="/studios/time-series">
        <ArrowLeft size={14} /> Time Series Studio
      </Link>
      <header className="tsw-hero">
        <div className="tsw-hero-main">
          <div className="tsw-hero-icon">
            {neural ? <Network size={38} /> : <Activity size={38} />}
          </div>
          <div>
            <small>Lesson · {neural ? "Deep learning" : "Time series"}</small>
            <h1>{meta.title}</h1>
            <p>{meta.subtitle}</p>
            <div className="tsw-tags">
              {meta.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="tsw-objective">
          <Target size={25} />
          <div>
            <strong>Learning objective</strong>
            <p>{meta.objective}</p>
            <button onClick={() => setTab("Learn")}>Learn the idea →</button>
          </div>
        </div>
        <div className="tsw-progress">
          <svg
            viewBox="0 0 80 80"
            aria-label={`${completionCount} of 5 workflow stages complete`}
          >
            <circle
              cx="40"
              cy="40"
              r="31"
              fill="none"
              stroke="#1d3b65"
              strokeWidth="7"
            />
            <circle
              cx="40"
              cy="40"
              r="31"
              fill="none"
              stroke="#22ded0"
              strokeWidth="7"
              strokeDasharray={`${(completionCount / 5) * 195} 195`}
              transform="rotate(-90 40 40)"
            />
            <text
              x="40"
              y="45"
              textAnchor="middle"
              fill="#eff6ff"
              fontSize="17"
            >
              {completionCount * 20}%
            </text>
          </svg>
          <div>
            <strong>Your workflow</strong>
            <small>{completionCount} / 5 stages complete</small>
            <progress value={completionCount} max={5} />
          </div>
        </div>
      </header>
      <nav
        className="tsw-nav"
        data-native-lesson-tabs=""
        aria-label="Time series lesson sections"
        role="tablist"
      >
        {tabs.map((t) => {
          const Icon = tabIcons[t];
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              aria-controls="tsw-active-panel"
              id={`tsw-tab-${t}`}
              className={tab === t ? "is-active" : ""}
              onClick={() => {
                setTab(t);
                setError("");
              }}
            >
              <Icon size={18} />
              {t}
            </button>
          );
        })}
      </nav>
      <div className="tsw-stepper">
        {[
          "Explore data",
          "Configure",
          "Fit / inspect",
          "Evaluate",
          "Complete a challenge",
        ].map((label, i) => (
          <button
            key={label}
            className={completion[i] ? "is-done" : ""}
            onClick={() =>
              setTab(
                (
                  [
                    "Dataset",
                    "Transform",
                    neural ? "Train" : "Visualize",
                    "Metrics",
                    "Learn",
                  ] as Tab[]
                )[i],
              )
            }
          >
            <b>{completion[i] ? "✓" : i + 1}</b>
            <span>{label}</span>
          </button>
        ))}
      </div>
      {(neural || kind === "arima-concept") && (
        <div className="tsw-actionbar">
          <button
            className="tsw-primary"
            disabled={busy || fitBlocked}
            onClick={run}
          >
            {neural ? "Train selected model" : "Fit selected ARIMA"}
          </button>
          {busy && (
            <button
              onClick={() => {
                invalidate();
                setStatus("Cancelled.");
              }}
            >
              Cancel fitting
            </button>
          )}
          {neural && (
            <button disabled={!modelView} onClick={infer}>
              Infer future values
            </button>
          )}
          <button onClick={() => setTab("More")}>Experiments & exports</button>
        </div>
      )}
      <div className="tsw-status" role="status">
        {status}
        {busy && <span className="tsw-working" />}
      </div>
      {(error || (tab !== "Dataset" && dataError) || computed.error) && (
        <div className="tsw-error" role="alert">
          {error || dataError || computed.error}
          {dataError && (
            <button onClick={() => setTab("Dataset")}>Review dataset</button>
          )}
        </div>
      )}
      {fitBlocked && !dataError && (
        <p className="tsw-warning">
          {policy.missing === "linear"
            ? "Retrospective interpolation can use future observations. Forecast fitting is disabled; choose causal forward fill or repair data before upload."
            : `Sampling is irregular (${prepared.gaps} missing positions on the inferred grid). Choose an explicit resampling and missing-value policy in Dataset before forecasting.`}
        </p>
      )}
      <div
        id="tsw-active-panel"
        role="tabpanel"
        aria-labelledby={`tsw-tab-${tab}`}
      >
        {tab === "Dataset" ? (
          <DatasetExplorer
            dataset={dataset}
            uploads={uploads}
            onDataset={chooseDataset}
            onUpload={(d) => {
              invalidate();
              setUploads((v) => [...v, d]);
              setDatasetId(d.id);
              setUseHandoff(false);
              setTarget("");
              setDateColumn("");
              setPolicy(DEFAULT_POLICY);
              setInjections([]);
              setTransform("none");
              setStep(30);
            }}
            target={resolvedTarget}
            onTarget={(v) => {
              invalidate();
              setTarget(v);
            }}
            dateColumn={resolvedDate}
            onDateColumn={(v) => {
              invalidate();
              setDateColumn(v);
            }}
            policy={policy}
            onPolicy={(p) => {
              invalidate();
              setPolicy(p);
            }}
            points={prepared.points}
            error={dataError}
          />
        ) : tab === "Learn" ? (
          learning
        ) : tab === "More" ? (
          more
        ) : (
          <div className="tsw-work-grid">
            <div className="tsw-canvas">
              {tab === "Transform" && (
                <Panel title="Prepare a derived series">
                  <Select
                    label="Value transformation"
                    value={transform}
                    options={[
                      { value: "none", label: "Original values" },
                      {
                        value: "log",
                        label: "Natural log (positive values only)",
                      },
                      { value: "difference", label: "First difference" },
                    ]}
                    onChange={(v) => {
                      invalidate();
                      setTransform(v);
                    }}
                  />
                  <p>
                    Transformations apply to a copy and change the modeling
                    target. Forecasts and metrics stay on the displayed
                    transformed scale. No silent inverse transformation is
                    applied.
                  </p>
                  <p>
                    Column mapping, duplicate handling, interpolation and
                    resampling are in Dataset. Neural scaling is fitted to the
                    training prefix only.
                  </p>
                  <button onClick={() => setTab("Dataset")}>
                    Open dataset preparation
                  </button>
                </Panel>
              )}
              {tab === "Train" && (
                <Panel title="Training workspace">
                  <p>
                    {neural
                      ? "Epochs below come from the actual TensorFlow.js fit. Validation targets follow training targets, and test data stays untouched."
                      : "ARIMA runs CTSA statistical likelihood fitting in a cancellable background worker. Orders must be compatible with the available history."}
                  </p>
                  <button
                    className="tsw-primary"
                    disabled={busy || fitBlocked}
                    onClick={run}
                  >
                    {neural ? "Train model" : "Run ARIMA model"}
                  </button>
                  {busy && (
                    <button
                      onClick={() => {
                        invalidate();
                        setStatus("Fit cancelled.");
                      }}
                    >
                      Stop
                    </button>
                  )}
                </Panel>
              )}
              {(tab === "Visualize" ||
                tab === "Train" ||
                tab === "Explain" ||
                tab === "Transform") && (
                <>
                  {neural && (
                    <NeuralInspector
                      kind={architecture}
                      frames={modelView?.frames ?? []}
                      index={frame}
                      onIndex={setFrame}
                    />
                  )}
                  <ScientificChart
                    title={
                      anomaly
                        ? "Signal replay & anomaly detection"
                        : tab === "Transform"
                          ? "Transformed series & forecast"
                          : `${meta.title} · observed & forecast`
                    }
                    dates={
                      anomaly ? displayedPoints.map((p) => p.date) : chartDates
                    }
                    lines={chartLines}
                    boundary={!anomaly ? split.origin : undefined}
                    selected={
                      neural
                        ? split.origin - config.lookback + frame
                        : currentStep
                    }
                    windowRange={
                      windowVisible
                        ? neural
                          ? [split.origin - config.lookback, split.origin - 1]
                          : selectedWindow
                        : undefined
                    }
                    band={
                      bandVisible
                        ? anomaly
                          ? {
                              lower: shownDetector.map((p) => p.lower),
                              upper: shownDetector.map((p) => p.upper),
                              offset: 0,
                            }
                          : result
                            ? {
                                lower: result.lower,
                                upper: result.upper,
                                offset: split.origin,
                              }
                            : undefined
                        : undefined
                    }
                    onSelect={(index) =>
                      neural
                        ? setFrame(
                            Math.max(
                              0,
                              Math.min(
                                config.lookback - 1,
                                index - (split.origin - config.lookback),
                              ),
                            ),
                          )
                        : setStep(index)
                    }
                    unit={
                      transform === "none"
                        ? dataset.unit
                        : transform === "log"
                          ? "log(value)"
                          : "Δ value"
                    }
                  />
                  <Panel
                    title={
                      neural
                        ? "Sequence playback"
                        : "Step through the observations"
                    }
                  >
                    <div className="tsw-playback">
                      <button
                        aria-label="Previous step"
                        onClick={() =>
                          neural
                            ? setFrame((v) => Math.max(0, v - 1))
                            : setStep((v) => Math.max(0, v - 1))
                        }
                      >
                        <SkipBack size={16} />
                      </button>
                      <button
                        className="tsw-primary"
                        disabled={neural && !modelView}
                        onClick={() => setPlaying((v) => !v)}
                      >
                        {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
                        {playing ? "Pause" : "Play"}
                      </button>
                      <button
                        aria-label="Next step"
                        onClick={() =>
                          neural
                            ? setFrame((v) =>
                                Math.min(
                                  (session.current?.frames.length ?? 1) - 1,
                                  v + 1,
                                ),
                              )
                            : setStep((v) => Math.min(values.length - 1, v + 1))
                        }
                      >
                        <SkipForward size={16} />
                      </button>
                      <button
                        aria-label="Reset playback"
                        onClick={() => {
                          setPlaying(false);
                          setStep(
                            anomaly
                              ? config.window + 1
                              : Math.min(values.length - 1, config.window),
                          );
                          setFrame(0);
                        }}
                      >
                        <RotateCcw size={16} />
                      </button>
                      <Select
                        label="Animation speed"
                        value={String(speed)}
                        options={[
                          { value: "1000", label: "Slow (1 step/s)" },
                          { value: "500", label: "Normal (2 steps/s)" },
                          { value: "150", label: "Fast (6.7 steps/s)" },
                        ]}
                        onChange={(v) => setSpeed(Number(v))}
                      />
                    </div>
                    {!neural && (
                      <Slider
                        label="Selected observation"
                        value={currentStep}
                        min={0}
                        max={Math.max(1, values.length - 1)}
                        onChange={setStep}
                      />
                    )}
                  </Panel>
                  {kind === "moving-average" && (
                    <Panel title="Rolling window calculation">
                      <div className="tsw-form-grid">
                        <div>
                          <h3>
                            {points[currentStep]?.date.slice(0, 10)} · n ={" "}
                            {config.window}
                          </h3>
                          <p>
                            Included observations:{" "}
                            {windowValues.length
                              ? windowValues.map((v) => fmt(v)).join(" + ")
                              : "Full window is unavailable at this edge."}
                          </p>
                          <p>
                            Sum = {fmt(windowSum)} · Count ={" "}
                            {windowValues.length} · Mean ={" "}
                            <strong data-testid="ts-window-mean">
                              {fmt(windowMean)}
                            </strong>
                          </p>
                        </div>
                        <div className="tsw-formula">
                          {fmt(windowSum)} / {windowValues.length || "n"} ={" "}
                          {fmt(windowMean)}
                          <small>
                            Actual − smooth ={" "}
                            {fmt(values[currentStep] - windowMean)}
                          </small>
                        </div>
                      </div>
                      <p>
                        Larger windows smooth more noise and react more slowly.
                        Incomplete windows remain unavailable rather than
                        silently averaging fewer observations.
                      </p>
                    </Panel>
                  )}
                  {kind === "exponential-smoothing" && (
                    <Panel title="Level update · selected step">
                      <p>
                        {config.initialization === "mean"
                          ? `The first ${Math.min(config.window, values.length)} observations initialize the level from their mean. Updates in that warmup region are retrospective initialization, not causal predictions.`
                          : "The first observation initializes the level; a one-step forecast becomes available at the next observation."}
                      </p>
                      <div className="tsw-update-flow">
                        <div>
                          Previous level
                          <strong>
                            {fmt(
                              fullSmoothing?.components.Level[
                                currentStep - 1
                              ] ?? initialSesLevel,
                            )}
                          </strong>
                        </div>
                        <span>→</span>
                        <div className="tsw-formula">
                          α × observation + (1 − α) × previous level
                          <small>
                            {fmt(config.alpha)} × {fmt(values[currentStep])} +{" "}
                            {fmt(1 - config.alpha)} ×{" "}
                            {fmt(
                              fullSmoothing?.components.Level[
                                currentStep - 1
                              ] ?? initialSesLevel,
                            )}
                          </small>
                        </div>
                        <span>→</span>
                        <div>
                          Updated level
                          <strong>
                            {fmt(fullSmoothing?.components.Level[currentStep])}
                          </strong>
                        </div>
                      </div>
                    </Panel>
                  )}
                  {kind === "holt-winters" &&
                    result &&
                    Object.entries(result.components).map(
                      ([name, component], i) => (
                        <ScientificChart
                          key={name}
                          title={name}
                          dates={points
                            .slice(0, split.origin)
                            .map((p) => p.date)}
                          lines={[
                            {
                              name,
                              values: component,
                              color: COLORS[(i + 1) % COLORS.length],
                            },
                          ]}
                          height={190}
                          selected={currentStep}
                          onSelect={setStep}
                        />
                      ),
                    )}
                  {kind === "arima-concept" && values.length > 8 && (
                    <>
                      <ScientificChart
                        title={`Difference inspector · d = ${config.d}`}
                        dates={points.slice(config.d).map((p) => p.date)}
                        lines={[
                          {
                            name: "Differenced series",
                            values: differenceSeries(values, config.d),
                            color: COLORS[1],
                          },
                        ]}
                        height={210}
                        onSelect={setStep}
                      />
                      <div className="tsw-two-charts">
                        {["Original", "Differenced"].map((name) => {
                          const series =
                              name === "Original"
                                ? values
                                : differenceSeries(values, config.d),
                            maxLag = Math.min(24, series.length - 3);
                          return (
                            <ScientificChart
                              key={name}
                              title={`${name} ACF / PACF`}
                              dates={Array.from(
                                { length: maxLag + 1 },
                                (_, i) => `Lag ${i}`,
                              )}
                              lines={[
                                {
                                  name: "ACF",
                                  values: autocorrelation(series, maxLag),
                                  color: COLORS[0],
                                  bar: true,
                                },
                                {
                                  name: "PACF",
                                  values: partialAutocorrelation(
                                    series,
                                    maxLag,
                                  ),
                                  color: COLORS[4],
                                  bar: true,
                                },
                              ]}
                              height={240}
                              group={`acf-${name}`}
                              unit="Correlation"
                            />
                          );
                        })}
                      </div>
                      <p className="tsw-notice">
                        ACF/PACF are exploratory, not a formal ADF stationarity
                        test. Fitted/residual arrays and likelihood criteria are
                        unavailable from this binding; no old approximation
                        supplies replacement diagnostics.
                      </p>
                    </>
                  )}
                  {anomaly && (
                    <>
                      <Panel title="Recent anomaly alerts">
                        <p>
                          {alerts.length} alerts after cooldown ·{" "}
                          {shownDetector.filter((p) => p.anomaly).length}{" "}
                          detections before suppression · {injections.length}{" "}
                          injected disruptions.
                        </p>
                        <div className="tsw-table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Timestamp</th>
                                <th>Observed</th>
                                <th>Expected</th>
                                <th>Deviation</th>
                                <th>Type</th>
                                <th>Severity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {alerts
                                .slice(-10)
                                .reverse()
                                .map((i) => (
                                  <tr key={i} onClick={() => setStep(i)}>
                                    <td>{points[i]?.date.slice(0, 16)}</td>
                                    <td>{fmt(detector[i].value)}</td>
                                    <td>{fmt(detector[i].expected)}</td>
                                    <td>{fmt(detector[i].deviation)}</td>
                                    <td>
                                      {detector[i].contextual
                                        ? "Contextual"
                                        : i >= 2 &&
                                            detector[i - 1]?.anomaly &&
                                            detector[i - 2]?.anomaly
                                          ? "Collective candidate"
                                          : "Point"}
                                    </td>
                                    <td>
                                      <span className="tsw-severity">
                                        {detector[i].severity}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                        {!alerts.length && (
                          <p>
                            No alerts in the replayed observations. Advance the
                            stream or adjust sensitivity.
                          </p>
                        )}
                      </Panel>
                      <Panel title="Threshold summary · selected step">
                        <div className="tsw-stat-grid">
                          {[
                            ["Upper bound", detector[currentStep]?.upper],
                            ["Expected", detector[currentStep]?.expected],
                            ["Lower bound", detector[currentStep]?.lower],
                            ["Deviation", detector[currentStep]?.deviation],
                          ].map(([name, value]) => (
                            <div key={String(name)}>
                              <small>{name}</small>
                              <strong>{fmt(value as number)}</strong>
                            </div>
                          ))}
                        </div>
                        <p>
                          Method: {config.detector}. Statistics exclude the
                          current observation. Warm-up observations do not
                          produce alerts.
                        </p>
                      </Panel>
                    </>
                  )}
                  {residualVisible &&
                    residuals.length > 0 &&
                    kind !== "holt-winters" && (
                      <div className="tsw-two-charts">
                        <ScientificChart
                          title="One-step residual · observed − forecast"
                          dates={points
                            .slice(0, split.origin)
                            .map((p) => p.date)}
                          lines={[
                            {
                              name: "Residual",
                              values: residuals,
                              color: COLORS[4],
                            },
                          ]}
                          height={220}
                          onSelect={setStep}
                        />
                        <ScientificChart
                          title="Absolute residual"
                          dates={points
                            .slice(0, split.origin)
                            .map((p) => p.date)}
                          lines={[
                            {
                              name: "Absolute error",
                              values: residuals.map(Math.abs),
                              color: COLORS[3],
                            },
                          ]}
                          height={220}
                        />
                      </div>
                    )}
                  {result && <p className="tsw-notice">{result.note}</p>}
                  {!neural && !anomaly && (
                    <div className="tsw-inline">
                      <button disabled={busy || fitBlocked} onClick={infer}>
                        Forecast from latest observation
                      </button>
                      <small>
                        Future point forecasts are separate from the frozen
                        holdout evaluation.
                      </small>
                    </div>
                  )}
                  {neural && (
                    <div className="tsw-inline">
                      <button disabled={!modelView} onClick={infer}>
                        Predict from latest observation
                      </button>
                      <button disabled={!modelView} onClick={saveModel}>
                        Save trained model
                      </button>
                      <button onClick={restoreModel}>
                        Reload trained model
                      </button>
                      {inferenceMs !== null && (
                        <span>Measured inference: {fmt(inferenceMs)} ms</span>
                      )}
                    </div>
                  )}
                  {future.length > 0 && (
                    <ScientificChart
                      title="Future forecast · no observed target"
                      dates={[
                        ...points.map((p) => p.date),
                        ...futureTimestamps(
                          points.at(-1)!.date,
                          future.length,
                          prepared.frequency,
                        ).map((d) => d.toISOString()),
                      ]}
                      lines={[
                        { name: "Observed", values, color: COLORS[0] },
                        {
                          name: "Future point forecast",
                          values: [
                            ...Array(values.length).fill(NaN),
                            ...future,
                          ],
                          color: COLORS[2],
                        },
                      ]}
                      boundary={values.length}
                    />
                  )}
                </>
              )}
              {(tab === "Train" || (neural && epochs.length > 0)) &&
                epochs.length > 0 && (
                  <ScientificChart
                    title="Real training & validation loss"
                    dates={epochs.map((e) => `Epoch ${e.epoch}`)}
                    lines={[
                      {
                        name: "Training loss",
                        values: epochs.map((e) => e.loss),
                        color: COLORS[0],
                      },
                      {
                        name: "Validation loss",
                        values: epochs.map((e) => e.validation),
                        color: COLORS[2],
                      },
                    ]}
                    group="ts-training"
                    unit="Loss (scaled target)"
                    height={240}
                  />
                )}
              {tab === "Explain" && (
                <Panel title="Connect the mathematics to this experiment">
                  <div className="tsw-formula">{lesson.formula}</div>
                  <p>{lesson.variables}</p>
                  <p>{lesson.example}</p>
                  <p>{lesson.mistake}</p>
                  <h3>Current interpretation</h3>
                  <p>{result?.note ?? lesson.intuition}</p>
                </Panel>
              )}
              {(tab === "Metrics" || tab === "Compare") && (
                <>
                  <Panel title="Evaluation contract">
                    <p>
                      Dataset: <strong>{dataset.name}</strong> · target:{" "}
                      {resolvedTarget} ({transform}). Training ends{" "}
                      {points[split.trainEnd - 1]?.date.slice(0, 10)}.
                      Validation ends{" "}
                      {points[split.origin - 1]?.date.slice(0, 10)}. Test starts{" "}
                      {points[split.origin]?.date.slice(0, 10)}.
                    </p>
                    <p>
                      Neural weights/scaling fit training only; validation
                      selects stopping. Classical final states use pre-test
                      history; optimization uses the training prefix. Forecasts
                      are recursive from the same fixed test origin and score
                      the first min(horizon, test length) observations.
                    </p>
                  </Panel>
                  {anomaly ? (
                    <Panel title="Injection benchmark">
                      <div
                        className="tsw-stat-grid"
                        data-testid="ts-replay-benchmark"
                      >
                        {[
                          [
                            "Replayed events detected",
                            `${benchmark.detectedEvents} / ${benchmark.events}`,
                          ],
                          ["Labelled observations", benchmark.labelled],
                          ["Alerts on labelled observations", benchmark.tp],
                          ["Labelled observations without alert", benchmark.fn],
                          [
                            nativeTruthAvailable
                              ? "False-positive alerts"
                              : "Other alerts (unlabelled)",
                            benchmark.fp,
                          ],
                          ...(nativeTruthAvailable
                            ? [
                                [
                                  "Precision (%)",
                                  fmt(
                                    benchmark.precision === null
                                      ? null
                                      : benchmark.precision * 100,
                                  ),
                                ],
                                [
                                  "Recall (%)",
                                  fmt(
                                    benchmark.recall === null
                                      ? null
                                      : benchmark.recall * 100,
                                  ),
                                ],
                                ["F1", fmt(benchmark.f1)],
                              ]
                            : []),
                        ].map(([name, value]) => (
                          <div key={String(name)}>
                            <small>{name}</small>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </div>
                      <p>
                        Only replayed observations are scored, after alert
                        cooldown. A shift labels all subsequent observations;
                        seasonal disruption labels only changed observations in
                        its selected cycle. Event detection counts an event once
                        if any affected observation triggers an alert.
                        {nativeTruthAvailable
                          ? " This synthetic dataset has complete generator labels, so precision, recall and F1 are measurable."
                          : " Other observations are not certified normal; precision, F1 and false-positive rates are unavailable."}
                      </p>
                    </Panel>
                  ) : (
                    <Panel title="Forecast accuracy · untouched test observations">
                      <div className="tsw-stat-grid">
                        {[
                          [
                            "Interval coverage (%)",
                            result?.lower.length && result.upper.length
                              ? (split.test
                                  .slice(0, result.forecast.length)
                                  .reduce(
                                    (s, v, i) =>
                                      s +
                                      (v >= result.lower[i] &&
                                      v <= result.upper[i]
                                        ? 1
                                        : 0),
                                    0,
                                  ) /
                                  Math.min(
                                    split.test.length,
                                    result.forecast.length,
                                  )) *
                                100
                              : null,
                          ],
                          ["MAE", metrics?.mae],
                          ["MSE", metrics?.mse],
                          ["RMSE", metrics?.rmse],
                          ["MAPE (%)", metrics?.mape],
                          ["sMAPE (%)", metrics?.smape],
                          ["MASE", metrics?.mase],
                          ["Bias (actual − forecast)", metrics?.me],
                          ["Scored observations", metrics?.n],
                        ].map(([name, value]) => (
                          <div key={String(name)}>
                            <small>{name}</small>
                            <strong>{fmt(value as number)}</strong>
                          </div>
                        ))}
                      </div>
                      <p>
                        MAE is average absolute error; RMSE emphasizes large
                        errors. MAPE is unavailable when any actual is zero.
                        MASE scales MAE against seasonal naïve in-history error.
                        Positive bias means under-forecasting.
                      </p>
                      <p>
                        Fit duration:{" "}
                        {result ? `${fmt(result.duration)} ms` : "Unavailable"}{" "}
                        · actual parameters: {result?.params ?? "Unavailable"} ·
                        float32 weights:{" "}
                        {result?.memory
                          ? `${fmt(result.memory / 1024)} KiB`
                          : "Unavailable"}
                      </p>
                      {!result && (
                        <p>
                          Fit the selected model before evaluating it. Baselines
                          are available below.
                        </p>
                      )}
                    </Panel>
                  )}
                  <Panel title="Fair comparison laboratory">
                    <div className="tsw-inline">
                      <button
                        disabled={busy || fitBlocked || anomaly}
                        onClick={runComparisons}
                      >
                        Compare classical models + ARIMA
                      </button>
                      <button
                        disabled={!result || !metrics?.n}
                        onClick={saveExperiment}
                      >
                        Save current experiment
                      </button>
                    </div>
                    {kind === "exponential-smoothing" && (
                      <>
                        <p>
                          Compare synchronized alpha scenarios on identical
                          history and holdout data.
                        </p>
                        <div className="tsw-inline">
                          {[0.1, 0.3, 0.7, 0.9].map((a) => (
                            <label key={a}>
                              <input
                                type="checkbox"
                                checked={alphaChoices.includes(a)}
                                onChange={(e) =>
                                  setAlphaChoices((v) =>
                                    e.target.checked
                                      ? [...v, a]
                                      : v.filter((x) => x !== a),
                                  )
                                }
                              />{" "}
                              α = {a}
                            </label>
                          ))}
                        </div>
                        <ScientificChart
                          title="Alpha scenarios · same forecast origin"
                          dates={chartDates}
                          lines={chartLines}
                          boundary={split.origin}
                        />
                        <ScientificChart
                          title="Alpha scenarios · holdout errors (actual − forecast)"
                          dates={chartDates.slice(
                            split.origin,
                            split.origin +
                              Math.min(config.horizon, split.test.length),
                          )}
                          lines={alphaComparisons.map((scenario, i) => ({
                            name: scenario.name,
                            values: split.test
                              .slice(0, scenario.result.forecast.length)
                              .map(
                                (actual, t) =>
                                  actual - scenario.result.forecast[t],
                              ),
                            color: COLORS[(i + 1) % COLORS.length],
                          }))}
                          unit="Forecast error"
                          group="ts-alpha-errors"
                        />
                        <p>
                          Smaller alpha retains more history; larger alpha
                          responds faster to recent observations. Each preset
                          below has its own holdout score. Compare absolute
                          errors and RMSE on this split; faster response alone
                          does not establish better forecasts.
                        </p>
                      </>
                    )}
                    <div className="tsw-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Model / experiment</th>
                            <th>MAE</th>
                            <th>RMSE</th>
                            <th>MASE</th>
                            <th>Fit ms</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ...(result
                              ? [
                                  {
                                    name: neural
                                      ? architecture.toUpperCase()
                                      : meta.title,
                                    result,
                                  },
                                ]
                              : []),
                            ...allComparisons,
                          ].map((row, i) => {
                            const m = forecastMetrics(
                              split.test,
                              row.result.forecast,
                              split.history,
                              config.season,
                            );
                            return (
                              <tr key={`${row.name}-${i}`}>
                                <td>{row.name}</td>
                                <td>{fmt(m.mae)}</td>
                                <td>{fmt(m.rmse)}</td>
                                <td>{fmt(m.mase)}</td>
                                <td>{fmt(row.result.duration)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p>
                      Only saved experiments with matching data fingerprint,
                      target, transform, origin, seasonal metric scale and
                      horizon appear here. To compare RNN/LSTM/GRU, select each
                      architecture, train, and save. Lower error on this split
                      is not a guarantee on future periods.
                    </p>
                  </Panel>
                  {allComparisons.length > 0 && (
                    <ScientificChart
                      title="Forecast overlay · common holdout"
                      dates={chartDates.slice(split.origin)}
                      lines={[
                        {
                          name: "Actual test",
                          values: split.test,
                          color: "#e0edff",
                        },
                        ...allComparisons.map((r, i) => ({
                          name: r.name,
                          values: r.result.forecast,
                          color: COLORS[i % COLORS.length],
                        })),
                      ]}
                      group="ts-comparison"
                    />
                  )}
                </>
              )}
            </div>
            <aside className="tsw-dock">
              {controls}
              <Panel title="Key takeaways">
                <p>{lesson.intuition}</p>
                <p>{lesson.limits}</p>
                <div className="tsw-formula">{lesson.formula}</div>
              </Panel>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
