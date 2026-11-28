---
created: 2026-11-28
title: Make theme colors and font runtime-configurable
area: frontend
tags: [frontend, app-shared, ui, feat]
keywords: [theme-colors, fonts, dynamic-settings, css-variables, branding]
source: "GitHub issue #844"
github_issues: [844]
files:
  - packages/app-shared/src/settings/staticSettings.ts
  - packages/app-shared/src/settings/staticSettings.type.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - apps/frontend/src/lib/utils/color/ensureColors.ts
  - apps/frontend/src/routes/+layout.svelte
  - apps/frontend/src/app.css
---

# Make theme colors and font runtime-configurable

## Origin

Converted from GitHub issue [#844 feat: dynamic color and font settings](https://github.com/openvaa/voting-advice-application/issues/844) on 2026-11-28.

## Problem

Theme colors (light and dark) and the font are defined in `StaticSettings` (`packages/app-shared/src/settings/staticSettings.ts`), so rebranding an instance requires a code change and rebuild. They feed `apps/frontend/src/lib/utils/color/ensureColors.ts` (contrast adjustment) and the DaisyUI theme / root layout (`apps/frontend/src/routes/+layout.svelte`).

## Solution

Move colors/font to `DynamicSettings` (stored in the DB app settings) with the static values as defaults. Emit them as `:root` CSS custom properties in the root layout (SSR, to avoid a flash), have the DaisyUI/Tailwind theme reference the variables, and let `ensureColors` read the merged settings. Load the font URL from settings in `<svelte:head>`. Admin editing can come later.
