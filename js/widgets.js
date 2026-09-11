/* ================================================================
   js/widgets.js — Widget Drawer & Firestore Layout Persistence
   Toggle bento card visibility · Save layout to Firestore
   ================================================================ */

import { getCurrentUser, saveUserPreferences } from './auth.js';

const STORAGE_KEY = 'bp_widget_layout';

/* ── Card registry ── */
export const WIDGET_REGISTRY = [
  { id: 'card-medications', label: '💊 Medications',    defaultVisible: true  },
  { id: 'card-records',     label: '📄 Health Records', defaultVisible: true  },
  { id: 'card-steps',       label: '🚶 Steps',          defaultVisible: true  },
  { id: 'card-hearing',     label: '👂 Hearing',        defaultVisible: true  },
  { id: 'card-vitals',      label: '❤️ Vitals',          defaultVisible: true  },
  { id: 'card-cardio',      label: '⏱️ Cardio Load',    defaultVisible: true  },
  { id: 'card-fitness',     label: '💪 Fitness',        defaultVisible: true  },
  { id: 'card-vascular',    label: '🩸 Vascular Load',  defaultVisible: true  },
  { id: 'card-sleep',       label: '🌙 Sleep',          defaultVisible: true  },
  { id: 'card-hydration',   label: '💧 Hydration',      defaultVisible: true  },
  { id: 'card-telemetry',   label: '📡 Bed Telemetry',  defaultVisible: true  },
  { id: 'energy-card',      label: '🔥 Energy Score',   defaultVisible: true  }
];

export class WidgetDrawer {
  constructor() {
    this._layout = this._loadLayout();
    this._drawerEl  = document.getElementById('widget-drawer');
    this._overlayEl = document.getElementById('widget-drawer-overlay');
    this._btnEl     = document.getElementById('widget-drawer-btn');
    this._init();
  }

  _loadLayout() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : this._defaultLayout();
    } catch { return this._defaultLayout(); }
  }

  _defaultLayout() {
    const layout = {};
    WIDGET_REGISTRY.forEach(w => { layout[w.id] = w.defaultVisible; });
    return layout;
  }

  _saveLayout() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._layout));
    const user = getCurrentUser();
    if (user) {
      saveUserPreferences(user.uid, { widgetLayout: this._layout })
        .catch(() => {}); /* silent fail if offline */
    }
  }

  _init() {
    /* Drawer open/close */
    this._btnEl?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.open();
    });
    this._overlayEl?.addEventListener('click', () => this.close());
    document.getElementById('widget-drawer-close')?.addEventListener('click', () => this.close());

    /* Apply saved layout on init */
    this.applyLayout();
    this._render();
  }

  open() {
    this._drawerEl?.classList.add('open');
    this._overlayEl?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this._drawerEl?.classList.remove('open');
    this._overlayEl?.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggle(widgetId) {
    this._layout[widgetId] = !this._layout[widgetId];
    this._saveLayout();
    this.applyLayout();
    this._render();
  }

  showAll() {
    WIDGET_REGISTRY.forEach(w => { this._layout[w.id] = true; });
    this._saveLayout();
    this.applyLayout();
    this._render();
  }

  /* Apply visibility to DOM elements */
  applyLayout() {
    WIDGET_REGISTRY.forEach(w => {
      const el = document.getElementById(w.id);
      if (el) {
        el.style.display = this._layout[w.id] ? '' : 'none';
      }
    });

    /* Also toggle energy-row visibility */
    const energyRow = document.querySelector('.energy-row');
    if (energyRow) {
      const energyVisible = this._layout['energy-card'] !== false;
      energyRow.style.display = energyVisible ? '' : 'none';
    }
  }

  /* Render drawer list */
  _render() {
    const listEl = document.getElementById('widget-drawer-list');
    if (!listEl) return;

    const visibleCount = Object.values(this._layout).filter(Boolean).length;

    listEl.innerHTML = `
      <div class="wd-stats">
        <span>${visibleCount} of ${WIDGET_REGISTRY.length} cards visible</span>
        <button class="wd-show-all-btn" onclick="window.widgetShowAll()">Show All</button>
      </div>
      ${WIDGET_REGISTRY.map(w => {
        const on = this._layout[w.id] !== false;
        return `
          <div class="wd-item ${on ? 'wd-on' : 'wd-off'}">
            <span class="wd-label">${w.label}</span>
            <button class="wd-toggle ${on ? 'toggle-on' : 'toggle-off'}"
                    onclick="window.widgetToggle('${w.id}')"
                    aria-label="${on ? 'Hide' : 'Show'} ${w.label}">
              <span class="wd-toggle-knob"></span>
            </button>
          </div>`;
      }).join('')}`;
  }
}
