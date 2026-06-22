<?php
require_once __DIR__ . '/../includes/helpers.php';
$current_view = 'genres';
$page_title = 'Genres - ' . $website_name;
require_once __DIR__ . '/../includes/header.php';

$data = jikan_fetch('/genres/anime');
$genres = $data['data'] ?? [];
?>

<div class="section-title"><span class="accent">&#127912;</span> Browse by Genre</div>
<div class="genre-grid">
<?php foreach ($genres as $g): ?>
<a href="/genre?genre_id=<?= $g['mal_id'] ?>&genre_name=<?= urlencode($g['name']) ?>" class="genre-card">
<?= esc($g['name']) ?>
<span class="count"><?= $g['count'] ?> anime</span>
</a>
<?php endforeach; ?>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
