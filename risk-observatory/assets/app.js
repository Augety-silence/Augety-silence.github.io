
const data = window.PROJECT_DATA || {repositories: [], categories: []};
const state = { category: "All", risk: "All", search: "", selected: null, sortKey: "adoption_risk_score", sortDir: -1 };
const colorMap = {
  "Agent Framework": "#2f6f4e",
  "Coding Agent": "#2f66b3",
  "Application Agent": "#b86b1f",
  "Infrastructure / Tooling": "#6d5e9c"
};
function fmt(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "NA";
  if (typeof value === "number") return Math.abs(value) >= 1000 ? Math.round(value).toLocaleString() : value.toFixed(digits);
  return value;
}
function num(value) { return Number(value) || 0; }
function repos() {
  return data.repositories.filter(r => {
    const categoryOk = state.category === "All" || r.category === state.category;
    const riskOk = state.risk === "All" || r.adoption_risk_level === state.risk;
    const searchOk = !state.search || `${r.owner}/${r.repo}`.toLowerCase().includes(state.search.toLowerCase());
    return categoryOk && riskOk && searchOk;
  });
}
function byRepo(rows, keyName) {
  const map = new Map();
  rows.forEach(row => {
    const key = `${row.owner}/${row.repo}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });
  return map;
}
function initControls() {
  const categorySelect = document.querySelector("#category-filter");
  const categories = ["All", ...Array.from(new Set(data.repositories.map(r => r.category).filter(Boolean))).sort()];
  categorySelect.innerHTML = categories.map(c => `<option>${c}</option>`).join("");
  categorySelect.addEventListener("change", () => { state.category = categorySelect.value; renderAll(); });
  document.querySelector("#risk-filter").addEventListener("change", event => { state.risk = event.target.value; renderAll(); });
  document.querySelector("#search-box").addEventListener("input", event => { state.search = event.target.value; renderAll(); });
  const options = data.repositories.slice().sort((a,b) => String(a.repo).localeCompare(String(b.repo))).map(r => `<option value="${r.owner}/${r.repo}">${r.repo}</option>`).join("");
  document.querySelector("#compare-a").innerHTML = options;
  document.querySelector("#compare-b").innerHTML = options;
  if (data.repositories[1]) document.querySelector("#compare-b").selectedIndex = 1;
  document.querySelector("#compare-a").addEventListener("change", renderCompare);
  document.querySelector("#compare-b").addEventListener("change", renderCompare);
  state.selected = data.repositories[0] ? `${data.repositories[0].owner}/${data.repositories[0].repo}` : null;
}
function renderKpis() {
  const rows = repos();
  const stars = rows.reduce((sum, r) => sum + num(r.stars), 0);
  const advisories = rows.reduce((sum, r) => sum + num(r.security_advisory_count), 0);
  const cves = rows.reduce((sum, r) => sum + num(r.nvd_cve_count), 0);
  const highRisk = rows.filter(r => num(r.adoption_risk_score) >= 0.66).length;
  const issues = rows.reduce((sum, r) => sum + num(r.open_issues), 0);
  const releases = rows.reduce((sum, r) => sum + num(r.ts_recent_releases_12m), 0);
  const items = [
    ["Repositories", rows.length],
    ["Total Stars", stars],
    ["Open Issues", issues],
    ["Recent Releases", releases],
    ["Advisory + CVE Hits", advisories + cves],
    ["High-Risk Projects", highRisk]
  ];
  document.querySelector("#kpis").innerHTML = items.map(([label, value]) => `<div class="kpi"><span>${label}</span><strong>${fmt(value, 0)}</strong></div>`).join("");
}
function renderScatter() {
  const el = document.querySelector("#scatter");
  const rows = repos();
  el.innerHTML = '<div class="axis x" style="top:50%"></div><div class="axis y" style="left:50%"></div>';
  rows.forEach(r => {
    const x = Math.max(4, Math.min(96, num(r.popularity_score) * 92 + 4));
    const y = Math.max(4, Math.min(96, 100 - (num(r.maintenance_score) * 92 + 4)));
    const size = Math.max(13, Math.min(48, Math.log1p(num(r.stars)) * 3.1));
    const point = document.createElement("button");
    point.type = "button";
    point.className = "point";
    point.style.left = x + "%";
    point.style.top = y + "%";
    point.style.width = size + "px";
    point.style.height = size + "px";
    point.style.background = colorMap[r.category] || "#6b7280";
    point.dataset.label = `${r.repo}: popularity ${fmt(r.popularity_score)}, maintenance ${fmt(r.maintenance_score)}, risk ${fmt(r.adoption_risk_score)}`;
    point.setAttribute("aria-label", point.dataset.label);
    point.addEventListener("click", () => { state.selected = `${r.owner}/${r.repo}`; renderDetail(); });
    el.appendChild(point);
  });
}
function renderRiskBars() {
  const rows = repos().slice().sort((a,b) => num(b.adoption_risk_score) - num(a.adoption_risk_score)).slice(0, 10);
  document.querySelector("#risk-bars").innerHTML = rows.map(r => {
    const risk = Math.max(0, Math.min(1, num(r.adoption_risk_score)));
    return `<div class="bar-row"><span>${r.repo}</span><div class="bar-track"><div class="bar-fill" style="width:${risk * 100}%"></div></div><span>${fmt(risk)}</span></div>`;
  }).join("");
}
function renderTable() {
  const rows = repos().slice().sort((a,b) => {
    const av = a[state.sortKey], bv = b[state.sortKey];
    if (typeof av === "number" || typeof bv === "number") return ((Number(av) || 0) - (Number(bv) || 0)) * state.sortDir;
    return String(av || "").localeCompare(String(bv || "")) * state.sortDir;
  });
  document.querySelector("#repo-table tbody").innerHTML = rows.map(r => `<tr>
    <td><a href="${r.repo_url}" target="_blank" rel="noreferrer">${r.repo}</a></td>
    <td>${r.category}</td>
    <td>${fmt(r.stars, 0)}</td>
    <td>${fmt(r.maintenance_score)}</td>
    <td>${fmt(r.adoption_risk_score)}</td>
    <td>${fmt(r.security_advisory_count, 0)}</td>
    <td>${fmt(r.nvd_cve_count, 0)}</td>
    <td>${fmt(r.openssf_score)}</td>
    <td>${fmt(r.recent_6m_median_roll3)}</td>
  </tr>`).join("");
  document.querySelectorAll("#repo-table tbody tr").forEach((tr, i) => {
    tr.addEventListener("click", event => {
      if (event.target.tagName.toLowerCase() === "a") return;
      const r = rows[i];
      state.selected = `${r.owner}/${r.repo}`;
      renderDetail();
    });
  });
}
function renderSecurity() {
  const rows = repos().slice().sort((a,b) => num(b.security_exposure_score) - num(a.security_exposure_score)).slice(0, 8);
  document.querySelector("#security-list").innerHTML = rows.map(r => `<div class="security-item"><strong>${r.repo}</strong><span>${fmt(r.security_advisory_count, 0)} advisory hits; ${fmt(r.nvd_cve_count, 0)} NVD CVE hits; max CVSS ${fmt(r.nvd_max_cvss)}; OpenSSF ${fmt(r.openssf_score)}</span></div>`).join("");
}
function renderDetail() {
  const selected = data.repositories.find(r => `${r.owner}/${r.repo}` === state.selected) || repos()[0];
  const el = document.querySelector("#repo-detail");
  if (!selected) {
    el.innerHTML = '<p class="empty">No repository matches the current filters.</p>';
    return;
  }
  state.selected = `${selected.owner}/${selected.repo}`;
  document.querySelector("#detail-status").textContent = selected.category || "";
  el.innerHTML = `<div class="detail-title"><strong>${selected.repo}</strong><span class="pill">${selected.adoption_risk_level || "NA"} Risk</span></div>
    <p class="method">${selected.description_hint || selected.include_reason || "Repository-level public signal profile."}</p>
    <div class="metric-grid">
      <div class="metric"><span>Stars</span><strong>${fmt(selected.stars, 0)}</strong></div>
      <div class="metric"><span>Open Issues</span><strong>${fmt(selected.open_issues, 0)}</strong></div>
      <div class="metric"><span>Popularity</span><strong>${fmt(selected.popularity_score)}</strong></div>
      <div class="metric"><span>Maintenance</span><strong>${fmt(selected.maintenance_score)}</strong></div>
      <div class="metric"><span>Security Exposure</span><strong>${fmt(selected.security_exposure_score)}</strong></div>
      <div class="metric"><span>OpenSSF</span><strong>${fmt(selected.openssf_score)}</strong></div>
    </div>
    <a href="${selected.repo_url}" target="_blank" rel="noreferrer">Open GitHub repository</a>`;
}
function renderTimeline(target, rows, valueKey, color) {
  const container = document.querySelector(target);
  const filtered = rows.filter(row => repos().some(r => r.owner === row.owner && r.repo === row.repo));
  const groups = byRepo(filtered, valueKey);
  const names = Array.from(groups.keys()).slice(0, 14);
  if (!names.length) {
    container.innerHTML = '<p class="empty">No timeline rows for current filters.</p>';
    return;
  }
  container.innerHTML = names.map(name => {
    const values = groups.get(name).slice(-18);
    const maxValue = Math.max(1, ...values.map(v => num(v[valueKey])));
    const cells = values.map(v => {
      const alpha = Math.max(0.12, Math.min(1, num(v[valueKey]) / maxValue));
      return `<span class="cell" title="${name} ${v.month || v.created_month}: ${fmt(v[valueKey])}" style="background:${color};opacity:${alpha}"></span>`;
    }).join("");
    return `<div class="heat-row"><span>${name.split("/")[1]}</span><div class="heat-cells">${cells}</div></div>`;
  }).join("");
}
function renderCompare() {
  const aKey = document.querySelector("#compare-a").value;
  const bKey = document.querySelector("#compare-b").value;
  const a = data.repositories.find(r => `${r.owner}/${r.repo}` === aKey);
  const b = data.repositories.find(r => `${r.owner}/${r.repo}` === bKey);
  if (!a || !b) return;
  const metrics = [
    ["Popularity", "popularity_score"],
    ["Maintenance", "maintenance_score"],
    ["Risk", "adoption_risk_score"],
    ["Security", "security_exposure_score"],
    ["OpenSSF", "openssf_score"]
  ];
  document.querySelector("#compare-view").innerHTML = metrics.map(([label, key]) => {
    const av = key === "openssf_score" ? num(a[key]) / 10 : num(a[key]);
    const bv = key === "openssf_score" ? num(b[key]) / 10 : num(b[key]);
    return `<div class="compare-row"><span>${label}</span><div><div class="compare-track"><div class="compare-fill" style="width:${Math.min(100, av * 100)}%"></div></div><small>${a.repo}: ${fmt(a[key])}</small></div><div><div class="compare-track"><div class="compare-fill" style="width:${Math.min(100, bv * 100)}%;background:var(--amber)"></div></div><small>${b.repo}: ${fmt(b[key])}</small></div></div>`;
  }).join("");
}
function renderCoverage() {
  const rows = (data.coverage || []).filter(row => row.dataset === "crawl_events" || row.dataset === "source_coverage").slice(-16).reverse();
  document.querySelector("#coverage-list").innerHTML = rows.map(row => `<div class="coverage-item"><strong>${row.field}</strong><span>${fmt(row.rows, 0)} logged fetches; missing rate ${fmt(row.missing_rate)}</span></div>`).join("");
}
function renderAll() {
  renderKpis();
  renderScatter();
  renderRiskBars();
  renderTable();
  renderSecurity();
  renderDetail();
  renderTimeline("#release-heatmap", data.releaseTimeline || [], "release_count", "#2f66b3");
  renderTimeline("#issue-heatmap", data.issueTimeline || [], "median_close_days_roll3", "#b86b1f");
  renderCompare();
  renderCoverage();
}
document.querySelectorAll("th[data-key]").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.key;
    state.sortDir = key === state.sortKey ? state.sortDir * -1 : -1;
    state.sortKey = key;
    renderTable();
  });
});
initControls();
renderAll();
