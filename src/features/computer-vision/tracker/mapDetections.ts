import type { ObjectDetectorResult } from "@mediapipe/tasks-vision";
import type { RawDetection } from "../tracker/ObjectTracker";

export function mapDetections(result: ObjectDetectorResult, threshold: number, maxResults: number): RawDetection[] {
  return (result.detections ?? [])
    .map((item) => {
      const category = item.categories[0];
      const box = item.boundingBox;
      return {
        label: category?.categoryName ?? "object",
        score: category?.score ?? 0,
        box: {
          x: box?.originX ?? 0,
          y: box?.originY ?? 0,
          w: box?.width ?? 0,
          h: box?.height ?? 0,
        },
      };
    })
    .filter((item) => item.score >= threshold)
    .slice(0, maxResults);
}
