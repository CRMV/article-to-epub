import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi, type Mock } from "vitest";
import type { PageSnapshot } from "../../src/types";
import {
  applyRememberedMetadataRules,
  buildPreviewFromSnapshot,
  buildWorkbenchPreviewFromSnapshot,
  metadataWithEdits,
  openGraphImageFromSnapshot
} from "../../src/ui/state/conversionStore";

describe("preview pipeline", () => {
  it("builds a target-page preview model with metadata and report", () => {
    const snapshot: PageSnapshot = {
      mode: "document",
      url: "https://writings.stephenwolfram.com/2023/02/a-50-year-quest-my-personal-journey-with-the-second-law-of-thermodynamics/",
      title: "Wolfram Fixture",
      html: readFileSync(join(process.cwd(), "tests/fixtures/articles/wolfram-shape.html"), "utf8"),
      capturedAt: new Date(0).toISOString()
    };

    const result = buildPreviewFromSnapshot(snapshot, { imageMode: "smart-images", route: "amazon-web" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.metadata.author).toBe("Stephen Wolfram");
    expect(result.preview.report.hosts).toContain("content.wolfram.com");
    expect(result.preview.article.textContent).toContain("Computational irreducibility");
  });

  it("uses Open Graph image metadata as a cover candidate", () => {
    const snapshot: PageSnapshot = {
      mode: "document",
      url: "https://example.com/articles/test",
      title: "Cover Fixture",
      html: '<html><head><meta property="og:image" content="/cover.jpg"></head><body><article><h1>Cover</h1><p>Enough article text to parse.</p></article></body></html>',
      capturedAt: new Date(0).toISOString()
    };

    expect(openGraphImageFromSnapshot(snapshot)).toBe("https://example.com/cover.jpg");
  });

  it("builds async workbench diagnostics with permission preflight", async () => {
    (chrome.permissions.contains as unknown as Mock).mockImplementation(async ({ origins }: { origins: string[] }) => {
      return origins[0] === "https://article.example/*";
    });
    const snapshot: PageSnapshot = {
      mode: "document",
      url: "https://article.example/post",
      title: "Workbench",
      html: '<article><h1>Workbench</h1><p>Enough article text to parse.</p><img src="https://cdn.example.net/cover.jpg" width="1200" height="800"></article>',
      capturedAt: new Date(0).toISOString()
    };

    const result = await buildWorkbenchPreviewFromSnapshot(snapshot, {
      imageMode: "smart-images",
      route: "amazon-web",
      profileId: "rich-web-upload"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.profileId).toBe("rich-web-upload");
    expect(result.preview.permissionPreflight).toMatchObject({
      requiredOrigins: ["https://cdn.example.net"],
      grantedOrigins: [],
      missingOrigins: ["https://cdn.example.net"]
    });
    expect(result.preview.stages?.some((stage) => stage.name === "permission-preflight" && stage.status === "blocked")).toBe(true);
    expect(result.preview.timings?.map((timing) => timing.stage)).toContain("permission-preflight");
    expect(result.preview.generatedFileName).toBe("article-example__workbench.epub");

    vi.mocked(chrome.permissions.contains).mockReset();
  });

  it("preserves explicit blank metadata edits except for required title fallback", () => {
    const metadata = {
      title: "Original title",
      author: "Original author",
      candidates: { title: [], author: [], source: [], publishedDate: [], language: [], canonicalUrl: [] },
      warnings: []
    };

    expect(metadataWithEdits(metadata, { title: "", author: "" })).toMatchObject({
      title: "Original title",
      author: ""
    });
  });

  it("applies path-specific remembered metadata ahead of domain defaults", () => {
    const snapshot: PageSnapshot = {
      mode: "document",
      url: "https://example.com/articles/one",
      title: "Original",
      html: "<article><h1>Original</h1><p>Enough article text to parse.</p></article>",
      capturedAt: new Date(0).toISOString()
    };
    const metadata = {
      title: "Original",
      author: "Original author",
      candidates: { title: [], author: [], source: [], publishedDate: [], language: [], canonicalUrl: [] },
      warnings: []
    };

    const remembered = applyRememberedMetadataRules(metadata, snapshot, [
      {
        site: "example.com",
        field: "author",
        value: "Domain author",
        updatedAt: new Date(2).toISOString()
      },
      {
        site: "example.com",
        pathPrefix: "/articles",
        field: "author",
        value: "Path author",
        updatedAt: new Date(1).toISOString()
      }
    ]);

    expect(remembered.author).toBe("Path author");
    expect(remembered.candidates.author?.[0]).toMatchObject({
      source: "remembered URL rule",
      value: "Path author",
      role: "reader-author"
    });
  });
});
