---
created: 2026-11-28
title: Support localized publisher logos
area: frontend
tags: [frontend, app-shared, translations, feat]
keywords: [publisher-logo, localized-image, customization, app-logo, i18n]
source: "GitHub issue #759"
github_issues: [759]
files:
  - packages/app-shared/src/data/schemas/storedCustomization.schema.ts
  - apps/frontend/src/lib/contexts/app/appCustomization.type.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte
---

# Support localized publisher logos

## Origin

Converted from GitHub issue [#759 feat: multilingual publisher logo](https://github.com/openvaa/voting-advice-application/issues/759) on 2026-11-28.

## Problem

The publisher logo in app customization is one image (with an optional dark variant). Publishers whose logo contains text need a different logo per language, but `publisherLogo` cannot be localized.

## Solution

Allow `publisherLogo` to be either an image or a locale-keyed map of images in `StoredCustomizationSchema`, resolve it with the current locale (like other localized values) in the Supabase data provider, and keep `AppLogo.svelte` reading the resolved `Image`. Consider the same for the other customization images.
