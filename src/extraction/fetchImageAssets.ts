import type { EpubBinaryAsset } from "../ebook/epubBuilder";
import type { AssetDecision } from "../ebook/imageBudget";

export interface FetchImageOptions {
  maxBytesPerAsset?: number;
  timeoutMs?: number;
  concurrency?: number;
}

const DEFAULT_MAX_BYTES_PER_ASSET = 8 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_CONCURRENCY = 4;

export async function fetchIncludedImageAssets(
  decisions: AssetDecision[],
  options: FetchImageOptions = {}
): Promise<EpubBinaryAsset[]> {
  const included = decisions.filter((decision) => decision.include);
  const maxBytes = options.maxBytesPerAsset ?? DEFAULT_MAX_BYTES_PER_ASSET;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetched = await mapWithConcurrency(
    included,
    options.concurrency ?? DEFAULT_CONCURRENCY,
    (decision, index) => fetchImage(decision.asset.candidate.url, index + 1, maxBytes, timeoutMs)
  );
  return fetched.filter((asset): asset is EpubBinaryAsset => Boolean(asset));
}

async function fetchImage(
  url: string,
  index: number,
  maxBytes: number,
  timeoutMs: number
): Promise<EpubBinaryAsset | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal
    });
    if (new URL(response.url || url).origin !== new URL(url).origin) return undefined;
    if (!response.ok) return undefined;
    const contentLength = Number.parseInt(response.headers.get("content-length") ?? "", 10);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) return undefined;
    const mediaType = response.headers.get("content-type")?.split(";")[0]?.trim() || mediaTypeFromUrl(url);
    if (!mediaType.startsWith("image/")) return undefined;
    const data = await readResponseBytes(response, maxBytes);
    if (!data) return undefined;
    return {
      originalUrl: url,
      href: `images/image-${index}.${extensionForMediaType(mediaType)}`,
      mediaType,
      data
    };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseBytes(response: Response, maxBytes: number): Promise<Uint8Array | undefined> {
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    return buffer.byteLength <= maxBytes ? new Uint8Array(buffer) : undefined;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }

  const data = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return data;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index] as T, index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(Math.max(concurrency, 1), items.length) }, worker));
  return results;
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
