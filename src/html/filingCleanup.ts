const GENERIC_TITLE = /^(document|untitled|untitled article|s-1|form s-1|sec document|registration statement)$/i;

const SKIP_HEADING =
  /^(united states|securities and exchange commission|washington,? d\.?c\.?(?:\s+\d+)?|form s-1|registration statement|preliminary prospectus|prospectus|table of contents|the securities act of 1933|under|securities act of 1933)$/i;

const COMPANY_NAME = /\b(?:Inc\.|Incorporated|PBC|Corp\.|Corporation|Ltd\.|L\.P\.|LLC|N\.V\.|S\.A\.)(?![\w])/;

const SEC_WRAPPERS = ["type", "sequence", "filename", "description", "text", "document", "sec-document", "sec-header"];

export function isGenericDocumentTitle(title: string | undefined): boolean {
  return !title?.trim() || GENERIC_TITLE.test(title.trim());
}

export function stripSecSubmissionWrapper(root: ParentNode): void {
  // EDGAR full-submission files leave these tags unclosed, so the HTML parser nests the
  // entire filing inside them. Unwrap instead of deleting, and drop only the short label text.
  for (const element of Array.from(root.querySelectorAll(SEC_WRAPPERS.join(",")))) {
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType !== Node.TEXT_NODE && node.nodeType !== Node.COMMENT_NODE) continue;
      if ((node.textContent ?? "").trim().length <= 120) node.remove();
    }
    element.replaceWith(...Array.from(element.childNodes));
  }
  for (const title of Array.from(root.querySelectorAll("body title, article title"))) title.remove();
}

export function promotePrintHeadings(root: ParentNode): void {
  const doc = ownerDocument(root);
  if (!doc) return;

  for (const block of Array.from(root.querySelectorAll<HTMLElement>("div,p"))) {
    if (block.closest("table,h1,h2,h3,h4,li,figcaption")) continue;
    if (!isLeafBlock(block)) continue;
    const text = cleanText(block);
    if (!isPrintHeading(block, text)) continue;

    const heading = doc.createElement(headingTag(block, text));
    while (block.firstChild) heading.appendChild(block.firstChild);
    block.replaceWith(heading);
  }
}

export function filingDisplayTitle(document: Document): string | undefined {
  const current = document.title?.replace(/\s+/g, " ").trim();
  if (current && !isGenericDocumentTitle(current)) return current;
  return findCompanyName(document);
}

export function findCompanyName(document: Document): string | undefined {
  for (const element of document.querySelectorAll<HTMLElement>("h1,h2,font")) {
    const text = cleanText(element);
    if (text.length < 4 || text.length > 80) continue;
    if (SKIP_HEADING.test(text)) continue;
    if (!COMPANY_NAME.test(text)) continue;
    if (element.closest("table") && element.localName === "font") continue;
    return text;
  }
  return undefined;
}

function isPrintHeading(block: HTMLElement, text: string): boolean {
  if (text.length < 3 || text.length > 170) return false;
  if (/[.?!]$/.test(text) || text.startsWith("(")) return false;
  if (SKIP_HEADING.test(text)) return false;

  const blockStyle = (block.getAttribute("style") ?? "").toLowerCase();
  if (/text-indent\s*:/.test(blockStyle)) return false;
  if (/text-align\s*:\s*justify/.test(blockStyle)) return false;

  const fontStyle = fontStyleOf(block);
  if (!/font-weight\s*:\s*(bold|[6-9]00)/.test(fontStyle) && !/font-weight\s*:\s*(bold|[6-9]00)/.test(blockStyle)) return false;

  const size = fontSizePt(fontStyle) ?? fontSizePt(blockStyle) ?? 10;
  const caps = isAllCaps(text);
  if (size >= 14) return true;
  if (!caps && size < 10) return false;
  if (!caps && !/margin-top\s*:/.test(blockStyle)) return false;
  if (!caps && (text.includes(",") || /\d{3,}/.test(text))) return false;
  return true;
}

function headingTag(block: HTMLElement, text: string): "h1" | "h2" | "h3" {
  const size = fontSizePt(fontStyleOf(block)) ?? fontSizePt(block.getAttribute("style") ?? "") ?? 10;
  if (size >= 14) return "h1";
  if (isAllCaps(text) || size >= 12) return "h2";
  return "h3";
}

function isLeafBlock(block: HTMLElement): boolean {
  return !block.querySelector("div,p,table,ul,ol,h1,h2,h3");
}

function fontStyleOf(block: HTMLElement): string {
  const font = block.querySelector("font,span");
  return (font?.getAttribute("style") ?? block.getAttribute("style") ?? "").toLowerCase();
}

function fontSizePt(style: string): number | undefined {
  const match = /font-size\s*:\s*([\d.]+)pt/.exec(style.toLowerCase());
  if (!match) return undefined;
  const value = Number.parseFloat(match[1] ?? "");
  return Number.isFinite(value) ? value : undefined;
}

function isAllCaps(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, "");
  return letters.length >= 4 && letters === letters.toUpperCase();
}

function cleanText(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

function ownerDocument(root: ParentNode): Document | undefined {
  const node = root as Node;
  if (node.nodeType === Node.DOCUMENT_NODE) return root as Document;
  return node.ownerDocument ?? undefined;
}
