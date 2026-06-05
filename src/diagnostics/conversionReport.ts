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
    return new URL(rawUrl).hostname;
  } catch {
    return "invalid-url";
  }
}

