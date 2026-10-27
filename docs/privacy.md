# Privacy Policy

**Article to EPUB**  
Effective date: October 27, 2026

Article to EPUB is a browser extension that converts the active web page into an EPUB file on your computer. This policy describes what the extension handles and what it does not do.

## Who this applies to

This policy covers the Article to EPUB Chrome extension. It does not cover Amazon, the Chrome Web Store, or the websites you choose to capture.

Contact: [GitHub issues for CRMV/article-to-epub](https://github.com/CRMV/article-to-epub/issues).

## What the extension processes

After you click the extension, it reads the active tab so it can build a preview and an EPUB. That local processing can include:

- The page URL, title, and HTML needed to extract the article
- Text you have selected, if you capture a selection
- Metadata candidates such as title, author, date, source, and canonical URL
- Image URLs and, if you choose to include images, the image bytes needed for the EPUB
- The EPUB file generated from that capture

This processing happens in the extension on your device. Article content is not uploaded to the developer.

## What is stored on your device

The extension uses `chrome.storage.local` for settings you choose to keep:

- Image mode, delivery route, and selected Kindle profile
- An optional Send to Kindle email address, only if you type one in
- Metadata correction rules for a site or path, storing the corrected field and value

It does not use `chrome.storage.sync`. Stored data does not include Amazon passwords, Amazon cookies, generated EPUB files, article bodies, or a browsing-history list.

A captured page snapshot can remain in `chrome.storage.session` until you capture another page or the browser session ends. Session storage stays on the device.

## What is not collected

The extension has no account, no backend, no analytics, no advertising, and no remote crash reporting. It does not sell data. It does not use data for credit, lending, or interest-based ads. It does not send article HTML, selected text, metadata, or EPUB files to the developer.

Optional image-host access is requested only from an explicit action such as Generate EPUB, and only for image origins that are not the page you captured. The extension removes those optional host grants after that conversion attempt.

## Permissions

- **activeTab** reads the current page only after you click the extension.
- **scripting** runs the snapshot in that tab after the click.
- **sidePanel** shows the preview and export controls.
- **storage** keeps the local settings described above.
- **downloads** saves the EPUB you generate.
- **Optional host access** fetches cross-origin images you chose to include. It is not used to browse other sites.

## EPUB files you send yourself

Downloading an EPUB, uploading it on Amazon's Send to Kindle page, or attaching it to an email is something you do. Those services have their own privacy policies. Article to EPUB does not sign in to Amazon, read Amazon cookies, or call private Amazon delivery endpoints.

## Amazon

Article to EPUB is not affiliated with Amazon.

## Changes

If this policy changes, the updated version will replace this page and the effective date above will change.
