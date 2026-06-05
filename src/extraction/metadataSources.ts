import type { PageSnapshot } from "../types";
import { parseSnapshotDocument } from "./documentSnapshot";

export interface MetadataSources {
  document: Document;
  title: string;
  canonicalUrl?: string;
  language?: string;
  meta: Map<string, string[]>;
  jsonLd: unknown[];
  visibleBylines: string[];
}

const BYLINE_SELECTORS = [
  '[rel="author"]',
  '[itemprop="author"]',
  ".byline",
  ".author",
  ".post-author",
  ".entry-author",
  ".article-author",
  '[class*="byline"]',
  '[class*="author"]'
];

export function extractMetadataSources(snapshot: PageSnapshot): MetadataSources {
  const document = parseSnapshotDocument(snapshot);
  const meta = new Map<string, string[]>();

  for (const element of document.querySelectorAll<HTMLMetaElement>("meta")) {
    const key = element.getAttribute("name") ?? element.getAttribute("property") ?? element.getAttribute("itemprop");
    const value = element.getAttribute("content")?.trim();
    if (!key || !value) continue;
    const normalizedKey = key.toLowerCase();
    meta.set(normalizedKey, [...(meta.get(normalizedKey) ?? []), value]);
  }

  const jsonLd = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'))
    .flatMap((script) => parseJsonLd(script.textContent ?? ""));

  const canonicalUrl =
    snapshot.canonicalUrl ??
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href?.trim() ??
    firstMeta(meta, "og:url");

  const language = snapshot.language ?? document.documentElement.lang?.trim() ?? firstMeta(meta, "og:locale");

  return {
    document,
    title: document.title?.trim() || snapshot.title,
    ...(canonicalUrl ? { canonicalUrl } : {}),
    ...(language ? { language } : {}),
    meta,
    jsonLd,
    visibleBylines: collectVisibleBylines(document)
  };
}

export function firstMeta(meta: Map<string, string[]>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = meta.get(key.toLowerCase())?.find(Boolean);
    if (value) return value;
  }
  return undefined;
}

export function allMeta(meta: Map<string, string[]>, ...keys: string[]): string[] {
  return keys.flatMap((key) => meta.get(key.toLowerCase()) ?? []);
}

export function flattenJsonLd(values: unknown[]): Record<string, unknown>[] {
  const output: Record<string, unknown>[] = [];

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isRecord(value)) return;
    output.push(value);
    const graph = value["@graph"];
    if (Array.isArray(graph)) graph.forEach(visit);
  };

  values.forEach(visit);
  return output;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonLd(text: string): unknown[] {
  if (!text.trim()) return [];
  try {
    const parsed = JSON.parse(text) as unknown;
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function collectVisibleBylines(document: Document): string[] {
  const values = new Set<string>();

  for (const element of document.querySelectorAll(BYLINE_SELECTORS.join(","))) {
    const text = element.textContent?.replace(/\s+/g, " ").trim();
    if (!text || text.length > 120) continue;
    values.add(cleanByline(text));
  }

  return [...values].filter(Boolean);
}

function cleanByline(value: string): string {
  return value
    .replace(/^by\s+/i, "")
    .replace(/^written by\s+/i, "")
    .trim();
}

