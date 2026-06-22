/* ============================================================
   Miruro Clone — AniList API + Decrypted Miruro Streaming
   ============================================================ */

const ANILIST_API = 'https://graphql.anilist.co';
const MIRURO_PIPE_URL = 'https://www.miruro.tv/api/secure/pipe';
const WORKER_PROXY = 'https://animeforyou.pg3142292.workers.dev/api/pipe';
let currentAnime = null;
let currentEpisode = 0;

// ── Miruro Pipe Encoding/Decoding (from walterwhite-69/Miruro-API) ──
function encodePipeRequest(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodePipeResponse(encodedStr) {
  let s = encodedStr.trim();
  while (s.length % 4) s += '=';
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  // Decompress gzip
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  return new Response(ds.readable).arrayBuffer().then(buf => {
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(buf));
  });
}

function decodeEpisodeId(encodedId) {
  try {
    let s = encodedId;
    while (s.length % 4) s += '=';
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(s);
    return decoded.includes(':') ? decoded : encodedId;
  } catch { return encodedId; }
}

function deepTranslateIds(obj) {
  if (!obj) return;
  if (typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      if (key === 'id' && typeof val === 'string') obj[key] = decodeEpisodeId(val);
      else if (typeof val === 'object') deepTranslateIds(val);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) deepTranslateIds(item);
  }
}

async function miruroPipe(path, query) {
  const payload = { path, method: 'GET', query, body: null, version: '0.1.0' };
  const encoded = encodePipeRequest(payload);

  // Primary: Cloudflare Worker proxy
  try {
    const res = await fetch(`${WORKER_PROXY}?e=${encoded}`);
    if (res.ok) {
      const text = await res.text();
      return await decodePipeResponse(text);
    }
  } catch (e) {
    console.warn('Worker proxy failed:', e.message);
  }

  // Fallback: direct (CORS may block)
  try {
    const res = await fetch(`${MIRURO_PIPE_URL}?e=${encoded}`, {
      headers: { 'Referer': 'https://www.miruro.tv/' }
    });
    if (res.ok) {
      const text = await res.text();
      return await decodePipeResponse(text);
    }
  } catch (e) {}

  throw new Error('All streaming sources failed');
}

async function miruroEpisodes(anilistId) {
  const data = await miruroPipe('episodes', { anilistId });
  deepTranslateIds(data);
  return data;
}

async function miruroSources(episodeId, provider, anilistId, category = 'sub') {
  const encId = btoa(episodeId).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const data = await miruroPipe('sources', { episodeId: encId, provider, category, anilistId: parseInt(anilistId) });
  return data;
}

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
      id title { romaji english native } coverImage { large } bannerImage
      description averageScore meanScore format status episodes duration season year
      nextAiringEpisode { episode airingAt }
      genres tags { name } studios(isMain: true) { nodes { name } }
      characters(sort: ROLE, perPage: 12) {
        nodes { name { full } image { medium } role }
      }
      relations {
        edges { node { id title { romaji english } coverImage { large } format status } relationType }
      }
    }
  }`,
  episodes: `query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id title { romaji english }
      streamingEpisodes { title thumbnail site }
    }
  }`,
  schedule: `query {
    Page(page: 1, perPage: 50) {
      media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
        id title { romaji english } coverImage { large }
        nextAiringEpisode { episode airingAt }
        averageScore format
      }
    }
  }`
};

// ── API Fetch ────────────────────────────────────────────
async function api(query, variables = {}) {
  try {
    const res = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL error');
    return json.data;
  } catch (e) {
    console.error('API error:', e);
    return null;
  }
}

// ── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  route();
});

window.addEventListener('hashchange', route);

function route() {
  const hash = decodeURIComponent(location.hash.slice(1) || '/');
  const qIdx = hash.indexOf('?');
  const path = qIdx >= 0 ? hash.slice(0, qIdx) : hash;
  const params = qIdx >= 0 ? new URLSearchParams(hash.slice(qIdx)) : new URLSearchParams();
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'watch' && parts[1]) {
    const id = parseInt(parts[1]);
    const ep = parseInt(params.get('ep')) || 1;
    watchPage(id, ep);
  } else if (parts[0] === 'info' && parts[1]) {
    const id = parseInt(parts[1]);
    infoPage(id);
  } else if (parts[0] === 'trending') {
    showPage('trendingPage', 'trending');
    loadTrending();
  } else if (parts[0] === 'schedule') {
    showPage('schedulePage', 'schedule');
    loadSchedule();
  } else if (parts[0] === 'search' && parts[1]) {
    showPage('searchPage', 'search-page');
    const q = params.get('q') || decodeURIComponent(parts[1]);
    document.getElementById('searchInput').value = q;
    doSearch(q);
  } else {
    showPage('homePage', 'home');
    loadHome();
  }
}

function showPage(id, nav) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(id).style.display = '';
  document.querySelectorAll('.header-nav a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`.header-nav a[data-nav="${nav}"]`);
  if (link) link.classList.add('active');
}

function go(path) {
  location.hash = '#/' + path;
}

// ── Home ─────────────────────────────────────────────────
async function loadHome() {
  const [tRes, pRes] = await Promise.all([
    api(QUERIES.trending, { page: 1 }),
    api(QUERIES.popular, { page: 1 })
  ]);

  const trending = tRes?.Page?.media || [];
  const popular = pRes?.Page?.media || [];

  if (trending.length > 0) {
    const hero = trending[Math.floor(Math.random() * Math.min(5, trending.length))];
    const desc = (hero.description || '').replace(/<[^>]+>/g, '').substring(0, 250);
    document.getElementById('heroSection').innerHTML =
      '<div class="hero-bg" style="background-image:url(' + (hero.bannerImage || hero.coverImage?.large || '') + ')"></div>' +
      '<div class="hero-overlay"></div>' +
      '<div class="hero-content">' +
      '<div class="hero-poster"><img src="' + (hero.coverImage?.large || '') + '" alt=""></div>' +
      '<div class="hero-info">' +
      '<div class="hero-meta">' +
      '<span class="badge">' + (hero.format || '') + '</span>' +
      '<span class="badge">' + (hero.status || '') + '</span>' +
      (hero.averageScore ? '<span class="badge score">★ ' + hero.averageScore + '</span>' : '') +
      '</div>' +
      '<h1>' + esc(hero.title?.english || hero.title?.romaji || '') + '</h1>' +
      '<p>' + esc(desc) + '</p>' +
      '<button class="hero-btn" onclick="go(\'info/' + hero.id + '\')">▶ Watch Now</button>' +
      '</div></div>';
  }

  document.getElementById('trendingRow').innerHTML = trending.map(card).join('');
  document.getElementById('popularGrid').innerHTML = popular.map(card).join('');

  document.getElementById('latestEpisodes').innerHTML = trending.slice(0, 8).map(a =>
    '<div class="ep-card" onclick="go(\'info/' + a.id + '\')">' +
    '<div class="ep-thumb"><img src="' + (a.coverImage?.large || '') + '" alt="" loading="lazy">' +
    '<span class="ep-number">EP ' + (a.nextAiringEpisode?.episode || a.episodes || '?') + '</span></div>' +
    '<div class="ep-info"><div class="ep-title">' + esc(a.title?.english || a.title?.romaji || '') + '</div>' +
    '<div class="ep-meta">' + (a.format || '') + (a.averageScore ? ' · ★ ' + a.averageScore : '') + '</div></div></div>'
  ).join('');
}

// ── Trending ─────────────────────────────────────────────
async function loadTrending() {
  const res = await api(QUERIES.trending, { page: 1 });
  const list = res?.Page?.media || [];
  document.getElementById('trendingGrid').innerHTML = list.map(card).join('') || '<p style="text-align:center;padding:40px;color:var(--text-muted)">Loading...</p>';
}

// ── Schedule ─────────────────────────────────────────────
async function loadSchedule() {
  const res = await api(QUERIES.schedule);
  const shows = res?.Page?.media || [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = days[(new Date().getDay() + 6) % 7];

  document.getElementById('scheduleGrid').innerHTML = days.map(day => {
    const list = day === today ? shows.slice(0, 10) : shows.filter(() => Math.random() > 0.5).slice(0, 5);
    return '<div class="schedule-day"><h3>' + day + (day === today ? ' (Today)' : '') + '</h3>' +
      list.map(a => {
        const time = a.nextAiringEpisode?.airingAt
          ? new Date(a.nextAiringEpisode.airingAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';
        return '<div class="schedule-item" onclick="go(\'info/' + a.id + '\')">' +
          '<img src="' + (a.coverImage?.large || '') + '" alt="" loading="lazy">' +
          '<div><div class="s-title">' + esc(a.title?.english || a.title?.romaji || '') + '</div>' +
          '<div class="s-meta">' + (time ? 'EP ' + a.nextAiringEpisode.episode + ' · ' + time : 'TBA') + '</div></div></div>';
      }).join('') + '</div>';
  }).join('');
}

// ── Info Page ────────────────────────────────────────────
async function infoPage(id) {
  showPage('infoPage', '');
  const [iRes, eRes] = await Promise.all([
    api(QUERIES.info, { id }),
    api(QUERIES.episodes, { id })
  ]);
  const a = iRes?.Media;
  if (!a) {
    document.getElementById('infoTitle').textContent = 'Anime not found';
    return;
  }

  currentAnime = a;
  const title = a.title?.english || a.title?.romaji || '';
  const desc = (a.description || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#039;/g, "'");
  const epCount = a.episodes || a.nextAiringEpisode?.episode || 12;
  const studio = a.studios?.nodes?.[0]?.name || '';
  const season = a.season ? a.season.charAt(0) + a.season.slice(1).toLowerCase() : '';

  document.getElementById('infoBackdrop').style.backgroundImage = 'url(' + (a.bannerImage || a.coverImage?.large || '') + ')';
  document.getElementById('infoPoster').innerHTML = '<img src="' + (a.coverImage?.large || '') + '" alt="">';
  document.getElementById('infoTitle').textContent = title;

  document.getElementById('infoMeta').innerHTML =
    '<span class="badge format">' + (a.format || '') + '</span>' +
    '<span class="badge status">' + (a.status || '') + '</span>' +
    (a.averageScore ? '<span class="badge score">★ ' + a.averageScore + '/100</span>' : '');

  document.getElementById('infoDesc').textContent = desc;

  document.getElementById('infoActions').innerHTML =
    '<button class="btn btn-primary" onclick="go(\'watch/' + a.id + '?ep=1\')">▶ Watch Now</button>' +
    '<button class="btn btn-outline" onclick="window.open(\'https://myanimelist.net/anime/' + a.id + '\',\'_blank\')">MyAnimeList</button>';

  document.getElementById('infoDetails').innerHTML =
    '<dt>Format</dt><dd>' + (a.format || 'N/A') + '</dd>' +
    '<dt>Status</dt><dd>' + (a.status || 'N/A') + '</dd>' +
    '<dt>Duration</dt><dd>' + (a.duration ? a.duration + ' min' : 'N/A') + '</dd>' +
    '<dt>Season</dt><dd>' + (season ? season + ' ' + (a.year || '') : 'N/A') + '</dd>' +
    '<dt>Score</dt><dd>' + (a.averageScore ? a.averageScore + '/100' : 'N/A') + '</dd>' +
    '<dt>Episodes</dt><dd>' + epCount + '</dd>' +
    '<dt>Studio</dt><dd>' + studio + '</dd>';

  document.getElementById('infoGenres').innerHTML = (a.genres || []).map(g =>
    '<span class="genre">' + g + '</span>'
  ).join('');

  // Related
  const related = (a.relations?.edges || []).filter(e => e.node?.coverImage?.large && e.relationType !== 'CHARACTER').slice(0, 8);
  document.getElementById('relatedAnime').innerHTML = related.map(r =>
    '<div class="related-item" onclick="go(\'info/' + r.node.id + '\')">' +
    '<img src="' + (r.node.coverImage?.large || '') + '" alt="" loading="lazy">' +
    '<div><div class="r-title">' + esc(r.node.title?.english || r.node.title?.romaji || '') + '</div>' +
    '<div class="r-meta">' + (r.node.format || '') + (r.node.status ? ' · ' + r.node.status : '') + '</div></div></div>'
  ).join('') || '<p style="color:var(--text-muted);font-size:13px">No related anime</p>';

  // Characters
  const chars = a.characters?.nodes || [];
  document.getElementById('charactersList').innerHTML = chars.map(c =>
    '<div class="character-item">' +
    '<img src="' + (c.image?.medium || '') + '" alt="" loading="lazy">' +
    '<div><div class="c-name">' + esc(c.name?.full || '') + '</div>' +
    '<div class="c-role">' + c.role + '</div></div></div>'
  ).join('') || '<p style="color:var(--text-muted);font-size:13px">No characters</p>';

  // Episodes
  const eps = eRes?.Media?.streamingEpisodes || [];
  if (eps.length > 0) {
    document.getElementById('episodesList').innerHTML = eps.map((ep, i) =>
      '<div class="ep-card" onclick="go(\'watch/' + a.id + '?ep=' + (i + 1) + '\')">' +
      '<div class="ep-thumb"><img src="' + (ep.thumbnail || a.coverImage?.large || '') + '" alt="" loading="lazy">' +
      '<span class="ep-number">EP ' + (i + 1) + '</span></div>' +
      '<div class="ep-info"><div class="ep-title">' + esc(ep.title || 'Episode ' + (i + 1)) + '</div>' +
      '<div class="ep-meta">' + (ep.site || 'Streaming') + '</div></div></div>'
    ).join('');
  } else {
    document.getElementById('episodesList').innerHTML = Array.from({ length: Math.min(epCount, 50) }, (_, i) =>
      '<div class="ep-card" onclick="go(\'watch/' + a.id + '?ep=' + (i + 1) + '\')">' +
      '<div class="ep-thumb"><img src="' + (a.coverImage?.large || '') + '" alt="" loading="lazy">' +
      '<span class="ep-number">EP ' + (i + 1) + '</span></div>' +
      '<div class="ep-info"><div class="ep-title">Episode ' + (i + 1) + '</div>' +
      '<div class="ep-meta">' + (a.format || 'Anime') + '</div></div></div>'
    ).join('');
  }
}

// ── Watch Page ───────────────────────────────────────────
async function watchPage(id, ep) {
  showPage('watchPage', '');
  currentEpisode = ep;

  const [iRes, eRes] = await Promise.all([
    api(QUERIES.info, { id }),
    api(QUERIES.episodes, { id })
  ]);
  const a = iRes?.Media;
  if (!a) {
    document.getElementById('watchTitle').textContent = 'Anime not found';
    return;
  }

  currentAnime = a;
  const title = a.title?.english || a.title?.romaji || '';
  const epCount = a.episodes || a.nextAiringEpisode?.episode || 12;
  const studio = a.studios?.nodes?.[0]?.name || '';

  // Breadcrumb
  document.getElementById('watchBreadcrumb').innerHTML =
    '<a href="#" onclick="go(\'/\');return false;">Home</a> / ' +
    '<a href="#" onclick="go(\'info/' + a.id + '\')">' + esc(title) + '</a> / ' +
    '<span>Episode ' + ep + '</span>';

  document.getElementById('watchTitle').textContent = title + ' — Episode ' + ep;
  document.getElementById('episodeCount').textContent = epCount;

  document.getElementById('watchMeta').innerHTML =
    '<span class="badge">' + (a.format || '') + '</span>' +
    '<span class="badge">' + (a.status || '') + '</span>' +
    '<span class="badge">EP ' + ep + '</span>' +
    (a.averageScore ? '<span class="badge">★ ' + a.averageScore + '</span>' : '');

  document.getElementById('watchActions').innerHTML =
    '<button class="btn btn-outline" onclick="go(\'info/' + a.id + '\')">Series Info</button>' +
    '<button class="btn btn-outline" onclick="window.open(\'https://myanimelist.net/anime/' + a.id + '\',\'_blank\')">MAL</button>' +
    (ep > 1 ? '<button class="btn btn-outline" onclick="prevEp()">← Prev</button>' : '') +
    (ep < epCount ? '<button class="btn btn-outline" onclick="nextEp()">Next →</button>' : '');

  // Watch details sidebar
  document.getElementById('watchDetails').innerHTML =
    '<dl class="info-details">' +
    '<dt>Format</dt><dd>' + (a.format || 'N/A') + '</dd>' +
    '<dt>Status</dt><dd>' + (a.status || 'N/A') + '</dd>' +
    '<dt>Studio</dt><dd>' + studio + '</dd>' +
    '<dt>Score</dt><dd>' + (a.averageScore ? a.averageScore + '/100' : 'N/A') + '</dd>' +
    '</dl>';

  // Episodes list
  const eps = eRes?.Media?.streamingEpisodes || [];
  if (eps.length > 0) {
    document.getElementById('watchEpisodes').innerHTML = eps.map((e, i) =>
      '<div class="ep-card' + (i + 1 === ep ? ' active' : '') + '" onclick="go(\'watch/' + a.id + '?ep=' + (i + 1) + '\')">' +
      '<div class="ep-thumb"><img src="' + (e.thumbnail || a.coverImage?.large || '') + '" alt="" loading="lazy">' +
      '<span class="ep-number">EP ' + (i + 1) + '</span></div>' +
      '<div class="ep-info"><div class="ep-title">' + esc(e.title || 'Episode ' + (i + 1)) + '</div>' +
      '<div class="ep-meta">' + (e.site || '') + '</div></div></div>'
    ).join('');
  } else {
    document.getElementById('watchEpisodes').innerHTML = Array.from({ length: Math.min(epCount, 50) }, (_, i) =>
      '<div class="ep-card' + (i + 1 === ep ? ' active' : '') + '" onclick="go(\'watch/' + a.id + '?ep=' + (i + 1) + '\')">' +
      '<div class="ep-thumb"><img src="' + (a.coverImage?.large || '') + '" alt="" loading="lazy">' +
      '<span class="ep-number">EP ' + (i + 1) + '</span></div>' +
      '<div class="ep-info"><div class="ep-title">Episode ' + (i + 1) + '</div>' +
      '<div class="ep-meta">' + (a.format || 'Anime') + '</div></div></div>'
    ).join('');
  }

  // Related sidebar
  const related = (a.relations?.edges || []).filter(e => e.node?.coverImage?.large && e.relationType !== 'CHARACTER').slice(0, 6);
  document.getElementById('watchRelated').innerHTML = related.map(r =>
    '<div class="related-item" onclick="go(\'info/' + r.node.id + '\')">' +
    '<img src="' + (r.node.coverImage?.large || '') + '" alt="" loading="lazy">' +
    '<div><div class="r-title">' + esc(r.node.title?.english || r.node.title?.romaji || '') + '</div>' +
    '<div class="r-meta">' + (r.node.format || '') + '</div></div></div>'
  ).join('');

  // Load player - try multiple sources
  loadPlayer(id, ep);
}

function prevEp() {
  if (currentAnime && currentEpisode > 1) {
    go('watch/' + currentAnime.id + '?ep=' + (currentEpisode - 1));
  }
}

function nextEp() {
  if (currentAnime) {
    const maxEp = currentAnime.episodes || currentAnime.nextAiringEpisode?.episode || 999;
    if (currentEpisode < maxEp) {
      go('watch/' + currentAnime.id + '?ep=' + (currentEpisode + 1));
    }
  }
}

// ── Player ───────────────────────────────────────────────
let activeProvider = 'kiwi';

async function loadPlayer(id, ep) {
  const wrap = document.getElementById('playerWrap');
  wrap.innerHTML = '<div class="player-loading"><div class="spinner"></div><p>Loading episodes from Miruro...</p></div>';

  try {
    const epsData = await miruroEpisodes(id);
    const providers = epsData?.providers || {};

    // Find provider with episodes
    let episodeId = null;
    let providerName = null;
    const providerOrder = ['kiwi', 'arc', 'zoro', 'jet', 'pewe', 'bee', 'bonk', 'ally', 'moo', 'hop'];

    for (const pname of providerOrder) {
      const prov = providers[pname];
      if (!prov) continue;
      const subs = prov.episodes?.sub || [];
      const epData = subs.find(e => e.number === ep);
      if (epData) {
        episodeId = epData.id;
        providerName = pname;
        break;
      }
    }

    if (!episodeId) {
      // Try any provider
      for (const [pname, prov] of Object.entries(providers)) {
        const subs = prov.episodes?.sub || [];
        if (subs.length > 0) {
          const epData = subs.find(e => e.number === ep) || subs[0];
          episodeId = epData.id;
          providerName = pname;
          break;
        }
      }
    }

    if (!episodeId) {
      wrap.innerHTML = '<div class="player-loading"><p>No streams found for this episode.</p></div>';
      return;
    }

    wrap.innerHTML = '<div class="player-loading"><div class="spinner"></div><p>Fetching stream from ' + providerName + '...</p></div>';

    const sources = await miruroSources(episodeId, providerName, id);
    const streams = sources?.streams || [];

    if (streams.length === 0) {
      wrap.innerHTML = '<div class="player-loading"><p>No video sources available.</p></div>';
      return;
    }

    // Play the best quality stream
    const stream = streams.find(s => s.quality === '1080p') || streams.find(s => s.quality === '720p') || streams[0];
    playHLS(wrap, stream.url);

    // Show provider buttons
    const availableProviders = Object.keys(providers).filter(p => providers[p]?.episodes?.sub?.length > 0);
    document.getElementById('watchActions').innerHTML =
      '<button class="btn btn-outline" onclick="go(\'info/' + id + '\')">Series Info</button>' +
      '<button class="btn btn-outline" onclick="window.open(\'https://myanimelist.net/anime/' + id + '\',\'_blank\')">MAL</button>' +
      (ep > 1 ? '<button class="btn btn-outline" onclick="prevEp()">← Prev</button>' : '') +
      (currentAnime && ep < (currentAnime.episodes || 999) ? '<button class="btn btn-outline" onclick="nextEp()">Next →</button>' : '') +
      '<div class="provider-select" style="margin-top:8px">' +
      availableProviders.map(p => '<button class="provider-btn' + (p === providerName ? ' active' : '') + '" onclick="switchProvider(\'' + p + '\',' + id + ',' + ep + ')">' + p + '</button>').join('') +
      '</div>';

  } catch (e) {
    console.error('Player error:', e);
    wrap.innerHTML = '<div class="player-loading"><p>Failed to load stream. <a href="#" onclick="loadPlayer(' + id + ',' + ep + ');return false;" style="color:var(--accent)">Retry</a></p></div>';
  }
}

async function switchProvider(provider, id, ep) {
  const wrap = document.getElementById('playerWrap');
  wrap.innerHTML = '<div class="player-loading"><div class="spinner"></div><p>Switching to ' + provider + '...</p></div>';

  try {
    const epsData = await miruroEpisodes(id);
    const prov = epsData?.providers?.[provider];
    const subs = prov?.episodes?.sub || [];
    const epData = subs.find(e => e.number === ep) || subs[0];

    if (!epData) {
      wrap.innerHTML = '<div class="player-loading"><p>No episodes on ' + provider + '</p></div>';
      return;
    }

    const sources = await miruroSources(epData.id, provider, id);
    const streams = sources?.streams || [];
    if (streams.length === 0) {
      wrap.innerHTML = '<div class="player-loading"><p>No sources on ' + provider + '</p></div>';
      return;
    }

    const stream = streams.find(s => s.quality === '1080p') || streams[0];
    playHLS(wrap, stream.url);
  } catch (e) {
    wrap.innerHTML = '<div class="player-loading"><p>Provider failed. <a href="#" onclick="loadPlayer(' + id + ',' + ep + ');return false;" style="color:var(--accent)">Retry</a></p></div>';
  }
}

function playHLS(wrap, url) {
  if (typeof Hls === 'undefined') {
    wrap.innerHTML = '<video src="' + url + '" controls autoplay style="width:100%;height:100%;background:#000;"></video>';
    return;
  }

  if (Hls.isSupported()) {
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.style.cssText = 'width:100%;height:100%;background:#000;';
    wrap.innerHTML = '';
    wrap.appendChild(video);

    const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60 });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        console.error('HLS error:', data.type, data.details);
        wrap.innerHTML = '<div class="player-loading"><p>Stream failed. <a href="#" onclick="loadPlayer(' + (currentAnime?.id || 0) + ',' + currentEpisode + ');return false;" style="color:var(--accent)">Try again</a></p></div>';
      }
    });
  } else if (document.createElement('video').canPlayType('application/vnd.apple.mpegurl')) {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.style.cssText = 'width:100%;height:100%;background:#000;';
    wrap.innerHTML = '';
    wrap.appendChild(video);
  } else {
    wrap.innerHTML = '<div class="player-loading"><p>Your browser doesn\'t support HLS. <a href="https://miruro.ru" target="_blank" style="color:var(--accent)">Watch on Miruro</a></p></div>';
  }
}

function toggleFullscreen() {
  const el = document.getElementById('playerContainer');
  if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
  else document.exitFullscreen();
}

// ── Search ───────────────────────────────────────────────
let searchTimer;
async function doSearch(query) {
  if (!query || query.length < 2) return;
  document.getElementById('searchPageTitle').textContent = 'Results for "' + query + '"';
  const res = await api(QUERIES.search, { search: query });
  const list = res?.Page?.media || [];
  document.getElementById('searchResults').innerHTML = list.length > 0
    ? list.map(card).join('')
    : '<p style="text-align:center;padding:60px;color:var(--text-muted)">No results found</p>';
}

function handleSearch(value) {
  clearTimeout(searchTimer);
  if (!value || value.length < 2) return;
  showPage('searchPage', 'search-page');
  searchTimer = setTimeout(() => doSearch(value), 400);
}

// ── Card HTML ────────────────────────────────────────────
function card(a) {
  const title = a.title?.english || a.title?.romaji || '';
  return '<div class="anime-card" onclick="go(\'info/' + a.id + '\')">' +
    '<div class="poster"><img src="' + (a.coverImage?.large || '') + '" alt="" loading="lazy">' +
    '<div class="overlay"><div class="play-circle">▶</div></div>' +
    (a.nextAiringEpisode ? '<span class="ep-badge">EP ' + a.nextAiringEpisode.episode + '</span>' : '') +
    '</div><div class="info"><div class="title">' + esc(title.substring(0, 60)) + '</div>' +
    '<div class="meta">' + (a.format || '') + (a.averageScore ? ' · ★ ' + a.averageScore : '') + '</div></div></div>';
}

// ── Utilities ────────────────────────────────────────────
function esc(s) { return s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; }
function toggleMobile() { document.getElementById('mobileNav').classList.toggle('open'); }
function closeMobile() { document.getElementById('mobileNav').classList.remove('open'); }

// Expose
window.go = go;
window.handleSearch = handleSearch;
window.loadPlayer = loadPlayer;
window.embedMiruro = embedMiruro;
window.toggleFullscreen = toggleFullscreen;
window.prevEp = prevEp;
window.nextEp = nextEp;
window.toggleMobile = toggleMobile;
window.closeMobile = closeMobile;
