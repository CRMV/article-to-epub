import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchIncludedImageAssets } from "../../src/extraction/fetchImageAssets";
import type { AssetDecision } from "../../src/ebook/imageBudget";

function decision(url: string, include = true): AssetDecision {
  return {
    include,
    asset: {
      candidate: { url, source: "img-src" },
      classification: "meaningful",
      estimatedBytes: 1000
    }
  };
}

describe("fetchIncludedImageAssets", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches included images and assigns stable EPUB hrefs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } }))
    );

    const assets = await fetchIncludedImageAssets([decision("https://example.com/a.png"), decision("https://example.com/b.jpg", false)]);

    expect(assets).toHaveLength(1);
    expect(assets[0]?.href).toBe("images/image-1.png");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("drops failed, non-image, redirected, and oversized responses", async () => {
    const redirected = new Response(new Uint8Array([1]), {
      headers: { "content-type": "image/jpeg" },
      status: 200
    });
    Object.defineProperty(redirected, "url", { value: "https://redirect.example/image.jpg" });

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("missing", { status: 404 }))
        .mockResolvedValueOnce(new Response("html", { headers: { "content-type": "text/html" } }))
        .mockResolvedValueOnce(redirected)
        .mockResolvedValueOnce(
          new Response(new Uint8Array([1, 2, 3]), {
            headers: { "content-length": "999", "content-type": "image/jpeg" }
          })
        )
    );

    const assets = await fetchIncludedImageAssets(
      [
        decision("https://example.com/404.jpg"),
        decision("https://example.com/not-image.jpg"),
        decision("https://other.example/image.jpg"),
        decision("https://example.com/oversize.jpg")
      ],
      { maxBytesPerAsset: 2, concurrency: 1 }
    );

    expect(assets).toEqual([]);
  });
});
