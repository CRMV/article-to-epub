import { describe, expect, it } from "vitest";
import { addHeadingIds, extractTocEntries } from "../../src/ebook/tocBuilder";

describe("tocBuilder", () => {
  it("extracts heading entries", () => {
    expect(extractTocEntries("<h2>First Section</h2><p>Body</p>")).toEqual([
      { id: "first-section", level: 2, label: "First Section" }
    ]);
  });

  it("adds stable heading ids to content", () => {
    const result = addHeadingIds("<h2>First Section</h2><h2>First Section</h2>");

    expect(result.html).toContain('id="first-section"');
    expect(result.html).toContain('id="first-section-2"');
    expect(result.toc).toHaveLength(2);
  });
});

