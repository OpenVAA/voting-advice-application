---
created: 2026-11-28
title: Validate merged app settings for semantic conflicts
area: frontend
tags: [voter, contestant, frontend, app-shared, improvement]
keywords: [settings-validation, app-settings, consistency-check, zod, results-sections]
source: "GitHub issue #432"
github_issues: [432]
files:
  - packages/app-shared/src/data/schemas/storedSettings.schema.ts
  - packages/app-shared/src/settings/dynamicSettings.ts
  - apps/frontend/src/lib/utils/settings.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - packages/dev-seed/src/writer.ts
---

# Validate merged app settings for semantic conflicts

## Origin

Converted from GitHub issue [#432 Feat: check settings on initialisation](https://github.com/openvaa/voting-advice-application/issues/432) on 2026-11-28.

## Problem

App settings are the merge of `staticSettings`/`dynamicSettings` defaults and the stored `app_settings.settings` column. The stored column is validated for SHAPE by `StoredSettingsSchema` (zod), but not for meaning: e.g. `results.sections` can be empty so no entity type is shown in results, card contents can name questions that do not exist, `matching.minimumAnswers` can exceed the available opinion questions. The app then renders a broken or empty view with no explanation.

## Solution

Add a pure `checkAppSettings(merged, data?)` in app-shared returning a list of problems; log them at `error` on app init (and surface them in the Admin App and the dev-seed writer, which already parses with the schema). Decide per problem whether to fall back to defaults. Could also be zod `.superRefine`s where they need no data.
