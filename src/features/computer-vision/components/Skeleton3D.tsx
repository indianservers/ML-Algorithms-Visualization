import { projectPoint, type Xyz } from "../utils/landmarkGeometry";
import { POSE_CONNECTIONS } from "../runtime/mediapipeRuntime";
import { pairsOf, visible } from "../utils/landmarkGeometry";

export function Skeleton3D({
  points,
  view,
  yaw = 0,
  connections,
}: {
  points: Xyz[];
  view: "front" | "side" | "top";
  yaw?: number;
  connections?: Array<{ start: number; end: number }>;
}) {
  const projected = points.map((point) => projectPoint(point, view, yaw));
  const xs = projected.map((p) => p.x);
  const ys = projected.map((p) => p.y);
  const minX = Math.min(...xs, -0.4);
  const maxX = Math.max(...xs, 0.4);
  const minY = Math.min(...ys, -0.6);
  const maxY = Math.max(...ys, 0.6);
  const w = Math.max(maxX - minX, 0.2);
  const h = Math.max(maxY - minY, 0.2);
  const sx = 180 / w;
  const sy = 180 / h;
  const map = (p: { x: number; y: number }) => ({
    x: 16 + (p.x - minX) * sx,
    y: 16 + (p.y - minY) * sy,
  });
  const lines = pairsOf(connections ?? POSE_CONNECTIONS);
  return (
    <svg className="cv-3d" viewBox="0 0 212 212" aria-hidden>
      <rect x="1" y="1" width="210" height="210" rx="12" fill="#0b1328" stroke="#243047" />
      {lines.map(([a, b]) => {
        const from = points[a];
        const to = points[b];
        const pa = projected[a];
        const pb = projected[b];
        if (!visible(from, 0.2) || !visible(to, 0.2) || !pa || !pb) return null;
        const p1 = map(pa);
        const p2 = map(pb);
        return <line key={`${a}-${b}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#38bdf8" strokeWidth="2.2" />;
      })}
      {projected.map((point, index) => {
        if (!visible(points[index], 0.2)) return null;
        const p = map(point);
        return <circle key={index} cx={p.x} cy={p.y} r={3} fill={index < 11 ? "#f472b6" : "#22d3ee"} />;
      })}
    </svg>
  );
}

export function HeadAxes({
  yaw = 0,
  pitch = 0,
  roll = 0,
}: {
  yaw?: number;
  pitch?: number;
  roll?: number;
}) {
  const y = (yaw * Math.PI) / 180;
  const p = (pitch * Math.PI) / 180;
  const r = (roll * Math.PI) / 180;
  const rot = (x: number, yy: number, z: number) => {
    let x1 = x * Math.cos(y) + z * Math.sin(y);
    let z1 = -x * Math.sin(y) + z * Math.cos(y);
    const y2 = yy * Math.cos(p) - z1 * Math.sin(p);
    const z2 = yy * Math.sin(p) + z1 * Math.cos(p);
    const x3 = x1 * Math.cos(r) - y2 * Math.sin(r);
    const y3 = x1 * Math.sin(r) + y2 * Math.cos(r);
    return { x: 90 + x3, y: 90 + y3, z: z2 };
  };
  const axis = (dx: number, dy: number, dz: number, color: string) => {
    const tip = rot(dx, dy, dz);
    return <line x1="90" y1="90" x2={tip.x} y2={tip.y} stroke={color} strokeWidth="3" />;
  };
  return (
    <svg className="cv-3d" viewBox="0 0 180 180" aria-hidden>
      <rect x="1" y="1" width="178" height="178" rx="12" fill="#0b1328" stroke="#243047" />
      <ellipse cx="90" cy="90" rx="42" ry="52" fill="none" stroke="#64748b" strokeWidth="1.5" />
      {axis(50, 0, 0, "#f87171")}
      {axis(0, 50, 0, "#4ade80")}
      {axis(0, 0, 50, "#60a5fa")}
      <circle cx="90" cy="90" r="4" fill="#fff" />
    </svg>
  );
}
