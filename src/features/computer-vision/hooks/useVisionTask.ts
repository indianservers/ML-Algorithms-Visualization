import { useCallback, useEffect, useRef } from "react";
import { formatVisionError } from "../runtime/mediapipeRuntime";

export function useVisionTask<T extends { close: () => void }>(factory: () => Promise<T>) {
  const taskRef = useRef<T | null>(null);
  const aliveRef = useRef(true);
  const factoryRef = useRef(factory);
  const failUntilRef = useRef(0);
  const failMsgRef = useRef<string | null>(null);
  factoryRef.current = factory;

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      taskRef.current?.close();
      taskRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    taskRef.current?.close();
    taskRef.current = null;
    failUntilRef.current = 0;
    failMsgRef.current = null;
  }, []);

  const ensure = useCallback(async () => {
    if (taskRef.current) return taskRef.current;
    if (Date.now() < failUntilRef.current && failMsgRef.current) {
      throw new Error(failMsgRef.current);
    }
    try {
      const task = await factoryRef.current();
      if (!aliveRef.current) {
        task.close();
        throw new Error("Computer Vision lab unmounted while loading a model.");
      }
      failMsgRef.current = null;
      taskRef.current = task;
      return task;
    } catch (error) {
      const message = formatVisionError(error, "Vision model failed to load.");
      failMsgRef.current = message;
      failUntilRef.current = Date.now() + 4000;
      throw new Error(message);
    }
  }, []);

  return { taskRef, ensure, reset, aliveRef };
}
