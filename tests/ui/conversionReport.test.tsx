import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConversionReport } from "../../src/ui/components/ConversionReport";

describe("ConversionReport", () => {
  it("renders image counts, estimated size, and warning actions", () => {
    render(
      <ConversionReport
        report={{
          includedImages: 2,
          skippedImages: 1,
          estimatedBytes: 1024 * 1024,
          hosts: ["cdn.example.net"],
          warnings: [
            {
              severity: "warning",
              code: "route-limit-near",
              message: "Close to the route limit.",
              action: "Use cover-only mode."
            }
          ]
        }}
      />
    );

    expect(screen.getByText("2 included")).toBeInTheDocument();
    expect(screen.getByText("1 skipped")).toBeInTheDocument();
    expect(screen.getByText("Close to the route limit.")).toBeInTheDocument();
    expect(screen.getByText("Use cover-only mode.")).toBeInTheDocument();
  });
});

