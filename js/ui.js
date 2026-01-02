// ui.js — small helpers
const UI = (() => {
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));
  const esc = (s="") => String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));

  const badge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "READY") return `<span class="badge good">● Ready</span>`;
    if (s === "IN_PROGRESS") return `<span class="badge warn">● In progress</span>`;
    return `<span class="badge bad">● Not ready</span>`;
  };

  const toast = (msg, kind="") => {
    let t = qs("#toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.style.position = "fixed";
      t.style.right = "16px";
      t.style.bottom = "16px";
      t.style.padding = "10px 12px";
      t.style.borderRadius = "12px";
      t.style.border = "1px solid #e2e8f0";
      t.style.background = "#fff";
      t.style.boxShadow = "0 10px 25px rgba(15,23,42,.12)";
      t.style.zIndex = "9999";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.display = "block";
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(()=> t.style.display="none", 2200);
  };

  const redirect = (href) => { window.location.href = href; };

  const requireAuth = (roles, redirectTo="../auth/login.html") => {
    const s = ORDIN.getSession();
    if (!s || !roles.includes(s.role)) {
      UI.redirect(redirectTo);
      return null;
    }
    return s;
  };

  return { qs, qsa, esc, badge, toast, redirect, requireAuth };
})();
