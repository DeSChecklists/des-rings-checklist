const STORAGE_KEY = "des-rings-checklist-v2";
const WORLD_LABELS = {
  "1": "⚔️ World 1",
  "2": "⛏️ World 2",
  "3": "🕯️ World 3",
  "4": "🌩️ World 4",
  "5": "☠️ World 5"
};
const FILTERS = ["All", "World 1", "World 2", "World 3", "World 4", "World 5", "Nexus", "Trade", "PWWT", "PBWT", "PWCT", "PBCT"];

const state = {
  filter: "All",
  query: "",
  checked: loadChecked()
};

const ringsList = document.getElementById("ringsList");
const filters = document.getElementById("filters");
const searchInput = document.getElementById("searchInput");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");
const resetBtn = document.getElementById("resetBtn");

function loadChecked(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveChecked(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.checked)); }

function analyseRing(ring){
  const text = `${ring.name} ${ring.details.join(" ")}`;
  const worlds = [...new Set([...text.matchAll(/\b([1-5])-\d\b/g)].map(match => match[1]))];
  const tags = [];
  if (/Nexus|Monumental|Mephistopheles|Stockpile Thomas|Patches/.test(text)) tags.push("Nexus");
  if (/Trade|Sparkly|Give Thomas|starting gift|Royalty class/.test(text)) tags.push("Trade");
  if (/Pure White World Tendency/i.test(text)) tags.push("PWWT");
  if (/Pure Black World Tendency/i.test(text)) tags.push("PBWT");
  if (/Pure White Character Tendency/i.test(text)) tags.push("PWCT");
  if (/Pure Black Character Tendency/i.test(text)) tags.push("PBCT");
  return { worlds, tags };
}

function makeId(name){ return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function escapeHtml(text){
  return text.replace(/[&<>"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
}

function renderFilters(){
  filters.innerHTML = FILTERS.map(label => `<button class="filter-btn ${state.filter === label ? "active" : ""}" data-filter="${label}">${label}</button>`).join("");
}

function matchesFilter(ring){
  if (state.filter === "All") return true;
  const meta = analyseRing(ring);
  if (state.filter.startsWith("World ")) return meta.worlds.includes(state.filter.split(" ")[1]);
  return meta.tags.includes(state.filter);
}

function matchesQuery(ring){
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  return `${ring.name} ${ring.details.join(" ")}`.toLowerCase().includes(q);
}

function renderRings(){
  const visible = RINGS.filter(ring => matchesFilter(ring) && matchesQuery(ring));
  if (!visible.length){
    ringsList.innerHTML = `<div class="empty">No rings found. Try another search or filter.</div>`;
    return;
  }
  ringsList.innerHTML = visible.map(ring => {
    const id = makeId(ring.name);
    const meta = analyseRing(ring);
    const checked = !!state.checked[id];
    const worldBadges = meta.worlds.map(world => `<span class="badge world">${WORLD_LABELS[world]}</span>`).join("");
    const tagBadges = meta.tags.map(tag => {
      const cls = tag === "Nexus" ? "nexus" : tag === "Trade" ? "trade" : tag.includes("White") || tag.includes("PWWT") || tag.includes("PWCT") ? "white" : "black";
      return `<span class="badge ${cls}">${tag}</span>`;
    }).join("");
    return `
      <article class="ring-card ${checked ? "done" : ""}" data-id="${id}">
        <input class="check" type="checkbox" aria-label="Mark ${escapeHtml(ring.name)} collected" ${checked ? "checked" : ""} />
        <div>
          <h2 class="ring-name">${escapeHtml(ring.name)}</h2>
          <ul class="details">${ring.details.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <div class="badges">${worldBadges}${tagBadges}</div>
        </div>
      </article>`;
  }).join("");
}

function updateProgress(){
  const total = RINGS.length;
  const collected = RINGS.filter(ring => state.checked[makeId(ring.name)]).length;
  const percent = Math.round((collected / total) * 100);
  progressText.textContent = `${collected} / ${total} rings collected`;
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

function render(){
  renderFilters();
  renderRings();
  updateProgress();
}

filters.addEventListener("click", event => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  render();
});

searchInput.addEventListener("input", event => {
  state.query = event.target.value;
  renderRings();
});

ringsList.addEventListener("change", event => {
  if (!event.target.matches(".check")) return;
  const card = event.target.closest(".ring-card");
  state.checked[card.dataset.id] = event.target.checked;
  if (!event.target.checked) delete state.checked[card.dataset.id];
  card.classList.toggle("done", event.target.checked);
  saveChecked();
  updateProgress();
});

resetBtn.addEventListener("click", () => {
  if (!confirm("Reset all collected rings on this device?")) return;
  state.checked = {};
  saveChecked();
  render();
});

render();
