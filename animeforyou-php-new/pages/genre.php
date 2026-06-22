<?php
require_once __DIR__ . '/../includes/helpers.php';
$current_view = 'genres';
$page_title = ($genre_name ?: 'Genre') . ' - ' . $website_name;
require_once __DIR__ . '/../includes/header.php';

if (!$genre_id): ?>
<div class="empty-state"><h3>Genre not specified</h3></div>
<?php require_once __DIR__ . '/../includes/footer.php'; exit; endif;

$data = jikan_fetch('/anime?genres=' . $genre_id . '&page=' . $page . '&limit=20&order_by=score&sort=desc');
$items = $data['data'] ?? [];
$pagination = $data['pagination'] ?? null;
?>

<div class="section-title"><span class="accent">&#127912;</span> <?= esc($genre_name) ?></div>
<div class="section-grid">
<?php foreach ($items as $item): ?>
    <?= render_card($item) ?>
<?php endforeach; ?>
</div>

<?php if (empty($items)): ?>
<div class="empty-state"><h3>No anime found in this genre</h3></div>
<?php endif; ?>

<?= render_pagination($pagination, '/genre?genre_id=' . $genre_id . '&genre_name=' . urlencode($genre_name)) ?>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
