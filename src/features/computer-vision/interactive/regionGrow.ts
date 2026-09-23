export interface Seed {
  x: number;
  y: number;
  kind: "pos" | "neg";
}

export interface GrowBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GrowResult {
  mask: Uint8ClampedArray;
  width: number;
  height: number;
  pixels: number;
  coverage: number;
  contours: number;
  ms: number;
}

function colorAt(data: Uint8ClampedArray, index: number) {
  const i = index * 4;
  return [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0] as const;
}

function dist(a: readonly [number, number, number], b: readonly [number, number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function flood(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  seeds: Array<{ x: number; y: number }>,
  tolerance: number,
  box: GrowBox | null,
  blocked: Uint8Array | null,
) {
  const mask = new Uint8Array(width * height);
  const queue: number[] = [];
  const refs: Array<readonly [number, number, number]> = [];
  for (const seed of seeds) {
    const x = Math.max(0, Math.min(width - 1, Math.round(seed.x)));
    const y = Math.max(0, Math.min(height - 1, Math.round(seed.y)));
    const index = y * width + x;
    mask[index] = 1;
    queue.push(index);
    refs.push(colorAt(data, index));
  }
  const inBox = (x: number, y: number) => {
    if (!box) return true;
    return x >= box.x && y >= box.y && x <= box.x + box.w && y <= box.y + box.h;
  };
  let head = 0;
  while (head < queue.length) {
    const index = queue[head]!;
    head += 1;
    const x = index % width;
    const y = (index - x) / width;
    const neighbors = [index - 1, index + 1, index - width, index + width];
    for (const next of neighbors) {
      if (next < 0 || next >= mask.length || mask[next]) continue;
      if (blocked?.[next]) continue;
      const nx = next % width;
      const ny = (next - nx) / width;
      if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
      if (!inBox(nx, ny)) continue;
      const color = colorAt(data, next);
      if (!refs.some((ref) => dist(ref, color) <= tolerance)) continue;
      mask[next] = 1;
      queue.push(next);
    }
  }
  return mask;
}

export function countContours(mask: Uint8Array, width: number, height: number) {
  const seen = new Uint8Array(mask.length);
  let count = 0;
  const isEdge = (index: number) => {
    if (!mask[index]) return false;
    const x = index % width;
    const y = (index - x) / width;
    return (
      x === 0 || y === 0 || x === width - 1 || y === height - 1 ||
      !mask[index - 1] || !mask[index + 1] || !mask[index - width] || !mask[index + width]
    );
  };
  for (let i = 0; i < mask.length; i += 1) {
    if (!isEdge(i) || seen[i]) continue;
    count += 1;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const index = stack.pop()!;
      const x = index % width;
      for (const next of [index - 1, index + 1, index - width, index + width]) {
        if (next < 0 || next >= mask.length || seen[next] || !isEdge(next)) continue;
        const nx = next % width;
        if (Math.abs(nx - x) + Math.abs(((next - nx) / width) - ((index - x) / width)) !== 1) continue;
        seen[next] = 1;
        stack.push(next);
      }
    }
  }
  return count;
}

export function regionGrow(
  image: ImageData,
  seeds: Seed[],
  tolerance: number,
  box: GrowBox | null,
): GrowResult {
  const started = performance.now();
  const { data, width, height } = image;
  const positives = seeds.filter((seed) => seed.kind === "pos");
  const negatives = seeds.filter((seed) => seed.kind === "neg");
  if (!positives.length) {
    return { mask: new Uint8ClampedArray(width * height), width, height, pixels: 0, coverage: 0, contours: 0, ms: 0 };
  }
  const blocked = negatives.length
    ? flood(data, width, height, negatives, Math.max(8, tolerance * 0.6), box, null)
    : null;
  const grown = flood(data, width, height, positives, tolerance, box, blocked);
  const out = new Uint8ClampedArray(width * height);
  let pixels = 0;
  for (let i = 0; i < grown.length; i += 1) {
    if (grown[i]) {
      out[i] = 255;
      pixels += 1;
    }
  }
  return {
    mask: out,
    width,
    height,
    pixels,
    coverage: pixels / (width * height),
    contours: countContours(grown, width, height),
    ms: performance.now() - started,
  };
}

export function maskToImage(mask: Uint8ClampedArray, width: number, height: number, color: [number, number, number, number] = [37, 99, 235, 140]) {
  const image = new ImageData(width, height);
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i]) continue;
    const px = i * 4;
    image.data[px] = color[0];
    image.data[px + 1] = color[1];
    image.data[px + 2] = color[2];
    image.data[px + 3] = color[3];
  }
  return image;
}

export function extractObject(source: ImageData, mask: Uint8ClampedArray, feather = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.putImageData(source, 0, 0);
  const alpha = document.createElement("canvas");
  alpha.width = source.width;
  alpha.height = source.height;
  const actx = alpha.getContext("2d");
  if (!actx) return canvas;
  const image = new ImageData(source.width, source.height);
  for (let i = 0; i < mask.length; i += 1) {
    const px = i * 4;
    const a = mask[i] ?? 0;
    image.data[px] = 255;
    image.data[px + 1] = 255;
    image.data[px + 2] = 255;
    image.data[px + 3] = a;
  }
  actx.putImageData(image, 0, 0);
  if (feather > 0) {
    const blur = document.createElement("canvas");
    blur.width = source.width;
    blur.height = source.height;
    const bctx = blur.getContext("2d");
    if (bctx) {
      bctx.filter = `blur(${feather}px)`;
      bctx.drawImage(alpha, 0, 0);
      actx.clearRect(0, 0, source.width, source.height);
      actx.drawImage(blur, 0, 0);
    }
  }
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(alpha, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}

export function cropOpaque(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) < 8) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return canvas;
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d")?.drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}
