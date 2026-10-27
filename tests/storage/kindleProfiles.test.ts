import { describe, expect, it } from "vitest";
import { builtInProfiles, getProfile } from "../../src/storage/kindleProfiles";

describe("kindle profiles", () => {
  it("defines the built-in profile set", () => {
    expect(builtInProfiles.map((profile) => profile.id)).toEqual([
      "default",
      "fast-email",
      "rich-web-upload",
      "local-epub-only",
      "image-heavy"
    ]);
  });

  it("falls back to the default profile for unknown ids", () => {
    expect(getProfile("missing").id).toBe("default");
  });

  it("keeps profile behavior constrained to built-in choices", () => {
    expect(getProfile("fast-email")).toMatchObject({
      route: "email-handoff",
      imageMode: "cover-only",
      filenamePattern: "standard"
    });
    expect(getProfile("local-epub-only")).toMatchObject({
      route: "download",
      imageMode: "text-only",
      filenamePattern: "date-title"
    });
  });
});
