export type TrainingActivityEvent = {
  kind: "start" | "progress" | "complete" | "error";
  message: string;
  current?: number;
  total?: number;
};

/** Optional detail from a lab that can report real optimizer checkpoints. */
export function reportTrainingActivity(detail: TrainingActivityEvent) {
  window.dispatchEvent(new CustomEvent<TrainingActivityEvent>("ml:training-activity", { detail }));
}
