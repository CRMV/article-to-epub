import { resolve, sep } from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "@playwright/test";

test("side panel keeps primary actions visible at narrow width", async ({ page }) => {
  const server = await serveStaticDirectory(resolve(process.cwd(), ".output/chrome-mv3"));

  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "chrome", {
      value: {
        downloads: { download: async () => 1 },
        permissions: { contains: async () => false, request: async () => false, remove: async () => true },
        runtime: {
          getURL: (path: string) => `chrome-extension://test${path}`,
          onMessage: { addListener: () => undefined, removeListener: () => undefined },
          sendMessage: async () => ({ ok: false, message: "No active article in this test." })
        },
        storage: {
          local: { get: async () => ({}), set: async () => undefined, remove: async () => undefined },
          session: { get: async () => ({}), set: async () => undefined, remove: async () => undefined }
        },
        tabs: { create: async () => undefined },
        sidePanel: { open: async () => undefined },
        scripting: { executeScript: async () => [] }
      }
    });
  });

  try {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`${server.url}/sidepanel.html`);

    await expect(page.getByRole("heading", { name: "Article to EPUB" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Capture" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible();
  } finally {
    await server.close();
  }
});

async function serveStaticDirectory(root: string): Promise<{ url: string; close: () => Promise<void> }> {
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

      response.setHeader("Content-Type", contentTypeFor(filePath));
      createReadStream(filePath).pipe(response);
    } catch {
      response.statusCode = 404;
      response.end("Not found");
    }
  });

  await listen(server);
  const address = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolveClose, rejectClose) => {
        server.close((error) => (error ? rejectClose(error) : resolveClose()));
      })
  };
}

function listen(server: Server): Promise<void> {
  return new Promise((resolveListen) => {
    server.listen(0, "127.0.0.1", resolveListen);
  });
}

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".js")) return "text/javascript";
  if (filePath.endsWith(".png")) return "image/png";

  return "application/octet-stream";
}
