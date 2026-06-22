// Cloudflare Worker — ANIMEFORYOU Auto-Scraper
// Automatically scrapes anime from GogoAnime API

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // API endpoints
  if (url.pathname === '/api/anime/list') {
    return await handleAnimeList(url);
  }
  if (url.pathname === '/api/anime/search') {
    return await handleAnimeSearch(url);
  }
  if (url.pathname === '/api/anime/details') {
    return await handleAnimeDetails(url);
  }
  if (url.pathname === '/api/anime/episodes') {
    return await handleAnimeEpisodes(url);
  }
  if (url.pathname === '/api/anime/stream') {
    return await handleAnimeStream(url);
  }
  if (url.pathname === '/api/pipe') {
    return await handlePipeProxy(request);
  }

  // Serve main HTML
  const html = generateHTML();
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// GogoAnime API endpoints
const GOGO_API = 'https://api.consumet.org/anime/gogoanime';

async function handleAnimeList(url) {
  try {
    const page = url.searchParams.get('page') || '1';
    const res = await fetch(`${GOGO_API}/recent-episodes?page=${page}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

async function handleAnimeSearch(url) {
  try {
    const query = url.searchParams.get('q') || '';
    const res = await fetch(`${GOGO_API}/${encodeURIComponent(query)}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

async function handleAnimeDetails(url) {
  try {
    const id = url.searchParams.get('id') || '';
    const res = await fetch(`${GOGO_API}/info/${id}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

async function handleAnimeEpisodes(url) {
  try {
    const id = url.searchParams.get('id') || '';
    const res = await fetch(`${GOGO_API}/info/${id}`);
    const data = await res.json();
    return new Response(JSON.stringify({ episodes: data.episodes || [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

async function handleAnimeStream(url) {
  try {
    const episodeId = url.searchParams.get('id') || '';
    const res = await fetch(`${GOGO_API}/watch/${episodeId}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

async function handlePipeProxy(request) {
  try {
    const url = new URL(request.url);
    const miruroUrl = `https://www.miruro.tv/api/secure/pipe${url.search}`;
    const res = await fetch(miruroUrl, {
      method: request.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.miruro.tv/',
      },
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

function generateHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ANIMEFORYOU - Watch Anime Online Free</title>
<link rel="icon" href="https://pikahd.co/wp-content/uploads/2020/07/cropped-plkd.png">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#08080a;color:#e0e0e0;min-height:100vh;overflow-x:hidden}
a{color:#ff6b00;text-decoration:none;transition:color .2s;font-family:'Space Grotesk',sans-serif}
a:hover{color:#ff8c33}

/* Scrollbar */
::-webkit-scrollbar{width:8px}
::-webkit-scrollbar-track{background:#111}
::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:#555}

/* Header */
.header{background:rgba(15,15,18,.85);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid rgba(255,107,0,.08);padding:14px 24px;position:sticky;top:0;z-index:100;transition:box-shadow .3s}
.header.scrolled{box-shadow:0 4px 30px rgba(0,0,0,.5)}
.header-inner{max-width:1440px;margin:0 auto;display:flex;align-items:center;gap:20px}
.brand-text{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;letter-spacing:-0.5px;text-decoration:none;transition:all .3s}
.brand-text:hover{transform:scale(1.03)}
.brand-anime{background:linear-gradient(135deg,#ff6b00,#ff8c33);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.brand-foryou{color:#fff}
.search-box{flex:1;max-width:520px;margin:0 auto;position:relative}
.search-box input{width:100%;padding:14px 52px 14px 20px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#fff;font-size:15px;font-family:'Space Grotesk',sans-serif;outline:none;transition:all .3s cubic-bezier(0.22,1,0.36,1)}
.search-box input:focus{border-color:rgba(255,107,0,.5);background:rgba(255,255,255,.08);box-shadow:0 0 0 4px rgba(255,107,0,.1)}
.search-box input::placeholder{color:#555;font-family:'Inter',sans-serif}
.search-btn{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:12px;border:none;background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .25s cubic-bezier(0.22,1,0.36,1);box-shadow:0 4px 12px rgba(255,107,0,.3)}
.search-btn:hover{transform:translateY(-50%) scale(1.08);box-shadow:0 6px 20px rgba(255,107,0,.4)}

/* Nav */
.nav{background:rgba(15,15,18,.6);border-bottom:1px solid rgba(255,255,255,.04);padding:10px 24px;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav-inner{max-width:1440px;margin:0 auto;display:flex;gap:10px}
.nav-pill{padding:9px 20px;border-radius:24px;background:rgba(255,255,255,.05);color:#888;text-decoration:none;font-size:13px;font-weight:600;font-family:'Space Grotesk',sans-serif;white-space:nowrap;transition:all .25s cubic-bezier(0.22,1,0.36,1);border:1px solid transparent;letter-spacing:0.3px}
.nav-pill:hover{background:rgba(255,107,0,.12);color:#ff8c33;border-color:rgba(255,107,0,.18);text-decoration:none}
.nav-pill.active{background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;border-color:transparent;box-shadow:0 4px 16px rgba(255,107,0,.35)}

/* Main */
.main{max-width:1440px;margin:0 auto;padding:28px 24px}

/* Shimmer loading text */
.shimmer-text{position:relative;display:inline-block;color:#555;font-family:'Space Grotesk',sans-serif;font-weight:600}
.shimmer-text::before{content:attr(data-text);position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(90deg,transparent 0%,transparent 40%,#ff6b00 50%,transparent 60%,transparent 100%);background-size:400% 100%;background-repeat:no-repeat;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:t-shimmer 2000ms linear infinite}
@keyframes t-shimmer{0%{background-position:100% 0}100%{background-position:0% 0}}

/* Grid */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:20px}

/* Card */
.card{background:linear-gradient(145deg,rgba(25,25,30,.9),rgba(18,18,22,.95));border-radius:16px;overflow:hidden;cursor:pointer;transition:all .35s cubic-bezier(0.22,1,0.36,1);border:1px solid rgba(255,255,255,.04);position:relative}
.card::before{content:'';position:absolute;inset:0;border-radius:16px;padding:1px;background:linear-gradient(135deg,rgba(255,107,0,0),rgba(255,107,0,.15));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .35s;pointer-events:none;z-index:1}
.card:hover{transform:translateY(-8px) scale(1.02);box-shadow:0 20px 50px rgba(255,107,0,.12),0 8px 20px rgba(0,0,0,.4)}
.card:hover::before{opacity:1}
.card-img{width:100%;aspect-ratio:2/3;object-fit:cover;background:linear-gradient(135deg,#151518,#1a1a1f);transition:transform .5s cubic-bezier(0.22,1,0.36,1),filter .5s}
.card:hover .card-img{transform:scale(1.06);filter:brightness(1.1)}
.card-img-wrap{overflow:hidden;position:relative}
.card-img-wrap::after{content:'';position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(to top,rgba(8,8,10,.95),transparent);pointer-events:none}
.card-body{padding:14px 16px 18px;position:relative}
.card-title{font-size:14px;font-weight:600;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#f0f0f0;transition:color .2s;font-family:'Space Grotesk',sans-serif}
.card:hover .card-title{color:#ff8c33}
.card-meta{font-size:11px;color:#666;margin-top:6px;display:flex;align-items:center;gap:6px;font-family:'Space Grotesk',sans-serif}
.card-badge{position:absolute;top:12px;right:12px;padding:5px 12px;border-radius:10px;background:rgba(255,107,0,.9);color:#fff;font-size:10px;font-weight:700;font-family:'Space Grotesk',sans-serif;letter-spacing:0.5px;text-transform:uppercase;backdrop-filter:blur(10px);z-index:2;box-shadow:0 4px 12px rgba(0,0,0,.3)}

/* Skeleton */
.skel-card{background:rgba(25,25,30,.6);border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.03)}
.skel-img{width:100%;aspect-ratio:2/3;background:linear-gradient(135deg,#18181c,#1e1e24);animation:skel-pulse 1200ms ease-in-out infinite}
.skel-body{padding:14px 16px 18px}
.skel-line{height:14px;border-radius:8px;background:linear-gradient(135deg,#1a1a1f,#222228);animation:skel-pulse 1200ms ease-in-out infinite;margin-bottom:10px}
.skel-line:last-child{width:60%;margin-bottom:0}
@keyframes skel-pulse{0%,100%{opacity:1}50%{opacity:0.4}}

/* Pagination */
.pagination{display:flex;justify-content:center;gap:10px;margin-top:36px;padding-bottom:48px}
.page-btn{padding:11px 22px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#888;cursor:pointer;font-size:14px;font-weight:600;font-family:'Space Grotesk',sans-serif;transition:all .25s cubic-bezier(0.22,1,0.36,1);letter-spacing:0.2px}
.page-btn:hover{background:rgba(255,107,0,.12);color:#ff8c33;border-color:rgba(255,107,0,.2)}
.page-btn.active{background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(255,107,0,.3)}

/* Detail page */
.detail-page{max-width:1000px;margin:0 auto;animation:fadeUp .4s cubic-bezier(0.22,1,0.36,1)}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.player-wrap{background:#000;border-radius:16px;overflow:hidden;margin-bottom:28px;aspect-ratio:16/9;position:relative;border:1px solid rgba(255,255,255,.05)}
.player-wrap video,.player-wrap iframe{width:100%;height:100%;border:none}
.player-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#666;gap:16px;font-family:'Space Grotesk',sans-serif}
.episodes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px;margin-bottom:28px}
.ep-btn{padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#888;cursor:pointer;font-size:14px;font-weight:600;font-family:'Space Grotesk',sans-serif;text-align:center;transition:all .25s cubic-bezier(0.22,1,0.36,1);letter-spacing:0.2px}
.ep-btn:hover{background:rgba(255,107,0,.12);color:#ff8c33;border-color:rgba(255,107,0,.2)}
.ep-btn.active{background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(255,107,0,.3)}
.providers{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
.provider-btn{padding:10px 22px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#888;cursor:pointer;font-size:14px;font-weight:600;font-family:'Space Grotesk',sans-serif;transition:all .25s cubic-bezier(0.22,1,0.36,1);letter-spacing:0.2px}
.provider-btn:hover{background:rgba(255,255,255,.08);color:#ccc}
.provider-btn.active{background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;border-color:transparent;box-shadow:0 4px 16px rgba(255,107,0,.3)}
.back-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:12px;background:rgba(255,255,255,.06);color:#888;text-decoration:none;font-size:14px;font-weight:600;font-family:'Space Grotesk',sans-serif;margin-bottom:24px;cursor:pointer;border:1px solid rgba(255,255,255,.08);transition:all .25s cubic-bezier(0.22,1,0.36,1);letter-spacing:0.2px}
.back-btn:hover{background:rgba(255,255,255,.1);color:#fff;text-decoration:none}
.detail-title{font-size:32px;font-weight:800;color:#fff;margin-bottom:16px;line-height:1.3;background:linear-gradient(135deg,#fff,#ccc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-family:'Space Grotesk',sans-serif;letter-spacing:-0.5px}
.detail-desc{font-size:15px;color:#aaa;line-height:1.8;font-family:'Inter',sans-serif}

/* Download section */
.download-section{margin-top:28px;padding:24px;background:linear-gradient(145deg,rgba(25,25,30,.9),rgba(18,18,22,.95));border-radius:16px;border:1px solid rgba(255,255,255,.05)}
.download-section h3{font-size:17px;font-weight:700;color:#ff6b00;margin-bottom:14px;display:flex;align-items:center;gap:8px;font-family:'Space Grotesk',sans-serif;letter-spacing:-0.3px}
.download-list{display:flex;flex-direction:column;gap:8px}
.download-item{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,255,255,.02);border-radius:10px;border:1px solid rgba(255,255,255,.04);transition:all .25s}
.download-item:hover{border-color:rgba(255,107,0,.2);background:rgba(255,107,0,.04)}
.download-label{font-size:14px;color:#bbb;font-weight:600;font-family:'Space Grotesk',sans-serif;letter-spacing:0.2px}
.download-btn{padding:8px 18px;border-radius:10px;background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;font-size:12px;font-weight:700;font-family:'Space Grotesk',sans-serif;text-decoration:none;transition:all .25s cubic-bezier(0.22,1,0.36,1);box-shadow:0 4px 12px rgba(255,107,0,.25);letter-spacing:0.3px}
.download-btn:hover{opacity:.95;transform:translateY(-2px) scale(1.03);text-decoration:none;box-shadow:0 6px 20px rgba(255,107,0,.35)}

/* Info grid */
.info-grid{margin-top:28px;padding:24px;background:linear-gradient(145deg,rgba(25,25,30,.9),rgba(18,18,22,.95));border-radius:16px;display:flex;gap:24px;flex-wrap:wrap;border:1px solid rgba(255,255,255,.05)}
.info-grid img{width:130px;border-radius:12px;object-fit:cover;box-shadow:0 8px 24px rgba(0,0,0,.4)}
.info-meta{font-size:14px;color:#888;line-height:2;font-family:'Space Grotesk',sans-serif}
.info-meta span{color:#ccc;font-weight:600}

/* Empty state */
.empty-state{text-align:center;padding:80px 20px}
.empty-state h3{font-size:22px;color:#444;margin-bottom:8px;font-family:'Space Grotesk',sans-serif;font-weight:700}

@media(max-width:768px){
  .grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
  .header-inner{gap:12px}
  .search-box input{padding:12px 48px 12px 16px;font-size:14px}
  .detail-title{font-size:24px}
  .info-grid{flex-direction:column;align-items:center;text-align:center}
  .main{padding:20px 14px}
}
@media(prefers-reduced-motion:reduce){
  .card,.nav-pill,.page-btn,.provider-btn,.ep-btn,.back-btn,.download-btn,.download-item{transition:none !important}
  .card:hover{transform:none}
  .shimmer-text::before{animation:none !important}
  .skel-img,.skel-line{animation:none !important}
  @keyframes fadeUp{from{opacity:1;transform:none}to{opacity:1;transform:none}}
}
</style>
</head>
<body>
<header class="header" id="header"><div class="header-inner">
<a href="#" onclick="goHome();return false" style="text-decoration:none"><div style="display:flex;align-items:center;gap:10px"><span style="font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;background:linear-gradient(135deg,#ff6b00,#ff8c33);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.5px">ANIME</span><span style="font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.5px">FORYOU</span></div></a>
<div class="search-box">
<input type="text" id="searchInput" placeholder="Search anime..." onkeydown="if(event.key==='Enter')doSearch()">
<button class="search-btn" onclick="doSearch()">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
</button>
</div></div></header>
<nav class="nav"><div class="nav-inner">
<a href="#" class="nav-pill active" onclick="goHome();return false">Home</a>
<a href="#" class="nav-pill" onclick="loadCategory('sub');return false">Subbed</a>
<a href="#" class="nav-pill" onclick="loadCategory('dub');return false">Dubbed</a>
<a href="#" class="nav-pill" onclick="loadGenre('action');return false">Action</a>
<a href="#" class="nav-pill" onclick="loadGenre('romance');return false">Romance</a>
<a href="#" class="nav-pill" onclick="loadGenre('comedy');return false">Comedy</a>
<a href="#" class="nav-pill" onclick="loadGenre('fantasy');return false">Fantasy</a>
<a href="#" class="nav-pill" onclick="loadGenre('horror');return false">Horror</a>
<a href="#" class="nav-pill" onclick="loadGenre('sci-fi');return false">Sci-Fi</a>
</div></nav>
<main class="main" id="content">
<div style="text-align:center;padding:60px 20px">
  <div class="shimmer-text" data-text="Loading anime...">Loading anime...</div>
</div>
</main>
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
var API_BASE='https://animeforyou-pg3142292.workers.dev';
var currentPage=1,currentCategory='',currentSearch='',currentProvider='gogoanime';

function escHtml(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function showSkeletons(c,n){var h='';for(var i=0;i<(n||12);i++)h+='<div class="skel-card"><div class="skel-img"></div><div class="skel-body"><div class="skel-line"></div><div class="skel-line"></div></div></div>';c.innerHTML='<div class="grid">'+h+'</div>'}
function highlightNav(cat){document.querySelectorAll('.nav-pill').forEach(function(a){a.classList.remove('active');if(!cat&&a.textContent.trim()==='Home')a.classList.add('active');else if(cat&&a.getAttribute('onclick').indexOf(cat)>-1)a.classList.add('active')})}

async function route(){var h=location.hash.slice(1)||'/';var c=document.getElementById('content');if(h.indexOf('/anime/')===0){await renderAnimePage(h.split('/anime/')[1])}else if(h.indexOf('/search/')===0){document.getElementById('searchInput').value=decodeURIComponent(h.split('/search/')[1]);await renderHomePage(1,'',decodeURIComponent(h.split('/search/')[1]))}else if(h.indexOf('/genre/')===0){await renderHomePage(1,h.split('/genre/')[1])}else{await renderHomePage(currentPage,currentCategory,currentSearch)}}

async function renderHomePage(page,cat,search){page=page||1;cat=cat||'';search=search||'';var c=document.getElementById('content');showSkeletons(c);currentPage=page;currentCategory=cat;currentSearch=search;highlightNav(cat);try{var url=API_BASE+'/api/anime/list?page='+page;if(search)url=API_BASE+'/api/anime/search?q='+encodeURIComponent(search);var r=await fetch(url);var data=await r.json();var items=data.results||[];if(!items.length){c.innerHTML='<div class="empty-state"><h3>No anime found</h3><p style="color:#555">Try a different search or category</p></div>';return}var h='<div class="grid">';for(var i=0;i<items.length;i++){var it=items[i];var thumb=it.image||'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%2316161a%22 width=%22200%22 height=%22300%22/></svg>';h+='<div class="card" onclick="openAnime(\''+escHtml(it.id)+'\')">';if(it.episodeNumber)h+='<span class="card-badge">EP '+it.episodeNumber+'</span>';h+='<div class="card-img-wrap"><img class="card-img" src="'+thumb+'" alt="" loading="lazy" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%2316161a%22 width=%22200%22 height=%22300%22/></svg>\'"></div><div class="card-body"><div class="card-title">'+escHtml(it.title)+'</div><div class="card-meta">'+(it.episodeNumber?'Episode '+it.episodeNumber:'')+'</div></div></div>'}h+='</div>';if(data.hasNextPage){h+='<div class="pagination">';if(page>1)h+='<button class="page-btn" onclick="renderHomePage('+(page-1)+')">Prev</button>';for(var j=Math.max(1,page-2);j<=Math.min(page+5,page+2);j++)h+='<button class="page-btn '+(j===page?'active':'')+'" onclick="renderHomePage('+j+')">'+j+'</button>';h+='<button class="page-btn" onclick="renderHomePage('+(page+1)+')">Next</button>';h+='</div>'}c.innerHTML=h}catch(e){c.innerHTML='<div class="empty-state"><h3>Failed to load</h3><p style="color:#555">'+escHtml(e.message)+'</p></div>'}}

async function renderAnimePage(id){var c=document.getElementById('content');showSkeletons(c,1);try{var r=await fetch(API_BASE+'/api/anime/details?id='+encodeURIComponent(id));var anime=await r.json();if(!anime||!anime.title){c.innerHTML='<div class="empty-state"><h3>Anime not found</h3></div>';return}var episodes=anime.episodes||[];var h='<div class="detail-page"><button class="back-btn" onclick="history.back()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg> Back</button>';h+='<div class="detail-title">'+escHtml(anime.title)+'</div>';if(anime.image)h+='<img src="'+anime.image+'" style="width:100%;max-width:280px;border-radius:14px;margin-bottom:20px;box-shadow:0 12px 32px rgba(0,0,0,.5)" alt="">';h+='<div class="player-wrap" id="playerWrap"><div class="player-loading"><div class="shimmer-text" data-text="Select an episode...">Select an episode...</div></div></div>';if(episodes.length>0){h+='<div class="episodes-grid">';for(var i=0;i<episodes.length;i++){var ep=episodes[i];h+='<button class="ep-btn" onclick="playEpisode(\''+escHtml(ep.id)+'\')">'+ep.number+'</button>'}h+='</div>'}if(anime.description)h+='<div class="detail-desc">'+escHtml(anime.description)+'</div>';h+='</div>';c.innerHTML=h;c.scrollIntoView({behavior:'smooth'})}catch(e){c.innerHTML='<div class="empty-state"><h3>Failed to load</h3><p style="color:#555">'+escHtml(e.message)+'</p></div>'}}

async function playEpisode(episodeId){var wrap=document.getElementById('playerWrap');if(!wrap)return;document.querySelectorAll('.ep-btn').forEach(function(b){b.classList.remove('active');if(b.textContent===episodeId.split('-').pop())b.classList.add('active')});wrap.innerHTML='<div class="player-loading"><div class="shimmer-text" data-text="Loading episode...">Loading episode...</div></div>';try{var r=await fetch(API_BASE+'/api/anime/stream?id='+encodeURIComponent(episodeId));var data=await r.json();var sources=data.sources||[];if(!sources.length){wrap.innerHTML='<div class="player-loading"><p style="color:#666">No streams available</p></div>';return}var stream=sources.find(function(s){return s.quality==='1080p'})||sources.find(function(s){return s.quality==='720p'})||sources[0];if(typeof Hls!=='undefined'&&Hls.isSupported()){var video=document.createElement('video');video.controls=true;video.autoplay=true;video.style.cssText='width:100%;height:100%';wrap.innerHTML='';wrap.appendChild(video);var hls=new Hls();hls.loadSource(stream.url);hls.attachMedia(video);hls.on(Hls.Events.MANIFEST_PARSED,function(){video.play().catch(function(){})})}else{var video=document.createElement('video');video.src=stream.url;video.controls=true;video.autoplay=true;video.style.cssText='width:100%;height:100%';wrap.innerHTML='';wrap.appendChild(video)}}catch(e){wrap.innerHTML='<div class="player-loading"><p style="color:#666">Stream failed. <a href="#" onclick="playEpisode(\''+escHtml(episodeId)+'\');return false" style="color:#ff6b00">Retry</a></p></div>'}}

function goHome(){currentCategory='';currentSearch='';currentPage=1;location.hash='#/'}
function loadCategory(c){currentCategory=c;currentSearch='';currentPage=1;location.hash='#/category/'+c}
function loadGenre(g){location.hash='#/genre/'+g}
function doSearch(){var q=document.getElementById('searchInput').value.trim();if(q){currentSearch=q;currentPage=1;location.hash='#/search/'+encodeURIComponent(q)}}
function openAnime(id){location.hash='#/anime/'+id}
window.addEventListener('hashchange',route);
window.addEventListener('DOMContentLoaded',route);
window.addEventListener('scroll',function(){document.getElementById('header').classList.toggle('scrolled',window.scrollY>10)});
</script>
</body>
</html>`;
}
