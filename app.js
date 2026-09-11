/* ================================================================
   app.js — BalancePoint Main Orchestrator (ES Module)
   Imports all sub-modules · Wires everything together
   ================================================================ */

import { initAuth, showToast, getCurrentUser }          from './js/auth.js';
import { MedManager, renderMedsModal, renderMedForm }   from './js/medications.js';
import { BedTelemetry }                                 from './js/telemetry.js';
import { initSleepChart, initHeartRateChart,
         initRestlessnessChart, initSpO2Chart,
         initCardioChart }                              from './js/charts.js';
import { WidgetDrawer }                                 from './js/widgets.js';

/* ═══════════════════════════════════════════════════════════
   YOUTUBE VIDEO DATA  (30 curated senior fitness videos)
   ═══════════════════════════════════════════════════════════ */
const VIDEO_DATA = [
  { id:'v1',  youtubeId:'1AaAWRvKj1k', title:'10-Min Senior Balance & Fall Prevention',        category:'Balance & Mobility',       duration:'10:15', level:'Beginner'     },
  { id:'v2',  youtubeId:'BKW7EkPJzMc', title:'Standing Balance Exercises for Seniors',          category:'Balance & Mobility',       duration:'8:42',  level:'Beginner'     },
  { id:'v3',  youtubeId:'c5N0J3_BCXI', title:'Senior Stability & Proprioception Training',      category:'Balance & Mobility',       duration:'15:30', level:'Intermediate' },
  { id:'v4',  youtubeId:'VpHJSHKnrUE', title:'Gentle Tai Chi for Balance & Coordination',       category:'Balance & Mobility',       duration:'20:00', level:'Beginner'     },
  { id:'v5',  youtubeId:'9ZA2nRTR6ws', title:'Fall Prevention Home Safety Routine',             category:'Balance & Mobility',       duration:'12:18', level:'Beginner'     },
  { id:'v6',  youtubeId:'Yd7Hd-1DYjM', title:'20-Min Seated Chair Workout for Seniors',        category:'Chair Exercises',          duration:'20:05', level:'Beginner'     },
  { id:'v7',  youtubeId:'4BOTvaRaDjI', title:'Chair Cardio Workout – No Equipment',             category:'Chair Exercises',          duration:'16:44', level:'Beginner'     },
  { id:'v8',  youtubeId:'wjsLkCRqOwg', title:'Chair Strength Training for Older Adults',        category:'Chair Exercises',          duration:'18:22', level:'Intermediate' },
  { id:'v9',  youtubeId:'UItWltVZglo', title:'Senior Seated Mobility & Flexibility',            category:'Chair Exercises',          duration:'14:10', level:'Beginner'     },
  { id:'v10', youtubeId:'OoQdLJ4VPC8', title:'Gentle Chair Yoga for Seniors',                  category:'Chair Exercises',          duration:'22:00', level:'Beginner'     },
  { id:'v11', youtubeId:'qN5bMgMGs58', title:'Full-Body Stretching Routine for Seniors',        category:'Stretching & Flexibility', duration:'15:05', level:'Beginner'     },
  { id:'v12', youtubeId:'g_tea8ZNk5A', title:'Morning Flexibility & Joint Mobility',            category:'Stretching & Flexibility', duration:'11:30', level:'Beginner'     },
  { id:'v13', youtubeId:'pqQLMe4LZVY', title:'Hip Flexor & Lower Back Relief Stretches',        category:'Stretching & Flexibility', duration:'13:45', level:'Beginner'     },
  { id:'v14', youtubeId:'4vTJHUDB5ak', title:'Gentle Yoga for Seniors – Beginner Flow',         category:'Stretching & Flexibility', duration:'30:00', level:'Beginner'     },
  { id:'v15', youtubeId:'L_xrDAtykMI', title:'Shoulder & Neck Pain Relief for Seniors',         category:'Stretching & Flexibility', duration:'9:18',  level:'Beginner'     },
  { id:'v16', youtubeId:'cbKkB3POqaY', title:'30-Min Senior Strength Training (No Weights)',    category:'Strength Training',        duration:'30:22', level:'Intermediate' },
  { id:'v17', youtubeId:'Zq_JHd7rGEg', title:'Light Dumbbell Workout for Older Adults',         category:'Strength Training',        duration:'24:15', level:'Intermediate' },
  { id:'v18', youtubeId:'vc1E5CfRfos', title:'Resistance Band Exercises for Seniors',           category:'Strength Training',        duration:'19:40', level:'Intermediate' },
  { id:'v19', youtubeId:'mmq5zGIHqmU', title:'Functional Strength for Daily Activities',        category:'Strength Training',        duration:'17:00', level:'Beginner'     },
  { id:'v20', youtubeId:'f0xc7oGAyBA', title:'Core Strength & Posture for Seniors',             category:'Strength Training',        duration:'20:30', level:'Intermediate' },
  { id:'v21', youtubeId:'DUHMhXkuhQo', title:'Low-Impact Walking Cardio – 20 Min',             category:'Cardio & Walking',         duration:'20:00', level:'Beginner'     },
  { id:'v22', youtubeId:'j7yMNHLpP6Q', title:'Senior Cardio Dance Party Workout',              category:'Cardio & Walking',         duration:'25:10', level:'Beginner'     },
  { id:'v23', youtubeId:'PKIKmGMmMZ4', title:'Indoor Walking Workout for Seniors',             category:'Cardio & Walking',         duration:'22:00', level:'Beginner'     },
  { id:'v24', youtubeId:'6GqMd3QJ-Hg', title:'Low-Impact Aerobics for Older Adults',           category:'Cardio & Walking',         duration:'18:30', level:'Beginner'     },
  { id:'v25', youtubeId:'sDGz3ERMMFA', title:'15-Min Step & Walk Senior Cardio',               category:'Cardio & Walking',         duration:'15:00', level:'Beginner'     },
  { id:'v26', youtubeId:'inpok4MKVLM', title:'10-Min Guided Mindfulness Meditation',           category:'Mind & Breathwork',        duration:'10:02', level:'All levels'   },
  { id:'v27', youtubeId:'O-6f5wQXSu8', title:'Breathing Exercises to Reduce Anxiety',          category:'Mind & Breathwork',        duration:'8:14',  level:'All levels'   },
  { id:'v28', youtubeId:'aXItOY0sLRY', title:'Body Scan Relaxation for Seniors',               category:'Mind & Breathwork',        duration:'20:00', level:'All levels'   },
  { id:'v29', youtubeId:'86m4RC_ADEY', title:'Qigong for Seniors – Calm & Focus',              category:'Mind & Breathwork',        duration:'25:30', level:'Beginner'     },
  { id:'v30', youtubeId:'ZToicYcHIOU', title:'Sleep Meditation & Relaxation for Seniors',       category:'Mind & Breathwork',        duration:'30:00', level:'All levels'   }
];

const CATEGORIES = [
  { name:'Balance & Mobility',       color:'#3d82f6', bg:'rgba(61,130,246,0.12)',  icon:'⚖️'  },
  { name:'Chair Exercises',          color:'#22c76c', bg:'rgba(34,199,108,0.12)',  icon:'🪑'  },
  { name:'Stretching & Flexibility', color:'#ff8c42', bg:'rgba(255,140,66,0.12)',  icon:'🧘'  },
  { name:'Strength Training',        color:'#6c63ff', bg:'rgba(108,99,255,0.12)',  icon:'💪'  },
  { name:'Cardio & Walking',         color:'#ff4757', bg:'rgba(255,71,87,0.12)',   icon:'🏃'  },
  { name:'Mind & Breathwork',        color:'#00e5ff', bg:'rgba(0,229,255,0.12)',   icon:'🧠'  }
];

/* ═══════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════ */
let hydrationMl    = parseInt(localStorage.getItem('bp_hydration') || '1100', 10);
const HYDRATION_GOAL = 2000;
let stepsVal       = 0;
let currentTab     = 'home';
let videoSearchQuery = '';
let heartRateVal   = 72;
let hrInterval     = null;
let energyScore    = 0;
let medManager     = null;
let bedTelemetry   = null;
let widgetDrawer   = null;

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  initDate();
  initAuth();             /* Firebase auth — triggers dashboard init when authed */

  /* Global onclick bridges (called from HTML onclick="" attributes) */
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
});

/* Called by auth.js after successful sign-in */
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
  animateSteps(7340);
  drawSparkline();
  startLiveHR();
  computeEnergyScore();
}

/* ── Service Worker ── */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration failed:', err));
  }
}

/* ── Wire auth ready callback ── */
import { onUserReady } from './js/auth.js';
document.addEventListener('DOMContentLoaded', () => {
  onUserReady(user => initDashboard(user));
});

/* ═══════════════════════════════════════════════════════════
   DATE & GREETING
   ═══════════════════════════════════════════════════════════ */
function initDate() {
  const d = new Date();
  const opts = { weekday:'short', month:'short', day:'numeric' };
  const dateStr = d.toLocaleDateString('en-US', opts);
  const el = document.getElementById('current-date');
  if (el) el.textContent = dateStr;
  const sdEl = document.getElementById('steps-date');
  if (sdEl) sdEl.textContent = dateStr.split(',')[1]?.trim() || dateStr;

  /* Greeting time-of-day */
  const hour = d.getHours();
  const gSub = document.querySelector('.greeting-sub');
  if (gSub) gSub.textContent =
    hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,';
}

/* ═══════════════════════════════════════════════════════════
   MEDICATIONS
   ═══════════════════════════════════════════════════════════ */
function initMedications() {
  medManager = new MedManager();
  /* Seed with defaults if empty */
  if (medManager.getAll().length === 0) {
    medManager.addMed({ name:'Vitamin D3',   dose:'1000 IU', category:'other',             scheduledTime:'08:00' });
    medManager.addMed({ name:'Omega-3',      dose:'1000mg',  category:'other',             scheduledTime:'21:00' });
    medManager.addMed({ name:'Metoprolol',   dose:'25mg',    category:'antihypertensive',  scheduledTime:'09:00' });
    medManager.getAll()[0].takenToday = true; /* Vitamin D3 already taken */
    medManager['_save']();
  }
  medManager.scheduleAllReminders();
  refreshMedsUI();

  /* "+ Add Medication" button in modal */
  document.getElementById('med-add-open-btn')?.addEventListener('click', () => {
    renderMedForm(medManager, refreshMedsUI);
  });
}

function refreshMedsUI() {
  renderMedsModal(medManager);
  /* Recompute energy since adherence changed */
  computeEnergyScore();
}

/* ═══════════════════════════════════════════════════════════
   BED TELEMETRY
   ═══════════════════════════════════════════════════════════ */
function initTelemetry() {
  bedTelemetry = new BedTelemetry();
  bedTelemetry.start();
}

/* ═══════════════════════════════════════════════════════════
   WIDGET DRAWER
   ═══════════════════════════════════════════════════════════ */
function initWidgetDrawer() {
  widgetDrawer = new WidgetDrawer();
}

/* ═══════════════════════════════════════════════════════════
   ENERGY SCORE — dynamic formula
   sleep×0.40 + med_adherence×0.35 + activity×0.25
   ═══════════════════════════════════════════════════════════ */
function computeEnergyScore() {
  const sleepHrs    = 7.7; /* last night */
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

/* ═══════════════════════════════════════════════════════════
   LIVE HEART RATE SIMULATION  (±2 bpm every 4s)
   ═══════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════
   STEPS COUNTER
   ═══════════════════════════════════════════════════════════ */
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
    return `<div class="step-bar-item${i===5?' today':''}" style="height:${h}%" title="${v.toLocaleString()} steps"></div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════
   SPARKLINE (vitals card)
   ═══════════════════════════════════════════════════════════ */
function drawSparkline() {
  const pts = [68,72,70,75,71,73,72,74,70,72,75,72,71,73,72];
  const W=220, H=50, pad=4;
  const min=Math.min(...pts), max=Math.max(...pts), range=max-min||1;
  const xs = pts.map((_,i) => pad + (i/(pts.length-1))*(W-pad*2));
  const ys = pts.map(v => H-pad-((v-min)/range)*(H-pad*2));
  const lineD = xs.map((x,i)=>`${i===0?'M':'L'}${x},${ys[i]}`).join(' ');
  const areaD = lineD + ` L${xs[xs.length-1]},${H} L${xs[0]},${H} Z`;
  const lel = document.getElementById('spark-line');
  const ael = document.getElementById('spark-area');
  if (lel) lel.setAttribute('d', lineD);
  if (ael) ael.setAttribute('d', areaD);
}

/* ═══════════════════════════════════════════════════════════
   MODAL SYSTEM
   ═══════════════════════════════════════════════════════════ */
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

  /* Chart-on-demand: init charts when modals open */
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

/* ═══════════════════════════════════════════════════════════
   BOTTOM NAV
   ═══════════════════════════════════════════════════════════ */
function initNav() {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-btn[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.tab-view').forEach(v => v.classList.toggle('active', v.id===`tab-${tab}`));
  document.getElementById('main-scroll')?.scrollTo(0,0);
}

/* ═══════════════════════════════════════════════════════════
   CATEGORY BAR
   ═══════════════════════════════════════════════════════════ */
function initCatBar() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   SYNC ALERT
   ═══════════════════════════════════════════════════════════ */
function initSyncAlert() {
  document.getElementById('sync-dismiss')?.addEventListener('click', () => {
    const card = document.getElementById('sync-alert');
    if (card) { card.style.transform='translateX(110%)'; card.style.opacity='0'; setTimeout(()=>card.style.display='none',400); }
  });
  document.getElementById('sync-settings')?.addEventListener('click', () => openModal('modal-scan'));
}

/* ═══════════════════════════════════════════════════════════
   VIDEO LIBRARY
   ═══════════════════════════════════════════════════════════ */
function renderVideoLibrary(filter='') {
  const container = document.getElementById('video-library');
  if (!container) return;
  const q = filter.toLowerCase();
  let html = '';
  CATEGORIES.forEach(cat => {
    const vids = VIDEO_DATA.filter(v =>
      v.category===cat.name && (!q || v.title.toLowerCase().includes(q) || v.category.toLowerCase().includes(q))
    );
    if (!vids.length) return;
    html += `
      <div class="video-section mb-8">
        <div class="video-section-header flex items-center justify-between mb-4 px-4">
          <div class="flex items-center gap-3">
            <span class="video-cat-icon flex items-center justify-center w-10 h-10 rounded-xl shadow-lg" style="background:${cat.bg};color:${cat.color}">${cat.icon}</span>
            <div>
              <h3 class="video-cat-title text-lg font-bold" style="color:${cat.color}">${cat.name}</h3>
              <span class="video-cat-count text-xs text-gray-400 font-medium">${vids.length} video${vids.length>1?'s':''}</span>
            </div>
          </div>
          <span class="video-see-all text-xs font-semibold text-gray-400 hover:text-white cursor-pointer transition-colors">See all ›</span>
        </div>
        <div class="video-carousel flex gap-4 overflow-x-auto pb-6 px-4 snap-x snap-mandatory scrollbar-hide" role="list">
          ${vids.map(v=>buildVideoCard(v,cat)).join('')}
        </div>
      </div>`;
  });
  if (!html) {
    html=`<div class="video-empty"><p>No videos match "<strong>${filter}</strong>"</p><p class="video-empty-sub">Try a different keyword</p></div>`;
  }
  container.innerHTML = html;
  container.querySelectorAll('.video-card').forEach(card => {
    card.addEventListener('click', ()=>openVideoModal(card.dataset.id));
    card.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' ') openVideoModal(card.dataset.id); });
  });
}

function buildVideoCard(video, cat) {
  const thumbUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  const levelClass = video.level==='Beginner'?'bg-green-500/20 text-green-400':video.level==='Intermediate'?'bg-yellow-500/20 text-yellow-400':'bg-red-500/20 text-red-400';
  return `
    <div class="video-card min-w-[240px] max-w-[240px] snap-center group cursor-pointer relative bg-samsung-card rounded-2xl overflow-hidden border border-white/5 shadow-lg transition-transform duration-300 hover:scale-[1.02]" data-id="${video.id}" role="listitem" tabindex="0" aria-label="Play: ${video.title}">
      <div class="video-thumb-wrap relative aspect-video bg-gray-800">
        <img class="video-thumb w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80" src="${thumbUrl}" alt="${video.title}" loading="lazy"
          onerror="this.style.display='none';this.parentElement.classList.add('bg-gray-700')"/>
        <div class="video-play-overlay absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true">
          <div class="video-play-btn w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg></div>
        </div>
        <span class="video-duration-tag absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md">${video.duration}</span>
      </div>
      <div class="video-card-info p-4">
        <p class="video-card-title text-sm font-semibold text-gray-100 leading-tight mb-2 line-clamp-2">${video.title}</p>
        <div class="video-card-meta flex items-center justify-between">
          <span class="video-level-badge text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${levelClass}">${video.level}</span>
        </div>
      </div>
    </div>`;
}

function initVideoSearch() {
  const input = document.getElementById('video-search');
  if (!input) return;
  let debounce;
  input.addEventListener('input', ()=>{
    clearTimeout(debounce);
    debounce = setTimeout(()=>{
      videoSearchQuery = input.value.trim();
      renderVideoLibrary(videoSearchQuery);
    }, 280);
  });
}

/* ═══════════════════════════════════════════════════════════
   YOUTUBE VIDEO MODAL
   ═══════════════════════════════════════════════════════════ */
function openVideoModal(videoId) {
  const video = VIDEO_DATA.find(v=>v.id===videoId);
  if (!video) return;
  const overlay = document.getElementById('video-modal-overlay');
  const iframe  = document.getElementById('yt-iframe');
  const info    = document.getElementById('video-modal-info');
  const meta    = document.getElementById('video-modal-meta');
  iframe.src = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`;
  info.innerHTML = `<h3 class="yt-modal-title">${video.title}</h3>`;
  meta.innerHTML = `
    <span class="yt-meta-cat">${video.category}</span>
    <span class="yt-meta-dur">⏱ ${video.duration}</span>
    <span class="yt-meta-level">${video.level}</span>
    <a class="yt-yt-link" href="https://www.youtube.com/watch?v=${video.youtubeId}" target="_blank" rel="noopener">Open on YouTube ↗</a>`;
  overlay.classList.add('active'); overlay.removeAttribute('aria-hidden');
  document.body.style.overflow='hidden';
}

function closeVideoModal() {
  const overlay = document.getElementById('video-modal-overlay');
  const iframe  = document.getElementById('yt-iframe');
  overlay?.classList.remove('active');
  overlay?.setAttribute('aria-hidden','true');
  if (iframe) iframe.src='';
  document.body.style.overflow='';
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('video-modal-close')?.addEventListener('click', closeVideoModal);
  document.getElementById('video-modal-overlay')?.addEventListener('click', e=>{
    if (e.target===document.getElementById('video-modal-overlay')) closeVideoModal();
  });
});

/* ═══════════════════════════════════════════════════════════
   HYDRATION
   ═══════════════════════════════════════════════════════════ */
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
  item.innerHTML=`<span>💧 ${t}</span><span>250 ml</span>`;
  log.prepend(item);
}
function updateHydrationUI() {
  const pct  = Math.round((hydrationMl/HYDRATION_GOAL)*100);
  const lStr = (hydrationMl/1000).toFixed(1)+'L';
  const hf   = document.getElementById('hydration-fill');
  if (hf) hf.style.height=pct+'%';
  const hiEl = document.querySelector('.hydration-info');
  if (hiEl) hiEl.innerHTML=`${lStr} / 2.0L <span style="opacity:.6">today</span>`;
  const cur = document.getElementById('hmi-current');    if (cur) cur.textContent=lStr;
  const mf  = document.getElementById('hydration-modal-fill'); if (mf) mf.style.width=pct+'%';
  const hp  = document.getElementById('hydration-pct');  if (hp) hp.textContent=pct+'%';
}

/* ═══════════════════════════════════════════════════════════
   SCAN MODAL
   ═══════════════════════════════════════════════════════════ */
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
      result.innerHTML=`
        <p style="color:var(--green);font-weight:700;margin-bottom:10px">Results ready!</p>
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
          <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#f0f4ff">${hr}</div><div style="font-size:10px;color:rgba(240,244,255,.5)">bpm</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#f0f4ff">${spo}</div><div style="font-size:10px;color:rgba(240,244,255,.5)">%SpO₂</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#f0f4ff">${tmp}</div><div style="font-size:10px;color:rgba(240,244,255,.5)">°C</div></div>
        </div>`;
      /* Update live vitals */
      heartRateVal = hr;
      updateHRDisplays(hr);
    }
  }, 3200);
}

/* ── Legacy onclick bridge (HTML onclick="markTaken(this)") ── */
function markTakenLegacy(btn) {
  const row   = btn.closest('.med-row');
  if (!row) return;
  row.classList.replace('pending-row','taken-row');
  const check = row.querySelector('.med-check');
  if (check) { check.className='med-check taken-check'; check.textContent='✓'; }
  btn.remove();
}
