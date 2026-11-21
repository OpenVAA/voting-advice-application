# Phase 175 — deferred items

Discoveries outside the scope of the plan that made them. None was changed.

## From plan 175-08

1. **An election's colour reaches a `style` attribute unparsed.** `ElectionTag.svelte` interpolates `election.color.normal` and `.dark` into `style`, and `UniversalDataProvider.getElectionData` does not pass elections through `ensureColors`. The `elections` table is not bound by `validate_entity_color`. Routing the read through the util is one line and would also adjust election colours for contrast on the voter side. Needs a ruling.

2. **`parseColorString` accepts functional notation it should refuse.** `apps/frontend/src/lib/utils/color/parseColorString.ts`:
   - `if (out.find((v) => isNaN(v)))` never fires: `find` returns the `NaN` it found, which is falsy. `rgb(a, b, c)` therefore parses as three `NaN` channels, and `ensureColors` answers `#000000` for it.
   - `parseInt` takes the leading integer of each channel, so `rgb(1;background:url(x),2,3)` parses as `1, 2, 3`.
   - A channel below 0 or above 255 is accepted.

   None of these lets text through `ensureColors`, which returns the re-serialised hex colour or nothing; they make it answer with a colour for a value that is not one. `Input`'s colour kind and the store's colour comparison call the parser too.

3. **Three more colour columns no component paints today**: a nomination's own `color`, and the colours of constituencies and questions, are handed to the data root without passing through `ensureColors`. A component that starts painting one inherits the path of item 1.

## From the overflow fix between plans 175-12 and 175-13 (`175-12-OVERFLOW-FIX.md`)

4. **A candidate's profile with a multiple-text info question is 8 px wider than the viewport at 320 px.** Measured on the base dataset's candidate in `en`, `fi` and `sv`, before and after the label fix alike, and not at 390 px. The cause is not a label that cannot wrap. Each row of the row list (`MultipleTextPart.svelte`) is a flex line of the language label (64 px and 20 px of margin, kept even while the translations are hidden and the label is transparent), the field (48 px at its narrowest) and a group of three 56 px buttons that does not shrink (172 px): 308 px in a 280 px column, so the last button ends at 328. It is the third button, "remove", that lies partly outside the viewport. Older than the phase by reading, not by measurement: between the phase's base and `HEAD` the file gained `lang`, the description and the focus wiring, and no class of the row changed. A fix changes the row list's layout (dropping the hidden label's reserved width, or letting the buttons move to a second line) and needs a ruling. Until then a page-width assertion on a candidate's profile holds only on a dataset without such a question, which is why the one added here uses the organization-editing dataset's candidate.

5. **An `Input` row gives its label less than the label's width before its control is at its narrowest.** The row shrinks the label and the control in proportion to their preferred widths. "Election Number" at 320 px is given 103 px for 117 px of text beside a 124 px field, and now takes two lines; "Constituency" is given 89 px for 93 px, cannot wrap, and runs 4 px into its own margin, as it did before. Letting the control give way first would keep such labels on one line, and it would move the controls of every row whose label and control do not both fit, at every width. Not changed: it is a layout decision of the row, outside the ruling the fix was made under.

6. **The settings page's one `Input` row** (the locked e-mail address) was not opened at a phone width. Its label is one short word and the row is outside a group.

