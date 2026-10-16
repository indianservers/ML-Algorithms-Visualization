import { describe, expect, it, vi, afterEach } from 'vitest';
import { accountRequest, safeReturnTo } from '../public/account/account-client.mjs';
import { readSessionResponse } from '../public/account/session-response.mjs';
import { validatePhoneNumber } from '../public/account/phone-number.mjs';
import { readFileSync } from 'node:fs';
import { runInThisContext } from 'node:vm';
runInThisContext(readFileSync(new URL('../public/account/vendor/libphonenumber-max.js', import.meta.url), 'utf8'));
const phone = globalThis.libphonenumber;
afterEach(() => vi.unstubAllGlobals());

describe('shared account boundaries', () => {
  it('routes every profile request centrally with credentials and no-store', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ profile: {} }) });
    vi.stubGlobal('fetch', fetch);
    await accountRequest('/api/profile', { method: 'PATCH', credentials: 'omit', headers: { 'X-Aimer-Account': 'uid' } });
    expect(fetch).toHaveBeenCalledWith('https://tools.aimersociety.com/api/profile', expect.objectContaining({ credentials: 'include', cache: 'no-store', method: 'PATCH' }));
  });
  it('only accepts explicit HTTPS trusted destinations and rejects login loops', () => {
    vi.stubGlobal('location', { origin: 'https://ml.aimersociety.com' });
    expect(safeReturnTo('https://ml.aimersociety.com/ml/lab?view=recent#saved')).toContain('?view=recent#saved');
    for (const url of ['javascript:alert(1)', 'http://ml.aimersociety.com/', 'https://evil.example/', 'https://evil.aimersociety.com/', 'https://user@ml.aimersociety.com/', 'https://ml.aimersociety.com:8443/', 'https://tools.aimersociety.com/?login=1&returnTo=x']) expect(safeReturnTo(url)).toBeNull();
  });
  it('distinguishes anonymous, expired and malformed session responses', async () => {
    expect(await readSessionResponse(new Response('{"user":null}'))).toBeNull();
    await expect(readSessionResponse(new Response('{"error":"Expired"}', { status: 401 }))).rejects.toMatchObject({ status: 401 });
    await expect(readSessionResponse(new Response('<html>unavailable</html>'))).rejects.toThrow('unavailable');
  });
  it('validates country and national mobile independently', () => {
    expect(validatePhoneNumber(phone, 'IN', '9876543210')).toEqual({ number: '+919876543210' });
    expect(validatePhoneNumber(phone, 'XX', '9876543210')).toHaveProperty('countryError');
    expect(validatePhoneNumber(phone, 'IN', '+919876543210')).toHaveProperty('numberError');
    expect(validatePhoneNumber(phone, 'IN', '123')).toHaveProperty('numberError');
    expect(validatePhoneNumber(phone, 'GB', '2025550123')).toHaveProperty('numberError');
  });
});
