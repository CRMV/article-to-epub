import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { downloadEpub } from "../../src/delivery/downloadArticle";

describe("downloadEpub", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn()
    });
    (chrome.downloads.download as unknown as Mock).mockResolvedValue(42);
  });

  it("downloads EPUB bytes through the downloads API", async () => {
    await expect(downloadEpub(new Uint8Array([1, 2, 3]), "article.epub")).resolves.toBe(42);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(chrome.downloads.download).toHaveBeenCalledWith({
      url: "blob:test",
      filename: "article.epub",
      saveAs: true
    });
  });
});
