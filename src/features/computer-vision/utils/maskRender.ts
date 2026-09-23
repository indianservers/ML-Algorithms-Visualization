export const SEG_PALETTE = [
  "#0f172a", "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f43f5e", "#a855f7", "#10b981", "#f59e0b", "#6366f1",
  "#fb7185", "#34d399", "#60a5fa", "#c084fc", "#fbbf24",
];

export const VOC_FALLBACK = [
  "background", "aeroplane", "bicycle", "bird", "boat", "bottle", "bus", "car", "cat", "chair",
  "cow", "dining table", "dog", "horse", "motorbike", "person", "potted plant", "sheep", "sofa", "train", "tv",
];

export function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

export function countClasses(mask: Uint8Array, classCount: number) {
  const counts = Array.from({ length: classCount }, () => 0);
  for (let i = 0; i < mask.length; i += 1) {
    const id = mask[i] ?? 0;
    if (id >= 0 && id < classCount) counts[id] += 1;
  }
  return counts;
}

export function colorizeCategory(
  mask: Uint8Array,
  width: number,
  height: number,
  hidden: Set<number>,
  opacity: number,
) {
  const image = new ImageData(width, height);
  const data = image.data;
  for (let i = 0; i < mask.length; i += 1) {
    const id = mask[i] ?? 0;
    const px = i * 4;
    if (hidden.has(id)) {
      data[px + 3] = 0;
      continue;
    }
    const [r, g, b] = hexToRgb(SEG_PALETTE[id % SEG_PALETTE.length] ?? "#64748b");
    data[px] = r;
    data[px + 1] = g;
    data[px + 2] = b;
    data[px + 3] = Math.round(opacity * 255);
  }
  return image;
}

export function confidenceToAlpha(conf: Float32Array, width: number, height: number, threshold: number) {
  const image = new ImageData(width, height);
  const data = image.data;
  for (let i = 0; i < conf.length; i += 1) {
    const px = i * 4;
    const a = (conf[i] ?? 0) >= threshold ? 255 : 0;
    data[px] = 255;
    data[px + 1] = 255;
    data[px + 2] = 255;
    data[px + 3] = a;
  }
  return image;
}

const scratch = {
  featherIn: null as HTMLCanvasElement | null,
  featherOut: null as HTMLCanvasElement | null,
  person: null as HTMLCanvasElement | null,
};

function reuseCanvas(held: HTMLCanvasElement | null, width: number, height: number) {
  const canvas = held ?? document.createElement("canvas");
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  return canvas;
}

export function featherMask(mask: ImageData, blurPx: number) {
  scratch.featherIn = reuseCanvas(scratch.featherIn, mask.width, mask.height);
  const ctx = scratch.featherIn.getContext("2d");
  if (!ctx) return scratch.featherIn;
  ctx.clearRect(0, 0, mask.width, mask.height);
  ctx.putImageData(mask, 0, 0);
  if (blurPx > 0) {
    scratch.featherOut = reuseCanvas(scratch.featherOut, mask.width, mask.height);
    const octx = scratch.featherOut.getContext("2d");
    if (!octx) return scratch.featherIn;
    octx.clearRect(0, 0, mask.width, mask.height);
    octx.filter = `blur(${blurPx}px)`;
    octx.drawImage(scratch.featherIn, 0, 0);
    octx.filter = "none";
    return scratch.featherOut;
  }
  return scratch.featherIn;
}

export function drawChecker(ctx: CanvasRenderingContext2D, w: number, h: number, size = 16) {
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      ctx.fillStyle = ((x / size + y / size) & 1) === 0 ? "#dbe4f0" : "#f8fafc";
      ctx.fillRect(x, y, size, size);
    }
  }
}

export type CompositeMode = "original" | "blur" | "solid" | "transparent" | "replace" | "green";

export function compositePerson(options: {
  source: CanvasImageSource;
  width: number;
  height: number;
  maskCanvas: HTMLCanvasElement;
  mode: CompositeMode;
  blur: number;
  solid: string;
  background: CanvasImageSource | null;
  dest: HTMLCanvasElement;
}) {
  const { source, width, height, maskCanvas, mode, blur, solid, background, dest } = options;
  dest.width = width;
  dest.height = height;
  const ctx = dest.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  if (mode === "original") {
    dest.classList.remove("cv-has-alpha");
    ctx.drawImage(source, 0, 0, width, height);
    return;
  }
  dest.classList.toggle("cv-has-alpha", mode === "transparent");
  if (mode === "solid" || mode === "green") {
    ctx.fillStyle = solid;
    ctx.fillRect(0, 0, width, height);
  } else if (mode === "replace" && background) {
    ctx.drawImage(background, 0, 0, width, height);
  } else if (mode === "blur") {
    ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(source, 0, 0, width, height);
    ctx.filter = "none";
  } else if (mode !== "transparent") {
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, width, height);
  }
  scratch.person = reuseCanvas(scratch.person, width, height);
  const pctx = scratch.person.getContext("2d");
  if (!pctx) return;
  pctx.clearRect(0, 0, width, height);
  pctx.globalCompositeOperation = "source-over";
  pctx.drawImage(source, 0, 0, width, height);
  pctx.globalCompositeOperation = "destination-in";
  pctx.drawImage(maskCanvas, 0, 0, width, height);
  pctx.globalCompositeOperation = "source-over";
  ctx.drawImage(scratch.person, 0, 0);
}

const BG_CACHE: Array<{ id: string; name: string; url: string }> = [];

export function bundledBackgrounds() {
  if (BG_CACHE.length) return BG_CACHE;
  const make = (id: string, name: string, paint: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paint(ctx);
    BG_CACHE.push({ id, name, url: canvas.toDataURL("image/jpeg", 0.85) });
  };
  make("sky", "Sky", (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, "#7dd3fc");
    g.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 960, 540);
  });
  make("dusk", "Dusk", (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, "#fed7aa");
    g.addColorStop(1, "#7c3aed");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 960, 540);
  });
  make("studio", "Studio gray", (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 960, 540);
    g.addColorStop(0, "#cbd5e1");
    g.addColorStop(1, "#334155");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 960, 540);
  });
  return BG_CACHE;
}

export function downloadCanvas(canvas: HTMLCanvasElement, name: string) {
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
}
