const DURATION = 900;

export function animateThemeTransition(
  x: number,
  y: number,
  from: string,
  to: string
): Promise<void> {
  return new Promise((resolve) => {
    // 1. Switch to the new theme so we can capture it in the clone
    document.documentElement.classList.toggle("dark", to === "dark");

    // 2. Clone the body — this copy has the NEW theme styles applied
    const clone = document.body.cloneNode(true) as HTMLElement;
    // Strip interactive / stateful elements to avoid issues
    clone
      .querySelectorAll("script, form, video, audio, iframe, [contenteditable]")
      .forEach((el) => el.remove());
    // Remove any existing theme-transition overlays from the clone
    clone
      .querySelectorAll('[style*="z-index: 9999"]')
      .forEach((el) => el.remove());

    // 3. Switch back to the old theme for the real page underneath
    document.documentElement.classList.toggle("dark", from === "dark");

    // 4. Position the clone as a fixed overlay, clipped to a tiny circle at the button
    clone.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      overflow: auto;
      clip-path: circle(0% at ${x}px ${y}px);
      transition: clip-path ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      will-change: clip-path;
    `;

    document.body.appendChild(clone);

    // 5. Force a reflow so the transition fires
    clone.getBoundingClientRect();

    // 6. Expand the circle — the NEW theme scorches outward from the button
    clone.style.clipPath = `circle(150% at ${x}px ${y}px)`;

    // 7. After the animation, persist the theme and clean up
    setTimeout(() => {
      document.documentElement.classList.toggle("dark", to === "dark");
      localStorage.setItem("cid-theme", to);
      clone.remove();
      resolve();
    }, DURATION + 80);
  });
}
