<?php 
$base_url = "//{$_SERVER['SERVER_NAME']}";
$website_name = "ANIMEFORYOU";
$apiLink = "https://anikatsu2.herokuapp.com"; 
if (date("d") > 15){
    $apiLink = "https://anikatsu.herokuapp.com";
}
?>
