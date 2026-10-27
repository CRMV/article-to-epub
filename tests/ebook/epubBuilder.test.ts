import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildEpub, buildFileName } from "../../src/ebook/epubBuilder";
import { normalizeArticleHtml } from "../../src/extraction/contentNormalizer";
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
    const articleXhtml = await zip.file("OEBPS/text/article.xhtml")?.async("string");
    expect(articleXhtml).toBeTruthy();
    const xml = new DOMParser().parseFromString(articleXhtml ?? "", "application/xml");
    expect(xml.querySelector("parsererror")).toBeNull();
    expect(zip.file("OEBPS/images/image-1.jpg")).toBeTruthy();
  });

  it("embeds normalized relative article images using local EPUB hrefs", async () => {
    const normalized = normalizeArticleHtml(
      '<h2>Images</h2><p>Body<br>line</p><img src="/images/diagram.jpg" alt="Diagram">',
      "https://example.com/articles/post"
    );
    const bytes = await buildEpub({
      article: {
        ...article,
        contentHtml: normalized.html,
        assets: normalized.assets
      },
      metadata,
      assets: [
        {
          originalUrl: "https://example.com/images/diagram.jpg",
          href: "images/image-1.jpg",
          mediaType: "image/jpeg",
          data: new Uint8Array([1, 2, 3])
        }
      ]
    });
    const zip = await JSZip.loadAsync(bytes);
    const articleXhtml = await zip.file("OEBPS/text/article.xhtml")?.async("string");

    expect(articleXhtml).toContain("../images/image-1.jpg");
    expect(articleXhtml).not.toContain("Image skipped");
    expect(new DOMParser().parseFromString(articleXhtml ?? "", "application/xml").querySelector("parsererror")).toBeNull();
  });

  it("builds clean filenames from edited metadata", () => {
    expect(buildFileName(metadata)).toBe("readable-article__avery-stone__2026-06-05.epub");
    expect(buildFileName(metadata, "source-title")).toBe("example-daily__readable-article__2026-06-05.epub");
    expect(buildFileName(metadata, "date-title")).toBe("2026-06-05__readable-article__avery-stone.epub");
  });

  it("splits very large articles into multiple spine documents", async () => {
    const section = (index: number) => `<h2>Section ${index}</h2>${"<p>Readable paragraph for the Kindle chapter split.</p>".repeat(8)}`;
    const bytes = await buildEpub({
      article: { ...article, contentHtml: Array.from({ length: 6 }, (_value, index) => section(index + 1)).join("") },
      metadata,
      maxChapterChars: 700
    });
    const zip = await JSZip.loadAsync(bytes);
    const names = Object.keys(zip.files).filter((name) => name.startsWith("OEBPS/text/") && name.endsWith(".xhtml"));
    expect(names.length).toBeGreaterThan(1);
    expect(names.every((name) => name.includes("chapter-"))).toBe(true);
    const opf = await zip.file("OEBPS/package.opf")?.async("string");
    expect(opf).toContain("chapter-1");
    const nav = await zip.file("OEBPS/nav.xhtml")?.async("string");
    expect(nav).toContain("chapter-");
    expect(nav).toContain("Section 1");
  });

  it("caps pathological filename metadata", () => {
    const longMetadata = {
      ...metadata,
      title: "A".repeat(10_000),
      source: "Source".repeat(1000),
      author: "Author".repeat(1000)
    };

    const filename = buildFileName(longMetadata, "source-title");
    expect(filename.endsWith(".epub")).toBe(true);
    expect(filename.length).toBeLessThanOrEqual(185);
  });
});
