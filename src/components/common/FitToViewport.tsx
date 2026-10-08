import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Keeps an algorithm workbench inside the remaining viewport under the suite
 * top bar. Content scrolls; we never lock overflow or force a zoom-out.
 */
export function FitToViewport({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [actions, setActions] = useState<HTMLButtonElement[]>([]);
  const [hasConfig, setHasConfig] = useState(false);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const apply = () => {
      inner.style.zoom = "1";
      host.style.overflowX = "hidden";
      host.style.overflowY = "auto";
      const configs = inner.querySelectorAll('aside[class*="controls"], section[class*="-controls"], [data-guide="algo-params"], [class*="-control-panel"]');
      configs.forEach(el => el.classList.add('mobile-algorithm-config'));
      setHasConfig(configs.length > 0);
      const next = [...inner.querySelectorAll<HTMLButtonElement>('button')].filter(button =>
        /^(run|train|step|reset|pause|play)(\s|$)/i.test(button.textContent?.trim() ?? '') && !button.closest('.lab-tab-lesson')
      ).slice(0, 4);
      setActions(current => current.length === next.length && current.every((button, index) => button === next[index]) ? current : next);
    };

    const observer = new ResizeObserver(() => requestAnimationFrame(apply));
    observer.observe(host);
    observer.observe(inner);
    const mutations = new MutationObserver(() => requestAnimationFrame(apply));
    mutations.observe(inner, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'], characterData: true });
    apply();
    return () => { observer.disconnect(); mutations.disconnect(); };
  }, []);

  return (
    <div ref={hostRef} className={`lab-fit-host mobile-algorithm-workspace${configOpen ? ' mobile-config-open' : ''}`}>
      {(hasConfig || actions.length > 0) && <nav className="mobile-algorithm-dock" aria-label="Simulation controls">
        {hasConfig && <button type="button" aria-expanded={configOpen} onClick={() => setConfigOpen(!configOpen)}>{configOpen ? 'Done' : 'Configure'}</button>}
        {actions.map((button, index) => <button key={index} type="button" disabled={button.disabled} onClick={() => { button.click(); setActions(current => [...current]); }}>{button.textContent}</button>)}
      </nav>}
      <div ref={innerRef} className="lab-fit-inner">
        {children}
      </div>
    </div>
  );
}
