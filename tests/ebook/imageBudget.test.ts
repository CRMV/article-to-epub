import { describe, expect, it } from "vitest";
import type { ResolvedAsset } from "../../src/extraction/assetResolver";
import { planImageBudget, totalEstimatedBytes } from "../../src/ebook/imageBudget";

function asset(url: string, estimatedBytes: number, classification: ResolvedAsset["classification"] = "meaningful"): ResolvedAsset {
  return {
    candidate: { url, source: "img-src", alt: "Image" },
    classification,
    estimatedBytes
  };
}

describe("planImageBudget", () => {
  it("skips all images in text-only mode", () => {
    const decisions = planImageBudget([asset("https://example.com/a.jpg", 1000)], "text-only", "download");
    expect(decisions[0]).toMatchObject({ include: false, reason: "text-only" });
  });

  it("keeps only one image in cover-only mode", () => {
    const decisions = planImageBudget(
      [asset("https://example.com/cover.jpg", 1000, "cover"), asset("https://example.com/inline.jpg", 1000)],
      "cover-only",
      "download"
    );

    expect(decisions.map((decision) => decision.include)).toEqual([true, false]);
  });

  it("stops before the selected route budget", () => {
    const decisions = planImageBudget(
      [asset("https://example.com/a.jpg", 30 * 1024 * 1024), asset("https://example.com/b.jpg", 30 * 1024 * 1024)],
      "smart-images",
      "email-handoff"
    );

    expect(decisions[0]?.include).toBe(true);
    expect(decisions[1]).toMatchObject({ include: false, reason: "size-budget" });
    expect(totalEstimatedBytes(decisions)).toBeGreaterThan(30 * 1024 * 1024);
  });
});

