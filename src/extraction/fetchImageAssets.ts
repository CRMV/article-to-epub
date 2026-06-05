import type { EpubBinaryAsset } from "../ebook/epubBuilder";
import type { AssetDecision } from "../ebook/imageBudget";

export async function fetchIncludedImageAssets(decisions: AssetDecision[]): Promise<EpubBinaryAsset[]> {
  const included = decisions.filter((decision) => decision.include);
  const fetched = await Promise.all(
    included.map((decision, index) => fetchImage(decision.asset.candidate.url, index + 1))
  );
  return fetched.filter((asset): asset is EpubBinaryAsset => Boolean(asset));
}

async function fetchImage(url: string, index: number): Promise<EpubBinaryAsset | undefined> {
  try {
    const response = await fetch(url, {
      credentials: "omit",
      referrerPolicy: "no-referrer"
    });
    if (!response.ok) return undefined;
    const mediaType = response.headers.get("content-type")?.split(";")[0]?.trim() || mediaTypeFromUrl(url);
    if (!mediaType.startsWith("image/")) return undefined;
    const data = new Uint8Array(await response.arrayBuffer());
    return {
      originalUrl: url,
      href: `images/image-${index}.${extensionForMediaType(mediaType)}`,
      mediaType,
      data
    };
  } catch {
    return undefined;
  }
}

function mediaTypeFromUrl(url: string): string {
  if (/\.png(\?|#|$)/i.test(url)) return "image/png";
  if (/\.webp(\?|#|$)/i.test(url)) return "image/webp";
  if (/\.gif(\?|#|$)/i.test(url)) return "image/gif";
  if (/\.avif(\?|#|$)/i.test(url)) return "image/avif";
  return "image/jpeg";
}

function extensionForMediaType(mediaType: string): string {
  if (mediaType === "image/png") return "png";
  if (mediaType === "image/webp") return "webp";
  if (mediaType === "image/gif") return "gif";
  if (mediaType === "image/avif") return "avif";
  return "jpg";
}
