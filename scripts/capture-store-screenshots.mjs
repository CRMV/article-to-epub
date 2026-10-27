import { createReadStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, sep } from "node:path";
import { chromium } from "@playwright/test";

const root = resolve(process.cwd(), ".output/chrome-mv3");
const outDir = resolve(process.cwd(), "docs/store");
const articleHtml = `<!doctype html><html lang="en"><head>
  <title>Reading a long filing on a Kindle</title>
  <meta name="author" content="Article Desk" />
</head><body><article>
  <h1>Reading a long filing on a Kindle</h1>
  <p>Public registration statements run for hundreds of pages. Article to EPUB keeps the capture on this computer, builds a reading view, and downloads an EPUB you can send yourself.</p>
  <h2>What stays in the preview</h2>
  <p>Headings, tables, and footnotes stay in the file. Images are optional. Nothing is uploaded to the extension author.</p>
  <p>Edit the title, author, date, and source before you generate the EPUB. Then download it and use Amazon's Send to Kindle page, or email it from an approved sender address.</p>
</article></body></html>`;

const snapshot = {
  mode: "document",
  url: "https://example.com/articles/long-filing",
  title: "Reading a long filing on a Kindle",
  html: articleHtml,
  capturedAt: "2026-10-27T00:00:00.000Z"
};

const server = createServer(async (request, response) => {
  const requestPath = new URL(request.url ?? "/", "http://localhost").pathname;
  const filePath = resolve(root, `.${requestPath === "/" ? "/sidepanel.html" : requestPath}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.statusCode = 403;
    response.end("Forbidden");
    return;
  }
  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      response.statusCode = 404;
      response.end("Not found");
      return;
    }
    response.setHeader("Content-Type", contentType(filePath));
    createReadStream(filePath).pipe(response);
  } catch {
    response.statusCode = 404;
    response.end("Not found");
  }
});

await new Promise((listen) => server.listen(0, "127.0.0.1", listen));
const port = server.address().port;
const origin = `http://127.0.0.1:${port}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await page.addInitScript((storedSnapshot) => {
  Object.defineProperty(globalThis, "chrome", {
    value: {
      downloads: { download: async () => 1 },
      permissions: { contains: async () => true, request: async () => true, remove: async () => true },
      runtime: {
        getURL: (path) => `chrome-extension://store-preview${path}`,
        onMessage: { addListener() {}, removeListener() {} },
        sendMessage: async () => ({ ok: true })
      },
      storage: {
        local: { get: async () => ({}), set: async () => undefined, remove: async () => undefined },
        session: {
          get: async () => ({ latestPageSnapshot: storedSnapshot }),
          set: async () => undefined,
          remove: async () => undefined
        }
      },
      tabs: { create: async () => undefined },
      sidePanel: { open: async () => undefined },
      scripting: { executeScript: async () => [] }
    }
  });
}, snapshot);

await mkdir(outDir, { recursive: true });

async function shot(name, heading) {
  await page.setContent(
    `<!doctype html><html><head><style>
      html,body{margin:0;height:100%;background:#efe8dc;font-family:Georgia,serif;color:#1d1b17}
      .layout{display:grid;grid-template-columns:1fr 420px;height:100%}
      .article{padding:64px 72px 48px}
      h1{font-size:46px;line-height:1.12;margin:0 0 18px;font-weight:600}
      p{font-size:20px;line-height:1.5;max-width:38rem}
      .kicker{font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#1f6f63;font-weight:700}
      iframe{border:0;width:420px;height:100%;background:#f6f6f1;box-shadow:-12px 0 30px rgba(40,32,20,.08)}
    </style></head><body><div class="layout"><main class="article">
      <p class="kicker">Article to EPUB</p>
      <h1>Take a long page to Kindle.</h1>
      <p>The side panel is the real extension. It previews the capture, lets you edit the metadata, and downloads the EPUB on this computer.</p>
    </main><iframe src="${origin}/sidepanel.html"></iframe></div></body></html>`,
    { waitUntil: "load" }
  );
  const frame = page.frames().find((item) => item.url().includes("sidepanel.html"));
  if (!frame) throw new Error("Side panel frame did not load");
  await frame.getByRole("heading", { name: "Article to EPUB" }).waitFor();
  await frame.getByText("Public registration statements").waitFor();
  const target = frame.getByRole("heading", { name: heading, exact: true });
  await target.evaluate((element) => element.scrollIntoView({ block: "start", inline: "nearest" }));
  await page.waitForTimeout(100);
  await page.screenshot({ path: resolve(outDir, name), animations: "disabled" });
}

await shot("screenshot-metadata.png", "Metadata");
await shot("screenshot-preview.png", "Preview");
await shot("screenshot-delivery.png", "Delivery");

await page.setViewportSize({ width: 440, height: 280 });
await page.setContent(
  `<!doctype html><html><head><style>
    html,body{margin:0;height:100%;background:#1f6f63;color:#fff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
    .tile{height:100%;display:grid;grid-template-columns:168px 1fr;align-items:center;padding:0 22px 0 18px;gap:8px}
    img{width:132px;height:132px}
    h1{font-size:28px;line-height:1.05;margin:0 0 8px;font-weight:700}
    p{margin:0;font-size:15px;line-height:1.35;color:#e7f4f1}
  </style></head><body><div class="tile">
    <img src="${origin}/icon-128.png" alt="" />
    <div><h1>Article to EPUB</h1><p>Kindle-ready files from the page you are reading.</p></div>
  </div></body></html>`,
  { waitUntil: "load" }
);
await page.screenshot({ path: resolve(outDir, "promo-tile.png") });

await browser.close();
server.close();
console.log("wrote screenshots to", outDir);

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".js")) return "text/javascript";
  if (filePath.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}
