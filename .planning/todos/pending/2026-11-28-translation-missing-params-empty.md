---
created: 2026-11-28
title: Render missing translation params as empty, not 'undefined'
area: frontend
tags: [voter, contestant, admin, frontend, translations, improvement]
keywords: [translations, interpolation, missing-params, paraglide, icu, t-wrapper]
source: "GitHub issue #518"
github_issues: [518]
files:
  - apps/frontend/src/lib/i18n/wrapper.ts
  - apps/frontend/src/lib/i18n/overrides.ts
  - apps/frontend/src/lib/i18n/types.ts
  - apps/frontend/tools/translationKey/generateTranslationKeyType.ts
---

# Render missing translation params as empty, not 'undefined'

## Origin

Converted from GitHub issue [#518 feat: supply empty values for all known translation payloads](https://github.com/openvaa/voting-advice-application/issues/518) on 2026-11-28.

## Problem

`t(key, params)` in `apps/frontend/src/lib/i18n/wrapper.ts` is typed `params?: Record<string, unknown>`, so a call can omit a placeholder. Paraglide's compiled messages then print `undefined` in the text, and a runtime override (`overrides.ts` `getOverride`) returns the raw ICU template (with `{name}` visible) when params are missing or `IntlMessageFormat` throws.

## Solution

Either type `t()` params per key from Paraglide's generated `*Inputs` typedefs so omissions fail at compile time, or fill missing placeholders with an empty string before formatting (both the Paraglide and the override path), logging at debug. Add unit tests in `lib/i18n/tests`.
