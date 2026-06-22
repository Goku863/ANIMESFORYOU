<?php
require_once __DIR__ . '/../includes/helpers.php';
$current_view = 'anime';
require_once __DIR__ . '/../includes/header.php';

if (!$id): ?>
<div class="empty-state"><h3>Anime not found</h3></div>
<?php require_once __DIR__ . '/../includes/footer.php'; exit; endif;

$data = jikan_fetch('/anime/' . $id . '/full');
$anime = $data['data'] ?? null;

if (empty($anime) || empty($anime['mal_id'])): ?>
<div class="empty-state"><h3>Anime not found</h3></div>
<?php require_once __DIR__ . '/../includes/footer.php'; exit; endif;

$page_title = ($anime['title_english'] ?: $anime['title']) . ' - ' . $website_name;

// Try to find play link
$play_link = null;
$play_title = $anime['title_english'] ?: $anime['title'];
$play_data = @json_decode(@file_get_contents($worker_url . '/api/play?title=' . urlencode($play_title)), true);
if ($play_data && !empty($play_data['found'])) {
    $play_link = $play_data['playLink'];
}

$genres = $anime['genres'] ?? [];
$img = $anime['images']['jpg']['large_image_url'] ?? ($anime['images']['jpg']['image_url'] ?? '');
$title = $anime['title_english'] ?: $anime['title'];
$meta = [];
if (!empty($anime['type'])) $meta[] = '<span>' . esc($anime['type']) . '</span>';
if (!empty($anime['episodes'])) $meta[] = '<span>' . $anime['episodes'] . ' episodes</span>';
if (!empty($anime['status'])) $meta[] = esc($anime['status']);
if (!empty($anime['aired']['string'])) $meta[] = esc(explode('to', $anime['aired']['string'])[0]);
$meta_str = implode(' &middot; ', $meta);
?>

<div class="detail-page">
<a href="javascript:history.back()" class="back-btn">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg> Back
</a>

<div class="detail-header">
<img class="detail-poster" src="<?= esc($img) ?>" alt="">
<div class="detail-info">
<div class="detail-title"><?= esc($title) ?></div>
<?php if (!empty($anime['title_english']) && $anime['title'] !== $anime['title_english']): ?>
<div style="font-size:13px;color:#666;margin-bottom:8px;font-family:Space Grotesk,sans-serif"><?= esc($anime['title']) ?></div>
<?php endif; ?>
<div class="detail-genres">
<?php foreach ($genres as $g): ?>
<a href="/genre?genre_id=<?= $g['mal_id'] ?>&genre_name=<?= urlencode($g['name']) ?>" class="genre-tag"><?= esc($g['name']) ?></a>
<?php endforeach; ?>
</div>
<div class="detail-meta"><?= $meta_str ?></div>
<?php if (!empty($anime['score'])): ?>
<div class="detail-meta">Score: <span style="color:#ffcc00">&#9733; <?= $anime['score'] ?></span><?= !empty($anime['scored_by']) ? ' (' . number_format($anime['scored_by']) . ' votes)' : '' ?></div>
<?php endif; ?>
</div>
</div>

<?php if ($play_link): ?>
<div class="player-wrap" id="playerWrap">
<iframe src="<?= esc($play_link) ?>" allowfullscreen style="width:100%;height:100%;border:none"></iframe>
</div>
<?php else: ?>
<div class="player-wrap">
<div class="player-loading">
<div style="font-size:16px;color:#888">No stream available</div>
<div style="font-size:13px;color:#555">Anime not in streaming database</div>
</div>
</div>
<?php endif; ?>

<?php if (!empty($anime['synopsis'])): ?>
<div class="detail-desc"><?= esc($anime['synopsis']) ?></div>
<?php endif; ?>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
