/* Bookmarkable, single-step navigation. The URL hash selects the visible step. */
(() => {
  "use strict";
  function updateStep() {
    const match = /^#step-([1-4])$/.exec(window.location.hash);
    const active = match ? match[1] : "1";
    document.querySelectorAll("[data-step]").forEach(panel => { panel.hidden = panel.dataset.step !== active; });
    document.querySelectorAll("[data-step-link]").forEach(link => {
      if (link.dataset.stepLink === active) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
  }
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", updateStep);
    window.addEventListener("hashchange", updateStep);
  }
})();
