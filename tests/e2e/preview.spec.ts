import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { PageSnapshot } from "../../src/types";
import { buildPreviewFromSnapshot } from "../../src/ui/state/conversionStore";

describe("preview pipeline", () => {
  it("builds a target-page preview model with metadata and report", () => {
    const snapshot: PageSnapshot = {
      mode: "document",
      url: "https://writings.stephenwolfram.com/2023/02/a-50-year-quest-my-personal-journey-with-the-second-law-of-thermodynamics/",
      title: "Wolfram Fixture",
      html: readFileSync(join(process.cwd(), "tests/fixtures/articles/wolfram-shape.html"), "utf8"),
      capturedAt: new Date(0).toISOString()
    };

    const result = buildPreviewFromSnapshot(snapshot, { imageMode: "smart-images", route: "amazon-web" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.metadata.author).toBe("Stephen Wolfram");
    expect(result.preview.report.hosts).toContain("content.wolfram.com");
    expect(result.preview.article.textContent).toContain("Computational irreducibility");
  });
});

