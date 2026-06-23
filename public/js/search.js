const urlParams = new URLSearchParams(window.location.search);
const query = urlParams.get('q');

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
      countEl.textContent = 'No results found';
      container.innerHTML = '<div class="empty-state"><h3>No anime found</h3><p>Try a different search term</p></div>';
    }
  } catch (error) {
    container.innerHTML = '<div class="empty-state"><h3>Error searching</h3></div>';
  }
}
