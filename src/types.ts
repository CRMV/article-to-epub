export type SnapshotMode = "document" | "selection";

export interface PageSnapshot {
  mode: SnapshotMode;
  url: string;
  canonicalUrl?: string;
  title: string;
  language?: string;
  html: string;
  selectionHtml?: string;
  selectedText?: string;
  capturedAt: string;
}

export interface AssetCandidate {
  url: string;
  source: "img-src" | "img-srcset" | "lazy" | "linked-image" | "open-graph";
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface NormalizedArticle {
  title: string;
  byline?: string;
  siteName?: string;
  language?: string;
  excerpt?: string;
  publishedTime?: string;
  contentHtml: string;
  textContent: string;
  length: number;
  assets: AssetCandidate[];
}

export type ExtractionResult =
  | { ok: true; article: NormalizedArticle; warnings: string[] }
  | { ok: false; reason: "empty" | "readability-failed"; message: string };

export type MetadataField = "title" | "author" | "source" | "publishedDate" | "language" | "canonicalUrl";

export interface MetadataCandidate {
  field: MetadataField;
  value: string;
  source: string;
  confidence: number;
  role?: "reader-author" | "publisher" | "site" | "fallback";
}

export interface ResolvedMetadata {
  title?: string;
  author?: string;
  source?: string;
  publishedDate?: string;
  language?: string;
  canonicalUrl?: string;
  candidates: Record<MetadataField, MetadataCandidate[]>;
  warnings: string[];
}

export type ImageMode = "text-only" | "cover-only" | "smart-images";

export type DeliveryRoute = "download" | "amazon-web" | "email-handoff";

export type PreviewStageName =
  | "capture"
  | "extraction"
  | "metadata"
  | "asset-plan"
  | "permission-preflight"
  | "route-diagnostics"
  | "generation";

export type PreviewStageStatus = "idle" | "loading" | "ready" | "pending" | "stale" | "error" | "blocked";

export interface PreviewStage {
  name: PreviewStageName;
  status: PreviewStageStatus;
  message: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface PreviewTimingMark {
  stage: PreviewStageName | "download" | "delivery-handoff";
  label: string;
  at: string;
  durationMs?: number;
}

export interface PermissionPreflight {
  requiredOrigins: string[];
  grantedOrigins: string[];
  missingOrigins: string[];
  checkedAt: string;
}

export type KindleProfileId = "default" | "fast-email" | "rich-web-upload" | "local-epub-only" | "image-heavy";

export interface KindleProfile {
  id: KindleProfileId;
  name: string;
  description: string;
  route: DeliveryRoute;
  imageMode: ImageMode;
  filenamePattern: "standard" | "source-title" | "date-title";
}

export interface ConversionWarning {
  severity: "blocking" | "warning" | "notice" | "diagnostic";
  code: string;
  message: string;
  action?: string;
}

export interface ConversionReport {
  includedImages: number;
  skippedImages: number;
  estimatedBytes: number;
  warnings: ConversionWarning[];
  hosts: string[];
}

export interface PreviewModel {
  snapshot: PageSnapshot;
  article: NormalizedArticle;
  metadata: ResolvedMetadata;
  imageMode: ImageMode;
  route: DeliveryRoute;
  report: ConversionReport;
  profileId?: KindleProfileId;
  generatedFileName?: string;
  stages?: PreviewStage[];
  timings?: PreviewTimingMark[];
  permissionPreflight?: PermissionPreflight;
  recipeIds?: string[];
}
