import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { sourcesApi } from "../api/sources";
import type { SourceStatusDto } from "./types";

type SourcesContextValue = {
  sources: SourceStatusDto[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const SourcesContext = createContext<SourcesContextValue | null>(null);

export function SourcesProvider({ children }: { children: React.ReactNode }) {
  const { userId, isReady } = useAuth();
  const [sources, setSources] = useState<SourceStatusDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sourcesApi.list();
      setSources(res.sources);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch once when auth becomes ready with a userId. Don't depend on `refresh`
  // identity to avoid re-firing if useCallback returns a new ref.
  useEffect(() => {
    if (isReady && userId) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, userId]);

  const value = useMemo(
    () => ({ sources, loading, error, refresh }),
    [sources, loading, error, refresh],
  );

  return <SourcesContext.Provider value={value}>{children}</SourcesContext.Provider>;
}

export function useSources(): SourcesContextValue {
  const ctx = useContext(SourcesContext);
  if (!ctx) throw new Error("useSources must be used inside SourcesProvider");
  return ctx;
}
