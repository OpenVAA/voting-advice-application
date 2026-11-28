---
created: 2026-11-28
title: Make voter pages discoverable by search engines
area: frontend
tags: [voter, frontend, app-shared, feat]
keywords: [seo, meta-tags, open-graph, sitemap, hreflang, robots, link-preview, social-share, robots-txt, crawlers, indexing]
source: "GitHub issue #164"
github_issues: [164, 509, 511]
files:
  - apps/frontend/src/routes/+layout.svelte
  - apps/frontend/src/lib/layouts/main/MainContent.svelte
  - apps/frontend/static/
  - apps/frontend/src/routes/(voters)/
---

# Make voter pages discoverable by search engines

## Origin

Converted from GitHub issue [#164 As a Publisher, I want voters to easily find the VAA using search engines](https://github.com/openvaa/voting-advice-application/issues/164) on 2026-11-28.

## Problem

Publishers want voters to find the VAA, and ideally its subpages (individual questions, candidates, parties, per-constituency lists), from search engines. Currently the voter app emits only a `<title>` (root `+layout.svelte` and `MainContent`/`SingleCardContent`) and theme-color metas: no `<meta name="description">`, no Open Graph/Twitter tags, no canonical or `hreflang` alternates for the Paraglide `url` locale strategy, no `robots.txt` and no sitemap. Entity detail pages exist under `(voters)/(located)/results/...[id]` but are reachable only after constituency selection, so crawlers may not reach them. Prior work: Evan Roman's MSc thesis on VAA SEO (2023, doria.fi/handle/10024/187299). Sitemap is GitHub #511.

## Solution

Add per-page description/OG metas (localized, from app settings + page data), canonical + hreflang links per locale, a robots.txt, and a server-generated sitemap.xml route listing questions/entities per project. Decide which entity pages should be crawlable without voter answers.

## From GitHub issue #509 (2026-11-28)

[#509 feat: link preview images and metadata](https://github.com/openvaa/voting-advice-application/issues/509)

**Add link-preview metadata and share image**

When the Voter App URL is shared (social media, messaging apps), no preview appears: `apps/frontend/src/routes/+layout.svelte` emits only `<title>`, `theme-color` and font links, with no `description`, Open Graph or Twitter card tags, and there is no share image.

*Approach:* Emit localized `description`, `og:title`, `og:description`, `og:image`, `og:url`, `og:locale` and `twitter:card` in the root layout from app customization (operator-defined image/text in `app_settings.customization` or static settings), with a default generated/static image. Consider per-route values for results/entity pages.

## From GitHub issue #511 (2026-11-28)

[#511 feat: automatic sitemap generation](https://github.com/openvaa/voting-advice-application/issues/511)

**Serve a sitemap.xml and robots.txt for the Voter App**

Crawlers get no sitemap or robots.txt: `apps/frontend/static` holds neither and no route serves them. Entity pages and per-election routes may therefore be poorly indexed, while Contestant/Admin App routes should be excluded.

*Approach:* Add `routes/sitemap.xml/+server.ts` listing the enabled voter routes (from `$lib/routes` and settings/`access`) in every supported locale (Paraglide `localizeHref`), optionally entity detail URLs from the data provider; add `robots.txt` disallowing `/contestant`, `/admin`, `/api`. Decide first whether indexing is wanted per deployment (setting).
