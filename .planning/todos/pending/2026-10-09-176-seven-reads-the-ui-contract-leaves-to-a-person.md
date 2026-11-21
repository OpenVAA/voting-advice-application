---
created: 2026-10-09T00:00:00.000Z
title: Seven reads of the home, the menu and the nominations view that the UI contract leaves to a person
area: Contestant app / accessibility and layout
severity: minor
source: Phase 176 (176-UI-SPEC.md § UI Considerations, the five rows marked as backstop; 176-18-SUMMARY.md § For plan 176-19 for what the suite holds of each, and for the two reads it adds); filed by 176-19
owner: whoever verifies Phase 176 by hand, before the milestone is shipped
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
  - tests/tests/specs/perm/perm-no-nomination.spec.ts
---

## Finding

The UI contract of Phase 176 resolved five of its rows as backstops: true by construction or by a component test, and to be looked at by a person because no automated check of the suite reaches them. Plan 176-18 added two reads of the same kind. None was looked at by a person in the phase: no page of the phase was seen in a browser by eye, and no screen reader was run. Each line says what the suite holds today and what is left.

1. **The new sentences and task labels in seven locales at 320 px.** Row labels, reason sentences, the note and the empty sentence are to render without clipping or overlap on the home, in the menu and on the nominations view. Held: page-width and bounding-box checks in **English**, at 320 × 568 and 390 × 844, seven tests at each width (`perm-no-nomination`, the phone tests). Left: the six other locales.
2. **Card labels in seven locales at 320 px.** The longest label, "Numéro du·de la candidat·e", is to wrap above its value. Held: each card value inside its card in English. Left: every other locale, and the parent row at phone width, which the UI contract excludes and no seeded nomination has.
3. **The greeting with a long party name.** The `<h1>` is to wrap and the page is not to widen. Held: measured in English at 320 and 390 px. Left: the same greeting in the other locales, and a name made of one unbroken word, which was not tried.
4. **Focus after accepting the terms of use at a closed URL.** Focus is to be on the home's `<h1>` and not on `<body>`. Held: nothing automated.
5. **An entry the browser shows open and the server has closed**, after an administrator's change. The user lands on the home with nothing said, and the entry's state is right after the next full load. Held: the stale-entry tests of `perm-no-nomination` — an entry that is open in the browser's copy and closed in the database leads to the home, with focus on its heading (176-08-SUMMARY.md and 176-10-SUMMARY.md; the dependence on timing that plan 11 noted was removed in plan 12). Left: the read by a person, and whether "nothing said" is acceptable. The stale copy itself is filed as `2026-10-09-176-browser-keeps-a-stale-entity-after-an-administrators-change.md`.
6. **List semantics on WebKit with VoiceOver.** Whether the home's `<ol>` and the nominations view's `<ul>`, both `list-style: none` and neither with `role="list"`, are announced as lists with their length and each row's position. Held: nothing; the suite has no WebKit project. The decision that may follow is filed on its own as `2026-10-09-176-list-semantics-of-the-task-list-and-the-nominations-list-on-webkit.md`.
7. **How axe classifies a closed menu item's contrast** (`!text-neutral/20` on `bg-base-100`): passed, incomplete or not applicable. Held: the gate shows only that it is not a violation, because it attaches violations alone.

### Read beside these, of the same kind

- **The home while the task state becomes known.** The rows keep their place only if the real explanation wraps to as many lines as its invisible place-holder, and the loading button is replaced by a link of another width (176-15-SUMMARY.md). Not measured.
- **Spacing.** The base style gives the explanation a 16 px bottom margin, which with the list's `mt-lg` makes 36 px between them (176-14-SUMMARY.md). Not looked at.
- **The menu**, in either theme: the dimmed items, the reason line's insets under the preview item and the paragraph's bottom margin inside the list (176-16-SUMMARY.md).
- **The profile without its nominations block**: focus and announcement through the place the section was taken from (176-13-SUMMARY.md).
- **The scans run at 1280 × 720 in English.** No Finnish page was scanned and the phone tests run no axe scan.
- **Which state the `contestant-nav-menu` scan lands on** is inferred from its session, not asserted. One line would pin it: `navMenu.expectReasonLine(null)` after the menu opens.

## Solution

Open the three screens as a candidate and as a party, with and without a nomination, in each of the seven locales at 320 px and in both themes, with VoiceOver on Safari for read 6, and record what was seen beside each line. A read that fails is a defect in the surface.
