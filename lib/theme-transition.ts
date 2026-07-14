const DURATION = 1500;

const THEME_VARS = [
  "--background", "--secondary", "--card", "--border",
  "--accent", "--foreground", "--muted",
  "--success", "--warning", "--danger",
];

export function animateThemeTransition(
  x: number,
  y: number,
  from: string,
  to: string
): void {
  // ── Full-coverage radius ──────────────────────────────────────
  const maxDist = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );
  const fullR = Math.ceil(maxDist * 1.1);

  // ── Capture scroll BEFORE any DOM changes ─────────────────────
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // ── 1. Switch to the NEW theme on <html> ──────────────────────
  document.documentElement.classList.toggle("dark", to === "dark");

  // ── 2. Capture the NEW theme's CSS variable values ─────────────
  const computed = getComputedStyle(document.documentElement);
  const newVars: Record<string, string> = {};
  for (const v of THEME_VARS) {
    newVars[v] = computed.getPropertyValue(v).trim();
  }

  // ── 3. Clone the body ─────────────────────────────────────────
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "script, form, video, audio, iframe, [contenteditable], [style*='z-index: 9999']",
    )
    .forEach((el) => el.remove());

  // ── 4. Bake the NEW theme's CSS vars onto the clone ───────────
  for (const [key, val] of Object.entries(newVars)) {
    clone.style.setProperty(key, val);
  }

  // ── 5. Switch <html> back to the OLD theme ────────────────────
  document.documentElement.classList.toggle("dark", from === "dark");

  // ── 6. Scroll the real page to top (hidden behind clone) ──────
  window.scrollTo(0, 0);

  // ── 7. Position the clone as a fixed overlay ──────────────────
  //     No `transform` — that changes the containing block for
  //     positioned descendants.  Instead we scrolled the real page
  //     to top, so both start at scroll 0.
  Object.assign(clone.style, {
    position: "fixed",
    inset: "0",
    overflow: "hidden",
    zIndex: "9999",
    clipPath: `circle(0% at ${x}px ${y}px)`,
    transition: `clip-path ${DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    pointerEvents: "none",
  });

  document.body.appendChild(clone);

  // ── 8. Force reflow then expand the circle ────────────────────
  clone.getBoundingClientRect();
  clone.style.clipPath = `circle(${fullR}px at ${x}px ${y}px)`;

  // ── 9. After animation: restore scroll, switch theme, hide clone ──
  setTimeout(() => {
    // Restore original scroll position FIRST (hidden behind clone)
    window.scrollTo(scrollX, scrollY);

    // Switch <html> to the NEW theme
    document.documentElement.classList.toggle("dark", to === "dark");
    localStorage.setItem("cid-theme", to);

    // Instantly hide the clone — NO opacity fade, NO crossfade
    clone.style.visibility = "hidden";

    // Remove from DOM on the next frame (already invisible)
    requestAnimationFrame(() => clone.remove());
  }, DURATION + 80);
}
