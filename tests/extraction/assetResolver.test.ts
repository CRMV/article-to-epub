import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractReadableArticle } from "../../src/extraction/readabilityAdapter";
import { resolveArticleAssets } from "../../src/extraction/assetResolver";
import { planImageBudget } from "../../src/ebook/imageBudget";
import type { PageSnapshot } from "../../src/types";

describe("resolveArticleAssets", () => {
  it("keeps CDN hosts visible without leaking query-string provenance", () => {
    const html = readFileSync(join(process.cwd(), "tests/fixtures/articles/difficult-image-cors-shape.html"), "utf8");
    const snapshot: PageSnapshot = {
      mode: "document",
      url: "https://article.example/post",
      title: "Difficult",
      html,
      capturedAt: new Date(0).toISOString()
    };
    const result = extractReadableArticle(snapshot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const assets = resolveArticleAssets(result.article, "https://cdn.example.net/cover.jpg?tracking=secret");

    expect(assets.some((asset) => asset.candidate.url.includes("cdn.example.net"))).toBe(true);
    expect(assets.some((asset) => asset.classification === "unsafe")).toBe(true);
    expect(assets.some((asset) => asset.classification === "unsupported")).toBe(true);
  });

  it("marks recipe-excluded assets and keeps preferred recipe sources first", () => {
    const snapshot: PageSnapshot = {
      mode: "document",
      url: "https://writings.stephenwolfram.com/2026/post",
      title: "Recipe assets",
      html: "<article><h1>Recipe assets</h1><p>Enough article text to parse.</p></article>",
      capturedAt: new Date(0).toISOString()
    };
    const assets = resolveArticleAssets(
      {
        title: "Recipe assets",
        contentHtml: "",
        textContent: "",
        length: 0,
        assets: [
          { url: "https://writings.stephenwolfram.com/wp-content/plugins/badge.png", source: "img-src", width: 1200, height: 800 },
          { url: "https://writings.stephenwolfram.com/content/photo.jpg", source: "img-src", width: 1200, height: 800 },
          { url: "https://writings.stephenwolfram.com/content/background.jpg", source: "linked-image", width: 1200, height: 800 }
        ]
      },
      undefined,
      snapshot
    );

    expect(assets[0]?.candidate.url).toContain("/wp-content/plugins/");
    expect(assets[0]).toMatchObject({ recipeExcluded: true });
    expect(assets[1]?.candidate.source).toBe("img-src");

    const decisions = planImageBudget(assets, "smart-images", "amazon-web");
    expect(decisions[0]).toMatchObject({ include: false, reason: "recipe-excluded" });
  });
});
