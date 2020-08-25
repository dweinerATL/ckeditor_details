/**
 * Detail Widget
 *
 * @author Ayhan Akilli, adapted to Drupal by Martin Anderson-Clutz
 */
 /*jshint maxlen:false, camelcase:false*/
 /*global CKEDITOR */

 (function ($, Drupal) {

'use strict';

  // Theme functions.
  Drupal.theme.detail = function (item) {
    return '<details><summary>' + item.title + '</summary>' +
      item.content +
    '</details>';
  };

  /**
   * Adds element to parent at given index if it is not removable and returns true if element was added or
   * false otherwise
   *
   * @param {CKEDITOR.htmlParser.element} el
   * @param {CKEDITOR.htmlParser.element} parent
   * @param {Number} [index = null]
   *
   * @return {Boolean}
   */
  function add_to_parent(el, parent, index) {
      if (!!el && !is_removable(el)) {
          parent.add(el, index);
          return true;
      }

      return false;
  }

  /**
   * Indicates if element is removable because it is not en empty element and its inner HTML is empty
   *
   * @param {CKEDITOR.htmlParser.element} el
   *
   * @return {Boolean}
   */
  function is_removable(el) {
      return !!el && (el.type !== CKEDITOR.NODE_ELEMENT || !CKEDITOR.dtd.$empty[el.name] && !el.getHtml().trim());
  }

  /**
   * DTD
   */
  CKEDITOR.dtd['$block']['summary'] = 1;
  CKEDITOR.dtd['$editable']['summary'] = 1;
  CKEDITOR.dtd['$empty']['drupal-media'] = 1;
  CKEDITOR.dtd['$empty']['drupal-entity'] = 1;

  /**
   * Plugin
   */
  CKEDITOR.plugins.add('detail', {
      requires: 'widget',
      icons: 'detail',
      hidpi: true,
      lang: 'de,en,uk,ru',
      init: function (editor) {
          /**
           * Widget
           */
          editor.widgets.add('detail', {
              button: editor.lang.detail.title,
              template: '<details><summary>' + editor.lang.detail.title +'</summary><div class="content"></div></details>',
              editables: {
                  summary: {
                      selector: 'summary',
                      allowedContent: 'abbr br strong em small span strong sub sup time;'
                        + 'drupal-media[data-entity-type,data-entity-uuid,data-align];'
                        + 'img[!src,alt,width,height,data-entity-type,data-entity-uuid,data-align,data-caption];'
                        + 'picture svg video'
                  },
                  content: {
                      selector: 'div.content'
                  }
              },
              allowedContent: {details: true, summary: true},
              requiredContent: 'details',
              upcast: function (el) {
                  if (el.name !== 'details') {
                      return false;
                  }

                  var summary = el.getFirst('summary');
                  var content = new CKEDITOR.htmlParser.element('div', {'class': 'content'});

                  if (!summary) {
                      el.add(new CKEDITOR.htmlParser.element('summary'), 0);
                  }

                  el.add(content, 1);

                  if (el.children.length > 2) {
                      content.children = el.children.slice(2);
                      el.children = el.children.slice(0, 2);
                  }

                  return true;
              },
              downcast: function (el) {
                  el.attributes = [];
                  el.children[0].attributes = [];

                  // Content
                  el.children[1].setHtml(this.editables.content.getData());
                  el.children[1].children.forEach(function (item) {
                      add_to_parent(item, el);
                  });
                  el.children[1].remove();

                  return el.children.length > 1 ? el : new CKEDITOR.htmlParser.text('');
              },
              init: function () {
                  var summary = this.element.getChild(0);

                  summary.on('blur', function () {
                      if (!summary.getText()) {
                          summary.setText(editor.lang.detail.title);
                      }
                  });
                  summary.on('keydown', function (ev) {
                      if (ev.data['$'].key === ' ' || ev.data['$'].code === 'Space' || ev.data['$'].keyCode === 32) {
                          ev.data['$'].preventDefault();
                          // Direct insertion of a space as HTML will be ignored at the end of the summary.
                          editor.insertHtml(' &#8203;', 'html');

                          // Delete the zero-wdith space and reset the cursor.
                          var currentRange = editor.getSelection().getRanges()[0];
                          var markup = summary.getHtml();
                          markup = String(markup).replace(/\u200B/gi, '');
                          summary.setHtml(markup);
                          editor.getSelection().selectRanges( [ currentRange ] );
                      }
                  });
              }
          });
          editor.ui.addButton('detail', {
            label: 'Add accordion',
            command: 'detail',
            toolbar: 'insert',
          });
      },
      onLoad: function () {
          CKEDITOR.addCss(
              'details {line-height: 1.5rem;padding: 0.75rem;background: #eee;border: 0.0625rem solid #ddd;border-radius: 0.5rem;}' +
              'details > * {padding: 0.375rem;background: #fff;}' +
              'details[open] > :not(:last-child) {margin-bottom: 0.75rem;}' +
              'details .cke_widget_editable {outline: none !important;}'
          );
      },
  });

}(jQuery, Drupal));
