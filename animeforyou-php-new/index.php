<?php
require_once __DIR__ . '/config.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$genre_id = isset($_GET['genre_id']) ? (int)$_GET['genre_id'] : 0;
$genre_name = isset($_GET['genre_name']) ? $_GET['genre_name'] : '';
$query = isset($_GET['q']) ? trim($_GET['q']) : '';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($uri === '/' || $uri === '/index.php') {
    require __DIR__ . '/pages/home.php';
} elseif ($uri === '/search') {
    require __DIR__ . '/pages/search.php';
} elseif ($uri === '/genres') {
    require __DIR__ . '/pages/genres.php';
} elseif ($uri === '/genre') {
    require __DIR__ . '/pages/genre.php';
} elseif ($uri === '/popular') {
    require __DIR__ . '/pages/popular.php';
} elseif ($uri === '/anime') {
    require __DIR__ . '/pages/anime.php';
} elseif ($uri === '/api/play') {
    header('Content-Type: application/json');
    $title = isset($_GET['title']) ? $_GET['title'] : '';
    $data = json_decode(file_get_contents($scraped_json), true);
    $normalized = strtolower(preg_replace('/[^a-z0-9]/', '', $title));
    $match = null;
    foreach ($data as $d) {
        $t = strtolower(preg_replace('/[^a-z0-9]/', '', $d['title'] ?? ''));
        if (strpos($t, $normalized) !== false || strpos($normalized, $t) !== false) {
            $match = $d;
            break;
        }
    }
    if (!$match) {
        $words = array_filter(explode(' ', strtolower($title)), fn($w) => strlen($w) > 3);
        foreach ($data as $d) {
            $t = strtolower($d['title'] ?? '');
            $matched_words = array_filter($words, fn($w) => strpos($t, $w) !== false);
            if (count($words) > 0 && count($matched_words) >= ceil(count($words) * 0.5)) {
                $match = $d;
                break;
            }
        }
    }
    if ($match && !empty($match['playLink'])) {
        echo json_encode(['found' => true, 'playLink' => $match['playLink'], 'title' => $match['title']]);
    } else {
        echo json_encode(['found' => false]);
    }
} else {
    http_response_code(404);
    echo '<!DOCTYPE html><html><head><title>404</title></head><body style="background:#08080a;color:#888;font-family:sans-serif;text-align:center;padding:100px"><h1>404 Not Found</h1></body></html>';
}
