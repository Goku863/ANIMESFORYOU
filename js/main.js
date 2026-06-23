// Main JavaScript utilities

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy loading images
function initLazyLoading() {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Format number (e.g., 1234567 -> 1.2M)
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Local Storage helpers
const Storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage error:', e);
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    }
};

// User preferences
const UserPrefs = {
    getWatchHistory() {
        return Storage.get('watch_history', {});
    },

    addToWatchHistory(animeId, episode) {
        const history = this.getWatchHistory();
        history[animeId] = {
            episode,
            timestamp: Date.now()
        };
        Storage.set('watch_history', history);
    },

    getFavorites() {
        return Storage.get('favorites', []);
    },

    toggleFavorite(anime) {
        const favorites = this.getFavorites();
        const index = favorites.findIndex(f => f.id === anime.id);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(anime);
        }
        Storage.set('favorites', favorites);
        return index === -1;
    },

    isFavorite(animeId) {
        return this.getFavorites().some(f => f.id === animeId);
    },

    getWatchlist() {
        return Storage.get('watchlist', []);
    },

    toggleWatchlist(anime) {
        const watchlist = this.getWatchlist();
        const index = watchlist.findIndex(w => w.id === anime.id);
        if (index > -1) {
            watchlist.splice(index, 1);
        } else {
            watchlist.push(anime);
        }
        Storage.set('watchlist', watchlist);
        return index === -1;
    },

    isInWatchlist(animeId) {
        return this.getWatchlist().some(w => w.id === animeId);
    }
};

// Share functionality
function shareAnime(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url || window.location.href
        });
    } else {
        navigator.clipboard.writeText(url || window.location.href);
        alert('Link copied to clipboard!');
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initLazyLoading();

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const mobileMenu = document.getElementById('mobileMenu');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenu && !mobileMenu.contains(e.target) && !menuBtn?.contains(e.target)) {
            mobileMenu.classList.remove('show');
        }
    });
});

// Make utilities available globally
if (typeof window !== 'undefined') {
    window.UserPrefs = UserPrefs;
    window.shareAnime = shareAnime;
}
