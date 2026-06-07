import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { captureOriginPatternFromUrl, releaseCaptureAccess, requestCaptureAccess } from "../../src/capture/pageAccess";

describe("page capture access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const permissions = chrome.permissions as unknown as {
      contains: Mock;
      request: Mock;
      remove: Mock;
    };
    permissions.contains.mockResolvedValue(false);
    permissions.request.mockResolvedValue(true);
    permissions.remove.mockResolvedValue(true);
  });

  it("requests a narrow https origin when the tab URL is available", async () => {
    await expect(requestCaptureAccess("https://writings.stephenwolfram.com/2023/post")).resolves.toEqual({
      granted: true,
      origin: "https://writings.stephenwolfram.com/*",
      newlyGranted: true
    });

    expect(chrome.permissions.request).toHaveBeenCalledWith({
      origins: ["https://writings.stephenwolfram.com/*"]
    });
  });

  it("fails closed instead of requesting broad https access when the tab URL is unavailable", async () => {
    await expect(requestCaptureAccess()).resolves.toEqual({ granted: false, newlyGranted: false });

    expect(chrome.permissions.request).not.toHaveBeenCalled();
  });

  it("does not prompt again when access is already granted", async () => {
    (chrome.permissions.contains as unknown as Mock).mockResolvedValue(true);

    await expect(requestCaptureAccess("https://example.com/post")).resolves.toEqual({
      granted: true,
      origin: "https://example.com/*",
      newlyGranted: false
    });
    expect(chrome.permissions.request).not.toHaveBeenCalled();
  });

  it("releases only capture access that this request newly granted", async () => {
    await expect(
      releaseCaptureAccess({ granted: true, origin: "https://example.com/*", newlyGranted: true })
    ).resolves.toBe(true);
    expect(chrome.permissions.remove).toHaveBeenCalledWith({ origins: ["https://example.com/*"] });

    vi.clearAllMocks();
    await expect(
      releaseCaptureAccess({ granted: true, origin: "https://example.com/*", newlyGranted: false })
    ).resolves.toBe(true);
    expect(chrome.permissions.remove).not.toHaveBeenCalled();
  });

  it("does not derive capture origin patterns for unsupported schemes", () => {
    expect(captureOriginPatternFromUrl("chrome://extensions")).toBeUndefined();
    expect(captureOriginPatternFromUrl("http://example.com/post")).toBeUndefined();
  });
});
