import { describe, expect, it } from 'vitest';
import { createAStarPreview } from '../src/features/ai-virtual-labs/astarPreview';

describe('AI launcher A* preview', () => {
  it('finds a valid shortest route around blocked cells', () => {
    const result = createAStarPreview();
    expect(result.path[0]).toBe(result.start);
    expect(result.path.at(-1)).toBe(result.goal);
    for (const cell of result.path) expect(result.walls.has(cell)).toBe(false);
    for (let i = 1; i < result.path.length; i++) {
      const a = result.path[i - 1], b = result.path[i];
      const distance = Math.abs(a % result.width - b % result.width) +
        Math.abs(Math.floor(a / result.width) - Math.floor(b / result.width));
      expect(distance).toBe(1);
    }
    expect(result.visited).toContain(result.goal);
    expect(result.path.length).toBeGreaterThan(2);
  });
});
