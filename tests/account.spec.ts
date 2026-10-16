import { expect, test, type Page } from '@playwright/test';
import process from 'node:process';

const base = process.env.ACCOUNT_BASE_URL || 'http://127.0.0.1:5199';
const central = 'https://tools.aimersociety.com';
const phoneUser = { uid: 'phone-test', name: null, email: null, picture: null, signInMethod: 'phone' };
const firebaseMock = `
const user = {emailVerified:true, getIdToken:async()=> 'mock-token'};
export const initializeApp=()=>({}), getAuth=()=>({useDeviceLanguage(){}}), inMemoryPersistence={};
export class GoogleAuthProvider {}
export class RecaptchaVerifier {clear(){}}
export const setPersistence=async()=>{},signOut=async()=>{},reload=async(u)=>{u.emailVerified=true},updateProfile=async()=>{};
export const signInWithPopup=async()=>({user});
export const signInWithEmailAndPassword=async(_auth,email)=>{if(email==='bad@example.test')throw {code:'auth/invalid-credential'};return {user}};
export const createUserWithEmailAndPassword=async()=>({user:{...user,emailVerified:false}});
export const sendEmailVerification=async()=>{},sendPasswordResetEmail=async()=>{};
export const validatePassword=async()=>({isValid:true});
export const signInWithPhoneNumber=async()=>({confirm:async(code)=>{if(code!=='123456')throw {code:'auth/invalid-verification-code'};return {user}}});
`;

async function setup(page: Page, signedIn = false, failed = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let user: typeof phoneUser | null = signedIn ? phoneUser : null;
  const writes: { method: string; body: Record<string, unknown> }[] = [];
  await page.route('https://www.gstatic.com/firebasejs/**', route => route.fulfill({ contentType: 'text/javascript', body: firebaseMock }));
  await page.route(`${central}/api/**`, async route => {
    const request = route.request();
    if (failed) return route.abort('failed');
    const method = request.method();
    expect(await request.headerValue('origin')).toBe(base);
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'Content-Type, X-Aimer-Account', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS' } });
    if (method === 'POST') user = phoneUser;
    if (method === 'DELETE') user = null;
    if (method === 'PATCH') {
      expect(await request.headerValue('x-aimer-account')).toBe(phoneUser.uid);
      writes.push({ method, body: request.postDataJSON() });
    }
    return route.fulfill({ json: request.url().endsWith('/profile') ? { profile: { ...phoneUser, interests: ['Maths'], onboardingComplete: true } } : { user }, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } });
  });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#phone-country option')).not.toHaveCount(0);
  await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', failed ? 'unavailable' : signedIn ? 'signed-in' : 'guest');
  return writes;
}

for (const [width, height] of [[320, 640], [360, 740], [390, 844], [1280, 720], [1536, 864]]) {
  test(`guest account layout ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await setup(page);
    await page.locator('#account-trigger').click();
    await expect(page.locator('#google-login')).toBeVisible();
    await expect(page.locator('#email-toggle')).toBeVisible();
    await expect(page.locator('#phone-toggle')).toBeVisible();
    const sizes = await page.locator('#account-dialog').evaluate(el => ({ w: el.scrollWidth, client: el.clientWidth, h: el.scrollHeight, ch: el.clientHeight }));
    expect(sizes.w).toBeLessThanOrEqual(sizes.client + 1);
    if (width >= 1280) expect(sizes.h).toBeLessThanOrEqual(sizes.ch + 1);
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.locator('#account-close').focus();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('#account-dialog')))).toBe(true);
    }
    await page.screenshot({ path: `test-results/account-${width}.png` });
    await page.keyboard.press('Escape');
    await expect(page.locator('#account-dialog')).not.toBeVisible();
    await expect(page.locator('#account-trigger')).toBeFocused();
  });
}

test('email signup, verification and reset UI preserve values', async ({ page }) => {
  await setup(page);
  await page.locator('#account-trigger').click();
  await page.locator('#email-toggle').click();
  await expect(page.locator('#google-login')).toBeHidden();
  await expect(page.locator('#phone-auth')).toBeHidden();
  await page.locator('#signin-email').fill('learner@example.test');
  await page.locator('#forgot-password').click();
  await expect(page.locator('#auth-status')).toContainText('If an eligible account exists');
  await page.locator('#email-signup-tab').click();
  await page.locator('#signup-name').fill('Learner');
  await page.locator('#signin-password').fill('ExamplePass9!');
  await page.locator('#toggle-password').click();
  await expect(page.locator('#signin-password')).toHaveAttribute('type', 'text');
  await page.locator('#email-submit').click();
  await expect(page.locator('#email-verification')).toBeVisible();
  await page.locator('#resend-verification').click();
  await page.locator('#cancel-verification').click();
  await expect(page.locator('#email-toggle')).toBeVisible();
  await expect(page.locator('#signin-email')).toHaveValue('learner@example.test');
});

test('phone validation, OTP retry, cooldown and shared logout', async ({ page }) => {
  await setup(page);
  await page.locator('#account-trigger').click();
  await page.locator('#phone-toggle').click();
  await expect(page.locator('#phone-country')).toHaveValue('IN');
  await page.locator('#login-phone').fill('123');
  await page.locator('#phone-send').click();
  await expect(page.locator('#phone-number-error')).not.toBeEmpty();
  await page.locator('#login-phone').fill('9876543210');
  await page.locator('#phone-send').click();
  await expect(page.locator('#phone-code-form')).toBeVisible();
  await expect(page.locator('#phone-resend')).toBeDisabled();
  await page.locator('#phone-code').fill('000000');
  await page.locator('#phone-verify').click();
  await expect(page.locator('#auth-status')).toContainText('incorrect');
  await page.locator('#phone-code').fill('123456');
  await page.locator('#phone-verify').click();
  await expect(page.locator('#account-dialog')).toBeHidden();
  await expect(page.locator('#account-label')).toHaveText('My account');
  await page.locator('#account-trigger').click();
  await expect(page.locator('#profile-name')).toHaveText('My account');
  await page.locator('#google-logout').click();
  await expect(page.locator('#account-label')).toHaveText('Continue to login');
});

test('existing phone session and personalization preserve shared interests and omit learning', async ({ page }) => {
  const writes = await setup(page, true);
  await expect(page.locator('#account-dialog')).toBeHidden();
  await page.locator('#account-trigger').click();
  const size = await page.locator('#account-dialog').evaluate(el => [el.scrollHeight, el.clientHeight]);
  expect(size[0]).toBeLessThanOrEqual(size[1] + 1);
  await page.locator('#personalize-learning').click();
  await expect(page.locator('#onboarding-dialog')).toBeVisible();
  await page.locator('#onboarding-skip').click();
  expect(writes).toEqual([{ method: 'PATCH', body: { interests: ['Maths'], onboardingComplete: true } }]);
});

test('service failure remains distinct and central fallback preserves trusted route', async ({ page }) => {
  await setup(page, false, true);
  await page.locator('#account-trigger').click();
  await expect(page.locator('#auth-status')).toContainText('Cannot reach');
  await page.locator('#auth-retry').click();
  await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'unavailable');
  expect(await page.locator('#central-login').getAttribute('href')).toBe(`${central}/?login=1`);
});

test('Google sign-in retains the learning route, query, hash and device saves', async ({ page }) => {
  await setup(page);
  const path = '/ml/lab/saved-experiments?view=recent#saved';
  await page.evaluate(() => localStorage.setItem('account-test-existing-save', 'keep'));
  await page.goto(base + path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'guest');
  await page.locator('#account-trigger').click();
  await page.locator('#google-login').click();
  await expect(page.locator('#account-dialog')).toBeHidden();
  expect(page.url()).toBe(base + path);
  expect(await page.evaluate(() => localStorage.getItem('account-test-existing-save'))).toBe('keep');
  await expect(page.locator('#account-trigger')).toHaveCount(1);
});

test('email verification completes the shared session', async ({ page }) => {
  await setup(page);
  await page.locator('#account-trigger').click();
  await page.locator('#email-toggle').click();
  await page.locator('#email-signup-tab').click();
  await page.locator('#signup-name').fill('Learner');
  await page.locator('#signin-email').fill('learner@example.test');
  await page.locator('#signin-password').fill('ExamplePass9!');
  await page.locator('#email-submit').click();
  await expect(page.locator('#email-verification')).toBeVisible();
  await page.locator('#check-verification').click();
  await expect(page.locator('#account-dialog')).toBeHidden();
  await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'signed-in');
});

test('phone methods return, restricted region, short viewport and enlarged text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 360 });
  await setup(page);
  await page.locator('#account-trigger').click();
  await page.locator('#phone-toggle').click();
  await page.locator('#auth-methods').click();
  await expect(page.locator('#phone-auth')).toBeHidden();
  await expect(page.locator('#email-toggle')).toBeVisible();
  await page.locator('#phone-toggle').click();
  await page.locator('#phone-country').selectOption('US');
  await page.locator('#login-phone').fill('2025550123');
  await page.locator('#phone-send').click();
  await expect(page.locator('#auth-status')).toContainText('India only');
  await page.addStyleTag({ content: '#account-dialog { font-size: 20px; } #account-dialog input { font-size: 22px; }' });
  const sizes = await page.locator('#account-dialog').evaluate(el => ({ scroll: el.scrollWidth, width: el.clientWidth, height: el.getBoundingClientRect().height }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
  expect(sizes.height).toBeLessThanOrEqual(360);
  await page.locator('#account-close').click();
  await expect(page.locator('#account-dialog')).toBeHidden();
});

test('email sign-in keeps values after a recoverable error', async ({ page }) => {
  await setup(page);
  await page.locator('#account-trigger').click();
  await page.locator('#email-toggle').click();
  await page.locator('#signin-email').fill('bad@example.test');
  await page.locator('#signin-password').fill('ExamplePass9!');
  await page.locator('#email-submit').click();
  await expect(page.locator('#auth-status')).toContainText('Check your email and password');
  await expect(page.locator('#signin-email')).toHaveValue('bad@example.test');
  await expect(page.locator('#signin-password')).toHaveValue('ExamplePass9!');
  await page.locator('#signin-email').fill('learner@example.test');
  await page.locator('#email-submit').click();
  await expect(page.locator('#account-dialog')).toBeHidden();
});

test('expired shared session clears the account and explains recovery', async ({ page }) => {
  await setup(page, true);
  await page.route(`${central}/api/session`, route => route.fulfill({ status: 401, json: { error: 'Expired' }, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } }));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'guest');
  await page.locator('#account-trigger').click();
  await expect(page.locator('#auth-status')).toContainText('session expired');
  await expect(page.locator('#google-login')).toBeVisible();
});


test('transient refresh keeps the displayed account and retry clears the error', async ({ page }) => {
  await setup(page, true);
  let failed = true, requests = 0;
  await page.route(`${central}/api/session`, async route => {
    requests++;
    if (failed) return route.fulfill({ status: 503, json: { error: 'Temporarily unavailable' }, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } });
    return route.fulfill({ json: { user: phoneUser }, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } });
  });
  await page.evaluate(() => { window.dispatchEvent(new Event('focus')); window.dispatchEvent(new Event('pageshow')); });
  await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'unavailable');
  expect(requests).toBe(1);
  await page.locator('#account-trigger').click();
  await expect(page.locator('#profile-name')).toHaveText('My account');
  failed = false;
  await page.locator('#auth-retry').click();
  await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'signed-in');
  await expect(page.locator('#auth-status')).toBeEmpty();
  await expect(page.locator('#auth-retry')).toBeHidden();
});

test('token exchange cannot report success without a readable shared cookie', async ({ page }) => {
  await setup(page);
  await page.route(`${central}/api/session`, route => route.fulfill({ json: { user: route.request().method() === 'POST' ? phoneUser : null }, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' } }));
  await page.locator('#account-trigger').click();
  await page.locator('#google-login').click();
  await expect(page.locator('#auth-status')).toContainText('shared session could not be confirmed');
  await expect(page.locator('#account-dialog')).toBeVisible();
  await expect(page.locator('#account-trigger')).toHaveAttribute('data-session-state', 'guest');
});
