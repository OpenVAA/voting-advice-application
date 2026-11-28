---
created: 2026-11-28
title: Design a plugin / deep-customisation mechanism
area: frontend
tags: [voter, contestant, frontend, app-shared, feat]
keywords: [plugins, customization, extensibility, component-override, architecture]
source: "GitHub issue #535"
github_issues: [535]
files:
  - apps/frontend/src/lib/dynamic-components
  - packages/app-shared/src/settings/staticSettings.ts
  - apps/frontend/svelte.config.js
---

# Design a plugin / deep-customisation mechanism

## Origin

Converted from GitHub issue [#535 feat: plugins and other deep customisation](https://github.com/openvaa/voting-advice-application/issues/535) on 2026-11-28.

## Problem

Deployments can only customise OpenVAA through settings and the `app_settings.customization` column (texts, images, translation overrides). Anything deeper — a different question display, a custom results card, an extra page — requires forking the frontend.

## Solution

TBD. Research first: pick one example (e.g. question display), define the extension points (component slots/registries resolved from settings, or build-time module replacement), and how they interact with Svelte 5 contexts and Paraglide. Produce a design before any code.
