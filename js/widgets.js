import { getCurrentUser, saveUserPreferences } from "./auth.js";
const STORAGE_KEY = "bp_widget_layout";
const WIDGET_REGISTRY = [
  { id: "card-medications", label: "\u{1F48A} Medications", defaultVisible: true },
  { id: "card-records", label: "\u{1F4C4} Health Records", defaultVisible: true },
  { id: "card-steps", label: "\u{1F6B6} Steps", defaultVisible: true },
  { id: "card-hearing", label: "\u{1F442} Hearing", defaultVisible: true },
  { id: "card-vitals", label: "\u2764\uFE0F Vitals", defaultVisible: true },
  { id: "card-cardio", label: "\u23F1\uFE0F Cardio Load", defaultVisible: true },
  { id: "card-fitness", label: "\u{1F4AA} Fitness", defaultVisible: true },
  { id: "card-vascular", label: "\u{1FA78} Vascular Load", defaultVisible: true },
  { id: "card-sleep", label: "\u{1F319} Sleep", defaultVisible: true },
  { id: "card-hydration", label: "\u{1F4A7} Hydration", defaultVisible: true },
  { id: "card-telemetry", label: "\u{1F4E1} Bed Telemetry", defaultVisible: true },
  { id: "energy-card", label: "\u{1F525} Energy Score", defaultVisible: true }
];
class WidgetDrawer {
  constructor() {
    this._layout = this._loadLayout();
    this._drawerEl = document.getElementById("widget-drawer");
    this._overlayEl = document.getElementById("widget-drawer-overlay");
    this._btnEl = document.getElementById("widget-drawer-btn");
    this._init();
  }
  _loadLayout() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : this._defaultLayout();
    } catch (e) {
      return this._defaultLayout();
    }
  }
  _defaultLayout() {
    const layout = {};
    WIDGET_REGISTRY.forEach((w) => {
      layout[w.id] = w.defaultVisible;
    });
    return layout;
  }
  _saveLayout() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._layout));
    const user = getCurrentUser();
    if (user) {
      saveUserPreferences(user.uid, { widgetLayout: this._layout }).catch(() => {
      });
    }
  }
  _init() {
    var _a, _b, _c;
    (_a = this._btnEl) == null ? void 0 : _a.addEventListener("click", (e) => {
      e.stopPropagation();
      this.open();
    });
    (_b = this._overlayEl) == null ? void 0 : _b.addEventListener("click", () => this.close());
    (_c = document.getElementById("widget-drawer-close")) == null ? void 0 : _c.addEventListener("click", () => this.close());
    this.applyLayout();
    this._render();
  }
  open() {
    var _a, _b;
    (_a = this._drawerEl) == null ? void 0 : _a.classList.add("open");
    (_b = this._overlayEl) == null ? void 0 : _b.classList.add("active");
    document.body.style.overflow = "hidden";
  }
  close() {
    var _a, _b;
    (_a = this._drawerEl) == null ? void 0 : _a.classList.remove("open");
    (_b = this._overlayEl) == null ? void 0 : _b.classList.remove("active");
    document.body.style.overflow = "";
  }
  toggle(widgetId) {
    this._layout[widgetId] = !this._layout[widgetId];
    this._saveLayout();
    this.applyLayout();
    this._render();
  }
  showAll() {
    WIDGET_REGISTRY.forEach((w) => {
      this._layout[w.id] = true;
    });
    this._saveLayout();
    this.applyLayout();
    this._render();
  }
  /* Apply visibility to DOM elements */
  applyLayout() {
    WIDGET_REGISTRY.forEach((w) => {
      const el = document.getElementById(w.id);
      if (el) {
        el.style.display = this._layout[w.id] ? "" : "none";
      }
    });
    const energyRow = document.querySelector(".energy-row");
    if (energyRow) {
      const energyVisible = this._layout["energy-card"] !== false;
      energyRow.style.display = energyVisible ? "" : "none";
    }
  }
  /* Render drawer list */
  _render() {
    const listEl = document.getElementById("widget-drawer-list");
    if (!listEl) return;
    const visibleCount = Object.values(this._layout).filter(Boolean).length;
    listEl.innerHTML = `
      <div class="wd-stats">
        <span>${visibleCount} of ${WIDGET_REGISTRY.length} cards visible</span>
        <button class="wd-show-all-btn" onclick="window.widgetShowAll()">Show All</button>
      </div>
      ${WIDGET_REGISTRY.map((w) => {
      const on = this._layout[w.id] !== false;
      return `
          <div class="wd-item ${on ? "wd-on" : "wd-off"}">
            <span class="wd-label">${w.label}</span>
            <button class="wd-toggle ${on ? "toggle-on" : "toggle-off"}"
                    onclick="window.widgetToggle('${w.id}')"
                    aria-label="${on ? "Hide" : "Show"} ${w.label}">
              <span class="wd-toggle-knob"></span>
            </button>
          </div>`;
    }).join("")}`;
  }
}
export {
  WIDGET_REGISTRY,
  WidgetDrawer
};
