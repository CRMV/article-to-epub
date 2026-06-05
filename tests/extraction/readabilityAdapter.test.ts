import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { PageSnapshot } from "../../src/types";
import { extractReadableArticle } from "../../src/extraction/readabilityAdapter";

function fixture(name: string): string {
  return readFileSync(join(process.cwd(), "tests/fixtures/articles", name), "utf8");
}

function snapshot(name: string, url = "https://example.com/article"): PageSnapshot {
  return {
    mode: "document",
    url,
    title: "Fixture",
    html: fixture(name),
    capturedAt: new Date(0).toISOString()
  };
}

describe("extractReadableArticle", () => {
  it("extracts a normal article fixture", () => {
    const result = extractReadableArticle(snapshot("ordinary-news-shape.html"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.title).toContain("City Library");
    expect(result.article.textContent).toContain("quiet reading room");
  });

  it("extracts the Wolfram-shaped article and image candidates", () => {
    const result = extractReadableArticle(
      snapshot(
        "wolfram-shape.html",
        "https://writings.stephenwolfram.com/2023/02/a-50-year-quest-my-personal-journey-with-the-second-law-of-thermodynamics/"
      )
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.textContent).toContain("Computational irreducibility");
    expect(result.article.assets.some((asset) => asset.url.includes("content.wolfram.com"))).toBe(true);
    expect(result.article.assets.some((asset) => asset.caption?.includes("Rule 30"))).toBe(true);
  });

  it("extracts the FS.blog-shaped transcript without page furniture", () => {
    const result = extractReadableArticle(snapshot("fsblog-shape.html", "https://fs.blog/great-talks/psychology-human-misjudgment/"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.textContent).toContain("Charlie Munger gave this talk");
    expect(result.article.assets[0]?.url).toBe("https://fs.blog/images/munger.jpg");
  });

  it("uses selected content when a selection snapshot is present", () => {
    const result = extractReadableArticle({
      mode: "selection",
      url: "https://example.com/selection",
      title: "Selected Notes",
      html: fixture("ordinary-blog-shape.html"),
      selectionHtml: "<h2>Chosen section</h2><p>Only this paragraph should be exported.</p>",
      selectedText: "Only this paragraph should be exported.",
      capturedAt: new Date(0).toISOString()
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.textContent).toContain("Only this paragraph");
    expect(result.article.textContent).not.toContain("Small improvements");
  });

  it("returns a structured failure for unreadable pages", () => {
    const result = extractReadableArticle({
      mode: "document",
      url: "https://example.com/empty",
      title: "Empty",
      html: "<html><body><nav>Menu</nav></body></html>",
      capturedAt: new Date(0).toISOString()
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/empty|readability-failed/);
  });
});

