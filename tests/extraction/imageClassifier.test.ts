import { describe, expect, it } from "vitest";
import { classifyImage, unsafeReason } from "../../src/extraction/imageClassifier";

describe("classifyImage", () => {
  it("marks private addresses as unsafe", () => {
    expect(unsafeReason("http://127.0.0.1/private.png")).toBe("private-address");
    expect(unsafeReason("http://192.168.1.3/private.png")).toBe("private-address");
  });

  it("rejects unsupported schemes", () => {
    expect(unsafeReason("file:///Users/example/image.png")).toBe("unsupported-scheme");
    expect(unsafeReason("chrome://extensions/icon.png")).toBe("unsupported-scheme");
  });

  it("marks public http images unsafe because optional permissions are https-only", () => {
    expect(unsafeReason("http://example.com/image.png")).toBe("insecure-http");
  });

  it("classifies useful images as meaningful", () => {
    expect(
      classifyImage({
        url: "https://example.com/diagram.jpg",
        source: "img-src",
        alt: "Useful diagram",
        width: 1200,
        height: 800
      }).classification
    ).toBe("meaningful");
  });

  it("classifies small unlabelled images as decorative", () => {
    expect(
      classifyImage({
        url: "https://example.com/pixel.png",
        source: "img-src",
        width: 1,
        height: 1
      }).classification
    ).toBe("decorative");
  });
});
