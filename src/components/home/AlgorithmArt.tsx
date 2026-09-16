import { useId, type ReactNode } from "react";

/**
 * Wide preview artwork for the landing page algorithm cards. Every drawing is
 * authored for a light card surface, unlike the small dark-theme glyphs in
 * `components/common/AlgorithmGlyph`.
 */

const W = 220;
const H = 76;

const C = {
  blue: "#3b82f6",
  blueSoft: "#93c5fd",
  indigo: "#6366f1",
  purple: "#8b5cf6",
  purpleSoft: "#c4b5fd",
  violet: "#a78bfa",
  pink: "#ec4899",
  red: "#ef4444",
  redSoft: "#fca5a5",
  green: "#10b981",
  greenSoft: "#6ee7b7",
  teal: "#14b8a6",
  amber: "#f59e0b",
  orange: "#fb923c",
  line: "#cbd5e1",
  faint: "#e2e8f0",
  navy: "#1e3a8a",
};

/** Deterministic scatter so cards never shimmer between renders. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

type Pt = { x: number; y: number };

function cloud(seed: number, count: number, cx: number, cy: number, sx: number, sy: number): Pt[] {
  const next = rng(seed);
  return Array.from({ length: count }, () => {
    const a = next() * Math.PI * 2;
    const r = Math.sqrt(next());
    return { x: cx + Math.cos(a) * r * sx, y: cy + Math.sin(a) * r * sy };
  });
}

function Dots({ pts, fill, r = 2.1, opacity = 0.9 }: { pts: Pt[]; fill: string; r?: number; opacity?: number }) {
  return (
    <>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(2)} cy={p.y.toFixed(2)} r={r} fill={fill} opacity={opacity} />
      ))}
    </>
  );
}

function Nodes({ pts, fill, r = 4 }: { pts: Pt[]; fill: string; r?: number }) {
  return (
    <>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={r} fill={fill} />
      ))}
    </>
  );
}

function Edges({ from, to, stroke, width = 0.9, opacity = 0.5 }: { from: Pt[]; to: Pt[]; stroke: string; width?: number; opacity?: number }) {
  return (
    <>
      {from.map((a, i) =>
        to.map((b, j) => (
          <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={width} opacity={opacity} />
        )),
      )}
    </>
  );
}

function column(x: number, count: number, top = 12, bottom = 64): Pt[] {
  if (count === 1) return [{ x, y: (top + bottom) / 2 }];
  const step = (bottom - top) / (count - 1);
  return Array.from({ length: count }, (_, i) => ({ x, y: top + step * i }));
}

/**
 * Card titles and the level badge own the left third of every card, so drawings
 * live in the right-biased region that starts here.
 */
const PX = 78;

function layered(cols: number[], color: string, edge: string, radius = 4, left = PX) {
  const gap = (W - 12 - left) / (cols.length - 1);
  const groups = cols.map((n, i) => column(left + gap * i, n));
  return (
    <>
      {groups.slice(0, -1).map((g, i) => (
        <Edges key={i} from={g} to={groups[i + 1]} stroke={edge} />
      ))}
      {groups.map((g, i) => (
        <Nodes key={i} pts={g} fill={i === 0 || i === groups.length - 1 ? edge : color} r={radius} />
      ))}
    </>
  );
}

function axes(x0 = PX) {
  return <path d={`M${x0} ${H - 9} H ${W - 10} M${x0} 9 V ${H - 9}`} stroke={C.faint} strokeWidth="1" />;
}

/**
 * Cluster drawn as a starburst: faint spokes from the centroid out to every
 * member point, matching the clustering cards in the reference design.
 */
function Burst({
  seed,
  count,
  cx,
  cy,
  sx,
  sy,
  fill,
  r = 1.7,
}: {
  seed: number;
  count: number;
  cx: number;
  cy: number;
  sx: number;
  sy: number;
  fill: string;
  r?: number;
}) {
  const pts = cloud(seed, count, cx, cy, sx, sy);
  return (
    <>
      <g stroke={fill} strokeWidth="0.6" opacity="0.5">
        {pts.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(2)} y2={p.y.toFixed(2)} />
        ))}
      </g>
      <Dots pts={pts} fill={fill} r={r} />
      <circle cx={cx} cy={cy} r={r + 0.6} fill={fill} />
    </>
  );
}

/** Small binary tree used by the tree-ensemble cards. */
function Tree({ cx, top, spread, gap, stroke, r }: { cx: number; top: number; spread: number; gap: number; stroke: string; r: number }) {
  const rows = [
    [cx],
    [cx - spread, cx + spread],
    [cx - spread * 1.5, cx - spread * 0.5, cx + spread * 0.5, cx + spread * 1.5],
  ];
  return (
    <>
      <g stroke={stroke} strokeWidth="0.9" opacity="0.85">
        {rows[1].map((x, i) => (
          <line key={`a${i}`} x1={cx} y1={top} x2={x} y2={top + gap} />
        ))}
        {rows[2].map((x, i) => (
          <line key={`b${i}`} x1={rows[1][i < 2 ? 0 : 1]} y1={top + gap} x2={x} y2={top + gap * 2} />
        ))}
      </g>
      {rows.flatMap((row, depth) =>
        row.map((x) => (
          <circle
            key={`${depth}-${x}`}
            cx={x}
            cy={top + gap * depth}
            r={r - depth * 0.35}
            fill="#fff"
            stroke={stroke}
            strokeWidth="1.1"
          />
        )),
      )}
    </>
  );
}

type Draw = (id: string) => ReactNode;

const art: Record<string, Draw> = {
  /* ---------------------------------------------------- supervised */
  "simple-linear-regression": () => {
    const next = rng(7);
    const pts = Array.from({ length: 24 }, () => {
      const x = 92 + next() * 104;
      return { x, y: 58 - (x - 92) * 0.34 + (next() - 0.5) * 17 };
    });
    return (
      <>
        {axes()}
        <Dots pts={pts} fill={C.blue} r={1.8} />
        <path d="M88 62 L200 24" stroke={C.blue} strokeWidth="2.1" strokeLinecap="round" />
      </>
    );
  },
  "logistic-regression": () => (
    <>
      {axes()}
      <Dots pts={cloud(21, 28, 116, 42, 24, 19)} fill={C.blue} r={1.8} />
      <Dots pts={cloud(33, 28, 172, 34, 24, 19)} fill={C.red} r={1.8} />
      <path d="M128 66 L166 10" stroke={C.redSoft} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  "decision-tree": () => (
    <Tree cx={146} top={18} spread={22} gap={20} stroke={C.navy} r={6.4} />
  ),
  "random-forest": () => (
    <>
      <Tree cx={112} top={30} spread={12} gap={15} stroke={C.violet} r={4.4} />
      <Tree cx={172} top={20} spread={16} gap={19} stroke={C.blue} r={5.2} />
    </>
  ),
  svm: () => (
    <>
      <line x1={78} y1={40} x2={104} y2={40} stroke={C.faint} strokeWidth="1" />
      <path d="M112 70 L146 8" stroke={C.pink} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M134 70 L168 8" stroke={C.teal} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M152 70 L186 8" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round" />
      <Dots pts={cloud(11, 15, 116, 28, 16, 15)} fill={C.red} r={1.7} />
      <Dots pts={cloud(19, 15, 176, 48, 17, 15)} fill={C.blue} r={1.7} />
    </>
  ),
  "neural-network": () => layered([4, 5, 5, 3], C.purpleSoft, C.blue, 4.6, 66),

  /* -------------------------------------------------- unsupervised */
  "k-means": () => (
    <>
      <Burst seed={9} count={24} cx={116} cy={24} sx={22} sy={15} fill={C.purple} />
      <Burst seed={5} count={24} cx={128} cy={58} sx={24} sy={14} fill={C.pink} />
      <Burst seed={13} count={24} cx={182} cy={34} sx={24} sy={18} fill={C.amber} />
    </>
  ),
  "hierarchical-clustering": () => {
    const base = 68;
    const leaf = (x: number) => ({ x, y: base });
    // Each merge lifts a bracket to `y`, joining two sub-clusters.
    const join = (a: { x: number; y: number }, b: { x: number; y: number }, y: number) => ({
      x: (a.x + b.x) / 2,
      y,
      d: `M${a.x} ${a.y} V${y} H${b.x} V${b.y}`,
    });

    const m1 = join(leaf(86), leaf(104), 52);
    const m2 = join(leaf(122), leaf(140), 56);
    const m3 = join(m2, leaf(158), 42);
    const m4 = join(leaf(176), leaf(196), 50);
    const m5 = join(m1, m3, 28);
    const m6 = join(m5, m4, 14);

    return (
      <>
        <line x1="80" y1={base} x2="202" y2={base} stroke={C.faint} strokeWidth="1" />
        <g stroke="#9db4d4" strokeWidth="1.4" fill="none">
          {[m1, m2, m3, m4, m5, m6].map((m) => (
            <path key={m.d} d={m.d} />
          ))}
        </g>
        {[86, 104, 122, 140, 158, 176, 196].map((x) => (
          <circle key={x} cx={x} cy={base} r={2.2} fill="#9db4d4" />
        ))}
      </>
    );
  },
  pca: (id) => {
    const next = rng(41);
    const pts = Array.from({ length: 42 }, () => {
      const t = next() * 96;
      const off = (next() - 0.5) * 24;
      return { x: 98 + t + off * 0.45, y: 58 - t * 0.3 + off };
    });
    return (
      <>
        <defs>
          <marker id={`${id}h`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill={C.purple} />
          </marker>
        </defs>
        <Dots pts={pts} fill={C.violet} r={1.8} />
        {/* First and second principal components, crossing at the data mean. */}
        <path d="M92 60 L202 26" stroke={C.purple} strokeWidth="1.8" markerEnd={`url(#${id}h)`} />
        <path d="M126 12 L162 68" stroke={C.purple} strokeWidth="1.3" opacity="0.6" markerEnd={`url(#${id}h)`} />
      </>
    );
  },
  tsne: () => (
    <>
      <Burst seed={61} count={30} cx={122} cy={38} sx={24} sy={20} fill={C.blue} />
      <Burst seed={67} count={30} cx={180} cy={38} sx={22} sy={20} fill={C.pink} />
    </>
  ),
  dbscan: () => (
    <>
      <Burst seed={83} count={32} cx={118} cy={40} sx={26} sy={20} fill={C.green} />
      <Burst seed={89} count={22} cx={180} cy={36} sx={18} sy={16} fill={C.blue} />
      <Dots
        pts={[
          { x: 150, y: 16 },
          { x: 158, y: 62 },
          { x: 198, y: 62 },
          { x: 204, y: 22 },
        ]}
        fill="#94a3b8"
        r={1.8}
      />
    </>
  ),
  autoencoder: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor={C.purple} stopOpacity="0.55" />
          <stop offset="1" stopColor={C.purple} stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor={C.blue} stopOpacity="0.18" />
          <stop offset="1" stopColor={C.blue} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path d="M78 14 L138 33 V43 L78 62 Z" fill={`url(#${id}l)`} />
      <path d="M200 14 L146 33 V43 L200 62 Z" fill={`url(#${id}r)`} />
      <line x1={138} y1={38} x2={146} y2={38} stroke={C.purpleSoft} strokeWidth="1.4" />
      <circle cx={142} cy={38} r={5} fill={C.purple} opacity="0.85" />
      {column(78, 3, 18, 58).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4.4} fill={C.purple} />
      ))}
      {column(200, 3, 18, 58).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4.4} fill={C.blue} />
      ))}
    </>
  ),

  /* ------------------------------------------------- deep learning */
  "feedforward-nn": () => layered([4, 5, 4, 2], C.purpleSoft, C.purple, 4.6, 74),
  cnn: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={C.purpleSoft} />
          <stop offset="1" stopColor={C.purple} />
        </linearGradient>
        <marker id={`${id}a`} markerWidth="5" markerHeight="5" refX="4.4" refY="2.5" orient="auto">
          <path d="M0 0 L5 2.5 L0 5 Z" fill="#3f3f6b" />
        </marker>
      </defs>
      {/* Input volume, a pooled slab, then the flattened classifier plate. */}
      <g>
        <path d="M80 26 L90 20 H120 L110 26 Z" fill={C.purpleSoft} opacity="0.8" />
        <path d="M110 26 L120 20 V50 L110 56 Z" fill={C.purple} opacity="0.45" />
        <rect x="80" y="26" width="30" height="30" rx="2" fill={`url(#${id}s)`} opacity="0.92" />
      </g>
      <path d="M124 41 H136" stroke="#3f3f6b" strokeWidth="1.2" markerEnd={`url(#${id}a)`} />
      <rect x="140" y="24" width="8" height="34" rx="2" fill={C.blue} opacity="0.8" />
      <g>
        <path d="M154 24 L162 18 H186 L178 24 Z" fill={C.purpleSoft} opacity="0.5" />
        <path d="M178 24 L186 18 V50 L178 56 Z" fill={C.purple} opacity="0.22" />
        <rect x="154" y="24" width="24" height="32" rx="2" fill={C.purpleSoft} opacity="0.4" />
        <path d="M154 40 H178 M166 24 V56" stroke={C.purple} strokeWidth="0.7" opacity="0.5" />
      </g>
      <path d="M190 41 H198" stroke="#3f3f6b" strokeWidth="1.2" markerEnd={`url(#${id}a)`} />
      <rect x="202" y="26" width="7" height="30" rx="2" fill={C.blue} opacity="0.85" />
    </>
  ),
  rnn: () => {
    const xs = [92, 118, 144, 170];
    return (
      <>
        {/* Recurrent hop above each cell, feeding the next timestep. */}
        {xs.map((x) => (
          <path
            key={`arc${x}`}
            d={`M${x - 6} 34 A 9 9 0 0 1 ${x + 6} 34`}
            stroke={C.purpleSoft}
            strokeWidth="1.2"
            fill="none"
            opacity="0.8"
          />
        ))}
        {xs.slice(0, -1).map((x, i) => (
          <line key={i} x1={x + 8} y1={42} x2={xs[i + 1] - 8} y2={42} stroke={C.violet} strokeWidth="1.4" />
        ))}
        {xs.map((x) => (
          <circle key={x} cx={x} cy={42} r={7} fill={C.violet} />
        ))}
        <line x1={178} y1={42} x2={192} y2={42} stroke={C.violet} strokeWidth="1.4" />
        <circle cx={198} cy={42} r={5.5} fill={C.blue} />
      </>
    );
  },
  lstm: () => {
    const xs = [96, 126, 156, 186];
    const rails = [26, 56];
    return (
      <>
        <g stroke={C.greenSoft} strokeWidth="1.3">
          {rails.map((y) => (
            <line key={y} x1={82} y1={y} x2={196} y2={y} />
          ))}
          {xs.map((x) => (
            <line key={x} x1={x} y1={rails[0]} x2={x} y2={rails[1]} />
          ))}
        </g>
        {rails.flatMap((y) =>
          xs.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r={4.6} fill={C.greenSoft} stroke={C.green} strokeWidth="1.2" />),
        )}
        <path d="M192 22 A 9 9 0 0 1 202 14" stroke={C.green} strokeWidth="1.4" fill="none" />
        <path d="M198 12 L204 13 L202 19 Z" fill={C.green} />
      </>
    );
  },
  transformer: (id) => (
    <>
      <defs>
        <marker id={`${id}t`} markerWidth="5" markerHeight="5" refX="4.4" refY="2.5" orient="auto">
          <path d="M0 0 L5 2.5 L0 5 Z" fill={C.purple} />
        </marker>
      </defs>
      {/* Two encoder blocks feeding a taller decoder stack. */}
      {[
        { x: 88, y: 24, h: 32 },
        { x: 132, y: 24, h: 32 },
      ].map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={b.y} width={26} height={b.h} rx="4" fill={C.purpleSoft} opacity="0.4" stroke={C.purple} strokeWidth="1.2" />
          <path
            d={`M${b.x + 13} ${b.y + 5} V${b.y + b.h - 5}`}
            stroke={C.purple}
            strokeWidth="0.8"
            strokeDasharray="2 3"
            opacity="0.8"
          />
          <path d={`M${b.x + 7} ${b.y + 16} H${b.x + 19}`} stroke={C.purple} strokeWidth="0.9" opacity="0.7" />
        </g>
      ))}
      <path d="M118 40 H126" stroke={C.purple} strokeWidth="1.2" markerEnd={`url(#${id}t)`} />
      <path d="M162 40 H170" stroke={C.purple} strokeWidth="1.2" markerEnd={`url(#${id}t)`} />
      <rect x="174" y="16" width="28" height="48" rx="6" fill="#fff" stroke={C.purple} strokeWidth="1.4" />
      <circle cx={188} cy={30} r={5} fill={C.purpleSoft} />
      <rect x="180" y="42" width="16" height="14" rx="3" fill={C.purple} opacity="0.6" />
    </>
  ),
  attention: () => (
    <>
      {[0, 1, 2].map((row) => {
        const y = 24 + row * 16;
        const tone = [C.blue, C.purple, C.pink][row];
        return (
          <g key={row}>
            <rect x="82" y={y - 6} width="14" height="12" rx="3" fill="#fff" stroke={tone} strokeWidth="1.2" />
            <rect x="192" y={y - 6} width="14" height="12" rx="3" fill="#fff" stroke={tone} strokeWidth="1.2" />
            <line x1="96" y1={y} x2="192" y2={y} stroke={tone} strokeWidth="1.2" opacity="0.5" />
            {[118, 144, 170].map((x) => (
              <circle key={x} cx={x} cy={y} r={3.2} fill={tone} opacity="0.9" />
            ))}
          </g>
        );
      })}
    </>
  ),

  /* ------------------------------------------------- shared shapes */
  bars: () => (
    <>
      {axes()}
      {[
        { x: 86, h: 20, c: C.blueSoft },
        { x: 106, h: 34, c: C.blue },
        { x: 126, h: 26, c: C.indigo },
        { x: 146, h: 44, c: C.violet },
        { x: 166, h: 32, c: C.purple },
        { x: 186, h: 14, c: C.purpleSoft },
      ].map((b) => (
        <rect key={b.x} x={b.x} y={64 - b.h} width="14" height={b.h} rx="3" fill={b.c} />
      ))}
    </>
  ),
  curve: () => (
    <>
      {axes()}
      <path d="M84 62 C 122 60, 130 22, 202 16" stroke={C.blue} strokeWidth="2.1" fill="none" strokeLinecap="round" />
      <path d="M84 62 C 122 60, 130 22, 202 16 L202 66 L84 66 Z" fill={C.blue} opacity="0.09" />
    </>
  ),
  series: () => (
    <>
      {axes()}
      <path d="M84 50 L102 34 L120 44 L138 22 L156 38 L174 20 L190 30 L202 18" stroke={C.teal} strokeWidth="1.9" fill="none" strokeLinecap="round" />
      {[
        { x: 102, y: 34 },
        { x: 138, y: 22 },
        { x: 174, y: 20 },
      ].map((p) => (
        <circle key={p.x} cx={p.x} cy={p.y} r={2.8} fill={C.teal} />
      ))}
    </>
  ),
  text: () => (
    <>
      {[
        { y: 20, w: 84 },
        { y: 34, w: 118 },
        { y: 48, w: 66 },
        { y: 62, w: 100 },
      ].map((r, i) => (
        <rect key={r.y} x="84" y={r.y - 5} width={r.w} height="9" rx="4.5" fill={i % 2 ? C.pink : C.redSoft} opacity={i % 2 ? 0.7 : 0.9} />
      ))}
    </>
  ),
  grid: () => (
    <>
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={96 + (i % 4) * 28}
          y={12 + Math.floor(i / 4) * 14}
          width="24"
          height="11"
          rx="2"
          fill={[5, 10].includes(i) ? C.blue : i === 15 ? C.green : "#fff"}
          stroke={C.line}
          strokeWidth="1.1"
        />
      ))}
    </>
  ),
  matrix: () => (
    <>
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x={96 + (i % 4) * 28}
          y={18 + Math.floor(i / 4) * 15}
          width="24"
          height="12"
          rx="2.5"
          fill={i % 3 === 0 ? C.amber : i % 3 === 1 ? C.orange : C.faint}
          opacity={i % 3 === 2 ? 1 : 0.8}
        />
      ))}
    </>
  ),
  descent: () => (
    <>
      {axes()}
      <path d="M86 14 C 118 14, 130 62, 152 62 C 176 62, 184 22, 202 18" stroke={C.line} strokeWidth="1.7" fill="none" />
      {[
        { x: 94, y: 18 },
        { x: 114, y: 34 },
        { x: 134, y: 54 },
        { x: 152, y: 61 },
      ].map((p, i) => (
        <circle key={p.x} cx={p.x} cy={p.y} r={3.4} fill={C.amber} opacity={0.4 + i * 0.2} />
      ))}
    </>
  ),
  vision: () => (
    <>
      <rect x="80" y="16" width="56" height="44" rx="6" fill="#fff" stroke={C.line} strokeWidth="1.4" />
      <circle cx="95" cy="29" r="4.2" fill={C.amber} />
      <path d="M83 55 L101 38 L112 48 L124 33 L133 45 V57 H83 Z" fill={C.greenSoft} opacity="0.8" />
      <rect x="148" y="22" width="54" height="11" rx="5.5" fill={C.blue} opacity="0.85" />
      <rect x="148" y="38" width="38" height="11" rx="5.5" fill={C.blueSoft} />
      <rect x="148" y="54" width="24" height="8" rx="4" fill={C.faint} />
    </>
  ),
  gauss: (id) => (
    <>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={C.amber} stopOpacity="0.75" />
          <stop offset="1" stopColor={C.amber} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {axes()}
      <path d="M82 64 C 112 64, 116 16, 140 16 C 164 16, 168 64, 196 64 Z" fill={`url(#${id}f)`} stroke={C.amber} strokeWidth="1.6" />
      <path d="M120 64 C 150 64, 154 26, 176 26 C 198 26, 202 64, 210 64 Z" fill={C.purple} opacity="0.14" stroke={C.purple} strokeWidth="1.4" />
    </>
  ),
  stack: () => (
    <>
      {[
        { y: 52, w: 118, c: C.blue },
        { y: 36, w: 92, c: C.indigo },
        { y: 20, w: 66, c: C.purple },
      ].map((b) => (
        <rect key={b.y} x={144 - b.w / 2} y={b.y} width={b.w} height="12" rx="4" fill={b.c} opacity="0.85" />
      ))}
      <path d="M144 32 V 24 M144 48 V 40" stroke={C.line} strokeWidth="1.4" />
    </>
  ),
  deploy: () => (
    <>
      <rect x="82" y="20" width="42" height="38" rx="6" fill="#fff" stroke={C.line} strokeWidth="1.4" />
      <path d="M92 45 L103 33 L114 45" stroke={C.blue} strokeWidth="1.7" fill="none" />
      <path d="M132 39 H170" stroke={C.blue} strokeWidth="1.7" strokeDasharray="5 4" />
      <path d="M164 33 L172 39 L164 45" stroke={C.blue} strokeWidth="1.7" fill="none" />
      <rect x="178" y="25" width="28" height="28" rx="8" fill={C.blue} opacity="0.15" stroke={C.blue} strokeWidth="1.4" />
      <circle cx="192" cy="39" r="4.6" fill={C.blue} />
    </>
  ),
  /** Anomaly detection: a series inside a tolerance band, with outliers flagged. */
  anomaly: () => (
    <>
      {axes()}
      <path d="M84 30 L204 24 L204 50 L84 56 Z" fill={C.teal} opacity="0.12" />
      <path d="M84 44 L104 38 L124 46 L144 36 L164 44 L184 34 L204 40" stroke={C.teal} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      {[
        { x: 116, y: 18 },
        { x: 172, y: 62 },
      ].map((p) => (
        <g key={p.x}>
          <circle cx={p.x} cy={p.y} r={5.4} fill={C.red} opacity="0.18" />
          <circle cx={p.x} cy={p.y} r={2.8} fill={C.red} />
        </g>
      ))}
    </>
  ),
  /** Smoothing: a noisy series with a smoothed trend drawn through it. */
  smooth: () => (
    <>
      {axes()}
      <path
        d="M84 48 L96 34 L108 52 L120 32 L132 50 L144 30 L156 46 L168 28 L180 44 L192 26 L204 38"
        stroke={C.faint}
        strokeWidth="1.4"
        fill="none"
      />
      <path d="M84 44 C 120 40, 150 34, 204 32" stroke={C.teal} strokeWidth="2.1" fill="none" strokeLinecap="round" />
    </>
  ),
  /** Bandit / policy search: arms with differing estimated payoffs. */
  bandit: () => (
    <>
      {[0, 1, 2, 3].map((i) => {
        const x = 92 + i * 30;
        const h = [16, 34, 24, 42][i];
        const best = i === 3;
        return (
          <g key={i}>
            <rect x={x} y={60 - h} width="18" height={h} rx="3" fill={best ? C.indigo : C.blueSoft} opacity={best ? 0.95 : 0.6} />
            <circle cx={x + 9} cy={60 - h - 6} r={3} fill={best ? C.indigo : C.line} />
          </g>
        );
      })}
      <line x1={84} y1={60} x2={204} y2={60} stroke={C.line} strokeWidth="1" />
    </>
  ),
  /** KNN: a query point with its neighbourhood radius over mixed classes. */
  knn: () => (
    <>
      {axes()}
      <Dots pts={cloud(23, 16, 112, 30, 22, 16)} fill={C.blue} r={1.8} />
      <Dots pts={cloud(29, 16, 176, 46, 22, 16)} fill={C.red} r={1.8} />
      <circle cx={146} cy={38} r={15} fill={C.violet} opacity="0.12" stroke={C.purple} strokeWidth="1.1" strokeDasharray="3 3" />
      <circle cx={146} cy={38} r={3.2} fill={C.purple} />
    </>
  ),
  /** Multinomial: three class clouds around a shared decision point. */
  multiclass: () => (
    <>
      {axes()}
      <Dots pts={cloud(37, 18, 108, 26, 18, 13)} fill={C.blue} r={1.8} />
      <Dots pts={cloud(43, 18, 122, 60, 18, 11)} fill={C.green} r={1.8} />
      <Dots pts={cloud(47, 18, 180, 36, 18, 15)} fill={C.red} r={1.8} />
      <g stroke={C.line} strokeWidth="1.2" strokeDasharray="3 3">
        <path d="M148 40 L120 12" />
        <path d="M148 40 L128 68" />
        <path d="M148 40 L206 40" />
      </g>
    </>
  ),
  /** Regularisation: coefficient bars pulled toward (or onto) zero. */
  shrink: () => {
    const zero = 42;
    const bars = [
      { x: 86, h: 22, s: 9 },
      { x: 104, h: -15, s: -5 },
      { x: 122, h: 28, s: 12 },
      { x: 140, h: -20, s: 0 },
      { x: 158, h: 13, s: 0 },
      { x: 176, h: -24, s: -9 },
      { x: 194, h: 17, s: 6 },
    ];
    return (
      <>
        <line x1={80} y1={zero} x2={W - 10} y2={zero} stroke={C.line} strokeWidth="1" />
        {bars.map((b) => (
          <g key={b.x}>
            <rect
              x={b.x}
              y={b.h > 0 ? zero - b.h : zero}
              width="11"
              height={Math.abs(b.h)}
              rx="2"
              fill={C.faint}
            />
            <rect
              x={b.x}
              y={b.s > 0 ? zero - b.s : zero}
              width="11"
              height={Math.abs(b.s)}
              rx="2"
              fill={b.s === 0 ? "transparent" : C.violet}
            />
            {b.s === 0 && <circle cx={b.x + 5.5} cy={zero} r={2.2} fill={C.purple} />}
          </g>
        ))}
      </>
    );
  },
  /** Boosting: a run of weak stumps under a rising score curve. */
  boost: () => (
    <>
      {axes()}
      {[86, 104, 122, 140, 158, 176, 194].map((x, i) => (
        <rect key={x} x={x} y={62 - (6 + i * 1.6)} width="11" height={6 + i * 1.6} rx="2" fill={C.blueSoft} opacity={0.5 + i * 0.07} />
      ))}
      <path d="M88 44 C 118 28, 150 20, 200 15" stroke={C.orange} strokeWidth="1.9" fill="none" strokeLinecap="round" />
      {[
        { x: 88, y: 44 },
        { x: 144, y: 23 },
        { x: 200, y: 15 },
      ].map((p) => (
        <circle key={p.x} cx={p.x} cy={p.y} r={2.6} fill={C.orange} />
      ))}
    </>
  ),
  /** Multiple regression: a fitted plane over a two-feature scatter. */
  plane: () => {
    const next = rng(97);
    const pts = Array.from({ length: 26 }, () => ({
      x: 92 + next() * 100,
      y: 22 + next() * 38,
    }));
    return (
      <>
        <path d="M84 52 L138 26 L204 34 L150 62 Z" fill={C.blue} opacity="0.14" stroke={C.blue} strokeWidth="1.2" />
        <Dots pts={pts} fill={C.blue} r={1.7} opacity={0.85} />
        <path d="M84 62 V 20 M84 62 H 206" stroke={C.faint} strokeWidth="1" />
      </>
    );
  },
  stars: () => (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d="M0 -8.4 L2.4 -2.7 L8.4 -2.2 L3.9 1.8 L5.2 8 L0 4.7 L-5.2 8 L-3.9 1.8 L-8.4 -2.2 L-2.4 -2.7 Z"
          transform={`translate(${92 + i * 26} 39)`}
          fill={i < 4 ? C.amber : C.faint}
        />
      ))}
    </>
  ),
};

const categoryArt: Record<string, keyof typeof art> = {
  "Supervised - Regression": "simple-linear-regression",
  "Supervised - Classification": "logistic-regression",
  Clustering: "k-means",
  "Dimensionality Reduction": "pca",
  "Deep Learning": "feedforward-nn",
  Evaluation: "curve",
  Preprocessing: "bars",
  "Time Series": "series",
  NLP: "text",
  "Computer Vision": "vision",
  Recommendation: "stars",
  "Reinforcement Learning": "grid",
  Explainability: "matrix",
  Optimization: "descent",
  Ensemble: "stack",
  Probabilistic: "gauss",
  Deployment: "deploy",
  Lab: "grid",
};

/** Route slug -> art key, for routes whose slug is not itself an art key. */
const bySlug: Record<string, keyof typeof art> = {
  "multiple-linear-regression": "plane",
  "polynomial-regression": "curve",
  "ridge-regression": "shrink",
  "lasso-regression": "shrink",
  "elastic-net-regression": "shrink",
  "decision-tree-regression": "decision-tree",
  "random-forest-regression": "random-forest",
  "gradient-boosting-regression": "boost",
  "support-vector-regression": "svm",
  "multinomial-logistic-regression": "multiclass",
  "knn-classification": "knn",
  "naive-bayes": "gauss",
  "decision-tree-classification": "decision-tree",
  "random-forest-classification": "random-forest",
  "svm-classification": "svm",
  "gradient-boosting-classification": "boost",
  "adaboost-classification": "boost",
  "xgboost-concept": "boost",
  "k-medoids": "k-means",
  "mean-shift": "k-means",
  "gaussian-mixture-model": "gauss",
  "spectral-clustering": "tsne",
  optics: "dbscan",
  "kernel-pca": "pca",
  "umap-concept": "tsne",
  lda: "pca",
  perceptron: "neural-network",
  mlp: "feedforward-nn",
  "nn-playground": "feedforward-nn",
  "convolution-visualizer": "cnn",
  gru: "lstm",
  "transformer-attention": "transformer",
  "multi-head-attention": "attention",
  "backpropagation-visualizer": "descent",
  "few-shot-learning": "tsne",
  "network-builder": "neural-network",
  "transfer-learning": "deploy",
  "rnn-forecasting": "rnn",
  "lstm-forecasting": "lstm",
  "gru-forecasting": "lstm",
  "naive-bayes-spam": "text",
  "exponential-smoothing": "smooth",
  "holt-winters": "smooth",
  "anomaly-detection": "anomaly",
  "multi-armed-bandit": "bandit",
  "markov-decision-process": "stack",
};

function slugOf(route: string) {
  return route.split("/").filter(Boolean).pop() ?? "";
}

function resolve(route?: string, category?: string, key?: string): Draw {
  if (key && art[key]) return art[key];
  const slug = route ? slugOf(route) : "";
  if (art[slug]) return art[slug];
  const mapped = bySlug[slug];
  if (mapped) return art[mapped];
  const fromCategory = category ? categoryArt[category] : undefined;
  return art[fromCategory ?? "curve"];
}

export type ArtKey = keyof typeof art;

export function AlgorithmArt({
  route,
  category,
  artKey,
  className,
}: {
  route?: string;
  category?: string;
  artKey?: ArtKey;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden
      focusable="false"
    >
      {resolve(route, category, artKey)(id)}
    </svg>
  );
}
