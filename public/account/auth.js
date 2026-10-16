import { setupPhoneInput } from './phone-input.mjs';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { accountRequest, getProfile, updateProfile, safeReturnTo, photo } from './account-client.mjs?v=20261016-auth2';
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, inMemoryPersistence, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, updateProfile as updateFirebaseProfile, reload, validatePassword, RecaptchaVerifier, signInWithPhoneNumber } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

const app = initializeApp({
  apiKey: 'AIzaSyDKiPMjAuHqmFFm1l6tW3YMCkF7xQlsoMw',
  authDomain: 'mlvisualizationsaimersweb.firebaseapp.com',
  projectId: 'mlvisualizationsaimersweb',
  storageBucket: 'mlvisualizationsaimersweb.firebasestorage.app',
  messagingSenderId: '593351107909',
  appId: '1:593351107909:web:e2ba110eb27a8ef6830a2c'
});
const auth = getAuth(app);
const phoneInput = setupPhoneInput();
const button = document.querySelector('#google-login');
const logout = document.querySelector('#google-logout');
const status = document.querySelector('#auth-status');
let currentUser;
let sessionRevision = 0, refreshGeneration = 0;
let learningReturn = location.href;
window.addEventListener('aimer-login-start', () => { learningReturn = location.href; });
let busy = false, refreshing = false;
let emailMode = 'signin', pendingVerification = null, pendingMobile = '';
let lastAttempt = 'session';
const persistence = setPersistence(auth, inMemoryPersistence);
window.addEventListener('aimer-profile', e => {
  if (currentUser?.uid === e.detail.uid) render({ ...currentUser, name: e.detail.name, picture: e.detail.picture });
});
function render(user) {
  const changed = currentUser?.uid !== user?.uid || currentUser === undefined;
  currentUser = user;
  document.querySelector('#account-trigger').dataset.sessionState = user ? 'signed-in' : 'guest';
  document.querySelector('#account-dialog').classList.toggle('is-signed-in', Boolean(user));
  const trigger = document.querySelector('#account-trigger');
  trigger.classList.toggle('is-signed-in', Boolean(user));
  trigger.setAttribute('aria-label', user ? `Account: ${user.name || user.email || 'Signed in'}` : 'Continue to login');
  document.querySelector('#account-label').textContent = user ? (user.name ? user.name.split(' ')[0] : user.signInMethod === 'phone' ? 'My account' : user.email || 'My account') : 'Continue to login';
  const avatar = trigger.querySelector('.account-avatar');
  if (user) avatar.textContent = (user.name || user.email || 'A').slice(0, 1).toUpperCase();
  else avatar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>';
  if (user) { photo(avatar, user); photo(document.querySelector('#profile-initial'), user); }
  document.querySelector('#account-title').innerHTML = user ? 'Welcome to AIMER.' : 'Welcome to<br>AIMER Society';
  document.querySelector('#account-description').textContent = user ? 'You’re signed in. Let’s explore something new.' : 'Sign in to access our learning tools, visualizations and resources.';
  document.querySelector('#account-profile').hidden = !user;
  document.querySelector('#profile-name').textContent = user?.name || (user ? 'My account' : '');
  document.querySelector('#profile-email').textContent = user?.email || '';
  if (user) photo(document.querySelector('#profile-initial'), user);
  else document.querySelector('#profile-initial').textContent = '';
  button.hidden = Boolean(user);
  button.disabled = false;
  logout.hidden = !user;
  document.querySelector('#account-links').hidden = !user;
  document.querySelector('#shared-account').hidden = Boolean(user);
  document.querySelector('#email-toggle').hidden = Boolean(user) || Boolean(pendingVerification);
  document.querySelector('#phone-toggle').hidden = Boolean(user) || Boolean(pendingVerification);
  if (user) resetPhone();
  if (user) { document.querySelector('#email-auth').hidden = true; document.querySelector('#email-verification').hidden = true; }
  if (changed) window.dispatchEvent(new CustomEvent('aimer-account', { detail: user }));
}
async function session(method = 'GET', idToken) {
  if (method !== 'GET') sessionRevision++;
  const data = await accountRequest('/api/session', {
    method,
    ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) } : {})
  });
  if (!data || !Object.hasOwn(data, 'user') || (data.user !== null && (typeof data.user?.uid !== 'string' || !data.user.uid)))
    throw new Error('Login service returned an unexpected response. Please try again shortly.');
  return data.user;
}
function emailBusy(value) {
  document.querySelector('#email-auth').setAttribute('aria-busy', String(value));
  for (const el of document.querySelectorAll('#email-auth button,#email-auth input,#email-toggle,#email-verification button')) el.disabled = value;
}
function mobileValue(value) {
  const normalized = value.replace(/[ ()-]/g, '');
  if (normalized && !/^\+[1-9]\d{7,14}$/.test(normalized)) throw new Error('Enter a mobile number with country code, such as +91 98765 43210.');
  return normalized;
}
async function completeLogin(user) {
  const created = await session('POST', await user.getIdToken(true));
  const confirmed = await session();
  if (!created || !confirmed || created.uid !== confirmed.uid)
    throw new Error('Your shared session could not be confirmed. Please try again.');
  render(confirmed);
  await signOut(auth);
  pendingMobile = '';
  status.textContent = 'Signed in to AIMER Society.';
  document.querySelector('#account-dialog').close();
  const destination = safeReturnTo(new URLSearchParams(location.search).get('returnTo'));
  if (destination && destination !== location.href) location.assign(destination);
  else if (location.href !== learningReturn) history.replaceState(null, '', learningReturn);
}
function authError(error) {
  const messages = {
    'auth/popup-closed-by-user': 'Sign-in cancelled. You can try again.',
    'auth/popup-blocked': 'Allow pop-ups for this site, then try again.',
    'auth/operation-not-allowed': lastAttempt === 'phone' ? 'SMS sign-in is unavailable for this country. Try Google or email, or check Firebase Phone and SMS region settings.' : 'This sign-in method is unavailable. Try another method or check Firebase settings.',
    'auth/unauthorized-domain': 'This website needs to be authorized in Firebase.',
    'auth/invalid-credential': 'We couldn’t sign you in. Check your email and password, or try Google.',
    'auth/wrong-password': 'We couldn’t sign you in. Check your email and password, or try Google.',
    'auth/user-not-found': 'We couldn’t sign you in. Check your email and password, or try Google.',
    'auth/email-already-in-use': 'Unable to create this account. Try signing in, Google, or password reset.',
    'auth/account-exists-with-different-credential': 'Try your original sign-in method to access this account.',
    'auth/weak-password': 'Choose a stronger password that meets the password requirements.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes before trying again.',
    'auth/invalid-phone-number': 'Enter a valid phone number including country code.',
    'auth/invalid-verification-code': 'That code is incorrect. Check the SMS and try again.',
    'auth/code-expired': 'This code expired. Request a new one.',
    'auth/session-expired': 'This code expired. Request a new one.',
    'auth/captcha-check-failed': 'Verification failed. Please complete reCAPTCHA again.',
    'auth/quota-exceeded': 'SMS is temporarily unavailable. Try Google or email.',
    'auth/billing-not-enabled': 'SMS sign-in needs billing enabled in Firebase. Use Google or email for now.',
    'auth/network-request-failed': 'Connection interrupted. Check your internet and try again.'
  };
  status.textContent = messages[error.code] || (error.code?.startsWith('auth/') ? 'Sign-in could not complete. Please try again.' : error.message);
  const field = lastAttempt === 'email' ? document.querySelector(error.code === 'auth/invalid-email' ? '#signin-email' : '#signin-password') : lastAttempt === 'phone' && phoneConfirmation ? document.querySelector('#phone-code') : null;
  if (field) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', 'auth-status'); }
  document.querySelector('#auth-retry').hidden = false;
  if (document.querySelector('#account-dialog').open) status.scrollIntoView({ block: 'nearest' });
}
button.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  lastAttempt = 'google'; pendingMobile = ''; emailBusy(true);
  resetPhone();
  button.disabled = true;
  status.textContent = 'Connecting to Google…';
  button.classList.add('is-loading');
  button.querySelector('span').textContent = 'Connecting to Google…';
  document.querySelector('#auth-retry').hidden = true;
  try {
    await persistence;
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    status.textContent = 'Signing you in…';
    button.querySelector('span').textContent = 'Signing you in…';
    await completeLogin(result.user);
  } catch (error) {
    authError(error);
  } finally {
    button.disabled = false; busy = false; emailBusy(false);
    button.classList.remove('is-loading'); button.querySelector('span').textContent = 'Continue with Google';
  }
});
logout.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  logout.disabled = true;
  try { await session('DELETE'); await signOut(auth).catch(() => {}); render(null); status.textContent = 'Signed out.'; }
  catch (error) { status.textContent = error.message; }
  finally { logout.disabled = false; busy = false; }
});
async function refresh() {
  if (refreshing || busy || pendingVerification || phoneConfirmation || !document.querySelector('#phone-auth').hidden) return;
  refreshing = true;
  const revision = sessionRevision, generation = ++refreshGeneration;
  try {
    const user = await session();
    if (revision !== sessionRevision || generation !== refreshGeneration || busy) return;
    render(user); status.textContent = ''; document.querySelector('#account-trigger').dataset.sessionState = currentUser ? 'signed-in' : 'guest'; document.querySelector('#auth-retry').hidden = true; }
  catch (error) {
    if (revision !== sessionRevision || generation !== refreshGeneration || busy) return;
    lastAttempt = 'session';
    if (error.status === 401) { render(null); status.textContent = 'Your session expired. Sign in again to continue.'; }
    else { status.textContent = error.message; document.querySelector('#account-trigger').dataset.sessionState = 'unavailable'; }
    document.querySelector('#auth-retry').hidden = false;
  } finally { refreshing = false; }
}

document.querySelector('#auth-retry').addEventListener('click', () => {
  if (busy) return;
  if (pendingVerification) document.querySelector('#check-verification').click();
  else if (lastAttempt === 'phone') { if (phoneConfirmation) document.querySelector('#phone-code-form').requestSubmit(); else document.querySelector('#phone-number-form').requestSubmit(); }
  else if (lastAttempt === 'reset') document.querySelector('#forgot-password').click();
  else if (lastAttempt === 'email') document.querySelector('#email-form').requestSubmit();
  else if (lastAttempt === 'google') button.click(); else refresh();
});
window.addEventListener('aimer-session-expired', () => {
  render(null); status.textContent = 'Your session expired. Sign in again to sync your learning space.';
  document.querySelector('#account-trigger').click();
});
const onboarding = document.querySelector('#onboarding-dialog');
window.addEventListener('aimer-onboarding', e => {
  const profile = { ...e.detail, mobileNumber: e.detail.mobileNumber || pendingMobile || '' };
  if (!onboarding.open && !busy) window.aimerOnboarding.open(profile);
  else if (busy) setTimeout(() => { if (currentUser && !onboarding.open) window.aimerOnboarding.open(profile); }, 250);
});
document.querySelector('#personalize-learning').addEventListener('click', async () => {
  const control = document.querySelector('#personalize-learning'); control.disabled = true;
  try {
    const profile = await getProfile();
    document.querySelector('#account-dialog').close(); window.aimerOnboarding.open(profile);
  } catch (error) { status.textContent = error.message; }
  finally { control.disabled = false; }
});
async function finishOnboarding(skip) {
  const controls = [...onboarding.querySelectorAll('button')]; controls.forEach(b => b.disabled = true);
  try {
    const skipInterests = skip && onboarding.dataset.step === '1';
    await updateProfile({ ...(skip ? {} : { mobileNumber: mobileValue(document.querySelector('#onboarding-mobile').value) }), interests: skipInterests ? JSON.parse(onboarding.dataset.originalInterests || '[]') : [...onboarding.querySelectorAll('.interest-card input:checked')].map(i => i.value).filter(value => value !== 'all'), onboardingComplete: true }, currentUser.uid);
    onboarding.close();
    const destination = safeReturnTo(new URLSearchParams(location.search).get('returnTo'));
    if (destination) location.assign(destination);
  } catch (error) { document.querySelector('#onboarding-status').textContent = error.message; }
  finally { controls.forEach(b => b.disabled = false); }
}
document.querySelector('#onboarding-save').addEventListener('click', () => finishOnboarding(false));
document.querySelector('#onboarding-skip').addEventListener('click', () => finishOnboarding(true));
const emailForm = document.querySelector('#email-form');
function setEmailMode(mode) {
  emailMode = mode;
  document.querySelector('#signup-fields').hidden = mode !== 'signup';
  document.querySelector('#signup-name').required = mode === 'signup';
  document.querySelector('#signin-password').minLength = 1;
  document.querySelector('#signin-password').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  document.querySelector('#password-help').hidden = mode !== 'signup';
  document.querySelector('#email-submit').textContent = mode === 'signup' ? 'Create account →' : 'Sign in with email →';
  document.querySelector('#forgot-password').hidden = mode === 'signup';
  document.querySelector('#email-signin-tab').setAttribute('aria-pressed', mode === 'signin');
  document.querySelector('#email-signup-tab').setAttribute('aria-pressed', mode === 'signup');
}
function verificationView(user) {
  resetPhone();
  document.querySelector('#phone-toggle').hidden = true;
  pendingVerification = user;
  document.querySelector('#email-auth').hidden = true;
  document.querySelector('#email-toggle').hidden = true;
  document.querySelector('#email-verification').hidden = false;
  button.hidden = true;
  document.querySelector('#signin-password').value = '';
}
function actionSettings() {
  const url = new URL(learningReturn);
  url.searchParams.set('login', '1');
  const destination = safeReturnTo(new URLSearchParams(location.search).get('returnTo'));
  if (destination) url.searchParams.set('returnTo', destination);
  return { url: url.href };
}
async function emailAction(task, message) {
  if (busy) return;
  busy = true; emailBusy(true); button.disabled = true;
  status.textContent = message; document.querySelector('#auth-retry').hidden = true;
  document.querySelector('#email-submit').classList.add('is-loading');
  try { await persistence; await task(); }
  catch (error) { authError(error); }
  finally {
    busy = false; emailBusy(false); button.disabled = false;
    document.querySelector('#email-submit').classList.remove('is-loading');
  }
}
document.querySelector('#email-toggle').addEventListener('click', () => {
  if (busy) return;
  resetPhone();
  const section = document.querySelector('#email-auth'); section.hidden = !section.hidden;
  document.querySelector('#email-toggle').setAttribute('aria-expanded', !section.hidden);
  if (!section.hidden) { setEmailMode('signin'); document.querySelector('#signin-email').focus(); }
});
document.querySelector('#email-signin-tab').addEventListener('click', () => setEmailMode('signin'));
document.querySelector('#email-signup-tab').addEventListener('click', () => setEmailMode('signup'));
document.querySelector('#toggle-password').addEventListener('click', () => {
  const input = document.querySelector('#signin-password'), show = input.type === 'password'; input.type = show ? 'text' : 'password';
  document.querySelector('#toggle-password').textContent = show ? 'Hide' : 'Show';
  document.querySelector('#toggle-password').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});
emailForm.addEventListener('submit', e => {
  e.preventDefault(); lastAttempt = 'email';
  emailAction(async () => {
    const email = document.querySelector('#signin-email').value.trim(), password = document.querySelector('#signin-password').value;
    let result;
    if (emailMode === 'signup') {
      const displayName = document.querySelector('#signup-name').value.trim();
      if (!displayName) throw new Error('Enter your name to create an account.');
      pendingMobile = mobileValue(document.querySelector('#signup-mobile').value);
      const policy = await validatePassword(auth, password);
      if (!policy.isValid) {
        const missing = [];
        if (policy.meetsMinPasswordLength === false) missing.push(`at least ${policy.passwordPolicy.customStrengthOptions.minPasswordLength} characters`);
        for (const [key, label] of [['containsLowercaseLetter','a lowercase letter'],['containsUppercaseLetter','an uppercase letter'],['containsNumericCharacter','a number'],['containsNonAlphanumericCharacter','a symbol']]) if (policy[key] === false) missing.push(label);
        throw new Error('Password needs ' + (missing.join(', ') || 'to meet the account policy') + '.');
      }
      result = await createUserWithEmailAndPassword(auth, email, password);
      verificationView(result.user);
      await updateFirebaseProfile(result.user, {displayName});
      await sendEmailVerification(result.user, actionSettings());
      status.textContent = 'Verification email sent. Check your inbox and spam folder.';
    } else {
      pendingMobile = '';
      result = await signInWithEmailAndPassword(auth, email, password);
      if (!result.user.emailVerified) {
        verificationView(result.user);
        await sendEmailVerification(result.user, actionSettings());
        status.textContent = 'Verify your email to finish signing in. We sent a new link.';
      } else {
        document.querySelector('#signin-password').value = '';
        await completeLogin(result.user);
      }
    }
  }, emailMode === 'signup' ? 'Creating your account…' : 'Signing you in…');
});
document.querySelector('#forgot-password').addEventListener('click', () => {
  const input = document.querySelector('#signin-email');
  if (!input.reportValidity()) return;
  lastAttempt = 'reset';
  emailAction(async () => {
    try { await sendPasswordResetEmail(auth, input.value.trim(), actionSettings()); }
    catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
    status.textContent = 'If an eligible account exists, a password reset link will arrive in your inbox. Check spam too.';
    document.querySelector('#signin-password').value = '';
  }, 'Requesting a reset link…');
});
document.querySelector('#resend-verification').addEventListener('click', () => emailAction(async () => {
  if (!pendingVerification) return;
  await sendEmailVerification(pendingVerification, actionSettings());
  status.textContent = 'Verification email sent. Check your inbox and spam folder.';
}, 'Sending verification link…'));
document.querySelector('#check-verification').addEventListener('click', () => emailAction(async () => {
  if (!pendingVerification) return;
  await reload(pendingVerification);
  if (!pendingVerification.emailVerified) { status.textContent = 'Your email is not verified yet. Open the latest verification link, then try again.'; return; }
  const verified = pendingVerification; pendingVerification = null;
  try { await completeLogin(verified); }
  catch (error) {
    document.querySelector('#email-verification').hidden = true; document.querySelector('#email-auth').hidden = false;
    document.querySelector('#email-toggle').hidden = false; button.hidden = false; setEmailMode('signin'); throw error;
  }
}, 'Checking your verification…'));
document.querySelector('#cancel-verification').addEventListener('click', () => emailAction(async () => {
  pendingVerification = null; pendingMobile = ''; resetPhone(); await signOut(auth);
  document.querySelector('#email-verification').hidden = true;
  document.querySelector('#email-auth').hidden = true;
  document.querySelector('#email-toggle').setAttribute('aria-expanded', 'false');
  render(null); status.textContent = '';
}, 'Returning to sign-in…'));
let phoneConfirmation = null, phoneVerifier = null, phoneResendAt = 0, phoneTimer;
const phoneSection = document.querySelector('#phone-auth');
function clearPhoneVerifier() { if (phoneVerifier) { phoneVerifier.clear(); phoneVerifier = null; } }
function resetPhone() {
  phoneConfirmation = null;
  clearPhoneVerifier(); clearInterval(phoneTimer);
  phoneSection.hidden = true;
  document.querySelector('#phone-toggle').setAttribute('aria-expanded', 'false');
  document.querySelector('#phone-number-form').hidden = false;
  document.querySelector('#phone-code-form').hidden = true;
  document.querySelector('#phone-code').value = '';
}
function phoneCooldown() {
  const resend = document.querySelector('#phone-resend');
  const remaining = Math.max(0, Math.ceil((phoneResendAt - Date.now()) / 1000));
  resend.disabled = busy || remaining > 0;
  resend.textContent = remaining ? `Resend in ${remaining}s` : 'Resend code';
  if (!remaining) clearInterval(phoneTimer);
}
async function phoneAction(task) {
  if (busy) return;
  busy = true; lastAttempt = 'phone'; pendingMobile = '';
  emailBusy(true); button.disabled = true;
  for (const el of phoneSection.querySelectorAll('button,input,select')) el.disabled = true;
  phoneSection.setAttribute('aria-busy', 'true');
  document.querySelector('#auth-retry').hidden = true;
  try { await persistence; await task(); }
  catch (error) { authError(error); }
  finally {
    busy = false; emailBusy(false); button.disabled = false;
    for (const el of phoneSection.querySelectorAll('button,input,select')) el.disabled = false;
    phoneSection.setAttribute('aria-busy', 'false'); phoneCooldown();
  }
}
async function sendPhoneCode() {
  const number = phoneInput.validate();
  if (document.querySelector('#phone-country').value !== 'IN') throw new Error('SMS sign-in is currently available for India only. Use Google or email for other countries.');
  if (Date.now() < phoneResendAt) throw new Error('Please wait before requesting another SMS.');
  phoneConfirmation = null;
  clearPhoneVerifier();
  status.textContent = 'Complete the security check to receive your code…';
  auth.useDeviceLanguage();
  phoneVerifier = new RecaptchaVerifier(auth, 'phone-recaptcha', { size: 'normal' });
  // Keep the verifier visible in the same form during resend.
  document.querySelector('#phone-number-form').hidden = false;
  document.querySelector('#phone-code-form').hidden = true;
  try { phoneConfirmation = await signInWithPhoneNumber(auth, number, phoneVerifier); }
  finally { clearPhoneVerifier(); }
  phoneResendAt = Date.now() + 60000;
  clearInterval(phoneTimer); phoneTimer = setInterval(phoneCooldown, 1000);
  document.querySelector('#phone-number-form').hidden = true;
  document.querySelector('#phone-code-form').hidden = false;
  document.querySelector('#phone-code-hint').textContent = `Code sent to ${number}.`;
  document.querySelector('#phone-code').value = '';
  status.textContent = 'SMS sent. Enter the 6-digit code.';
}
document.querySelector('#phone-toggle').addEventListener('click', () => {
  if (busy || pendingVerification) return;
  const open = phoneSection.hidden;
  resetPhone(); phoneSection.hidden = !open;
  document.querySelector('#phone-toggle').setAttribute('aria-expanded', String(open));
  document.querySelector('#email-auth').hidden = true;
  document.querySelector('#email-toggle').setAttribute('aria-expanded', 'false');
  status.textContent = ''; document.querySelector('#auth-retry').hidden = true;
  if (open) document.querySelector('#login-phone').focus();
});
document.querySelector('#phone-number-form').addEventListener('submit', async e => {
  e.preventDefault(); await phoneAction(sendPhoneCode);
  if (phoneConfirmation) document.querySelector('#phone-code').focus();
});
document.querySelector('#phone-code-form').addEventListener('submit', async e => {
  e.preventDefault();
  await phoneAction(async () => {
    if (!phoneConfirmation) throw new Error('Request a new verification code.');
    const code = document.querySelector('#phone-code').value.trim();
    if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit SMS code.');
    status.textContent = 'Verifying your code…';
    const result = await phoneConfirmation.confirm(code);
    await completeLogin(result.user);
  });
});
document.querySelector('#phone-resend').addEventListener('click', () => phoneAction(sendPhoneCode));
document.querySelector('#phone-change').addEventListener('click', () => {
  if (busy) return;
  resetPhone(); phoneSection.hidden = false;
  document.querySelector('#phone-toggle').setAttribute('aria-expanded', 'true');
  document.querySelector('#login-phone').focus(); status.textContent = '';
});
document.querySelector('#account-dialog').addEventListener('cancel', e => { if (busy) e.preventDefault(); });
document.querySelector('#account-dialog').addEventListener('close', resetPhone);

await refresh();
const params = new URLSearchParams(location.search);
if (params.get('login') === '1') {
  const destination = safeReturnTo(params.get('returnTo'));
  if (currentUser && destination) location.replace(destination);
  else document.querySelector('#account-trigger').click();
}
window.addEventListener('focus', refresh);

window.addEventListener('pageshow', refresh);

document.querySelectorAll('#email-form input,#phone-code').forEach(input => input.addEventListener('input', () => input.removeAttribute('aria-invalid')));
