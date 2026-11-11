(function (Drupal) {
  'use strict';

  Drupal.ckeditorDetailsDataAttributes = {
    create: function (container, options) {
      options = options || {};
      var doc = container.ownerDocument;
      var rows = doc.createElement('div');
      var add = doc.createElement('button');
      var error = doc.createElement('div');
      rows.className = 'ck-details-data-rows';
      add.type = 'button';
      add.className = 'ck-details-data-add';
      add.textContent = Drupal.t('Add data attribute');
      error.className = 'ck-details-data-error';
      error.setAttribute('role', 'alert');
      container.appendChild(rows);
      container.appendChild(add);
      container.appendChild(error);

      function addRow(entry) {
        var row = doc.createElement('div');
        var target = doc.createElement('select');
        var prefix = doc.createElement('span');
        var suffix = doc.createElement('input');
        var value = doc.createElement('input');
        var remove = doc.createElement('button');
        row.className = 'ck-details-data-row';
        target.className = 'ck-details-data-target';
        target.setAttribute('aria-label', Drupal.t('Data attribute element'));
        [
          ['detail', Drupal.t('Details')],
          ['detailSummary', Drupal.t('Summary')],
          ['detailWrapper', Drupal.t('Content wrapper')],
        ].forEach(function (item) {
          var option = doc.createElement('option');
          option.value = item[0];
          option.textContent = item[1];
          target.appendChild(option);
        });
        suffix.type = 'text';
        prefix.textContent = 'data-';
        prefix.setAttribute('aria-hidden', 'true');
        suffix.className = 'ck-details-data-suffix';
        suffix.setAttribute('aria-label', Drupal.t('Data attribute suffix'));
        suffix.placeholder = Drupal.t('Suffix (e.g. feature)');
        value.type = 'text';
        value.className = 'ck-details-data-value';
        value.setAttribute('aria-label', Drupal.t('Data attribute value'));
        value.placeholder = Drupal.t('Value');
        remove.type = 'button';
        remove.className = 'ck-details-data-remove';
        remove.textContent = Drupal.t('Remove');
        remove.setAttribute('aria-label', Drupal.t('Remove data attribute'));
        target.value = entry.target;
        suffix.value = entry.suffix;
        value.value = entry.value;
        remove.addEventListener('click', function () {
          row.remove();
          error.textContent = '';
        });
        row.appendChild(target);
        row.appendChild(prefix);
        row.appendChild(suffix);
        row.appendChild(value);
        row.appendChild(remove);
        rows.appendChild(row);
        return suffix;
      }

      add.addEventListener('click', function () {
        addRow({ target: 'detail', suffix: '', value: '' }).focus();
      });

      return {
        showError: function (message) {
          error.textContent = message;
        },
        setEntries: function (entries) {
          rows.textContent = '';
          error.textContent = '';
          entries.forEach(addRow);
        },
        getEntries: function () {
          var entries = [];
          var seen = new Set();
          var rowElements = rows.querySelectorAll('.ck-details-data-row');
          error.textContent = '';
          for (var i = 0; i < rowElements.length; i++) {
            var row = rowElements[i];
            var suffix = row.querySelector('.ck-details-data-suffix');
            var name = suffix.value.trim().replace(/[A-Z]/g, function (letter) {
              return letter.toLowerCase();
            });
            var target = row.querySelector('.ck-details-data-target').value;
            if (!name || /[\s"'<>/=\u0000-\u001f\u007f]/.test(name)) {
              error.textContent = Drupal.t('Enter a valid data attribute suffix without spaces or HTML attribute delimiters.');
              suffix.focus();
              return null;
            }
            try {
              doc.createElement('div').setAttribute('data-' + name, '');
            } catch (exception) {
              if (exception.name !== 'InvalidCharacterError') {
                throw exception;
              }
              error.textContent = Drupal.t('Enter a valid data attribute suffix.');
              suffix.focus();
              return null;
            }
            if (name.indexOf('cke-') === 0) {
              error.textContent = Drupal.t('The cke- prefix is reserved for CKEditor.');
              suffix.focus();
              return null;
            }
            if (options.reservedSuffixes && options.reservedSuffixes.indexOf(name) !== -1) {
              error.textContent = Drupal.t('This data attribute is reserved for CKEditor.');
              suffix.focus();
              return null;
            }
            var key = target + ':' + name;
            if (seen.has(key)) {
              error.textContent = Drupal.t('Each data attribute must have a unique suffix on its selected element.');
              suffix.focus();
              return null;
            }
            seen.add(key);
            entries.push({
              target: target,
              suffix: name,
              value: row.querySelector('.ck-details-data-value').value,
            });
          }
          return entries;
        },
      };
    },
  };
}(Drupal));
