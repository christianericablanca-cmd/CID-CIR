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

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // ── 1. Switch to NEW theme on <html> ──────────────────────────
  document.documentElement.classList.toggle("dark", to === "dark");

  // ── 2. Capture NEW theme's CSS variable values ─────────────────
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

  // ── 4. Bake NEW theme's CSS vars onto the clone ───────────────
  for (const [key, val] of Object.entries(newVars)) {
    clone.style.setProperty(key, val);
  }

  // ── 5. Switch <html> back to OLD theme ────────────────────────
  document.documentElement.classList.toggle("dark", from === "dark");

  // ── 6. Position clone as a fixed overlay ───────────────────────
  //     Use `overflow: auto` + `scrollTop` to match the real page's
  //     scroll position.  Unlike `transform`, this preserves the
  //     coordinate system so `position: sticky` descendants (like
  //     the Navbar) behave identically to the real page.
  //     No `will-change` (avoids compositor-layer teardown flash).
  Object.assign(clone.style, {
    position: "fixed",
    inset: "0",
    overflow: "auto",
    zIndex: "9999",
    clipPath: `circle(0% at ${x}px ${y}px)`,
    transition: `clip-path ${DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    pointerEvents: "none",
  });

  document.body.appendChild(clone);
  // Scroll the clone so its visible content matches the real viewport
  clone.scrollTop = scrollY;
  clone.scrollLeft = scrollX;

  // ── 7. Force reflow then expand the circle ────────────────────
  clone.getBoundingClientRect();
  clone.style.clipPath = `circle(${fullR}px at ${x}px ${y}px)`;

  // ── 8. After animation: switch theme, let recalc settle, then hide ──
  setTimeout(() => {
    // Frame 1: toggle the class — triggers a full style recalc for all
    // elements behind the clone.  The clone stays visible so the user
    // doesn't see the recalc.
    document.documentElement.classList.toggle("dark", to === "dark");
    localStorage.setItem("cid-theme", to);

    // Frame 2: by now the style recalc has completed.  The real page
    // is in its final visual state.  Hide the clone.
    requestAnimationFrame(() => {
      clone.style.visibility = "hidden";

      // Frame 3: remove the (already invisible) clone from the DOM.
      requestAnimationFrame(() => clone.remove());
    });
  }, DURATION + 80);
}
