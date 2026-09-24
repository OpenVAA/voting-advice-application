---
created: 2026-08-20T12:00:02.000Z
title: Anything Phase 142's minimal question-info product fix defers
area: packages/question-info
severity: minor
source: Phase 142 discussion B1 (D-01, D-19 iii)
files:
  - packages/question-info/src/
  - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-CONTEXT.md
---

## Problem

Phase 142's **D-01** fixes a real product regression — `packages/question-info/src/`
ignores question type entirely (`grep -rnE 'question\.type|QUESTION_TYPE|choices'`
exits 1 with no output) — but fixes it **minimally**: question type and choice
labels reach the prompt variables at `infoGeneration.ts`, and nothing more. No
redesign of the info-generation feature.

That boundary is deliberate (it keeps an assertion-design phase from becoming a
feature phase), but it means anything the fix *surfaces* and defers has no home.

## Solution

**This todo is a placeholder to be filled during Phase 142 execution.** When the
D-01 plan identifies work it is declining — per-type prompt templates, choice-label
formatting rules, validation that a type is handled at all, or anything else — it
appends the item here rather than absorbing it.

If Phase 142 completes and this file is still empty of concrete items, close it.
