import { lineCross, pointInPolygon, pointInRect, type LineSeg, type PixelBox, type PixelPoint } from "./geometry";
import type { Track } from "./ObjectTracker";

export interface CountLine {
  id: string;
  name: string;
  line: LineSeg;
  ab: number;
  ba: number;
  lastByTrack: Record<number, number>;
}

export type ZoneKind = "rect" | "polygon";

export interface Zone {
  id: string;
  name: string;
  kind: ZoneKind;
  rect?: PixelBox;
  polygon?: PixelPoint[];
  occupancy: number;
  entries: number;
  exits: number;
  dwellMs: Record<number, number>;
  enteredAt: Record<number, number>;
  classFilter: string;
}

export interface AnalyticEvent {
  at: number;
  trackId: number;
  label: string;
  kind: "line-ab" | "line-ba" | "zone-enter" | "zone-exit";
  target: string;
  dwellMs?: number;
}

export function insideZone(zone: Zone, point: PixelPoint) {
  if (zone.kind === "rect" && zone.rect) return pointInRect(point, zone.rect);
  if (zone.polygon) return pointInPolygon(point, zone.polygon);
  return false;
}

export function tickLines(lines: CountLine[], prev: Track[], next: Track[], now: number) {
  const events: AnalyticEvent[] = [];
  const byId = new Map(prev.map((track) => [track.id, track]));
  for (const track of next) {
    if (track.status !== "active") continue;
    const last = byId.get(track.id);
    if (!last || last.trail.length < 1 || track.trail.length < 1) continue;
    const a = last.trail[last.trail.length - 1]!;
    const b = track.trail[track.trail.length - 1]!;
    for (const line of lines) {
      const hit = lineCross(line.line, a, b);
      if (!hit) continue;
      const recent = line.lastByTrack[track.id] ?? 0;
      if (now - recent < 700) continue;
      line.lastByTrack[track.id] = now;
      if (hit === "ab") {
        line.ab += 1;
        events.push({ at: now, trackId: track.id, label: track.label, kind: "line-ab", target: line.name });
      } else {
        line.ba += 1;
        events.push({ at: now, trackId: track.id, label: track.label, kind: "line-ba", target: line.name });
      }
    }
  }
  return events;
}

export function tickZones(zones: Zone[], prev: Track[], next: Track[], now: number) {
  const events: AnalyticEvent[] = [];
  const prevMap = new Map(prev.map((track) => [track.id, track]));
  for (const zone of zones) {
    let occ = 0;
    for (const track of next) {
      if (track.status !== "active" && track.status !== "lost") continue;
      if (zone.classFilter !== "all" && track.label !== zone.classFilter) continue;
      const point = track.trail[track.trail.length - 1];
      if (!point) continue;
      const was = (() => {
        const last = prevMap.get(track.id);
        const prevPt = last?.trail[last.trail.length - 1];
        return prevPt ? insideZone(zone, prevPt) : Boolean(zone.enteredAt[track.id]);
      })();
      const isIn = insideZone(zone, point);
      if (isIn) occ += 1;
      if (isIn && !was) {
        zone.entries += 1;
        zone.enteredAt[track.id] = now;
        events.push({ at: now, trackId: track.id, label: track.label, kind: "zone-enter", target: zone.name });
      }
      if (!isIn && was) {
        zone.exits += 1;
        const start = zone.enteredAt[track.id];
        const dwell = start ? now - start : 0;
        zone.dwellMs[track.id] = (zone.dwellMs[track.id] ?? 0) + dwell;
        delete zone.enteredAt[track.id];
        events.push({ at: now, trackId: track.id, label: track.label, kind: "zone-exit", target: zone.name, dwellMs: dwell });
      }
    }
    zone.occupancy = occ;
  }
  return events;
}

export function meanDwell(zone: Zone) {
  const live = Object.values(zone.enteredAt);
  const done = Object.values(zone.dwellMs);
  if (!done.length && !live.length) return null;
  const now = performance.now();
  const liveMs = live.map((start) => now - start);
  const all = [...done, ...liveMs];
  return all.reduce((sum, value) => sum + value, 0) / all.length;
}
