<?php
function jikan_fetch($endpoint) {
    global $jikan_url;
    $url = $jikan_url . $endpoint;
    $ctx = stream_context_create(['http' => ['timeout' => 15]]);
    $data = @file_get_contents($url, false, $ctx);
    if ($data === false) return null;
    return json_decode($data, true);
}

function render_card($item, $badge = '', $show_score = true) {
    $img = $item['images']['jpg']['large_image_url'] ?? ($item['images']['jpg']['image_url'] ?? '');
    $title = $item['title_english'] ?? $item['title'] ?? '';
    $meta = [];
    if (!empty($item['type'])) $meta[] = $item['type'];
    if (!empty($item['episodes'])) $meta[] = $item['episodes'] . ' ep';
    if (!empty($item['aired']['string'])) $meta[] = explode('to', $item['aired']['string'])[0];
    $meta_str = implode(' · ', $meta);
    $score_html = '';
    if ($show_score && !empty($item['score'])) {
        $score_html = '<span class="card-score">&#9733; ' . htmlspecialchars($item['score']) . '</span>';
    }
    $badge_html = '';
    if ($badge) {
        $badge_html = '<span class="card-badge">' . htmlspecialchars($badge) . '</span>';
    }
    return <<<HTML
<div class="card" onclick="location.href='/anime?id={$item['mal_id']}'">
{$score_html}{$badge_html}
<div class="card-img-wrap"><img class="card-img" src="{$img}" alt="" loading="lazy" onerror="this.style.background='linear-gradient(135deg,#151518,#1a1a1f)';this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%2316161a%22 width=%22200%22 height=%22300%22/></svg>'"></div>
<div class="card-body"><div class="card-title">{$title}</div><div class="card-meta">{$meta_str}</div></div></div>
HTML;
}

function render_pagination($pagination, $base_url) {
    if (empty($pagination) || empty($pagination['has_next_page'])) return '';
    $cur = $pagination['current_page'] ?? 1;
    $html = '<div class="pagination">';
    if ($cur > 1) {
        $sep = strpos($base_url, '?') !== false ? '&' : '?';
        $html .= "<a class=\"page-btn\" href=\"{$base_url}{$sep}page=" . ($cur - 1) . "\">&#8592; Prev</a>";
    }
    $start = max(1, $cur - 2);
    $end = min($cur + 4, $cur + 2);
    for ($i = $start; $i <= $end; $i++) {
        $sep = strpos($base_url, '?') !== false ? '&' : '?';
        $active = $i === $cur ? ' active' : '';
        $html .= "<a class=\"page-btn{$active}\" href=\"{$base_url}{$sep}page={$i}\">{$i}</a>";
    }
    $sep = strpos($base_url, '?') !== false ? '&' : '?';
    $html .= "<a class=\"page-btn\" href=\"{$base_url}{$sep}page=" . ($cur + 1) . "\">Next &#8594;</a></div>";
    return $html;
}

function esc($s) {
    return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8');
}
