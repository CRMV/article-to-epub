import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileSelector } from "../../src/ui/components/ProfileSelector";

describe("ProfileSelector", () => {
  it("renders built-in profiles and emits changes", () => {
    const onChange = vi.fn();
    render(<ProfileSelector selectedProfileId="default" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Kindle profile"), { target: { value: "fast-email" } });

    expect(screen.getByRole("option", { name: "Fast email" })).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith("fast-email");
  });
});
