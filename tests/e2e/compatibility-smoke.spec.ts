import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPreviewFromSnapshot } from "../../src/ui/state/conversionStore";
import type { PageSnapshot } from "../../src/types";

function snapshot(name: string, url: string, title: string): PageSnapshot {
  return {
    mode: "document",
    url,
    title,
    html: readFileSync(join(process.cwd(), "tests/fixtures/articles", name), "utf8"),
    capturedAt: new Date(0).toISOString()
  };
}

describe("compatibility smoke targets", () => {
  it("keeps the Wolfram target metadata and CDN image host visible", () => {
    const result = buildPreviewFromSnapshot(
      snapshot(
        "wolfram-shape.html",
        "https://writings.stephenwolfram.com/2023/02/a-50-year-quest-my-personal-journey-with-the-second-law-of-thermodynamics/",
        "Wolfram"
      ),
      { imageMode: "smart-images", route: "amazon-web" }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.metadata.author).toBe("Stephen Wolfram");
    expect(result.preview.metadata.publishedDate).toBe("2023-02-02");
    expect(result.preview.report.hosts).toContain("content.wolfram.com");
  });

  it("keeps FS.blog reader-facing author separate from source", () => {
    const result = buildPreviewFromSnapshot(
      snapshot("fsblog-shape.html", "https://fs.blog/great-talks/psychology-human-misjudgment/", "FS Blog"),
      { imageMode: "smart-images", route: "amazon-web" }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.metadata.author).toBe("Charlie Munger");
    expect(result.preview.metadata.source).toBe("Farnam Street");
  });
});

