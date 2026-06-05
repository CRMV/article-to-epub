import { describe, expect, it, vi, type Mock } from "vitest";
import { AMAZON_UPLOAD_URL, openAmazonUpload } from "../../src/delivery/amazonUploadHandoff";

describe("openAmazonUpload", () => {
  it("opens the official upload handoff URL without automating login", async () => {
    (chrome.tabs.create as unknown as Mock).mockResolvedValue({} as chrome.tabs.Tab);

    await openAmazonUpload();

    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: AMAZON_UPLOAD_URL });
  });
});
