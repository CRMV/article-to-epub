import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test("packages a narrow-permission Chrome extension build", async () => {
  const manifest = JSON.parse(await readFile(join(process.cwd(), ".output/chrome-mv3/manifest.json"), "utf8"));

  expect(manifest.manifest_version).toBe(3);
  expect(manifest.host_permissions).toEqual([]);
  expect(manifest.optional_host_permissions).toEqual(["https://*/*"]);
  expect(manifest.permissions).toEqual(expect.arrayContaining(["activeTab", "scripting", "sidePanel", "storage", "downloads"]));
  expect(manifest.side_panel.default_path).toBe("sidepanel.html");
});
