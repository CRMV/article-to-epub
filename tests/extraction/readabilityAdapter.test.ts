import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { PageSnapshot } from "../../src/types";
import { extractReadableArticle } from "../../src/extraction/readabilityAdapter";

function fixture(name: string): string {
  return readFileSync(join(process.cwd(), "tests/fixtures/articles", name), "utf8");
}

function snapshot(name: string, url = "https://example.com/article"): PageSnapshot {
  return {
    mode: "document",
    url,
    title: "Fixture",
    html: fixture(name),
    capturedAt: new Date(0).toISOString()
  };
}

describe("extractReadableArticle", () => {
  it("extracts a normal article fixture", () => {
    const result = extractReadableArticle(snapshot("ordinary-news-shape.html"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.title).toContain("City Library");
    expect(result.article.textContent).toContain("quiet reading room");
  });

  it("extracts the Wolfram-shaped article and image candidates", () => {
    const result = extractReadableArticle(
      snapshot(
        "wolfram-shape.html",
        "https://writings.stephenwolfram.com/2023/02/a-50-year-quest-my-personal-journey-with-the-second-law-of-thermodynamics/"
      )
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.textContent).toContain("Computational irreducibility");
    expect(result.article.assets.some((asset) => asset.url.includes("content.wolfram.com"))).toBe(true);
    expect(result.article.assets.some((asset) => asset.caption?.includes("Rule 30"))).toBe(true);
  });

  it("extracts the FS.blog-shaped transcript without page furniture", () => {
    const result = extractReadableArticle(snapshot("fsblog-shape.html", "https://fs.blog/great-talks/psychology-human-misjudgment/"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.textContent).toContain("Charlie Munger gave this talk");
    expect(result.article.assets[0]?.url).toBe("https://fs.blog/images/munger.jpg");
  });

  it("uses selected content when a selection snapshot is present", () => {
    const result = extractReadableArticle({
      mode: "selection",
      url: "https://example.com/selection",
      title: "Selected Notes",
      html: fixture("ordinary-blog-shape.html"),
      selectionHtml: "<h2>Chosen section</h2><p>Only this paragraph should be exported.</p>",
      selectedText: "Only this paragraph should be exported.",
      capturedAt: new Date(0).toISOString()
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.textContent).toContain("Only this paragraph");
    expect(result.article.textContent).not.toContain("Small improvements");
  });

  it("cleans Workiva print artifacts before extracting SEC filings", () => {
    const repeatedBody = Array.from({ length: 8 }, () =>
      `<div style="margin-bottom:9pt;text-align:justify;text-indent:18pt"><font style="font-size:10pt">Lime provides convenient rentals in approximately 230 cities</font><font style="font-size:6.5pt;position:relative;top:-3.5pt;vertical-align:baseline">1</font><font style="font-size:10pt"> across 29 countries. The platform combines hardware, software, data, operations, and government relations expertise for riders and cities.</font></div>`
    ).join("");
    const result = extractReadableArticle({
      mode: "document",
      url: "https://www.sec.gov/Archives/edgar/data/1699963/000162828026032523/neutronholdingsinc-sx1.htm",
      title: "Document",
      html: `<!doctype html><html><head><title>Document</title></head><body>
        <main>
          <div><font>TABLE OF CONTENTS</font></div>
          <div><table><tbody><tr><td><a href="#toc-only">OFFERING TOC ONLY</a></td><td><a href="#toc-only">12</a></td></tr><tr><td><a href="#risk">RISK TOC ONLY</a></td><td><a href="#risk">16</a></td></tr><tr><td><a href="#business">BUSINESS TOC ONLY</a></td><td><a href="#business">126</a></td></tr><tr><td></td><td>Page</td></tr></tbody></table></div>
          ${repeatedBody}
          <div style="height:72pt;position:relative;width:100%"><div style="bottom:0;position:absolute;width:100%"><div style="text-align:center"><font style="font-size:10pt">999</font></div></div></div>
          <div id="page-anchor"></div>
          <hr style="page-break-after:always">
          <div style="min-height:72pt;width:100%"><div><font><br></font></div></div>
          <div style="margin-bottom:9pt"><font style="font-size:10pt">•</font><font style="font-size:10pt">Proprietary Hardware:</font><font style="font-size:10pt"> Vehicles and fleet.</font></div>
          <div style="margin-bottom:9pt"><font style="font-size:10pt">•</font><font style="font-size:10pt">Software:</font><font style="font-size:10pt"> Rider and operations tools.</font></div>
        </main>
      </body></html>`,
      capturedAt: new Date(0).toISOString()
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.contentHtml).toContain("<sup>1</sup>");
    expect(result.article.contentHtml).toContain("<ul><li>");
    expect(result.article.contentHtml).not.toContain("TABLE OF CONTENTS");
    expect(result.article.contentHtml).not.toContain("OFFERING TOC ONLY");
    expect(result.article.contentHtml).not.toContain(">999<");
    expect(result.article.contentHtml).not.toContain("<hr");
    expect(result.article.textContent).not.toContain("999");
  });

  it("returns a structured failure for unreadable pages", () => {
    const result = extractReadableArticle({
      mode: "document",
      url: "https://example.com/empty",
      title: "Empty",
      html: "<html><body><nav>Menu</nav></body></html>",
      capturedAt: new Date(0).toISOString()
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/empty|readability-failed/);
  });
});
