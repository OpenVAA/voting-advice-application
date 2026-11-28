---
created: 2026-11-28
title: Design a combined rich-content model for pages
area: frontend
tags: [voter, frontend, app-shared, ui, feat]
keywords: [rich-content, video, hero-emoji, banner-image, intro-page, customization]
source: "GitHub issue #723"
github_issues: [723]
files:
  - packages/app-shared/src/data/customData.type.ts
  - apps/frontend/src/lib/components/video/Video.svelte
  - apps/frontend/src/lib/contexts/layout/VideoController.svelte.ts
  - apps/frontend/src/lib/components/hero
  - apps/frontend/src/routes/(voters)/intro/+page.svelte
---

# Design a combined rich-content model for pages

## Origin

Converted from GitHub issue [#723 feat: combined rich content for pages](https://github.com/openvaa/voting-advice-application/issues/723) on 2026-11-28.

## Problem

Pages such as the intro, the questions intro and category intros can show rich media, but each kind is configured differently: hero emojis come from per-page translation keys (`dynamic.<page>.heroEmoji`), videos only from `customData.video` on questions and question categories (`VideoContent` in `packages/app-shared/src/data/customData.type.ts`), and banner images from top bar settings. There is no way for a publisher to give, e.g., the intro page a video or a banner image instead of an emoji, and the UI for video, question info and extended info is separate.

## Solution

TBD (design question). Ideas from the issue: store per-page rich content either as rich-text translations or as a settings/customization object, where the rich media is one of video, banner image, hero emoji or none (only one shown); build one combined UI for video, question info and extended info. Coordinate with the `Video` component refactor.
