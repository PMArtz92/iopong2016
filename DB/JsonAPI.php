<?php
require("DB.class.php");
$db = new Db();
$functionName    =   $_GET["functionName"];

// for selector // always main branch come first
function setPlayer(){
    global $db;
    $db->beginTransaction();
    $user_id = $_GET['user_id'];
    $user_name = $_GET['user_name'];
    $img_src = $_GET['img_src'];
    $orientation = $_GET['orientation'];

    $player = $db->query("INSERT IGNORE INTO `user_score` (`user_id`, `user_name`, `img_src`, `orientation`) VALUES (:user_id, :user_name, :img_src, :orientation)", array("user_id" => $user_id, "user_name" =>$user_name, "img_src" => $img_src, "orientation" => $orientation));
    $db->commit();
    return json_encode($player);
}

function setScore(){
    global $db;
    $db->beginTransaction();
    $p1_score = $_GET['p1_score'];
    $p2_score = $_GET['p2_score'];

    $p1_update = $db->query("UPDATE `user_score` SET `score` = (`score` + '$p1_score'), `orientation` = 0 WHERE `orientation` = 1");
    $p2_update = $db->query("UPDATE `user_score` SET `score` = (`score` + '$p2_score'), `orientation` = 0 WHERE `orientation` = 2");
    $db->commit();
    return json_encode($p2_update);

}

function getScore(){
    global $db;
    $db->beginTransaction();

    $score = $db->query("SELECT * FROM `user_score` LIMIT 20");

    $db->commit();
    return json_encode($score);

}


switch ($functionName) {

    case "setPlayer";
        echo setPlayer();
        break;

    case "setScore";
        echo setScore();
        break;

    case "getScore";
        echo getScore();
        break;
}
