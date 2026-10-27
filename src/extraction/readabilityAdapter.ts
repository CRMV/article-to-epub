import { Readability } from "@mozilla/readability";
import type { ExtractionResult, NormalizedArticle, PageSnapshot } from "../types";
import { filingDisplayTitle, isGenericDocumentTitle, promotePrintHeadings, stripSecSubmissionWrapper } from "../html/filingCleanup";
import { cleanPrintLayoutArtifacts } from "../html/printLayout";
import { linearizePositionedProspectus } from "../html/positionedPages";
import { normalizeArticleHtml } from "./contentNormalizer";
import { documentFromFragment, parseSnapshotDocument } from "./documentSnapshot";
import { hasUsableSelection, selectionHtml } from "./selectionSnapshot";

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
  stripSecSubmissionWrapper(document);
  const earlyTitle = filingDisplayTitle(document);
  if (linearizePositionedProspectus(document)) {
    return articleFromNormalized(document.body.innerHTML, snapshot, chooseTitle(earlyTitle, undefined, snapshot.title));
  }

  cleanPrintLayoutArtifacts(document);
  promotePrintHeadings(document);
  const reader = new Readability(document, {
    keepClasses: false
  });
  const parsed = reader.parse();

  if (!parsed?.content?.trim()) {
    return { ok: false, reason: "readability-failed", message: "No readable article body was found on this page." };
  }

  return articleFromNormalized(parsed.content, snapshot, chooseTitle(earlyTitle, parsed.title, snapshot.title), {
    byline: parsed.byline,
    siteName: parsed.siteName,
    language: parsed.lang ?? snapshot.language,
    excerpt: parsed.excerpt,
    publishedTime: parsed.publishedTime
  });
}

function articleFromNormalized(
  content: string,
  snapshot: PageSnapshot,
  title: string,
  extras: {
    byline?: string | null | undefined;
    siteName?: string | null | undefined;
    language?: string | null | undefined;
    excerpt?: string | null | undefined;
    publishedTime?: string | null | undefined;
  } = {}
): ExtractionResult {
  const normalized = normalizeArticleHtml(content, snapshot.url);
  if (!normalized.textContent) {
    return { ok: false, reason: "empty", message: "The extracted article body was empty after cleanup." };
  }

  const article: NormalizedArticle = {
    title,
    contentHtml: normalized.html,
    textContent: normalized.textContent,
    length: normalized.length,
    assets: normalized.assets,
    ...(extras.byline ? { byline: extras.byline } : {}),
    ...(extras.siteName ? { siteName: extras.siteName } : {}),
    ...(extras.language ? { language: extras.language } : {}),
    ...(extras.excerpt ? { excerpt: extras.excerpt } : {}),
    ...(extras.publishedTime ? { publishedTime: extras.publishedTime } : {})
  };

  return {
    ok: true,
    article,
    warnings: normalized.warnings
  };
}

function chooseTitle(earlyTitle: string | null | undefined, parsedTitle: string | null | undefined, snapshotTitle: string): string {
  const parsed = parsedTitle?.replace(/\s+/g, " ").trim();
  if (parsed && !isGenericDocumentTitle(parsed)) return parsed;
  if (earlyTitle && !isGenericDocumentTitle(earlyTitle)) return earlyTitle;
  return parsed || earlyTitle || snapshotTitle;
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
