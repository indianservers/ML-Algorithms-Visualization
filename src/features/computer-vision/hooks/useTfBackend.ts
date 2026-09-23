import { useEffect, useState } from "react";
import { currentTfBackend, ensureTfBackend } from "../runtime/tensorflowRuntime";

export function useTfBackend() {
  const [backend, setBackend] = useState(currentTfBackend);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void ensureTfBackend().then((name) => {
      if (!active) return;
      setBackend(name);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return { backend, ready };
}
