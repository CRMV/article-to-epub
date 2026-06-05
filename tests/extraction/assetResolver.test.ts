import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractReadableArticle } from "../../src/extraction/readabilityAdapter";
import { resolveArticleAssets } from "../../src/extraction/assetResolver";
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
});

