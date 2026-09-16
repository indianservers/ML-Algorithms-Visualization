import { useMemo, useState } from 'react';
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
import type { TermDemoKind } from '../../data/termsStudio';

type DemoProps = { kind: TermDemoKind; variant?: string };

const tooltip = {
  contentStyle: { fontSize: 12, borderRadius: 8 },
};

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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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

function LearningRateDemo() {
  const [lr, setLr] = useState(0.15);
  const [start, setStart] = useState(-1.5);
  const path = walkHill(start, lr, 18);
  const curve = Array.from({ length: 61 }, (_, i) => {
    const x = -3 + i * 0.15;
    return { x, y: (x - 2) ** 2 + 0.4 };
  });
  return (
    <div className="ts-demo">
      <div className="ts-slider-grid">
        <Slider label="Learning rate" value={lr} min={0.02} max={1.1} step={0.01} onChange={setLr} />
        <Slider label="Start x" value={start} min={-3} max={5} step={0.1} onChange={setStart} />
      </div>
      <div className="ts-chart">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={curve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="x" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltip} />
            <Line type="monotone" dataKey="y" stroke="#94a3b8" dot={false} name="loss hill" />
            <Line data={path} type="monotone" dataKey="loss" stroke="#2563eb" name="walk" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="ts-demo-readout">
        Last x = <strong>{(path[path.length - 1]?.x ?? 0).toFixed(2)}</strong> (the valley is at 2)
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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

export function TermDemo({ kind, variant }: DemoProps) {
  switch (kind) {
    case 'activation':
      return <ActivationDemo variant={variant} />;
    case 'softmax':
      return <SoftmaxDemo />;
    case 'learning-rate':
    case 'gradient-walk':
      return <GradientWalkDemo />;
    case 'sgd':
      return <SgdDemo />;
    case 'momentum':
      return <MomentumDemo />;
    case 'adam':
      return <AdamDemo />;
    case 'schedule':
      return <ScheduleDemo />;
    case 'clipping':
      return <ClippingDemo variant={variant} />;
    case 'saddle':
      return <SaddleDemo />;
    case 'loss-compare':
      return <LossCompareDemo />;
    case 'cross-entropy':
      return <CrossEntropyDemo variant={variant} />;
    case 'hinge':
      return <HingeDemo />;
    case 'kl':
      return <KlDemo />;
    case 'contrastive':
      return <ContrastiveDemo />;
    case 'dropout':
      return <DropoutDemo />;
    case 'weight-decay':
      return <WeightDecayDemo />;
    case 'batch-norm':
      return <BatchNormDemo />;
    case 'early-stop':
      return <EarlyStopDemo />;
    case 'augmentation':
      return <AugmentationDemo />;
    case 'neuron':
      return <NeuronDemo />;
    case 'forward':
      return <ForwardDemo />;
    case 'backprop':
      return <BackpropDemo />;
    case 'chain-rule':
      return <ChainRuleDemo />;
    case 'init':
      return <InitDemo />;
    case 'epochs':
      return <EpochsDemo />;
    case 'overfit':
      return <OverfitDemo />;
    case 'bias-variance':
      return <BiasVarianceDemo />;
    case 'dot-product':
      return <DotProductDemo />;
    case 'norm':
      return <NormDemo />;
    case 'onehot':
      return <OneHotDemo />;
    case 'scaling':
      return <ScalingDemo />;
    case 'split':
      return <SplitDemo variant={variant} />;
    default:
      return <p className="ts-demo-readout">Play with the numbers in the worked example beside this panel.</p>;
  }
}
