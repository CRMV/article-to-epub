import { describe, expect, it, vi, type Mock } from "vitest";
import { planAssetPermissions, removeAssetOrigins, requestAssetOrigins } from "../../src/extraction/permissionPlanner";

describe("permissionPlanner", () => {
  it("plans only cross-origin https assets", () => {
    const plan = planAssetPermissions("https://article.example/post", [
      { url: "https://article.example/image.jpg", source: "img-src" },
      { url: "https://cdn.example.net/image.jpg", source: "img-src" },
      { url: "http://cdn.example.net/image.jpg", source: "img-src" }
    ]);

    expect(plan.requiredOrigins).toEqual(["https://cdn.example.net"]);
    expect(plan.optionalHostPatterns).toEqual(["https://cdn.example.net/*"]);
  });

  it("requests and removes host permissions with explicit origins", async () => {
    const permissions = chrome.permissions as unknown as {
      request: Mock;
      remove: Mock;
    };
    permissions.request.mockResolvedValue(true);
    permissions.remove.mockResolvedValue(true);

    await expect(requestAssetOrigins(["https://cdn.example.net"])).resolves.toBe(true);
    await expect(removeAssetOrigins(["https://cdn.example.net"])).resolves.toBe(true);

    expect(chrome.permissions.request).toHaveBeenCalledWith({ origins: ["https://cdn.example.net/*"] });
    expect(chrome.permissions.remove).toHaveBeenCalledWith({ origins: ["https://cdn.example.net/*"] });
  });
});
