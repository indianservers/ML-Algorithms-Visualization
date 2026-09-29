import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./AlgorithmTabPresentation.css";

// Older labs own their tab state and markup. Decorate only their lesson tabs so
// their click handlers, keyboard behavior, and URL synchronization stay intact.
const iconPaths: Record<string, string> = {
  learn: '<path d="M12 7v14"/><path d="M3 18V4a1 1 0 0 1 1-1h3a5 5 0 0 1 5 5 5 5 0 0 1 5-5h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3a5 5 0 0 0-5 2 5 5 0 0 0-5-2H4a1 1 0 0 1-1-1Z"/>',
  visualize: '<path d="M3 3v18h18"/><path d="M7 16v-4m5 4V7m5 9v-7"/>',
  dataset: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  train: '<path d="m7 4 13 8-13 8V4Z"/>',
  metrics: '<path d="M3 3v18h18"/><path d="m6 16 4-5 4 3 5-7"/>',
  compare: '<path d="M12 3v18M5 6h14M5 6l-3 7h6L5 6Zm14 0-3 7h6l-3-7ZM8 20h8"/>',
  explain: '<path d="M9 18h6m-5 4h4M9 14a6 6 0 1 1 6 0c-.6.6-1 1.2-1 2H10c0-.8-.4-1.4-1-2Z"/>',
  inference: '<path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  transform: '<path d="M4 7h12m0 0-3-3m3 3-3 3M20 17H8m0 0 3-3m-3 3 3 3"/>',
};

function tabKind(text: string) {
  const label = text.toLowerCase().replace(/^[^a-z]+/, "").trim();
  if (label === "build / train" || label === "build/train") return "train";
  if (label === "live test/inference") return "inference";
  return iconPaths[label] ? label : "";
}

function decorateTabs(showInference: boolean) {
  const host = document.getElementById("main-content");
  if (!host) return;
  const groups = new Map<Element, HTMLButtonElement[]>();
  host.querySelectorAll("button").forEach((button) => {
    if (!(button instanceof HTMLButtonElement) || !button.parentElement) return;
    const buttons = groups.get(button.parentElement) ?? [];
    buttons.push(button);
    groups.set(button.parentElement, buttons);
  });
  groups.forEach((buttons, container) => {
    if (buttons.length < 4 || !buttons.some((button) => tabKind(button.textContent ?? "") === "learn")) return;
    const recognized = buttons.filter((button) => tabKind(button.textContent ?? ""));
    if (recognized.length < 4) return;

    (container as HTMLElement).dataset.mlLessonTabs = "";
    (container as HTMLElement).style.setProperty("--ml-tab-count", String(buttons.length));
    buttons.forEach((button) => {
      let kind = tabKind(button.textContent ?? "");
      if (!kind) return;
      if (showInference && kind === "explain") {
        const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          if (node.textContent?.trim() === "Explain") {
            node.textContent = "Live test/inference";
            break;
          }
        }
        kind = "inference";
      }
      button.dataset.mlTab = kind;
      // Decision Tree, PCA, and a few other labs already render SVG icons.
      if (button.querySelector("svg, .ml-tab-icon")) return;
      const icon = document.createElement("span");
      icon.className = "ml-tab-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPaths[kind]}</svg>`;
      button.prepend(icon);
    });
  });
}

export function AlgorithmTabPresentation() {
  const location = useLocation();
  useEffect(() => {
    if (!location.pathname.startsWith("/ml/")) return;
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        decorateTabs(location.pathname.startsWith("/ml/supervised/"));
      });
    };
    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.type === "characterData" || Array.from(record.addedNodes).some(
        (node) => node instanceof Element && (node.matches("button") || Boolean(node.querySelector("button"))),
      ))) schedule();
    });
    observer.observe(document.getElementById("main-content") ?? document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [location.pathname]);
  return null;
}
