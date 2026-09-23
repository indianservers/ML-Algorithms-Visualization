export interface PixelBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PixelPoint {
  x: number;
  y: number;
}

export interface LineSeg {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export function boxIou(a: PixelBox, b: PixelBox) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union <= 0 ? 0 : inter / union;
}

export function boxCenter(box: PixelBox): PixelPoint {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

export function dist2(a: PixelPoint, b: PixelPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function lineSide(line: LineSeg, point: PixelPoint) {
  return (line.bx - line.ax) * (point.y - line.ay) - (line.by - line.ay) * (point.x - line.ax);
}

/** Returns the first crossing of the directed segment A→B, with hysteresis via previous sign. */
export function lineCross(line: LineSeg, prev: PixelPoint, next: PixelPoint): "ab" | "ba" | null {
  const s0 = lineSide(line, prev);
  const s1 = lineSide(line, next);
  if (s0 === 0 || s1 === 0) return null;
  if (s0 > 0 && s1 < 0) return "ab";
  if (s0 < 0 && s1 > 0) return "ba";
  return null;
}

export function pointInRect(point: PixelPoint, box: PixelBox) {
  return point.x >= box.x && point.y >= box.y && point.x <= box.x + box.w && point.y <= box.y + box.h;
}

export function pointInPolygon(point: PixelPoint, polygon: PixelPoint[]) {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    const intersect = a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 1e-6) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pathLength(points: PixelPoint[]) {
  let sum = 0;
  for (let i = 1; i < points.length; i += 1) sum += dist2(points[i - 1]!, points[i]!);
  return sum;
}

export function headingDeg(vx: number, vy: number) {
  if (vx === 0 && vy === 0) return null;
  return ((Math.atan2(vy, vx) * 180) / Math.PI + 360) % 360;
}
