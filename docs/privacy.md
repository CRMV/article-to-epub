# Privacy Policy Draft

Article Ferry processes the active page only after the user clicks the extension action.

## Data Processed Locally

- Article HTML snapshots and selected text.
- Metadata candidates such as title, author, publication date, source, and canonical URL.
- Image URLs and image bytes selected for EPUB generation.
- Generated EPUB files.

## Local Storage

The MVP uses `chrome.storage.local` for preferences, optional Kindle email handoff targets entered by the user, Kindle profile selection, image mode defaults, and same-site metadata correction rules. It does not use `chrome.storage.sync`.

Stored data must not include Amazon passwords, Amazon cookies, generated EPUB files, article bodies, or full reading-history URLs.

Remembered metadata corrections are local rules scoped to a site or normalized path prefix. They store the corrected field and value, but not the article body, selected text, or query-string URL.

## Compatibility Kits

Compatibility kit export is user-initiated. The exported JSON is built from an allowlist of diagnostic summaries: extension version, snapshot mode, redacted hosts, warning codes, image counts, stage timings, route/image settings, and optional profile or recipe identifiers. It does not include article HTML, selected text, full URLs, Kindle email addresses, or raw metadata values by default.

## Network and Telemetry

The MVP has no analytics, no remote crash reporting, no backend, and no automatic diagnostic upload. Optional image-host access is checked in preview without prompting and requested only from an explicit user action such as Generate EPUB.

## Amazon

Article Ferry is not affiliated with Amazon. The extension does not automate Amazon login, access Amazon cookies, scrape account pages, or call private Amazon delivery endpoints.
