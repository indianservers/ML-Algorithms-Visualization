import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { isTermConceptKind, type TermDemoKind } from '../../data/termsStudio';

const TermConceptDemo = lazy(() =>
  import('./TermConceptDemos').then((mod) => ({ default: mod.TermConceptDemo })),
);

type DemoProps = { kind: TermDemoKind; variant?: string; caption?: string; unitsNote?: string };

const tooltip = {
  contentStyle: {
    fontSize: 12,
    borderRadius: 8,
    background: 'var(--ts-card)',
    border: '1px solid var(--ts-line)',
    color: 'var(--ts-ink)',
  },
};

const gridStroke = 'var(--ts-line)';

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="ts-slider">
      <span>
        {label} <strong>{Number.isInteger(step) ? value : value.toFixed(2)}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function activate(kind: string, x: number): { y: number; d: number } {
  if (kind === 'relu') return { y: Math.max(0, x), d: x > 0 ? 1 : 0 };
  if (kind === 'leaky-relu') return { y: x > 0 ? x : 0.1 * x, d: x > 0 ? 1 : 0.1 };
  if (kind === 'sigmoid') {
    const y = 1 / (1 + Math.exp(-x));
    return { y, d: y * (1 - y) };
  }
  if (kind === 'tanh') {
    const y = Math.tanh(x);
    return { y, d: 1 - y * y };
  }
  if (kind === 'gelu') {
    const y = 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
    const d = x === 0 ? 0.5 : y / x;
    return { y, d };
  }
  const y = Math.log(1 + Math.exp(x));
  return { y, d: 1 / (1 + Math.exp(-x)) };
}

function ActivationDemo({ variant = 'relu' }: { variant?: string }) {
  const [x, setX] = useState(1.2);
  const current = activate(variant, x);
  const data = useMemo(
    () => Array.from({ length: 81 }, (_, i) => {
      const t = -4 + i * 0.1;
      const point = activate(variant, t);
      return { x: t, y: point.y, d: point.d };
    }),
    [variant],
  );
  return (
    <div className="ts-demo">
      <Slider label="Try an input x" value={x} min={-4} max={4} step={0.1} onChange={setX} />
      <p className="ts-demo-readout">
        f({x.toFixed(1)}) = <strong>{current.y.toFixed(2)}</strong>
        {' · '}
        slope ≈ <strong>{current.d.toFixed(2)}</strong>
      </p>
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="x" type="number" domain={[-4, 4]} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            <ReferenceLine x={0} stroke="#94a3b8" />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Line type="monotone" dataKey="y" stroke="#2563eb" dot={false} name="activation" strokeWidth={2} />
            <Line type="monotone" dataKey="d" stroke="#f59e0b" dot={false} name="slope" strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SoftmaxDemo() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(0.2);
  const [temp, setTemp] = useState(1);
  const scores = [a, b, c];
  const labels = ['Cat', 'Dog', 'Bird'];
  const shifted = scores.map((score) => Math.exp(score / temp));
  const total = shifted.reduce((sum, value) => sum + value, 0);
  const probs = shifted.map((value) => value / total);
  return (
    <div className="ts-demo">
      <div className="ts-slider-grid">
        {labels.map((label, i) => (
          <Slider
            key={label}
            label={`${label} score`}
            value={scores[i] ?? 0}
            min={-2}
            max={5}
            step={0.1}
            onChange={[setA, setB, setC][i] ?? setA}
          />
        ))}
        <Slider label="Temperature" value={temp} min={0.3} max={3} step={0.1} onChange={setTemp} />
      </div>
      <div className="ts-bars">
        {labels.map((label, i) => (
          <div key={label} className="ts-bar-row">
            <span>{label}</span>
            <i style={{ width: `${(probs[i] ?? 0) * 100}%` }} />
            <em>{((probs[i] ?? 0) * 100).toFixed(0)}%</em>
          </div>
        ))}
      </div>
      <p className="ts-demo-readout">The three bars always add to 100%.</p>
    </div>
  );
}

function walkHill(start: number, lr: number, steps: number, noisy = false, momentum = 0, clip = 0) {
  const fn = (x: number) => (x - 2) ** 2 + 0.4;
  const grad = (x: number) => 2 * (x - 2);
  const path: Array<{ step: number; x: number; loss: number }> = [];
  let x = start;
  let velocity = 0;
  for (let step = 0; step <= steps; step++) {
    path.push({ step, x, loss: fn(x) });
    let g = grad(x) + (noisy ? Math.sin(step * 1.7) * 1.4 : 0);
    if (clip > 0) {
      const mag = Math.abs(g);
      if (mag > clip) g = (g / mag) * clip;
    }
    velocity = momentum * velocity + lr * g;
    x -= momentum > 0 ? velocity : lr * g;
  }
  return path;
}

function useWalk(total: number, captions: string[]) {
  const [step, setStep] = useState(total);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      setStep((current) => {
        if (current >= total) {
          setPlaying(false);
          return total;
        }
        return current + 1;
      });
    }, 320);
    return () => window.clearInterval(id);
  }, [playing, total]);
  return {
    step,
    playing,
    caption: captions[Math.min(step, captions.length - 1)] ?? captions[captions.length - 1],
    play: () => {
      setStep(0);
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    reset: () => {
      setPlaying(false);
      setStep(total);
    },
  };
}

function WalkToolbar({
  playing,
  caption,
  onPlay,
  onPause,
}: {
  playing: boolean;
  caption?: string;
  onPlay: () => void;
  onPause: () => void;
}) {
  return (
    <div className="ts-walk">
      <button type="button" onClick={playing ? onPause : onPlay}>
        {playing ? 'Pause walk' : 'Play walk'}
      </button>
      {caption && <p>{caption}</p>}
    </div>
  );
}

function LearningRateDemo() {
  const [lr, setLr] = useState(0.15);
  const [start, setStart] = useState(-1.5);
  const path = walkHill(start, lr, 18);
  const walk = useWalk(path.length - 1, [
    'Feel the slope under your feet.',
    'Take a small step downhill.',
    'If the stride is huge you jump over the valley.',
    'The valley lives at x = 2. That is the destination.',
  ]);
  const shown = path.slice(0, walk.step + 1);
  const curve = Array.from({ length: 61 }, (_, i) => {
    const x = -3 + i * 0.15;
    return { x, y: (x - 2) ** 2 + 0.4 };
  });
  return (
    <div className="ts-demo">
      <WalkToolbar playing={walk.playing} caption={walk.caption} onPlay={walk.play} onPause={walk.pause} />
      <div className="ts-demo-tools">
        <button type="button" onClick={() => { setLr(0.04); walk.reset(); }}>Too small</button>
        <button type="button" onClick={() => { setLr(0.15); setStart(-1.5); walk.reset(); }}>Good</button>
        <button type="button" className="ts-break" onClick={() => { setLr(1.05); walk.reset(); }}>
          Too large
        </button>
      </div>
      <div className="ts-slider-grid">
        <Slider label="Learning rate" value={lr} min={0.02} max={1.1} step={0.01} onChange={setLr} />
        <Slider label="Start x" value={start} min={-3} max={5} step={0.1} onChange={setStart} />
      </div>
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={curve}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="x" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            <Line type="monotone" dataKey="y" stroke="#94a3b8" dot={false} name="loss hill" />
            <Line data={shown} type="monotone" dataKey="loss" stroke="#2563eb" name="walk" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="ts-demo-readout">
        Last x = <strong>{(shown[shown.length - 1]?.x ?? 0).toFixed(2)}</strong> (the valley is at 2)
      </p>
    </div>
  );
}

function GradientWalkDemo() {
  return <LearningRateDemo />;
}

function SgdDemo() {
  const [batchNoise, setBatchNoise] = useState(1);
  const clean = walkHill(-1.2, 0.12, 20, false);
  const noisy = walkHill(-1.2, 0.12, 20, batchNoise > 0.5);
  return (
    <div className="ts-demo">
      <Slider label="Use mini-batch noise" value={batchNoise} min={0} max={1} step={1} onChange={setBatchNoise} />
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={clean}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="step" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            <Line type="monotone" dataKey="loss" stroke="#94a3b8" name="full batch" dot={false} />
            <Line data={noisy} type="monotone" dataKey="loss" stroke="#d97706" name="mini-batch" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="ts-demo-readout">Grey is the honest full-data slope. Orange peeks at a noisy sample.</p>
    </div>
  );
}

function MomentumDemo() {
  const [beta, setBeta] = useState(0.8);
  const plain = walkHill(-2, 0.18, 16, false, 0);
  const withMom = walkHill(-2, 0.18, 16, false, beta);
  return (
    <div className="ts-demo">
      <Slider label="Momentum" value={beta} min={0} max={0.95} step={0.05} onChange={setBeta} />
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={plain}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="step" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            <Line type="monotone" dataKey="loss" stroke="#94a3b8" name="plain GD" dot={false} />
            <Line data={withMom} type="monotone" dataKey="loss" stroke="#7c3aed" name="momentum" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AdamDemo() {
  const gd = walkHill(-2.2, 0.35, 18);
  const adamish = walkHill(-2.2, 0.12, 18, false, 0.85);
  return (
    <div className="ts-demo">
      <p className="ts-demo-readout">Purple remembers recent slopes (Adam-like). Grey uses one fixed stride.</p>
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={gd}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="step" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            <Line type="monotone" dataKey="loss" stroke="#94a3b8" name="plain GD" dot={false} />
            <Line data={adamish} type="monotone" dataKey="loss" stroke="#7c3aed" name="adaptive" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ScheduleDemo() {
  const data = Array.from({ length: 30 }, (_, epoch) => ({
    epoch,
    rate: epoch < 4 ? 0.02 + epoch * 0.02 : 0.1 * (0.5 ** Math.floor((epoch - 4) / 8)),
  }));
  return (
    <div className="ts-demo">
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            <Line type="monotone" dataKey="rate" stroke="#0f766e" name="learning rate" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="ts-demo-readout">Warmup, then stair-step decay. Brave first, polite later.</p>
    </div>
  );
}

function ClippingDemo({ variant }: { variant?: string }) {
  const [clip, setClip] = useState(variant === 'vanish' ? 0 : 1.2);
  const [layers, setLayers] = useState(6);
  const raw = 2.8;
  const clipped = clip > 0 ? Math.min(raw, clip) : raw;
  const vanish = 0.35 ** layers;
  const explode = 1.7 ** layers;
  return (
    <div className="ts-demo">
      {variant === 'vanish' ? (
        <>
          <Slider label="How many layers" value={layers} min={1} max={12} step={1} onChange={setLayers} />
          <p className="ts-demo-readout">
            Vanishing product (0.35^{layers}) = <strong>{vanish.toExponential(2)}</strong>
            {' · '}
            Exploding product (1.7^{layers}) = <strong>{explode.toFixed(1)}</strong>
          </p>
        </>
      ) : (
        <>
          <Slider label="Clip cap" value={clip} min={0} max={3} step={0.1} onChange={setClip} />
          <p className="ts-demo-readout">
            Raw slope {raw.toFixed(1)} becomes <strong>{clipped.toFixed(2)}</strong> after the cap.
          </p>
        </>
      )}
      <div className="ts-bars">
        <div className="ts-bar-row">
          <span>Raw</span>
          <i style={{ width: `${Math.min(100, raw * 28)}%`, background: '#f43f5e' }} />
          <em>{raw.toFixed(1)}</em>
        </div>
        <div className="ts-bar-row">
          <span>Safe</span>
          <i style={{ width: `${Math.min(100, clipped * 28)}%` }} />
          <em>{clipped.toFixed(1)}</em>
        </div>
      </div>
    </div>
  );
}

function SaddleDemo() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const z = x ** 2 - y ** 2;
  return (
    <div className="ts-demo">
      <div className="ts-slider-grid">
        <Slider label="x (bowl)" value={x} min={-2} max={2} step={0.1} onChange={setX} />
        <Slider label="y (escape)" value={y} min={-2} max={2} step={0.1} onChange={setY} />
      </div>
      <p className="ts-demo-readout">
        Height z = x² − y² = <strong>{z.toFixed(2)}</strong>. At (0, 0) the slope is 0 — a saddle, not the ocean.
      </p>
    </div>
  );
}

function LossCompareDemo() {
  const [miss, setMiss] = useState(4);
  const residuals = [-1, 0.5, miss];
  const mae = residuals.reduce((sum, value) => sum + Math.abs(value), 0) / 3;
  const mse = residuals.reduce((sum, value) => sum + value * value, 0) / 3;
  return (
    <div className="ts-demo">
      <Slider label="Make the third miss huge" value={miss} min={-8} max={8} step={0.5} onChange={setMiss} />
      <p className="ts-demo-readout">
        Residuals: {residuals.map((value) => value.toFixed(1)).join(', ')}
      </p>
      <div className="ts-metric-pair">
        <div>
          <em>MAE</em>
          <strong>{mae.toFixed(2)}</strong>
        </div>
        <div>
          <em>MSE</em>
          <strong>{mse.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}

function CrossEntropyDemo({ variant }: { variant?: string }) {
  const [p, setP] = useState(0.2);
  const truth = variant === 'categorical' ? 0.25 : 1;
  const loss = variant === 'categorical' ? -Math.log(Math.max(p, 1e-6)) : -(truth * Math.log(Math.max(p, 1e-6)) + (1 - truth) * Math.log(Math.max(1 - p, 1e-6)));
  return (
    <div className="ts-demo">
      <Slider
        label={variant === 'categorical' ? 'Probability on the true class' : 'Predicted P(yes)'}
        value={p}
        min={0.01}
        max={0.99}
        step={0.01}
        onChange={setP}
      />
      <p className="ts-demo-readout">
        Cross-entropy = <strong>{loss.toFixed(2)}</strong>
        {p < 0.15 ? ' — loudly wrong is expensive.' : p > 0.8 ? ' — honest and close.' : ' — still unsure.'}
      </p>
    </div>
  );
}

function HingeDemo() {
  const [score, setScore] = useState(0.2);
  const y = 1;
  const loss = Math.max(0, 1 - y * score);
  return (
    <div className="ts-demo">
      <Slider label="Model score for a +1 label" value={score} min={-2} max={3} step={0.1} onChange={setScore} />
      <p className="ts-demo-readout">
        Hinge = max(0, 1 − score) = <strong>{loss.toFixed(2)}</strong>
        {score >= 1 ? ' — past the safety margin, free.' : score > 0 ? ' — correct but hugging the fence.' : ' — wrong side.'}
      </p>
    </div>
  );
}

function KlDemo() {
  const [qHeads, setQHeads] = useState(0.5);
  const pHeads = 0.7;
  const kl = pHeads * Math.log(pHeads / qHeads) + (1 - pHeads) * Math.log((1 - pHeads) / (1 - qHeads));
  return (
    <div className="ts-demo">
      <p className="ts-demo-readout">True coin P is 70% heads. Your story Q is adjustable.</p>
      <Slider label="Your P(heads)" value={qHeads} min={0.05} max={0.95} step={0.01} onChange={setQHeads} />
      <p className="ts-demo-readout">
        KL(P ‖ Q) = <strong>{kl.toFixed(3)}</strong>
        {Math.abs(qHeads - pHeads) < 0.02 ? ' — stories match.' : ''}
      </p>
    </div>
  );
}

function ContrastiveDemo() {
  const [neg, setNeg] = useState(0.9);
  const pos = 0.4;
  const margin = 1;
  const loss = Math.max(0, pos - neg + margin);
  return (
    <div className="ts-demo">
      <Slider label="Distance to stranger" value={neg} min={0.1} max={2.5} step={0.1} onChange={setNeg} />
      <p className="ts-demo-readout">
        Friend sits at {pos}. Margin is 1. Loss = <strong>{loss.toFixed(2)}</strong>
        {loss === 0 ? ' — stranger is far enough.' : ' — push the stranger away.'}
      </p>
    </div>
  );
}

function DropoutDemo() {
  const units = [1, 2, 3, 4];
  const [mask, setMask] = useState([true, false, true, false]);
  const toggle = (index: number) => {
    setMask((current) => current.map((on, i) => (i === index ? !on : on)));
  };
  return (
    <div className="ts-demo">
      <div className="ts-neurons">
        {units.map((unit, i) => (
          <button
            key={unit}
            type="button"
            className={mask[i] ? 'is-on' : 'is-off'}
            onClick={() => toggle(i)}
          >
            n{unit}
            <small>{mask[i] ? 'awake' : 'dropped'}</small>
          </button>
        ))}
      </div>
      <p className="ts-demo-readout">Click a neuron. Training randomly mutes teammates so no one becomes the only genius.</p>
    </div>
  );
}

function WeightDecayDemo() {
  const [decay, setDecay] = useState(0.08);
  const useful = 4 * (1 - decay) + 0.9;
  const unused = 4 * (1 - decay);
  return (
    <div className="ts-demo">
      <Slider label="Decay per step" value={decay} min={0} max={0.3} step={0.01} onChange={setDecay} />
      <div className="ts-bars">
        <div className="ts-bar-row">
          <span>Useful weight</span>
          <i style={{ width: `${Math.min(100, useful * 16)}%` }} />
          <em>{useful.toFixed(2)}</em>
        </div>
        <div className="ts-bar-row">
          <span>Unused weight</span>
          <i style={{ width: `${Math.min(100, unused * 16)}%`, background: '#fb7185' }} />
          <em>{unused.toFixed(2)}</em>
        </div>
      </div>
      <p className="ts-demo-readout">The unused weight only shrinks. The useful one gets a refill from the gradient.</p>
    </div>
  );
}

function BatchNormDemo() {
  const [outlier, setOutlier] = useState(12);
  const values = [2, 4, outlier];
  const mean = values.reduce((sum, value) => sum + value, 0) / 3;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / 3;
  const std = Math.sqrt(variance) || 1;
  const normed = values.map((value) => (value - mean) / std);
  return (
    <div className="ts-demo">
      <Slider label="Third value (outlier)" value={outlier} min={4} max={20} step={1} onChange={setOutlier} />
      <p className="ts-demo-readout">
        Mean {mean.toFixed(1)} · after norm: {normed.map((value) => value.toFixed(2)).join(', ')}
      </p>
    </div>
  );
}

function EarlyStopDemo() {
  const data = [
    { epoch: 1, train: 1.2, val: 1.15 },
    { epoch: 2, train: 0.9, val: 0.88 },
    { epoch: 3, train: 0.7, val: 0.7 },
    { epoch: 4, train: 0.5, val: 0.72 },
    { epoch: 5, train: 0.35, val: 0.84 },
    { epoch: 6, train: 0.22, val: 0.96 },
  ];
  return (
    <div className="ts-demo">
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            <ReferenceLine x={3} stroke="#059669" label="best val" />
            <Line type="monotone" dataKey="train" stroke="#2563eb" name="train" />
            <Line type="monotone" dataKey="val" stroke="#e11d48" name="validation" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="ts-demo-readout">Train keeps falling. Validation bottoms at epoch 3 — that is the take we keep.</p>
    </div>
  );
}

function AugmentationDemo() {
  const [flip, setFlip] = useState(true);
  const [noise, setNoise] = useState(0.2);
  return (
    <div className="ts-demo">
      <div className="ts-aug">
        <div className={flip ? 'is-flip' : ''}>
          <span>CAT</span>
          <i style={{ opacity: noise }} />
        </div>
        <p>Label stays <strong>cat</strong></p>
      </div>
      <div className="ts-slider-grid">
        <Slider label="Flip" value={flip ? 1 : 0} min={0} max={1} step={1} onChange={(value) => setFlip(value > 0.5)} />
        <Slider label="Noise" value={noise} min={0} max={0.7} step={0.05} onChange={setNoise} />
      </div>
    </div>
  );
}

function NeuronDemo() {
  const [w1, setW1] = useState(2);
  const [w2, setW2] = useState(0.5);
  const [bias, setBias] = useState(-1);
  const [x1, setX1] = useState(1);
  const [x2, setX2] = useState(0);
  const z = w1 * x1 + w2 * x2 + bias;
  const h = Math.max(0, z);
  return (
    <div className="ts-demo">
      <div className="ts-slider-grid">
        <Slider label="Rain forecast x1" value={x1} min={0} max={1} step={1} onChange={setX1} />
        <Slider label="Wind x2" value={x2} min={0} max={1} step={1} onChange={setX2} />
        <Slider label="Weight w1" value={w1} min={-2} max={3} step={0.1} onChange={setW1} />
        <Slider label="Weight w2" value={w2} min={-2} max={3} step={0.1} onChange={setW2} />
        <Slider label="Bias" value={bias} min={-2} max={2} step={0.1} onChange={setBias} />
      </div>
      <p className="ts-demo-readout">
        z = {w1.toFixed(1)}·{x1} + {w2.toFixed(1)}·{x2} + ({bias.toFixed(1)}) = <strong>{z.toFixed(2)}</strong>
        {' → '}
        ReLU = <strong>{h.toFixed(2)}</strong> {h > 0 ? '(take the umbrella)' : '(leave it)'}
      </p>
    </div>
  );
}

function ForwardDemo() {
  const [w, setW] = useState(3);
  const x = 2;
  const hidden = Math.max(0, w * x + 1);
  const out = 4 * hidden;
  return (
    <div className="ts-demo">
      <Slider label="Hidden weight" value={w} min={-1} max={5} step={0.1} onChange={setW} />
      <ol className="ts-flow">
        <li>Input x = {x}</li>
        <li>Hidden = ReLU({w.toFixed(1)}·2 + 1) = {hidden.toFixed(2)}</li>
        <li>Output = 4 × hidden = <strong>{out.toFixed(2)}</strong></li>
      </ol>
    </div>
  );
}

function BackpropDemo() {
  const [w, setW] = useState(3);
  const x = 2;
  const yHat = w * x;
  const target = 4;
  const loss = (yHat - target) ** 2;
  const grad = 2 * (yHat - target) * x;
  return (
    <div className="ts-demo">
      <Slider label="Weight w" value={w} min={0} max={5} step={0.1} onChange={setW} />
      <p className="ts-demo-readout">
        Guess {yHat.toFixed(1)} vs target 4. Loss {loss.toFixed(2)}. Blame on w = <strong>{grad.toFixed(2)}</strong>
        {grad > 0 ? ' → decrease w' : ' → increase w'}
      </p>
    </div>
  );
}

function ChainRuleDemo() {
  const [inner, setInner] = useState(3);
  const [outer, setOuter] = useState(8);
  return (
    <div className="ts-demo">
      <div className="ts-slider-grid">
        <Slider label="Inner slope du/dx" value={inner} min={0} max={6} step={0.1} onChange={setInner} />
        <Slider label="Outer slope dy/du" value={outer} min={0} max={12} step={0.1} onChange={setOuter} />
      </div>
      <p className="ts-demo-readout">
        Total slope dy/dx = {outer.toFixed(1)} × {inner.toFixed(1)} = <strong>{(outer * inner).toFixed(1)}</strong>
      </p>
    </div>
  );
}

function InitDemo() {
  const [mode, setMode] = useState(1);
  const values = mode < 0.5
    ? [0, 0, 0, 0, 0]
    : [0.12, -0.2, 0.08, -0.15, 0.18];
  return (
    <div className="ts-demo">
      <Slider label="0 = all zeros, 1 = He-style random" value={mode} min={0} max={1} step={1} onChange={setMode} />
      <div className="ts-bars">
        {values.map((value, i) => (
          <div key={i} className="ts-bar-row">
            <span>w{i + 1}</span>
            <i style={{ width: `${30 + Math.abs(value) * 180}%`, background: value === 0 ? '#cbd5e1' : '#2563eb' }} />
            <em>{value.toFixed(2)}</em>
          </div>
        ))}
      </div>
      <p className="ts-demo-readout">{mode < 0.5 ? 'Clones. Every neuron will stay identical.' : 'Small different numbers. Each neuron can specialize.'}</p>
    </div>
  );
}

function EpochsDemo() {
  const [n, setN] = useState(800);
  const [b, setB] = useState(32);
  const [epochs, setEpochs] = useState(5);
  const steps = Math.ceil(n / b);
  return (
    <div className="ts-demo">
      <div className="ts-slider-grid">
        <Slider label="Dataset size N" value={n} min={64} max={2000} step={16} onChange={setN} />
        <Slider label="Batch size B" value={b} min={8} max={128} step={8} onChange={setB} />
        <Slider label="Epochs" value={epochs} min={1} max={20} step={1} onChange={setEpochs} />
      </div>
      <div className="ts-metric-pair">
        <div>
          <em>Steps / epoch</em>
          <strong>{steps}</strong>
        </div>
        <div>
          <em>Total updates</em>
          <strong>{steps * epochs}</strong>
        </div>
      </div>
    </div>
  );
}

function OverfitDemo() {
  const [degree, setDegree] = useState(1);
  const points = [
    { x: 0, y: 1.1 },
    { x: 1, y: 1.8 },
    { x: 2, y: 3.2 },
    { x: 3, y: 3.0 },
    { x: 4, y: 5.1 },
  ];
  const curve = Array.from({ length: 21 }, (_, i) => {
    const x = i * 0.2;
    const y = degree < 2 ? 1 + 0.9 * x : 1 + 0.4 * x + 0.18 * x * x + (degree > 3 ? 0.35 * Math.sin(3 * x) : 0);
    return { x, y };
  });
  return (
    <div className="ts-demo">
      <Slider label="Wiggle / degree" value={degree} min={1} max={5} step={1} onChange={setDegree} />
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={curve}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="x" type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="y" type="number" tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            <Line data={curve} type="monotone" dataKey="y" stroke="#2563eb" dot={false} />
            <Scatter data={points} fill="#e11d48" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="ts-demo-readout">{degree < 2 ? 'A simple line — maybe underfit.' : degree > 3 ? 'Chasing every dot — overfit.' : 'Following the trend, ignoring jitter.'}</p>
    </div>
  );
}

function BiasVarianceDemo() {
  return <OverfitDemo />;
}

function DotProductDemo() {
  const [a, setA] = useState(4);
  const [b, setB] = useState(2);
  const w1 = 3;
  const w2 = 5;
  const dot = w1 * a + w2 * b;
  return (
    <div className="ts-demo">
      <div className="ts-slider-grid">
        <Slider label="Hours studied" value={a} min={0} max={8} step={0.5} onChange={setA} />
        <Slider label="Practice tests" value={b} min={0} max={6} step={0.5} onChange={setB} />
      </div>
      <p className="ts-demo-readout">
        3×{a} + 5×{b} = <strong>{dot.toFixed(1)}</strong> — a grocery-receipt total.
      </p>
    </div>
  );
}

function NormDemo() {
  const [x, setX] = useState(3);
  const [y, setY] = useState(4);
  const l1 = Math.abs(x) + Math.abs(y);
  const l2 = Math.hypot(x, y);
  return (
    <div className="ts-demo">
      <div className="ts-slider-grid">
        <Slider label="x" value={x} min={-5} max={5} step={0.5} onChange={setX} />
        <Slider label="y" value={y} min={-5} max={5} step={0.5} onChange={setY} />
      </div>
      <div className="ts-metric-pair">
        <div>
          <em>L1 city blocks</em>
          <strong>{l1.toFixed(1)}</strong>
        </div>
        <div>
          <em>L2 crow-fly</em>
          <strong>{l2.toFixed(1)}</strong>
        </div>
      </div>
    </div>
  );
}

function OneHotDemo() {
  const fruits = ['apple', 'banana', 'cherry'] as const;
  const [pick, setPick] = useState<(typeof fruits)[number]>('banana');
  return (
    <div className="ts-demo">
      <div className="ts-choice">
        {fruits.map((fruit) => (
          <button key={fruit} type="button" className={pick === fruit ? 'is-on' : ''} onClick={() => setPick(fruit)}>
            {fruit}
          </button>
        ))}
      </div>
      <div className="ts-onehot">
        {fruits.map((fruit) => (
          <span key={fruit} className={pick === fruit ? 'is-on' : ''}>
            {pick === fruit ? '1' : '0'}
            <small>{fruit}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

function ScalingDemo() {
  const [income, setIncome] = useState(90);
  const ageZ = 0;
  const incomeZ = (income - 50) / 20;
  return (
    <div className="ts-demo">
      <Slider label="Income (thousands)" value={income} min={10} max={130} step={5} onChange={setIncome} />
      <div className="ts-metric-pair">
        <div>
          <em>Age z-score</em>
          <strong>{ageZ.toFixed(2)}</strong>
        </div>
        <div>
          <em>Income z-score</em>
          <strong>{incomeZ.toFixed(2)}</strong>
        </div>
      </div>
      <p className="ts-demo-readout">Age was typical (z = 0). Income is now on the same kind of ruler.</p>
    </div>
  );
}

function SplitDemo({ variant }: { variant?: string }) {
  const cells = Array.from({ length: 15 }, (_, i) => i);
  const [fold, setFold] = useState(0);
  if (variant === 'kfold') {
    return (
      <div className="ts-demo">
        <Slider label="Which fold sits out" value={fold} min={0} max={4} step={1} onChange={setFold} />
        <div className="ts-split-grid">
          {cells.map((cell) => {
            const bucket = cell % 5;
            return (
              <span key={cell} className={bucket === fold ? 'is-val' : 'is-train'}>
                {bucket === fold ? 'val' : 'train'}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="ts-demo">
      <div className="ts-split-grid">
        {cells.map((cell) => (
          <span key={cell} className={cell < 9 ? 'is-train' : cell < 12 ? 'is-val' : 'is-test'}>
            {cell < 9 ? 'train' : cell < 12 ? 'val' : 'test'}
          </span>
        ))}
      </div>
      <p className="ts-demo-readout">Homework, practice exam, sealed final. The red tiles never tilt the line.</p>
    </div>
  );
}

function OverlayActivationDemo() {
  const [show, setShow] = useState({ relu: true, leaky: true, sigmoid: false });
  const data = useMemo(
    () => Array.from({ length: 81 }, (_, i) => {
      const x = -4 + i * 0.1;
      return {
        x,
        relu: Math.max(0, x),
        leaky: x > 0 ? x : 0.1 * x,
        sigmoid: 1 / (1 + Math.exp(-x)),
      };
    }),
    [],
  );
  return (
    <div className="ts-demo">
      <div className="ts-choice">
        {(['relu', 'leaky', 'sigmoid'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={show[key] ? 'is-on' : ''}
            onClick={() => setShow((current) => ({ ...current, [key]: !current[key] }))}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="x" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            {show.relu && <Line type="monotone" dataKey="relu" stroke="#2563eb" dot={false} />}
            {show.leaky && <Line type="monotone" dataKey="leaky" stroke="#d97706" dot={false} />}
            {show.sigmoid && <Line type="monotone" dataKey="sigmoid" stroke="#7c3aed" dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function OverlayLossDemo() {
  const [residual, setResidual] = useState(2);
  const mse = residual ** 2;
  const mae = Math.abs(residual);
  const huber = Math.abs(residual) <= 1 ? 0.5 * residual ** 2 : Math.abs(residual) - 0.5;
  const data = Array.from({ length: 41 }, (_, i) => {
    const r = -4 + i * 0.2;
    return {
      r,
      mse: r * r,
      mae: Math.abs(r),
      huber: Math.abs(r) <= 1 ? 0.5 * r * r : Math.abs(r) - 0.5,
    };
  });
  return (
    <div className="ts-demo">
      <Slider label="Residual (truth − guess)" value={residual} min={-4} max={4} step={0.1} onChange={setResidual} />
      <div className="ts-metric-pair">
        <div><em>MSE</em><strong>{mse.toFixed(2)}</strong></div>
        <div><em>MAE</em><strong>{mae.toFixed(2)}</strong></div>
        <div><em>Huber</em><strong>{huber.toFixed(2)}</strong></div>
      </div>
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="r" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            <Line type="monotone" dataKey="mse" stroke="#2563eb" dot={false} />
            <Line type="monotone" dataKey="mae" stroke="#d97706" dot={false} />
            <Line type="monotone" dataKey="huber" stroke="#059669" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ResidualDemo() {
  const [skip, setSkip] = useState(1);
  const [edit, setEdit] = useState(0.4);
  const [layers, setLayers] = useState(4);
  let signal = 1;
  const bars = Array.from({ length: layers }, (_, i) => {
    signal = skip ? signal + edit * 0.3 : signal * 0.55;
    return { i: i + 1, v: signal };
  });
  return (
    <div className="ts-demo">
      <div className="ts-demo-tools">
        <button type="button" className="ts-break" onClick={() => { setSkip(0); setLayers(8); }}>Break it</button>
        <button type="button" onClick={() => { setSkip(1); setEdit(0.4); setLayers(4); }}>Reset</button>
      </div>
      <Slider label="Skip connection" value={skip} min={0} max={1} step={1} onChange={setSkip} />
      <Slider label="Block edit F(x)" value={edit} min={-1} max={1} step={0.1} onChange={setEdit} />
      <Slider label="Depth" value={layers} min={2} max={8} step={1} onChange={setLayers} />
      <div className="ts-bars">
        {bars.map((bar) => (
          <div key={bar.i} className="ts-bar-row">
            <span>L{bar.i}</span>
            <i style={{ width: `${Math.min(100, Math.abs(bar.v) * 50)}%` }} />
            <em>{bar.v.toFixed(2)}</em>
          </div>
        ))}
      </div>
      <p className="ts-demo-readout">{skip ? 'y = x + F(x). The original signal can survive.' : 'No skip: each layer multiplies. The start fades.'}</p>
    </div>
  );
}

const ATTENTION_WORDS = ['not', 'very', 'good'] as const;

function attentionScores(queryIndex: number, matchGood: number): number[] {
  const base = [
    [0.8, 0.2, matchGood],
    [0.15, 0.9, matchGood * 0.55],
    [matchGood * 0.35, 0.35, 1.1],
  ];
  return base[queryIndex] ?? base[0];
}

function AttentionDemo() {
  const [queryIndex, setQueryIndex] = useState(0);
  const [match, setMatch] = useState(2);
  const [temp, setTemp] = useState(1);
  const query = ATTENTION_WORDS[queryIndex] ?? 'not';
  const scores = attentionScores(queryIndex, match);
  const shifted = scores.map((score) => Math.exp(score / temp));
  const total = shifted.reduce((sum, value) => sum + value, 0);
  const shares = shifted.map((value) => value / total);
  const topIndex = shares.reduce((best, share, i) => ((shares[best] ?? 0) >= share ? best : i), 0);
  const topWord = ATTENTION_WORDS[topIndex] ?? 'good';
  const topShare = shares[topIndex] ?? 0;
  const meaning =
    topShare < 0.4
      ? `Shares are flattening. Raise the “good” match or lower temperature so one word wins.`
      : query === 'not' && topWord === 'good'
        ? `“not” can now represent not-good. Most of the mix is the “good” value, so the query carries that flip.`
        : query === 'very' && topWord === 'good'
          ? `“very” is listening to “good” — the mix is mostly intensity plus a positive value.`
          : `“${query}” now carries mostly “${topWord}”.`;

  return (
    <div className="ts-demo ts-attn">
      <p className="ts-attn-kicker">How attention works</p>
      <Slider label={'How much the query matches “good”'} value={match} min={-1} max={4} step={0.1} onChange={setMatch} />
      <Slider label="Temperature" value={temp} min={0.3} max={3} step={0.1} onChange={setTemp} />

      <article className="ts-attn-step">
        <header>
          <span>①</span>
          <div>
            <strong>Query</strong>
            <p>What am I looking for?</p>
          </div>
        </header>
        <div className="ts-choice" role="group" aria-label="Query word">
          {ATTENTION_WORDS.map((word, i) => (
            <button key={word} type="button" className={queryIndex === i ? 'is-on' : ''} onClick={() => setQueryIndex(i)}>
              {word}
            </button>
          ))}
        </div>
        <p className="ts-demo-readout">“{query}” asks the sentence who it should listen to.</p>
      </article>

      <div className="ts-attn-arrow" aria-hidden="true">↓</div>

      <article className="ts-attn-step">
        <header>
          <span>②</span>
          <div>
            <strong>Key matching</strong>
            <p>Which words match?</p>
          </div>
        </header>
        <div className="ts-attn-keys">
          {ATTENTION_WORDS.map((word, i) => (
            <div key={word} className={i === topIndex ? 'is-hot' : ''}>
              <em>{word}</em>
              <strong>{(scores[i] ?? 0).toFixed(1)}</strong>
              <small>Q · K</small>
            </div>
          ))}
        </div>
      </article>

      <div className="ts-attn-arrow" aria-hidden="true">↓</div>

      <article className="ts-attn-step">
        <header>
          <span>③</span>
          <div>
            <strong>Softmax</strong>
            <p>Convert scores → attention %</p>
          </div>
        </header>
        <div className="ts-bars">
          {ATTENTION_WORDS.map((word, i) => (
            <div key={word} className="ts-bar-row">
              <span>{word}</span>
              <i style={{ width: `${(shares[i] ?? 0) * 100}%` }} />
              <em>{((shares[i] ?? 0) * 100).toFixed(0)}%</em>
            </div>
          ))}
        </div>
      </article>

      <div className="ts-attn-arrow" aria-hidden="true">↓</div>

      <article className="ts-attn-step">
        <header>
          <span>④</span>
          <div>
            <strong>Value mixing</strong>
            <p>Combine useful information</p>
          </div>
        </header>
        <div className="ts-attn-mix" aria-label="Weighted value mix">
          {ATTENTION_WORDS.map((word, i) => (
            <i
              key={word}
              style={{ width: `${(shares[i] ?? 0) * 100}%` }}
              className={`ts-attn-slice ts-attn-slice-${word}`}
              title={`${word} ${(shares[i] ?? 0) * 100}%`}
            />
          ))}
        </div>
        <ul className="ts-attn-legend">
          {ATTENTION_WORDS.map((word, i) => (
            <li key={word}>
              <i className={`ts-attn-slice-${word}`} />
              {word} · {((shares[i] ?? 0) * 100).toFixed(0)}% of the mix
            </li>
          ))}
        </ul>
      </article>

      <div className="ts-attn-arrow" aria-hidden="true">↓</div>

      <article className="ts-attn-step is-result">
        <header>
          <span>✓</span>
          <div>
            <strong>Contextualized word</strong>
            <p>“{query}” after listening · {((topShare) * 100).toFixed(0)}% on “{topWord}”</p>
          </div>
        </header>
        <p className="ts-demo-readout">{meaning} Shares always add to 100%.</p>
      </article>
    </div>
  );
}

function EmbeddingDemo() {
  const [catX, setCatX] = useState(0.9);
  const [dogX, setDogX] = useState(0.75);
  const cat = { x: catX, y: 0.25 };
  const dog = { x: dogX, y: 0.32 };
  const car = { x: -0.7, y: 0.1 };
  const cosine = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dot = a.x * b.x + a.y * b.y;
    const na = Math.hypot(a.x, a.y);
    const nb = Math.hypot(b.x, b.y);
    return na * nb === 0 ? 0 : dot / (na * nb);
  };
  return (
    <div className="ts-demo">
      <Slider label="Move “cat” on the map" value={catX} min={-1} max={1} step={0.05} onChange={setCatX} />
      <Slider label="Move “dog”" value={dogX} min={-1} max={1} step={0.05} onChange={setDogX} />
      <div className="ts-metric-pair">
        <div><em>cos(cat, dog)</em><strong>{cosine(cat, dog).toFixed(2)}</strong></div>
        <div><em>cos(cat, car)</em><strong>{cosine(cat, car).toFixed(2)}</strong></div>
      </div>
      <p className="ts-demo-readout">Nearby seats mean similar use. Car should stay in another room.</p>
    </div>
  );
}

function LearningCurveDemo() {
  const [story, setStory] = useState(0);
  const stories = [
    Array.from({ length: 8 }, (_, n) => ({ n, train: 1.1 - n * 0.02, val: 1.12 - n * 0.015 })),
    Array.from({ length: 8 }, (_, n) => ({ n, train: 0.9 - n * 0.1, val: 0.85 - n * 0.02 })),
    Array.from({ length: 8 }, (_, n) => ({ n, train: 1.0 - n * 0.1, val: 1.05 - n * 0.095 })),
  ];
  const labels = ['Underfit (both high)', 'Overfit (gap grows)', 'Healthy (together)'];
  return (
    <div className="ts-demo">
      <div className="ts-choice">
        {labels.map((label, i) => (
          <button key={label} type="button" className={story === i ? 'is-on' : ''} onClick={() => setStory(i)}>
            {label}
          </button>
        ))}
      </div>
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={stories[story]}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="n" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            <Line type="monotone" dataKey="train" stroke="#2563eb" name="train" />
            <Line type="monotone" dataKey="val" stroke="#e11d48" name="validation" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BaselineDemo() {
  const [ham, setHam] = useState(95);
  const majority = ham;
  const fancy = Math.min(99, ham + 1.2);
  return (
    <div className="ts-demo">
      <Slider label="% ham in the mailbox" value={ham} min={50} max={99} step={1} onChange={setHam} />
      <div className="ts-bars">
        <div className="ts-bar-row">
          <span>Majority</span>
          <i style={{ width: `${majority}%`, background: '#94a3b8' }} />
          <em>{majority}%</em>
        </div>
        <div className="ts-bar-row">
          <span>Fancy net</span>
          <i style={{ width: `${fancy}%` }} />
          <em>{fancy.toFixed(1)}%</em>
        </div>
      </div>
      <p className="ts-demo-readout">Beat the grey bar. A 1-point win on a 95% mailbox is a shrug unless spam recall moved.</p>
    </div>
  );
}

function LeakageDemo() {
  const [leak, setLeak] = useState(0);
  const honest = 0.72;
  const magic = leak ? 0.99 : honest;
  return (
    <div className="ts-demo">
      <Slider label="Leak the label into a feature" value={leak} min={0} max={1} step={1} onChange={setLeak} />
      <div className="ts-metric-pair">
        <div><em>Validation score</em><strong>{(magic * 100).toFixed(0)}%</strong></div>
        <div><em>Monday-morning score</em><strong>{leak ? '61%' : '71%'}</strong></div>
      </div>
      <p className="ts-demo-readout">{leak ? 'The backpack had the exam. Production does not.' : 'No leak. The two scores stay honest neighbors.'}</p>
    </div>
  );
}

function CosineDemo() {
  const [angle, setAngle] = useState(45);
  const [scale, setScale] = useState(1);
  const rad = (angle * Math.PI) / 180;
  const a = { x: 1, y: 0 };
  const b = { x: Math.cos(rad) * scale, y: Math.sin(rad) * scale };
  const dot = a.x * b.x + a.y * b.y;
  const cosine = dot / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
  return (
    <div className="ts-demo">
      <Slider label="Angle (degrees)" value={angle} min={0} max={180} step={5} onChange={setAngle} />
      <Slider label="Stretch the second arrow" value={scale} min={0.3} max={4} step={0.1} onChange={setScale} />
      <div className="ts-metric-pair">
        <div><em>Dot product</em><strong>{dot.toFixed(2)}</strong></div>
        <div><em>Cosine</em><strong>{cosine.toFixed(2)}</strong></div>
      </div>
      <p className="ts-demo-readout">Stretch changes the dot. Cosine stays with the angle.</p>
    </div>
  );
}

function PaddingDemo() {
  const [len, setLen] = useState(2);
  const [mask, setMask] = useState(1);
  const words = ['see', 'you', 'later'].slice(0, len);
  const pads = Array.from({ length: 3 - len }, () => 'PAD');
  const tokens = [...words, ...pads];
  const raw = tokens.map((token) => (token === 'PAD' ? (mask ? 0 : 0.25) : 0.9 / len));
  const total = raw.reduce((sum, value) => sum + value, 0) || 1;
  const shares = raw.map((value) => value / total);
  return (
    <div className="ts-demo">
      <Slider label="Real words" value={len} min={1} max={3} step={1} onChange={setLen} />
      <Slider label="Mask PAD" value={mask} min={0} max={1} step={1} onChange={setMask} />
      <div className="ts-split-grid">
        {tokens.map((token, i) => (
          <span key={`${token}-${i}`} className={token === 'PAD' ? 'is-val' : 'is-train'}>{token}</span>
        ))}
      </div>
      <div className="ts-bars">
        {tokens.map((token, i) => (
          <div key={`${token}-bar-${i}`} className="ts-bar-row">
            <span>{token}</span>
            <i style={{ width: `${(shares[i] ?? 0) * 100}%` }} />
            <em>{((shares[i] ?? 0) * 100).toFixed(0)}%</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenDemo() {
  const [text, setText] = useState('unbelievable');
  const pieces = text.trim()
    ? text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .match(/.{1,4}/g) ?? []
    : [];
  return (
    <div className="ts-demo">
      <label className="ts-slider">
        <span>Type a word</span>
        <input value={text} onChange={(event) => setText(event.target.value.slice(0, 24))} />
      </label>
      <div className="ts-split-grid">
        {pieces.map((piece, i) => (
          <span key={`${piece}-${i}`} className="is-train">{piece}<small> #{i + 10}</small></span>
        ))}
      </div>
      <p className="ts-demo-readout">{pieces.length} token{pieces.length === 1 ? '' : 's'} — that is the bill, not the word count.</p>
    </div>
  );
}

function DemoChrome({
  caption,
  unitsNote,
  children,
}: {
  caption?: string;
  unitsNote?: string;
  children: ReactNode;
}) {
  return (
    <div className="ts-demo-chrome">
      {children}
      {caption && <p className="ts-caption">{caption}</p>}
      {unitsNote && <p className="ts-units">{unitsNote}</p>}
    </div>
  );
}

export function TermDemo({ kind, variant, caption, unitsNote }: DemoProps) {
  if (isTermConceptKind(kind)) {
    return (
      <DemoChrome caption={caption} unitsNote={unitsNote}>
        <Suspense fallback={<p className="ts-demo-readout">Loading visual…</p>}>
          <TermConceptDemo kind={kind} variant={variant} />
        </Suspense>
      </DemoChrome>
    );
  }
  let body: ReactNode;
  switch (kind) {
    case 'activation':
      body = <ActivationDemo variant={variant} />;
      break;
    case 'softmax':
      body = <SoftmaxDemo />;
      break;
    case 'learning-rate':
    case 'gradient-walk':
      body = <GradientWalkDemo />;
      break;
    case 'sgd':
      body = <SgdDemo />;
      break;
    case 'momentum':
      body = <MomentumDemo />;
      break;
    case 'adam':
      body = <AdamDemo />;
      break;
    case 'schedule':
      body = <ScheduleDemo />;
      break;
    case 'clipping':
      body = <ClippingDemo variant={variant} />;
      break;
    case 'saddle':
      body = <SaddleDemo />;
      break;
    case 'loss-compare':
      body = <LossCompareDemo />;
      break;
    case 'cross-entropy':
      body = <CrossEntropyDemo variant={variant} />;
      break;
    case 'hinge':
      body = <HingeDemo />;
      break;
    case 'kl':
      body = <KlDemo />;
      break;
    case 'contrastive':
      body = <ContrastiveDemo />;
      break;
    case 'dropout':
      body = <DropoutDemo />;
      break;
    case 'weight-decay':
      body = <WeightDecayDemo />;
      break;
    case 'batch-norm':
      body = <BatchNormDemo />;
      break;
    case 'early-stop':
      body = <EarlyStopDemo />;
      break;
    case 'augmentation':
      body = <AugmentationDemo />;
      break;
    case 'neuron':
      body = <NeuronDemo />;
      break;
    case 'forward':
      body = <ForwardDemo />;
      break;
    case 'backprop':
      body = <BackpropDemo />;
      break;
    case 'chain-rule':
      body = <ChainRuleDemo />;
      break;
    case 'init':
      body = <InitDemo />;
      break;
    case 'epochs':
      body = <EpochsDemo />;
      break;
    case 'overfit':
      body = <OverfitDemo />;
      break;
    case 'bias-variance':
      body = <BiasVarianceDemo />;
      break;
    case 'dot-product':
      body = <DotProductDemo />;
      break;
    case 'norm':
      body = <NormDemo />;
      break;
    case 'onehot':
      body = <OneHotDemo />;
      break;
    case 'scaling':
      body = <ScalingDemo />;
      break;
    case 'split':
      body = <SplitDemo variant={variant} />;
      break;
    case 'residual':
      body = <ResidualDemo />;
      break;
    case 'attention':
      body = <AttentionDemo />;
      break;
    case 'embedding':
      body = <EmbeddingDemo />;
      break;
    case 'learning-curve':
      body = <LearningCurveDemo />;
      break;
    case 'baseline':
      body = <BaselineDemo />;
      break;
    case 'leakage':
      body = <LeakageDemo />;
      break;
    case 'cosine':
      body = <CosineDemo />;
      break;
    case 'padding':
      body = <PaddingDemo />;
      break;
    case 'token':
      body = <TokenDemo />;
      break;
    case 'overlay-activation':
      body = <OverlayActivationDemo />;
      break;
    case 'overlay-loss':
      body = <OverlayLossDemo />;
      break;
    default:
      body = <p className="ts-demo-readout">Play with the numbers in the worked example beside this panel.</p>;
  }
  return <DemoChrome caption={caption} unitsNote={unitsNote}>{body}</DemoChrome>;
}
