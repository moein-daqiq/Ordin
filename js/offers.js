// js/offers.js
(function () {
  const pillTabs = Array.from(document.querySelectorAll(".pilltab[data-tab]"));
  const stripTabs = Array.from(document.querySelectorAll(".offer-strip-item[data-tab]"));
  const panels = Array.from(document.querySelectorAll(".offer-panel"));

  function activate(tab) {
    // pills
    pillTabs.forEach(b => b.classList.toggle("active", b.getAttribute("data-tab") === tab));
    // strip
    stripTabs.forEach(b => b.classList.toggle("active", b.getAttribute("data-tab") === tab));
    // panels
    panels.forEach(p => p.classList.toggle("active", p.id === `tab-${tab}`));
  }

  pillTabs.forEach(b => b.addEventListener("click", () => activate(b.getAttribute("data-tab"))));
  stripTabs.forEach(b => b.addEventListener("click", () => activate(b.getAttribute("data-tab"))));

  // default based on URL hash (optional)
  const hash = (location.hash || "").replace("#", "").trim();
  if (hash && panels.some(p => p.id === `tab-${hash}`)) activate(hash);
})();
