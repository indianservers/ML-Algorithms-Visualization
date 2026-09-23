import * as tf from "@tensorflow/tfjs";
import { HAND_CONNECTIONS, POSE_CONNECTIONS } from "../runtime/mediapipeRuntime";
import { mapDetections } from "../tracker/mapDetections";
import { tickLines, tickZones, type CountLine, type Zone } from "../tracker/analytics";
import { emaPoints, pairsOf, poseJointAngles, type Xyz } from "../utils/landmarkGeometry";
import type { ConfigField, ExecContext, GraphNode, ModelKind, NodeCategory, Packet, PortDef } from "./types";

export interface NodeDefinition {
  type: string;
  title: string;
  category: NodeCategory;
  inputs: PortDef[];
  outputs: PortDef[];
  defaults: Record<string, string | number | boolean>;
  fields: ConfigField[];
  models: ModelKind[];
  process: (ctx: ExecContext, node: GraphNode, inputs: Record<string, Packet | undefined>) => Record<string, Packet | undefined>;
}

const VIDEO = { id: "frame", type: "frame" as const, label: "Frame" };
const DET = { id: "dets", type: "detections" as const, label: "Detections" };
const TRK = { id: "tracks", type: "tracks" as const, label: "Tracks" };
const LM = { id: "landmarks", type: "landmarks" as const, label: "Landmarks" };
const GST = { id: "gesture", type: "gesture" as const, label: "Gesture" };
const SEG = { id: "mask", type: "segmentation" as const, label: "Mask" };
const EMB = { id: "vector", type: "embedding" as const, label: "Embedding" };
const NUM = { id: "value", type: "number" as const, label: "Number" };
const EVT = { id: "event", type: "event" as const, label: "Event" };
const OVL = { id: "overlay", type: "overlay" as const, label: "Overlay" };

const scratchCanvases = new Map<string, HTMLCanvasElement>();
function scratch(id: string, w: number, h: number) {
  const canvas = scratchCanvases.get(id) ?? document.createElement("canvas");
  scratchCanvases.set(id, canvas);
  if (canvas.width !== Math.max(1, Math.round(w))) canvas.width = Math.max(1, Math.round(w));
  if (canvas.height !== Math.max(1, Math.round(h))) canvas.height = Math.max(1, Math.round(h));
  return canvas;
}

function num(config: GraphNode["config"], key: string, fallback: number) {
  const value = config[key];
  return typeof value === "number" ? value : Number(value ?? fallback);
}

function str(config: GraphNode["config"], key: string, fallback: string) {
  const value = config[key];
  return typeof value === "string" ? value : fallback;
}

function framePacket(ctx: ExecContext): Packet | undefined {
  if (!ctx.video) return undefined;
  return { type: "frame", frame: ctx.video, w: ctx.w, h: ctx.h };
}

function source(inputs: Record<string, Packet | undefined>, ctx: ExecContext) {
  return inputs.frame?.frame ?? ctx.video;
}

export const NODE_LIST: NodeDefinition[] = [
  {
    type: "camera", title: "Camera", category: "input", inputs: [], outputs: [VIDEO], defaults: {}, fields: [], models: [],
    process: (ctx) => ({ frame: framePacket(ctx) }),
  },
  {
    type: "image", title: "Image", category: "input", inputs: [], outputs: [VIDEO], defaults: {}, fields: [], models: [],
    process: (ctx) => ({ frame: framePacket(ctx) }),
  },
  {
    type: "video", title: "Video", category: "input", inputs: [], outputs: [VIDEO], defaults: {}, fields: [], models: [],
    process: (ctx) => ({ frame: framePacket(ctx) }),
  },
  {
    type: "classifier", title: "Image Classifier", category: "vision", inputs: [VIDEO], outputs: [DET],
    defaults: { maxResults: 3 }, fields: [{ key: "maxResults", label: "Top-K", kind: "number", min: 1, max: 5, step: 1 }], models: ["mobilenet"],
    process: (ctx, node, inputs) => {
      const src = source(inputs, ctx);
      const net = ctx.models.mobilenet;
      if (!src || !net) return {};
      const canvas = scratch("classifier", 224, 224);
      canvas.getContext("2d")?.drawImage(src, 0, 0, 224, 224);
      const state = (ctx.nodeState[node.id] ?? {}) as { busy?: boolean; items?: Array<{ className: string; probability: number }> };
      if (!state.busy) {
        state.busy = true;
        void net.classify(canvas, num(node.config, "maxResults", 3)).then((items) => {
          state.items = items;
          state.busy = false;
        }).catch(() => { state.busy = false; });
      }
      ctx.nodeState[node.id] = state;
      const items = (state.items ?? []).map((item) => ({
        label: item.className,
        score: item.probability,
        box: { x: 8, y: 8, w: Math.max(32, ctx.w - 16), h: Math.max(32, ctx.h - 16) },
      }));
      return { dets: { type: "detections", detections: items } };
    },
  },
  {
    type: "detector", title: "Object Detector", category: "vision", inputs: [VIDEO], outputs: [DET],
    defaults: { threshold: 0.4, maxResults: 8 },
    fields: [
      { key: "threshold", label: "Threshold", kind: "number", min: 0.15, max: 0.9, step: 0.05 },
      { key: "maxResults", label: "Max detections", kind: "number", min: 1, max: 12, step: 1 },
    ],
    models: ["object"],
    process: (ctx, node, inputs) => {
      const src = source(inputs, ctx);
      const det = ctx.models.object;
      if (!(src instanceof HTMLVideoElement) || !det) return {};
      const result = det.detectForVideo(src, ctx.now);
      const items = mapDetections(result, num(node.config, "threshold", 0.4), num(node.config, "maxResults", 8));
      return { dets: { type: "detections", detections: items, w: ctx.w, h: ctx.h } };
    },
  },
  {
    type: "handLandmarker", title: "Hand Landmarker", category: "vision", inputs: [VIDEO], outputs: [LM],
    defaults: {}, fields: [], models: ["hands"],
    process: (ctx, _node, inputs) => {
      const src = source(inputs, ctx);
      const model = ctx.models.hands;
      if (!(src instanceof HTMLVideoElement) || !model) return {};
      const result = model.detectForVideo(src, ctx.now);
      const landmarks = (result.landmarks[0] ?? []).map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0 }));
      const hands = (result.landmarks ?? []).map((points, index) => ({
        handedness: result.handedness[index]?.[0]?.categoryName === "Left" ? "Left" as const : "Right" as const,
        score: result.handedness[index]?.[0]?.score ?? 0,
        landmarks: points.map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0 })),
        worldLandmarks: [] as { x: number; y: number; z: number }[],
      }));
      return { landmarks: { type: "landmarks", landmarks, hands, landmarkKind: "hand", w: ctx.w, h: ctx.h } };
    },
  },
  {
    type: "faceDetector", title: "Face Detector", category: "vision", inputs: [VIDEO], outputs: [DET],
    defaults: { threshold: 0.5 }, fields: [{ key: "threshold", label: "Threshold", kind: "number", min: 0.2, max: 0.9, step: 0.05 }], models: ["face"],
    process: (ctx, node, inputs) => {
      const src = source(inputs, ctx);
      const model = ctx.models.face;
      if (!(src instanceof HTMLVideoElement) || !model) return {};
      const result = model.detectForVideo(src, ctx.now);
      const min = num(node.config, "threshold", 0.5);
      const items = (result.detections ?? []).map((item) => {
        const box = item.boundingBox;
        const score = item.categories[0]?.score ?? 0;
        return { label: "face", score, box: { x: box?.originX ?? 0, y: box?.originY ?? 0, w: box?.width ?? 0, h: box?.height ?? 0 } };
      }).filter((item) => item.score >= min);
      return { dets: { type: "detections", detections: items } };
    },
  },
  {
    type: "faceLandmarker", title: "Face Landmarker", category: "vision", inputs: [VIDEO], outputs: [LM],
    defaults: {}, fields: [], models: ["faceMesh"],
    process: (ctx, _node, inputs) => {
      const src = source(inputs, ctx);
      const model = ctx.models.faceMesh;
      if (!(src instanceof HTMLVideoElement) || !model) return {};
      const result = model.detectForVideo(src, ctx.now);
      const landmarks = (result.faceLandmarks[0] ?? []).map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0 }));
      return { landmarks: { type: "landmarks", landmarks, landmarkKind: "face" } };
    },
  },
  {
    type: "poseLandmarker", title: "Pose Landmarker", category: "vision", inputs: [VIDEO], outputs: [LM],
    defaults: {}, fields: [], models: ["pose"],
    process: (ctx, _node, inputs) => {
      const src = source(inputs, ctx);
      const model = ctx.models.pose;
      if (!(src instanceof HTMLVideoElement) || !model) return {};
      const result = model.detectForVideo(src, ctx.now);
      const landmarks = (result.landmarks[0] ?? []).map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0, visibility: p.visibility ?? 1 }));
      return { landmarks: { type: "landmarks", landmarks, landmarkKind: "pose" } };
    },
  },
  {
    type: "segmenter", title: "Image Segmenter", category: "vision", inputs: [VIDEO], outputs: [SEG],
    defaults: {}, fields: [], models: ["selfie"],
    process: (ctx, _node, inputs) => {
      const src = source(inputs, ctx);
      const model = ctx.models.selfie;
      if (!(src instanceof HTMLVideoElement) || !model) return {};
      const result = model.segmentForVideo(src, ctx.now);
      const cat = result.categoryMask;
      if (!cat) return {};
      const mask = cat.getAsUint8Array();
      const packet: Packet = { type: "segmentation", mask: new Uint8Array(mask), maskW: cat.width, maskH: cat.height };
      result.close();
      return { mask: packet };
    },
  },
  {
    type: "embedder", title: "Image Embedder", category: "vision", inputs: [VIDEO], outputs: [EMB],
    defaults: {}, fields: [], models: ["mobilenet"],
    process: (ctx, _node, inputs) => {
      const src = source(inputs, ctx);
      const net = ctx.models.mobilenet;
      if (!src || !net) return {};
      const canvas = scratch("embedder", 224, 224);
      canvas.getContext("2d")?.drawImage(src, 0, 0, 224, 224);
      const tensor = net.infer(canvas, true) as tf.Tensor;
      const vector = Array.from(tensor.dataSync());
      tensor.dispose();
      return { vector: { type: "embedding", vector } };
    },
  },
  {
    type: "gesture", title: "Gesture Recognizer", category: "vision", inputs: [VIDEO], outputs: [GST, LM],
    defaults: { minScore: 0.5 }, fields: [{ key: "minScore", label: "Confidence", kind: "number", min: 0.2, max: 0.95, step: 0.05 }], models: ["gesture"],
    process: (ctx, node, inputs) => {
      const src = source(inputs, ctx);
      const model = ctx.models.gesture;
      if (!(src instanceof HTMLVideoElement) || !model) return {};
      const result = model.recognizeForVideo(src, ctx.now);
      const name = result.gestures[0]?.[0]?.categoryName ?? "None";
      const score = result.gestures[0]?.[0]?.score ?? 0;
      const landmarks = (result.landmarks[0] ?? []).map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0 }));
      const min = num(node.config, "minScore", 0.5);
      return {
        gesture: { type: "gesture", gesture: { name, score: score >= min ? score : 0 } },
        landmarks: { type: "landmarks", landmarks, landmarkKind: "hand" },
      };
    },
  },
  {
    type: "tracker", title: "Tracker", category: "processing", inputs: [DET], outputs: [TRK],
    defaults: { iou: 0.3, maxMisses: 12, trail: 24 },
    fields: [
      { key: "iou", label: "IoU", kind: "number", min: 0.1, max: 0.8, step: 0.05 },
      { key: "maxMisses", label: "Max misses", kind: "number", min: 2, max: 30, step: 1 },
      { key: "trail", label: "Trail length", kind: "number", min: 4, max: 60, step: 1 },
    ],
    models: [],
    process: (ctx, node, inputs) => {
      ctx.tracker.setOptions({
        iouThreshold: num(node.config, "iou", 0.3),
        maxMisses: num(node.config, "maxMisses", 12),
        trailLength: num(node.config, "trail", 24),
      });
      const tracks = ctx.tracker.update(inputs.dets?.detections ?? [], ctx.now);
      return { tracks: { type: "tracks", tracks } };
    },
  },
  {
    type: "threshold", title: "Threshold", category: "processing", inputs: [DET], outputs: [DET],
    defaults: { min: 0.5 }, fields: [{ key: "min", label: "Min score", kind: "number", min: 0.05, max: 0.95, step: 0.05 }], models: [],
    process: (_ctx, node, inputs) => {
      const min = num(node.config, "min", 0.5);
      const items = (inputs.dets?.detections ?? []).filter((item) => item.score >= min);
      return { dets: { type: "detections", detections: items } };
    },
  },
  {
    type: "classFilter", title: "Class Filter", category: "processing", inputs: [DET], outputs: [DET],
    defaults: { label: "person" }, fields: [{ key: "label", label: "Class", kind: "text" }], models: [],
    process: (_ctx, node, inputs) => {
      const label = str(node.config, "label", "person").toLowerCase();
      const items = (inputs.dets?.detections ?? []).filter((item) => item.label.toLowerCase().includes(label));
      return { dets: { type: "detections", detections: items } };
    },
  },
  {
    type: "smoothing", title: "Smoothing", category: "processing", inputs: [LM], outputs: [LM],
    defaults: { alpha: 0.45 }, fields: [{ key: "alpha", label: "EMA alpha", kind: "number", min: 0.1, max: 0.9, step: 0.05 }], models: [],
    process: (ctx, node, inputs) => {
      const points = (inputs.landmarks?.landmarks ?? []) as Xyz[];
      const prev = (ctx.nodeState[node.id]?.prev as Xyz[] | undefined) ?? null;
      const next = emaPoints(prev, points, num(node.config, "alpha", 0.45));
      ctx.nodeState[node.id] = { prev: next };
      return { landmarks: { type: "landmarks", landmarks: next.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0, visibility: point.visibility })), landmarkKind: inputs.landmarks?.landmarkKind } };
    },
  },
  {
    type: "crop", title: "Crop", category: "processing", inputs: [VIDEO], outputs: [VIDEO],
    defaults: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
    fields: [
      { key: "x", label: "X", kind: "number", min: 0, max: 0.8, step: 0.05 },
      { key: "y", label: "Y", kind: "number", min: 0, max: 0.8, step: 0.05 },
      { key: "w", label: "W", kind: "number", min: 0.2, max: 1, step: 0.05 },
      { key: "h", label: "H", kind: "number", min: 0.2, max: 1, step: 0.05 },
    ],
    models: [],
    process: (ctx, node, inputs) => {
      const src = source(inputs, ctx);
      if (!src) return {};
      const rw = ctx.w;
      const rh = ctx.h;
      const x = num(node.config, "x", 0.1) * rw;
      const y = num(node.config, "y", 0.1) * rh;
      const w = num(node.config, "w", 0.8) * rw;
      const h = num(node.config, "h", 0.8) * rh;
      const canvas = scratch(`crop-${node.id}`, Math.max(8, w), Math.max(8, h));
      canvas.getContext("2d")?.drawImage(src, x, y, w, h, 0, 0, canvas.width, canvas.height);
      return { frame: { type: "frame", frame: canvas, w: canvas.width, h: canvas.height } };
    },
  },
  {
    type: "resize", title: "Resize", category: "processing", inputs: [VIDEO], outputs: [VIDEO],
    defaults: { width: 320, height: 180 },
    fields: [
      { key: "width", label: "Width", kind: "number", min: 64, max: 1280, step: 16 },
      { key: "height", label: "Height", kind: "number", min: 64, max: 720, step: 16 },
    ],
    models: [],
    process: (ctx, node, inputs) => {
      const src = source(inputs, ctx);
      if (!src) return {};
      const canvas = scratch(`resize-${node.id}`, num(node.config, "width", 320), num(node.config, "height", 180));
      canvas.getContext("2d")?.drawImage(src, 0, 0, canvas.width, canvas.height);
      return { frame: { type: "frame", frame: canvas, w: canvas.width, h: canvas.height } };
    },
  },
  {
    type: "poseAngle", title: "Pose Angle", category: "logic", inputs: [LM], outputs: [NUM],
    defaults: { joint: "leftElbow" },
    fields: [{ key: "joint", label: "Joint", kind: "select", options: ["leftElbow", "rightElbow", "leftKnee", "rightKnee", "leftShoulder", "rightShoulder"] }],
    models: [],
    process: (_ctx, node, inputs) => {
      const joint = str(node.config, "joint", "leftElbow");
      const found = poseJointAngles((inputs.landmarks?.landmarks ?? []) as Xyz[]).find((item) => item.id === joint);
      return { value: { type: "number", value: found?.deg ?? 0 } };
    },
  },
  {
    type: "rule", title: "Rule", category: "logic", inputs: [GST, { ...NUM, optional: true }], outputs: [EVT],
    defaults: { gesture: "Thumb_Up", minScore: 0.6 },
    fields: [
      { key: "gesture", label: "IF gesture ==", kind: "text" },
      { key: "minScore", label: "Min score", kind: "number", min: 0.2, max: 0.95, step: 0.05 },
    ],
    models: [],
    process: (_ctx, node, inputs) => {
      const want = str(node.config, "gesture", "Thumb_Up");
      const g = inputs.gesture?.gesture;
      if (g && g.name === want && g.score >= num(node.config, "minScore", 0.6)) {
        return { event: { type: "event", text: `Rule matched: ${g.name} ${(g.score * 100).toFixed(0)}%` } };
      }
      return {};
    },
  },
  {
    type: "comparator", title: "Comparator", category: "logic", inputs: [NUM], outputs: [EVT],
    defaults: { op: ">", threshold: 90 },
    fields: [
      { key: "op", label: "Op", kind: "select", options: [">", "<", ">=", "<="] },
      { key: "threshold", label: "Threshold", kind: "number", min: 0, max: 180, step: 1 },
    ],
    models: [],
    process: (_ctx, node, inputs) => {
      const value = inputs.value?.value ?? 0;
      const threshold = num(node.config, "threshold", 90);
      const op = str(node.config, "op", ">");
      const ok = op === ">" ? value > threshold : op === "<" ? value < threshold : op === ">=" ? value >= threshold : value <= threshold;
      return ok ? { event: { type: "event", text: `${value.toFixed(1)} ${op} ${threshold}` } } : {};
    },
  },
  {
    type: "counter", title: "Counter", category: "logic", inputs: [EVT], outputs: [NUM, EVT],
    defaults: {}, fields: [], models: [],
    process: (ctx, node, inputs) => {
      if (!inputs.event?.text) return { value: { type: "number", value: ctx.counters[node.id] ?? 0 } };
      const last = ctx.nodeState[node.id]?.last as string | undefined;
      if (last === inputs.event.text) return { value: { type: "number", value: ctx.counters[node.id] ?? 0 } };
      ctx.nodeState[node.id] = { last: inputs.event.text };
      ctx.counters[node.id] = (ctx.counters[node.id] ?? 0) + 1;
      const value = ctx.counters[node.id];
      return {
        value: { type: "number", value },
        event: { type: "event", text: `Counter = ${value}` },
      };
    },
  },
  {
    type: "timer", title: "Timer", category: "logic", inputs: [EVT], outputs: [NUM],
    defaults: {}, fields: [], models: [],
    process: (ctx, node, inputs) => {
      if (inputs.event?.text) ctx.nodeState[node.id] = { at: ctx.now };
      const at = ctx.nodeState[node.id]?.at as number | undefined;
      return { value: { type: "number", value: at ? (ctx.now - at) / 1000 : 0 } };
    },
  },
  {
    type: "zone", title: "Zone", category: "logic", inputs: [TRK], outputs: [EVT, NUM],
    defaults: {}, fields: [], models: [],
    process: (ctx, node, inputs) => {
      const state = (ctx.nodeState[node.id] ?? {}) as { zone?: Zone };
      if (!state.zone) {
        state.zone = {
          id: node.id, name: "Zone A", kind: "rect",
          rect: { x: ctx.w * 0.25, y: ctx.h * 0.25, w: ctx.w * 0.5, h: ctx.h * 0.5 },
          occupancy: 0, entries: 0, exits: 0, dwellMs: {}, enteredAt: {}, classFilter: "all",
        };
        ctx.nodeState[node.id] = state;
      }
      const events = tickZones([state.zone], ctx.prevTracks, inputs.tracks?.tracks ?? [], ctx.now);
      events.forEach((item) => ctx.events.unshift(`${item.kind} ${item.label} #${item.trackId}`));
      const text = events[0] ? `${events[0].kind} ID ${events[0].trackId}` : undefined;
      return {
        event: text ? { type: "event", text } : undefined,
        value: { type: "number", value: state.zone.occupancy },
      };
    },
  },
  {
    type: "lineCrossing", title: "Line Crossing", category: "logic", inputs: [TRK], outputs: [EVT, NUM],
    defaults: {}, fields: [], models: [],
    process: (ctx, node, inputs) => {
      const state = (ctx.nodeState[node.id] ?? {}) as { line?: CountLine };
      if (!state.line) {
        state.line = { id: node.id, name: "Line 1", line: { ax: ctx.w * 0.15, ay: ctx.h * 0.5, bx: ctx.w * 0.85, by: ctx.h * 0.5 }, ab: 0, ba: 0, lastByTrack: {} };
        ctx.nodeState[node.id] = state;
      }
      const events = tickLines([state.line], ctx.prevTracks, inputs.tracks?.tracks ?? [], ctx.now);
      events.forEach((item) => ctx.events.unshift(`${item.kind} ${item.label} #${item.trackId}`));
      const text = events[0] ? `crossed Line 1 ${events[0].kind === "line-ab" ? "IN" : "OUT"} ID ${events[0].trackId}` : undefined;
      return {
        event: text ? { type: "event", text } : undefined,
        value: { type: "number", value: state.line.ab + state.line.ba },
      };
    },
  },
  {
    type: "overlay", title: "Overlay", category: "output",
    inputs: [{ ...VIDEO, optional: true }, { ...DET, optional: true }, { ...TRK, optional: true }, { ...LM, optional: true }, { ...SEG, optional: true }, { ...OVL, optional: true }],
    outputs: [OVL],
    defaults: {}, fields: [], models: [],
    process: (ctx, _node, inputs) => {
      const ops = [...(inputs.overlay?.overlay ?? [])];
      if (inputs.dets?.detections) ops.push({ kind: "boxes", detections: inputs.dets.detections });
      if (inputs.tracks?.tracks) ops.push({ kind: "tracks", tracks: inputs.tracks.tracks });
      if (inputs.landmarks?.landmarks) {
        const connections = inputs.landmarks.landmarkKind === "pose"
          ? pairsOf(POSE_CONNECTIONS)
          : HAND_CONNECTIONS;
        ops.push({ kind: "skeleton", landmarks: inputs.landmarks.landmarks, connections });
      }
      if (inputs.mask?.mask) ops.push({ kind: "mask", mask: inputs.mask.mask, maskW: inputs.mask.maskW, maskH: inputs.mask.maskH });
      ctx.overlays.push(...ops);
      return { overlay: { type: "overlay", overlay: ops } };
    },
  },
  {
    type: "label", title: "Label", category: "output",
    inputs: [{ ...GST, optional: true }, { ...EVT, optional: true }, { ...NUM, optional: true }, { ...DET, optional: true }],
    outputs: [OVL],
    defaults: {}, fields: [], models: [],
    process: (ctx, _node, inputs) => {
      const parts: string[] = [];
      if (inputs.gesture?.gesture) parts.push(`${inputs.gesture.gesture.name} ${inputs.gesture.gesture.score.toFixed(2)}`);
      if (inputs.event?.text) parts.push(inputs.event.text);
      if (inputs.value?.value != null) parts.push(String(inputs.value.value));
      if (inputs.dets?.detections?.[0]) parts.push(`${inputs.dets.detections[0].label} ${inputs.dets.detections[0].score.toFixed(2)}`);
      const text = parts.join(" · ");
      if (text) ctx.overlays.push({ kind: "label", text });
      return { overlay: { type: "overlay", overlay: text ? [{ kind: "label", text }] : [] } };
    },
  },
  {
    type: "counterDisplay", title: "Counter Display", category: "output", inputs: [NUM], outputs: [OVL],
    defaults: {}, fields: [], models: [],
    process: (ctx, _node, inputs) => {
      const text = `Counter = ${inputs.value?.value ?? 0}`;
      ctx.overlays.push({ kind: "label", text });
      return { overlay: { type: "overlay", overlay: [{ kind: "label", text }] } };
    },
  },
  {
    type: "eventLog", title: "Event Log", category: "output", inputs: [EVT], outputs: [EVT],
    defaults: {}, fields: [], models: [],
    process: (ctx, _node, inputs) => {
      if (inputs.event?.text) ctx.events.unshift(inputs.event.text);
      return { event: inputs.event };
    },
  },
  {
    type: "snapshotOut", title: "Snapshot", category: "output", inputs: [EVT], outputs: [],
    defaults: {}, fields: [], models: [],
    process: (ctx, node, inputs) => {
      if (!inputs.event?.text) return {};
      const last = ctx.nodeState[node.id]?.fired as string | undefined;
      if (last === inputs.event.text) return {};
      ctx.nodeState[node.id] = { fired: inputs.event.text };
      ctx.snapshot();
      ctx.events.unshift("Snapshot captured");
      return {};
    },
  },
  {
    type: "jsonOut", title: "JSON Output", category: "output",
    inputs: [{ ...DET, optional: true }, { ...TRK, optional: true }, { ...GST, optional: true }, { ...NUM, optional: true }, { ...EVT, optional: true }],
    outputs: [EVT],
    defaults: {}, fields: [], models: [],
    process: (ctx, _node, inputs) => {
      const payload = {
        detections: inputs.dets?.detections?.length ?? 0,
        tracks: inputs.tracks?.tracks?.length ?? 0,
        gesture: inputs.gesture?.gesture ?? null,
        value: inputs.value?.value ?? null,
        event: inputs.event?.text ?? null,
      };
      const text = JSON.stringify(payload);
      ctx.events.unshift(text);
      return { event: { type: "event", text } };
    },
  },
];

export const NODE_DEFS: Record<string, NodeDefinition> = Object.fromEntries(NODE_LIST.map((item) => [item.type, item]));

export const NODE_GROUPS: Array<{ id: NodeCategory; label: string }> = [
  { id: "input", label: "Input" },
  { id: "vision", label: "Vision" },
  { id: "processing", label: "Processing" },
  { id: "logic", label: "Logic" },
  { id: "output", label: "Output" },
];
