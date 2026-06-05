import { describe, expect, it } from "vitest";
import { compatibilityHints } from "../../src/diagnostics/compatibilityHints";
import type { ConversionReport } from "../../src/types";

const baseReport: ConversionReport = {
  includedImages: 0,
  skippedImages: 0,
  estimatedBytes: 1000,
  warnings: [],
  hosts: []
};

describe("compatibilityHints", () => {
  it("turns extraction failures into recovery hints", () => {
    expect(
      compatibilityHints(baseReport, {
        ok: false,
        reason: "readability-failed",
        message: "No readable article body was found."
      })[0]
    ).toMatchObject({ code: "extraction-empty", severity: "blocking" });
  });

  it("warns about large image sets", () => {
    expect(compatibilityHints({ ...baseReport, includedImages: 10, skippedImages: 20 }).map((hint) => hint.code)).toContain("many-images");
  });

  it("summarizes unsupported and unsafe asset warnings", () => {
    const hints = compatibilityHints({
      ...baseReport,
      warnings: [
        { severity: "notice", code: "image-skipped-unsupported-type", message: "Skipped." },
        { severity: "warning", code: "image-skipped-unsafe", message: "Skipped." }
      ]
    });

    expect(hints.map((hint) => hint.code)).toEqual(["unsupported-media", "unsafe-assets-skipped"]);
  });
});

