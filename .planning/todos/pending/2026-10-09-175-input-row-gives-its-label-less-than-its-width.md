---
created: 2026-10-09T00:00:00.000Z
title: An Input row gives its label less than the label's width before its control is at its narrowest; the settings page's row was never opened at a phone width
area: Frontend / layout (input)
severity: trivial
source: the overflow fix between plans 175-12 and 175-13 (175-12-OVERFLOW-FIX.md § What was changed and § For the orchestrator; deferred-items.md items 5 and 6); filed by 175-13
owner: whoever next rules on the Input row's layout; read it beside the label todo of Phase 174.1
files:
  - apps/frontend/src/lib/components/input/shared.ts
  - apps/frontend/src/lib/components/input/Input.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/+page.svelte
---

## 1. The row shrinks the label and the control in proportion

A single-row `Input` is a flex line of the label and the control's container (`inputContainerClass` and `inputLabelClass` in `shared.ts`). Both shrink, in proportion to their preferred widths, so the label loses width while the control is still wider than it needs to be.

### Measured (run `175-12-overflow-probe-after-r2`, on the tree with the label fix)

- "Election Number" at 320 px, `en`: 117 px of text in a 102.5 to 103 px box beside a 123.5 to 124 px field. Since the label may wrap (`whitespace-normal`, commit `64834c4e4`) it takes **two lines**, and the row is 0.5 px higher. In `fi`, "Ehdokasnumero" is hyphenated into two lines. In `sv`, and at 390 px, nothing changes.
- "Constituency" at 320 px: 93 px of text in an 89 px box. One word, so it cannot wrap, and it runs 4 px into its own margin, as it did before the fix.
- `overflow-wrap: anywhere` was tried beside the fix and taken out: it broke "Constituency" into "Constituenc" and "y".

### Inferred

That letting the control give way first would keep such labels on one line. It was not tried. It would move the controls of every row whose label and control do not both fit, at every width, which is why it was not done under the ruling the label fix was made under.

### Options

1. **Leave it.** A two-word label takes two lines at the narrowest width; nothing is hidden and nothing overflows.
2. **Let the control shrink first** (`shrink-0` on the label down to its text, a least width on the control). Re-measure every row at 320, 390 and 1280 px by the method of `175-12-OVERFLOW-FIX.md`.
3. **A fixed share for the label.** Predictable rows; long labels wrap sooner.

This is the same row as the remaining points of `2026-10-07-174.1-daisyui-label-nowrap-is-a-latent-overflow-in-other-label-users.md` § Update 2026-10-09 (the one-word label), and one ruling should cover both.

## 2. The settings page's one row was not opened at a phone width

`settings/+page.svelte` renders one `Input`: the locked e-mail address, outside a group, with a one-word label. The overflow fix read the page's markup and did not open it at 320 or 390 px. The phase's other two pages that render an `Input` (the profile and the question page) were measured.

Inferred from the measured rows: a one-word label beside a locked field outside an `InputGroup` does not widen the page. **Not measured.** A long e-mail address is clipped by the row or not; nobody looked.

**Option:** one page-width and row assertion at 320 and 390 px in an existing phone describe, through `pageGeometry.fixture.ts`.
