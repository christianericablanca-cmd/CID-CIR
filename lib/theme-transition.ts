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

  // Keep the <html> class in sync with the new theme immediately
  // so React state updates see the correct class — the View Transition
  // API automatically captures before/after snapshots.
}
