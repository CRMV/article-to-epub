import { describe, expect, it } from "vitest";
import { sanitizeForEpub, wrapXhtmlDocument } from "../../src/ebook/kindleSanitizer";

describe("sanitizeForEpub", () => {
  it("removes unsupported elements and replaces skipped images with alt text", () => {
    const html = sanitizeForEpub('<p onclick="bad()">Hello</p><script>bad()</script><img src="https://example.com/missing.jpg" alt="Missing diagram" />');

    expect(html).toContain("<p>Hello</p>");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("<script");
    expect(html).toContain("Image skipped: Missing diagram");
  });

  it("wraps content in an XHTML document", () => {
    expect(wrapXhtmlDocument("Title", "<p>Hello</p>")).toContain('xmlns="http://www.w3.org/1999/xhtml"');
  });
});

