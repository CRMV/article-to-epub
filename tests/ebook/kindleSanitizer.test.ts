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

  it("rewrites packaged image markers to local XHTML image sources", () => {
    const html = sanitizeForEpub(
      '<p>Hello<br>reader</p><img data-asset-url="https://example.com/image.jpg" alt="Diagram">',
      new Map([["https://example.com/image.jpg", "../images/image-1.jpg"]])
    );

    expect(html).toContain('src="../images/image-1.jpg"');
    expect(html).not.toContain("data-asset-url");
    expect(new DOMParser().parseFromString(`<article>${html}</article>`, "application/xml").querySelector("parsererror")).toBeNull();
  });

  it("keeps visually superscripted note references as XHTML superscript", () => {
    const html = sanitizeForEpub(
      '<p>230 cities<font style="font-size:6.5pt;position:relative;top:-3.5pt">1</font> across 29 countries<a href="#note-2" style="font-size:6.5pt;position:relative;top:-3.5pt">2</a>.</p>'
    );

    expect(html).toContain('230 cities<sup class="noteref">1</sup> across 29 countries<sup class="noteref"><a href="#note-2">2</a></sup>.');
    expect(html).not.toContain("<font");
    expect(html).not.toContain("style=");
    expect(new DOMParser().parseFromString(`<article>${html}</article>`, "application/xml").querySelector("parsererror")).toBeNull();
  });

  it("serializes bullet paragraphs as XHTML lists", () => {
    const html = sanitizeForEpub('<p><span>•</span><span>Reliability:</span><span> Dependable access.</span></p><p>Next paragraph.</p>');

    expect(html).toContain("<ul><li><span>Reliability:</span><span> Dependable access.</span></li></ul>");
    expect(html).toContain("<p>Next paragraph.</p>");
    expect(new DOMParser().parseFromString(`<article>${html}</article>`, "application/xml").querySelector("parsererror")).toBeNull();
  });
});
