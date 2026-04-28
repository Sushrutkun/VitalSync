import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { authApi } from "../api/auth";
import { onAuthFailure } from "../lib/api";
import { tokenStorage } from "../lib/storage";
import type { AuthUser } from "../types/api";

type AuthState = {
  isReady: boolean;
  user: AuthUser | null;
  userId: string | null;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isReady: false,
    user: null,
    userId: null,
  });

  const mounted = useRef(true);
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    void (async () => {
      const [accessToken, userId] = await Promise.all([
        tokenStorage.getAccessToken(),
        tokenStorage.getUserId(),
      ]);
      if (!mounted.current) return;
      setState({
        isReady: true,
        user: null,
        userId: accessToken && userId ? userId : null,
      });
    })();
  }, []);

  useEffect(() => {
    return onAuthFailure(() => {
      if (!mounted.current) return;
      setState((s) => ({ ...s, user: null, userId: null }));
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    await tokenStorage.setTokens(res.accessToken, res.refreshToken);
    await tokenStorage.setUserId(res.user.id);
    setState({ isReady: true, user: res.user, userId: res.user.id });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // ignore — we clear local tokens regardless
      }
    }
    await tokenStorage.clear();
    setState({ isReady: true, user: null, userId: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
