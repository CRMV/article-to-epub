const SUPERSCRIPT_SELECTOR = "font[style],span[style],a[style],sup[style]";

export function promoteStyledSuperscripts(root: ParentNode): void {
  const rootNode = root as Node;
  const doc = rootNode.nodeType === Node.DOCUMENT_NODE ? (root as Document) : rootNode.ownerDocument;
  if (!doc) return;

  for (const element of Array.from(root.querySelectorAll<HTMLElement>(SUPERSCRIPT_SELECTOR))) {
    if (element.localName === "sup") {
      element.classList.add("noteref");
      continue;
    }

    const style = element.getAttribute("style") ?? "";
    if (!looksLikeSuperscript(style)) continue;

    const sup = doc.createElement("sup");
    sup.className = mergedClassName(element.className, "noteref");

    if (element.localName === "a") {
      const anchor = doc.createElement("a");
      for (const attribute of Array.from(element.attributes)) {
        if (attribute.name === "style" || attribute.name === "class") continue;
        anchor.setAttribute(attribute.name, attribute.value);
      }
      while (element.firstChild) {
        anchor.appendChild(element.firstChild);
      }
      sup.appendChild(anchor);
      element.replaceWith(sup);
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name === "style" || attribute.name === "class") continue;
      sup.setAttribute(attribute.name, attribute.value);
    }

    while (element.firstChild) {
      sup.appendChild(element.firstChild);
    }
    element.replaceWith(sup);
  }
}

function looksLikeSuperscript(style: string): boolean {
  const normalized = style.toLowerCase();
  if (/vertical-align\s*:\s*(super|text-top)/.test(normalized)) return true;
  return /position\s*:\s*relative/.test(normalized) && /top\s*:\s*-\s*(?:\d|\.)/.test(normalized);
}

function mergedClassName(current: string, added: string): string {
  const classes = new Set(current.split(/\s+/).filter(Boolean));
  classes.add(added);
  return Array.from(classes).join(" ");
}
