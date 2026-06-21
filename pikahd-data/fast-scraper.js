const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = __dirname;
const CONCURRENCY = 5;
const DELAY = 800;

function fetch(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { clearTimeout(timeout); resolve(data); });
    }).on('error', (e) => { clearTimeout(timeout); reject(e); });
  });
}

function extractLinks(html) {
  const links = new Set();
  const regex = /href="(https?:\/\/(?:links|gd|gdflix)\.kmhd\.eu\/(?:file|pack)\/[^"]+)"/g;
  let m;
  while ((m = regex.exec(html)) !== null) links.add(m[1]);
  const katRegex = /href="(https?:\/\/katdrive\.click\/file\/[^"]+)"/g;
  while ((m = katRegex.exec(html)) !== null) links.add(m[1]);
  return [...links];
}

function extractInfo(html) {
  const info = {};
  const descMatch = html.match(/meta name="description" content="([^"]+)"/);
  if (descMatch) info.description = descMatch[1];
  
  const infoRegex = /<li><strong>([^<]+):<\/strong>\s*([^<]+)/gi;
  let m;
  while ((m = infoRegex.exec(html)) !== null) {
    const key = m[1].trim().toLowerCase();
    const val = m[2].trim();
    if (key.includes('rating') || key.includes('imdb')) info.rating = val;
    else if (key.includes('genres')) info.genres = val;
    else if (key.includes('language')) info.language = val;
    else if (key.includes('quality')) info.quality = val;
    else if (key.includes('stars')) info.stars = val;
  }
  
  const playMatch = html.match(/iframe src="(https?:\/\/links\.kmhd\.eu\/play\?id=[^"]+)"/);
  if (playMatch) info.playLink = playMatch[1];
  
  const storyMatch = html.match(/Storyline:(?:[\s\S]*?)<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/);
  if (storyMatch) info.storyline = storyMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 500);
  
  return info;
}

async function processBatch(items, startIdx) {
  const results = [];
  const batch = items.slice(startIdx, startIdx + CONCURRENCY);
  
  const promises = batch.map(async (anime) => {
    try {
      const html = await fetch(`https://new.pikahd.co/${anime.slug}`);
      const downloads = extractLinks(html);
      const info = extractInfo(html);
      return { ...anime, downloads, info, url: `https://new.pikahd.co/${anime.slug}` };
    } catch (e) {
      return { ...anime, downloads: [], info: {}, url: `https://new.pikahd.co/${anime.slug}`, error: e.message };
    }
  });
  
  return Promise.all(promises);
}

async function main() {
  console.log('=== Fast PikaHD Detail Scraper ===\n');
  
  const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'all-anime-listings.json'), 'utf8'));
  console.log(`Processing ${listings.length} anime with concurrency ${CONCURRENCY}...\n`);
  
  const allDetailed = [];
  
  for (let i = 0; i < listings.length; i += CONCURRENCY) {
    const batch = await processBatch(listings, i);
    allDetailed.push(...batch);
    
    const withLinks = batch.filter(a => a.downloads.length > 0).length;
    console.log(`[${Math.min(i + CONCURRENCY, listings.length)}/${listings.length}] Processed batch — ${withLinks} with links`);
    
    await new Promise(r => setTimeout(r, DELAY));
  }
  
  // Save detailed JSON
  fs.writeFileSync(
    path.join(DATA_DIR, 'all-anime-detailed.json'),
    JSON.stringify(allDetailed, null, 2)
  );
  console.log(`\nSaved: all-anime-detailed.json (${allDetailed.length} anime)`);
  
  // Generate text file
  let txt = '╔══════════════════════════════════════════════════════════════╗\n';
  txt += '║          PIKAHD.CO — COMPLETE DOWNLOAD LINKS               ║\n';
  txt += '║          Generated: ' + new Date().toISOString() + '         ║\n';
  txt += '╚══════════════════════════════════════════════════════════════╝\n\n';
  txt += `Total Anime: ${allDetailed.length}\n`;
  txt += `With Download Links: ${allDetailed.filter(a => a.downloads.length > 0).length}\n`;
  txt += `Total Download Links: ${allDetailed.reduce((s, a) => s + a.downloads.length, 0)}\n\n`;
  
  allDetailed.forEach((a, i) => {
    txt += `\n${'═'.repeat(70)}\n`;
    txt += `  #${i + 1} — ${a.title}\n`;
    txt += `${'─'.repeat(70)}\n`;
    txt += `  URL:      ${a.url}\n`;
    txt += `  Slug:     ${a.slug}\n`;
    txt += `  ID:       ${a.id}\n`;
    txt += `  Categories: ${(a.categories || []).join(', ')}\n`;
    if (a.info) {
      if (a.info.rating) txt += `  Rating:   ${a.info.rating}\n`;
      if (a.info.genres) txt += `  Genres:   ${a.info.genres}\n`;
      if (a.info.language) txt += `  Language: ${a.info.language}\n`;
      if (a.info.quality) txt += `  Quality:  ${a.info.quality}\n`;
      if (a.info.stars) txt += `  Stars:    ${a.info.stars}\n`;
    }
    if (a.downloads.length > 0) {
      txt += `\n  Download Links (${a.downloads.length}):\n`;
      a.downloads.forEach((link, j) => {
        txt += `    ${j + 1}. ${link}\n`;
      });
    }
    if (a.info?.storyline) {
      txt += `\n  Story: ${a.info.storyline}\n`;
    }
    txt += '\n';
  });
  
  fs.writeFileSync(path.join(DATA_DIR, 'all-links-complete.txt'), txt);
  console.log('Saved: all-links-complete.txt');
  
  // Generate CSV
  let csv = 'Title,Slug,URL,Categories,Rating,Genres,Language,Quality,Download Links\n';
  allDetailed.forEach(a => {
    csv += `"${(a.title || '').replace(/"/g, '""')}","${a.slug}","${a.url}","${(a.categories || []).join('; ')}","${a.info?.rating || ''}","${a.info?.genres || ''}","${a.info?.language || ''}","${a.info?.quality || ''}","${a.downloads.join('; ')}"\n`;
  });
  fs.writeFileSync(path.join(DATA_DIR, 'all-anime.csv'), csv);
  console.log('Saved: all-anime.csv');
  
  console.log('\n=== Done! ===');
}

main().catch(console.error);
