/**
 * @file registers the detail toolbar button and binds functionality to it.
 */

import { Command, Plugin } from 'ckeditor5/src/core';
import { ClickObserver } from 'ckeditor5/src/engine';
import { ButtonView, ContextualBalloon, View } from 'ckeditor5/src/ui';
import icon from '../../../../icons/detail.svg';
import { getDetailElements, getDataAttributeEntries, setDataAttributeEntries } from './dataattributes';

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

  destroy() {
    if (this._removeOutsideInteractionListeners) {
      this._removeOutsideInteractionListeners();
    }
    super.destroy();
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
        {
          tag: 'label',
          attributes: { class: 'ck-details-open-label' },
          children: [
            {
              tag: 'input',
              attributes: {
                type: 'checkbox',
                class: 'ck-details-open-input',
              },
            },
            Drupal.t('Open by default'),
          ],
        },
        {
          tag: 'div',
          attributes: { class: 'ck-details-data-attributes' },
        },
        saveButton,
        cancelButton,
      ],
    });

    formView.render();
    const inputEl = formView.element.querySelector('input.ck-details-name-input');
    const openInputEl = formView.element.querySelector('input.ck-details-open-input');
    const dataAttributes = Drupal.ckeditorDetailsDataAttributes.create(
      formView.element.querySelector('.ck-details-data-attributes'),
    );
    const ownerDocument = formView.element.ownerDocument;
    const closeOnOutsideInteraction = (event) => {
      if (!formView.element.contains(event.target)) {
        closeForm();
      }
    };
    const removeOutsideInteractionListeners = () => {
      ownerDocument.removeEventListener('mousedown', closeOnOutsideInteraction, true);
      ownerDocument.removeEventListener('focusin', closeOnOutsideInteraction);
    };
    this._removeOutsideInteractionListeners = removeOutsideInteractionListeners;

    const closeForm = () => {
      if (isFormOpen) {
        isFormOpen = false;
        balloon.remove(formView);
        removeOutsideInteractionListeners();
      }
      activeDetail = null;
    };

    const applyValue = () => {
      const trimmed = inputEl ? String(inputEl.value).trim() : '';
      const isOpen = openInputEl ? openInputEl.checked : false;
      const entries = dataAttributes.getEntries();
      if (!entries) {
        return;
      }

      if (activeDetail) {
        const elements = getDetailElements(activeDetail);
        if (entries.some((entry) => !elements[entry.target])) {
          dataAttributes.showError(Drupal.t('The selected accordion element is missing.'));
          return;
        }
        editor.model.change((writer) => {
          if (trimmed === '') {
            writer.removeAttribute('name', activeDetail);
          } else {
            writer.setAttribute('name', trimmed, activeDetail);
          }
          if (isOpen) {
            writer.setAttribute('open', true, activeDetail);
          } else {
            writer.removeAttribute('open', activeDetail);
          }
          setDataAttributeEntries(writer, elements, entries);
        });
      } else {
        editor.execute('insertDetail', { name: trimmed, open: isOpen, dataAttributes: entries });
      }
      closeForm();
      editor.editing.view.focus();
    };

    const openForm = (detailElement, target, focusInput = true) => {
      if (editor.isReadOnly) {
        return;
      }

      closeForm();
      activeDetail = detailElement;
      if (inputEl) {
        inputEl.value = activeDetail ? String(activeDetail.getAttribute('name') || '') : '';
      }
      if (openInputEl) {
        openInputEl.checked = Boolean(activeDetail && activeDetail.getAttribute('open'));
      }
      dataAttributes.setEntries(activeDetail ? getDataAttributeEntries(getDetailElements(activeDetail)) : []);
      balloon.add({
        view: formView,
        position: { target },
      });
      isFormOpen = true;
      ownerDocument.addEventListener('mousedown', closeOnOutsideInteraction, true);
      ownerDocument.addEventListener('focusin', closeOnOutsideInteraction);
      if (focusInput && inputEl) {
        inputEl.focus();
        inputEl.select();
      }
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
      } else if (event.key === 'Enter' && event.target.tagName === 'INPUT' && event.target.type === 'text') {
        event.preventDefault();
        applyValue();
      }
    });

    editor.editing.view.addObserver(ClickObserver);
    this.listenTo(viewDocument, 'click', (evt, data) => {
      const selectedView = data.target;
      if (!selectedView) {
        return;
      }

      let detailsView = selectedView;

      while (detailsView && !detailsView.is('element', 'details')) {
        detailsView = detailsView.parent;
      }

      if (!detailsView) {
        if (isFormOpen) {
          closeForm();
        }
        return;
      }

      const detailElement = editor.editing.mapper.toModelElement(detailsView);
      if (detailElement && detailElement.is('element', 'detail')) {
        const target = editor.editing.view.domConverter.mapViewToDom(detailsView);
        if (target) {
          // Show properties without moving the caret out of the clicked content.
          openForm(detailElement, target, false);
        }
      }
    }, { priority: 'lowest' });

    editor.ui.componentFactory.add('detail', (locale) => {
      const buttonView = new ButtonView(locale);

      buttonView.set({
        label: Drupal.t('Add details'),
        icon,
        tooltip: true,
      });

      buttonView.bind('isEnabled').to(command, 'isEnabled');

      this.listenTo(buttonView, 'execute', () => {
        openForm(getSelectedDetail(editor.model.document.selection), buttonView.element);
      });

      return buttonView;
    });
  }
}
