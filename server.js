const express = require('express');
const path = require('path');
const animeapi = require('@justalk/anime-api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Trending/Popular anime data (using API)
app.get('/api/trending', async (req, res) => {
  try {
    const results = await animeapi.links('one piece', { limit: 10 });
    res.json({ results });
  } catch (error) {
    res.json({ results: [] });
  }
});

// Search anime
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json({ results: [] });
    
    const results = await animeapi.links(query, { limit: 20 });
    res.json({ results });
  } catch (error) {
    res.json({ results: [] });
  }
});

// Get streaming links
app.get('/api/stream', async (req, res) => {
  try {
    const { anime, episode } = req.query;
    if (!anime || !episode) return res.json({ results: [] });
    
    const results = await animeapi.stream(anime, parseInt(episode), { limit_per_website: 1 });
    res.json({ results });
  } catch (error) {
    res.json({ results: [] });
  }
});

// Get download links
app.get('/api/download', async (req, res) => {
  try {
    const { anime, episode } = req.query;
    if (!anime || !episode) return res.json({ results: [] });
    
    const results = await animeapi.download(anime, parseInt(episode), { limit_per_website: 1 });
    res.json({ results });
  } catch (error) {
    res.json({ results: [] });
  }
});

// Get page links for an anime
app.get('/api/links', async (req, res) => {
  try {
    const { anime } = req.query;
    if (!anime) return res.json({ results: [] });
    
    const results = await animeapi.links(anime, { limit: 10 });
    res.json({ results });
  } catch (error) {
    res.json({ results: [] });
  }
});

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/browse', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'browse.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

app.get('/watch', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'watch.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
