---
created: 2026-10-09T00:00:00.000Z
title: The colour parser accepts what it should refuse; three more colour columns are handed on unparsed (item 1, an election's colour reaching a style attribute unparsed, is fixed)
area: Frontend / security (stored CSS); colour utilities
severity: minor
source: Phase 175 plan 08 (175-08-SUMMARY.md § Threat Flags; deferred-items.md items 1 to 3); filed by 175-13. Operator decision B3 was answered (b) on 2026-10-09 (v2.16-OPERATOR-DECISIONS-2026-10-09.md): item 1 is fixed by the quick task .planning/quick/261009-b2-b3-b6-operator-replies, commit 33c8de3ad; items 2 and 3 are open
owner: a security or frontend plan of a later phase, for items 2 and 3. Item 1 is done: Phase 176 had closed when B3 was answered, so it was fixed in a quick task instead of the phase's closing plan
files:
  - apps/frontend/src/lib/components/electionTag/ElectionTag.svelte
  - apps/frontend/src/lib/api/base/universalDataProvider.ts
  - apps/frontend/src/lib/utils/color/parseColorString.ts
  - apps/frontend/src/lib/utils/color/ensureColors.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/preview/+page.svelte
  - apps/supabase/supabase/schema/011-validation-functions.sql
---

## Background

Phase 175 closed the stored-CSS path for an **entity's** colour at both ends. The database refuses anything but a hex colour on the four entity tables (`validate_entity_color`), and every read of an entity's colour passes `ensureColors`, which returns a hex colour or the empty string and never the text it was given. Three things beside that path were found and not changed then. **Item 1 has since been fixed (2026-10-09); items 2 and 3 are open.**

## 1. An election's colour reaches a `style` attribute unparsed — DONE 2026-10-09

**Fixed under operator decision B3 (b)** by the quick task `.planning/quick/261009-b2-b3-b6-operator-replies` (its `SUMMARY.md` has the gates and the full run).

- `33c8de3ad` `fix(frontend): elections pass ensureColors` — `UniversalDataProvider.getElectionData` returns its elections through the provider's `ensureColors` method, as `getEntityData` does. One line.
- `805f8ccb6` `test(frontend): an election's colour is handed on parsed and contrast-adjusted` — five cases in `apps/frontend/src/lib/api/base/universalDataProvider.test.ts`, four of them red before the fix, each on its expectation: a stored `#ff0000; background: url(x)` is handed on as `{ normal: '', dark: '' }`; an unparsable normal colour beside a good dark one loses the normal colour only; `#ffffff` comes out as `ensureColors` gives it and equal to the same colour of an entity (`#676767` / `#898989` with the shipped backgrounds); an election with no colour is handed on as the same object.
- `54f87f1cb` `test(frontend): ElectionTag renders empty colour members as no colour` — three component cases. **The component needed no change:** it writes a declaration and adds the colour class only for a member that is truthy, so the tag of an election whose colour was refused (two empty members) is the same element, attribute for attribute, as the tag of an election with no colour (`outerHTML` compared).
- `f78b32af7` `docs: …` — the two developer-guide sentences that named the adjusted colours as those of entities and question categories now name elections too (`frontend/data-api-and-adapters`, `frontend/styling`).

**The visible consequence the operator accepted with B3 (b):** the voter app's election colours are contrast-adjusted from this commit on. A stored election colour with less than the required contrast on `base-300` is painted darker in the light theme (lighter in the dark theme), and an election that stores no dark colour gets one derived from its normal colour. The tag itself sits on `base-200`, or on `base-100` when `onShadedBg` is set, while the adjustment is computed against `base-300`; the contrast on the tag's own background was not measured.

**Not done here, and not measured:** the database still accepts any text in `elections.color` (the `elections` table is not bound by `validate_entity_color`), so the reader is the only guard. The stored-CSS path was closed by unit and component cases; it was **not reproduced in a browser** before the fix or after it, and no E2E test stores a hostile election colour.

What follows is the finding as it was filed.

`ElectionTag.svelte` interpolates `election.color.normal` and `.dark` into `style` (`--tag-color: …`). `UniversalDataProvider.getElectionData` does not pass elections through `ensureColors`, and the `elections` table is not bound by `validate_entity_color`. So a stored election colour such as `#ff0000; background: url(…)` is CSS in every voter's browser.

- Who can write it: a holder of `project.edit_structure` on the project (project admins and project editors), `bulk_import`, the service role. Not an entity's own editor, which is what made the entity path worth closing first.
- Measured: the two files, by reading, in plan 175-08. **Not reproduced in a browser.**

Routing `getElectionData` through the provider's own `ensureColors` method is one line. It would also start adjusting election colours for contrast in the voter app, which is a visible change and the reason this needed a ruling (B3; answered (b)).

## 2. `parseColorString` accepts functional notation it should refuse

`apps/frontend/src/lib/utils/color/parseColorString.ts`:

- `if (out.find((v) => isNaN(v)))` never fires: `find` returns the `NaN` it found, which is falsy. `rgb(a, b, c)` therefore parses as three `NaN` channels, and `ensureColors` answers `#000000` for it.
- `parseInt` takes the leading integer of each channel, so `rgb(1;background:url(x),2,3)` parses as `1, 2, 3`.
- A channel below 0 or above 255 is accepted; `rgbToHex` then builds five digits for a negative channel.

None of these lets text through `ensureColors`, which re-serialises to a hex colour and checks the result; they make it answer with a colour for a value that is not one. `Input`'s colour kind and the store's colour comparison call the parser too, and each checks the result's form itself. Measured by reading and by plan 175-08's unit cases for `ensureColors`; the parser has no case of its own for these inputs.

**Option:** `out.some(Number.isNaN)`, a whole-token match per channel, and a range check, with cases for the three inputs above.

## 3. Three more colour columns no component paints today

A nomination's own `color`, and the colours of constituencies and questions, are handed to the data root without passing `ensureColors`. (Question categories do pass it.) No component found paints one. A component that starts to inherits the path of item 1.

**Option:** pass every object the provider returns through its `ensureColors` method, so that the data root never holds an unparsed colour. Same visible consequence as item 1 wherever one is painted later. After item 1 the provider passes elections, entities (alone and with nominations) and question categories; nominations, constituencies, constituency groups and questions are still handed on as stored.

## Beside these: the adjusting expression is in two places

`o.color ? { ...o, color: ensureColors(o.color) } : o` is the provider's `ensureColors` method and, written out again, the Contestant app's preview page (plan 175-11's unfixed checklist item). A shared helper beside `ensureColors` would serve both and item 3. Item 1 used the provider's existing method and added no third copy.

## What a fix must keep

The entity path's two proofs: `41-entity-color.test.sql`, and the E2E reading of a voter's avatar, whose inline `--bg-color` is a six-digit hex colour and nothing else (`perm-organization-editing`, the test of organization A). And, since item 1, the election path's: `universalDataProvider.test.ts` and `ElectionTag.svelte.test.ts`.
