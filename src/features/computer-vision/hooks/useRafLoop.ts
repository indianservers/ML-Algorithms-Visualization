import { useEffect, useRef } from "react";

export function useRafLoop(active: boolean, tick: (now: number) => void | Promise<void>) {
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    if (!active) return undefined;
    let handle = 0;
    let inflight = false;
    let cancelled = false;
    const loop = (now: number) => {
      if (cancelled) return;
      if (!inflight) {
        inflight = true;
        Promise.resolve()
          .then(() => {
            if (cancelled) return;
            return tickRef.current(now);
          })
          .finally(() => {
            inflight = false;
          });
      }
      handle = window.requestAnimationFrame(loop);
    };
    handle = window.requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(handle);
    };
  }, [active]);
}
