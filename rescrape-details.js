const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'pikahd-complete');
const CONCURRENCY = 8;
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
  
  // Extract download links WITH their labels from surrounding HTML
  // Pattern: <a href="LINK">LABEL</a>
  const linkRegex = /<a\s+href="(https?:\/\/(?:links\.kmhd\.eu\/file\/|gd\.kmhd\.eu\/file\/|gdflix\.dev\/file\/|links\.kmhd\.eu\/pack\/|gd\.kmhd\.eu\/pack\/|gdflix\.dev\/pack\/|katdrive\.click\/)[^"]+)"[^>]*>([^<]*(?:<\/[^>]+>[^<]*)*)<\/a>/gi;
  let m;
  const seenLinks = new Set();
  
  while ((m = linkRegex.exec(content)) !== null) {
    const url = m[1];
    // Strip HTML tags from label to get clean text
    const label = m[2].replace(/<[^>]+>/g, '').trim();
    if (!seenLinks.has(url)) {
      seenLinks.add(url);
      result.downloads.push({ url, label: label || 'Download' });
    }
  }
  
  // Also try simpler pattern for links without nested tags
  const simpleLinkRegex = /href="(https?:\/\/(?:links\.kmhd\.eu\/file\/|gd\.kmhd\.eu\/file\/|gdflix\.dev\/file\/)[^"]+)"[^>]*>([^<]{2,50})<\/a>/gi;
  while ((m = simpleLinkRegex.exec(content)) !== null) {
    const url = m[1];
    const label = m[2].trim();
    if (!seenLinks.has(url) && label && !label.includes('<')) {
      seenLinks.add(url);
      result.downloads.push({ url, label });
    }
  }
  
  // Extract play link
  const playMatch = content.match(/iframe src="(https?:\/\/links\.kmhd\.eu\/play\?id=[^"]+)"/);
  if (playMatch) result.playLink = playMatch[1];
  
  // Extract info
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
    else if (key.includes('series name')) result.info.seriesName = val;
  }
  
  // Extract description
  const descMatch = html.match(/meta name="description" content="([^"]+)"/);
  if (descMatch) result.info.description = descMatch[1];
  
  // Extract storyline
  const storyMatch = content.match(/Storyline:[\s\S]*?<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/);
  if (storyMatch) result.storyline = storyMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 800);
  
  // Extract screenshots
  const screenshotRegex = /src="(https?:\/\/catimages\.org\/images\/[^"]+\.th\.jpg)"/g;
  while ((m = screenshotRegex.exec(content)) !== null) result.screenshots.push(m[1]);
  
  return result;
}

async function fetchAllDetails() {
  console.log('=== Loading existing listings ===\n');
  const listingsPath = path.join(DATA_DIR, '01-all-listings.json');
  if (!fs.existsSync(listingsPath)) {
    console.error('No listings file found. Run full-scraper.js first.');
    return;
  }
  
  const items = JSON.parse(fs.readFileSync(listingsPath, 'utf-8'));
  console.log(`Found ${items.length} anime to re-scrape\n`);
  
  const detailed = [];
  let count = 0;
  let withLinks = 0;
  
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async (item) => {
      try {
        const html = await fetch(`https://new.pikahd.co/${item.slug}`);
        const data = extractPostContent(html);
        count++;
        if (data.downloads.length > 0) withLinks++;
        return { ...item, ...data, url: `https://new.pikahd.co/${item.slug}`, fetchedAt: new Date().toISOString() };
      } catch (e) {
        count++;
        return { ...item, downloads: [], info: {}, url: `https://new.pikahd.co/${item.slug}`, error: e.message };
      }
    }));
    
    detailed.push(...results);
    if (count % 50 === 0 || count === items.length) {
      console.log(`[${count}/${items.length}] ${withLinks} with real download data`);
    }
    
    await sleep(DETAIL_DELAY);
  }
  
  // Save enhanced data
  fs.writeFileSync(path.join(DATA_DIR, '02-all-detailed.json'), JSON.stringify(detailed, null, 2));
  console.log(`\nSaved: 02-all-detailed.json (${detailed.length} anime, ${withLinks} with downloads)`);
  
  // Show sample
  const sample = detailed.find(a => a.downloads.length > 5);
  if (sample) {
    console.log('\n=== Sample: ' + sample.title.substring(0, 60) + ' ===');
    sample.downloads.slice(0, 10).forEach((d, i) => {
      console.log(`  ${i + 1}. [${d.label}] → ${d.url}`);
    });
  }
}

fetchAllDetails().catch(console.error);
