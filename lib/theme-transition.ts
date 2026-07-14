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
  const newBg = BG[to];

  // Keep html as the OLD theme — content outside the circle stays as-is

  // Overlay with NEW theme's background, starting as a tiny dot at the button
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    background: newBg,
    clipPath: `circle(0% at ${x}px ${y}px)`,
    transition: `clip-path ${DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    pointerEvents: "none",
    willChange: "clip-path",
  });

  document.body.appendChild(overlay);
  overlay.getBoundingClientRect();

  // Expand the circle — new theme bg scorches OUTWARD from the button.
  // Outside the circle the old-themed page is still visible;
  // inside the circle the solid new bg covers the old content.
  overlay.style.clipPath = `circle(150% at ${x}px ${y}px)`;

  // After the animation: switch the real theme and remove the overlay
  setTimeout(() => {
    document.documentElement.classList.toggle("dark", to === "dark");
    localStorage.setItem("cid-theme", to);

    // Brief fade-out to avoid a hard reveal of the new content underneath
    overlay.style.transition = "opacity 150ms ease";
    overlay.style.opacity = "0";

    setTimeout(() => overlay.remove(), 170);
  }, DURATION + 80);
}
