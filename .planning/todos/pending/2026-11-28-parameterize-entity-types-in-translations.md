---
created: 2026-11-28
title: Parameterize entity types in voter translations
area: frontend
tags: [voter, frontend, translations, improvement]
keywords: [translations, entity-types, results-sections, finnish-case, parameterize]
source: "GitHub issue #718"
github_issues: [718]
files:
  - apps/frontend/messages/
  - apps/frontend/src/lib/i18n/
  - packages/app-shared/src/settings/dynamicSettings.type.ts
---

# Parameterize entity types in voter translations

## Origin

Converted from GitHub issue [#718 refactor: result entity types in translations](https://github.com/openvaa/voting-advice-application/issues/718) on 2026-11-28.

## Problem

Voter-facing strings say 'candidates and parties' (and 'candidates or parties') even when a deployment shows only one entity type in results (`DynamicSettings.results.sections`). Examples in `apps/frontend/messages/en`: `results.json` (answerMinQuestions, no/some-nominations titles, browse), `dynamic.json` (constituency and election selection ingresses, front page ingress/start button, results ingresses), `error.json` noNominations, `about.json`. Each of the 7 locales has its equivalents; Finnish needs correct grammatical case for each inserted term.

## Solution

Introduce message variants or parameters selected from the enabled result entity types (e.g. a `{entities}` param with per-locale case-aware forms, or Paraglide variants keyed on `candidate|organization|both`), and pass them from the components; review all locales.
