/* ============================================================
   MarvelBase — main.js
   ============================================================ */

let allMovies       = [];
let selectedMovieId = null;
let editingMovieId  = null;
let selectedRating  = null;

// ── Helpers ───────────────────────────────────────────────────
function renderStars(avg) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (avg >= i)           html += '<span class="star-full">★</span>';
    else if (avg >= i - 0.5) html += '<span class="star-half">★</span>';
    else                    html += '<span class="star-empty">★</span>';
  }
  return html;
}

function fmtMoney(val) {
  if (!val) return '—';
  if (val >= 1000) return `$${(val / 1000).toFixed(2)}B`;
  return `$${val}M`;
}

function fmtRuntime(min) {
  if (!min) return '—';
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type}`;
  t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.style.display = 'none'), 3200);
}

function openModal(id)  { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ── Fetch movie list ──────────────────────────────────────────
async function fetchMovies(search = '', phase = 'all') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (phase !== 'all') params.set('phase', phase);
  const res = await fetch('/api/movies?' + params);
  allMovies = await res.json();
  renderMovieList(allMovies);
}

// ── Render list ───────────────────────────────────────────────
function renderMovieList(movies) {
  const ul    = document.getElementById('movie-list');
  const badge = document.getElementById('movie-count');
  badge.textContent = movies.length;

  if (!movies.length) {
    ul.innerHTML = '<li class="list-placeholder">No movies found.</li>';
    return;
  }

  ul.innerHTML = movies.map(m => {
    const avg = m.averageRating || 0;
    const stars = avg > 0 ? '★'.repeat(Math.round(avg)) : '';
    return `
      <li class="movie-item ${m._id === selectedMovieId ? 'active' : ''}" data-id="${m._id}">
        <span class="movie-item-num">#${m.mcuOrder}</span>
        <div class="movie-item-info">
          <div class="movie-item-title">${m.title}</div>
          <div class="movie-item-meta">Phase ${m.phase} · ${m.year}</div>
        </div>
        <span class="movie-item-stars">${stars}</span>
      </li>`;
  }).join('');

  ul.querySelectorAll('.movie-item').forEach(li =>
    li.addEventListener('click', () => selectMovie(li.dataset.id))
  );
}

// ── Select + display ──────────────────────────────────────────
async function selectMovie(id) {
  selectedMovieId = id;
  document.querySelectorAll('.movie-item').forEach(li =>
    li.classList.toggle('active', li.dataset.id === id)
  );

  const res = await fetch(`/api/movies/${id}`);
  if (!res.ok) { showToast('Failed to load movie', 'error'); return; }
  const m = await res.json();

  document.getElementById('detail-placeholder').style.display = 'none';
  document.getElementById('detail-content').style.display     = 'block';

  // Poster
  const img      = document.getElementById('detail-poster');
  const fallback = document.getElementById('poster-fallback');
  if (m.posterUrl) {
    img.src = m.posterUrl;
    img.style.display = 'block';
    fallback.style.display = 'none';
  } else {
    img.style.display = 'none';
    fallback.style.display = 'flex';
  }

  document.getElementById('detail-phase-badge').textContent = `Phase ${m.phase}`;
  document.getElementById('detail-title').textContent       = m.title;
  document.getElementById('detail-director').textContent    = `Directed by ${m.director}`;
  document.getElementById('detail-description').textContent = m.description || '';

  document.getElementById('detail-stars').innerHTML        = renderStars(m.averageRating || 0);
  document.getElementById('detail-rating-text').textContent =
    m.ratings && m.ratings.length
      ? `${m.averageRating} / 5  (${m.ratings.length} vote${m.ratings.length > 1 ? 's' : ''})`
      : 'No ratings yet';

  document.getElementById('detail-year').textContent      = m.year || '—';
  document.getElementById('detail-runtime').textContent   = fmtRuntime(m.runtime);
  document.getElementById('detail-boxoffice').textContent = fmtMoney(m.boxOffice);
  document.getElementById('detail-budget').textContent    = fmtMoney(m.budget);
  document.getElementById('detail-roi').textContent       = m.roi !== null && m.roi !== undefined ? `${m.roi}%` : '—';
  document.getElementById('detail-views').textContent     = m.views;
  document.getElementById('detail-mcuorder').textContent  = `#${m.mcuOrder}`;
  document.getElementById('detail-votes').textContent     = m.ratings ? m.ratings.length : 0;

  // Cast tags
  const castEl = document.getElementById('detail-cast');
  castEl.innerHTML = m.cast && m.cast.length
    ? m.cast.map(a => `<span class="cast-tag">${a}</span>`).join('')
    : '<span style="color:var(--muted);font-size:.85rem;">No cast info</span>';
}

// ── Add / Edit modal ──────────────────────────────────────────
function openAddModal() {
  editingMovieId = null;
  document.getElementById('modal-movie-title').textContent = 'Add New Movie';
  document.getElementById('modal-movie-save').textContent  = 'Save Movie';
  ['f-title','f-year','f-phase','f-mcuorder','f-runtime','f-director','f-budget','f-boxoffice','f-cast','f-poster','f-description']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('form-error').style.display = 'none';
  openModal('modal-movie');
}

function openEditModal(m) {
  editingMovieId = m._id;
  document.getElementById('modal-movie-title').textContent = 'Edit Movie';
  document.getElementById('modal-movie-save').textContent  = 'Update Movie';
  document.getElementById('f-title').value       = m.title || '';
  document.getElementById('f-year').value        = m.year  || '';
  document.getElementById('f-phase').value       = m.phase || '';
  document.getElementById('f-mcuorder').value    = m.mcuOrder || '';
  document.getElementById('f-runtime').value     = m.runtime  || '';
  document.getElementById('f-director').value    = m.director || '';
  document.getElementById('f-budget').value      = m.budget   || '';
  document.getElementById('f-boxoffice').value   = m.boxOffice || '';
  document.getElementById('f-cast').value        = (m.cast || []).join(', ');
  document.getElementById('f-poster').value      = m.posterUrl || '';
  document.getElementById('f-description').value = m.description || '';
  document.getElementById('form-error').style.display = 'none';
  openModal('modal-movie');
}

async function saveMovie() {
  const body = {
    title:       document.getElementById('f-title').value.trim(),
    year:        parseInt(document.getElementById('f-year').value),
    phase:       parseInt(document.getElementById('f-phase').value),
    mcuOrder:    parseInt(document.getElementById('f-mcuorder').value),
    runtime:     parseInt(document.getElementById('f-runtime').value) || undefined,
    director:    document.getElementById('f-director').value.trim(),
    budget:      parseFloat(document.getElementById('f-budget').value) || undefined,
    boxOffice:   parseFloat(document.getElementById('f-boxoffice').value) || undefined,
    cast:        document.getElementById('f-cast').value.split(',').map(s => s.trim()).filter(Boolean),
    posterUrl:   document.getElementById('f-poster').value.trim(),
    description: document.getElementById('f-description').value.trim(),
  };

  const errBox = document.getElementById('form-error');
  if (!body.title || !body.year || !body.phase || !body.mcuOrder || !body.director) {
    errBox.textContent    = 'Please fill in all required fields (*)';
    errBox.style.display  = 'block';
    return;
  }
  errBox.style.display = 'none';

  const url    = editingMovieId ? `/api/movies/${editingMovieId}` : '/api/movies';
  const method = editingMovieId ? 'PUT' : 'POST';
  const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data   = await res.json();

  if (!res.ok) {
    errBox.textContent   = data.messages ? data.messages.join(', ') : data.error;
    errBox.style.display = 'block';
    return;
  }

  closeModal('modal-movie');
  showToast(editingMovieId ? 'Movie updated!' : 'Movie added!');
  await fetchMovies(
    document.getElementById('search-input').value,
    document.getElementById('filter-phase').value
  );
  selectMovie(data._id);
}

// ── Delete ────────────────────────────────────────────────────
function openDeleteModal() {
  const m = allMovies.find(m => m._id === selectedMovieId);
  if (!m) return;
  document.getElementById('delete-movie-name').textContent = m.title;
  openModal('modal-delete');
}

async function deleteMovie() {
  const res  = await fetch(`/api/movies/${selectedMovieId}`, { method: 'DELETE' });
  const data = await res.json();
  closeModal('modal-delete');
  if (!res.ok) { showToast(data.error, 'error'); return; }
  showToast(data.message);
  selectedMovieId = null;
  document.getElementById('detail-placeholder').style.display = 'flex';
  document.getElementById('detail-content').style.display     = 'none';
  await fetchMovies(
    document.getElementById('search-input').value,
    document.getElementById('filter-phase').value
  );
}

// ── Rate ──────────────────────────────────────────────────────
function openRateModal() {
  const m = allMovies.find(m => m._id === selectedMovieId);
  if (!m) return;
  document.getElementById('rate-movie-name').textContent = m.title;
  selectedRating = null;
  document.querySelectorAll('.star-pick').forEach(s => s.classList.remove('selected', 'hovered'));
  document.getElementById('star-pick-label').textContent = 'Click a star to rate';
  openModal('modal-rate');
}

async function submitRating() {
  if (selectedRating === null) {
    document.getElementById('star-pick-label').textContent = 'Please select a star first!';
    return;
  }
  const res  = await fetch(`/api/movies/${selectedMovieId}/rate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: selectedRating }),
  });
  const data = await res.json();
  closeModal('modal-rate');
  if (!res.ok) { showToast(data.error, 'error'); return; }
  showToast(`Rated ${selectedRating}/5 — new average: ${data.averageRating}`);
  selectMovie(selectedMovieId);
}

// ── Search debounce ───────────────────────────────────────────
let debounce;
function onSearch() {
  clearTimeout(debounce);
  debounce = setTimeout(() => fetchMovies(
    document.getElementById('search-input').value,
    document.getElementById('filter-phase').value
  ), 300);
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchMovies();

  document.getElementById('search-input').addEventListener('input', onSearch);
  document.getElementById('filter-phase').addEventListener('change', onSearch);
  document.getElementById('btn-clear').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-phase').value = 'all';
    fetchMovies();
  });

  document.getElementById('btn-add-movie').addEventListener('click', openAddModal);
  document.getElementById('modal-movie-save').addEventListener('click', saveMovie);
  document.getElementById('modal-movie-close').addEventListener('click',  () => closeModal('modal-movie'));
  document.getElementById('modal-movie-cancel').addEventListener('click', () => closeModal('modal-movie'));

  document.getElementById('btn-rate').addEventListener('click', openRateModal);
  document.getElementById('btn-delete').addEventListener('click', openDeleteModal);
  document.getElementById('btn-edit').addEventListener('click', async () => {
    const res = await fetch(`/api/movies/${selectedMovieId}`);
    openEditModal(await res.json());
  });

  document.getElementById('modal-rate-save').addEventListener('click', submitRating);
  document.getElementById('modal-rate-close').addEventListener('click',  () => closeModal('modal-rate'));
  document.getElementById('modal-rate-cancel').addEventListener('click', () => closeModal('modal-rate'));

  document.getElementById('modal-delete-confirm').addEventListener('click', deleteMovie);
  document.getElementById('modal-delete-close').addEventListener('click',  () => closeModal('modal-delete'));
  document.getElementById('modal-delete-cancel').addEventListener('click', () => closeModal('modal-delete'));

  // Star picker
  const stars = document.querySelectorAll('.star-pick');
  stars.forEach(s => {
    s.addEventListener('mouseover', () => {
      const v = +s.dataset.val;
      stars.forEach(st => st.classList.toggle('hovered', +st.dataset.val <= v));
    });
    s.addEventListener('mouseleave', () => stars.forEach(st => st.classList.remove('hovered')));
    s.addEventListener('click', () => {
      selectedRating = +s.dataset.val;
      stars.forEach(st => st.classList.toggle('selected', +st.dataset.val <= selectedRating));
      document.getElementById('star-pick-label').textContent = `${selectedRating} star${selectedRating > 1 ? 's' : ''} selected`;
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) o.style.display = 'none'; })
  );
});
