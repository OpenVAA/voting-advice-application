# Quick task 261009 — the operator's replies B2, B3 and B6

Written by the orchestrator from the executor's report, 2026-10-09. Source of the task: the operator's
answers in `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` (commit `328bf49b6`): B2 (b) "MAKE
changes and i approve", B3 (b), B6 (a) with "Get a screenshot to go along the todo".

## Commits

| Hash | Subject |
|---|---|
| `805f8ccb6` | test(frontend): an election's colour is handed on parsed and contrast-adjusted |
| `33c8de3ad` | fix(frontend): elections pass ensureColors |
| `54f87f1cb` | test(frontend): ElectionTag renders empty colour members as no colour |
| `f78b32af7` | docs: election colours are among the colours the provider adjusts for contrast |
| `3c686fc8e` | fix(i18n): the registry statement names neither entity type |
| `830c23e2f` | docs(todos): screenshots of the multiple-text rows at 320 px, with the measured 8 px |
| `16bcc299d` | docs(todos): the election-colour item is done; the parser and the three other columns stay open |
| `0dc85bea4` | docs(todos): close the registry-statement todo and file its 24 constructed sentences for a native reader |

The subject of `3c686fc8e` is looser than its content: the statement names both types and is
addressed to neither. The commit body says so.

## B3 — election colours pass `ensureColors`

- One line in `apps/frontend/src/lib/api/base/universalDataProvider.ts`: `getElectionData` returns
  its elections through the provider's `ensureColors` method, as `getEntityData` does. From this
  commit the voter app's election colours are contrast-adjusted.
- `universalDataProvider.test.ts` (new, 5 cases) was committed red: four cases failed on their
  expectation. `ElectionTag.svelte.test.ts` (new, 3 cases) passed on the unchanged component, so it
  is a guard and not a red-then-green pair; the component needed no change.
- Two developers' guide pages now name elections among the adjusted colours.

Measured, by unit and component cases:

- A stored `#ff0000; background: url(x)` comes out as `{ normal: '', dark: '' }`.
- `{ normal: '#ffffff' }` comes out as `{ normal: '#676767', dark: '#898989' }`, equal to the same
  colour of an organization.
- The tag of a refused colour has the same `outerHTML` as the tag of an election with no colour.

Not measured:

- The stored-CSS path in a browser, before or after. No E2E test stores a hostile or low-contrast
  election colour.
- Contrast on the tag's own background. The adjustment is computed against `base-300`; the tag sits
  on `base-200` or `base-100`.
- That nothing else paints an election's colour is inferred from a search for `election.color`.

Not touched: items 2 and 3 of the colour todo, and the database (`elections.color` still accepts any
text; the reader is the only guard).

## B2 — the registry statement, for the operator's approval

Key `dynamic.contestantAppPrivacy.registryStatement.content`, seven catalogues. One key, both render
sites unchanged. Three paragraphs changed; headings, tags and placeholders are byte-equal (compared
by script). No lawyer has read it.

**Section 3 — before**

> {appName} - Candidate Information System.

**Section 3 — after**

> {appName} - Information System for Candidates and Parties.

**Section 5, first paragraph — before**

> The registry stores the following data: name, political background, email address, date of birth,
> website URLs, social media profile URLs, other voluntary responses to the election compass's
> questions, and information obtained from public electoral registers.

**Section 5, first paragraph — after**

> The registry stores the following data about the users of the service and about the candidates and
> parties they represent: name, political background, email address, website URLs, social media
> profile URLs, other voluntary responses to the election compass's questions, and information
> obtained from public electoral registers. For a person who has identified themselves through a bank
> or another identity provider, the registry also stores their date of birth or national
> identification number. These identifiers are not disclosed to the public. They are used only to
> calculate the person's age on the election date and to verify their nomination.

**Operator's edit, 2026-10-10:** the last clause of the second sentence and the two sentences after it
are the operator's, with "Stylise my additions if needed"; the wording above is the styled form ("used
only", "on the election date"). The statement is otherwise approved as written. The catalogues are
brought to this text by quick task `261010-f1-b2-operator-replies`.

**Section 6 — before**

> Data stored in the registry is obtained from candidates through an online form, during their bank
> authentication, and from public electoral registers.

**Section 6 — after**

> Data stored in the registry is obtained from the users of the service through an online form, from
> the identity provider when a user identifies themselves through one, and from public electoral
> registers.

The six other locales:

- No catalogue had a word for "identity provider". Each text says "identification service", built
  from that catalogue's own words for bank identification (`tunnistautumispalvelu` in `fi`,
  `identifieringstjänst` in `sv`, and so on).
- 4 sentences in 6 locales, 24 constructed sentences, are filed for a native reader in
  `todos/pending/2026-10-09-175-native-speaker-review-organization-editing-strings.md`.
- In `et` and `fi` the list's "the person's name" became "name".

Points for a reader with legal training (the full six are in the closed todo under `todos/done/`):

1. Section 5 names only the date of birth as what an identity provider adds. With `idura-ftn` the
   `identity-callback` function also extracts the Finnish personal identity code, and the provider's
   subject identifier is kept as the account's match value. Read in `claimConfig.ts`, not observed on
   a running stack. The old text had the same gap.
2. Section 6 does not name the administrator as a source, though a name can be set by one and rows
   imported.

Not done: no browser check of the statement in any locale.

## B6 — screenshots for the 8 px overflow

`scrollWidth − clientWidth` measured 8 (328 − 320) on the base dataset's candidate, `en`, 320 × 568,
at `3c686fc8e`; nothing was adjusted. Five images under `.planning/todos/pending/assets/`, linked
from the todo's `## Screenshots` section.

Before reading the images:

- In the page as drawn nothing looks cut off. The 8 px beyond the edge are the empty right part of
  the "remove" button's box; the user meets a page that moves 8 px sideways. The first pair of images
  therefore has the three buttons outlined (a CSS outline that takes no space; the reading was 8
  before and after).
- The scrolled image is of a plain 320 px window. Under the phone descriptor the page could not be
  scrolled by script; panning on a real phone was not tested.

Also visible, reported in the todo and not pursued: the row's field is 48 px wide and shows three
letters; in the date row the calendar icon is drawn over digits of the year; under the phone
descriptor the number row shows "4" of "42" (cause not established).

**Operator's note, 2026-10-10**, to be marked in the todo (done by quick task
`261010-f1-b2-operator-replies`):

- Change inputs to render on two rows within narrow containers
- Remove left margin from multiple text inputs (or what looks like a margin)

## Gates and runs

All on `3c686fc8e`, AC power; each status read from its own file in
`tests/e2e-runs/261009-b2-b3-b6-gates/`.

| Gate | Exit | Detail |
|---|---|---|
| `yarn lint:check` | 0 | |
| `yarn format:check` | 0 | |
| `yarn test:unit` | 0 | frontend 3575 passed, 20 skipped (8 new) |
| `yarn build` | 0 | |
| `yarn workspace @openvaa/frontend check` | 0 | |
| full E2E, `176-e2e.sh 261009-b2-b3-b6-final` | 0 | 341 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 113 projects |
| verdict against `176-19-final` | 0 | the same totals and the same count in every project |

No run was void, red or repeated. Two probe runs for the screenshots
(`261009-b2-b3-b6-probe`, `-probe-r2`): 9 passed each, status 0; the probe is not committed.

## Departures

- The closed privacy todo is in `todos/done/`, where the recent closing commits put theirs.
- The full run went through `176-e2e.sh`, so its directory is `tests/e2e-runs/176-e2e/`.
- Five screenshots, not two.
- The second probe run was started in the foreground (about 30 seconds).
- This file was written by the orchestrator: the executor's write of it was refused by its tool.

## Left with the operator

- Approve the English statement, or say what changes.
- Whether section 5 should name the personal identity code and the provider's subject identifier.
- B3's option text says "Phase 176's closing plan"; the fix was made here.
