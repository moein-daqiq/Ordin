// js/contractor.js
(function () {
  const s = UI.requireAuth(["CONTRACTOR"], "../auth/login.html");
  if (!s) return;

  const who = UI.qs("#who");
  const orgText = UI.qs("#orgText");
  const statusText = UI.qs("#statusText");
  const readinessBadge = UI.qs("#readinessBadge");

  const elTaskList = UI.qs("#taskList");
  const elRing = UI.qs("#ring");
  const elPct = UI.qs("#pct");
  const elDoneCount = UI.qs("#doneCount");
  const elTotalCount = UI.qs("#totalCount");
  const btnStart = UI.qs("#btnStart");
  const btnLogout = UI.qs("#btnLogout");

  function getDb() {
    return ORDIN.getMyContext().db;
  }

  function findContractor(db) {
    // Try common keys
    return (
      db.contractors?.find(c => c.userId === s.userId) ||
      db.contractors?.find(c => c.user_id === s.userId) ||
      db.contractors?.find(c => c.accountUserId === s.userId) ||
      null
    );
  }

  function findEngagement(db, contractorId) {
    if (!contractorId) return null;
    // If multiple, pick newest-ish (last)
    const all = (db.engagements || []).filter(e => e.contractorId === contractorId);
    return all.length ? all[all.length - 1] : null;
  }

  function findOrg(db, engagement) {
    if (!engagement) return null;
    return (db.orgs || []).find(o => o.id === engagement.organisationId) || null;
  }

  function setRing(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    const deg = Math.round((clamped / 100) * 360);
    if (elRing) elRing.style.background = `conic-gradient(var(--btn) ${deg}deg, var(--line) ${deg}deg)`;
    if (elPct) elPct.textContent = `${clamped}%`;
  }

  function getTasks(db, contractor, engagement) {
    const personalDone = !!(contractor?.first_name?.trim() && contractor?.last_name?.trim() && contractor?.email?.trim());
    const addressDone = !!(contractor?.address_line1?.trim() && contractor?.city?.trim() && contractor?.postcode?.trim());
    const typeDone = !!(contractor?.contractor_type?.trim());
    const termsDone = !!(contractor?.terms_accepted_at);

    // v1: readiness requires profile + address/type + terms
    const profileDone = personalDone && addressDone && typeDone;

    const tasks = [
      {
        id: "profile",
        title: "Complete your profile",
        desc: "Personal details, UK address, and contractor type.",
        done: profileDone,
        cta: "Start",
        href: "profile-wizard.html"
      },
      {
        id: "terms",
        title: "Accept contractor onboarding terms",
        desc: "Required to mark your onboarding as ready (v1 demo).",
        done: termsDone,
        cta: "Review",
        href: "profile-wizard.html#terms"
      },
      {
        id: "contract",
        title: "Review contract (optional in v1)",
        desc: "If your employer sends a contract, you can review & sign (coming soon).",
        done: false,
        cta: "Coming soon",
        href: "#",
        disabled: true
      },
      {
        id: "payments",
        title: "Add bank details & payments",
        desc: "Coming soon (v1.1+).",
        done: false,
        cta: "Coming soon",
        href: "#",
        disabled: true
      }
    ];

    // Set readiness on engagement for employer visibility
    if (engagement) {
      const shouldReady = profileDone && termsDone;
      const newReadiness = shouldReady ? "READY" : profileDone ? "IN_PROGRESS" : "NOT_READY";
      if ((engagement.readiness || "NOT_READY") !== newReadiness) {
        engagement.readiness = newReadiness;
        ORDIN.save(db);
      }
    }

    return tasks;
  }

  function render() {
    const db = getDb();
    const contractor = findContractor(db);
    const engagement = findEngagement(db, contractor?.id);
    const org = findOrg(db, engagement);

    if (who) {
      const nm = contractor ? `${contractor.first_name || ""} ${contractor.last_name || ""}`.trim() : "Contractor";
      who.textContent = nm || "Contractor";
    }
    if (orgText) orgText.textContent = org?.name || "—";

    const readiness = engagement?.readiness || "NOT_READY";
    if (readinessBadge) readinessBadge.innerHTML = UI.badge(readiness);
    if (statusText) statusText.textContent = readiness === "READY" ? "Ready" : readiness === "IN_PROGRESS" ? "In progress" : "Not ready";

    const tasks = getTasks(db, contractor, engagement);
    const total = tasks.filter(t => !t.disabled).length;
    const done = tasks.filter(t => !t.disabled && t.done).length;

    if (elDoneCount) elDoneCount.textContent = String(done);
    if (elTotalCount) elTotalCount.textContent = String(total);

    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    setRing(pct);

    if (elTaskList) {
      elTaskList.innerHTML = "";
      tasks.forEach(t => {
        const dotCls = t.done ? "dot done" : "dot";
        const btnCls = t.disabled ? "btn small" : "btn small primary";
        const btnText = t.done ? "View" : t.cta;
        const disabledAttr = t.disabled ? "disabled" : "";

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
              <button class="${btnCls}" data-href="${UI.esc(t.href)}" ${disabledAttr}>
                ${UI.esc(btnText)}
              </button>
            </div>
          </div>
        `);
      });

      elTaskList.querySelectorAll("button[data-href]").forEach(btn => {
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          const href = btn.getAttribute("data-href");
          if (!href || href === "#") return;
          UI.redirect(href);
        });
      });
    }

    if (btnStart) {
      btnStart.onclick = () => {
        const first = tasks.find(x => !x.disabled && !x.done) || tasks.find(x => !x.disabled);
        if (!first) return;
        UI.redirect(first.href);
      };
    }

    if (btnLogout) {
      btnLogout.onclick = () => {
        ORDIN.logout();
        UI.redirect("../index.html");
      };
    }
  }

  render();
})();
