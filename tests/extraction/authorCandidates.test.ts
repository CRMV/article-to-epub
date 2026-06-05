import { describe, expect, it } from "vitest";
import { authorFromTitle } from "../../src/extraction/authorCandidates";

describe("authorFromTitle", () => {
  it("extracts a trailing byline from a page title", () => {
    expect(authorFromTitle("Psychology of Human Misjudgment (Transcript) by Charlie Munger")).toBe("Charlie Munger");
  });

  it("ignores titles without a byline", () => {
    expect(authorFromTitle("Notes on Better Reading Habits")).toBeUndefined();
  });
});

