<?php
require_once __DIR__ . '/../includes/helpers.php';
$current_view = 'home';
$page_title = $website_name;
require_once __DIR__ . '/../includes/header.php';

$data = jikan_fetch('/seasons/now?page=' . $page . '&limit=20');
$items = $data['data'] ?? [];
$pagination = $data['pagination'] ?? null;
?>

<div class="section-title"><span class="accent">&#9654;</span> Currently Airing</div>
<div class="section-grid">
<?php foreach ($items as $item): ?>
    <?= render_card($item, 'Airing') ?>
<?php endforeach; ?>
</div>

<?php if (empty($items)): ?>
<div class="empty-state"><h3>No anime found</h3></div>
<?php endif; ?>

<?= render_pagination($pagination, '/') ?>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
