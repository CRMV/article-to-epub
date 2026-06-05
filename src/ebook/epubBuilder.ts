import JSZip from "jszip";
import type { NormalizedArticle, ResolvedMetadata } from "../types";
import { containerXml, navXhtml, packageOpf, stylesheet, type ManifestAsset } from "./epubManifest";
import { sanitizeForEpub, wrapXhtmlDocument } from "./kindleSanitizer";
import { addHeadingIds } from "./tocBuilder";

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
}

export async function buildEpub(input: BuildEpubInput): Promise<Uint8Array> {
  const zip = new JSZip();
  const title = input.metadata.title ?? input.article.title;
  const assets = input.assets ?? [];
  const hrefByUrl = new Map(assets.map((asset) => [asset.originalUrl, `../${asset.href}`]));
  const sanitized = sanitizeForEpub(input.article.contentHtml, hrefByUrl);
  const withToc = addHeadingIds(`<h1 id="top">${escapeHtml(title)}</h1>${sanitized}`);
  const articleXhtml = wrapXhtmlDocument(title, withToc.html);
  const manifestAssets: ManifestAsset[] = assets.map((asset, index) => ({
    id: `image-${index + 1}`,
    href: asset.href,
    mediaType: asset.mediaType
  }));

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", containerXml());
  zip.file("OEBPS/package.opf", packageOpf(input.metadata, manifestAssets));
  zip.file("OEBPS/nav.xhtml", navXhtml(title, withToc.toc));
  zip.file("OEBPS/text/article.xhtml", articleXhtml);
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

export function buildFileName(metadata: ResolvedMetadata): string {
  const pieces = [metadata.title ?? "article", metadata.author, metadata.publishedDate]
    .filter((piece): piece is string => Boolean(piece?.trim()))
    .map((piece) =>
      piece
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    )
    .filter(Boolean);
  return `${pieces.join("__") || "article"}.epub`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

