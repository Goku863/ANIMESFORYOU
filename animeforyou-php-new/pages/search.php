<?php
require_once __DIR__ . '/../includes/helpers.php';
$current_view = 'search';
$page_title = 'Search: ' . $query . ' - ' . $website_name;
require_once __DIR__ . '/../includes/header.php';

if (empty($query)): ?>
<div class="empty-state"><h3>Enter a search term</h3></div>
<?php require_once __DIR__ . '/../includes/footer.php'; exit; endif;

$data = jikan_fetch('/anime?q=' . urlencode($query) . '&page=' . $page . '&limit=20');
$items = $data['data'] ?? [];
$pagination = $data['pagination'] ?? null;
?>

<div class="section-title"><span class="accent">&#128269;</span> Results for "<?= esc($query) ?>"</div>

<?php if (empty($items)): ?>
<div class="empty-state"><h3>No results found</h3><p style="color:#555">Try a different search</p></div>
<?php else: ?>
<div class="section-grid">
<?php foreach ($items as $item): ?>
    <?= render_card($item) ?>
<?php endforeach; ?>
</div>
<?= render_pagination($pagination, '/search?q=' . urlencode($query)) ?>
<?php endif; ?>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
