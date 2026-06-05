import type { ConversionReport, ConversionWarning, ExtractionResult } from "../types";

export function compatibilityHints(report: ConversionReport, extraction?: ExtractionResult): ConversionWarning[] {
  const hints: ConversionWarning[] = [];

  if (extraction && !extraction.ok) {
    hints.push({
      severity: "blocking",
      code: "extraction-empty",
      message: "No readable article body was found.",
      action: "Select the article text manually and capture again."
    });
  }

  if (report.includedImages + report.skippedImages >= 25) {
    hints.push({
      severity: "warning",
      code: "many-images",
      message: "This article has many image candidates and may need a smaller image mode for Kindle delivery.",
      action: "Use cover-only mode if upload or email delivery fails."
    });
  }

  if (report.warnings.some((warning) => warning.code.includes("unsupported-type"))) {
    hints.push({
      severity: "notice",
      code: "unsupported-media",
      message: "Some media could not be represented in the EPUB package.",
      action: "Review the preview and conversion report before upload."
    });
  }

  if (report.warnings.some((warning) => warning.code.includes("unsafe"))) {
    hints.push({
      severity: "warning",
      code: "unsafe-assets-skipped",
      message: "Private or unsupported asset URLs were skipped.",
      action: "Continue with the generated EPUB; skipped assets are listed by host only."
    });
  }

  return hints;
}

