<?php

namespace Drupal\ckeditor_details\Hook;

use Drupal\Core\Url;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\StringTranslation\StringTranslationTrait;

/**
 * Hook implementations for ckeditor_details.
 */
class CkeditorDetailsHooks {
  use StringTranslationTrait;

  /**
   * Implements hook_help().
   */
  #[Hook('help')]
  public function help(string $route_name, RouteMatchInterface $route_match): ?string {
    switch ($route_name) {
      case 'help.page.ckeditor_details':
        $output = '<h2>' . $this->t('About') . '</h2>';
        $output .= '<p>' . $this->t('Accordions are a popular way to structure content. This module adds a button so editors can easily use this element in their content.') . '</p>';
        $output .= '<p>' . $this->t('Visit the <a href=":project_page">project page</a> for more details.', [
          ':project_page' => 'https://www.drupal.org/project/ckeditor_details',
        ]) . '</p>';
        $output .= '<h2>' . $this->t('Uses') . '</h2>';
        $output .= '<dl>';
        $output .= '<dt>' . $this->t('Setting CKEditor-enabled text formats') . '</dt>';
        $output .= '<dd>' . $this->t('Visit the <a href=":config_page">Text formats and editors</a> settings page and add the <em>Details</em> button to any CKEditor-enabled text format you want.', [
          ':config_page' => Url::fromRoute('filter.admin_overview')->toString(),
        ]) . '</dd>';
        $output .= '</dt></dl>';
        return $output;
    }
    return NULL;
  }

}
