---
created: 2026-11-28
title: Add reorder controls to ordered multi-select input
area: frontend
tags: [contestant, frontend, ui, feat]
keywords: [reorder, select-multiple, drag-and-drop, ordered-choices, a11y]
source: "GitHub issue #361"
github_issues: [361]
files:
  - apps/frontend/src/lib/components/input/Input.svelte
  - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.svelte
  - apps/frontend/src/lib/components/input/QuestionInput.svelte
---

# Add reorder controls to ordered multi-select input

## Origin

Converted from GitHub issue [#361 feat: Enable ordering of fields with multiple values](https://github.com/openvaa/voting-advice-application/issues/361) on 2026-11-28.

## Problem

Multiple-value fields in the Contestant App (e.g. languages spoken, via ordered multiple-choice questions) use `Input type="select-multiple" ordered` (`apps/frontend/src/lib/components/input/Input.svelte` with `parts/SelectMultiplePart.svelte`). `ordered` only preserves the order in which values were picked; once selected, a value can be removed but not moved, so fixing the order means deleting and re-adding. The same reorder behaviour will be needed for a preference-order question type (GitHub #98).

## Solution

Build a reusable reorder action/component with accessible move up/down buttons (keyboard first) and optional drag-and-drop (e.g. svelte-dnd-action, or native pointer events), announce moves via aria-live, and use it in SelectMultiplePart when `ordered`. See https://www.tpgi.com/the-road-to-accessible-drag-and-drop-part-1/.
