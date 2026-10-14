import { expect, test } from 'vitest';
import { svmContours } from '../src/pages/algorithms/supervised/classification/svmContours';

test('contours render a vertical separator in original coordinates', () => {
  const path = svmContours(([x]) => x, { x0: -1, x1: 1, y0: -1, y1: 1 }, 0);
  expect(path).toContain('M50,');
  expect(path).not.toContain('NaN');
});
test('nonlinear circle contour exists and absent levels stay empty', () => {
  const bounds = { x0: -2, x1: 2, y0: -2, y1: 2 };
  expect(svmContours(([x, y]) => x * x + y * y - 1, bounds, 0)).not.toBe('');
  expect(svmContours(() => 2, bounds, 0)).toBe('');
});
