import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  clearMetadataEditRules,
  loadMetadataEditRules,
  matchingMetadataEditRules,
  normalizeMetadataEditRule,
  ruleScopeFromUrl,
  saveMetadataEditRule
} from "../../src/storage/recentMetadataEdits";

describe("recent metadata edits", () => {
  beforeEach(() => {
    const store = new Map<string, unknown>();
    const local = chrome.storage.local as unknown as {
      get: Mock;
      set: Mock;
      remove: Mock;
    };
    local.get.mockImplementation(async (key: string) => ({ [key]: store.get(key) }));
    local.set.mockImplementation(async (value: Record<string, unknown>) => {
      for (const [key, stored] of Object.entries(value)) store.set(key, stored);
    });
    local.remove.mockImplementation(async (key: string) => {
      store.delete(key);
    });
  });

  it("stores local correction rules without sync storage", async () => {
    await saveMetadataEditRule({ site: "fs.blog", field: "author", value: "Charlie Munger" });
    const rules = await loadMetadataEditRules();

    expect(rules[0]).toMatchObject({ site: "fs.blog", field: "author", value: "Charlie Munger" });
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });

  it("clears local correction history", async () => {
    await clearMetadataEditRules();
    expect(chrome.storage.local.remove).toHaveBeenCalledWith("metadataEditRules");
  });

  it("builds constrained domain and path scopes", () => {
    expect(ruleScopeFromUrl("https://www.fs.blog/great-talks/?utm=secret", "domain")).toEqual({ site: "fs.blog" });
    expect(ruleScopeFromUrl("https://www.fs.blog/great-talks/test?utm=secret", "path")).toEqual({
      site: "fs.blog",
      pathPrefix: "/great-talks/test"
    });
  });

  it("rejects unsafe correction rule shapes", () => {
    expect(normalizeMetadataEditRule({ site: "fs.blog", field: "author", value: "Charlie Munger" })).toEqual({
      site: "fs.blog",
      field: "author",
      value: "Charlie Munger"
    });
    expect(normalizeMetadataEditRule({ site: "fs.blog/*", field: "author", value: "Charlie" })).toBeUndefined();
    expect(normalizeMetadataEditRule({ site: "fs.blog", field: "canonicalUrl", value: "https://secret" })).toBeUndefined();
    expect(normalizeMetadataEditRule({ site: "fs.blog", field: "author", value: "Bad\u0000Value" })).toBeUndefined();
  });

  it("matches rules only within their normalized scope", () => {
    const rules = [
      { site: "fs.blog", field: "author" as const, value: "Charlie Munger", updatedAt: new Date(0).toISOString() },
      {
        site: "example.com",
        pathPrefix: "/articles",
        field: "source" as const,
        value: "Example",
        updatedAt: new Date(0).toISOString()
      }
    ];

    expect(matchingMetadataEditRules("https://fs.blog/other", rules)).toHaveLength(1);
    expect(matchingMetadataEditRules("https://example.com/articles/one", rules)).toHaveLength(1);
    expect(matchingMetadataEditRules("https://example.com/articleship/one", rules)).toHaveLength(0);
    expect(matchingMetadataEditRules("https://example.com/posts/one", rules)).toHaveLength(0);
  });

  it("stores path scopes coarsely", () => {
    expect(ruleScopeFromUrl("https://example.com/articles/private-token/extra/secret", "path")).toEqual({
      site: "example.com",
      pathPrefix: "/articles/private-token"
    });
  });

  it("drops malformed stored correction rules without throwing", async () => {
    await chrome.storage.local.set({
      metadataEditRules: [
        { site: {}, field: "author", value: "Bad", updatedAt: new Date(0).toISOString() },
        { site: "fs.blog", field: "author", value: 42, updatedAt: new Date(0).toISOString() },
        { site: "fs.blog", pathPrefix: {}, field: "author", value: "Bad", updatedAt: new Date(0).toISOString() },
        { site: "fs.blog", field: "author", value: "Charlie Munger", updatedAt: new Date(0).toISOString() }
      ]
    });

    await expect(loadMetadataEditRules()).resolves.toEqual([
      { site: "fs.blog", field: "author", value: "Charlie Munger", updatedAt: new Date(0).toISOString() }
    ]);
  });
});
