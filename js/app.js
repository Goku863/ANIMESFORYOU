/* ============================================================
   AnimeStream — Application Logic
   AI, n8n Integration, Transitions
   ============================================================ */

// ── Anime Data ────────────────────────────────────────────
const ANIME_DB = [
  { id: 'attack-on-titan', title: 'Attack on Titan: The Final Season', rating: 9.8, year: 2024, genre: ['Action', 'Drama', 'Dark Fantasy'], type: 'TV', episodes: 24, poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80', badge: 'new', desc: 'Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans.' },
  { id: 'jujutsu-kaisen', title: 'Jujutsu Kaisen Season 3', rating: 9.6, year: 2024, genre: ['Action', 'Supernatural'], type: 'TV', episodes: 24, poster: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&q=80', badge: 'new', desc: 'A boy swallows a cursed talisman and joins a school of Jujutsu Sorcerers.' },
  { id: 'demon-slayer', title: 'Demon Slayer: Hashira Training', rating: 9.5, year: 2024, genre: ['Action', 'Supernatural'], type: 'TV', episodes: 8, poster: 'https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=400&q=80', badge: 'sub', desc: 'Tanjiro and friends train with the Hashira to become stronger.' },
  { id: 'one-piece', title: 'One Piece: Egghead Arc', rating: 9.7, year: 2024, genre: ['Action', 'Adventure', 'Comedy'], type: 'TV', episodes: 50, poster: 'https://images.unsplash.com/photo-1607604276583-0ef6ded8c4f2?w=400&q=80', badge: 'sub', desc: 'Luffy and his crew arrive at the mysterious Egghead Island.' },
  { id: 'solo-leveling', title: 'Solo Leveling Season 2', rating: 9.4, year: 2024, genre: ['Action', 'Fantasy'], type: 'TV', episodes: 13, poster: 'https://images.unsplash.com/photo-1614850715649-1d01062d0c8c?w=400&q=80', badge: 'new', desc: 'Sung Jinwoo continues his rise as the strongest hunter.' },
  { id: 'chainsaw-man', title: 'Chainsaw Man Season 2', rating: 9.3, year: 2024, genre: ['Action', 'Horror', 'Dark Fantasy'], type: 'TV', episodes: 12, poster: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400&q=80', badge: 'dub', desc: 'Denji continues his devil-hunting adventures with new threats.' },
  { id: 'spy-family', title: 'Spy x Family Season 3', rating: 9.2, year: 2024, genre: ['Comedy', 'Action', 'Slice of Life'], type: 'TV', episodes: 25, poster: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&q=80', badge: 'sub', desc: 'The Forger family embarks on new heartwarming missions.' },
  { id: 'my-hero', title: 'My Hero Academia: Final Arc', rating: 9.1, year: 2024, genre: ['Action', 'Superhero'], type: 'TV', episodes: 24, poster: 'https://images.unsplash.com/photo-1601850494222-0ef6ded8c4f2?w=400&q=80', badge: 'new', desc: 'The final battle between heroes and villains begins.' },
  { id: 'frieren', title: 'Frieren: Beyond Journey\'s End S2', rating: 9.5, year: 2024, genre: ['Fantasy', 'Adventure', 'Drama'], type: 'TV', episodes: 28, poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', badge: 'sub', desc: 'The elven mage continues her journey to understand humanity.' },
  { id: 'mashle', title: 'Mashle: Magic and Muscles S3', rating: 8.9, year: 2024, genre: ['Comedy', 'Action', 'Fantasy'], type: 'TV', episodes: 12, poster: 'https://images.unsplash.com/photo-1560972550-aba3456b5564?w=400&q=80', badge: 'dub', desc: 'Mash continues to punch his way through magic school.' },
  { id: 'oshi-no-ko', title: 'Oshi no Ko Season 3', rating: 9.4, year: 2024, genre: ['Drama', 'Supernatural'], type: 'TV', episodes: 13, poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80', badge: 'new', desc: 'Aqua and Ruby navigate the entertainment industry.' },
  { id: 'dandadan', title: 'Dandadan', rating: 9.0, year: 2024, genre: ['Action', 'Comedy', 'Supernatural'], type: 'TV', episodes: 12, poster: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&q=80', badge: 'sub', desc: 'A story of aliens, ghosts, and high school romance.' },
  { id: 'blue-lock', title: 'Blue Lock Season 2', rating: 8.8, year: 2024, genre: ['Sports', 'Drama'], type: 'TV', episodes: 24, poster: 'https://images.unsplash.com/photo-1607604276583-0ef6ded8c4f2?w=400&q=80', badge: 'sub', desc: 'The battle to become Japan\'s best striker continues.' },
  { id: 'vinland', title: 'Vinland Saga Season 3', rating: 9.6, year: 2024, genre: ['Action', 'Adventure', 'Drama'], type: 'TV', episodes: 24, poster: 'https://images.unsplash.com/photo-1614850715649-1d01062d0c8c?w=400&q=80', badge: 'new', desc: 'Thorfinn\'s journey to find Vinland continues.' },
  { id: 'mashle2', title: 'Kaiju No. 8', rating: 9.1, year: 2024, genre: ['Action', 'Sci-Fi'], type: 'TV', episodes: 12, poster: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400&q=80', badge: 'new', desc: 'Kafka Hibino gains the power to transform into a kaiju.' },
  { id: 'wind-breaker', title: 'Wind Breaker', rating: 8.7, year: 2024, genre: ['Action', 'Slice of Life'], type: 'TV', episodes: 13, poster: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&q=80', badge: 'sub', desc: 'A delinquent fights to protect his town.' },
  { id: 'classroom', title: 'Classroom of the Elite S4', rating: 9.3, year: 2024, genre: ['Psychological', 'Drama'], type: 'TV', episodes: 13, poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80', badge: 'new', desc: 'Ayanokoji faces new challenges in the elite school.' },
  { id: 're-zero', title: 'Re:Zero Season 3', rating: 9.2, year: 2024, genre: ['Fantasy', 'Drama', 'Thriller'], type: 'TV', episodes: 25, poster: 'https://images.unsplash.com/photo-1560972550-aba3456b5564?w=400&q=80', badge: 'sub', desc: 'Subaru continues to fight against fate.' },
  { id: 'overlord', title: 'Overlord Season 5', rating: 8.9, year: 2024, genre: ['Fantasy', 'Action', 'Isekai'], type: 'TV', episodes: 13, poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80', badge: 'dub', desc: 'Ainz Ooal Gown expands his dominion.' },
];

const GENRES = ['Action', 'Romance', 'Sci-Fi', 'Comedy', 'Fantasy', 'Drama', 'Horror', 'Sports', 'Isekai', 'Slice of Life', 'Supernatural', 'Psychological', 'Mecha', 'Mystery', 'Adventure'];

const EPISODES = Array.from({ length: 12 }, (_, i) => ({
  num: i + 1,
  title: ['The Beginning', 'Awakening', 'Challenge', 'Betrayal', 'Resolve', 'Battle', 'Revelation', 'Sacrifice', 'Turning Point', 'Alliance', 'Climax', 'New Dawn'][i],
  duration: '24:00',
  poster: `https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&q=60`
}));

// ── AI Chat Responses (Fable 5 Enhanced) ──────────────────
const AI_RESPONSES = {
  'recommend': [
    "Based on your watch history, **Solo Leveling** is the strongest match — the power progression mirrors Attack on Titan's escalation, and Madhouse delivers exceptional animation. If you want something more contemplative, **Frieren: Beyond Journey's End** explores time and memory through a fantasy lens that rewards patience.",
    "Two directions depending on your mood: **Chainsaw Man** if you want unpredictable, visceral storytelling with Fujimoto's signature chaos. Or **Jujutsu Kaisen** if you prefer structured power systems with incredible sakuga. Both are darker takes on shonen that subvert expectations.",
    "Your taste leans toward high-stakes narratives with strong worldbuilding. **Vinland Saga** offers that same epic scope — it starts as a revenge story and evolves into a meditation on violence and redemption. The character arc is among the best in anime."
  ],
  'similar': [
    "Death Note's chess-match dynamic appears in **Classroom of the Elite** — Ayanokoji operates from shadows, manipulating outcomes without revealing his hand. The psychological depth is comparable, though the setting shifts from supernatural to institutional.",
    "If you want Demon Slayer's visual spectacle with more narrative complexity, **Fate/Zero** delivers. Ufotable's animation quality plus Gen Urobuchi's writing creates something that rewards both casual viewing and deep analysis.",
    "For Attack on Titan's political intrigue and moral ambiguity, **Legend of the Galactic Heroes** is the gold standard. It's older but the strategic depth and character work are unmatched in the medium."
  ],
  'summary': [
    "The final season deconstructs everything the series built. Eren's transformation from protagonist to antagonist forces every character to confront what they're willing to sacrifice. The Rumbling isn't just a plot device — it's the logical endpoint of a cycle of hatred that started before any character was born. The alliance forming between former enemies is earned through four seasons of character development.",
    "This adaptation captures the source material's pacing masterfully. The Culling Game raises stakes by forcing sorcerers into a deadly tournament where alliances shift constantly. Gojo's absence creates a power vacuum that drives character growth in unexpected ways.",
    "The series subverts power fantasy tropes by showing the cost of strength. Jinwoo's growth comes with isolation and moral compromise. The System isn't just a game mechanic — it's reshaping reality itself, and the implications become clearer as the series progresses."
  ],
  'best': [
    "Top recommendations based on community ratings and critical acclaim: **Attack on Titan: Final Season** (9.8) for its ambitious narrative closure. **Frieren** (9.5) if you want something that redefines what anime storytelling can be. **Vinland Saga** (9.6) for historical epic with genuine character depth.",
    "The current landscape favors **Solo Leveling** for action, **Oshi no Ko** for industry satire, and **Dandadan** for pure creative energy. Each represents a different strength in modern anime production."
  ],
  'greeting': [
    "Ready to find your next favorite anime. What are you in the mood for — something action-packed, character-driven, or maybe a hidden gem?",
    "What brings you here today? I can recommend based on what you've watched, summarize something you're curious about, or help you discover something new."
  ],
  'default': [
    "I can help with recommendations, summaries, or finding similar anime. What interests you right now?",
    "Tell me more about what you're looking for — genre preferences, mood, or specific titles you've enjoyed. I'll give you something concrete.",
    "I have access to a comprehensive anime database and can provide detailed analysis. What would be most useful?"
  ]
};

// ── State ─────────────────────────────────────────────────
let currentPage = 'home';
let currentAnime = null;
let isPlaying = false;
let notifOpen = false;
let aiOpen = false;
let searchOpen = false;
let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderGenreTags();
  renderAnimeGrid('trendingGrid', ANIME_DB.slice(0, 8));
  renderAnimeGrid('aiGrid', ANIME_DB.slice(5, 13));
  renderAnimeGrid('topRatedGrid', [...ANIME_DB].sort((a, b) => b.rating - a.rating).slice(0, 8));
  renderAnimeGrid('newReleasesGrid', ANIME_DB.filter(a => a.badge === 'new').slice(0, 8));
  renderContinueWatching();
  renderEpisodes();
  initTabs();
  initSkeletonLoaders();
  revealStaggerElements();
  window.addEventListener('scroll', handleScroll);
});

// ── Page Navigation ───────────────────────────────────────
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('is-active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.add('is-active');
  } else if (page === 'home') {
    document.getElementById('page-home').classList.add('is-active');
  }

  const navLink = document.querySelector(`[data-page="${page}"]`);
  if (navLink) navLink.classList.add('active');

  currentPage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  revealStaggerElements();
}

// ── Render Anime Grid ─────────────────────────────────────
function renderAnimeGrid(containerId, animeList) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = animeList.map((anime, i) => `
    <div class="anime-card" style="animation-delay:${i * 60}ms" onclick="openAnimeDetail('${anime.id}')">
      <div class="anime-card-poster">
        <img src="${anime.poster}" alt="${anime.title}" loading="lazy">
        <div class="anime-card-overlay"></div>
        <div class="anime-card-play">
          <button class="btn btn-primary btn-icon" onclick="event.stopPropagation();playAnime('${anime.id}')">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
        <span class="anime-card-badge badge-${anime.badge}">${anime.badge.toUpperCase()}</span>
      </div>
      <div class="anime-card-info">
        <div class="anime-card-title">${anime.title}</div>
        <div class="anime-card-meta">
          <span class="anime-card-rating">★ ${anime.rating}</span>
          <span>${anime.type}</span>
          <span>${anime.year}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderContinueWatching() {
  const container = document.getElementById('continueRow');
  if (!container) return;
  const watched = ANIME_DB.slice(0, 5).map((a, i) => ({
    ...a,
    progress: Math.floor(Math.random() * 80) + 10,
    episode: i + 1
  }));
  container.innerHTML = watched.map((anime, i) => `
    <div class="anime-card" onclick="playAnime('${anime.id}')">
      <div class="anime-card-poster">
        <img src="${anime.poster}" alt="${anime.title}" loading="lazy">
        <div class="anime-card-overlay"></div>
        <div class="anime-card-play">
          <button class="btn btn-primary btn-icon" onclick="event.stopPropagation();playAnime('${anime.id}')">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(255,255,255,0.2)">
          <div style="height:100%;background:var(--accent);width:${anime.progress}%;border-radius:2px"></div>
        </div>
      </div>
      <div class="anime-card-info">
        <div class="anime-card-title">${anime.title}</div>
        <div class="anime-card-meta">
          <span>Ep ${anime.episode}</span>
          <span>${anime.progress}% watched</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderGenreTags() {
  const container = document.getElementById('genreTags');
  if (!container) return;
  container.innerHTML = GENRES.map(g =>
    `<button class="genre-tag" onclick="filterByGenre('${g}', this)">${g}</button>`
  ).join('');
}

function renderEpisodes() {
  const container = document.getElementById('episodeList');
  if (!container) return;
  container.innerHTML = EPISODES.map((ep, i) => `
    <div class="episode-item ${i === 0 ? 'active' : ''}" onclick="playEpisode(${ep.num})">
      <div class="episode-thumb">
        <img src="${ep.poster}" alt="Ep ${ep.num}" loading="lazy">
      </div>
      <div class="episode-info">
        <div class="episode-title">Episode ${ep.num}: ${ep.title}</div>
        <div class="episode-meta">${ep.duration} • ${i === 0 ? 'Now Playing' : 'Click to play'}</div>
      </div>
    </div>
  `).join('');
}

// ── Anime Detail Modal ────────────────────────────────────
function openAnimeDetail(id) {
  const anime = ANIME_DB.find(a => a.id === id);
  if (!anime) return;

  const modal = document.getElementById('detailModal');
  const backdrop = document.getElementById('detailBackdrop');
  const title = document.getElementById('detailTitle');
  const body = document.getElementById('detailBody');

  title.textContent = anime.title;
  body.innerHTML = `
    <div style="display:flex;gap:20px;margin-bottom:20px">
      <img src="${anime.poster}" alt="${anime.title}" style="width:160px;height:220px;border-radius:var(--radius-md);object-fit:cover">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span class="anime-card-rating" style="font-size:16px">★ ${anime.rating}</span>
          <span style="color:var(--text-muted);font-size:14px">${anime.type} • ${anime.year} • ${anime.episodes} episodes</span>
        </div>
        <p style="color:var(--text-secondary);font-size:14px;margin-bottom:12px">${anime.desc}</p>
        <div class="genre-tags" style="margin-bottom:16px">
          ${anime.genre.map(g => `<span class="genre-tag active" style="cursor:default;padding:4px 10px;font-size:11px">${g}</span>`).join('')}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" onclick="playAnime('${anime.id}');closeDetail()">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
            Watch Now
          </button>
          <button class="btn btn-secondary" onclick="addToWatchlist('${anime.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            Watchlist
          </button>
        </div>
      </div>
    </div>
    <h4 style="margin-bottom:8px;font-size:14px">AI Summary</h4>
    <div class="ai-msg ai-msg-bot" style="max-width:100%;background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px 16px">
      <p style="font-size:13px;color:var(--text-secondary)">${getAISummary(anime.id)}</p>
    </div>
  `;

  modal.classList.add('is-open');
  backdrop.classList.add('is-open');
}

function closeDetail() {
  document.getElementById('detailModal').classList.remove('is-open');
  document.getElementById('detailModal').classList.add('is-closing');
  document.getElementById('detailBackdrop').classList.remove('is-open');
  setTimeout(() => {
    document.getElementById('detailModal').classList.remove('is-closing');
  }, 150);
}

function getAISummary(id) {
  const summaries = {
    'attack-on-titan': 'The final season reveals the truth about Titans and the outside world. Eren takes drastic measures, and the Survey Corps must decide where their loyalties lie in an epic finale.',
    'jujutsu-kaisen': 'Dark supernatural battles intensify as sorcerers face increasingly powerful curses. The animation quality is absolutely stunning.',
    'demon-slayer': 'The Hashira Training Arc prepares our heroes for the ultimate battle against Muzan Kibutsuji.',
    'one-piece': 'The Egghead Arc brings revolutionary revelations about the world\'s history and the Void Century.',
    'solo-leveling': 'Sung Jinwoo grows ever stronger, unlocking new abilities and facing threats that could destroy humanity.',
  };
  return summaries[id] || 'An incredible anime experience that pushes the boundaries of storytelling and animation.';
}

// ── Player ────────────────────────────────────────────────
function playAnime(id) {
  const anime = ANIME_DB.find(a => a.id === id);
  if (!anime) return;

  showPage('player');
  document.getElementById('page-home').classList.remove('is-active');
  document.getElementById('page-player').classList.add('is-active');
  document.getElementById('playerTitle').textContent = `${anime.title} S1E1`;
  document.getElementById('playerAnimeTitle').textContent = anime.title;
  document.getElementById('playerEpisodeInfo').textContent = `Episode 1 — "${EPISODES[0].title}"`;
  document.getElementById('heroBg').style.backgroundImage = `url('${anime.poster}')`;
}

function playEpisode(num) {
  document.getElementById('playerTitle').textContent = `Attack on Titan S1E${num}`;
  document.getElementById('playerEpisodeInfo').textContent = `Episode ${num} — "${EPISODES[num-1].title}"`;
  document.querySelectorAll('.episode-item').forEach((el, i) => {
    el.classList.toggle('active', i === num - 1);
  });
}

function togglePlay() {
  isPlaying = !isPlaying;
  const icon = document.getElementById('playIcon');
  if (isPlaying) {
    icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    animateProgress();
  } else {
    icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  }
}

function animateProgress() {
  if (!isPlaying) return;
  const bar = document.getElementById('progressBar');
  let width = parseFloat(bar.style.width) || 0;
  if (width < 100) {
    bar.style.width = (width + 0.1) + '%';
    requestAnimationFrame(animateProgress);
  }
}

function seekVideo(e) {
  const rect = e.target.getBoundingClientRect();
  const pct = ((e.clientX - rect.left) / rect.width) * 100;
  document.getElementById('progressBar').style.width = pct + '%';
}

function showPlayerControls() {
  const controls = document.getElementById('playerControls');
  controls.style.opacity = '1';
  clearTimeout(window._hideControlsTimer);
  window._hideControlsTimer = setTimeout(() => {
    if (isPlaying) controls.style.opacity = '0';
  }, 3000);
}

function toggleFullscreen() {
  const el = document.getElementById('playerContainer');
  if (!document.fullscreenElement) {
    el.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

function toggleSubtitles() {
  showSuccessToast('Subtitles toggled');
}

// ── Dropdown / Notification Panel ─────────────────────────
function toggleNotifs() {
  notifOpen = !notifOpen;
  const panel = document.getElementById('notifPanel');
  if (notifOpen) {
    panel.classList.remove('is-closing');
    panel.classList.add('is-open');
  } else {
    panel.classList.remove('is-open');
    panel.classList.add('is-closing');
    setTimeout(() => panel.classList.remove('is-closing'), 150);
  }
}

// ── AI Panel ──────────────────────────────────────────────
function toggleAI() {
  aiOpen = !aiOpen;
  const panel = document.getElementById('aiPanel');
  const backdrop = document.getElementById('aiBackdrop');
  if (aiOpen) {
    panel.classList.remove('is-closing');
    panel.classList.add('is-open');
    backdrop.classList.add('is-open');
    document.getElementById('aiInput').focus();
  } else {
    panel.classList.remove('is-open');
    panel.classList.add('is-closing');
    backdrop.classList.remove('is-open');
    setTimeout(() => panel.classList.remove('is-closing'), 350);
  }
}

function sendAIMessage() {
  const input = document.getElementById('aiInput');
  const msg = input.value.trim();
  if (!msg) return;

  const container = document.getElementById('aiMessages');
  container.innerHTML += `<div class="ai-msg ai-msg-user">${escapeHtml(msg)}</div>`;
  input.value = '';

  // Simulate AI typing
  setTimeout(() => {
    const response = generateAIResponse(msg);
    container.innerHTML += `<div class="ai-msg ai-msg-bot"><p>${response}</p></div>`;
    container.scrollTop = container.scrollHeight;
  }, 800 + Math.random() * 1200);

  container.scrollTop = container.scrollHeight;
}

function generateAIResponse(query) {
  const lower = query.toLowerCase();
  
  // Fable 5 Pattern: Match intent before responding
  // Lead with outcome, not preamble
  
  if (lower.match(/recommend|suggest|watch next|should i watch|what should/)) {
    return AI_RESPONSES.recommend[Math.floor(Math.random() * AI_RESPONSES.recommend.length)];
  }
  if (lower.match(/similar to|like |same as|reminds me|comparable|compare/)) {
    return AI_RESPONSES.similar[Math.floor(Math.random() * AI_RESPONSES.similar.length)];
  }
  if (lower.match(/summary|summarize|recap|what happens|plot|about|tell me about/)) {
    return AI_RESPONSES.summary[Math.floor(Math.random() * AI_RESPONSES.summary.length)];
  }
  if (lower.match(/hello|hi |hey|sup|yo|greetings|what's up/)) {
    return AI_RESPONSES.greeting[Math.floor(Math.random() * AI_RESPONSES.greeting.length)];
  }
  if (lower.match(/best|top|greatest|favorite|rating|highest|ranked|classics|must watch/)) {
    return AI_RESPONSES.best[Math.floor(Math.random() * AI_RESPONSES.best.length)];
  }
  if (lower.match(/studio|animation|animate|production/)) {
    return "Studio quality varies significantly. **Ufotable** (Demon Slayer, Fate) sets the visual standard. **MAPPA** (Attack on Titan, Jujutsu Kaisen) handles complex narratives well. **Wit Studio** (Vinland Saga, early Attack on Titan) excels at emotional weight. **Madhouse** (Solo Leveling, Hunter x Hunter) delivers consistent excellence. What kind of visual style do you prefer?";
  }
  if (lower.match(/genre|type|category|kind/)) {
    return "Anime spans dozens of genres, but the most impactful right now: **Seinen** for mature, psychological narratives. **Isekai** when done well (not the power-fantasy formula). **Slice of Life** for character-driven warmth. **Mecha** for philosophical action. Each has standouts — which direction interests you?";
  }
  if (lower.match(/episode|long|short|commit|time|how many/)) {
    return "Shorter series for commitment-phobes: **Cyberpunk: Edgerunners** (10 eps, complete story). **Mob Psycho 100** (seasons of 12-13). For longer investments: **One Piece** rewards patience over 1000+ episodes. **Gintama** starts slow but peaks at episode 200+. What's your tolerance?";
  }
  if (lower.match(/season|current|new|airing|ongoing|winter|spring|summer|fall/)) {
    return "Current season highlights: **Solo Leveling Season 2** continues the power fantasy. **Dandadan** brings creative chaos. **Blue Lock Season 2** for sports anime fans. **Kaiju No. 8** delivers action with heart. Want specifics on any of these?";
  }
  
  return AI_RESPONSES.default[Math.floor(Math.random() * AI_RESPONSES.default.length)];
}

// ── Search ────────────────────────────────────────────────
function handleSearch(value) {
  const container = document.getElementById('globalSearch');
  if (value.length > 0) {
    container.classList.add('has-value');
  } else {
    container.classList.remove('has-value');
  }

  if (value.length > 1) {
    const results = ANIME_DB.filter(a =>
      a.title.toLowerCase().includes(value.toLowerCase()) ||
      a.genre.some(g => g.toLowerCase().includes(value.toLowerCase()))
    );
    showSearchResults(results);
  } else {
    hideSearchResults();
  }
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  input.value = '';
  document.getElementById('globalSearch').classList.remove('has-value');
  hideSearchResults();
}

function showSearchResults(results) {
  let dropdown = document.getElementById('searchDropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'searchDropdown';
    dropdown.className = 't-dropdown is-open';
    dropdown.style.cssText = 'position:absolute;top:100%;left:0;right:0;margin-top:8px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);max-height:320px;overflow-y:auto;z-index:100';
    document.getElementById('globalSearch').appendChild(dropdown);
  }

  if (results.length === 0) {
    dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">No results found</div>';
  } else {
    dropdown.innerHTML = results.map(a => `
      <div class="notif-item" onclick="openAnimeDetail('${a.id}');hideSearchResults()">
        <div class="notif-icon" style="background:var(--bg-elevated);border-radius:var(--radius-sm);overflow:hidden;width:40px;height:40px">
          <img src="${a.poster}" style="width:100%;height:100%;object-fit:cover">
        </div>
        <div class="notif-text">
          <p style="font-size:13px;font-weight:600">${a.title}</p>
          <small>★ ${a.rating} • ${a.genre[0]}</small>
        </div>
      </div>
    `).join('');
  }
}

function hideSearchResults() {
  const dropdown = document.getElementById('searchDropdown');
  if (dropdown) dropdown.remove();
}

// ── Watchlist ─────────────────────────────────────────────
function addToWatchlist(id) {
  if (!watchlist.includes(id)) {
    watchlist.push(id);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    showSuccessToast('Added to Watchlist!');
  } else {
    watchlist = watchlist.filter(i => i !== id);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    showSuccessToast('Removed from Watchlist');
  }
}

// ── n8n Workflow Toggle ───────────────────────────────────
function toggleWorkflow(el) {
  const toggle = el.querySelector('.n8n-workflow-toggle');
  toggle.classList.toggle('active');
  const name = el.querySelector('.n8n-workflow-name').textContent;
  const isActive = toggle.classList.contains('active');
  showSuccessToast(`${name} ${isActive ? 'enabled' : 'disabled'}`);
}

// ── Genre Filter ──────────────────────────────────────────
function filterByGenre(genre, btn) {
  document.querySelectorAll('.genre-tag').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  const filtered = ANIME_DB.filter(a => a.genre.includes(genre));
  renderAnimeGrid('trendingGrid', filtered.length ? filtered : ANIME_DB.slice(0, 8));

  // Re-reveal stagger
  const section = document.getElementById('trendingSection');
  section.classList.remove('is-revealed');
  requestAnimationFrame(() => section.classList.add('is-revealed'));
}

// ── Refresh AI Recommendations ────────────────────────────
function refreshAI() {
  const grid = document.getElementById('aiGrid');
  const shuffled = [...ANIME_DB].sort(() => Math.random() - 0.5).slice(0, 8);
  grid.style.opacity = '0';
  grid.style.filter = 'blur(4px)';
  setTimeout(() => {
    renderAnimeGrid('aiGrid', shuffled);
    grid.style.transition = 'opacity 0.5s ease, filter 0.5s ease';
    grid.style.opacity = '1';
    grid.style.filter = 'blur(0)';
  }, 300);
}

// ── Share ─────────────────────────────────────────────────
function shareAnime() {
  if (navigator.share) {
    navigator.share({ title: 'AnimeStream', text: 'Check out this anime!', url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    showSuccessToast('Link copied to clipboard!');
  }
}

// ── Profile ───────────────────────────────────────────────
function toggleProfile() {
  showSuccessToast('Profile settings coming soon!');
}

// ── Tabs ──────────────────────────────────────────────────
function initTabs() {
  const bars = document.querySelectorAll('.t-tabs');
  bars.forEach(bar => {
    const pill = bar.querySelector('.t-tabs-pill');
    const tabs = [...bar.querySelectorAll('.t-tab')];
    if (!pill || !tabs.length) return;

    function moveTo(tab, animate) {
      if (!animate) {
        pill.style.transition = 'none';
        pill.style.transform = `translateX(${tab.offsetLeft}px)`;
        pill.style.width = `${tab.offsetWidth}px`;
        void pill.offsetWidth;
        pill.style.transition = '';
      } else {
        pill.style.transform = `translateX(${tab.offsetLeft}px)`;
        pill.style.width = `${tab.offsetWidth}px`;
      }
    }

    const active = () => tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0];

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.setAttribute('aria-selected', t === tab ? 'true' : 'false'));
        moveTo(tab, true);
      });
    });

    requestAnimationFrame(() => moveTo(active(), false));
    window.addEventListener('resize', () => moveTo(active(), false));
  });
}

// ── Skeleton Loaders ──────────────────────────────────────
function initSkeletonLoaders() {
  document.querySelectorAll('.t-skel').forEach(skel => {
    const skeleton = skel.querySelector('.t-skel-skeleton');
    if (skeleton) skeleton.classList.add('is-pulsing');
    const total = 1000;
    setTimeout(() => skel.classList.add('is-revealed'), total);
  });
}

// ── Stagger Reveal ────────────────────────────────────────
function revealStaggerElements() {
  const elements = document.querySelectorAll('.t-stagger');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => {
    el.classList.remove('is-revealed');
    observer.observe(el);
  });
}

// ── Scroll Effects ────────────────────────────────────────
function handleScroll() {
  const nav = document.getElementById('nav');
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(10, 10, 15, 0.95)';
  } else {
    nav.style.background = 'rgba(10, 10, 15, 0.85)';
  }
}

// ── Success Toast ─────────────────────────────────────────
function showSuccessToast(msg) {
  const check = document.getElementById('successCheck');
  check.classList.add('is-visible');
  check.style.opacity = '1';
  check.querySelector('circle').style.stroke = 'var(--accent)';
  check.querySelector('path').style.stroke = 'var(--accent)';

  // Show message
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:80px;right:24px;background:var(--bg-elevated);color:var(--text-primary);padding:12px 20px;border-radius:var(--radius-md);font-size:13px;font-weight:500;z-index:1000;border:1px solid var(--border);box-shadow:var(--shadow-elevated)';
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);

  setTimeout(() => {
    check.classList.remove('is-visible');
    check.style.opacity = '0';
    check.querySelector('circle').style.stroke = '#22c55e';
    check.querySelector('path').style.stroke = '#22c55e';
  }, 1500);
}

// ── Utilities ─────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Fable 5 Enhanced: Context Awareness ───────────────────
const CONTEXT_AWARENESS = {
  // Track user preferences from conversation
  preferences: {
    genres: [],
    liked: [],
    disliked: [],
    mood: null,
    episodePreference: null
  },
  
  // Analyze user input for preferences
  analyzePreferences(input) {
    const lower = input.toLowerCase();
    
    // Genre detection
    const genres = ['action', 'romance', 'sci-fi', 'comedy', 'fantasy', 'drama', 'horror', 'sports', 'isekai', 'psychological', 'slice of life'];
    genres.forEach(g => {
      if (lower.includes(g) && !this.preferences.genres.includes(g)) {
        this.preferences.genres.push(g);
      }
    });
    
    // Mood detection
    if (lower.match(/funny|comedy|hilarious|lighthearted/)) this.preferences.mood = 'comedic';
    if (lower.match(/dark|serious|heavy|intense/)) this.preferences.mood = 'dark';
    if (lower.match(/relaxing|chill|calm|peaceful/)) this.preferences.mood = 'relaxing';
    if (lower.match(/exciting|hype|intense|action/)) this.preferences.mood = 'exciting';
    
    // Episode preference
    if (lower.match(/short|quick|few episode/)) this.preferences.episodePreference = 'short';
    if (lower.match(/long|commit|epic|series/)) this.preferences.episodePreference = 'long';
    
    // Like/dislike tracking
    if (lower.match(/love|like|enjoy|favorite|great/)) {
      const anime = this.extractAnimeMention(lower);
      if (anime) this.preferences.liked.push(anime);
    }
    if (lower.match(/hate|dislike|boring|overrated/)) {
      const anime = this.extractAnimeMention(lower);
      if (anime) this.preferences.disliked.push(anime);
    }
  },
  
  // Extract anime name from input
  extractAnimeMention(input) {
    const knownAnime = ['attack on titan', 'death note', 'demon slayer', 'one piece', 'naruto', 'jujutsu kaisen', 'solo leveling', 'frieren', 'chainsaw man', 'spy family', 'my hero academia'];
    return knownAnime.find(a => input.includes(a)) || null;
  },
  
  // Get contextual response modifier
  getContextModifier() {
    const p = this.preferences;
    if (p.genres.length > 0) {
      return `Based on your interest in ${p.genres.slice(-2).join(' and ')}... `;
    }
    if (p.mood === 'dark') return "For something with weight... ";
    if (p.mood === 'comedic') return "If you want something lighter... ";
    if (p.mood === 'relaxing') return "For a more contemplative pace... ";
    return "";
  }
};

// Enhanced AI message handler with context tracking
const originalSendAIMessage = window.sendAIMessage;
window.sendAIMessage = function() {
  const input = document.getElementById('aiInput');
  const msg = input.value.trim();
  if (!msg) return;

  // Track preferences
  CONTEXT_AWARENESS.analyzePreferences(msg);
  
  const container = document.getElementById('aiMessages');
  container.innerHTML += `<div class="ai-msg ai-msg-user">${escapeHtml(msg)}</div>`;
  input.value = '';

  // Simulate AI typing with context awareness
  setTimeout(() => {
    const response = generateAIResponse(msg);
    const contextPrefix = CONTEXT_AWARENESS.getContextModifier();
    container.innerHTML += `<div class="ai-msg ai-msg-bot"><p>${contextPrefix}${response}</p></div>`;
    container.scrollTop = container.scrollHeight;
  }, 800 + Math.random() * 1200);

  container.scrollTop = container.scrollHeight;
};

// ── Hero Background Rotation ──────────────────────────────
let heroIndex = 0;
const heroAnime = ANIME_DB.slice(0, 5);
setInterval(() => {
  heroIndex = (heroIndex + 1) % heroAnime.length;
  const heroBg = document.getElementById('heroBg');
  if (heroBg && currentPage === 'home') {
    heroBg.style.opacity = '0';
    setTimeout(() => {
      heroBg.style.backgroundImage = `url('${heroAnime[heroIndex].poster}')`;
      heroBg.style.opacity = '1';
    }, 500);
  }
}, 8000);

// Click outside to close dropdowns
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-search') && document.getElementById('searchDropdown')) {
    hideSearchResults();
  }
  if (!e.target.closest('#notifBtn') && !e.target.closest('.notif-panel') && notifOpen) {
    toggleNotifs();
  }
});
