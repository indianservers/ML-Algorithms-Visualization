export interface Xyz {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export function dist2(a: Xyz, b: Xyz) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function dist3(a: Xyz, b: Xyz) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

export function sub(a: Xyz, b: Xyz): Xyz {
  return { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
}

export function normalizeVector(v: Xyz): Xyz {
  const n = Math.hypot(v.x, v.y, v.z ?? 0) || 1e-8;
  return { x: v.x / n, y: v.y / n, z: (v.z ?? 0) / n };
}

export function dot(a: Xyz, b: Xyz) {
  return a.x * b.x + a.y * b.y + (a.z ?? 0) * (b.z ?? 0);
}

/** Interior angle at `b` in degrees, using 3D coordinates. */
export function angleAt(a: Xyz | undefined, b: Xyz | undefined, c: Xyz | undefined) {
  if (!a || !b || !c) return null;
  const ba = normalizeVector(sub(a, b));
  const bc = normalizeVector(sub(c, b));
  const cos = Math.min(1, Math.max(-1, dot(ba, bc)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function visible(point: Xyz | undefined, min = 0.4): point is Xyz {
  if (!point) return false;
  return (point.visibility ?? 1) >= min;
}

/** Wrist-relative, scale-normalized 21-point hand vector plus five finger curls. */
export function handFeatureVector(landmarks: Xyz[]) {
  const wrist = landmarks[0];
  if (!wrist || landmarks.length < 21) return [];
  const rel = landmarks.map((point) => sub(point, wrist));
  const scale = Math.max(...rel.map((point) => dist3(point, { x: 0, y: 0, z: 0 })), 1e-6);
  const coords = rel.flatMap((point) => [point.x / scale, point.y / scale, (point.z ?? 0) / scale]);
  const curls = [
    angleAt(rel[2], rel[3], rel[4]),
    angleAt(rel[5], rel[6], rel[8]),
    angleAt(rel[9], rel[10], rel[12]),
    angleAt(rel[13], rel[14], rel[16]),
    angleAt(rel[17], rel[18], rel[20]),
  ].map((value) => (value ?? 0) / 180);
  return [...coords, ...curls];
}

export function emaPoints(previous: Xyz[] | null, next: Xyz[], alpha = 0.45): Xyz[] {
  if (!previous || previous.length !== next.length) return next;
  return next.map((point, index) => {
    const last = previous[index] ?? point;
    return {
      x: last.x + (point.x - last.x) * alpha,
      y: last.y + (point.y - last.y) * alpha,
      z: (last.z ?? 0) + ((point.z ?? 0) - (last.z ?? 0)) * alpha,
      visibility: point.visibility,
    };
  });
}

/**
 * Yaw / pitch / roll in degrees from a 4x4 column-major facial transform.
 * This is an estimate from landmark geometry, not IMU ground truth.
 */
export function poseFromMatrix(data: number[] | undefined) {
  if (!data || data.length < 16) return null;
  const r00 = data[0];
  const r10 = data[1];
  const r20 = data[2];
  const r21 = data[6];
  const r22 = data[10];
  const pitch = Math.atan2(-r21, r22);
  const yaw = Math.atan2(r20, Math.hypot(r00, r10));
  const roll = Math.atan2(r10, r00);
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  return { yaw: toDeg(yaw), pitch: toDeg(pitch), roll: toDeg(roll) };
}

export const POSE_NAMES = [
  "nose",
  "left eye inner",
  "left eye",
  "left eye outer",
  "right eye inner",
  "right eye",
  "right eye outer",
  "left ear",
  "right ear",
  "mouth left",
  "mouth right",
  "left shoulder",
  "right shoulder",
  "left elbow",
  "right elbow",
  "left wrist",
  "right wrist",
  "left pinky",
  "right pinky",
  "left index",
  "right index",
  "left thumb",
  "right thumb",
  "left hip",
  "right hip",
  "left knee",
  "right knee",
  "left ankle",
  "right ankle",
  "left heel",
  "right heel",
  "left foot index",
  "right foot index",
] as const;

export const POSE_ANGLE_TRIPLETS: Array<{ id: string; label: string; a: number; b: number; c: number }> = [
  { id: "leftElbow", label: "Left elbow", a: 11, b: 13, c: 15 },
  { id: "rightElbow", label: "Right elbow", a: 12, b: 14, c: 16 },
  { id: "leftShoulder", label: "Left shoulder", a: 13, b: 11, c: 23 },
  { id: "rightShoulder", label: "Right shoulder", a: 14, b: 12, c: 24 },
  { id: "leftHip", label: "Left hip", a: 11, b: 23, c: 25 },
  { id: "rightHip", label: "Right hip", a: 12, b: 24, c: 26 },
  { id: "leftKnee", label: "Left knee", a: 23, b: 25, c: 27 },
  { id: "rightKnee", label: "Right knee", a: 24, b: 26, c: 28 },
];

export function poseJointAngles(landmarks: Xyz[]) {
  return POSE_ANGLE_TRIPLETS.map((joint) => ({
    ...joint,
    deg: angleAt(landmarks[joint.a], landmarks[joint.b], landmarks[joint.c]),
  }));
}

export function emaValue(previous: number | null, next: number, alpha = 0.4) {
  if (previous == null || Number.isNaN(previous)) return next;
  return previous + (next - previous) * alpha;
}

export function midpoint(a: Xyz | undefined, b: Xyz | undefined): Xyz | null {
  if (!a || !b) return null;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z ?? 0) + (b.z ?? 0)) / 2 };
}

/** Degrees from vertical (image-up). Positive leans to the subject's right. */
export function torsoLeanDeg(landmarks: Xyz[]) {
  const midShoulder = midpoint(landmarks[11], landmarks[12]);
  const midHip = midpoint(landmarks[23], landmarks[24]);
  if (!midShoulder || !midHip) return null;
  const v = normalizeVector(sub(midShoulder, midHip));
  return (Math.atan2(v.x, -v.y) * 180) / Math.PI;
}

/** Degrees of a segment vs horizontal. */
export function segmentTiltDeg(a: Xyz | undefined, b: Xyz | undefined) {
  if (!a || !b) return null;
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

export function meanVisibility(landmarks: Xyz[], indices: number[]) {
  const scores = indices.map((index) => landmarks[index]?.visibility ?? 0);
  if (!scores.length) return 0;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export interface PostureEstimate {
  torsoLean: number | null;
  shoulderTilt: number | null;
  hipTilt: number | null;
  kneeGap: number | null;
  ankleGap: number | null;
  symmetry: number | null;
  notes: string[];
}

/** Geometric posture indicators. Not a medical assessment. */
export function postureEstimate(landmarks: Xyz[]): PostureEstimate {
  const leftKnee = poseJointAngles(landmarks).find((item) => item.id === "leftKnee")?.deg ?? null;
  const rightKnee = poseJointAngles(landmarks).find((item) => item.id === "rightKnee")?.deg ?? null;
  const ls = landmarks[11];
  const rs = landmarks[12];
  const lh = landmarks[23];
  const rh = landmarks[24];
  const lk = landmarks[25];
  const rk = landmarks[26];
  const la = landmarks[27];
  const ra = landmarks[28];
  const torsoLean = torsoLeanDeg(landmarks);
  const shoulderTilt = segmentTiltDeg(ls, rs);
  const hipTilt = segmentTiltDeg(lh, rh);
  const kneeGap = lk && rk ? dist2(lk, rk) : null;
  const ankleGap = la && ra ? dist2(la, ra) : null;
  const symmetry =
    leftKnee != null && rightKnee != null ? 1 - Math.min(1, Math.abs(leftKnee - rightKnee) / 90) : null;
  const notes: string[] = [];
  if (torsoLean != null && Math.abs(torsoLean) > 18) notes.push("Torso lean is above 18° from vertical.");
  if (shoulderTilt != null && Math.abs(shoulderTilt) > 8) notes.push("Shoulder line is not level.");
  if (hipTilt != null && Math.abs(hipTilt) > 8) notes.push("Hip line is not level.");
  if (kneeGap != null && ankleGap != null && kneeGap < ankleGap * 0.72) notes.push("Knees are closer together than the ankles.");
  return { torsoLean, shoulderTilt, hipTilt, kneeGap, ankleGap, symmetry, notes };
}

export function projectPoint(
  point: Xyz,
  view: "front" | "side" | "top",
  yawDeg = 0,
): { x: number; y: number } {
  const yaw = (yawDeg * Math.PI) / 180;
  const x = point.x * Math.cos(yaw) - (point.z ?? 0) * Math.sin(yaw);
  const z = point.x * Math.sin(yaw) + (point.z ?? 0) * Math.cos(yaw);
  if (view === "side") return { x: z, y: point.y };
  if (view === "top") return { x, y: z };
  return { x, y: point.y };
}

export function cropToDataUrl(
  source: CanvasImageSource,
  box: { x: number; y: number; w: number; h: number },
  size = 96,
) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx || box.w < 2 || box.h < 2) return "";
  ctx.drawImage(source, box.x, box.y, box.w, box.h, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export function pairsOf(list: Array<{ start: number; end: number }> | undefined): Array<[number, number]> {
  return (list ?? []).map((item) => [item.start, item.end]);
}
