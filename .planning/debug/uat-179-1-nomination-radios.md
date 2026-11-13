---
status: diagnosed
trigger: "uat-179-1-nomination-radios: The radio buttons of Edit nominations use the same component as the registration options, have a border and can be seen in light and dark."
created: 2026-10-31T17:30:00Z
updated: 2026-10-31T18:20:00Z
---

## Current Focus

bug_class: Bohrbug (deterministic styling)
hypothesis: CONFIRMED. EntitySelector renders its own native radio with `radio radio-primary shrink-0` and no `border` utility; both app themes set `--border: 0px`, so daisyUI's `.radio` border computes to 0 and an unchosen radio has no drawn edge. Radio.svelte adds `border`, which is why the registration options show.
test: done, see Evidence
expecting: done
next_action: None in this session (goal find_root_cause_only). Return the diagnosis. A fix moves EntitySelector's input and label onto Radio; see Resolution.
candidate_causes:
  - "code: EntitySelector's raw input omits the `border` utility (confirmed)"
  - "config: app.css sets `--border: 0px` in both themes, so no `.radio` draws an edge unless a utility adds it (confirmed as the contributing condition; deliberate theme value, not changed by the fix)"
  - "environment: stale CSS or wrong theme on the dev server (eliminated: `--border` reads 0px and the registration page in the same server draws 1px)"
  - "data: the seeded account's rows or colours hide the radios (eliminated: every option kind measures the same)"
and_gate: "yes: the theme's `--border: 0px` AND a radio with no `border` utility must both hold. Remove either and the edge is drawn, as exp 1 and the registration page show. The fix addresses the second, as the operator asked."

## Symptoms

expected: The radio buttons of Edit nominations use the same component as the registration options, have a border and can be seen in light and dark.
actual: "Edit nominations, the radio buttons should have a border, they can't be seen in light nor dark. For the radio borders, use the same components as in the registration options"
errors: None reported
reproduction: Test 7 in UAT. Sign in at http://localhost:5173/contestant/login (Sign in with email) as uat-multi@test.openvaa.local, password Password1!. Open http://localhost:5173/contestant/candidate/31be10cf-af6d-4a3d-ae2c-1890e7c5fafa/nominations and press Edit on a nomination card.
started: Discovered during UAT

## Eliminated

## Evidence

- timestamp: 2026-10-31T17:35:00Z
  checked: knowledge base
  found: .planning/debug/knowledge-base.md does not exist, so there is no known-pattern candidate
  implication: open-ended investigation
- timestamp: 2026-10-31T17:36:00Z
  checked: details/+page.svelte, EntitySelector.svelte, Radio.svelte, RegistrationModeSelector.svelte, node_modules/daisyui/components/radio.css (5.7.46), app.css
  found: the details step's parent group is EntitySelector, whose radio is a hand-written input with class `radio radio-primary shrink-0`. Radio.svelte's input has `radio radio-primary border`. daisyUI's `.radio` is `border: var(--border) solid var(--input-color, ...)`, and app.css sets `--border: 0px` in both themes.
  implication: candidate mechanism, still to be measured in the browser
- timestamp: 2026-10-31T17:37:00Z
  checked: git log of Radio.svelte and EntitySelector.svelte
  found: Radio was added in 4b5d7015f (179.1-19), and that commit moved only the registration page's entity-type group onto it. EntitySelector dates from 177-14 and was not touched by it.
  implication: the border fix was applied to a new component, and the older radios stayed as they were
- timestamp: 2026-10-31T17:45:00Z
  checked: Playwright measurement (scratchpad uat-radios.mjs, report in scratchpad radios/report.json), uat-multi, Edit on the nomination card, details step, 10 parent radios, colorScheme light and dark; control is /contestant/register signed out
  found: every EntitySelector radio computes `0px solid` in both themes (light rgb(37,70,168), dark rgb(104,135,227)) with class `radio radio-primary shrink-0`. Unchosen radio pixels against their background - light max contrast 1.13-1.21 (only the 10% inset shadow), dark 1.00 (one single colour in the crop, nothing painted). Chosen radio 7.47 light, 6.36 dark, from the dot. Registration radios `radio radio-primary border` compute `1px solid`, contrast 6.64 light and 5.14 dark.
  implication: the symptom reproduces in both themes and the only computed difference from the control is border-width
- timestamp: 2026-10-31T17:46:00Z
  checked: the editor's steps for this account
  found: Edit on the card goes straight to the details step. /nominations/elections forwards to the constituency step (one election), which holds 0 radios and 1 combobox. The election step's source renders ElectionSelector checkboxes, not radios.
  implication: the radios the operator means are the parent list (`List`) of the details step, all of them the one input in EntitySelector
- timestamp: 2026-10-31T17:47:00Z
  checked: tests pinned to the current markup
  found: unit `labelOf` selects by `label.htmlFor === radio.id` and asserts the label's text equals the option name; fixture `parentByKeyboard` reads the name from `input.labels[0].textContent`. Both assume a label holding only the name. perm-closed-project's expectRadiosBordered covers the registration screen alone.
  implication: moving to Radio changes what the label holds, so these need adapting; no gate asserts a border on the editor's radios
- timestamp: 2026-10-31T18:00:00Z
  checked: falsification by class alone (scratchpad uat-radios2.mjs, report radios/report2.json), live DOM of the script's own context, `border` added to the same inputs, light and dark, 1280 and 375 wide
  found: border becomes `1px solid` in the primary colour, size stays 24 x 24. Unchosen contrast rises from 1.24 to 7.59 in light, and from 1.00 to 5.67 in dark. Chosen 8.17 light and 6.36 dark. This run takes every colour of the crop against its corner. The first pass (uat-radios.mjs) took only the crop's six most frequent colours, so its figures (1.13-1.21, and 6.64 and 5.14 for the registration radios) understate the maximum and are not comparable with these. Dark's 1.00 is the same under both, as the crop holds one colour.
  implication: the missing utility is the sufficient cause; the hypothesis survived its falsification test
- timestamp: 2026-10-31T18:10:00Z
  checked: two shapes for Radio compared with the markup as it stands (scratchpad uat-radios3.mjs, report radios/report3.json), live DOM rebuilt in the shape Radio renders, with a hint added to one row because the seeded account shows none, light and dark
  found: A wrapped (label holds the content) - with the hint exposed, the radio's exact-name lookup finds 0 because the hint enters the name; with the hint aria-hidden the name and description hold. Under A the label text becomes e.g. "Coastal PartyCP Coastal Party". B overlay (label is absolute inset-0 and holds only the input and the name, with the content offset by radio width + gap-md) - identical to the markup as it stands on every read signal except the border: label holds only the name, htmlFor matches, exact names 1 each, description holds, press on row and hint choose, arrows move and choose, 1 tab stop, axe none, row heights and text x unchanged.
  implication: B keeps the accessibility contract and the test surface; A needs changes to the hint, the unit helpers and the E2E fixture
- timestamp: 2026-10-31T18:11:00Z
  checked: first run of the press on the hint returned mixed false values, including differing between light and dark for the same shape
  found: the click was made by viewport coordinates on a row that could be out of view. With the hint scrolled into view and a baseline of the markup as it stands, every shape chooses in both themes.
  implication: the false values were a measurement artefact and are discarded
- timestamp: 2026-10-31T18:12:00Z
  checked: why it was not caught
  found: axe over the group as it stands reports no violations. 177-UI-SPEC.md U-12 specifies `class="radio radio-primary shrink-0"`, so the markup followed its design contract. 179.1-19-SUMMARY records "EntitySelector and the admin pages still render raw radios; they were outside this gap". expectRadiosBordered covers the registration screen alone.
  implication: no gate exists for this class on the editor; axe does not test the drawn edge of a control
- timestamp: 2026-10-31T18:13:00Z
  checked: other radios, by source; nothing saved
  found: admin question-info (2) and argument-condensation (1) use raw `radio-primary radio` with no border and were not measured. QuestionChoices has `border-lg`, Toggle's is sr-only, Feedback's are star masks. `.checkbox` probes at `0px` with `bg-base-100`; the election step's ElectionSelector could not be measured in place, because this data has one election and forwards past the step. A fresh load after all runs still shows Rural Alliance chosen. No file under apps/ or tests/tests changed.
  implication: report only; the gap stays the editor's radios

## Resolution

root_cause: "EntitySelector.svelte renders a hand-written `<input class=\"radio radio-primary shrink-0\">` rather than the shared Radio, so it lacks the `border` utility; AND app.css sets daisyUI's `--border: 0px` in both themes, so `.radio` draws a 0px edge unless a utility adds one. An unchosen radio is left with only a 10% inset shadow, unpainted on black."
fix: "not applied (goal find_root_cause_only)"
verification: "not applicable; the direction was tried in the live DOM only, and no compiled component or unit test has run on it"
files_changed: []
