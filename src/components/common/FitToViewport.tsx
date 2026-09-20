import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Keeps an algorithm workbench inside the remaining viewport under the suite
 * top bar. Content scrolls; we never lock overflow or force a zoom-out.
 */
export function FitToViewport({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const apply = () => {
      inner.style.zoom = "1";
      host.style.overflowX = "hidden";
      host.style.overflowY = "auto";
    };

    const observer = new ResizeObserver(() => requestAnimationFrame(apply));
    observer.observe(host);
    observer.observe(inner);
    apply();
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="lab-fit-host">
      <div ref={innerRef} className="lab-fit-inner">
        {children}
      </div>
    </div>
  );
}
