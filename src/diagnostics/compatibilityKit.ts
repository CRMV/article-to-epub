import type { KindleProfileId, PreviewModel, PreviewTimingMark } from "../types";
import { redactedHost } from "./conversionReport";

export interface CompatibilityKit {
  version: 1;
  generatedAt: string;
  extensionVersion: string;
  snapshot: {
    mode: string;
    sourceHost: string;
    canonicalHost?: string;
  };
  settings: {
    route: string;
    imageMode: string;
    profileId?: KindleProfileId;
  };
  metadata: Array<{
    field: string;
    selectedIncluded: boolean;
    candidateSources: string[];
    candidateCount: number;
  }>;
  report: {
    includedImages: number;
    skippedImages: number;
    estimatedBytes: number;
    hosts: string[];
    warnings: Array<{ severity: string; code: string; hasAction: boolean }>;
  };
  timings: Array<Pick<PreviewTimingMark, "stage" | "label" | "durationMs">>;
  recipes: string[];
  permissions: {
    requiredHosts: string[];
    grantedHosts: string[];
    missingHosts: string[];
  };
}

export interface CompatibilityKitOptions {
  extensionVersion?: string;
}

export function buildCompatibilityKit(preview: PreviewModel, options: CompatibilityKitOptions = {}): CompatibilityKit {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    extensionVersion: options.extensionVersion ?? "0.1.0",
    snapshot: {
      mode: preview.snapshot.mode,
      sourceHost: redactedHost(preview.snapshot.url),
      ...(preview.snapshot.canonicalUrl ? { canonicalHost: redactedHost(preview.snapshot.canonicalUrl) } : {})
    },
    settings: {
      route: preview.route,
      imageMode: preview.imageMode,
      ...(preview.profileId ? { profileId: preview.profileId } : {})
    },
    metadata: Object.entries(preview.metadata.candidates).map(([field, candidates]) => ({
      field,
      selectedIncluded: false,
      candidateSources: [...new Set(candidates.map((candidate) => candidate.source))].sort(),
      candidateCount: candidates.length
    })),
    report: {
      includedImages: preview.report.includedImages,
      skippedImages: preview.report.skippedImages,
      estimatedBytes: preview.report.estimatedBytes,
      hosts: preview.report.hosts,
      warnings: preview.report.warnings.map((warning) => ({
        severity: warning.severity,
        code: warning.code,
        hasAction: Boolean(warning.action)
      }))
    },
    timings: (preview.timings ?? []).map((timing) => ({
      stage: timing.stage,
      label: timing.label,
      ...(typeof timing.durationMs === "number" ? { durationMs: timing.durationMs } : {})
    })),
    recipes: preview.recipeIds ?? [],
    permissions: {
      requiredHosts: redactedOrigins(preview.permissionPreflight?.requiredOrigins ?? []),
      grantedHosts: redactedOrigins(preview.permissionPreflight?.grantedOrigins ?? []),
      missingHosts: redactedOrigins(preview.permissionPreflight?.missingOrigins ?? [])
    }
  };
}

function redactedOrigins(origins: string[]): string[] {
  return [...new Set(origins.map((origin) => redactedHost(`${origin}/`)))].sort();
}

export function compatibilityKitFileName(preview: PreviewModel): string {
  const host = redactedHost(preview.snapshot.canonicalUrl ?? preview.snapshot.url).replace(/[^a-z0-9.-]+/gi, "-");
  return `article-to-epub-compatibility-${host || "site"}.json`;
}
