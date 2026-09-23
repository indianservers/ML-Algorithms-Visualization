import { CLASS_COLORS } from "../types";
import { boxCenter, boxIou, dist2, headingDeg, pathLength, type PixelBox, type PixelPoint } from "./geometry";

export interface RawDetection {
  label: string;
  score: number;
  box: PixelBox;
}

export type TrackStatus = "tentative" | "active" | "lost" | "expired";

export interface Track {
  id: number;
  label: string;
  score: number;
  box: PixelBox;
  color: string;
  hits: number;
  misses: number;
  born: number;
  lastSeen: number;
  vx: number;
  vy: number;
  trail: PixelPoint[];
  pathPx: number;
  status: TrackStatus;
}

export interface TrackerOptions {
  iouThreshold: number;
  maxMisses: number;
  trailLength: number;
  confirmHits: number;
}

export const DEFAULT_TRACKER: TrackerOptions = {
  iouThreshold: 0.3,
  maxMisses: 12,
  trailLength: 24,
  confirmHits: 2,
};

function cost(track: Track, det: RawDetection, now: number) {
  const iou = boxIou(track.box, det.box);
  const same = track.label === det.label ? 1 : 0.55;
  const predicted = {
    x: track.box.x + track.vx * Math.min(0.25, (now - track.lastSeen) / 1000),
    y: track.box.y + track.vy * Math.min(0.25, (now - track.lastSeen) / 1000),
    w: track.box.w,
    h: track.box.h,
  };
  const predictedIou = boxIou(predicted, det.box);
  return 1 - Math.max(iou, predictedIou) * same;
}

export class ObjectTracker {
  private nextId = 1;
  private tracks: Track[] = [];
  options: TrackerOptions;

  constructor(options: Partial<TrackerOptions> = {}) {
    this.options = { ...DEFAULT_TRACKER, ...options };
  }

  reset() {
    this.tracks = [];
    this.nextId = 1;
  }

  setOptions(partial: Partial<TrackerOptions>) {
    this.options = { ...this.options, ...partial };
  }

  snapshot() {
    return this.tracks.map((track) => ({ ...track, trail: [...track.trail], box: { ...track.box } }));
  }

  update(detections: RawDetection[], now: number) {
    const dt = 1 / 30;
    const unusedTracks = this.tracks.filter((track) => track.status !== "expired");
    const unusedDets = detections.map((_, index) => index);
    const pairs: Array<{ t: number; d: number; c: number }> = [];
    unusedTracks.forEach((track, t) => {
      unusedDets.forEach((d) => {
        const det = detections[d]!;
        const c = cost(track, det, now);
        if (1 - c >= this.options.iouThreshold * 0.65 || boxIou(track.box, det.box) >= this.options.iouThreshold) {
          pairs.push({ t, d, c });
        }
      });
    });
    pairs.sort((a, b) => a.c - b.c);
    const takenT = new Set<number>();
    const takenD = new Set<number>();
    const assignments: Array<{ track: Track; det: RawDetection }> = [];
    for (const pair of pairs) {
      if (takenT.has(pair.t) || takenD.has(pair.d)) continue;
      takenT.add(pair.t);
      takenD.add(pair.d);
      assignments.push({ track: unusedTracks[pair.t]!, det: detections[pair.d]! });
    }

    for (const { track, det } of assignments) {
      const prev = boxCenter(track.box);
      const next = boxCenter(det.box);
      const instVx = (next.x - prev.x) / Math.max(dt, (now - track.lastSeen) / 1000);
      const instVy = (next.y - prev.y) / Math.max(dt, (now - track.lastSeen) / 1000);
      track.vx = track.vx * 0.6 + instVx * 0.4;
      track.vy = track.vy * 0.6 + instVy * 0.4;
      track.box = { ...det.box };
      track.label = det.label;
      track.score = det.score;
      track.hits += 1;
      track.misses = 0;
      track.lastSeen = now;
      track.status = track.hits >= this.options.confirmHits ? "active" : "tentative";
      track.trail = [...track.trail, next].slice(-this.options.trailLength);
      track.pathPx = pathLength(track.trail);
    }

    unusedTracks.forEach((track, t) => {
      if (takenT.has(t)) return;
      track.misses += 1;
      track.box = {
        x: track.box.x + track.vx * dt,
        y: track.box.y + track.vy * dt,
        w: track.box.w,
        h: track.box.h,
      };
      track.status = track.misses >= this.options.maxMisses ? "expired" : "lost";
    });

    unusedDets.forEach((d) => {
      if (takenD.has(d)) return;
      const det = detections[d]!;
      const center = boxCenter(det.box);
      this.tracks.push({
        id: this.nextId,
        label: det.label,
        score: det.score,
        box: { ...det.box },
        color: CLASS_COLORS[(this.nextId - 1) % CLASS_COLORS.length] ?? "#2563eb",
        hits: 1,
        misses: 0,
        born: now,
        lastSeen: now,
        vx: 0,
        vy: 0,
        trail: [center],
        pathPx: 0,
        status: this.options.confirmHits <= 1 ? "active" : "tentative",
      });
      this.nextId += 1;
    });

    this.tracks = this.tracks.filter((track) => track.status !== "expired");
    return this.snapshot();
  }
}

export function speedPxPerSec(track: Track) {
  return Math.hypot(track.vx, track.vy);
}

export function directionLabel(track: Track) {
  const deg = headingDeg(track.vx, track.vy);
  if (deg == null || speedPxPerSec(track) < 8) return "still";
  const dirs = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];
  return dirs[Math.round(deg / 45) % 8] ?? "E";
}

export function nearDuplicate(a: PixelPoint, b: PixelPoint, px = 6) {
  return dist2(a, b) < px;
}
