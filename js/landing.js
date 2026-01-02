/* =========================================================
   ORDIN Landing JS
   - Theme switcher (Deel / Classic)
   - Dynamic word rotation (NO suffix)
   - Mega menu open/close (desktop hover + click + escape)
   - What-we-offer left rail switcher (Payroll/HR/IT/Services/Platform)
   - Mobile hamburger menu + collapsible sections
   - Simple video modal
========================================================= */

(function () {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  // Year
  const y = qs("#year");
  if (y) y.textContent = String(new Date().getFullYear());

  // Theme
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("ordin_theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);

  function syncThemePills() {
    const t = root.getAttribute("data-theme") || "deel";
    qsa("[data-theme-set]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-theme-set") === t);
    });
  }

  qsa("[data-theme-set]").forEach(btn => {
    btn.addEventListener("click", () => {
      const t = btn.getAttribute("data-theme-set");
      if (!t) return;
      root.setAttribute("data-theme", t);
      localStorage.setItem("ordin_theme", t);
      syncThemePills();
    });
  });
  syncThemePills();

  // Dynamic word rotation (NO suffix)
  const dyn = qs("#dynamicWord");
  if (dyn) {
    const words = ["Compliance", "Payroll", "Hiring", "HRIS", "Taxes", "Invoices", "Onboarding"];
    let i = Math.max(0, words.indexOf((dyn.textContent || "").trim()));

    setInterval(() => {
      i = (i + 1) % words.length;
      dyn.classList.add("wordFadeOut");
      setTimeout(() => {
        dyn.textContent = words[i];
        dyn.classList.remove("wordFadeOut");
        dyn.classList.add("wordFadeIn");
        setTimeout(() => dyn.classList.remove("wordFadeIn"), 220);
      }, 220);
    }, 2200);
  }

  // Mega menu (click to toggle, hover also works by CSS)
  const drops = qsa(".navDrop");
  function closeAllDrops(exceptEl = null) {
    drops.forEach(d => {
      if (exceptEl && d === exceptEl) return;
      d.classList.remove("open");
      const btn = qs(".navBtn", d);
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  drops.forEach(d => {
    const btn = qs(".navBtn", d);
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = d.classList.contains("open");
      closeAllDrops();
      d.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  document.addEventListener("click", (e) => {
    const inside = e.target.closest(".navDrop");
    if (!inside) closeAllDrops();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllDrops();
  });

  // What we offer: left rail switcher
  function initOfferSwitcher() {
    const railBtns = qsa("[data-offer-tab]");
    const panels = qsa("[data-offer-panel]");
    if (!railBtns.length || !panels.length) return;

    function setActive(key) {
      railBtns.forEach(b => b.classList.toggle("active", b.getAttribute("data-offer-tab") === key));
      panels.forEach(p => p.classList.toggle("active", p.getAttribute("data-offer-panel") === key));
    }

    // default
    const first = railBtns[0].getAttribute("data-offer-tab");
    setActive(first);

    railBtns.forEach(btn => {
      const key = btn.getAttribute("data-offer-tab");
      if (!key) return;

      btn.addEventListener("mouseenter", () => setActive(key));
      btn.addEventListener("focus", () => setActive(key));
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        setActive(key);
      });
    });
  }
  initOfferSwitcher();

  // Mobile menu
  const menuBtn = qs("#menuBtn");
  const mobileMenu = qs("#mobileMenu");
  function openMobile() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeMobile() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", openMobile);
    qsa("[data-mobile-close='1']", mobileMenu).forEach(el => el.addEventListener("click", closeMobile));

    qsa("[data-mobile-toggle]", mobileMenu).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-mobile-toggle");
        const sub = qs(`#${id}`, mobileMenu);
        if (!sub) return;
        const open = sub.classList.contains("open");
        qsa(".mobileSub", mobileMenu).forEach(s => s.classList.remove("open"));
        sub.classList.toggle("open", !open);
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenu.classList.contains("open")) closeMobile();
    });
  }

  // Video modal
  const btnPlay = qs("#btnPlay");
  const modal = qs("#videoModal");

  function openModal() {
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (btnPlay && modal) {
    btnPlay.addEventListener("click", openModal);
    qsa("[data-close='1']", modal).forEach(el => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });
  }
})();
