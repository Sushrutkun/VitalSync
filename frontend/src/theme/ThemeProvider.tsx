import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { TamaguiProvider } from "tamagui";

import { store } from "@/src/lib/storage";
import tamaguiConfig from "@/tamagui.config";

import { THEME_STORAGE_KEY, type ResolvedTheme, type ThemePreference } from "./tokens";

type Ctx = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<Ctx | null>(null);

function isPreference(v: string | null): v is ThemePreference {
  return v === "system" || v === "light" || v === "dark";
}

// Static theme on Tamagui — dynamic theme switching at this level triggers a
// React-19/Tamagui-RC re-render loop in Theme2. Effective theming still drives
// our own components via `useThemePref().resolved`. Tamagui defaults to dark.
const TamaguiShell = memo(function TamaguiShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      {children}
    </TamaguiProvider>
  );
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await store.get(THEME_STORAGE_KEY);
      if (isPreference(stored)) setPreferenceState(stored);
      setHydrated(true);
    })();
  }, []);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await store.set(THEME_STORAGE_KEY, next);
  }, []);

  const resolved: ResolvedTheme =
    preference === "system" ? (system === "dark" ? "dark" : "light") : preference;

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);

  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={value}>
      <TamaguiShell>{children}</TamaguiShell>
    </ThemeContext.Provider>
  );
}

export function useThemePref(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemePref must be used inside ThemeProvider");
  return ctx;
}
