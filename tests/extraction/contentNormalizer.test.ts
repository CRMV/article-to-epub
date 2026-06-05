import { describe, expect, it } from "vitest";
import { normalizeArticleHtml } from "../../src/extraction/contentNormalizer";

describe("normalizeArticleHtml", () => {
  it("removes unsafe/runtime-only elements and inline handlers", () => {
    const result = normalizeArticleHtml(
      '<p onclick="alert(1)">Hello</p><script>bad()</script><form><input /></form><video src="x"></video>',
      "https://example.com/post"
    );

    expect(result.html).toContain("<p>Hello</p>");
    expect(result.html).not.toContain("onclick");
    expect(result.html).not.toContain("script");
    expect(result.html).not.toContain("form");
    expect(result.warnings).toContain("removed:script");
  });

  it("collects absolute image candidates from srcset and linked images", () => {
    const result = normalizeArticleHtml(
      '<figure><a href="/large.jpg"><img src="/small.jpg" srcset="/small.jpg 400w, /large.jpg 1200w" alt="Diagram" /><figcaption>A useful diagram.</figcaption></a></figure>',
      "https://example.com/articles/post"
    );

    expect(result.assets.map((asset) => asset.url)).toContain("https://example.com/small.jpg");
    expect(result.assets.map((asset) => asset.url)).toContain("https://example.com/large.jpg");
    expect(result.assets[0]?.caption).toBe("A useful diagram.");
    expect(result.html).toContain('data-asset-url="https://example.com/small.jpg"');
    expect(result.html).not.toContain("srcset");
    expect(result.html).not.toContain('src="/small.jpg"');
  });

  it("strips preview-loading URLs and unsafe link protocols", () => {
    const result = normalizeArticleHtml(
      '<p style="background:url(https://tracker.example/pixel)">Hello <a href="javascript:alert(1)">bad</a><img src="https://cdn.example.net/a.jpg" /></p><object data="https://example.com/file"></object>',
      "https://example.com/post"
    );

    expect(result.html).not.toContain("style=");
    expect(result.html).not.toContain("javascript:");
    expect(result.html).not.toContain("object");
    expect(result.html).not.toContain('src="https://cdn.example.net/a.jpg"');
    expect(result.html).toContain('data-asset-url="https://cdn.example.net/a.jpg"');
  });
});
