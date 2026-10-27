---
name: article-to-epub-marketplace-copy
description: Use when drafting, revising, or validating marketplace-facing copy for Article to EPUB, including Codex plugin marketplace metadata, Chrome Web Store descriptions, permission justifications, default prompts, screenshot captions, privacy summaries, and GitHub-linked publisher/repository descriptions.
---

# Article to EPUB Marketplace Copy

## Overview

Create concise, accurate marketplace copy for Article to EPUB. Keep claims grounded in the repo, highlight the local-first Kindle EPUB workflow, and avoid implying Amazon affiliation or automated Amazon account access.

## Source Check

Before writing final copy, inspect the current repo artifacts that define the product:

- `README.md` for product positioning and privacy stance.
- `docs/store-listing.md` for Chrome Web Store draft language.
- `docs/privacy.md` and `SECURITY.md` for privacy/security claims.
- `package.json`, `wxt.config.ts`, and extension entrypoints for shipped capability.
- `.codex-plugin/plugin.json`, if present, for Codex plugin marketplace metadata.

If required publisher facts are missing, ask for them instead of inventing values: publisher display name, contact email, GitHub repository URL, homepage, privacy policy URL, terms URL, logo, and screenshots.

## Copy Rules

- Lead with the user outcome: turn article pages into Kindle-ready EPUB files.
- Use concrete features: local preview, metadata editing, image size controls, conversion warnings, reusable Kindle profiles, EPUB download, Amazon-supported manual handoff.
- Say "Amazon-supported document routes", "Send to Kindle web upload", or "approved sender email" when describing delivery.
- Never say or imply "official Amazon", "Kindle integration", "automatic Kindle delivery", "Amazon login automation", "Amazon API", or "direct account access".
- State the privacy posture only when confirmed in current docs: local browser processing, no backend, no analytics, local storage for preferences/profile data.
- Keep the tone clear, calm, and useful. Avoid inflated claims like "perfect", "one-click magic", "AI-powered", or "guaranteed compatibility".
- Distinguish Codex plugin marketplace copy from Chrome extension store copy. The Codex plugin describes what the skill helps an agent do; the Chrome listing describes what the extension does for end users.

## Codex Plugin Marketplace

When preparing `.codex-plugin/plugin.json` copy:

- `displayName`: prefer `Article to EPUB`.
- `shortDescription`: one compact sentence fragment about creating Kindle-ready EPUBs from article pages.
- `longDescription`: 2-4 short paragraphs covering workflow, quality controls, privacy stance, and Amazon non-affiliation.
- `capabilities`: use only real plugin capabilities. For a skills-only plugin, avoid implying browser extension installation or delivery automation.
- `defaultPrompt`: provide up to 3 prompts, each under 128 characters, focused on drafting listings, permission justifications, privacy summaries, or release copy.
- `repository`: use the canonical public GitHub repo URL once known.
- `websiteURL`, `privacyPolicyURL`, and `termsOfServiceURL`: use absolute HTTPS URLs only when they exist.

Good short-description patterns:

- "Draft polished marketplace copy for Article to EPUB."
- "Create Kindle-ready EPUB listing copy."
- "Shape Article to EPUB store and plugin copy."

## Chrome Web Store Copy

When preparing Chrome Web Store language:

- Public name: `Article to EPUB`, unless the user requests a rename.
- Short description: keep under the store limit and make it scannable.
- Detailed description: open with the conversion outcome, then list controls and handoff routes.
- Permission justifications: explain each permission in plain user-benefit terms tied to a deliberate user action.
- Screenshot captions: name what is visible, not how to use the app.

## Review Checklist

- No unsupported Amazon affiliation or automation claim.
- No privacy claim that is not supported by current docs or code.
- No placeholder values in marketplace metadata.
- URLs are canonical HTTPS links when used publicly.
- The GitHub repository link is present in plugin metadata once the repo is public.
- The copy explains why permissions exist without sounding defensive.
