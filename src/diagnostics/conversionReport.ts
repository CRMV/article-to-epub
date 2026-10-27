import type { ConversionReport, ConversionWarning, DeliveryRoute } from "../types";
import type { AssetDecision } from "../ebook/imageBudget";
import { ROUTE_LIMITS, totalEstimatedBytes } from "../ebook/imageBudget";

export function buildConversionReport(decisions: AssetDecision[], route: DeliveryRoute): ConversionReport {
  const estimatedBytes = totalEstimatedBytes(decisions);
  const warnings: ConversionWarning[] = [];
  const routeLimit = ROUTE_LIMITS[route];

  if (estimatedBytes > routeLimit) {
    warnings.push({
      severity: "blocking",
      code: "route-limit-exceeded",
      message: "The estimated EPUB size exceeds the selected delivery route limit.",
      action: "Choose text-only, cover-only, or a different delivery route."
    });
  } else if (estimatedBytes > routeLimit * 0.82) {
    warnings.push({
      severity: "warning",
      code: "route-limit-near",
      message: "The estimated EPUB size is close to the selected delivery route limit.",
      action: "Use cover-only mode if Amazon rejects the file."
    });
  }

  for (const decision of decisions) {
    if (!decision.include && decision.reason) {
      warnings.push({
        severity: decision.reason === "unsafe" ? "warning" : "notice",
        code: `image-skipped-${decision.reason}`,
        message: `An image from ${redactedHost(decision.asset.candidate.url)} was skipped: ${decision.reason}.`
      });
    }
  }

  return {
    includedImages: decisions.filter((decision) => decision.include).length,
    skippedImages: decisions.filter((decision) => !decision.include).length,
    estimatedBytes,
    warnings,
    hosts: [...new Set(decisions.map((decision) => redactedHost(decision.asset.candidate.url)))].sort()
  };
}

export function redactedHost(rawUrl: string): string {
  try {
    const hostname = new URL(rawUrl).hostname;
    return isPrivateHost(hostname) ? "private-host" : hostname;
  } catch {
    return "invalid-url";
  }
}

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (lower === "localhost" || lower.endsWith(".localhost")) return true;
  if (lower.endsWith(".local") || lower.endsWith(".lan") || lower.endsWith(".home.arpa")) return true;
  if (!lower.includes(".") && lower !== "::1") return true;
  if (lower === "127.0.0.1" || lower === "::1") return true;
  const parts = lower.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  const [a, b] = parts as [number, number, number, number];
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127 || a === 169 && b === 254;
}
