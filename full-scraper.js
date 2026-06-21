const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'pikahd-complete');
const CONCURRENCY = 8;
const PAGE_DELAY = 500;
const DETAIL_DELAY = 300;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function fetch(url, retries = 2) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 15000);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { clearTimeout(timeout); resolve(data); });
    }).on('error', (e) => {
      clearTimeout(timeout);
      if (retries > 0) setTimeout(() => fetch(url, retries - 1).then(resolve).catch(reject), 2000);
      else reject(e);
    });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractItems(html) {
  const items = [];
  const regex = /categories:\[([^\]]*)\],created:"([^"]*)",id:"(\d+)",post_status:"publish",post_title:"([^"]*)",slug:"([^"]*)",thumbnail_image:"([^"]*)"/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    items.push({
      categories: m[1].replace(/"/g, '').split(','),
      created: m[2],
      id: m[3],
      title: m[4].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
      slug: m[5],
      thumbnail: m[6]
    });
  }
  return items;
}

function extractPostContent(html) {
  const result = { downloads: [], info: {}, storyline: '', playLink: '', screenshots: [] };
  
  const pcMatch = html.match(/post_content:"(.*?)"(?:,|})/s);
  if (!pcMatch) return result;
  
  let content;
  try {
    let raw = pcMatch[1];
    raw = raw.replace(/\\\\/g, '\\').replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    content = raw.replace(/\\u003C/g, '<').replace(/\\u003E/g, '>').replace(/\\u0026/g, '&');
  } catch (e) { return result; }
  
  // Extract all links
  const linkRegex = /href="(https?:\/\/[^"]+)"/g;
  let m;
  const allLinks = [];
  while ((m = linkRegex.exec(content)) !== null) allLinks.push(m[1]);
  
  result.downloads = allLinks.filter(l => 
    l.includes('links.kmhd.eu/file/') || l.includes('gd.kmhd.eu/file/') || 
    l.includes('gdflix.dev/file/') || l.includes('links.kmhd.eu/pack/') || 
    l.includes('gd.kmhd.eu/pack/') || l.includes('gdflix.dev/pack/') || 
    l.includes('katdrive.click/')
  );
  
  const playMatch = content.match(/iframe src="(https?:\/\/links\.kmhd\.eu\/play\?id=[^"]+)"/);
  if (playMatch) result.playLink = playMatch[1];
  
  const infoRegex = /<li><strong>([^<]+):<\/strong>\s*([^<]+)/gi;
  while ((m = infoRegex.exec(content)) !== null) {
    const key = m[1].trim().toLowerCase();
    const val = m[2].trim();
    if (key.includes('rating') || key.includes('imdb')) result.info.rating = val;
    else if (key.includes('genres')) result.info.genres = val;
    else if (key.includes('language')) result.info.language = val;
    else if (key.includes('quality')) result.info.quality = val;
    else if (key.includes('stars')) result.info.stars = val;
    else if (key.includes('creator')) result.info.creator = val;
  }
  
  const descMatch = html.match(/meta name="description" content="([^"]+)"/);
  if (descMatch) result.info.description = descMatch[1];
  
  const storyMatch = content.match(/Storyline:[\s\S]*?<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/);
  if (storyMatch) result.storyline = storyMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 800);
  
  const screenshotRegex = /src="(https?:\/\/catimages\.org\/images\/[^"]+\.th\.jpg)"/g;
  while ((m = screenshotRegex.exec(content)) !== null) result.screenshots.push(m[1]);
  
  return result;
}

async function fetchAllPages() {
  console.log('=== Phase 1: Fetching all anime listings ===\n');
  const allItems = [];
  
  for (let page = 1; page <= 125; page++) {
    try {
      const html = await fetch(`https://new.pikahd.co/?page=${page}`);
      const items = extractItems(html);
      allItems.push(...items);
      if (page % 10 === 0) console.log(`Page ${page}/125 — Total: ${allItems.length} anime`);
      await sleep(PAGE_DELAY);
    } catch (e) {
      console.log(`Page ${page} error: ${e.message}`);
      await sleep(2000);
    }
  }
  
  console.log(`\nTotal anime found: ${allItems.length}`);
  fs.writeFileSync(path.join(DATA_DIR, '01-all-listings.json'), JSON.stringify(allItems, null, 2));
  return allItems;
}

async function fetchAllDetails(items) {
  console.log('\n=== Phase 2: Fetching anime details ===\n');
  const detailed = [];
  let count = 0;
  
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async (item) => {
      try {
        const html = await fetch(`https://new.pikahd.co/${item.slug}`);
        const data = extractPostContent(html);
        count++;
        return { ...item, ...data, url: `https://new.pikahd.co/${item.slug}`, fetchedAt: new Date().toISOString() };
      } catch (e) {
        count++;
        return { ...item, downloads: [], info: {}, url: `https://new.pikahd.co/${item.slug}`, error: e.message };
      }
    }));
    
    detailed.push(...results);
    const withLinks = results.filter(r => r.downloads && r.downloads.length > 0).length;
    console.log(`[${Math.min(i + CONCURRENCY, items.length)}/${items.length}] +${withLinks} with links`);
    
    await sleep(DETAIL_DELAY);
  }
  
  return detailed;
}

function generateHTML(data) {
  const withLinks = data.filter(a => a.downloads && a.downloads.length > 0);
  const totalLinks = data.reduce((s, a) => s + (a.downloads || []).length, 0);
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PikaHD.co — Complete Website Copy</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; }
  .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 40px 20px; text-align: center; border-bottom: 3px solid #f97316; }
  .header h1 { font-size: 36px; color: #f97316; margin-bottom: 10px; }
  .header p { color: #999; font-size: 14px; }
  .stats { display: flex; justify-content: center; gap: 40px; padding: 30px 20px; background: #111; }
  .stat { text-align: center; }
  .stat-num { font-size: 32px; font-weight: 700; color: #f97316; display: block; }
  .stat-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .search-bar { max-width: 600px; margin: 20px auto; padding: 0 20px; }
  .search-bar input { width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid #333; background: #1a1a1a; color: #fff; font-size: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; padding: 20px; max-width: 1400px; margin: 0 auto; }
  .card { background: #1a1a1a; border-radius: 10px; overflow: hidden; border: 1px solid #222; transition: transform 0.2s, border-color 0.2s; cursor: pointer; }
  .card:hover { transform: translateY(-4px); border-color: #f97316; }
  .card img { width: 100%; height: 260px; object-fit: cover; }
  .card-info { padding: 10px 12px; }
  .card-title { font-size: 12px; font-weight: 600; line-height: 1.3; height: 32px; overflow: hidden; color: #fff; }
  .card-meta { font-size: 10px; color: #888; margin-top: 4px; display: flex; gap: 8px; }
  .card-badges { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
  .badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
  .b-hindi { background: #f97316; color: #fff; }
  .b-dual { background: #3b82f6; color: #fff; }
  .b-triple { background: #8b5cf6; color: #fff; }
  .b-hevc { background: #10b981; color: #fff; }
  .b-new { background: #ef4444; color: #fff; }
  .b-18 { background: #dc2626; color: #fff; }
  
  .detail-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; }
  .detail-modal.open { display: flex; align-items: center; justify-content: center; }
  .detail-backdrop { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); }
  .detail-content { position: relative; background: #1a1a1a; border-radius: 12px; max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto; border: 1px solid #333; }
  .detail-header { padding: 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
  .detail-header h2 { font-size: 18px; color: #f97316; }
  .detail-close { background: none; border: none; color: #999; cursor: pointer; font-size: 24px; }
  .detail-body { padding: 20px; }
  .detail-meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px; font-size: 13px; }
  .detail-meta dt { color: #888; }
  .detail-meta dd { color: #fff; }
  .dl-section { margin-top: 16px; }
  .dl-title { font-size: 14px; font-weight: 700; color: #f97316; margin-bottom: 8px; }
  .dl-links { display: flex; flex-wrap: wrap; gap: 6px; }
  .dl-link { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: #0f2d1a; border: 1px solid #166534; border-radius: 6px; color: #4ade80; font-size: 11px; text-decoration: none; transition: all 0.2s; }
  .dl-link:hover { background: #14532d; border-color: #4ade80; }
  .storyline { font-size: 13px; color: #999; line-height: 1.6; margin-top: 12px; }
  .footer { text-align: center; padding: 30px; border-top: 1px solid #222; color: #666; font-size: 12px; }
  
  @media (max-width: 768px) {
    .grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; padding: 10px; }
    .stats { flex-wrap: wrap; gap: 20px; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>🎬 PikaHD.co</h1>
  <p>Complete Website Copy — All Anime, All Download Links</p>
  <p style="margin-top:5px;color:#666">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>
<div class="stats">
  <div class="stat"><span class="stat-num">${data.length}</span><span class="stat-label">Total Anime</span></div>
  <div class="stat"><span class="stat-num">${withLinks.length}</span><span class="stat-label">With Downloads</span></div>
  <div class="stat"><span class="stat-num">${totalLinks}</span><span class="stat-label">Download Links</span></div>
</div>
<div class="search-bar">
  <input type="text" placeholder="Search anime..." id="searchInput" oninput="filterCards(this.value)">
</div>
<div class="grid" id="animeGrid">
`;

  data.forEach((a, i) => {
    const cats = a.categories || [];
    const badges = [];
    if (cats.includes('18+') || cats.includes('adult')) badges.push('<span class="badge b-18">18+</span>');
    if (cats.includes('dual-audio')) badges.push('<span class="badge b-dual">Dual</span>');
    if (cats.includes('triple-audio') || cats.includes('triple-audio-anime-hindi-dubbed')) badges.push('<span class="badge b-triple">Triple</span>');
    if (cats.includes('anime-hindi-dubbed') || cats.includes('hindi-dubbed')) badges.push('<span class="badge b-hindi">Hindi</span>');
    if (cats.includes('10bit-hevc')) badges.push('<span class="badge b-hevc">HEVC</span>');
    
    html += `
  <div class="card" onclick="openDetail(${i})" data-title="${(a.title || '').toLowerCase()}" data-cats="${cats.join(' ')}">
    <img src="${a.thumbnail || ''}" alt="${(a.title || '').substring(0, 50)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 200 260\\'><rect fill=\\'%231a1a1a\\' width=\\'200\\' height=\\'260\\'/><text fill=\\'%23666\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' font-size=\\'14\\'>No Image</text></svg>'">
    <div class="card-info">
      <div class="card-title">${(a.title || '').substring(0, 80)}</div>
      <div class="card-meta">
        <span>${a.info?.rating || 'N/A'}</span>
        <span>${a.created?.split(' ')[0] || ''}</span>
        <span>${(a.downloads || []).length} links</span>
      </div>
      <div class="card-badges">${badges.join('')}</div>
    </div>
  </div>`;
  });

  html += `
</div>

<div class="detail-modal" id="detailModal">
  <div class="detail-backdrop" onclick="closeDetail()"></div>
  <div class="detail-content">
    <div class="detail-header">
      <h2 id="detailTitle"></h2>
      <button class="detail-close" onclick="closeDetail()">&times;</button>
    </div>
    <div class="detail-body" id="detailBody"></div>
  </div>
</div>

<div class="footer">
  <p>🎬 PikaHD.co Complete Website Copy</p>
  <p>${data.length} anime | ${totalLinks} download links</p>
  <p style="margin-top:8px;color:#555">Source: https://new.pikahd.co</p>
</div>

<script>
const ANIME_DATA = ${JSON.stringify(data.map((a, i) => ({
  id: i,
  title: a.title,
  slug: a.slug,
  thumbnail: a.thumbnail,
  categories: a.categories,
  info: a.info,
  downloads: a.downloads,
  storyline: a.storyline,
  playLink: a.playLink,
  url: a.url
})))};

function filterCards(q) {
  const query = q.toLowerCase();
  document.querySelectorAll('.card').forEach(card => {
    const title = card.dataset.title || '';
    const cats = card.dataset.cats || '';
    card.style.display = (title.includes(query) || cats.includes(query)) ? '' : 'none';
  });
}

function openDetail(idx) {
  const a = ANIME_DATA[idx];
  if (!a) return;
  document.getElementById('detailTitle').textContent = (a.title || '').substring(0, 80);
  
  let html = '<div class="detail-meta">';
  html += '<dt>Slug</dt><dd>' + (a.slug || '') + '</dd>';
  html += '<dt>URL</dt><dd><a href="' + (a.url || '') + '" target="_blank" style="color:#3b82f6">' + (a.url || '') + '</a></dd>';
  if (a.info?.rating) html += '<dt>Rating</dt><dd>' + a.info.rating + '</dd>';
  if (a.info?.genres) html += '<dt>Genres</dt><dd>' + a.info.genres + '</dd>';
  if (a.info?.language) html += '<dt>Language</dt><dd>' + a.info.language + '</dd>';
  if (a.info?.quality) html += '<dt>Quality</dt><dd>' + a.info.quality + '</dd>';
  if (a.info?.stars) html += '<dt>Stars</dt><dd>' + a.info.stars + '</dd>';
  html += '</div>';
  
  if (a.playLink) html += '<p style="margin:8px 0"><a href="' + a.playLink + '" target="_blank" style="color:#f97316">▶ Watch Online</a></p>';
  
  if (a.downloads && a.downloads.length > 0) {
    html += '<div class="dl-section"><div class="dl-title">⬇ Download Links (' + a.downloads.length + ')</div><div class="dl-links">';
    a.downloads.forEach(l => {
      html += '<a href="' + l + '" class="dl-link" target="_blank">📥 ' + l.split('/').pop().substring(0, 20) + '</a>';
    });
    html += '</div></div>';
  }
  
  if (a.storyline) html += '<div class="storyline"><strong>Story:</strong> ' + a.storyline + '</div>';
  
  document.getElementById('detailBody').innerHTML = html;
  document.getElementById('detailModal').classList.add('open');
}

function closeDetail() {
  document.getElementById('detailModal').classList.remove('open');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });
</script>
</body>
</html>`;

  return html;
}

async function main() {
  const startTime = Date.now();
  
  // Phase 1: Get all listings
  const allItems = await fetchAllPages();
  
  // Phase 2: Get details for each
  const detailed = await fetchAllDetails(allItems);
  
  // Save JSON
  fs.writeFileSync(path.join(DATA_DIR, '02-all-detailed.json'), JSON.stringify(detailed, null, 2));
  console.log(`\nSaved: 02-all-detailed.json`);
  
  // Generate HTML
  const html = generateHTML(detailed);
  fs.writeFileSync(path.join(DATA_DIR, 'PIKAHD-COMPLETE-WEBSITE.html'), html);
  console.log('Saved: PIKAHD-COMPLETE-WEBSITE.html');
  
  // Generate text file
  let txt = 'PIKAHD.CO — COMPLETE WEBSITE COPY\n';
  txt += '='.repeat(60) + '\n';
  txt += `Generated: ${new Date().toISOString()}\n`;
  txt += `Total Anime: ${detailed.length}\n`;
  txt += `With Downloads: ${detailed.filter(a => a.downloads && a.downloads.length > 0).length}\n`;
  txt += `Total Links: ${detailed.reduce((s, a) => s + (a.downloads || []).length, 0)}\n\n`;
  
  detailed.forEach((a, i) => {
    txt += `${'─'.repeat(60)}\n`;
    txt += `#${i + 1} — ${a.title}\n`;
    txt += `URL: ${a.url}\n`;
    txt += `Slug: ${a.slug}\n`;
    if (a.info?.rating) txt += `Rating: ${a.info.rating}\n`;
    if (a.info?.genres) txt += `Genres: ${a.info.genres}\n`;
    if (a.info?.language) txt += `Language: ${a.info.language}\n`;
    if (a.downloads && a.downloads.length > 0) {
      txt += `Downloads (${a.downloads.length}):\n`;
      a.downloads.forEach((l, j) => txt += `  ${j + 1}. ${l}\n`);
    }
    txt += '\n';
  });
  
  fs.writeFileSync(path.join(DATA_DIR, 'ALL-LINKS-TEXT.txt'), txt);
  console.log('Saved: ALL-LINKS-TEXT.txt');
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Done in ${elapsed}s ===`);
  console.log(`Files saved to: ${DATA_DIR}`);
}

main().catch(console.error);
