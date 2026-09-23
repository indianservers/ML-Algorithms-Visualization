import type { LandmarkPoint, TrackedHand } from "../types";
import { HAND_CONNECTIONS, POSE_CONNECTIONS } from "../runtime/mediapipeRuntime";
import { pairsOf } from "../utils/landmarkGeometry";

export type ArAnchor = "face" | "eyes" | "nose" | "mouth" | "forehead" | "palm" | "fingertips" | "shoulder" | "head";

export interface ArEffect {
  id: string;
  label: string;
  group: "face" | "hand" | "pose";
  anchor: ArAnchor;
}

export const AR_EFFECTS: ArEffect[] = [
  { id: "glasses", label: "Glasses", group: "face", anchor: "eyes" },
  { id: "hat", label: "Hat", group: "face", anchor: "forehead" },
  { id: "mustache", label: "Moustache", group: "face", anchor: "mouth" },
  { id: "crown", label: "Crown", group: "face", anchor: "forehead" },
  { id: "ears", label: "Animal ears", group: "face", anchor: "forehead" },
  { id: "sparkles", label: "Fingertip sparkles", group: "hand", anchor: "fingertips" },
  { id: "palm", label: "Palm sticker", group: "hand", anchor: "palm" },
  { id: "ring", label: "Ring", group: "hand", anchor: "fingertips" },
  { id: "trail", label: "Hand trail", group: "hand", anchor: "palm" },
  { id: "wings", label: "Shoulder wings", group: "pose", anchor: "shoulder" },
  { id: "halo", label: "Halo", group: "pose", anchor: "head" },
  { id: "outline", label: "Body outline", group: "pose", anchor: "shoulder" },
];

function pt(landmarks: LandmarkPoint[], index: number, w: number, h: number) {
  const p = landmarks[index];
  if (!p) return null;
  return { x: p.x * w, y: p.y * h };
}

export function ArOverlay({
  face,
  hands,
  pose,
  width,
  height,
  enabled,
  opacity,
  scale,
  rotation,
  trails,
  custom,
}: {
  face: LandmarkPoint[];
  hands: TrackedHand[];
  pose: LandmarkPoint[];
  width: number;
  height: number;
  enabled: string[];
  opacity: number;
  scale: number;
  rotation: number;
  trails: Array<Array<{ x: number; y: number }>>;
  custom: Array<{ id: string; anchor: string; dataUrl: string }>;
}) {
  const le = pt(face, 33, width, height);
  const re = pt(face, 263, width, height);
  const nose = pt(face, 1, width, height);
  const mouth = pt(face, 13, width, height);
  const brow = pt(face, 10, width, height);
  const eyeW = le && re ? Math.hypot(re.x - le.x, re.y - le.y) : 0;
  const eyeA = le && re ? Math.atan2(re.y - le.y, re.x - le.x) : 0;
  const midEyes = le && re ? { x: (le.x + re.x) / 2, y: (le.y + re.y) / 2 } : null;
  const ls = pt(pose, 11, width, height);
  const rs = pt(pose, 12, width, height);
  const head = pt(pose, 0, width, height);
  const on = (id: string) => enabled.includes(id);
  const extra = (rotation * Math.PI) / 180;

  return (
    <svg className="cv-overlay" viewBox={`0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`} style={{ opacity }}>
      {on("outline") && pose.length
        ? pairsOf(POSE_CONNECTIONS).map(([a, b]) => {
            const from = pt(pose, a, width, height);
            const to = pt(pose, b, width, height);
            if (!from || !to) return null;
            return <line key={`p-${a}-${b}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#22d3ee" strokeWidth={4 * scale} strokeLinecap="round" />;
          })
        : null}
      {on("glasses") && le && re && midEyes ? (
        <g transform={`rotate(${((eyeA + extra) * 180) / Math.PI} ${midEyes.x} ${midEyes.y})`}>
          <ellipse cx={le.x} cy={le.y} rx={eyeW * 0.28 * scale} ry={eyeW * 0.16 * scale} fill="none" stroke="#111827" strokeWidth="4" />
          <ellipse cx={re.x} cy={re.y} rx={eyeW * 0.28 * scale} ry={eyeW * 0.16 * scale} fill="none" stroke="#111827" strokeWidth="4" />
          <line x1={le.x + eyeW * 0.28 * scale} y1={le.y} x2={re.x - eyeW * 0.28 * scale} y2={re.y} stroke="#111827" strokeWidth="3" />
        </g>
      ) : null}
      {on("hat") && brow && eyeW ? (
        <g>
          <rect x={brow.x - eyeW * 0.7 * scale} y={brow.y - eyeW * 0.7 * scale} width={eyeW * 1.4 * scale} height={eyeW * 0.45 * scale} rx="6" fill="#1d4ed8" />
          <rect x={brow.x - eyeW * 0.95 * scale} y={brow.y - eyeW * 0.28 * scale} width={eyeW * 1.9 * scale} height={eyeW * 0.12 * scale} rx="4" fill="#1e3a8a" />
        </g>
      ) : null}
      {on("crown") && brow && eyeW ? (
        <polygon
          points={`${brow.x - eyeW * 0.6 * scale},${brow.y} ${brow.x - eyeW * 0.35 * scale},${brow.y - eyeW * 0.45 * scale} ${brow.x},${brow.y - eyeW * 0.2 * scale} ${brow.x + eyeW * 0.35 * scale},${brow.y - eyeW * 0.45 * scale} ${brow.x + eyeW * 0.6 * scale},${brow.y}`}
          fill="#fbbf24"
        />
      ) : null}
      {on("ears") && le && re && eyeW ? (
        <>
          <ellipse cx={le.x - eyeW * 0.35 * scale} cy={le.y - eyeW * 0.55 * scale} rx={eyeW * 0.18 * scale} ry={eyeW * 0.28 * scale} fill="#fb7185" />
          <ellipse cx={re.x + eyeW * 0.35 * scale} cy={re.y - eyeW * 0.55 * scale} rx={eyeW * 0.18 * scale} ry={eyeW * 0.28 * scale} fill="#fb7185" />
        </>
      ) : null}
      {on("mustache") && mouth && eyeW ? (
        <ellipse cx={mouth.x} cy={mouth.y - 6} rx={eyeW * 0.32 * scale} ry={eyeW * 0.08 * scale} fill="#1f2937" />
      ) : null}
      {on("halo") && (head || brow) ? (
        <ellipse cx={(head ?? brow)!.x} cy={(head ?? brow)!.y - 40 * scale} rx={36 * scale} ry={12 * scale} fill="none" stroke="#facc15" strokeWidth="4" />
      ) : null}
      {on("wings") && ls && rs ? (
        <>
          <polygon points={`${ls.x},${ls.y} ${ls.x - 70 * scale},${ls.y - 20 * scale} ${ls.x - 40 * scale},${ls.y + 50 * scale}`} fill="rgba(147,197,253,0.75)" />
          <polygon points={`${rs.x},${rs.y} ${rs.x + 70 * scale},${rs.y - 20 * scale} ${rs.x + 40 * scale},${rs.y + 50 * scale}`} fill="rgba(147,197,253,0.75)" />
        </>
      ) : null}
      {on("trail")
        ? trails.map((path, index) => (
            <polyline
              key={`trail-${index}`}
              fill="none"
              stroke="rgba(250,204,21,0.7)"
              strokeWidth={3 * scale}
              points={path.map((p) => `${p.x},${p.y}`).join(" ")}
            />
          ))
        : null}
      {hands.map((hand, hi) => {
        const tips = [4, 8, 12, 16, 20].map((index) => pt(hand.landmarks, index, width, height));
        const palm = pt(hand.landmarks, 9, width, height);
        return (
          <g key={`h-${hi}`}>
            {on("sparkles")
              ? tips.map((tip, i) => (tip ? <circle key={i} cx={tip.x} cy={tip.y} r={5 * scale} fill="#fde68a" stroke="#f59e0b" /> : null))
              : null}
            {on("ring") && tips[0] ? <circle cx={tips[0].x} cy={tips[0].y} r={8 * scale} fill="none" stroke="#eab308" strokeWidth="3" /> : null}
            {on("palm") && palm ? (
              <text x={palm.x} y={palm.y} fontSize={28 * scale} textAnchor="middle">
                ✋
              </text>
            ) : null}
            {on("sparkles")
              ? HAND_CONNECTIONS.map(([a, b]) => {
                  const from = pt(hand.landmarks, a, width, height);
                  const to = pt(hand.landmarks, b, width, height);
                  if (!from || !to) return null;
                  return <line key={`${hi}-${a}-${b}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="rgba(251,191,36,0.35)" />;
                })
              : null}
          </g>
        );
      })}
      {custom.map((item) => {
        const anchor =
          item.anchor === "palm" ? (hands[0] ? pt(hands[0].landmarks, 9, width, height) : null)
          : item.anchor === "shoulder" ? ls
          : item.anchor === "head" ? head ?? brow
          : midEyes ?? nose;
        if (!anchor) return null;
        const s = 64 * scale;
        return <image key={item.id} href={item.dataUrl} x={anchor.x - s / 2} y={anchor.y - s / 2} width={s} height={s} />;
      })}
    </svg>
  );
}
