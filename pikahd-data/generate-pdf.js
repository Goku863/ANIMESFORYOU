const fs = require('fs');
const path = require('path');

const DATA_DIR = __dirname;
const OUTPUT_FILE = path.join(DATA_DIR, 'pikahd-complete-links.pdf.html');

function generateHTML() {
  const listingsFile = path.join(DATA_DIR, 'all-anime-listings.json');
  const detailedFile = path.join(DATA_DIR, 'all-anime-detailed.json');
  
  if (!fs.existsSync(detailedFile)) {
    console.log('Detailed data not found. Using listings only.');
  }
  
  const listings = fs.existsSync(listingsFile) ? JSON.parse(fs.readFileSync(listingsFile, 'utf8')) : [];
  const detailed = fs.existsSync(detailedFile) ? JSON.parse(fs.readFileSync(detailedFile, 'utf8')) : [];
  
  const data = detailed.length > 0 ? detailed : listings;
  
  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>PikaHD.co Complete Download Links & Metadata</title>
<style>
  @page { margin: 15mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    font-size: 10px; 
    line-height: 1.4; 
    color: #1a1a1a; 
    background: #fff;
    padding: 20px;
  }
  .header {
    text-align: center;
    padding: 30px 0;
    border-bottom: 3px solid #f97316;
    margin-bottom: 30px;
  }
  .header h1 {
    font-size: 28px;
    color: #f97316;
    margin-bottom: 8px;
  }
  .header p {
    color: #666;
    font-size: 12px;
  }
  .stats {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin: 20px 0;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  .stat {
    text-align: center;
  }
  .stat-num {
    font-size: 24px;
    font-weight: 700;
    color: #f97316;
  }
  .stat-label {
    font-size: 10px;
    color: #666;
    text-transform: uppercase;
  }
  .anime-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 16px;
    page-break-inside: avoid;
    overflow: hidden;
  }
  .anime-header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: white;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .anime-title {
    font-size: 13px;
    font-weight: 700;
    flex: 1;
  }
  .anime-badges {
    display: flex;
    gap: 6px;
    margin-left: 10px;
  }
  .badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .badge-hindi { background: #f97316; color: white; }
  .badge-dual { background: #3b82f6; color: white; }
  .badge-triple { background: #8b5cf6; color: white; }
  .badge-hevc { background: #10b981; color: white; }
  .badge-new { background: #ef4444; color: white; }
  .anime-body {
    padding: 12px 16px;
  }
  .anime-meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 10px;
    font-size: 10px;
    color: #666;
  }
  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .meta-label {
    font-weight: 600;
    color: #374151;
  }
  .anime-url {
    font-size: 9px;
    color: #3b82f6;
    word-break: break-all;
    margin-bottom: 8px;
  }
  .download-section {
    margin-top: 10px;
  }
  .download-title {
    font-size: 11px;
    font-weight: 700;
    color: #f97316;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .download-links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .dl-link {
    display: inline-block;
    padding: 3px 8px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 4px;
    font-size: 8px;
    color: #166534;
    text-decoration: none;
    word-break: break-all;
  }
  .dl-link:hover { background: #dcfce7; }
  .pack-links {
    margin-top: 6px;
  }
  .pack-link {
    display: block;
    padding: 4px 8px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 4px;
    font-size: 8px;
    color: #1e40af;
    text-decoration: none;
    margin-bottom: 3px;
    word-break: break-all;
  }
  .screenshot-list {
    margin-top: 8px;
    font-size: 8px;
    color: #9ca3af;
  }
  .footer {
    text-align: center;
    padding: 20px 0;
    border-top: 2px solid #f97316;
    margin-top: 30px;
    color: #999;
    font-size: 10px;
  }
  .toc {
    margin-bottom: 30px;
    page-break-after: always;
  }
  .toc h2 {
    font-size: 18px;
    color: #f97316;
    margin-bottom: 15px;
    border-bottom: 2px solid #f97316;
    padding-bottom: 5px;
  }
  .toc-list {
    columns: 2;
    column-gap: 20px;
    list-style: none;
  }
  .toc-list li {
    padding: 3px 0;
    font-size: 10px;
    break-inside: avoid;
  }
  .toc-list a {
    color: #374151;
    text-decoration: none;
  }
  .toc-num {
    color: #f97316;
    font-weight: 700;
    margin-right: 4px;
  }
</style>
</head>
<body>

<div class="header">
  <h1>🎬 PikaHD.co</h1>
  <p>Complete Download Links & Anime Metadata Collection</p>
  <p style="margin-top:5px;color:#999;">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>

<div class="stats">
  <div class="stat">
    <div class="stat-num">${data.length}</div>
    <div class="stat-label">Total Anime</div>
  </div>
  <div class="stat">
    <div class="stat-num">${data.filter(a => (a.downloads || []).length > 0 || (a.metadata?.episodeLinks || []).length > 0).length}</div>
    <div class="stat-label">With Download Links</div>
  </div>
  <div class="stat">
    <div class="stat-num">${data.reduce((sum, a) => sum + (a.downloads || []).length + (a.metadata?.episodeLinks || []).length, 0)}</div>
    <div class="stat-label">Total Links</div>
  </div>
</div>

<div class="toc">
  <h2>📋 Table of Contents</h2>
  <ol class="toc-list">
`;

  data.forEach((anime, i) => {
    const title = (anime.title || anime.slug || 'Unknown').replace(/</g, '&lt;');
    html += `    <li><span class="toc-num">${i + 1}.</span> ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}</li>\n`;
  });

  html += `  </ol>
</div>

`;

  data.forEach((anime, i) => {
    const title = (anime.title || 'Unknown').replace(/</g, '&lt;');
    const categories = anime.categories || [];
    const meta = anime.metadata || {};
    const info = meta.info || {};
    const downloads = anime.downloads || [];
    const epLinks = meta.episodeLinks || [];
    const packLinks = meta.packLinks || [];
    const screenshots = meta.screenshots || [];
    
    // Determine badges
    const badges = [];
    if (categories.includes('dual-audio')) badges.push('<span class="badge badge-dual">Dual</span>');
    if (categories.includes('triple-audio') || categories.includes('triple-audio-anime-hindi-dubbed')) badges.push('<span class="badge badge-triple">Triple</span>');
    if (categories.includes('10bit-hevc')) badges.push('<span class="badge badge-hevc">HEVC</span>');
    if (categories.includes('anime-hindi-dubbed') || categories.includes('hindi-dubbed')) badges.push('<span class="badge badge-hindi">Hindi</span>');
    
    html += `
<div class="anime-card">
  <div class="anime-header">
    <div class="anime-title">${i + 1}. ${title}</div>
    <div class="anime-badges">${badges.join('')}</div>
  </div>
  <div class="anime-body">
    <div class="anime-meta">
      <div class="meta-item"><span class="meta-label">Slug:</span> ${anime.slug || 'N/A'}</div>
      <div class="meta-item"><span class="meta-label">ID:</span> ${anime.id || 'N/A'}</div>
      <div class="meta-item"><span class="meta-label">Created:</span> ${(anime.created || '').split(' ')[0]}</div>
      ${info.rating ? `<div class="meta-item"><span class="meta-label">Rating:</span> ${info.rating}</div>` : ''}
      ${info.genres ? `<div class="meta-item"><span class="meta-label">Genres:</span> ${info.genres}</div>` : ''}
      ${info.language ? `<div class="meta-item"><span class="meta-label">Language:</span> ${info.language}</div>` : ''}
      ${info.quality ? `<div class="meta-item"><span class="meta-label">Quality:</span> ${info.quality}</div>` : ''}
      ${info.stars ? `<div class="meta-item"><span class="meta-label">Stars:</span> ${info.stars}</div>` : ''}
      ${info.creator ? `<div class="meta-item"><span class="meta-label">Creator:</span> ${info.creator}</div>` : ''}
    </div>
    
    <div class="anime-url">🔗 ${anime.url || `https://new.pikahd.co/${anime.slug}`}</div>
    
    ${meta.description ? `<div style="font-size:9px;color:#666;margin-bottom:8px;font-style:italic">${meta.description.substring(0, 200)}${meta.description.length > 200 ? '...' : ''}</div>` : ''}
    
    ${downloads.length > 0 ? `
    <div class="download-section">
      <div class="download-title">⬇ Direct Download Links (${downloads.length})</div>
      <div class="download-links">
        ${downloads.map(link => `<a href="${link}" class="dl-link" target="_blank">${link.split('/').pop()}</a>`).join('\n        ')}
      </div>
    </div>
    ` : ''}
    
    ${epLinks.length > 0 ? `
    <div class="download-section">
      <div class="download-title">📺 Episode Links (${epLinks.length})</div>
      <div class="download-links">
        ${epLinks.map(link => `<a href="${link.url}" class="dl-link" target="_blank">[${link.quality}] ${link.url.split('/').pop()}</a>`).join('\n        ')}
      </div>
    </div>
    ` : ''}
    
    ${packLinks.length > 0 ? `
    <div class="download-section pack-links">
      <div class="download-title">📦 Pack Downloads (${packLinks.length})</div>
      ${packLinks.map(link => `<a href="${link.url}" class="pack-link" target="_blank">[${link.label}] ${link.url}</a>`).join('\n      ')}
    </div>
    ` : ''}
    
    ${meta.playLink ? `<div style="margin-top:8px;font-size:9px;color:#666">▶ Play: <a href="${meta.playLink}" style="color:#3b82f6">${meta.playLink}</a></div>` : ''}
    
    ${screenshots.length > 0 ? `<div class="screenshot-list">📸 Screenshots: ${screenshots.length} available</div>` : ''}
    
    ${meta.storyline ? `<div style="margin-top:8px;font-size:9px;color:#666"><strong>Story:</strong> ${meta.storyline.substring(0, 300)}${meta.storyline.length > 300 ? '...' : ''}</div>` : ''}
  </div>
</div>
`;
  });

  html += `
<div class="footer">
  <p>🎬 PikaHD.co Complete Download Collection</p>
  <p>Total Anime: ${data.length} | Generated: ${new Date().toISOString()}</p>
  <p style="margin-top:8px;color:#ccc">Source: https://new.pikahd.co</p>
</div>

</body>
</html>`;

  return html;
}

// Generate
const html = generateHTML();
fs.writeFileSync(OUTPUT_FILE, html);
console.log(`Generated: ${OUTPUT_FILE}`);
console.log(`Open this file in a browser and print to PDF (Ctrl+P → Save as PDF)`);
