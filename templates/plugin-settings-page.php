<?php
/**
 * @file
 * Contains HTML template for plugin settings page.
 */
if (!defined('ABSPATH')) {
  exit;
}
?>
<div class="wrap">
  <h2>
    <?php print esc_html(get_admin_page_title()); ?>
  </h2>
  <form method="post" action="options.php">
    <?php settings_fields('gwentdb-plugin-settings-group'); ?>
    <fieldset style="border:1px solid #000000;padding:15px;">
      <legend>
        <?php print __('REST API settings'); ?>
      </legend>
      <table class="form-table">
        <tr valign="top">
          <td style="padding:5px;">
            <label for="gwentdb-api-key"><?php print __('API Key'); ?></label>
          </td>
          <td style="padding:5px;">
            <input type="text" id="gwentdb-api-key" name="gwentdb_api_key" size="30" value="<?php print esc_attr(get_option('gwentdb_api_key')); ?>"/>
          </td>
        </tr>
      </table>
    </fieldset>
    <?php submit_button(); ?>
  </form>
</div>
