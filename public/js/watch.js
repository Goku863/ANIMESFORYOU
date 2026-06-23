const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');
let animeData = null;

document.addEventListener('DOMContentLoaded', () => {
  if (animeId) {
    loadAnimeDetails(animeId);
  } else {
    document.getElementById('watch-title').textContent = 'No anime selected';
  }
});

async function loadAnimeDetails(id) {
  const player = document.getElementById('video-player');
  const titleEl = document.getElementById('watch-title');
  const metaEl = document.getElementById('watch-meta');
  
  player.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  try {
    const res = await fetch(`/api/anime/${id}`);
    animeData = await res.json();
    
    if (animeData && animeData.mal_id) {
      titleEl.textContent = animeData.title || animeData.title_english;
      
      const episodes = animeData.episodes ? `${animeData.episodes} episodes` : 'Unknown';
      const score = animeData.score ? `★ ${animeData.score}` : '';
      const type = animeData.type || '?';
      const status = animeData.status || '?';
      
      metaEl.innerHTML = `
        <span>${type}</span>
        <span>${episodes}</span>
        <span>${status}</span>
        ${score ? `<span class="ep-count">${score}</span>` : ''}
      `;
      
      // Show trailer or info
      if (animeData.trailer?.youtube_id) {
        player.innerHTML = `
          <iframe src="https://www.youtube.com/embed/${animeData.trailer.youtube_id}" 
            allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
          </iframe>
        `;
      } else {
        player.innerHTML = `
          <div style="padding: 2rem; text-align: center;">
            <img src="${animeData.images?.jpg?.large_image_url}" alt="${animeData.title}" 
              style="max-width: 300px; border-radius: 8px; margin-bottom: 1rem;">
            <p style="color: var(--text-secondary);">No trailer available</p>
          </div>
        `;
      }
      
      // Load episode list
      loadEpisodeList(id);
      
      // Load recommendations
      loadRecommendations(id);
    }
  } catch (error) {
    player.innerHTML = '<div class="empty-state"><h3>Error loading anime</h3></div>';
  }
}

async function loadEpisodeList(id) {
  const nav = document.getElementById('episode-nav');
  const episodes = animeData?.episodes || 24;
  
  let html = '';
  for (let i = 1; i <= Math.min(episodes, 12); i++) {
    html += `<button class="ep-btn ${i === 1 ? 'active' : ''}" onclick="playEpisode(${i})">Ep ${i}</button>`;
  }
  if (episodes > 12) {
    html += `<button class="ep-btn">+${episodes - 12} more</button>`;
  }
  
  nav.innerHTML = html;
}

function playEpisode(ep) {
  document.querySelectorAll('.ep-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const player = document.getElementById('video-player');
  const title = animeData?.title || 'anime';
  
  // Use a free anime streaming embed
  const searchQuery = encodeURIComponent(`${title} episode ${ep}`);
  player.innerHTML = `
    <iframe src="https://www.youtube.com/results?search_query=${searchQuery}+english+sub" 
      allowfullscreen style="width: 100%; height: 100%; border: none;">
    </iframe>
  `;
}

async function loadRecommendations(id) {
  const container = document.getElementById('sidebar-episodes');
  
  try {
    const res = await fetch(`/api/recommendations/${id}`);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      container.innerHTML = data.results.map(item => {
        const anime = item.entry?.[0];
        if (!anime) return '';
        const img = anime.images?.jpg?.image_url || 'https://via.placeholder.com/60x80/1a1b23/ed3832?text=?';
        
        return `
          <a href="/watch?id=${anime.mal_id}" class="sidebar-item">
            <img class="sidebar-item-img" src="${img}" alt="${anime.title}" loading="lazy">
            <div class="sidebar-item-info">
              <div class="sidebar-item-title">${anime.title}</div>
              <div class="sidebar-item-meta">Recommendation</div>
            </div>
          </a>
        `;
      }).join('');
    } else {
      container.innerHTML = '<div class="empty-state"><p>No recommendations</p></div>';
    }
  } catch (error) {
    container.innerHTML = '<div class="empty-state"><p>Error loading</p></div>';
  }
}
