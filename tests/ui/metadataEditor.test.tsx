import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MetadataEditor } from "../../src/ui/components/MetadataEditor";
import type { ResolvedMetadata } from "../../src/types";

const metadata: ResolvedMetadata = {
  title: "Original Title",
  author: "Stephen Wolfram",
  publishedDate: "2023-02-02",
  source: "Stephen Wolfram Writings",
  candidates: {
    title: [{ field: "title", value: "Original Title", source: "document title", confidence: 0.8 }],
    author: [
      { field: "author", value: "Stephen Wolfram", source: "citation_author", confidence: 0.98 },
      { field: "author", value: "Wolfram", source: "site metadata", confidence: 0.4 }
    ],
    source: [],
    publishedDate: [],
    language: [],
    canonicalUrl: []
  },
  warnings: []
};

describe("MetadataEditor", () => {
  it("emits manual edits", () => {
    const onChange = vi.fn();
    render(<MetadataEditor metadata={metadata} edits={{}} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Author"), { target: { value: "Edited Author" } });

    expect(onChange).toHaveBeenCalledWith({ author: "Edited Author" });
  });

  it("lets users choose metadata alternatives", () => {
    const onChange = vi.fn();
    render(<MetadataEditor metadata={metadata} edits={{}} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Author alternatives"), { target: { value: "Wolfram" } });

    expect(onChange).toHaveBeenCalledWith({ author: "Wolfram" });
  });
});

