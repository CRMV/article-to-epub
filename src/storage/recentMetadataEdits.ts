import type { MetadataField } from "../types";

export interface MetadataEditRule {
  site: string;
  field: MetadataField;
  value: string;
  updatedAt: string;
}

const STORAGE_KEY = "metadataEditRules";
const MAX_RULES = 50;

export async function saveMetadataEditRule(rule: Omit<MetadataEditRule, "updatedAt">): Promise<MetadataEditRule[]> {
  const rules = await loadMetadataEditRules();
  const updated: MetadataEditRule = { ...rule, updatedAt: new Date().toISOString() };
  const withoutDuplicate = rules.filter((existing) => !(existing.site === rule.site && existing.field === rule.field));
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

function isMetadataEditRule(value: unknown): value is MetadataEditRule {
  if (typeof value !== "object" || value === null) return false;
  const maybe = value as Partial<MetadataEditRule>;
  return Boolean(maybe.site && maybe.field && maybe.value && maybe.updatedAt);
}

