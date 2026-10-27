import { describe, expect, it } from "vitest";
import { isValidRecipe, matchingSiteRecipes, recipeIdsForSnapshot, siteRecipes } from "../../src/extraction/siteRecipes";
import type { PageSnapshot } from "../../src/types";

function snapshot(url: string): PageSnapshot {
  return {
    mode: "document",
    url,
    title: "Fixture",
    html: "<html><body><article><h1>Fixture</h1><p>Enough text to parse.</p></article></body></html>",
    capturedAt: new Date(0).toISOString()
  };
}

describe("site recipes", () => {
  it("matches only intended hosts", () => {
    expect(recipeIdsForSnapshot(snapshot("https://fs.blog/great-talks/psychology-human-misjudgment/"))).toEqual(["fs-blog"]);
    expect(matchingSiteRecipes(snapshot("https://example.com/article"))).toEqual([]);
  });

  it("keeps built-in recipes valid and internal", () => {
    expect(siteRecipes.every(isValidRecipe)).toBe(true);
  });

  it("rejects broad hosts and unsafe selectors", () => {
    expect(
      isValidRecipe({
        id: "bad",
        label: "Bad",
        host: "*.example.com",
        metadata: {}
      })
    ).toBe(false);
    expect(
      isValidRecipe({
        id: "bad-selector",
        label: "Bad selector",
        host: "example.com",
        metadata: {
          author: [{ source: "bad", selector: "script[src]", confidence: 1 }]
        }
      })
    ).toBe(false);
  });
});
