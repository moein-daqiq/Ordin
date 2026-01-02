// js/org_wizard.js
(function () {
  const s = UI.requireAuth(["EMPLOYER"], "../auth/login.html");
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

  // Progress UI
  const progRing = UI.qs("#progRing");
  const progPct = UI.qs("#progPct");
  const progText = UI.qs("#progText");

  // Step 1 fields
  const org_name = UI.qs("#org_name");
  const org_website = UI.qs("#org_website");
  const org_desc = UI.qs("#org_desc");
  const org_contractor_work = UI.qs("#org_contractor_work");
  const org_linkedin = UI.qs("#org_linkedin");
  const admin_linkedin = UI.qs("#admin_linkedin");

  // Step 2 fields
  const pc_name = UI.qs("#pc_name");
  const pc_email = UI.qs("#pc_email");
  const pc_phone = UI.qs("#pc_phone");
  const pc_role = UI.qs("#pc_role");
  const addr1 = UI.qs("#addr1");
  const addr2 = UI.qs("#addr2");
  const city = UI.qs("#city");
  const postcode = UI.qs("#postcode");

  // Step 3
  const summary = UI.qs("#summary");
  const confirm = UI.qs("#confirm");

  // Errors
  const err_desc = UI.qs("#err_desc");
  const err_work = UI.qs("#err_work");
  const err_pcname = UI.qs("#err_pcname");
  const err_pcemail = UI.qs("#err_pcemail");
  const err_addr = UI.qs("#err_addr");
  const err_confirm = UI.qs("#err_confirm");

  function hideAllErrors() {
    [err_desc, err_work, err_pcname, err_pcemail, err_addr, err_confirm].forEach(e => {
      if (e) e.style.display = "none";
    });
    if (msg) msg.textContent = "";
  }

  function isEmail(x) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(x || "").trim());
  }

  function currentCtx() {
    return ORDIN.getMyContext();
  }

  // Pure completion checks (no UI side effects)
  function isStep1Complete() {
    return !!(
      org_name.value.trim() &&
      org_desc.value.trim() &&
      org_contractor_work.value.trim()
    );
  }

  function isStep2Complete() {
    return !!(
      pc_name.value.trim() &&
      isEmail(pc_email.value) &&
      addr1.value.trim() &&
      city.value.trim() &&
      postcode.value.trim()
    );
  }

  function setRing(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    const deg = Math.round((clamped / 100) * 360);
    if (progRing) progRing.style.background = `conic-gradient(var(--btn) ${deg}deg, var(--line) ${deg}deg)`;
    if (progPct) progPct.textContent = `${clamped}%`;
  }

  function computeProgress() {
    const { org } = currentCtx();
    if (org?.org_profile_completed_at) return 100;

    const s1 = isStep1Complete();
    const s2 = isStep2Complete();

    if (s1 && s2) return 50;
    if (s1) return 25;
    return 0;
  }

  function setProgressUI() {
    const pct = computeProgress();
    setRing(pct);

    // map to "x of 3 steps"
    const stepsDone = (pct === 0) ? 0 : (pct === 25) ? 1 : (pct === 50) ? 2 : 3;
    if (progText) progText.textContent = `${stepsDone} of 3 steps completed`;
  }

  // Load existing org values into wizard
  function loadOrgIntoForm() {
    const { org } = currentCtx();
    if (!org) return;

    org_name.value = org.name || "";
    org_website.value = org.website_url || "";

    org_desc.value = org.business_description || "";
    org_contractor_work.value = org.contractor_work_description || "";

    org_linkedin.value = org.company_linkedin_url || "";
    admin_linkedin.value = org.admin_linkedin_url || "";

    pc_name.value = org.primary_contact_name || "";
    pc_email.value = org.primary_contact_email || "";
    pc_phone.value = org.primary_contact_phone || "";
    pc_role.value = org.primary_contact_role || "";

    addr1.value = org.registered_address_line1 || "";
    addr2.value = org.registered_address_line2 || "";
    city.value = org.city || "";
    postcode.value = org.postcode || "";
  }

  // Save to DB (localStorage)
  function saveToOrg(finalize) {
    const { db, org } = currentCtx();
    const o = db.orgs.find(x => x.id === org.id);
    if (!o) {
      UI.toast("Organisation record not found");
      return false;
    }

    // Step 1
    o.name = org_name.value.trim();
    o.website_url = org_website.value.trim();
    o.business_description = org_desc.value.trim();
    o.contractor_work_description = org_contractor_work.value.trim();
    o.company_linkedin_url = org_linkedin.value.trim();
    o.admin_linkedin_url = admin_linkedin.value.trim();

    // Step 2
    o.primary_contact_name = pc_name.value.trim();
    o.primary_contact_email = pc_email.value.trim();
    o.primary_contact_phone = pc_phone.value.trim();
    o.primary_contact_role = pc_role.value.trim();

    o.registered_address_line1 = addr1.value.trim();
    o.registered_address_line2 = addr2.value.trim();
    o.city = city.value.trim();
    o.postcode = postcode.value.trim();

    if (finalize) {
      o.org_profile_completed_at = new Date().toISOString();
    }

    ORDIN.save(db);
    return true;
  }

  function setStep(n) {
    stepEls.forEach((el, i) => {
      if (!el) return;
      el.style.display = (i === n) ? "block" : "none";
    });

    // Stepper states
    stEls.forEach((el, i) => {
      if (!el) return;
      el.classList.remove("active", "done");
      if (i === n) el.classList.add("active");
    });

    // Mark done based on completion (not based on step index)
    if (stEls[0]) stEls[0].classList.toggle("done", isStep1Complete());
    if (stEls[1]) stEls[1].classList.toggle("done", isStep2Complete());
    if (stEls[2]) {
      const { org } = currentCtx();
      stEls[2].classList.toggle("done", !!org?.org_profile_completed_at);
    }

    if (btnBack) btnBack.style.display = (n === 0) ? "none" : "inline-flex";
    if (btnNext) btnNext.textContent = (n === 2) ? "Save & finish" : "Continue";

    hideAllErrors();
    setProgressUI();
  }

  function validateStep1() {
    let ok = true;

    if (!org_desc.value.trim()) {
      if (err_desc) err_desc.style.display = "block";
      ok = false;
    }
    if (!org_contractor_work.value.trim()) {
      if (err_work) err_work.style.display = "block";
      ok = false;
    }
    if (!org_name.value.trim()) {
      if (msg) {
        msg.textContent = "Organisation name is required.";
        msg.style.color = "var(--bad)";
      }
      ok = false;
    }
    return ok;
  }

  function validateStep2() {
    let ok = true;

    if (!pc_name.value.trim()) {
      if (err_pcname) err_pcname.style.display = "block";
      ok = false;
    }
    if (!isEmail(pc_email.value)) {
      if (err_pcemail) err_pcemail.style.display = "block";
      ok = false;
    }
    if (!addr1.value.trim() || !city.value.trim() || !postcode.value.trim()) {
      if (err_addr) err_addr.style.display = "block";
      ok = false;
    }
    return ok;
  }

  function buildSummary() {
    const lines = [
      ["Organisation name", org_name.value.trim() || "—"],
      ["Website", org_website.value.trim() || "—"],
      ["Business description", org_desc.value.trim() || "—"],
      ["Contractor work", org_contractor_work.value.trim() || "—"],
      ["Company LinkedIn", org_linkedin.value.trim() || "—"],
      ["Your LinkedIn", admin_linkedin.value.trim() || "—"],
      ["Primary contact", pc_name.value.trim() || "—"],
      ["Contact email", pc_email.value.trim() || "—"],
      ["Phone", pc_phone.value.trim() || "—"],
      ["Role", pc_role.value.trim() || "—"],
      ["Registered address", `${addr1.value.trim()} ${addr2.value.trim()}`.trim() || "—"],
      ["City", city.value.trim() || "—"],
      ["Postcode", postcode.value.trim() || "—"]
    ];

    summary.innerHTML = lines.map(([k, v]) => `
      <div class="rowx">
        <div class="k">${UI.esc(k)}</div>
        <div class="v">${UI.esc(v)}</div>
      </div>
    `).join("");
  }

  // --- live progress update on input changes
  function bindLiveProgress() {
    const inputs = [
      org_name, org_desc, org_contractor_work,
      pc_name, pc_email, addr1, city, postcode,
      confirm
    ].filter(Boolean);

    inputs.forEach(el => {
      const ev = (el === confirm) ? "change" : "input";
      el.addEventListener(ev, () => setProgressUI());
    });
  }

  let step = 0;
  loadOrgIntoForm();
  bindLiveProgress();
  setStep(step); // also sets initial progress

  btnBack.onclick = () => {
    if (step > 0) {
      step -= 1;
      setStep(step);
    }
  };

  btnNext.onclick = () => {
    hideAllErrors();

    if (step === 0) {
      if (!validateStep1()) return;
      saveToOrg(false);
      UI.toast("Saved");
      step = 1;
      setStep(step);
      return;
    }

    if (step === 1) {
      if (!validateStep2()) return;
      saveToOrg(false);
      UI.toast("Saved");
      buildSummary();
      step = 2;
      setStep(step);
      return;
    }

    // step 3 submit
    if (step === 2) {
      if (!confirm.checked) {
        if (err_confirm) err_confirm.style.display = "block";
        return;
      }
      const ok = saveToOrg(true);
      if (!ok) return;

      UI.toast("Organisation profile completed");
      setProgressUI(); // will show 100%
      UI.redirect("dashboard.html");
    }
  };
})();
