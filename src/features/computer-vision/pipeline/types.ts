import type { LandmarkPoint, TrackedHand } from "../types";
import type { ObjectTracker, RawDetection, Track } from "../tracker/ObjectTracker";
import type { FaceDetector, FaceLandmarker, GestureRecognizer, HandLandmarker, ImageSegmenter, ObjectDetector, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { MobileNet } from "@tensorflow-models/mobilenet";

export type PortType =
  | "frame"
  | "detections"
  | "tracks"
  | "landmarks"
  | "gesture"
  | "segmentation"
  | "embedding"
  | "number"
  | "event"
  | "overlay";

export type NodeCategory = "input" | "vision" | "processing" | "logic" | "output";

export interface PortDef {
  id: string;
  type: PortType;
  label: string;
  optional?: boolean;
}

export type ConfigValue = string | number | boolean;

export interface ConfigField {
  key: string;
  label: string;
  kind: "number" | "text" | "select" | "bool";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface GraphNode {
  id: string;
  type: string;
  x: number;
  y: number;
  config: Record<string, ConfigValue>;
}

export interface GraphEdge {
  id: string;
  from: string;
  fromPort: string;
  to: string;
  toPort: string;
}

export interface PipelineGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface OverlayOp {
  kind: "boxes" | "tracks" | "skeleton" | "label" | "mask";
  detections?: RawDetection[];
  tracks?: Track[];
  landmarks?: LandmarkPoint[];
  connections?: Array<[number, number]>;
  text?: string;
  mask?: Uint8Array;
  maskW?: number;
  maskH?: number;
}

export interface Packet {
  type: PortType;
  frame?: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
  w?: number;
  h?: number;
  detections?: RawDetection[];
  tracks?: Track[];
  landmarks?: LandmarkPoint[];
  hands?: TrackedHand[];
  landmarkKind?: "face" | "hand" | "pose";
  gesture?: { name: string; score: number };
  mask?: Uint8Array;
  maskW?: number;
  maskH?: number;
  vector?: number[];
  value?: number;
  text?: string;
  overlay?: OverlayOp[];
}

export interface NodeRuntime {
  active: boolean;
  ms: number;
  count: number;
  error?: string;
  label?: string;
}

export type ModelKind = "object" | "hands" | "gesture" | "face" | "faceMesh" | "pose" | "selfie" | "mobilenet";

export interface ModelBag {
  object?: ObjectDetector;
  hands?: HandLandmarker;
  gesture?: GestureRecognizer;
  face?: FaceDetector;
  faceMesh?: FaceLandmarker;
  pose?: PoseLandmarker;
  selfie?: ImageSegmenter;
  mobilenet?: MobileNet;
}

export interface ExecContext {
  now: number;
  video: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | null;
  w: number;
  h: number;
  models: ModelBag;
  tracker: ObjectTracker;
  prevTracks: Track[];
  counters: Record<string, number>;
  events: string[];
  overlays: OverlayOp[];
  nodeState: Record<string, Record<string, unknown>>;
  snapshot: () => HTMLCanvasElement | null;
}
