// Keep the shared native modules outside Vite's HTML module bundling.
import('/account/account-ui.js?v=20261016').catch(() => {
  const trigger = document.querySelector('#account-trigger');
  trigger.disabled = false;
  trigger.addEventListener('click', () => {
    const destination = new URL('https://tools.aimersociety.com/?login=1');
    if (location.protocol === 'https:' && location.hostname === 'ml.aimersociety.com' && !location.port) destination.searchParams.set('returnTo', location.href);
    location.assign(destination.href);
  });
});
