import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi, ApiError } from '../src/lib/http.mjs';
test('API sends bearer token, JSON and encoded query parameters', async () => {
  let request;
  const api = createApi({ baseURL: 'https://example.test/api/', getToken: () => 'token', fetcher: async (url, init) => { request = { url, init }; return { ok: true, json: async () => ({ products: [] }) }; } });
  await api.get('/products', { params: { search: 'red & green', page: 2, category: undefined } });
  assert.equal(request.url, 'https://example.test/api/products?search=red%20%26%20green&page=2');
  assert.equal(request.init.headers.Authorization, 'Bearer token');
  await api.post('/orders', { items: [] });
  assert.equal(request.init.body, '{"items":[]}');
});
test('only authenticated non-login 401 responses expire the session', async () => {
  const expired = [];
  const api = createApi({ baseURL: 'https://example.test', getToken: () => 'old-token', onUnauthorized: token => expired.push(token), fetcher: async () => ({ ok: false, status: 401, json: async () => ({ message: 'Expired' }) }) });
  await assert.rejects(api.get('/auth/me'), error => error instanceof ApiError && error.status === 401);
  await assert.rejects(api.post('/auth/login', {}));
  assert.deepEqual(expired, ['old-token']);
});
test('403 preserves the session and supplies server messages', async () => {
  let expired = false;
  const api = createApi({ baseURL: 'https://example.test', getToken: () => 'token', onUnauthorized: () => { expired = true; }, fetcher: async () => ({ ok: false, status: 403, json: async () => ({ message: 'Driver only' }) }) });
  await assert.rejects(api.get('/orders/driver/my'), { message: 'Driver only', status: 403 });
  assert.equal(expired, false);
});
test('missing configuration and disconnected networks produce actionable errors', async () => {
  await assert.rejects(createApi({ baseURL: '' }).get('/products'), /EXPO_PUBLIC_API_URL/);
  await assert.rejects(createApi({ baseURL: 'https://example.test', fetcher: async () => { throw new Error('network'); } }).get('/products'), /Cannot reach/);
});
test('requests time out and always release the abort timer', async () => {
  const api = createApi({ baseURL: 'https://example.test', timeout: 5, fetcher: async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))) });
  await assert.rejects(api.get('/products'), /timed out/);
});
