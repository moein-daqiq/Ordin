/* ORDIN - site.js
   - Mega menus: What we offer, Who we serve, Resources
   - Offer tabs switching
   - Close on outside click / Esc
   - Optional: dynamic hero word (index only)
   - Optional: pricing tabs switching (if pricing uses .pricingTab/.pricingPanel)
*/

(function () {
  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setExpanded(btn, val) {
    btn.setAttribute("aria-expanded", val ? "true" : "false");
  }

  // ---------- Mega menus ----------
  const openButtons = $$("[data-mega-open]");
  const closeButtons = $$("[data-mega-close]");
  const megas = $$(".mega");

  function closeAllMegas() {
    openButtons.forEach((b) => setExpanded(b, false));
    megas.forEach((m) => m.classList.remove("is-open"));
  }

  function openMega(name) {
    closeAllMegas();
    const mega = $("#mega-" + name);
    const btn = $(`[data-mega-open="${name}"]`);
    if (!mega || !btn) return;
    mega.classList.add("is-open");
    setExpanded(btn, true);
  }

  openButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const name = btn.getAttribute("data-mega-open");
      const mega = $("#mega-" + name);
      const isOpen = mega && mega.classList.contains("is-open");
      if (isOpen) closeAllMegas();
      else openMega(name);
    });
  });

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      closeAllMegas();
    });
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    const clickedInsideMega = e.target.closest(".mega");
    const clickedOpenBtn = e.target.closest("[data-mega-open]");
    if (!clickedInsideMega && !clickedOpenBtn) closeAllMegas();
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllMegas();
  });

  // ---------- Offer tabs (inside mega-offer) ----------
  const offerMega = $("#mega-offer");
  if (offerMega) {
    const tabs = $$("[data-offer-tab]", offerMega);
    const panels = $$("[data-offer-panel]", offerMega);

    function setOfferTab(key) {
      tabs.forEach((t) => t.classList.toggle("is-active", t.getAttribute("data-offer-tab") === key));
      panels.forEach((p) => p.classList.toggle("is-active", p.getAttribute("data-offer-panel") === key));
    }

    tabs.forEach((t) => {
      t.addEventListener("click", (e) => {
        e.preventDefault();
        setOfferTab(t.getAttribute("data-offer-tab"));
      });
    });
  }

  // ---------- Serve panels (simple, no tabs needed) ----------
  // (No special logic required—links only.)

  // ---------- Pricing tabs (if present) ----------
  const pricingTabs = $$(".pricingTab");
  const pricingPanels = $$(".pricingPanel");
  if (pricingTabs.length && pricingPanels.length) {
    function setPricingTab(key) {
      pricingTabs.forEach((t) => t.classList.toggle("is-active", t.getAttribute("data-pricing-tab") === key));
      pricingPanels.forEach((p) => p.classList.toggle("is-active", p.getAttribute("data-pricing-panel") === key));
    }
    pricingTabs.forEach((t) => {
      t.addEventListener("click", (e) => {
        e.preventDefault();
        setPricingTab(t.getAttribute("data-pricing-tab"));
      });
    });
    // default
    setPricingTab(pricingTabs[0].getAttribute("data-pricing-tab"));
  }

  // ---------- Dynamic hero word (index only) ----------
  const dyn = $("#dynWord");
  if (dyn) {
    const words = ["Payroll", "HR", "Onboarding", "Invoices", "Hiring", "Compliance", "Leads"];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      dyn.textContent = words[i];
    }, 1800);
  }
})();
