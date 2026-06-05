# Privacy Policy Draft

Article Ferry processes the active page only after the user clicks the extension action.

## Data Processed Locally

- Article HTML snapshots and selected text.
- Metadata candidates such as title, author, publication date, source, and canonical URL.
- Image URLs and image bytes selected for EPUB generation.
- Generated EPUB files.

## Local Storage

The MVP uses `chrome.storage.local` for preferences, optional Kindle email handoff targets entered by the user, image mode defaults, and same-site metadata correction rules. It does not use `chrome.storage.sync`.

Stored data must not include Amazon passwords, Amazon cookies, generated EPUB files, article bodies, or full reading-history URLs.

## Network and Telemetry

The MVP has no analytics, no remote crash reporting, no backend, and no automatic diagnostic upload. Optional image-host access is requested only when the user chooses an image mode that needs it.

## Amazon

Article Ferry is not affiliated with Amazon. The extension does not automate Amazon login, access Amazon cookies, scrape account pages, or call private Amazon delivery endpoints.

