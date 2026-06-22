// Cloudflare Worker — ANIMEFORYOU v2
// Jikan API (MAL metadata) + pikahd.co playLinks for streaming

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const JIKAN = 'https://api.jikan.moe/v4';
  const SCRAPED_JSON = 'https://goku863.github.io/ANIMESFORYOU/anime-data.json';

  if (url.pathname === '/api/search') {
    const q = url.searchParams.get('q') || '';
    const page = url.searchParams.get('page') || '1';
    const r = await fetch(`${JIKAN}/anime?q=${encodeURIComponent(q)}&page=${page}&limit=20`);
    const d = await r.json();
    return jsonResponse(d);
  }

  if (url.pathname === '/api/seasons/now') {
    const page = url.searchParams.get('page') || '1';
    const r = await fetch(`${JIKAN}/seasons/now?page=${page}&limit=20`);
    const d = await r.json();
    return jsonResponse(d);
  }

  if (url.pathname === '/api/top') {
    const page = url.searchParams.get('page') || '1';
    const filter = url.searchParams.get('filter') || 'bypopularity';
    const r = await fetch(`${JIKAN}/top/anime?page=${page}&filter=${filter}&limit=20`);
    const d = await r.json();
    return jsonResponse(d);
  }

  if (url.pathname === '/api/genres') {
    const r = await fetch(`${JIKAN}/genres/anime`);
    const d = await r.json();
    return jsonResponse(d);
  }

  if (url.pathname === '/api/anime') {
    const id = url.searchParams.get('id');
    const r = await fetch(`${JIKAN}/anime/${id}/full`);
    const d = await r.json();
    return jsonResponse(d);
  }

  if (url.pathname === '/api/episodes') {
    const id = url.searchParams.get('id');
    const page = url.searchParams.get('page') || '1';
    const r = await fetch(`${JIKAN}/anime/${id}/episodes?page=${page}`);
    const d = await r.json();
    return jsonResponse(d);
  }

  if (url.pathname === '/api/genre-anime') {
    const genreId = url.searchParams.get('genre_id') || '1';
    const page = url.searchParams.get('page') || '1';
    const sort = url.searchParams.get('sort') || 'score';
    const r = await fetch(`${JIKAN}/anime?genres=${genreId}&page=${page}&limit=20&order_by=${sort}&sort=desc`);
    const d = await r.json();
    return jsonResponse(d);
  }

  if (url.pathname === '/api/play') {
    const title = url.searchParams.get('title') || '';
    const r = await fetch(SCRAPED_JSON);
    const data = await r.json();
    const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    let match = data.find(d => {
      const t = (d.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return t.includes(normalized) || normalized.includes(t);
    });
    if (!match) {
      const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      match = data.find(d => {
        const t = (d.title || '').toLowerCase();
        return words.length > 0 && words.filter(w => t.includes(w)).length >= Math.ceil(words.length * 0.5);
      });
    }
    if (match && match.playLink) {
      return jsonResponse({ found: true, playLink: match.playLink, title: match.title, thumbnail: match.thumbnail });
    }
    return jsonResponse({ found: false });
  }

  const html = generateHTML();
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 's-maxage=300' },
  });
}

function generateHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>ANIMEFORYOU - Watch Anime Online Free</title>
<link rel="icon" href="https://pikahd.co/wp-content/uploads/2020/07/cropped-plkd.png">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#08080a;color:#e0e0e0;min-height:100vh;overflow-x:hidden}
a{color:#ff6b00;text-decoration:none;transition:color .2s}
a:hover{color:#ff8c33}

::-webkit-scrollbar{width:8px}
::-webkit-scrollbar-track{background:#111}
::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:#555}

.header{background:rgba(15,15,18,.85);backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid rgba(255,107,0,.08);padding:14px 24px;position:sticky;top:0;z-index:100;transition:box-shadow .3s}
.header.scrolled{box-shadow:0 4px 30px rgba(0,0,0,.5)}
.header-inner{max-width:1440px;margin:0 auto;display:flex;align-items:center;gap:20px}
.brand{display:flex;align-items:center;gap:10px;cursor:pointer}
.brand-anime{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;background:linear-gradient(135deg,#ff6b00,#ff8c33);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.5px}
.brand-foryou{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.5px}
.search-box{flex:1;max-width:520px;margin:0 auto;position:relative}
.search-box input{width:100%;padding:14px 52px 14px 20px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#fff;font-size:15px;font-family:'Space Grotesk',sans-serif;outline:none;transition:all .3s cubic-bezier(0.22,1,0.36,1)}
.search-box input:focus{border-color:rgba(255,107,0,.5);background:rgba(255,255,255,.08);box-shadow:0 0 0 4px rgba(255,107,0,.1)}
.search-box input::placeholder{color:#555}
.search-btn{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:12px;border:none;background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .25s;box-shadow:0 4px 12px rgba(255,107,0,.3)}
.search-btn:hover{transform:translateY(-50%) scale(1.08)}

.nav{background:rgba(15,15,18,.6);border-bottom:1px solid rgba(255,255,255,.04);padding:10px 24px;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav-inner{max-width:1440px;margin:0 auto;display:flex;gap:10px}
.nav-pill{padding:9px 20px;border-radius:24px;background:rgba(255,255,255,.05);color:#888;text-decoration:none;font-size:13px;font-weight:600;font-family:'Space Grotesk',sans-serif;white-space:nowrap;transition:all .25s;border:1px solid transparent;letter-spacing:0.3px;cursor:pointer}
.nav-pill:hover{background:rgba(255,107,0,.12);color:#ff8c33;border-color:rgba(255,107,0,.18)}
.nav-pill.active{background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;border-color:transparent;box-shadow:0 4px 16px rgba(255,107,0,.35)}

.main{max-width:1440px;margin:0 auto;padding:28px 24px}
.section-title{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:10px;color:#fff;letter-spacing:-0.3px}
.section-title .accent{color:#ff6b00}
.section-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:40px}

.shimmer-text{position:relative;display:inline-block;color:#555;font-family:'Space Grotesk',sans-serif;font-weight:600}
.shimmer-text::before{content:attr(data-text);position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(90deg,transparent 0%,transparent 40%,#ff6b00 50%,transparent 60%,transparent 100%);background-size:400% 100%;background-repeat:no-repeat;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:t-shimmer 2000ms linear infinite}
@keyframes t-shimmer{0%{background-position:100% 0}100%{background-position:0% 0}}

.card{background:linear-gradient(145deg,rgba(25,25,30,.9),rgba(18,18,22,.95));border-radius:14px;overflow:hidden;cursor:pointer;transition:all .35s cubic-bezier(0.22,1,0.36,1);border:1px solid rgba(255,255,255,.04);position:relative}
.card:hover{transform:translateY(-6px) scale(1.02);box-shadow:0 20px 50px rgba(255,107,0,.1),0 8px 20px rgba(0,0,0,.4)}
.card-img{width:100%;aspect-ratio:2/3;object-fit:cover;background:linear-gradient(135deg,#151518,#1a1a1f);transition:transform .5s,filter .5s}
.card:hover .card-img{transform:scale(1.06);filter:brightness(1.1)}
.card-img-wrap{overflow:hidden;position:relative}
.card-img-wrap::after{content:'';position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(to top,rgba(8,8,10,.95),transparent);pointer-events:none}
.card-body{padding:12px 14px 16px}
.card-title{font-size:13px;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#f0f0f0;font-family:'Space Grotesk',sans-serif;transition:color .2s}
.card:hover .card-title{color:#ff8c33}
.card-meta{font-size:11px;color:#666;margin-top:5px;font-family:'Space Grotesk',sans-serif;display:flex;align-items:center;gap:6px}
.card-badge{position:absolute;top:10px;right:10px;padding:4px 10px;border-radius:8px;background:rgba(255,107,0,.9);color:#fff;font-size:10px;font-weight:700;font-family:'Space Grotesk',sans-serif;letter-spacing:0.5px;text-transform:uppercase;z-index:2;box-shadow:0 4px 12px rgba(0,0,0,.3)}
.card-score{position:absolute;top:10px;left:10px;padding:4px 10px;border-radius:8px;background:rgba(0,0,0,.7);color:#ffcc00;font-size:10px;font-weight:700;font-family:'Space Grotesk',sans-serif;z-index:2;backdrop-filter:blur(10px);display:flex;align-items:center;gap:4px}

.skel-card{background:rgba(25,25,30,.6);border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.03)}
.skel-img{width:100%;aspect-ratio:2/3;background:linear-gradient(135deg,#18181c,#1e1e24);animation:skel-pulse 1200ms ease-in-out infinite}
.skel-body{padding:12px 14px 16px}
.skel-line{height:12px;border-radius:8px;background:linear-gradient(135deg,#1a1a1f,#222228);animation:skel-pulse 1200ms ease-in-out infinite;margin-bottom:8px}
.skel-line:last-child{width:60%;margin-bottom:0}
@keyframes skel-pulse{0%,100%{opacity:1}50%{opacity:.4}}

.pagination{display:flex;justify-content:center;gap:10px;margin-top:32px;padding-bottom:40px}
.page-btn{padding:10px 20px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#888;cursor:pointer;font-size:13px;font-weight:600;font-family:'Space Grotesk',sans-serif;transition:all .25s}
.page-btn:hover{background:rgba(255,107,0,.12);color:#ff8c33;border-color:rgba(255,107,0,.2)}
.page-btn.active{background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(255,107,0,.3)}

.detail-page{max-width:1000px;margin:0 auto;animation:fadeUp .4s cubic-bezier(0.22,1,0.36,1)}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.player-wrap{background:#000;border-radius:16px;overflow:hidden;margin-bottom:28px;aspect-ratio:16/9;position:relative;border:1px solid rgba(255,255,255,.05)}
.player-wrap iframe,.player-wrap video{width:100%;height:100%;border:none}
.player-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#666;gap:16px;font-family:'Space Grotesk',sans-serif}
.back-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:12px;background:rgba(255,255,255,.06);color:#888;text-decoration:none;font-size:14px;font-weight:600;font-family:'Space Grotesk',sans-serif;margin-bottom:24px;cursor:pointer;border:1px solid rgba(255,255,255,.08);transition:all .25s}
.back-btn:hover{background:rgba(255,255,255,.1);color:#fff}
.detail-header{display:flex;gap:28px;margin-bottom:28px;flex-wrap:wrap}
.detail-poster{width:200px;min-width:200px;border-radius:14px;object-fit:cover;box-shadow:0 12px 32px rgba(0,0,0,.5)}
.detail-info{flex:1;min-width:280px}
.detail-title{font-size:28px;font-weight:800;color:#fff;margin-bottom:12px;line-height:1.2;background:linear-gradient(135deg,#fff,#ccc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-family:'Space Grotesk',sans-serif;letter-spacing:-0.5px}
.detail-meta{font-size:14px;color:#888;line-height:2;font-family:'Space Grotesk',sans-serif;margin-bottom:14px}
.detail-meta span{color:#ccc;font-weight:600}
.detail-genres{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.genre-tag{padding:5px 14px;border-radius:20px;background:rgba(255,107,0,.1);color:#ff8c33;font-size:12px;font-weight:600;font-family:'Space Grotesk',sans-serif;border:1px solid rgba(255,107,0,.15);cursor:pointer;transition:all .2s}
.genre-tag:hover{background:rgba(255,107,0,.2);border-color:rgba(255,107,0,.3)}
.detail-desc{font-size:14px;color:#aaa;line-height:1.8}

.episodes-section{margin-top:28px}
.episodes-section h3{font-size:17px;font-weight:700;color:#ff6b00;margin-bottom:14px;font-family:'Space Grotesk',sans-serif}
.episodes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(65px,1fr));gap:8px}
.ep-btn{padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#888;cursor:pointer;font-size:13px;font-weight:600;font-family:'Space Grotesk',sans-serif;text-align:center;transition:all .25s}
.ep-btn:hover{background:rgba(255,107,0,.12);color:#ff8c33;border-color:rgba(255,107,0,.2)}
.ep-btn.active{background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(255,107,0,.3)}

.genre-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.genre-card{padding:16px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05);cursor:pointer;text-align:center;transition:all .25s;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;color:#aaa}
.genre-card:hover{background:rgba(255,107,0,.1);color:#ff8c33;border-color:rgba(255,107,0,.2);transform:translateY(-2px)}
.genre-card .count{display:block;font-size:11px;color:#555;margin-top:4px;font-weight:400}

.empty-state{text-align:center;padding:80px 20px}
.empty-state h3{font-size:22px;color:#444;margin-bottom:8px;font-family:'Space Grotesk',sans-serif;font-weight:700}

.footer{background:rgba(15,15,18,.8);border-top:1px solid rgba(255,255,255,.04);padding:30px 24px;margin-top:40px;text-align:center}
.footer-text{font-size:13px;color:#555;font-family:'Space Grotesk',sans-serif}
.footer-links{display:flex;justify-content:center;gap:20px;margin-top:10px}
.footer-links a{font-size:12px;color:#666;font-family:'Space Grotesk',sans-serif}

@media(max-width:768px){
  .section-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}
  .header-inner{gap:10px}
  .search-box input{padding:12px 48px 12px 16px;font-size:14px}
  .detail-header{flex-direction:column;align-items:center;text-align:center}
  .detail-poster{width:160px;min-width:160px}
  .detail-title{font-size:22px}
  .detail-genres{justify-content:center}
  .main{padding:20px 14px}
  .genre-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}
}
@media(prefers-reduced-motion:reduce){
  .card,.nav-pill,.page-btn,.genre-tag,.genre-card,.ep-btn,.back-btn{transition:none !important}
  .card:hover{transform:none}
  .shimmer-text::before{animation:none !important}
  .skel-img,.skel-line{animation:none !important}
  @keyframes fadeUp{from{opacity:1;transform:none}to{opacity:1;transform:none}}
}
</style>
</head>
<body>
<header class="header" id="header"><div class="header-inner">
<div class="brand" onclick="goHome()"><span class="brand-anime">ANIME</span><span class="brand-foryou">FORYOU</span></div>
<div class="search-box">
<input type="text" id="searchInput" placeholder="Search anime..." onkeydown="if(event.key==='Enter')doSearch()">
<button class="search-btn" onclick="doSearch()">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
</button>
</div></div></header>
<nav class="nav"><div class="nav-inner">
<span class="nav-pill active" data-view="home" onclick="goHome()">Home</span>
<span class="nav-pill" data-view="season" onclick="goSeason()">Airing Now</span>
<span class="nav-pill" data-view="popular" onclick="goPopular()">Popular</span>
<span class="nav-pill" data-view="genres" onclick="goGenres()">Genres</span>
</div></nav>
<main class="main" id="content">
<div style="text-align:center;padding:60px 20px">
  <div class="shimmer-text" data-text="Loading anime...">Loading anime...</div>
</div>
</main>
<footer class="footer"><div class="footer-text">ANIMEFORYOU - Watch Anime Online Free</div><div class="footer-links"><a href="#" onclick="goHome();return false">Home</a><a href="#" onclick="goSeason();return false">Airing</a><a href="#" onclick="goPopular();return false">Popular</a><a href="#" onclick="goGenres();return false">Genres</a></div></footer>

<script>
var API='';
var state={view:'home',page:1,query:'',genreId:null,genreName:''};

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function $(id){return document.getElementById(id)}
function skeletons(c,n){var h='';for(var i=0;i<(n||12);i++)h+='<div class="skel-card"><div class="skel-img"></div><div class="skel-body"><div class="skel-line"></div><div class="skel-line"></div></div></div>';c.innerHTML='<div class="section-grid">'+h+'</div>'}
function setActive(view){document.querySelectorAll('.nav-pill').forEach(function(p){p.classList.toggle('active',p.dataset.view===view)})}

function cardHTML(item,badge,score){
  var img=item.images?item.images.jpg.large_image_url||item.images.jpg.image_url:'';
  var title=item.title_english||item.title||'';
  var meta=[];
  if(item.type)meta.push(item.type);
  if(item.episodes)meta.push(item.episodes+' ep');
  if(item.aired&&item.aired.string)meta.push(item.aired.string.split('to')[0].trim());
  var h='<div class="card" onclick="openAnime('+item.mal_id+')">';
  if(score!==false&&item.score)h+='<span class="card-score">&#9733; '+item.score+'</span>';
  if(badge)h+='<span class="card-badge">'+esc(badge)+'</span>';
  h+='<div class="card-img-wrap"><img class="card-img" src="'+esc(img)+'" alt="" loading="lazy" onerror="this.style.background=\'linear-gradient(135deg,#151518,#1a1a1f)\';this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%2316161a%22 width=%22200%22 height=%22300%22/></svg>\'"></div>';
  h+='<div class="card-body"><div class="card-title">'+esc(title)+'</div><div class="card-meta">'+meta.join(' &middot; ')+'</div></div></div>';
  return h;
}

async function api(path){
  var r=await fetch(API+path);
  return await r.json();
}

async function renderHome(){
  state.view='home';state.page=1;state.query='';state.genreId=null;
  setActive('home');
  var c=$('content');skeletons(c);
  try{
    var data=await api('/api/seasons/now?page='+state.page);
    var items=data.data||[];
    var h='<div class="section-title"><span class="accent">&#9654;</span> Currently Airing</div><div class="section-grid">';
    for(var i=0;i<items.length;i++)h+=cardHTML(items[i],'Airing');
    h+='</div>';
    h+=paginationHTML(data.pagination,'renderSeasonPage');
    c.innerHTML=h;
  }catch(e){c.innerHTML='<div class="empty-state"><h3>Failed to load</h3><p style="color:#555">'+esc(e.message)+'</p></div>'}
}

async function renderSeasonPage(page){
  state.view='season';state.page=page;
  setActive('season');
  var c=$('content');skeletons(c);
  try{
    var data=await api('/api/seasons/now?page='+page);
    var items=data.data||[];
    var h='<div class="section-title"><span class="accent">&#9654;</span> Currently Airing</div><div class="section-grid">';
    for(var i=0;i<items.length;i++)h+=cardHTML(items[i],'Airing');
    h+='</div>'+paginationHTML(data.pagination,'renderSeasonPage');
    c.innerHTML=h;c.scrollIntoView({behavior:'smooth'});
  }catch(e){c.innerHTML='<div class="empty-state"><h3>Failed to load</h3></div>'}
}

async function renderPopularPage(page){
  state.view='popular';state.page=page;
  setActive('popular');
  var c=$('content');skeletons(c);
  try{
    var data=await api('/api/top?page='+page+'&filter=bypopularity');
    var items=data.data||[];
    var h='<div class="section-title"><span class="accent">&#9733;</span> Most Popular</div><div class="section-grid">';
    for(var i=0;i<items.length;i++)h+=cardHTML(items[i]);
    h+='</div>'+paginationHTML(data.pagination,'renderPopularPage');
    c.innerHTML=h;c.scrollIntoView({behavior:'smooth'});
  }catch(e){c.innerHTML='<div class="empty-state"><h3>Failed to load</h3></div>'}
}

async function renderSearch(query,page){
  state.view='search';state.page=page;state.query=query;
  var c=$('content');skeletons(c);
  try{
    var data=await api('/api/search?q='+encodeURIComponent(query)+'&page='+page);
    var items=data.data||[];
    var h='<div class="section-title"><span class="accent">&#128269;</span> Results for "'+esc(query)+'"</div>';
    if(!items.length){h+='<div class="empty-state"><h3>No results found</h3><p style="color:#555">Try a different search</p></div>'}
    else{h+='<div class="section-grid">';for(var i=0;i<items.length;i++)h+=cardHTML(items[i]);h+='</div>'+paginationHTML(data.pagination,'renderSearchPage');}
    c.innerHTML=h;
  }catch(e){c.innerHTML='<div class="empty-state"><h3>Search failed</h3></div>'}
}

function renderSearchPage(page){renderSearch(state.query,page)}

async function renderGenres(){
  state.view='genres';
  setActive('genres');
  var c=$('content');skeletons(c,6);
  try{
    var data=await api('/api/genres');
    var items=data.data||[];
    var h='<div class="section-title"><span class="accent">&#127912;</span> Browse by Genre</div><div class="genre-grid">';
    for(var i=0;i<items.length;i++){
      var g=items[i];
      h+='<div class="genre-card" onclick="openGenre('+g.mal_id+',\\''+esc(g.name).replace(/'/g,"\\\\'")+'\\')">'+esc(g.name)+'<span class="count">'+g.count+' anime</span></div>';
    }
    h+='</div>';
    c.innerHTML=h;
  }catch(e){c.innerHTML='<div class="empty-state"><h3>Failed to load genres</h3></div>'}
}

async function renderGenrePage(genreId,genreName,page){
  state.view='genre';state.page=page;state.genreId=genreId;state.genreName=genreName;
  var c=$('content');skeletons(c);
  try{
    var data=await api('/api/genre-anime?genre_id='+genreId+'&page='+page);
    var items=data.data||[];
    var h='<div class="section-title"><span class="accent">&#127912;</span> '+esc(genreName)+'</div><div class="section-grid">';
    for(var i=0;i<items.length;i++)h+=cardHTML(items[i]);
    h+='</div>'+paginationHTML(data.pagination,'renderGenrePageNav');
    c.innerHTML=h;c.scrollIntoView({behavior:'smooth'});
  }catch(e){c.innerHTML='<div class="empty-state"><h3>Failed to load</h3></div>'}
}

function renderGenrePageNav(page){renderGenrePage(state.genreId,state.genreName,page)}

async function renderAnimePage(id){
  state.view='anime';
  var c=$('content');skeletons(c,2);
  try{
    var data=await api('/api/anime?id='+id);
    var anime=data.data;
    if(!anime||!anime.mal_id){c.innerHTML='<div class="empty-state"><h3>Anime not found</h3></div>';return}
    var playInfo=null;
    try{playInfo=await api('/api/play?title='+encodeURIComponent(anime.title_english||anime.title))}catch(e){}
    var genres=anime.genres||[];
    var h='<div class="detail-page"><button class="back-btn" onclick="history.back()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg> Back</button>';
    h+='<div class="detail-header">';
    h+='<img class="detail-poster" src="'+esc(anime.images.jpg.large_image_url)+'" alt="">';
    h+='<div class="detail-info">';
    h+='<div class="detail-title">'+esc(anime.title_english||anime.title)+'</div>';
    if(anime.title_english&&anime.title!==anime.title_english)h+='<div style="font-size:13px;color:#666;margin-bottom:8px;font-family:Space Grotesk,sans-serif">'+esc(anime.title)+'</div>';
    h+='<div class="detail-genres">';
    for(var i=0;i<genres.length;i++)h+='<span class="genre-tag" onclick="openGenre('+genres[i].mal_id+',\\''+esc(genres[i].name).replace(/'/g,"\\\\'")+'\\')">'+esc(genres[i].name)+'</span>';
    h+='</div>';
    var meta=[];
    if(anime.type)meta.push('<span>'+esc(anime.type)+'</span>');
    if(anime.episodes)meta.push('<span>'+anime.episodes+' episodes</span>');
    if(anime.status)meta.push(esc(anime.status));
    if(anime.aired&&anime.aired.string)meta.push(esc(anime.aired.string.split('to')[0].trim()));
    h+='<div class="detail-meta">'+meta.join(' &middot; ')+'</div>';
    if(anime.score)h+='<div class="detail-meta">Score: <span style="color:#ffcc00">&#9733; '+anime.score+'</span>'+(anime.scored_by?' ('+anime.scored_by.toLocaleString()+' votes)':'')+'</div>';
    h+='</div></div>';

    if(playInfo&&playInfo.found){
      h+='<div class="player-wrap" id="playerWrap"><iframe src="'+esc(playInfo.playLink)+'" allowfullscreen style="width:100%;height:100%;border:none"></iframe></div>';
    }else{
      h+='<div class="player-wrap"><div class="player-loading"><div style="font-size:16px;color:#888">No stream available</div><div style="font-size:13px;color:#555">Anime not in streaming database</div></div></div>';
    }

    if(anime.synopsis)h+='<div class="detail-desc">'+esc(anime.synopsis)+'</div>';
    h+='</div>';
    c.innerHTML=h;c.scrollIntoView({behavior:'smooth'});
  }catch(e){c.innerHTML='<div class="empty-state"><h3>Failed to load</h3><p style="color:#555">'+esc(e.message)+'</p></div>'}
}

function paginationHTML(pag,fn){
  if(!pag||!pag.has_next_page)return '';
  var cur=pag.current_page||1;
  var h='<div class="pagination">';
  if(cur>1)h+='<button class="page-btn" onclick="'+fn+'('+(cur-1)+')">&#8592; Prev</button>';
  for(var i=Math.max(1,cur-2);i<=Math.min(cur+4,cur+2);i++){
    h+='<button class="page-btn '+(i===cur?'active':'')+'" onclick="'+fn+'('+i+')">'+i+'</button>';
  }
  h+='<button class="page-btn" onclick="'+fn+'('+(cur+1)+')">Next &#8594;</button></div>';
  return h;
}

function goHome(){renderHome()}
function goSeason(){renderSeasonPage(1)}
function goPopular(){renderPopularPage(1)}
function goGenres(){renderGenres()}
function openGenre(id,name){renderGenrePage(id,name,1)}
function openAnime(id){location.hash='#/anime/'+id;renderAnimePage(id)}
function doSearch(){var q=$('searchInput').value.trim();if(q)renderSearch(q,1)}
function goSearch(q){$('searchInput').value=q;renderSearch(q,1)}

function route(){
  var h=location.hash.slice(1)||'/';
  if(h.indexOf('/anime/')===0){renderAnimePage(h.split('/anime/')[1])}
  else{renderHome()}
}
window.addEventListener('hashchange',route);
window.addEventListener('DOMContentLoaded',function(){renderHome();route()});
window.addEventListener('scroll',function(){$('header').classList.toggle('scrolled',window.scrollY>10)});
</script>
</body>
</html>`;
}
