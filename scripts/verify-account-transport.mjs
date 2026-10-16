// Isolated anonymous Chromium: never uses the operator's browser cookies.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const evidence = [];
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  cdp.on('Network.responseReceived', event => {
    if (event.type !== 'Preflight') return;
    const { url, status, headers } = event.response;
    evidence.push({ url, method: 'OPTIONS', status, headers: Object.fromEntries(Object.entries(headers).map(([k,v]) => [k.toLowerCase(),v]).filter(([k]) => /^(access-control-|cache-control$|vary$)/.test(k))) });
  });
  page.on('response', async response => {
    if (!/^https:\/\/tools\.aimersociety\.com\/api\/(session|profile)$/.test(response.url())) return;
    const headers = await response.allHeaders();
    evidence.push({ url: response.url(), method: response.request().method(), status: response.status(), headers: Object.fromEntries(Object.entries(headers).filter(([key]) => /^(access-control-|cache-control$|vary$)/.test(key))) });
  });
  await page.goto('https://ml.aimersociety.com/', { waitUntil: 'domcontentloaded' });
  const results = await page.evaluate(async () => {
    const results = [];
    for (const [path, method, body] of [['session','GET'],['session','POST',{}],['profile','GET'],['profile','PATCH',{}],['session','DELETE'],['session','GET']]) {
      const response = await fetch(`https://tools.aimersociety.com/api/${path}`, { method, credentials: 'include', cache: 'no-store', ...(body ? { headers: { 'Content-Type':'application/json', ...(path === 'profile' ? {'X-Aimer-Account':'transport-check-anonymous'} : {}) }, body: JSON.stringify(body) } : {}) });
      const data = await response.json();
      results.push({ path, method, status:response.status, anonymous: data.user === null });
    }
    return results;
  });
  assert.deepEqual(results.map(r => r.status), [200,400,401,401,200,200]);
  assert.equal(results[0].anonymous,true);
  assert.equal(results[5].anonymous,true);
  assert(evidence.some(r => r.method === 'OPTIONS' && r.status === 204));
  for (const response of evidence) {
    assert.equal(response.headers['access-control-allow-origin'],'https://ml.aimersociety.com');
    assert.equal(response.headers['access-control-allow-credentials'],'true');
    assert.match(response.headers.vary,/Origin/);
  }
  await page.locator('#account-trigger[data-session-state=guest]').waitFor();
  await page.locator('#account-trigger').click();
  await page.screenshot({ path: 'artifacts/shared-account-production-guest.png' });
  console.log(JSON.stringify({ initiatingPage:'https://ml.aimersociety.com/', origin:'https://ml.aimersociety.com', credentials:'include', cache:'no-store', results, evidence },null,2));
} finally { await browser.close(); }
