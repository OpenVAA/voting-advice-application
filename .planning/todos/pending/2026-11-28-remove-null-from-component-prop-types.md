---
created: 2026-11-28
title: Remove needless null from component prop types
area: frontend
tags: [frontend, ui, improvement]
keywords: [prop-types, "null", component-api, refactor, defaults]
source: "GitHub issue #328"
github_issues: [328]
files:
  - apps/frontend/src/lib/components
  - apps/frontend/src/lib/dynamic-components
  - apps/frontend/src/lib/contestant/components
---

# Remove needless null from component prop types

## Origin

Converted from GitHub issue [#328 Chore/refactor: remove unnecessary null values from component prop types.](https://github.com/openvaa/voting-advice-application/issues/328) on 2026-11-28.

## Problem

Many component prop types are declared `prop?: Foo | null;` (about 70 in `apps/frontend/src/lib/**/*.type.ts`, e.g. `SuccessMessage.type.ts`, `ErrorMessage.type.ts`, `InfoAnswer.type.ts`, `ScoreGauge.type.ts`, `input/Input.type.ts`, `input/parts/*`). The original intent was to let callers pass a value that still uses the default, but a destructuring default in `$props()` applies only to `undefined`, so `null` silently bypasses the default and can cause unexpected rendering. Related: GitHub #510.

## Solution

Audit each `| null` prop: drop it where no caller needs null (callers pass `?? undefined`), keep it only where null has a distinct meaning (e.g. a cleared Input value) and document that. Run svelte-check and component tests.
