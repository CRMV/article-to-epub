import { serializeXhtmlChildren } from "./xhtmlSerializer";

export interface TocEntry {
  id: string;
  level: number;
  label: string;
  href?: string;
}

export interface ChapterDocument {
  href: string;
  html: string;
  toc: TocEntry[];
}

export function extractTocEntries(contentHtml: string): TocEntry[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<article>${contentHtml}</article>`, "text/html");
  const entries: TocEntry[] = [];
  const usedIds = new Set<string>();

  for (const heading of doc.querySelectorAll<HTMLHeadingElement>("h1,h2,h3")) {
    const label = heading.textContent?.replace(/\s+/g, " ").trim();
    if (!label) continue;
    const level = Number.parseInt(heading.tagName.slice(1), 10);
    const id = uniqueId(heading.id || slugify(label), usedIds);
    heading.id = id;
    entries.push({ id, level, label });
  }

  return entries;
}

export function addHeadingIds(contentHtml: string): { html: string; toc: TocEntry[] } {
  const chapter = buildChapters(contentHtml, Number.POSITIVE_INFINITY)[0];
  return { html: chapter?.html ?? "", toc: chapter?.toc ?? [] };
}

export function buildChapters(contentHtml: string, maxChars = 160_000): ChapterDocument[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<article>${contentHtml}</article>`, "text/html");
  const root = doc.querySelector("article") ?? doc.body;
  const usedIds = new Set<string>();
  const toc: TocEntry[] = [];

  for (const heading of root.querySelectorAll<HTMLHeadingElement>("h1,h2,h3")) {
    const label = heading.textContent?.replace(/\s+/g, " ").trim();
    if (!label) continue;
    const level = Number.parseInt(heading.tagName.slice(1), 10);
    const id = uniqueId(heading.id || slugify(label), usedIds);
    heading.id = id;
    toc.push({ id, level, label });
  }

  flattenContainers(root);
  const serializedLength = serializeXhtmlChildren(root).length;
  const groups = serializedLength <= maxChars ? [[...root.children]] : splitChildren(root, maxChars);
  const multiple = groups.length > 1;

  return groups.map((group, index) => {
    const href = multiple ? `text/chapter-${String(index + 1).padStart(2, "0")}.xhtml` : "text/article.xhtml";
    const wrapper = doc.createElement("article");
    for (const element of group) wrapper.appendChild(element);
    const ids = new Set(Array.from(wrapper.querySelectorAll<HTMLElement>("[id]")).map((element) => element.id));
    return {
      href,
      html: serializeXhtmlChildren(wrapper),
      toc: toc.filter((entry) => ids.has(entry.id)).map((entry) => ({ ...entry, href: `${href}#${entry.id}` }))
    };
  });
}

function flattenContainers(root: Element): void {
  for (const element of Array.from(root.querySelectorAll("div,section,article")).reverse()) {
    moveIdToChild(element);
    element.replaceWith(...Array.from(element.childNodes));
  }
  for (const element of Array.from(root.querySelectorAll("span,a,b,strong,em,i,small,u")).reverse()) {
    if (!element.querySelector("p,h1,h2,h3,h4,h5,h6,table,ul,ol,blockquote,div,section,article,pre")) continue;
    moveIdToChild(element);
    element.replaceWith(...Array.from(element.childNodes));
  }
}

function moveIdToChild(element: Element): void {
  if (!element.id) return;
  const target = element.firstElementChild;
  if (target && !target.id) target.id = element.id;
}

function splitChildren(root: Element, maxChars: number): Element[][] {
  const groups: Element[][] = [];
  let current: Element[] = [];
  let size = 0;
  const threshold = Math.max(8_000, Math.floor(maxChars * 0.55));

  for (const child of Array.from(root.children)) {
    const length = child.outerHTML.length;
    const heading = /^H[1-3]$/.test(child.tagName);
    if (current.length > 0 && heading && (size >= threshold || size + length > maxChars)) {
      groups.push(current);
      current = [];
      size = 0;
    }
    current.push(child);
    size += length;
    if (size >= maxChars && !heading) {
      groups.push(current);
      current = [];
      size = 0;
    }
  }

  if (current.length > 0) groups.push(current);
  return groups.length > 0 ? groups : [[]];
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return safeXmlId(slug || "section");
}

function uniqueId(base: string, used: Set<string>): string {
  let id = safeXmlId(base);
  let suffix = 2;
  while (used.has(id)) {
    id = `${safeXmlId(base)}-${suffix}`;
    suffix += 1;
  }
  used.add(id);
  return id;
}

function safeXmlId(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9._-]/g, "");
  if (!/^[A-Za-z_]/.test(cleaned)) return `s-${cleaned || "section"}`;
  return cleaned;
}
