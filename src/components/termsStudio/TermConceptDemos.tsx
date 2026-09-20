import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import type { TermDemoKind } from '../../data/termsStudio';

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
  const shown = Number.isInteger(step) ? String(value) : value.toFixed(2);
  return (
    <label className="ts-slider">
      <span>
        {label} <strong>{shown}</strong>
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

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (id: string) => void;
}) {
  return (
    <div className="ts-choice" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={value === option.id ? 'is-on' : ''}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Readout({ children }: { children: ReactNode }) {
  return <p className="ts-demo-readout">{children}</p>;
}

function Metrics({ items }: { items: Array<{ label: string; value: string; on?: boolean; onClick?: () => void }> }) {
  return (
    <div className="ts-concept-metrics">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={item.on ? 'is-on' : ''}
          onClick={item.onClick}
        >
          <em>{item.label}</em>
          <strong>{item.value}</strong>
        </button>
      ))}
    </div>
  );
}

type Counts = { tp: number; fp: number; fn: number; tn: number };

function fromCounts(c: Counts) {
  const n = Math.max(1, c.tp + c.fp + c.fn + c.tn);
  const precision = c.tp / Math.max(1, c.tp + c.fp);
  const recall = c.tp / Math.max(1, c.tp + c.fn);
  const specificity = c.tn / Math.max(1, c.tn + c.fp);
  const accuracy = (c.tp + c.tn) / n;
  const f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall);
  const tpr = recall;
  const fpr = c.fp / Math.max(1, c.fp + c.tn);
  return { n, precision, recall, specificity, accuracy, f1, tpr, fpr };
}

function CountField({
  label,
  hint,
  value,
  onChange,
  highlight,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
  highlight?: boolean;
}) {
  return (
    <label className={`ts-cm-cell${highlight ? ' is-hot' : ''}`}>
      <span>{label}</span>
      <small>{hint}</small>
      <input
        type="number"
        min={0}
        max={200}
        size={4}
        value={value}
        aria-label={`${label}: ${hint}`}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
      />
    </label>
  );
}

function ConfusionFamily({
  mode,
}: {
  mode: 'matrix' | 'precision-recall' | 'f1' | 'accuracy';
}) {
  const [counts, setCounts] = useState<Counts>({ tp: 40, fp: 10, fn: 20, tn: 80 });
  const [focus, setFocus] = useState<'accuracy' | 'precision' | 'recall' | 'specificity' | 'f1'>('precision');
  const stats = fromCounts(counts);
  const set = (key: keyof Counts) => (value: number) => setCounts((current) => ({ ...current, [key]: value }));
  const hot = {
    accuracy: { tp: true, tn: true, fp: false, fn: false },
    precision: { tp: true, fp: true, fn: false, tn: false },
    recall: { tp: true, fn: true, fp: false, tn: false },
    specificity: { tn: true, fp: true, tp: false, fn: false },
    f1: { tp: true, fp: true, fn: true, tn: false },
  }[mode === 'accuracy' ? 'accuracy' : mode === 'f1' ? 'f1' : focus];

  return (
    <div className="ts-demo">
      <div className="ts-cm" role="group" aria-label="Confusion matrix counts">
        <span className="ts-cm-corner" />
        <span className="ts-cm-axis">Predicted +</span>
        <span className="ts-cm-axis">Predicted −</span>
        <span className="ts-cm-axis">Actual +</span>
        <CountField label="TP" hint="true positive" value={counts.tp} onChange={set('tp')} highlight={hot.tp} />
        <CountField label="FN" hint="missed positives" value={counts.fn} onChange={set('fn')} highlight={hot.fn} />
        <span className="ts-cm-axis">Actual −</span>
        <CountField label="FP" hint="false alarm" value={counts.fp} onChange={set('fp')} highlight={hot.fp} />
        <CountField label="TN" hint="true negative" value={counts.tn} onChange={set('tn')} highlight={hot.tn} />
      </div>
      {mode === 'precision-recall' ? (
        <Readout>
          Precision: of the {counts.tp + counts.fp} predicted positives, {counts.tp} were correct ({(stats.precision * 100).toFixed(0)}%).
          Recall: of the {counts.tp + counts.fn} actual positives, {counts.tp} were found ({(stats.recall * 100).toFixed(0)}%).
        </Readout>
      ) : mode === 'f1' ? (
        <>
          <div className="ts-f1-gauge" aria-hidden="true">
            <span style={{ width: `${stats.precision * 100}%` }}>P {(stats.precision * 100).toFixed(0)}</span>
            <span style={{ width: `${stats.recall * 100}%` }}>R {(stats.recall * 100).toFixed(0)}</span>
            <strong style={{ width: `${stats.f1 * 100}%` }}>F1 {(stats.f1 * 100).toFixed(0)}</strong>
          </div>
          <Readout>
            F1 is the harmonic mean — it stays low if either precision or recall is low. Arithmetic mean would hide that.
          </Readout>
        </>
      ) : mode === 'accuracy' ? (
        <Readout>
          Correct {counts.tp + counts.tn} / {stats.n} = {(stats.accuracy * 100).toFixed(1)}%. Try 95 negatives and 5 positives with TP=0, FN=5, FP=0, TN=95 — accuracy looks fine, recall does not.
        </Readout>
      ) : (
        <Readout>Rows are actual class. Columns are predicted class. Select a metric to light the cells it uses.</Readout>
      )}
      <Metrics
        items={[
          { label: 'Accuracy', value: `${(stats.accuracy * 100).toFixed(1)}%`, on: focus === 'accuracy', onClick: () => setFocus('accuracy') },
          { label: 'Precision', value: stats.precision.toFixed(2), on: focus === 'precision', onClick: () => setFocus('precision') },
          { label: 'Recall', value: stats.recall.toFixed(2), on: focus === 'recall', onClick: () => setFocus('recall') },
          { label: 'Specificity', value: stats.specificity.toFixed(2), on: focus === 'specificity', onClick: () => setFocus('specificity') },
          { label: 'F1', value: stats.f1.toFixed(2), on: focus === 'f1', onClick: () => setFocus('f1') },
        ]}
      />
    </div>
  );
}

function AccuracyTrapDemo() {
  const [allNeg, setAllNeg] = useState(1);
  const tp = allNeg ? 0 : 4;
  const fn = allNeg ? 5 : 1;
  const fp = 0;
  const tn = 95;
  const stats = fromCounts({ tp, fp, fn, tn });
  return (
    <div className="ts-demo">
      <Choice
        label="Model"
        value={allNeg ? 'neg' : 'detect'}
        options={[
          { id: 'neg', label: 'Always predict negative' },
          { id: 'detect', label: 'Catch most positives' },
        ]}
        onChange={(id) => setAllNeg(id === 'neg' ? 1 : 0)}
      />
      <div className="ts-imbalance-bar" aria-hidden="true">
        <span className="is-neg" style={{ flex: 95 }}>95 neg</span>
        <span className="is-pos" style={{ flex: 5 }}>5 pos</span>
      </div>
      <Metrics
        items={[
          { label: 'Accuracy', value: `${(stats.accuracy * 100).toFixed(0)}%` },
          { label: 'Recall (+)', value: stats.recall.toFixed(2) },
          { label: 'Precision (+)', value: Number.isFinite(stats.precision) ? stats.precision.toFixed(2) : '—' },
        ]}
      />
      <Readout>
        {allNeg
          ? '95% accuracy while missing every rare event. Accuracy is a poor headline on imbalanced data.'
          : 'Accuracy dipped a little; recall for the rare class jumped. That is the trade you actually wanted.'}
      </Readout>
    </div>
  );
}

const ROC_POS = [0.92, 0.81, 0.74, 0.61, 0.48];
const ROC_NEG = [0.67, 0.52, 0.33, 0.21, 0.09];

function rocAt(threshold: number) {
  const tp = ROC_POS.filter((score) => score >= threshold).length;
  const fn = ROC_POS.length - tp;
  const fp = ROC_NEG.filter((score) => score >= threshold).length;
  const tn = ROC_NEG.length - fp;
  return fromCounts({ tp, fp, fn, tn });
}

function RocDemo() {
  const [threshold, setThreshold] = useState(0.5);
  const curve = useMemo(() => {
    const ts = [1.01, ...Array.from({ length: 21 }, (_, i) => 1 - i * 0.05), -0.01];
    return ts.map((t) => {
      const s = rocAt(t);
      return { fpr: s.fpr, tpr: s.tpr };
    });
  }, []);
  const now = rocAt(threshold);
  const auc = useMemo(() => {
    let area = 0;
    for (let i = 1; i < curve.length; i++) {
      const a = curve[i - 1]!;
      const b = curve[i]!;
      area += ((a.tpr + b.tpr) / 2) * Math.abs(b.fpr - a.fpr);
    }
    return area;
  }, [curve]);
  const d = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${8 + p.fpr * 160} ${168 - p.tpr * 160}`).join(' ');
  return (
    <div className="ts-demo">
      <Slider label="Decision threshold" value={threshold} min={0} max={1} step={0.01} onChange={setThreshold} />
      <svg className="ts-svg" viewBox="0 0 184 184" role="img" aria-label="ROC curve">
        <rect x="8" y="8" width="160" height="160" className="ts-svg-frame" />
        <path d="M8 168 L168 8" className="ts-svg-guide" />
        <path d={d} className="ts-svg-line" />
        <circle cx={8 + now.fpr * 160} cy={168 - now.tpr * 160} r="6" className="ts-svg-dot" />
        <text x="8" y="182" className="ts-svg-label">FPR</text>
        <text x="150" y="182" className="ts-svg-label">TPR ↑</text>
      </svg>
      <Metrics
        items={[
          { label: 'TPR / recall', value: now.tpr.toFixed(2) },
          { label: 'FPR', value: now.fpr.toFixed(2) },
          { label: 'AUC (this example)', value: auc.toFixed(2) },
        ]}
      />
      <Readout>
        Lower threshold: more positives, TPR and FPR both rise. AUC is the area under this curve — useful when ranking matters, not a universal score.
      </Readout>
    </div>
  );
}

type Pt = { x: number; y: number; cls: 0 | 1 };

const START_POINTS: Pt[] = [
  { x: 28, y: 42, cls: 0 },
  { x: 40, y: 58, cls: 0 },
  { x: 36, y: 30, cls: 0 },
  { x: 52, y: 48, cls: 0 },
  { x: 118, y: 122, cls: 1 },
  { x: 132, y: 108, cls: 1 },
  { x: 108, y: 136, cls: 1 },
  { x: 140, y: 132, cls: 1 },
];

function invert3(a: number[][]) {
  const [r0, r1, r2] = a;
  const m00 = r0![0]!, m01 = r0![1]!, m02 = r0![2]!;
  const m10 = r1![0]!, m11 = r1![1]!, m12 = r1![2]!;
  const m20 = r2![0]!, m21 = r2![1]!, m22 = r2![2]!;
  const det =
    m00 * (m11 * m22 - m12 * m21) -
    m01 * (m10 * m22 - m12 * m20) +
    m02 * (m10 * m21 - m11 * m20);
  if (Math.abs(det) < 1e-9) return null;
  const inv = 1 / det;
  return [
    [(m11 * m22 - m12 * m21) * inv, (m02 * m21 - m01 * m22) * inv, (m01 * m12 - m02 * m11) * inv],
    [(m12 * m20 - m10 * m22) * inv, (m00 * m22 - m02 * m20) * inv, (m02 * m10 - m00 * m12) * inv],
    [(m10 * m21 - m11 * m20) * inv, (m01 * m20 - m00 * m21) * inv, (m00 * m11 - m01 * m10) * inv],
  ];
}

function fitLinear(points: Pt[]) {
  const xtx = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const xty = [0, 0, 0];
  for (const p of points) {
    const row = [1, p.x / 80 - 1, p.y / 80 - 1];
    const t = p.cls === 1 ? 1 : -1;
    for (let i = 0; i < 3; i++) {
      xty[i]! += row[i]! * t;
      for (let j = 0; j < 3; j++) xtx[i]![j]! += row[i]! * row[j]!;
    }
  }
  const inv = invert3(xtx);
  if (!inv) return { w0: 0, w1: 1, w2: 0 };
  return {
    w0: inv[0]![0]! * xty[0]! + inv[0]![1]! * xty[1]! + inv[0]![2]! * xty[2]!,
    w1: inv[1]![0]! * xty[0]! + inv[1]![1]! * xty[1]! + inv[1]![2]! * xty[2]!,
    w2: inv[2]![0]! * xty[0]! + inv[2]![1]! * xty[1]! + inv[2]![2]! * xty[2]!,
  };
}

function DecisionBoundaryDemo() {
  const [points, setPoints] = useState<Pt[]>(START_POINTS);
  const [paint, setPaint] = useState<0 | 1>(0);
  const [model, setModel] = useState<'linear' | 'knn'>('linear');
  const weights = useMemo(() => fitLinear(points), [points]);
  const cells = useMemo(() => {
    const out: Array<{ x: number; y: number; cls: 0 | 1 }> = [];
    for (let y = 8; y < 160; y += 10) {
      for (let x = 8; x < 160; x += 10) {
        if (model === 'linear') {
          const nx = x / 80 - 1;
          const ny = y / 80 - 1;
          const score = weights.w0 + weights.w1 * nx + weights.w2 * ny;
          out.push({ x, y, cls: score >= 0 ? 1 : 0 });
        } else {
          let best = points[0]!;
          let dist = Infinity;
          for (const p of points) {
            const d = (p.x - x) ** 2 + (p.y - y) ** 2;
            if (d < dist) {
              dist = d;
              best = p;
            }
          }
          out.push({ x, y, cls: best.cls });
        }
      }
    }
    return out;
  }, [model, points, weights]);
  const add = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 168;
    const y = ((event.clientY - box.top) / box.height) * 168;
    const hit = points.find((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 64);
    if (hit) {
      setPoints((current) => current.filter((p) => p !== hit));
      return;
    }
    setPoints((current) => [...current, { x, y, cls: paint }]);
  };
  return (
    <div className="ts-demo">
      <Choice
        label="Classifier"
        value={model}
        options={[
          { id: 'linear', label: 'Linear' },
          { id: 'knn', label: '1-NN' },
        ]}
        onChange={(id) => setModel(id as 'linear' | 'knn')}
      />
      <Choice
        label="Paint class"
        value={String(paint)}
        options={[
          { id: '0', label: 'Class A' },
          { id: '1', label: 'Class B' },
        ]}
        onChange={(id) => setPaint(id === '1' ? 1 : 0)}
      />
      <svg className="ts-svg ts-svg-click" viewBox="0 0 168 168" role="img" aria-label="Decision boundary plot" onClick={add}>
        {cells.map((cell, i) => (
          <rect
            key={i}
            x={cell.x}
            y={cell.y}
            width="10"
            height="10"
            className={cell.cls ? 'ts-region-b' : 'ts-region-a'}
          />
        ))}
        {points.map((p, i) => (
          <circle key={`${p.x}-${p.y}-${i}`} cx={p.x} cy={p.y} r="6" className={p.cls ? 'ts-pt-b' : 'ts-pt-a'} />
        ))}
      </svg>
      <div className="ts-demo-tools">
        <button type="button" onClick={() => setPoints(START_POINTS)}>Reset</button>
      </div>
      <Readout>Shaded regions are predicted class. Click empty space to add a point; click a point to remove it.</Readout>
    </div>
  );
}

function F1SliderDemo() {
  const [precision, setPrecision] = useState(0.9);
  const [recall, setRecall] = useState(0.2);
  const f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall);
  const arith = (precision + recall) / 2;
  return (
    <div className="ts-demo">
      <Slider label="Precision" value={precision} min={0.05} max={1} step={0.01} onChange={setPrecision} />
      <Slider label="Recall" value={recall} min={0.05} max={1} step={0.01} onChange={setRecall} />
      <div className="ts-f1-balance" aria-hidden="true">
        <i style={{ left: `${((precision - recall + 1) / 2) * 100}%` }} />
      </div>
      <Metrics
        items={[
          { label: 'Harmonic F1', value: f1.toFixed(2) },
          { label: 'Arithmetic mean', value: arith.toFixed(2) },
        ]}
      />
      <Readout>
        {Math.abs(precision - recall) > 0.4
          ? `F1 ${f1.toFixed(2)} sits closer to the weaker number. The arithmetic mean ${arith.toFixed(2)} looks too kind.`
          : 'When precision and recall match, F1 agrees with the ordinary average.'}
      </Readout>
    </div>
  );
}

function RegularizeDemo() {
  const [lambda, setLambda] = useState(0.4);
  const [kind, setKind] = useState<'l1' | 'l2'>('l1');
  const raw = [1.8, 1.1, 0.35, 0.12];
  const shrink = raw.map((w) => {
    if (kind === 'l2') return w / (1 + 3 * lambda);
    const stepped = Math.max(0, Math.abs(w) - 1.2 * lambda);
    return Math.sign(w) * stepped;
  });
  return (
    <div className="ts-demo">
      <Choice
        label="Penalty"
        value={kind}
        options={[
          { id: 'l1', label: 'L1 (Lasso)' },
          { id: 'l2', label: 'L2 (Ridge)' },
        ]}
        onChange={(id) => setKind(id as 'l1' | 'l2')}
      />
      <Slider label="λ" value={lambda} min={0} max={1} step={0.05} onChange={setLambda} />
      <div className="ts-bars">
        {shrink.map((w, i) => (
          <div className="ts-bar-row" key={i}>
            <span>w{i + 1}</span>
            <i style={{ width: `${Math.min(100, Math.abs(w) * 48)}%` }} />
            <em>{w.toFixed(2)}</em>
          </div>
        ))}
      </div>
      <Readout>
        {kind === 'l1'
          ? 'L1 can drive small weights exactly to zero — a form of feature selection.'
          : 'L2 shrinks weights smoothly; they usually stay nonzero.'}
      </Readout>
    </div>
  );
}

function ScaleFamily({ mode }: { mode: 'z' | 'minmax' | 'both' }) {
  const [raw, setRaw] = useState(90);
  const mean = 50;
  const sd = 20;
  const min = 10;
  const max = 130;
  const z = (raw - mean) / sd;
  const mm = (raw - min) / (max - min);
  return (
    <div className="ts-demo">
      <Slider label="Income (thousands)" value={raw} min={10} max={130} step={5} onChange={setRaw} />
      <div className="ts-scale-track" aria-hidden="true">
        <span style={{ left: `${((raw - 10) / 120) * 100}%` }} />
      </div>
      {mode !== 'minmax' && (
        <Readout>
          Standardization: ({raw} − {mean}) / {sd} = <strong>{z.toFixed(2)}</strong>. Mean ≈ 0, SD ≈ 1. Not automatically Gaussian.
        </Readout>
      )}
      {mode !== 'z' && (
        <Readout>
          Min-max: ({raw} − {min}) / ({max} − {min}) = <strong>{mm.toFixed(2)}</strong> on [0, 1]. Different from vector (L2) normalization.
        </Readout>
      )}
    </div>
  );
}

function SplitPercentsDemo() {
  const [train, setTrain] = useState(70);
  const [val, setVal] = useState(15);
  const test = Math.max(0, 100 - train - val);
  const setTrainSafe = (value: number) => {
    const next = Math.min(value, 100 - val);
    setTrain(next);
  };
  const setValSafe = (value: number) => {
    const next = Math.min(value, 100 - train);
    setVal(next);
  };
  return (
    <div className="ts-demo">
      <Slider label="Train %" value={train} min={40} max={90} step={1} onChange={setTrainSafe} />
      <Slider label="Validation %" value={val} min={5} max={40} step={1} onChange={setValSafe} />
      <div className="ts-imbalance-bar" aria-hidden="true">
        <span className="is-train" style={{ flex: train }}>train {train}%</span>
        <span className="is-val" style={{ flex: val }}>val {val}%</span>
        <span className="is-test" style={{ flex: test }}>test {test}%</span>
      </div>
      <Readout>
        Train fits. Validation tunes. Test is a sealed exam — do not keep peeking at it to pick hyperparameters.
      </Readout>
    </div>
  );
}

function KFoldDemo() {
  const [k, setK] = useState(5);
  const [hold, setHold] = useState(0);
  const fold = Math.min(hold, k - 1);
  const scores = [0.81, 0.74, 0.88, 0.79, 0.83, 0.77, 0.85, 0.8].slice(0, k);
  const avg = scores.reduce((s, v) => s + v, 0) / k;
  return (
    <div className="ts-demo">
      <Slider label="k folds" value={k} min={3} max={8} step={1} onChange={(value) => { setK(value); setHold(0); }} />
      <Slider label="Held-out fold" value={fold} min={0} max={k - 1} step={1} onChange={setHold} />
      <div className="ts-kfold">
        {Array.from({ length: k }, (_, i) => (
          <span key={i} className={i === fold ? 'is-val' : 'is-train'}>
            {i === fold ? 'val' : 'train'}
          </span>
        ))}
      </div>
      <Readout>
        Fold {fold + 1} sits out. Mean of fold scores ≈ {avg.toFixed(2)} (illustrative). Each example is validation exactly once.
      </Readout>
    </div>
  );
}

function ImbalanceDemo() {
  const [pos, setPos] = useState(8);
  return (
    <div className="ts-demo">
      <Slider label="Positive class %" value={pos} min={2} max={50} step={1} onChange={setPos} />
      <div className="ts-imbalance-bar" aria-hidden="true">
        <span className="is-neg" style={{ flex: 100 - pos }}>{100 - pos}% majority</span>
        <span className="is-pos" style={{ flex: pos }}>{pos}% minority</span>
      </div>
      <Readout>
        A dummy “always majority” model scores {100 - pos}% accuracy. Prefer class weights, resampling, and metrics like recall/PR-AUC — none is universally best.
      </Readout>
    </div>
  );
}

function SamplingDemo({ mode }: { mode: 'over' | 'under' }) {
  const maj = 12;
  const mino = 3;
  const afterMaj = mode === 'under' ? 3 : 12;
  const afterMin = mode === 'over' ? 12 : 3;
  return (
    <div className="ts-demo">
      <div className="ts-sample-row" aria-hidden="true">
        <div>
          <em>Before</em>
          <p>
            {Array.from({ length: maj }, (_, i) => <i key={`m${i}`} className="is-maj" />)}
            {Array.from({ length: mino }, (_, i) => <i key={`n${i}`} className="is-min" />)}
          </p>
        </div>
        <div>
          <em>After {mode === 'over' ? 'oversample' : 'undersample'}</em>
          <p>
            {Array.from({ length: afterMaj }, (_, i) => <i key={`am${i}`} className="is-maj" />)}
            {Array.from({ length: afterMin }, (_, i) => <i key={`an${i}`} className={mode === 'over' ? 'is-min is-syn' : 'is-min'} />)}
          </p>
        </div>
      </div>
      <Readout>
        {mode === 'over'
          ? 'Oversampling repeats or synthesizes minority points. Duplicates are not new information.'
          : 'Undersampling drops majority points. You throw away data — sometimes that is the point.'}
      </Readout>
    </div>
  );
}

function SmoteDemo() {
  const [t, setT] = useState(0.4);
  const a = { x: 36, y: 110 };
  const b = { x: 124, y: 42 };
  const x = a.x + t * (b.x - a.x);
  const y = a.y + t * (b.y - a.y);
  return (
    <div className="ts-demo">
      <Slider label="Interpolation t" value={t} min={0.1} max={0.9} step={0.05} onChange={setT} />
      <svg className="ts-svg" viewBox="0 0 168 168" role="img" aria-label="SMOTE interpolation">
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="ts-svg-line" />
        <circle cx={a.x} cy={a.y} r="7" className="ts-pt-a" />
        <circle cx={b.x} cy={b.y} r="7" className="ts-pt-a" />
        <circle cx={x} cy={y} r="7" className="ts-pt-syn" />
      </svg>
      <Readout>The new (hollow) point sits on the line between two minority neighbors — interpolated, not copied.</Readout>
    </div>
  );
}

function KernelTrickDemo() {
  const [view, setView] = useState<'2d' | 'lift' | 'kernel'>('2d');
  const ring: Array<{ x: number; y: number; cls: 0 | 1 }> = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ring.push({ x: 84 + Math.cos(a) * 22, y: 84 + Math.sin(a) * 22, cls: 0 });
    ring.push({ x: 84 + Math.cos(a) * 58, y: 84 + Math.sin(a) * 58, cls: 1 });
  }
  return (
    <div className="ts-demo">
      <Choice
        label="View"
        value={view}
        options={[
          { id: '2d', label: 'Original 2D' },
          { id: 'lift', label: 'Conceptual lift' },
          { id: 'kernel', label: 'Kernel idea' },
        ]}
        onChange={(id) => setView(id as typeof view)}
      />
      <svg className="ts-svg" viewBox="0 0 168 168" role="img" aria-label="Kernel trick">
        {view !== 'kernel' &&
          ring.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={view === 'lift' ? 150 - Math.hypot(p.x - 84, p.y - 84) : p.y}
              r="5"
              className={p.cls ? 'ts-pt-b' : 'ts-pt-a'}
            />
          ))}
        {view === 'lift' && <line x1="12" y1="92" x2="156" y2="92" className="ts-svg-line" />}
        {view === 'kernel' && (
          <text x="18" y="92" className="ts-svg-note">
            K(x, x′) = φ(x)·φ(x′) without building φ
          </text>
        )}
      </svg>
      <Readout>
        {view === '2d' && 'Concentric rings are not linearly separable in this plane. This picture is conceptual.'}
        {view === 'lift' && 'A feature such as r² = x² + y² can make a linear cut possible. We rarely store that space.'}
        {view === 'kernel' && 'A kernel computes the same inner products without explicitly mapping every point.'}
      </Readout>
    </div>
  );
}

function SvmFamily({ mode }: { mode: 'sv' | 'margin' }) {
  const [c, setC] = useState(1);
  const pts: Pt[] = [
    { x: 40, y: 50, cls: 0 },
    { x: 52, y: 68, cls: 0 },
    { x: 36, y: 86, cls: 0 },
    { x: 70, y: 58, cls: 0 },
    { x: 118, y: 96, cls: 1 },
    { x: 130, y: 78, cls: 1 },
    { x: 108, y: 120, cls: 1 },
    { x: 142, y: 110, cls: 1 },
  ];
  const [picked, setPicked] = useState<number | null>(null);
  const margin = 18 + c * 10;
  const sv = new Set(c > 0.6 ? [3, 4] : [1, 3, 4, 6]);
  return (
    <div className="ts-demo">
      <Slider label="C (soft-margin tightness)" value={c} min={0.1} max={1} step={0.05} onChange={setC} />
      <svg className="ts-svg" viewBox="0 0 168 168" role="img" aria-label="Support vectors and margin">
        <line x1="20" y1="140" x2="148" y2="28" className="ts-svg-line" />
        <line x1="20" y1={140 - margin} x2="148" y2={28 - margin} className="ts-svg-guide" />
        <line x1="20" y1={140 + margin} x2="148" y2={28 + margin} className="ts-svg-guide" />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={sv.has(i) ? 8 : 5}
            className={`${p.cls ? 'ts-pt-b' : 'ts-pt-a'}${sv.has(i) ? ' is-sv' : ''}${picked === i ? ' is-pick' : ''}`}
            onClick={() => setPicked(i)}
          />
        ))}
      </svg>
      <Readout>
        {mode === 'sv'
          ? picked === null
            ? 'Click a point. Ringed points are support vectors — they pin the boundary.'
            : sv.has(picked)
              ? `Point ${picked + 1} is a support vector. Moving it would move the boundary.`
              : `Point ${picked + 1} is inside its side. It does not define the margin.`
          : `Margin is the gap to the nearest support vectors. Large C ≈ hard margin; small C allows more slack.`}
      </Readout>
    </div>
  );
}

function entropyOf(p: number) {
  const q = 1 - p;
  const term = (x: number) => (x <= 0 ? 0 : -x * Math.log2(x));
  return term(p) + term(q);
}
function giniOf(p: number) {
  return 1 - p * p - (1 - p) * (1 - p);
}

function ImpurityDemo({ mode }: { mode: 'entropy' | 'gini' | 'both' }) {
  const [p, setP] = useState(0.5);
  const [show, setShow] = useState<'entropy' | 'gini'>(mode === 'gini' ? 'gini' : 'entropy');
  const H = entropyOf(p);
  const G = giniOf(p);
  const active = show;
  return (
    <div className="ts-demo">
      <Choice
        label="Impurity"
        value={show}
        options={[
          { id: 'entropy', label: 'Entropy' },
          { id: 'gini', label: 'Gini' },
        ]}
        onChange={(id) => setShow(id as 'entropy' | 'gini')}
      />
      <Slider label="% class A" value={Math.round(p * 100)} min={0} max={100} step={1} onChange={(v) => setP(v / 100)} />
      <div className="ts-imbalance-bar" aria-hidden="true">
        <span className="is-pos" style={{ flex: p * 100 }}>A {(p * 100).toFixed(0)}%</span>
        <span className="is-neg" style={{ flex: (1 - p) * 100 }}>B {((1 - p) * 100).toFixed(0)}%</span>
      </div>
      <Metrics
        items={[
          { label: 'Entropy', value: H.toFixed(3), on: active === 'entropy' },
          { label: 'Gini', value: G.toFixed(3), on: active === 'gini' },
        ]}
      />
      <Readout>
        Pure (0% or 100%) → impurity near 0. A 50/50 mix is the messiest node.
        {active === 'entropy' ? ` H = −p log₂ p − (1−p) log₂(1−p) = ${H.toFixed(3)}.` : ` Gini = 1 − Σ pₖ² = ${G.toFixed(3)}.`}
      </Readout>
    </div>
  );
}

function InfoGainDemo() {
  const [parent, setParent] = useState(0.5);
  const [left, setLeft] = useState(0.1);
  const [leftShare, setLeftShare] = useState(0.4);
  const right = Math.min(1, Math.max(0, (parent - leftShare * left) / Math.max(0.05, 1 - leftShare)));
  const before = entropyOf(parent);
  const after = leftShare * entropyOf(left) + (1 - leftShare) * entropyOf(right);
  const ig = before - after;
  return (
    <div className="ts-demo">
      <Slider label="Parent % A" value={Math.round(parent * 100)} min={10} max={90} step={1} onChange={(v) => setParent(v / 100)} />
      <Slider label="Left child % A" value={Math.round(left * 100)} min={0} max={100} step={1} onChange={(v) => setLeft(v / 100)} />
      <Slider label="Share of rows in left" value={Math.round(leftShare * 100)} min={10} max={90} step={1} onChange={(v) => setLeftShare(v / 100)} />
      <div className="ts-tree-ig">
        <div>Parent H={before.toFixed(2)}</div>
        <div>Left {(leftShare * 100).toFixed(0)}% · H={entropyOf(left).toFixed(2)}</div>
        <div>Right {((1 - leftShare) * 100).toFixed(0)}% · H={entropyOf(right).toFixed(2)}</div>
      </div>
      <Readout>
        Information gain = {before.toFixed(2)} − {after.toFixed(2)} = <strong>{ig.toFixed(2)}</strong>. Bigger means a cleaner split.
      </Readout>
    </div>
  );
}

function PruneDemo() {
  const [prune, setPrune] = useState(0);
  return (
    <div className="ts-demo">
      <Choice
        label="Tree"
        value={prune ? 'after' : 'before'}
        options={[
          { id: 'before', label: 'Before prune' },
          { id: 'after', label: 'After prune' },
        ]}
        onChange={(id) => setPrune(id === 'after' ? 1 : 0)}
      />
      <svg className="ts-svg" viewBox="0 0 200 140" role="img" aria-label="Pruning a tree">
        <line x1="100" y1="18" x2="55" y2="58" className="ts-svg-line" />
        <line x1="100" y1="18" x2="145" y2="58" className="ts-svg-line" />
        <line x1="55" y1="58" x2="30" y2="104" className="ts-svg-line" />
        <line x1="55" y1="58" x2="80" y2="104" className="ts-svg-line" />
        {!prune && (
          <>
            <line x1="145" y1="58" x2="120" y2="104" className="ts-svg-ghost" />
            <line x1="145" y1="58" x2="170" y2="104" className="ts-svg-ghost" />
            <circle cx="120" cy="104" r="10" className="ts-tree-drop" />
            <circle cx="170" cy="104" r="10" className="ts-tree-drop" />
          </>
        )}
        <circle cx="100" cy="18" r="12" className="ts-pt-b" />
        <circle cx="55" cy="58" r="11" className="ts-pt-a" />
        <circle cx="145" cy="58" r="11" className="ts-pt-b" />
        <circle cx="30" cy="104" r="10" className="ts-pt-a" />
        <circle cx="80" cy="104" r="10" className="ts-pt-a" />
        {prune ? <circle cx="145" cy="58" r="11" className="ts-pt-b is-sv" /> : null}
      </svg>
      <Readout>
        {prune
          ? 'Twigs gone. The tree is smaller and often generalizes better. Link this to the Decision Tree lab.'
          : 'A deep tree memorizes leaves. Grey nodes are candidates to collapse.'}
      </Readout>
    </div>
  );
}

const BAG = ['A', 'B', 'C', 'D', 'E'] as const;

function BootstrapDemo() {
  const [draw, setDraw] = useState(0);
  const samples = [
    ['B', 'D', 'B', 'A', 'E'],
    ['A', 'A', 'C', 'E', 'C'],
    ['D', 'E', 'A', 'D', 'B'],
  ][draw % 3]!;
  const counts = Object.fromEntries(BAG.map((item) => [item, samples.filter((s) => s === item).length]));
  return (
    <div className="ts-demo">
      <div className="ts-demo-tools">
        <button type="button" onClick={() => setDraw((n) => n + 1)}>New bootstrap draw</button>
      </div>
      <p className="ts-boot-row"><em>Population</em> {BAG.map((item) => <span key={item}>{item}</span>)}</p>
      <p className="ts-boot-row">
        <em>Sample with replacement</em>
        {samples.map((item, i) => (
          <span key={`${item}-${i}`} className={(counts[item] ?? 0) > 1 ? 'is-rep' : ''}>{item}</span>
        ))}
      </p>
      <Readout>
        Repeats are allowed (here {BAG.filter((item) => (counts[item] ?? 0) > 1).join(', ') || 'none'}).
        Omitted this draw: {BAG.filter((item) => !counts[item]).join(', ') || 'none'}. That is bootstrap, not a shuffle without replacement.
      </Readout>
    </div>
  );
}

function BaggingDemo() {
  return (
    <div className="ts-demo">
      <ol className="ts-flow ts-pipe">
        <li>Original data</li>
        <li>Bootstrap sample 1, 2, 3…</li>
        <li>Train models in parallel</li>
        <li>Aggregate: vote (class) or average (reg)</li>
      </ol>
      <Readout>Bagging reduces variance by averaging independent noisy models. Random Forest is bagged trees plus random features.</Readout>
    </div>
  );
}

function BoostingDemo() {
  const [step, setStep] = useState(1);
  return (
    <div className="ts-demo">
      <Slider label="Stage" value={step} min={1} max={3} step={1} onChange={setStep} />
      <ol className="ts-flow ts-pipe">
        <li className={step >= 1 ? 'is-on' : ''}>Model 1 fits the data</li>
        <li className={step >= 2 ? 'is-on' : ''}>Upweight leftover errors</li>
        <li className={step >= 3 ? 'is-on' : ''}>Model 2, then 3, add into the ensemble</li>
      </ol>
      <Readout>Boosting is sequential: each model hunts the previous mistakes. Bagging is parallel and does not reweight errors this way.</Readout>
    </div>
  );
}

function ImportanceDemo() {
  const bars = [
    { name: 'petal length', v: 0.44 },
    { name: 'petal width', v: 0.38 },
    { name: 'sepal length', v: 0.12 },
    { name: 'sepal width', v: 0.06 },
  ];
  return (
    <div className="ts-demo">
      <div className="ts-bars">
        {bars.map((bar) => (
          <div className="ts-bar-row" key={bar.name}>
            <span>{bar.name}</span>
            <i style={{ width: `${bar.v * 100}%` }} />
            <em>{bar.v.toFixed(2)}</em>
          </div>
        ))}
      </div>
      <Readout>Illustrative ranks from a tree-style model on iris-like features. Importance is method-dependent and is not causation.</Readout>
    </div>
  );
}

function ShapDemo() {
  const parts = [
    { label: 'base', v: 0.2 },
    { label: '+ age', v: 0.18 },
    { label: '− income', v: -0.07 },
    { label: '+ late pays', v: 0.31 },
  ];
  const pred = parts.reduce((s, p) => s + p.v, 0);
  return (
    <div className="ts-demo">
      <div className="ts-waterfall">
        {parts.map((p) => (
          <span key={p.label} className={p.v < 0 ? 'is-neg' : 'is-pos'} style={{ flex: Math.max(0.08, Math.abs(p.v)) }}>
            {p.label} {p.v > 0 ? '+' : ''}{p.v.toFixed(2)}
          </span>
        ))}
      </div>
      <Readout>
        Conceptual waterfall: base {parts[0]!.v.toFixed(2)} plus local contributions = {pred.toFixed(2)}. These bars are illustrative, not computed SHAP values.
      </Readout>
    </div>
  );
}

function LabelEncodeDemo() {
  const colors = ['Red', 'Blue', 'Green'] as const;
  const [pick, setPick] = useState<(typeof colors)[number]>('Blue');
  const code = colors.indexOf(pick);
  return (
    <div className="ts-demo">
      <Choice
        label="Color"
        value={pick}
        options={colors.map((c) => ({ id: c, label: c }))}
        onChange={(id) => setPick(id as typeof pick)}
      />
      <Readout>
        Label encoding maps {pick} → <strong>{code}</strong>. The number is a code, not a ranking — Blue is not “more” than Red. Prefer one-hot when order is fake.
      </Readout>
    </div>
  );
}

function DistanceDemo({ metric }: { metric: 'euclidean' | 'manhattan' | 'both' }) {
  const [ax, setAx] = useState(0.2);
  const [ay, setAy] = useState(0.3);
  const [bx, setBx] = useState(0.8);
  const [by, setBy] = useState(0.75);
  const dx = Math.abs(bx - ax);
  const dy = Math.abs(by - ay);
  const euc = Math.hypot(dx, dy);
  const man = dx + dy;
  return (
    <div className="ts-demo">
      <div className="ts-slider-grid">
        <Slider label="A.x" value={ax} min={0} max={1} step={0.05} onChange={setAx} />
        <Slider label="A.y" value={ay} min={0} max={1} step={0.05} onChange={setAy} />
        <Slider label="B.x" value={bx} min={0} max={1} step={0.05} onChange={setBx} />
        <Slider label="B.y" value={by} min={0} max={1} step={0.05} onChange={setBy} />
      </div>
      <svg className="ts-svg" viewBox="0 0 168 168" role="img" aria-label="Distance">
        <path d={`M ${12 + ax * 144} ${156 - ay * 144} H ${12 + bx * 144} V ${156 - by * 144}`} className="ts-svg-guide" />
        <line x1={12 + ax * 144} y1={156 - ay * 144} x2={12 + bx * 144} y2={156 - by * 144} className="ts-svg-line" />
        <circle cx={12 + ax * 144} cy={156 - ay * 144} r="6" className="ts-pt-a" />
        <circle cx={12 + bx * 144} cy={156 - by * 144} r="6" className="ts-pt-b" />
      </svg>
      <Metrics
        items={[
          { label: 'Euclidean', value: euc.toFixed(2), on: metric !== 'manhattan' },
          { label: 'Manhattan', value: man.toFixed(2), on: metric !== 'euclidean' },
        ]}
      />
      <Readout>
        {metric === 'manhattan'
          ? 'Manhattan follows the grid (the bent path).'
          : metric === 'euclidean'
            ? `√((Δx)²+(Δy)²) = ${euc.toFixed(2)}. Drag via the sliders.`
            : 'Straight line vs city blocks. Cosine would ignore length and keep the angle.'}
      </Readout>
    </div>
  );
}

const KERNELS: Record<string, number[][]> = {
  edge: [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ],
  blur: [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ],
  sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
  identity: [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ],
};

const IMAGE = [
  [0, 0, 0, 1, 1],
  [0, 0, 1, 1, 0],
  [0, 1, 1, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 0, 0, 0, 0],
];

function convAt(img: number[][], kernel: number[][], top: number, left: number, pad: number) {
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const rr = top + i;
      const cc = left + j;
      const inside = rr >= 0 && cc >= 0 && rr < img.length && cc < (img[0]?.length ?? 0);
      if (!inside && !pad) continue;
      const val = inside ? img[rr]![cc]! : 0;
      sum += val * kernel[i]![j]!;
    }
  }
  const ksum = kernel.flat().reduce((s, v) => s + Math.abs(v), 0) || 1;
  return sum / (ksum > 8 ? 9 : 1);
}

function ConvFamily({ mode }: { mode: 'conv' | 'filter' | 'stride' | 'pad' | 'map' }) {
  const [kernelId, setKernelId] = useState<'edge' | 'blur' | 'sharpen'>('edge');
  const [stride, setStride] = useState(1);
  const [pad, setPad] = useState(0);
  const kernel = KERNELS[mode === 'filter' ? kernelId : 'edge'] ?? KERNELS.edge!;
  const size = IMAGE.length;
  const outSize = Math.floor((size + 2 * pad - 3) / stride) + 1;
  const out: number[][] = [];
  for (let r = 0; r < outSize; r++) {
    const row: number[] = [];
    for (let c = 0; c < outSize; c++) {
      row.push(convAt(IMAGE, kernel, r * stride - pad, c * stride - pad, pad));
    }
    out.push(row);
  }
  return (
    <div className="ts-demo">
      {mode === 'filter' && (
        <Choice
          label="Kernel"
          value={kernelId}
          options={[
            { id: 'edge', label: 'Edge' },
            { id: 'blur', label: 'Blur' },
            { id: 'sharpen', label: 'Sharpen' },
          ]}
          onChange={(id) => setKernelId(id as typeof kernelId)}
        />
      )}
      {mode === 'stride' && <Slider label="Stride" value={stride} min={1} max={2} step={1} onChange={setStride} />}
      {mode === 'pad' && (
        <Choice
          label="Padding"
          value={String(pad)}
          options={[
            { id: '0', label: 'Valid (no pad)' },
            { id: '1', label: 'Same (zero pad)' },
          ]}
          onChange={(id) => setPad(Number(id))}
        />
      )}
      <div className="ts-conv-pair">
        <div>
          <em>Input</em>
          <div className="ts-grid5">
            {IMAGE.flatMap((row, r) =>
              row.map((v, c) => (
                <span key={`${r}-${c}`} className={v ? 'is-on' : ''}>{v}</span>
              )),
            )}
          </div>
        </div>
        <div>
          <em>3×3 kernel</em>
          <div className="ts-grid3">
            {kernel.flat().map((v, i) => (
              <span key={i}>{v}</span>
            ))}
          </div>
        </div>
        <div>
          <em>Feature map {outSize}×{outSize}</em>
          <div className="ts-grid-dyn" style={{ gridTemplateColumns: `repeat(${outSize}, 1fr)` }}>
            {out.flat().map((v, i) => (
              <span key={i}>{v.toFixed(1)}</span>
            ))}
          </div>
        </div>
      </div>
      <Readout>
        {mode === 'stride' && `Stride ${stride} skips cells. Output shrinks from 5 to ${outSize}.`}
        {mode === 'pad' && (pad ? 'Zero border cells keep the spatial size closer to the input (same padding).' : 'Valid convolution does not add a border, so the map shrinks.')}
        {mode === 'map' && 'A feature map is the response of this filter at every location.'}
        {(mode === 'conv' || mode === 'filter') && 'Slide, multiply, sum. Learned CNN filters start like these presets, then change with training.'}
      </Readout>
    </div>
  );
}

function PoolDemo() {
  const [kind, setKind] = useState<'max' | 'avg'>('max');
  const src = [
    [1, 3, 2, 0],
    [4, 1, 0, 5],
    [2, 2, 9, 1],
    [0, 6, 1, 3],
  ];
  const out = [
    [kind === 'max' ? 4 : 2.25, kind === 'max' ? 5 : 1.75],
    [kind === 'max' ? 6 : 2.5, kind === 'max' ? 9 : 3.5],
  ];
  return (
    <div className="ts-demo">
      <Choice
        label="Pooling"
        value={kind}
        options={[
          { id: 'max', label: '2×2 max' },
          { id: 'avg', label: '2×2 average' },
        ]}
        onChange={(id) => setKind(id as 'max' | 'avg')}
      />
      <div className="ts-conv-pair">
        <div>
          <em>Windowed 4×4</em>
          <div className="ts-grid4">
            {src.flat().map((v, i) => (
              <span key={i} className={i % 4 < 2 === (Math.floor(i / 4) < 2) ? 'is-on' : ''}>{v}</span>
            ))}
          </div>
        </div>
        <div>
          <em>Pooled 2×2</em>
          <div className="ts-grid2">
            {out.flat().map((v, i) => (
              <span key={i} className="is-on">{v}</span>
            ))}
          </div>
        </div>
      </div>
      <Readout>{kind === 'max' ? 'Max pooling keeps the loudest response in each 2×2 block.' : 'Average pooling reports the mean of the block.'}</Readout>
    </div>
  );
}

function RnnDemo() {
  const xs = [0.4, -0.2, 0.8];
  const [t, setT] = useState(0);
  let h = 0;
  const hist = xs.map((x, i) => {
    h = Math.tanh(0.7 * h + 0.9 * x);
    return { i, x, h };
  });
  const now = hist[t]!;
  return (
    <div className="ts-demo">
      <Slider label="Time step" value={t} min={0} max={2} step={1} onChange={setT} />
      <ol className="ts-flow">
        {hist.map((row) => (
          <li key={row.i} className={row.i === t ? 'is-on' : ''}>
            x{row.i + 1} = {row.x.toFixed(1)} → h{row.i + 1} = {row.h.toFixed(2)}
          </li>
        ))}
      </ol>
      <Readout>
        Step {t + 1}: hidden state carries the past ({now.h.toFixed(2)}). Same weights, new input.
      </Readout>
    </div>
  );
}

function VanishDemo() {
  const [layers, setLayers] = useState(8);
  const [factor, setFactor] = useState(0.6);
  let g = 1;
  const path = Array.from({ length: layers }, (_, i) => {
    g *= factor;
    return { i: i + 1, g };
  });
  return (
    <div className="ts-demo">
      <Slider label="Steps / layers" value={layers} min={3} max={16} step={1} onChange={setLayers} />
      <Slider label="Typical |∂h/∂h| per step" value={factor} min={0.4} max={1.2} step={0.05} onChange={setFactor} />
      <div className="ts-vanish">
        {path.map((p) => (
          <i key={p.i} style={{ height: `${Math.min(100, Math.abs(p.g) * 100)}%` }} title={`step ${p.i}: ${p.g.toExponential(2)}`} />
        ))}
      </div>
      <Readout>
        Gradient after {layers} multiplications ≈ {path[path.length - 1]!.g.toExponential(2)}. It shrinks over many steps; it does not snap to zero in one hop. |factor| &gt; 1 can explode instead.
      </Readout>
    </div>
  );
}

function LstmDemo() {
  const [forget, setForget] = useState(0.7);
  const [input, setInput] = useState(0.4);
  const [cand, setCand] = useState(0.8);
  const [output, setOutput] = useState(0.6);
  const [prevC, setPrevC] = useState(0.5);
  const c = forget * prevC + input * cand;
  const h = output * Math.tanh(c);
  return (
    <div className="ts-demo">
      <div className="ts-slider-grid">
        <Slider label="Forget gate" value={forget} min={0} max={1} step={0.05} onChange={setForget} />
        <Slider label="Input gate" value={input} min={0} max={1} step={0.05} onChange={setInput} />
        <Slider label="Candidate" value={cand} min={-1} max={1} step={0.05} onChange={setCand} />
        <Slider label="Output gate" value={output} min={0} max={1} step={0.05} onChange={setOutput} />
        <Slider label="Previous cell" value={prevC} min={-1} max={1} step={0.05} onChange={setPrevC} />
      </div>
      <ol className="ts-flow">
        <li>Keep {forget.toFixed(2)} of old cell</li>
        <li>Write {input.toFixed(2)} × candidate {cand.toFixed(2)}</li>
        <li>Cell c = <strong>{c.toFixed(2)}</strong></li>
        <li>Hidden = output × tanh(c) = <strong>{h.toFixed(2)}</strong></li>
      </ol>
    </div>
  );
}

const TOKENS = ['The', 'cat', 'sat'];

function SelfAttentionDemo() {
  const [q, setQ] = useState(1);
  const weights = [
    [0.7, 0.2, 0.1],
    [0.15, 0.7, 0.15],
    [0.1, 0.25, 0.65],
  ];
  const row = weights[q] ?? weights[0]!;
  return (
    <div className="ts-demo">
      <Choice
        label="Query token"
        value={String(q)}
        options={TOKENS.map((t, i) => ({ id: String(i), label: t }))}
        onChange={(id) => setQ(Number(id))}
      />
      <div className="ts-attn-keys">
        {TOKENS.map((token, i) => (
          <div key={token} className={i === q ? 'is-hot' : ''}>
            <em>{token}</em>
            <strong>{((row[i] ?? 0) * 100).toFixed(0)}%</strong>
            <small>weight</small>
          </div>
        ))}
      </div>
      <Readout>
        “{TOKENS[q]}” attends inside the same sentence. Darker share = more weight. Connects to the Transformer lab.
      </Readout>
    </div>
  );
}

function QkvDemo() {
  const [i, setI] = useState(0);
  const table = [
    { q: 'looking for animal?', k: 'animal-ish', v: 'cat features' },
    { q: 'looking for animal?', k: 'animal', v: 'cat vector' },
    { q: 'looking for verb?', k: 'action', v: 'sat vector' },
  ];
  const row = table[i]!;
  return (
    <div className="ts-demo">
      <Choice
        label="Token"
        value={String(i)}
        options={TOKENS.map((t, idx) => ({ id: String(idx), label: t }))}
        onChange={(id) => setI(Number(id))}
      />
      <div className="ts-qkv">
        <article><strong>Query</strong><p>What am I looking for?</p><em>{row.q}</em></article>
        <article><strong>Key</strong><p>What do I contain?</p><em>{row.k}</em></article>
        <article><strong>Value</strong><p>What do I provide?</p><em>{row.v}</em></article>
      </div>
      <Readout>Match query to keys, then mix the values. Numbers in the Transformer lab are hashed educational scores, not a pretrained model.</Readout>
    </div>
  );
}

function PositionalDemo() {
  const [pos, setPos] = useState(0);
  const dims = [0, 1, 2, 3];
  return (
    <div className="ts-demo">
      <Slider label="Token position" value={pos} min={0} max={7} step={1} onChange={setPos} />
      <div className="ts-pos">
        {dims.map((d) => {
          const v = d % 2 === 0 ? Math.sin(pos / 2 ** d) : Math.cos(pos / 2 ** (d - 1));
          return (
            <span key={d}>
              <i style={{ height: `${(v * 0.5 + 0.5) * 100}%` }} />
              <small>d{d}</small>
            </span>
          );
        })}
      </div>
      <Readout>
        Self-attention has no built-in order. Sine/cosine offsets tag position {pos}. Without them, “cat sat the” would look like “the cat sat”.
      </Readout>
    </div>
  );
}

function TransferFamily({ mode }: { mode: 'transfer' | 'finetune' }) {
  const [unfreeze, setUnfreeze] = useState(mode === 'finetune' ? 1 : 0);
  return (
    <div className="ts-demo">
      <ol className="ts-flow ts-pipe">
        <li>Pretrained backbone (features)</li>
        <li>{unfreeze ? 'Unfreeze some/all layers' : 'Keep backbone frozen'}</li>
        <li>New head for the target task</li>
        <li>Train on the small target set</li>
      </ol>
      {mode === 'finetune' && (
        <Choice
          label="Backbone"
          value={unfreeze ? 'tune' : 'extract'}
          options={[
            { id: 'extract', label: 'Feature extraction' },
            { id: 'tune', label: 'Fine-tune' },
          ]}
          onChange={(id) => setUnfreeze(id === 'tune' ? 1 : 0)}
        />
      )}
      <Readout>
        {unfreeze
          ? 'Fine-tuning updates reused layers. Feature extraction only trains the new head. Open the Transfer Learning lab for the full story.'
          : 'Reuse features, adapt the head. Compact version of the Transfer Learning page — not a second studio.'}
      </Readout>
    </div>
  );
}

function NeuronPlusDemo({ highlight }: { highlight?: 'weights' | 'bias' }) {
  const [x1, setX1] = useState(1);
  const [x2, setX2] = useState(0.4);
  const [x3, setX3] = useState(0.2);
  const [w1, setW1] = useState(0.8);
  const [w2, setW2] = useState(-0.5);
  const [w3, setW3] = useState(0.3);
  const [b, setB] = useState(-0.2);
  const z = w1 * x1 + w2 * x2 + w3 * x3 + b;
  const y = 1 / (1 + Math.exp(-z));
  return (
    <div className="ts-demo">
      <div className="ts-slider-grid">
        <Slider label="x1" value={x1} min={0} max={1} step={0.1} onChange={setX1} />
        <Slider label="x2" value={x2} min={0} max={1} step={0.1} onChange={setX2} />
        <Slider label="x3" value={x3} min={0} max={1} step={0.1} onChange={setX3} />
        <Slider label="w1" value={w1} min={-2} max={2} step={0.1} onChange={setW1} />
        <Slider label="w2" value={w2} min={-2} max={2} step={0.1} onChange={setW2} />
        <Slider label="w3" value={w3} min={-2} max={2} step={0.1} onChange={setW3} />
        <Slider label="bias b" value={b} min={-2} max={2} step={0.1} onChange={setB} />
      </div>
      <Readout>
        z = Σ wᵢxᵢ + b = <strong>{z.toFixed(2)}</strong> → σ(z) = <strong>{y.toFixed(2)}</strong>.
        {highlight === 'weights' && ' Weights scale and flip each input.'}
        {highlight === 'bias' && ' Bias shifts the threshold — the neuron fires sooner or later even if inputs stay put.'}
      </Readout>
    </div>
  );
}

function EpochVisualDemo() {
  const n = 100;
  const [batch, setBatch] = useState(20);
  const batches = Math.ceil(n / batch);
  return (
    <div className="ts-demo">
      <Slider label="Batch size" value={batch} min={5} max={50} step={5} onChange={setBatch} />
      <div className="ts-epoch-strip" aria-hidden="true">
        {Array.from({ length: batches }, (_, i) => (
          <span key={i}>B{i + 1}</span>
        ))}
      </div>
      <Readout>
        {n} samples ÷ {batch} = {batches} iterations in one epoch. An iteration is one parameter update; an epoch is one full pass. Small batches → more updates; large batches → fewer, stabler gradients. Exact accuracy is not determined by batch size alone.
      </Readout>
    </div>
  );
}

function LossSwitchDemo() {
  const [kind, setKind] = useState<'mse' | 'mae' | 'ce'>('mse');
  const [pred, setPred] = useState(0.7);
  const target = kind === 'ce' ? 1 : 0.2;
  const mse = (pred - target) ** 2;
  const mae = Math.abs(pred - target);
  const ce = -(target * Math.log(Math.max(pred, 1e-6)) + (1 - target) * Math.log(Math.max(1 - pred, 1e-6)));
  const value = kind === 'mse' ? mse : kind === 'mae' ? mae : ce;
  return (
    <div className="ts-demo">
      <Choice
        label="Loss"
        value={kind}
        options={[
          { id: 'mse', label: 'MSE' },
          { id: 'mae', label: 'MAE' },
          { id: 'ce', label: 'Cross-entropy' },
        ]}
        onChange={(id) => setKind(id as typeof kind)}
      />
      <Slider label={kind === 'ce' ? 'Predicted P(class)' : 'Prediction'} value={pred} min={0.01} max={1.5} step={0.01} onChange={setPred} />
      <Readout>
        Target {target}. Loss = <strong>{value.toFixed(3)}</strong>.
        {kind === 'mse' && ' Squared gap — outliers shout.'}
        {kind === 'mae' && ' Absolute gap — calmer on outliers.'}
        {kind === 'ce' && ' How surprised the classifier is that the true class is 1.'}
      </Readout>
    </div>
  );
}

function FitTrioDemo() {
  const [mode, setMode] = useState<'under' | 'good' | 'over'>('good');
  const xs = [0, 1, 2, 3, 4, 5];
  const y = [0.2, 1.1, 1.8, 3.4, 3.1, 4.6];
  const pred = (x: number) => {
    if (mode === 'under') return 0.7 * x + 0.4;
    if (mode === 'good') return 0.15 + 0.85 * x;
    return 0.2 + 0.2 * x + 0.35 * Math.sin(3 * x) + (x === 3 ? 0.9 : 0);
  };
  const trainErr = xs.reduce((s, x, i) => s + (pred(x) - y[i]!) ** 2, 0) / xs.length;
  const valErr = mode === 'under' ? 1.1 : mode === 'good' ? 0.22 : 0.95;
  return (
    <div className="ts-demo">
      <Choice
        label="Fit"
        value={mode}
        options={[
          { id: 'under', label: 'Underfit' },
          { id: 'good', label: 'Good fit' },
          { id: 'over', label: 'Overfit' },
        ]}
        onChange={(id) => setMode(id as typeof mode)}
      />
      <svg className="ts-svg" viewBox="0 0 168 100" role="img" aria-label="Fit comparison">
        {xs.map((x, i) => (
          <circle key={x} cx={16 + x * 28} cy={90 - y[i]! * 16} r="4" className="ts-pt-b" />
        ))}
        <polyline
          className="ts-svg-line"
          fill="none"
          points={Array.from({ length: 24 }, (_, i) => {
            const x = i * 0.25;
            return `${16 + x * 28},${90 - pred(x) * 16}`;
          }).join(' ')}
        />
      </svg>
      <Metrics
        items={[
          { label: 'Train error', value: trainErr.toFixed(2) },
          { label: 'Val error', value: valErr.toFixed(2) },
        ]}
      />
      <Readout>
        Same six points. Underfit misses the trend; overfit chases jitter and validation error climbs.
      </Readout>
    </div>
  );
}

export const TERM_CONCEPT_KINDS: TermDemoKind[] = [
  'decision-boundary',
  'confusion-matrix',
  'roc-curve',
  'precision-recall',
  'f1-score',
  'accuracy-trap',
  'regularize-l1l2',
  'standardize',
  'minmax',
  'split-percents',
  'kfold-blocks',
  'imbalance',
  'oversample',
  'undersample',
  'smote',
  'kernel-trick',
  'support-vector',
  'margin',
  'entropy-gini',
  'information-gain',
  'pruning',
  'bootstrap',
  'bagging',
  'boosting',
  'feature-importance',
  'shap-waterfall',
  'label-encoding',
  'euclidean',
  'manhattan',
  'convolution',
  'filter-kernel',
  'stride',
  'conv-padding',
  'pooling',
  'feature-map',
  'rnn-step',
  'vanishing-grad',
  'lstm-cell',
  'self-attention',
  'qkv',
  'positional',
  'transfer-compact',
  'fine-tune',
  'neuron-plus',
  'weights-bias',
  'epoch-visual',
  'loss-switch',
  'fit-trio',
];

export function isTermConceptKind(kind: TermDemoKind) {
  return TERM_CONCEPT_KINDS.includes(kind);
}

export function TermConceptDemo({ kind, variant }: { kind: TermDemoKind; variant?: string }) {
  switch (kind) {
    case 'decision-boundary':
      return <DecisionBoundaryDemo />;
    case 'confusion-matrix':
      return <ConfusionFamily mode="matrix" />;
    case 'precision-recall':
      return <ConfusionFamily mode="precision-recall" />;
    case 'f1-score':
      return variant === 'sliders' ? <F1SliderDemo /> : <ConfusionFamily mode="f1" />;
    case 'accuracy-trap':
      return <AccuracyTrapDemo />;
    case 'roc-curve':
      return <RocDemo />;
    case 'regularize-l1l2':
      return <RegularizeDemo />;
    case 'standardize':
      return <ScaleFamily mode="z" />;
    case 'minmax':
      return <ScaleFamily mode="minmax" />;
    case 'split-percents':
      return <SplitPercentsDemo />;
    case 'kfold-blocks':
      return <KFoldDemo />;
    case 'imbalance':
      return <ImbalanceDemo />;
    case 'oversample':
      return <SamplingDemo mode="over" />;
    case 'undersample':
      return <SamplingDemo mode="under" />;
    case 'smote':
      return <SmoteDemo />;
    case 'kernel-trick':
      return <KernelTrickDemo />;
    case 'support-vector':
      return <SvmFamily mode="sv" />;
    case 'margin':
      return <SvmFamily mode="margin" />;
    case 'entropy-gini':
      return <ImpurityDemo mode={variant === 'gini' ? 'gini' : variant === 'both' ? 'both' : 'entropy'} />;
    case 'information-gain':
      return <InfoGainDemo />;
    case 'pruning':
      return <PruneDemo />;
    case 'bootstrap':
      return <BootstrapDemo />;
    case 'bagging':
      return <BaggingDemo />;
    case 'boosting':
      return <BoostingDemo />;
    case 'feature-importance':
      return <ImportanceDemo />;
    case 'shap-waterfall':
      return <ShapDemo />;
    case 'label-encoding':
      return <LabelEncodeDemo />;
    case 'euclidean':
      return <DistanceDemo metric="euclidean" />;
    case 'manhattan':
      return <DistanceDemo metric="manhattan" />;
    case 'convolution':
      return <ConvFamily mode="conv" />;
    case 'filter-kernel':
      return <ConvFamily mode="filter" />;
    case 'stride':
      return <ConvFamily mode="stride" />;
    case 'conv-padding':
      return <ConvFamily mode="pad" />;
    case 'pooling':
      return <PoolDemo />;
    case 'feature-map':
      return <ConvFamily mode="map" />;
    case 'rnn-step':
      return <RnnDemo />;
    case 'vanishing-grad':
      return <VanishDemo />;
    case 'lstm-cell':
      return <LstmDemo />;
    case 'self-attention':
      return <SelfAttentionDemo />;
    case 'qkv':
      return <QkvDemo />;
    case 'positional':
      return <PositionalDemo />;
    case 'transfer-compact':
      return <TransferFamily mode="transfer" />;
    case 'fine-tune':
      return <TransferFamily mode="finetune" />;
    case 'neuron-plus':
      return <NeuronPlusDemo />;
    case 'weights-bias':
      return <NeuronPlusDemo highlight={variant === 'bias' ? 'bias' : 'weights'} />;
    case 'epoch-visual':
      return <EpochVisualDemo />;
    case 'loss-switch':
      return <LossSwitchDemo />;
    case 'fit-trio':
      return <FitTrioDemo />;
    default:
      return <p className="ts-demo-readout">No concept visual for this term yet.</p>;
  }
}
