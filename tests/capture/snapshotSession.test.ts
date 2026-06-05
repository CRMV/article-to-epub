import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { LATEST_SNAPSHOT_KEY, loadLatestSnapshot, saveLatestSnapshot } from "../../src/capture/snapshotSession";
import type { PageSnapshot } from "../../src/types";

const snapshot: PageSnapshot = {
  mode: "document",
  url: "https://example.com/article",
  title: "Example",
  html: "<article><p>Hello</p></article>",
  capturedAt: new Date(0).toISOString()
};

describe("snapshot session storage", () => {
  beforeEach(() => {
    const store = new Map<string, unknown>();
    const session = chrome.storage.session as unknown as {
      get: Mock;
      set: Mock;
    };
    session.get.mockImplementation(async (key: string) => ({ [key]: store.get(key) }));
    session.set.mockImplementation(async (value: Record<string, unknown>) => {
      for (const [key, stored] of Object.entries(value)) store.set(key, stored);
    });
  });

  it("saves and loads the latest page snapshot without local storage", async () => {
    await saveLatestSnapshot(snapshot);

    expect(chrome.storage.session.set).toHaveBeenCalledWith({ [LATEST_SNAPSHOT_KEY]: snapshot });
    await expect(loadLatestSnapshot()).resolves.toEqual(snapshot);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it("ignores invalid stored values", async () => {
    (chrome.storage.session.get as unknown as Mock).mockResolvedValue({
      [LATEST_SNAPSHOT_KEY]: { url: "https://example.com" }
    });

    await expect(loadLatestSnapshot()).resolves.toBeUndefined();
  });
});
