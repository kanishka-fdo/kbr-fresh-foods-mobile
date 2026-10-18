import { createApi } from './http.mjs';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
let token: string | null = null;
let unauthorized: (token: string) => Promise<void> = async () => {};
export const session = {
  getToken: () => token,
  setToken: (value: string | null) => { token = value; },
  onUnauthorized: (handler: typeof unauthorized) => { unauthorized = handler; return () => { unauthorized = async () => {}; }; },
};
export default createApi({ baseURL: API_URL, getToken: () => token, onUnauthorized: (failedToken: string) => unauthorized(failedToken) });
