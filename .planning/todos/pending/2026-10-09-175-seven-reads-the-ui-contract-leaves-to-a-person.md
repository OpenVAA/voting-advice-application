---
created: 2026-10-09T00:00:00.000Z
title: Seven reads of the organization-editing pages that the UI contract leaves to a person
area: Contestant app / accessibility and layout
severity: minor
source: Phase 175 (175-UI-SPEC.md § UI Considerations, the seven rows marked as backstop; 175-12-SUMMARY.md and 175-12-OVERFLOW-FIX.md for what the suite now holds of each); filed by 175-13
owner: whoever verifies Phase 175 by hand, before the milestone is shipped
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/preview/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions/+layout.svelte
  - apps/frontend/src/lib/components/input/Input.svelte
  - tests/tests/specs/perm/perm-organization-editing.spec.ts
---

## Finding

The UI contract of Phase 175 resolved seven of its rows as backstops: true by construction or by a component test, and to be looked at by a person because no automated check of the suite reaches them. None was looked at by a person in the phase. Each line says what the suite holds today and what is left.

1. **The seven locales at 320px.** The identity sentences, the three info lines, the refused-save message, the neutral page and the preview's tag line are to render without clipping or overlap in every locale at 320 px. Held: page-width and row checks in English, on `en` pages, at 320 and 390 px. Measured once, not asserted: `en`, `fi` and `sv` pages by the overflow fix. **Not opened by anyone: `da`, `et`, `fr`, `lb`.**
2. **A long locked name.** A long locked name is to be clipped by its field at 320 px and readable in full in the menu's group title and in the preview card. Held: a 100-character name stored on a locked profile leaves the page inside the viewport at 320 and 390 px, and the preview shows it in full. Left: the field itself was not measured, and the menu's title was not read.
3. **The in-row labels.** "Portrait" or "Logo", "Colour", "First Name", "Surname" and the seven language names are to fit their rows at 320 px in every locale without overlapping the control. Held in English: the colour row, the locked info question's row and a candidate's two name rows. Left: the other six locales, and the image row.
4. **The preview's long name and tag.** A long party name is to wrap in the card header and a long short name in the tag line at 320 px, in both themes. Held: the long name at 320 and 390 px in the light theme. Left: a long short name in the tag line, which does not break inside the tag when it holds no space, and the dark theme.
5. **A failed re-read of the entity list after a save.** A save that was stored and whose re-read of the list then fails is not to be reported as a failed save. Held by a component case with a rejecting spy. Left: a failing load in a browser.
6. **The native colour picker from the keyboard in two engines.** The platform colour picker is to open from the keyboard and return focus to the swatch in Chromium and in WebKit. Held: nothing automated; the suite types the hex field.
7. **The swatch's focus ring in both themes.** Keyboard focus on the picker is to be visibly indicated on the swatch's wrapper in the light and the dark theme. Held: the classes were read; no test measures a focus ring.

### Read beside these, of the same kind

- An organization's profile with **seven** translations shown: the suite's "every translation shown" is the dataset's three locales.
- The settings page's one `Input` row, never opened at a phone width (`2026-10-09-175-input-row-gives-its-label-less-than-its-width.md`).

## Solution

One sitting with the phase's dataset loaded (`yarn db:seed --template perm-organization-editing` writes the rows; the three editors are created by the spec's setup, so signing in by hand needs users made for the purpose): a phone-width window, each of the seven locales, both themes, Chromium and WebKit for the colour picker. A defect found is a todo of its own. Lines 1, 3 and 4 can be turned into assertions by running the spec's phone describes per locale; lines 6 and 7 cannot without a visual or a focus-ring measure the suite does not have.
