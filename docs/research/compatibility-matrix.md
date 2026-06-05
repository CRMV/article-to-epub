# Compatibility Matrix

| Target | Expected metadata | Image expectation | Delivery smoke |
| --- | --- | --- | --- |
| Wolfram article | Stephen Wolfram, 2023-02-02, Stephen Wolfram Writings | Smart-images keeps representative meaningful images when permission allows and reports skipped CDN assets by host | Manual Amazon web upload or approved-sender email; verify title, author, reading flow, TOC, and representative images in Kindle app/device |
| FS.blog article | Charlie Munger as reader-facing author candidate, Farnam Street as source | Small same-origin image set can be included without broad install-time host access | Manual Amazon web upload or approved-sender email; verify author and source are not blank |
| Ordinary news fixture | Byline author and site source | One or more straightforward inline images if present | Local EPUB opens and passes package inspection |
| Ordinary blog fixture | Title/source fallback; no invented author | Text and list structure preserved | Local EPUB opens and preserves headings/lists |
| Difficult image/CORS fixture | Title fallback | CDN permission, private-address rejection, unsupported media, and decorative skips are reported safely | Manual smoke after permissions: no full URL/query leakage in report |

## Manual Acceptance Checklist

- Generate the EPUB from a loaded unpacked extension.
- Confirm the downloaded filename reflects edited metadata.
- Upload through Amazon web or send through an approved Kindle email address.
- Open in Kindle app/device.
- Check title, author, reading flow, TOC where applicable, and representative images.
- Record failures without committing full copyrighted article bodies.

