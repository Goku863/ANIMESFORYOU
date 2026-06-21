/* ============================================================
   Miruro Clone — AniList API + HLS Player + SPA Router
   ============================================================ */

const ANILIST_API = 'https://graphql.anilist.co';
let allAnime = [];
let currentPage = 'home';
let currentAnime = null;
let currentEpisode = 0;
let hls = null;

// ── AniList GraphQL Queries ──────────────────────────────
const QUERIES = {
  trending: `query ($page: Int) {
    Page(page: $page, perPage: 20) {
      media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
        id title { romaji english } coverImage { large } bannerImage
        averageScore format status episodes nextAiringEpisode { episode }
        description
      }
    }
  }`,
  popular: `query ($page: Int) {
    Page(page: $page, perPage: 20) {
      media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
        id title { romaji english } coverImage { large } bannerImage
        averageScore format status episodes nextAiringEpisode { episode }
      }
    }
  }`,
  search: `query ($search: String, $page: Int) {
    Page(page: $page, perPage: 20) {
      media(search: $search, type: ANIME, isAdult: false) {
        id title { romaji english } coverImage { large } bannerImage
        averageScore format status episodes nextAiringEpisode { episode }
      }
    }
  }`,
  info: `query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id title { romaji english } coverImage { large } bannerImage
      description averageScore format status episodes duration season year
      nextAiringEpisode { episode }
      genres tags { name } studios(isMain: true) { nodes { name } }
      characters(sort: ROLE, perPage: 10) {
        nodes { name { full } image { medium } role }
      }
      relations {
        edges { node { id title { romaji } coverImage { large } format } relationType }
      }
    }
  }`,
  episodes: `query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id title { romaji english }
      streamingEpisodes {
        title thumbnail site
      }
    }
  }`
};

// ── API Fetch ────────────────────────────────────────────
async function anilistFetch(query, variables = {}) {
  try {
    const res = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    return json.data;
  } catch (e) {
    console.error('AniList API error:', e);
    return null;
  }
}

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  handleRoute();
  window.addEventListener('popstate', handleRoute);
});

function handleRoute() {
  const hash = location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean);

  if (parts[0] === 'watch' && parts[1]) {
    const id = parseInt(parts[1]);
    const slug = parts[2] || '';
    const ep = new URLSearchParams(location.hash.split('?')[1]).get('ep');
    watchAnime(id, slug, ep ? parseInt(ep) : 0);
  } else if (parts[0] === 'info' && parts[1]) {
    const id = parseInt(parts[1]);
    const slug = parts[2] || '';
    showInfo(id, slug);
  } else if (parts[0] === 'trending') {
    navigate('trending');
  } else if (parts[0] === 'schedule') {
    navigate('schedule');
  } else if (parts[0] === 'search' && parts[1]) {
    navigate('search-page');
    const q = decodeURIComponent(parts[1]);
    document.getElementById('searchInput').value = q;
    handleSearch(q);
  } else {
    navigate('home');
  }
}

// ── Navigation ───────────────────────────────────────────
function navigate(page, pushState = true) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.header-nav a').forEach(a => a.classList.remove('active'));

  const navLink = document.querySelector(`.header-nav a[data-nav="${page}"]`);
  if (navLink) navLink.classList.add('active');

  if (pushState) {
    if (page === 'home') history.pushState(null, '', '#/');
    else if (page === 'trending') history.pushState(null, '', '#/trending');
    else if (page === 'schedule') history.pushState(null, '', '#/schedule');
    else if (page === 'search-page') history.pushState(null, '', '#/search');
  }

  switch (page) {
    case 'home': loadHome(); break;
    case 'trending': loadTrending(); break;
    case 'schedule': loadSchedule(); break;
    case 'search-page': document.getElementById('searchPage').style.display = ''; break;
  }
}

async function loadHome() {
  document.getElementById('homePage').style.display = '';
  const [trendingRes, popularRes] = await Promise.all([
    anilistFetch(QUERIES.trending, { page: 1 }),
    anilistFetch(QUERIES.popular, { page: 1 })
  ]);

  const trending = trendingRes?.Page?.media || [];
  const popular = popularRes?.Page?.media || [];

  // Hero
  if (trending.length > 0) {
    const hero = trending[Math.floor(Math.random() * Math.min(5, trending.length))];
    renderHero(hero);
  }

  // Trending row
  document.getElementById('trendingRow').innerHTML = trending.map(animeCard).join('');

  // Popular grid
  document.getElementById('popularGrid').innerHTML = popular.map(animeCard).join('');

  // Latest episodes
  const latestRes = await anilistFetch(QUERIES.trending, { page: 1 });
  const latest = latestRes?.Page?.media || [];
  document.getElementById('latestEpisodes').innerHTML = latest.slice(0, 8).map(a =>
    '<div class="ep-card" onclick="navigateHash(\'info/' + a.id + '/' + slugify(a.title) + '\')">' +
    '<div class="ep-thumb"><img src="' + (a.coverImage?.large || '') + '" alt="" loading="lazy">' +
    '<span class="ep-number">EP ' + (a.nextAiringEpisode?.episode || a.episodes || '?') + '</span></div>' +
    '<div class="ep-info"><div class="ep-title">' + esc(a.title?.english || a.title?.romaji || '') + '</div>' +
    '<div class="ep-meta">' + (a.format || '') + ' · ' + (a.averageScore ? a.averageScore + '/100' : 'N/A') + '</div></div></div>'
  ).join('');
}

function renderHero(a) {
  const banner = a.bannerImage || a.coverImage?.large || '';
  const desc = (a.description || '').replace(/<[^>]+>/g, '').substring(0, 200);
  document.getElementById('heroSection').innerHTML =
    '<div class="hero-bg" style="background-image:url(' + banner + ')"></div>' +
    '<div class="hero-overlay"></div>' +
    '<div class="hero-content">' +
    '<div class="hero-poster"><img src="' + (a.coverImage?.large || '') + '" alt=""></div>' +
    '<div class="hero-info">' +
    '<div class="hero-meta">' +
    '<span class="badge">' + (a.format || '') + '</span>' +
    '<span class="badge">' + (a.status || '') + '</span>' +
    (a.averageScore ? '<span class="badge score">★ ' + a.averageScore + '</span>' : '') +
    '</div>' +
    '<h1>' + esc(a.title?.english || a.title?.romaji || '') + '</h1>' +
    '<p>' + esc(desc) + '</p>' +
    '<button class="hero-btn" onclick="navigateHash(\'info/' + a.id + '/' + slugify(a.title) + '\')">▶ Watch Now</button>' +
    '</div></div>';
}

async function loadTrending() {
  document.getElementById('trendingPage').style.display = '';
  const res = await anilistFetch(QUERIES.trending, { page: 1 });
  const list = res?.Page?.media || [];
  document.getElementById('trendingGrid').innerHTML = list.map(animeCard).join('');
}

async function loadSchedule() {
  document.getElementById('schedulePage').style.display = '';
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date().getDay();
  const dayName = days[(today + 6) % 7];

  const res = await anilistFetch(`query {
    Page(page: 1, perPage: 50) {
      media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
        id title { romaji english } coverImage { large }
        nextAiringEpisode { episode airingAt }
        averageScore format
      }
    }
  }`);
  const airing = res?.Page?.media || [];

  document.getElementById('scheduleGrid').innerHTML = days.map(day => {
    const shows = day === dayName ? airing.slice(0, 10) : airing.filter(() => Math.random() > 0.5).slice(0, 5);
    return '<div class="schedule-day"><h3>' + day + (day === dayName ? ' (Today)' : '') + '</h3>' +
      shows.map(a => {
        const time = a.nextAiringEpisode?.airingAt ? new Date(a.nextAiringEpisode.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        return '<div class="schedule-item" onclick="navigateHash(\'info/' + a.id + '/' + slugify(a.title) + '\')">' +
          '<img src="' + (a.coverImage?.large || '') + '" alt="" loading="lazy">' +
          '<div><div class="s-title">' + esc(a.title?.english || a.title?.romaji || '') + '</div>' +
          '<div class="s-meta">' + (time ? 'EP ' + a.nextAiringEpisode.episode + ' · ' + time : 'TBA') + '</div></div></div>';
      }).join('') + '</div>';
  }).join('');
}

// ── Info Page ────────────────────────────────────────────
async function showInfo(id, slug) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById('infoPage').style.display = '';
  history.pushState(null, '', '#/info/' + id + '/' + slug);

  const res = await anilistFetch(QUERIES.info, { id });
  const a = res?.Media;
  if (!a) return;

  currentAnime = a;
  const desc = (a.description || '').replace(/<[^>]+>/g, '');
  const epCount = a.episodes || a.nextAiringEpisode?.episode || '?';
  const studio = a.studios?.nodes?.[0]?.name || '';

  document.getElementById('infoBackdrop').style.backgroundImage = 'url(' + (a.bannerImage || a.coverImage?.large || '') + ')';
  document.getElementById('infoPoster').innerHTML = '<img src="' + (a.coverImage?.large || '') + '" alt="">';
  document.getElementById('infoTitle').textContent = a.title?.english || a.title?.romaji || '';

  document.getElementById('infoMeta').innerHTML =
    '<span class="badge format">' + (a.format || '') + '</span>' +
    '<span class="badge status">' + (a.status || '') + '</span>' +
    (a.averageScore ? '<span class="badge score">★ ' + a.averageScore + '/100</span>' : '');

  document.getElementById('infoDesc').textContent = desc;

  document.getElementById('infoActions').innerHTML =
    '<button class="btn btn-primary" onclick="navigateHash(\'watch/' + a.id + '/' + slugify(a.title) + '?ep=1\')">▶ Watch Now</button>' +
    '<button class="btn btn-outline" onclick="window.open(\'https://myanimelist.net/anime/' + a.id + '\',\'_blank\')">MyAnimeList</button>';

  document.getElementById('infoDetails').innerHTML =
    '<dt>Format</dt><dd>' + (a.format || 'N/A') + '</dd>' +
    '<dt>Status</dt><dd>' + (a.status || 'N/A') + '</dd>' +
    '<dt>Duration</dt><dd>' + (a.duration ? a.duration + ' min' : 'N/A') + '</dd>' +
    '<dt>Season</dt><dd>' + (a.season ? a.season.charAt(0) + a.season.slice(1).toLowerCase() + ' ' + (a.year || '') : 'N/A') + '</dd>' +
    '<dt>Score</dt><dd>' + (a.averageScore ? a.averageScore + '/100' : 'N/A') + '</dd>' +
    '<dt>Studio</dt><dd>' + studio + '</dd>';

  document.getElementById('infoGenres').innerHTML = (a.genres || []).map(g =>
    '<span class="genre">' + g + '</span>'
  ).join('') + (a.tags || []).slice(0, 5).map(t =>
    '<span class="genre">' + t.name + '</span>'
  ).join('');

  // Related
  const related = (a.relations?.edges || []).filter(e => e.node?.coverImage?.large).slice(0, 6);
  document.getElementById('relatedAnime').innerHTML = related.map(r =>
    '<div class="related-item" onclick="navigateHash(\'info/' + r.node.id + '/' + slugify(r.node.title) + '\')">' +
    '<img src="' + (r.node.coverImage?.large || '') + '" alt="" loading="lazy">' +
    '<div><div class="r-title">' + esc(r.node.title?.romaji || '') + '</div>' +
    '<div class="r-meta">' + (r.node.format || '') + '</div></div></div>'
  ).join('');

  // Characters
  const chars = a.characters?.nodes || [];
  document.getElementById('charactersList').innerHTML = chars.map(c =>
    '<div class="character-item">' +
    '<img src="' + (c.image?.medium || '') + '" alt="" loading="lazy">' +
    '<div><div class="c-name">' + esc(c.name?.full || '') + '</div>' +
    '<div class="c-role">' + c.role + '</div></div></div>'
  ).join('');

  // Episodes
  loadEpisodes(a.id, a.title);
}

async function loadEpisodes(id, title) {
  const res = await anilistFetch(QUERIES.episodes, { id });
  const eps = res?.Media?.streamingEpisodes || [];

  if (eps.length > 0) {
    document.getElementById('episodesList').innerHTML = eps.map((ep, i) =>
      '<div class="ep-card" onclick="navigateHash(\'watch/' + id + '/' + slugify(title) + '?ep=' + (i + 1) + '\')">' +
      '<div class="ep-thumb"><img src="' + (ep.thumbnail || '') + '" alt="" loading="lazy">' +
      '<span class="ep-number">EP ' + (i + 1) + '</span></div>' +
      '<div class="ep-info"><div class="ep-title">' + esc(ep.title || 'Episode ' + (i + 1)) + '</div>' +
      '<div class="ep-meta">' + (ep.site || '') + '</div></div></div>'
    ).join('');
  } else {
    // Generate episode list from episode count
    const epCount = currentAnime?.episodes || currentAnime?.nextAiringEpisode?.episode || 12;
    document.getElementById('episodesList').innerHTML = Array.from({ length: Math.min(epCount, 50) }, (_, i) =>
      '<div class="ep-card" onclick="navigateHash(\'watch/' + id + '/' + slugify(title) + '?ep=' + (i + 1) + '\')">' +
      '<div class="ep-thumb"><div class="ep-number">EP ' + (i + 1) + '</div></div>' +
      '<div class="ep-info"><div class="ep-title">Episode ' + (i + 1) + '</div>' +
      '<div class="ep-meta">' + (currentAnime?.format || 'Anime') + '</div></div></div>'
    ).join('');
  }
}

// ── Watch Page ───────────────────────────────────────────
async function watchAnime(id, slug, ep) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById('watchPage').style.display = '';
  currentEpisode = ep || 0;

  history.pushState(null, '', '#/watch/' + id + '/' + slug + '?ep=' + currentEpisode);

  const res = await anilistFetch(QUERIES.info, { id });
  const a = res?.Media;
  if (!a) return;

  currentAnime = a;
  const title = a.title?.english || a.title?.romaji || '';

  // Breadcrumb
  document.getElementById('watchBreadcrumb').innerHTML =
    '<a href="#" onclick="navigate(\'home\');return false;">Home</a> / ' +
    '<a href="#" onclick="navigateHash(\'info/' + a.id + '/' + slugify(a.title) + '\')">' + esc(title) + '</a> / ' +
    '<span>Watch</span>';

  document.getElementById('watchTitle').textContent = title + ' — Episode ' + currentEpisode;
  document.getElementById('episodeCount').textContent = a.episodes || '?';

  document.getElementById('watchMeta').innerHTML =
    '<span class="badge">' + (a.format || '') + '</span>' +
    '<span class="badge">' + (a.status || '') + '</span>' +
    '<span class="badge">EP ' + currentEpisode + '</span>' +
    (a.averageScore ? '<span class="badge">★ ' + a.averageScore + '</span>' : '');

  // Actions
  document.getElementById('watchActions').innerHTML =
    '<button class="btn btn-outline" onclick="navigateHash(\'info/' + a.id + '/' + slugify(a.title) + '\')">Series Info</button>' +
    '<button class="btn btn-outline" onclick="window.open(\'https://myanimelist.net/anime/' + a.id + '\',\'_blank\')">MAL</button>';

  // Watch details sidebar
  const studio = a.studios?.nodes?.[0]?.name || 'N/A';
  document.getElementById('watchDetails').innerHTML =
    '<dl class="info-details">' +
    '<dt>Format</dt><dd>' + (a.format || 'N/A') + '</dd>' +
    '<dt>Status</dt><dd>' + (a.status || 'N/A') + '</dd>' +
    '<dt>Season</dt><dd>' + (a.season || 'N/A') + ' ' + (a.year || '') + '</dd>' +
    '<dt>Studio</dt><dd>' + studio + '</dd>' +
    '<dt>Score</dt><dd>' + (a.averageScore ? a.averageScore + '/100' : 'N/A') + '</dd>' +
    '</dl>';

  // Watch episodes
  const epCount = a.episodes || a.nextAiringEpisode?.episode || 12;
  document.getElementById('watchEpisodes').innerHTML = Array.from({ length: Math.min(epCount, 50) }, (_, i) =>
    '<div class="ep-card' + (i + 1 === currentEpisode ? ' active' : '') + '" onclick="watchAnime(' + a.id + ',\'' + slugify(a.title) + '\',' + (i + 1) + ')">' +
    '<div class="ep-thumb"><div class="ep-number">EP ' + (i + 1) + '</div></div>' +
    '<div class="ep-info"><div class="ep-title">Episode ' + (i + 1) + '</div>' +
    '<div class="ep-meta">' + (a.format || 'Anime') + '</div></div></div>'
  ).join('');

  // Related
  const related = (a.relations?.edges || []).filter(e => e.node?.coverImage?.large).slice(0, 6);
  document.getElementById('watchRelated').innerHTML = related.map(r =>
    '<div class="related-item" onclick="navigateHash(\'info/' + r.node.id + '/' + slugify(r.node.title) + '\')">' +
    '<img src="' + (r.node.coverImage?.large || '') + '" alt="" loading="lazy">' +
    '<div><div class="r-title">' + esc(r.node.title?.romaji || '') + '</div>' +
    '<div class="r-meta">' + (r.node.format || '') + '</div></div></div>'
  ).join('');

  // Load player with streaming providers
  loadPlayer(id, title, currentEpisode);
}

// ── Player with Streaming Providers ──────────────────────
const PROVIDERS = [
  { id: 'kiwi', name: 'Kiwi', type: 'hls', base: 'https://kiwi.kmhd.eu/api/stream' },
  { id: 'ally', name: 'Ally', type: 'hls', base: 'https://ally.kmhd.eu/api/stream' },
  { id: 'moo', name: 'Moo', type: 'hls', base: 'https://moo.kmhd.eu/api/stream' },
  { id: 'bonk', name: 'Bonk', type: 'embed', base: 'https://bonk.kmhd.eu/embed' },
  { id: 'bee', name: 'Bee', type: 'embed', base: 'https://bee.kmhd.eu/embed' },
  { id: 'hop', name: 'Hop', type: 'embed', base: 'https://hop.kmhd.eu/embed' }
];

let activeProvider = 0;

function loadPlayer(id, title, ep) {
  const wrap = document.getElementById('playerWrap');
  const provider = PROVIDERS[activeProvider];

  wrap.innerHTML = '<div class="player-loading"><div class="spinner"></div><p>Loading from ' + provider.name + '...</p></div>';

  if (provider.type === 'hls') {
    const streamUrl = provider.base + '?ids=anilist:' + id + '&ep=' + ep;
    loadHLSPlayer(wrap, streamUrl);
  } else {
    const embedUrl = provider.base + '?ids=anilist:' + id + '&ep=' + ep;
    wrap.innerHTML = '<iframe src="' + embedUrl + '" allowfullscreen allow="autoplay; encrypted-media" style="width:100%;height:100%;border:none;"></iframe>';
  }
}

function loadHLSPlayer(wrap, url) {
  if (hls) { hls.destroy(); hls = null; }

  if (Hls.isSupported()) {
    hls = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
    });
    hls.loadSource(url);
    hls.attachMedia(wrap);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      wrap.play().catch(() => {});
    });
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('HLS fatal error, trying next provider');
        tryNextProvider();
      }
    });
  } else if (wrap.canPlayType('application/vnd.apple.mpegurl')) {
    wrap.src = url;
    wrap.addEventListener('loadedmetadata', () => wrap.play().catch(() => {}));
  } else {
    tryNextProvider();
  }
}

function tryNextProvider() {
  activeProvider = (activeProvider + 1) % PROVIDERS.length;
  if (currentAnime) {
    loadPlayer(currentAnime.id, currentAnime.title?.romaji, currentEpisode);
  }
}

function switchProvider(idx) {
  activeProvider = idx;
  if (currentAnime) {
    loadPlayer(currentAnime.id, currentAnime.title?.romaji, currentEpisode);
  }
}

// ── Search ───────────────────────────────────────────────
let searchTimeout;
async function handleSearch(query) {
  clearTimeout(searchTimeout);
  if (!query || query.length < 2) return;

  searchTimeout = setTimeout(async () => {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById('searchPage').style.display = '';
    document.getElementById('searchPageTitle').textContent = 'Results for "' + query + '"';
    history.pushState(null, '', '#/search/' + encodeURIComponent(query));

    const res = await anilistFetch(QUERIES.search, { search: query });
    const list = res?.Page?.media || [];
    document.getElementById('searchResults').innerHTML = list.length > 0
      ? list.map(animeCard).join('')
      : '<p style="text-align:center;padding:60px;color:var(--text-muted)">No results found</p>';
  }, 400);
}

// ── Card HTML ────────────────────────────────────────────
function animeCard(a) {
  const title = a.title?.english || a.title?.romaji || '';
  return '<div class="anime-card" onclick="navigateHash(\'info/' + a.id + '/' + slugify(a.title) + '\')">' +
    '<div class="poster"><img src="' + (a.coverImage?.large || '') + '" alt="" loading="lazy">' +
    '<div class="overlay"><div class="play-circle">▶</div></div>' +
    (a.nextAiringEpisode ? '<span class="ep-badge">EP ' + a.nextAiringEpisode.episode + '</span>' : '') +
    '</div><div class="info"><div class="title">' + esc(title.substring(0, 60)) + '</div>' +
    '<div class="meta">' + (a.format || '') + (a.averageScore ? ' · ★ ' + a.averageScore : '') + '</div></div></div>';
}

// ── Utilities ────────────────────────────────────────────
function esc(s) { return s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

function slugify(title) {
  if (!title) return '';
  const t = title.english || title.romaji || '';
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function navigateHash(path) {
  location.hash = '#/' + path;
}

function toggleFullscreen() {
  const el = document.getElementById('playerContainer');
  if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
  else document.exitFullscreen();
}

function openNewTab() {
  if (currentAnime) {
    window.open('#/watch/' + currentAnime.id + '/' + slugify(currentAnime.title), '_blank');
  }
}

function toggleMobile() {
  document.getElementById('mobileNav').classList.toggle('open');
}
function closeMobile() {
  document.getElementById('mobileNav').classList.remove('open');
}

function showToast(msg) {
  const t = document.querySelector('.toast') || document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => t.classList.remove('show'), 2000);
}

// Expose
window.navigate = navigate;
window.navigateHash = navigateHash;
window.handleSearch = handleSearch;
window.showInfo = showInfo;
window.watchAnime = watchAnime;
window.loadPlayer = loadPlayer;
window.switchProvider = switchProvider;
window.toggleFullscreen = toggleFullscreen;
window.openNewTab = openNewTab;
window.toggleMobile = toggleMobile;
window.closeMobile = closeMobile;
