<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title><?= $page_title ?? $website_name ?> - Watch Anime Online Free</title>
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
.header{background:rgba(15,15,18,.85);backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid rgba(255,107,0,.08);padding:14px 24px;position:sticky;top:0;z-index:100}
.header.scrolled{box-shadow:0 4px 30px rgba(0,0,0,.5)}
.header-inner{max-width:1440px;margin:0 auto;display:flex;align-items:center;gap:20px}
.brand{display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none}
.brand-anime{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;background:linear-gradient(135deg,#ff6b00,#ff8c33);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.5px}
.brand-foryou{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.5px}
.search-box{flex:1;max-width:520px;margin:0 auto;position:relative}
.search-box input{width:100%;padding:14px 52px 14px 20px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#fff;font-size:15px;font-family:'Space Grotesk',sans-serif;outline:none;transition:all .3s}
.search-box input:focus{border-color:rgba(255,107,0,.5);background:rgba(255,255,255,.08);box-shadow:0 0 0 4px rgba(255,107,0,.1)}
.search-box input::placeholder{color:#555}
.search-btn{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:12px;border:none;background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .25s;box-shadow:0 4px 12px rgba(255,107,0,.3)}
.search-btn:hover{transform:translateY(-50%) scale(1.08)}
.nav{background:rgba(15,15,18,.6);border-bottom:1px solid rgba(255,255,255,.04);padding:10px 24px;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav-inner{max-width:1440px;margin:0 auto;display:flex;gap:10px}
.nav-pill{padding:9px 20px;border-radius:24px;background:rgba(255,255,255,.05);color:#888;text-decoration:none;font-size:13px;font-weight:600;font-family:'Space Grotesk',sans-serif;white-space:nowrap;transition:all .25s;border:1px solid transparent;letter-spacing:0.3px}
.nav-pill:hover{background:rgba(255,107,0,.12);color:#ff8c33;border-color:rgba(255,107,0,.18)}
.nav-pill.active{background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;border-color:transparent;box-shadow:0 4px 16px rgba(255,107,0,.35)}
.main{max-width:1440px;margin:0 auto;padding:28px 24px}
.section-title{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:10px;color:#fff;letter-spacing:-0.3px}
.section-title .accent{color:#ff6b00}
.section-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:40px}
.card{background:linear-gradient(145deg,rgba(25,25,30,.9),rgba(18,18,22,.95));border-radius:14px;overflow:hidden;cursor:pointer;transition:all .35s;border:1px solid rgba(255,255,255,.04);position:relative}
.card:hover{transform:translateY(-6px) scale(1.02);box-shadow:0 20px 50px rgba(255,107,0,.1),0 8px 20px rgba(0,0,0,.4)}
.card-img{width:100%;aspect-ratio:2/3;object-fit:cover;background:linear-gradient(135deg,#151518,#1a1a1f);transition:transform .5s,filter .5s}
.card:hover .card-img{transform:scale(1.06);filter:brightness(1.1)}
.card-img-wrap{overflow:hidden;position:relative}
.card-img-wrap::after{content:'';position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(to top,rgba(8,8,10,.95),transparent);pointer-events:none}
.card-body{padding:12px 14px 16px}
.card-title{font-size:13px;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#f0f0f0;font-family:'Space Grotesk',sans-serif;transition:color .2s}
.card:hover .card-title{color:#ff8c33}
.card-meta{font-size:11px;color:#666;margin-top:5px;font-family:'Space Grotesk',sans-serif}
.card-badge{position:absolute;top:10px;right:10px;padding:4px 10px;border-radius:8px;background:rgba(255,107,0,.9);color:#fff;font-size:10px;font-weight:700;font-family:'Space Grotesk',sans-serif;letter-spacing:0.5px;text-transform:uppercase;z-index:2;box-shadow:0 4px 12px rgba(0,0,0,.3)}
.card-score{position:absolute;top:10px;left:10px;padding:4px 10px;border-radius:8px;background:rgba(0,0,0,.7);color:#ffcc00;font-size:10px;font-weight:700;font-family:'Space Grotesk',sans-serif;z-index:2;backdrop-filter:blur(10px)}
.pagination{display:flex;justify-content:center;gap:10px;margin-top:32px;padding-bottom:40px}
.page-btn{padding:10px 20px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#888;cursor:pointer;font-size:13px;font-weight:600;font-family:'Space Grotesk',sans-serif;transition:all .25s;text-decoration:none;display:inline-block}
.page-btn:hover{background:rgba(255,107,0,.12);color:#ff8c33;border-color:rgba(255,107,0,.2)}
.page-btn.active{background:linear-gradient(135deg,#ff6b00,#e55500);color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(255,107,0,.3)}
.genre-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.genre-card{padding:16px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05);cursor:pointer;text-align:center;transition:all .25s;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;color:#aaa;text-decoration:none}
.genre-card:hover{background:rgba(255,107,0,.1);color:#ff8c33;border-color:rgba(255,107,0,.2);transform:translateY(-2px)}
.genre-card .count{display:block;font-size:11px;color:#555;margin-top:4px;font-weight:400}
.detail-page{max-width:1000px;margin:0 auto;animation:fadeUp .4s}
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
.genre-tag{padding:5px 14px;border-radius:20px;background:rgba(255,107,0,.1);color:#ff8c33;font-size:12px;font-weight:600;font-family:'Space Grotesk',sans-serif;border:1px solid rgba(255,107,0,.15);cursor:pointer;transition:all .2s;text-decoration:none}
.genre-tag:hover{background:rgba(255,107,0,.2);border-color:rgba(255,107,0,.3)}
.detail-desc{font-size:14px;color:#aaa;line-height:1.8}
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
</style>
</head>
<body>
<header class="header" id="header"><div class="header-inner">
<a href="/" class="brand"><span class="brand-anime">ANIME</span><span class="brand-foryou">FORYOU</span></a>
<div class="search-box">
<form action="/search" method="get" style="display:flex;width:100%">
<input type="text" name="q" placeholder="Search anime..." value="<?= htmlspecialchars($query ?? '') ?>">
<button type="submit" class="search-btn">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
</button>
</form>
</div></div></header>
<nav class="nav"><div class="nav-inner">
<a href="/" class="nav-pill <?= ($current_view ?? '') === 'home' ? 'active' : '' ?>">Home</a>
<a href="/popular" class="nav-pill <?= ($current_view ?? '') === 'popular' ? 'active' : '' ?>">Popular</a>
<a href="/genres" class="nav-pill <?= ($current_view ?? '') === 'genres' ? 'active' : '' ?>">Genres</a>
</div></nav>
<main class="main">
