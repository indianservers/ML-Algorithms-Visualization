/** Marching squares in original feature coordinates, including vertical boundaries. */
export function svmContours(score: (point: number[]) => number, bounds: { x0: number; x1: number; y0: number; y1: number }, level: number) {
  const n = 40;
  const values = Array.from({ length: n + 1 }, (_, y) => Array.from({ length: n + 1 }, (_, x) => score([bounds.x0 + x / n * (bounds.x1 - bounds.x0), bounds.y0 + y / n * (bounds.y1 - bounds.y0)]) - level));
  const segments: string[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const corners = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
    const hits: number[][] = [];
    for (let edge = 0; edge < 4; edge++) {
      const a = corners[edge], b = corners[(edge + 1) % 4];
      const va = values[a[1]][a[0]], vb = values[b[1]][b[0]];
      if ((va >= 0) === (vb >= 0)) continue;
      const t = va / (va - vb);
      hits.push([(a[0] + t * (b[0] - a[0])) / n * 100, 100 - (a[1] + t * (b[1] - a[1])) / n * 100]);
    }
    for (let i = 0; i + 1 < hits.length; i += 2) segments.push(`M${hits[i][0]},${hits[i][1]}L${hits[i + 1][0]},${hits[i + 1][1]}`);
  }
  return segments.join('');
}
