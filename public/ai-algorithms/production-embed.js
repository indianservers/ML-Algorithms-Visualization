(() => {
  const setupMobileWorkspace = () => {
    const app = document.querySelector('.app');
    const controls = app?.querySelector('.controls, .side');
    const stage = app?.querySelector('.canvas-card, .visual, .workspace, .main-column');
    if (!app || !controls || !stage || app.querySelector('.mobile-lab-dock')) return;
    const dock = document.createElement('nav');
    dock.className = 'mobile-lab-dock';
    dock.setAttribute('aria-label', 'Simulation controls');
    const config = document.createElement('button');
    config.textContent = 'Configure';
    config.setAttribute('aria-expanded', 'false');
    config.onclick = () => {
      const open = app.classList.toggle('mobile-config-open');
      config.textContent = open ? 'Done' : 'Configure';
      config.setAttribute('aria-expanded', String(open));
    };
    dock.append(config);
    for (const id of ['run', 'step', 'pause', 'reset']) {
      const original = document.getElementById(id);
      if (!original) continue;
      const button = document.createElement('button');
      button.dataset.action = id;
      button.onclick = () => original.click();
      const sync = () => { button.textContent = original.textContent.trim(); button.disabled = original.disabled; };
      sync();
      new MutationObserver(sync).observe(original, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled'] });
      dock.append(button);
    }
    stage.prepend(dock);
    app.classList.add('mobile-workspace');
  };
  const report = () => {
    const height = Math.max(
      document.getElementById('app')?.getBoundingClientRect().height || 0,
      document.getElementById('app')?.scrollHeight || 0,
    );
    parent.postMessage({ type: 'ai-lab-size', height }, location.origin);
  };
  addEventListener('load', () => {
    setupMobileWorkspace();
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
