import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreviewWorkbench } from "../../src/ui/components/PreviewWorkbench";

describe("PreviewWorkbench", () => {
  it("shows default path metrics and collapsed diagnostics", () => {
    render(
      <PreviewWorkbench
        mode="document"
        route="amazon-web"
        imageMode="smart-images"
        generatedFileName="article.epub"
        stages={[
          { name: "extraction", status: "ready", message: "Text preview ready" },
          { name: "permission-preflight", status: "blocked", message: "Image host access will be requested on Generate." }
        ]}
        timings={[{ stage: "metadata", label: "Metadata resolved", at: new Date(0).toISOString(), durationMs: 2 }]}
        permissionPreflight={{
          requiredOrigins: ["https://cdn.example.net"],
          grantedOrigins: [],
          missingOrigins: ["https://cdn.example.net"],
          checkedAt: new Date(0).toISOString()
        }}
        recipeIds={["fs-blog"]}
        onOpenSettings={vi.fn()}
      />
    );

    expect(screen.getByText("article.epub")).toBeInTheDocument();
    expect(screen.getAllByText("Image host access will be requested on Generate.")).toHaveLength(2);
    expect(screen.getByText("Details")).toBeInTheDocument();
  });
});
