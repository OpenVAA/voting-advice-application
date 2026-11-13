---
created: 2026-10-06T19:00:27.000Z
title: No entity name is on screen on the questions, question-editor and settings pages (recorded limitation of UI-SPEC U-09, for the operator)
area: Contestant app / UX
severity: minor
source: Phase 173 (173-UI-SPEC.md U-09; 173-CONTEXT.md D-15; recorded by 173-10, filed by 173-13)
owner: operator decision; Phase 176 if a cue is wanted
files:
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions/[questionId]/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/+page.svelte
---

## The limitation

A user who edits several entities sees the selected entity's name in two places only: the menu's group title, and the entity home's greeting while something is left to do (when everything is answered the heading is the catalogue's "ready" text and names nobody). The questions overview, the question editor and the settings page show no name.

A wrong-entity **save** is impossible: the URL names the entity, the draft is kept under that entity's own storage key, and the writer saves the selected entity's row alone (shown by `contestant-entity-selection`). A wrong-entity **session** is not: a user who edits two candidates can answer a whole set of questions for the wrong one without an on-page cue.

## Decision recorded

D-15 chose "nothing in the header, nothing on home; the menu names the selected entity", and U-09 kept the answering pages as they were. This todo exists so the residual risk is weighed once real multi-entity users exist, not to reopen the decision by default.

## If a cue is wanted

A one-line note at the top of the entity-level pages, for a user whose `contestantCtx.entities` holds more than one, reading the same `contestantApp.entitySelection.current` string the menu's group title uses. It would need the new surface in the axe scan (`contestant-a11y.spec.ts`) in both themes.
