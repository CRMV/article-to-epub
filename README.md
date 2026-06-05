# Article Ferry

Article Ferry is a local-first Chrome extension that converts the current article page into a Kindle-ready EPUB file. It focuses on preview quality, editable metadata, image-aware size controls, and user-mediated handoff through Amazon-supported document routes.

Article Ferry is not affiliated with Amazon. It does not automate Amazon login, use Amazon credentials, access Amazon cookies, or call private Amazon delivery endpoints.

## Development

```bash
npm install
npm run dev
```

Load the generated `.output/chrome-mv3` directory in Chrome's extension developer mode.

## Verification

```bash
npm run verify
```

The verification command runs TypeScript, unit/component tests, and a Chrome MV3 build.

## Privacy Stance

Article content is processed locally in the browser extension. The MVP has no analytics, no remote crash reporting, no backend, and no automatic diagnostic upload.

## Manual Handoff

The extension downloads a generated EPUB. You can then upload that file through Amazon's Send to Kindle web page or send it by email from an approved sender address.

