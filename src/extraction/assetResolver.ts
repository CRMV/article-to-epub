import type { AssetCandidate, NormalizedArticle } from "../types";
import { classifyImage, type ClassifiedAsset } from "./imageClassifier";

export interface ResolvedAsset extends ClassifiedAsset {
  estimatedBytes: number;
}

export function resolveArticleAssets(article: NormalizedArticle, openGraphImage?: string): ResolvedAsset[] {
  const candidates = dedupeAssets([
    ...(openGraphImage ? [{ url: openGraphImage, source: "open-graph" as const }] : []),
    ...article.assets
  ]);

  return candidates.map((candidate) => ({
    ...classifyImage(candidate),
    estimatedBytes: estimateImageBytes(candidate)
  }));
}

export function estimateImageBytes(candidate: AssetCandidate): number {
  if (candidate.width && candidate.height) {
    const pixels = candidate.width * candidate.height;
    return Math.min(Math.max(Math.round(pixels * 0.22), 60_000), 1_200_000);
  }

  if (candidate.source === "open-graph") return 500_000;
  return 250_000;
}

function dedupeAssets(candidates: AssetCandidate[]): AssetCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.url)) return false;
    seen.add(candidate.url);
    return true;
  });
}

