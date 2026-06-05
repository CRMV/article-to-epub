# Chrome Web Store Listing Draft

## Public Name

Article Ferry

## Short Description

Convert article pages into Kindle-ready EPUB files with local preview, metadata editing, and image-aware size controls.

## Detailed Description

Article Ferry turns the current article page into a clean EPUB file you can upload through Amazon-supported document routes. It provides a local preview, editable title/author/date/source fields, image modes, and conversion warnings before download.

Article Ferry is not affiliated with Amazon. It does not automate Amazon login, use Amazon credentials, or call private Amazon delivery endpoints.

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

