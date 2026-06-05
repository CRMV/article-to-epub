import type { MetadataCandidate } from "../types";
import { allMeta, flattenJsonLd, isRecord, type MetadataSources } from "./metadataSources";

export function buildAuthorCandidates(sources: MetadataSources): MetadataCandidate[] {
  const candidates: MetadataCandidate[] = [];

  for (const value of allMeta(sources.meta, "citation_author")) {
    pushCandidate(candidates, value, "citation_author", 0.98, "reader-author");
  }

  for (const value of jsonLdAuthors(sources)) {
    pushCandidate(candidates, value, "json-ld author", 0.88, "reader-author");
  }

  const titleAuthor = authorFromTitle(sources.title);
  if (titleAuthor) {
    pushCandidate(candidates, titleAuthor, "title byline", 0.9, "reader-author");
  }

  for (const value of sources.visibleBylines) {
    pushCandidate(candidates, value, "visible byline", 0.84, "reader-author");
  }

  for (const value of allMeta(sources.meta, "author", "article:author", "parsely-author")) {
    pushCandidate(candidates, value, "meta author", 0.78, "reader-author");
  }

  return sortAndDedupe(candidates);
}

export function authorFromTitle(title: string): string | undefined {
  const normalized = title.replace(/\s+/g, " ").trim();
  const match = normalized.match(/\bby\s+([^|–—-]{2,80})$/i);
  if (!match?.[1]) return undefined;
  return cleanAuthor(match[1]);
}

function jsonLdAuthors(sources: MetadataSources): string[] {
  const values: string[] = [];
  for (const item of flattenJsonLd(sources.jsonLd)) {
    const type = normalizeType(item["@type"]);
    if (type && !/(article|posting|creativework|webpage)/i.test(type)) continue;
    values.push(...authorValues(item.author));
    values.push(...authorValues(item.creator));
  }
  return values;
}

function authorValues(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(authorValues);
  if (isRecord(value)) {
    const name = value.name;
    return typeof name === "string" ? [name] : [];
  }
  return [];
}

function normalizeType(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string").join(" ");
  return undefined;
}

function pushCandidate(
  candidates: MetadataCandidate[],
  rawValue: string,
  source: string,
  confidence: number,
  role: MetadataCandidate["role"]
) {
  const value = cleanAuthor(rawValue);
  if (!value) return;
  candidates.push({ field: "author", value, source, confidence, ...(role ? { role } : {}) });
}

function cleanAuthor(value: string): string {
  const cleaned = value
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/^by\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:]$/, "");
  const inverted = cleaned.match(/^([^,]{2,60}),\s*([^,]{2,60})$/);
  if (inverted) return `${inverted[2]} ${inverted[1]}`.trim();
  return cleaned;
}

function sortAndDedupe(candidates: MetadataCandidate[]): MetadataCandidate[] {
  const seen = new Set<string>();
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .filter((candidate) => {
      const key = candidate.value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
