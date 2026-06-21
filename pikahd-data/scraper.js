const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://new.pikahd.co';
const OUTPUT_DIR = path.join(__dirname);
const DELAY = 1500; // ms between requests

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractJSON(html) {
  const match = html.match(/__sveltekit.*?resolve\(\{id:1,data:(.*?)\},error:void 0\}\)/s);
  if (!match) return null;
  try {
    const jsonStr = match[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
    return JSON.parse(jsonStr);
  } catch (e) {
    // Try alternative extraction
    const match2 = html.match(/data:\{items:\[(.*?)\],page/);
    if (match2) {
      try {
        return JSON.parse('{"items":[' + match2[1] + ']}');
      } catch (e2) {}
    }
    return null;
  }
}

function extractDownloadLinks(html) {
  const links = [];
  // Match all href links containing kmhd.eu or gdflix
  const linkRegex = /href="(https?:\/\/(?:links|gd|gdflix)\.kmhd\.eu\/[^"]+)"/g;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1]);
  }
  // Also match katdrive
  const katRegex = /href="(https?:\/\/katdrive\.click\/[^"]+)"/g;
  while ((match = katRegex.exec(html)) !== null) {
    links.push(match[1]);
  }
  return [...new Set(links)];
}

function extractMetadata(html) {
  const meta = {};
  
  // Extract description
  const descMatch = html.match(/meta name="description" content="([^"]+)"/);
  if (descMatch) meta.description = descMatch[1];
  
  // Extract OG image
  const imgMatch = html.match(/meta property="og:image" content="([^"]+)"/);
  if (imgMatch) meta.ogImage = imgMatch[1];
  
  // Extract canonical URL
  const canonicalMatch = html.match(/meta property="og:url" content="([^"]+)"/);
  if (canonicalMatch) meta.canonicalUrl = canonicalMatch[1];
  
  // Extract schema.org data
  const schemaMatch = html.match(/application\/ld\+json[^>]*>(.*?)<\/script>/s);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      if (schema['@graph']) {
        const article = schema['@graph'].find(i => i['@type'] === 'Article');
        if (article) {
          meta.headline = article.headline;
          meta.datePublished = article.datePublished;
          meta.dateModified = article.dateModified;
        }
      }
    } catch (e) {}
  }
  
  // Extract episode links with quality info from HTML content
  const episodeLinks = [];
  // Match patterns like: E01: <a href="...">720p HEVC</a> || <a href="...">1080p HEVC</a>
  const epRegex = /(?:E\d+|Episode\s+\d+|Full\s+Season|Full\s+Movie|Pack)[^<]*<a href="([^"]+)">([^<]+)<\/a>/gi;
  while ((match = epRegex.exec(html)) !== null) {
    episodeLinks.push({ url: match[1], quality: match[2].trim() });
  }
  
  // Also match simpler patterns
  const simpleRegex = /<a href="(https?:\/\/links\.kmhd\.eu\/file\/[^"]+)">([^<]+)<\/a>/gi;
  while ((match = simpleRegex.exec(html)) !== null) {
    episodeLinks.push({ url: match[1], quality: match[2].trim() });
  }
  
  const gdRegex = /<a href="(https?:\/\/gd\.kmhd\.eu\/file\/[^"]+)">([^<]+)<\/a>/gi;
  while ((match = gdRegex.exec(html)) !== null) {
    episodeLinks.push({ url: match[1], quality: match[2].trim() });
  }
  
  meta.episodeLinks = episodeLinks;
  
  // Extract pack links
  const packRegex = /<a href="(https?:\/\/[^"]*(?:pack|gdflix)[^"]+)">([^<]+)<\/a>/gi;
  const packLinks = [];
  while ((match = packRegex.exec(html)) !== null) {
    packLinks.push({ url: match[1], label: match[2].trim() });
  }
  meta.packLinks = packLinks;
  
  // Extract play link
  const playMatch = html.match(/iframe src="(https?:\/\/links\.kmhd\.eu\/play\?id=[^"]+)"/);
  if (playMatch) meta.playLink = playMatch[1];
  
  // Extract screenshots
  const screenshots = [];
  const screenshotRegex = /src="(https?:\/\/catimages\.org\/images\/[^"]+\.th\.jpg)"/g;
  while ((match = screenshotRegex.exec(html)) !== null) {
    screenshots.push(match[1]);
  }
  meta.screenshots = screenshots;
  
  // Extract story/plot
  const storyMatch = html.match(/Storyline:(?:.*?)<\/h2>\s*<p[^>]*>(.*?)<\/p>/s);
  if (storyMatch) {
    meta.storyline = storyMatch[1].replace(/<[^>]+>/g, '').trim();
  }
  
  // Extract series info (rating, genres, etc.)
  const infoRegex = /<li><strong>([^<]+):<\/strong>\s*([^<]+)/gi;
  const info = {};
  while ((match = infoRegex.exec(html)) !== null) {
    const key = match[1].trim().toLowerCase();
    const val = match[2].trim();
    if (key.includes('series name')) info.seriesName = val;
    else if (key.includes('rating') || key.includes('imdb')) info.rating = val;
    else if (key.includes('creator')) info.creator = val;
    else if (key.includes('stars')) info.stars = val;
    else if (key.includes('genres')) info.genres = val;
    else if (key.includes('quality')) info.quality = val;
    else if (key.includes('language')) info.language = val;
  }
  meta.info = info;
  
  return meta;
}

async function fetchPage(pageNum) {
  const url = `${BASE_URL}/?page=${pageNum}`;
  console.log(`Fetching page ${pageNum}...`);
  const html = await fetch(url);
  
  // Extract items from the script data
  const itemsMatch = html.match(/items:\[(.*?)\],page/s);
  if (!itemsMatch) {
    console.log(`  No items found on page ${pageNum}`);
    return [];
  }
  
  // Parse items more carefully
  const itemsStr = itemsMatch[1];
  const items = [];
  const itemRegex = /\{([^}]+)\}/g;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(itemsStr)) !== null) {
    const itemStr = itemMatch[1];
    const item = {};
    
    const catMatch = itemStr.match(/categories:\[([^\]]+)\]/);
    if (catMatch) item.categories = catMatch[1].replace(/"/g, '').split(',');
    
    const titleMatch = itemStr.match(/post_title:"([^"]+)"/);
    if (titleMatch) item.title = titleMatch[1].replace(/&amp;/g, '&');
    
    const slugMatch = itemStr.match(/slug:"([^"]+)"/);
    if (slugMatch) item.slug = slugMatch[1];
    
    const idMatch = itemStr.match(/id:"(\d+)"/);
    if (idMatch) item.id = idMatch[1];
    
    const thumbMatch = itemStr.match(/thumbnail_image:"([^"]+)"/);
    if (thumbMatch) item.thumbnail = thumbMatch[1];
    
    const dateMatch = itemStr.match(/created:"([^"]+)"/);
    if (dateMatch) item.created = dateMatch[1];
    
    if (item.slug) items.push(item);
  }
  
  console.log(`  Found ${items.length} items`);
  return items;
}

async function fetchAnimeDetail(slug) {
  const url = `${BASE_URL}/${slug}`;
  console.log(`  Fetching: ${slug}`);
  const html = await fetch(url);
  
  const downloads = extractDownloadLinks(html);
  const metadata = extractMetadata(html);
  
  return { downloads, metadata };
}

async function main() {
  console.log('=== PikaHD.co Full Scraper ===\n');
  
  // Step 1: Fetch all pages to get all anime slugs
  const allAnime = [];
  const totalPages = 125; // From the API response
  
  console.log(`Fetching ${totalPages} pages of anime listings...\n`);
  
  for (let page = 1; page <= Math.min(totalPages, 10); page++) {
    const items = await fetchPage(page);
    allAnime.push(...items);
    await sleep(DELAY);
  }
  
  console.log(`\nTotal anime found: ${allAnime.length}`);
  
  // Save raw listings
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-anime-listings.json'),
    JSON.stringify(allAnime, null, 2)
  );
  console.log('Saved: all-anime-listings.json');
  
  // Step 2: Fetch details for each anime
  console.log('\nFetching download links and metadata for each anime...\n');
  
  const detailedAnime = [];
  let count = 0;
  
  for (const anime of allAnime) {
    count++;
    console.log(`[${count}/${allAnime.length}] ${anime.title || anime.slug}`);
    
    try {
      const { downloads, metadata } = await fetchAnimeDetail(anime.slug);
      
      detailedAnime.push({
        ...anime,
        url: `${BASE_URL}/${anime.slug}`,
        downloads,
        metadata,
        fetchedAt: new Date().toISOString()
      });
      
      await sleep(DELAY);
    } catch (err) {
      console.log(`    Error: ${err.message}`);
      detailedAnime.push({
        ...anime,
        url: `${BASE_URL}/${anime.slug}`,
        downloads: [],
        metadata: {},
        error: err.message
      });
    }
  }
  
  // Save detailed data
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-anime-detailed.json'),
    JSON.stringify(detailedAnime, null, 2)
  );
  console.log('\nSaved: all-anime-detailed.json');
  
  // Step 3: Create a summary
  const summary = {
    totalAnime: detailedAnime.length,
    withDownloads: detailedAnime.filter(a => a.downloads.length > 0).length,
    withMetadata: detailedAnime.filter(a => Object.keys(a.metadata).length > 0).length,
    categories: [...new Set(detailedAnime.flatMap(a => a.categories || []))],
    scrapedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log('Saved: summary.json');
  
  // Step 4: Create a readable text file with all links
  let linksText = '=== PikaHD.co Complete Download Links ===\n';
  linksText += `Scraped: ${new Date().toISOString()}\n`;
  linksText += `Total Anime: ${detailedAnime.length}\n\n`;
  
  for (const anime of detailedAnime) {
    linksText += `\n${'='.repeat(60)}\n`;
    linksText += `Title: ${anime.title}\n`;
    linksText += `URL: ${anime.url}\n`;
    linksText += `Slug: ${anime.slug}\n`;
    linksText += `Categories: ${(anime.categories || []).join(', ')}\n`;
    
    if (anime.metadata?.info) {
      const info = anime.metadata.info;
      if (info.rating) linksText += `Rating: ${info.rating}\n`;
      if (info.genres) linksText += `Genres: ${info.genres}\n`;
      if (info.language) linksText += `Language: ${info.language}\n`;
      if (info.quality) linksText += `Quality: ${info.quality}\n`;
      if (info.stars) linksText += `Stars: ${info.stars}\n`;
    }
    
    if (anime.downloads.length > 0) {
      linksText += `\nDownload Links:\n`;
      anime.downloads.forEach((link, i) => {
        linksText += `  ${i + 1}. ${link}\n`;
      });
    }
    
    if (anime.metadata?.episodeLinks?.length > 0) {
      linksText += `\nEpisode Links:\n`;
      anime.metadata.episodeLinks.forEach((link, i) => {
        linksText += `  ${i + 1}. [${link.quality}] ${link.url}\n`;
      });
    }
    
    if (anime.metadata?.packLinks?.length > 0) {
      linksText += `\nPack Links:\n`;
      anime.metadata.packLinks.forEach((link, i) => {
        linksText += `  ${i + 1}. [${link.label}] ${link.url}\n`;
      });
    }
  }
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'all-links.txt'),
    linksText
  );
  console.log('Saved: all-links.txt');
  
  console.log('\n=== Done! ===');
  console.log(`Files saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
