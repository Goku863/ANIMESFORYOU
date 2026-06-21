/* ============================================================
   AnimeStream — miruro.ru Style App + Watch Page
   ============================================================ */

let ANIME_DB = [];
let filteredAnime = [];
let displayCount = 40;
let currentSection = 'home';
let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
let wlOpen = false;
let currentWatchAnime = null;
let currentEpisode = 0;

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderHome();
});

async function loadData() {
  try {
    const res = await fetch('pikahd-complete/02-all-detailed.json');
    const data = await res.json();
    ANIME_DB = data.map((a, i) => ({
      id: i + 1,
      title: a.title || 'Unknown',
      slug: a.slug,
      poster: a.thumbnail || '',
      categories: a.categories || [],
      quality: a.info?.quality || 'HD',
      audio: getAudio(a.categories),
      rating: parseFloat(a.info?.rating) || 0,
      year: getYear(a.created),
      pikahd: a.url || `https://new.pikahd.co/${a.slug}`,
      info: a.info || {},
      storyline: a.storyline || '',
      downloads: a.downloads || [],
      playLink: a.playLink || '',
      created: a.created || ''
    }));
    filteredAnime = [...ANIME_DB];
  } catch (e) {
    console.error('Load failed:', e);
  }
}

function getAudio(c) {
  if (!c) return 'sub';
  if (c.some(x => x.includes('triple'))) return 'triple';
  if (c.some(x => x.includes('dual'))) return 'dub';
  if (c.some(x => x.includes('hindi'))) return 'hindi';
  return 'sub';
}

function getYear(d) {
  if (!d) return 2026;
  const m = d.match(/\d{4}/);
  return m ? parseInt(m[0]) : 2026;
}

// ── Render Home ───────────────────────────────────────────
function renderHome() {
  renderHero();
  renderCarousel();
  renderRecent();
  renderHomeGrid();
}

function renderHero() {
  const hero = document.getElementById('heroBanner');
  const featured = ANIME_DB.filter(a => a.downloads.length > 0)[Math.floor(Math.random() * 20)];
  if (!featured) return;
  
  hero.innerHTML = '<img src="' + featured.poster + '" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'">' +
    '<div style="position:absolute;inset:0;background:linear-gradient(transparent 40%, var(--bg) 100%)"></div>' +
    '<div class="hero-content">' +
    '<h1 class="hero-title">' + esc(featured.title.substring(0, 80)) + '</h1>' +
    '<div class="hero-meta"><span>' + featured.quality + '</span><span>•</span><span>' + featured.year + '</span><span>•</span><span>' + featured.downloads.length + ' episodes</span></div>' +
    '<p class="hero-desc">' + esc((featured.info?.description || '').substring(0, 200)) + '</p>' +
    '<button class="hero-btn" onclick="watchAnime(' + featured.id + ')">▶ Watch Now</button>' +
    '</div>';
}

function renderCarousel() {
  const el = document.getElementById('trendingCarousel');
  const trending = ANIME_DB.filter(a => a.downloads.length > 0).slice(0, 20);
  el.innerHTML = trending.map(a => {
    const typeBadge = getAudio(a.categories) === 'hindi' ? '<span class="badge dub">Hindi</span>' : '';
    return '<div class="carousel-item" onclick="watchAnime(' + a.id + ')">' +
      '<div class="poster"><img src="' + a.poster + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
      '<div class="play-overlay"><div class="play-btn">▶</div></div>' + typeBadge + '</div>' +
      '<div class="title">' + esc(a.title.substring(0, 50)) + '</div>' +
      '<div class="meta">' + a.quality + ' • ' + a.year + '</div></div>';
  }).join('');
}

function renderRecent() {
  const el = document.getElementById('recentGrid');
  const recent = [...ANIME_DB].sort((a, b) => (b.created || '').localeCompare(a.created || '')).slice(0, 12);
  el.innerHTML = recent.map(cardHTML).join('');
}

function renderHomeGrid() {
  const el = document.getElementById('homeGrid');
  const count = document.getElementById('animeCount');
  el.innerHTML = filteredAnime.slice(0, displayCount).map(cardHTML).join('');
  count.textContent = filteredAnime.length + ' titles';
}

function loadMore() {
  displayCount += 40;
  renderHomeGrid();
}

function cardHTML(a) {
  const audio = getAudio(a.categories);
  let badge = '';
  if (audio === 'hindi') badge = '<span class="type-badge hindi">Hindi</span>';
  else if (audio === 'dub') badge = '<span class="type-badge dub">Dub</span>';
  else badge = '<span class="type-badge sub">Sub</span>';
  
  return '<div class="anime-card" onclick="watchAnime(' + a.id + ')">' +
    '<div class="poster"><img src="' + a.poster + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
    '<div class="overlay"><div class="play-circle">▶</div></div>' + badge +
    (a.downloads.length ? '<span class="ep-badge">' + a.downloads.length + ' EP</span>' : '') +
    '</div><div class="info"><div class="title">' + esc(a.title.substring(0, 60)) + '</div>' +
    '<div class="meta">' + a.quality + ' • ' + a.year + '</div></div></div>';
}

// ── Navigation ────────────────────────────────────────────
function navigateTo(section) {
  currentSection = section;
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  document.querySelector('.nav-link[data-section="' + section + '"]')?.classList.add('active');
  
  ['homeSection', 'trendingSection', 'moviesSection', 'scheduleSection', 'watchlistSection', 'watchSection', 'searchSection'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  switch(section) {
    case 'home':
      document.getElementById('homeSection').style.display = '';
      displayCount = 40;
      renderHomeGrid();
      break;
    case 'trending':
      document.getElementById('trendingSection').style.display = '';
      document.getElementById('trendingGrid').innerHTML = ANIME_DB.filter(a => a.downloads.length > 0).slice(0, 100).map(cardHTML).join('');
      break;
    case 'movies':
      document.getElementById('moviesSection').style.display = '';
      document.getElementById('moviesGrid').innerHTML = ANIME_DB.filter(a => a.title.toLowerCase().includes('movie')).slice(0, 50).map(cardHTML).join('');
      break;
    case 'schedule':
      document.getElementById('scheduleSection').style.display = '';
      renderSchedule();
      break;
    case 'watchlist':
      document.getElementById('watchlistSection').style.display = '';
      const wl = ANIME_DB.filter(a => watchlist.includes(a.slug));
      document.getElementById('watchlistGrid').innerHTML = wl.length ? wl.map(cardHTML).join('') : '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">No anime in watchlist</div>';
      break;
  }
  window.scrollTo(0, 0);
}

function renderSchedule() {
  const el = document.getElementById('scheduleGrid');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  el.innerHTML = days.map(day => {
    const shows = ANIME_DB.filter(a => a.downloads.length > 0).slice(0, 5);
    return '<div class="schedule-card"><div class="schedule-day">' + day + '</div>' +
      shows.map(a => '<div class="schedule-item" onclick="watchAnime(' + a.id + ')">' +
        '<img src="' + a.poster + '" alt="" onerror="this.style.display=\'none\'">' +
        '<div class="info"><div class="title">' + esc(a.title.substring(0, 40)) + '</div>' +
        '<div class="time">' + a.quality + '</div></div></div>').join('') + '</div>';
  }).join('');
}

// ── Watch Page (miruro.ru style) ──────────────────────────
function watchAnime(id) {
  const a = ANIME_DB.find(x => x.id === id);
  if (!a) return;
  
  currentWatchAnime = a;
  currentEpisode = 0;
  
  // Hide all sections, show watch
  ['homeSection', 'trendingSection', 'moviesSection', 'scheduleSection', 'watchlistSection', 'searchSection'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('watchSection').style.display = '';
  
  // Title & Meta
  document.getElementById('watchTitle').textContent = a.title;
  
  const audio = getAudio(a.categories);
  let metaHTML = '<span>' + a.quality + '</span><span>' + a.year + '</span>';
  metaHTML += '<span class="badge badge-green">' + (a.audio === 'triple' ? 'Triple' : a.audio === 'dub' ? 'Dual' : audio === 'hindi' ? 'Hindi' : 'Sub') + '</span>';
  metaHTML += '<span>' + a.downloads.length + ' episodes</span>';
  if (a.info?.rating) metaHTML += '<span class="badge badge-yellow">⭐ ' + a.info.rating + '</span>';
  document.getElementById('watchMeta').innerHTML = metaHTML;
  
  // Actions
  let actionsHTML = '<button class="btn btn-primary" onclick="playEpisode(0)">▶ Play Episode 1</button>';
  actionsHTML += '<button class="btn btn-outline" onclick="toggleWatchlist(\'' + a.slug + '\')">' + (watchlist.includes(a.slug) ? '★ Saved' : '☆ Save') + '</button>';
  document.getElementById('watchActions').innerHTML = actionsHTML;
  
  // Episodes
  if (a.downloads.length > 0) {
    let epHTML = '<h3>Episodes (' + a.downloads.length + ')</h3><div class="ep-grid t-stagger">';
    a.downloads.forEach((_, i) => {
      epHTML += '<div class="ep-item t-pop-in' + (i === 0 ? ' active' : '') + '" onclick="playEpisode(' + i + ')" id="ep-' + i + '">EP ' + (i + 1) + '</div>';
    });
    epHTML += '</div>';
    document.getElementById('episodeList').innerHTML = epHTML;
  } else {
    document.getElementById('episodeList').innerHTML = '';
  }
  
  // Downloads
  if (a.downloads.length > 0) {
    let dlHTML = '<h3>⬇ Download Links</h3><div class="dl-list t-stagger">';
    a.downloads.forEach((link, i) => {
      dlHTML += '<a href="' + link + '" target="_blank" class="dl-item t-slide-up">' +
        '<span class="dl-ep">Episode ' + (i + 1) + '</span>' +
        '<span class="dl-provider">' + getProvider(link) + '</span></a>';
    });
    dlHTML += '</div>';
    document.getElementById('downloadSection').innerHTML = dlHTML;
  } else {
    document.getElementById('downloadSection').innerHTML = '';
  }
  
  // Related
  const related = ANIME_DB.filter(x => x.id !== a.id && x.downloads.length > 0).slice(0, 8);
  document.getElementById('relatedAnime').innerHTML = related.map(r =>
    '<div class="related-item" onclick="watchAnime(' + r.id + ')">' +
    '<img src="' + r.poster + '" alt="" onerror="this.style.display=\'none\'">' +
    '<div><div class="title">' + esc(r.title.substring(0, 50)) + '</div>' +
    '<div class="meta">' + r.quality + ' • ' + r.year + '</div></div></div>'
  ).join('');
  
  // Auto-play first episode if has playLink
  if (a.playLink) {
    playEpisode(0);
  } else {
    document.getElementById('playerWrap').innerHTML = '<div class="no-player">No streaming available. Use download links below.</div>';
  }
  
  window.scrollTo(0, 0);
}

function playEpisode(idx) {
  if (!currentWatchAnime) return;
  currentEpisode = idx;
  
  // Update active episode
  document.querySelectorAll('.ep-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  
  // Update player
  const wrap = document.getElementById('playerWrap');
  if (currentWatchAnime.playLink) {
    wrap.innerHTML = '<iframe src="' + currentWatchAnime.playLink + '" allowfullscreen></iframe>';
  } else {
    wrap.innerHTML = '<div class="no-player">No streaming available. Use download links below.</div>';
  }
  
  // Update play button
  document.getElementById('watchActions').innerHTML = 
    '<button class="btn btn-primary" onclick="playEpisode(' + idx + ')">▶ Playing Episode ' + (idx + 1) + '</button>' +
    '<button class="btn btn-outline" onclick="toggleWatchlist(\'' + currentWatchAnime.slug + '\')">' + (watchlist.includes(currentWatchAnime.slug) ? '★ Saved' : '☆ Save') + '</button>';
}

function getProvider(link) {
  if (link.includes('gdflix')) return 'GDFlix';
  if (link.includes('katdrive')) return 'KatDrive';
  if (link.includes('gd.kmhd')) return 'GD Cloud';
  if (link.includes('links.kmhd')) return 'KMHD';
  return 'Download';
}

// ── Search ────────────────────────────────────────────────
function toggleSearch() {
  document.getElementById('searchWrap').classList.toggle('active');
  document.getElementById('searchInput').focus();
}

function handleSearch(q) {
  const query = q.toLowerCase().trim();
  if (!query) { if (currentSection === 'search') navigateTo('home'); return; }
  
  ['homeSection', 'trendingSection', 'moviesSection', 'scheduleSection', 'watchlistSection', 'watchSection'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('searchSection').style.display = '';
  document.getElementById('searchTitle').textContent = 'Results for "' + q + '"';
  
  const results = ANIME_DB.filter(a =>
    (a.title || '').toLowerCase().includes(query) ||
    (a.slug || '').toLowerCase().includes(query) ||
    (a.categories || []).some(c => c.includes(query))
  );
  document.getElementById('searchGrid').innerHTML = results.slice(0, 50).map(cardHTML).join('');
}

// ── Watchlist ─────────────────────────────────────────────
function toggleWatchlist(slug) {
  const idx = watchlist.indexOf(slug);
  if (idx >= 0) { watchlist.splice(idx, 1); showToast('Removed from watchlist'); }
  else { watchlist.push(slug); showToast('Added to watchlist'); }
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

function toggleWatchlistPanel() {
  wlOpen = !wlOpen;
  document.getElementById('wlPanel').classList.toggle('open', wlOpen);
  if (wlOpen) renderWLPanel();
}

function renderWLPanel() {
  const el = document.getElementById('wlBody');
  const wl = ANIME_DB.filter(a => watchlist.includes(a.slug));
  if (!wl.length) { el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">No saved anime</div>'; return; }
  el.innerHTML = wl.map(a => '<div class="wl-item" onclick="watchAnime(' + a.id + ');toggleWatchlistPanel()">' +
    '<img src="' + a.poster + '" alt="" onerror="this.style.display=\'none\'">' +
    '<div><div class="title">' + esc(a.title.substring(0, 50)) + '</div></div>' +
    '<span class="remove" onclick="event.stopPropagation();toggleWatchlist(\'' + a.slug + '\');renderWLPanel()">✕</span></div>').join('');
}

// ── Mobile ────────────────────────────────────────────────
function toggleMobileMenu() { document.getElementById('mobileNav').classList.toggle('open'); }
function closeMobileMenu() { document.getElementById('mobileNav').classList.remove('open'); }

// ── Utilities ─────────────────────────────────────────────
function esc(s) { return s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// Expose
window.navigateTo = navigateTo;
window.watchAnime = watchAnime;
window.playEpisode = playEpisode;
window.toggleSearch = toggleSearch;
window.handleSearch = handleSearch;
window.toggleWatchlist = toggleWatchlist;
window.toggleWatchlistPanel = toggleWatchlistPanel;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.loadMore = loadMore;
