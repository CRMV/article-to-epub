import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MetadataRulesPanel } from "../../src/ui/components/MetadataRulesPanel";

describe("MetadataRulesPanel", () => {
  it("renders remembered rules and emits delete", () => {
    const onDelete = vi.fn();
    const rule = {
      site: "fs.blog",
      field: "author" as const,
      value: "Charlie Munger",
      updatedAt: new Date(0).toISOString()
    };

    render(<MetadataRulesPanel rules={[rule]} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText(/fs.blog/)).toBeInTheDocument();
    expect(onDelete).toHaveBeenCalledWith(rule);
  });
});
