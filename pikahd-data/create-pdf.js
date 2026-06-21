const fs = require('fs');
const path = require('path');

const DATA_DIR = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'all-anime-detailed.json'), 'utf8'));

const withLinks = data.filter(a => a.downloads && a.downloads.length > 0);
const totalLinks = data.reduce((s, a) => s + (a.downloads || []).length, 0);

let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PikaHD.co - Complete Download Links Collection</title>
<style>
  @page { size: A4; margin: 12mm; }
  @media print { .no-print { display: none !important; } }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9px; line-height: 1.3; color: #111; background: #fff; margin: 0; padding: 10mm; }
  
  .cover { text-align: center; padding: 60px 0 40px; border-bottom: 3px solid #f97316; margin-bottom: 30px; page-break-after: always; }
  .cover h1 { font-size: 36px; color: #f97316; margin: 0 0 10px; }
  .cover h2 { font-size: 18px; color: #555; font-weight: 400; margin: 0 0 20px; }
  .cover .date { color: #999; font-size: 12px; }
  
  .stats-box { display: flex; justify-content: center; gap: 40px; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; }
  .stat { text-align: center; }
  .stat-num { font-size: 28px; font-weight: 700; color: #f97316; display: block; }
  .stat-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  
  .toc { page-break-after: always; }
  .toc h2 { font-size: 16px; color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 5px; margin-bottom: 15px; }
  .toc-grid { columns: 2; column-gap: 20px; list-style: none; padding: 0; margin: 0; }
  .toc-grid li { padding: 2px 0; break-inside: avoid; font-size: 8px; }
  .toc-num { color: #f97316; font-weight: 700; margin-right: 4px; }
  
  .anime-entry { border: 1px solid #ddd; border-radius: 6px; margin-bottom: 12px; page-break-inside: avoid; overflow: hidden; }
  .anime-head { background: #1a1a2e; color: #fff; padding: 8px 12px; font-size: 11px; font-weight: 700; }
  .anime-head .num { color: #f97316; margin-right: 6px; }
  .anime-body { padding: 10px 12px; }
  
  .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 12px; margin-bottom: 8px; font-size: 8px; color: #555; }
  .meta-grid dt { font-weight: 700; color: #333; }
  .meta-grid dd { margin: 0; }
  
  .url-line { font-size: 7px; color: #3b82f6; word-break: break-all; margin-bottom: 6px; }
  
  .links-section { margin-top: 6px; }
  .links-title { font-size: 9px; font-weight: 700; color: #f97316; margin-bottom: 4px; }
  .link-list { display: flex; flex-wrap: wrap; gap: 3px; }
  .link-item { display: inline-block; padding: 2px 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 3px; font-size: 7px; color: #166534; word-break: break-all; max-width: 100%; }
  
  .storyline { font-size: 8px; color: #666; margin-top: 6px; font-style: italic; line-height: 1.4; }
  
  .footer { text-align: center; padding: 20px 0; border-top: 2px solid #f97316; margin-top: 30px; font-size: 9px; color: #999; }
  
  .section-break { page-break-before: always; }
</style>
</head>
<body>

<div class="cover">
  <h1>🎬 PikaHD.co</h1>
  <h2>Complete Download Links & Anime Metadata</h2>
  <p class="date">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <div class="stats-box">
    <div class="stat"><span class="stat-num">${data.length}</span><span class="stat-label">Total Anime</span></div>
    <div class="stat"><span class="stat-num">${withLinks.length}</span><span class="stat-label">With Links</span></div>
    <div class="stat"><span class="stat-num">${totalLinks}</span><span class="stat-label">Download Links</span></div>
  </div>
</div>

<div class="toc">
  <h2>Table of Contents</h2>
  <ol class="toc-grid">
${data.map((a, i) => `    <li><span class="toc-num">${i + 1}.</span> ${(a.title || '').substring(0, 65)}${(a.title || '').length > 65 ? '...' : ''}</li>`).join('\n')}
  </ol>
</div>

`;

data.forEach((a, i) => {
  const cats = a.categories || [];
  const info = a.info || {};
  const downloads = a.downloads || [];
  
  html += `
<div class="anime-entry${i > 0 && i % 20 === 0 ? ' section-break' : ''}">
  <div class="anime-head"><span class="num">#${String(i + 1).padStart(3, '0')}</span> ${(a.title || '').replace(/</g, '&lt;')}</div>
  <div class="anime-body">
    <div class="meta-grid">
      <dt>Slug</dt><dd>${a.slug}</dd>
      <dt>ID</dt><dd>${a.id}</dd>
      <dt>Categories</dt><dd>${cats.join(', ')}</dd>
      ${info.rating ? `<dt>Rating</dt><dd>${info.rating}</dd>` : ''}
      ${info.genres ? `<dt>Genres</dt><dd>${info.genres}</dd>` : ''}
      ${info.language ? `<dt>Language</dt><dd>${info.language}</dd>` : ''}
      ${info.quality ? `<dt>Quality</dt><dd>${info.quality}</dd>` : ''}
      ${info.stars ? `<dt>Stars</dt><dd>${info.stars}</dd>` : ''}
      ${info.creator ? `<dt>Creator</dt><dd>${info.creator}</dd>` : ''}
    </div>
    <div class="url-line">🔗 ${a.url}</div>
    ${a.playLink ? `<div class="url-line">▶ ${a.playLink}</div>` : ''}
    ${downloads.length > 0 ? `
    <div class="links-section">
      <div class="links-title">⬇ Download Links (${downloads.length})</div>
      <div class="link-list">
        ${downloads.map(l => `<span class="link-item">${l}</span>`).join('\n        ')}
      </div>
    </div>` : ''}
    ${a.storyline ? `<div class="storyline">${a.storyline}</div>` : ''}
  </div>
</div>
`;
});

html += `
<div class="footer">
  <p><strong>PikaHD.co Complete Download Collection</strong></p>
  <p>${data.length} anime | ${withLinks.length} with links | ${totalLinks} total download links</p>
  <p>Source: https://new.pikahd.co</p>
</div>

</body>
</html>`;

fs.writeFileSync(path.join(DATA_DIR, 'PIKAHD-COMPLETE-PDF.html'), html);
console.log('Generated: PIKAHD-COMPLETE-PDF.html');
console.log(`Stats: ${data.length} anime, ${withLinks.length} with links, ${totalLinks} total links`);
console.log('Open in browser → Ctrl+P → Save as PDF');
