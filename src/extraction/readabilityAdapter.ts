import { Readability } from "@mozilla/readability";
import type { ExtractionResult, NormalizedArticle, PageSnapshot } from "../types";
import { normalizeArticleHtml } from "./contentNormalizer";
import { documentFromFragment, parseSnapshotDocument } from "./documentSnapshot";
import { hasUsableSelection, selectionHtml } from "./selectionSnapshot";
import { cleanPrintLayoutArtifacts } from "../html/printLayout";

export function extractReadableArticle(snapshot: PageSnapshot): ExtractionResult {
  if (snapshot.mode === "selection" && hasUsableSelection(snapshot)) {
    const fragment = selectionHtml(snapshot);
    const normalized = normalizeArticleHtml(fragment, snapshot.url);
    if (!normalized.textContent) {
      return { ok: false, reason: "empty", message: "The current selection does not contain readable text." };
    }

    const article: NormalizedArticle = {
      title: snapshot.title,
      ...(snapshot.language ? { language: snapshot.language } : {}),
      contentHtml: normalized.html,
      textContent: normalized.textContent,
      length: normalized.length,
      assets: normalized.assets
    };

    return {
      ok: true,
      article,
      warnings: normalized.warnings
    };
  }

  const document = parseSnapshotDocument(snapshot);
  cleanPrintLayoutArtifacts(document);
  const reader = new Readability(document, {
    keepClasses: false
  });
  const parsed = reader.parse();

  if (!parsed?.content?.trim()) {
    return { ok: false, reason: "readability-failed", message: "No readable article body was found on this page." };
  }

  const normalized = normalizeArticleHtml(parsed.content, snapshot.url);
  if (!normalized.textContent) {
    return { ok: false, reason: "empty", message: "The extracted article body was empty after cleanup." };
  }

  const article: NormalizedArticle = {
    title: parsed.title?.trim() || snapshot.title,
    contentHtml: normalized.html,
    textContent: normalized.textContent,
    length: normalized.length,
    assets: normalized.assets,
    ...(parsed.byline ? { byline: parsed.byline } : {}),
    ...(parsed.siteName ? { siteName: parsed.siteName } : {}),
    ...(parsed.lang ?? snapshot.language ? { language: parsed.lang ?? snapshot.language } : {}),
    ...(parsed.excerpt ? { excerpt: parsed.excerpt } : {}),
    ...(parsed.publishedTime ? { publishedTime: parsed.publishedTime } : {})
  };

  return {
    ok: true,
    article,
    warnings: normalized.warnings
  };
}

export function articleFromHtml(html: string, title: string, url: string): ExtractionResult {
  return extractReadableArticle({
    mode: "document",
    url,
    title,
    html: documentFromFragment(html, title, url).documentElement.outerHTML,
    capturedAt: new Date(0).toISOString()
  });
}
