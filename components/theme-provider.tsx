"use client";

import * as React from "react";
import { animateThemeTransition } from "@/lib/theme-transition";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (e?: React.MouseEvent<HTMLElement>) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const stored = (localStorage.getItem("cid-theme") as Theme) || "dark";
    setTheme(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  const toggleTheme = React.useCallback(
    (e?: React.MouseEvent<HTMLElement>) => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

      // Update React state immediately so the re-render flushes synchronously
      // (inside the event handler) while the clone is being created and positioned.
      // The animation overlay hides any DOM churn from the re-render.
      setTheme(next);
      animateThemeTransition(x, y, theme, next);
    },
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
