---
created: 2026-10-09T00:00:00.000Z
title: The home's task list and the nominations list are `list-style: none` with no `role="list"` — untested on WebKit, and the suite has no WebKit project
area: Contestant app / accessibility
severity: minor
source: Phase 176 plans 14 and 18 (176-14-SUMMARY.md § Not done, or not verified; 176-18-SUMMARY.md § For plan 176-19, read 6); filed by 176-19
owner: the operator, for the decision; no item of the decision document covers it — it is a new question
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte
  - tests/playwright.config.ts
---

## Problem

The home's task list is `<ol class="… list-none …" aria-label=…>` and the nominations view's list is `<ul class="… list-none …">`. Neither carries `role="list"`. WebKit is said to drop list semantics from a list styled `list-style: none` unless it carries the role; if that holds for the Safari versions the project supports, a VoiceOver user is told neither the list's name nor a row's position on either page.

**This is stated from memory of WebKit's behaviour and was not tested**: the E2E suite has no WebKit and no Firefox project, and no screen reader was run in the phase. The axe scans of both pages pass in Chromium in both themes, which says nothing about it.

The Contestant App's menu is not touched by the question: its list has explicit roles (176-16-SUMMARY.md).

## Why it is a decision and not a fix

Adding `role="list"` to an `<ol>` or `<ul>` trips Svelte's `a11y_no_redundant_roles` warning, so the role needs an accepted-warning comment (`// svelte-warning: accepted — …`) on each list. The UI contract's markup has no role. The markup was left as the contract gives it.

## Options

1. Test it first: open both pages in Safari with VoiceOver (read 6 of `2026-10-09-176-seven-reads-the-ui-contract-leaves-to-a-person.md`). If the lists are announced, close this with that reading.
2. Add `role="list"` to both lists with the accepted warning, and to any other `list-none` list of the app found by the same search.
3. Add a WebKit project to the suite for the accessibility-critical specs, which would also make the reading repeatable.

## Resolution

**Closed 2026-10-11** by Phase 177 plan 177-19, at the phase's close (plan 177-21), as the operator ruled it (decision F4 (a) of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`: add `role="list"` to both lists in Phase 177, without a VoiceOver check).

- **What was done: option 2.** The home's task list (`apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte`), the nominations view's list (`apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte`) and the list of cards on the nomination editor's details step (`apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.svelte`) each state `role="list"`. Commit `8f6db36bc` for the first two; the editor's list carries the role since it was built.
- **Held by** the home's component case that reads the attribute (`page.svelte.test.ts` beside the home) and the nominations view's (`nominations/page.svelte.test.ts`); both pages and the details step are scanned by axe in both themes in the closing run.
- **A sentence of this todo did not hold on this tree:** the role does **not** trip Svelte's `a11y_no_redundant_roles` warning here. `yarn workspace @openvaa/frontend check` runs with warnings as failures and raised nothing (0 errors, 0 warnings), so no accepted-warning comment was needed or added.

**What was not tested.** WebKit. The role was added without opening either page in Safari and without a screen reader, as ruled; whether VoiceOver announces the lists, before or after the change, is unmeasured. The suite still has no WebKit and no Firefox project (option 3 of this todo was not taken). The VoiceOver read stays with a person: `2026-10-11-177-reads-the-ui-contract-leaves-to-a-person.md`. Other `list-none` lists of the application were not searched for.
