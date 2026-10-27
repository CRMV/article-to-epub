import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Article to EPUB",
    short_name: "Article to EPUB",
    description: "Send web articles to Kindle as EPUB with local preview, metadata editing, and image-aware size controls.",
    version: "1.0.0",
    action: {
      default_title: "Article to EPUB"
    },
    permissions: ["activeTab", "scripting", "sidePanel", "storage", "downloads"],
    host_permissions: [],
    optional_host_permissions: ["https://*/*"],
    icons: {
      "16": "/icon-16.png",
      "48": "/icon-48.png",
      "128": "/icon-128.png"
    }
  }
});
