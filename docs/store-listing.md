# Chrome Web Store Listing

Use this text in the developer dashboard. Do not publish until the privacy policy URL is publicly reachable. The standalone page is `docs/privacy.html`. With GitHub Pages set to deploy from `/docs` on the default branch, the URL is:

```text
https://crmv.github.io/article-to-epub/privacy.html
```

The repository is `https://github.com/CRMV/article-to-epub`. If that repository is still private, the Pages URL and the issues URL will not load for a reviewer.

## Listing

| Field | Value |
| --- | --- |
| Name | Article to EPUB |
| Summary | Turn the page you're reading into a Kindle-ready EPUB. Preview locally, then download. |
| Category | Productivity |
| Language | English |
| Version | 1.0.0 |
| Visibility | Public |
| Pricing | Free |
| Mature content | No |

Summary length: 84 characters (store limit 132).

## Single-purpose statement

```text
Convert the active web page, after the user clicks the extension, into an EPUB file the user can preview and download.
```

## Detailed description

```text
Article to EPUB turns the page you are reading into an EPUB file you can download and send to a Kindle yourself.

Open an article, a long essay, or a public filing, then click the extension. It builds a readable preview on your computer, lets you edit the title, author, date, and source, and shows image and file-size choices before you export.

What you can do:
- Capture the active page, or the text you have selected
- Preview the reading view before creating a file
- Edit metadata and reuse local corrections for a site
- Choose how many images to keep
- Download an EPUB for Amazon's Send to Kindle web upload or for email from an approved sender address

Long public documents are part of the point. A company registration statement or other dense HTML page can be cleaned into chapters with headings, tables, and footnotes so it is easier to read away from the browser.

Privacy:
Article content stays in the extension. There is no account, no analytics, and no upload of the article to the developer. Optional access for cross-origin images is requested only when you generate a file, then removed.

Article to EPUB is not affiliated with Amazon. It does not sign in to Amazon, use Amazon credentials, read Amazon cookies, or deliver files through a private Amazon API. You download the EPUB and hand it off yourself.
```

## Permission justifications

`activeTab`

```text
Used only after you click the extension, to read the current tab and prepare an article preview. It does not run on pages you have not opened the extension on.
```

`scripting`

```text
Injects the local snapshot script into the active tab after that click so the article can be extracted on your computer.
```

`sidePanel`

```text
Opens the side panel with the preview, metadata editor, image controls, and download action.
```

`storage`

```text
Saves settings on this device: image mode, delivery route, Kindle profile, an optional Kindle email you type, and site-specific metadata corrections. Nothing is synced to a server.
```

`downloads`

```text
Saves the EPUB you generate, using the file name shown in the panel. The extension does not download other files.
```

`optional_host_permissions` (`https://*/*`, optional)

```text
Not granted at install. Used only if you generate an EPUB that includes images hosted on a different site from the page. The extension asks for those specific image origins from the Generate click, then removes the grant after the attempt. Page text does not need this permission. The manifest pattern is broad because image hosts are not known ahead of time; the runtime request is limited to the origins for that capture.
```

## Data-use disclosures

Answer **yes**, the item uses user data, because it reads the active page in order to build an EPUB. Then disclose only local use:

| Dashboard item | Answer |
| --- | --- |
| Website content | Used locally, after a click, to extract the article and build the EPUB. Not transmitted to the developer. |
| User activity | The optional Kindle email and metadata corrections the user types are stored locally. Not transmitted. |
| Web history | Not collected. The extension does not read browsing history. |
| Personally identifiable information | Not collected by the developer. A Kindle email is stored only on the device if the user enters one. |
| Authentication information | Not collected. No Amazon login, cookies, or tokens. |
| Location, health, financial, personal communications | Not collected. |
| Data sold | No |
| Data used for purposes unrelated to the single purpose | No |
| Data used for creditworthiness | No |
| Data transferred to third parties | No, except the user choosing to upload or email the EPUB themselves |

Certification statement:

```text
Article to EPUB uses website content only to provide its single purpose: converting the active page into an EPUB after the user clicks the extension. Data is not sold, not used for advertising, not used to determine creditworthiness, and not transferred to the developer.
```

## Graphics in this repo

| Asset | Size | Path |
| --- | --- | --- |
| Toolbar icon | 16, 48, 128 | `public/icon-16.png`, `public/icon-48.png`, `public/icon-128.png` |
| Store icon | 128×128 | `docs/store/icon-128.png` |
| Screenshot, preview | 1280×800 | `docs/store/screenshot-preview.png` |
| Screenshot, metadata | 1280×800 | `docs/store/screenshot-metadata.png` |
| Screenshot, delivery | 1280×800 | `docs/store/screenshot-delivery.png` |
| Small promo tile | 440×280 | `docs/store/promo-tile.png` |

Screenshot captions, in the same order:

```text
Preview the article before creating an EPUB.
Edit the title, author, date, and source.
Download the EPUB for manual Send to Kindle handoff.
```

Regenerate the screenshots from the built extension with `node scripts/capture-store-screenshots.mjs` after `npm run build`.

## Package

```bash
npm run zip
```

Upload the Chrome zip from `.output/`. The package is Manifest V3, has no remote code, and does not include analytics.
