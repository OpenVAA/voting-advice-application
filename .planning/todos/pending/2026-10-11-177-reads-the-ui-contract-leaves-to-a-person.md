---
created: 2026-10-11T00:00:00.000Z
title: Reads of the nomination editor and the nominations view that need a person — four backstop rows of the UI contract and three manual-only verifications
area: Contestant app / accessibility / localization
severity: major
source: Phase 177 UI contract § UI Considerations (three long-text backstop rows and one keyboard row); 177-VALIDATION.md § Manual-Only Verifications; 177-16, 177-17, 177-19 and 177-20-SUMMARY.md § Not done, or not observed; filed by 177-21
owner: "the operator: a person with a phone or a narrow window, a keyboard and a screen reader. None of these holds the phase"
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/elections/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.svelte
  - apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte
  - apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte
---

Every address below is under `/contestant/<entityType>/<entityId>/nominations`. The E2E suite measures these pages at 320 and 390 px in **English only**, scans thirteen of their states with axe in both themes in **Chromium only**, and runs no screen reader. A local stack with the dataset `perm-contestant-nominations` seeded (`yarn db:seed --template perm-contestant-nominations`) holds what each read needs.

## Reads at 320 px in the six locales other than English (da, et, fi, fr, lb, sv)

| # | Page | Width | Locale | What to look for |
|---|---|---|---|---|
| 1 | The election step (`/elections`), the constituency step (`/constituencies`), the details step (`/details`) and the nominations view | 320 px | each of the six | Every explanation, note, hint and error is shown whole: nothing is clipped, nothing overlaps, and the page does not scroll sideways. On the details step also with a card in error (press the main button with "Other" chosen and no name) and with a card removed |
| 2 | The election step and the constituency step | 320 px | each of the six | The page's question title (`<h1>`) wraps and the page does not widen |
| 3 | The details step | 320 px | each of the six | A parent group's legend with its "Required" mark, and the hint under an option ("not nominated here yet"), are not clipped inside the card |

Rows 1 to 3 are the contract's three long-text backstop rows; together they are the first manual-only verification (U-27 (a): the E2E check is English only).

## The keyboard and a screen reader, in English

| # | Page | What to do | What to look for |
|---|---|---|---|
| 4 | The whole editor | With the keyboard alone, and then with a screen reader: define a nomination; choose "Other" and type a name; remove a nomination and keep it again; press the main button with a card unfinished | Each can be completed. The contract's keyboard backstop row |
| 5 | The details step, a parent group | Tab into the group; move with the arrow keys | The group is announced as a group with its legend, and as required where it is; each option is announced by its name alone, with its hint; "Other" chosen by arrow leaves focus on its radio and the name field is the next stop. The suite asserts the tab stops and the arrow keys (`keys:`), not what is announced. While the "Required" mark is shown the group's accessible name holds that word. After a choice made with the pointer: where focus is, and that the chosen row's fill can be told from the others in both themes — neither is asserted by a test |
| 6 | The details step, Remove and Keep | Press Remove, then Keep | Focus lands on Keep, then on Remove (asserted by the suite). **What a screen reader says is not observed**: the removed line is a status message and describes Keep |
| 7 | The details step, the message region | Provoke each message a person can: an unfinished card; a removal of a nomination with candidates listed under it | The message is announced when it appears, and focus returns to the main button after a refused save |
| 8 | The constituency step under "start from the constituency", a constituency with no election the entity can stand in | Pick such a constituency | The sentence "no election here in which you can stand" carries `role="status"`, which the contract's markup does not have; Continue is disabled. Whether it is announced, and whether announcing it is right, is not observed. **The election step's hint has the same shape and no role**: one ruling for both is the operator's |
| 9 | The home's task list, the nominations view's list and the details step's list of cards, in **Safari with VoiceOver** | Read each list | Each is announced as a list with its item count. `role="list"` was added to all three without a WebKit check (operator decision F4 (a)); the suite has no WebKit project |
| 10 | The nominations view | Tab from the main button | The Edit link is the next stop and is announced as what it is. It is a `Button` with an `href`, which renders an anchor with the role `button`: **whether a navigation should be announced as a button is a question about the component**, for every such `Button` in the application |

## Other reads

| # | What | What to look for |
|---|---|---|
| 11 | The voter's election page and the pre-registration election page with an election name longer than a phone is wide | The name wraps and the checkbox can be reached. The fix (`whitespace-normal` on `ElectionSelector`'s label) is measured on the editor's election step only; these two pages render the same component and were **not opened** with such a name |
| 12 | The visual-regression baselines | Whether a baseline moved with the selector's label. The visual project is not part of a default run; it is read from the phase's CI evidence. The base dataset's election names fit on one line, so none is expected to |
| 13 | The constructed translation values | `2026-10-11-177-native-speaker-review-nomination-editor-strings.md` — the third manual-only verification |

## Related

`2026-10-09-175-seven-reads-the-ui-contract-leaves-to-a-person.md` and `2026-10-09-176-seven-reads-the-ui-contract-leaves-to-a-person.md` hold the same kind of list for the two phases before. Read 6 of the second is the VoiceOver read of the two lists that row 9 above continues.
