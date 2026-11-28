---
created: 2026-11-28
title: Autosave textarea Input and support DateQuestion formats
area: frontend
tags: [contestant, frontend, ui, improvement]
keywords: [input, textarea-autosave, date-format, question-input, forms]
source: "GitHub issue #744"
github_issues: [744]
files:
  - apps/frontend/src/lib/components/input/Input.svelte
  - apps/frontend/src/lib/components/input/QuestionInput.svelte
  - packages/data/src/objects/questions/variants/dateQuestion.ts
---

# Autosave textarea Input and support DateQuestion formats

## Origin

Converted from GitHub issue [#744 feat: extend `Input` component](https://github.com/openvaa/voting-advice-application/issues/744) on 2026-11-28.

## Problem

Two features of the shared `Input` component remain from an older wish list (the rest - single-locale hiding, password/email types, compact labels, select - exist): (1) long textarea entries, e.g. a candidate's open answer, are committed only on change/blur; `Input.svelte` has a commented-out TODO to call `handleChange` periodically while a textarea is focused, so text can be lost on navigation or session loss. (2) `QuestionInput` ignores `DateQuestion.format` (it logs 'Date formats are not supported yet by QuestionInput') and always renders a full date input, although formats like year-only or month-year have dedicated HTML input types (`month`, `number`).

## Solution

(1) Implement interval or debounced autosave for `textarea`/`textarea-multilingual` kinds, firing `onchange` while focused, and clear on destroy; check interaction with the contestant answer store and unsaved-changes guards. (2) Map `Intl.DateTimeFormatOptions` of `DateQuestion.format` to an HTML input type (`date`, `month`, `time`, `number` for year) in QuestionInput, converting values to/from the stored ISO string.
