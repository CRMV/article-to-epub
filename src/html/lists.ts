const BULLET_PATTERN = /^\s*[•\u2022]\s*/;

export function promoteBulletParagraphs(root: ParentNode): void {
  const doc = (root as Node).nodeType === Node.DOCUMENT_NODE ? (root as Document) : (root as Node).ownerDocument;
  if (!doc) return;

  for (const paragraph of Array.from(root.querySelectorAll<HTMLParagraphElement>("p"))) {
    if (!BULLET_PATTERN.test(paragraph.textContent ?? "")) continue;

    removeLeadingBullet(paragraph);
    const item = doc.createElement("li");
    while (paragraph.firstChild) {
      item.appendChild(paragraph.firstChild);
    }
    removeEmptyInlineChildren(item);

    const previousList = paragraph.previousElementSibling?.matches('ul[data-generated-list="true"]')
      ? (paragraph.previousElementSibling as HTMLUListElement)
      : undefined;
    if (previousList) {
      previousList.appendChild(item);
      paragraph.remove();
      continue;
    }

    const list = doc.createElement("ul");
    list.setAttribute("data-generated-list", "true");
    list.appendChild(item);
    paragraph.replaceWith(list);
  }

  for (const list of root.querySelectorAll<HTMLUListElement>('ul[data-generated-list="true"]')) {
    list.removeAttribute("data-generated-list");
  }
}

function removeLeadingBullet(element: Element): void {
  const showText = element.ownerDocument.defaultView?.NodeFilter.SHOW_TEXT ?? 4;
  const walker = element.ownerDocument.createTreeWalker(element, showText);
  let node = walker.nextNode() as Text | null;
  while (node) {
    if (BULLET_PATTERN.test(node.data)) {
      node.data = node.data.replace(BULLET_PATTERN, "");
      return;
    }
    if (node.data.trim()) return;
    node = walker.nextNode() as Text | null;
  }
}

function removeEmptyInlineChildren(element: Element): void {
  for (const child of Array.from(element.querySelectorAll("span"))) {
    if (!child.attributes.length && !(child.textContent ?? "").trim()) {
      child.remove();
    }
  }
}
