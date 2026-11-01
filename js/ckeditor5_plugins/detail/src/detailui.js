/**
 * @file registers the detail toolbar button and binds functionality to it.
 */

import { Command, Plugin } from 'ckeditor5/src/core';
import { ButtonView, ContextualBalloon, View } from 'ckeditor5/src/ui';
import icon from '../../../../icons/detail.svg';

function getSelectedDetail(selection) {
  const selectedElement = selection.getSelectedElement();
  if (selectedElement && selectedElement.is('element', 'detail')) {
    return selectedElement;
  }

  const firstPosition = selection.getFirstPosition();
  return firstPosition ? firstPosition.findAncestor('detail') : null;
}

class DetailPropertiesCommand extends Command {
  refresh() {
    const { editor } = this;
    const insertCommand = editor.commands.get('insertDetail');
    this.isEnabled = !editor.isReadOnly && (
      Boolean(getSelectedDetail(editor.model.document.selection)) ||
      insertCommand.isEnabled
    );
  }
}

export default class DetailUI extends Plugin {
  static get requires() {
    return [ContextualBalloon];
  }

  init() {
    const editor = this.editor;
    const balloon = editor.plugins.get('ContextualBalloon');
    const command = new DetailPropertiesCommand(editor);
    editor.commands.add('detailProperties', command);

    const localeDir = editor.locale && editor.locale.uiLanguageDirection ? editor.locale.uiLanguageDirection : 'ltr';
    const formView = new View(editor.locale);
    const saveButton = new ButtonView(editor.locale);
    const cancelButton = new ButtonView(editor.locale);
    const viewDocument = editor.editing.view.document;
    let activeDetail = null;
    let isFormOpen = false;
    let closeOnBlur = null;

    saveButton.set({ label: Drupal.t('Save'), withText: true, class: 'ck-button-save' });
    cancelButton.set({ label: Drupal.t('Cancel'), withText: true, class: 'ck-button-cancel' });

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
            'aria-label': Drupal.t('Name (optional)'),
          },
        },
        saveButton,
        cancelButton,
      ],
    });

    formView.render();
    const inputEl = formView.element.querySelector('input.ck-details-name-input');

    const closeForm = () => {
      if (isFormOpen) {
        isFormOpen = false;
        balloon.remove(formView);
        activeDetail = null;
      }
      if (closeOnBlur) {
        viewDocument.off('blur', closeOnBlur);
        closeOnBlur = null;
      }
    };

    const applyValue = () => {
      const trimmed = inputEl ? String(inputEl.value).trim() : '';

      if (activeDetail) {
        editor.model.change((writer) => {
          if (trimmed === '') {
            writer.removeAttribute('name', activeDetail);
          } else {
            writer.setAttribute('name', trimmed, activeDetail);
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

    formView.element.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeForm();
        editor.editing.view.focus();
      } else if (event.key === 'Enter' && event.target === inputEl) {
        event.preventDefault();
        applyValue();
      }
    });
    editor.ui.componentFactory.add('detail', (locale) => {
      const buttonView = new ButtonView(locale);

      buttonView.set({
        label: Drupal.t('Add details'),
        icon,
        tooltip: true,
      });

      buttonView.bind('isEnabled').to(command, 'isEnabled');

      this.listenTo(buttonView, 'execute', () => {
        closeForm();
        activeDetail = getSelectedDetail(editor.model.document.selection);
        if (inputEl) {
          inputEl.value = activeDetail ? String(activeDetail.getAttribute('name') || '') : '';
        }

        balloon.add({
          view: formView,
          position: { target: buttonView.element },
        });
        isFormOpen = true;

        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
        closeOnBlur = () => closeForm();
        viewDocument.on('blur', closeOnBlur);
      });

      return buttonView;
    });
  }
}
