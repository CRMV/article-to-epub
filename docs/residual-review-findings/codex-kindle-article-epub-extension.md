## Residual Review Findings

Source: LFG code review for `docs/plans/2026-06-05-002-feat-obsidian-inspired-preview-workbench-plan.md` on branch `codex/kindle-article-epub-extension`.

- P2 `src/ui/state/conversionStore.ts:68` Progressive preview still returns one completed model instead of committing a text-first preview immediately, then updating metadata, permission, and route stages behind a run id.
- P2 `entrypoints/sidepanel/App.tsx:177` In-flight EPUB generation can still commit stale preview/report/filename state if the user changes route, image mode, metadata, profile, or snapshot while generation is running.
- P2 `tests/playwright/sidepanel-workbench.spec.ts:35` Browser layout coverage still exercises a minimal/empty side-panel state rather than the full workbench with long metadata, warnings, settings, export, reader controls, and fixed delivery actions.
- P2 `src/delivery/downloadArticle.ts:6` Download helpers still treat `chrome.downloads.download()` acceptance as completion; browser-level interruptions after the download starts are not observed.
- P2 `entrypoints/sidepanel/App.tsx:251` Remembered metadata correction has storage and resolver coverage, but lacks an App-level test for editing a field, saving a rule, rebuilding preview, and showing remembered-rule provenance.
- P2 `entrypoints/sidepanel/App.tsx:102` Preview stale-result rejection has cancellation logic but lacks a delayed-builder test proving older preview results cannot overwrite newer snapshot/profile/rule state.
- P3 `entrypoints/sidepanel/App.tsx:355` Compatibility kit export remains visible in the default flow instead of being nested under collapsed diagnostics as the plan's default-path contract recommends.
- P3 `entrypoints/sidepanel/App.tsx:256` Metadata-rule storage event handlers still need explicit user-facing error handling for storage read/write/delete failures.
