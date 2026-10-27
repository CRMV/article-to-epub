import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DeliveryPanel } from "../../src/ui/components/DeliveryPanel";

describe("DeliveryPanel", () => {
  it("opens Amazon upload without passing the click event as the URL", () => {
    const onOpenAmazon = vi.fn();

    render(
      <DeliveryPanel
        route="amazon-web"
        generatedFileName="article.epub"
        kindleEmail=""
        onKindleEmailChange={vi.fn()}
        onGenerate={vi.fn()}
        onOpenAmazon={onOpenAmazon}
        onEmail={vi.fn()}
        busy={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open upload" }));

    expect(onOpenAmazon).toHaveBeenCalledWith();
  });
});
