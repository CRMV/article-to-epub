import type {
  DeliveryRoute,
  ImageMode,
  KindleProfileId,
  MetadataCandidate,
  MetadataField,
  PageSnapshot,
  PermissionPreflight,
  PreviewModel,
  PreviewStage,
  PreviewStageName,
  PreviewTimingMark,
  ResolvedMetadata
} from "../../types";
import { buildConversionReport } from "../../diagnostics/conversionReport";
import { buildFileName } from "../../ebook/epubBuilder";
import { planImageBudget } from "../../ebook/imageBudget";
import { resolveArticleAssets } from "../../extraction/assetResolver";
import { checkAssetOriginGrants, planAssetPermissions } from "../../extraction/permissionPlanner";
import { extractReadableArticle } from "../../extraction/readabilityAdapter";
import { resolveMetadata } from "../../extraction/metadataResolver";
import { recipeIdsForSnapshot } from "../../extraction/siteRecipes";
import { getProfile } from "../../storage/kindleProfiles";
import { matchingMetadataEditRules, type MetadataEditRule } from "../../storage/recentMetadataEdits";

export interface PreviewOptions {
  imageMode: ImageMode;
  route: DeliveryRoute;
  profileId?: KindleProfileId;
  metadataRules?: MetadataEditRule[];
}

export type PreviewBuildResult =
  | { ok: true; preview: PreviewModel }
  | { ok: false; message: string };

export function buildPreviewFromSnapshot(snapshot: PageSnapshot, options: PreviewOptions): PreviewBuildResult {
  const extracted = extractReadableArticle(snapshot);
  if (!extracted.ok) {
    return { ok: false, message: extracted.message };
  }

  const profile = getProfile(options.profileId);
  const metadata = applyRememberedMetadataRules(resolveMetadata(snapshot), snapshot, options.metadataRules ?? []);
  const assets = resolveArticleAssets(extracted.article, openGraphImageFromSnapshot(snapshot), snapshot);
  const decisions = planImageBudget(assets, options.imageMode, options.route);
  const report = buildConversionReport(decisions, options.route);
  const timings = [timingMark("extraction", "Article extracted"), timingMark("metadata", "Metadata resolved")];

  return {
    ok: true,
    preview: {
      snapshot,
      article: extracted.article,
      metadata,
      imageMode: options.imageMode,
      route: options.route,
      report,
      ...(options.profileId ? { profileId: options.profileId } : {}),
      generatedFileName: buildFileName(metadata, profile.filenamePattern),
      stages: defaultReadyStages(),
      timings,
      recipeIds: recipeIdsForSnapshot(snapshot)
    }
  };
}

export async function buildWorkbenchPreviewFromSnapshot(snapshot: PageSnapshot, options: PreviewOptions): Promise<PreviewBuildResult> {
  const started = Date.now();
  const extracted = extractReadableArticle(snapshot);
  if (!extracted.ok) {
    return { ok: false, message: extracted.message };
  }

  const extractionDone = Date.now();
  const profile = getProfile(options.profileId);
  const metadata = applyRememberedMetadataRules(resolveMetadata(snapshot), snapshot, options.metadataRules ?? []);
  const metadataDone = Date.now();
  const assets = resolveArticleAssets(extracted.article, openGraphImageFromSnapshot(snapshot), snapshot);
  const decisions = planImageBudget(assets, options.imageMode, options.route);
  const permissionPlan = planAssetPermissions(
    snapshot.url,
    decisions.filter((decision) => decision.include).map((decision) => decision.asset.candidate)
  );
  const grantedOrigins = await checkAssetOriginGrants(permissionPlan.requiredOrigins);
  const permissionDone = Date.now();
  const report = buildConversionReport(decisions, options.route);
  const routeDone = Date.now();
  const missingOrigins = permissionPlan.requiredOrigins.filter((origin) => !grantedOrigins.includes(origin));
  const permissionPreflight: PermissionPreflight = {
    requiredOrigins: permissionPlan.requiredOrigins,
    grantedOrigins,
    missingOrigins,
    checkedAt: new Date(permissionDone).toISOString()
  };

  return {
    ok: true,
    preview: {
      snapshot,
      article: extracted.article,
      metadata,
      imageMode: options.imageMode,
      route: options.route,
      report,
      ...(options.profileId ? { profileId: options.profileId } : {}),
      generatedFileName: buildFileName(metadata, profile.filenamePattern),
      stages: [
        stage("capture", "ready", "Snapshot available", started),
        stage("extraction", "ready", "Text preview ready", started, extractionDone),
        stage("metadata", "ready", "Metadata candidates ready", extractionDone, metadataDone),
        stage("asset-plan", "ready", "Image decisions estimated", metadataDone, permissionDone),
        stage(
          "permission-preflight",
          missingOrigins.length > 0 ? "blocked" : "ready",
          missingOrigins.length > 0 ? "Image host access will be requested on Generate." : "Image host access already available.",
          metadataDone,
          permissionDone
        ),
        stage("route-diagnostics", "ready", "Route fit checked", permissionDone, routeDone)
      ],
      timings: [
        timingMark("extraction", "Article extracted", started, extractionDone),
        timingMark("metadata", "Metadata resolved", extractionDone, metadataDone),
        timingMark("asset-plan", "Assets planned", metadataDone, permissionDone),
        timingMark("permission-preflight", "Permissions checked", metadataDone, permissionDone),
        timingMark("route-diagnostics", "Route diagnostics built", permissionDone, routeDone)
      ],
      permissionPreflight,
      recipeIds: recipeIdsForSnapshot(snapshot)
    }
  };
}

export function metadataWithEdits(metadata: ResolvedMetadata, edits: Partial<ResolvedMetadata>): ResolvedMetadata {
  const explicitEdits = Object.fromEntries(
    Object.entries(edits).filter((entry): entry is [keyof ResolvedMetadata, string] => typeof entry[1] === "string")
  );
  const merged = { ...metadata, ...explicitEdits };

  if (!merged.title?.trim()) {
    merged.title = metadata.title ?? "Untitled Article";
  }

  return {
    ...merged
  };
}

export function applyRememberedMetadataRules(
  metadata: ResolvedMetadata,
  snapshot: PageSnapshot,
  rules: MetadataEditRule[]
): ResolvedMetadata {
  const matchingRules = matchingMetadataEditRules(snapshot.canonicalUrl ?? snapshot.url, rules);
  if (matchingRules.length === 0) return metadata;

  const candidates = { ...metadata.candidates };
  const selected: Partial<Record<MetadataField, string>> = {};

  for (const rule of orderMetadataRulesBySpecificity(matchingRules)) {
    if (selected[rule.field]) continue;

    const candidate: MetadataCandidate = {
      field: rule.field,
      value: rule.value,
      source: rule.pathPrefix ? "remembered URL rule" : "remembered domain rule",
      confidence: 0.97,
      ...(rule.field === "author" ? { role: "reader-author" } : {}),
      ...(rule.field === "source" ? { role: "site" } : {})
    };
    candidates[rule.field] = dedupeCandidates([candidate, ...(candidates[rule.field] ?? [])]);
    selected[rule.field] = rule.value;
  }

  return {
    ...metadata,
    ...selected,
    candidates
  };
}

function orderMetadataRulesBySpecificity(rules: MetadataEditRule[]): MetadataEditRule[] {
  return [...rules].sort((a, b) => {
    const pathSpecificity = (b.pathPrefix?.length ?? 0) - (a.pathPrefix?.length ?? 0);
    if (pathSpecificity !== 0) return pathSpecificity;

    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
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

function defaultReadyStages(): PreviewStage[] {
  return [
    stage("capture", "ready", "Snapshot available"),
    stage("extraction", "ready", "Text preview ready"),
    stage("metadata", "ready", "Metadata candidates ready"),
    stage("asset-plan", "ready", "Image decisions estimated"),
    stage("route-diagnostics", "ready", "Route fit checked")
  ];
}

function stage(
  name: PreviewStageName,
  status: PreviewStage["status"],
  message: string,
  startedAt = Date.now(),
  completedAt = Date.now()
): PreviewStage {
  return {
    name,
    status,
    message,
    startedAt: new Date(startedAt).toISOString(),
    completedAt: new Date(completedAt).toISOString(),
    durationMs: Math.max(completedAt - startedAt, 0)
  };
}

function timingMark(
  stageName: PreviewTimingMark["stage"],
  label: string,
  startedAt = Date.now(),
  completedAt = Date.now()
): PreviewTimingMark {
  return {
    stage: stageName,
    label,
    at: new Date(completedAt).toISOString(),
    durationMs: Math.max(completedAt - startedAt, 0)
  };
}

function dedupeCandidates(candidates: MetadataCandidate[]): MetadataCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.field}:${candidate.value.toLowerCase()}:${candidate.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
