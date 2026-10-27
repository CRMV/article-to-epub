import type { AssetCandidate, MetadataCandidate, MetadataField, PageSnapshot } from "../types";

export interface SiteRecipe {
  id: string;
  label: string;
  host: string;
  pathPrefix?: string;
  metadata: Partial<Record<MetadataField, RecipeMetadataHint[]>>;
  assets?: {
    preferSources?: AssetCandidate["source"][];
    excludeUrlIncludes?: string[];
  };
}

export interface RecipeMetadataHint {
  source: string;
  selector?: string;
  meta?: string;
  value?: string;
  confidence: number;
}

const SAFE_SELECTOR = /^[#.a-zA-Z0-9_ :>\-\[\]="'~]+$/;

export const siteRecipes: SiteRecipe[] = [
  {
    id: "wolfram-writings",
    label: "Stephen Wolfram writings",
    host: "writings.stephenwolfram.com",
    metadata: {},
    assets: {
      preferSources: ["open-graph", "img-src", "lazy"],
      excludeUrlIncludes: ["/wp-content/plugins/", "/avatar/"]
    }
  },
  {
    id: "fs-blog",
    label: "Farnam Street",
    host: "fs.blog",
    metadata: {
      author: [{ source: "recipe:reader-facing title author", selector: "h1", confidence: 0.86 }],
      source: [{ source: "recipe:site source", value: "Farnam Street", confidence: 0.88 }]
    },
    assets: {
      preferSources: ["open-graph", "img-src"]
    }
  }
];

export function matchingSiteRecipes(snapshot: PageSnapshot): SiteRecipe[] {
  let url: URL;
  try {
    url = new URL(snapshot.canonicalUrl ?? snapshot.url);
  } catch {
    return [];
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  return siteRecipes.filter((recipe) => recipe.host === host && (!recipe.pathPrefix || url.pathname.startsWith(recipe.pathPrefix)));
}

export function recipeIdsForSnapshot(snapshot: PageSnapshot): string[] {
  return matchingSiteRecipes(snapshot).map((recipe) => recipe.id);
}

export function buildRecipeMetadataCandidates(snapshot: PageSnapshot, document: Document): MetadataCandidate[] {
  return matchingSiteRecipes(snapshot).flatMap((recipe) =>
    Object.entries(recipe.metadata).flatMap(([field, hints]) =>
      (hints ?? []).flatMap((hint) => {
        const value = valueForHint(document, hint);
        if (!value) return [];
        const candidate: MetadataCandidate = {
          field: field as MetadataField,
          value,
          source: hint.source,
          confidence: hint.confidence,
          ...(field === "author" ? { role: "reader-author" as const } : {}),
          ...(field === "source" ? { role: "site" as const } : {})
        };
        return candidate;
      })
    )
  );
}

export function recipeAssetScore(snapshot: PageSnapshot, candidate: AssetCandidate): number {
  let score = 0;
  for (const recipe of matchingSiteRecipes(snapshot)) {
    if (recipe.assets?.preferSources?.includes(candidate.source)) score += 2;
  }
  return score;
}

export function isRecipeExcludedAsset(snapshot: PageSnapshot, candidate: AssetCandidate): boolean {
  return matchingSiteRecipes(snapshot).some((recipe) => recipe.assets?.excludeUrlIncludes?.some((part) => candidate.url.includes(part)));
}

export function isValidRecipe(recipe: SiteRecipe): boolean {
  if (!recipe.id || !recipe.host || recipe.host.includes("*") || recipe.host.includes("/")) return false;
  for (const hints of Object.values(recipe.metadata)) {
    for (const hint of hints ?? []) {
      if (hint.selector && !SAFE_SELECTOR.test(hint.selector)) return false;
      if (hint.selector?.includes("script") || hint.selector?.includes("iframe")) return false;
    }
  }
  return true;
}

function valueForHint(document: Document, hint: RecipeMetadataHint): string | undefined {
  if (hint.value) return cleanValue(hint.value);
  if (hint.meta) {
    return cleanValue(
      document
        .querySelector<HTMLMetaElement>(`meta[name="${CSS.escape(hint.meta)}"], meta[property="${CSS.escape(hint.meta)}"]`)
        ?.content
    );
  }
  if (hint.selector) {
    if (!SAFE_SELECTOR.test(hint.selector)) return undefined;
    const text = document.querySelector(hint.selector)?.textContent;
    if (hint.source.includes("title author")) {
      const match = text?.match(/\bby\s+([^|–—-]+)/i);
      return cleanValue(match?.[1] ?? text);
    }
    return cleanValue(text);
  }
  return undefined;
}

function cleanValue(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned || undefined;
}
