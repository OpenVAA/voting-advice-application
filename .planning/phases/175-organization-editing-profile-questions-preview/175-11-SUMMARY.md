---
phase: 175-organization-editing-profile-questions-preview
plan: 11
subsystem: ui
tags: [contestant-app, preview, entity-details, exclude-tabs, entity-tag, ensure-colors, entity-descriptor, svelte-runes, tdd, e2e, red-control]

requires:
  - phase: 175-organization-editing-profile-questions-preview (plan 04)
    provides: entityDescriptorOf with previewTip, previewExcludeTabs and previewTagLine; the copy keys contestantApp.preview.tip.<type> and contestantApp.preview.tagLabel
  - phase: 175-organization-editing-profile-questions-preview (plan 05)
    provides: the organization-editing dataset, its three sessions, the test id contestant-preview-tag, the per-project baseline
  - phase: 175-organization-editing-profile-questions-preview (plan 08)
    provides: ensureColors returning a hex colour or the empty string, never the text passed in
  - phase: 175-organization-editing-profile-questions-preview (plan 09)
    provides: the state steps setOrganizationState and setCandidateState
  - phase: 175-organization-editing-profile-questions-preview (plan 10)
    provides: the full run 175-10-close (232 passed in 110 projects), the baseline of this plan's full run
provides:
  - "the excludeTabs prop of EntityDetails: ReadonlyArray<EntityDetailsContent | ParentEntityDetailsContent>, default empty, filtering the configured tabs and falling back to info and opinions"
  - "the preview page's tag line (data-testid contestant-preview-tag), its note and its excluded tabs read from the descriptor, and its colour read through ensureColors"
  - "fixture steps on contestantPreviewPage: open, expectCardName, expectTagLine, expectNoTagLine, expectTabs, expectNoTab; the type PreviewTabName; TAB_LABELS exported by the entity-details fixture"
  - "contestantPreviewPage registered in the organization-editing composition root"
  - "one preview: and one holds: test of perm-organization-editing.spec.ts"
  - "component tests EntityDetails.svelte.test.ts (7 cases) and preview/page.svelte.test.ts (10 cases)"
  - "the gate rows 175-11-close (6 rows at 0) and the full run 175-11-close (234 passed in 110 projects)"
affects: [175-12, 175-13, 176, 179]

actuals:
  tokens: 12905 # chars/4 over the five commits' diff outside .planning/ (51621 chars)
  tasks: 3
  commits: 5 # MEASURED: git rev-list --count ff5a4bf92..fb461b71c, before this file's own commit
plan_head_before: ff5a4bf92ec00adc1d99f12f13833de7a577b326
plan_head_after: fb461b71c147742f0953774d299c46ad65069972

tech-stack:
  added: []
  patterns:
    - "A shared component leaves a part out for one caller through an additive, default-empty prop that filters what the setting configures; a caller that passes nothing renders what it rendered before"
    - "A page that provides an entity's own row to the data root passes its colour through ensureColors first, as the data provider does for public data"
    - "A fixture step that asserts an absence first waits for the thing the absent element would be rendered with"

key-files:
  created:
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte.test.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/preview/page.svelte.test.ts
  modified:
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.type.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/preview/+page.svelte
    - tests/tests/fixtures/contestant/contestantPreviewPage.fixture.ts
    - tests/tests/fixtures/contestant/perm-organization-editing.ts
    - tests/tests/fixtures/voter/entityDetails.fixture.ts
    - tests/tests/specs/perm/perm-organization-editing.spec.ts
    - tests/README.md

key-decisions:
  - "excludeTabs is typed ReadonlyArray, not Array: the descriptor's previewExcludeTabs is a readonly list and the component only reads the prop"
  - "The exclusion is applied only when the prop names a tab, after the inline fallback and before the labels are built; with nothing left the tabs are info and opinions"
  - "The preview page reads the descriptor from ctx.selectedEntity?.type, so the note is right in the server-rendered markup and before the entity's data is loaded"
  - "The preview fixture's steps wait for the card (TIMEOUTS.slowPage) before they read anything of it, so an absence is read off a loaded card"
  - "The settings page was not edited: its docstring already names no entity type"

patterns-established:
  - "contestantPreviewPage.open() then expectCardName: the opening of a test of the preview"

requirements-completed: []

coverage:
  - id: D1
    description: "EntityDetails leaves named tabs out of the configured list: two or more left render the tab bar, one renders none, none left falls back to info and opinions; without the prop it renders the setting's tabs in the setting's order"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "EntityDetails.svelte.test.ts (7 cases; 4 failed at bd8d0328d, 7 passed at 49644531e)"
        status: pass
      - kind: e2e
        ref: "perm-organization-editing › preview: (the info and opinions tabs in order, no children tab; red in 175-11-control, green in 175-11-precommit and 175-11-close)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The preview shows an organization the line that shows how it is marked beside its candidates, as the first element of the card, and a candidate no such line; the line is rendered with the card and not in the loading or the not-found view"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "preview/page.svelte.test.ts, 'the three views', 'an organization', 'a candidate' (8 cases; 4 failed at bd8d0328d)"
        status: pass
      - kind: e2e
        ref: "perm-organization-editing › preview: (the tag line with the seeded short name, before the details) and › holds: the candidate's preview shows its card and no tag line"
        status: pass
    human_judgment: false
  - id: D3
    description: "The entity's data reaches the data root with a colour that went through ensureColors, or with none"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "preview/page.svelte.test.ts, 'the colour the data root is given' (2 cases; 1 failed at bd8d0328d)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The preview's note, its excluded tabs and its tag line are descriptor members: the page holds no comparison of a type with a literal"
    requirement: GEN-01
    verification:
      - kind: other
        ref: "Task 2 verify: the negative search for a view-transition-name and for .type === 'candidate' / 'organization' in the page (exit 1, as required)"
        status: pass
    human_judgment: false
  - id: D5
    description: "What a voter sees of an entity is unchanged: no voter route passes the prop, and every voter project is at its plan-10 total"
    verification:
      - kind: other
        ref: "Task 2 verify: the negative search for excludeTabs under routes/(voters) (exit 1, as required)"
        status: pass
      - kind: e2e
        ref: "175-verdict.mjs e2e 175-11-close --same-projects-as 175-10-close … (109 projects equal to their plan-10 totals)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The gate rows and one full default E2E run on this plan's committed tree"
    verification:
      - kind: other
        ref: "175-verdict.mjs gates 175-11-close --rows typecheck,lint,unit,check-frontend,build,format (exit 0)"
        status: pass
      - kind: e2e
        ref: "175-verdict.mjs e2e 175-11-close --same-projects-as 175-10-close --except perm-organization-editing=+ … (exit 0; 234 passed, 110 projects compared, 0 not as expected)"
        status: pass
    human_judgment: false
  - id: D7
    description: "A long party name wraps in the card header and a long short name wraps in the tag line at 320px, in both themes; the adjusted colour as a person sees it in the avatar and on the tag's symbol"
    verification: []
    human_judgment: true

duration: 29min
completed: 2026-10-08
status: complete
---

# Phase 175 Plan 11: The Preview for an Organization, its Key Assertions Red First — Summary

**An organization now previews itself as an organization: the card offers the setting's tabs without `children` through one additive `excludeTabs` prop on `EntityDetails`, the card begins with a line that shows the party's symbol and short name as they appear beside its candidates, the note above the card is the party's, and the entity's stored colour passes `ensureColors` before the data root holds it. All three differences are read from the per-type descriptor; the page holds no branch on the entity's type, and the voter app passes no prop and renders as before. One new `preview:` E2E test was shown red on the uncommitted tree (1 failed on an expectation, 159 others passed), green on the uncommitted tree after the surface changed (160 passed), and committed only then; one new `holds:` test shows that a candidate's preview has no such line. The six gate rows are at 0 and the full run is 234 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run in 110 projects, every project at its total in `175-10-close` but the new one, at 12 against 10. Every verify command exits 0 as written. The adjusted colour is proven by a component case only: no test of this plan reads a colour in a browser.**

## Performance

- **Duration:** about 29 min (19:52Z → 20:21Z)
- **Tasks:** 3 of 3
- **Files:** 2 created, 8 modified (610 lines added, 15 removed)

## Commits

| # | Commit | Subject |
|---|---|---|
| 1 | `645a7a81e` | `test(175-11): fixture steps for the preview's tag line and tabs` (Task 1 step 2) |
| 2 | `bd8d0328d` | `test(175-11): the preview's tabs, tag line and colour read` (Task 2, red) |
| 3 | `49644531e` | `feat(175-11): the preview shows an organization its own tabs, its colour and how it is marked beside its candidates` (Task 2, green) |
| 4 | `125bd3a8b` | `test(175-11): an organization's preview shows its own tabs and its tag line` (Task 3 step 3, after the green verdict) |
| 5 | `fb461b71c` | `docs(175-11): the tests README names what the organization-editing spec asserts of the preview` |

Each was made by pathspec. The plan's base is `ff5a4bf92`; no other agent's commit sits between these five. The spec was uncommitted from Task 1's step 3 to commit 4 and was in no commit before it.

## Each task's verify command, with its real exit status

The three `<automated>` blocks were written to script files by a script that reads the plan file and asserts that each file equals its block. Evidence: `tests/e2e-runs/175-unit/175-11-t<N>-verify.sh` / `.log` / `.exit` / `.head`.

| Verify | Head | Exit | What it showed |
|---|---|---|---|
| **Task 1, as written** | `645a7a81e` (spec uncommitted) | **0** | `expectTagLine` and `expectNoTab` in the tracked fixture; the two fixture files without uncommitted changes; `typecheck:tests`; ESLint; the kept copy holds a `preview:` test; the spec holds none at the control's head; `control 175-11-control … --red "preview:"` PASS |
| **Task 2, as written** | `49644531e` (spec uncommitted) | **0** | the prop in the component and its type, and under no voter route; the page reads `ensureColors`, `entityDescriptorOf`, the tag's id and `excludeTabs`, and holds no `view-transition-name` and no comparison of a type with a literal; red head `bd8d0328d` before the component's commit `49644531e`; the red report holds failed and passed cases and the green none failed; frontend unit 181 files / 3133 tests passed; `check` 2141 files, 0 errors, 0 warnings; comment hygiene 0 |
| **Task 3, as written** | `fb461b71c` (clean tree) | **0** | the spec holds `preview:` at HEAD and no locator, soft assertion or axe builder; a clean tree outside `.planning/`; the spec holds no `preview:` test at the pre-commit run's head; `control 175-11-precommit … --green --were-red-in 175-11-control` PASS; `gates 175-11-close --rows …` PASS; `e2e 175-11-close …` PASS |

No verify stage had a defect, and no check was edited.

## The control, the green proof and the runs

All E2E runs were made in the background on AC power (100 %), each the first attempt under its label, with no void marker, one preflight success and no preflight failure each, no Svelte warning in any dev-server log, and no Sleep, Wake or DarkWake entry in `pmset -g log` after 19:37 local time; the runs were made between 22:53 and 23:17 local time.

| Label | Tree | Head | Result | Verdict |
|---|---|---|---|---|
| `175-11-control` | fixtures committed, the spec's two tests in the working tree, the preview unchanged | `645a7a81e` | wrapper exit **1**; 160 tests: **159 passed, 1 failed**, 0 flaky, 0 skipped, 0 did not run; Playwright 4.9 min; 19:53:48Z → 19:58:52Z; largest heartbeat lateness 51 ms | `control 175-11-control … --red "preview:"` **exit 0, PASS** (`175-11-control.verdict.txt`) |
| `175-11-precommit` | the component and the page as committed, the same spec still uncommitted | `49644531e` | wrapper exit **0**; **160 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run; Playwright 4.7 min; 88 projects; 20:02:29Z → 20:07:19Z; largest heartbeat lateness 45 ms | `control 175-11-precommit … --green --were-red-in 175-11-control` **exit 0, PASS** (`175-11-precommit.verdict.txt`): 12 of 12 in the project; the red title "was red, now passed" |
| `175-11-close` | committed, clean | `fb461b71c` | driver exit **0**; **234 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run; **110 projects**; Playwright 5.5 min; 20:10:56Z → 20:17:07Z; largest heartbeat lateness 153 ms; Docker VM 14.00 GiB free; the driver's own record holds no Sleep entry in the window | `e2e 175-11-close --same-projects-as 175-10-close --except perm-organization-editing=+ --expect-project …` (five projects) **exit 0, PASS** (`175-11-close.verdict.txt`) |

**The red test of the control**, with the first line of its error:

- `preview: a confirmed organization previews its own name, how it is marked beside its candidates, and its info and opinions tabs alone` — `Error: expect(locator).toBeVisible() failed`, on `getByTestId('contestant-preview-container').getByTestId('contestant-preview-tag')`, expected visible, element(s) not found after 5000 ms, in `contestantPreviewPage.expectTagLine`. Its state step, `open()` and `expectCardName` had passed: the card was loaded and named the organization.

**The `holds:` test** passed in the control, as a test of what already holds should: a candidate's preview has no tag line before and after this plan.

**The kept copy and the committed spec.** `tests/e2e-runs/175-e2e/175-11-control.spec.ts` is identical to the spec committed in `125bd3a8b` (`diff`, before the pre-commit run and again before the commit). No expectation changed between the control and the commit, so the red did not have to be made again.

**Gate rows `175-11-close`** — `tests/e2e-runs/175-gates/175-11-close`, head `fb461b71c`, driver exit 0, no Sleep entry in the window.

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 18 | |
| lint | 0 | 45 | `yarn lint:check`, every link |
| unit | 0 | 64 | frontend **181 files passed, 1 skipped; 3133 tests passed, 16 skipped** (3116 at `175-10-close`, +17: 7 component cases and 10 page cases); dev-seed 68 files / 1037 tests; app-shared 10 files / 148 tests |
| check-frontend | 0 | 9 | |
| build | 0 | 15 | |
| format | 0 | 18 | |

- `node 175-verdict.mjs gates 175-11-close --rows typecheck,lint,unit,check-frontend,build,format` → **exit 0, PASS** ("not stale: head fb461b71c is tree-equal to HEAD outside .planning/").
- `175-verdict.mjs scope` and `… hygiene` both exit 0 at `fb461b71c`.

**The full run against `175-10-close`:** 110 projects compared, 0 not as expected. 109 are equal to their plan-10 totals; `perm-organization-editing` is 12 against 10. The five named projects: `perm-organization-editing` 12/12, `contestant-journey` 1/1, `perm-answers-locked` 3/3, `contestant-a11y-scan` 22/22, `voter-journey` 2/2. 232 + 2 = 234.

**A candidate's preview and the voter app are unchanged.** `contestant-journey`, whose test opens the candidate's preview and reads its info and opinion answers, passed in the control, the pre-commit run and the full run with no line of its spec changed; `contestant-a11y-scan` holds its `cand-preview` entries at 22/22. Every voter project is at its plan-10 total, `voter-journey` 2/2, `voter-results-redraw` 5/5 and `a11y-smoke` 16/16 among them. The visual-regression project is not part of the default suite and was not run; it was not widened.

No run was void. One run was red: the control, as a control is, in the one test it names.

## What was built — every name

`ENTITY` is `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]`, `ED` is `apps/frontend/src/lib/dynamic-components/entityDetails`.

### `excludeTabs` on `EntityDetails`

`ED/EntityDetails.type.ts`:

```ts
import type { EntityDetailsContent, ParentEntityDetailsContent } from '@openvaa/app-shared';

export type EntityDetailsProps = SvelteHTMLElements['article'] & {
  entity: MaybeWrappedEntityVariant;
  /**
   * Tabs to leave out of the configured contents, e.g. `['children']` where the nomination graph is not loaded. When nothing is left, the `info` and `opinions` tabs are shown. @default []
   */
  excludeTabs?: ReadonlyArray<EntityDetailsContent | ParentEntityDetailsContent>;
};
```

`ED/EntityDetails.svelte` destructures `excludeTabs = []` and applies it in `contentTabs`, after the inline fallback for an empty setting and before the labels are built:

```ts
    if (excludeTabs.length) {
      tabs = tabs.filter((tab) => !excludeTabs.includes(tab));
      if (!tabs.length) tabs = ['info', 'opinions'];
    }
```

- **The fallback** is `['info', 'opinions']`, for every entity type, and only when the exclusion leaves nothing. It is not filtered again: excluding every configured tab, `info` and `opinions` among them, still shows those two.
- **One tab left** takes the component's existing branch: no `Tabs`, the header's bottom line, that tab's content.
- **The order** is the setting's. The shipped `['info', 'children', 'opinions']` without `children` is `info`, `opinions`.
- **Without the prop, or with an empty list,** nothing of the derivation changes: the block is skipped.
- `children`, `infoQuestions` and `opinionQuestions` read `contentTabs`, so an excluded `children` tab also means no lookup of child nominations.
- The `@component` docstring names the prop. Nothing else of the component changed; it gained no `view-transition-name`.

**Every caller of `EntityDetails`, and what each passes:**

| Caller | Passes |
|---|---|
| `ED/openEntityDrawer.svelte.ts` — the voter app's results drawer, through `drawerHost.open({ component: EntityDetails, props: () => ({ entity, class: 'min-h-full' }) })` | `entity`, `class`; **no `excludeTabs`** |
| `ENTITY/preview/+page.svelte` | `entity`, `excludeTabs={descriptor.previewExcludeTabs}`: `[]` for a candidate, `['children']` for an organization |

`git grep -n "excludeTabs" -- apps/frontend/src ':!*.test.ts'` prints the component, its type and the preview page, and nothing under `routes/(voters)`.

### The preview page (`ENTITY/preview/+page.svelte`)

- **The descriptor:** `const descriptor = $derived(entityDescriptorOf(ctx.selectedEntity?.type));` — read on the context, by page data, so it is right on the server and before the store holds the entity. While the selected entity is not known the candidate's descriptor is read: no tag line, no excluded tab, the candidate's note.
- **The colour read**, in `loadEntity`, inside its `try`:

  ```ts
      const dataRoot = ctx.dataRoot;
      const data = translateLocalizedEntity(result, locale);
      dataRoot.provideEntityData([data.color ? { ...data, color: ensureColors(data.color) } : data]);
      entity = dataRoot.getEntity(result.type, result.id);
  ```

  The form is the data provider's own (`UniversalDataProvider.ensureColors`). A stored colour reaches the data root as `{ normal, dark }` of hex colours adjusted for contrast, with `dark` derived from `normal` when none is stored; an entity with no colour is provided as it is. `ctx.dataRoot` is still read at that point of use, past the await, with no alias. The effect's one derived key, `loadedEntityKey`, is unchanged.
- **The markup of the success branch:**

  ```svelte
  <div data-testid="contestant-preview-container">
    {#if status === 'success' && entity}
      {#if descriptor.previewTagLine.shown}
        <div class="mx-lg mt-lg gap-sm flex flex-wrap items-center" data-testid="contestant-preview-tag">
          <span>{t(descriptor.previewTagLine.label)}</span>
          <EntityTag {entity} variant="short" />
        </div>
      {/if}
      <EntityDetails {entity} excludeTabs={descriptor.previewExcludeTabs} />
  ```

  The tag line is the first element inside `contestant-preview-container`, inside the card on `base-100`, above the `<EntityDetails>` article; it is in neither the loading nor the not-found branch. Its label is `contestantApp.preview.tagLabel`; `EntityTag` in its short variant shows the organization icon in `entity.color.normal` / `.dark` — the adjusted pair — beside `entity.shortName`, which the data model answers with the name when no short name is stored.
- **The note:** `{t(descriptor.previewTip)}` — `contestantApp.preview.tip.candidate` or `.organization`.
- **Test ids:** `contestant-preview-container` (unchanged) and `contestant-preview-tag` (new in the markup; registered in `testIds.contestant.preview.tag` by plan 175-05). No state attribute was added.
- **The docstring** says the page shows the entity the user edits a preview of its own profile and names the three descriptor-read differences; it names no entity type.
- The page holds no `{#if}` and no ternary on the entity's type, no comparison of a type with a literal, no destructured reactive accessor and no `view-transition-name`; no `+page.ts` or `+layout.ts` was added under the entity route.

### The fixtures' new steps (`tests/tests/fixtures/contestant/contestantPreviewPage.fixture.ts`)

| Step | What it does |
|---|---|
| `open()` | `goto` the entity-less preview route in `en`, then wait until the card — `entity-details` inside the preview container — is visible (`TIMEOUTS.slowPage`) |
| `expectCardName(name)` | `toHaveText` on the first `entity-card-title` of the card (`TIMEOUTS.page`); a string is the whole name |
| `expectTagLine(shortName)` | the card loaded; the tag line visible (`TIMEOUTS.page`) and containing `shortName`; and the tag line before the card's details in the document |
| `expectNoTagLine()` | the card loaded, then a count of 0 for the tag line |
| `expectTabs(names)` | the card loaded; exactly `names.length` tabs (`TIMEOUTS.page`), each with the accessible name of its keyword, in order |
| `expectNoTab(name)` | the card loaded, then a count of 0 for a tab of that name |

Exported type: `PreviewTabName` (`'info' | 'children' | 'opinions'`). Every id is read from `testIds`, every assertion is hard. The tab labels are `TAB_LABELS`, which `tests/tests/fixtures/voter/entityDetails.fixture.ts` now exports instead of keeping private. The fixture's four existing steps are unchanged. The composition root `fixtures/contestant/perm-organization-editing.ts` registers `contestantPreviewPage`.

### The spec's two tests

In a fourth top-level describe, `perm-organization-editing: the preview`:

| Session | Title | State step | What it asserts |
|---|---|---|---|
| confirmed organization | `preview: a confirmed organization previews its own name, how it is marked beside its candidates, and its info and opinions tabs alone` | `{ confirmed: true, name, shortName }` as seeded, `image: null` | the card's header names the organization in `en`; the tag line shows its `en` short name and comes before the details; the tabs are `info` then `opinions`; there is no `children` tab |
| unconfirmed candidate | `holds: the candidate's preview shows its card and no tag line` | `{ confirmed: false, firstName, lastName }` as seeded | the card's header names the candidate; no tag line |

The spec's header names the `preview:` prefix and says what `holds:` now covers.

## Task 2 — the cases that were red

**Red at `bd8d0328d`** (`175-11-preview-red.json`, exit 1): 17 cases over two files, **9 failed, 8 passed**, every failure an `AssertionError`; both files mounted.

- **`EntityDetails`** (7 cases, 4 failed) — the four of "with excludeTabs": the named tab left out of an organization's tabs in the setting's order; no tab bar and the one tab's content when one is left; `info` and `opinions` when every configured tab is excluded; the tabs of an empty setting filtered. The three of "without excludeTabs" passed, as controls: an organization's three tabs under the shipped setting in the setting's order, a candidate's tabs as the setting orders them, and the same tabs for an empty exclusion.
- **The preview page** (10 cases, 5 failed): the tag line as the first element of an organization's card, above its details; the details given `['children']`; the organization's note; the details of a candidate given an empty exclusion; the stored colour of too little contrast arriving changed with a dark colour beside it. The five that passed: the loading view with no tag line; the not-found sentence with no tag line; a candidate's card with no tag line; the candidate's note; an entity with no colour arriving with none.

**Green at `49644531e`** (`175-11-preview-green.json`, exit 0): 17 of 17.

The page's test mounts the real page, `SingleCardContent`, `Loading`, `ErrorMessage` and `EntityTag` against a real `DataRoot`; `EntityDetails` is replaced by a stand-in that records its props. The stand-in is a plain function called as Svelte calls a compiled component, with the anchor node and the props, as the stub of `openEntityDrawer.svelte.test.ts` is; it depends on that calling form.

## The code review checklist

Over the component, the page, the two component test files, the fixtures and the spec's two tests. Recorded before the pre-commit run; no finding needed a commit before it.

| Item | Outcome |
|---|---|
| Solves the issue | yes: an organization's preview no longer offers a `children` tab it cannot fill, shows its colour and abbreviation whether or not it has a logo, and paints its colour adjusted |
| OWASP top 10 | T-175-48: the entity's own row reaches the data root with a colour that passed `ensureColors`, so what `Avatar` and `EntityTag` write into a `style` attribute is a hex colour or nothing; a component case holds it. T-175-49: the prop defaults to empty, no voter route passes it, three "without the prop" cases, every voter project at its total. T-175-50: the data root is given the user's own row alone; the `children` tab is filtered out, not filled. T-175-64: the spec was uncommitted until the green verdict. No input path, no new request |
| Code style guide | `Array<T>` / `ReadonlyArray<T>`, explicit return types, TSDoc on the prop, the exported type and every fixture step |
| No `any` | none. Casts in tests only: `props as never` at `mount`, as the card's test does, and one cast of a spy's recorded argument |
| No repetition | the tab labels are one constant, exported by the entity-details fixture and read by the preview fixture. **Not fixed:** the expression that adjusts one object's colour is in `UniversalDataProvider.ensureColors` and in the preview page, as the plan writes it; sharing it means changing the provider every data read of the voter app goes through. The `matchMedia` stub is in thirteen component test files, one of them new |
| New entities documented | the prop in the type and in the `@component` block; the page's `@component` block; the fixture's header and steps; the spec's header |
| Repo markdown | `tests/README.md`: the spec's row and the fixture list (`fb461b71c`) |
| **Tracking events** | **None added.** The preview gains no function a user can perform: a line and a filtered tab list are displayed. `EntityDetails` still starts `entityDetails_changeTab` when a tab is chosen, for the tabs that are left |
| New Svelte components | none |
| Errors handled and logged | the colour read is inside `loadEntity`'s existing `try`, whose `catch` logs and shows the not-found sentence |
| Failing checks | none at the close. One commit holds failing unit files by the plan's own order (deviation 7) |
| Parts sharing the dependency | `EntityDetails` has two callers, listed above; the drawer passes no prop and the block that reads it is skipped. `TAB_LABELS` changed from private to exported and no other line of its fixture changed. The full run holds every other project at its total |
| WCAG A/AA, keyboard and screen reader | the tag line is text in the default colour on `base-100` and an icon that is `aria-hidden`; it is read as one phrase followed by the short name and adds no control. A tab that is left out is absent, not disabled. `contestant-a11y-scan` is 22/22 over the candidate's preview. **Not done:** an axe scan of an organization's preview, which is plan 175-12's entry 4, and a reading with a screen reader |
| Docs guides | the generated page of `EntityDetails` and of this route restate docstrings that changed; plan 175-13 regenerates them |
| Comment hygiene | every added or changed comment read; `yarn assert:comment-hygiene` exit 0 on the working tree before each of the five commits |
| Commit history | linear: test, test, feat, test, docs |
| No fixes of itself | none |
| Formatting in its own commit | none; the README's table was re-padded by Prettier in the commit that changed a cell |
| `[db]` tag | no database change |
| Backend, adapter and Edge Function sections | name nothing this plan touches |

**The components skill's re-check list:** no component was added, removed, renamed or moved. `EntityDetails` gained a prop with its docstring line and `.type.ts` entry. `generate:docs` is plan 175-13's. `.claude/skills/components/` was read and not edited: nothing in it counts the component's props or names this page.

## Each fallback's status

- **U-24** (the `children` tab left out by an additive prop that filters the setting's list). Built as ruled.
- **U-11** (the tag line as the first row inside the card). Built as ruled, at its recommended option, with the contract's markup. Under option (b) the same `<div>` moves into the `note` snippet and loses its inset; the descriptor member and the test id stay, and two cases of the page's test and the fixture's order assertion in `expectTagLine` change.
- **U-30** (the unconfirmed candidate as the third identity). Built as ruled; not exercised. This plan's removable part under the fallback is one block: the describe "as the unconfirmed candidate's editor" of the spec's fourth describe, with its one `holds:` test. "A candidate's preview shows no tag line" is then held by the page's component case alone. `expectNoTagLine` would lose its only caller.

## Deviations from Plan

**1. `excludeTabs` is typed `ReadonlyArray<…>`, where the UI contract writes `Array<…>`.** The descriptor's `previewExcludeTabs` is a `ReadonlyArray`, which a mutable array type refuses. The component only reads the prop, and every `Array` is still accepted.

**2. The preview fixture gained `open()`, which the plan's list does not name,** and the exported type `PreviewTabName`. A test has to reach the page, and the page shows a loading view, in the server-rendered markup too, until it has loaded the entity after hydration. `open()` and every new step wait for the card first, on `TIMEOUTS.slowPage`, as the profile fixture's `open()` does; the other waits are on `TIMEOUTS.page`.

**3. `tests/tests/fixtures/voter/entityDetails.fixture.ts` exports `TAB_LABELS`,** a file the plan does not list. The preview fixture needs the same labels for its two tab steps; the alternative was a second copy.

**4. `expectTagLine` also asserts that the line comes before the card's details in the document.** It is this plan's truth about the line's placement, and the E2E is where the real `EntityDetails` is beside it.

**5. `ENTITY/settings/+page.svelte` was not edited,** although the plan lists it. Its docstring reads "Shows the settings of the signed-in user." since plan 175-10 and names no entity type.

**6. A fifth commit, `fb461b71c`,** for `tests/README.md`, a file the plan does not list: it describes the spec and was committed after it.

**7. One commit holds failing unit files: `bd8d0328d`,** the red commit of Task 2, as the plan orders it. At that commit the frontend's unit suite fails in the two new files and `yarn workspace @openvaa/frontend check` exits 0. No E2E test was committed red.

**8. The green report was taken on the commit that holds the code,** after the commit; the two files and the whole frontend suite had passed on the working tree first.

**9. Seven cases for `EntityDetails` and ten for the page,** where the plan's behaviours count five and four. The two more of the component are "a candidate's tabs as the setting orders them" and "an empty exclusion"; the page's are one case for each thing the plan joins in a sentence.

**10. One existing comment of the page was corrected:** it named the function `loadCandidate`, which is `loadEntity`.

**Not recorded in `.planning/WINDOWS.md`:** there is no stub and no skipped test; the ledger is a shared planning file, as plans 01 to 10 left it.

## What was not done or not verified

- **No colour was read in a browser.** That the avatar's initials and the tag's symbol take the adjusted colour is held by the page's component case, which reads what the data root is given, and by a reading of `Avatar` and `EntityTag`. Plan 175-12's scan entry 4 is the browser proof.
- **The preview of a party with a logo was not seen in a browser.** The `preview:` test sets no logo. That the tag line shows the short name and the colour beside a logo is plan 175-12's test of organization B.
- **The loading and the not-found view were not produced in a browser.** Two component cases hold them.
- **The plan's backstop is open:** a long party name in the card header and a long short name in the tag line at 320px, in both themes, were not looked at. The tag line's row wraps between the label and the tag; a short name with no space in it does not break inside the tag.
- **No axe scan of an organization's preview, no measurement at 320 or 390 px, no reading in the six other locales:** plan 175-12's.
- **The visual-regression project was not run:** it is outside the default suite. A candidate's preview is asserted unchanged by `contestant-journey`, by the candidate entries of `contestant-a11y-scan` and by the page's component cases, not by a screenshot.
- **The U-11 and U-30 fallbacks were not exercised.**
- **No isolated determinism batch** of the spec was made; D-22's three isolated runs are plan 175-13's. The new project ran three times in this plan: once with the `preview:` test red by design, twice green.
- **`GEN-01` is not marked complete by this plan:** the confirmation sequence and the voter-side reads are plan 175-12's. `requirements-completed` is empty on purpose.

## What the next plans should know

**The dataset after this plan's two tests have run** (until its teardown), beside what the summaries of plans 175-09 and 175-10 list: organization A is confirmed with its seeded names and **no logo** (the `preview:` test writes `image: null`); its colour is whatever the test before left — `{ normal: '#2546a8' }` after the profile test — because the `preview:` test neither reads nor writes it. The candidate is unconfirmed with its seeded names again.

**175-12 (E2E).** Which states a scan or a test can reach, and through which step:

| State | Reached by | Reach marker |
|---|---|---|
| Organization preview, with the tag line | `setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, { color: { normal: '#ffe600' }, image: null })`, then `contestantPreviewPage.open()` under A's session | `contestant-preview-tag`: rendered for an organization alone, and only once the card has loaded |
| Organization preview of a party with a logo | organization B after its profile test, or after `contestantProfilePage.uploadLogo(…)` and a save; then `contestantPreviewPage.open()` under B's session | the same |
| Candidate preview | `contestantPreviewPage.open()` under the candidate's session | `entity-details` inside `contestant-preview-container`; there is no tag line |
| The neutral questions page | `contestantNoQuestionsPage.open(UNCONFIRMED_CANDIDATE_GRANT)` | `contestant-questions-none` |
| Organization profile: editable, locked by confirmation, locked by answers | the state steps, then `contestantProfilePage.open()` and `expectIdentity(…)` | `contestant-profile-identity` with its `data-name-state`; `profile-name` exists for an organization alone |

- `expectCardName(name)` and `expectTagLine(shortName)` are the two steps plan 175-12's test of organization B names. `expectCardName` takes the whole name as a string or a pattern; for B it is the name in the displayed locale, `en`. `expectTagLine` reads `toContainText`, and the line also holds its English lead-in.
- **A party with no short name shows its name in the tag line:** the data model answers `shortName` with the name when none is stored. The same holds for the avatar's initials, which abbreviate the name when the short name is longer than six characters.
- **The preview reads the entity's own row, not what voters see.** An unconfirmed organization previews itself in full.
- The colour reaches the page's data root adjusted: `#ffe600` stored is not `#ffe600` painted. A scan that needs "a colour that fails unadjusted" stores it with the state step; the profile page's swatch shows the colour as chosen and the preview the adjusted one.
- In the dark theme `EntityTag` paints `color.dark`, which `ensureColors` derives from `normal` when none is stored.
- `expectTabs` and `expectNoTab` read the tab bar. A preview with one tab left has no tab bar: `expectTabs([])` holds there, and the content is the one tab's.
- The existing `expectPortraitVisible()` waits for an `<img>`, which a card without an image does not have; `open()` is the wait for a card with initials.
- The composition root registers `contestantPreviewPage`.

**175-13 (docs and close).**
- Docstrings that changed: `EntityDetails` (the `excludeTabs` property) and the preview route's `@component` block. Their generated pages are stale until `generate:docs`.
- The developers' guide can say that the Contestant app's preview provides the entity's own row to the data root, adjusts its colour as the provider does, and leaves the `children` tab out because the nomination graph is not loaded there.
- The expression that adjusts one object's colour is in two places (the checklist's unfixed item).
- The `matchMedia` stub is repeated in thirteen component test files.
- The backstop above — a long name and a long short name at 320px — is one of the reads the UI contract leaves to a person.

**Phase 176 and later.** `excludeTabs` is the way to leave a tab out of `EntityDetails` for one caller. If the Contestant app comes to load an organization's nominations into its data root, the descriptor's `previewExcludeTabs` for an organization is the one value to empty; the page and the component need no change.

**Orchestrator.** Nothing in `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` or `CLAUDE.md` was edited; `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted; nothing under `.planning/phases/176-*` was touched — four untracked files of the planning agent are there at the close. Open for a ruling: whether the prop's `ReadonlyArray` type stands against the contract's `Array` (deviation 1), and whether the colour expression should be shared with the provider.

## The state the local database is left in

Unchanged in kind from plan 175-10's close. No reset was run and no schema file changed. Read with `psql` after the full run:

- Schema: the tree's. pgTAP's helpers are still in `public`, so `yarn db:types` is valid only after another reset.
- Data: `seed.sql` plus the `default` dataset in the default project (1 election, 328 candidates, 8 organizations), which the gate's `unit` row writes again.
- The E2E project `…00e2` exists and holds no election, candidate or organization: every teardown of the three runs passed. The empty project `…05c1` exists.
- Auth users: 2, those of `seed.sql`.
- The Supabase stack and Docker were never restarted. `docker builder prune -af` ran once, inside the E2E driver; the two wrapper runs were made without it. The Docker VM has 14.00 GiB free.

## Files touched that the plan did not list

- `tests/tests/fixtures/voter/entityDetails.fixture.ts` (deviation 3)
- `tests/README.md` (deviation 6)

Listed by the plan and not touched: `ENTITY/settings/+page.svelte` (deviation 5).

Gitignored evidence: under `tests/e2e-runs/175-e2e/`, `175-11-control` with `175-11-control.spec.ts`, `.log`, `.exit`, `.launched`, `.evidence.log` and `.verdict.txt`; `175-11-precommit` with its `.log`, `.exit`, `.launched`, `.evidence.log` and `.verdict.txt`; `175-11-close` with its `.log`, `.exit`, `.launched` and `.verdict.txt`. Under `tests/e2e-runs/175-gates/`, `175-11-close` with its `.log`, `.exit`, `.launched`, `.verdict.txt`, `.scope.txt` and `.hygiene.txt`. Under `tests/e2e-runs/175-unit/`, `175-11-preview-red` and `-preview-green`, each with `.json`, `.log`, `.exit` and `.head`; `175-11-t1-verify.*`, `-t2-verify.*`, `-t3-verify.*`; and the logs of the checks run before each commit.

## Known Stubs

None.

## Threat Flags

None. The plan's register covers what was added: a stored colour painted unadjusted or unparsed (T-175-48), a prop on the voter's entity detail (T-175-49), the nomination graph loaded to fill a tab (T-175-50) and a red test committed into the serial chain (T-175-64). No file of this plan adds a network endpoint, an auth path, a file access or a schema change.

## Self-Check: PASSED

Checked after writing:

- The two created files exist; `git diff --name-status ff5a4bf92 fb461b71c -- . ':(exclude).planning'` lists 10 paths: the two added and the eight modified named above.
- The five commits of the table are ancestors of `HEAD`; `git rev-list --count ff5a4bf92..fb461b71c` is 5.
- `175-11-t1-verify.exit`, `-t2-verify.exit` and `-t3-verify.exit` hold 0, at heads `645a7a81e`, `49644531e` and `fb461b71c`; each script is byte-identical to its block of the plan.
- `tests/e2e-runs/175-e2e/175-11-control.exit` holds 1, `175-11-precommit.exit` and `175-11-close.exit` hold 0, and `tests/e2e-runs/175-gates/175-11-close.exit` holds 0; the four verdict files end in PASS; no run directory holds a void marker.
- The two unit reports and their `.head` files exist under `tests/e2e-runs/175-unit/`, with exits 1 and 0; the case counts in this file were read from them and from the runs' own output.
- The kept copy of the spec is identical to the committed spec.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` are unchanged since `ff5a4bf92`.
