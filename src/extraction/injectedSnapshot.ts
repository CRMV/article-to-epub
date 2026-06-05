import type { PageSnapshot } from "../types";

export function collectPageSnapshot(): PageSnapshot {
  function getCanonicalUrl(): string | undefined {
    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const href = link?.href?.trim();
    return href || undefined;
  }

  function getSelectionHtml(): { html?: string; text?: string } {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return {};

    const container = document.createElement("div");
    for (let index = 0; index < selection.rangeCount; index += 1) {
      container.append(selection.getRangeAt(index).cloneContents());
    }

    const html = container.innerHTML.trim();
    const text = selection.toString().trim();
    return {
      ...(html ? { html } : {}),
      ...(text ? { text } : {})
    };
  }

  const selection = getSelectionHtml();
  const html = document.documentElement.outerHTML;
  const title = document.title?.trim() || location.hostname;
  const language = document.documentElement.lang?.trim();
  const canonicalUrl = getCanonicalUrl();

  return {
    mode: selection.html || selection.text ? "selection" : "document",
    url: location.href,
    ...(canonicalUrl ? { canonicalUrl } : {}),
    title,
    ...(language ? { language } : {}),
    html,
    ...(selection.html ? { selectionHtml: selection.html } : {}),
    ...(selection.text ? { selectedText: selection.text } : {}),
    capturedAt: new Date().toISOString()
  };
}
