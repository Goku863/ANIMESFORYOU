let currentFilter = 'all';

function createAnimeCard(anime) {
  const img = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x400/1a1b23/ed3832?text=No+Image';
  const title = anime.title || anime.title_english || 'Unknown';
  const episodes = anime.episodes ? `${anime.episodes} eps` : '?';
  const score = anime.score ? `★ ${anime.score}` : '';
  const type = anime.type || '?';
  
  return `
    <a href="/watch?id=${anime.mal_id}" class="anime-card">
      <img class="anime-card-img" src="${img}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400/1a1b23/ed3832?text=No+Image'">
      <div class="anime-card-info">
        <div class="anime-card-title">${title}</div>
        <div class="anime-card-meta">
          <span class="badge badge-sub">${type}</span>
          <span>${episodes}</span>
          ${score ? `<span class="ep-count">${score}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

async function loadBrowse() {
  const container = document.getElementById('browse-grid');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  try {
    let url = '/api/trending';
    if (currentFilter === 'airing') url = '/api/airing';
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      container.innerHTML = data.results.map(anime => createAnimeCard(anime)).join('');
    } else {
      container.innerHTML = '<div class="empty-state"><h3>No anime found</h3></div>';
    }
  } catch (error) {
    container.innerHTML = '<div class="empty-state"><h3>Error loading anime</h3></div>';
  }
}

function filterAnime(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const btnFilter = btn.textContent.toLowerCase().replace('ed', '').replace('bing', '');
    btn.classList.toggle('active', btnFilter === filter || (filter === 'all' && btn.textContent === 'All'));
  });
  loadBrowse();
}

document.addEventListener('DOMContentLoaded', () => loadBrowse());
