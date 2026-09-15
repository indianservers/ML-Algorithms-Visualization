import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Mic, Play, Plus, Radio, RotateCcw, Square, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { stopMediaStream } from '../../../lib/media/streams';
import { generateExperimentId, saveModelMetadata } from '../../../stores/experimentStore';
import { AUDIO_DEMO_CLASSES, bandEnergies, demoClip, featureScaler, isSilent, resampleLinear, rms, stereoToMono, stft, zeroCrossingRate } from '../../../lib/nlp/audioFeatures';

type AudioClass = { id: string; name: string; color: string };
type AudioExample = { id: string; classId: string; feature: number[]; frames: number[][]; samples?: number[]; createdAt: number };
type Prediction = AudioClass & { probability: number };
type EpochPoint = { epoch: number; loss: number; accuracy: number };
type CalibrationSample = { classId: string; confidence: number };

const COLORS = ['#2563eb', '#059669', '#dc2626', '#9333ea', '#ea580c', '#0891b2', '#be123c', '#4f46e5'];
const MEL_BANDS = 40;
const WINDOW_MS = 1000;
const MIN_SAMPLES_PER_CLASS = 8;

const initialClasses: AudioClass[] = [
  { id: 'sound_a', name: 'Sound 1', color: COLORS[0] },
  { id: 'sound_b', name: 'Sound 2', color: COLORS[1] },
];

function hzToMel(hz: number) {
  return 2595 * Math.log10(1 + hz / 700);
}

function melToHz(mel: number) {
  return 700 * (10 ** (mel / 2595) - 1);
}

function makeMelEdges(sampleRate: number) {
  const minMel = hzToMel(80);
  const maxMel = hzToMel(Math.min(7600, sampleRate / 2));
  return Array.from({ length: MEL_BANDS + 2 }, (_, index) => melToHz(minMel + (index / (MEL_BANDS + 1)) * (maxMel - minMel)));
}

function extractMelBands(analyser: AnalyserNode, sampleRate: number) {
  const freq = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(freq);
  const edges = makeMelEdges(sampleRate);
  const nyquist = sampleRate / 2;
  const bands = Array.from({ length: MEL_BANDS }, (_, band) => {
    const start = Math.floor((edges[band] / nyquist) * freq.length);
    const center = Math.floor((edges[band + 1] / nyquist) * freq.length);
    const end = Math.max(center + 1, Math.floor((edges[band + 2] / nyquist) * freq.length));
    let weighted = 0;
    let weights = 0;
    for (let bin = start; bin <= end && bin < freq.length; bin++) {
      const weight = bin <= center
        ? (bin - start) / Math.max(1, center - start)
        : (end - bin) / Math.max(1, end - center);
      const magnitude = Math.max(0, (freq[bin] + 100) / 100);
      weighted += magnitude * Math.max(0, weight);
      weights += Math.max(0, weight);
    }
    return Math.max(0, Math.min(1, weighted / Math.max(1e-6, weights)));
  });
  return bands;
}

function averageFrames(frames: number[][]) {
  return Array.from({ length: MEL_BANDS }, (_, band) =>
    frames.reduce((sum, frame) => sum + (frame[band] ?? 0), 0) / Math.max(1, frames.length)
  );
}

function buildAudioModel(classCount: number) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [MEL_BANDS] }));
  model.add(tf.layers.dropout({ rate: 0.25 }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: classCount, activation: 'softmax' }));
  model.compile({ optimizer: tf.train.adam(0.001), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
  return model;
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AudioClassificationPage() {
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const inferenceRef = useRef<number | null>(null);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const scalerRef = useRef<ReturnType<typeof featureScaler> | null>(null);
  const classesRef = useRef<AudioClass[]>(initialClasses);
  const [classes, setClasses] = useState<AudioClass[]>(initialClasses);
  const [examples, setExamples] = useState<AudioExample[]>([]);
  const [liveBands, setLiveBands] = useState<number[]>(Array(MEL_BANDS).fill(0));
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [recordingClass, setRecordingClass] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [training, setTraining] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [epochs, setEpochs] = useState(35);
  const [batchSize, setBatchSize] = useState(16);
  const [threshold, setThreshold] = useState(0.7);
  const [calibrationSamples, setCalibrationSamples] = useState<CalibrationSample[]>([]);
  const [calibrating, setCalibrating] = useState(false);
  const [epochData, setEpochData] = useState<EpochPoint[]>([]);
  const [holdout, setHoldout] = useState<{ labels: string[]; matrix: number[][] } | null>(null);
  const [status, setStatus] = useState('Start the microphone, record at least 8 one-second clips per class, then train.');

  useEffect(() => { classesRef.current = classes; }, [classes]);
  const aliveRef = useRef(true);

  useEffect(() => () => {
    aliveRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (inferenceRef.current) window.clearInterval(inferenceRef.current);
    stopMediaStream(streamRef.current);
    void contextRef.current?.close();
    modelRef.current?.dispose();
  }, []);

  const counts = useMemo(
    () => Object.fromEntries(classes.map(cls => [cls.id, examples.filter(example => example.classId === cls.id).length])),
    [classes, examples]
  );
  const readyToTrain = classes.length >= 2 && classes.every(cls => (counts[cls.id] ?? 0) >= MIN_SAMPLES_PER_CLASS) && !training;
  const pcmExample = examples.find((example) => example.samples && example.samples.length > 10);
  const pcm = pcmExample?.samples ?? [];
  const spectrogram = pcm.length ? stft(pcm, 64, 32) : [];
  const probSum = predictions.reduce((s, item) => s + item.probability, 0);
  const topPrediction = predictions[0];
  const displayLabel = topPrediction && topPrediction.probability >= threshold ? topPrediction.name : 'Uncertain';
  const rejectionRate = calibrationSamples.length
    ? calibrationSamples.filter(sample => sample.confidence < threshold).length / calibrationSamples.length
    : topPrediction ? (topPrediction.probability >= threshold ? 0 : 1) : 0;
  const calibrationHistogram = useMemo(() => Array.from({ length: 10 }, (_, index) => {
    const low = index / 10;
    const high = (index + 1) / 10;
    return {
      bin: `${Math.round(low * 100)}-${Math.round(high * 100)}%`,
      count: calibrationSamples.filter(sample => sample.confidence >= low && (index === 9 ? sample.confidence <= high : sample.confidence < high)).length,
    };
  }), [calibrationSamples]);
  const suggestedThreshold = useMemo(() => {
    if (!calibrationSamples.length) return threshold;
    const sorted = [...calibrationSamples].map(sample => sample.confidence).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.25)] ?? threshold;
  }, [calibrationSamples, threshold]);

  const readMelBands = useCallback(() => {
    const analyser = analyserRef.current;
    const context = contextRef.current;
    if (!analyser || !context) return null;
    return extractMelBands(analyser, context.sampleRate);
  }, []);

  const animateBands = useCallback(function tickBands() {
    const bands = readMelBands();
    if (bands) setLiveBands(bands);
    rafRef.current = requestAnimationFrame(tickBands);
  }, [readMelBands]);

  const classifyBands = useCallback(async (bands: number[]) => {
    const model = modelRef.current;
    if (!model) return;
    const scaler = scalerRef.current;
    const features = scaler ? scaler.apply(bands) : bands;
    const input = tf.tensor2d(features, [1, MEL_BANDS]);
    const output = model.predict(input) as tf.Tensor;
    const values = Array.from(await output.data());
    input.dispose();
    output.dispose();
    setPredictions(
      classesRef.current
        .map((cls, index) => ({ ...cls, probability: values[index] ?? 0 }))
        .sort((a, b) => b.probability - a.probability)
    );
  }, []);

  const readAudioPrediction = useCallback(async (bands: number[]) => {
    const model = modelRef.current;
    if (!model) return null;
    const scaler = scalerRef.current;
    const features = scaler ? scaler.apply(bands) : bands;
    const input = tf.tensor2d(features, [1, MEL_BANDS]);
    const output = model.predict(input) as tf.Tensor;
    const values = Array.from(await output.data());
    input.dispose();
    output.dispose();
    return classesRef.current
      .map((cls, index) => ({ ...cls, probability: values[index] ?? 0 }))
      .sort((a, b) => b.probability - a.probability);
  }, []);

  const calibrateThreshold = async () => {
    if (!modelRef.current || !running) {
      setStatus('Start the microphone and train a model before calibration.');
      return;
    }
    setCalibrating(true);
    setStatus('Calibrating confidence threshold from 30 live audio windows...');
    const samples: CalibrationSample[] = [];
    for (let index = 0; index < 30; index++) {
      const bands = readMelBands();
      if (bands) {
        const next = await readAudioPrediction(bands);
        const top = next?.[0];
        if (next) setPredictions(next);
        if (top) samples.push({ classId: top.id, confidence: top.probability });
      }
      await new Promise(resolve => window.setTimeout(resolve, 120));
    }
    setCalibrationSamples(samples);
    setCalibrating(false);
    const sorted = [...samples].map(sample => sample.confidence).sort((a, b) => a - b);
    setStatus(`Calibration complete. Suggested threshold: ${Math.round(((sorted[Math.floor(sorted.length * 0.25)] ?? threshold) * 100))}%.`);
  };

  const startInferenceLoop = useCallback(() => {
    if (inferenceRef.current) window.clearInterval(inferenceRef.current);
    inferenceRef.current = window.setInterval(() => {
      const bands = readMelBands();
      if (bands) void classifyBands(bands);
    }, WINDOW_MS);
  }, [classifyBands, readMelBands]);

  const startMic = async () => {
    if (running) return;
    await tf.setBackend('webgl');
    await tf.ready();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) throw new Error('Web Audio API is not available in this browser.');
    const context = new AudioContextCtor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.45;
    context.createMediaStreamSource(stream).connect(analyser);
    contextRef.current = context;
    analyserRef.current = analyser;
    streamRef.current = stream;
    setRunning(true);
    setStatus('Microphone is live. Record one-second samples from each class card.');
    animateBands();
    startInferenceLoop();
  };

  const stopMic = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (inferenceRef.current) window.clearInterval(inferenceRef.current);
    rafRef.current = null;
    inferenceRef.current = null;
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
    analyserRef.current = null;
    setRunning(false);
    setRecordingClass(null);
    setStatus('Microphone stopped and released.');
  };

  const recordSample = async (classId: string) => {
    if (!analyserRef.current) {
      setStatus('Start the microphone before recording samples.');
      return;
    }
    setRecordingClass(classId);
    const frames: number[][] = [];
    const frameCount = 40;
    for (let index = 0; index < frameCount; index++) {
      const bands = readMelBands();
      if (bands) frames.push(bands);
      await new Promise(resolve => window.setTimeout(resolve, 25));
    }
    const feature = averageFrames(frames);
    setExamples(current => [...current, { id: `${classId}_${Date.now()}`, classId, feature, frames, createdAt: Date.now() }]);
    setRecordingClass(null);
    setStatus(`Recorded ${frames.length} Mel frames for ${classesRef.current.find(cls => cls.id === classId)?.name ?? 'class'}.`);
  };

  const train = async () => {
    if (!readyToTrain) {
      setStatus('Collect at least 8 one-second examples for every class before training.');
      return;
    }
    setTraining(true);
    setEpochData([]);
    setCalibrationSamples([]);
    setHoldout(null);
    setModelReady(false);
    modelRef.current?.dispose();
    const model = buildAudioModel(classes.length);
    const classIndex = new Map(classes.map((cls, index) => [cls.id, index]));
    const trainSet: AudioExample[] = [];
    const testSet: AudioExample[] = [];
    classes.forEach((cls) => {
      const group = examples.filter((example) => example.classId === cls.id);
      const nTest = Math.max(1, Math.floor(group.length * 0.2));
      testSet.push(...group.slice(0, nTest));
      trainSet.push(...group.slice(nTest));
    });
    if (trainSet.length < 2) {
      setTraining(false);
      setStatus('Not enough training clips after the stratified hold-out.');
      return;
    }
    const scaler = featureScaler(trainSet.map((example) => example.feature));
    scalerRef.current = scaler;
    const xs = tf.tensor2d(trainSet.map((example) => scaler.apply(example.feature)), [trainSet.length, MEL_BANDS]);
    const ys = tf.tensor2d(trainSet.flatMap((example) => {
      const row = Array(classes.length).fill(0);
      row[classIndex.get(example.classId) ?? 0] = 1;
      return row;
    }), [trainSet.length, classes.length]);
    let finalAccuracy = 0;

    await model.fit(xs, ys, {
      epochs,
      batchSize,
      shuffle: true,
      validationSplit: examples.length >= 24 ? 0.2 : 0,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          if (!aliveRef.current) {
            model.stopTraining = true;
            return;
          }
          finalAccuracy = (logs?.acc as number | undefined) ?? (logs?.accuracy as number | undefined) ?? 0;
          setEpochData(current => [...current, {
            epoch: epoch + 1,
            loss: Number((logs?.loss ?? 0).toFixed(4)),
            accuracy: Number(finalAccuracy.toFixed(4)),
          }]);
          await tf.nextFrame();
        },
      },
    });
    xs.dispose();
    ys.dispose();
    if (!aliveRef.current) {
      model.dispose();
      return;
    }
    if (testSet.length) {
      const xt = tf.tensor2d(testSet.map((example) => scaler.apply(example.feature)));
      const pred = model.predict(xt) as tf.Tensor;
      const values = await pred.array() as number[][];
      xt.dispose();
      pred.dispose();
      const labels = classes.map((cls) => cls.name);
      const matrix = labels.map(() => labels.map(() => 0));
      const hits = values.filter((row, i) => {
        const predicted = row.indexOf(Math.max(...row));
        const actual = classIndex.get(testSet[i].classId) ?? -1;
        if (actual >= 0 && predicted >= 0) matrix[actual][predicted] += 1;
        return predicted === actual;
      }).length;
      setHoldout({ labels, matrix });
      setStatus(`Trained. Hold-out accuracy ${((hits / testSet.length) * 100).toFixed(0)}% on ${testSet.length} clips (scaler fit on train only).`);
    }
    modelRef.current = model;
    setModelReady(true);
    await saveModelMetadata({
      id: generateExperimentId(),
      name: `Audio classifier - ${classes.length} classes`,
      algorithmId: 'audio-classification',
      algorithmName: 'Audio Classification',
      savedAt: Date.now(),
      parameters: { modality: 'audio', classCount: classes.length, labels: classes.map(cls => cls.name), melBands: MEL_BANDS, windowSize: WINDOW_MS, epochs, batchSize },
      metrics: { accuracy: finalAccuracy },
      artifactType: 'tfjs',
    });
    setTraining(false);
    setStatus('Audio classifier trained. Live inference runs every second while the microphone is active.');
  };

  const exportModel = async () => {
    if (!modelRef.current) {
      setStatus('Train a model before exporting.');
      return;
    }
    await modelRef.current.save('downloads://audio-classifier');
    downloadJson('audio-classifier-metadata.json', {
      classLabels: classes.map(cls => cls.name),
      melBands: MEL_BANDS,
      sampleRate: contextRef.current?.sampleRate ?? 44100,
      windowSize: WINDOW_MS,
      createdAt: new Date().toISOString(),
    });
  };

  const addClass = () => {
    setClasses(current => current.length >= 8 ? current : [
      ...current,
      { id: `sound_${Date.now()}`, name: `Sound ${current.length + 1}`, color: COLORS[current.length % COLORS.length] },
    ]);
  };

  const loadSyntheticTones = () => {
    const nextClasses = AUDIO_DEMO_CLASSES.map((item, index) => ({
      id: item.id,
      name: item.name,
      color: COLORS[index],
    }));
    const nextExamples: AudioExample[] = [];
    nextClasses.forEach((cls) => {
      for (let variant = 0; variant < 8; variant += 1) {
        const samples = demoClip(cls.id, variant);
        const feature = bandEnergies(samples, MEL_BANDS);
        nextExamples.push({
          id: `${cls.id}_${variant}`,
          classId: cls.id,
          feature,
          frames: [feature],
          samples,
          createdAt: Date.now() + variant,
        });
      }
    });
    setClasses(nextClasses);
    setExamples(nextExamples);
    setStatus('Loaded synthetic 440 Hz / 880 Hz / noise clips with real PCM. Waveform and STFT come from those samples, not a decorative sine drawing.');
  };

  const reset = () => {
    modelRef.current?.dispose();
    modelRef.current = null;
    scalerRef.current = null;
    setModelReady(false);
    setExamples([]);
    setPredictions([]);
    setEpochData([]);
    setCalibrationSamples([]);
    setHoldout(null);
    setStatus('Dataset and trained model cleared.');
  };

  const addUploadedClip = async (file: File, classId: string) => {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      setStatus('Web Audio API is not available.');
      return;
    }
    const context = new AudioContextCtor();
    try {
      const buffer = await context.decodeAudioData(await file.arrayBuffer());
      const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => Array.from(buffer.getChannelData(c)));
      const mono = stereoToMono(channels);
      const resampled = resampleLinear(mono, buffer.sampleRate, 16000);
      const feature = bandEnergies(resampled, MEL_BANDS);
      setExamples((current) => [
        ...current,
        { id: `${classId}_${file.name}_${Date.now()}`, classId, feature, frames: [feature], samples: resampled, createdAt: Date.now() },
      ]);
      setStatus(`Decoded ${file.name}: ${buffer.numberOfChannels} ch @ ${buffer.sampleRate} Hz → averaged mono → 16 kHz (${resampled.length} samples). ${isSilent(resampled) ? "Low-information / silent clip." : ""}`);
    } catch {
      setStatus(`Could not decode ${file.name}.`);
    } finally {
      await context.close();
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader
        title="Audio Classification"
        subtitle="Audio (not text): Mel bands from analyser FFT, or synthetic PCM tones with real waveform/STFT. Train an MLP; hold-out clips are not the training clips."
        badge="Browser Trainable"
        category="Browser Training"
        icon={<Mic size={22} />}
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr_360px]">
        <div className="space-y-4">
          <Card
            title="Class Samples"
            actions={<button onClick={addClass} disabled={classes.length >= 8} className="rounded border border-gray-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-gray-700"><Plus size={12} /></button>}
          >
            <div className="space-y-3">
              {classes.map(cls => {
                const classExamples = examples.filter(example => example.classId === cls.id);
                const preview = classExamples.at(-1)?.feature ?? Array(MEL_BANDS).fill(0);
                return (
                  <div key={cls.id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cls.color }} />
                      <input
                        value={cls.name}
                        onChange={event => setClasses(current => current.map(item => item.id === cls.id ? { ...item, name: event.target.value } : item))}
                        className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-sm font-semibold dark:border-gray-700 dark:bg-gray-900"
                      />
                      <button onClick={() => setClasses(current => current.length <= 2 ? current : current.filter(item => item.id !== cls.id))} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => void recordSample(cls.id)}
                        disabled={!running || recordingClass !== null}
                        className={`inline-flex items-center gap-2 rounded px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${recordingClass === cls.id ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        {recordingClass === cls.id ? <Square size={13} /> : <Radio size={13} />}
                        {recordingClass === cls.id ? 'Recording...' : 'Record 1s'}
                      </button>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${(counts[cls.id] ?? 0) >= MIN_SAMPLES_PER_CLASS ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {counts[cls.id] ?? 0} / {MIN_SAMPLES_PER_CLASS}
                      </span>
                    </div>
                    <label className="mt-2 block text-[11px] text-gray-500">
                      Upload WAV/MP3
                      <input
                        type="file"
                        accept="audio/*"
                        className="mt-1 block w-full text-[11px]"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void addUploadedClip(file, cls.id);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <div className="mt-3 flex h-12 items-end gap-[2px] rounded bg-gray-100 p-1 dark:bg-gray-900">
                      {preview.map((value, index) => (
                        <span key={index} className="flex-1 rounded-t" style={{ height: `${Math.max(4, value * 44)}px`, backgroundColor: cls.color, opacity: 0.35 + value * 0.55 }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="PCM waveform and STFT (not a decorative sine)">
            {pcm.length ? (
              <>
                <p className="text-xs">Samples {pcm.length} · RMS {rms(pcm).toFixed(3)} · ZCR {zeroCrossingRate(pcm).toFixed(3)} · class {pcmExample?.classId}{isSilent(pcm) ? " · Low-information input (near-silent)." : ""}</p>
                <svg viewBox="0 0 300 60" className="h-16 w-full">
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="1"
                    points={pcm.filter((_, i) => i % 8 === 0).map((v, i, arr) => `${(i / (arr.length - 1)) * 300},${30 - v * 24}`).join(" ")}
                  />
                </svg>
                <div className="mt-2 grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${Math.min(spectrogram.length, 40)}, minmax(0, 1fr))` }}>
                  {spectrogram.slice(0, 40).map((frame, i) => (
                    <div key={i} className="flex h-16 flex-col-reverse">
                      {frame.slice(0, 16).map((bin, j) => (
                        <span key={j} className="flex-1" style={{ backgroundColor: `rgba(37,99,235,${Math.min(1, bin * 8)})` }} />
                      ))}
                    </div>
                  ))}
                </div>
                <p className="text-xs">STFT magnitude: X = time (frames, hop 32), Y = frequency bins (FFT 64, Hann window). Color = magnitude. Live mic path uses analyser FFT (fftSize 1024) into 40 triangular Mel bands from 80 Hz to min(7600, Nyquist). Stereo uploads average channels then resample to 16 kHz.</p>
              </>
            ) : (
              <p className="text-xs">Load synthetic tones to inspect real PCM. Microphone recording stores Mel frames, not raw samples.</p>
            )}
            {predictions.length > 0 && <p className="text-xs">Softmax mass {probSum.toFixed(3)}. Closed-set softmax must choose among known classes; probability does not guarantee the clip belongs to one of them.</p>}
          </Card>
          <Card title="Training Controls">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                Epochs: <span className="font-mono text-blue-600">{epochs}</span>
                <input type="range" min={20} max={60} step={5} value={epochs} onChange={event => setEpochs(Number(event.target.value))} className="mt-2 w-full accent-blue-600" />
              </label>
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                Batch size: <span className="font-mono text-blue-600">{batchSize}</span>
                <input type="range" min={8} max={32} step={8} value={batchSize} onChange={event => setBatchSize(Number(event.target.value))} className="mt-2 w-full accent-blue-600" />
              </label>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <button onClick={loadSyntheticTones} className="inline-flex items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold dark:border-gray-700">Load synthetic tones</button>
              <button onClick={startMic} disabled={running} className="inline-flex items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Mic size={14} /> Start Mic</button>
              <button onClick={stopMic} disabled={!running} className="inline-flex items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-gray-700"><Square size={14} /> Stop</button>
              <button onClick={train} disabled={!readyToTrain} className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Play size={14} /> {training ? 'Training audio...' : 'Train audio model'}</button>
              <button onClick={reset} className="inline-flex items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold dark:border-gray-700"><RotateCcw size={14} /> Reset</button>
            </div>
          </Card>

          <Card title="Live Mel Bands">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={liveBands.map((value, band) => ({ band: band + 1, value }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="band" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 1]} tickFormatter={value => `${Math.round(Number(value) * 100)}%`} />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Bar dataKey="value" fill="#2563eb" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Training Accuracy / Loss">
            {epochData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={epochData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="accuracy" stroke="#059669" strokeWidth={2.5} dot={false} />
                  <Line dataKey="loss" stroke="#dc2626" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500">Training points appear epoch-by-epoch once you click Train.</p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {holdout && (
            <Card title="Hold-out confusion matrix">
              <table className="text-xs">
                <thead><tr><th /><th className="p-1" colSpan={holdout.labels.length}>predicted</th></tr>
                  <tr><th />{holdout.labels.map((label) => <th key={label} className="p-1">{label}</th>)}</tr>
                </thead>
                <tbody>
                  {holdout.matrix.map((row, i) => (
                    <tr key={holdout.labels[i]}><th className="p-1 text-left">{holdout.labels[i]}</th>{row.map((v, j) => <td key={j} className="border p-1 text-center font-mono">{v}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          <Card title="Live Inference">
            <div className={`rounded-2xl p-5 text-center ${displayLabel === 'Uncertain' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-200'}`}>
              <p className="text-xs font-bold uppercase tracking-wide">Top prediction</p>
              <p className="mt-1 text-3xl font-black">{displayLabel}</p>
              <p className="text-sm">{topPrediction ? `${(topPrediction.probability * 100).toFixed(1)}% softmax among known classes` : 'No model output yet'}</p>
            </div>
            <label className="mt-4 block text-sm font-semibold text-gray-600 dark:text-gray-300">
              Confidence threshold: {(threshold * 100).toFixed(0)}%
              <input type="range" min={0.5} max={0.95} step={0.01} value={threshold} onChange={event => setThreshold(Number(event.target.value))} className="mt-2 w-full accent-purple-600" />
            </label>
            <div className="mt-4 rounded-lg border border-purple-100 bg-purple-50 p-3 text-sm dark:border-purple-900/60 dark:bg-purple-950/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-purple-900 dark:text-purple-100">Tune confidence gate</p>
                  <p className="text-xs text-purple-700 dark:text-purple-200">
                    Current rejection rate: <b>{(rejectionRate * 100).toFixed(0)}%</b> of windows
                  </p>
                </div>
                <button
                  onClick={calibrateThreshold}
                  disabled={!running || !modelReady || calibrating}
                  className="rounded bg-purple-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {calibrating ? 'Calibrating...' : 'Calibrate'}
                </button>
              </div>
              {calibrationSamples.length > 0 && (
                <div className="mt-3 space-y-2">
                  <ResponsiveContainer width="100%" height={110}>
                    <BarChart data={calibrationHistogram}>
                      <XAxis dataKey="bin" hide />
                      <YAxis allowDecimals={false} width={24} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <button
                    onClick={() => setThreshold(Number(suggestedThreshold.toFixed(2)))}
                    className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-purple-700 dark:border-purple-800 dark:bg-gray-950 dark:text-purple-200"
                  >
                    Use suggested {Math.round(suggestedThreshold * 100)}%
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {classes.map(cls => {
                const probability = predictions.find(prediction => prediction.id === cls.id)?.probability ?? 0;
                return (
                  <div key={cls.id}>
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <span>{cls.name}</span>
                      <span>{(probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-3 rounded-full transition-all" style={{ width: `${probability * 100}%`, backgroundColor: cls.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid gap-2">
              <button onClick={exportModel} className="inline-flex items-center justify-center gap-2 rounded bg-gray-900 px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-950"><Download size={14} /> Export TFjs Model</button>
              <button onClick={() => downloadJson('audio-classifier-dataset.json', { classes, examples, melBands: MEL_BANDS, windowSize: WINDOW_MS })} className="inline-flex items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-semibold dark:border-gray-700"><Download size={14} /> Export Dataset JSON</button>
            </div>
          </Card>

          <InfoBox type="info" title="Status">
            {status}
          </InfoBox>
        </div>
      </div>
    </div>
  );
}
