import type { MetadataCandidate, MetadataField, PageSnapshot, ResolvedMetadata } from "../types";
import { buildAuthorCandidates } from "./authorCandidates";
import { buildDateCandidates } from "./dateCandidates";
import { extractMetadataSources, firstMeta } from "./metadataSources";
import { filingDisplayTitle, isGenericDocumentTitle } from "../html/filingCleanup";
import { buildRecipeMetadataCandidates } from "./siteRecipes";

const fields: MetadataField[] = ["title", "author", "source", "publishedDate", "language", "canonicalUrl"];

export function resolveMetadata(snapshot: PageSnapshot): ResolvedMetadata {
  const sources = extractMetadataSources(snapshot);
  const recipeCandidates = buildRecipeMetadataCandidates(snapshot, sources.document);
  const titleCandidates = buildTitleCandidates(snapshot, sources.document, sources.title);
  const authorCandidates = buildAuthorCandidates(sources);
  const dateCandidates = buildDateCandidates(sources);
  const sourceCandidates = buildSourceCandidates(snapshot, firstMeta(sources.meta, "og:site_name", "application-name"));
  const languageCandidates = buildSimpleCandidates("language", sources.language, "document language", 0.75);
  const canonicalCandidates = buildSimpleCandidates("canonicalUrl", sources.canonicalUrl ?? snapshot.url, "canonical URL", 0.76);

  const candidates: Record<MetadataField, MetadataCandidate[]> = {
    title: mergeCandidates("title", titleCandidates, recipeCandidates),
    author: mergeCandidates("author", authorCandidates, recipeCandidates),
    source: mergeCandidates("source", sourceCandidates, recipeCandidates),
    publishedDate: mergeCandidates("publishedDate", dateCandidates, recipeCandidates),
    language: languageCandidates,
    canonicalUrl: canonicalCandidates
  };

  const warnings = fields.flatMap((field) => conflictWarning(field, candidates[field]));

  const title = selected(candidates.title);
  const author = selected(candidates.author);
  const source = selected(candidates.source);
  const publishedDate = selected(candidates.publishedDate);
  const language = selected(candidates.language);
  const canonicalUrl = selected(candidates.canonicalUrl);

  return {
    ...(title ? { title } : {}),
    ...(author ? { author } : {}),
    ...(source ? { source } : {}),
    ...(publishedDate ? { publishedDate } : {}),
    ...(language ? { language } : {}),
    ...(canonicalUrl ? { canonicalUrl } : {}),
    candidates,
    warnings
  };
}

function mergeCandidates(
  field: MetadataField,
  normalCandidates: MetadataCandidate[],
  recipeCandidates: MetadataCandidate[]
): MetadataCandidate[] {
  return dedupe([...recipeCandidates.filter((candidate) => candidate.field === field), ...normalCandidates]);
}

function buildTitleCandidates(snapshot: PageSnapshot, document: Document, documentTitle: string): MetadataCandidate[] {
  const filingTitle = isGenericDocumentTitle(documentTitle) ? filingDisplayTitle(document) : undefined;
  const values = [
    ...(filingTitle ? [{ value: filingTitle, source: "filing registrant", confidence: 0.93 }] : []),
    { value: documentTitle, source: "document title", confidence: 0.78 },
    { value: snapshot.title, source: "tab title", confidence: 0.62 }
  ];
  return dedupe(values.map(({ value, source, confidence }) => ({ field: "title" as const, value: value.trim(), source, confidence })));
}

function buildSourceCandidates(snapshot: PageSnapshot, siteName?: string): MetadataCandidate[] {
  const hostname = safeHostname(snapshot.canonicalUrl ?? snapshot.url);
  return dedupe([
    ...(siteName ? [{ field: "source" as const, value: siteName, source: "site metadata", confidence: 0.74, role: "site" as const }] : []),
    ...(hostname ? [{ field: "source" as const, value: hostname, source: "URL hostname", confidence: 0.5, role: "fallback" as const }] : [])
  ]);
}

function buildSimpleCandidates(field: MetadataField, value: string | undefined, source: string, confidence: number): MetadataCandidate[] {
  return value?.trim() ? [{ field, value: value.trim(), source, confidence }] : [];
}

function selected(candidates: MetadataCandidate[]): string | undefined {
  return candidates[0]?.value;
}

function conflictWarning(field: MetadataField, candidates: MetadataCandidate[]): string[] {
  if (candidates.length < 2) return [];
  const [first, second] = candidates;
  if (!first || !second || first.value.toLowerCase() === second.value.toLowerCase()) return [];
  if (first.confidence - second.confidence > 0.18) return [];
  return [`${field} has conflicting metadata candidates`];
}

function safeHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function dedupe(candidates: MetadataCandidate[]): MetadataCandidate[] {
  const seen = new Set<string>();
  return candidates
    .filter((candidate) => candidate.value)
    .sort((a, b) => b.confidence - a.confidence)
    .filter((candidate) => {
      const key = `${candidate.field}:${candidate.value.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
