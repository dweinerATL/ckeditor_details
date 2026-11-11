import { Plugin } from 'ckeditor5/src/core';
import { toWidget, toWidgetEditable } from 'ckeditor5/src/widget';
import { Widget } from 'ckeditor5/src/widget';
import InsertDetailCommand from './insertdetailcommand';

// cSpell:ignore detail insertdetailcommand

/**
 * CKEditor 5 plugins do not work directly with the DOM. They are defined as
 * plugin-specific data models that are then converted to markup that
 * is inserted in the DOM.
 *
 * CKEditor 5 internally interacts with detail as this model:
 * <detail>
 *    <detailSummary></detailSummary>
 *    <detailWrapper></detailWrapper>
 * </detail>
 *
 * Which is converted for the browser/user as this markup
 * <details>
 *   <summary></summary>
 *   <div class="details-wrapper"></div>
 * </section>
 *
 * This file has the logic for defining the detail model, and for how it is
 * converted to standard DOM markup.
 */
export default class DetailEditing extends Plugin {
  static get requires() {
    return [Widget];
  }

  init() {
    this._defineSchema();
    this._defineConverters();
    this.editor.commands.add(
      'insertDetail',
      new InsertDetailCommand(this.editor),
    );
    this._addEventListeners();
  }

  /*
   * This registers the structure that will be seen by CKEditor 5 as
   * <detail>
   *    <detailSummary></detailSummary>
   *    <detailWrapper></detailWrapper>
   * </detail>
   *
   * The logic in _defineConverters() will determine how this is converted to
   * markup.
   */
  _defineSchema() {
    // Schemas are registered via the central `editor` object.
    const schema = this.editor.model.schema;

    schema.register('detail', {
      // Behaves like a self-contained object (e.g. an image).
      isObject: true,
      // Allow in places where other blocks are allowed (e.g. directly in the root).
      allowWhere: '$block',
      // Allow optional HTML attributes on the <details> element.
      allowAttributes: ['name', 'open', 'dataAttributes'],
    });

    schema.register('detailSummary', {
      // This creates a boundary for external actions such as clicking and
      // and keypress. For example, when the cursor is inside this box, the
      // keyboard shortcut for "select all" will be limited to the contents of
      // the box.
      isLimit: true,
      // This is only to be used within detail.
      allowIn: 'detail',
      // Allow content that is allowed in blocks (e.g. text with attributes).
      allowContentOf: '$block',
      allowAttributes: ['dataAttributes'],
    });

    schema.register('detailWrapper', {
      isLimit: true,
      allowIn: 'detail',
      allowContentOf: '$root',
      allowAttributes: ['dataAttributes'],
    });
  }

  /**
   * Converters determine how CKEditor 5 models are converted into markup and
   * vice-versa.
   */
  _defineConverters() {
    // Converters are registered via the central editor object.
    const { conversion } = this.editor;

    // Upcast Converters: determine how existing HTML is interpreted by the
    // editor. These trigger when an editor instance loads.
    //
    // If <details> is present in the existing markup
    // processed by CKEditor, then CKEditor recognizes and loads it as a
    // <detail> model.
    conversion.for('upcast').elementToElement({
      model: (viewElement, { writer }) => {
        const attrs = getModelDataAttributes(viewElement);
        const nameAttr = viewElement.getAttribute('name');
        if (nameAttr) {
          attrs.name = nameAttr;
        }
        if (viewElement.hasAttribute('open')) {
          attrs.open = true;
        }
        return writer.createElement('detail', attrs);
      },
      view: matchElementWithDataAttributes('details'),
    });

    // If <summary> is present in the existing markup
    // processed by CKEditor, then CKEditor recognizes and loads it as a
    // <detailSummary> model, provided it is a child element of <detail>,
    // as required by the schema.
    conversion.for('upcast').elementToElement({
      model: (viewElement, { writer }) =>
        writer.createElement('detailSummary', getModelDataAttributes(viewElement)),
      view: matchElementWithDataAttributes('summary'),
    });

    // If <div class="details-wrapper"> is present in the existing markup
    // processed by CKEditor, then CKEditor recognizes and loads it as a
    // <detailWrapper> model, provided it is a child element of
    // <detail>, as required by the schema.
    conversion.for('upcast').elementToElement({
      model: (viewElement, { writer }) =>
        writer.createElement('detailWrapper', getModelDataAttributes(viewElement)),
      view: matchElementWithDataAttributes('div', 'details-wrapper'),
    });

    // Data Downcast Converters: converts stored model data into HTML.
    // These trigger when content is saved.
    //
    // Instances of <detail> are saved as
    // <details>{{inner content}}</details>.
    conversion.for('dataDowncast').elementToElement({
      model: { name: 'detail', attributes: ['dataAttributes'] },
      view: (modelElement, { writer }) =>
        writer.createContainerElement('details', getViewDataAttributes(modelElement)),
    });
    conversion.for('dataDowncast').attributeToAttribute({
      model: { name: 'detail', key: 'name' },
      view: 'name',
    });
    conversion.for('dataDowncast').attributeToAttribute({
      model: { name: 'detail', key: 'open' },
      view: { key: 'open', value: '' },
    });

    // Instances of <detailSummary> are saved as
    // <summary>{{inner content}}</summary>.
    conversion.for('dataDowncast').elementToElement({
      model: { name: 'detailSummary', attributes: ['dataAttributes'] },
      view: (modelElement, { writer }) =>
        writer.createContainerElement('summary', getViewDataAttributes(modelElement)),
    });

    // Instances of <detailWrapper> are saved as
    // <div class="details-wrapper">{{inner content}}</div>.
    conversion.for('dataDowncast').elementToElement({
      model: { name: 'detailWrapper', attributes: ['dataAttributes'] },
      view: (modelElement, { writer }) =>
        writer.createContainerElement('div', {
          ...getViewDataAttributes(modelElement),
          class: 'details-wrapper',
        }),
    });

    // Editing Downcast Converters. These render the content to the user for
    // editing, i.e. this determines what gets seen in the editor. These trigger
    // after the Data Upcast Converters, and are re-triggered any time there
    // are changes to any of the models' properties.
    //
    // Convert the <detail> model into a container widget in the editor UI.
    conversion.for('editingDowncast').elementToElement({
      model: {
        name: 'detail',
        attributes: ['name', 'open', 'dataAttributes'],
      },
      view: (modelElement, { writer: viewWriter }) => {
        const attrs = getViewDataAttributes(modelElement);
        const nameAttr = modelElement.getAttribute('name');
        if (nameAttr) {
          attrs.name = nameAttr;
        }
        if (modelElement.getAttribute('open')) {
          attrs.open = '';
        }
        const details = viewWriter.createContainerElement('details', attrs);

        return toWidget(details, viewWriter, { label: 'detail widget' });
      },
    });

    // Convert the <detailSummary> model into an editable <h2> widget.
    conversion.for('editingDowncast').elementToElement({
      model: { name: 'detailSummary', attributes: ['dataAttributes'] },
      view: (modelElement, { writer: viewWriter }) => {
        const summary = viewWriter.createEditableElement('summary', getViewDataAttributes(modelElement));
        return toWidgetEditable(summary, viewWriter);
      },
    });

    // Convert the <detailWrapper> model into an editable <div> widget.
    conversion.for('editingDowncast').elementToElement({
      model: { name: 'detailWrapper', attributes: ['dataAttributes'] },
      view: (modelElement, { writer: viewWriter }) => {
        const div = viewWriter.createEditableElement('div', {
          ...getViewDataAttributes(modelElement),
          class: 'details-wrapper',
        });
        return toWidgetEditable(div, viewWriter);
      },
    });
  }

  /**
   * Add event listeners to control the behavior of the details/summary elements.
   */
  _addEventListeners() {
    const editor = this.editor;
    const viewDocument = editor.editing.view.document;

    this.listenTo(viewDocument, 'blur', (evt, data) => {
      const target = data.domTarget;
      const isSummary = target.tagName.toLowerCase() === 'summary';

      if (isSummary) {
        if (target.innerHTML == '<br data-cke-filler="true">') {
          return;
        }

        // Check if summary text has any zero-width space characters.
        // If so, delete all occurrences.
        const zwsp_unicode = '\u200B';
        if (target.innerHTML.includes(zwsp_unicode)) {
          const markup = target.innerHTML.replace(new RegExp(zwsp_unicode, 'g'), '');
          const viewFragment = editor.data.processor.toView(markup);
          const modelFragment = editor.data.toModel(viewFragment);

          const currentSelection = editor.model.document.selection;
          const scopeElement = editor.model.schema.getLimitElement(currentSelection);
          const selection = editor.model.createSelection(scopeElement, 'in');

          editor.model.insertContent(modelFragment, selection);
        }
      }

    });

    this.listenTo(viewDocument, 'keydown', (evt, data) => {
      const isSummary = data.domTarget.tagName.toLowerCase() === 'summary';
      const isSpace = data.domEvent.key === ' ' || data.domEvent.code === 'Space' || data.domEvent.keyCode === 32;

      if (isSummary && isSpace) {
        // Direct insertion of a space as HTML will be ignored at the end of the summary.
        editor.execute('insertText', {
          text: ' ',
        });

        evt.stop();
        data.preventDefault();
      }
    });
  }
}

function getDataAttributes(viewElement) {
  return Array.from(viewElement.getAttributes())
    .filter(([name]) => name.startsWith('data-'));
}

function matchElementWithDataAttributes(name, requiredClass) {
  return (viewElement) => {
    if (viewElement.name !== name || (requiredClass && !viewElement.hasClass(requiredClass))) {
      return null;
    }

    return {
      name: true,
      attributes: getDataAttributes(viewElement).map(([key]) => key),
      ...(requiredClass ? { classes: [requiredClass] } : {}),
    };
  };
}

function getModelDataAttributes(viewElement) {
  const attributes = getDataAttributes(viewElement);
  return attributes.length ? { dataAttributes: Object.fromEntries(attributes) } : {};
}

function getViewDataAttributes(modelElement) {
  return { ...modelElement.getAttribute('dataAttributes') };
}
