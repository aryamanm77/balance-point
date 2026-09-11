import { showToast } from "./auth.js";
const STORAGE_KEY = "bp_medications";
const RISK_SCORES = {
  diuretic: 0.2,
  antihypertensive: 0.18,
  sedative: 0.25,
  antidepressant: 0.15,
  anticoagulant: 0.1,
  painkiller: 0.12,
  other: 0.05
};
class MedManager {
  constructor() {
    this._meds = this._load();
    this._reminders = /* @__PURE__ */ new Map();
  }
  /* ── Load / Save ── */
  _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._meds));
  }
  /* ── CRUD ── */
  addMed({ name, dose, category = "other", scheduledTime = "08:00", notes = "" }) {
    const med = {
      id: Date.now().toString(),
      name: name.trim(),
      dose: dose.trim(),
      category,
      scheduledTime,
      notes,
      takenToday: false,
      addedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this._meds.push(med);
    this._save();
    this._scheduleReminder(med);
    return med;
  }
  removeMed(id) {
    this._meds = this._meds.filter((m) => m.id !== id);
    this._clearReminder(id);
    this._save();
  }
  markTaken(id) {
    const med = this._meds.find((m) => m.id === id);
    if (med) {
      med.takenToday = true;
      this._save();
    }
  }
  resetDaily() {
    this._meds.forEach((m) => {
      m.takenToday = false;
    });
    this._save();
  }
  getAll() {
    return [...this._meds];
  }
  /* ── Adherence ── */
  adherence() {
    if (!this._meds.length) return 100;
    const taken = this._meds.filter((m) => m.takenToday).length;
    return Math.round(taken / this._meds.length * 100);
  }
  /* ── Fall-risk multiplier (0-1, higher = riskier) ── */
  fallRiskMultiplier() {
    const base = this._meds.reduce((sum, m) => {
      return sum + (RISK_SCORES[m.category] || RISK_SCORES.other);
    }, 0);
    return Math.min(1, base);
  }
  /* ── Reminders ── */
  _scheduleReminder(med) {
    const [hh, mm] = med.scheduledTime.split(":").map(Number);
    const now = /* @__PURE__ */ new Date();
    const due = /* @__PURE__ */ new Date();
    due.setHours(hh, mm, 0, 0);
    let delay = due - now;
    if (delay < 0) delay += 864e5;
    const timer = setTimeout(() => {
      if (!med.takenToday) {
        showToast(`\u23F0 Time to take ${med.name} (${med.dose})`, "warning");
        this._scheduleReminder(med);
      }
    }, delay);
    this._reminders.set(med.id, timer);
  }
  _clearReminder(id) {
    if (this._reminders.has(id)) {
      clearTimeout(this._reminders.get(id));
      this._reminders.delete(id);
    }
  }
  scheduleAllReminders() {
    this._meds.filter((m) => !m.takenToday).forEach((m) => this._scheduleReminder(m));
  }
}
function renderMedsModal(manager) {
  const list = document.getElementById("med-list");
  const addForm = document.getElementById("med-add-form");
  const badge = document.getElementById("med-count-badge");
  const adherEl = document.getElementById("adherence-fill");
  const adherPct = document.getElementById("adherence-pct");
  const cardSub = document.getElementById("med-card-sub");
  const riskEl = document.getElementById("med-risk-level");
  const meds = manager.getAll();
  const adh = manager.adherence();
  const risk = manager.fallRiskMultiplier();
  const due = meds.filter((m) => !m.takenToday).length;
  if (cardSub) cardSub.textContent = due > 0 ? `${due} due today` : "All taken \u2713";
  if (badge) badge.textContent = meds.length;
  if (adherEl) adherEl.style.width = adh + "%";
  if (adherPct) adherPct.textContent = adh + "%";
  if (riskEl) {
    const lvl = risk < 0.15 ? { txt: "Low", cls: "risk-low" } : risk < 0.35 ? { txt: "Moderate", cls: "risk-moderate" } : { txt: "High", cls: "risk-high" };
    riskEl.textContent = lvl.txt;
    riskEl.className = "risk-pill " + lvl.cls;
  }
  if (!list) return;
  list.innerHTML = meds.length ? meds.map((m) => `
        <div class="med-item ${m.takenToday ? "taken" : "pending"}" data-med-id="${m.id}">
          <div class="med-check-btn ${m.takenToday ? "taken-check" : "pending-check"}"
               onclick="window.medMarkTaken('${m.id}')">
            ${m.takenToday ? "\u2713" : "\u25CB"}
          </div>
          <div class="med-item-info">
            <strong>${m.name}</strong> &mdash; ${m.dose}
            <div class="med-item-meta">
              <span class="med-cat-badge">${m.category}</span>
              <span class="med-time-badge">\u23F0 ${m.scheduledTime}</span>
              ${m.notes ? `<span class="med-notes">${m.notes}</span>` : ""}
            </div>
          </div>
          <button class="med-remove-btn" onclick="window.medRemove('${m.id}')" aria-label="Remove ${m.name}">\u2715</button>
        </div>`).join("") : '<div class="med-empty">No medications added yet. Click + Add below.</div>';
}
function renderMedForm(manager, onSave) {
  var _a, _b;
  const form = document.getElementById("med-add-form");
  if (!form) return;
  form.innerHTML = `
    <div class="med-form">
      <h4 class="med-form-title">Add Medication</h4>
      <div class="med-form-grid">
        <input id="mf-name"  class="med-input" type="text"   placeholder="Medication name *" required/>
        <input id="mf-dose"  class="med-input" type="text"   placeholder="Dose (e.g. 10mg)" required/>
        <input id="mf-time"  class="med-input" type="time"   value="08:00"/>
        <select id="mf-cat"  class="med-input med-select">
          <option value="other">Other</option>
          <option value="antihypertensive">Antihypertensive</option>
          <option value="diuretic">Diuretic</option>
          <option value="sedative">Sedative / Sleep Aid</option>
          <option value="antidepressant">Antidepressant</option>
          <option value="anticoagulant">Anticoagulant</option>
          <option value="painkiller">Painkiller</option>
        </select>
        <input id="mf-notes" class="med-input med-notes-input" type="text" placeholder="Notes (optional)" style="grid-column:1/-1"/>
      </div>
      <div class="med-form-actions">
        <button class="med-cancel-btn" id="med-cancel-btn" type="button">Cancel</button>
        <button class="med-save-btn"   id="med-save-btn"  type="button">+ Save Medication</button>
      </div>
    </div>`;
  (_a = document.getElementById("med-save-btn")) == null ? void 0 : _a.addEventListener("click", () => {
    var _a2, _b2, _c, _d, _e;
    const name = (_a2 = document.getElementById("mf-name")) == null ? void 0 : _a2.value.trim();
    const dose = (_b2 = document.getElementById("mf-dose")) == null ? void 0 : _b2.value.trim();
    if (!name || !dose) {
      showToast("Name and dose are required", "error");
      return;
    }
    manager.addMed({
      name,
      dose,
      scheduledTime: ((_c = document.getElementById("mf-time")) == null ? void 0 : _c.value) || "08:00",
      category: ((_d = document.getElementById("mf-cat")) == null ? void 0 : _d.value) || "other",
      notes: ((_e = document.getElementById("mf-notes")) == null ? void 0 : _e.value) || ""
    });
    form.innerHTML = "";
    onSave();
    showToast(`${name} added!`, "success");
  });
  (_b = document.getElementById("med-cancel-btn")) == null ? void 0 : _b.addEventListener("click", () => {
    form.innerHTML = "";
  });
}
export {
  MedManager,
  renderMedForm,
  renderMedsModal
};
