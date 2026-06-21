/* ============================================================
   AnimeStream — Full pikahd.co Clone with Dynamic Data
   Fixed: Detail Modal, Navigation, Workflow Toggles
   ============================================================ */

let ANIME_DB = [];
let filteredAnime = [];
let currentSection = 'home';
let aiPanelOpen = false;
let sidebarOpen = false;
let searchTimeout = null;
let notifOpen = false;
let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadAnimeData();
  setupEventListeners();
  renderAnime();
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
    updateStats();
    console.log(`Loaded ${ANIME_DB.length} anime`);
  } catch (e) {
    console.error('Failed to load anime data:', e);
    ANIME_DB = [];
    filteredAnime = [];
  }
}

function detectAudio(cats) {
  if (!cats) return 'hindi';
  if (cats.some(c => c.includes('triple'))) return 'triple';
  if (cats.some(c => c.includes('dual'))) return 'dual';
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
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;"><div style="font-size:48px;margin-bottom:16px;">🔍</div><h3 style="color:var(--text-secondary);margin-bottom:8px;">No anime found</h3><p style="color:var(--text-muted);font-size:13px;">Try a different search term or category</p></div>';
    updateStats();
    return;
  }

  grid.innerHTML = filteredAnime.map(a => {
    const cats = a.categories || [];
    const badges = [];
    if (cats.includes('18+') || cats.includes('adult')) badges.push('<span class="anime-badge badge-18">18+</span>');
    if (cats.includes('dual-audio')) badges.push('<span class="anime-badge badge-dual">Dual</span>');
    if (cats.some(c => c.includes('triple'))) badges.push('<span class="anime-badge badge-hindi">Triple</span>');
    if (cats.some(c => c.includes('hindi'))) badges.push('<span class="anime-badge badge-hindi">Hindi</span>');
    if (cats.includes('10bit-hevc')) badges.push('<span class="anime-badge badge-hevc">HEVC</span>');
    
    const titleShort = (a.title || '').length > 80 ? a.title.substring(0, 80) + '...' : (a.title || '');
    
    return '<div class="anime-card" onclick="openDetail(' + a.id + ')"><div class="anime-card-poster"><img src="' + (a.poster || '') + '" alt="" loading="lazy" onerror="this.style.display=\'none\'"><div class="anime-card-overlay"><div class="anime-card-play"><button class="anime-card-play-btn" onclick="event.stopPropagation();playAnime(' + a.id + ')">▶</button></div></div>' + (badges.length ? '<div class="anime-card-badges">' + badges.join('') + '</div>' : '') + '<div class="anime-card-quality">' + (a.quality || 'HD') + '</div></div><div class="anime-card-info"><h3 class="anime-card-title">' + escapeHtml(titleShort) + '</h3><div class="anime-card-meta">' + (a.audio === 'triple' ? 'Triple Audio' : a.audio === 'dual' ? 'Dual Audio' : 'Hindi') + '</div></div></div>';
  }).join('');

  updateStats();
}

function updateStats() {
  const el = document.getElementById('animeCount');
  if (el) el.textContent = filteredAnime.length;
  const dlEl = document.getElementById('downloadCount');
  if (dlEl) {
    dlEl.textContent = filteredAnime.reduce((s, a) => s + (a.downloads || []).length, 0);
  }
}

// ── Detail Modal ───────────────────────────────────────────
function openDetail(id) {
  const a = ANIME_DB.find(x => x.id === id);
  if (!a) return;
  
  const modal = document.getElementById('detailModal');
  const backdrop = document.getElementById('detailBackdrop');
  const body = document.getElementById('detailBody');
  const title = document.getElementById('detailTitle');
  
  title.textContent = (a.title || '').substring(0, 100);
  
  const cats = a.categories || [];
  const badges = [];
  if (cats.includes('dual-audio')) badges.push('<span class="badge badge-blue">Dual Audio</span>');
  if (cats.some(c => c.includes('triple'))) badges.push('<span class="badge badge-purple">Triple Audio</span>');
  if (cats.some(c => c.includes('hindi'))) badges.push('<span class="badge badge-orange">Hindi Dubbed</span>');
  if (cats.includes('10bit-hevc')) badges.push('<span class="badge badge-green">HEVC 10bit</span>');
  if (a.info?.rating) badges.push('<span class="badge badge-yellow">⭐ ' + a.info.rating + '</span>');
  
  let html = '';
  
  // Poster
  if (a.poster) {
    html += '<img class="detail-poster" src="' + a.poster + '" alt="" onerror="this.style.display=\'none\'">';
  }
  
  // Badges
  if (badges.length) {
    html += '<div class="detail-badges">' + badges.join('') + '</div>';
  }
  
  // Meta grid
  html += '<div class="detail-meta-grid">';
  html += '<div class="meta-item"><span class="meta-label">Quality</span><span class="meta-value">' + (a.quality || 'HD') + '</span></div>';
  html += '<div class="meta-item"><span class="meta-label">Audio</span><span class="meta-value">' + (a.audio === 'triple' ? 'Hindi + Eng + Jap' : a.audio === 'dual' ? 'Hindi + Eng/Jap' : 'Hindi') + '</span></div>';
  html += '<div class="meta-item"><span class="meta-label">Year</span><span class="meta-value">' + (a.year || 'N/A') + '</span></div>';
  html += '<div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">' + (a.status || 'Ongoing') + '</span></div>';
  if (a.info?.language) html += '<div class="meta-item"><span class="meta-label">Language</span><span class="meta-value">' + a.info.language + '</span></div>';
  if (a.info?.genres) html += '<div class="meta-item"><span class="meta-label">Genres</span><span class="meta-value">' + a.info.genres + '</span></div>';
  if (a.info?.stars) html += '<div class="meta-item"><span class="meta-label">Stars</span><span class="meta-value">' + (a.info.stars || '').substring(0, 80) + '</span></div>';
  html += '</div>';
  
  // Description
  if (a.info?.description) {
    html += '<div class="detail-desc"><p>' + escapeHtml(a.info.description).substring(0, 500) + '</p></div>';
  }
  if (a.storyline) {
    html += '<div class="detail-desc"><h4>Storyline</h4><p>' + escapeHtml(a.storyline).substring(0, 600) + '</p></div>';
  }
  
  // Action buttons
  html += '<div class="detail-actions">';
  if (a.playLink) {
    html += '<a href="' + a.playLink + '" target="_blank" class="btn btn-orange">▶ Watch Online</a>';
  }
  html += '<a href="' + a.pikahd + '" target="_blank" class="btn btn-outline">🔗 View on pikahd.co</a>';
  html += '</div>';
  
  // Download links
  if (a.downloads && a.downloads.length > 0) {
    html += '<div class="detail-downloads"><h4>⬇ Download Links (' + a.downloads.length + ')</h4><div class="dl-grid">';
    a.downloads.forEach((link, i) => {
      const provider = getProvider(link);
      const label = extractLabel(link, i);
      html += '<a href="' + link + '" target="_blank" class="dl-item"><span class="dl-provider">' + provider + '</span><span class="dl-label">' + label + '</span></a>';
    });
    html += '</div><button class="btn btn-outline" style="margin-top:12px;width:100%" onclick="copyAllLinks(' + a.id + ')">📋 Copy All Links</button></div>';
  } else {
    html += '<div class="detail-downloads"><p style="color:var(--text-muted);text-align:center;padding:20px;">No download links available</p></div>';
  }

  body.innerHTML = html;
  modal.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  document.getElementById('detailModal')?.classList.remove('open');
  document.getElementById('detailBackdrop')?.classList.remove('open');
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
  navigator.clipboard.writeText(a.downloads.join('\n')).then(() => showSuccessToast('All links copied!'));
}

function playAnime(id) {
  const a = ANIME_DB.find(x => x.id === id);
  if (a?.playLink) window.open(a.playLink, '_blank');
  else openDetail(id);
}

// ── Navigation ─────────────────────────────────────────────
function navigateTo(section) {
  currentSection = section;
  
  // Update sidebar active state
  document.querySelectorAll('.sidebar-link').forEach(n => n.classList.remove('active'));
  const activeLink = document.querySelector('.sidebar-link[data-section="' + section + '"]');
  if (activeLink) activeLink.classList.add('active');
  
  // Hide all sections
  ['animeGridSection', 'watchlistSection', 'trendingSection', 'newReleasesSection', 'newEpisodesSection'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Show target section and render
  switch(section) {
    case 'home':
    case 'all':
      document.getElementById('animeGridSection').style.display = '';
      filteredAnime = [...ANIME_DB];
      renderAnime();
      break;
    case 'trending':
      document.getElementById('trendingSection').style.display = '';
      renderTrending();
      break;
    case 'new-releases':
      document.getElementById('newReleasesSection').style.display = '';
      renderNewReleases();
      break;
    case 'new-episodes':
      document.getElementById('newEpisodesSection').style.display = '';
      renderNewEpisodes();
      break;
    case 'watchlist':
      document.getElementById('watchlistSection').style.display = '';
      renderWatchlist();
      break;
    default:
      document.getElementById('animeGridSection').style.display = '';
      filteredAnime = [...ANIME_DB];
      renderAnime();
  }
  
  // Close sidebar on mobile
  if (window.innerWidth < 768) toggleSidebar();
}

function filterByCategory(cat) {
  navigateTo('all');
  filteredAnime = ANIME_DB.filter(a => (a.categories || []).includes(cat));
  renderAnime();
}

// ── Render Section Pages ───────────────────────────────────
function renderCard(a) {
  const titleShort = (a.title || '').length > 60 ? a.title.substring(0, 60) + '...' : (a.title || '');
  return '<div class="anime-card" onclick="openDetail(' + a.id + ')"><div class="anime-card-poster"><img src="' + (a.poster || '') + '" alt="" loading="lazy" onerror="this.style.display=\'none\'"><div class="anime-card-overlay"><div class="anime-card-play"><button class="anime-card-play-btn" onclick="event.stopPropagation();playAnime(' + a.id + ')">▶</button></div></div></div><div class="anime-card-info"><h3 class="anime-card-title">' + escapeHtml(titleShort) + '</h3></div></div>';
}

function renderTrending() {
  const container = document.getElementById('trendingGrid');
  if (!container) return;
  container.innerHTML = ANIME_DB.filter(a => (a.downloads || []).length > 0).slice(0, 24).map(renderCard).join('');
}

function renderNewReleases() {
  const container = document.getElementById('newReleasesGrid');
  if (!container) return;
  container.innerHTML = [...ANIME_DB].sort((a, b) => (b.created || '').localeCompare(a.created || '')).slice(0, 24).map(renderCard).join('');
}

function renderNewEpisodes() {
  const container = document.getElementById('newEpisodesGrid');
  if (!container) return;
  container.innerHTML = ANIME_DB.filter(a => (a.downloads || []).length > 0).slice(0, 24).map(renderCard).join('');
}

function renderWatchlist() {
  const container = document.getElementById('watchlistGrid');
  if (!container) return;
  const wlAnime = ANIME_DB.filter(a => watchlist.includes(a.slug));
  if (wlAnime.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;"><p style="color:var(--text-muted)">No anime in watchlist yet</p></div>';
    return;
  }
  container.innerHTML = wlAnime.map(renderCard).join('');
}

// ── Watchlist ──────────────────────────────────────────────
function toggleWatchlist(slug) {
  const idx = watchlist.indexOf(slug);
  if (idx >= 0) { watchlist.splice(idx, 1); showSuccessToast('Removed from watchlist'); }
  else { watchlist.push(slug); showSuccessToast('Added to watchlist'); }
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
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
    // Show search results in main grid
    ['animeGridSection', 'watchlistSection', 'trendingSection', 'newReleasesSection', 'newEpisodesSection'].forEach(id => {
      document.getElementById(id).style.display = 'none';
    });
    document.getElementById('animeGridSection').style.display = '';
    renderAnime();
  }, 200);
}

// ── AI Panel ───────────────────────────────────────────────
function toggleAiPanel() {
  aiPanelOpen = !aiPanelOpen;
  document.getElementById('aiPanel')?.classList.toggle('open', aiPanelOpen);
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
    
    let response = '';
    if (query.includes('recommend') || query.includes('suggest')) {
      const picks = ANIME_DB.filter(a => (a.downloads || []).length > 0).sort(() => Math.random() - 0.5).slice(0, 5);
      response = 'Here are some recommendations:\n\n' + picks.map(a => '• ' + a.title.substring(0, 60) + ' (' + (a.downloads || []).length + ' links)').join('\n');
    } else if (query.includes('trending') || query.includes('popular')) {
      const trending = ANIME_DB.filter(a => (a.downloads || []).length > 5).slice(0, 5);
      response = 'Trending now:\n\n' + trending.map(a => '• ' + a.title.substring(0, 60)).join('\n');
    } else if (query.includes('new') || query.includes('latest')) {
      const newest = [...ANIME_DB].sort((a, b) => (b.created || '').localeCompare(a.created || '')).slice(0, 5);
      response = 'Latest releases:\n\n' + newest.map(a => '• ' + a.title.substring(0, 60)).join('\n');
    } else {
      response = 'I can help you find anime!\n\n• "Recommend some anime"\n• "What\'s trending?"\n• "Find [anime name]"\n• "What\'s new?"';
    }
    
    botMsg.textContent = response;
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
  }, 500);
}

// ── Sidebar ────────────────────────────────────────────────
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('sidebar')?.classList.toggle('open', sidebarOpen);
}

// ── Notifications ──────────────────────────────────────────
function toggleNotifs() {
  notifOpen = !notifOpen;
  document.getElementById('notifPanel')?.classList.toggle('open', notifOpen);
}

// ── n8n Toggles ────────────────────────────────────────────
function toggleWorkflow(id) {
  const toggle = document.getElementById(id);
  if (toggle) {
    toggle.classList.toggle('active');
    const isActive = toggle.classList.contains('active');
    showSuccessToast(id.replace('wf-', '').replace(/-/g, ' ') + (isActive ? ' enabled' : ' disabled'));
  }
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
      if (notifOpen) toggleNotifs();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-btn') && !e.target.closest('.notif-panel') && notifOpen) toggleNotifs();
  });
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
