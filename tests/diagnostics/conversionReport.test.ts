import { describe, expect, it } from "vitest";
import type { AssetDecision } from "../../src/ebook/imageBudget";
import type { ResolvedAsset } from "../../src/extraction/assetResolver";
import { buildConversionReport, redactedHost } from "../../src/diagnostics/conversionReport";

function decision(url: string, include: boolean, reason?: AssetDecision["reason"]): AssetDecision {
  const asset: ResolvedAsset = {
    candidate: { url, source: "img-src", alt: "Image" },
    classification: include ? "meaningful" : "unsafe",
    estimatedBytes: 1000
  };
  return { asset, include, ...(reason ? { reason } : {}) };
}

describe("conversion report", () => {
  it("redacts URLs to hostnames", () => {
    expect(redactedHost("https://cdn.example.net/path/image.jpg?token=secret#frag")).toBe("cdn.example.net");
  });

  it("reports counts and safe skip messages without query strings", () => {
    const report = buildConversionReport(
      [decision("https://cdn.example.net/path/image.jpg?token=secret", true), decision("http://127.0.0.1/private.png", false, "unsafe")],
      "download"
    );

    expect(report.includedImages).toBe(1);
    expect(report.skippedImages).toBe(1);
    expect(report.hosts).toEqual(["127.0.0.1", "cdn.example.net"]);
    expect(JSON.stringify(report)).not.toContain("token=secret");
    expect(report.warnings[0]?.code).toBe("image-skipped-unsafe");
  });
});

