// js/theme.js
(function(){
  const KEY = "ordin_theme";
  const root = document.documentElement;

  function setTheme(t){
    root.setAttribute("data-theme", t);
    localStorage.setItem(KEY, t);

    // update toggle UI if present
    const a = document.querySelector('[data-theme-btn="deel"]');
    const b = document.querySelector('[data-theme-btn="classic"]');
    if (a && b){
      a.classList.toggle("active", t === "deel");
      b.classList.toggle("active", t === "classic");
    }
  }

  function init(){
    const saved = localStorage.getItem(KEY);
    const initial = saved || "deel"; // default to Deel-inspired
    setTheme(initial);

    document.querySelectorAll("[data-theme-btn]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        setTheme(btn.getAttribute("data-theme-btn"));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
