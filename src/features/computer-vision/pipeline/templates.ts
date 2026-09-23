import type { PipelineGraph } from "./types";
import { uid } from "./validate";

function n(type: string, x: number, y: number, extra: Record<string, string | number | boolean> = {}) {
  return { id: uid("n"), type, x, y, config: extra };
}

function e(from: string, fromPort: string, to: string, toPort: string) {
  return { id: uid("e"), from, fromPort, to, toPort };
}

export interface SamplePipeline {
  id: string;
  name: string;
  graph: PipelineGraph;
}

export function samplePipelines(): SamplePipeline[] {
  const detection = (() => {
    const camera = n("camera", 40, 80);
    const detector = n("detector", 260, 80);
    const overlay = n("overlay", 500, 80);
    return {
      id: "detection",
      name: "Object Detection",
      graph: {
        nodes: [camera, detector, overlay],
        edges: [
          e(camera.id, "frame", detector.id, "frame"),
          e(camera.id, "frame", overlay.id, "frame"),
          e(detector.id, "dets", overlay.id, "dets"),
        ],
      },
    };
  })();

  const counter = (() => {
    const camera = n("camera", 20, 60);
    const detector = n("detector", 220, 60);
    const tracker = n("tracker", 420, 60);
    const count = n("zone", 620, 40);
    const overlay = n("overlay", 420, 200);
    return {
      id: "counter",
      name: "Object Counter",
      graph: {
        nodes: [camera, detector, tracker, count, overlay],
        edges: [
          e(camera.id, "frame", detector.id, "frame"),
          e(detector.id, "dets", tracker.id, "dets"),
          e(tracker.id, "tracks", count.id, "tracks"),
          e(camera.id, "frame", overlay.id, "frame"),
          e(tracker.id, "tracks", overlay.id, "tracks"),
        ],
      },
    };
  })();

  const gesture = (() => {
    const camera = n("camera", 20, 80);
    const hands = n("gesture", 240, 80, { minScore: 0.5 });
    const rule = n("rule", 460, 40, { gesture: "Victory", minScore: 0.5 });
    const counter = n("counter", 660, 40);
    const label = n("label", 460, 200);
    const display = n("counterDisplay", 660, 200);
    return {
      id: "gesture",
      name: "Gesture Trigger",
      graph: {
        nodes: [camera, hands, rule, counter, label, display],
        edges: [
          e(camera.id, "frame", hands.id, "frame"),
          e(hands.id, "gesture", rule.id, "gesture"),
          e(rule.id, "event", counter.id, "event"),
          e(hands.id, "gesture", label.id, "gesture"),
          e(rule.id, "event", label.id, "event"),
          e(counter.id, "value", display.id, "value"),
        ],
      },
    };
  })();

  const seg = (() => {
    const camera = n("camera", 40, 80);
    const segmenter = n("segmenter", 260, 80);
    const overlay = n("overlay", 500, 80);
    return {
      id: "segment",
      name: "Background Segmentation",
      graph: {
        nodes: [camera, segmenter, overlay],
        edges: [
          e(camera.id, "frame", segmenter.id, "frame"),
          e(camera.id, "frame", overlay.id, "frame"),
          e(segmenter.id, "mask", overlay.id, "mask"),
        ],
      },
    };
  })();

  const pose = (() => {
    const camera = n("camera", 20, 80);
    const landmarker = n("poseLandmarker", 220, 80);
    const angle = n("poseAngle", 440, 40, { joint: "leftElbow" });
    const cmp = n("comparator", 640, 40, { op: "<", threshold: 70 });
    const label = n("label", 440, 200);
    const overlay = n("overlay", 220, 220);
    return {
      id: "pose",
      name: "Pose Analyzer",
      graph: {
        nodes: [camera, landmarker, angle, cmp, label, overlay],
        edges: [
          e(camera.id, "frame", landmarker.id, "frame"),
          e(landmarker.id, "landmarks", angle.id, "landmarks"),
          e(angle.id, "value", cmp.id, "value"),
          e(angle.id, "value", label.id, "value"),
          e(cmp.id, "event", label.id, "event"),
          e(camera.id, "frame", overlay.id, "frame"),
          e(landmarker.id, "landmarks", overlay.id, "landmarks"),
        ],
      },
    };
  })();

  return [detection, counter, gesture, seg, pose];
}
