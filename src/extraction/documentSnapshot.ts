import type { PageSnapshot } from "../types";

export function parseSnapshotDocument(snapshot: PageSnapshot): Document {
  const parser = new DOMParser();
  const document = parser.parseFromString(snapshot.html, "text/html");

  if (!document.querySelector("base")) {
    const base = document.createElement("base");
    base.href = snapshot.canonicalUrl ?? snapshot.url;
    document.head.prepend(base);
  }

  return document;
}

export function documentFromFragment(html: string, title: string, url: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(
    `<!doctype html><html><head><base href="${escapeAttribute(url)}"><title>${escapeHtml(title)}</title></head><body><article>${html}</article></body></html>`,
    "text/html"
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

