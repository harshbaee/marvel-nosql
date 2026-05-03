/* theme.js — loaded in every page via footer partial */
(function () {
  const html   = document.documentElement;
  const btn    = document.getElementById('theme-toggle');
  const icon   = btn ? btn.querySelector('.theme-icon') : null;

  const saved  = localStorage.getItem('marvel-theme') || 'dark';
  html.setAttribute('data-theme', saved);
  if (icon) icon.textContent = saved === 'dark' ? '🌙' : '☀️';

  if (btn) {
    btn.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next    = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('marvel-theme', next);
      if (icon) icon.textContent = next === 'dark' ? '🌙' : '☀️';
    });
  }
})();
