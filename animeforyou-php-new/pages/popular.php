<?php
require_once __DIR__ . '/../includes/helpers.php';
$current_view = 'popular';
$page_title = 'Popular - ' . $website_name;
require_once __DIR__ . '/../includes/header.php';

$data = jikan_fetch('/top/anime?page=' . $page . '&filter=bypopularity&limit=20');
$items = $data['data'] ?? [];
$pagination = $data['pagination'] ?? null;
?>

<div class="section-title"><span class="accent">&#9733;</span> Most Popular</div>
<div class="section-grid">
<?php foreach ($items as $item): ?>
    <?= render_card($item) ?>
<?php endforeach; ?>
</div>

<?php if (empty($items)): ?>
<div class="empty-state"><h3>No anime found</h3></div>
<?php endif; ?>

<?= render_pagination($pagination, '/popular') ?>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
