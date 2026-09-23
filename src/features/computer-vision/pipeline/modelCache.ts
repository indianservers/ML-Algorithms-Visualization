import {
  createFaceDetector,
  createFaceLandmarker,
  createGestureRecognizer,
  createHandLandmarker,
  createImageSegmenter,
  createObjectDetector,
  createPoseLandmarker,
} from "../runtime/mediapipeRuntime";
import { acquireMobileNet } from "../runtime/tensorflowRuntime";
import type { ModelBag, ModelKind } from "./types";

interface Slot {
  count: number;
  value?: ModelBag[keyof ModelBag];
  promise?: Promise<ModelBag[keyof ModelBag]>;
}

const slots: Partial<Record<ModelKind, Slot>> = {};

async function load(kind: ModelKind): Promise<ModelBag[keyof ModelBag]> {
  if (kind === "object") return createObjectDetector(10, 0.4);
  if (kind === "hands") return createHandLandmarker(2);
  if (kind === "gesture") return createGestureRecognizer(2);
  if (kind === "face") return createFaceDetector(0.5);
  if (kind === "faceMesh") return createFaceLandmarker(1);
  if (kind === "pose") return createPoseLandmarker(false);
  if (kind === "selfie") return createImageSegmenter("selfie", true);
  return acquireMobileNet();
}

export async function acquireModels(kinds: ModelKind[]): Promise<ModelBag> {
  const unique = Array.from(new Set(kinds));
  const bag: ModelBag = {};
  await Promise.all(unique.map(async (kind) => {
    const slot = slots[kind] ?? { count: 0 };
    slots[kind] = slot;
    slot.count += 1;
    if (!slot.value) {
      if (!slot.promise) slot.promise = load(kind);
      slot.value = await slot.promise;
    }
    (bag as Record<string, unknown>)[kind] = slot.value;
  }));
  return bag;
}

export async function releaseModels(kinds: ModelKind[]) {
  for (const kind of Array.from(new Set(kinds))) {
    const slot = slots[kind];
    if (!slot) continue;
    slot.count = Math.max(0, slot.count - 1);
    if (slot.count === 0) {
      const value = slot.value as { close?: () => void } | undefined;
      value?.close?.();
      slot.value = undefined;
      slot.promise = undefined;
    }
  }
}
