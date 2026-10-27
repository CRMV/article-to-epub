interface BoxStyle {
  top?: number | undefined;
  left?: number | undefined;
  width?: number | undefined;
  fontSize?: number | undefined;
  bold: boolean;
  italic: boolean;
  align: string;
}

interface TextRun {
  left: number;
  width: number;
  text: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  sup: boolean;
}

interface FlowLine {
  kind: "line";
  page: number;
  top: number;
  left: number;
  text: string;
  html: string;
  fontSize: number;
  bold: boolean;
  centered: boolean;
  full: boolean;
}

interface FlowBlock {
  kind: "block";
  page: number;
  top: number;
  html: string;
}

type FlowItem = FlowLine | FlowBlock;

const PAGE_STYLE = /position\s*:\s*relative/i;
const MIN_PAGES = 2;

export function linearizePositionedProspectus(doc: Document): boolean {
  const pages = findPageFrames(doc);
  if (pages.length < MIN_PAGES) return false;

  const items: FlowItem[] = [];
  pages.forEach((page, index) => {
    items.push(...extractPage(page, index));
  });

  const chrome = repeatedEdgeText(items, pages.length);
  const kept = items.filter((item) => !isRunningChrome(item, chrome));
  const html = renderFlow(kept);
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length < 180) return false;

  doc.body.replaceChildren();
  doc.body.innerHTML = html;
  return true;
}

function findPageFrames(doc: Document): HTMLElement[] {
  const matches = Array.from(doc.querySelectorAll<HTMLElement>("div[style]")).filter((element) => {
    const style = element.getAttribute("style") ?? "";
    if (!PAGE_STYLE.test(style) || !/overflow\s*:\s*hidden/i.test(style)) return false;
    const height = stylePt(style, "height");
    const width = stylePt(style, "width");
    return height !== undefined && width !== undefined && height >= 700 && height <= 1100 && width >= 500 && width <= 900;
  });

  return matches.filter((element) => !matches.some((other) => other !== element && other.contains(element)));
}

function extractPage(page: HTMLElement, pageIndex: number): FlowItem[] {
  const pageHeight = stylePt(page.getAttribute("style") ?? "", "height") ?? 792;
  const pageWidth = stylePt(page.getAttribute("style") ?? "", "width") ?? 612;
  const tables = outerTables(page);
  const lines = pageLevelLines(page, tables);
  const items: FlowItem[] = [];

  for (const line of lines) {
    const image = line.querySelector("img");
    if (image && !(line.textContent ?? "").replace(/\s+/g, "").length) {
      const html = imageHtml(image);
      const top = ancestorTop(line, page) ?? 0;
      if (html) items.push({ kind: "block", page: pageIndex, top, html });
      continue;
    }

    const flow = lineFromElement(line, pageIndex, pageWidth);
    if (flow) items.push(flow);
  }

  for (const table of tables) {
    const html = tableHtml(table);
    if (!html) continue;
    items.push({
      kind: "block",
      page: pageIndex,
      top: ancestorTop(table, page) ?? 0,
      html
    });
  }

  return items
    .filter((item) => !isEdgeMarker(item, pageHeight))
    .sort((a, b) => a.top - b.top || (a.kind === "line" ? a.left : 0) - (b.kind === "line" ? b.left : 0));
}

function outerTables(page: HTMLElement): HTMLTableElement[] {
  return Array.from(page.querySelectorAll<HTMLTableElement>("table")).filter((table) => !table.parentElement?.closest("table"));
}

function pageLevelLines(page: HTMLElement, tables: HTMLTableElement[]): HTMLElement[] {
  const tableSet = new Set<HTMLElement>(tables);
  const withTop = Array.from(page.querySelectorAll<HTMLElement>("[style]")).filter((element) => {
    if (element === page || !isLineBox(element)) return false;
    if (element.closest("table")) return false;
    return true;
  });
  const containers = new Set<HTMLElement>();
  for (const element of withTop) {
    let parent = element.parentElement;
    while (parent && parent !== page) {
      containers.add(parent);
      parent = parent.parentElement;
    }
  }

  return withTop.filter((element) => {
    if (containers.has(element)) return false;
    if (element.querySelector("table")) return false;
    if (Array.from(tableSet).some((table) => element.contains(table))) return false;
    return true;
  });
}

function lineFromElement(element: HTMLElement, page: number, pageWidth: number): FlowLine | undefined {
  const style = readStyle(element);
  const top = style.top;
  if (top === undefined) return undefined;

  const runs = textRuns(element);
  const html = renderRuns(runs);
  const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (!text) return undefined;

  const mainSize = dominantSize(runs) || style.fontSize || 10;
  const bold = runs.length > 0 && runs.every((run) => run.bold || !run.text.trim());
  const left = runs.find((run) => run.text.trim())?.left ?? style.left ?? 0;
  const centered = style.align === "center" || (left > pageWidth * 0.28 && text.length < 80);
  const full = text.length > 70 || left + estimateTextWidth(text, mainSize) > pageWidth * 0.72;

  return {
    kind: "line",
    page,
    top,
    left,
    text,
    html,
    fontSize: mainSize,
    bold,
    centered,
    full
  };
}

function textRuns(element: HTMLElement): TextRun[] {
  const fonts = Array.from(element.querySelectorAll<HTMLElement>("font"));
  const nodes = fonts.length > 0 ? fonts : [element];
  const mainSize = dominantSize(
    nodes.map((node) => ({ fontSize: readStyle(node).fontSize ?? 10, text: node.textContent ?? "" }))
  );

  return nodes
    .map((node) => {
      const style = readStyle(node);
      const text = (node.textContent ?? "").replace(/\u00a0/g, " ");
      const fontSize = style.fontSize ?? mainSize ?? 10;
      return {
        left: style.left ?? 0,
        width: style.width ?? Math.max(fontSize * 0.45, estimateTextWidth(text, fontSize)),
        text,
        fontSize,
        bold: style.bold,
        italic: style.italic,
        sup: Boolean(mainSize && fontSize <= mainSize * 0.75 && text.trim().length > 0 && text.trim().length <= 4)
      };
    })
    .filter((run) => run.text.trim().length > 0)
    .sort((a, b) => a.left - b.left);
}

function renderRuns(runs: TextRun[]): string {
  let html = "";
  let previousRight = Number.NEGATIVE_INFINITY;
  let previousSize = 10;

  for (const run of runs) {
    const gap = run.left - previousRight;
    if (html && !run.sup && gap > Math.max(previousSize * 0.9, 4) && !/\s$/.test(html) && !/^\s/.test(run.text)) html += " ";
    let piece = escapeHtml(run.text);
    if (run.sup) piece = `<sup>${piece}</sup>`;
    else if (run.bold) piece = `<strong>${piece}</strong>`;
    if (run.italic) piece = `<em>${piece}</em>`;
    html += piece;
    previousRight = run.left + run.width;
    previousSize = run.fontSize;
  }

  return html.replace(/[ \t]{2,}/g, " ").trim();
}

function tableHtml(table: HTMLTableElement): string | undefined {
  const rows: string[] = [];
  for (const row of Array.from(table.rows)) {
    const cells: string[] = [];
    let any = false;
    for (const cell of Array.from(row.cells)) {
      const html = cellHtml(cell);
      if (html.replace(/<[^>]+>/g, "").replace(/\s+/g, "").length > 0) any = true;
      const colspan = cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : "";
      const rowspan = cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : "";
      cells.push(`<td${colspan}${rowspan}>${html}</td>`);
    }
    if (any) rows.push(`<tr>${cells.join("")}</tr>`);
  }
  if (rows.length === 0) return undefined;
  return `<table><tbody>${rows.join("")}</tbody></table>`;
}

function cellHtml(cell: HTMLTableCellElement): string {
  const lines = Array.from(cell.querySelectorAll<HTMLElement>("[style]"))
    .filter((element) => isLineBox(element) && !Array.from(element.querySelectorAll<HTMLElement>("[style]")).some(isLineBox))
    .sort((a, b) => (readStyle(a).top ?? 0) - (readStyle(b).top ?? 0));

  if (lines.length === 0) {
    const images = Array.from(cell.querySelectorAll("img")).map((image) => imageHtml(image)).filter(Boolean);
    const text = (cell.textContent ?? "").replace(/\s+/g, " ").trim();
    return [text ? escapeHtml(text) : "", ...images].filter(Boolean).join("<br/>");
  }

  const rendered = lines
    .map((line) => lineFromElement(line, 0, 400)?.html)
    .filter((html): html is string => Boolean(html));
  const images = Array.from(cell.querySelectorAll("img")).map((image) => imageHtml(image)).filter(Boolean);
  return [...rendered, ...images].join("<br/>");
}

function imageHtml(image: HTMLImageElement): string | undefined {
  const src = image.getAttribute("src")?.trim();
  if (!src || src.startsWith("data:")) return undefined;
  const style = image.getAttribute("style") ?? "";
  const width = stylePt(style, "width");
  const height = stylePt(style, "height");
  if (width !== undefined && height !== undefined && width < 12 && height < 12) return undefined;
  const alt = image.getAttribute("alt")?.trim() ?? "";
  const widthAttr = width ? ` width="${Math.round(width * (96 / 72))}"` : "";
  const heightAttr = height ? ` height="${Math.round(height * (96 / 72))}"` : "";
  return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}"${widthAttr}${heightAttr}/>`;
}

function renderFlow(items: FlowItem[]): string {
  const parts: string[] = [];
  let paragraph: FlowLine[] = [];
  let list: FlowLine[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    if (paragraph.length === 1 && isHeading(paragraph[0]!)) {
      const line = paragraph[0]!;
      parts.push(`<${headingTag(line)}>${stripStrong(line.html)}</${headingTag(line)}>`);
    } else {
      parts.push(`<p>${joinHtml(paragraph.map((line) => line.html))}</p>`);
    }
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    const ordered = list.every((line) => /^\d+[.)]/.test(line.text));
    const itemsHtml = list
      .map((line) => `<li>${line.html.replace(/^(?:•|·|●|–|—|-|\d+[.)]|\([a-z0-9]+\))\s*/i, "")}</li>`)
      .join("");
    parts.push(ordered ? `<ol>${itemsHtml}</ol>` : `<ul>${itemsHtml}</ul>`);
    list = [];
  };

  for (const item of items) {
    if (item.kind === "block") {
      flushParagraph();
      flushList();
      parts.push(item.html);
      continue;
    }

    if (isBullet(item)) {
      flushParagraph();
      list.push(item);
      continue;
    }

    flushList();
    const previous = paragraph[paragraph.length - 1];
    if (previous && !joinable(previous, item)) flushParagraph();
    paragraph.push(item);
  }

  flushParagraph();
  flushList();
  return parts.join("\n");
}

function joinable(previous: FlowLine, next: FlowLine): boolean {
  if (isHeading(previous) || isHeading(next)) return false;
  if (previous.bold !== next.bold) return false;
  if (Math.abs(previous.fontSize - next.fontSize) > 0.6) return false;

  if (previous.page !== next.page) {
    return previous.full && Math.abs(previous.left - next.left) < 18;
  }

  const gap = next.top - previous.top;
  if (gap > Math.max(previous.fontSize * 1.9, 16)) return false;
  if (next.left - previous.left > 14 && gap > previous.fontSize) return false;
  return true;
}

function isHeading(line: FlowLine): boolean {
  if (!line.bold) return false;
  if (line.text.length < 3 || line.text.length > 160) return false;
  if (/[.?!]$/.test(line.text)) return false;
  const caps = isAllCaps(line.text);
  if (line.fontSize >= 13) return true;
  if (caps && line.fontSize >= 9) return true;
  if (line.centered && line.fontSize >= 11 && line.text.length <= 90) return true;
  return line.fontSize >= 10.5 && line.text.length <= 80;
}

function headingTag(line: FlowLine): "h1" | "h2" | "h3" {
  if (line.fontSize >= 15) return "h1";
  if (isAllCaps(line.text) || line.fontSize >= 12) return "h2";
  return "h3";
}

function isBullet(line: FlowLine): boolean {
  return /^(?:•|·|●|–|—|-)\s+\S/.test(line.text) || /^\(\w{1,4}\)\s+\S/.test(line.text) || /^\d{1,2}[.)]\s+\S/.test(line.text);
}

function isEdgeMarker(item: FlowItem, pageHeight: number): boolean {
  if (item.kind !== "line") return false;
  const edge = item.top < 32 || item.top > pageHeight - 46;
  if (!edge) return /^table of contents$/i.test(item.text);
  return /^(?:table of contents|\d{1,4}|[ivxlcdm]{1,8})$/i.test(item.text);
}

function repeatedEdgeText(items: FlowItem[], pageCount: number): Set<string> {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.kind !== "line" || item.text.length > 48) continue;
    if (item.top > 80 && item.top < 700) continue;
    counts.set(item.text, (counts.get(item.text) ?? 0) + 1);
  }
  const threshold = Math.max(3, Math.floor(pageCount * 0.15));
  return new Set([...counts].filter(([, count]) => count >= threshold).map(([text]) => text));
}

function isRunningChrome(item: FlowItem, chrome: Set<string>): boolean {
  return item.kind === "line" && chrome.has(item.text);
}

function joinHtml(parts: string[]): string {
  let html = "";
  for (const part of parts) {
    if (!html) {
      html = part;
      continue;
    }
    if (html.endsWith("-") && /^[a-z]/.test(part)) html = `${html.slice(0, -1)}${part}`;
    else if (/\s$/.test(html) || /^\s/.test(part)) html += part;
    else html += ` ${part}`;
  }
  return html.replace(/[ \t]{2,}/g, " ").trim();
}

function stripStrong(html: string): string {
  return html.replace(/<\/?strong>/g, "");
}

function ancestorTop(element: Element, page: Element): number | undefined {
  let current: Element | null = element;
  while (current && current !== page) {
    if (!current.closest("table") || current === element) {
      const top = readStyle(current).top;
      if (top !== undefined && !current.parentElement?.closest("table")) return top;
    }
    current = current.parentElement;
  }
  return readStyle(element).top;
}

function dominantSize(runs: Array<{ fontSize: number; text: string }>): number | undefined {
  const scored = new Map<number, number>();
  for (const run of runs) {
    const weight = run.text.trim().length;
    if (!weight) continue;
    scored.set(run.fontSize, (scored.get(run.fontSize) ?? 0) + weight);
  }
  let best: number | undefined;
  let bestScore = 0;
  for (const [size, score] of scored) {
    if (score > bestScore) {
      best = size;
      bestScore = score;
    }
  }
  return best;
}

function isLineBox(element: HTMLElement): boolean {
  if (element.localName === "font" || element.localName === "span" || element.localName === "a") return false;
  return readStyle(element).top !== undefined;
}

function readStyle(element: Element): BoxStyle {
  const style = element.getAttribute("style") ?? "";
  const weight = styleValue(style, "font-weight") ?? "";
  return {
    top: stylePt(style, "top"),
    left: stylePt(style, "left"),
    width: stylePt(style, "width"),
    fontSize: stylePt(style, "font-size"),
    bold: /bold|[6-9]00/.test(weight),
    italic: /italic/.test(styleValue(style, "font-style") ?? ""),
    align: styleValue(style, "text-align") ?? ""
  };
}

function styleValue(style: string, property: string): string | undefined {
  const match = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, "i").exec(style);
  return match?.[1]?.trim().toLowerCase();
}

function stylePt(style: string, property: string): number | undefined {
  const value = styleValue(style, property);
  if (!value) return undefined;
  const match = /^(-?[\d.]+)pt$/.exec(value.trim());
  if (!match) return undefined;
  const parsed = Number.parseFloat(match[1] ?? "");
  return Number.isFinite(parsed) ? parsed : undefined;
}

function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.48;
}

function isAllCaps(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, "");
  return letters.length >= 4 && letters === letters.toUpperCase();
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
