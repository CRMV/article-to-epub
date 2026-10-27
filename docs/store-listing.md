# Chrome Web Store Listing Draft

## Public Name

Article to EPUB

## Short Description

Send web articles to Kindle as EPUB.

## Detailed Description

Article to EPUB converts the current web article into a clean EPUB file you can download and send through Amazon-supported document routes.

Use it when a web article is worth reading away from the browser. The extension captures the active page after you click it, builds a readable local preview, lets you edit title, author, date, and source metadata, and shows image and file-size warnings before export.

Features:
- Convert the active article page into a Kindle-ready EPUB
- Preview the article before generating the file
- Edit metadata before download
- Choose image handling modes for smaller or richer files
- Save reusable local Kindle/profile preferences
- Download the EPUB for Send to Kindle web upload or approved-sender email

Article to EPUB is not affiliated with Amazon. It does not automate Amazon login, use Amazon credentials, or call private Amazon delivery endpoints.

## Permission Justification

- `activeTab`: capture the current page only after the user clicks the extension action.
- `scripting`: inject the snapshot function into the active tab after that user action.
- `sidePanel`: show the preview, metadata editor, and delivery handoff controls.
- `storage`: save local preferences and optional user-entered handoff settings.
- `downloads`: save generated EPUB files.
- `optional_host_permissions`: request image-host access only when image inclusion needs cross-origin asset bytes.

## Screenshot Checklist

- Side panel with successful article preview.
- Metadata editor with alternatives.
- Image mode and route-fit warning.
- Download and Amazon web handoff state.
- Permission request explanation for cross-origin images.
