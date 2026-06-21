/* ============================================================
   AnimeStream — Full pikahd.co Clone with Dynamic Data
   Loads 1455 anime from scraped JSON
   ============================================================ */

// ── State ──────────────────────────────────────────────────
let ANIME_DB = [];
let DOWNLOAD_DB = {};
let filteredAnime = [];
let currentSection = 'home';
let aiPanelOpen = false;
let sidebarCollapsed = false;
let searchTimeout = null;
let notifOpen = false;
let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
let currentView = 'grid';

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadAnimeData();
  setupEventListeners();
  renderAnime();
  initScrollReveal();
  renderWatchlist();
  renderTrending();
  renderNewReleases();
  renderNewEpisodes();
  document.getElementById('loadingOverlay')?.classList.add('hidden');
});

async function loadAnimeData() {
  try {
    const res = await fetch('pikahd-complete/02-all-detailed.json');
    const data = await res.json();
    ANIME_DB = data.map((a, i) => ({
      id: i + 1,
      title: a.title || 'Unknown',
      slug: a.slug,
      poster: a.thumbnail || '',
      thumbnail: a.thumbnail || '',
      categories: a.categories || [],
      quality: a.info?.quality || 'HD',
      audio: detectAudio(a.categories),
      rating: parseFloat(a.info?.rating) || 0,
      year: extractYear(a.created),
      episodes: 'Ongoing',
      status: 'Airing',
      pikahd: a.url || `https://new.pikahd.co/${a.slug}`,
      info: a.info || {},
      storyline: a.storyline || '',
      downloads: a.downloads || [],
      playLink: a.playLink || '',
      created: a.created || ''
    }));
    filteredAnime = [...ANIME_DB];
    console.log(`Loaded ${ANIME_DB.length} anime`);
  } catch (e) {
    console.error('Failed to load anime data:', e);
    ANIME_DB = [];
    filteredAnime = [];
  }
}

function detectAudio(cats) {
  if (!cats) return 'hindi';
  if (cats.includes('triple-audio') || cats.includes('triple-audio-anime-hindi-dubbed')) return 'triple';
  if (cats.includes('dual-audio')) return 'dual';
  return 'hindi';
}

function extractYear(created) {
  if (!created) return 2026;
  const y = created.match(/\d{4}/);
  return y ? parseInt(y[0]) : 2026;
}

// ── Render Anime Grid ──────────────────────────────────────
function renderAnime() {
  const grid = document.getElementById('animeGrid');
  if (!grid) return;
  
  if (filteredAnime.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
        <div style="font-size:48px;margin-bottom:16px;">🔍</div>
        <h3 style="color:var(--text-secondary);margin-bottom:8px;">No anime found</h3>
        <p style="color:var(--text-muted);font-size:13px;">Try a different search term or category</p>
      </div>`;
    updateStats();
    return;
  }

  grid.innerHTML = filteredAnime.map((a, i) => {
    const cats = a.categories || [];
    const badges = [];
    if (cats.includes('18+') || cats.includes('adult')) badges.push('<span class="anime-badge badge-18">18+</span>');
    if (cats.includes('dual-audio')) badges.push('<span class="anime-badge badge-dual">Dual</span>');
    if (cats.includes('triple-audio') || cats.includes('triple-audio-anime-hindi-dubbed')) badges.push('<span class="anime-badge badge-hindi">Triple</span>');
    if (cats.includes('anime-hindi-dubbed') || cats.includes('hindi-dubbed')) badges.push('<span class="anime-badge badge-hindi">Hindi</span>');
    if (cats.includes('10bit-hevc')) badges.push('<span class="anime-badge badge-hevc">HEVC</span>');
    
    const isWl = watchlist.includes(a.slug);
    const titleShort = (a.title || '').length > 80 ? a.title.substring(0, 80) + '...' : (a.title || '');
    
    return `
    <div class="anime-card" data-id="${a.id}" onclick="openDetail(${a.id})">
      <div class="anime-card-poster">
        <img src="${a.poster || a.thumbnail || ''}" alt="${escapeHtml(titleShort)}" loading="lazy"
          onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 200 280\\'><rect fill=\\'%231a1a1a\\' width=\\'200\\' height=\\'280\\'/><text fill=\\'%23666\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' font-size=\\'14\\'>No Image</text></svg>'">
        <div class="anime-card-overlay">
          <div class="anime-card-play">
            <button class="anime-card-play-btn" onclick="event.stopPropagation();playAnime(${a.id})">▶</button>
          </div>
        </div>
        ${badges.length > 0 ? '<div class="anime-card-badges">' + badges.join('') + '</div>' : ''}
        <div class="anime-card-quality">${a.quality || 'HD'}</div>
      </div>
      <div class="anime-card-info">
        <h3 class="anime-card-title" title="${escapeHtml(a.title || '')}">${escapeHtml(titleShort)}</h3>
        <div class="anime-card-meta">${a.audio === 'triple' ? 'Triple Audio' : a.audio === 'dual' ? 'Dual Audio' : 'Hindi'}</div>
      </div>
    </div>`;
  }).join('');

  updateStats();
}

function updateStats() {
  const el = document.getElementById('animeCount');
  if (el) el.textContent = filteredAnime.length;
  const dlEl = document.getElementById('downloadCount');
  if (dlEl) {
    const total = filteredAnime.reduce((s, a) => s + (a.downloads || []).length, 0);
    dlEl.textContent = total;
  }
}

// ── Detail Modal ───────────────────────────────────────────
function openDetail(id) {
  const a = ANIME_DB.find(x => x.id === id);
  if (!a) return;
  
  const modal = document.getElementById('detailModal');
  const poster = document.getElementById('detailPoster');
  const body = document.getElementById('detailBody');
  const title = document.getElementById('detailTitle');
  
  title.textContent = (a.title || '').substring(0, 100);
  poster.src = a.poster || a.thumbnail || '';
  
  const cats = a.categories || [];
  const badges = [];
  if (cats.includes('dual-audio')) badges.push('<span class="badge badge-blue">Dual Audio</span>');
  if (cats.includes('triple-audio') || cats.includes('triple-audio-anime-hindi-dubbed')) badges.push('<span class="badge badge-purple">Triple Audio</span>');
  if (cats.includes('anime-hindi-dubbed') || cats.includes('hindi-dubbed')) badges.push('<span class="badge badge-orange">Hindi Dubbed</span>');
  if (cats.includes('10bit-hevc')) badges.push('<span class="badge badge-green">HEVC 10bit</span>');
  if (a.info?.rating) badges.push('<span class="badge badge-yellow">⭐ ' + a.info.rating + '</span>');
  
  let html = `
    <div class="detail-badges">${badges.join('')}</div>
    <div class="detail-meta-grid">
      <div class="meta-item"><span class="meta-label">Quality</span><span class="meta-value">${a.quality || 'HD'}</span></div>
      <div class="meta-item"><span class="meta-label">Audio</span><span class="meta-value">${a.audio === 'triple' ? 'Hindi + Eng + Jap' : a.audio === 'dual' ? 'Hindi + Eng/Jap' : 'Hindi'}</span></div>
      <div class="meta-item"><span class="meta-label">Year</span><span class="meta-value">${a.year || 'N/A'}</span></div>
      <div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">${a.status || 'Ongoing'}</span></div>
      ${a.info?.language ? '<div class="meta-item"><span class="meta-label">Language</span><span class="meta-value">' + a.info.language + '</span></div>' : ''}
      ${a.info?.genres ? '<div class="meta-item"><span class="meta-label">Genres</span><span class="meta-value">' + a.info.genres + '</span></div>' : ''}
      ${a.info?.stars ? '<div class="meta-item"><span class="meta-label">Stars</span><span class="meta-value">' + a.info.stars.substring(0, 80) + '</span></div>' : ''}
    </div>`;

  if (a.info?.description) {
    html += `<div class="detail-desc"><p>${escapeHtml(a.info.description).substring(0, 500)}</p></div>`;
  }
  if (a.storyline) {
    html += `<div class="detail-desc"><h4>Storyline</h4><p>${escapeHtml(a.storyline).substring(0, 600)}</p></div>`;
  }

  if (a.playLink) {
    html += `<div class="detail-actions"><a href="${a.playLink}" target="_blank" class="btn btn-orange">▶ Watch Online</a></div>`;
  }

  if (a.downloads && a.downloads.length > 0) {
    html += `<div class="detail-downloads">
      <h4>⬇ Download Links (${a.downloads.length})</h4>
      <div class="dl-grid">`;
    a.downloads.forEach((link, i) => {
      const provider = getProvider(link);
      const label = extractLabel(link, i);
      html += `<a href="${link}" target="_blank" class="dl-item">
        <span class="dl-provider">${provider}</span>
        <span class="dl-label">${label}</span>
      </a>`;
    });
    html += `</div>
      <button class="btn btn-outline" style="margin-top:12px;width:100%" onclick="copyAllLinks(${a.id})">📋 Copy All Links</button>
    </div>`;
  } else {
    html += `<div class="detail-downloads"><p style="color:var(--text-muted);text-align:center;padding:20px;">No download links available</p></div>`;
  }

  html += `<div style="text-align:center;margin-top:16px;"><a href="${a.pikahd}" target="_blank" class="btn btn-outline" style="font-size:11px;">🔗 View on pikahd.co</a></div>`;

  body.innerHTML = html;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  document.getElementById('detailModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

function getProvider(link) {
  if (link.includes('gdflix')) return '📁 GDFlix';
  if (link.includes('katdrive')) return '📁 KatDrive';
  if (link.includes('gd.kmhd')) return '📁 GD Cloud';
  if (link.includes('links.kmhd')) return '📁 KMHD';
  return '📁 Download';
}

function extractLabel(link, idx) {
  try {
    const parts = link.split('/');
    const filename = parts[parts.length - 1] || parts[parts.length - 2] || '';
    if (filename.length > 3) return decodeURIComponent(filename).substring(0, 30);
    return 'Link ' + (idx + 1);
  } catch { return 'Link ' + (idx + 1); }
}

function copyAllLinks(id) {
  const a = ANIME_DB.find(x => x.id === id);
  if (!a || !a.downloads) return;
  const text = a.downloads.join('\n');
  navigator.clipboard.writeText(text).then(() => showSuccessToast('All links copied!'));
}

function playAnime(id) {
  const a = ANIME_DB.find(x => x.id === id);
  if (a?.playLink) window.open(a.playLink, '_blank');
  else openDetail(id);
}

// ── Navigation ─────────────────────────────────────────────
function navigateTo(section) {
  currentSection = section;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
  
  const mainContent = document.getElementById('mainContent');
  const animeGridSection = document.getElementById('animeGridSection');
  const watchlistSection = document.getElementById('watchlistSection');
  const trendingSection = document.getElementById('trendingSection');
  const newReleasesSection = document.getElementById('newReleasesSection');
  const newEpisodesSection = document.getElementById('newEpisodesSection');

  [animeGridSection, watchlistSection, trendingSection, newReleasesSection, newEpisodesSection].forEach(s => {
    if (s) s.style.display = 'none';
  });

  switch(section) {
    case 'home':
    case 'all':
      if (animeGridSection) animeGridSection.style.display = '';
      filteredAnime = [...ANIME_DB];
      renderAnime();
      break;
    case 'trending':
      if (trendingSection) trendingSection.style.display = '';
      renderTrending();
      break;
    case 'new-releases':
      if (newReleasesSection) newReleasesSection.style.display = '';
      renderNewReleases();
      break;
    case 'new-episodes':
      if (newEpisodesSection) newEpisodesSection.style.display = '';
      renderNewEpisodes();
      break;
    case 'watchlist':
      if (watchlistSection) watchlistSection.style.display = '';
      renderWatchlist();
      break;
    case 'search':
      if (animeGridSection) animeGridSection.style.display = '';
      document.getElementById('searchInput')?.focus();
      break;
    default:
      if (animeGridSection) animeGridSection.style.display = '';
      filteredAnime = [...ANIME_DB];
      renderAnime();
  }
}

function filterByCategory(cat) {
  navigateTo('all');
  filteredAnime = ANIME_DB.filter(a => (a.categories || []).includes(cat));
  renderAnime();
}

// ── Search ─────────────────────────────────────────────────
function handleSearch(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const q = query.toLowerCase().trim();
    if (!q) { filteredAnime = [...ANIME_DB]; }
    else {
      filteredAnime = ANIME_DB.filter(a => 
        (a.title || '').toLowerCase().includes(q) ||
        (a.slug || '').toLowerCase().includes(q) ||
        (a.categories || []).some(c => c.includes(q)) ||
        (a.info?.genres || '').toLowerCase().includes(q)
      );
    }
    renderAnime();
  }, 200);
}

// ── Watchlist ──────────────────────────────────────────────
function toggleWatchlist(slug) {
  const idx = watchlist.indexOf(slug);
  if (idx >= 0) { watchlist.splice(idx, 1); showSuccessToast('Removed from watchlist'); }
  else { watchlist.push(slug); showSuccessToast('Added to watchlist'); }
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  renderAnime();
}

function renderWatchlist() {
  const container = document.getElementById('watchlistGrid');
  if (!container) return;
  const wlAnime = ANIME_DB.filter(a => watchlist.includes(a.slug));
  if (wlAnime.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;"><p style="color:var(--text-muted)">No anime in watchlist yet</p></div>';
    return;
  }
  container.innerHTML = wlAnime.map(a => `
    <div class="anime-card" onclick="openDetail(${a.id})">
      <div class="anime-card-poster">
        <img src="${a.poster || a.thumbnail || ''}" alt="" loading="lazy"
          onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 200 280\\'><rect fill=\\'%231a1a1a\\' width=\\'200\\' height=\\'280\\'/><text fill=\\'%23666\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' font-size=\\'14\\'>No Image</text></svg>'">
        <div class="anime-card-overlay"><div class="anime-card-play"><button class="anime-card-play-btn" onclick="event.stopPropagation();playAnime(${a.id})">▶</button></div></div>
      </div>
      <div class="anime-card-info">
        <h3 class="anime-card-title">${escapeHtml((a.title || '').substring(0, 60))}</h3>
      </div>
    </div>`).join('');
}

// ── Trending / New Releases / New Episodes ─────────────────
function renderTrending() {
  const container = document.getElementById('trendingGrid');
  if (!container) return;
  const trending = ANIME_DB.filter(a => (a.downloads || []).length > 0).slice(0, 24);
  container.innerHTML = trending.map(a => `
    <div class="anime-card" onclick="openDetail(${a.id})">
      <div class="anime-card-poster">
        <img src="${a.poster || a.thumbnail || ''}" alt="" loading="lazy"
          onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 200 280\\'><rect fill=\\'%231a1a1a\\' width=\\'200\\' height=\\'280\\'/><text fill=\\'%23666\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' font-size=\\'14\\'>No Image</text></svg>'">
        <div class="anime-card-overlay"><div class="anime-card-play"><button class="anime-card-play-btn" onclick="event.stopPropagation();playAnime(${a.id})">▶</button></div></div>
      </div>
      <div class="anime-card-info">
        <h3 class="anime-card-title">${escapeHtml((a.title || '').substring(0, 60))}</h3>
      </div>
    </div>`).join('');
}

function renderNewReleases() {
  const container = document.getElementById('newReleasesGrid');
  if (!container) return;
  const sorted = [...ANIME_DB].sort((a, b) => (b.created || '').localeCompare(a.created || '')).slice(0, 24);
  container.innerHTML = sorted.map(a => `
    <div class="anime-card" onclick="openDetail(${a.id})">
      <div class="anime-card-poster">
        <img src="${a.poster || a.thumbnail || ''}" alt="" loading="lazy"
          onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 200 280\\'><rect fill=\\'%231a1a1a\\' width=\\'200\\' height=\\'280\\'/><text fill=\\'%23666\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' font-size=\\'14\\'>No Image</text></svg>'">
        <div class="anime-card-overlay"><div class="anime-card-play"><button class="anime-card-play-btn" onclick="event.stopPropagation();playAnime(${a.id})">▶</button></div></div>
      </div>
      <div class="anime-card-info">
        <h3 class="anime-card-title">${escapeHtml((a.title || '').substring(0, 60))}</h3>
      </div>
    </div>`).join('');
}

function renderNewEpisodes() {
  const container = document.getElementById('newEpisodesGrid');
  if (!container) return;
  const recent = ANIME_DB.filter(a => (a.downloads || []).length > 0).slice(0, 24);
  container.innerHTML = recent.map(a => `
    <div class="anime-card" onclick="openDetail(${a.id})">
      <div class="anime-card-poster">
        <img src="${a.poster || a.thumbnail || ''}" alt="" loading="lazy"
          onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 200 280\\'><rect fill=\\'%231a1a1a\\' width=\\'200\\' height=\\'280\\'/><text fill=\\'%23666\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' font-size=\\'14\\'>No Image</text></svg>'">
        <div class="anime-card-overlay"><div class="anime-card-play"><button class="anime-card-play-btn" onclick="event.stopPropagation();playAnime(${a.id})">▶</button></div></div>
      </div>
      <div class="anime-card-info">
        <h3 class="anime-card-title">${escapeHtml((a.title || '').substring(0, 60))}</h3>
      </div>
    </div>`).join('');
}

// ── AI Panel ───────────────────────────────────────────────
function toggleAiPanel() {
  aiPanelOpen = !aiPanelOpen;
  const panel = document.getElementById('aiPanel');
  if (panel) panel.classList.toggle('open', aiPanelOpen);
}

function sendAiMessage() {
  const input = document.getElementById('aiInput');
  const messages = document.getElementById('aiMessages');
  if (!input || !messages || !input.value.trim()) return;
  
  const userMsg = document.createElement('div');
  userMsg.className = 'ai-msg user-msg';
  userMsg.textContent = input.value;
  messages.appendChild(userMsg);
  
  const query = input.value.toLowerCase();
  input.value = '';
  
  setTimeout(() => {
    const botMsg = document.createElement('div');
    botMsg.className = 'ai-msg bot-msg';
    
    const q = query;
    let response = '';
    
    if (q.includes('recommend') || q.includes('suggest')) {
      const picks = ANIME_DB.filter(a => (a.downloads || []).length > 0).sort(() => Math.random() - 0.5).slice(0, 5);
      response = 'Here are some recommendations:\n\n' + picks.map(a => `• ${a.title.substring(0, 60)} (${(a.downloads || []).length} links)`).join('\n');
    } else if (q.includes('trending') || q.includes('popular')) {
      const trending = ANIME_DB.filter(a => (a.downloads || []).length > 5).slice(0, 5);
      response = 'Trending now:\n\n' + trending.map(a => `• ${a.title.substring(0, 60)}`).join('\n');
    } else if (q.includes('new') || q.includes('latest')) {
      const newest = [...ANIME_DB].sort((a, b) => (b.created || '').localeCompare(a.created || '')).slice(0, 5);
      response = 'Latest releases:\n\n' + newest.map(a => `• ${a.title.substring(0, 60)}`).join('\n');
    } else if (q.includes('search') || q.includes('find')) {
      const term = q.replace(/search|find|for|anime/g, '').trim();
      const results = ANIME_DB.filter(a => (a.title || '').toLowerCase().includes(term)).slice(0, 5);
      response = results.length > 0 
        ? `Found ${results.length} results:\n\n` + results.map(a => `• ${a.title.substring(0, 60)}`).join('\n')
        : `No results for "${term}". Try a different search.`;
    } else {
      response = `I can help you find anime! Try asking me to:\n\n• "Recommend some anime"\n• "What's trending?"\n• "Find [anime name]"\n• "What's new?"`;
    }
    
    botMsg.textContent = response;
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
  }, 500);
}

// ── Notifications Panel ────────────────────────────────────
function toggleNotifs() {
  notifOpen = !notifOpen;
  document.querySelector('.notif-panel')?.classList.toggle('open', notifOpen);
}

// ── Sidebar Toggle ─────────────────────────────────────────
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  document.querySelector('.sidebar')?.classList.toggle('collapsed', sidebarCollapsed);
  document.querySelector('.main-area')?.classList.toggle('sidebar-collapsed', sidebarCollapsed);
}

// ── n8n Toggles ────────────────────────────────────────────
function toggleWorkflow(id) {
  const toggle = document.getElementById(id);
  if (toggle) {
    toggle.classList.toggle('active');
    const isActive = toggle.classList.contains('active');
    showSuccessToast(`${id.replace(/-/g, ' ')} ${isActive ? 'enabled' : 'disabled'}`);
  }
}

// ── Scroll Reveal ──────────────────────────────────────────
function initScrollReveal() {
  const elements = document.querySelectorAll('.section-header, .anime-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-revealed');
    });
  }, { threshold: 0.1 });
  elements.forEach(el => {
    el.classList.remove('is-revealed');
    observer.observe(el);
  });
}

// ── Utilities ──────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showSuccessToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:80px;right:24px;background:var(--bg-elevated);color:var(--text-primary);padding:10px 16px;border-radius:8px;font-size:13px;z-index:600;border:1px solid var(--border);box-shadow:0 4px 16px rgba(0,0,0,0.3)';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 2000);
}

function setupEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDetail();
      if (aiPanelOpen) toggleAiPanel();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-btn') && !e.target.closest('.notif-panel') && notifOpen) toggleNotifs();
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }
}

// ── Expose to global ──────────────────────────────────────
window.navigateTo = navigateTo;
window.openDetail = openDetail;
window.closeDetail = closeDetail;
window.playAnime = playAnime;
window.toggleWatchlist = toggleWatchlist;
window.toggleAiPanel = toggleAiPanel;
window.sendAiMessage = sendAiMessage;
window.toggleNotifs = toggleNotifs;
window.toggleSidebar = toggleSidebar;
window.toggleWorkflow = toggleWorkflow;
window.filterByCategory = filterByCategory;
window.handleSearch = handleSearch;
window.copyAllLinks = copyAllLinks;
