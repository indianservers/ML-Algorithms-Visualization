import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";
import { ChevronDown, ChevronUp, Download, Plus, Trash2 } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { LandmarkOverlay } from "../components/LandmarkOverlay";
import { ConfidenceBars } from "../components/ConfidenceBars";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createHandLandmarker, formatVisionError } from "../runtime/mediapipeRuntime";
import { disposeTensor, ensureTfBackend } from "../runtime/tensorflowRuntime";
import {
  DEFAULT_GESTURE_ID,
  DEFAULT_GESTURE_MODEL_KEY,
  deleteClassifierProject,
  loadClassifierProject,
  saveClassifierProject,
} from "../storage/visionProjectStore";
import { CLASS_COLORS, type ClassSample, type TrackedHand, type TrainPoint, type VisionClass } from "../types";
import { handFeatureVector } from "../utils/landmarkGeometry";
import type { HandLandmarker } from "@mediapipe/tasks-vision";

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function CustomGestureTrainerPage() {
  const { pathname } = useLocation();
  const camera = useCamera();
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const capturingRef = useRef<string | null>(null);
  const lastCaptureRef = useRef(0);
  const latestHands = useRef<TrackedHand[]>([]);

  const [classes, setClasses] = useState<VisionClass[]>([
    { id: "fist", name: "Fist", color: CLASS_COLORS[0] },
    { id: "open", name: "Open palm", color: CLASS_COLORS[1] },
  ]);
  const [samples, setSamples] = useState<ClassSample[]>([]);
  const [activeId, setActiveId] = useState("fist");
  const [hands, setHands] = useState<TrackedHand[]>([]);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [epochs, setEpochs] = useState(40);
  const [batchSize, setBatchSize] = useState(16);
  const [learningRate, setLearningRate] = useState(0.002);
  const [valSplit, setValSplit] = useState(0.2);
  const [shuffle, setShuffle] = useState(true);
  const [earlyStop, setEarlyStop] = useState(true);
  const [captureEvery] = useState(100);
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const [training, setTraining] = useState(false);
  const [history, setHistory] = useState<TrainPoint[]>([]);
  const [status, setStatus] = useState("Capture landmark samples for at least two gestures, then train.");
  const [predictions, setPredictions] = useState<Array<{ name: string; value: number; color: string; image?: string }>>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [projectName, setProjectName] = useState("Custom gestures");
  const [confusion, setConfusion] = useState<number[][] | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const stopTrainRef = useRef(false);

  useEffect(() => {
    capturingRef.current = capturingId;
  }, [capturingId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const saved = await loadClassifierProject(DEFAULT_GESTURE_ID);
      if (!active || !saved) return;
      setProjectName(saved.name);
      setClasses(saved.classes);
      setSamples(saved.samples);
      setHistory(saved.history);
      setActiveId(saved.classes[0]?.id ?? "fist");
      try {
        await ensureTfBackend();
        modelRef.current = await tf.loadLayersModel(saved.modelKey);
        setModelReady(true);
        setStatus(`Loaded saved project “${saved.name}”.`);
      } catch {
        setStatus("Restored samples. Train again to rebuild the gesture head.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      modelRef.current?.dispose();
    },
    [],
  );

  const counts = useMemo(
    () => Object.fromEntries(classes.map((item) => [item.id, samples.filter((sample) => sample.classId === item.id).length])),
    [classes, samples],
  );
  const empty = classes.filter((item) => (counts[item.id] ?? 0) === 0);
  const thin = classes.filter((item) => (counts[item.id] ?? 0) > 0 && (counts[item.id] ?? 0) < 12);
  const maxCount = Math.max(1, ...classes.map((item) => counts[item.id] ?? 0));
  const imbalanced = classes.some((item) => (counts[item.id] ?? 0) > 0 && (counts[item.id] ?? 0) * 3 < maxCount);
  const canTrain = classes.length >= 2 && empty.length === 0 && !training;
  const latest = history[history.length - 1];
  const best = history.reduce((acc, point) => (point.valAcc >= acc.valAcc ? point : acc), history[0] ?? { epoch: 0, valAcc: -1, acc: 0, loss: 0, valLoss: 0, ms: 0 });

  const ensureHands = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    setStatus("Loading MediaPipe Hand Landmarker…");
    landmarkerRef.current = await createHandLandmarker(1);
    setStatus("Ready to capture landmark samples.");
    return landmarkerRef.current;
  };

  const captureFromHands = useCallback((classId: string, tracked: TrackedHand[]) => {
    const hand = tracked[0];
    if (!hand) return;
    const embedding = handFeatureVector(hand.landmarks);
    if (embedding.length < 21) return;
    const video = camera.videoRef.current;
    let preview = "";
    if (video && video.readyState >= 2) {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (camera.mirror) ctx.setTransform(-1, 0, 0, 1, 160, 0);
        ctx.drawImage(video, 0, 0, 160, 160);
        preview = canvas.toDataURL("image/jpeg", 0.5);
      }
    }
    setSamples((current) => [...current, { id: uid("g"), classId, preview, embedding }]);
  }, [camera.mirror, camera.videoRef]);

  useRafLoop(camera.status === "live", async (now) => {
    const video = camera.videoRef.current;
    if (!video || video.readyState < 2) return;
    const landmarker = await ensureHands();
    const started = performance.now();
    const result = landmarker.detectForVideo(video, now);
    const tracked: TrackedHand[] = (result.landmarks ?? []).map((points, index) => ({
      handedness: result.handedness[index]?.[0]?.categoryName === "Left" ? "Left" : "Right",
      score: result.handedness[index]?.[0]?.score ?? 0,
      landmarks: points.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 })),
      worldLandmarks: [],
    }));
    latestHands.current = tracked;
    const classId = capturingRef.current;
    if (classId && now - lastCaptureRef.current >= captureEvery) {
      lastCaptureRef.current = now;
      captureFromHands(classId, tracked);
    }
    if (modelRef.current && tracked[0]) {
      const features = handFeatureVector(tracked[0].landmarks);
      if (features.length) {
        const input = tf.tensor2d([features]);
        const output = modelRef.current.predict(input) as tf.Tensor;
        const data = Array.from(await output.data());
        disposeTensor([input, output]);
        const rows = classes.map((item, index) => ({
          name: item.name,
          value: data[index] ?? 0,
          color: item.color,
          image: samples.find((sample) => sample.classId === item.id)?.preview,
        })).sort((a, b) => b.value - a.value);
        if (now - lastUi.current > 120) setPredictions(rows);
      }
    }
    if (now - lastUi.current > 90) {
      lastUi.current = now;
      setHands(tracked);
      setLatency(performance.now() - started);
      setSize({ w: video.videoWidth || 640, h: video.videoHeight || 360 });
      fpsRef.current.frames += 1;
      if (now - fpsRef.current.stamp > 500) {
        setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
        fpsRef.current = { frames: 0, stamp: now };
      }
    }
  });

  const train = async () => {
    if (!canTrain) return;
    stopTrainRef.current = false;
    setTraining(true);
    setModelReady(false);
    setStatus("Training a landmark classifier…");
    try {
      await ensureTfBackend();
      const featureSize = samples[0]?.embedding.length ?? 0;
      const xsAll = tf.tensor2d(samples.map((sample) => sample.embedding));
      const index = new Map(classes.map((item, i) => [item.id, i]));
      const labels = samples.map((sample) => {
        const row = Array(classes.length).fill(0);
        row[index.get(sample.classId) ?? 0] = 1;
        return row;
      });
      const ysAll = tf.tensor2d(labels);
      modelRef.current?.dispose();
      const model = tf.sequential();
      model.add(tf.layers.dense({ inputShape: [featureSize], units: 64, activation: "relu" }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: classes.length, activation: "softmax" }));
      model.compile({ optimizer: tf.train.adam(learningRate), loss: "categoricalCrossentropy", metrics: ["accuracy"] });
      modelRef.current = model;
      const points: TrainPoint[] = [];
      const started = performance.now();
      let bestLoss = Number.POSITIVE_INFINITY;
      let wait = 0;
      await model.fit(xsAll, ysAll, {
        epochs,
        batchSize,
        shuffle,
        validationSplit: valSplit,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            const acc = logs?.acc ?? logs?.accuracy ?? 0;
            const valAcc = logs?.val_acc ?? logs?.val_accuracy ?? acc;
            const loss = logs?.loss ?? 0;
            const valLoss = logs?.val_loss ?? loss;
            points.push({ epoch: epoch + 1, acc, valAcc, loss, valLoss, ms: performance.now() - started });
            setHistory([...points]);
            if (stopTrainRef.current) model.stopTraining = true;
            if (earlyStop) {
              if (valLoss + 1e-4 < bestLoss) {
                bestLoss = valLoss;
                wait = 0;
              } else if (++wait >= 4) {
                model.stopTraining = true;
              }
            }
            await tf.nextFrame();
          },
        },
      });
      const pred = model.predict(xsAll) as tf.Tensor;
      const predData = Array.from(await pred.data());
      const matrix: number[][] = Array.from({ length: classes.length }, () => Array.from({ length: classes.length }, () => 0));
      samples.forEach((sample, sampleIndex) => {
        const trueIdx = index.get(sample.classId) ?? 0;
        let bestIdx = 0;
        let bestScore = -1;
        for (let i = 0; i < classes.length; i += 1) {
          const score = predData[sampleIndex * classes.length + i] ?? 0;
          if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }
        const row = matrix[trueIdx];
        if (row) row[bestIdx] = (row[bestIdx] ?? 0) + 1;
      });
      disposeTensor([xsAll, ysAll, pred]);
      setConfusion(matrix);
      setModelReady(true);
      setStatus("Training finished. Live inference uses the landmark classifier.");
    } catch (caught) {
      setStatus(formatVisionError(caught, "Training failed."));
    } finally {
      setTraining(false);
    }
  };

  const persist = async () => {
    if (!modelRef.current) {
      setStatus("Train a model before saving.");
      return;
    }
    await modelRef.current.save(DEFAULT_GESTURE_MODEL_KEY);
    await saveClassifierProject({
      id: DEFAULT_GESTURE_ID,
      name: projectName,
      updatedAt: Date.now(),
      classes,
      samples,
      history,
      inputSize: samples[0]?.embedding.length ?? 0,
      modelKey: DEFAULT_GESTURE_MODEL_KEY,
    });
    setStatus(`Saved “${projectName}” to IndexedDB.`);
  };

  const downloadModel = async () => {
    if (!modelRef.current) return;
    await modelRef.current.save(`downloads://${projectName.replace(/\s+/g, "-").toLowerCase()}`);
    const blob = new Blob([JSON.stringify({ name: projectName, classes, feature: "hand-landmarks-68" }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gesture-labels.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetProject = async () => {
    if (!window.confirm("Delete the saved gesture project, samples, and IndexedDB weights?")) return;
    modelRef.current?.dispose();
    modelRef.current = null;
    setModelReady(false);
    try {
      await tf.io.removeModel(DEFAULT_GESTURE_MODEL_KEY);
    } catch {
      /* none */
    }
    await deleteClassifierProject(DEFAULT_GESTURE_ID);
    setSamples([]);
    setHistory([]);
    setPredictions([]);
    setConfusion(null);
    setStatus("Started a new gesture project.");
  };

  return (
    <VisionPageShell pathname={pathname} kicker="Train your own hand gestures from 21 MediaPipe landmarks.">
      <div className="cv-class-layout cv-gesture-train">
        <aside className="cv-panel cv-classes">
          <h2>Gesture classes</h2>
          <p>Unlimited classes · {samples.length} landmark samples</p>
          {classes.map((item, index) => {
            const thumbs = samples.filter((sample) => sample.classId === item.id).slice(-12);
            const capturing = capturingId === item.id;
            return (
            <article key={item.id} className={capturing || item.id === activeId ? "cv-class-card is-on" : "cv-class-card"}>
              <header className="cv-class-head">
                <i className="cv-class-swatch" style={{ background: item.color }} />
                <div>
                  <input value={item.name} aria-label="Gesture name" onChange={(event) => setClasses((current) => current.map((entry) => (entry.id === item.id ? { ...entry, name: event.target.value } : entry)))} />
                  <small>{counts[item.id] ?? 0} samples{capturing ? " · capturing 10/s" : ""}</small>
                </div>
                <button type="button" aria-label="Delete gesture" disabled={classes.length <= 1} onClick={() => {
                  if (!window.confirm(`Delete gesture “${item.name}”?`)) return;
                  setClasses((current) => current.filter((entry) => entry.id !== item.id));
                  setSamples((current) => current.filter((sample) => sample.classId !== item.id));
                }}><Trash2 size={14} /></button>
              </header>
              <div className="cv-film">
                {thumbs.length ? thumbs.map((sample) => (
                  <button key={sample.id} type="button" className="cv-thumb" title="Remove sample" onClick={() => setSamples((current) => current.filter((entry) => entry.id !== sample.id))}>
                    {sample.preview ? <img src={sample.preview} alt="" /> : <span />}
                  </button>
                )) : <span className="cv-film-empty">No captures yet</span>}
              </div>
              <div className="cv-class-actions">
                <button type="button" className={item.id === activeId ? "cv-btn-primary" : undefined} onClick={() => setActiveId(item.id)}>Use</button>
                <button
                  type="button"
                  className={capturing ? "cv-btn-capture is-on" : "cv-btn-capture"}
                  onClick={() => setCapturingId((current) => (current === item.id ? null : item.id))}
                  disabled={camera.status !== "live"}
                >
                  {capturing ? "Stop capturing" : "Start capturing"}
                </button>
                <button type="button" onClick={() => {
                  if (!window.confirm(`Clear samples for “${item.name}”?`)) return;
                  setSamples((current) => current.filter((sample) => sample.classId !== item.id));
                }}>Clear</button>
                <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => setClasses((current) => {
                  const next = [...current];
                  const [moved] = next.splice(index, 1);
                  if (moved) next.splice(index - 1, 0, moved);
                  return next;
                })}><ChevronUp size={12} /></button>
                <button type="button" aria-label="Move down" disabled={index === classes.length - 1} onClick={() => setClasses((current) => {
                  const next = [...current];
                  const [moved] = next.splice(index, 1);
                  if (moved) next.splice(index + 1, 0, moved);
                  return next;
                })}><ChevronDown size={12} /></button>
              </div>
            </article>
            );
          })}
          <button type="button" className="cv-btn-primary" style={{ width: "100%", marginTop: 10 }} onClick={() => setClasses((current) => {
            const next = { id: uid("g"), name: `Gesture ${current.length + 1}`, color: CLASS_COLORS[current.length % CLASS_COLORS.length] };
            setActiveId(next.id);
            return [...current, next];
          })}>
            <Plus size={14} /> Add gesture
          </button>
          {empty.length ? <p className="cv-warn">Empty classes: {empty.map((item) => item.name).join(", ")}</p> : null}
          {thin.length ? <p className="cv-warn">Fewer than 12 samples: {thin.map((item) => item.name).join(", ")}</p> : null}
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
            onSnapshot={() => captureFromHands(activeId, latestHands.current)}
            onToggleMirror={() => camera.setMirror((value) => !value)}
            devices={camera.devices}
            deviceId={camera.deviceId}
            onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }}
            extra={capturingId ? <span className="cv-capture-chip">Capturing 10/s</span> : undefined}
          >
            {showLandmarks ? <LandmarkOverlay hands={hands} width={size.w} height={size.h} showLandmarks showConnections /> : null}
          </VisionCamera>
          <label className="cv-inline"><input type="checkbox" checked={showLandmarks} onChange={(event) => setShowLandmarks(event.target.checked)} /> Show landmarks</label>
        </div>

        <aside className="cv-panel cv-infer">
          <h2>Training</h2>
          <p>{modelReady ? "Model ready" : training ? "Training…" : "Not trained"}</p>
          <div className="cv-train-grid">
            <div>
              <label>Epochs <input type="number" min={1} max={120} value={epochs} onChange={(event) => setEpochs(Number(event.target.value))} /></label>
              <label>Batch <input type="number" min={1} max={64} value={batchSize} onChange={(event) => setBatchSize(Number(event.target.value))} /></label>
              <label>LR <input type="number" step="0.0001" min={0.0001} value={learningRate} onChange={(event) => setLearningRate(Number(event.target.value))} /></label>
              <label>Val split <input type="number" step="0.05" min={0} max={0.5} value={valSplit} onChange={(event) => setValSplit(Number(event.target.value))} /></label>
              <label>Shuffle <input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} /></label>
              <label>Early stop <input type="checkbox" checked={earlyStop} onChange={(event) => setEarlyStop(event.target.checked)} /></label>
              <button type="button" className="cv-btn-primary" disabled={!canTrain} onClick={() => void train()}>{training ? "Training…" : modelReady ? "Retrain" : "Train model"}</button>
              <button type="button" disabled={!training} onClick={() => { stopTrainRef.current = true; if (modelRef.current) modelRef.current.stopTraining = true; }}>Stop training</button>
              <p>{status}</p>
            </div>
          </div>
          <div className="cv-metrics">
            <div><b>{latest ? `${latest.epoch}/${epochs}` : "—"}</b><span>Epoch</span></div>
            <div><b>{latest ? `${(latest.acc * 100).toFixed(1)}%` : "—"}</b><span>Acc</span></div>
            <div><b>{latest ? `${(latest.valAcc * 100).toFixed(1)}%` : "—"}</b><span>Val acc</span></div>
            <div><b>{latest ? latest.loss.toFixed(3) : "—"}</b><span>Loss</span></div>
            <div><b>{latest ? latest.valLoss.toFixed(3) : "—"}</b><span>Val loss</span></div>
            <div><b>{latest ? `${(latest.ms / 1000).toFixed(1)}s` : "—"}</b><span>Elapsed</span></div>
          </div>
          <p>Best epoch: {history.length ? `${best.epoch} · ${(best.valAcc * 100).toFixed(1)}% val` : "—"}</p>
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
          {confusion ? (
            <div style={{ overflow: "auto", marginTop: 8 }}>
              <table className="cv-table">
                <thead>
                  <tr>
                    <th>True \\ Pred</th>
                    {classes.map((item) => <th key={item.id}>{item.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {confusion.map((row, i) => (
                    <tr key={classes[i]?.id ?? i}>
                      <th>{classes[i]?.name}</th>
                      {row.map((cell, j) => <td key={j}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </aside>

        <section className="cv-panel cv-train">
          <h2>Live custom inference</h2>
          <p>{modelReady ? `${predictions[0]?.name ?? "—"} · ${((predictions[0]?.value ?? 0) * 100).toFixed(1)}% · ${fps.toFixed(0)} FPS · ${latency.toFixed(0)} ms` : "Train to unlock live predictions."}</p>
          <ConfidenceBars rows={predictions} />
        </section>

        <section className="cv-panel cv-export">
          <h2>Save / export</h2>
          <div className="cv-class-actions">
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} aria-label="Project name" />
            <button type="button" className="cv-btn-primary" onClick={() => void persist()}>Save to IndexedDB</button>
            <button type="button" onClick={() => void downloadModel()} disabled={!modelReady}><Download size={14} /> Download TF.js</button>
            <button type="button" onClick={() => void resetProject()}>New project</button>
          </div>
        </section>
      </div>
    </VisionPageShell>
  );
}
