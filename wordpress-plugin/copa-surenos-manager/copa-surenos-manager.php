<?php
/*
Plugin Name: Copa Los Sureños Manager
Description: Gestión profesional de usuarios, delegados y equipos para Copa Los Sureños 2026.
Version: 1.0
Author: Copa Los Sureños
*/
if(!defined('ABSPATH')) exit;

register_activation_hook(__FILE__, function(){
 add_role('delegado_equipo','Delegado de Equipo',['read'=>true]);
 global $wpdb;
 $charset=$wpdb->get_charset_collate();
 $wpdb->query("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}equipos (
 id bigint unsigned NOT NULL AUTO_INCREMENT,
 usuario_id bigint unsigned NOT NULL,
 nombre_equipo varchar(120),
 logo text,
 color1 varchar(20),
 color2 varchar(20),
 color3 varchar(20),
 estado varchar(30) DEFAULT 'Pendiente',
 PRIMARY KEY(id)
 ) $charset;");
 $wpdb->query("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}jugadores (
 id bigint unsigned NOT NULL AUTO_INCREMENT,
 equipo_id bigint unsigned NOT NULL,
 nombre varchar(120),
 numero int,
 posicion varchar(40),
 foto text,
 PRIMARY KEY(id)
 ) $charset;");
});

add_action('admin_menu', function(){
 add_menu_page('Copa Sureños','Copa Sureños','manage_options','copa-surenos','copa_admin');
 add_submenu_page('copa-surenos','Usuarios','Usuarios','manage_options','copa-usuarios','copa_admin');
 add_submenu_page('copa-surenos','Equipos','Equipos','manage_options','copa-equipos','copa_admin');
});

function copa_admin(){ echo '<div class="wrap"><h1>Copa Los Sureños 2026</h1><p>Panel de administración del campeonato.</p></div>'; }

add_action('show_user_profile','copa_perfil_equipo');
add_action('edit_user_profile','copa_perfil_equipo');
function copa_perfil_equipo($user){
 if(in_array('delegado_equipo',(array)$user->roles)){
  echo '<h2>Equipo asignado</h2><p>Este usuario administra únicamente un equipo.</p>';
 }
}
