# Official Send to Kindle Research

## Public Facts

- Amazon publishes an official Chrome extension named "Send to Kindle for Google Chrome" on the Chrome Web Store.
- The public listing describes quick send, preview, selected-text send, editable title/author fields, and delivery to devices or Kindle Library.
- The public listing also says some sites may be incompatible when they prevent extension use or when JavaScript-blocking extensions interfere.
- Amazon documents supported delivery routes through web upload, authorized email address, Kindle mobile apps, desktop apps, and the Chrome extension.
- Amazon documents web upload support up to 200 MB and email constraints around 50 MB attachments, approved senders, throttling, and incompatible web extraction.

## Public Failure Signals

Secondary public review mirrors and user reports cluster around:

- Sign-in loops.
- Failed preview or upload actions.
- Broken buttons.
- Missing images.
- Metadata fields, especially author, left blank or weakly inferred.

These signals are treated as product discovery inputs, not as authoritative telemetry.

## Target Page Observations

### Stephen Wolfram Article

- Strong citation metadata exists for Stephen Wolfram and 2023-02-02.
- The page is image-heavy, with most representative assets hosted on `content.wolfram.com`.
- A useful converter should not silently drop every image, but it also needs route-aware image budgets.

### FS.blog Charlie Munger Article

- JSON-LD and Open Graph metadata exist.
- Reader-facing authorship is nuanced because the title says "by Charlie Munger" while site metadata can name Shane Parrish or Farnam Street.
- A useful converter should surface Charlie Munger as the reader-facing author candidate while keeping publisher/source candidates separate.

## Decisions Shaped by Research

- Do not automate Amazon login or private delivery endpoints.
- Do not use Amazon branding, icons, or product identity.
- Generate a local EPUB and use documented Amazon routes for handoff.
- Keep image and metadata diagnostics visible before download.
- Treat Chrome Store permission and privacy disclosures as part of the product.

