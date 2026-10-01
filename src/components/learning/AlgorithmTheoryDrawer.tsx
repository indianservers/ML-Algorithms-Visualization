import { useEffect, useRef } from "react";
import { BookOpen, X } from "lucide-react";
import { getLearnPageContent } from "../../data/algorithmLearnTheory";
import "./AlgorithmTheoryDrawer.css";

export function AlgorithmTheoryDrawer({ route, onClose }: { route: string; onClose: () => void }) {
  const content = getLearnPageContent(route);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="algorithm-theory-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside className="algorithm-theory-drawer" role="dialog" aria-modal="true" aria-label={`${content.label} theory`}>
        <header>
          <div><BookOpen aria-hidden="true" /><div><small>ALGORITHM THEORY</small><h2>{content.label}</h2></div></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close theory"><X /></button>
        </header>
        <div className="algorithm-theory-content">
          <section><h3>Core idea</h3><p>{content.idea}</p></section>
          {content.formula && <section><h3>Key relationship</h3><p className="algorithm-theory-formula">{content.formula}</p></section>}
          <section><h3>Why it works</h3>{content.theory.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>
          {content.parameters.length > 0 && <section><h3>Key parameters</h3><ul>{content.parameters.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          <section><h3>Assumptions and inputs</h3><p>{content.assumptions}</p></section>
          <section><h3>How to judge the result</h3><p>{content.evaluation}</p></section>
          <section><h3>Try it in this lab</h3><p>{content.experiment}</p></section>
          {content.miniExample && <section><h3>Mini example</h3><p>{content.miniExample}</p></section>}
          {content.mistakes.length > 0 && <section><h3>Common mistakes</h3><ul>{content.mistakes.map((item) => <li key={item}>{item}</li>)}</ul></section>}
        </div>
      </aside>
    </div>
  );
}
