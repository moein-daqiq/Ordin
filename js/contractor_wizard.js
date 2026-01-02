// js/contractor_wizard.js
(function () {
  const s = UI.requireAuth(["CONTRACTOR"], "../auth/login.html");
  if (!s) return;

  const btnLogout = UI.qs("#btnLogout");
  if (btnLogout) {
    btnLogout.onclick = () => {
      ORDIN.logout();
      UI.redirect("../index.html");
    };
  }

  const stepEls = [UI.qs("#step1"), UI.qs("#step2"), UI.qs("#step3")];
  const stEls = [UI.qs("#st1"), UI.qs("#st2"), UI.qs("#st3")];

  const btnBack = UI.qs("#btnBack");
  const btnNext = UI.qs("#btnNext");
  const msg = UI.qs("#msg");

  const ring = UI.qs("#ring");
  const pct = UI.qs("#pct");
  const progressText = UI.qs("#progressText");

  // Step 1
  const first = UI.qs("#first");
  const last = UI.qs("#last");
  const email = UI.qs("#email");
  const phone = UI.qs("#phone");

  const err_first = UI.qs("#err_first");
  const err_last = UI.qs("#err_last");
  const err_email = UI.qs("#err_email");

  // Step 2
  const type = UI.qs("#type");
  const a1 = UI.qs("#a1");
  const city = UI.qs("#city");
  const pc = UI.qs("#pc");
  const err_addr = UI.qs("#err_addr");

  // Step 3
  const agree = UI.qs("#agree");
  const err_agree = UI.qs("#err_agree");

  function isEmail(x) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(x || "").trim());
  }

  function hideErrors() {
    [err_first, err_last, err_email, err_addr, err_agree].forEach(e => e && (e.style.display = "none"));
    if (msg) msg.textContent = "";
  }

  function ctx() {
    return ORDIN.getMyContext();
  }

  function findContractor(db) {
    return (
      db.contractors?.find(c => c.userId === s.userId) ||
      db.contractors?.find(c => c.user_id === s.userId) ||
      db.contractors?.find(c => c.accountUserId === s.userId) ||
      null
    );
  }

  function findEngagement(db, contractorId) {
    if (!contractorId) return null;
    const all = (db.engagements || []).filter(e => e.contractorId === contractorId);
    return all.length ? all[all.length - 1] : null;
  }

  function setRing(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    const deg = Math.round((clamped / 100) * 360);
    if (ring) ring.style.background = `conic-gradient(var(--btn) ${deg}deg, var(--line) ${deg}deg)`;
    if (pct) pct.textContent = `${clamped}%`;
  }

  function step1Complete() {
    return !!(first.value.trim() && last.value.trim() && isEmail(email.value));
  }
  function step2Complete() {
    return !!(type.value && a1.value.trim() && city.value.trim() && pc.value.trim());
  }
  function step3Complete(db) {
    const contractor = findContractor(db);
    return !!contractor?.terms_accepted_at;
  }

  function computeProgress(db) {
    const s1 = step1Complete();
    const s2 = step2Complete();
    const s3 = step3Complete(db);

    if (s1 && s2 && s3) return { pct: 100, done: 3 };
    if (s1 && s2) return { pct: 66, done: 2 };
    if (s1) return { pct: 33, done: 1 };
    return { pct: 0, done: 0 };
  }

  function refreshProgressUI() {
    const db = ctx().db;
    const p = computeProgress(db);
    setRing(p.pct);
    if (progressText) progressText.textContent = `${p.done} of 3 steps completed`;
  }

  function loadIntoForm() {
    const { db } = ctx();
    const c = findContractor(db);
    if (!c) return;

    first.value = c.first_name || "";
    last.value = c.last_name || "";
    email.value = c.email || "";
    phone.value = c.phone || "";

    type.value = c.contractor_type || "LTD";
    a1.value = c.address_line1 || "";
    city.value = c.city || "";
    pc.value = c.postcode || "";

    // If they already accepted terms
    agree.checked = !!c.terms_accepted_at;
  }

  function savePartial() {
    const { db } = ctx();
    const c = findContractor(db);
    if (!c) {
      UI.toast("Contractor record not found");
      return false;
    }

    c.first_name = first.value.trim();
    c.last_name = last.value.trim();
    c.email = email.value.trim();
    c.phone = phone.value.trim();

    c.contractor_type = type.value;
    c.address_line1 = a1.value.trim();
    c.city = city.value.trim();
    c.postcode = pc.value.trim();

    // Mark profile completion timestamps (optional)
    if (step1Complete()) c.profile_personal_completed_at = c.profile_personal_completed_at || new Date().toISOString();
    if (step2Complete()) c.profile_address_completed_at = c.profile_address_completed_at || new Date().toISOString();

    // Engagement readiness update (for employer visibility)
    const eng = findEngagement(db, c.id);
    if (eng) {
      const profileDone = step1Complete() && step2Complete();
      const termsDone = !!c.terms_accepted_at;
      eng.readiness = (profileDone && termsDone) ? "READY" : profileDone ? "IN_PROGRESS" : "NOT_READY";
    }

    ORDIN.save(db);
    return true;
  }

  function acceptTerms() {
    const { db } = ctx();
    const c = findContractor(db);
    if (!c) return false;
    c.terms_accepted_at = new Date().toISOString();
    ORDIN.save(db);
    return true;
  }

  function setStep(n) {
    stepEls.forEach((el, i) => el && (el.style.display = (i === n) ? "block" : "none"));

    stEls.forEach((el, i) => {
      if (!el) return;
      el.classList.remove("active", "done");
      if (i === n) el.classList.add("active");
    });

    // done markers
    if (stEls[0]) stEls[0].classList.toggle("done", step1Complete());
    if (stEls[1]) stEls[1].classList.toggle("done", step2Complete());
    if (stEls[2]) {
      const c = findContractor(ctx().db);
      stEls[2].classList.toggle("done", !!c?.terms_accepted_at);
    }

    if (btnBack) btnBack.style.display = (n === 0) ? "none" : "inline-flex";
    if (btnNext) btnNext.textContent = (n === 2) ? "Save & finish" : "Continue";

    hideErrors();
    refreshProgressUI();
  }

  function validateStep1() {
    let ok = true;
    if (!first.value.trim()) { err_first.style.display = "block"; ok = false; }
    if (!last.value.trim()) { err_last.style.display = "block"; ok = false; }
    if (!isEmail(email.value)) { err_email.style.display = "block"; ok = false; }
    return ok;
  }

  function validateStep2() {
    const ok = !!(a1.value.trim() && city.value.trim() && pc.value.trim());
    if (!ok) err_addr.style.display = "block";
    return ok;
  }

  // --- init
  let step = 0;

  // Jump straight to terms if opened via #terms
  if (location.hash === "#terms") step = 2;

  loadIntoForm();
  refreshProgressUI();
  setStep(step);

  // Live progress
  [first, last, email, type, a1, city, pc, agree].forEach(el => {
    if (!el) return;
    el.addEventListener((el === agree) ? "change" : "input", () => refreshProgressUI());
  });

  btnBack.onclick = () => {
    if (step > 0) {
      step -= 1;
      setStep(step);
    }
  };

  btnNext.onclick = () => {
    hideErrors();

    if (step === 0) {
      if (!validateStep1()) return;
      savePartial();
      UI.toast("Saved");
      step = 1;
      setStep(step);
      return;
    }

    if (step === 1) {
      if (!validateStep2()) return;
      savePartial();
      UI.toast("Saved");
      step = 2;
      setStep(step);
      return;
    }

    // Step 3 finish
    if (step === 2) {
      if (!agree.checked) {
        err_agree.style.display = "block";
        return;
      }
      // Save + accept terms
      savePartial();
      acceptTerms();
      savePartial(); // update readiness after terms
      UI.toast("Onboarding completed");
      UI.redirect("dashboard.html");
    }
  };
})();
