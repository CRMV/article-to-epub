import type { MetadataCandidate } from "../types";
import { allMeta, flattenJsonLd, type MetadataSources } from "./metadataSources";

export function buildDateCandidates(sources: MetadataSources): MetadataCandidate[] {
  const candidates: MetadataCandidate[] = [];

  for (const value of allMeta(sources.meta, "citation_publication_date")) {
    pushDate(candidates, value, "citation_publication_date", 0.98);
  }

  for (const item of flattenJsonLd(sources.jsonLd)) {
    for (const key of ["datePublished", "dateCreated", "dateModified"]) {
      const value = item[key];
      if (typeof value === "string") pushDate(candidates, value, `json-ld ${key}`, key === "datePublished" ? 0.9 : 0.62);
    }
  }

  for (const value of allMeta(sources.meta, "article:published_time", "date", "publishdate", "parsely-pub-date")) {
    pushDate(candidates, value, "meta date", 0.78);
  }

  const visibleTime = sources.document.querySelector<HTMLTimeElement>("time[datetime]")?.dateTime;
  if (visibleTime) pushDate(candidates, visibleTime, "visible time", 0.72);

  return sortAndDedupe(candidates);
}

export function normalizeDate(value: string): string | undefined {
  const citationMatch = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (citationMatch) {
    const year = citationMatch[1];
    const month = citationMatch[2];
    const day = citationMatch[3];
    if (!year || !month || !day) return undefined;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function pushDate(candidates: MetadataCandidate[], rawValue: string, source: string, confidence: number) {
  const value = normalizeDate(rawValue);
  if (!value) return;
  candidates.push({ field: "publishedDate", value, source, confidence });
}

function sortAndDedupe(candidates: MetadataCandidate[]): MetadataCandidate[] {
  const seen = new Set<string>();
  return candidates
    .sort((a, b) => b.confidence - a.confidence)
    .filter((candidate) => {
      if (seen.has(candidate.value)) return false;
      seen.add(candidate.value);
      return true;
    });
}
