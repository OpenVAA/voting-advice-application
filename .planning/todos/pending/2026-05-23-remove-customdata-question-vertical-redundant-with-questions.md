---
created: 2026-05-23T00:00:00.000Z
title: Remove CustomData[Question].vertical — redundant with QuestionSettings.display
area: packages
files:
  - packages/app-shared/src/data/customData.type.ts:66
  - packages/app-shared/src/data/extendedData.type.ts:40-50,64
  - apps/frontend/src/lib/components/questions/QuestionChoices.svelte:112
---

## Problem

`CustomData['Question'].vertical?: boolean` at `packages/app-shared/src/data/customData.type.ts:66` is redundant with the canonical question-settings field `QuestionSettings.display?: QuestionSettingsDisplayType` (`'vertical' | 'horizontal'`) defined at `packages/app-shared/src/data/extendedData.type.ts:40,45,50,64`. The custom-data flag predates the canonical settings field; both encode the same intent ("render the multi-choice options vertically vs horizontally"). Keeping both creates two sources of truth for the same UI decision, and the consumer at `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:112` already has to reason about both (`isObjectType(...) || !!getCustomData(question).vertical`) to pick the layout.

## Solution

1. Migrate any existing data that sets `customData.vertical: true` to `question.settings.display: 'vertical'` (one-time data migration, scope: any seeded fixtures + any production rows). Check `packages/dev-seed/templates/**` + `apps/supabase/seed.sql` + production Supabase rows.
2. Update `QuestionChoices.svelte:109-113` — replace `!!getCustomData(question).vertical` with a read against the canonical settings field (likely `question.settings?.display === 'vertical'`; verify field shape via `extendedData.type.ts`).
3. Delete the `vertical?: boolean` field from `CustomData['Question']` at `customData.type.ts:64-66` (including its JSDoc).
4. Grep for any other consumers (`grep -rn "customData[?]\?\.vertical" apps packages`) before deleting — `InfoItem.svelte` mentions `vertical` but on its own local prop, not customData; double-check.
5. If `getCustomData(question).vertical` exists in test fixtures or e2e specs, update accordingly. May surface during Phase 88 catalog audit — coordinate timing.

**Timing:** can land as part of Phase 88 (catalog audit) OR as standalone cleanup. Not blocking v2.10 close OR v2.11 rune migration. Low risk — additive deletion with a one-line consumer rewrite.
