// js/employer.js
(function () {
  const s = UI.requireAuth(["EMPLOYER"], "../auth/login.html");
  if (!s) return;

  // --- UI refs
  const elOrgName = UI.qs("#orgName");
  const elOrgShort = UI.qs("#orgShort");
  const elReadinessBadge = UI.qs("#readinessBadge");
  const elKpiActive = UI.qs("#kpiActive");
  const elKpiPending = UI.qs("#kpiPending");
  const elKpiSigned = UI.qs("#kpiSigned");

  const elTaskList = UI.qs("#taskList");
  const elPct = UI.qs("#pct");
  const elRing = UI.qs("#ring");
  const elDoneCount = UI.qs("#doneCount");
  const elTotalCount = UI.qs("#totalCount");
  const btnStartOnboarding = UI.qs("#btnStartOnboarding");

  const elInviteEmail = UI.qs("#inviteEmail");
  const elInviteResult = UI.qs("#inviteResult");
  const btnInvite = UI.qs("#btnInvite");

  const elRows = UI.qs("#rows");
  const btnLogout = UI.qs("#btnLogout");

  function ctx() {
    return ORDIN.getMyContext();
  }

  function getOrgTasks(org) {
    // v1: small, focused (Deel-inspired basics)
    const tasks = [
      {
        id: "org_profile",
        title: "Tell us about your organisation",
        desc: "Complete the organisation profile wizard (used for contracts and audit logs).",
        // ✅ DONE only after wizard “Save & finish”
        done: !!org?.org_profile_completed_at,
        cta: "Get started",
        href: "org-wizard.html"
      },
      {
        id: "invite_contractor",
        title: "Invite your first contractor",
        desc: "Generate an invite link to start contractor onboarding.",
        done: (ctx().db.invites || []).some(i => i.organisationId === org.id),
        cta: "Invite",
        href: "dashboard.html#invite"
      },
      {
        id: "contract_template",
        title: "Create a contract (v1 demo)",
        desc: "Send a simple contract for signature (demo behaviour).",
        done: (ctx().db.contracts || []).some(c => {
          const eng = ctx().db.engagements.find(e => e.id === c.engagementId);
          return eng && eng.organisationId === org.id;
        }),
        cta: "View contracts",
        href: "contracts.html"
      },
      {
        id: "payment_method",
        title: "Set up a payment method",
        desc: "Coming soon. Payments and billing will be added in v1.1.",
        done: false,
        cta: "Coming soon",
        href: "#",
        disabled: true
      }
    ];
    return tasks;
  }

  function setRing(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    const deg = Math.round((clamped / 100) * 360);
    if (elRing) elRing.style.background = `conic-gradient(var(--btn) ${deg}deg, var(--line) ${deg}deg)`;
    if (elPct) elPct.textContent = `${clamped}%`;
  }

  function computeKPIs(db, org) {
    const myEngs = db.engagements.filter(e => e.organisationId === org.id);
    const activeCount = myEngs.length;
    const pendingCount = myEngs.filter(e => (e.readiness || "NOT_READY") !== "READY").length;

    const signedCount = myEngs.reduce((acc, e) => {
      const c = db.contracts.find(x => x.engagementId === e.id);
      return acc + (c && c.status === "SIGNED" ? 1 : 0);
    }, 0);

    if (elKpiActive) elKpiActive.textContent = String(activeCount);
    if (elKpiPending) elKpiPending.textContent = String(pendingCount);
    if (elKpiSigned) elKpiSigned.textContent = String(signedCount);

    const orgReady =
      pendingCount === 0 && activeCount > 0 ? "READY" : activeCount === 0 ? "NOT_READY" : "IN_PROGRESS";

    if (elReadinessBadge) elReadinessBadge.innerHTML = UI.badge(orgReady);
  }

  function renderTasks(db, org) {
    if (!elTaskList) return;

    const tasks = getOrgTasks(org);
    const total = tasks.filter(t => !t.disabled).length;
    const done = tasks.filter(t => !t.disabled && t.done).length;

    if (elDoneCount) elDoneCount.textContent = String(done);
    if (elTotalCount) elTotalCount.textContent = String(total);

    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    setRing(pct);

    elTaskList.innerHTML = "";

    tasks.forEach(t => {
      const dotCls = t.done ? "dot done" : "dot";
      const btnCls = t.disabled ? "btn small" : "btn small primary";
      const btnText = t.done ? "View" : t.cta;
      const disabledAttr = t.disabled ? "disabled" : "";
      const ariaDisabled = t.disabled ? 'aria-disabled="true"' : "";

      // ✅ Deel-like “Completed” badge on the task row
      const completedBadge = t.done
        ? `<span class="badge good" style="margin-right:8px;">Completed</span>`
        : "";

      elTaskList.insertAdjacentHTML("beforeend", `
        <div class="task" ${t.disabled ? 'style="opacity:.75"' : ""}>
          <div class="left">
            <span class="${dotCls}"></span>
            <div>
              <h3>${UI.esc(t.title)}</h3>
              <div class="muted-sm desc">${UI.esc(t.desc)}</div>
            </div>
          </div>
          <div class="right">
            ${completedBadge}
            <button class="${btnCls}" data-href="${UI.esc(t.href)}" ${disabledAttr} ${ariaDisabled}>
              ${UI.esc(btnText)}
            </button>
          </div>
        </div>
      `);
    });

    // click handlers
    elTaskList.querySelectorAll("button[data-href]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const href = btn.getAttribute("data-href");
        if (!href || href === "#") return;
        if (href.includes("#invite")) {
          location.hash = "invite";
          const i = document.getElementById("inviteEmail");
          if (i) i.focus();
          return;
        }
        UI.redirect(href);
      });
    });

    if (btnStartOnboarding) {
      btnStartOnboarding.onclick = () => {
        const first = tasks.find(x => !x.disabled && !x.done) || tasks.find(x => !x.disabled);
        if (!first) return;
        if (first.href.includes("#invite")) {
          location.hash = "invite";
          const i = document.getElementById("inviteEmail");
          if (i) i.focus();
          return;
        }
        UI.redirect(first.href);
      };
    }
  }

  function renderTable(db, org) {
    if (!elRows) return;

    const engs = db.engagements.filter(e => e.organisationId === org.id);
    elRows.innerHTML = "";

    if (engs.length === 0) {
      elRows.innerHTML = `<tr><td colspan="5" class="muted">No contractors yet. Invite one above.</td></tr>`;
      return;
    }

    engs.forEach(e => {
      const ctr = db.contractors.find(c => c.id === e.contractorId);
      const contract = db.contracts.find(c => c.engagementId === e.id);

      const name = ctr ? `${ctr.first_name} ${ctr.last_name}` : "(invited)";
      const type = ctr ? ctr.contractor_type : "—";
      const readiness = e.readiness || "NOT_READY";
      const contractStatus = contract ? contract.status : "—";

      const link = `contractor-detail.html?eng=${encodeURIComponent(e.id)}`;

      elRows.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${UI.esc(name)}</td>
          <td>${UI.esc(type)}</td>
          <td>${UI.badge(readiness)}</td>
          <td>${UI.esc(contractStatus)}</td>
          <td><a class="btn" href="${link}">View</a></td>
        </tr>
      `);
    });
  }

  function showInviteBoxNice(token) {
    if (!elInviteResult) return;

    const inviteLink = `auth/contractor-accept.html?token=${encodeURIComponent(token)}`;

    elInviteResult.style.display = "block";
    elInviteResult.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div>
          <strong>Invite link created</strong>
          <div class="muted">
            ORDIN v1 demo does not send emails yet. Copy this link and send it to your contractor.
          </div>
        </div>

        <div class="feature" style="margin:0;">
          <div class="label" style="margin:0 0 6px;">Invite link</div>
          <div class="row gap-10 wrap">
            <input class="input" id="inviteLinkBox" value="${UI.esc(inviteLink)}"
              readonly style="flex:1;min-width:260px;" />
            <button class="btn primary" id="btnCopyInvite">Copy link</button>
          </div>

          <div style="margin-top:10px;">
            <button class="btn" id="btnToggleToken">Show token</button>
            <span id="tokenWrap" style="display:none;margin-left:10px;">
              <code>${UI.esc(token)}</code>
            </span>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const linkBox = document.getElementById("inviteLinkBox");
      const btnCopy = document.getElementById("btnCopyInvite");
      const btnToggle = document.getElementById("btnToggleToken");
      const tokenWrap = document.getElementById("tokenWrap");

      if (btnCopy && linkBox) {
        btnCopy.onclick = async () => {
          try {
            await navigator.clipboard.writeText(linkBox.value);
            UI.toast("Invite link copied");
          } catch (e) {
            linkBox.focus();
            linkBox.select();
            document.execCommand("copy");
            UI.toast("Invite link copied");
          }
        };
      }

      if (btnToggle && tokenWrap) {
        btnToggle.onclick = () => {
          const open = tokenWrap.style.display === "inline";
          tokenWrap.style.display = open ? "none" : "inline";
          btnToggle.textContent = open ? "Show token" : "Hide token";
        };
      }
    }, 0);
  }

  function bindInvite(db, org) {
    if (!btnInvite) return;

    btnInvite.onclick = () => {
      const email = (elInviteEmail?.value || "").trim();
      if (!email) return UI.toast("Enter contractor email");

      const r = ORDIN.inviteContractor({ employerUserId: s.userId, contractorEmail: email });
      if (!r.ok) return UI.toast(r.error || "Invite failed");

      if (elInviteEmail) elInviteEmail.value = "";
      showInviteBoxNice(r.token);

      const fresh = ctx();
      computeKPIs(fresh.db, fresh.org);
      renderTasks(fresh.db, fresh.org);
      renderTable(fresh.db, fresh.org);
    };
  }

  function init() {
    const { db, org } = ctx();

    if (elOrgName) elOrgName.textContent = org?.name || "—";
    if (elOrgShort) elOrgShort.textContent = org?.name || "your organisation";

    computeKPIs(db, org);
    renderTasks(db, org);
    renderTable(db, org);
    bindInvite(db, org);

    if (btnLogout) {
      btnLogout.onclick = () => {
        ORDIN.logout();
        UI.redirect("../index.html");
      };
    }

    if (location.hash === "#invite") {
      const i = document.getElementById("inviteEmail");
      if (i) i.focus();
    }
  }

  init();
})();
