const THEME_BG: Record<string, string> = {
  dark: "#0b0f14",
  light: "#f4f6f9",
};

const DURATION = 600;

export function animateThemeTransition(
  x: number,
  y: number,
  from: string,
  to: string
): Promise<void> {
  return new Promise((resolve) => {
    const oldBg = THEME_BG[from] ?? getComputedStyle(document.documentElement).getPropertyValue("--background").trim();

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: ${oldBg};
      clip-path: circle(150% at ${x}px ${y}px);
      transition: clip-path ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      will-change: clip-path;
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.toggle("dark", to === "dark");
        localStorage.setItem("cid-theme", to);

        overlay.style.clipPath = `circle(0% at ${x}px ${y}px)`;
      });
    });

    setTimeout(() => {
      overlay.remove();
      resolve();
    }, DURATION + 50);
  });
}
