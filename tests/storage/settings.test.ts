import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { clearMetadataEditRules, loadMetadataEditRules, saveMetadataEditRule } from "../../src/storage/recentMetadataEdits";

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
});
