/* =========================
   ORDIN — Book Demo Page
   - Creates time slots
   - Requires selecting a time slot
   - Shows confirmation message (placeholder)
========================= */

(function () {
  const form = document.getElementById("demoForm");
  const dateEl = document.getElementById("demoDate");
  const slotsEl = document.getElementById("slots");
  const timeHidden = document.getElementById("demoTime");
  const msg = document.getElementById("msg");
  const closeBtn = document.getElementById("demoClose");

  // Close -> go back home (like modal close)
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  // Set min date to today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;
  dateEl.min = minDate;

  // Example available time slots (you can change these any time)
  const SLOT_TIMES = [
    "09:00", "09:30",
    "10:00", "10:30",
    "11:00", "11:30",
    "13:00", "13:30",
    "14:00", "14:30",
    "15:00", "15:30",
    "16:00"
  ];

  function clearSlots() {
    slotsEl.innerHTML = "";
    timeHidden.value = "";
  }

  function renderSlots() {
    clearSlots();

    SLOT_TIMES.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slotBtn";
      btn.textContent = t;

      btn.addEventListener("click", () => {
        [...slotsEl.querySelectorAll(".slotBtn")].forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        timeHidden.value = t;
      });

      slotsEl.appendChild(btn);
    });
  }

  // Initial render
  renderSlots();

  // Re-render slots when date changes (keeps it simple)
  dateEl.addEventListener("change", renderSlots);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Validate time selected
    if (!timeHidden.value) {
      msg.style.display = "block";
      msg.textContent = "Please select a time slot before submitting.";
      return;
    }

    const data = new FormData(form);
    const firstName = data.get("firstName");
    const lastName = data.get("lastName");
    const email = data.get("workEmail");
    const companySize = data.get("companySize");
    const hq = data.get("hq");
    const date = data.get("demoDate");
    const time = data.get("demoTime");
    const tz = data.get("timezone");

    // Placeholder confirmation (later you can connect this to backend / Calendly)
    msg.style.display = "block";
    msg.textContent =
      `Thanks ${firstName} ${lastName}! Your demo request is saved: ${date} at ${time} (${tz}). ` +
      `We will email you at ${email}. Company size: ${companySize}. HQ: ${hq}.`;
  });
})();
