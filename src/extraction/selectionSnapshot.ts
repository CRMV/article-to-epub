import type { PageSnapshot } from "../types";

export function hasUsableSelection(snapshot: PageSnapshot): boolean {
  return Boolean(snapshot.selectionHtml?.trim() || snapshot.selectedText?.trim());
}

export function selectionHtml(snapshot: PageSnapshot): string {
  if (snapshot.selectionHtml?.trim()) return snapshot.selectionHtml.trim();
  if (!snapshot.selectedText?.trim()) return "";

  return snapshot.selectedText
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim())}</p>`)
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

