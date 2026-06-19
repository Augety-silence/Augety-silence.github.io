(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = document.querySelector('.reading-progress span');
  if (progress) {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    document.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  const searchInput = document.querySelector('[data-site-search]');
  const searchResults = document.querySelector('[data-search-results]');
  if (searchInput && searchResults) {
    let index = [];
    fetch('/search.json').then((response) => response.json()).then((data) => { index = data; }).catch(() => {});
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      if (!query) {
        searchResults.hidden = true;
        searchResults.innerHTML = '';
        return;
      }
      const matches = index.filter((item) => {
        const haystack = [item.title, item.description, ...(item.categories || []), ...(item.tags || [])].join(' ').toLowerCase();
        return haystack.includes(query);
      }).slice(0, 8);
      searchResults.innerHTML = matches.length ? matches.map((item) => `
        <a href="${item.url}">
          <span>${item.date}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.description || '')}</small>
        </a>
      `).join('') : '<p>没有找到相关内容。</p>';
      searchResults.hidden = false;
    });
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  }
})();
