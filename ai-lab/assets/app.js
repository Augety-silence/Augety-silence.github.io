'use strict';

const lab = window.AI_LAB_DATA || { intro: {}, observations: [], ideas: [], terms: [] };
const state = { search: '', tag: '' };

function $(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function tags(items) {
  return [...new Set(items.flatMap((item) => item.tags || []))].filter(Boolean).slice(0, 18);
}

function renderMetrics() {
  const items = [
    ['观察入口', (lab.observations || []).length],
    ['概念卡片', (lab.terms || []).length],
    ['写作灵感', (lab.ideas || []).length],
    ['最近更新', lab.updatedAt ? lab.updatedAt.slice(0, 10) : '待生成']
  ];
  $('#lab-metrics').innerHTML = items.map(([label, value]) => `<div><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
}

function renderIntro() {
  $('#lab-title').textContent = lab.intro?.title || 'AI 内容实验馆';
  $('#lab-summary').textContent = lab.intro?.summary || '把博客里的 AI 研究、项目观察、写作灵感和概念解释集中到一个实验性专题里。';
}

function renderObservations() {
  const observations = lab.observations || [];
  $('#observations').innerHTML = observations.map((item) => `<a href="${escapeHtml(item.url || '#')}">
    <span>${escapeHtml(item.label || '观察')}</span>
    <strong>${escapeHtml(item.title)}</strong>
    <p>${escapeHtml(item.summary)}</p>
  </a>`).join('') || '<p class="empty">还没有观察入口。</p>';
}

function renderTerms() {
  const terms = lab.terms || [];
  $('#terms').innerHTML = terms.map((item) => `<article>
    <span>${escapeHtml((item.tags || [])[0] || 'AI')}</span>
    <h3>${escapeHtml(item.term)}</h3>
    <p>${escapeHtml(item.plain)}</p>
    <small>${escapeHtml(item.context || item.sourcePost || '')}</small>
  </article>`).join('') || '<p class="empty">在工作台中打开文章后，可生成术语卡。</p>';
}

function renderTagFilter() {
  const values = tags(lab.ideas || []);
  $('#idea-tags').innerHTML = [''].concat(values).map((tag) =>
    `<button class="${state.tag === tag ? 'active' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag || '全部')}</button>`).join('');
  document.querySelectorAll('#idea-tags button').forEach((button) => {
    button.addEventListener('click', () => {
      state.tag = button.dataset.tag;
      renderIdeas();
      renderTagFilter();
    });
  });
}

function renderIdeas() {
  const query = state.search.toLowerCase();
  const ideas = (lab.ideas || []).filter((item) => {
    const text = `${item.title} ${item.angle} ${item.why} ${(item.tags || []).join(' ')} ${(item.sourcePosts || []).join(' ')}`.toLowerCase();
    return (!query || text.includes(query)) && (!state.tag || (item.tags || []).includes(state.tag));
  });
  $('#ideas').innerHTML = ideas.map((item) => `<article>
    <div>${(item.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.angle)}</p>
    <small>${escapeHtml(item.why || (item.sourcePosts || []).join('、'))}</small>
  </article>`).join('') || '<p class="empty">还没有匹配的写作灵感。</p>';
}

$('#idea-search').addEventListener('input', (event) => {
  state.search = event.target.value.trim();
  renderIdeas();
});

renderIntro();
renderMetrics();
renderObservations();
renderTerms();
renderTagFilter();
renderIdeas();
