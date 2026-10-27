import { serializeXhtmlChildren } from "./xhtmlSerializer";
import { promoteStyledSuperscripts } from "../html/superscript";
import { promoteBulletParagraphs } from "../html/lists";

const REMOVE_SELECTORS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "source",
  "track",
  "link",
  "meta",
  "base",
  "form",
  "button",
  "input",
  "select",
  "textarea",
  "video",
  "audio",
  "svg",
  "canvas"
];

export function sanitizeForEpub(contentHtml: string, assetHrefByUrl = new Map<string, string>()): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<article>${contentHtml}</article>`, "text/html");
  const root = doc.querySelector("article") ?? doc.body;

  for (const node of root.querySelectorAll(REMOVE_SELECTORS.join(","))) {
    node.remove();
  }

  promoteStyledSuperscripts(root);
  promoteBulletParagraphs(root);

  for (const element of root.querySelectorAll<HTMLElement>("*")) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || name === "style") {
        element.removeAttribute(attribute.name);
      }
    }
  }

  for (const image of root.querySelectorAll<HTMLImageElement>("img")) {
    const src = image.getAttribute("data-asset-url") ?? image.getAttribute("src") ?? "";
    const href = assetHrefByUrl.get(src);
    if (href) {
      image.setAttribute("src", href);
      image.removeAttribute("data-asset-url");
      image.removeAttribute("srcset");
      continue;
    }

    const alt = image.alt?.trim();
    const replacement = doc.createElement("p");
    replacement.className = "image-skipped";
    replacement.textContent = alt ? `Image skipped: ${alt}` : "Image skipped during conversion.";
    image.replaceWith(replacement);
  }

  return serializeXhtmlChildren(root).trim();
}

export function wrapXhtmlDocument(title: string, bodyHtml: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
  <head>
    <title>${escapeXml(title)}</title>
    <link rel="stylesheet" type="text/css" href="../styles/article.css" />
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>
`;
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
