---
date: 2026-06-05
topic: obsidian-web-clipper-lessons
focus: Learn from Obsidian Web Clipper
mode: repo-grounded
---

# Ideation: Lessons From Obsidian Web Clipper

## Grounding Context

Article to EPUB is a local-first WXT/React/TypeScript Chrome MV3 extension. It captures the active article, builds a preview using Readability plus custom metadata and image layers, lets users edit metadata, budgets images, generates a Kindle-ready EPUB, and hands off through download, Amazon web upload, or Kindle email. The product strategy is privacy-preserving, Amazon-compatible but unaffiliated, no backend, no telemetry, no Amazon credential automation, and user-mediated delivery.

Obsidian Web Clipper's strongest visible lessons are not just feature count. It makes clipping feel configurable, inspectable, local, and fast. Its public docs emphasize highlighter, reader mode, templates, variables, filters, logic, URL/schema.org triggers, import/exportable template JSON, optional Interpreter prompts, and local/private clipping into durable files. Its source README highlights open-source/auditable code, cross-browser builds, durable offline Markdown, template validation, template logic, local image saving, and future template directory/settings sync.

The most important translation: Obsidian's "templates" should not be copied literally. Article to EPUB's equivalent power surface is Kindle route choice, image/file-size tradeoffs, metadata correction, site-specific extraction, and confidence before manual handoff.

## Topic Axes

- Capture modes
- Site-specific extraction rules
- Preview/editor ergonomics
- Delivery presets
- Trust, privacy, and portability
- Speed and perceived speed

## Ranked Ideas

### 1. Explainable Preview Workbench

**Description:** Upgrade the side panel from a mostly linear form into a pre-generation workbench: visible capture mode, metadata provenance, image budget gauge, permission preflight, route-fit status, and EPUB filename preview.

**Axis:** Preview/editor ergonomics

**Basis:** `direct:` Article to EPUB already has the underlying data in `PageSnapshot.mode`, `ResolvedMetadata.candidates`, `planImageBudget`, `buildConversionReport`, `planAssetPermissions`, and `buildFileName`.

**Rationale:** Obsidian feels polished because the user can see and shape what will be saved before committing. Article to EPUB can get the same confidence boost without copying Obsidian's note-template model.

**Downsides:** Adds UI density to the side panel and needs careful narrow-panel layout.

**Confidence:** 91%

**Complexity:** Medium

**Status:** Unexplored

### 2. Fast First Preview

**Description:** Make the first useful result appear as quickly as possible: render text preview first, then fill in metadata alternatives, image budget, permission preflight, and route diagnostics progressively. Add timing marks for capture, extraction, metadata, asset planning, EPUB build, and download.

**Axis:** Speed and perceived speed

**Basis:** `reasoned:` Obsidian appears fast because its normal path is local, deterministic, and text-first, while slow Interpreter work is opt-in. Article to EPUB's heavier EPUB/image pipeline can still feel fast if it shows the reading result before expensive packaging work.

**Rationale:** Ferry may already be fast in absolute terms, but perceived speed matters. A user who sees clean article text immediately will tolerate later image/report work better than a user watching a single "loading" state.

**Downsides:** Requires more careful async state management and may expose partial states that need good labels.

**Confidence:** 88%

**Complexity:** Medium

**Status:** Unexplored

### 3. Kindle Profiles Instead Of Obsidian-Style Templates

**Description:** Add named delivery profiles such as "Fast email", "Rich web upload", "Text archive", and "Image-heavy article". A profile bundles delivery route, image mode/budget, filename convention, and possibly metadata defaults.

**Axis:** Delivery presets

**Basis:** `reasoned:` Obsidian templates work because vault output differs by destination and content type. Article to EPUB's equivalent variability is Kindle route constraints and image/file-size tradeoffs, not Markdown note layout.

**Rationale:** This borrows configurable power while staying native to Article to EPUB's job. It turns repeated Kindle decisions into reusable setup without requiring users to learn selectors or template syntax.

**Downsides:** Profiles can become settings sprawl if introduced before the default route is excellent.

**Confidence:** 84%

**Complexity:** Medium

**Status:** Unexplored

### 4. Site Recipes For Metadata And Assets

**Description:** Introduce lightweight per-site recipes that can override or supplement metadata extraction and asset selection using URL/schema/meta/selector rules. Keep v1 narrow: recipes for known compatibility targets like FS.blog and Wolfram, then import/export later.

**Axis:** Site-specific extraction rules

**Basis:** `external:` Obsidian supports automatic template triggers using URL patterns and schema.org data, plus variables from meta tags, selectors, and schema.org. `direct:` Article to EPUB already has compatibility fixtures and known hard target pages.

**Rationale:** The strongest lesson from Obsidian is that one universal extractor is never enough. Site recipes make hard-won fixes reusable and testable without making every user a template author on day one.

**Downsides:** Requires a schema, validation, UI decisions, and guardrails to avoid unsafe selectors or privacy leaks.

**Confidence:** 88%

**Complexity:** High

**Status:** Unexplored

### 5. Remembered Metadata Corrections

**Description:** When the user edits author/source/date/title for a site, offer to remember that correction rule locally and apply it next time on the same domain or matching URL pattern. Include a clear settings surface to review/delete remembered rules.

**Axis:** Site-specific extraction rules

**Basis:** `direct:` `src/storage/recentMetadataEdits.ts` already defines capped local metadata edit rules, but the side panel currently keeps edits only in component state for the active preview.

**Rationale:** This is the smallest Obsidian-template-like feature with immediate value. It lets users teach the extension without opening a full recipe editor.

**Downsides:** Matching rules can be wrong across sections of a domain, especially publications with multiple authors or syndicated content.

**Confidence:** 90%

**Complexity:** Low-Medium

**Status:** Unexplored

### 6. Portable Compatibility Kit

**Description:** Let users export a sanitized compatibility bundle: conversion report, metadata candidates, image decision summary, extension version, and optionally a recipe stub, with no article body and no full private URL/query string.

**Axis:** Trust, privacy, and portability

**Basis:** `direct:` The README asks users to file compatibility reports with short snippets, public URLs, screenshots, and conversion-report summaries rather than full article bodies. The privacy docs explicitly avoid article bodies and full reading-history URLs.

**Rationale:** Obsidian's open-source/auditable posture is part of its trust. Article to EPUB can turn privacy constraints into a debugging advantage by making safe reports easy.

**Downsides:** Needs careful redaction tests, and even sanitized metadata can leak sensitive reading context if users export blindly.

**Confidence:** 86%

**Complexity:** Medium

**Status:** Unexplored

### 7. Reader Mode As Acceptance Test

**Description:** Add preview reader controls and extraction-stage indicators so the side panel becomes the place users actually validate the reading experience before upload. A failed preview should feel diagnosable, not mysterious.

**Axis:** Capture modes

**Basis:** `external:` Obsidian Web Clipper includes Reader mode and its 2026 release notes mention reader customization. `direct:` Article to EPUB already renders article content in `ArticlePreview`.

**Rationale:** Article to EPUB cannot beat Amazon's official extension on pure one-click delivery yet, so it should win on confidence. A better reader-like preview makes the manual handoff feel worthwhile.

**Downsides:** Reader polish can become a rabbit hole and distract from Kindle output correctness if not scoped.

**Confidence:** 79%

**Complexity:** Medium

**Status:** Unexplored

## Speed Notes

Obsidian likely feels fast for several overlapping reasons:

- Its default output is lighter than Article to EPUB's. Markdown/local-vault clipping is generally cheaper than packaging a Kindle-ready EPUB with sanitized XHTML, image decisions, and zip output.
- Its slow path is explicit. Interpreter/AI prompt variables are opt-in, while normal variables, selectors, filters, and schema/meta extraction are deterministic local work.
- It has a purpose-built extraction engine. The official repo uses Defuddle, which was created for Obsidian Web Clipper.
- Templates reduce repeated guessing. Site/template triggers let the clipper use known page structure instead of treating every capture as a fresh universal extraction problem.
- It appears to optimize for first useful output. Even if Article to EPUB is fast in absolute terms, a single loading state can feel slower than progressive preview.

Article to EPUB speed experiments worth considering:

- Render the text preview before image planning finishes.
- Defer optional image permission and image fetching until Generate EPUB.
- Cache the extracted article and metadata per snapshot, then recompute only route/image reports when controls change.
- Add `performance.mark` instrumentation around capture, Readability extraction, metadata resolution, asset planning, EPUB build, and download.
- Add a "Fast text EPUB" profile that skips image fetch and uses a minimal package path.

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Full Obsidian-style template language | Too expensive relative to near-term value; site recipes and profiles capture the useful part. |
| 2 | Optional AI Interpreter | Interesting, but conflicts with the current no-backend/no-telemetry simplicity and needs a separate privacy/product decision. |
| 3 | Cross-browser expansion immediately | Valuable later, but current Chrome MVP still needs core Kindle acceptance polish. |
| 4 | Markdown export | Attractive due to Obsidian's durability lesson, but less central to Kindle-ready EPUB positioning. |
| 5 | Capture queue / multi-article EPUB | Useful reading workflow, but a scope expansion beyond learning from clipping quality. |
| 6 | Domain-level local dashboard | Too speculative until there is enough local history and a settings surface. |
| 7 | Choose extraction engine | Too implementation-heavy and user-confusing before recipes prove the need. |
| 8 | Zero-configuration only | Duplicates existing MVP posture and misses the specific lesson from Obsidian's configurable power. |
| 9 | Portable clipping receipt as separate JSON | Folded into Portable Compatibility Kit. |
| 10 | Flight-checklist staged UI | Folded into Explainable Preview Workbench. |

## Sources

- Obsidian Web Clipper docs: https://obsidian.md/help/web-clipper
- Obsidian templates docs: https://obsidian.md/help/web-clipper/templates
- Obsidian variables docs: https://obsidian.md/help/web-clipper/variables
- Obsidian Interpreter docs: https://obsidian.md/help/web-clipper/interpreter
- Obsidian Web Clipper README: https://raw.githubusercontent.com/obsidianmd/obsidian-clipper/main/README.md
- Obsidian Web Clipper package manifest: https://raw.githubusercontent.com/obsidianmd/obsidian-clipper/main/package.json
