const urlParams = new URLSearchParams(window.location.search);
const animeName = urlParams.get('anime');
let currentEpisode = parseInt(urlParams.get('episode')) || 1;

document.addEventListener('DOMContentLoaded', () => {
  if (animeName) {
    document.getElementById('watch-title').textContent = animeName.replace(/-/g, ' ');
    loadEpisode(animeName, currentEpisode);
    loadEpisodeList(animeName);
  } else {
    document.getElementById('watch-title').textContent = 'No anime selected';
  }
});

async function loadEpisode(anime, episode) {
  const player = document.getElementById('video-player');
  const serverList = document.getElementById('server-list');
  
  player.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  document.getElementById('watch-ep').textContent = `Episode ${episode}`;
  
  try {
    const res = await fetch(`/api/stream?anime=${encodeURIComponent(anime)}&episode=${episode}`);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      player.innerHTML = `<iframe src="${data.results[0].link}" allowfullscreen></iframe>`;
      
      serverList.innerHTML = data.results.map((server, i) => `
        <button class="server-btn ${i === 0 ? 'active' : ''}" onclick="changeServer('${server.link}', this)">
          ${server.source}
        </button>
      `).join('');
    } else {
      player.innerHTML = '<div class="empty-state"><h3>No stream found</h3><p>Try a different server or episode</p></div>';
    }
  } catch (error) {
    player.innerHTML = '<div class="empty-state"><h3>Error loading stream</h3></div>';
  }
  
  updateEpisodeNav(episode);
}

function changeServer(link, btn) {
  document.getElementById('video-player').innerHTML = `<iframe src="${link}" allowfullscreen></iframe>`;
  document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function updateEpisodeNav(episode) {
  const nav = document.getElementById('episode-nav');
  let html = '';
  
  if (episode > 1) {
    html += `<button class="ep-btn" onclick="goToEpisode(${episode - 1})"><i class="fas fa-chevron-left"></i> Prev</button>`;
  }
  
  html += `<button class="ep-btn active">Episode ${episode}</button>`;
  
  html += `<button class="ep-btn" onclick="goToEpisode(${episode + 1})">Next <i class="fas fa-chevron-right"></i></button>`;
  
  nav.innerHTML = html;
}

function goToEpisode(ep) {
  currentEpisode = ep;
  window.history.pushState({}, '', `?anime=${encodeURIComponent(animeName)}&episode=${ep}`);
  loadEpisode(animeName, ep);
}

async function loadEpisodeList(anime) {
  const container = document.getElementById('sidebar-episodes');
  
  try {
    const res = await fetch(`/api/links?anime=${encodeURIComponent(anime)}`);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      container.innerHTML = data.results.slice(0, 10).map((item, i) => `
        <div class="sidebar-item" onclick="goToEpisode(${i + 1})">
          <img class="sidebar-item-img" src="https://via.placeholder.com/60x80/1a1b23/ed3832?text=Ep${i+1}" alt="Episode ${i+1}">
          <div class="sidebar-item-info">
            <div class="sidebar-item-title">${item.title || anime}</div>
            <div class="sidebar-item-meta">Episode ${i + 1} - ${item.source}</div>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div class="empty-state"><p>No episodes found</p></div>';
    }
  } catch (error) {
    container.innerHTML = '<div class="empty-state"><p>Error loading episodes</p></div>';
  }
}
