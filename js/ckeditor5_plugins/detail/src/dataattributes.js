export function getDetailElements(detail) {
  const elements = { detail };
  for (const child of detail.getChildren()) {
    if (child.is('element', 'detailSummary') || child.is('element', 'detailWrapper')) {
      elements[child.name] = child;
    }
  }
  return elements;
}

export function getDataAttributeEntries(elements) {
  const entries = [];
  for (const [target, element] of Object.entries(elements)) {
    const attributes = element.getAttribute('dataAttributes') || {};
    for (const [name, value] of Object.entries(attributes)) {
      if (name.startsWith('data-') && !name.startsWith('data-cke-')) {
        entries.push({ target, suffix: name.slice(5), value });
      }
    }
  }
  return entries;
}

export function setDataAttributeEntries(writer, elements, entries) {
  for (const [target, element] of Object.entries(elements)) {
    const attributes = Object.fromEntries(
      Object.entries(element.getAttribute('dataAttributes') || {})
        .filter(([name]) => name.startsWith('data-cke-')),
    );
    for (const entry of entries) {
      if (entry.target === target) {
        attributes['data-' + entry.suffix] = entry.value;
      }
    }
    if (Object.keys(attributes).length) {
      writer.setAttribute('dataAttributes', attributes, element);
    } else {
      writer.removeAttribute('dataAttributes', element);
    }
  }
}
