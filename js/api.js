// Anime API - Uses Jikan API (MyAnimeList unofficial API)
const AnimeAPI = {
    BASE_URL: 'https://api.jikan.moe/v4',

    async fetchWithRetry(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                if (response.status === 429) {
                    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
                    continue;
                }
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                return data.data || data;
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    },

    formatAnime(anime) {
        return {
            id: anime.mal_id,
            title: anime.title || anime.title_english || 'Unknown',
            image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
            synopsis: anime.synopsis || '',
            score: anime.score || null,
            episodes: anime.episodes || null,
            status: anime.status || 'Unknown',
            type: anime.type || 'TV',
            duration: anime.duration || '',
            genres: anime.genres?.map(g => g.name) || [],
            year: anime.year || null,
            season: anime.season || null
        };
    },

    async getTrending(limit = 10) {
        const data = await this.fetchWithRetry(`${this.BASE_URL}/top/anime?filter=bypopularity&limit=${limit}`);
        return (Array.isArray(data) ? data : data.data || []).map(a => this.formatAnime(a));
    },

    async getPopular(limit = 10) {
        const data = await this.fetchWithRetry(`${this.BASE_URL}/top/anime?limit=${limit}`);
        return (Array.isArray(data) ? data : data.data || []).map(a => this.formatAnime(a));
    },

    async getTopAnime(limit = 10) {
        const data = await this.fetchWithRetry(`${this.BASE_URL}/top/anime?limit=${limit}`);
        return (Array.isArray(data) ? data : data.data || []).map(a => this.formatAnime(a));
    },

    async getAllAnime(limit = 25) {
        const data = await this.fetchWithRetry(`${this.BASE_URL}/top/anime?limit=${limit}`);
        return (Array.isArray(data) ? data : data.data || []).map(a => this.formatAnime(a));
    },

    async getAnimeById(id) {
        const data = await this.fetchWithRetry(`${this.BASE_URL}/anime/${id}`);
        const anime = data.data || data;
        return this.formatAnime(anime);
    },

    async searchAnime(query, limit = 10) {
        const data = await this.fetchWithRetry(`${this.BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=${limit}`);
        return (Array.isArray(data) ? data : data.data || []).map(a => this.formatAnime(a));
    },

    async getAnimeByGenre(genreId, limit = 10) {
        const data = await this.fetchWithRetry(`${this.BASE_URL}/anime?genres=${genreId}&limit=${limit}`);
        return (Array.isArray(data) ? data : data.data || []).map(a => this.formatAnime(a));
    },

    async getSeasonalAnime() {
        const data = await this.fetchWithRetry(`${this.BASE_URL}/seasons/now`);
        return (Array.isArray(data) ? data : data.data || []).map(a => this.formatAnime(a));
    },

    genres: {
        'action': 1,
        'adventure': 2,
        'comedy': 4,
        'drama': 8,
        'fantasy': 10,
        'horror': 14,
        'mystery': 7,
        'romance': 22,
        'sci-fi': 24,
        'slice of life': 36,
        'sports': 30,
        'supernatural': 37,
        'thriller': 41
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.AnimeAPI = AnimeAPI;
}
