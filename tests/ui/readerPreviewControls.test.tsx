import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReaderPreviewControls } from "../../src/ui/components/ReaderPreviewControls";

describe("ReaderPreviewControls", () => {
  it("keeps preview-only controls accessible", () => {
    const onDensityChange = vi.fn();
    const onShowImagesChange = vi.fn();
    render(
      <ReaderPreviewControls
        density="comfortable"
        showImages={true}
        onDensityChange={onDensityChange}
        onShowImagesChange={onShowImagesChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Compact" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Show images in preview" }));

    expect(onDensityChange).toHaveBeenCalledWith("compact");
    expect(onShowImagesChange).toHaveBeenCalledWith(false);
  });
});
