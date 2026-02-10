import * as React from "react";

import {
  ThemeContext,
  type ResolvedTheme,
  type ThemeContextValue,
  type ThemeMode,
} from "./theme";

const STORAGE_KEY = "smartcampost.theme";

function getSystemResolvedTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? getSystemResolvedTheme() : mode;
}

function applyThemeClass(resolvedTheme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.theme = resolvedTheme;
}

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function ThemeProvider({
  children,
  defaultMode = "system",
}: React.PropsWithChildren<{ defaultMode?: ThemeMode }>) {
  const [mode, setModeState] = React.useState<ThemeMode>(() => {
    const stored = readStoredMode();
    return stored ?? defaultMode;
  });

  const resolvedTheme = React.useMemo(() => resolveTheme(mode), [mode]);

  const setMode = React.useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // ignore (storage may be unavailable)
    }
  }, []);

  React.useEffect(() => {
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

  React.useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;

    const handler = () => {
      applyThemeClass(getSystemResolvedTheme());
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }

    // Safari fallback
    media.addListener(handler);
    return () => media.removeListener(handler);
  }, [mode]);

  const value = React.useMemo(
    () => ({ mode, resolvedTheme, setMode }),
    [mode, resolvedTheme, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
