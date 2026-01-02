// js/pricing.js
(function () {
  const tabs = Array.from(document.querySelectorAll(".pilltab[data-price]"));
  const panels = Array.from(document.querySelectorAll(".price-panel"));

  function activate(key) {
    tabs.forEach(t => t.classList.toggle("active", t.getAttribute("data-price") === key));
    panels.forEach(p => p.classList.toggle("active", p.id === `price-${key}`));
  }

  tabs.forEach(t => t.addEventListener("click", () => activate(t.getAttribute("data-price"))));

  // optional: URL hash support (#core / #payroll / #hris / #services)
  const hash = (location.hash || "").replace("#", "").trim();
  if (hash && panels.some(p => p.id === `price-${hash}`)) activate(hash);
})();
