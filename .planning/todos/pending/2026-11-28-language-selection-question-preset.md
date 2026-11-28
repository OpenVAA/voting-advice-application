---
created: 2026-11-28
title: Provide a language-selection choice preset for questions
area: frontend
tags: [contestant, frontend, data, translations, feat]
keywords: [languages, question-type, intl-displaynames, cldr, choices]
source: "GitHub issue #363"
github_issues: [363]
files:
  - packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.ts
  - packages/data/src/objects/questions/base/questionTypes.ts
  - packages/dev-seed/src
  - apps/frontend/src/lib/components/input/QuestionInput.svelte
---

# Provide a language-selection choice preset for questions

## Origin

Converted from GitHub issue [#363 feat: language selection question type](https://github.com/openvaa/voting-advice-application/issues/363) on 2026-11-28.

## Problem

Info questions such as 'languages you speak' need a long, localized, alphabetically sorted list of languages. Today a publisher must hand-author every choice of a multiple-choice categorical question in every locale. Choices use generated ids, and there is no way to allow a free-text 'other' language (e.g. Finnish Sign Language) alongside the list.

## Solution

Option A: a helper (dev-seed/import or Admin App) that generates choices from ISO 639 codes with names from `Intl.DisplayNames` (no CLDR bundle needed), filtering regional subtags, dead languages and `mul`/`zxx`, sorted per locale. Option B: a dedicated question subtype whose choices are computed at runtime from a code list. Decide on string keys vs generated ids, and whether an open 'other' answer is needed.
