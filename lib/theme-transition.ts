const DURATION = 900;

const THEME_VARS = [
  "--background",
  "--secondary",
  "--card",
  "--border",
  "--accent",
  "--foreground",
  "--muted",
  "--success",
  "--warning",
  "--danger",
];

export function animateThemeTransition(
  x: number,
  y: number,
  from: string,
  to: string
): Promise<void> {
  return new Promise((resolve) => {
    // 1. Switch to the NEW theme on <html>
    document.documentElement.classList.toggle("dark", to === "dark");

    // 2. Snapshot the new theme's CSS variable values (they cascade from html)
    const computed = getComputedStyle(document.documentElement);
    const newVars: Record<string, string> = {};
    for (const v of THEME_VARS) {
      newVars[v] = computed.getPropertyValue(v).trim();
    }

    // 3. Clone the body — DOM shape matches, but CSS vars still resolve at render time
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll("script, form, video, audio, iframe, [contenteditable], [style*='z-index: 9999']")
      .forEach((el) => el.remove());

    // 4. Bake the NEW theme's CSS vars onto the clone's body element.
    //    Because CSS custom properties cascade, every child inside the clone will
    //    inherit these values regardless of what <html> says.
    for (const [key, val] of Object.entries(newVars)) {
      clone.style.setProperty(key, val);
    }

    // 5. Switch <html> back to the OLD theme — the clone is now self-contained
    document.documentElement.classList.toggle("dark", from === "dark");

    // 6. Pin the clone as a fixed overlay, clipped to nothing at the click point
    clone.style.cssText += `
      position: fixed !important;
      inset: 0 !important;
      z-index: 9999 !important;
      clip-path: circle(0% at ${x}px ${y}px) !important;
      transition: clip-path ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) !important;
      pointer-events: none !important;
      will-change: clip-path !important;
    `;

    document.body.appendChild(clone);

    // 7. Force a reflow then expand the circle — new theme scorches outward from the button
    clone.getBoundingClientRect();
    clone.style.clipPath = `circle(150% at ${x}px ${y}px)`;

    // 8. After animation, persist the theme and remove the clone
    setTimeout(() => {
      document.documentElement.classList.toggle("dark", to === "dark");
      localStorage.setItem("cid-theme", to);
      clone.remove();
      resolve();
    }, DURATION + 80);
  });
}
