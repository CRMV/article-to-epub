import { describe, expect, it } from "vitest";
import config from "../../wxt.config";

const manifest = (config.manifest ?? {}) as Record<string, unknown>;

describe("manifest permissions", () => {
  it("keeps required host permissions empty", () => {
    expect(manifest.host_permissions).toEqual([]);
  });

  it("declares only the minimum required API permissions", () => {
    expect(manifest.permissions).toEqual([
      "activeTab",
      "scripting",
      "sidePanel",
      "storage",
      "downloads"
    ]);
  });

  it("does not request account or browsing-history capabilities", () => {
    expect(manifest.permissions).not.toContain("cookies");
    expect(manifest.permissions).not.toContain("history");
    expect(manifest.permissions).not.toContain("webRequest");
  });

  it("uses optional host access for runtime-discovered images", () => {
    expect(manifest.optional_host_permissions).toEqual(["https://*/*"]);
  });
});
