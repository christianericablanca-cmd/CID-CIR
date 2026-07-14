const DURATION = 1500;
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
  // NOTE: no `overflow: hidden` — that suppresses scrollbars, making the
  // clone ~15px wider than the real page, which causes a layout shift
  // (the "pulse") when the clone is removed.
  // NOTE: no `will-change` — avoids creating a compositor layer that
  // flashes when torn down.
  Object.assign(clone.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    clipPath: `circle(0% at ${x}px ${y}px)`,
    transition: `clip-path ${DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    pointerEvents: "none",
    transform: `translate(-${scrollX}px, -${scrollY}px)`,
  });

  document.body.appendChild(clone);

  // ── 8. Force reflow then expand the circle ──────────────────────
  clone.getBoundingClientRect();
  clone.style.clipPath = `circle(${fullR}px at ${x}px ${y}px)`;

  // ── 9. After animation, switch theme and detach the clone ───────
  setTimeout(() => {
    document.documentElement.classList.toggle("dark", to === "dark");
    localStorage.setItem("cid-theme", to);

    // Fade out to smooth any remaining visual mismatch
    clone.style.transition = `opacity ${FADE_OUT}ms ease`;
    clone.style.opacity = "0";

    setTimeout(() => {
      // Move the clone into a document fragment instead of calling remove().
      // appendChild detaches the element without triggering synchronous
      // compositor-layer teardown – the clone stays alive in the fragment
      // and is garbage-collected naturally without a visible flash.
      document.createDocumentFragment().appendChild(clone);
    }, FADE_OUT + 20);
  }, DURATION + 80);
}
