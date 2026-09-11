/* ================================================================
   dashboard.js — Main Dashboard Orchestrator
   ================================================================ */

import { initAuth, showToast, getCurrentUser }          from './auth.js';
import { MedManager, renderMedsModal, renderMedForm }   from './medications.js';
import { BedTelemetry }                                 from './telemetry.js';
import { initSleepChart, initHeartRateChart,
         initRestlessnessChart, initSpO2Chart,
         initCardioChart }                              from './charts.js';
import { WidgetDrawer }                                 from './widgets.js';
import { renderVideoLibrary, initVideoSearch, closeVideoModal } from './fitness.js';
import { initHistory }                                  from './history.js';
import { onUserReady }                                  from './auth.js';

let hydrationMl    = parseInt(localStorage.getItem('bp_hydration') || '1100', 10);
const HYDRATION_GOAL = 2000;
let stepsVal       = 0;
let currentTab     = 'home';
let heartRateVal   = 72;
let hrInterval     = null;
let energyScore    = 0;
let medManager     = null;
let bedTelemetry   = null;
let widgetDrawer   = null;

document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initAuth();

  window.markTaken        = (btn) => markTakenLegacy(btn);
  window.addWaterFromModal= () => { addWater(); addHydrationLogEntry(); };
  window.startScan        = () => startScan();
  window.measureNow       = () => { closeAllModals(); setTimeout(() => openModal('modal-scan'), 200); };
  window.switchTab        = (t) => switchTab(t);
  window.closeAllModals   = () => closeAllModals();
  window.medMarkTaken     = (id) => { medManager?.markTaken(id); refreshMedsUI(); };
  window.medRemove        = (id) => { medManager?.removeMed(id); refreshMedsUI(); };
  window.widgetToggle     = (id) => widgetDrawer?.toggle(id);
  window.widgetShowAll    = () => widgetDrawer?.showAll();

  onUserReady(user => initDashboard(user));
});

function initDashboard(user) {
  initModals();
  initNav();
  initCatBar();
  initSyncAlert();
  renderVideoLibrary();
  initVideoSearch();
  initWaterBtn();
  initMedications();
  initTelemetry();
  initWidgetDrawer();
  initHistory();
  animateSteps(7340);
  drawSparkline();
  startLiveHR();
  computeEnergyScore();
}

function initDate() {
  const d = new Date();
  const opts = { weekday:'short', month:'short', day:'numeric' };
  const dateStr = d.toLocaleDateString('en-US', opts);
  const el = document.getElementById('current-date');
  if (el) el.textContent = dateStr;
  const sdEl = document.getElementById('steps-date');
  if (sdEl) sdEl.textContent = dateStr.split(',')[1]?.trim() || dateStr;

  const hour = d.getHours();
  const gSub = document.querySelector('.greeting-sub');
  if (gSub) gSub.textContent =
    hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,';
}

function initMedications() {
  medManager = new MedManager();
  if (medManager.getAll().length === 0) {
    medManager.addMed({ name:'Vitamin D3',   dose:'1000 IU', category:'other',             scheduledTime:'08:00' });
    medManager.addMed({ name:'Omega-3',      dose:'1000mg',  category:'other',             scheduledTime:'21:00' });
    medManager.addMed({ name:'Metoprolol',   dose:'25mg',    category:'antihypertensive',  scheduledTime:'09:00' });
    medManager.getAll()[0].takenToday = true;
    medManager['_save']();
  }
  medManager.scheduleAllReminders();
  refreshMedsUI();

  document.getElementById('med-add-open-btn')?.addEventListener('click', () => {
    renderMedForm(medManager, refreshMedsUI);
  });
}

function refreshMedsUI() {
  renderMedsModal(medManager);
  computeEnergyScore();
}

function initTelemetry() {
  bedTelemetry = new BedTelemetry();
  bedTelemetry.start();
}

function initWidgetDrawer() {
  widgetDrawer = new WidgetDrawer();
}

function computeEnergyScore() {
  const sleepHrs    = 7.7;
  const sleepScore  = Math.min(100, (sleepHrs / 9) * 100);
  const medAdh      = medManager ? medManager.adherence() : 86;
  const activityPct = Math.min(100, (stepsVal / 10000) * 100);

  energyScore = Math.round(sleepScore * 0.40 + medAdh * 0.35 + activityPct * 0.25);

  const scoreEl = document.getElementById('energy-score');
  if (scoreEl) scoreEl.textContent = energyScore;

  const barFill = document.querySelector('.energy-bar-fill');
  if (barFill) barFill.style.width = energyScore + '%';

  const subEl = document.querySelector('.energy-sub');
  if (subEl) {
    subEl.textContent = energyScore >= 80 ? 'High · Keep it up!'
      : energyScore >= 60 ? 'Moderate · You can do better!'
      : 'Low · Rest and hydrate';
  }

  const hpEl = document.getElementById('health-score-val');
  if (hpEl) hpEl.textContent = energyScore;
}

function startLiveHR() {
  if (hrInterval) clearInterval(hrInterval);
  hrInterval = setInterval(() => {
    const delta = Math.round((Math.random() - 0.5) * 4);
    heartRateVal = Math.max(55, Math.min(95, heartRateVal + delta));
    updateHRDisplays(heartRateVal);
  }, 4000);
  updateHRDisplays(heartRateVal);
}

function updateHRDisplays(val) {
  const ids = ['heart-rate', 'qs-heart', 'm-heart'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = val; el.classList.add('blink'); setTimeout(() => el.classList.remove('blink'), 400); }
  });
}

function animateSteps(target) {
  stepsVal = target;
  const goal = 10000;
  const pct  = Math.min(100, Math.round((target / goal) * 100));
  let current = 0;
  const step  = Math.ceil(target / 60);

  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    const fmt = current.toLocaleString();
    const els = ['steps-count','modal-steps-count'];
    els.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = fmt; });
    const qs = document.getElementById('qs-steps');
    if (qs) qs.textContent = current >= 1000 ? (current/1000).toFixed(1)+'k' : current;
    if (current >= target) { clearInterval(timer); computeEnergyScore(); }
  }, 20);

  setTimeout(() => {
    const barFill = document.getElementById('steps-bar-fill');
    if (barFill) barFill.style.width = pct + '%';
    const pctEl = document.getElementById('steps-pct');
    if (pctEl) pctEl.textContent = pct + '%';
    const km  = document.getElementById('chip-km');   if (km)  km.textContent  = (target*0.00078).toFixed(1);
    const kcal= document.getElementById('chip-kcal'); if (kcal) kcal.textContent = Math.round(target*0.04);
    const min = document.getElementById('chip-min');  if (min)  min.textContent = Math.round(target/100)+' min';
  }, 100);
  buildStepsChart();
}

function buildStepsChart() {
  const data = [6200,8100,4300,9500,7200,7340,0];
  const max  = Math.max(...data, 1);
  const container = document.getElementById('steps-chart');
  if (!container) return;
  container.innerHTML = data.map((v,i) => {
    const h = Math.max(8, Math.round((v/max)*100));
    return \`<div class="step-bar-item\${i===5?' today':''}" style="height:\${h}%" title="\${v.toLocaleString()} steps"></div>\`;
  }).join('');
}

function drawSparkline() {
  const pts = [68,72,70,75,71,73,72,74,70,72,75,72,71,73,72];
  const W=220, H=50, pad=4;
  const min=Math.min(...pts), max=Math.max(...pts), range=max-min||1;
  const xs = pts.map((_,i) => pad + (i/(pts.length-1))*(W-pad*2));
  const ys = pts.map(v => H-pad-((v-min)/range)*(H-pad*2));
  const lineD = xs.map((x,i)=>\`\${i===0?'M':'L'}\${x},\${ys[i]}\`).join(' ');
  const areaD = lineD + \` L\${xs[xs.length-1]},\${H} L\${xs[0]},\${H} Z\`;
  const lel = document.getElementById('spark-line');
  const ael = document.getElementById('spark-area');
  if (lel) lel.setAttribute('d', lineD);
  if (ael) ael.setAttribute('d', areaD);
}

function initModals() {
  const overlay = document.getElementById('modal-overlay');
  document.querySelectorAll('[data-modal]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.add-water-btn,.mark-taken-btn,.sync-btn,.wd-toggle,.med-remove-btn,.med-check-btn')) return;
      const id = el.dataset.modal;
      if (id) openModal(id);
    });
    el.addEventListener('keydown', e => {
      if (e.key==='Enter'||e.key===' ') { e.preventDefault(); openModal(el.dataset.modal); }
    });
  });

  document.getElementById('nav-scan')?.addEventListener('click', () => openModal('modal-scan'));
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  overlay?.addEventListener('click', closeAllModals);
  document.addEventListener('keydown', e => {
    if (e.key==='Escape') { closeAllModals(); closeVideoModal(); }
  });

  const sleepModal   = document.getElementById('modal-sleep');
  const vitalsModal  = document.getElementById('modal-vitals');
  const cardioModal  = document.getElementById('modal-cardio');
  const obs = new MutationObserver(mutations => {
    mutations.forEach(m => {
      if (m.type==='attributes' && m.attributeName==='class') {
        const el = m.target;
        if (el.classList.contains('open')) {
          if (el.id==='modal-sleep')   { initSleepChart(); initRestlessnessChart(); }
          if (el.id==='modal-vitals')  { initHeartRateChart(); initSpO2Chart(); }
          if (el.id==='modal-cardio')  { initCardioChart(); }
          if (el.id==='modal-medications') { renderMedsModal(medManager); }
          if (el.id==='modal-telemetry')   { setTimeout(()=>bedTelemetry?._updateModalGrid(), 200); }
        }
      }
    });
  });
  [sleepModal, vitalsModal, cardioModal,
   document.getElementById('modal-medications'),
   document.getElementById('modal-telemetry')
  ].forEach(el => { if (el) obs.observe(el, { attributes: true }); });
}

function openModal(id) {
  closeAllModals();
  document.getElementById(id)?.classList.add('open');
  document.getElementById('modal-overlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.getElementById('modal-overlay')?.classList.remove('active');
  document.body.style.overflow = '';
}
function closeAllModals() {
  document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
  document.getElementById('modal-overlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

function initNav() {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-btn[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.tab-view').forEach(v => v.classList.toggle('active', v.id===\`tab-\${tab}\`));
  document.getElementById('main-scroll')?.scrollTo(0,0);
}

function initCatBar() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function initSyncAlert() {
  document.getElementById('sync-dismiss')?.addEventListener('click', () => {
    const card = document.getElementById('sync-alert');
    if (card) { card.style.transform='translateX(110%)'; card.style.opacity='0'; setTimeout(()=>card.style.display='none',400); }
  });
  document.getElementById('sync-settings')?.addEventListener('click', () => openModal('modal-scan'));
}

function initWaterBtn() {
  document.getElementById('add-water-btn')?.addEventListener('click', e=>{
    e.stopPropagation(); addWater();
  });
}
function addWater() {
  hydrationMl = Math.min(hydrationMl+250, HYDRATION_GOAL);
  localStorage.setItem('bp_hydration', hydrationMl);
  updateHydrationUI();
  showToast('💧 250ml added!', 'success');
}
function addHydrationLogEntry() {
  const log = document.getElementById('hydration-log');
  if (!log) return;
  const t = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  const item = document.createElement('div');
  item.className='hl-item';
  item.innerHTML=\`<span>💧 \${t}</span><span>250 ml</span>\`;
  log.prepend(item);
}
function updateHydrationUI() {
  const pct  = Math.round((hydrationMl/HYDRATION_GOAL)*100);
  const lStr = (hydrationMl/1000).toFixed(1)+'L';
  const hf   = document.getElementById('hydration-fill');
  if (hf) hf.style.height=pct+'%';
  const hiEl = document.querySelector('.hydration-info');
  if (hiEl) hiEl.innerHTML=\`\${lStr} / 2.0L <span style="opacity:.6">today</span>\`;
  const cur = document.getElementById('hmi-current');    if (cur) cur.textContent=lStr;
  const mf  = document.getElementById('hydration-modal-fill'); if (mf) mf.style.width=pct+'%';
  const hp  = document.getElementById('hydration-pct');  if (hp) hp.textContent=pct+'%';
}

function startScan() {
  const btn    = document.getElementById('scan-start-btn');
  const result = document.getElementById('scan-result');
  if (!btn) return;
  btn.disabled=true; btn.textContent='Scanning…'; btn.style.opacity='0.7';
  let dots=0;
  const ticker = setInterval(()=>{ dots=(dots+1)%4; btn.textContent='Scanning'+'.'.repeat(dots); }, 400);
  setTimeout(()=>{
    clearInterval(ticker);
    const hr  = Math.round(68 + Math.random()*10);
    const spo = Math.round(96 + Math.random()*3);
    const tmp = (36.3 + Math.random()*0.6).toFixed(1);
    btn.textContent='Scan Complete ✓'; btn.style.background='linear-gradient(135deg,#22c76c,#00c98d)'; btn.style.opacity='1';
    if (result) {
      result.style.display='block';
      result.innerHTML=\`
        <p style="color:var(--green);font-weight:700;margin-bottom:10px">Results ready!</p>
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
          <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#f0f4ff">\${hr}</div><div style="font-size:10px;color:rgba(240,244,255,.5)">bpm</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#f0f4ff">\${spo}</div><div style="font-size:10px;color:rgba(240,244,255,.5)">%SpO₂</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#f0f4ff">\${tmp}</div><div style="font-size:10px;color:rgba(240,244,255,.5)">°C</div></div>
        </div>\`;
      heartRateVal = hr;
      updateHRDisplays(hr);
    }
  }, 3200);
}

function markTakenLegacy(btn) {
  const row   = btn.closest('.med-row');
  if (!row) return;
  row.classList.replace('pending-row','taken-row');
  const check = row.querySelector('.med-check');
  if (check) { check.className='med-check taken-check'; check.textContent='✓'; }
  btn.remove();
}
