import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";
import { ChevronDown, ChevronUp, Download, Images, Plus, Trash2, Upload, X } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { ConfidenceBars } from "../components/ConfidenceBars";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { ensureTfBackend, disposeTensor, acquireMobileNet } from "../runtime/tensorflowRuntime";
import {
  DEFAULT_CLASSIFIER_ID,
  DEFAULT_MODEL_KEY,
  deleteClassifierProject,
  loadClassifierProject,
  saveClassifierProject,
} from "../storage/visionProjectStore";
import { CLASS_COLORS, type ClassSample, type TrainPoint, type VisionClass } from "../types";

const INPUT = 224;
const CAPTURE_MS = 100;

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}`));
    };
    image.src = url;
  });
}

function previewOf(source: HTMLCanvasElement | HTMLImageElement) {
  if (source instanceof HTMLCanvasElement) return source.toDataURL("image/jpeg", 0.7);
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(INPUT, source.naturalWidth || INPUT);
  canvas.height = Math.min(INPUT, source.naturalHeight || INPUT);
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export default function ImageClassificationPage() {
  const { pathname } = useLocation();
  const camera = useCamera();
  const extractorRef = useRef<Awaited<ReturnType<typeof acquireMobileNet>> | null>(null);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const lastInferRef = useRef(0);
  const lastUiRef = useRef(0);
  const stopTrainRef = useRef(false);
  const trainingRef = useRef(false);
  const embedQueueRef = useRef<Array<{ id: string; source: HTMLCanvasElement | HTMLImageElement }>>([]);
  const embeddingRef = useRef(false);
  const samplesRef = useRef<ClassSample[]>([]);
  const classesRef = useRef<VisionClass[]>([]);

  const [classes, setClasses] = useState<VisionClass[]>([
    { id: "dog", name: "Dog", color: CLASS_COLORS[0] },
    { id: "cat", name: "Cat", color: CLASS_COLORS[1] },
  ]);
  const [samples, setSamples] = useState<ClassSample[]>([]);
  const [epochs, setEpochs] = useState(40);
  const [batchSize, setBatchSize] = useState(16);
  const [learningRate, setLearningRate] = useState(0.001);
  const [valSplit, setValSplit] = useState(0.2);
  const [shuffle, setShuffle] = useState(true);
  const [earlyStop, setEarlyStop] = useState(true);
  const [augment, setAugment] = useState(true);
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const capturingRef = useRef<string | null>(null);
  const lastCaptureRef = useRef(0);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pendingSamplesRef = useRef<ClassSample[]>([]);
  const pendingJobsRef = useRef<Array<{ id: string; source: HTMLCanvasElement | HTMLImageElement }>>([]);
  const flushTimerRef = useRef(0);
  const [training, setTraining] = useState(false);
  const [history, setHistory] = useState<TrainPoint[]>([]);
  const [status, setStatus] = useState("Start the camera, capture samples, then train a TensorFlow.js head.");
  const [predictions, setPredictions] = useState<Array<{ name: string; value: number; color: string; image?: string }>>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [projectName, setProjectName] = useState("Animal Classifier");
  const [modelReady, setModelReady] = useState(false);
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const [pendingEmbeds, setPendingEmbeds] = useState(0);
  const [extractorReady, setExtractorReady] = useState(false);
  const [browserClassId, setBrowserClassId] = useState<string | null>(null);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });

  useEffect(() => {
    capturingRef.current = capturingId;
  }, [capturingId]);
  useEffect(() => {
    samplesRef.current = samples;
  }, [samples]);
  useEffect(() => {
    classesRef.current = classes;
  }, [classes]);
  useEffect(() => {
    trainingRef.current = training;
  }, [training]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        extractorRef.current = await acquireMobileNet();
        if (active) setExtractorReady(true);
      } catch (caught) {
        if (active) setStatus(caught instanceof Error ? caught.message : "TensorFlow.js failed to load MobileNet.");
      }
    })();
    void (async () => {
      const saved = await loadClassifierProject(DEFAULT_CLASSIFIER_ID);
      if (!active || !saved) return;
      setProjectName(saved.name);
      setClasses(saved.classes);
      setSamples(saved.samples);
      setHistory(saved.history);
      try {
        await ensureTfBackend();
        modelRef.current = await tf.loadLayersModel(saved.modelKey);
        setModelReady(true);
        setStatus(`Loaded saved project “${saved.name}”. Live TensorFlow.js inference is on.`);
      } catch {
        setStatus("Restored samples. Train again to rebuild the TensorFlow.js head.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      modelRef.current?.dispose();
      extractorRef.current = null;
    },
    [],
  );

  const counts = useMemo(
    () => Object.fromEntries(classes.map((item) => [item.id, samples.filter((sample) => sample.classId === item.id).length])),
    [classes, samples],
  );
  const readyCounts = useMemo(
    () => Object.fromEntries(classes.map((item) => [item.id, samples.filter((sample) => sample.classId === item.id && sample.embedding.length).length])),
    [classes, samples],
  );
  const empty = classes.filter((item) => (readyCounts[item.id] ?? 0) === 0);
  const thin = classes.filter((item) => (readyCounts[item.id] ?? 0) > 0 && (readyCounts[item.id] ?? 0) < 10);
  const maxCount = Math.max(1, ...classes.map((item) => counts[item.id] ?? 0));
  const imbalanced = classes.some((item) => (counts[item.id] ?? 0) > 0 && (counts[item.id] ?? 0) * 3 < maxCount);
  const canTrain = classes.length >= 2 && empty.length === 0 && !training && pendingEmbeds === 0 && extractorReady;
  const latest = history[history.length - 1];
  const browserClass = classes.find((item) => item.id === browserClassId) ?? null;
  const browserSamples = browserClassId ? samples.filter((sample) => sample.classId === browserClassId) : [];

  const ensureExtractor = async () => {
    await ensureTfBackend();
    if (!extractorRef.current) {
      setStatus("Loading MobileNet feature extractor (TensorFlow.js)…");
      extractorRef.current = await acquireMobileNet();
      setExtractorReady(true);
    }
    return extractorRef.current;
  };

  const embedSource = async (source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement) => {
    const extractor = await ensureExtractor();
    const canvas = scratchRef.current ?? document.createElement("canvas");
    scratchRef.current = canvas;
    canvas.width = INPUT;
    canvas.height = INPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare an embedding canvas.");
    ctx.drawImage(source, 0, 0, INPUT, INPUT);
    const activation = extractor.infer(canvas, true) as tf.Tensor;
    const values = Array.from(await activation.data());
    activation.dispose();
    return values;
  };

  const pumpEmbeddings = useCallback(async () => {
    if (embeddingRef.current) return;
    embeddingRef.current = true;
    try {
      while (embedQueueRef.current.length) {
        const job = embedQueueRef.current.shift();
        if (!job) break;
        try {
          const values = await embedSource(job.source);
          setSamples((current) => current.map((sample) => (sample.id === job.id ? { ...sample, embedding: values } : sample)));
        } catch {
          setSamples((current) => current.filter((sample) => sample.id !== job.id));
        }
        setPendingEmbeds(embedQueueRef.current.length);
        await tf.nextFrame();
      }
    } finally {
      embeddingRef.current = false;
      setPendingEmbeds(embedQueueRef.current.length);
    }
  }, []);

  const flushPendingSamples = useCallback(() => {
    flushTimerRef.current = 0;
    const batch = pendingSamplesRef.current;
    const jobs = pendingJobsRef.current;
    if (!batch.length) return;
    pendingSamplesRef.current = [];
    pendingJobsRef.current = [];
    embedQueueRef.current.push(...jobs);
    setPendingEmbeds(embedQueueRef.current.length);
    setSamples((current) => [...current, ...batch]);
    void pumpEmbeddings();
  }, [pumpEmbeddings]);

  const enqueueSample = useCallback((classId: string, source: HTMLCanvasElement | HTMLImageElement, preview: string) => {
    const id = uid("s");
    pendingSamplesRef.current.push({ id, classId, preview, embedding: [] });
    pendingJobsRef.current.push({ id, source });
    if (!flushTimerRef.current) {
      flushTimerRef.current = window.setTimeout(flushPendingSamples, 200);
    }
  }, [flushPendingSamples]);

  const grabFrame = useCallback(() => {
    const video = camera.videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = captureCanvasRef.current ?? document.createElement("canvas");
    captureCanvasRef.current = canvas;
    canvas.width = INPUT;
    canvas.height = INPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (camera.mirror) ctx.setTransform(-1, 0, 0, 1, INPUT, 0);
    else ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(video, 0, 0, INPUT, INPUT);
    const copy = document.createElement("canvas");
    copy.width = INPUT;
    copy.height = INPUT;
    copy.getContext("2d")?.drawImage(canvas, 0, 0);
    return { source: copy, preview: copy.toDataURL("image/jpeg", 0.55) };
  }, [camera.mirror, camera.videoRef]);

  const captureOnce = useCallback((classId: string) => {
    const frame = grabFrame();
    if (!frame) return;
    enqueueSample(classId, frame.source, frame.preview);
  }, [enqueueSample, grabFrame]);

  useEffect(() => () => {
    if (flushTimerRef.current) window.clearTimeout(flushTimerRef.current);
  }, []);

  const importFiles = async (classId: string, files: FileList | null) => {
    const images = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    for (const file of images) {
      const image = await loadImage(file);
      enqueueSample(classId, image, previewOf(image));
    }
    setStatus(`Queued ${images.length} image${images.length === 1 ? "" : "s"} for TensorFlow.js embeddings.`);
  };

  const removeSample = (id: string) => {
    embedQueueRef.current = embedQueueRef.current.filter((job) => job.id !== id);
    setPendingEmbeds(embedQueueRef.current.length);
    setSamples((current) => current.filter((sample) => sample.id !== id));
  };

  useRafLoop(camera.status === "live", (now) => {
    const classId = capturingRef.current;
    if (classId && now - lastCaptureRef.current >= CAPTURE_MS) {
      lastCaptureRef.current = now;
      captureOnce(classId);
    }
    if (trainingRef.current || capturingRef.current) return;
    if (!modelRef.current || now - lastInferRef.current < 80) return;
    lastInferRef.current = now;
    const video = camera.videoRef.current;
    if (!video || video.readyState < 2) return;
    void (async () => {
      const started = performance.now();
      try {
        const liveClasses = classesRef.current;
        const values = await embedSource(video);
        const model = modelRef.current;
        if (!model) return;
        const units = model.outputs[0]?.shape?.[1];
        if (typeof units === "number" && units !== liveClasses.length) return;
        const input = tf.tensor2d([values]);
        const output = model.predict(input) as tf.Tensor;
        const data = Array.from(await output.data());
        disposeTensor([input, output]);
        const rows = liveClasses.map((item, index) => ({
          name: item.name,
          value: data[index] ?? 0,
          color: item.color,
          image: samplesRef.current.find((sample) => sample.classId === item.id)?.preview,
        })).sort((a, b) => b.value - a.value);
        fpsRef.current.frames += 1;
        if (now - lastUiRef.current > 120) {
          lastUiRef.current = now;
          setLatency(performance.now() - started);
          setPredictions(rows);
          if (now - fpsRef.current.stamp > 500) {
            setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
            fpsRef.current = { frames: 0, stamp: now };
          }
        }
      } catch {
        /* frame skipped */
      }
    })();
  });

  const train = async () => {
    if (!canTrain) return;
    stopTrainRef.current = false;
    setTraining(true);
    setModelReady(false);
    setStatus("Waiting for TensorFlow.js embeddings…");
    try {
      await ensureExtractor();
      while (embedQueueRef.current.length) {
        await pumpEmbeddings();
        await tf.nextFrame();
      }
      const ready = samplesRef.current.filter((sample) => sample.embedding.length);
      const liveClasses = classesRef.current;
      if (liveClasses.some((item) => !ready.some((sample) => sample.classId === item.id))) {
        throw new Error("Every class needs at least one embedded sample before training.");
      }
      const featureSize = ready[0]?.embedding.length ?? 0;
      if (!featureSize) throw new Error("Embeddings are empty. Recapture samples.");
      setStatus("Training TensorFlow.js classification head…");
      const xsAll = tf.tensor2d(ready.map((sample) => sample.embedding));
      const index = new Map(liveClasses.map((item, i) => [item.id, i]));
      const labels = ready.map((sample) => {
        const row = Array(liveClasses.length).fill(0);
        row[index.get(sample.classId) ?? 0] = 1;
        return row;
      });
      const ysAll = tf.tensor2d(labels);
      modelRef.current?.dispose();
      const model = tf.sequential();
      model.add(tf.layers.dense({ inputShape: [featureSize], units: 128, activation: "relu" }));
      model.add(tf.layers.dropout({ rate: augment ? 0.25 : 0.1 }));
      model.add(tf.layers.dense({ units: liveClasses.length, activation: "softmax" }));
      model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"],
      });
      modelRef.current = model;
      const points: TrainPoint[] = [];
      const started = performance.now();
      let best = Number.POSITIVE_INFINITY;
      let wait = 0;
      const usableVal = ready.length * valSplit >= 2 ? valSplit : 0;
      await model.fit(xsAll, ysAll, {
        epochs,
        batchSize: Math.min(batchSize, ready.length),
        shuffle,
        validationSplit: usableVal,
        yieldEvery: 1,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            const acc = logs?.acc ?? logs?.accuracy ?? 0;
            const valAcc = logs?.val_acc ?? logs?.val_accuracy ?? acc;
            const loss = logs?.loss ?? 0;
            const valLoss = logs?.val_loss ?? loss;
            points.push({
              epoch: epoch + 1,
              acc,
              valAcc,
              loss,
              valLoss,
              ms: performance.now() - started,
            });
            setHistory([...points]);
            setStatus(`Live training · epoch ${epoch + 1}/${epochs} · acc ${(acc * 100).toFixed(1)}% · loss ${Number(loss).toFixed(3)}`);
            if (stopTrainRef.current) model.stopTraining = true;
            if (earlyStop) {
              if (valLoss + 1e-4 < best) {
                best = valLoss;
                wait = 0;
              } else {
                wait += 1;
                if (wait >= 4) model.stopTraining = true;
              }
            }
            await tf.nextFrame();
          },
        },
      });
      disposeTensor([xsAll, ysAll]);
      setModelReady(true);
      setStatus("Training finished. Live TensorFlow.js inference is using the new head.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "Training failed.");
    } finally {
      setTraining(false);
    }
  };

  const persist = async () => {
    if (!modelRef.current) {
      setStatus("Train a model before saving.");
      return;
    }
    await modelRef.current.save(DEFAULT_MODEL_KEY);
    await saveClassifierProject({
      id: DEFAULT_CLASSIFIER_ID,
      name: projectName,
      updatedAt: Date.now(),
      classes,
      samples: samples.filter((sample) => sample.embedding.length),
      history,
      inputSize: INPUT,
      modelKey: DEFAULT_MODEL_KEY,
    });
    setStatus(`Saved “${projectName}” to IndexedDB.`);
  };

  const downloadModel = async () => {
    if (!modelRef.current) return;
    await modelRef.current.save(`downloads://${projectName.replace(/\s+/g, "-").toLowerCase()}`);
    const blob = new Blob([JSON.stringify({ name: projectName, classes }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "labels.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleCapturing = (classId: string) => {
    setCapturingId((current) => {
      if (current === classId) {
        if (flushTimerRef.current) {
          window.clearTimeout(flushTimerRef.current);
          flushPendingSamples();
        }
        return null;
      }
      return classId;
    });
  };

  const resetProject = async () => {
    if (!window.confirm("Delete the saved classifier, samples, and IndexedDB weights?")) return;
    modelRef.current?.dispose();
    modelRef.current = null;
    setModelReady(false);
    try {
      await tf.io.removeModel(DEFAULT_MODEL_KEY);
    } catch {
      /* no stored weights */
    }
    await deleteClassifierProject(DEFAULT_CLASSIFIER_ID);
    embedQueueRef.current = [];
    setPendingEmbeds(0);
    setSamples([]);
    setHistory([]);
    setPredictions([]);
    setStatus("Started a new project.");
  };

  return (
    <VisionPageShell pathname={pathname} kicker="Capture samples instantly, then train a live TensorFlow.js classifier in the browser.">
      <div className="cv-class-layout">
        <aside className="cv-panel cv-classes">
          <h2>Classes</h2>
          <p>Unlimited classes · {samples.length} images{pendingEmbeds ? ` · embedding ${pendingEmbeds}` : ""}</p>
          {classes.map((item, index) => {
            const thumbs = samples.filter((sample) => sample.classId === item.id).slice(-12);
            const count = counts[item.id] ?? 0;
            const capturing = capturingId === item.id;
            return (
              <article
                key={item.id}
                className={capturing ? "cv-class-card is-on is-capturing" : "cv-class-card"}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  void importFiles(item.id, event.dataTransfer.files);
                }}
              >
                <header className="cv-class-head">
                  <i className="cv-class-swatch" style={{ background: item.color }} />
                  <div>
                    <input
                      value={item.name}
                      aria-label="Class name"
                      onChange={(event) =>
                        setClasses((current) => current.map((entry) => (entry.id === item.id ? { ...entry, name: event.target.value } : entry)))
                      }
                    />
                    <small>{count} images{capturing ? " · capturing 10/s" : ""}</small>
                  </div>
                  <button type="button" aria-label="Delete class" onClick={() => {
                    if (!window.confirm(`Delete class “${item.name}” and its samples?`)) return;
                    if (browserClassId === item.id) setBrowserClassId(null);
                    setClasses((current) => current.filter((entry) => entry.id !== item.id));
                    setSamples((current) => current.filter((sample) => sample.classId !== item.id));
                  }}
                  disabled={classes.length <= 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </header>
                <button
                  type="button"
                  className="cv-film"
                  title={`Browse ${count} images`}
                  onClick={() => setBrowserClassId(item.id)}
                >
                  {thumbs.length ? thumbs.map((sample) => (
                    <img key={sample.id} src={sample.preview} alt="" />
                  )) : <span className="cv-film-empty"><Images size={16} /> No captures yet</span>}
                </button>
                <div className="cv-class-actions">
                  <button
                    type="button"
                    className={capturing ? "cv-btn-capture is-on" : "cv-btn-capture"}
                    onClick={() => toggleCapturing(item.id)}
                    disabled={camera.status !== "live"}
                  >
                    {capturing ? "Stop capturing" : "Start capturing"}
                  </button>
                  <label className="cv-btn">
                    <Upload size={12} /> Upload
                    <input type="file" accept="image/*" multiple hidden onChange={(event) => void importFiles(item.id, event.target.files)} />
                  </label>
                  <button type="button" onClick={() => setBrowserClassId(item.id)} disabled={!count}>
                    Browse
                  </button>
                  <button type="button" onClick={() => {
                    if (!window.confirm(`Clear all samples in “${item.name}”?`)) return;
                    embedQueueRef.current = embedQueueRef.current.filter((job) => samplesRef.current.find((sample) => sample.id === job.id)?.classId !== item.id);
                    setPendingEmbeds(embedQueueRef.current.length);
                    setSamples((current) => current.filter((sample) => sample.classId !== item.id));
                  }}>
                    Clear
                  </button>
                  <button
                    type="button"
                    aria-label="Move class up"
                    disabled={index === 0}
                    onClick={() => setClasses((current) => {
                      if (index === 0) return current;
                      const next = [...current];
                      const [moved] = next.splice(index, 1);
                      if (moved) next.splice(index - 1, 0, moved);
                      return next;
                    })}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    aria-label="Move class down"
                    disabled={index === classes.length - 1}
                    onClick={() => setClasses((current) => {
                      if (index >= current.length - 1) return current;
                      const next = [...current];
                      const [moved] = next.splice(index, 1);
                      if (moved) next.splice(index + 1, 0, moved);
                      return next;
                    })}
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              </article>
            );
          })}
          <button
            type="button"
            className="cv-btn-primary"
            style={{ width: "100%", marginTop: 10 }}
            onClick={() =>
              setClasses((current) => [
                ...current,
                { id: uid("c"), name: `Class ${current.length + 1}`, color: CLASS_COLORS[current.length % CLASS_COLORS.length] },
              ])
            }
          >
            <Plus size={14} /> Add class
          </button>
          {empty.length ? <p className="cv-warn">Empty classes: {empty.map((item) => item.name).join(", ")}</p> : null}
          {thin.length ? <p className="cv-warn">Fewer than 10 samples: {thin.map((item) => item.name).join(", ")}</p> : null}
          {imbalanced ? <p className="cv-warn">Dataset is highly imbalanced.</p> : null}
        </aside>

        <div className="cv-stage">
          <VisionCamera
            videoRef={camera.videoRef}
            status={camera.status}
            permission={camera.permission}
            error={camera.error}
            mirror={camera.mirror}
            onStart={() => void camera.start()}
            onStop={camera.stop}
            onSnapshot={() => {
              const classId = capturingId ?? classes[0]?.id;
              if (classId) captureOnce(classId);
            }}
            onToggleMirror={() => camera.setMirror((value) => !value)}
            devices={camera.devices}
            deviceId={camera.deviceId}
            onDevice={(id) => {
              camera.setDeviceId(id);
              void camera.start(id);
            }}
            extra={capturingId ? <span className="cv-capture-chip">Capturing 10/s</span> : undefined}
          />
        </div>

        <aside className="cv-panel cv-infer">
          <h2>Live inference</h2>
          <p>
            {extractorReady ? "TensorFlow.js · MobileNet" : "Loading TensorFlow.js…"}
            {modelReady ? ` · ${fps.toFixed(0)} FPS · ${latency.toFixed(0)} ms` : " · train to unlock predictions"}
          </p>
          {predictions[0] ? <p className="cv-pred">{predictions[0].name} · {(predictions[0].value * 100).toFixed(1)}%</p> : null}
          {framePreview ? <img src={framePreview} alt="Current inferred frame" className="cv-frame" /> : null}
          <label className="cv-btn" style={{ margin: "8px 0" }}>
            Test uploaded image
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={!modelReady}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file || !modelRef.current) return;
                try {
                  const image = await loadImage(file);
                  const values = await embedSource(image);
                  const input = tf.tensor2d([values]);
                  const output = modelRef.current.predict(input) as tf.Tensor;
                  const data = Array.from(await output.data());
                  disposeTensor([input, output]);
                  setFramePreview(previewOf(image));
                  setPredictions(classes.map((item, index) => ({
                    name: item.name,
                    value: data[index] ?? 0,
                    color: item.color,
                    image: samples.find((sample) => sample.classId === item.id)?.preview,
                  })).sort((a, b) => b.value - a.value));
                  setStatus(`Predicted uploaded image as ${classes[data.indexOf(Math.max(...data))]?.name ?? "unknown"}.`);
                } catch (caught) {
                  setStatus(caught instanceof Error ? caught.message : "Image inference failed.");
                }
              }}
            />
          </label>
          <ConfidenceBars rows={predictions} />
        </aside>

        <section className="cv-panel cv-train">
          <h2>Train model {training ? <em className="cv-live-tag">Live</em> : null}</h2>
          <div className="cv-train-grid">
            <div>
              <label>Epochs <input type="number" min={1} max={120} value={epochs} onChange={(event) => setEpochs(Number(event.target.value))} /></label>
              <label>Batch <input type="number" min={1} max={64} value={batchSize} onChange={(event) => setBatchSize(Number(event.target.value))} /></label>
              <label>LR <input type="number" step="0.0001" min={0.0001} value={learningRate} onChange={(event) => setLearningRate(Number(event.target.value))} /></label>
              <label>Val split <input type="number" step="0.05" min={0} max={0.5} value={valSplit} onChange={(event) => setValSplit(Number(event.target.value))} /></label>
              <label>
                Shuffle
                <input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} />
              </label>
              <label>
                Early stop
                <input type="checkbox" checked={earlyStop} onChange={(event) => setEarlyStop(event.target.checked)} />
              </label>
              <label>
                Augment
                <input type="checkbox" checked={augment} onChange={(event) => setAugment(event.target.checked)} />
              </label>
              <button type="button" className="cv-btn-primary" disabled={!canTrain} onClick={() => void train()}>
                {training ? "Training…" : modelReady ? "Retrain" : "Train model"}
              </button>
              <button
                type="button"
                disabled={!training}
                onClick={() => {
                  stopTrainRef.current = true;
                  if (modelRef.current) modelRef.current.stopTraining = true;
                }}
              >
                Stop training
              </button>
              <p>{status}</p>
            </div>
            <div>
              <div className="cv-metrics">
                <div><b>{latest ? `${latest.epoch}/${epochs}` : "—"}</b><span>Epoch</span></div>
                <div><b>{latest ? `${(latest.acc * 100).toFixed(1)}%` : "—"}</b><span>Train acc</span></div>
                <div><b>{latest ? latest.loss.toFixed(3) : "—"}</b><span>Train loss</span></div>
                <div><b>{latest ? `${(latest.valAcc * 100).toFixed(1)}%` : "—"}</b><span>Val acc</span></div>
                <div><b>{latest ? latest.valLoss.toFixed(3) : "—"}</b><span>Val loss</span></div>
                <div><b>{latest ? `${(latest.ms / 1000).toFixed(1)}s` : "—"}</b><span>Elapsed</span></div>
              </div>
              <div className="cv-balance">
                {classes.map((item) => (
                  <div key={item.id} title={item.name}>
                    <i style={{ width: `${((counts[item.id] ?? 0) / maxCount) * 100}%`, background: item.color }} />
                    <span>{item.name} {counts[item.id] ?? 0}</span>
                  </div>
                ))}
              </div>
              <div className="cv-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="acc" stroke="#16a34a" dot={false} name="acc" />
                    <Line type="monotone" dataKey="valAcc" stroke="#2563eb" dot={false} name="val acc" />
                    <Line type="monotone" dataKey="loss" stroke="#db2777" dot={false} name="loss" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        <section className="cv-panel cv-export">
          <h2>Save / export</h2>
          <div className="cv-class-actions">
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} aria-label="Project name" />
            <button type="button" className="cv-btn-primary" onClick={() => void persist()}>Save to IndexedDB</button>
            <button type="button" onClick={() => void downloadModel()} disabled={!modelReady}>
              <Download size={14} /> Download TF.js
            </button>
            <button type="button" onClick={() => void resetProject()}>New project</button>
          </div>
        </section>
      </div>

      {browserClass ? (
        <div className="cv-dataset-overlay" onClick={() => setBrowserClassId(null)}>
          <div
            className="cv-dataset-pop"
            role="dialog"
            aria-modal="true"
            aria-label={`${browserClass.name} images`}
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <strong>{browserClass.name}</strong>
                <p>{browserSamples.length} captured images · click × to delete</p>
              </div>
              <button type="button" aria-label="Close image browser" onClick={() => setBrowserClassId(null)}>
                <X size={16} />
              </button>
            </header>
            {browserSamples.length ? (
              <div className="cv-dataset-grid">
                {browserSamples.map((sample) => (
                  <figure key={sample.id}>
                    <img src={sample.preview} alt="" />
                    {!sample.embedding.length ? <em>…</em> : null}
                    <button type="button" aria-label="Delete image" onClick={() => removeSample(sample.id)}>
                      <X size={12} />
                    </button>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="cv-warn">No images in this class yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </VisionPageShell>
  );
}
