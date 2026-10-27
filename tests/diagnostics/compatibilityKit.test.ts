import { describe, expect, it } from "vitest";
import { buildCompatibilityKit, compatibilityKitFileName } from "../../src/diagnostics/compatibilityKit";
import type { PreviewModel } from "../../src/types";

const preview: PreviewModel = {
  snapshot: {
    mode: "document",
    url: "https://example.com/private/article?token=secret#frag",
    canonicalUrl: "https://example.com/private/article?utm=secret",
    title: "Sensitive title",
    html: "<article>Private body</article>",
    selectedText: "Private selected text",
    capturedAt: new Date(0).toISOString()
  },
  article: {
    title: "Sensitive title",
    contentHtml: "<p>Private body</p>",
    textContent: "Private body",
    length: 12,
    assets: []
  },
  metadata: {
    title: "Sensitive title",
    author: "Private Author",
    candidates: {
      title: [{ field: "title", value: "Sensitive title", source: "document title", confidence: 0.8 }],
      author: [{ field: "author", value: "Private Author", source: "manual", confidence: 1 }],
      source: [],
      publishedDate: [],
      language: [],
      canonicalUrl: []
    },
    warnings: []
  },
  imageMode: "smart-images",
  route: "amazon-web",
  report: {
    includedImages: 1,
    skippedImages: 1,
    estimatedBytes: 500_000,
    hosts: ["cdn.example.net"],
    warnings: [{ severity: "notice", code: "image-skipped-size-budget", message: "Skipped https://cdn.example.net/a.jpg?token=secret" }]
  },
  profileId: "default",
  timings: [{ stage: "metadata", label: "Metadata resolved", at: new Date(0).toISOString(), durationMs: 2 }],
  permissionPreflight: {
    requiredOrigins: ["https://cdn.example.net", "https://nas.local"],
    grantedOrigins: [],
    missingOrigins: ["https://cdn.example.net", "https://nas.local"],
    checkedAt: new Date(0).toISOString()
  },
  recipeIds: ["example"]
};

describe("compatibility kit", () => {
  it("exports diagnostic summaries without sensitive metadata values or full URLs", () => {
    const kit = buildCompatibilityKit(preview);
    const serialized = JSON.stringify(kit);

    expect(kit.snapshot.sourceHost).toBe("example.com");
    expect(kit.metadata[0]).toMatchObject({ field: "title", candidateSources: ["document title"], candidateCount: 1 });
    expect(kit.report.warnings[0]).toEqual({
      severity: "notice",
      code: "image-skipped-size-budget",
      hasAction: false
    });
    expect(serialized).not.toContain("Sensitive title");
    expect(serialized).not.toContain("Private Author");
    expect(serialized).not.toContain("Private body");
    expect(serialized).not.toContain("token=secret");
    expect(serialized).not.toContain("#frag");
    expect(serialized).not.toContain("https://cdn.example.net");
    expect(serialized).not.toContain("nas.local");
    expect(kit.permissions).toEqual({
      requiredHosts: ["cdn.example.net", "private-host"],
      grantedHosts: [],
      missingHosts: ["cdn.example.net", "private-host"]
    });
  });

  it("builds a safe filename from the source host", () => {
    expect(compatibilityKitFileName(preview)).toBe("article-to-epub-compatibility-example.com.json");
  });
});
