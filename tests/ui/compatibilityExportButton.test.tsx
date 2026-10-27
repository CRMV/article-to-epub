import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompatibilityExportButton } from "../../src/ui/components/CompatibilityExportButton";
import type { PreviewModel } from "../../src/types";

const preview: PreviewModel = {
  snapshot: {
    mode: "document",
    url: "https://example.com/private/article?token=secret",
    title: "Private Article",
    html: "<article>Private Body</article>",
    capturedAt: new Date(0).toISOString()
  },
  article: {
    title: "Article",
    contentHtml: "<p>Body</p>",
    textContent: "Body",
    length: 4,
    assets: []
  },
  metadata: {
    title: "Private Article",
    candidates: {
      title: [{ field: "title", value: "Private Article", source: "document title", confidence: 0.8 }],
      author: [],
      source: [],
      publishedDate: [],
      language: [],
      canonicalUrl: []
    },
    warnings: []
  },
  imageMode: "text-only",
  route: "download",
  report: {
    includedImages: 0,
    skippedImages: 1,
    estimatedBytes: 120_000,
    hosts: ["cdn.example.net"],
    warnings: [{ severity: "notice", code: "image-skipped-size-budget", message: "Skipped private image" }]
  },
  timings: [{ stage: "metadata", label: "Metadata resolved", at: new Date(0).toISOString(), durationMs: 2 }],
  permissionPreflight: {
    requiredOrigins: ["https://cdn.example.net"],
    grantedOrigins: [],
    missingOrigins: ["https://cdn.example.net"],
    checkedAt: new Date(0).toISOString()
  },
  recipeIds: ["example-recipe"]
};

describe("CompatibilityExportButton", () => {
  it("previews and exports the exact JSON payload", async () => {
    const onExport = vi.fn();
    render(<CompatibilityExportButton preview={preview} onExport={onExport} />);

    expect(screen.getByText("Preview JSON")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Export kit" }));

    expect(onExport).toHaveBeenCalledWith(expect.stringContaining('"version": 1'), "article-to-epub-compatibility-example.com.json");
    const [payload] = onExport.mock.calls[0] as [string, string];
    const kit = JSON.parse(payload);

    expect(kit.snapshot.sourceHost).toBe("example.com");
    expect(kit.metadata[0]).toMatchObject({ field: "title", candidateSources: ["document title"], candidateCount: 1 });
    expect(kit.report.warnings[0]).toEqual({ severity: "notice", code: "image-skipped-size-budget", hasAction: false });
    expect(kit.timings[0]).toMatchObject({ stage: "metadata", durationMs: 2 });
    expect(kit.permissions.missingHosts).toEqual(["cdn.example.net"]);
    expect(payload).not.toContain("https://cdn.example.net");
    expect(kit.recipes).toEqual(["example-recipe"]);
    expect(payload).not.toContain("Private Article");
    expect(payload).not.toContain("Private Body");
    expect(payload).not.toContain("token=secret");
  });
});
