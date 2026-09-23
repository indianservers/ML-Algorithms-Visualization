import { dist2, poseJointAngles, visible, type Xyz } from "./landmarkGeometry";

export type ExerciseId = "squat" | "curl" | "pushup" | "jack" | "lunge";

export type RepPhase =
  | "idle"
  | "up"
  | "descending"
  | "down"
  | "ascending"
  | "extended"
  | "flexing"
  | "flexed"
  | "extending"
  | "closed"
  | "opening"
  | "open"
  | "closing";

export interface RepRecord {
  n: number;
  at: number;
  durationMs: number;
  minAngle: number;
  maxAngle: number;
  notes: string[];
}

export interface MachineState {
  phase: RepPhase;
  reps: number;
  startedAt: number | null;
  minAngle: number;
  maxAngle: number;
  lastRepAt: number | null;
}

export function blankMachine(): MachineState {
  return { phase: "idle", reps: 0, startedAt: null, minAngle: 180, maxAngle: 0, lastRepAt: null };
}

function angleMap(landmarks: Xyz[]) {
  return Object.fromEntries(poseJointAngles(landmarks).map((item) => [item.id, item.deg])) as Record<string, number | null>;
}

function mean(values: Array<number | null>) {
  const list = values.filter((value): value is number => value != null);
  if (!list.length) return null;
  return list.reduce((sum, value) => sum + value, 0) / list.length;
}

function poseReady(landmarks: Xyz[], indices: number[]) {
  return indices.every((index) => visible(landmarks[index], 0.35));
}

function trackExtrema(state: MachineState, angle: number) {
  state.minAngle = Math.min(state.minAngle, angle);
  state.maxAngle = Math.max(state.maxAngle, angle);
}

export function squatTick(state: MachineState, landmarks: Xyz[], now: number): RepRecord | null {
  if (!poseReady(landmarks, [23, 24, 25, 26, 27, 28])) {
    if (state.phase !== "idle") state.phase = "idle";
    return null;
  }
  const knee = mean([angleMap(landmarks).leftKnee ?? null, angleMap(landmarks).rightKnee ?? null]);
  if (knee == null) return null;
  trackExtrema(state, knee);
  if (state.phase === "idle" && knee > 150) state.phase = "up";
  if (state.phase === "up" && knee < 140) {
    state.phase = "descending";
    state.startedAt = now;
    state.minAngle = knee;
    state.maxAngle = knee;
  }
  if (state.phase === "descending" && knee < 105) state.phase = "down";
  if ((state.phase === "down" || state.phase === "descending") && knee > 125) state.phase = "ascending";
  if (state.phase === "ascending" && knee > 155) return complete(state, now, squatNotes(landmarks, state));
  return null;
}

function squatNotes(landmarks: Xyz[], state: MachineState) {
  const notes: string[] = [];
  const lk = landmarks[25];
  const rk = landmarks[26];
  const la = landmarks[27];
  const ra = landmarks[28];
  if (lk && rk && la && ra && dist2(lk, rk) < dist2(la, ra) * 0.72) notes.push("Knees closer than ankles (inward estimate).");
  if (state.minAngle > 115) notes.push("Depth did not reach the 105° knee target.");
  const lean = Math.abs((landmarks[11] && landmarks[23] ? (landmarks[11].x + (landmarks[12]?.x ?? 0)) / 2 - (landmarks[23].x + (landmarks[24]?.x ?? 0)) / 2 : 0));
  if (lean > 0.12) notes.push("Torso lean is large relative to the hips.");
  return notes;
}

export function curlTick(state: MachineState, landmarks: Xyz[], now: number): RepRecord | null {
  if (!poseReady(landmarks, [11, 12, 13, 14, 15, 16])) {
    state.phase = "idle";
    return null;
  }
  const angles = angleMap(landmarks);
  const elbow = mean([angles.leftElbow ?? null, angles.rightElbow ?? null]);
  if (elbow == null) return null;
  trackExtrema(state, elbow);
  if (state.phase === "idle" && elbow > 145) state.phase = "extended";
  if (state.phase === "extended" && elbow < 130) {
    state.phase = "flexing";
    state.startedAt = now;
    state.minAngle = elbow;
    state.maxAngle = elbow;
  }
  if (state.phase === "flexing" && elbow < 55) state.phase = "flexed";
  if ((state.phase === "flexed" || state.phase === "flexing") && elbow > 80) state.phase = "extending";
  if (state.phase === "extending" && elbow > 150) return complete(state, now, curlNotes(state, landmarks));
  return null;
}

function curlNotes(state: MachineState, landmarks: Xyz[]) {
  const notes: string[] = [];
  if (state.maxAngle < 145) notes.push("Arm did not fully extend.");
  if (state.minAngle > 60) notes.push("Arm did not fully flex.");
  const ls = landmarks[11];
  const rs = landmarks[12];
  const lw = landmarks[15];
  const rw = landmarks[16];
  if (ls && lw && Math.abs(lw.y - ls.y) < 0.02) notes.push("Shoulder may be lifting with the curl.");
  if (rs && rw && Math.abs(rw.y - rs.y) < 0.02) notes.push("Opposite shoulder also moved.");
  return notes;
}

export function pushupTick(state: MachineState, landmarks: Xyz[], now: number): RepRecord | null {
  if (!poseReady(landmarks, [11, 12, 13, 14, 15, 16, 23, 24])) {
    state.phase = "idle";
    return null;
  }
  const elbow = mean([angleMap(landmarks).leftElbow ?? null, angleMap(landmarks).rightElbow ?? null]);
  if (elbow == null) return null;
  trackExtrema(state, elbow);
  if (state.phase === "idle" && elbow > 145) state.phase = "extended";
  if (state.phase === "extended" && elbow < 130) {
    state.phase = "flexing";
    state.startedAt = now;
    state.minAngle = elbow;
    state.maxAngle = elbow;
  }
  if (state.phase === "flexing" && elbow < 95) state.phase = "flexed";
  if ((state.phase === "flexed" || state.phase === "flexing") && elbow > 115) state.phase = "extending";
  if (state.phase === "extending" && elbow > 150) return complete(state, now, pushupNotes(landmarks, state));
  return null;
}

function pushupNotes(landmarks: Xyz[], state: MachineState) {
  const notes: string[] = [];
  if (state.minAngle > 100) notes.push("Elbows did not bend to the 95° target.");
  const ls = landmarks[11];
  const lh = landmarks[23];
  const la = landmarks[27];
  if (ls && lh && la) {
    const expected = ls.y + (la.y - ls.y) * ((lh.x - ls.x) / Math.max(la.x - ls.x, 1e-3));
    const err = Math.abs(lh.y - expected);
    if (err > 0.08) notes.push("Hips are off the shoulder–ankle line.");
  }
  return notes;
}

export function jackTick(state: MachineState, landmarks: Xyz[], now: number): RepRecord | null {
  if (!poseReady(landmarks, [11, 12, 15, 16, 27, 28])) {
    state.phase = "idle";
    return null;
  }
  const ls = landmarks[11]!;
  const rs = landmarks[12]!;
  const lw = landmarks[15]!;
  const rw = landmarks[16]!;
  const la = landmarks[27]!;
  const ra = landmarks[28]!;
  const handsUp = lw.y < ls.y - 0.04 && rw.y < rs.y - 0.04;
  const feetWide = dist2(la, ra) > 0.22;
  const handsDown = lw.y > ls.y && rw.y > rs.y;
  const feetIn = dist2(la, ra) < 0.14;
  const open = handsUp && feetWide;
  const closed = handsDown && feetIn;
  const proxy = dist2(la, ra) * 180;
  trackExtrema(state, proxy);
  if (state.phase === "idle" && closed) state.phase = "closed";
  if (state.phase === "closed" && (handsUp || feetWide)) {
    state.phase = "opening";
    state.startedAt = now;
    state.minAngle = proxy;
    state.maxAngle = proxy;
  }
  if (state.phase === "opening" && open) state.phase = "open";
  if (state.phase === "opening" && closed) state.phase = "closed";
  if (state.phase === "open" && !open) state.phase = "closing";
  if (state.phase === "closing" && open) state.phase = "open";
  if (state.phase === "closing" && closed) return complete(state, now, []);
  return null;
}

export function lungeTick(state: MachineState, landmarks: Xyz[], now: number): RepRecord | null {
  if (!poseReady(landmarks, [23, 24, 25, 26, 27, 28])) {
    state.phase = "idle";
    return null;
  }
  const angles = angleMap(landmarks);
  const front = Math.min(angles.leftKnee ?? 180, angles.rightKnee ?? 180);
  trackExtrema(state, front);
  if (state.phase === "idle" && front > 145) state.phase = "up";
  if (state.phase === "up" && front < 135) {
    state.phase = "descending";
    state.startedAt = now;
    state.minAngle = front;
    state.maxAngle = front;
  }
  if (state.phase === "descending" && front < 105) state.phase = "down";
  if ((state.phase === "down" || state.phase === "descending") && front > 125) state.phase = "ascending";
  if (state.phase === "ascending" && front > 150) return complete(state, now, front > 0 && state.minAngle > 115 ? ["Front knee did not reach the 105° target."] : []);
  return null;
}

function complete(state: MachineState, now: number, notes: string[]): RepRecord | null {
  const nextPhase: RepPhase = state.phase === "open" || state.phase === "closing" ? "closed" : state.phase === "extending" ? "extended" : "up";
  if (state.lastRepAt != null && now - state.lastRepAt < 420) {
    state.phase = nextPhase;
    state.startedAt = null;
    return null;
  }
  const durationMs = state.startedAt ? now - state.startedAt : 0;
  state.reps += 1;
  state.lastRepAt = now;
  const record: RepRecord = {
    n: state.reps,
    at: now,
    durationMs,
    minAngle: state.minAngle,
    maxAngle: state.maxAngle,
    notes,
  };
  state.phase = nextPhase;
  state.startedAt = null;
  state.minAngle = 180;
  state.maxAngle = 0;
  return record;
}

export function tickExercise(id: ExerciseId, state: MachineState, landmarks: Xyz[], now: number) {
  if (id === "squat") return squatTick(state, landmarks, now);
  if (id === "curl") return curlTick(state, landmarks, now);
  if (id === "pushup") return pushupTick(state, landmarks, now);
  if (id === "jack") return jackTick(state, landmarks, now);
  return lungeTick(state, landmarks, now);
}

export function primaryAngle(id: ExerciseId, landmarks: Xyz[]) {
  const angles = angleMap(landmarks);
  if (id === "curl" || id === "pushup") return mean([angles.leftElbow ?? null, angles.rightElbow ?? null]);
  if (id === "jack") {
    const la = landmarks[27];
    const ra = landmarks[28];
    return la && ra ? dist2(la, ra) * 180 : null;
  }
  return mean([angles.leftKnee ?? null, angles.rightKnee ?? null]);
}

export const EXERCISE_META: Record<ExerciseId, { label: string; metric: string }> = {
  squat: { label: "Squat", metric: "Knee angle" },
  curl: { label: "Bicep curl", metric: "Elbow angle" },
  pushup: { label: "Push-up", metric: "Elbow angle" },
  jack: { label: "Jumping jack", metric: "Stance width" },
  lunge: { label: "Lunge", metric: "Front knee" },
};
