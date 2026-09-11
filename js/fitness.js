const VIDEO_DATA = [
  { id: "v1", youtubeId: "1AaAWRvKj1k", title: "10-Min Senior Balance & Fall Prevention", category: "Balance & Mobility", duration: "10:15", level: "Beginner" },
  { id: "v2", youtubeId: "BKW7EkPJzMc", title: "Standing Balance Exercises for Seniors", category: "Balance & Mobility", duration: "8:42", level: "Beginner" },
  { id: "v3", youtubeId: "c5N0J3_BCXI", title: "Senior Stability & Proprioception Training", category: "Balance & Mobility", duration: "15:30", level: "Intermediate" },
  { id: "v4", youtubeId: "VpHJSHKnrUE", title: "Gentle Tai Chi for Balance & Coordination", category: "Balance & Mobility", duration: "20:00", level: "Beginner" },
  { id: "v5", youtubeId: "9ZA2nRTR6ws", title: "Fall Prevention Home Safety Routine", category: "Balance & Mobility", duration: "12:18", level: "Beginner" },
  { id: "v6", youtubeId: "Yd7Hd-1DYjM", title: "20-Min Seated Chair Workout for Seniors", category: "Chair Exercises", duration: "20:05", level: "Beginner" },
  { id: "v7", youtubeId: "4BOTvaRaDjI", title: "Chair Cardio Workout \u2013 No Equipment", category: "Chair Exercises", duration: "16:44", level: "Beginner" }
];
const CATEGORIES = [
  { name: "Balance & Mobility", color: "#3d82f6", bg: "rgba(61,130,246,0.12)", icon: "\u2696\uFE0F" },
  { name: "Chair Exercises", color: "#22c76c", bg: "rgba(34,199,108,0.12)", icon: "\u{1FA91}" }
];
function renderVideoLibrary(filter = "") {
  const container = document.getElementById("video-library");
  if (!container) return;
  const q = filter.toLowerCase();
  let html = "";
  CATEGORIES.forEach((cat) => {
    const vids = VIDEO_DATA.filter(
      (v) => v.category === cat.name && (!q || v.title.toLowerCase().includes(q) || v.category.toLowerCase().includes(q))
    );
    if (!vids.length) return;
    html += `
      <div class="video-section mb-8">
        <div class="video-section-header flex items-center justify-between mb-4 px-4">
          <div class="flex items-center gap-3">
            <span class="video-cat-icon flex items-center justify-center w-10 h-10 rounded-xl shadow-lg" style="background:${cat.bg};color:${cat.color}">${cat.icon}</span>
            <div>
              <h3 class="video-cat-title text-lg font-bold" style="color:${cat.color}">${cat.name}</h3>
              <span class="video-cat-count text-xs text-gray-400 font-medium">${vids.length} video${vids.length > 1 ? "s" : ""}</span>
            </div>
          </div>
          <span class="video-see-all text-xs font-semibold text-gray-400 hover:text-white cursor-pointer transition-colors">See all \u203A</span>
        </div>
        <div class="video-carousel flex gap-4 overflow-x-auto pb-6 px-4 snap-x snap-mandatory scrollbar-hide" role="list">
          ${vids.map((v) => buildVideoCard(v, cat)).join("")}
        </div>
      </div>`;
  });
  if (!html) {
    html = `<div class="video-empty"><p>No videos match "<strong>${filter}</strong>"</p><p class="video-empty-sub">Try a different keyword</p></div>`;
  }
  container.innerHTML = html;
  container.querySelectorAll(".video-card").forEach((card) => {
    card.addEventListener("click", () => openVideoModal(card.dataset.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openVideoModal(card.dataset.id);
    });
  });
}
function buildVideoCard(video, cat) {
  const thumbUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  const levelClass = video.level === "Beginner" ? "bg-green-500/20 text-green-400" : video.level === "Intermediate" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400";
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
  const input = document.getElementById("video-search");
  if (!input) return;
  let debounce;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      renderVideoLibrary(input.value.trim());
    }, 280);
  });
}
function openVideoModal(videoId) {
  const video = VIDEO_DATA.find((v) => v.id === videoId);
  if (!video) return;
  const overlay = document.getElementById("video-modal-overlay");
  const iframe = document.getElementById("yt-iframe");
  const info = document.getElementById("video-modal-info");
  const meta = document.getElementById("video-modal-meta");
  iframe.src = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`;
  info.innerHTML = `<h3 class="yt-modal-title">${video.title}</h3>`;
  meta.innerHTML = `
    <span class="yt-meta-cat">${video.category}</span>
    <span class="yt-meta-dur">\u23F1 ${video.duration}</span>
    <span class="yt-meta-level">${video.level}</span>
    <a class="yt-yt-link" href="https://www.youtube.com/watch?v=${video.youtubeId}" target="_blank" rel="noopener">Open on YouTube \u2197</a>`;
  overlay.classList.add("active");
  overlay.removeAttribute("aria-hidden");
  document.body.style.overflow = "hidden";
}
function closeVideoModal() {
  const overlay = document.getElementById("video-modal-overlay");
  const iframe = document.getElementById("yt-iframe");
  overlay == null ? void 0 : overlay.classList.remove("active");
  overlay == null ? void 0 : overlay.setAttribute("aria-hidden", "true");
  if (iframe) iframe.src = "";
  document.body.style.overflow = "";
}
export {
  closeVideoModal,
  initVideoSearch,
  renderVideoLibrary
};
