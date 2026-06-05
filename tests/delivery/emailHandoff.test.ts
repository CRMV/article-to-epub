import { describe, expect, it } from "vitest";
import { createEmailHandoff } from "../../src/delivery/emailHandoff";

describe("createEmailHandoff", () => {
  it("builds mailto guidance for a valid Kindle email", () => {
    const handoff = createEmailHandoff("reader@kindle.com", "Readable Article", "readable.epub");

    expect(handoff.mailtoUrl).toContain("mailto:reader%40kindle.com");
    expect(handoff.body).toContain("Attach readable.epub");
  });

  it("rejects non-Kindle recipient addresses", () => {
    expect(() => createEmailHandoff("reader@example.com", "Title", "file.epub")).toThrow("@kindle.com");
  });
});

