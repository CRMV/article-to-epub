import type { ResolvedMetadata } from "../types";
import { escapeXml } from "./kindleSanitizer";
import type { TocEntry } from "./tocBuilder";

export interface ManifestAsset {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
}

export function containerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>
`;
}

export function packageOpf(metadata: ResolvedMetadata, assets: ManifestAsset[]): string {
  const title = metadata.title?.trim() || "Untitled Article";
  const identifier = stableIdentifier(metadata.canonicalUrl ?? title);
  const author = metadata.author?.trim() || "Unknown Author";
  const language = metadata.language?.trim() || "en";
  const date = metadata.publishedDate?.trim() || new Date().toISOString().slice(0, 10);
  const assetItems = assets
    .map((asset) => `    <item id="${asset.id}" href="${asset.href}" media-type="${asset.mediaType}"${asset.properties ? ` properties="${asset.properties}"` : ""} />`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="article-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="article-id">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>${escapeXml(language)}</dc:language>
    <dc:date>${escapeXml(date)}</dc:date>
    ${metadata.source?.trim() ? `<dc:publisher>${escapeXml(metadata.source)}</dc:publisher>` : ""}
    ${metadata.canonicalUrl?.trim() ? `<dc:source>${escapeXml(metadata.canonicalUrl)}</dc:source>` : ""}
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
    <item id="article" href="text/article.xhtml" media-type="application/xhtml+xml" />
    <item id="style" href="styles/article.css" media-type="text/css" />
${assetItems}
  </manifest>
  <spine>
    <itemref idref="article" />
  </spine>
</package>
`;
}

export function navXhtml(title: string, toc: TocEntry[]): string {
  const entries = toc.length > 0 ? toc : [{ id: "top", level: 1, label: title }];
  const links = entries
    .map((entry) => `      <li><a href="text/article.xhtml#${escapeXml(entry.id)}">${escapeXml(entry.label)}</a></li>`)
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head>
    <title>${escapeXml(title)}</title>
  </head>
  <body>
    <nav epub:type="toc" id="toc">
      <h1>${escapeXml(title)}</h1>
      <ol>
${links}
      </ol>
    </nav>
  </body>
</html>
`;
}

export function stylesheet(): string {
  return `body {
  font-family: serif;
  line-height: 1.45;
}
p {
  margin: 0 0 0.85em;
}
img {
  max-width: 100%;
  height: auto;
}
ul,
ol {
  margin: 0.35em 0 0.85em 1.4em;
  padding: 0;
}
li {
  margin: 0.3em 0;
}
sup,
.noteref {
  font-size: 0.72em;
  line-height: 0;
  vertical-align: super;
}
.image-skipped {
  color: #555;
  font-style: italic;
}
`;
}

function stableIdentifier(seed: string): string {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `article-to-epub-${hash.toString(16)}`;
}
