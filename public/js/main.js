const popularAnime = [
  'naruto shippuden', 'one piece', 'attack on titan', 'demon slayer',
  'jujutsu kaisen', 'my hero academia', 'dragon ball super',
  'solo leveling', 'fullmetal alchemist', 'death note'
];

const trendingAnime = [
  'witch hat atelier', 'one piece', 'farming life in another world',
  'wistoria', 'bleach', 'reincarnated as a slime', 're zero'
];

let currentSlide = 0;
const slides = document.querySelectorAll('.hero-slide');

function goToSlide(n) {
  slides[currentSlide].classList.remove('active');
  currentSlide = n;
  slides[currentSlide].classList.add('active');
  updateDots();
}

function updateDots() {
  document.querySelectorAll('.hero-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

setInterval(() => {
  goToSlide((currentSlide + 1) % slides.length);
}, 5000);

async function loadAnime(url, containerId) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    const container = document.getElementById(containerId);
    
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
      container.innerHTML = '<div class="empty-state"><h3>No results found</h3><p>Try again later</p></div>';
    }
  } catch (error) {
    document.getElementById(containerId).innerHTML = '<div class="empty-state"><h3>Error loading</h3></div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAnime('/api/search?q=naruto', 'trending-grid');
  loadAnime('/api/search?q=one piece', 'popular-grid');
});
