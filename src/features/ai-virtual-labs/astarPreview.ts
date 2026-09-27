/** A small deterministic A* run for the launcher preview. */
export function createAStarPreview() {
  const width = 7;
  const height = 6;
  const start = 7;
  const goal = 33;
  const walls = new Set([3, 10, 17, 18, 24, 31, 36]);
  const open = new Set([start]);
  const closed: number[] = [];
  const costs = new Map<number, number>([[start, 0]]);
  const parent = new Map<number, number>();
  const estimate = (n: number) => Math.abs(n % width - goal % width) + Math.abs(Math.floor(n / width) - Math.floor(goal / width));

  while (open.size) {
    const current = [...open].sort((a, b) =>
      (costs.get(a)! + estimate(a)) - (costs.get(b)! + estimate(b)) || estimate(a) - estimate(b) || a - b,
    )[0];
    open.delete(current);
    closed.push(current);
    if (current === goal) break;
    const x = current % width;
    const y = Math.floor(current / width);
    const neighbors = [x > 0 ? current - 1 : -1, x < width - 1 ? current + 1 : -1,
      y > 0 ? current - width : -1, y < height - 1 ? current + width : -1];
    for (const next of neighbors) {
      if (next < 0 || walls.has(next)) continue;
      const cost = costs.get(current)! + 1;
      if (cost < (costs.get(next) ?? Infinity)) {
        costs.set(next, cost);
        parent.set(next, current);
        open.add(next);
      }
    }
  }
  const path: number[] = [];
  if (parent.has(goal)) {
    for (let n = goal; n !== start; n = parent.get(n)!) path.unshift(n);
    path.unshift(start);
  }
  return { width, height, start, goal, walls, visited: closed, frontier: [...open], path };
}
