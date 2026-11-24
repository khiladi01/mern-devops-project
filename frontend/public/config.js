// Runtime configuration, loaded before the app starts.
// It lets you change the API location WITHOUT rebuilding the frontend
// (handy for Docker / Nginx / EC2). Leave API_URL empty to use the build-time
// VITE_API_URL, falling back to "/api" (same-origin, e.g. behind Nginx).
window.__APP_CONFIG__ = {
  API_URL: '',
};
