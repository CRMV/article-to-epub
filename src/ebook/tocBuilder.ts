import { serializeXhtmlChildren } from "./xhtmlSerializer";

export interface TocEntry {
  id: string;
  level: number;
  label: string;
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

  return { html: serializeXhtmlChildren(root), toc };
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "section";
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let suffix = 2;
  while (used.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  used.add(id);
  return id;
}
