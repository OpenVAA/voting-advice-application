---
created: 2026-10-09T00:00:00.000Z
title: States of the home, the gate, the saves and the nominations view that Phase 176 holds by a component case alone, or by nothing
area: E2E / Contestant app
severity: minor
source: Phase 176 (the § Not done, or not verified of 176-02, 176-05, 176-08, 176-09, 176-10, 176-12, 176-13, 176-14, 176-15, 176-17 and 176-18-SUMMARY.md; the orchestrator's list in 176-19-COLLECT.md); filed by 176-19
owner: unassigned — the next plan that edits the surface named in each line; Phase 177 meets items 1 to 4 when it adds the nomination editor
files:
  - tests/tests/specs/perm/perm-no-nomination.spec.ts
  - tests/tests/specs/a11y/contestant-a11y.spec.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/[questionId]/+page.svelte
  - apps/supabase/supabase/tests/database/42-entity-nominations.test.sql
---

## Finding

Every line is a state or an assertion a summary of the phase records as not exercised. None is known to be wrong. Each says what holds it today.

### The saves and the buttons

1. **An edit of an answered question, with none unanswered and the profile incomplete.** `questionSaveTarget` answers the questions list. Held: the helper's own cases. No E2E test, and the component case `leads back to the questions list after an edit …` covers the complete profile only.
2. **The profile's label under a missing required name.** The page's name check is handed to `taskStateOf` as it is. Held: the existing cases of the name rule. No case of the label.
3. **The questions list's buttons in a state that is not known.** The condition that hides them there has no case of its own.
4. **The home's forms that no seeded state reaches** (176-14-SUMMARY.md § For plan 176-15): nominations locked on the home, and answers locked with no nomination, are component cases alone.

### The gate

5. **No assertion at the HTTP level** that the answer to a closed URL is a 307, and none that no frame of the closed page was painted. Held: the unit tests show each load throws the redirect on the server, and the spec shows where the browser ends.
6. **A required question added behind the user** (one of plan 176-08's two backstop truths): not exercised.
7. **A `null` from the nominations read reaching the load in a browser.** The entity read refuses first for every entity a user does not edit. Held: unit cases at the parse and the writer, and the load's case for no user data.
8. **The progress bar and a question page for a user with unanswered required info** (176-09-SUMMARY.md): the component case asserts the setting and the spec asserts the list's intro; nothing asserts the bar in a browser, nor a question page as opposed to the list.

### The nominations view

9. **A parent row in a browser** is shown for a candidate under a party only, by `contestant-journey`. No dataset nominates a party under an alliance for a user of the suite, and no seeded or step-written nomination of `perm-no-nomination` has a parent.
10. **An election with no name in any locale** gives a card an empty `<h2>` and an unnamed `<article>`. Not reachable with any dataset of the suite; the view shows no placeholder, as the contract says.
11. **Focus on the view's `<h1>` after an in-app navigation into it** was not observed: every `open` of the fixture is a full load.
12. **The first-level heading of the preview after an in-app navigation.** Plan 176-10 once saw no first-level heading on the preview within 5 s after an in-app navigation. Not investigated, not seen again, and neither met nor ruled out by a later plan. **Unconfirmed.**

### The home

13. **An entity with an empty name is greeted "Hello, !".** Not reachable with a dataset of the suite (176-15-SUMMARY.md).
14. **The selected entity's name against the entity-level load's data**: the page reads the selected entity in every state. No case was found or sought in which the two differ.

### Scans

15. **The note in its answers-locked use** is scanned on an organization's profile alone (Phase 175's `org-profile-answers-locked`). The same component is scanned in its nominations-locked use by two entries of this phase (`no-nomination-nominations-locked`, `nominated-nominations-pending-locked`). Its answers-locked use is not scanned on the home, the questions list or a question page, nor on any page as a candidate's editor sees it (see `2026-08-27-147-answers-locked-warning-unscanned.md`).
16. **The pending frame of the home** is scanned by nothing, by design.
17. **`visual-regression`** was not run in the phase (opt-in); that its candidate's preview stays open rests on the scan entry that uses the same session (176-10-SUMMARY.md).

### The database function

18. **A NULL `election_round`** and **`service_role` executing `get_entity_nominations`** (it gets NULL, having no `auth.uid()`) are pinned by no cell of `42-entity-nominations.test.sql`.
19. **The writer's four `nominations:` integration cases were never shown red**: they compare whole elements, and no mutation of the writer was run against them.

## Solution

Each is one test, or one row in a dataset. Items 9 and 10 need a row in `perm-no-nomination`'s template or a state step; item 5 needs a request made without a browser (`page.request` with `maxRedirects: 0`).

## Update 2026-10-11 — items 4, 9 and 11 are exercised in a browser, 9 in part; the rest stand (Phase 177 close)

Which items the tests of Phase 177 now exercise, by title, all in `tests/tests/specs/perm/contestant-nominations.spec.ts`:

- **Item 4, both halves.** `holds: with no nomination under either lock the home's first task leads to the nominations view` loads the home of an entity with no nomination under the nominations lock and under the answers lock, reads its next step and follows its main action. It does not read the home's note.
- **Item 9, in part.** `nominations-view: a typed party is shown on its row with the line that it was requested` reads a parent row that is not a party's own, and the scan entry `nominations-requested-parent` scans it. A party under an alliance on the view is still read by no test.
- **Item 11.** `focus: the heading of each step takes focus after the navigation that opens it, a skip included, and the nominations view's after Cancel` asserts focus on the view's heading after an in-app navigation into it, from the editor's Cancel. Seen green only: the planted-defect run of plan 177-20 failed at an earlier step of that test, so this assertion was never seen red.
- **Item 15, in part.** The note is now scanned in a third use, under the answers lock on the nominations view (`nominations-answers-locked`). Its answers-locked use on the home, the questions list and a question page is still scanned nowhere.

Items 1 to 3, 5 to 8, 10, 12 to 14 and 16 to 19 were not met by Phase 177. Owner by operator decision F6 (a): Phase 179. The states Phase 177's own screens leave unexercised are a list of their own: `2026-10-11-177-states-held-by-component-cases-and-seen-in-no-browser.md`.
