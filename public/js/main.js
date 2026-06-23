let currentSlide = 0;

const slides = [
  { title: "One Piece", desc: "Gol D. Roger was known as the Pirate King, the strongest and most infamous being to have sailed the Grand Line.", id: 21 },
  { title: "Naruto Shippuden", desc: "Naruto Uzumaki, a young ninja with dreams of becoming the strongest ninja and leader of his village.", id: 1735 },
  { title: "Attack on Titan", desc: "Humanity lives within enormous walled cities to protect themselves from the Titans.", id: 16498 }
];

function goToSlide(n) {
  document.querySelectorAll('.hero-slide')[currentSlide].classList.remove('active');
  currentSlide = n;
  document.querySelectorAll('.hero-slide')[currentSlide].classList.add('active');
  updateDots();
}

function updateDots() {
  document.querySelectorAll('.hero-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

setInterval(() => {
  goToSlide((currentSlide + 1) % 3);
}, 5000);

function createAnimeCard(anime) {
  const img = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x400/1a1b23/ed3832?text=No+Image';
  const title = anime.title || anime.title_english || 'Unknown';
  const episodes = anime.episodes ? `${anime.episodes} eps` : '?';
  const score = anime.score ? `★ ${anime.score}` : '';
  
  return `
    <a href="/watch?id=${anime.mal_id}" class="anime-card">
      <img class="anime-card-img" src="${img}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400/1a1b23/ed3832?text=No+Image'">
      <div class="anime-card-info">
        <div class="anime-card-title">${title}</div>
        <div class="anime-card-meta">
          <span class="badge badge-sub">SUB</span>
          <span>${episodes}</span>
          ${score ? `<span class="ep-count">${score}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

async function loadAnime(url, containerId) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    const container = document.getElementById(containerId);
    
    if (data.results && data.results.length > 0) {
      container.innerHTML = data.results.map(anime => createAnimeCard(anime)).join('');
    } else {
      container.innerHTML = '<div class="empty-state"><h3>No results found</h3><p>Try again later</p></div>';
    }
  } catch (error) {
    document.getElementById(containerId).innerHTML = '<div class="empty-state"><h3>Error loading</h3></div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAnime('/api/trending', 'trending-grid');
  loadAnime('/api/airing', 'popular-grid');
});
