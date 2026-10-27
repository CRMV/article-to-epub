import type { MetadataField } from "../types";

export interface MetadataEditRule {
  site: string;
  pathPrefix?: string;
  field: MetadataField;
  value: string;
  updatedAt: string;
}

const STORAGE_KEY = "metadataEditRules";
const MAX_RULES = 50;
const MAX_VALUE_LENGTH = 180;
const MAX_PATH_PREFIX_LENGTH = 80;
const ALLOWED_FIELDS: MetadataField[] = ["title", "author", "source", "publishedDate"];

export async function saveMetadataEditRule(rule: Omit<MetadataEditRule, "updatedAt">): Promise<MetadataEditRule[]> {
  const normalized = normalizeMetadataEditRule(rule);
  if (!normalized) return loadMetadataEditRules();
  const rules = await loadMetadataEditRules();
  const updated: MetadataEditRule = { ...normalized, updatedAt: new Date().toISOString() };
  const withoutDuplicate = rules.filter(
    (existing) => !(existing.site === updated.site && existing.pathPrefix === updated.pathPrefix && existing.field === updated.field)
  );
  const next = [updated, ...withoutDuplicate].slice(0, MAX_RULES);
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}

export async function loadMetadataEditRules(): Promise<MetadataEditRule[]> {
  const result = (await chrome.storage.local.get(STORAGE_KEY)) as Record<string, unknown>;
  const rules = result[STORAGE_KEY];
  return Array.isArray(rules) ? rules.filter(isMetadataEditRule) : [];
}

export async function clearMetadataEditRules(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}

export async function deleteMetadataEditRule(rule: Pick<MetadataEditRule, "site" | "pathPrefix" | "field">): Promise<MetadataEditRule[]> {
  const rules = await loadMetadataEditRules();
  const next = rules.filter(
    (existing) => !(existing.site === rule.site && existing.pathPrefix === rule.pathPrefix && existing.field === rule.field)
  );
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}

export function ruleScopeFromUrl(rawUrl: string, mode: "domain" | "path" = "domain"): Pick<MetadataEditRule, "site" | "pathPrefix"> | undefined {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    const site = url.hostname.replace(/^www\./, "").toLowerCase();
    if (mode === "domain") return { site };
    const pathPrefix = normalizePathPrefix(url.pathname);
    return pathPrefix ? { site, pathPrefix } : { site };
  } catch {
    return undefined;
  }
}

export function matchingMetadataEditRules(rawUrl: string, rules: MetadataEditRule[]): MetadataEditRule[] {
  const scope = ruleScopeFromUrl(rawUrl, "path");
  if (!scope) return [];
  return rules.filter((rule) => {
    if (rule.site !== scope.site) return false;
    if (!rule.pathPrefix) return true;
    if (!scope.pathPrefix) return false;
    return pathPrefixMatches(scope.pathPrefix, rule.pathPrefix);
  });
}

export function normalizeMetadataEditRule(rule: Omit<MetadataEditRule, "updatedAt">): Omit<MetadataEditRule, "updatedAt"> | undefined {
  if (!ALLOWED_FIELDS.includes(rule.field)) return undefined;
  const site = normalizeSite(rule.site);
  const value = normalizeValue(rule.value);
  if (!site || !value) return undefined;
  const pathPrefix = rule.pathPrefix ? normalizePathPrefix(rule.pathPrefix) : undefined;
  return {
    site,
    ...(pathPrefix ? { pathPrefix } : {}),
    field: rule.field,
    value
  };
}

function isMetadataEditRule(value: unknown): value is MetadataEditRule {
  if (typeof value !== "object" || value === null) return false;
  const maybe = value as Partial<MetadataEditRule>;
  if (
    typeof maybe.site !== "string" ||
    typeof maybe.field !== "string" ||
    typeof maybe.value !== "string" ||
    typeof maybe.updatedAt !== "string" ||
    (maybe.pathPrefix !== undefined && typeof maybe.pathPrefix !== "string")
  ) {
    return false;
  }

  return Boolean(
    normalizeMetadataEditRule({
      site: maybe.site,
      ...(maybe.pathPrefix ? { pathPrefix: maybe.pathPrefix } : {}),
      field: maybe.field as MetadataField,
      value: maybe.value
    })
  );
}

function normalizeSite(value: string): string | undefined {
  const trimmed = value.trim().toLowerCase().replace(/^www\./, "");
  if (!trimmed || trimmed.includes("/") || trimmed.includes("*") || /[\s\\]/.test(trimmed)) return undefined;
  return trimmed;
}

function normalizeValue(value: string): string | undefined {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length > MAX_VALUE_LENGTH || /[\u0000-\u001f\u007f]/.test(trimmed)) return undefined;
  return trimmed;
}

function normalizePathPrefix(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("*") || trimmed.includes("?") || trimmed.includes("#") || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    return undefined;
  }
  const prefixed = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const coarsePrefix = prefixed
    .replace(/\/{2,}/g, "/")
    .split("/")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.slice(0, MAX_PATH_PREFIX_LENGTH))
    .join("/");

  return coarsePrefix ? `/${coarsePrefix}` : undefined;
}

function pathPrefixMatches(pathname: string, prefix: string): boolean {
  const normalizedPrefix = prefix.endsWith("/") && prefix !== "/" ? prefix.slice(0, -1) : prefix;
  return pathname === normalizedPrefix || pathname.startsWith(`${normalizedPrefix}/`);
}
