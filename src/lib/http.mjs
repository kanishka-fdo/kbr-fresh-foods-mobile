export class ApiError extends Error {
  constructor(message, status = 0, details = {}) { super(message); this.name = 'ApiError'; this.status = status; this.details = details; }
}
/** @param {{baseURL: string, getToken?: () => string | null, onUnauthorized?: (token: string) => unknown, fetcher?: typeof fetch, timeout?: number}} config */
export function createApi({ baseURL, getToken = () => null, onUnauthorized = (_token) => {}, fetcher = fetch, timeout = 20000 }) {
  async function request(method, path, body, options = {}) {
    if (!baseURL) throw new ApiError('The API address is not configured. Set EXPO_PUBLIC_API_URL and restart Expo.');
    const query = Object.entries(options.params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&');
    const token = getToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetcher(`${baseURL.replace(/\/$/, '')}${path}${query ? `?${query}` : ''}`, {
        method, signal: controller.signal,
        headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const data = options.responseType === 'blob' && response.ok ? await response.blob() : await response.json().catch(() => ({}));
      if (!response.ok) {
        // A bad login must not expire another session. Ignore stale requests after an account switch.
        if (response.status === 401 && token && !path.startsWith('/auth/login')) await onUnauthorized(token);
        throw new ApiError(data.message || `Request failed (${response.status}).`, response.status, data);
      }
      return { data };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(controller.signal.aborted ? 'The request timed out. Check your connection and try again.' : 'Cannot reach KBR Fresh Foods. Check your connection and the API address.');
    } finally { clearTimeout(timer); }
  }
  return { get: (path, options) => request('GET', path, undefined, options), post: (path, body) => request('POST', path, body), put: (path, body) => request('PUT', path, body), patch: (path, body) => request('PATCH', path, body), delete: (path) => request('DELETE', path) };
}
