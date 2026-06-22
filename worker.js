// Cloudflare Worker — Miruro Pipe Proxy
// Handles CORS + proxies encrypted requests to miruro.tv

export default {
  async fetch(request, env) {
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

    // Proxy pipe endpoint
    if (url.pathname === '/api/pipe') {
      try {
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

    // Serve pikahd SPA for all other routes
    const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PikaHD - Watch Anime Online Free</title>
<link rel="icon" href="https://pikahd.eu/wp-content/uploads/2020/07/cropped-plkd.png">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#0f0f0f;color:#e0e0e0;min-height:100vh}
.header{background:#1a1a1a;border-bottom:1px solid #2a2a2a;padding:12px 20px;position:sticky;top:0;z-index:100}
.header-inner{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:16px}
.logo{height:40px}
.search-box{flex:1;max-width:500px;margin:0 auto;display:flex;gap:8px}
.search-box input{flex:1;padding:10px 16px;border-radius:8px;border:1px solid #333;background:#222;color:#fff;font-size:14px;outline:none}
.search-box input:focus{border-color:#ff6b00}
.search-box button{padding:10px 20px;border-radius:8px;border:none;background:#ff6b00;color:#fff;font-weight:600;cursor:pointer}
.nav{background:#1a1a1a;border-bottom:1px solid #2a2a2a;padding:8px 20px}
.nav-inner{max-width:1400px;margin:0 auto;display:flex;gap:12px;overflow-x:auto}
.nav a{padding:6px 14px;border-radius:20px;background:#2a2a2a;color:#aaa;text-decoration:none;font-size:13px;white-space:nowrap;transition:all .2s}
.nav a:hover,.nav a.active{background:#ff6b00;color:#fff}
.main{max-width:1400px;margin:0 auto;padding:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.card{background:#1a1a1a;border-radius:12px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(255,107,0,.15)}
.card-img{width:100%;aspect-ratio:2/3;object-fit:cover}
.card-body{padding:12px}
.card-title{font-size:13px;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#fff}
.card-meta{font-size:11px;color:#888;margin-top:6px}
.loading{text-align:center;padding:60px 20px}
.spinner{width:40px;height:40px;border:3px solid #333;border-top-color:#ff6b00;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}
@keyframes spin{to{transform:rotate(360deg)}}
.pagination{display:flex;justify-content:center;gap:8px;margin-top:30px;padding-bottom:40px}
.page-btn{padding:8px 16px;border-radius:8px;border:1px solid #333;background:#1a1a1a;color:#aaa;cursor:pointer;font-size:14px}
.page-btn:hover,.page-btn.active{background:#ff6b00;color:#fff;border-color:#ff6b00}
.detail-page{max-width:1000px;margin:0 auto}
.player-wrap{background:#000;border-radius:12px;overflow:hidden;margin-bottom:24px;aspect-ratio:16/9;position:relative}
.player-wrap video,.player-wrap iframe{width:100%;height:100%;border:none}
.player-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#888}
.episodes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin-bottom:24px}
.ep-btn{padding:10px;border-radius:8px;border:1px solid #333;background:#1a1a1a;color:#aaa;cursor:pointer;font-size:13px;text-align:center;transition:all .2s}
.ep-btn:hover,.ep-btn.active{background:#ff6b00;color:#fff;border-color:#ff6b00}
.providers{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.provider-btn{padding:8px 16px;border-radius:8px;border:1px solid #333;background:#1a1a1a;color:#aaa;cursor:pointer;font-size:13px;transition:all .2s}
.provider-btn:hover{background:#333;color:#fff}
.provider-btn.active{background:#ff6b00;color:#fff;border-color:#ff6b00}
.back-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;background:#2a2a2a;color:#aaa;text-decoration:none;font-size:14px;margin-bottom:20px;cursor:pointer;border:none}
.back-btn:hover{background:#333;color:#fff}
.detail-title{font-size:24px;font-weight:700;color:#fff;margin-bottom:12px}
.detail-desc{font-size:14px;color:#ccc;line-height:1.6}
@media(max-width:768px){.grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}.search-box{max-width:100%}}
</style>
</head>
<body>
<header class="header"><div class="header-inner">
<a href="#" onclick="goHome()"><img class="logo" src="https://pikahd.co/wp-content/uploads/2019/08/cropped-icon_512x512-300x54.png" alt="PikaHD"></a>
<div class="search-box">
<input type="text" id="searchInput" placeholder="Search anime..." onkeydown="if(event.key==='Enter')doSearch()">
<button onclick="doSearch()">Search</button>
</div></div></header>
<nav class="nav"><div class="nav-inner">
<a href="#" class="active" onclick="goHome()">Home</a>
<a href="#" onclick="loadCategory('anime-hindi-dubbed')">Hindi Dubbed</a>
<a href="#" onclick="loadCategory('anime-eng-subbed')">Eng Subbed</a>
<a href="#" onclick="loadCategory('action')">Action</a>
<a href="#" onclick="loadCategory('romance')">Romance</a>
<a href="#" onclick="loadCategory('comedy')">Comedy</a>
<a href="#" onclick="loadCategory('fantasy')">Fantasy</a>
</div></nav>
<main class="main" id="content"><div class="loading" id="loader"><div class="spinner"></div><p>Loading anime...</p></div></main>
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"><\/script>
<script>
const API_BASE='https://get.kmhd.eu';
const MIRURO_PIPE='https://animeforyou.pg3142292.workers.dev/api/pipe';
let currentPage=1,currentCategory='',currentSearch='',currentProvider='kiwi';
function encodePipeRequest(p){const j=JSON.stringify(p),b=new TextEncoder().encode(j);let s='';for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function decodePipeResponse(e){let s=e.trim();while(s.length%4)s+='=';s=s.replace(/-/g,'+').replace(/_/g,'/');const bin=atob(s),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);const ds=new DecompressionStream('gzip'),w=ds.writable.getWriter();w.write(bytes);w.close();return new Response(ds.readable).arrayBuffer().then(b=>JSON.parse(new TextDecoder().decode(b)))}
function decodeEpisodeId(id){try{let s=id;while(s.length%4)s+='=';s=s.replace(/-/g,'+').replace(/_/g,'/');const d=atob(s);return d.includes(':')?d:id}catch{return id}}
function deepTranslateIds(o){if(!o)return;if(typeof o==='object'){for(const[k,v]of Object.entries(o)){if(k==='id'&&typeof v==='string')o[k]=decodeEpisodeId(v);else if(typeof v==='object')deepTranslateIds(v)}}else if(Array.isArray(o)){for(const i of o)deepTranslateIds(i)}}
async function miruroPipe(path,query){const payload={path,method:'GET',query,body:null,version:'0.1.0'};const enc=encodePipeRequest(payload);const res=await fetch(MIRURO_PIPE+'?e='+enc);if(!res.ok)throw new Error('Pipe failed');const txt=await res.text();return await decodePipeResponse(txt)}
async function miruroEpisodes(id){const d=await miruroPipe('episodes',{anilistId:id});deepTranslateIds(d);return d}
async function miruroSources(episodeId,provider,anilistId,cat='sub'){const enc=btoa(episodeId).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');return await miruroPipe('sources',{episodeId:enc,provider,category:cat,anilistId:parseInt(anilistId)})}
async function searchAnilist(q){const r=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query($s:String){Page(page:1,perPage:10){media(search:$s,type:ANIME,isAdult:false){id title{romaji english}coverImage{large}}}}',variables:{s:q}})});const j=await r.json();return j.data?.Page?.media||[]}
async function fetchPosts(page,cat,search){page=page||1;let url=API_BASE+'/wp-json/wp/v2/posts?per_page=12&page='+page;if(cat)url+='&search='+encodeURIComponent(cat);if(search)url+='&search='+encodeURIComponent(search);const r=await fetch(url);if(!r.ok)return{items:[],total:0};const posts=await r.json();return{items:posts.map(p=>({id:p.id,title:p.title?.rendered||'',slug:p.slug,thumbnail:p.featured_media_url||p.jetpack_featured_media_url||'',date:p.date})),total:parseInt(r.headers.get('X-WP-Total')||'0')}}
async function fetchPost(slug){const r=await fetch(API_BASE+'/wp-json/wp/v2/posts?slug='+slug);const posts=await r.json();return posts[0]||null}
function goHome(){currentCategory='';currentSearch='';currentPage=1;location.hash='#/'}
function loadCategory(c){currentCategory=c;currentSearch='';currentPage=1;location.hash='#/category/'+c}
function doSearch(){const q=document.getElementById('searchInput').value.trim();if(q){currentSearch=q;currentPage=1;location.hash='#/search/'+encodeURIComponent(q)}}
function openPost(s){location.hash='#/post/'+s}
function openWatch(id,ep){ep=ep||1;location.hash='#/watch/'+id+'?ep='+ep}
function escHtml(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
async function route(){const h=location.hash.slice(1)||'/';const c=document.getElementById('content');if(h.startsWith('/post/')){await renderPostPage(h.split('/post/')[1])}else if(h.startsWith('/watch/')){const p=h.split('/watch/')[1].split('?');const ep=new URLSearchParams(p[1]||'').get('ep')||1;await renderWatchPage(parseInt(p[0]),parseInt(ep))}else if(h.startsWith('/search/')){document.getElementById('searchInput').value=decodeURIComponent(h.split('/search/')[1]);await renderHomePage(1,'',decodeURIComponent(h.split('/search/')[1]))}else if(h.startsWith('/category/')){await renderHomePage(1,h.split('/category/')[1])}else{await renderHomePage(currentPage,currentCategory,currentSearch)}}
async function renderHomePage(page,cat,search){page=page||1;cat=cat||'';search=search||'';const c=document.getElementById('content');c.innerHTML='<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';currentPage=page;currentCategory=cat;currentSearch=search;try{const data=await fetchPosts(page,cat,search);const tp=Math.ceil(data.total/12);if(!data.items.length){c.innerHTML='<div class="loading"><p>No anime found</p></div>';return}let h='<div class="grid">';for(const i of data.items){h+='<div class="card" onclick="openPost(\''+i.slug+'\')"><img class="card-img" src="'+(i.thumbnail||'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%23222%22 width=%22200%22 height=%22300%22/></svg>')+'" alt="" loading="lazy"><div class="card-body"><div class="card-title">'+escHtml(i.title)+'</div><div class="card-meta">'+(i.date?new Date(i.date).toLocaleDateString():'')+'</div></div></div>'}h+='</div>';if(tp>1){h+='<div class="pagination">';if(page>1)h+='<button class="page-btn" onclick="renderHomePage('+(page-1)+')">Prev</button>';for(let i=Math.max(1,page-2);i<=Math.min(tp,page+2);i++)h+='<button class="page-btn '+(i===page?'active':'')+'" onclick="renderHomePage('+i+')">'+i+'</button>';if(page<tp)h+='<button class="page-btn" onclick="renderHomePage('+(page+1)+')">Next</button>';h+='</div>'}c.innerHTML=h}catch(e){c.innerHTML='<div class="loading"><p>Failed to load</p></div>'}}
async function renderPostPage(slug){const c=document.getElementById('content');c.innerHTML='<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';try{const post=await fetchPost(slug);if(!post){c.innerHTML='<div class="loading"><p>Post not found</p></div>';return}const title=post.title?.rendered||'';const body=post.content?.rendered||'';const iframeMatch=body.match(/<iframe[^>]*src="([^"]*)"/);const streamUrl=iframeMatch?iframeMatch[1]:null;let anilistId=null;try{const r=await searchAnilist(title.replace(/\\(.*?\\)/g,'').replace(/\\[.*?\\]/g,'').trim());if(r.length>0)anilistId=r[0].id}catch(e){}let h='<div class="detail-page"><button class="back-btn" onclick="history.back()">Back</button>';if(streamUrl){h+='<div class="player-wrap"><iframe src="'+streamUrl+'" allowfullscreen></iframe></div>'}else if(anilistId){h+='<div style="margin-bottom:16px"><button class="back-btn" onclick="openWatch('+anilistId+')" style="background:#ff6b00;color:#fff">Watch Episode 1</button></div>'}h+='<div class="detail-title">'+escHtml(title)+'</div><div class="detail-desc">'+body+'</div></div>';c.innerHTML=h;c.scrollIntoView({behavior:'smooth'})}catch(e){c.innerHTML='<div class="loading"><p>Failed to load post</p></div>'}}
async function renderWatchPage(anilistId,ep){ep=ep||1;const c=document.getElementById('content');c.innerHTML='<div class="loading"><div class="spinner"></div><p>Loading stream...</p></div>';try{const ir=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query($id:Int){Media(id:$id,type:ANIME){id title{romaji english}coverImage{large}description episodes format status averageScore genres}}',variables:{id:anilistId}})});const idata=await ir.json();const anime=idata.data?.Media;if(!anime){c.innerHTML='<div class="loading"><p>Anime not found</p></div>';return}const epsData=await miruroEpisodes(anilistId);const providers=epsData?.providers||{};const pl=[];for(const[nm,pv]of Object.entries(providers)){if((pv?.episodes?.sub||[]).length>0)pl.push(nm)}if(!pl.length){c.innerHTML='<div class="loading"><p>No streaming sources available</p></div>';return}if(!pl.includes(currentProvider))currentProvider=pl.includes('kiwi')?'kiwi':pl[0];const currentEps=providers[currentProvider]?.episodes?.sub||[];const maxEp=currentEps.length;let h='<div class="detail-page"><button class="back-btn" onclick="location.hash=\\'#/\\'">Home</button>';h+='<h1 style="font-size:22px;color:#fff;margin-bottom:16px">'+escHtml(anime.title?.english||anime.title?.romaji)+'</h1>';h+='<div class="player-wrap" id="playerWrap"><div class="player-loading"><div class="spinner"></div><p>Loading episode '+ep+'...</p></div></div>';h+='<div class="providers">';for(const pn of pl)h+='<button class="provider-btn '+(pn===currentProvider?'active':'')+'" onclick="switchProvider(\\''+pn+'\\','+anilistId+','+ep+')">'+pn+'</button>';h+='</div><div class="episodes-grid">';for(let i=1;i<=maxEp;i++)h+='<button class="ep-btn '+(i===ep?'active':'')+'" onclick="playEpisode('+anilistId+','+i+')">'+i+'</button>';h+='</div>';const desc=(anime.description||'').replace(/<[^>]+>/g,'').slice(0,300);h+='<div style="margin-top:24px;padding:20px;background:#1a1a1a;border-radius:12px;display:flex;gap:20px;flex-wrap:wrap"><img src="'+(anime.coverImage?.large||'')+'" style="width:120px;border-radius:8px"><div><div style="font-size:13px;color:#888">'+(anime.format||'')+' · '+(anime.status||'')+' · '+(anime.episodes||'?')+' episodes</div><div style="font-size:13px;color:#888;margin-top:4px">Score: '+(anime.averageScore||'N/A')+'/100</div><div style="font-size:13px;color:#888;margin-top:4px">'+(anime.genres||[]).join(', ')+'</div></div></div>';h+='<div style="margin-top:16px;padding:20px;background:#1a1a1a;border-radius:12px"><div style="font-size:14px;color:#ccc;line-height:1.6">'+desc+'...</div></div></div>';c.innerHTML=h;playEpisode(anilistId,ep)}catch(e){c.innerHTML='<div class="loading"><p>Failed to load: '+e.message+'</p></div>'}}
async function playEpisode(anilistId,ep){currentProvider=document.querySelector('.provider-btn.active')?.textContent||currentProvider;const wrap=document.getElementById('playerWrap');if(!wrap)return;currentEpisode=ep;document.querySelectorAll('.ep-btn').forEach(function(b,i){b.classList.toggle('active',i+1===ep)});wrap.innerHTML='<div class="player-loading"><div class="spinner"></div><p>Loading episode '+ep+'...</p></div>';try{const epsData=await miruroEpisodes(anilistId);const providers=epsData?.providers||{};const prov=providers[currentProvider];const subs=prov?.episodes?.sub||[];const epData=subs.find(function(e){return e.number===ep});if(!epData){wrap.innerHTML='<div class="player-loading"><p>Episode not found on '+currentProvider+'</p></div>';return}const sources=await miruroSources(epData.id,currentProvider,anilistId);const streams=sources?.streams||[];if(!streams.length){wrap.innerHTML='<div class="player-loading"><p>No streams available</p></div>';return}const stream=streams.find(function(s){return s.quality==='1080p'})||streams.find(function(s){return s.quality==='720p'})||streams[0];if(typeof Hls!=='undefined'&&Hls.isSupported()){const video=document.createElement('video');video.controls=true;video.autoplay=true;video.style.cssText='width:100%;height:100%';wrap.innerHTML='';wrap.appendChild(video);const hls=new Hls();hls.loadSource(stream.url);hls.attachMedia(video);hls.on(Hls.Events.MANIFEST_PARSED,function(){video.play().catch(function(){})})}else{const video=document.createElement('video');video.src=stream.url;video.controls=true;video.autoplay=true;video.style.cssText='width:100%;height:100%';wrap.innerHTML='';wrap.appendChild(video)}}catch(e){wrap.innerHTML='<div class="player-loading"><p>Stream failed. <a href="#" onclick="playEpisode('+anilistId+','+ep+');return false" style="color:#ff6b00">Retry</a></p></div>'}}
function switchProvider(p,aid,ep){currentProvider=p;document.querySelectorAll('.provider-btn').forEach(function(b){b.classList.toggle('active',b.textContent===p)});playEpisode(aid,ep)}
window.addEventListener('hashchange',route);
window.addEventListener('DOMContentLoaded',route);
<\\/script>
</body>
</html>`;

    return new Response(HTML, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  },
};
