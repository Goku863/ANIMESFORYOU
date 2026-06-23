const urlParams = new URLSearchParams(window.location.search);
const query = urlParams.get('q');

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

document.addEventListener('DOMContentLoaded', () => {
  if (query) {
    document.getElementById('search-input').value = query;
    document.getElementById('search-title').textContent = `Search Results for "${query}"`;
    searchAnime(query);
  } else {
    document.getElementById('search-title').textContent = 'Search for an anime';
    document.getElementById('search-grid').innerHTML = '<div class="empty-state"><h3>Enter a search term</h3></div>';
  }
});

async function searchAnime(q) {
  const container = document.getElementById('search-grid');
  const countEl = document.getElementById('search-count');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      countEl.textContent = `Found ${data.results.length} results`;
      container.innerHTML = data.results.map(anime => createAnimeCard(anime)).join('');
    } else {
      countEl.textContent = 'No results found';
      container.innerHTML = '<div class="empty-state"><h3>No anime found</h3><p>Try a different search term</p></div>';
    }
  } catch (error) {
    container.innerHTML = '<div class="empty-state"><h3>Error searching</h3></div>';
  }
}
