(() => {
  const loader = document.querySelector("[data-site-loader]");
  if (!loader) return;

  const label = loader.querySelector("[data-loader-label]");
  const progress = loader.querySelector("[data-loader-progress]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const duration = Number(loader.dataset.duration || loader.dataset.minDuration || 2400);
  const maxWait = Number(loader.dataset.maxWait || 12000);
  let closeTimer;
  let openTimer;
  let fallbackTimer;
  let frame;
  let shownAt = performance.now();

  const setBusy = (value) => document.body?.setAttribute("aria-busy", String(value));
  const setLabel = (value) => { if (label && value) label.textContent = value; };
  const setProgress = (value) => {
    const safeValue = Math.max(0, Math.min(100, Math.round(value)));
    loader.style.setProperty("--site-loader-progress", `${safeValue}%`);
    if (progress) progress.textContent = `${safeValue}%`;
  };
  const clearProgress = () => { window.cancelAnimationFrame(frame); frame = undefined; };

  const finish = () => {
    loader.hidden = true;
    loader.inert = true;
    loader.setAttribute("aria-hidden", "true");
    loader.classList.remove("is-leaving");
    setBusy(false);
  };

  const fadeOut = () => {
    clearProgress();
    loader.classList.add("is-leaving");
    window.setTimeout(finish, reducedMotion.matches ? 0 : 380);
  };

  const hide = ({ minDuration = 0 } = {}) => {
    window.clearTimeout(openTimer);
    if (loader.hidden) return;
    const wait = reducedMotion.matches ? 0 : Math.max(0, minDuration - (performance.now() - shownAt));
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(fadeOut, wait);
  };

  const reveal = ({ label: nextLabel } = {}) => {
    window.clearTimeout(closeTimer);
    window.clearTimeout(fallbackTimer);
    clearProgress();
    setLabel(nextLabel);
    setProgress(0);
    loader.hidden = false;
    loader.inert = false;
    loader.setAttribute("aria-hidden", "false");
    loader.classList.remove("is-leaving");
    shownAt = performance.now();
    setBusy(true);
  };

  const show = ({ delay = 0, label: nextLabel } = {}) => {
    window.clearTimeout(openTimer);
    if (!delay) return reveal({ label: nextLabel });
    openTimer = window.setTimeout(() => reveal({ label: nextLabel }), delay);
  };

  const runProgress = () => {
    // Two frames guarantee the 0% state has been painted before counting begins.
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const start = performance.now();
      const tick = (now) => {
        const ratio = reducedMotion.matches ? 1 : Math.min(1, (now - start) / duration);
        setProgress(ratio * 100);
        if (ratio < 1) {
          frame = window.requestAnimationFrame(tick);
        } else {
          // Fade is deliberately scheduled only after the bar reaches 100%.
          closeTimer = window.setTimeout(fadeOut, reducedMotion.matches ? 0 : 180);
        }
      };
      frame = window.requestAnimationFrame(tick);
    }));
  };

  window.SiteLoader = { show, hide, setLabel, setProgress };
  reveal();
  fallbackTimer = window.setTimeout(() => {
    setProgress(100);
    hide();
  }, maxWait);

  const begin = () => runProgress();
  if (document.readyState === "complete") begin();
  else window.addEventListener("load", begin, { once: true });
})();
