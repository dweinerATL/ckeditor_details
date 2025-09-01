/**
 * @file registers the detail toolbar button and binds functionality to it.
 */

import { Plugin } from 'ckeditor5/src/core';
import { ButtonView, View } from 'ckeditor5/src/ui';
import icon from '../../../../icons/detail.svg';

export default class DetailUI extends Plugin {
  init() {
    const editor = this.editor;

    // This will register the detail toolbar button.
    editor.ui.componentFactory.add('detail', (locale) => {
      const command = editor.commands.get('insertDetail');
      const buttonView = new ButtonView(locale);

      // Create the toolbar button.
      buttonView.set({
        label: Drupal.t('Add details'),
        icon,
        tooltip: true,
      });

      // Bind the state of the button to the command.
      buttonView.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');

      // Execute the command when the button is clicked (executed).
      this.listenTo(buttonView, 'execute', () => {
        const model = editor.model;
        const selection = model.document.selection;
        // Find if the selection is inside an existing <detail> widget.
        const detailElement = selection.getFirstPosition() ? selection.getFirstPosition().findAncestor('detail') : null;

        // Build a small inline form using CKEditor 5 UI instead of window.prompt.
        const localeDir = editor.locale && editor.locale.uiLanguageDirection ? editor.locale.uiLanguageDirection : 'ltr';
        const formView = new View(editor.locale);
        const saveButton = new ButtonView(editor.locale);
        const cancelButton = new ButtonView(editor.locale);

        formView.setTemplate({
          tag: 'form',
          attributes: {
            class: [ 'ck', 'ck-reset_all', 'ck-details-name-form' ],
            dir: localeDir,
          },
          children: [
            {
              tag: 'label',
              attributes: { class: 'ck-details-name-label' },
              children: [ Drupal.t('Name (optional)') ],
            },
            {
              tag: 'input',
              attributes: {
                type: 'text',
                class: 'ck-input ck-details-name-input',
                placeholder: Drupal.t('e.g. my-section'),
                value: detailElement ? (String(detailElement.getAttribute('name') || '')) : '',
              },
            },
            saveButton,
            cancelButton,
          ],
        });

        saveButton.set({ label: Drupal.t('Save'), withText: true, class: 'ck-button-save' });
        cancelButton.set({ label: Drupal.t('Cancel'), withText: true, class: 'ck-button-cancel' });

        const balloon = editor.plugins.get('ContextualBalloon');

        const closeForm = () => {
          if (balloon.visibleView === formView) {
            balloon.remove(formView);
          }
        };

        const applyValue = () => {
          const inputEl = formView.element.querySelector('input.ck-details-name-input');
          const trimmed = inputEl ? String(inputEl.value).trim() : '';

          if (detailElement) {
            model.change((writer) => {
              if (trimmed === '') {
                writer.removeAttribute('name', detailElement);
              } else {
                writer.setAttribute('name', trimmed, detailElement);
              }
            });
          } else {
            editor.execute('insertDetail', { name: trimmed });
          }
          closeForm();
          editor.editing.view.focus();
        };

        this.listenTo(saveButton, 'execute', (evt) => {
          evt.stop();
          applyValue();
        });
        this.listenTo(cancelButton, 'execute', (evt) => {
          evt.stop();
          closeForm();
          editor.editing.view.focus();
        });

        formView.on('submit', (evt) => {
          evt.preventDefault();
          applyValue();
        });

        formView.render();

        // Show the balloon anchored to the toolbar button so it appears beneath it.
        const target = buttonView.element;
        if (balloon.visibleView) {
          balloon.remove(balloon.visibleView);
        }
        balloon.add({
          view: formView,
          position: { target },
        });

        // Focus the input when the form is shown.
        const inputEl = formView.element.querySelector('input.ck-details-name-input');
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }

        // Handle Escape/Enter keys.
        const keydownHandler = (e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            closeForm();
            editor.editing.view.focus();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            applyValue();
          }
        };
        formView.element.addEventListener('keydown', keydownHandler, { once: false });

        // Close the form when editor loses focus (optional, keeps UI tidy).
        const viewDocument = editor.editing.view.document;
        const closeOnBlur = () => {
          closeForm();
          viewDocument.off('blur', closeOnBlur);
        };
        viewDocument.on('blur', closeOnBlur);
      });

      return buttonView;
    });
  }
}
