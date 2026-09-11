class HistoryLogger {
  constructor() {
    this.logs = JSON.parse(localStorage.getItem("bp_history")) || [];
    if (this.logs.length === 0) {
      this.generateMockHistory();
    }
  }
  generateMockHistory() {
    const today = /* @__PURE__ */ new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      this.logs.push({
        date: date.toISOString(),
        sleepScore: Math.floor(Math.random() * 20) + 75,
        awakenings: Math.floor(Math.random() * 4),
        avgHR: Math.floor(Math.random() * 10) + 65
      });
    }
    this.save();
  }
  save() {
    localStorage.setItem("bp_history", JSON.stringify(this.logs));
  }
  getLogs() {
    return this.logs;
  }
}
function initHistory() {
  const historyLogger = new HistoryLogger();
  console.log("Nightly History initialized", historyLogger.getLogs());
}
export {
  HistoryLogger,
  initHistory
};
