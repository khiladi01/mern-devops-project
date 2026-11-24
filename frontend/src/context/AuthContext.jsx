import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services';
import { clearToken, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // While a stored token is being verified we don't know yet who the user is.
  const [initialising, setInitialising] = useState(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return undefined;
    let cancelled = false;
    authApi
      .me()
      .then((data) => !cancelled && setUser(data.user))
      .catch(() => {
        /* a 401 is handled by the axios interceptor */
      })
      .finally(() => !cancelled && setInitialising(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // The axios interceptor fires this when the API rejects our token.
  useEffect(() => {
    const onForcedLogout = () => setUser(null);
    window.addEventListener('auth:logout', onForcedLogout);
    return () => window.removeEventListener('auth:logout', onForcedLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: me } = await authApi.login(email, password);
    setToken(token);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, initialising, isAuthenticated: Boolean(user), login, logout }),
    [user, initialising, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
