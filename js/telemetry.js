/* ================================================================
   js/telemetry.js — ESP32 Bed Telemetry Simulation
   4×4 FSR pressure matrix · TOF sensor · Orthostatic risk alerts
   ================================================================ */

import { showToast } from './auth.js';

/* ── Bed state machine ── */
const BED_STATES = {
  EMPTY:    { label: 'Bed Empty',     tof: 'No Presence',  color: '#4a5568' },
  LYING:    { label: 'Bed Occupied',  tof: 'Lying Down',   color: '#22c76c' },
  ROLLING:  { label: 'Restless',      tof: 'Restless',     color: '#ff8c42' },
  SITTING:  { label: 'Sitting Up',    tof: 'Sitting Up',   color: '#3d82f6' },
  STANDING: { label: 'Standing',      tof: 'Standing',     color: '#ff4757' }
};

/* Pressure distributions per state (16-element arrays, 0-100) */
const PRESSURE_MAPS = {
  EMPTY:    () => Array.from({length:16}, () => Math.random() * 4),
  LYING:    () => {
    const base = [8,15,20,10, 14,60,72,18, 12,55,68,16, 6,18,22,8];
    return base.map(v => v + (Math.random()-0.5)*12);
  },
  ROLLING:  () => {
    const offset = Math.random() > 0.5 ? 1 : -1;
    const base = [10,25,60,20, 18,55,70,22, 10,48,65,18, 5,20,25,8];
    return base.map((v,i) => {
      const col = i % 4;
      return col + offset >= 0 && col + offset < 4
        ? v + (Math.random()-0.5)*20 : v * 0.3;
    });
  },
  SITTING:  () => {
    const base = [5,8,10,5, 18,42,48,16, 6,14,16,6, 2,4,5,2];
    return base.map(v => v + (Math.random()-0.5)*10);
  },
  STANDING: () => Array.from({length:16}, () => Math.random() * 6)
};

export class BedTelemetry {
  constructor() {
    this._state       = 'LYING';
    this._prevState   = 'LYING';
    this._pressure    = PRESSURE_MAPS.LYING();
    this._interval    = null;
    this._cardInterv  = null;
    this._transTimer  = null;
    this._stateSeq    = ['LYING','LYING','LYING','ROLLING','LYING','SITTING','STANDING','EMPTY','LYING'];
    this._seqIdx      = 0;
    this._listeners   = [];
  }

  start() {
    /* Full telemetry update every 1500ms */
    this._interval = setInterval(() => this._tick(), 1500);
    /* Card mini-grid update every 2000ms */
    this._cardInterv = setInterval(() => this._updateCardGrid(), 2000);
    /* State transitions every 8–14 seconds */
    this._scheduleTransition();
    this._updateCardGrid();
    this._updateModalGrid();
  }

  stop() {
    clearInterval(this._interval);
    clearInterval(this._cardInterv);
    clearTimeout(this._transTimer);
  }

  _tick() {
    /* Add noise to current pressure map */
    this._pressure = this._pressure.map(v => Math.max(0, Math.min(100, v + (Math.random()-0.5)*8)));
    this._updateModalGrid();
    this._updateTofStatus();
    this._listeners.forEach(cb => cb(this._state, this._pressure));
  }

  _scheduleTransition() {
    const delay = 8000 + Math.random() * 6000;
    this._transTimer = setTimeout(() => {
      this._prevState = this._state;
      this._seqIdx = (this._seqIdx + 1) % this._stateSeq.length;
      this._state = this._stateSeq[this._seqIdx];
      this._pressure = PRESSURE_MAPS[this._state]();
      this._checkOrthostaticRisk();
      this._scheduleTransition();
    }, delay);
  }

  _checkOrthostaticRisk() {
    const risk = this._prevState === 'LYING' && this._state === 'STANDING';
    if (risk) {
      showToast('⚠️ Orthostatic risk: rising quickly from bed. Hold bedside rail.', 'warning');
      const alertEl = document.getElementById('tof-ortho-alert');
      if (alertEl) {
        alertEl.style.display = 'flex';
        setTimeout(() => { if (alertEl) alertEl.style.display = 'none'; }, 8000);
      }
    }
  }

  _updateCardGrid() {
    const grid = document.getElementById('fsr-card-grid');
    if (!grid) return;
    const state = BED_STATES[this._state];
    grid.innerHTML = this._buildMiniGrid();
    const statusEl = document.getElementById('tof-card-status');
    if (statusEl) {
      statusEl.textContent = state.tof;
      statusEl.style.color = state.color;
    }
  }

  _updateModalGrid() {
    const grid = document.getElementById('fsr-modal-grid');
    if (!grid) return;
    grid.innerHTML = this._buildFullGrid();
    this._updateTofStatus();
  }

  _buildMiniGrid() {
    /* 4×4 mini version for card */
    return this._pressure.map(v => {
      const pct = Math.min(100, Math.max(0, v));
      const clr = this._pressureColor(pct, 0.85);
      return `<div class="fsr-node-mini" style="background:${clr};box-shadow:0 0 ${Math.round(pct/12)}px ${clr}" title="${Math.round(pct)}%"></div>`;
    }).join('');
  }

  _buildFullGrid() {
    return this._pressure.map((v, i) => {
      const pct = Math.min(100, Math.max(0, v));
      const clr = this._pressureColor(pct, 1);
      return `
        <div class="fsr-node" style="background:${clr};box-shadow:0 0 ${Math.round(pct/8)}px ${clr}">
          <span class="fsr-node-val">${Math.round(pct)}</span>
        </div>`;
    }).join('');
  }

  _pressureColor(pct, alpha) {
    if (pct < 10)  return `rgba(74,85,104,${alpha})`;
    if (pct < 30)  return `rgba(34,199,108,${alpha})`;
    if (pct < 55)  return `rgba(255,193,7,${alpha})`;
    if (pct < 75)  return `rgba(255,140,66,${alpha})`;
    return `rgba(255,71,87,${alpha})`;
  }

  _updateTofStatus() {
    const state = BED_STATES[this._state];
    const el    = document.getElementById('tof-modal-status');
    if (!el) return;
    el.innerHTML = `
      <span class="tof-dot" style="background:${state.color};box-shadow:0 0 8px ${state.color}"></span>
      <span>${state.tof}</span>`;
  }

  onUpdate(cb) { this._listeners.push(cb); }

  getState()    { return this._state; }
  getPressure() { return this._pressure; }
}
