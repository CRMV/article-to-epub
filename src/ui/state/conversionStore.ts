import type { DeliveryRoute, ImageMode, PageSnapshot, PreviewModel, ResolvedMetadata } from "../../types";
import { buildConversionReport } from "../../diagnostics/conversionReport";
import { planImageBudget } from "../../ebook/imageBudget";
import { resolveArticleAssets } from "../../extraction/assetResolver";
import { extractReadableArticle } from "../../extraction/readabilityAdapter";
import { resolveMetadata } from "../../extraction/metadataResolver";

export interface PreviewOptions {
  imageMode: ImageMode;
  route: DeliveryRoute;
}

export type PreviewBuildResult =
  | { ok: true; preview: PreviewModel }
  | { ok: false; message: string };

export function buildPreviewFromSnapshot(snapshot: PageSnapshot, options: PreviewOptions): PreviewBuildResult {
  const extracted = extractReadableArticle(snapshot);
  if (!extracted.ok) {
    return { ok: false, message: extracted.message };
  }

  const metadata = resolveMetadata(snapshot);
  const assets = resolveArticleAssets(extracted.article, openGraphImageFromSnapshot(snapshot));
  const decisions = planImageBudget(assets, options.imageMode, options.route);
  const report = buildConversionReport(decisions, options.route);

  return {
    ok: true,
    preview: {
      snapshot,
      article: extracted.article,
      metadata,
      imageMode: options.imageMode,
      route: options.route,
      report
    }
  };
}

export function metadataWithEdits(metadata: ResolvedMetadata, edits: Partial<ResolvedMetadata>): ResolvedMetadata {
  return {
    ...metadata,
    ...Object.fromEntries(
      Object.entries(edits).filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    )
  };
}

export function openGraphImageFromSnapshot(snapshot: PageSnapshot): string | undefined {
  const document = new DOMParser().parseFromString(snapshot.html, "text/html");
  const value = document
    .querySelector<HTMLMetaElement>(
      'meta[property="og:image"], meta[property="og:image:url"], meta[name="twitter:image"]'
    )
    ?.content.trim();

  if (!value) return undefined;

  try {
    return new URL(value, snapshot.canonicalUrl ?? snapshot.url).toString();
  } catch {
    return undefined;
  }
}
