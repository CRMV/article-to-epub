import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildEpub, buildFileName } from "../../src/ebook/epubBuilder";
import type { NormalizedArticle, ResolvedMetadata } from "../../src/types";

const article: NormalizedArticle = {
  title: "Readable Article",
  contentHtml: "<h2>First Section</h2><p>Hello <strong>reader</strong>.</p><img src=\"https://example.com/image.jpg\" alt=\"Diagram\" />",
  textContent: "First Section Hello reader.",
  length: 27,
  assets: []
};

const metadata: ResolvedMetadata = {
  title: "Readable Article",
  author: "Avery Stone",
  publishedDate: "2026-06-05",
  language: "en",
  source: "Example Daily",
  canonicalUrl: "https://example.com/readable",
  candidates: {
    title: [],
    author: [],
    source: [],
    publishedDate: [],
    language: [],
    canonicalUrl: []
  },
  warnings: []
};

describe("buildEpub", () => {
  it("generates an EPUB container with metadata, nav, article, and stylesheet", async () => {
    const bytes = await buildEpub({
      article,
      metadata,
      assets: [
        {
          originalUrl: "https://example.com/image.jpg",
          href: "images/image-1.jpg",
          mediaType: "image/jpeg",
          data: new Uint8Array([1, 2, 3])
        }
      ]
    });
    const zip = await JSZip.loadAsync(bytes);

    await expect(zip.file("mimetype")?.async("string")).resolves.toBe("application/epub+zip");
    await expect(zip.file("META-INF/container.xml")?.async("string")).resolves.toContain("OEBPS/package.opf");
    await expect(zip.file("OEBPS/package.opf")?.async("string")).resolves.toContain("<dc:creator>Avery Stone</dc:creator>");
    await expect(zip.file("OEBPS/nav.xhtml")?.async("string")).resolves.toContain("First Section");
    await expect(zip.file("OEBPS/text/article.xhtml")?.async("string")).resolves.toContain("../images/image-1.jpg");
    expect(zip.file("OEBPS/images/image-1.jpg")).toBeTruthy();
  });

  it("builds clean filenames from edited metadata", () => {
    expect(buildFileName(metadata)).toBe("readable-article__avery-stone__2026-06-05.epub");
  });
});

