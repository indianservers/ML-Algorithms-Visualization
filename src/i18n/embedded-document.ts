import { translateText } from './config';

/** Standalone, same-origin lab renderers do not use React's JSX runtime.
 * Translate display nodes in place without rewriting HTML, controls, handlers,
 * canvas geometry, or the simulator's model. Each node retains its source. */
export function localizeEmbeddedDocument(document: Document) {
  const originals = new WeakMap<Node, { source: string; display: string }>();
  const attributes = new WeakMap<Element, Map<string, { source: string; display: string }>>();
  const skip = 'script,style,pre,code,kbd,textarea,math,[contenteditable=true],[data-i18n-protect]';
  const update = (root: Node) => {
    const walker = document.createTreeWalker(root, 4);
    const textNodes: Node[] = root.nodeType === 3 ? [root] : [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const node of textNodes) {
      const parent = node.parentElement;
      if (!parent || parent.closest(skip) || (parent.tagName === 'OPTION' && !parent.hasAttribute('value'))) continue;
      const current = node.nodeValue ?? '';
      const previous = originals.get(node);
      const source = previous && previous.display === current ? previous.source : current;
      const display = translateText(source);
      originals.set(node, { source, display });
      if (display !== current) node.nodeValue = display;
    }
    const elements = root.nodeType === 1 ? [root as Element, ...((root as Element).querySelectorAll('*'))] : root.nodeType === 9 ? [...(root as Document).querySelectorAll('*')] : [];
    for (const element of elements) {
      if (element.closest(skip)) continue;
      let saved = attributes.get(element);
      if (!saved) { saved = new Map(); attributes.set(element, saved); }
      for (const name of ['title', 'aria-label', 'placeholder', 'alt']) {
        const current = element.getAttribute(name);
        if (!current) continue;
        const previous = saved.get(name);
        const source = previous?.display === current ? previous.source : current;
        const display = translateText(source);
        saved.set(name, { source, display });
        if (current !== display) element.setAttribute(name, display);
      }
    }
  };
  const refresh = () => {
    document.documentElement.lang = globalThis.document.documentElement.lang;
    document.documentElement.dir = globalThis.document.documentElement.dir;
    update(document);
  };
  const observer = new MutationObserver(records => {
    // Disconnect during our own writes to avoid recursive mutation notifications.
    observer.disconnect();
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(update);
      else update(record.target);
    }
    observe();
  });
  const observe = () => observer.observe(document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['title','aria-label','placeholder','alt']});
  refresh(); observe();
  return {refresh: () => {observer.disconnect(); refresh(); observe();}, dispose: () => observer.disconnect()};
}
