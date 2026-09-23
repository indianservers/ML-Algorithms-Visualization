export type CameraPermission = "unknown" | "granted" | "denied" | "unavailable";

export type CameraStatus = "idle" | "starting" | "live" | "paused" | "error";

export interface VisionClass {
  id: string;
  name: string;
  color: string;
}

export interface ClassSample {
  id: string;
  classId: string;
  preview: string;
  embedding: number[];
}

export interface TrainPoint {
  epoch: number;
  acc: number;
  valAcc: number;
  loss: number;
  valLoss: number;
  ms: number;
}

export interface DetectionHit {
  id: string;
  label: string;
  score: number;
  box: { x: number; y: number; w: number; h: number };
  color: string;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface TrackedHand {
  handedness: "Left" | "Right";
  score: number;
  landmarks: LandmarkPoint[];
  worldLandmarks: LandmarkPoint[];
}

export interface GestureHit {
  name: string;
  score: number;
  handedness: "Left" | "Right";
  alternatives: Array<{ name: string; score: number }>;
  at: number;
}

export const CLASS_COLORS = [
  "#2563eb",
  "#059669",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#ca8a04",
  "#db2777",
  "#4f46e5",
  "#16a34a",
];
