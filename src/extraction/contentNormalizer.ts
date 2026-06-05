import type { AssetCandidate } from "../types";

const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "template",
  "iframe",
  "form",
  "button",
  "input",
  "select",
  "textarea",
  "video",
  "audio",
  "svg",
  "canvas",
  "nav",
  "footer",
  "[hidden]",
  '[aria-hidden="true"]'
];

export interface NormalizationResult {
  html: string;
  textContent: string;
  length: number;
  assets: AssetCandidate[];
  warnings: string[];
}

export function normalizeArticleHtml(html: string, baseUrl: string): NormalizationResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<article>${html}</article>`, "text/html");
  const root = doc.querySelector("article") ?? doc.body;
  const warnings: string[] = [];

  for (const node of root.querySelectorAll(REMOVE_SELECTORS.join(","))) {
    warnings.push(`removed:${node.tagName.toLowerCase()}`);
    node.remove();
  }

  for (const element of root.querySelectorAll<HTMLElement>("*")) {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.toLowerCase().startsWith("on")) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  const assets = collectImageCandidates(root, baseUrl);
  const textContent = (root.textContent ?? "").replace(/\s+/g, " ").trim();

  return {
    html: root.innerHTML.trim(),
    textContent,
    length: textContent.length,
    assets,
    warnings: Array.from(new Set(warnings))
  };
}

export function collectImageCandidates(root: ParentNode, baseUrl: string): AssetCandidate[] {
  const candidates = new Map<string, AssetCandidate>();

  for (const image of root.querySelectorAll<HTMLImageElement>("img")) {
    const alt = image.alt?.trim();
    const caption = nearestCaption(image);
    const width = numericAttribute(image, "width");
    const height = numericAttribute(image, "height");
    const urls = [
      { url: firstPresent(image.getAttribute("src"), image.dataset.src, image.dataset.original), source: "img-src" as const },
      { url: firstPresent(image.getAttribute("data-src")), source: "lazy" as const },
      { url: largestSrcsetCandidate(image.getAttribute("srcset") ?? image.getAttribute("data-srcset")), source: "img-srcset" as const },
      { url: linkedImage(image), source: "linked-image" as const }
    ];

    for (const candidate of urls) {
      if (!candidate.url) continue;
      const absolute = toAbsoluteUrl(candidate.url, baseUrl);
      if (!absolute || candidates.has(absolute)) continue;
      candidates.set(absolute, {
        url: absolute,
        source: candidate.source,
        ...(alt ? { alt } : {}),
        ...(caption ? { caption } : {}),
        ...(width ? { width } : {}),
        ...(height ? { height } : {})
      });
    }
  }

  return [...candidates.values()];
}

function firstPresent(...values: Array<string | null | undefined>): string | undefined {
  return values.find((value) => value?.trim())?.trim();
}

function largestSrcsetCandidate(srcset: string | null): string | undefined {
  if (!srcset) return undefined;
  const candidates = srcset
    .split(",")
    .map((entry) => {
      const [url, descriptor] = entry.trim().split(/\s+/, 2);
      const score = descriptor?.endsWith("w") ? Number.parseInt(descriptor, 10) : descriptor?.endsWith("x") ? Number.parseFloat(descriptor) * 1000 : 0;
      return { url, score: Number.isFinite(score) ? score : 0 };
    })
    .filter((entry): entry is { url: string; score: number } => Boolean(entry.url));

  return candidates.sort((a, b) => b.score - a.score)[0]?.url;
}

function linkedImage(image: HTMLImageElement): string | undefined {
  const anchor = image.closest<HTMLAnchorElement>("a[href]");
  const href = anchor?.getAttribute("href")?.trim();
  if (!href) return undefined;
  return /\.(avif|gif|jpe?g|png|webp)(\?|#|$)/i.test(href) ? href : undefined;
}

function nearestCaption(image: HTMLImageElement): string | undefined {
  const figure = image.closest("figure");
  const caption = figure?.querySelector("figcaption")?.textContent?.replace(/\s+/g, " ").trim();
  return caption || undefined;
}

function numericAttribute(element: Element, name: string): number | undefined {
  const parsed = Number.parseInt(element.getAttribute(name) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function toAbsoluteUrl(value: string, baseUrl: string): string | undefined {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}
