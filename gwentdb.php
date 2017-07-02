<?php
/*
Plugin Name: GwentDB
Plugin URI: https://www.gwentdb.hu
Description: This plugin allows user to insert Gwent Cards into their posts.
Version: 1.0.0
Author: Lóna Lore
Author URI: https://lonalore.hu
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

/**
 * Registers our gwentdb_plugin_settings to the admin_init action hook.
 */
add_action('admin_init', 'gwentdb_plugin_settings');

/**
 * Registers new administration links.
 *
 * Fires before the administration menu loads in the admin.
 */
add_action('admin_menu', 'gwentdb_create_admin_menu_link');

/**
 * Enqueue new scripts in order to expose plugin settings for javascript.
 */
add_action('admin_enqueue_scripts', 'gwentdb_enqueue_admin_scripts');
add_action('wp_enqueue_scripts', 'gwentdb_enqueue_scripts');

/**
 * Enqueue new styles.
 */
add_action('admin_enqueue_scripts', 'gwentdb_enqueue_admin_styles');
add_action('wp_enqueue_scripts', 'gwentdb_enqueue_styles');

/**
 * Registers new TinyMCE buttons.
 *
 * The mce_buttons group of filters can be used by developers to add or remove
 * buttons/features from the WordPress's TinyMCE toolbar(s). This filter is
 * passed an array of button ids which determine which buttons are displayed or
 * removed.
 */
add_filter('mce_buttons', 'gwentdb_mce_register_buttons');

/**
 * Registers additional javascript files for TinyMCE.
 *
 * The mce_external_plugins filter is used to load external TinyMCE plugins.
 * This filter may be useful for loading any of the TinyMCE core plugins, many
 * of which are not included by default in WordPress, as well as any custom
 * TinyMCE plugins you may want to create.
 */
add_filter('mce_external_plugins', 'gwentdb_mce_register_javascript');

/**
 * Registers additional stylesheet files for TinyMCE.
 *
 * The mce_css filter provides a method to add custom stylesheets to the TinyMCE
 * editor window.
 *
 * The file can be a .php file, allowing dynamic generation of CSS rules for the
 * content editor.
 */
add_filter('mce_css', 'gwentdb_mce_register_stylesheet');

/**
 * Callback function to enqueue new scripts for admin pages.
 */
function gwentdb_enqueue_admin_scripts() {
  wp_register_script('gwentdb', plugins_url('/js/gwentdb.cards.js', __FILE__), array('jquery'));

  $options = gwentdb_get_javascript_settings();

  wp_localize_script('gwentdb', 'GwentConfig', $options);
  wp_enqueue_script('gwentdb');
}

/**
 * Callback function to enqueue new scripts for frontend pages.
 */
function gwentdb_enqueue_scripts() {
  wp_register_script('gwentdb', plugins_url('/js/gwentdb.cards.js', __FILE__), array('jquery'));

  $options = gwentdb_get_javascript_settings();

  wp_localize_script('gwentdb', 'GwentConfig', $options);
  wp_enqueue_script('gwentdb');
}

/**
 * Helper function to build settings array will be exposed for javascript.
 *
 * @return array
 */
function gwentdb_get_javascript_settings() {
  $locale = get_locale();
  $locale_iso = substr($locale, 0, 2);

  if (!in_array($locale_iso, array('en', 'hu'))) {
    $locale_iso = 'en';
  }

  $options = array(
    'apiKey'    => get_option('gwentdb_api_key'),
    'language'  => $locale_iso,
    'translate' => array(
      'Version'       => __('Version'),
      'Latest'        => __('Latest'),
      'Any'           => __('Any'),
      'Category'      => __('Category'),
      'Faction'       => __('Faction'),
      'Type'          => __('Type'),
      'Position'      => __('Position'),
      'No results...' => __('No results...'),
    ),
  );

  return $options;
}

/**
 * Callback function to enqueue new styles for admin pages.
 */
function gwentdb_enqueue_admin_styles() {
  wp_register_style('gwentdb', plugins_url('/css/tinymce.plugin.css', __FILE__));
  wp_register_style('gwentdb', plugins_url('/css/gwentdb.cards.css', __FILE__));

  wp_enqueue_style('gwentdb');
}

/**
 * Callback function to enqueue new styles for frontend pages.
 */
function gwentdb_enqueue_styles() {
  wp_register_style('gwentdb', plugins_url('/css/gwentdb.cards.css', __FILE__));
  wp_enqueue_style('gwentdb');
}

/**
 * Callback function to register new TinyMCE buttons.
 *
 * @param array $buttons
 *    Array contains buttons already added to TinyMCE.
 *
 * @return mixed
 */
function gwentdb_mce_register_buttons($buttons) {
  array_push($buttons, 'separator', 'gwentdb');
  return $buttons;
}

/**
 * Callback function to register additional javascript files for TinyMCE.
 *
 * @param array $plugin_array
 *    Array contains plugins.
 *
 * @return array
 */
function gwentdb_mce_register_javascript($plugin_array) {
  $plugin_array['gwentdb'] = plugins_url('/js/tinymce.plugin.js', __FILE__);
  return $plugin_array;
}

/**
 * Callback function to register additional stylesheet files for TinyMCE.
 *
 * @param string $mce_css
 *    $mce_css is a comma separated list of stylesheet URIs.
 *
 * @return string
 */
function gwentdb_mce_register_stylesheet($mce_css) {
  $files = explode(',', $mce_css);
  $files[] = plugins_url('/css/tinymce.plugin.css', __FILE__);
  return implode(',', $files);
}

/**
 * Callback function to initialize plugin settings.
 */
function gwentdb_plugin_settings() {
  // Register our settings.
  register_setting('gwentdb-plugin-settings-group', 'gwentdb_api_key');
}

/**
 * Admin callback function to provide admin page links.
 */
function gwentdb_create_admin_menu_link() {
  // Create new top-level menu.
  add_menu_page(__('Gwent settings'), __('Gwent settings'), 'manage_options', 'gwentdb', 'gwentdb_plugin_settings_page');
}

/**
 * Page callback function to provide a page for plugin settings.
 */
function gwentdb_plugin_settings_page() {
  // Check user capabilities.
  if (!current_user_can('manage_options')) {
    return;
  }

  gwentdb_get_template('plugin-settings-page.php');
}

/**
 * Get template.
 *
 * Search for the template and include the file.
 *
 * @param string $template_name
 *    Template to load.
 * @param array $args
 *    Args passed for the template file.
 * @param string $template_path
 *    Path to templates.
 * @param string $default_path
 *    Default path to template files.
 */
function gwentdb_get_template($template_name, $args = array(), $template_path = '', $default_path = '') {
  if (is_array($args) && isset($args)) {
    extract($args);
  }

  $template_file = gwentdb_locate_template($template_name, $template_path, $default_path);

  if (!file_exists($template_file)) {
    // @todo error message?
    return;
  }

  include $template_file;
}

/**
 * Locate template.
 *
 * Locate the called template.
 * Search Order:
 * 1. /themes/theme/gwentdb/$template_name
 * 2. /themes/theme/$template_name
 * 3. /plugins/gwentdb/templates/$template_name.
 *
 * @param string $template_name
 *    Template to load.
 * @param string $template_path
 *    Path to templates.
 * @param string $default_path
 *    Default path to template files.
 *
 * @return string
 *    Path to the template file.
 */
function gwentdb_locate_template($template_name, $template_path = '', $default_path = '') {
  // Set variable to search in gwentdb folder of theme.
  if (!$template_path) {
    $template_path = 'gwentdb/';
  }

  // Set default plugin templates path.
  if (!$default_path) {
    // Path to the template folder.
    $default_path = plugin_dir_path(__FILE__) . 'templates/';
  }

  // Search template file in theme folder.
  $template = locate_template(array(
    $template_path . $template_name,
    $template_name
  ));

  // Get plugins template file.
  if (!$template) {
    $template = $default_path . $template_name;
  }

  return apply_filters('gwentdb_locate_template', $template, $template_name, $template_path, $default_path);
}
