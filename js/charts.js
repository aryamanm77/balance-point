/* ================================================================
   js/charts.js — Chart.js v4 Charts
   Sleep Duration · Heart Rate 24h · Restlessness Polar · SpO2
   Chart.js is loaded as a global via <script> tag in index.html
   ================================================================ */

/* ── Colour palette ── */
const C = {
  green:  '#22c76c', blue: '#3d82f6', cyan: '#00e5ff',
  magenta:'#ff6ec7', orange:'#ff8c42', red: '#ff4757',
  yellow: '#ffcc00', purple:'#6c63ff',
  text:   'rgba(240,244,255,0.8)', text3: 'rgba(240,244,255,0.35)',
  grid:   'rgba(240,244,255,0.07)'
};

Chart.defaults.color       = C.text;
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.font.size   = 11;

const charts = {};

/* ── Helper: destroy if re-initialising ── */
function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

/* ── 1. Sleep Duration — 7-day bar chart ── */
export function initSleepChart(canvasId = 'sleep-chart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const data   = [6.5, 7.2, 5.8, 8.1, 7.0, 9.2, 7.7];
  const goalLine = 8;

  const colors = data.map(v =>
    v >= goalLine ? C.green :
    v >= 6        ? C.blue  :
    C.orange
  );

  charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Hours Slept',
          data,
          backgroundColor: colors.map(c => c + 'cc'),
          borderColor:     colors,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        },
        {
          label: 'Goal (8h)',
          data: Array(7).fill(goalLine),
          type: 'line',
          borderColor:   C.cyan + '66',
          borderDash:    [5,5],
          borderWidth:   1.5,
          pointRadius:   0,
          fill:          false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}h`
          }
        }
      },
      scales: {
        x: { grid: { color: C.grid }, ticks: { color: C.text3 } },
        y: {
          grid: { color: C.grid }, ticks: { color: C.text3 },
          min: 0, max: 10,
          ticks: { stepSize: 2, callback: v => v + 'h' }
        }
      }
    }
  });
}

/* ── 2. Heart Rate 24-hour line chart ── */
export function initHeartRateChart(canvasId = 'hr-chart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  /* Generate 24h of HR data */
  const labels = Array.from({length: 25}, (_, i) => i.toString().padStart(2,'0') + ':00');
  const hrData = [
    58,56,54,54,55,57,62,68,74,78,82,80,
    76,72,74,78,80,76,72,70,68,65,62,60,58
  ];

  charts[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Heart Rate (bpm)',
        data: hrData,
        borderColor:     C.red,
        backgroundColor: C.red + '18',
        borderWidth:     2.5,
        pointRadius:     0,
        pointHoverRadius: 5,
        tension:         0.4,
        fill:            true
      }, {
        label: 'Resting Zone',
        data: Array(25).fill(65),
        borderColor:     C.cyan + '44',
        borderDash:      [6,4],
        borderWidth:     1,
        pointRadius:     0,
        fill:            false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: C.grid },
          ticks: { color: C.text3, maxTicksLimit: 8 }
        },
        y: {
          grid: { color: C.grid },
          ticks: { color: C.text3, callback: v => v + ' bpm' },
          min: 45, max: 100
        }
      }
    }
  });
}

/* ── 3. Sleep Restlessness — polar area chart ── */
export function initRestlessnessChart(canvasId = 'restless-chart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  charts[canvasId] = new Chart(canvas, {
    type: 'polarArea',
    data: {
      labels: ['Deep Sleep', 'REM', 'Light Sleep', 'Awake', 'Restless'],
      datasets: [{
        data:            [138, 102, 186, 36, 22],
        backgroundColor: [C.blue+'cc', C.purple+'cc', C.cyan+'88', C.red+'88', C.orange+'88'],
        borderColor:     ['transparent'],
        borderWidth:     0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels:   { color: C.text, boxWidth: 10, padding: 12, font: { size: 10 } }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const mins = ctx.parsed.r;
              return ` ${ctx.label}: ${Math.floor(mins/60)}h ${mins%60}m`;
            }
          }
        }
      },
      scales: {
        r: {
          grid: { color: C.grid },
          ticks: { display: false }
        }
      }
    }
  });
}

/* ── 4. SpO2 Trend — 7-day doughnut/line ── */
export function initSpO2Chart(canvasId = 'spo2-chart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const data   = [97, 98, 97, 96, 98, 99, 98];

  charts[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'SpO₂ (%)',
        data,
        borderColor:      C.cyan,
        backgroundColor:  C.cyan + '22',
        borderWidth: 2.5,
        pointBackgroundColor: C.cyan,
        pointRadius: 4,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: C.grid }, ticks: { color: C.text3 } },
        y: {
          grid: { color: C.grid }, ticks: { color: C.text3, callback: v => v + '%' },
          min: 93, max: 100
        }
      }
    }
  });
}

/* ── 5. Cardio Load — weekly bar ── */
export function initCardioChart(canvasId = 'cardio-week-chart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const data   = [60, 80, 45, 90, 64, 30, 20];

  charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Cardio Load',
        data,
        backgroundColor: data.map((v, i) =>
          i === 4 ? C.purple : C.purple + '55'),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: C.grid }, ticks: { color: C.text3 } },
        y: {
          grid: { color: C.grid }, ticks: { color: C.text3 },
          min: 0, max: 100
        }
      }
    }
  });
}

/* ── Lazy-init all charts when modals open ── */
export function initAllCharts() {
  /* Charts are init-on-demand from modal open events in app.js */
}
