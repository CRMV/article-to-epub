import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsPanel } from "../../src/ui/components/SettingsPanel";

describe("SettingsPanel", () => {
  it("supports profile changes, closing, and confirmed clearing", () => {
    const onProfileChange = vi.fn();
    const onClose = vi.fn();
    const onClear = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    render(
      <SettingsPanel
        selectedProfileId="default"
        rules={[]}
        onProfileChange={onProfileChange}
        onRuleDelete={vi.fn()}
        onClear={onClear}
        onClose={onClose}
      />
    );

    fireEvent.change(screen.getByLabelText("Kindle profile"), { target: { value: "local-epub-only" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear local settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onProfileChange).toHaveBeenCalledWith("local-epub-only");
    expect(onClear).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
