/* ================================================================
   js/medications.js — Medications Manager
   Add/remove/track meds · Adherence · Fall-risk multiplier · Reminders
   ================================================================ */

import { showToast } from './auth.js';

const STORAGE_KEY = 'bp_medications';
const RISK_SCORES = {
  diuretic:     0.20, antihypertensive: 0.18, sedative: 0.25,
  antidepressant: 0.15, anticoagulant: 0.10, painkiller: 0.12,
  other: 0.05
};

export class MedManager {
  constructor() {
    this._meds = this._load();
    this._reminders = new Map();
  }

  /* ── Load / Save ── */
  _load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  _save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this._meds)); }

  /* ── CRUD ── */
  addMed({ name, dose, category = 'other', scheduledTime = '08:00', notes = '' }) {
    const med = {
      id: Date.now().toString(),
      name: name.trim(),
      dose: dose.trim(),
      category,
      scheduledTime,
      notes,
      takenToday: false,
      addedAt: new Date().toISOString()
    };
    this._meds.push(med);
    this._save();
    this._scheduleReminder(med);
    return med;
  }

  removeMed(id) {
    this._meds = this._meds.filter(m => m.id !== id);
    this._clearReminder(id);
    this._save();
  }

  markTaken(id) {
    const med = this._meds.find(m => m.id === id);
    if (med) { med.takenToday = true; this._save(); }
  }

  resetDaily() {
    this._meds.forEach(m => { m.takenToday = false; });
    this._save();
  }

  getAll() { return [...this._meds]; }

  /* ── Adherence ── */
  adherence() {
    if (!this._meds.length) return 100;
    const taken = this._meds.filter(m => m.takenToday).length;
    return Math.round((taken / this._meds.length) * 100);
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
    const [hh, mm] = med.scheduledTime.split(':').map(Number);
    const now = new Date();
    const due = new Date();
    due.setHours(hh, mm, 0, 0);
    let delay = due - now;
    if (delay < 0) delay += 86400000; /* tomorrow if already past */

    const timer = setTimeout(() => {
      if (!med.takenToday) {
        showToast(`⏰ Time to take ${med.name} (${med.dose})`, 'warning');
        /* Fire again tomorrow */
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
    this._meds.filter(m => !m.takenToday).forEach(m => this._scheduleReminder(m));
  }
}

/* ── DOM helpers ── */
export function renderMedsModal(manager) {
  const list    = document.getElementById('med-list');
  const addForm = document.getElementById('med-add-form');
  const badge   = document.getElementById('med-count-badge');
  const adherEl = document.getElementById('adherence-fill');
  const adherPct= document.getElementById('adherence-pct');
  const cardSub = document.getElementById('med-card-sub');
  const riskEl  = document.getElementById('med-risk-level');

  const meds = manager.getAll();
  const adh  = manager.adherence();
  const risk = manager.fallRiskMultiplier();

  /* Update card sub-text */
  const due = meds.filter(m => !m.takenToday).length;
  if (cardSub) cardSub.textContent = due > 0 ? `${due} due today` : 'All taken ✓';
  if (badge) badge.textContent = meds.length;

  /* Adherence bar */
  if (adherEl) adherEl.style.width = adh + '%';
  if (adherPct) adherPct.textContent = adh + '%';

  /* Risk level */
  if (riskEl) {
    const lvl = risk < 0.15 ? { txt: 'Low', cls: 'risk-low' }
              : risk < 0.35 ? { txt: 'Moderate', cls: 'risk-moderate' }
              : { txt: 'High', cls: 'risk-high' };
    riskEl.textContent = lvl.txt;
    riskEl.className   = 'risk-pill ' + lvl.cls;
  }

  /* Medication list */
  if (!list) return;
  list.innerHTML = meds.length
    ? meds.map(m => `
        <div class="med-item ${m.takenToday ? 'taken' : 'pending'}" data-med-id="${m.id}">
          <div class="med-check-btn ${m.takenToday ? 'taken-check' : 'pending-check'}"
               onclick="window.medMarkTaken('${m.id}')">
            ${m.takenToday ? '✓' : '○'}
          </div>
          <div class="med-item-info">
            <strong>${m.name}</strong> &mdash; ${m.dose}
            <div class="med-item-meta">
              <span class="med-cat-badge">${m.category}</span>
              <span class="med-time-badge">⏰ ${m.scheduledTime}</span>
              ${m.notes ? `<span class="med-notes">${m.notes}</span>` : ''}
            </div>
          </div>
          <button class="med-remove-btn" onclick="window.medRemove('${m.id}')" aria-label="Remove ${m.name}">✕</button>
        </div>`)
      .join('')
    : '<div class="med-empty">No medications added yet. Click + Add below.</div>';
}

/* ── Render the Add-Medication form ── */
export function renderMedForm(manager, onSave) {
  const form = document.getElementById('med-add-form');
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

  document.getElementById('med-save-btn')?.addEventListener('click', () => {
    const name = document.getElementById('mf-name')?.value.trim();
    const dose = document.getElementById('mf-dose')?.value.trim();
    if (!name || !dose) { showToast('Name and dose are required', 'error'); return; }
    manager.addMed({
      name,
      dose,
      scheduledTime: document.getElementById('mf-time')?.value || '08:00',
      category:      document.getElementById('mf-cat')?.value  || 'other',
      notes:         document.getElementById('mf-notes')?.value || ''
    });
    form.innerHTML = '';
    onSave();
    showToast(`${name} added!`, 'success');
  });

  document.getElementById('med-cancel-btn')?.addEventListener('click', () => {
    form.innerHTML = '';
  });
}
