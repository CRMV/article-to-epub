import JSZip from "jszip";
import type { KindleProfile, NormalizedArticle, ResolvedMetadata } from "../types";
import { containerXml, navXhtml, packageOpf, stylesheet, type ManifestAsset } from "./epubManifest";
import { sanitizeForEpub, wrapXhtmlDocument } from "./kindleSanitizer";
import { buildChapters } from "./tocBuilder";

export interface EpubBinaryAsset {
  originalUrl: string;
  href: string;
  mediaType: string;
  data: Uint8Array | ArrayBuffer;
}

export interface BuildEpubInput {
  article: NormalizedArticle;
  metadata: ResolvedMetadata;
  assets?: EpubBinaryAsset[];
  maxChapterChars?: number;
}

export async function buildEpub(input: BuildEpubInput): Promise<Uint8Array> {
  const zip = new JSZip();
  const title = input.metadata.title ?? input.article.title;
  const assets = input.assets ?? [];
  const hrefByUrl = new Map(assets.map((asset) => [asset.originalUrl, `../${asset.href}`]));
  const sanitized = sanitizeForEpub(input.article.contentHtml, hrefByUrl);
  const chapters = buildChapters(`<h1 id="top">${escapeHtml(title)}</h1>${sanitized}`, input.maxChapterChars);
  const documents = chapters.map((chapter, index) => ({
    id: chapters.length === 1 ? "article" : `chapter-${index + 1}`,
    href: chapter.href,
    xhtml: wrapXhtmlDocument(title, chapter.html)
  }));
  const manifestAssets: ManifestAsset[] = assets.map((asset, index) => ({
    id: `image-${index + 1}`,
    href: asset.href,
    mediaType: asset.mediaType
  }));

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", containerXml());
  zip.file("OEBPS/package.opf", packageOpf(input.metadata, manifestAssets, documents));
  zip.file("OEBPS/nav.xhtml", navXhtml(title, chapters.flatMap((chapter) => chapter.toc)));
  for (const document of documents) {
    zip.file(`OEBPS/${document.href}`, document.xhtml);
  }
  zip.file("OEBPS/styles/article.css", stylesheet());

  for (const asset of assets) {
    zip.file(`OEBPS/${asset.href}`, asset.data);
  }

  return zip.generateAsync({
    type: "uint8array",
    mimeType: "application/epub+zip",
    compression: "DEFLATE"
  });
}

export function buildFileName(metadata: ResolvedMetadata, pattern: KindleProfile["filenamePattern"] = "standard"): string {
  const maxBasenameLength = 180;
  const pieces = filenamePieces(metadata, pattern)
    .filter((piece): piece is string => Boolean(piece?.trim()))
    .map((piece) =>
      piece
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80)
        .replace(/-$/g, "")
    )
    .filter(Boolean);
  const basename = (pieces.join("__") || "article").slice(0, maxBasenameLength).replace(/[-_]+$/g, "") || "article";
  return `${basename}.epub`;
}

function filenamePieces(metadata: ResolvedMetadata, pattern: KindleProfile["filenamePattern"]): Array<string | undefined> {
  if (pattern === "source-title") return [metadata.source, metadata.title ?? "article", metadata.publishedDate];
  if (pattern === "date-title") return [metadata.publishedDate, metadata.title ?? "article", metadata.author];

  return [metadata.title ?? "article", metadata.author, metadata.publishedDate];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
