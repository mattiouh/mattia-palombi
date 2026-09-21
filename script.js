(() => {
  const app = document.querySelector("#card-app");
  const cardStage = document.querySelector("[data-card-stage]");
  const cardMotion = document.querySelector("[data-card-motion]");
  const cardCamera = document.querySelector("[data-card-camera]");
  const faces = [...document.querySelectorAll("[data-face]")];
  const flipButtons = [...document.querySelectorAll("[data-flip]")];
  const flipLabels = [...document.querySelectorAll("[data-flip-label]")];
  const status = document.querySelector("#interaction-status");
  const dialogLayer = document.querySelector("[data-dialog-layer]");
  const dialog = document.querySelector("[data-dialog]");
  const panelContents = [...document.querySelectorAll("[data-panel]")];
  const detailButtons = [...document.querySelectorAll("[data-open-panel]")];
  const closeButtons = [...document.querySelectorAll("[data-close-dialog]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const desktopViewport = window.matchMedia("(min-width: 761px) and (min-height: 501px)");

  if (!app || !cardStage || !cardMotion || !cardCamera || !dialogLayer || !dialog) return;

  let isBack = false;
  let activePanel = null;
  let returnFocusTo = null;
  let closeTimer = null;
  let flipTimer = null;
  let isFlipping = false;

  const announce = (message) => {
    if (!status) return;
    status.textContent = "";
    window.setTimeout(() => {
      status.textContent = message;
    }, 20);
  };

  const setFaceAccessibility = () => {
    const activeFace = faces.find((face) => face.dataset.face === (isBack ? "back" : "front"));
    const inactiveFace = faces.find((face) => face !== activeFace);

    if (activeFace) {
      activeFace.setAttribute("aria-hidden", "false");
      activeFace.removeAttribute("inert");
    }

    if (inactiveFace) {
      inactiveFace.setAttribute("aria-hidden", "true");
      inactiveFace.setAttribute("inert", "");
    }
  };

  const setFlipControl = () => {
    const label = isBack ? "By Palombi" : "1diFiducia";
    const action = isBack
      ? "Mostra la carta By Palombi"
      : "Mostra la carta di 1difiducia.it";

    flipButtons.forEach((button) => {
      button.setAttribute("aria-label", action);
      button.setAttribute("aria-pressed", String(isBack));
    });
    flipLabels.forEach((element) => {
      element.textContent = label;
    });
  };

  const setFace = (nextFace, { animate = false, announceChange = true, updateUrl = false } = {}) => {
    if (isFlipping && !animate) return;
    if (nextFace === isBack && !animate) {
      setFaceAccessibility();
      setFlipControl();
      return;
    }

    window.clearTimeout(flipTimer);
    isFlipping = animate;
    isBack = nextFace;
    const directionClass = isBack ? "is-flipping-to-back" : "is-flipping-to-front";
    cardCamera.classList.remove("is-flipping-to-back", "is-flipping-to-front");
    cardCamera.classList.toggle("is-back", isBack);
    if (animate) cardCamera.classList.add(directionClass);
    setFaceAccessibility();
    setFlipControl();
    if (updateUrl) {
      const faceHash = isBack ? "#1difiducia" : "#bypalombi";
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${faceHash}`);
    }
    if (announceChange) announce(isBack ? "Carta di 1difiducia.it mostrata." : "Carta By Palombi mostrata.");

    if (animate) {
      flipTimer = window.setTimeout(() => {
        cardCamera.classList.remove(directionClass);
        isFlipping = false;
      }, reducedMotion.matches ? 0 : 880);
    }
  };

  const flipCard = () => {
    if (isFlipping) return;
    setFace(!isBack, { animate: true, updateUrl: true });
  };

  const syncFaceFromUrl = () => {
    setFace(window.location.hash === "#1difiducia", { announceChange: false });
  };

  const activatePanel = (name) => {
    activePanel = panelContents.find((panel) => panel.dataset.panel === name);
    if (!activePanel) return;

    panelContents.forEach((panel) => {
      panel.hidden = panel !== activePanel;
    });

    const title = activePanel.querySelector("h2[id]");
    if (title) dialog.setAttribute("aria-labelledby", title.id);
  };

  const getFocusable = () =>
    [...dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => !element.closest("[hidden]") && !element.hidden);

  const focusFirstDialogControl = () => {
    getFocusable()[0]?.focus();
  };

  const openPanel = (name, trigger) => {
    window.clearTimeout(closeTimer);
    clearCardMotion();
    const wasClosed = dialogLayer.hidden || dialogLayer.inert;
    activatePanel(name);
    if (!activePanel) return;

    if (wasClosed) {
      returnFocusTo = trigger || document.activeElement;
      if (dialogLayer.hidden) dialogLayer.hidden = false;
    }

    app.inert = true;
    dialogLayer.inert = false;
    dialogLayer.setAttribute("aria-hidden", "false");

    if (wasClosed) {
      window.requestAnimationFrame(() => {
        dialogLayer.classList.add("is-open");
        focusFirstDialogControl();
      });
    } else {
      dialogLayer.classList.add("is-open");
      window.requestAnimationFrame(focusFirstDialogControl);
    }

    const label = activePanel.querySelector(".panel-kicker")?.textContent?.trim();
    announce(label ? label + " aperto." : "Dettaglio aperto.");
  };

  const closePanel = () => {
    if (dialogLayer.hidden || dialogLayer.inert) return;

    const fallback = document.querySelector("[data-flip], [data-open-panel]");
    const target = returnFocusTo?.isConnected ? returnFocusTo : fallback;

    app.inert = false;
    dialogLayer.inert = true;
    dialogLayer.classList.remove("is-open");
    dialogLayer.setAttribute("aria-hidden", "true");
    target?.focus({ preventScroll: true });

    const finish = () => {
      dialogLayer.hidden = true;
      activePanel = null;
      announce("Dettaglio chiuso.");
    };
    closeTimer = window.setTimeout(finish, reducedMotion.matches ? 0 : 350);
  };

  flipButtons.forEach((button) => {
    button.addEventListener("click", flipCard);
  });

  detailButtons.forEach((button) => {
    button.addEventListener("click", () => openPanel(button.dataset.openPanel, button));
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closePanel);
  });

  document.addEventListener("keydown", (event) => {
    const commandControl = event.target.closest?.(
      "button[data-flip], button[data-open-panel], button[data-close-dialog]"
    );
    if (commandControl && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      if (!event.repeat) commandControl.click();
      return;
    }

    if (event.key === "Escape" && !dialogLayer.hidden && !dialogLayer.inert) {
      event.preventDefault();
      closePanel();
      return;
    }

    if (event.key !== "Tab" || dialogLayer.hidden || dialogLayer.inert) return;
    const focusable = getFocusable();
    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const canMoveCard = () =>
    !reducedMotion.matches &&
    finePointer.matches &&
    desktopViewport.matches &&
    (dialogLayer.hidden || dialogLayer.inert);

  const clearCardMotion = () => {
    cardMotion.classList.remove("is-tilting");
    cardMotion.style.setProperty("--motion-x", "0px");
    cardMotion.style.setProperty("--motion-y", "0px");
    cardMotion.style.setProperty("--motion-r", "0deg");
    cardMotion.style.setProperty("--tilt-x", "0deg");
    cardMotion.style.setProperty("--tilt-y", "0deg");
    cardMotion.style.setProperty("--glare-x", "50%");
    cardMotion.style.setProperty("--glare-y", "38%");
    cardMotion.style.setProperty("--shadow-x", "0px");
    cardMotion.style.setProperty("--shadow-y", "22px");
  };

  const moveCardAgainstPointer = (event) => {
    if (!canMoveCard()) return;

    const clamp = (value) => Math.max(-1, Math.min(1, value));
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    const x = clamp((event.clientX - width / 2) / (width / 2));
    const y = clamp((event.clientY - height / 2) / (height / 2));

    /* The whole viewport behaves like the hand holding one physical card. */
    cardMotion.classList.toggle("is-tilting", Math.abs(x) + Math.abs(y) > .04);
    cardMotion.style.setProperty("--motion-x", `${-x * 3}px`);
    cardMotion.style.setProperty("--motion-y", `${-y * 2}px`);
    cardMotion.style.setProperty("--motion-r", `${-x * .18}deg`);
    cardMotion.style.setProperty("--tilt-x", `${-y * 5}deg`);
    cardMotion.style.setProperty("--tilt-y", `${x * 7}deg`);
    cardMotion.style.setProperty("--glare-x", `${50 + x * 36}%`);
    cardMotion.style.setProperty("--glare-y", `${50 + y * 34}%`);
    cardMotion.style.setProperty("--shadow-x", `${-x * 26}px`);
    cardMotion.style.setProperty("--shadow-y", `${18 - y * 11}px`);
  };

  window.addEventListener("pointermove", moveCardAgainstPointer, { passive: true });
  document.documentElement.addEventListener("pointerleave", clearCardMotion);
  window.addEventListener("blur", clearCardMotion);
  window.addEventListener("hashchange", syncFaceFromUrl);

  reducedMotion.addEventListener?.("change", () => {
    if (reducedMotion.matches) clearCardMotion();
  });
  finePointer.addEventListener?.("change", () => {
    if (!finePointer.matches) clearCardMotion();
  });
  desktopViewport.addEventListener?.("change", () => {
    if (!desktopViewport.matches) clearCardMotion();
  });

  if (window.location.hash !== "#bypalombi" && window.location.hash !== "#1difiducia") {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#bypalombi`);
  }
  syncFaceFromUrl();
})();
