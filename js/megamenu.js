// js/megamenu.js
(function(){
  function closeAll(){
    document.querySelectorAll("[data-mega]").forEach(m=>{
      m.classList.remove("open");
      const btn = document.querySelector(`[data-mega-btn="${m.getAttribute("data-mega")}" ]`);
      if (btn) btn.setAttribute("aria-expanded","false");
    });
  }

  function openMenu(name){
    closeAll();
    const menu = document.querySelector(`[data-mega="${name}"]`);
    const btn = document.querySelector(`[data-mega-btn="${name}"]`);
    if (!menu || !btn) return;
    menu.classList.add("open");
    btn.setAttribute("aria-expanded","true");
  }

  function toggleMenu(name){
    const menu = document.querySelector(`[data-mega="${name}"]`);
    if (!menu) return;
    const isOpen = menu.classList.contains("open");
    if (isOpen) closeAll();
    else openMenu(name);
  }

  // tabs inside mega
  function setTab(scopeEl, tabName){
    scopeEl.querySelectorAll("[data-megatab]").forEach(b=>{
      b.classList.toggle("active", b.getAttribute("data-megatab") === tabName);
    });
    scopeEl.querySelectorAll("[data-megapanel]").forEach(p=>{
      p.classList.toggle("active", p.getAttribute("data-megapanel") === tabName);
    });
  }

  function init(){
    // open/close on click
    document.querySelectorAll("[data-mega-btn]").forEach(btn=>{
      btn.addEventListener("click", (e)=>{
        e.preventDefault();
        toggleMenu(btn.getAttribute("data-mega-btn"));
      });
    });

    // close on outside click
    document.addEventListener("click", (e)=>{
      const inside = e.target.closest(".mega") || e.target.closest("[data-mega-btn]");
      if (!inside) closeAll();
    });

    // esc closes
    document.addEventListener("keydown", (e)=>{
      if (e.key === "Escape") closeAll();
    });

    // tab handlers
    document.querySelectorAll(".mega").forEach(menu=>{
      const first = menu.querySelector("[data-megatab]");
      if (first) setTab(menu, first.getAttribute("data-megatab"));

      menu.querySelectorAll("[data-megatab]").forEach(tabBtn=>{
        tabBtn.addEventListener("click", ()=>{
          setTab(menu, tabBtn.getAttribute("data-megatab"));
        });
      });
    });

    // desktop hover (optional nice feel)
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (!isCoarse){
      document.querySelectorAll("[data-mega-btn]").forEach(btn=>{
        const name = btn.getAttribute("data-mega-btn");
        const menu = document.querySelector(`[data-mega="${name}"]`);
        if (!menu) return;

        let timer;
        btn.addEventListener("mouseenter", ()=>{ clearTimeout(timer); openMenu(name); });
        btn.addEventListener("mouseleave", ()=>{ timer=setTimeout(closeAll, 180); });
        menu.addEventListener("mouseenter", ()=>{ clearTimeout(timer); });
        menu.addEventListener("mouseleave", ()=>{ timer=setTimeout(closeAll, 180); });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
