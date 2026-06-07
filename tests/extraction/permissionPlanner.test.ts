import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { checkAssetOriginGrants, planAssetPermissions } from "../../src/extraction/permissionPlanner";

describe("permission planner", () => {
  beforeEach(() => {
    (chrome.permissions.contains as unknown as Mock).mockReset();
    (chrome.permissions.request as unknown as Mock).mockReset();
  });

  it("plans only cross-origin https image hosts", () => {
    const plan = planAssetPermissions("https://example.com/article", [
      { url: "https://example.com/a.jpg", source: "img-src" },
      { url: "https://cdn.example.net/a.jpg", source: "img-src" },
      { url: "http://cdn.example.net/a.jpg", source: "img-src" }
    ]);

    expect(plan.requiredOrigins).toEqual(["https://cdn.example.net"]);
    expect(plan.optionalHostPatterns).toEqual(["https://cdn.example.net/*"]);
  });

  it("checks current grants without prompting", async () => {
    (chrome.permissions.contains as unknown as Mock).mockImplementation(async ({ origins }: { origins: string[] }) =>
      origins.includes("https://granted.example/*")
    );

    await expect(checkAssetOriginGrants(["https://granted.example", "https://missing.example"])).resolves.toEqual([
      "https://granted.example"
    ]);
    expect(chrome.permissions.request).not.toHaveBeenCalled();
  });
});
