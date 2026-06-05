import type { AssetCandidate } from "../types";

export type ImageClassification = "cover" | "meaningful" | "decorative" | "unsupported" | "unsafe";

export interface ClassifiedAsset {
  candidate: AssetCandidate;
  classification: ImageClassification;
  reason?: string;
}

const SUPPORTED_EXTENSIONS = /\.(avif|gif|jpe?g|png|webp)(\?|#|$)/i;
const UNSUPPORTED_EXTENSIONS = /\.(svg|bmp|tiff?)(\?|#|$)/i;

export function classifyImage(candidate: AssetCandidate): ClassifiedAsset {
  const safety = unsafeReason(candidate.url);
  if (safety) return { candidate, classification: "unsafe", reason: safety };

  if (UNSUPPORTED_EXTENSIONS.test(candidate.url)) {
    return { candidate, classification: "unsupported", reason: "unsupported-type" };
  }

  if (!SUPPORTED_EXTENSIONS.test(candidate.url)) {
    return { candidate, classification: "unsupported", reason: "unknown-image-type" };
  }

  if (candidate.source === "open-graph") {
    return { candidate, classification: "cover" };
  }

  if (isLikelyDecorative(candidate)) {
    return { candidate, classification: "decorative", reason: "decorative" };
  }

  return { candidate, classification: "meaningful" };
}

export function unsafeReason(rawUrl: string): string | undefined {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return "invalid-url";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return "unsupported-scheme";
  if (isLocalOrPrivateHost(url.hostname)) return "private-address";
  if (url.protocol === "http:") return "insecure-http";
  return undefined;
}

function isLikelyDecorative(candidate: AssetCandidate): boolean {
  const alt = candidate.alt?.trim();
  const caption = candidate.caption?.trim();
  const small = (candidate.width ?? 999) <= 80 || (candidate.height ?? 999) <= 80;
  return !alt && !caption && small;
}

function isLocalOrPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost")) return true;
  if (lower === "127.0.0.1" || lower === "::1") return true;
  const parts = lower.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  const [a, b] = parts as [number, number, number, number];
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127 || a === 169 && b === 254;
}
