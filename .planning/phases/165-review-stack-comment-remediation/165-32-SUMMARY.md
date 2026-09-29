---
phase: 165-review-stack-comment-remediation
plan: 32
subsystem: frontend
tags: [tailwind, style-inlining, components, question-choices, comment-hygiene, e2e]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-31 style-inlining method and tailwind-classes-present.mjs; 165-01 instruments (hygiene gate, read log, assert-absent, code-identity, e2e-verdict, ledger-check)
provides:
  - QuestionChoices constants UNPICKED_RADIO / UNPICKED_CHECKBOX = cn(UNPICKED_RADIO, 'rounded-sm'), with no narrative and no adjacent-line link (C-4106666404, C-4106671920, C-4106679567)
  - QuestionChoices, NumberScaleInput and QuestionOpenAnswer with no <style> block
  - ScoreGauge and Video reduced to the CSS rules that need it, each with a one-line reason (this plan's share of C-4106826598 / D-10)
  - number-scale-voter-marker / number-scale-entity-marker test ids, used by the entityDetails fixture in place of raw class locators
affects: [165-33, 165-35, 165-36]

tech-stack:
  added: []
  patterns:
    - "Orientation-dependent grid layout as $derived cn(...) class strings (fieldsetClass, labelClass, displayLabelClass) in place of .vertical-scoped rules"
    - "A state that is a pseudo-class combination on an element (disabled, not checked) as disabled:not-checked: variants applied from a predicate, in place of a hook class plus a scoped rule"
    - "Theme-dependent custom properties as arbitrary properties with dark: and lg: variants ([--progress-color:...], lg:[--size:...])"
    - "A style hook that a test reads is replaced by a data-testid registered in testIds.ts, never kept as a class"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-32.tsv
  modified:
    - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
    - apps/frontend/src/lib/components/questions/QuestionChoices.svelte.test.ts
    - apps/frontend/src/lib/components/questions/NumberScaleInput.svelte
    - apps/frontend/src/lib/components/questions/QuestionOpenAnswer.svelte
    - apps/frontend/src/lib/components/scoreGauge/ScoreGauge.svelte
    - apps/frontend/src/lib/components/video/Video.svelte
    - tests/tests/utils/testIds.ts
    - tests/tests/fixtures/voter/entityDetails.fixture.ts
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md

key-decisions:
  - "Rendering parity wins over dead class tokens: the display labels (QuestionChoices) and markers (NumberScaleInput) carried text-primary, but the scoped rule always overrode it with text-secondary, so the measured colour was #666. The inlined classes keep text-secondary and drop the dead text-primary; restoring the voter's label to primary is a one-token design change left to the maintainer"
  - "QuestionChoices' vertical grid-template-columns: fr fr auto was invalid CSS and computed to none; it is not reproduced (no grid-cols-[fr_fr_auto])"
  - "The entity's-answer ring is a single shadow-[inset_0_0_0_4px_var(--color-base-100)] rather than the old doubled identical inset shadow; the rendering is identical"
  - "The entitySelected, vertical, collapsible, expanded, marker, vaa-score-gauge and progress-color hook classes are removed; marker had an E2E consumer, which now reads data-testids"

requirements-completed: [165-SC2, 165-SC3, 165-SC4, C-4106666404, C-4106671920, C-4106679567]

actuals:
  tokens: 16466
  tasks: 3
  commits: 10
plan_head_before: 0092d7837bfbe21eaa0481d169ec25840dd365bd
plan_head_after: 3dbc4199f

duration: 50min
completed: 2026-09-28
status: complete
---

# Phase 165 Plan 32: Style-Block Inlining, Part 2 (QuestionChoices, Question Inputs, ScoreGauge, Video) Summary

**QuestionChoices' unpicked constants are `UNPICKED_RADIO` and `UNPICKED_CHECKBOX = cn(UNPICKED_RADIO, 'rounded-sm')`, with no narrative. QuestionChoices, NumberScaleInput and QuestionOpenAnswer have no `<style>` block. ScoreGauge and Video keep only the rules that need CSS, each with a reason line. A Playwright before/after comparison found identical computed styles and boxes. E2E is GREEN at 165/0/0/0.**

## Performance

- **Duration:** about 50 min
- **Started:** 2026-09-28T06:35:16Z
- **Completed:** 2026-09-28T07:25:33Z
- **Tasks:** 3 of 3
- **Files modified:** 6 components and their unit test, 2 E2E support files, the read log and the ledger

## Accomplishments

- **QuestionChoices, the three #880 threads.**
  - The constants are `UNPICKED_RADIO` and `UNPICKED_CHECKBOX`.
  - `UNPICKED_CHECKBOX` is `cn(UNPICKED_RADIO, 'rounded-sm')`.
  - Each docblock says only what the constant draws. The "This used to be…" paragraph, the `{@link}` to the line above and the "no longer here" style comment are gone.
- **QuestionChoices, the style block.**
  - The grid placement for each orientation is composed with `cn` into `fieldsetClass`, `labelClass` and `displayLabelClass`.
  - The entity's answer, when the voter picked something else, is `ENTITY_PICKED`: `disabled:not-checked:` variants applied from a predicate. It replaces the `entitySelected` hook class and its scoped rule.
  - The unit test asserts the `ENTITY_PICKED` tokens in place of the hook class.
- **NumberScaleInput.**
  - The range inputs carry `h-[2.75rem] cursor-pointer disabled:cursor-default`. The 44 px touch-target reason sits on the `RANGE_CLASS` constant (T-165-53).
  - The markers carry their classes directly.
- **QuestionOpenAnswer.** `transition-all`, the collapsed gradient and the expanded `max-h-(--full-height)` are composed with `cn` from `collapsible` and `expanded`.
- **ScoreGauge.** The custom properties and colours moved onto the elements as arbitrary properties with `dark:` and `lg:` variants. Three rules stay as CSS (see Kept CSS).
- **Video.** Its eight `:global` rules stay. Each caption rule, and the transcript group, has a one-line reason.
- **Comment hygiene.** In the five components, `testIds.ts` and the fixture: planning ids, narrative and stale prop docs were fixed in two comment-only commits. `code-identity.mjs` confirms that neither commit changes code.

## Task Commits

1. **Task 1: QuestionChoices (tracer)**
   - `ea0f7d937` (refactor): rename, `cn`, docblocks, with the three `Review-Comment:` trailers.
   - `df30baed5` (style): style block inlined.
   - Tracer gate: `assert-absent`, the `cn` grep, `assert-absent '<style'`, build, class checker (0 missing), `check` (0/0) and the before/after comparison all passed before expanding.
2. **Task 2: NumberScaleInput and QuestionOpenAnswer.** `387396c7a` (style).
3. **Task 3: ScoreGauge, Video, hygiene and E2E**
   - `874e0322c` (style)
   - `c51d24cfd` (docs, `Hygiene: D-04`)
   - `65735dbc4` (chore, read log)
   - `7c605e9fb` (fix, E2E root cause, see Deviations)
   - `0d630c4fb` (docs, `Hygiene: D-04`)
   - `ce0c05f80` (chore, read log)
   - `3dbc4199f` (docs, ledger rows)

## Kept CSS

| Component | Rule | Reason (as written in the file) |
|---|---|---|
| ScoreGauge | `progress::-moz-progress-bar { background: var(--progress-color) }` | Firefox's progress-bar fill, a vendor pseudo-element with no utility form. |
| ScoreGauge | `progress::-webkit-progress-value { background: var(--progress-color) }` | Chrome's and Safari's progress-bar fill, a vendor pseudo-element with no utility form. |
| ScoreGauge | `.radial-progress:before { background: radial-gradient(…), conic-gradient(…), var(--color-base-300) }` | DaisyUI's radial-progress gradient with a base-300 layer added, which draws the full circle behind the value. |
| Video | `:global(video::cue)` | Caption text: `::cue` is a browser-generated pseudo-element, which takes no class. |
| Video | `:global(video::-webkit-media-text-track-display)` | Padding and corners of WebKit's generated caption box. |
| Video | `:global(video::-webkit-media-text-track-container)` | Lifts WebKit's generated caption container above the controls; `translate` works in both Chrome and Safari, where `bottom` has no effect in Safari. |
| Video | `:global(.video-transcript img)`, `figure img`, `figure`, `figcaption`, `h1`–`h4` (5 rules) | The transcript is injected HTML, which takes no class, so its images, figures and headings are styled here. |

QuestionChoices, NumberScaleInput and QuestionOpenAnswer keep no CSS: `assert-absent.sh '<style'` exits 0 over all three.

## Before/after rendering check

**Method.**
- **Server and data.** A dev server for this checkout ran on port 5299 against the default project, seeded with the `e2e/base` template. Two open answers were added to the seeded candidates' answer JSON, one long enough to collapse and one short.
- **Capture.** The server was restarted before every capture, so HMR could not serve stale modules. A Playwright script (Chromium, 1400×900, reduced motion) walked the voter journey with the E2E fixtures. On every element under these roots it recorded 64 computed properties, the same properties on `::before`, and the bounding box:
  - `question-choices`, `voter-questions-input`, `number-scale-input`, `entity-opinion-open-answer`, `score-gauge` and `question-choice-helper`.
- **States covered:**
  - The entity-details opinions tab, before and after expanding the open answers.
  - The default details tab with the radial score gauges.
  - All 12 answered opinion question pages: Likert 5/4/7, categorical, boolean, number, both multi-choice and the filtered ones.
  - Each state in light and in dark colour scheme.
- **Below `lg`.** A second pass at 900 px width compared the plan-start versions of the five components, swapped in temporarily, with HEAD. There the radial gauge is `--size: 2.1rem`.

**Result.** At both widths and in both schemes, every property and every bounding box is identical, with one exception. The entity's-answer input's `box-shadow` changed from `inset 4px ring ×2` to Tailwind's four transparent zero-size composition slots plus one `inset 4px ring`. That is the same visible ring. The comparison found no other difference, including the open answer's collapsed gradient, its expanded `max-height`, the range `cursor` and height, and the marker positions.

**Compiled-CSS reads.**
- `dark:` compiles to `@media (prefers-color-scheme: dark)`. `app.css` defines no custom `dark` variant, so this matches the removed media query.
- `lg:` compiles to `@media (min-width: 64rem)`, which is the old `1024px`.

**Not rendered in the app.** The linear ScoreGauge variant, since `SubMatches` only uses `radial`, and Video, since the base data has no video. The linear `progress` element's colour is `text-(--progress-color)`, which compiles to `color: var(--progress-color)`. It beats daisyUI's `.progress` colour, which sits in a `daisyui.l1.l2.l3` sublayer of `utilities`. Video's rules are unchanged apart from their comments.

## Gates

Each status was read directly, not through a pipe (final run on the tip).

| Command | Exit |
|---|---|
| `bash scripts/assert-absent.sh 'UNPICKED_DOT\|used to be\|no longer here\|\{@link UNPICKED' -- QuestionChoices.svelte` | 0 |
| `grep -q "UNPICKED_CHECKBOX = cn(UNPICKED_RADIO" QuestionChoices.svelte` | 0 |
| `bash scripts/assert-absent.sh '<style' -- QuestionChoices, NumberScaleInput, QuestionOpenAnswer` | 0 |
| `yarn workspace @openvaa/frontend build` | 0 |
| `node scripts/tailwind-classes-present.mjs --from-diff ship/v2.15-12-planning` | 0 — 101 classes, 0 missing |
| the same, plus the classes built in string constants passed explicitly | 0 — 115 classes, 0 missing |
| `yarn workspace @openvaa/frontend check` | 0 — 0 errors, 0 warnings |
| `yarn workspace @openvaa/frontend test:unit` | 0 — 108 files, 1888/1888 (QuestionChoices 6/6) |
| `TURBO_FORCE=true yarn lint:check` | 0 |
| `node scripts/code-identity.mjs HEAD WORKTREE <files>` before each comment-only commit | 0 — code-identical |
| `bash scripts/hygiene-changed-files.sh --check-reads --files <222 committed branch files, .planning/ dropped>` | 0 — `VERDICT: CLEAN`, unread=0 |
| `bash scripts/tip-proofs.sh` | 0 |
| `bash scripts/ledger-check.sh` | 0 — `VERDICT: PASSED` |
| `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-32-r2 --no-db-reset` | 0 |
| `node scripts/e2e-verdict.mjs "$(ls -d tests/e2e-runs/165-32* \| sort \| tail -1)"` | 0 — `VERDICT: GREEN (expected 165 >= 165, 0 failed, 0 flaky, 0 did-not-run)` |

**E2E verdict:** GREEN 165/0/0/0, `tests/e2e-runs/165-32-r2`. The first run, `tests/e2e-runs/165-32`, was RED (1 failed, 87 did not run) and is kept on disk. Its root cause is under Deviations.

## Review-comment dispositions

| Comment | Disposition | Owner | Evidence | Commit | Draft reply |
|---|---|---|---|---|---|
| C-4106666404 (#880, kaljarv, `QuestionChoices.svelte:97`) | fix | 165-32 | `assert-absent` for the old name, "used to be", "no longer here" and `{@link UNPICKED` exits 0. The style-block narrative went with the block. | ea0f7d937, df30baed5, c51d24cfd | Removed in ea0f7d937: the docblocks now say only what each constant draws, and the style block that carried the other narrative comment is gone (df30baed5). |
| C-4106671920 (#880, kaljarv, `QuestionChoices.svelte:101`) | fix | 165-32 | `grep -q 'UNPICKED_CHECKBOX = cn(UNPICKED_RADIO'` exits 0, and no `{@link` points at the neighbouring constant. | ea0f7d937 | Done in ea0f7d937: `UNPICKED_CHECKBOX = cn(UNPICKED_RADIO, 'rounded-sm')`, and its docblock no longer links to the line above. |
| C-4106679567 (#880, kaljarv, `QuestionChoices.svelte:99`) | fix | 165-32 | `git grep UNPICKED_DOT` finds nothing. Unit tests 6/6. E2E GREEN 165/0/0/0. | ea0f7d937 | Renamed to `UNPICKED_RADIO` and `UNPICKED_CHECKBOX` in ea0f7d937. |
| C-4106826598 (#880, kaljarv, frontend share, part 2) | fix (contribution) | 165-33 owns the row | QuestionChoices, NumberScaleInput and QuestionOpenAnswer have no `<style>` block. ScoreGauge and Video keep only the rules listed under Kept CSS. | df30baed5, 387396c7a, 874e0322c, 7c605e9fb | Left to 165-33 for its repo-wide reply. For this part: the question inputs are all Tailwind classes, and ScoreGauge and Video keep only vendor pseudo-elements, a DaisyUI internal and injected-markup rules, each with a reason. |

The three QuestionChoices ledger rows are filled. The C-4106826598 row belongs to 165-33 and stays `pending`.

## For the end-of-phase visual check

Compare with `ship/v2.15-12-planning`, in light and dark mode:
- A voter question page with choices in both orientations, a number-scale question, and a multi-choice question.
- An entity's opinions tab: the display-mode dots, the entity ring, the number markers, and a long open answer both collapsed and expanded.
- The radial score gauges in the entity details, above and below 1024 px.
- A question with a video and transcript.

## Decisions Made

See `key-decisions` in the frontmatter. One of them needs the maintainer. The display labels ("Your answer", the candidate's label) and number markers were always rendered in `text-secondary`: the scoped rule overrode their `text-primary`, measured at `rgb(102, 102, 102)`. Parity keeps them secondary. If the voter's label was meant to be primary, adding `text-primary` to the voter branch restores it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The E2E fixture selected NumberScaleInput's markers by the style hook class**
- **Found during:** Task 3, first full E2E run (`tests/e2e-runs/165-32`: 77 passed, 1 failed, 87 did not run).
- **Issue:**
  - `entityDetails.fixture.ts` `expectNumberQuestionDisplay` read the markers with `container.locator('.marker')`, and the voter's marker with `.marker.text-primary`. It needed lint exemptions to do so.
  - Task 2 removed `.marker` together with its scoped rule. The voter-journey step found 0 markers, and the 87 tests downstream of it did not run.
  - The consumer grep before Task 2 missed this reference.
- **Fix:**
  - The voter marker (also the combined one when both answers are equal) carries `data-testid="number-scale-voter-marker"`, and the entity marker `number-scale-entity-marker`.
  - Both are registered in `testIds.ts`.
  - The fixture reads them with `getByTestId`, and its two lint exemptions are gone.
  - Re-run: GREEN 165/0/0/0.
- **Files modified:** NumberScaleInput.svelte, tests/tests/utils/testIds.ts, tests/tests/fixtures/voter/entityDetails.fixture.ts
- **Commit:** 7c605e9fb

**2. [Rule 2 - Hygiene] Pre-existing comment residue in files this plan changed**
- **Found during:** Task 3
- **Issue:**
  - QuestionChoices:
    - a planning id (`260524-l1t D6`) and stale spec names in the test-id marker comment;
    - a prop list documenting a non-existent `name` prop;
    - a reflow-flattened event-order list;
    - "Radio and boolean modes are untouched below".
  - ScoreGauge documented `colors`, `colorDark` and a `'linear'` default, none of which match the code.
  - QuestionOpenAnswer documented `<Expander>` props.
  - NumberScaleInput did not document `onChange`.
  - Video referenced "the audit grep", ended a comment with "uh", named `reload` for `load`, and had several grammar errors.
  - `testIds.ts` carried planning ids (`157-10`, `EFLOW-10b`, `EQTYP`, `Plan 07`, `CR-01`; the gate flagged two of them) and notes about removed entries.
- **Fix:** Two comment-only commits. `code-identity.mjs` confirms that neither changes code.
- **Commits:** c51d24cfd, 0d630c4fb

**3. [Rule 3 - Blocking] Scratch capture scripts inside `tests/` failed `lint:check`**
- **Found during:** Task 3
- **Issue:** The before/after capture scripts were first placed under `tests/.tmp-165-32/`, where the tests ESLint config reported 13 errors.
- **Fix:** Moved them to the session scratchpad with absolute imports. They were never committed, and `lint:check` exits 0.

The plan's literal `hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads` would include the maintainer's uncommitted `MainContent.svelte` and `.planning/milestone.lock`. Per the orchestrator notes, the gate ran over the committed branch set (`ship/v2.15-12-planning...HEAD`) through `--files`, with `.planning/` paths dropped because `--files` rejects them. They are exempt anyway.

`hygiene-allow/165-32.tsv` is listed in `files_modified`, but no allowlist row was needed, so the file was not created.

## Issues Encountered

- **Local database residue in the default project (maintainer action needed).** The before/after check seeded the `e2e/base` template into the default project `…0001`. The `test-e2e-base-` rows are torn down: `yarn db:seed:teardown --prefix test-e2e-base-` deleted 142 rows and 30 storage objects, and the project has 0 elections and 0 questions.
  - That project's `app_settings.settings` still holds the `e2e/base` settings the seed merged in. Resetting the row to seed.sql's `{}` was blocked by the permission classifier, so it is left for the maintainer: `update app_settings set settings='{}'::jsonb where project_id='00000000-0000-0000-0000-000000000001';`, or any `yarn db:reset` when no run is in flight.
  - The E2E project is scoped separately (teardown filters on `project_id`), so the suite is unaffected.
- Running eslint from the repo root does not load the tests config ("Definition for rule 'playwright/no-restricted-locators' was not found"). `yarn lint:check` covers it and exits 0.

## Known Stubs

None.

## Threat Flags

None. T-165-53 is mitigated: the 44 px range touch target is kept with its reason, every class compiles, and the a11y scans in the full E2E suite are green.

## Next Phase Readiness

- 165-33 can count QuestionChoices, NumberScaleInput, QuestionOpenAnswer, ScoreGauge and Video as done for C-4106826598.
- Before removing a hook class, grep `tests/` for the class name as a plain string (for example `'.marker'`) as well as with word boundaries. That is the check that would have caught deviation 1.

## Self-Check: PASSED

- All eight modified source and test files, `hygiene-reads/165-32.tsv` and this SUMMARY exist on disk.
- Commits `ea0f7d937`, `df30baed5`, `387396c7a`, `874e0322c`, `c51d24cfd`, `65735dbc4`, `7c605e9fb`, `0d630c4fb`, `ce0c05f80` and `3dbc4199f` are reachable from HEAD.
- `MainContent.svelte` still shows only the maintainer's unstaged modification. No commit of this plan touches it or `.planning/milestone.lock`.
