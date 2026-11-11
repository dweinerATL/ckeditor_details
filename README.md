# CKEditor Accordions - Detail Plugin

## Description

Accordions are a popular way to structure content. In the past nested divs or
definition lists were augmented by JavaScript to provide this functionality,
but the HTML5 details element provides this functionality natively. This module
adds a button so editors can easily use this element in their content.

For a full description of the module, visit the
[project page](https://www.drupal.org/project/ckeditor_details).

Submit bug reports and feature suggestions, or track changes in the
[issue queue](https://www.drupal.org/project/issues/ckeditor_details).

## Usage

Go to the Text formats and editors settings (/admin/config/content/formats) and
add the Details button to any CKEditor-enabled text format you want.

In CKEditor 5, use the Details toolbar button to create an accordion. Enter an
optional Name and check Open by default to include the `open` attribute.

Click an existing accordion's summary or body to show its properties form beside
the element, without interrupting content editing. Edit Name or toggle Open by
default, then click Save. Clearing Name removes the `name` attribute; unchecking
Open by default removes `open`. Cancel or click outside the form to discard
unsaved changes. The toolbar button also edits the selected accordion.

Existing `data-*` attributes on the accordion's `details`, `summary`, and
`div.details-wrapper` elements are preserved. In either editor's properties
panel, use Add data attribute to add as many rows as needed. Choose the element,
enter the suffix without `data-` (for example, `feature`), and enter its value.
Edit or remove rows to change existing attributes. Empty values are allowed;
suffixes must be valid and unique on each element. The `cke-` suffix prefix is
reserved for CKEditor, as is `widget` in CKEditor 4. Cancel discards changes.
Other elements inside the accordion are governed by their own editor plugins
and the text format's HTML filter settings. Text format filters must also permit
the attributes to retain them in saved content.

## Installation

1. Download the plugin from [ckeditor](http://ckeditor.com/addon/detail)
2. Place the plugin in the root libraries folder (/libraries).
3. Enable CKEditor Accordions - Detail Plugin module in the Drupal admin.

Each filter format will now have a config tab for this plugin.

## Dependencies

This module requires the core CKEditor module.

## Development

After installing the npm dependencies, run `npm run build`. To check CKEditor 5
attribute conversion and the properties panel, serve the repository locally
(for example, with `python3 -m http.server`) and open
`/tests/detail-data-attributes.html` and `/tests/detail-properties.html`.
For CKEditor 4, serve both this module and an existing CKEditor 4 distribution
from the same local server, and open `/tests/detail-properties-ckeditor4.html`
with `?ckeditor4=/path/to/ckeditor.js` pointing to that distribution.

## Uninstallation

1. Uninstall the module from `'Administer >> Modules'`.

## Maintainers

Martin Anderson-Clutz - [mandclu](https://www.drupal.org/u/mandclu)

## Credits

Initial development and maintenance by Digital Echdina.
