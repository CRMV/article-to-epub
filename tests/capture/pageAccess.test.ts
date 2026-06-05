import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { captureOriginPatternFromUrl, FALLBACK_CAPTURE_ORIGIN, requestCaptureAccess } from "../../src/capture/pageAccess";

describe("page capture access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const permissions = chrome.permissions as unknown as {
      contains: Mock;
      request: Mock;
    };
    permissions.contains.mockResolvedValue(false);
    permissions.request.mockResolvedValue(true);
  });

  it("requests a narrow https origin when the tab URL is available", async () => {
    await expect(requestCaptureAccess("https://writings.stephenwolfram.com/2023/post")).resolves.toBe(true);

    expect(chrome.permissions.request).toHaveBeenCalledWith({
      origins: ["https://writings.stephenwolfram.com/*"]
    });
  });

  it("falls back to declared https access when the side panel cannot see the tab URL", async () => {
    await expect(requestCaptureAccess()).resolves.toBe(true);

    expect(chrome.permissions.request).toHaveBeenCalledWith({
      origins: [FALLBACK_CAPTURE_ORIGIN]
    });
  });

  it("does not prompt again when access is already granted", async () => {
    (chrome.permissions.contains as unknown as Mock).mockResolvedValue(true);

    await expect(requestCaptureAccess("https://example.com/post")).resolves.toBe(true);
    expect(chrome.permissions.request).not.toHaveBeenCalled();
  });

  it("does not derive capture origin patterns for unsupported schemes", () => {
    expect(captureOriginPatternFromUrl("chrome://extensions")).toBeUndefined();
    expect(captureOriginPatternFromUrl("http://example.com/post")).toBeUndefined();
  });
});
