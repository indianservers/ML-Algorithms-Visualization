const pendingScripts = new Map<string, Promise<void>>();

export function loadExternalScript(src: string): Promise<void> {
  const pending = pendingScripts.get(src);
  if (pending) return pending;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    const script = existing ?? document.createElement('script');
    const loaded = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    const failed = () => reject(new Error(`Could not load ${src}`));

    if (script.dataset.loaded === 'true') {
      resolve();
      return;
    }
    script.addEventListener('load', loaded, { once: true });
    script.addEventListener('error', failed, { once: true });
    if (!existing) {
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }
  });
  pendingScripts.set(src, promise);
  promise.catch(() => pendingScripts.delete(src));
  return promise;
}
