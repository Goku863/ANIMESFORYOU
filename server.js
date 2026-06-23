const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const JIKAN_API = 'https://api.jikan.moe/v4';

// Rate limit helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Get trending/top anime
app.get('/api/trending', async (req, res) => {
  try {
    const response = await fetch(`${JIKAN_API}/top/anime?filter=bypopularity&limit=15`);
    const data = await response.json();
    res.json({ results: data.data || [] });
  } catch (error) {
    res.json({ results: [] });
  }
});

// Get top airing
app.get('/api/airing', async (req, res) => {
  try {
    await delay(500);
    const response = await fetch(`${JIKAN_API}/top/anime?filter=airing&limit=15`);
    const data = await response.json();
    res.json({ results: data.data || [] });
  } catch (error) {
    res.json({ results: [] });
  }
});

// Search anime
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json({ results: [] });
    
    await delay(500);
    const response = await fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(query)}&limit=20`);
    const data = await response.json();
    res.json({ results: data.data || [] });
  } catch (error) {
    res.json({ results: [] });
  }
});

// Get anime details
app.get('/api/anime/:id', async (req, res) => {
  try {
    await delay(500);
    const response = await fetch(`${JIKAN_API}/anime/${req.params.id}/full`);
    const data = await response.json();
    res.json(data.data || {});
  } catch (error) {
    res.json({});
  }
});

// Get anime recommendations
app.get('/api/recommendations/:id', async (req, res) => {
  try {
    await delay(500);
    const response = await fetch(`${JIKAN_API}/anime/${req.params.id}/recommendations`);
    const data = await response.json();
    res.json({ results: (data.data || []).slice(0, 10) });
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
