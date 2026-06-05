import { describe, expect, it } from "vitest";
import { normalizeDate } from "../../src/extraction/dateCandidates";

describe("normalizeDate", () => {
  it("normalizes citation slash dates", () => {
    expect(normalizeDate("2023/02/02")).toBe("2023-02-02");
  });

  it("normalizes ISO timestamps", () => {
    expect(normalizeDate("2020-03-02T12:04:49+00:00")).toBe("2020-03-02");
  });
});

