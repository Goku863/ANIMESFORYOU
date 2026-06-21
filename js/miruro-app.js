/* ============================================================
   AnimeStream — miruro.ru Style App
   ============================================================ */

let ANIME_DB = [];
let filteredAnime = [];
let displayCount = 40;
let currentSection = 'home';
let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
let aiOpen = false;
let wlOpen = false;

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderHome();
  document.getElementById('loading').classList.add('hidden');
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
    '<div class="gradient"></div>' +
    '<div class="hero-content">' +
    '<h1 class="hero-title">' + escapeHtml(featured.title.substring(0, 80)) + '</h1>' +
    '<div class="hero-meta">' +
    '<span>' + featured.quality + '</span>' +
    '<span>•</span>' +
    '<span>' + featured.year + '</span>' +
    '<span>•</span>' +
    '<span>' + (featured.downloads.length) + ' links</span>' +
    '</div>' +
    '<p class="hero-desc">' + escapeHtml((featured.info?.description || '').substring(0, 200)) + '</p>' +
    '<button class="hero-btn" onclick="openDetail(' + featured.id + ')">▶ Watch Now</button>' +
    '</div>';
}

function renderCarousel() {
  const el = document.getElementById('trendingCarousel');
  const trending = ANIME_DB.filter(a => a.downloads.length > 0).slice(0, 20);
  el.innerHTML = trending.map(a => {
    const typeBadge = getAudio(a.categories) === 'hindi' ? '<span class="badge dub">Hindi</span>' : '';
    return '<div class="carousel-item" onclick="openDetail(' + a.id + ')">' +
      '<div class="poster">' +
      '<img src="' + a.poster + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
      '<div class="play-overlay"><div class="play-btn">▶</div></div>' +
      typeBadge +
      '</div>' +
      '<div class="title">' + escapeHtml(a.title.substring(0, 50)) + '</div>' +
      '<div class="meta">' + a.quality + ' • ' + a.year + '</div>' +
      '</div>';
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
  
  return '<div class="anime-card" onclick="openDetail(' + a.id + ')">' +
    '<div class="poster">' +
    '<img src="' + a.poster + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
    '<div class="overlay"><div class="play-circle">▶</div></div>' +
    badge +
    (a.downloads.length ? '<span class="ep-badge">' + a.downloads.length + ' EP</span>' : '') +
    '</div>' +
    '<div class="info">' +
    '<div class="title">' + escapeHtml(a.title.substring(0, 60)) + '</div>' +
    '<div class="meta">' + a.quality + ' • ' + a.year + '</div>' +
    '</div></div>';
}

// ── Navigation ────────────────────────────────────────────
function navigateTo(section) {
  currentSection = section;
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  document.querySelector('.nav-link[data-section="' + section + '"]')?.classList.add('active');
  
  ['homeSection', 'trendingSection', 'scheduleSection', 'moviesSection', 'watchlistSection', 'searchSection'].forEach(id => {
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
      renderTrendingPage();
      break;
    case 'schedule':
      document.getElementById('scheduleSection').style.display = '';
      renderSchedule();
      break;
    case 'movies':
      document.getElementById('moviesSection').style.display = '';
      renderMovies();
      break;
    case 'watchlist':
      document.getElementById('watchlistSection').style.display = '';
      renderWatchlistPage();
      break;
  }
  window.scrollTo(0, 0);
}

function renderTrendingPage() {
  const el = document.getElementById('trendingGrid');
  el.innerHTML = ANIME_DB.filter(a => a.downloads.length > 0).slice(0, 100).map(cardHTML).join('');
}

function renderMovies() {
  const el = document.getElementById('moviesGrid');
  el.innerHTML = ANIME_DB.filter(a => a.title.toLowerCase().includes('movie')).slice(0, 50).map(cardHTML).join('');
}

function renderSchedule() {
  const el = document.getElementById('scheduleGrid');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  el.innerHTML = days.map(day => {
    const shows = ANIME_DB.filter(a => a.downloads.length > 0).slice(0, 5);
    return '<div class="schedule-card"><div class="schedule-day">' + day + '</div>' +
      shows.map(a => '<div class="schedule-item" onclick="openDetail(' + a.id + ')">' +
        '<img src="' + a.poster + '" alt="" onerror="this.style.display=\'none\'">' +
        '<div class="info"><div class="title">' + escapeHtml(a.title.substring(0, 40)) + '</div>' +
        '<div class="time">' + a.quality + '</div></div></div>').join('') +
      '</div>';
  }).join('');
}

function renderWatchlistPage() {
  const el = document.getElementById('watchlistGrid');
  const wl = ANIME_DB.filter(a => watchlist.includes(a.slug));
  if (wl.length === 0) {
    el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">No anime in watchlist yet</div>';
    return;
  }
  el.innerHTML = wl.map(cardHTML).join('');
}

// ── Detail Modal ──────────────────────────────────────────
function openDetail(id) {
  const a = ANIME_DB.find(x => x.id === id);
  if (!a) return;
  
  const overlay = document.getElementById('detailOverlay');
  const modal = document.getElementById('detailModal');
  const content = document.getElementById('detailContent');
  
  const audio = getAudio(a.categories);
  let badges = '';
  if (audio === 'hindi') badges += '<span class="badge badge-red">Hindi Dubbed</span>';
  if (audio === 'dub') badges += '<span class="badge badge-purple">Dub</span>';
  if (audio === 'sub') badges += '<span class="badge badge-green">Sub</span>';
  if (a.categories.includes('10bit-hevc')) badges += '<span class="badge badge-yellow">HEVC</span>';
  if (a.info?.rating) badges += '<span class="badge badge-yellow">⭐ ' + a.info.rating + '</span>';
  
  let html = '<div class="detail-hero"><img src="' + a.poster + '" alt="" onerror="this.style.display=\'none\'"><div class="gradient"></div></div>';
  html += '<div class="detail-info">';
  html += '<h1 class="detail-title">' + escapeHtml(a.title) + '</h1>';
  html += '<div class="detail-badges">' + badges + '</div>';
  html += '<div class="detail-meta">';
  html += '<span>' + a.quality + '</span>';
  html += '<span>' + a.year + '</span>';
  html += '<span>' + (a.audio === 'triple' ? 'Triple Audio' : a.audio === 'dub' ? 'Dual Audio' : audio === 'hindi' ? 'Hindi' : 'Sub') + '</span>';
  html += '<span>' + a.downloads.length + ' episodes</span>';
  html += '</div>';
  
  if (a.info?.description) {
    html += '<p class="detail-desc">' + escapeHtml(a.info.description).substring(0, 400) + '</p>';
  }
  
  // Actions
  html += '<div class="detail-actions">';
  if (a.playLink) {
    html += '<button class="btn btn-primary" onclick="showPlayer(\'' + a.playLink + '\')">▶ Watch Online</button>';
  }
  html += '<button class="btn btn-outline" onclick="toggleWatchlist(\'' + a.slug + '\')">' + (watchlist.includes(a.slug) ? '★ Saved' : '☆ Save') + '</button>';
  html += '</div>';
  
  // Player (hidden by default)
  html += '<div class="player-section" id="playerSection" style="display:none"><h3>▶ Now Playing</h3><div class="player-wrap" id="playerWrap"></div></div>';
  
  // Downloads
  if (a.downloads.length > 0) {
    html += '<div class="downloads-section"><h3>⬇ Download (' + a.downloads.length + ')</h3><div class="dl-list">';
    a.downloads.forEach((link, i) => {
      html += '<a href="' + link + '" target="_blank" class="dl-item">' +
        '<span class="dl-ep">Episode ' + (i + 1) + '</span>' +
        '<span class="dl-provider">' + getProvider(link) + '</span>' +
        '</a>';
    });
    html += '</div></div>';
  }
  
  html += '</div>';
  
  content.innerHTML = html;
  modal.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  document.getElementById('detailModal').classList.remove('open');
  document.getElementById('detailOverlay').classList.remove('open');
  document.body.style.overflow = '';
  // Stop player
  document.getElementById('playerWrap').innerHTML = '';
}

function showPlayer(url) {
  const section = document.getElementById('playerSection');
  const wrap = document.getElementById('playerWrap');
  section.style.display = '';
  wrap.innerHTML = '<iframe src="' + url + '" allowfullscreen></iframe>';
  section.scrollIntoView({ behavior: 'smooth' });
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
  if (!query) {
    if (currentSection === 'search') navigateTo('home');
    return;
  }
  
  ['homeSection', 'trendingSection', 'scheduleSection', 'moviesSection', 'watchlistSection'].forEach(id => {
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
  if (idx >= 0) {
    watchlist.splice(idx, 1);
    showToast('Removed from watchlist');
  } else {
    watchlist.push(slug);
    showToast('Added to watchlist');
  }
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
  if (wl.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">No saved anime</div>';
    return;
  }
  el.innerHTML = wl.map(a => '<div class="wl-item" onclick="openDetail(' + a.id + ');toggleWatchlistPanel()">' +
    '<img src="' + a.poster + '" alt="" onerror="this.style.display=\'none\'">' +
    '<div><div class="title">' + escapeHtml(a.title.substring(0, 50)) + '</div></div>' +
    '<span class="remove" onclick="event.stopPropagation();toggleWatchlist(\'' + a.slug + '\');renderWLPanel()">✕</span>' +
    '</div>').join('');
}

// ── AI Panel ──────────────────────────────────────────────
function toggleAiPanel() {
  aiOpen = !aiOpen;
  document.getElementById('aiPanel').classList.toggle('open', aiOpen);
}

function askAI(type) {
  const input = document.getElementById('aiInput');
  if (type === 'recommend') input.value = 'Recommend some anime';
  else if (type === 'trending') input.value = 'What is trending?';
  else if (type === 'new') input.value = 'What is new?';
  sendAiMessage();
}

function sendAiMessage() {
  const input = document.getElementById('aiInput');
  const messages = document.getElementById('aiMessages');
  if (!input.value.trim()) return;
  
  const userMsg = document.createElement('div');
  userMsg.className = 'ai-msg user';
  userMsg.textContent = input.value;
  messages.appendChild(userMsg);
  
  const q = input.value.toLowerCase();
  input.value = '';
  
  setTimeout(() => {
    const botMsg = document.createElement('div');
    botMsg.className = 'ai-msg bot';
    
    let response = '';
    if (q.includes('recommend') || q.includes('suggest')) {
      const picks = ANIME_DB.filter(a => a.downloads.length > 0).sort(() => Math.random() - 0.5).slice(0, 5);
      response = 'Top picks:\n\n' + picks.map(a => '• ' + a.title.substring(0, 50)).join('\n');
    } else if (q.includes('trending')) {
      response = 'Trending:\n\n' + ANIME_DB.filter(a => a.downloads.length > 0).slice(0, 5).map(a => '• ' + a.title.substring(0, 50)).join('\n');
    } else if (q.includes('new')) {
      response = 'Latest:\n\n' + [...ANIME_DB].sort((a, b) => (b.created || '').localeCompare(a.created || '')).slice(0, 5).map(a => '• ' + a.title.substring(0, 50)).join('\n');
    } else {
      response = 'Try asking:\n• "Recommend anime"\n• "What\'s trending?"\n• "What\'s new?"';
    }
    
    botMsg.textContent = response;
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
  }, 400);
}

// ── Mobile ────────────────────────────────────────────────
function toggleMobileMenu() {
  document.getElementById('mobileNav').classList.toggle('open');
}
function closeMobileMenu() {
  document.getElementById('mobileNav').classList.remove('open');
}

// ── Utilities ─────────────────────────────────────────────
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// Expose
window.navigateTo = navigateTo;
window.openDetail = openDetail;
window.closeDetail = closeDetail;
window.showPlayer = showPlayer;
window.toggleSearch = toggleSearch;
window.handleSearch = handleSearch;
window.toggleWatchlist = toggleWatchlist;
window.toggleWatchlistPanel = toggleWatchlistPanel;
window.toggleAiPanel = toggleAiPanel;
window.askAI = askAI;
window.sendAiMessage = sendAiMessage;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.loadMore = loadMore;
