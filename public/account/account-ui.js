import { safeReturnTo } from './account-client.mjs?v=20261016-auth2';
const dialog = document.querySelector('#account-dialog');
const trigger = document.querySelector('#account-trigger');
const methods = document.querySelector('#auth-methods');
const central = document.querySelector('#central-login');
trigger.addEventListener('click', () => {
  window.dispatchEvent(new Event('aimer-login-start'));
  const destination = safeReturnTo(location.href);
  const url = new URL('https://tools.aimersociety.com/?login=1');
  if (destination) url.searchParams.set('returnTo', destination);
  central.href = url.href;
  if (!dialog.open) dialog.showModal();
});
document.querySelector('#account-close').addEventListener('click', () => dialog.close());
document.querySelector('#account-learning').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const r = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
});
dialog.addEventListener('close', () => trigger.focus({ preventScroll: true }));
for (const modal of [dialog, document.querySelector('#onboarding-dialog')]) {
  modal.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...modal.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  modal.addEventListener('toggle', () => {
    document.documentElement.classList.toggle('aimer-modal-open', Boolean(document.querySelector('dialog[open]')));
  });
}
const syncForm = () => {
  const open = ['email-auth','phone-auth','email-verification'].some(id => !document.getElementById(id).hidden);
  dialog.classList.toggle('has-form', open);
  const hide = !open || !document.querySelector('#email-verification').hidden;
  if (methods.hidden !== hide) methods.hidden = hide;
};
new MutationObserver(syncForm).observe(dialog, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
methods.addEventListener('click', () => {
  if (dialog.querySelector('[aria-busy="true"]')) return;
  document.querySelector('#cancel-verification').click();
});
document.querySelector('#onboarding-dialog').addEventListener('close', () => trigger.focus({ preventScroll: true }));
trigger.disabled = false;
import('./auth.js?v=20261016-auth2').then(() => {
  for (const id of ['google-login','email-toggle','phone-toggle']) document.getElementById(id).disabled = false;
}).catch(() => {
  document.querySelector('#auth-status').textContent = 'Direct sign-in could not load. Continue securely on AIMER Tools.';
  for (const id of ['google-login','email-toggle','phone-toggle']) document.getElementById(id).disabled = true;
});
