import { describe, expect, it } from "vitest";
import { buildEpub } from "../../src/ebook/epubBuilder";
import { extractReadableArticle } from "../../src/extraction/readabilityAdapter";
import type { PageSnapshot, ResolvedMetadata } from "../../src/types";

function snapshot(html: string, title = "Document"): PageSnapshot {
  return {
    mode: "document",
    url: "https://www.sec.gov/Archives/edgar/data/1/0001/example-sx1.htm",
    title,
    html,
    capturedAt: new Date(0).toISOString()
  };
}

const metadata: ResolvedMetadata = {
  title: "Filing",
  language: "en",
  candidates: { title: [], author: [], source: [], publishedDate: [], language: [], canonicalUrl: [] },
  warnings: []
};

describe("filing extraction", () => {
  it("linearizes absolutely positioned prospectus pages into flowing chapters", async () => {
    const page = (body: string) =>
      `<div style="position:relative;overflow:hidden;height:792pt;width:612pt">${body}</div>`;
    const line = (top: number, fonts: string) =>
      `<div style="position:absolute;top:${top}pt;width:612pt">${fonts}</div>`;
    const font = (text: string, options: { size?: number; left?: number; bold?: boolean } = {}) =>
      `<font style="font-size:${options.size ?? 9.5}pt;font-weight:${options.bold ? "bold" : "normal"};left:${options.left ?? 72}pt;position:absolute">${text}</font>`;

    const html = `<!doctype html><html><head><title>Document</title></head><body>
      <document><type>S-1</type><text>
      ${page(`
        ${line(40, font("Anthropic, PBC", { size: 16, left: 220, bold: true }))}
        ${line(80, `${font("The company builds AI systems for a wide range of enterprises and researchers.")}${font("1", { size: 6.5, left: 520 })}`)}
        ${line(92, font("Those systems are used in production across research, coding, and customer support workflows today."))}
        ${line(760, font("Table of Contents", { size: 8, left: 250 }))}
        ${line(774, font("4", { size: 8, left: 300 }))}
      `)}
      ${page(`
        ${line(70, font("RISK FACTORS", { size: 12, bold: true }))}
        ${line(96, font("An investment in the shares involves significant operational, technical, and regulatory risk for buyers."))}
        <div style="position:absolute;top:140pt;width:612pt"><table><tbody><tr>
          <td><div style="position:absolute;top:2pt;width:180pt">${font("Delaware", { size: 9, left: 10 })}</div></td>
          <td><div style="position:absolute;top:2pt;width:180pt">${font("7372", { size: 9, left: 10 })}</div></td>
        </tr></tbody></table></div>
        ${line(770, font("Table of Contents", { size: 8, left: 250 }))}
      `)}
      </text></document>
    </body></html>`;

    const result = extractReadableArticle(snapshot(html));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.article.title).toBe("Anthropic, PBC");
    expect(result.article.contentHtml).toContain("<h1>Anthropic, PBC</h1>");
    expect(result.article.contentHtml).toContain("<h2>RISK FACTORS</h2>");
    expect(result.article.contentHtml).toContain("<sup>1</sup>");
    expect(result.article.contentHtml).toContain("production across research");
    expect(result.article.contentHtml).toMatch(/Delaware/);
    expect(result.article.contentHtml).toContain("7372");
    expect(result.article.contentHtml).not.toContain("Table of Contents");
    expect(result.article.contentHtml).not.toContain(">4<");
    expect(result.article.contentHtml).not.toContain("<type");
    expect(result.article.textContent).not.toMatch(/\bS-1\b/);

    const bytes = await buildEpub({ article: result.article, metadata: { ...metadata, title: result.article.title } });
    expect(bytes.byteLength).toBeGreaterThan(500);
  });

  it("promotes Workiva section headings and drops the submission wrapper", () => {
    const repeated = Array.from({ length: 6 }, () =>
      `<div style="margin-bottom:9pt;text-align:justify;text-indent:18pt"><font style="font-size:10pt;font-weight:400">Lime provides convenient rentals and keeps expanding the operating footprint across cities.</font></div>`
    ).join("");
    const result = extractReadableArticle(snapshot(`<!doctype html><html><head><title>Document</title></head><body>
      <type>S-1</type><sequence>1</sequence>
      <div style="text-align:center"><font style="font-size:16pt;font-weight:700">Neutron Holdings, Inc.</font></div>
      <div style="margin-top:12pt;margin-bottom:6pt"><font style="font-size:10pt;font-weight:700">PROSPECTUS SUMMARY</font></div>
      <div style="margin-top:6pt;margin-bottom:9pt"><font style="font-size:10pt;font-weight:700">Overview</font></div>
      ${repeated}
    </body></html>`));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.article.title).toBe("Neutron Holdings, Inc.");
    expect(result.article.contentHtml).toContain("PROSPECTUS SUMMARY");
    expect(result.article.contentHtml.toLowerCase()).toMatch(/<h[12][^>]*>/);
    expect(result.article.contentHtml).toContain("Overview");
    expect(result.article.contentHtml).not.toContain("<type");
    expect(result.article.contentHtml).not.toContain("<sequence");
  });
});
