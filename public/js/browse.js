const defaultAnime = [
  'naruto', 'one piece', 'attack on titan', 'demon slayer',
  'jujutsu kaisen', 'my hero academia', 'dragon ball',
  'solo leveling', 'death note', 'fullmetal alchemist',
  'sword art online', 'tokyo ghoul', 'one punch man',
  'hunter x hunter', 'bleach', 'fairy tail'
];

let currentFilter = 'all';

async function loadBrowse(filter = 'all') {
  const container = document.getElementById('browse-grid');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  try {
    let query = defaultAnime[Math.floor(Math.random() * defaultAnime.length)];
    if (filter === 'movie') query = 'anime movie';
    if (filter === 'dub') query += ' dub';
    
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      container.innerHTML = data.results.map(anime => `
        <a href="/watch?anime=${encodeURIComponent(anime.title)}&episode=1" class="anime-card">
          <img class="anime-card-img" src="https://via.placeholder.com/300x400/1a1b23/ed3832?text=${encodeURIComponent(anime.title.substring(0,15))}" alt="${anime.title}" loading="lazy">
          <div class="anime-card-info">
            <div class="anime-card-title">${anime.title}</div>
            <div class="anime-card-meta">
              <span class="badge badge-sub">SUB</span>
              <span>${anime.source || 'Multi'}</span>
            </div>
          </div>
        </a>
      `).join('');
    } else {
      container.innerHTML = '<div class="empty-state"><h3>No anime found</h3><p>Try a different filter</p></div>';
    }
  } catch (error) {
    container.innerHTML = '<div class="empty-state"><h3>Error loading anime</h3></div>';
  }
}

function filterAnime(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(filter) || (filter === 'all' && btn.textContent === 'All'));
  });
  loadBrowse(filter);
}

document.addEventListener('DOMContentLoaded', () => loadBrowse());
