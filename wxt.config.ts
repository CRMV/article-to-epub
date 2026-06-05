import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Article Ferry",
    short_name: "Article Ferry",
    description: "Convert the current article page into a Kindle-ready EPUB file with local preview and metadata editing.",
    version: "0.1.0",
    manifest_version: 3,
    action: {
      default_title: "Article Ferry"
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

