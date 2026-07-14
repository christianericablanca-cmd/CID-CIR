/**
 * ══════════════════════════════════════════════════════════════════
 *  THEME TRANSITION — View Transitions API (circle reveal)
 * ══════════════════════════════════════════════════════════════════
 *
 *  A growing circle replaces the old theme with the new, starting
 *  from wherever the user clicked the toggle button.
 *
 *  4 files needed:
 *    1. lib/theme-transition.ts
 *    2. components/theme-provider.tsx
 *    3. app/globals.css  (keyframes + ::view-transition rules)
 *    4. app/layout.tsx   (blocking script to prevent white flash)
 *
 *  Chrome 111+, Edge 111+, Safari 18+  — falls back to instant
 *  toggle on Firefox / older browsers.
 *
 * ══════════════════════════════════════════════════════════════════
 *  FILE 1/4 ── lib/theme-transition.ts
 * ══════════════════════════════════════════════════════════════════
 */

export function animateThemeTransition(
  x: number,
  y: number,
  from: string,
  to: string
): void {
  document.documentElement.style.setProperty("--click-x", `${x}px`);
  document.documentElement.style.setProperty("--click-y", `${y}px`);

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };

  if (doc.startViewTransition) {
    doc.startViewTransition(() => {
      doc.documentElement.classList.toggle("dark", to === "dark");
      localStorage.setItem("cid-theme", to);
    });
  } else {
    doc.documentElement.classList.toggle("dark", to === "dark");
    localStorage.setItem("cid-theme", to);
  }
}

/* ══════════════════════════════════════════════════════════════════
   FILE 2/4 ── components/theme-provider.tsx
   ══════════════════════════════════════════════════════════════════ */

/*
import * as React from "react";
import { animateThemeTransition } from "@/lib/theme-transition";

type Theme = "dark" | "light";

const ThemeContext = React.createContext<{
  theme: Theme;
  toggleTheme: (e?: React.MouseEvent<HTMLElement>) => void;
} | undefined>(undefined);

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
*/

/* ══════════════════════════════════════════════════════════════════
   FILE 3/4 ── app/globals.css (append these rules)
   ══════════════════════════════════════════════════════════════════ */

/*
@keyframes circle-grow {
  0%   { clip-path: circle(0%    at var(--click-x, 50%) var(--click-y, 50%)); }
  100% { clip-path: circle(150%  at var(--click-x, 50%) var(--click-y, 50%)); }
}

::view-transition-old(root) {
  animation: none;
}

::view-transition-new(root) {
  z-index: 1;
  animation: circle-grow 2500ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
*/

/* ══════════════════════════════════════════════════════════════════
   FILE 4/4 ── app/layout.tsx (add these to your existing layout)
   ══════════════════════════════════════════════════════════════════ */

/*
// Import Script at the top:
import Script from "next/script";

// Set default dark class on <html>:
<html lang="en" className="dark" suppressHydrationWarning>

// Add this blocking script INSIDE <body> (before ThemeProvider):
<Script id="theme-init" strategy="beforeInteractive">
  {`try{(function(){
    var t=localStorage.getItem('cid-theme');
    document.documentElement.classList.toggle('dark',t!=='light')
  })()}catch(e){}`}
</Script>
*/

/* ══════════════════════════════════════════════════════════════════
   BONUS ── Navbar toggle button
   ══════════════════════════════════════════════════════════════════ */

/*
import { useTheme } from "@/components/theme-provider";

const { theme, toggleTheme } = useTheme();

<button onClick={toggleTheme}>
  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
</button>
*/
