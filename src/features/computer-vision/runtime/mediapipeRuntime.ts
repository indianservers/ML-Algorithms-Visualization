import {
  FaceDetector,
  FaceLandmarker,
  FilesetResolver,
  GestureRecognizer,
  HandLandmarker,
  ImageSegmenter,
  ObjectDetector,
  PoseLandmarker,
  type FaceLandmarkerResult,
  type GestureRecognizerResult,
  type HandLandmarkerResult,
  type ImageSegmenterResult,
  type ObjectDetectorResult,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

const WASM_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const WASM_LOCAL = `${import.meta.env.BASE_URL}mediapipe/wasm`.replace(/\/{2,}/g, "/").replace(":/", "://");
const HOLD_MS = 1800;
const FAIL_HOLD_MS = 4000;

const failCache = new Map<string, { until: number; message: string }>();

export function formatVisionError(error: unknown, fallback: string): string {
  if (typeof Event !== "undefined" && error instanceof Event) {
    const target = error.target as { src?: string; href?: string } | null;
    const src = target?.src || target?.href;
    return src
      ? `MediaPipe WASM failed to load (${src}).`
      : "MediaPipe WASM failed to load. The local /mediapipe/wasm path served HTML instead of the binary.";
  }
  if (error instanceof Error) {
    const message = error.message.trim();
    if (!message || message === "[object Event]") {
      return "MediaPipe WASM failed to load. Retrying from the CDN.";
    }
    return message;
  }
  const text = String(error);
  if (!text || text === "[object Event]") return fallback;
  return text;
}

export function keepVisionStatus(current: string, loading: string) {
  if (/failed to load|wasm failed|unmounted while loading/i.test(current)) return current;
  return loading;
}

function isWasmLoadFailure(error: unknown): boolean {
  if (typeof Event !== "undefined" && error instanceof Event) return true;
  const message = error instanceof Error ? error.message : String(error);
  return message === "[object Event]" || /wasm failed to load|failed to fetch dynamically imported module|importscripts/i.test(message);
}

type Closeable = { close: () => void };

interface CacheEntry {
  task: Closeable;
  rawClose: () => void;
  refs: number;
  timer?: ReturnType<typeof setTimeout>;
}

const taskCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<Closeable>>();

function releaseTask(key: string) {
  const entry = taskCache.get(key);
  if (!entry) return;
  entry.refs = Math.max(0, entry.refs - 1);
  if (entry.refs > 0) return;
  if (entry.timer) clearTimeout(entry.timer);
  entry.timer = setTimeout(() => {
    entry.rawClose();
    taskCache.delete(key);
  }, HOLD_MS);
}

async function cachedTask<T extends Closeable>(key: string, factory: () => Promise<T>): Promise<T> {
  const blocked = failCache.get(key);
  if (blocked && Date.now() < blocked.until) {
    throw new Error(blocked.message);
  }
  const existing = taskCache.get(key);
  if (existing) {
    if (existing.timer) {
      clearTimeout(existing.timer);
      existing.timer = undefined;
    }
    existing.refs += 1;
    return existing.task as T;
  }
  let pending = inflight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = factory()
      .then((task) => {
        failCache.delete(key);
        const rawClose = task.close.bind(task);
        task.close = () => releaseTask(key);
        taskCache.set(key, { task, rawClose, refs: 0 });
        inflight.delete(key);
        return task;
      })
      .catch((error) => {
        inflight.delete(key);
        const message = formatVisionError(error, "Vision model failed to load.");
        failCache.set(key, { until: Date.now() + FAIL_HOLD_MS, message });
        throw new Error(message);
      });
    inflight.set(key, pending);
  }
  const task = await pending;
  const entry = taskCache.get(key);
  if (entry) {
    if (entry.timer) {
      clearTimeout(entry.timer);
      entry.timer = undefined;
    }
    entry.refs += 1;
  }
  return task;
}

const MODELS = {
  object:
    "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
  hands:
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  gesture:
    "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
  face:
    "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
  faceMesh:
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  pose:
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  poseFull:
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
  deeplab:
    "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite",
  selfieMulti:
    "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite",
  selfie:
    "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite",
} as const;

type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

let fileset: VisionFileset | null = null;
let filesetPromise: Promise<VisionFileset> | null = null;
let filesetBase = "";

function wasmBase(url: string) {
  return url.replace(/\/$/, "");
}

async function assetLooksReal(url: string, kind: "js" | "wasm"): Promise<boolean> {
  try {
    const head = await fetch(url, { method: "HEAD", cache: "no-store" });
    const headType = (head.headers.get("content-type") ?? "").toLowerCase();
    if (head.ok && (headType.includes("text/html") || headType.includes("text/css"))) return false;
    if (kind === "wasm") {
      return head.ok && (headType.includes("wasm") || headType.includes("octet-stream") || headType.includes("binary"));
    }
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { Range: "bytes=0-255" },
    });
    if (!response.ok) return false;
    const type = (response.headers.get("content-type") ?? headType).toLowerCase();
    if (type.includes("text/html") || type.includes("text/css")) return false;
    const sample = (await response.text()).slice(0, 160).trimStart().toLowerCase();
    if (sample.startsWith("<!") || sample.startsWith("<html")) return false;
    return sample.includes("wasm") || sample.includes("webassembly") || sample.includes("instantiate");
  } catch {
    return false;
  }
}

async function localWasmUsable(): Promise<boolean> {
  const base = wasmBase(WASM_LOCAL);
  const [jsOk, wasmOk] = await Promise.all([
    assetLooksReal(`${base}/vision_wasm_internal.js`, "js"),
    assetLooksReal(`${base}/vision_wasm_internal.wasm`, "wasm"),
  ]);
  return jsOk && wasmOk;
}

async function resolveFileset(base: string): Promise<VisionFileset> {
  filesetBase = wasmBase(base);
  fileset = await FilesetResolver.forVisionTasks(filesetBase);
  return fileset;
}

async function forceCdnFileset(): Promise<VisionFileset> {
  fileset = null;
  filesetPromise = resolveFileset(WASM_CDN);
  return filesetPromise;
}

async function visionFileset() {
  if (fileset) return fileset;
  if (!filesetPromise) {
    filesetPromise = (async () => {
      try {
        const preferLocal = await localWasmUsable();
        return await resolveFileset(preferLocal ? WASM_LOCAL : WASM_CDN);
      } catch (error) {
        fileset = null;
        filesetPromise = null;
        throw error;
      }
    })();
  }
  return filesetPromise;
}

async function withDelegate<T>(factory: (wasm: VisionFileset, delegate: "GPU" | "CPU") => Promise<T>) {
  const run = async (delegate: "GPU" | "CPU") => factory(await visionFileset(), delegate);
  try {
    return await run("GPU");
  } catch (gpuError) {
    if (isWasmLoadFailure(gpuError) && filesetBase !== wasmBase(WASM_CDN)) {
      await forceCdnFileset();
    }
    try {
      return await run("CPU");
    } catch (cpuError) {
      if (isWasmLoadFailure(cpuError) && filesetBase !== wasmBase(WASM_CDN)) {
        await forceCdnFileset();
        return run("CPU");
      }
      throw cpuError;
    }
  }
}

export async function createObjectDetector(maxResults = 10, threshold = 0.4) {
  const detector = await cachedTask("object", () => withDelegate((wasm, delegate) => ObjectDetector.createFromOptions(wasm, {
    baseOptions: { modelAssetPath: MODELS.object, delegate },
    runningMode: "VIDEO",
    scoreThreshold: 0.1,
    maxResults: 25,
  })));
  await detector.setOptions({ scoreThreshold: threshold, maxResults });
  return detector;
}

export async function createHandLandmarker(numHands = 2) {
  const landmarker = await cachedTask("hands", () => withDelegate((wasm, delegate) => HandLandmarker.createFromOptions(wasm, {
    baseOptions: { modelAssetPath: MODELS.hands, delegate },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })));
  await landmarker.setOptions({ numHands });
  return landmarker;
}

export async function createGestureRecognizer(numHands = 2) {
  const recognizer = await cachedTask("gesture", () => withDelegate((wasm, delegate) => GestureRecognizer.createFromOptions(wasm, {
    baseOptions: { modelAssetPath: MODELS.gesture, delegate },
    runningMode: "VIDEO",
    numHands: 2,
  })));
  await recognizer.setOptions({ numHands });
  return recognizer;
}

export async function createFaceDetector(threshold = 0.5) {
  const detector = await cachedTask("face", () => withDelegate((wasm, delegate) => FaceDetector.createFromOptions(wasm, {
    baseOptions: { modelAssetPath: MODELS.face, delegate },
    runningMode: "VIDEO",
    minDetectionConfidence: 0.3,
  })));
  await detector.setOptions({ minDetectionConfidence: threshold });
  return detector;
}

export async function createFaceLandmarker(numFaces = 1) {
  const landmarker = await cachedTask("faceMesh", () => withDelegate((wasm, delegate) => FaceLandmarker.createFromOptions(wasm, {
    baseOptions: { modelAssetPath: MODELS.faceMesh, delegate },
    runningMode: "VIDEO",
    numFaces: 4,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })));
  await landmarker.setOptions({ numFaces });
  return landmarker;
}

export async function createPoseLandmarker(full = false) {
  const key = full ? "pose-full" : "pose-lite";
  const modelAssetPath = full ? MODELS.poseFull : MODELS.pose;
  return cachedTask(key, () => withDelegate((wasm, delegate) => PoseLandmarker.createFromOptions(wasm, {
    baseOptions: { modelAssetPath, delegate },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })));
}

export type SegmenterKind = "deeplab" | "selfieMulti" | "selfie";

export async function createImageSegmenter(kind: SegmenterKind, categoryMask = true) {
  const key = `${kind}:${categoryMask ? "cat" : "conf"}`;
  const modelAssetPath = kind === "deeplab" ? MODELS.deeplab : kind === "selfieMulti" ? MODELS.selfieMulti : MODELS.selfie;
  return cachedTask(key, () => withDelegate((wasm, delegate) => ImageSegmenter.createFromOptions(wasm, {
    baseOptions: { modelAssetPath, delegate },
    runningMode: "VIDEO",
    outputCategoryMask: categoryMask,
    outputConfidenceMasks: kind === "selfie" || !categoryMask,
  })));
}

export type {
  FaceLandmarkerResult,
  GestureRecognizerResult,
  HandLandmarkerResult,
  ImageSegmenterResult,
  ObjectDetectorResult,
  PoseLandmarkerResult,
};

export const FACE_MESH_GROUPS = {
  tesselation: FaceLandmarker.FACE_LANDMARKS_TESSELATION,
  contours: FaceLandmarker.FACE_LANDMARKS_CONTOURS,
  oval: FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
  leftEye: FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
  rightEye: FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
  leftBrow: FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
  rightBrow: FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
  leftIris: FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
  rightIris: FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
  lips: FaceLandmarker.FACE_LANDMARKS_LIPS,
} as const;

export const POSE_CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS;

export const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];
