import axios from 'axios';

// Resolution order: runtime config (public/config.js) -> build-time env -> same-origin "/api".
const runtimeConfig = (typeof window !== 'undefined' && window.__APP_CONFIG__) || {};
export const API_URL = (runtimeConfig.API_URL || import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export const TOKEN_KEY = 'peopledesk.token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
};
export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

const client = axios.create({ baseURL: API_URL, timeout: 15000 });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLogin) {
      clearToken();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

/** Turns any axios error into a message that's safe to show to a person. */
export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Check your connection and try again.';
  if (error?.request && !error.response) return 'Cannot reach the server. Check that the API is running and try again.';
  return error?.message || 'Something went wrong. Please try again.';
};

/** Maps server validation errors to { fieldName: message } for forms. */
export const getFieldErrors = (error) => {
  const list = error?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return list.reduce((acc, e) => (e.field && !acc[e.field] ? { ...acc, [e.field]: e.message } : acc), {});
};

export default client;
