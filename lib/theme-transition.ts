const DURATION = 1200;
const FADE_OUT = 200;

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
): void {
  // ── 0. Guaranteed full-coverage radius ──────────────────────────
  const maxDist = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  );
  // extra 10% for safety
  const fullR = Math.ceil(maxDist * 1.1);

  // ── 1. Switch html to the NEW theme ─────────────────────────────
  document.documentElement.classList.toggle("dark", to === "dark");

  // ── 2. Capture the NEW theme's CSS variable values ──────────────
  const computed = getComputedStyle(document.documentElement);
  const newVars: Record<string, string> = {};
  for (const v of THEME_VARS) {
    newVars[v] = computed.getPropertyValue(v).trim();
  }

  // ── 3. Capture scroll position ──────────────────────────────────
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // ── 4. Clone the body ───────────────────────────────────────────
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "script, form, video, audio, iframe, [contenteditable], [style*='z-index: 9999']",
    )
    .forEach((el) => el.remove());

  // ── 5. Bake the NEW theme's CSS vars onto the clone's body ──────
  for (const [key, val] of Object.entries(newVars)) {
    clone.style.setProperty(key, val);
  }

  // ── 6. Switch html back to the OLD theme ────────────────────────
  document.documentElement.classList.toggle("dark", from === "dark");

  // ── 7. Position the clone as a fixed overlay ────────────────────
  Object.assign(clone.style, {
    position: "fixed",
    inset: "0",
    overflow: "hidden",
    zIndex: "9999",
    clipPath: `circle(0% at ${x}px ${y}px)`,
    transition: `clip-path ${DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    pointerEvents: "none",
    willChange: "clip-path",
    // Match the real page's scroll position so there's no jump
    transform: `translate(-${scrollX}px, -${scrollY}px)`,
  });

  document.body.appendChild(clone);

  // ── 8. Force reflow then expand the circle ──────────────────────
  clone.getBoundingClientRect();
  clone.style.clipPath = `circle(${fullR}px at ${x}px ${y}px)`;

  // ── 9. After animation, switch theme and fade out the clone smoothly ──
  setTimeout(() => {
    document.documentElement.classList.toggle("dark", to === "dark");
    localStorage.setItem("cid-theme", to);

    // Fade out to avoid a hard compositor-layer tear-down flash
    clone.style.willChange = "auto";
    clone.style.transition = `opacity ${FADE_OUT}ms ease`;
    clone.style.opacity = "0";

    // Remove after the fade completes
    setTimeout(() => {
      clone.remove();
    }, FADE_OUT + 20);
  }, DURATION + 80);
}
