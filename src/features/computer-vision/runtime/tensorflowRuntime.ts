import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

let ready: Promise<string> | null = null;

async function tryBackend(name: string): Promise<boolean> {
  try {
    await tf.setBackend(name);
    await tf.ready();
    return tf.getBackend() === name;
  } catch {
    return false;
  }
}

export async function ensureTfBackend(): Promise<string> {
  if (!ready) {
    ready = (async () => {
      if (typeof navigator !== "undefined" && "gpu" in navigator) {
        try {
          await import("@tensorflow/tfjs-backend-webgpu");
          if (await tryBackend("webgpu")) return tf.getBackend();
        } catch {
          /* WebGPU package or adapter unavailable */
        }
      }
      if (await tryBackend("webgl")) return tf.getBackend();
      await tf.setBackend("cpu");
      await tf.ready();
      return tf.getBackend();
    })();
  }
  return ready;
}

export function currentTfBackend(): string {
  try {
    return tf.getBackend() || "uninitialized";
  } catch {
    return "uninitialized";
  }
}

export function disposeTensor(value: tf.Tensor | tf.Tensor[] | null | undefined) {
  if (!value) return;
  const list = Array.isArray(value) ? value : [value];
  for (const item of list) {
    if (item && !item.isDisposed) item.dispose();
  }
}

let mobileNetPromise: Promise<mobilenet.MobileNet> | null = null;

export function acquireMobileNet() {
  if (!mobileNetPromise) {
    mobileNetPromise = ensureTfBackend().then(() => mobilenet.load({ version: 2, alpha: 0.5 }));
  }
  return mobileNetPromise;
}
