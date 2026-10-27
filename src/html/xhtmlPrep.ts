const GLOBAL_ATTRIBUTES = new Set(["id", "class"]);

const ATTRIBUTES_BY_TAG: Record<string, Set<string>> = {
  a: new Set(["href", "rel"]),
  img: new Set(["alt", "src", "width", "height", "data-asset-url"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
  ol: new Set(["start"]),
  blockquote: new Set(["cite"])
};

const UNWRAP_TAGS = ["font", "center", "nobr", "strike", "tt", "big", "type", "sequence", "filename", "description", "document", "text", "sec-header", "sec-document"];

export function captureImageDimensions(root: ParentNode): void {
  for (const image of root.querySelectorAll<HTMLImageElement>("img")) {
    const style = image.getAttribute("style") ?? "";
    const width = image.getAttribute("width") || cssPx(style, "width");
    const height = image.getAttribute("height") || cssPx(style, "height");
    if (width) image.setAttribute("width", String(width));
    if (height) image.setAttribute("height", String(height));
  }
}

export function stripUnsafeAttributes(root: ParentNode): void {
  for (const element of root.querySelectorAll<HTMLElement>("*")) {
    const allowed = new Set([...GLOBAL_ATTRIBUTES, ...(ATTRIBUTES_BY_TAG[element.localName] ?? [])]);
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || name === "style" || name === "srcdoc" || name === "poster" || name === "background") {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (!allowed.has(name)) element.removeAttribute(attribute.name);
    }
  }
}

export function unwrapObsoleteElements(root: ParentNode): void {
  for (const element of Array.from(root.querySelectorAll(UNWRAP_TAGS.join(",")))) {
    const parent = element.parentNode;
    if (!parent) continue;
    while (element.firstChild) parent.insertBefore(element.firstChild, element);
    element.remove();
  }
}

export function removeEmptyTables(root: ParentNode): void {
  for (const row of Array.from(root.querySelectorAll("tr"))) {
    const text = (row.textContent ?? "").replace(/\s+/g, "");
    if (!text && !row.querySelector("img")) row.remove();
  }
  for (const table of Array.from(root.querySelectorAll("table"))) {
    const text = (table.textContent ?? "").replace(/\s+/g, "");
    if (!text && !table.querySelector("img")) table.remove();
  }
}

export function meaningfulImageAlt(alt: string | null | undefined): string | undefined {
  const trimmed = alt?.replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  if (/\.(avif|gif|jpe?g|png|webp|svg)$/i.test(trimmed)) return undefined;
  if (trimmed.length > 180) return undefined;
  return trimmed;
}

function cssPx(style: string, property: string): string | undefined {
  const match = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([\\d.]+)(px|pt)\\b`, "i").exec(style);
  if (!match) return undefined;
  const value = Number.parseFloat(match[1] ?? "");
  if (!Number.isFinite(value) || value <= 0) return undefined;
  const px = match[2]?.toLowerCase() === "pt" ? value * (96 / 72) : value;
  return String(Math.round(px));
}
