---
phase: 158-routing-auth-surface-harmonisation
plan: 04
subsystem: ui
tags: [svelte5, runes, playwright, testids, vitest, characterisation-test, static-settings]

# Dependency graph
requires:
  - phase: 158-routing-auth-surface-harmonisation
    provides: "Plan 01's routes locus move ($lib/utils/route -> $lib/routes); this plan imports no route helper directly but shares the phase's test surface"
provides:
  - "candidateHome.helpers.ts — two pure functions (computeNextAction, computeBadges) with an empty runtime module graph"
  - "A colocated table-driven characterisation test pinning all three candidate-home states, including the label no E2E spec can see"
  - "A candidate home component that computes nothing inline: every template conditional reads a precomputed value"
  - "A profile page with no element that exists solely to be selected by a test"
  - "Theme-colour meta tags bound directly to required settings, so a missing colour is a typecheck error"
  - "A document title that always identifies the application, with maintenance as a suffix"
affects: [settings-merge, candidate-app, e2e-testids, a11y-scan]

actuals:
  tokens: 21000
  tasks: 4
  commits: 3

tech-stack:
  added: []
  patterns:
    - "<Component>.helpers.ts + colocated .helpers.test.ts for logic lifted out of a $derived.by"
    - "Shared component testids addressed by chaining inside the owning instance's container testid, rather than adding a wrapper element"

key-files:
  created:
    - "apps/frontend/src/routes/candidate/(protected)/candidateHome.helpers.ts"
    - "apps/frontend/src/routes/candidate/(protected)/candidateHome.helpers.test.ts"
    - ".planning/phases/158-routing-auth-surface-harmonisation/deferred-items.md"
  modified:
    - "apps/frontend/src/routes/candidate/(protected)/+page.svelte"
    - "apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte"
    - "apps/frontend/src/routes/+layout.svelte"
    - "tests/tests/utils/testIds.ts"
    - "tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts"
    - "tests/tests/specs/a11y/candidate-a11y.spec.ts"

key-decisions:
  - "Task 3 answered drop-chaining: both theme-colour fallbacks AND all three levels of optional chaining removed, because the palette entries are required in the settings type"
  - "Badge counts render as STRING for both badges; the two guards being replaced disagreed and the badge component accepts either"
  - "Reused the existing shared.inputError registry entry instead of adding a profile-scoped one — the research's premise that input-error had zero consumers was stale"
  - "The reviewer's requested title markup does not compile in Svelte 5; the same semantics were delivered as a $derived template literal"
  - "The app_settings maintenance-flag defect found while measuring was logged as deferred, not fixed — out of this plan's scope"

patterns-established:
  - "Characterisation test written and executed BEFORE the refactor, with a negative control proving it reddens"
  - "A selector negative control (point the child testid at a nonexistent id, confirm the specs FAIL) as the standard proof that a chained locator is not vacuous"

requirements-completed: [REVIEW-RT-06, REVIEW-RT-07]

coverage:
  - id: D1
    description: "computeNextAction returns the seven candidate-home props as defaults-plus-overrides, producing identical values to the pre-rewrite three-arm chain in all three states"
    requirement: REVIEW-RT-06
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/candidate/(protected)/candidateHome.helpers.test.ts"
        status: pass
      - kind: e2e
        ref: "yarn test:e2e --project=candidate-journey --project=perm-answers-locked"
        status: pass
    human_judgment: false
  - id: D2
    description: "The badge set is defined up front as data and every candidate-home template conditional reads a precomputed value"
    requirement: REVIEW-RT-06
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/candidate/(protected)/candidateHome.helpers.test.ts (badge cases: zero, non-zero, undefined array, empty array)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The profile portrait wrapper element is gone; the error is addressed as the shared input-error node chained inside the profile-image-upload container"
    requirement: REVIEW-RT-07
    verification:
      - kind: e2e
        ref: "tests/tests/specs/candidate/candidate-journey.spec.ts step 13 (portrait errors) — baseline pass, post-edit pass, and negative control FAIL"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both theme-colour fallback literals and their optional chaining removed; a missing palette colour is now a typecheck error"
    requirement: REVIEW-RT-07
    verification:
      - kind: other
        ref: "yarn typecheck (svelte-check, 0 errors 0 warnings)"
        status: pass
    human_judgment: true
    rationale: "No spec asserts on the <meta theme-color> tag, so the rendered attribute value is typecheck-verified, not suite-verified. A human should confirm the browser chrome colour is unchanged in light and dark."
  - id: D5
    description: "The document title renders the application name first with a conditional maintenance suffix separated by a literal en dash"
    requirement: REVIEW-RT-07
    verification:
      - kind: other
        ref: "curl of served SSR HTML — <title>Election Compass</title>, no trailing or double space"
        status: pass
    human_judgment: true
    rationale: "Only the default (non-maintenance) arm could be measured end-to-end. The maintenance arm is unreachable in this configuration because of the pre-existing defect logged as DEF-158-01, so a human must confirm the suffix once that defect is fixed."

duration: 95min
completed: 2026-09-01
status: complete
---

# Phase 158 Plan 04: Candidate Home Readability & Test Hygiene Summary

**The candidate home's three-arm next-action chain became two pure functions pinned by a characterisation table written first, and the profile page lost the wrapper `<div>` that existed only for a test to select — with the chained replacement selector proven non-vacuous by a deliberate negative control.**

## Performance

- **Duration:** ~95 min across the original session and this continuation
- **Tasks:** 4 (Tasks 1–2 in the prior session, Tasks 3–4 here)
- **Files created:** 3
- **Files modified:** 6

## Accomplishments

- `computeNextAction` / `computeBadges` extracted as pure functions with a **genuinely empty runtime module graph** (the helper imports nothing at all), and a 257-line colocated table pinning all three states with the answers-locked flag both set and clear.
- The characterisation table pins the one value the E2E suite structurally cannot see: the second case shares the *profile-complete* case's EDIT wording for the basic-info button while the fallback uses ENTER. The button is selected by test id, so no spec asserts its text — the defaults-plus-overrides rewrite would have silently flipped it.
- The profile portrait wrapper is deleted and its argument **answered, not ignored**: the shared `<ErrorMessage>` already carries `input-error`, and it sits inside the container that already carries `profile-image-upload`, so the container is the disambiguator.
- Both theme-colour fallbacks and all three levels of optional chaining removed (Task 3: `drop-chaining`).
- Full E2E suite: **150 passed, 0 failed, 0 flaky, 0 did-not-run** — cardinal-clean per CLAUDE.md's hard rule.

## Task Commits

1. **Task 1: Characterisation test first** — `ebacaed7d` (test) — 2 files, +419
2. **Task 2: Thin the candidate home onto the helper** — `8e8fe9dba` (refactor) — 1 file, +45/−63
3. **Task 3: DECIDE — theme-colour optional chaining** — no commit; the task's own acceptance criteria require `+layout.svelte` to be *unmodified* when the answer is recorded, and it was (`git status --porcelain` empty at that point)
4. **Task 4: Wrapper, theme colours, title** — `ca88d124e` (refactor) — 6 files, +74/−32

## Task 3 — the decision and the measurement that justified it

**Operator's answer, verbatim: `drop-chaining`.**

**The measured fact this turned on.** In `packages/app-shared/src/settings/staticSettings.type.ts` the entire `colors` block carries **zero** optional (`?:`) markers — measured, not eyeballed: `sed -n '38,61p' … | grep -c '?:'` returns `0`. Every level the layout reads is required:

| Path | Line | Optional? |
|---|---|---|
| `colors` | `staticSettings.type.ts:38` | required |
| `colors.light` | `:39` | required |
| `colors.light['base-300']` | `:46` | required |
| `colors.dark` | `:50` | required |
| `colors.dark['base-300']` | `:57` | required |

Both values are populated with **the very literals the layout was repeating as fallbacks** — `'#d1ebee'` at `staticSettings.ts:25` and `'#1f2324'` at `:36`.

This resolves the research's open condition. The feared "the colours are optional in the type" defect **does not exist**, so `drop-chaining` carries no build-failure cost, and a future missing colour becomes a typecheck error rather than a silently omitted `theme-color` attribute — which was the exact failure mode the reviewer's ask pointed at.

Applied at `apps/frontend/src/routes/+layout.svelte`, yielding `staticSettings.colors.light['base-300']` and `staticSettings.colors.dark['base-300']`. `grep -c "?? '#"` is now **0**.

**Honest coverage note (as the plan requires).** No spec asserts on the `<meta theme-color>` tag — the visual-regression project does not read it, and `voter-dark-mode.spec.ts` asserts *rendered colours*, not the meta tag. This change is **typecheck-verified, not E2E-verified**. It is not claimed otherwise.

## The badge count representation

**STRING, for both badges.** The two inline guards being replaced disagreed — one wrapped the length in a string conversion, the other passed the raw number — and the badge component accepts either. The string form is adopted for both and recorded in the helper's docblock. Absent and empty arrays both count as 0 and render no badge, matching the pre-rewrite guards.

## Task 2 criterion arithmetic — the planner's count was off by the import line

The plan's criterion expects `grep -c 'computeNextAction' +page.svelte` to be **1**. The measured value is **2**, and the same for `computeBadges`:

```
19:  import { computeBadges, computeNextAction } from './candidateHome.helpers';
53:    computeNextAction({
66:    computeBadges({
```

The **intent** — exactly one call site each — is met. The planner's count simply omitted the import line. Recorded rather than "fixed" by contorting the code to satisfy a miscount.

## The portrait-error evidence chain (T-158-19)

The whole point of this criterion is that a visibility assertion on a locator resolving to the *container* would pass vacuously. Three measurements, in order:

1. **Pre-edit baseline** — `yarn test:e2e --project=candidate-journey` on a freshly started dev server and a `db:reset` database: **5 passed (33.5s)**, with step 13 (`13. profile: portrait errors + valid upload + …`) carrying both `uploadPortrait({ expectError })` calls against the wrapper-based `profile-image-error` locator. The assertions are non-soft `expect`, so a failure would have failed the run.
2. **Post-edit** — same command against the chained selector: **5 passed (31.6s)**.
3. **Negative control** — the child selector deliberately repointed at `input-error-nonexistent-negative-control`, everything else unchanged:

```
1) [candidate-journey] › candidate-journey.spec.ts:285:3 › candidate journey ›
   full candidate journey end-to-end @candidate ›
   13. profile: portrait errors + valid upload + fill info except required + first + submit
    Error: expect(locator).toBeVisible() failed
    Error: element(s) not found
  1 failed
  4 passed (18.7s)
```

It fails **at step 13 specifically** — the portrait-error step — which is what distinguishes a working selector from a lucky one. The fixture was then restored from a byte-copy backup and verified to contain no negative-control residue.

## Title whitespace — and a hard finding the plan did not anticipate

The plan warned that the reviewer's snippet would produce a double space and a trailing space if transcribed naively. That turned out to be the *lesser* problem.

**The reviewer's requested markup does not compile in Svelte 5.** Transcribed as markup, `vite-plugin-svelte` rejects it outright:

```
src/routes/+layout.svelte:188:27 `<title>` can only contain text and {tags}
https://svelte.dev/e/title_invalid_content
code: 'title_invalid_content'
```

Caught by measuring the served page rather than by reading the diff — the dev server was returning **HTTP 500** on every route.

The semantics were delivered instead as a `$derived` template literal beside `underMaintenance`:

```ts
const documentTitle = $derived(`${t('dynamic.appName')}${underMaintenance ? ` – ${t('maintenance.title')}` : ''}`);
```

This is a **closer** match to the criterion than markup could be: the application name appears **once, unconditionally, outside the conditional**, and the maintenance suffix is conditional — exactly the reviewer's shape. It also removes the whitespace hazard entirely, because the spacing is explicit in the literal rather than emitted from markup. The separator is the en dash character U+2013 written literally (verified at byte level: `e2 80 93`); the file contains no `&ndash;` and no `&#8211;`.

**Measured, not assumed:** the served SSR HTML is `<title>Election Compass</title>` — no double space, no trailing space, HTTP 200.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] The reviewer's title markup is invalid Svelte 5**
- **Found during:** Task 4
- **Issue:** `{#if}` inside `<title>` is a compile error (`title_invalid_content`); the dev server returned HTTP 500 on every route.
- **Fix:** Built the title as a `$derived` template literal in the script and rendered `<title>{documentTitle}</title>`, preserving the requested semantics.
- **Verification:** Server returns 200; SSR title measured at byte level.
- **Committed in:** `ca88d124e`

**2. [Rule 3 — Blocking] Comment hygiene guard rejected the replacement comment**
- **Found during:** Task 4
- **Issue:** `yarn assert:comment-hygiene` reported 3 violations of rule 2 (D-A4) — the replacement portrait comment was hard-wrapped across lines.
- **Fix:** Joined into a single line.
- **Verification:** Guard reports **0 violations** over 1603 files.
- **Committed in:** `ca88d124e`

**3. [Rule 1 — Stale premise corrected] Reused the existing shared `inputError` entry**
- **Found during:** Task 4
- **Issue:** The research states `input-error` has **zero** consumers and instructs adding a profile-scoped `inputError` entry. At HEAD it already exists as `testIds.shared.inputError` (`testIds.ts:286`) **and already has a consumer** (`candidate-journey.spec.ts:548`, the invalidUrl step). Adding a second entry would have duplicated it.
- **Fix:** Deleted `imageError` and chained `testIds.shared.inputError` inside `candidate.profile.imageUpload`. Retained `profile-image-upload` as the parent handle (`grep -c` is 1, as the criterion requires). Updated the shared entry's comment to state when unscoped selection is safe and when chaining is mandatory.
- **Verification:** `grep -rn "profile-image-error" apps tests` returns **0 lines**; E2E green; negative control reddens.
- **Committed in:** `ca88d124e`

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 stale-premise correction). **No architectural changes; no packages installed.**

## Issues Encountered

**DEF-158-01 — the maintenance flag does not reach the merged settings (pre-existing, logged, NOT fixed).**

While measuring the maintenance arm of the new title, flipping the DB column to `access.underMaintenance: true` produced a served page that **carries the flag in its serialized loader payload** yet renders normally — no maintenance suffix, and the `{:else if underMaintenance}` branch that renders `MaintenancePage` does not render. Measured twice with 10 s and 12 s settles and cache-busting query strings.

Confirmed **pre-existing and independent of this plan**: the diff touches neither `const underMaintenance = …` nor the `{:else if underMaintenance}` branch, and that branch was equally unreachable before the edit. Per the executor scope boundary this was logged to `deferred-items.md`, not fixed. Consequence recorded honestly: the **maintenance arm of the title could not be exercised end-to-end**; only the default arm is measured.

## Verification

| Gate | Result |
|---|---|
| `yarn workspace @openvaa/frontend test:unit` | **72 files / 1321 tests passed** (baseline 71/1302 before this plan) |
| `yarn typecheck` | **0 errors, 0 warnings** (svelte-check) |
| `yarn typecheck:tests` | exit **0** |
| `yarn assert:comment-hygiene` | **0 violations** over 1603 files |
| `yarn test:e2e` (FULL suite) | **150 passed (10.4m)** — 0 failed, 0 flaky, 0 did-not-run |
| `--project=candidate-journey` baseline / post-edit / negative control | 5 passed / 5 passed / **1 failed at step 13 as designed** |
| T-158-17 negative control (prior session) | Reddened 3 tests, helper restored, re-verified green |

### The visual-regression project — the plan's premise here is false, and it matters

Plan verification item 4 calls the visual-regression project *"the only signal on the deleted wrapper's layout neutrality."* **It is not a signal at all.** That spec screenshots exactly two routes — voter results and candidate preview (`grep -c "profile"` over the spec returns **0**). The candidate **profile** page, whose wrapper was deleted, is never screenshotted.

Run anyway for completeness: **4 failed, 3 passed**, all four failures on voter-results and candidate-preview.

Rather than attribute these to the documented platform mismatch, it was **measured**: the pre-change source was checked out (`git checkout HEAD~1 -- …`) and the project re-run — **the identical four tests fail**, same names. So they are pre-existing macOS-vs-Linux baseline mismatches, exactly as `playwright.config.ts` documents ("PNG baselines are Linux/x86_64 captures that only reproduce on the CI runner image, not because it is broken"), and **not** caused by this change. The committed versions were then restored and re-verified.

**Net:** the deleted wrapper's layout neutrality rests on the structural argument (a bare, class-less container whose single child is a `w-full flex flex-col items-stretch` div, inside a column-flex parent — both stretch identically) plus the green candidate a11y scan in the 150, **not** on visual regression. Stated plainly so a later phase does not inherit a false assurance.

## Next Phase Readiness

- Both REVIEW-RT-06 and REVIEW-RT-07 are discharged and suite-clean.
- `candidateHome.helpers.ts` is the second in-tree instance of the `<Component>.helpers.ts` pattern and can be cited as precedent.
- **Carried forward:** `DEF-158-01` in `deferred-items.md` — belongs to a settings-merge phase, not a routing one. Worth a characterisation test at the merge boundary.
- **Note for whoever fixes DEF-158-01:** the maintenance arm of the new title becomes measurable at that point and should be asserted then.

## Self-Check: PASSED

All four artifacts verified present on disk (`candidateHome.helpers.ts`, `candidateHome.helpers.test.ts`, this SUMMARY, `deferred-items.md`) and all three task commits verified present in `git log` (`ebacaed7d`, `8e8fe9dba`, `ca88d124e`). Working tree clean apart from the pre-existing untracked `.planning/milestone.lock`.

---
*Phase: 158-routing-auth-surface-harmonisation*
*Completed: 2026-09-01*
