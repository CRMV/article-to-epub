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
}

