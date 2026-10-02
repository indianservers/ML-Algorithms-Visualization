import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Download, Plus, Trash2 } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ConfidenceBars } from './ConfidenceBars';
import { disposeTensor, ensureTfBackend } from '../runtime/tensorflowRuntime';
import {
  DEFAULT_POSE_ID, DEFAULT_POSE_MODEL_KEY, deleteClassifierProject, loadClassifierProject, saveClassifierProject,
} from '../storage/visionProjectStore';
import { CLASS_COLORS, type ClassSample, type LandmarkPoint, type TrainPoint, type VisionClass } from '../types';
import { POSE_FEATURE_SIZE, poseFeatureVector, splitPoseSamples } from '../utils/poseClassifier';

const initialClasses: VisionClass[] = [
  { id: 'standing', name: 'Standing', color: CLASS_COLORS[0] },
  { id: 'arms-raised', name: 'Arms raised', color: CLASS_COLORS[1] },
];

function uid() {
  return `pose_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

type Prediction = { name: string; value: number; color: string; image?: string };

export function PoseTrainingPanel({ active, liveSource, landmarks, preview, analyzeImage }: {
  active: boolean;
  liveSource: boolean;
  landmarks: LandmarkPoint[];
  preview: () => string;
  analyzeImage: (file: File) => Promise<{ points: LandmarkPoint[]; preview: string }>;
}) {
  const modelRef = useRef<tf.LayersModel | null>(null);
  const stopTrainRef = useRef(false);
  const latestPoseRef = useRef(landmarks);
  const previewRef = useRef(preview);
  const lastInferenceRef = useRef(0);
  latestPoseRef.current = landmarks;
  previewRef.current = preview;

  const [classes, setClasses] = useState<VisionClass[]>(initialClasses);
  const [samples, setSamples] = useState<ClassSample[]>([]);
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const [training, setTraining] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [history, setHistory] = useState<TrainPoint[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [projectName, setProjectName] = useState('My Pose Classifier');
  const [status, setStatus] = useState('Capture at least two examples for each pose, then train.');
  const [epochs, setEpochs] = useState(40);
  const [batchSize, setBatchSize] = useState(16);
  const [learningRate, setLearningRate] = useState(0.002);
  const [valSplit, setValSplit] = useState(0.2);
  const [earlyStop, setEarlyStop] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const saved = await loadClassifierProject(DEFAULT_POSE_ID);
        if (!mounted || !saved) return;
        setProjectName(saved.name);
        setClasses(saved.classes);
        setSamples(saved.samples);
        setHistory(saved.history);
        try {
          await ensureTfBackend();
          const model = await tf.loadLayersModel(saved.modelKey);
          if (!mounted) { model.dispose(); return; }
          const inputSize = model.inputs[0]?.shape?.at(-1);
          const outputs = model.outputs[0]?.shape?.at(-1);
          if (inputSize !== POSE_FEATURE_SIZE || outputs !== saved.classes.length) {
            model.dispose();
            setStatus('Restored pose samples. Retrain to update the saved model format.');
            return;
          }
          modelRef.current = model;
          setModelReady(true);
          setStatus(`Loaded “${saved.name}”. Live pose inference is ready.`);
        } catch {
          setStatus('Restored pose samples. Train again to rebuild the classifier.');
        }
      } catch {
        if (mounted) setStatus('Saved poses could not be loaded. You can start a new project.');
      }
    })();
    return () => { mounted = false; modelRef.current?.dispose(); modelRef.current = null; };
  }, []);

  const counts = useMemo(() => Object.fromEntries(classes.map((item) => [item.id, samples.filter((sample) => sample.classId === item.id).length])), [classes, samples]);
  const thin = classes.filter((item) => (counts[item.id] ?? 0) < 10);
  const names = classes.map((item) => item.name.trim().toLowerCase());
  const namesValid = names.every(Boolean) && new Set(names).size === names.length;
  const canTrain = classes.length >= 2 && namesValid && classes.every((item) => (counts[item.id] ?? 0) >= 2) && !training && !importing;
  const latest = history.at(-1);
  const maxCount = Math.max(1, ...classes.map((item) => counts[item.id] ?? 0));

  const invalidateModel = useCallback(() => {
    modelRef.current?.dispose();
    modelRef.current = null;
    setModelReady(false);
    setPredictions([]);
    setHistory([]);
    setStatus('Pose examples changed. Retrain to include the new samples.');
  }, []);

  const capture = useCallback((classId: string) => {
    const embedding = poseFeatureVector(latestPoseRef.current);
    if (!embedding.length) {
      setStatus('No clear pose detected. Keep shoulders and hips in view, then capture again.');
      return;
    }
    invalidateModel();
    setSamples((current) => [...current, { id: uid(), classId, preview: previewRef.current(), embedding }]);
  }, [invalidateModel]);

  useEffect(() => {
    if (!active || !liveSource || !capturingId || training) return;
    const timer = window.setInterval(() => capture(capturingId), 180);
    return () => window.clearInterval(timer);
  }, [active, liveSource, capturingId, training, capture]);

  useEffect(() => {
    if (!active || !modelReady || !modelRef.current) return;
    const embedding = poseFeatureVector(landmarks);
    if (!embedding.length) {
      const frame = window.requestAnimationFrame(() => setPredictions((current) => current.length ? [] : current));
      return () => window.cancelAnimationFrame(frame);
    }
    if (performance.now() - lastInferenceRef.current < 140) return;
    lastInferenceRef.current = performance.now();
    let cancelled = false;
    void (async () => {
      const input = tf.tensor2d([embedding]);
      let output: tf.Tensor | undefined;
      try {
        output = modelRef.current?.predict(input) as tf.Tensor | undefined;
        if (!output) return;
        const probabilities = Array.from(await output.data());
        if (!cancelled) setPredictions(classes.map((item, index) => ({
          name: item.name,
          value: probabilities[index] ?? 0,
          color: item.color,
          image: samples.find((sample) => sample.classId === item.id)?.preview,
        })).sort((a, b) => b.value - a.value));
      } catch {
        if (!cancelled) setPredictions([]);
      } finally {
        disposeTensor([input, output]);
      }
    })();
    return () => { cancelled = true; };
  }, [active, classes, landmarks, modelReady, samples]);

  const importImages = async (classId: string, files: FileList | null) => {
    const images = Array.from(files ?? []).filter((file) => file.type.startsWith('image/'));
    if (!images.length) return;
    setImporting(true);
    setStatus(`Reading ${images.length} pose image${images.length === 1 ? '' : 's'}…`);
    const imported: ClassSample[] = [];
    try {
      for (const file of images) {
        const result = await analyzeImage(file);
        const embedding = poseFeatureVector(result.points);
        if (embedding.length) imported.push({ id: uid(), classId, preview: result.preview, embedding });
      }
      if (imported.length) {
        invalidateModel();
        setSamples((current) => [...current, ...imported]);
      }
      setStatus(`Imported ${imported.length} of ${images.length} images. ${images.length - imported.length} had no clear pose.`);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : 'Could not import pose images.');
    } finally {
      setImporting(false);
    }
  };

  const train = async () => {
    if (!canTrain) return;
    stopTrainRef.current = false;
    setCapturingId(null);
    setTraining(true);
    setModelReady(false);
    setPredictions([]);
    setHistory([]);
    setStatus('Training started · preparing normalized pose landmarks…');
    let tensors: tf.Tensor[] = [];
    try {
      await ensureTfBackend();
      const classIds = classes.map((item) => item.id);
      const split = splitPoseSamples(samples, classIds, valSplit);
      const labels = (rows: ClassSample[]) => rows.map((sample) => classIds.map((id) => Number(id === sample.classId)));
      const trainXs = tf.tensor2d(split.training.map((sample) => sample.embedding));
      const trainYs = tf.tensor2d(labels(split.training));
      tensors = [trainXs, trainYs];
      let validationData: [tf.Tensor2D, tf.Tensor2D] | undefined;
      if (split.validation.length) {
        const valXs = tf.tensor2d(split.validation.map((sample) => sample.embedding));
        const valYs = tf.tensor2d(labels(split.validation));
        tensors.push(valXs, valYs);
        validationData = [valXs, valYs];
      }
      modelRef.current?.dispose();
      const model = tf.sequential();
      model.add(tf.layers.dense({ inputShape: [POSE_FEATURE_SIZE], units: 64, activation: 'relu' }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: classIds.length, activation: 'softmax' }));
      model.compile({ optimizer: tf.train.adam(learningRate), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
      modelRef.current = model;
      const points: TrainPoint[] = [];
      const started = performance.now();
      let bestLoss = Number.POSITIVE_INFINITY;
      let patience = 0;
      setStatus(`Training ${split.training.length} samples${validationData ? ` · validating on ${split.validation.length}` : ''}…`);
      await model.fit(trainXs, trainYs, {
        epochs: Math.max(1, Math.min(120, epochs)),
        batchSize: Math.max(1, Math.min(batchSize, split.training.length)),
        shuffle: true,
        validationData,
        yieldEvery: 'epoch',
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            const acc = Number(logs?.acc ?? logs?.accuracy ?? 0);
            const loss = Number(logs?.loss ?? 0);
            const valAcc = Number(logs?.val_acc ?? logs?.val_accuracy ?? acc);
            const valLoss = Number(logs?.val_loss ?? loss);
            points.push({ epoch: epoch + 1, acc, loss, valAcc, valLoss, ms: performance.now() - started });
            setHistory([...points]);
            setStatus(`Epoch ${epoch + 1}/${epochs} · accuracy ${(acc * 100).toFixed(1)}% · loss ${loss.toFixed(3)}`);
            if (stopTrainRef.current) model.stopTraining = true;
            if (earlyStop && validationData) {
              if (valLoss < bestLoss - 1e-4) { bestLoss = valLoss; patience = 0; }
              else if (++patience >= 5) model.stopTraining = true;
            }
            await tf.nextFrame();
          },
        },
      });
      setModelReady(true);
      setStatus(`Training completed · ${points.length} epoch${points.length === 1 ? '' : 's'}. Live inference is ready.`);
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : 'Pose training failed.');
    } finally {
      disposeTensor(tensors);
      setTraining(false);
    }
  };

  const save = async () => {
    if (!modelRef.current) { setStatus('Train a pose model before saving.'); return; }
    try {
      await modelRef.current.save(DEFAULT_POSE_MODEL_KEY);
      await saveClassifierProject({
        id: DEFAULT_POSE_ID, name: projectName.trim() || 'My Pose Classifier', updatedAt: Date.now(),
        classes, samples, history, inputSize: POSE_FEATURE_SIZE, modelKey: DEFAULT_POSE_MODEL_KEY,
      });
      setStatus(`Saved “${projectName}” and its samples in this browser.`);
    } catch (caught) { setStatus(caught instanceof Error ? caught.message : 'Could not save pose project.'); }
  };

  const download = async () => {
    if (!modelRef.current) return;
    try {
      await modelRef.current.save(`downloads://${(projectName.trim() || 'pose-classifier').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`);
      const metadata = new Blob([JSON.stringify({ name: projectName, classes, feature: 'normalized-mediapipe-pose-v1', inputSize: POSE_FEATURE_SIZE }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(metadata);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pose-labels.json';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('Downloaded the TensorFlow.js model and pose labels.');
    } catch (caught) { setStatus(caught instanceof Error ? caught.message : 'Could not export the pose model.'); }
  };

  const reset = async () => {
    if (!window.confirm('Delete this pose project, all examples, and saved model weights?')) return;
    modelRef.current?.dispose();
    modelRef.current = null;
    try { await tf.io.removeModel(DEFAULT_POSE_MODEL_KEY); } catch { /* no saved model */ }
    await deleteClassifierProject(DEFAULT_POSE_ID);
    setClasses(initialClasses);
    setSamples([]);
    setHistory([]);
    setPredictions([]);
    setModelReady(false);
    setCapturingId(null);
    setProjectName('My Pose Classifier');
    setStatus('Started a new pose project.');
  };

  return (
    <div className="cv-pose-train-host" hidden={!active}>
      <div className="cv-pose-train-layout">
        <aside className="cv-panel cv-classes">
          <h2>Pose classes</h2>
          <p>Train on your own poses · {samples.length} landmark examples</p>
          {classes.map((item) => {
            const examples = samples.filter((sample) => sample.classId === item.id);
            const capturing = capturingId === item.id;
            return <article key={item.id} className={capturing ? 'cv-class-card is-on' : 'cv-class-card'}>
              <header className="cv-class-head">
                <i className="cv-class-swatch" style={{ background: item.color }} />
                <div>
                  <input aria-label="Pose name" value={item.name} disabled={training} onChange={(event) => setClasses((current) => current.map((entry) => entry.id === item.id ? { ...entry, name: event.target.value } : entry))} />
                  <small>{examples.length} examples{capturing ? ' · capturing' : ''}</small>
                </div>
                <button type="button" aria-label={`Delete ${item.name}`} disabled={training || classes.length <= 2} onClick={() => {
                  if (!window.confirm(`Delete pose “${item.name}” and its examples?`)) return;
                  invalidateModel();
                  setClasses((current) => current.filter((entry) => entry.id !== item.id));
                  setSamples((current) => current.filter((sample) => sample.classId !== item.id));
                }}><Trash2 size={14} /></button>
              </header>
              <div className="cv-film" aria-label={`${item.name} examples`}>
                {examples.slice(-12).map((sample) => <button key={sample.id} type="button" className="cv-thumb" title="Remove example" aria-label={`Remove ${item.name} example`} disabled={training} onClick={() => { invalidateModel(); setSamples((current) => current.filter((entry) => entry.id !== sample.id)); }}>
                  {sample.preview ? <img src={sample.preview} alt="" /> : <span />}
                </button>)}
                {!examples.length && <span className="cv-film-empty">No examples yet</span>}
              </div>
              <div className="cv-class-actions">
                <button type="button" className="cv-btn-primary" disabled={training || !landmarks.length} onClick={() => capture(item.id)}>Capture once</button>
                <button type="button" className={capturing ? 'cv-btn-capture is-on' : 'cv-btn-capture'} disabled={training || !liveSource} onClick={() => setCapturingId((current) => current === item.id ? null : item.id)}>{capturing ? 'Stop capture' : 'Capture 5/s'}</button>
                <label className="cv-btn">Upload images<input type="file" accept="image/*" multiple hidden disabled={training || importing} onChange={(event) => { const files = event.target.files; void importImages(item.id, files); event.target.value = ''; }} /></label>
              </div>
            </article>;
          })}
          <button type="button" className="cv-btn-primary" disabled={training} style={{ width: '100%', marginTop: 10 }} onClick={() => { invalidateModel(); setClasses((current) => [...current, { id: uid(), name: `Pose ${current.length + 1}`, color: CLASS_COLORS[current.length % CLASS_COLORS.length] }]); }}><Plus size={14} /> Add pose</button>
          {!namesValid && <p className="cv-warn">Give every pose a different, non-empty name.</p>}
          {thin.length > 0 && <p className="cv-warn">For better results, capture 10+ varied examples per pose: {thin.map((item) => item.name).join(', ')}.</p>}
        </aside>

        <section className="cv-panel cv-train">
          <h2>Train pose model {training && <em className="cv-live-tag">Live</em>}</h2>
          <p>MediaPipe extracts 33 landmarks; a small TensorFlow.js classifier learns the pose names. Your examples stay in this browser.</p>
          <div className="cv-train-grid">
            <div>
              <label>Epochs <input type="number" min={1} max={120} value={epochs} onChange={(event) => setEpochs(Number(event.target.value))} /></label>
              <label>Batch <input type="number" min={1} max={64} value={batchSize} onChange={(event) => setBatchSize(Number(event.target.value))} /></label>
              <label>Learning rate <input type="number" min={0.0001} max={0.1} step={0.0001} value={learningRate} onChange={(event) => setLearningRate(Number(event.target.value))} /></label>
              <label>Validation split <input type="number" min={0} max={0.4} step={0.05} value={valSplit} onChange={(event) => setValSplit(Number(event.target.value))} /></label>
              <label>Early stop <input type="checkbox" checked={earlyStop} onChange={(event) => setEarlyStop(event.target.checked)} /></label>
              <button type="button" className="cv-btn-primary" disabled={!canTrain} onClick={() => void train()}>{training ? 'Training…' : modelReady ? 'Retrain model' : 'Train model'}</button>
              <button type="button" disabled={!training} onClick={() => { stopTrainRef.current = true; if (modelRef.current) modelRef.current.stopTraining = true; }}>Stop training</button>
              <p role="status" aria-live="polite">{status}</p>
            </div>
            <div>
              <div className="cv-metrics">
                <div><b>{latest ? `${latest.epoch}/${epochs}` : '—'}</b><span>Epoch</span></div>
                <div><b>{latest ? `${(latest.acc * 100).toFixed(1)}%` : '—'}</b><span>Train acc</span></div>
                <div><b>{latest ? latest.loss.toFixed(3) : '—'}</b><span>Loss</span></div>
                <div><b>{latest && samples.length >= 10 ? `${(latest.valAcc * 100).toFixed(1)}%` : '—'}</b><span>Val acc</span></div>
              </div>
              <div className="cv-balance">{classes.map((item) => <div key={item.id}><i style={{ width: `${((counts[item.id] ?? 0) / maxCount) * 100}%`, background: item.color }} /><span>{item.name} {counts[item.id] ?? 0}</span></div>)}</div>
              <div className="cv-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="epoch" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="acc" stroke="#16a34a" dot={false} name="train acc" /><Line type="monotone" dataKey="valAcc" stroke="#2563eb" dot={false} name="val acc" /><Line type="monotone" dataKey="loss" stroke="#db2777" dot={false} name="loss" /></LineChart></ResponsiveContainer></div>
            </div>
          </div>
          {history.length > 0 && <ol className="cv-pose-log" aria-label="Training log">{history.slice(-6).map((point) => <li key={point.epoch}>Epoch {point.epoch}: {(point.acc * 100).toFixed(1)}% accuracy · loss {point.loss.toFixed(3)}</li>)}</ol>}
        </section>

        <aside className="cv-panel cv-infer">
          <h2>Live pose inference</h2>
          <p>{modelReady ? 'Use the camera, video, or Image button above to test a new pose.' : 'Train a model to unlock predictions.'}</p>
          {modelReady && <p className="cv-pred">{predictions[0] ? `${predictions[0].name} · ${(predictions[0].value * 100).toFixed(1)}%` : 'No clear pose detected'}</p>}
          <ConfidenceBars rows={predictions} />
          <p>Predictions describe your custom pose classes; the MediaPipe skeleton remains available in the Estimate tab.</p>
        </aside>

        <section className="cv-panel cv-export">
          <h2>Save / export</h2>
          <div className="cv-class-actions">
            <input aria-label="Pose project name" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
            <button type="button" className="cv-btn-primary" disabled={!modelReady} onClick={() => void save()}>Save to browser</button>
            <button type="button" disabled={!modelReady} onClick={() => void download()}><Download size={14} /> Download TF.js</button>
            <button type="button" disabled={training} onClick={() => void reset()}>New project</button>
          </div>
        </section>
      </div>
    </div>
  );
}
