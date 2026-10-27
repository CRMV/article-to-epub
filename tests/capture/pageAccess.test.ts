import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { captureOriginPatternFromUrl, hasCaptureAccess } from "../../src/capture/pageAccess";

describe("page capture access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const permissions = chrome.permissions as unknown as {
      contains: Mock;
    };
    permissions.contains.mockResolvedValue(false);
  });

  it("checks a narrow https origin without prompting", async () => {
    await expect(hasCaptureAccess("https://writings.stephenwolfram.com/2023/post")).resolves.toBe(false);

    expect(chrome.permissions.contains).toHaveBeenCalledWith({
      origins: ["https://writings.stephenwolfram.com/*"]
    });
    expect(chrome.permissions.request).not.toHaveBeenCalled();
  });

  it("fails closed instead of checking broad https access when the tab URL is unavailable", async () => {
    await expect(hasCaptureAccess()).resolves.toBe(false);

    expect(chrome.permissions.contains).not.toHaveBeenCalled();
    expect(chrome.permissions.request).not.toHaveBeenCalled();
  });

  it("detects existing access without prompting", async () => {
    (chrome.permissions.contains as unknown as Mock).mockResolvedValue(true);

    await expect(hasCaptureAccess("https://example.com/post")).resolves.toBe(true);
    expect(chrome.permissions.request).not.toHaveBeenCalled();
  });

  it("does not derive capture origin patterns for unsupported schemes", () => {
    expect(captureOriginPatternFromUrl("chrome://extensions")).toBeUndefined();
    expect(captureOriginPatternFromUrl("http://example.com/post")).toBeUndefined();
  });
});
