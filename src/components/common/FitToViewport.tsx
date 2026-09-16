import { useLayoutEffect, useRef, type ReactNode } from "react";

function contentSize(host: HTMLElement, inner: HTMLElement) {
  const page = inner.firstElementChild as HTMLElement | null;
  const needW = Math.max(
    inner.scrollWidth,
    inner.offsetWidth,
    page?.scrollWidth ?? 0,
    page?.offsetWidth ?? 0,
  );
  const needH = Math.max(
    inner.scrollHeight,
    inner.offsetHeight,
    page?.scrollHeight ?? 0,
    page?.offsetHeight ?? 0,
  );
  return {
    availW: host.clientWidth,
    availH: host.clientHeight,
    needW,
    needH,
  };
}

/**
 * Keeps an algorithm workbench inside the remaining viewport under the suite
 * top bar. Slight overflow is scaled down; very long document pages scroll.
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
      const { availW, availH, needW, needH } = contentSize(host, inner);
      if (availW < 8 || availH < 8) return;
      const ratio = Math.max(needW / availW, needH / availH);
      if (ratio > 1.02 && ratio <= 2.2) {
        inner.style.zoom = String(1 / ratio);
        host.style.overflow = "hidden";
      } else {
        inner.style.zoom = "1";
        host.style.overflow = ratio > 2.2 ? "auto" : "hidden";
      }
    };

    const observer = new ResizeObserver(() => requestAnimationFrame(apply));
    observer.observe(host);
    observer.observe(inner);
    const page = inner.firstElementChild;
    if (page instanceof HTMLElement) observer.observe(page);
    apply();
    const frame = requestAnimationFrame(apply);
    const later = window.setTimeout(apply, 120);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(later);
    };
  }, []);

  return (
    <div ref={hostRef} className="lab-fit-host">
      <div ref={innerRef} className="lab-fit-inner">
        {children}
      </div>
    </div>
  );
}
