(() => {
  const report = () => {
    const height = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.getElementById('app')?.scrollHeight || 0,
    );
    parent.postMessage({ type: 'ai-lab-size', height }, location.origin);
  };
  addEventListener('load', () => {
    report();
    requestAnimationFrame(() => {
      report();
      parent.postMessage({ type: 'ai-lab-ready' }, location.origin);
    });
  });
  const observer = new ResizeObserver(report);
  observer.observe(document.getElementById('app'));
  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button || parent === window) return;
    const action = button.id || button.dataset.action || button.textContent.trim().slice(0, 60);
    if (/step|run|train|evaluate|improve|apply|validate|extract|update|next|simulate/i.test(action)) {
      parent.postMessage({ type: 'ai-learning-activity', action }, location.origin);
    }
  }, true);
  addEventListener('pagehide', () => {
    observer.disconnect();
    window.gsap?.globalTimeline?.clear();
  });
})();
