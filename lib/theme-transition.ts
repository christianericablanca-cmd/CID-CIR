const DURATION = 1500;

const BG: Record<string, string> = {
  dark: "#0b0f14",
  light: "#f4f6f9",
};

export function animateThemeTransition(
  x: number,
  y: number,
  from: string,
  to: string
): void {
  const oldBg = BG[from];

  // 1. Switch html to the NEW theme — content changes instantly
  document.documentElement.classList.toggle("dark", to === "dark");

  // 2. Create a simple background overlay (no clone, no content)
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    background: oldBg,
    // Start at full coverage — hides the instant theme switch
    clipPath: `circle(150% at ${x}px ${y}px)`,
    transition: `clip-path ${DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    pointerEvents: "none",
    willChange: "clip-path",
  });

  document.body.appendChild(overlay);

  // 3. Force reflow then shrink the circle to the click point.
  //    As it shrinks, the new-themed real page is revealed OUTSIDE
  //    the circle.  From the user's perspective the new theme expands
  //    from the edges and converges on the button.
  overlay.getBoundingClientRect();
  overlay.style.clipPath = `circle(0% at ${x}px ${y}px)`;

  // 4. After the transition, just remove the overlay.
  //    No clone, no fade, no content mismatch → NO PULSE.
  setTimeout(() => {
    overlay.remove();
    localStorage.setItem("cid-theme", to);
  }, DURATION + 80);
}
