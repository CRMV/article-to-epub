import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { clearSettings, defaultSettings, loadSettings, saveSettings } from "../../src/storage/settings";
import { isValidKindleEmail, maskEmail } from "../../src/storage/kindleTargets";

describe("user settings", () => {
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

  it("loads defaults before settings exist", async () => {
    await expect(loadSettings()).resolves.toEqual(defaultSettings);
  });

  it("saves and clears local settings", async () => {
    await saveSettings({ imageMode: "cover-only", route: "email-handoff", kindleEmail: "reader@kindle.com" });
    expect(chrome.storage.local.set).toHaveBeenCalled();
    await clearSettings();
    expect(chrome.storage.local.remove).toHaveBeenCalledWith("settings");
  });

  it("falls back to defaults for invalid stored settings", async () => {
    await chrome.storage.local.set({ settings: { imageMode: "all-images", route: "smtp", kindleEmail: " reader@kindle.com " } });

    await expect(loadSettings()).resolves.toEqual({
      ...defaultSettings,
      kindleEmail: "reader@kindle.com"
    });
  });

  it("validates and masks Kindle targets", () => {
    expect(isValidKindleEmail("reader@kindle.com")).toBe(true);
    expect(isValidKindleEmail("reader@example.com")).toBe(false);
    expect(maskEmail("reader@kindle.com")).toBe("re****@kindle.com");
  });
});
