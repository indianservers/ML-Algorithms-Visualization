import { useId } from "react";

/**
 * Low-poly neural brain used in the landing hero.
 *
 * The silhouette comes from a closed Catmull-Rom spline through traced
 * landmarks, which gives both the rendered outline and a polygon used to seed
 * mesh vertices. Vertices are sampled on a jittered grid, triangulated with
 * Bowyer-Watson, then coloured left-to-right from cyan to magenta.
 */

const VW = 400;
const VH = 340;

type Pt = { x: number; y: number };

/** Clockwise landmarks of a left-facing cerebrum, apex first. */
const HULL: Pt[] = [
  { x: 201, y: 29 },
  { x: 258, y: 40 },
  { x: 305, y: 70 },
  { x: 344, y: 111 },
  { x: 355, y: 164 },
  { x: 338, y: 200 },
  { x: 326, y: 236 },
  { x: 305, y: 266 },
  { x: 278, y: 278 },
  { x: 251, y: 267 },
  { x: 236, y: 240 },
  { x: 200, y: 238 },
  { x: 162, y: 232 },
  { x: 120, y: 219 },
  { x: 74, y: 189 },
  { x: 30, y: 142 },
  { x: 52, y: 83 },
  { x: 98, y: 46 },
  { x: 148, y: 30 },
];

/** Open outline of the brain stem: no lid, so it reads as a tapering tube. */
const STEM = "M211 234 C213 262 219 292 229 310 C235 321 247 326 256 320 C245 308 238 288 235 236";
/** Closed twin used only for clipping the mesh. */
const STEM_FILL = `${STEM} Z`;

/** Sulcus hints: cerebellum boundary plus two frontal gyri. */
const FOLDS = [
  "M236 240 C256 220 280 210 320 208",
  "M96 66 C126 78 134 100 118 118",
  "M62 168 C88 162 100 146 92 128",
];

/** Closed Catmull-Rom -> cubic beziers, so outline and polygon stay in sync. */
function spline(pts: Pt[]) {
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n];
  const segs: number[][] = [];
  for (let i = 0; i < n; i += 1) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    segs.push([
      p1.x + (p2.x - p0.x) / 6,
      p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6,
      p2.y - (p3.y - p1.y) / 6,
      p2.x,
      p2.y,
    ]);
  }
  const d = `M${pts[0].x} ${pts[0].y} ${segs.map((s) => `C${s.map((v) => Math.round(v * 100) / 100).join(" ")}`).join(" ")} Z`;

  const poly: Pt[] = [];
  for (let i = 0; i < n; i += 1) {
    const p1 = at(i);
    const s = segs[i];
    for (let k = 0; k < 10; k += 1) {
      const t = k / 10;
      const u = 1 - t;
      poly.push({
        x: u * u * u * p1.x + 3 * u * u * t * s[0] + 3 * u * t * t * s[2] + t * t * t * s[4],
        y: u * u * u * p1.y + 3 * u * u * t * s[1] + 3 * u * t * t * s[3] + t * t * t * s[5],
      });
    }
  }
  return { d, poly };
}

const { d: BRAIN, poly: POLY } = spline(HULL);

function inside(x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i, i += 1) {
    const a = POLY[i];
    const b = POLY[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/** Inside with clearance, so vertices never sit on the glowing outline. */
function roomy(x: number, y: number, pad: number): boolean {
  return (
    inside(x, y) && inside(x - pad, y) && inside(x + pad, y) && inside(x, y - pad) && inside(x, y + pad)
  );
}

type Vertex = Pt & { r: number; hue: number; glow: boolean };

function circumcircleHolds(a: Pt, b: Pt, c: Pt, p: Pt): boolean {
  const ax = a.x - p.x;
  const ay = a.y - p.y;
  const bx = b.x - p.x;
  const by = b.y - p.y;
  const cx = c.x - p.x;
  const cy = c.y - p.y;
  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay);
  const orient = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  return orient > 0 ? det > 0 : det < 0;
}

/** Incremental Bowyer-Watson triangulation. */
function triangulate(pts: Pt[]): number[][] {
  const work = [...pts, { x: -4000, y: -4000 }, { x: 4000, y: -4000 }, { x: 0, y: 4000 }];
  const s = pts.length;
  let tris: number[][] = [[s, s + 1, s + 2]];

  for (let i = 0; i < s; i += 1) {
    const bad: number[][] = [];
    const keep: number[][] = [];
    for (const t of tris) {
      if (circumcircleHolds(work[t[0]], work[t[1]], work[t[2]], work[i])) bad.push(t);
      else keep.push(t);
    }

    const border: number[][] = [];
    for (const t of bad) {
      const edges = [
        [t[0], t[1]],
        [t[1], t[2]],
        [t[2], t[0]],
      ];
      for (const e of edges) {
        const shared = bad.some(
          (o) =>
            o !== t &&
            [
              [o[0], o[1]],
              [o[1], o[2]],
              [o[2], o[0]],
            ].some(([p, q]) => (p === e[0] && q === e[1]) || (p === e[1] && q === e[0])),
        );
        if (!shared) border.push(e);
      }
    }

    tris = keep;
    for (const [a, b] of border) tris.push([a, b, i]);
  }

  return tris.filter((t) => t.every((v) => v < s));
}

function build(): { nodes: Vertex[]; edges: number[][] } {
  let seed = 987654321;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const step = 29;
  const nodes: Vertex[] = [];
  for (let gy = 34; gy <= 276; gy += step) {
    for (let gx = 32; gx <= 356; gx += step) {
      const x = gx + (next() - 0.5) * step * 0.7;
      const y = gy + (next() - 0.5) * step * 0.7;
      if (!roomy(x, y, 9)) continue;
      const t = next();
      nodes.push({
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        r: t > 0.8 ? 2.8 : t > 0.48 ? 2 : 1.5,
        hue: (x - 30) / 325,
        glow: t > 0.8,
      });
    }
  }

  const seen = new Set<string>();
  const edges: number[][] = [];
  for (const t of triangulate(nodes)) {
    const pairs = [
      [t[0], t[1]],
      [t[1], t[2]],
      [t[2], t[0]],
    ];
    for (const [a, b] of pairs) {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (seen.has(key)) continue;
      const dx = nodes[a].x - nodes[b].x;
      const dy = nodes[a].y - nodes[b].y;
      if (dx * dx + dy * dy > 88 * 88) continue;
      if (!inside((nodes[a].x + nodes[b].x) / 2, (nodes[a].y + nodes[b].y) / 2)) continue;
      seen.add(key);
      edges.push([a, b]);
    }
  }

  return { nodes, edges };
}

function tone(hue: number) {
  if (hue < 0.24) return "#22d3ee";
  if (hue < 0.44) return "#38bdf8";
  if (hue < 0.62) return "#6366f1";
  if (hue < 0.8) return "#a855f7";
  return "#e879f9";
}

const { nodes, edges } = build();

const SPARKS: [number, number, number, string][] = [
  [16, 60, 1.8, "#38bdf8"],
  [376, 74, 1.6, "#e879f9"],
  [10, 250, 1.5, "#38bdf8"],
  [384, 262, 1.4, "#a855f7"],
  [166, 10, 1.3, "#7dd3fc"],
  [300, 322, 1.5, "#c084fc"],
];

export function BrainVisual({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className={className} fill="none" aria-hidden focusable="false">
      <defs>
        <clipPath id={`${id}clip`}>
          <path d={BRAIN} />
          <path d={STEM_FILL} />
        </clipPath>
        <radialGradient id={`${id}halo`} cx="0.48" cy="0.45" r="0.52">
          <stop stopColor="#3b82f6" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#4f46e5" stopOpacity="0.24" />
          <stop offset="1" stopColor="#0b1220" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}mesh`} gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="352" y2="0">
          <stop stopColor="#38bdf8" />
          <stop offset="0.45" stopColor="#4f7dfb" />
          <stop offset="0.72" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id={`${id}rim`} gradientUnits="userSpaceOnUse" x1="30" y1="0" x2="355" y2="0">
          <stop stopColor="#67e8f9" />
          <stop offset="0.5" stopColor="#93c5fd" />
          <stop offset="1" stopColor="#e879f9" />
        </linearGradient>
        <filter id={`${id}soft`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.6" />
        </filter>
        <filter id={`${id}rimglow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <ellipse cx={VW * 0.48} cy={VH * 0.45} rx={VW * 0.52} ry={VH * 0.5} fill={`url(#${id}halo)`} />

      <g>
        {SPARKS.map(([x, y, r, c], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={c} opacity="0.7" />
        ))}
      </g>

      <g clipPath={`url(#${id}clip)`}>
        <path d={BRAIN} fill={`url(#${id}mesh)`} opacity="0.18" />
        <g stroke={`url(#${id}mesh)`} strokeWidth="0.95" opacity="0.72" strokeLinecap="round">
          {edges.map(([a, b], i) => (
            <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
          ))}
        </g>
        <g stroke="#bae6fd" strokeWidth="1.1" opacity="0.24" fill="none">
          {FOLDS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g>
          {nodes
            .filter((n) => n.glow)
            .map((n, i) => (
              <circle key={i} cx={n.x} cy={n.y} r={n.r * 3.2} fill={tone(n.hue)} opacity="0.6" filter={`url(#${id}soft)`} />
            ))}
          {nodes.map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={n.glow ? "#f0f9ff" : tone(n.hue)} opacity={n.glow ? 1 : 0.95} />
          ))}
        </g>
      </g>

      <g fill="none" stroke={`url(#${id}rim)`}>
        <g strokeWidth="3.4" opacity="0.55" filter={`url(#${id}rimglow)`}>
          <path d={BRAIN} />
          <path d={STEM} />
        </g>
        <g strokeWidth="1.6" opacity="0.96">
          <path d={BRAIN} />
          <path d={STEM} />
        </g>
      </g>
    </svg>
  );
}
