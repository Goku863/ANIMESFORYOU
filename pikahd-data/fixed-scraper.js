const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = __dirname;
const CONCURRENCY = 5;
const DELAY = 800;

function fetch(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 15000);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { clearTimeout(timeout); resolve(data); });
    }).on('error', (e) => { clearTimeout(timeout); reject(e); });
  });
}

function extractFromPostContent(html) {
  const result = { downloads: [], info: {}, storyline: '', playLink: '' };
  
  // Find post_content in the script data
  const pcMatch = html.match(/post_content:"(.*?)"(?:,|})/s);
  if (!pcMatch) return result;
  
  // Decode unicode escapes (double-escaped: \\u003C -> \u003C -> <)
  let content;
  try {
    let raw = pcMatch[1];
    // First unescape the JavaScript string escaping
    raw = raw.replace(/\\\\/g, '\\').replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    // Then decode unicode escapes
    content = raw.replace(/\\u003C/g, '<').replace(/\\u003E/g, '>').replace(/\\u0026/g, '&');
  } catch (e) {
    return result;
  }
  
  // Extract all links
  const linkRegex = /href="(https?:\/\/[^"]+)"/g;
  let m;
  const allLinks = [];
  while ((m = linkRegex.exec(content)) !== null) {
    allLinks.push(m[1]);
  }
  
  // Categorize links
  result.downloads = allLinks.filter(l => 
    l.includes('links.kmhd.eu/file/') || 
    l.includes('gd.kmhd.eu/file/') || 
    l.includes('gdflix.dev/file/') ||
    l.includes('links.kmhd.eu/pack/') ||
    l.includes('gd.kmhd.eu/pack/') ||
    l.includes('gdflix.dev/pack/') ||
    l.includes('katdrive.click/')
  );
  
  // Extract play link
  const playMatch = content.match(/iframe src="(https?:\/\/links\.kmhd\.eu\/play\?id=[^"]+)"/);
  if (playMatch) result.playLink = playMatch[1];
  
  // Extract episode info from link text
  const epRegex = /(?:E\d+|Episode\s+\d+|Full\s+(?:Season|Movie)|Pack)[^<]*?<a href="([^"]+)">([^<]+)<\/a>/gi;
  while ((m = epRegex.exec(content)) !== null) {
    result.info[`link_${result.downloads.length}`] = { url: m[1], quality: m[2].trim() };
  }
  
  // Extract series info
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
  if (storyMatch) {
    result.storyline = storyMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 500);
  }
  
  // Count screenshots
  const screenshotCount = (content.match(/catimages\.org\/images\//g) || []).length;
  result.info.screenshotCount = screenshotCount;
  
  return result;
}

async function processItem(anime) {
  try {
    const html = await fetch(`https://new.pikahd.co/${anime.slug}`);
    const data = extractFromPostContent(html);
    return { 
      ...anime, 
      downloads: data.downloads, 
      info: data.info, 
      storyline: data.storyline,
      playLink: data.playLink,
      url: `https://new.pikahd.co/${anime.slug}` 
    };
  } catch (e) {
    return { ...anime, downloads: [], info: {}, url: `https://new.pikahd.co/${anime.slug}`, error: e.message };
  }
}

async function main() {
  console.log('=== PikaHD.co Complete Scraper (Fixed) ===\n');
  
  const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'all-anime-listings.json'), 'utf8'));
  console.log(`Processing ${listings.length} anime...\n`);
  
  const allDetailed = [];
  let withLinks = 0;
  
  for (let i = 0; i < listings.length; i += CONCURRENCY) {
    const batch = listings.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(a => processItem(a)));
    allDetailed.push(...results);
    
    const batchWithLinks = results.filter(a => a.downloads.length > 0).length;
    withLinks += batchWithLinks;
    console.log(`[${Math.min(i + CONCURRENCY, listings.length)}/${listings.length}] +${batchWithLinks} with links (total: ${withLinks})`);
    
    await new Promise(r => setTimeout(r, DELAY));
  }
  
  // Save detailed JSON
  fs.writeFileSync(
    path.join(DATA_DIR, 'all-anime-detailed.json'),
    JSON.stringify(allDetailed, null, 2)
  );
  console.log(`\nSaved: all-anime-detailed.json`);
  
  // Generate comprehensive text file
  let txt = '╔══════════════════════════════════════════════════════════════════════════╗\n';
  txt += '║              PIKAHD.CO — COMPLETE DOWNLOAD LINKS COLLECTION            ║\n';
  txt += '║              Generated: ' + new Date().toISOString() + '                       ║\n';
  txt += '╚══════════════════════════════════════════════════════════════════════════╝\n\n';
  txt += `Total Anime Scraped: ${allDetailed.length}\n`;
  txt += `With Download Links: ${allDetailed.filter(a => a.downloads.length > 0).length}\n`;
  txt += `Total Download Links: ${allDetailed.reduce((s, a) => s + a.downloads.length, 0)}\n\n`;
  
  allDetailed.forEach((a, i) => {
    txt += `\n${'═'.repeat(70)}\n`;
    txt += `  #${String(i + 1).padStart(3, '0')} — ${a.title}\n`;
    txt += `${'─'.repeat(70)}\n`;
    txt += `  URL:        ${a.url}\n`;
    txt += `  Slug:       ${a.slug}\n`;
    txt += `  ID:         ${a.id}\n`;
    txt += `  Categories: ${(a.categories || []).join(', ')}\n`;
    if (a.info) {
      if (a.info.rating) txt += `  Rating:     ${a.info.rating}\n`;
      if (a.info.genres) txt += `  Genres:     ${a.info.genres}\n`;
      if (a.info.language) txt += `  Language:   ${a.info.language}\n`;
      if (a.info.quality) txt += `  Quality:    ${a.info.quality}\n`;
      if (a.info.stars) txt += `  Stars:      ${a.info.stars}\n`;
      if (a.info.creator) txt += `  Creator:    ${a.info.creator}\n`;
    }
    if (a.playLink) txt += `  Play:       ${a.playLink}\n`;
    if (a.storyline) txt += `\n  Storyline:\n  ${a.storyline}\n`;
    if (a.downloads.length > 0) {
      txt += `\n  DOWNLOAD LINKS (${a.downloads.length}):\n`;
      a.downloads.forEach((link, j) => {
        txt += `    ${String(j + 1).padStart(2, ' ')}. ${link}\n`;
      });
    }
    txt += '\n';
  });
  
  fs.writeFileSync(path.join(DATA_DIR, 'ALL-LINKS-COMPLETE.txt'), txt);
  console.log('Saved: ALL-LINKS-COMPLETE.txt');
  
  // Generate CSV
  let csv = 'No,Title,Slug,URL,Categories,Rating,Genres,Language,Quality,Stars,Creator,Downloads,PlayLink\n';
  allDetailed.forEach((a, i) => {
    csv += `${i + 1},"${(a.title || '').replace(/"/g, '""')}","${a.slug}","${a.url}","${(a.categories || []).join('; ')}","${a.info?.rating || ''}","${a.info?.genres || ''}","${a.info?.language || ''}","${a.info?.quality || ''}","${a.info?.stars || ''}","${a.info?.creator || ''}","${a.downloads.join('; ')}","${a.playLink || ''}"\n`;
  });
  fs.writeFileSync(path.join(DATA_DIR, 'ALL-ANIME.csv'), csv);
  console.log('Saved: ALL-ANIME.csv');
  
  // Generate HTML view
  generateHTML(allDetailed);
  
  console.log('\n=== Done! All files saved to:', DATA_DIR, '===');
}

function generateHTML(data) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PikaHD.co — Complete Download Links</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e5e5e5; padding: 20px; }
  .header { text-align: center; padding: 40px 0; border-bottom: 2px solid #f97316; margin-bottom: 30px; }
  .header h1 { font-size: 32px; color: #f97316; margin-bottom: 10px; }
  .header p { color: #999; font-size: 14px; }
  .stats { display: flex; justify-content: center; gap: 40px; margin: 30px 0; padding: 20px; background: #1a1a1a; border-radius: 12px; }
  .stat { text-align: center; }
  .stat-num { font-size: 36px; font-weight: 700; color: #f97316; }
  .stat-label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
  .anime-card { background: #1a1a1a; border-radius: 12px; margin-bottom: 16px; overflow: hidden; border: 1px solid #333; }
  .anime-header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
  .anime-title { font-size: 16px; font-weight: 700; color: #fff; }
  .anime-badges { display: flex; gap: 6px; }
  .badge { padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .badge-hindi { background: #f97316; color: white; }
  .badge-dual { background: #3b82f6; color: white; }
  .badge-triple { background: #8b5cf6; color: white; }
  .badge-hevc { background: #10b981; color: white; }
  .anime-body { padding: 16px 20px; }
  .anime-meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; margin-bottom: 12px; font-size: 13px; }
  .meta-item { color: #999; }
  .meta-label { font-weight: 600; color: #ccc; }
  .anime-url { font-size: 12px; color: #3b82f6; margin-bottom: 12px; word-break: break-all; }
  .anime-url a { color: #3b82f6; text-decoration: none; }
  .anime-url a:hover { text-decoration: underline; }
  .download-section { margin-top: 12px; }
  .download-title { font-size: 14px; font-weight: 700; color: #f97316; margin-bottom: 8px; }
  .download-links { display: flex; flex-wrap: wrap; gap: 6px; }
  .dl-link { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: #0f2d1a; border: 1px solid #166534; border-radius: 6px; color: #4ade80; font-size: 11px; text-decoration: none; transition: all 0.2s; }
  .dl-link:hover { background: #14532d; border-color: #4ade80; }
  .storyline { margin-top: 12px; font-size: 13px; color: #999; line-height: 1.6; }
  .footer { text-align: center; padding: 40px 0; border-top: 2px solid #f97316; margin-top: 40px; color: #666; font-size: 13px; }
  .toc { margin-bottom: 40px; }
  .toc h2 { font-size: 20px; color: #f97316; margin-bottom: 16px; }
  .toc-list { list-style: none; columns: 2; column-gap: 20px; }
  .toc-list li { padding: 4px 0; font-size: 13px; break-inside: avoid; }
  .toc-list a { color: #ccc; text-decoration: none; }
  .toc-list a:hover { color: #f97316; }
  .toc-num { color: #f97316; font-weight: 700; margin-right: 6px; }
</style>
</head>
<body>
<div class="header">
  <h1>🎬 PikaHD.co</h1>
  <p>Complete Download Links & Anime Metadata Collection</p>
  <p style="margin-top:8px;color:#666">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>
<div class="stats">
  <div class="stat"><div class="stat-num">${data.length}</div><div class="stat-label">Total Anime</div></div>
  <div class="stat"><div class="stat-num">${data.filter(a => a.downloads.length > 0).length}</div><div class="stat-label">With Links</div></div>
  <div class="stat"><div class="stat-num">${data.reduce((s, a) => s + a.downloads.length, 0)}</div><div class="stat-label">Total Links</div></div>
</div>
<div class="toc">
  <h2>📋 Table of Contents</h2>
  <ol class="toc-list">
${data.map((a, i) => `    <li><span class="toc-num">${i + 1}.</span> <a href="#anime-${i}">${(a.title || '').substring(0, 70)}</a></li>`).join('\n')}
  </ol>
</div>
`;

  data.forEach((a, i) => {
    const categories = a.categories || [];
    const badges = [];
    if (categories.includes('dual-audio')) badges.push('<span class="badge badge-dual">Dual</span>');
    if (categories.includes('triple-audio') || categories.includes('triple-audio-anime-hindi-dubbed')) badges.push('<span class="badge badge-triple">Triple</span>');
    if (categories.includes('10bit-hevc')) badges.push('<span class="badge badge-hevc">HEVC</span>');
    if (categories.includes('anime-hindi-dubbed') || categories.includes('hindi-dubbed')) badges.push('<span class="badge badge-hindi">Hindi</span>');

    html += `
<div class="anime-card" id="anime-${i}">
  <div class="anime-header">
    <div class="anime-title">${i + 1}. ${(a.title || '').replace(/</g, '&lt;')}</div>
    <div class="anime-badges">${badges.join('')}</div>
  </div>
  <div class="anime-body">
    <div class="anime-meta">
      <div class="meta-item"><span class="meta-label">Slug:</span> ${a.slug}</div>
      <div class="meta-item"><span class="meta-label">ID:</span> ${a.id}</div>
      ${a.info?.rating ? `<div class="meta-item"><span class="meta-label">Rating:</span> ${a.info.rating}</div>` : ''}
      ${a.info?.genres ? `<div class="meta-item"><span class="meta-label">Genres:</span> ${a.info.genres}</div>` : ''}
      ${a.info?.language ? `<div class="meta-item"><span class="meta-label">Language:</span> ${a.info.language}</div>` : ''}
      ${a.info?.quality ? `<div class="meta-item"><span class="meta-label">Quality:</span> ${a.info.quality}</div>` : ''}
      ${a.info?.stars ? `<div class="meta-item"><span class="meta-label">Stars:</span> ${a.info.stars}</div>` : ''}
    </div>
    <div class="anime-url">🔗 <a href="${a.url}" target="_blank">${a.url}</a></div>
    ${a.playLink ? `<div class="anime-url">▶ <a href="${a.playLink}" target="_blank">${a.playLink}</a></div>` : ''}
    ${a.downloads.length > 0 ? `
    <div class="download-section">
      <div class="download-title">⬇ Download Links (${a.downloads.length})</div>
      <div class="download-links">
        ${a.downloads.map(link => `<a href="${link}" class="dl-link" target="_blank">📥 ${link.split('/').pop()}</a>`).join('\n        ')}
      </div>
    </div>` : '<p style="color:#666;margin-top:12px">No download links found</p>'}
    ${a.storyline ? `<div class="storyline">${a.storyline}</div>` : ''}
  </div>
</div>
`;
  });

  html += `
<div class="footer">
  <p>🎬 PikaHD.co Complete Download Collection</p>
  <p>Total: ${data.length} anime | ${data.reduce((s, a) => s + a.downloads.length, 0)} download links</p>
</div>
</body></html>`;

  fs.writeFileSync(path.join(DATA_DIR, 'PIKAHD-COMPLETE-LINKS.html'), html);
  console.log('Saved: PIKAHD-COMPLETE-LINKS.html');
}

main().catch(console.error);
