import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveMetadata } from "../../src/extraction/metadataResolver";
import type { PageSnapshot } from "../../src/types";

function snapshot(name: string, url: string, title = "Fixture"): PageSnapshot {
  return {
    mode: "document",
    url,
    title,
    html: readFileSync(join(process.cwd(), "tests/fixtures/articles", name), "utf8"),
    capturedAt: new Date(0).toISOString()
  };
}

describe("resolveMetadata", () => {
  it("prefills Stephen Wolfram and the citation date from the Wolfram target shape", () => {
    const metadata = resolveMetadata(
      snapshot(
        "wolfram-metadata.html",
        "https://writings.stephenwolfram.com/2023/02/a-50-year-quest-my-personal-journey-with-the-second-law-of-thermodynamics/"
      )
    );

    expect(metadata.author).toBe("Stephen Wolfram");
    expect(metadata.publishedDate).toBe("2023-02-02");
    expect(metadata.candidates.author[0]?.source).toBe("citation_author");
  });

  it("surfaces Charlie Munger as a reader-facing FS.blog author candidate", () => {
    const metadata = resolveMetadata(snapshot("fsblog-metadata.html", "https://fs.blog/great-talks/psychology-human-misjudgment/"));

    expect(metadata.author).toBe("Charlie Munger");
    expect(metadata.candidates.author[0]?.role).toBe("reader-author");
    expect(metadata.candidates.author.map((candidate) => candidate.value)).toContain("Shane Parrish");
    expect(metadata.source).toBe("Farnam Street");
  });

  it("leaves unknown author editable rather than inventing one", () => {
    const metadata = resolveMetadata(snapshot("ordinary-blog-shape.html", "https://quiet.example/post"));

    expect(metadata.author).toBeUndefined();
    expect(metadata.candidates.author).toEqual([]);
    expect(metadata.title).toBe("Notes on Better Reading Habits");
  });
});
