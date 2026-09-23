import type { LandmarkPoint } from "../types";
import { POSE_CONNECTIONS } from "../runtime/mediapipeRuntime";
import { POSE_NAMES, pairsOf, visible } from "../utils/landmarkGeometry";

const COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#fbbf24", "#60a5fa"];

export function PoseOverlay({
  landmarks,
  width,
  height,
  showSkeleton,
  showLabels,
  highlights = [],
  angles = [],
}: {
  landmarks: LandmarkPoint[];
  width: number;
  height: number;
  showSkeleton: boolean;
  showLabels: boolean;
  highlights?: number[];
  angles?: Array<{ a: number; b: number; c: number; deg: number | null }>;
}) {
  if (!landmarks.length) return null;
  return (
    <svg className="cv-overlay" viewBox={`0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`} aria-hidden>
      {showSkeleton
        ? pairsOf(POSE_CONNECTIONS).map(([a, b]) => {
            const from = landmarks[a];
            const to = landmarks[b];
            if (!visible(from, 0.3) || !visible(to, 0.3)) return null;
            return (
              <line
                key={`${a}-${b}`}
                x1={from.x * width}
                y1={from.y * height}
                x2={to.x * width}
                y2={to.y * height}
                stroke={COLORS[a % COLORS.length]}
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })
        : null}
      {landmarks.map((point, index) => {
        if (!visible(point, 0.3)) return null;
        const hot = highlights.includes(index);
        return (
          <g key={index}>
            <circle cx={point.x * width} cy={point.y * height} r={hot ? 7 : 4} fill={hot ? "#fbbf24" : COLORS[index % COLORS.length]} stroke="#fff" />
            {showLabels && (hot || index === 11 || index === 12 || index === 13 || index === 14 || index === 23 || index === 24 || index === 25 || index === 26 || index === 27 || index === 28) ? (
              <text x={point.x * width + 6} y={point.y * height - 6} fill="#fff" fontSize="11" fontWeight="700">
                {POSE_NAMES[index]}
              </text>
            ) : null}
          </g>
        );
      })}
      {angles.map((item) => {
        const a = landmarks[item.a];
        const b = landmarks[item.b];
        const c = landmarks[item.c];
        if (!a || !b || !c || item.deg == null) return null;
        const bx = b.x * width;
        const by = b.y * height;
        const r = Math.min(width, height) * 0.045;
        const va = { x: a.x * width - bx, y: a.y * height - by };
        const vc = { x: c.x * width - bx, y: c.y * height - by };
        const na = Math.hypot(va.x, va.y) || 1;
        const nc = Math.hypot(vc.x, vc.y) || 1;
        const sx = bx + (va.x / na) * r;
        const sy = by + (va.y / na) * r;
        const ex = bx + (vc.x / nc) * r;
        const ey = by + (vc.y / nc) * r;
        const sweep = va.x * vc.y - va.y * vc.x > 0 ? 1 : 0;
        return (
          <g key={`${item.a}-${item.b}-${item.c}`}>
            <path d={`M ${sx} ${sy} A ${r} ${r} 0 0 ${sweep} ${ex} ${ey}`} fill="none" stroke="#fbbf24" strokeWidth="2" />
            <text x={bx + 10} y={by + 16} fill="#fbbf24" fontSize="12" fontWeight="800">{`${item.deg.toFixed(0)}°`}</text>
          </g>
        );
      })}
    </svg>
  );
}
