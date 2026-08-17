---
phase: 119-e2e-fixtures-helpers-seed
reviewed: 2026-06-15T09:05:04Z
depth: standard
files_reviewed: 40
files_reviewed_list:
  - apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte
  - apps/frontend/src/lib/components/questions/QuestionArguments.svelte
  - apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte
  - apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte
  - apps/frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.svelte
  - apps/frontend/src/lib/components/term/Term.svelte
  - apps/frontend/src/lib/components/video/Video.svelte
  - apps/frontend/src/lib/dynamic-components/feedback/popup/FeedbackPopup.svelte
  - apps/frontend/src/lib/dynamic-components/survey/popup/SurveyPopup.svelte
  - apps/frontend/src/routes/(voters)/about/+page.svelte
  - packages/dev-seed/src/cli/help.ts
  - packages/dev-seed/src/cli/seed.ts
  - packages/dev-seed/src/index.ts
  - packages/dev-seed/src/supabaseAdminClient.ts
  - packages/dev-seed/src/templates/default.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-access-disable.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts
  - packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/tests/cli/help.test.ts
  - tests/tests/fixtures/shared/navMenu.fixture.ts
  - tests/tests/fixtures/shared/popupNotice.fixture.ts
  - tests/tests/fixtures/shared/theme.fixture.ts
  - tests/tests/fixtures/shared/trackingIntercept.fixture.ts
  - tests/tests/fixtures/shared/video.fixture.ts
  - tests/tests/fixtures/voter/aboutPage.fixture.ts
  - tests/tests/fixtures/voter/entityFilters.fixture.ts
  - tests/tests/fixtures/voter/questionInfo.fixture.ts
  - tests/tests/fixtures/voter/resultsPage.fixture.ts
  - tests/tests/fixtures/voter/views.ts
  - tests/tests/setup/shared/setupFromTemplate.ts
  - tests/tests/specs/_probes/entityFilters.probe.spec.ts
  - tests/tests/specs/_probes/navMenu.probe.spec.ts
  - tests/tests/specs/_probes/orgMatching.probe.spec.ts
  - tests/tests/specs/_probes/popupNotice.probe.spec.ts
  - tests/tests/specs/_probes/questionInfo.probe.spec.ts
  - tests/tests/specs/_probes/theme.probe.spec.ts
  - tests/tests/specs/_probes/trackingIntercept.probe.spec.ts
  - tests/tests/specs/_probes/video.probe.spec.ts
  - tests/tests/utils/testIds.ts
  - tests/tests/utils/voterNavigation.ts
findings:
  critical: 0
  warning: 6
  info: 5
  total: 11
status: issues_found
---

# Phase 119: Code Review Report

**Reviewed:** 2026-06-15T09:05:04Z
**Depth:** standard
**Files Reviewed:** 40 (the 44-entry scope list includes a few `.fixture.ts` siblings reachable via `views.ts` re-exports; the 40 distinct source files were read in full)
**Status:** issues_found

## Summary

Phase 119 is an E2E test-infrastructure phase: new dev-seed perm templates, Playwright function-fixtures + probes, and production `data-testid` passthroughs. The review focused on the four risk areas the prompt called out.

**Verified clean:**

- **`supabaseAdminClient.ts` `importAnswers` org generalization (the flagged deviation):** The candidate path is structurally unchanged — both tables flow through the identical `answerSources` loop. The org path is correct end-to-end: `OrganizationsGenerator.generate()` spreads `...fx` (preserving `answersByExternalId`) and prefixes `external_id` to `e2e-perm-orgmatch-or-1`; `bulkImport` strips `answersByExternalId` via `NON_COLUMN_FIELDS` (no column-not-exist error); `importAnswers` re-reads it from the same `bulkData` and resolves the prefixed question external_ids that the keys carry. No rows are silently dropped or mis-keyed for the seeded `perm-org-matching` dataset (the org's intentional q3/q4 blanks are simply absent from `answersByExternalId`, not dropped).
- **All 10 production `.svelte` changes are non-behavioral passthroughs.** The diffs are testid attributes / a wrapper `<div>` only — no prop, type, or rendering-logic changes (git-diff confirmed for `EnumeratedEntityFilter`, `QuestionArguments`, `QuestionExtendedInfo`; the rest add a single `data-testid`).
- **Perm-template `externalIdPrefix` uniqueness:** all 26 `const P` literals are distinct (no duplicates); `show-feedback-survey` (`e2e-perm-feedback-survey-`) does not collide with the retained `perm-header-show-feedback` (`e2e-perm-header-show-feedback-`).
- **Settings shapes** in the new perm templates spread `MINIMAL_BASE_APP_SETTINGS` and diff single keys (correct given the documented shallow-merge-by-root-key semantics).
- **Fixture rigidity:** no raw `.locator()`/`getByText()` on assertion-bearing paths; all anchored through `testIds`. The one `.catch(() => null)` cluster (`resultsPage.dismissAllDialogs`) is correctly fenced as best-effort and documented.

No BLOCKER-class defects found. Six WARNING and five INFO items follow.

## Warnings

### WR-01: `--help` output advertises a non-existent `e2e` template and omits every real one

**File:** `packages/dev-seed/src/cli/help.ts:26-30`
**Issue:** The hardcoded "Built-in templates" block lists only `default` and `e2e`. But `BUILT_IN_TEMPLATES` (templates/index.ts:54-112) has **no `e2e` key** — the bare `e2e` invocation name was retired in Phase 93 (per CLAUDE.md) in favor of `e2e/base`, and 20+ `perm-*` templates plus `e2e/base` and `show-feedback-survey` are now registered. A user copying `yarn db:seed --template e2e` from `--help` will hit a "template not found" error, and none of the actually-resolvable templates are discoverable from help. The file's own header comment (lines 8-9) states "Plan 06 adds new built-ins => update this file in the same commit" — that contract was not honored when this phase added templates.
**Fix:** Replace the stale `e2e` line with the canonical names and reconcile with the registry:
```
Built-in templates:
  default              Finnish demo, 4-locale (en/fi/sv/da).
  e2e/base             Canonical Playwright base dataset, single-locale.
  perm-*               Settings/topology-permutation fixtures (see templates/index.ts).
  show-feedback-survey Results feedback + survey popup perm.
```

### WR-02: `help.test.ts` enshrines the stale `e2e` template name

**File:** `packages/dev-seed/tests/cli/help.test.ts:33-35`
**Issue:** The test `lists the 'e2e' built-in template` asserts `USAGE` matches `/^\s+e2e\s+/m`. This actively locks in the WR-01 defect: any correct fix to `help.ts` that drops the non-existent `e2e` entry will break this test, and as written the test passes only because the help text lies. A test should not pin documentation to a template name that cannot be resolved.
**Fix:** Update the assertion to the real canonical name(s), e.g. `expect(USAGE).toMatch(/^\s+e2e\/base\s+/m)`, after WR-01 is fixed.

### WR-03: `--likert-only` fully removed from the CLI but still extensively documented in CLAUDE.md

**File:** `packages/dev-seed/src/cli/seed.ts` (flag + handler deleted; `packages/dev-seed/src/cli/likert-only.ts` deleted, 128 lines)
**Issue:** This phase removed the `--likert-only` parseArgs option, its handler, and the entire `likert-only.ts` module. CLAUDE.md still documents `--likert-only` in multiple places (the `db:seed` flag list, a dedicated "Note on `--likert-only`" paragraph, the "Yarn arg-forwarding caveat" paragraph, and the "Seeding local data" example `yarn db:seed --template e2e/base --likert-only`). Running any of those documented commands now fails with a `parseArgs` "unknown option" error (`strict: true`, seed.ts:66). The project code-review checklist explicitly requires "repo documentation markdown files are updated if the changes touch upon those."
**Fix:** Remove or rewrite the `--likert-only` references in CLAUDE.md (and any README that mentions it). If the capability moved rather than retired, document its new entry point; if retired, delete the paragraphs and the example flag.

### WR-04: `--seed` validation accepts partially-numeric values and uses the wrong numeric guard

**File:** `packages/dev-seed/src/cli/seed.ts:84-91`
**Issue:** `const parsed = Number.parseInt(values.seed, 10); if (!Number.isFinite(parsed)) { reject }`. `Number.parseInt` never returns `Infinity`, so `Number.isFinite` is the wrong predicate — the only value it rejects is `NaN`. And `parseInt('12abc', 10) === 12`, so `--seed 12abc` is silently accepted as `12` (the comment claims it "reject[s] non-numeric"). A typo'd seed silently produces a different-but-valid deterministic dataset instead of a loud error, undermining the determinism contract. (Note: this line was not introduced by this phase, but it sits in a region this phase edited and the guard is genuinely incorrect.)
**Fix:** Validate the full token before accepting:
```ts
if (!/^-?\d+$/.test(values.seed)) {
  process.stderr.write(`Error: --seed must be an integer (got '${values.seed}').\n`);
  process.exit(1);
}
const parsed = Number.parseInt(values.seed, 10);
```

### WR-05: `popupNotice.dismiss()` relies on an English-only close-button name despite the documented locale-resilience contract

**File:** `tests/tests/fixtures/shared/popupNotice.fixture.ts:78`
**Issue:** `dismiss()` clicks `popup.getByRole('button', { name: /close|dismiss|cancel/i })`. This resolves today only because the `Alert` component renders an always-present "✕" button whose `sr-only` accessible name is the English `t('common.close')` = "Close" (Alert.svelte:117-119). The fixture's own header (lines 23-24) advertises "All locators are testid-anchored via `testIds` (locale-resilient)," but this dismiss path is in fact text-coupled to the English locale — under `/fi`, `/sv`, etc. the accessible name changes and the button match fails, so `dismiss`/`dismissAndReload` would time out. The survey popup in particular has no English "close/cancel"-named action of its own (its actions are "No Thanks" + the SurveyButton); it depends entirely on the Alert "✕".
**Fix:** Add a stable testid to the Alert close control (e.g. `data-testid="alert-close"`) and anchor `dismiss()` to it, OR scope the role lookup to the rendered locale's close label sourced from the i18n catalog rather than a hardcoded English regex. At minimum, soften the docstring's locale-resilience claim for this method so future callers do not assume it.

### WR-06: `default.ts` `results` block replaces dynamic settings but omits keys present in the canonical default shape

**File:** `packages/dev-seed/src/templates/default.ts:251-260`
**Issue:** The docstring (lines 248-250) correctly states that `mergeAppSettings` shallow-merges by root key, so writing `results` here REPLACES the entire `results` object from the TS defaults, and therefore the template "MUST mirror the full default shape." The block supplies `cardContents`, `showFeedbackPopup`, `showSurveyPopup`, `sections`. The sibling `e2e/base` `results` block (base.ts:201-215) additionally encodes a richer `cardContents.candidate` (`['submatches', { question: {...} }]`). Any `results.*` key that exists in `dynamicSettings.ts` but is absent here is silently dropped for the `default` dataset by the documented full-replace semantics. Because the replacement is by-design total, an incomplete mirror is a latent settings-regression vector (a future-added `results.*` default key will not appear under `default`).
**Fix:** Cross-check `results` against `packages/app-shared/src/settings/dynamicSettings.ts` and mirror every key the default shape defines (not only the four diffed here), or add a test asserting the seeded `default` `results` is a superset of the TS-default `results` keys.

## Info

### IN-01: `goToPage` URL builder has dead `|| '/'` fallback with misleading precedence

**File:** `tests/tests/fixtures/voter/aboutPage.fixture.ts:55`, `tests/tests/fixtures/voter/resultsPage.fixture.ts:89`
**Issue:** `await page.goto((locale === 'en' ? '' : `/${locale}`) + buildRoute({...}) || '/')`. `+` binds tighter than `||`, so the expression is `(prefix + buildRoute()) || '/'`. `buildRoute` always returns a leading-slash path, so the left operand is always a truthy non-empty string and the `|| '/'` is unreachable dead code. It reads as if it guards an empty-URL case it cannot reach.
**Fix:** Drop the `|| '/'`, or wrap intentionally: `const url = (locale === 'en' ? '' : `/${locale}`) + buildRoute({...}); await page.goto(url || '/');`.

### IN-02: `questionInfo.expectArguments` has identical `if/else` branches (no-op conditional)

**File:** `tests/tests/fixtures/voter/questionInfo.fixture.ts:125-130`
**Issue:** The `if (type === 'categorical') { await expect(...).toBeVisible() } else { await expect(...).toBeVisible() }` branches are byte-identical. The `type` parameter has no effect on behavior; the branch is dead structure that implies a distinction it does not make.
**Fix:** Collapse to a single `await expect(nthOrFirst(argumentGroup, question)).toBeVisible();` (keep `type` if reserved for future per-type assertions, but drop the no-op branch or add a `void type;` with a comment).

### IN-03: `expectSubMatch` accepts a `score` arg it never uses

**File:** `tests/tests/fixtures/voter/resultsPage.fixture.ts:257-258`
**Issue:** `expectSubMatch(category, score?)` immediately does `void score;` and never compares it — the docstring concedes the gauge comparison is "performed by the caller." A parameter that is documented as accepted "for call-site symmetry" but does nothing is a maintenance trap (callers may believe passing `score` asserts it).
**Fix:** Either implement the assertion against the returned gauge, or remove the unused parameter and let callers assert on the returned `Locator` directly.

### IN-04: `index.ts` docstring for the `show-feedback-survey` registration is stale re: the EPERM-09 key

**File:** `packages/dev-seed/src/templates/index.ts:86-89`
**Issue:** The comment says the key was "renamed from the former perm-header-show-feedback key," but `perm-header-show-feedback` is still imported and registered elsewhere in the same map (it remains a live, separate template per its retained file). The "renamed from" phrasing implies the old key is gone; it is not. Minor doc-accuracy drift that could mislead a maintainer into deleting the still-referenced old template.
**Fix:** Reword to "extended/derived from perm-header-show-feedback (which is retained)" to reflect that both coexist.

### IN-05: `perm-org-matching` answer-design comments use two different framings for the same blank-penalty

**File:** `packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts:20-31`
**Issue:** The docstring describes the `answersOnly` blank penalty both as "penalised as the polar opposite of the voter" (line 16) and "treated as '1'" (line 30). For the polar-max voter ('5') these coincide, but the two framings are not generally equivalent and could confuse a future editor who changes the voter answer mode. Purely a comment-clarity issue; the seeded data is internally consistent.
**Fix:** State the rule once ("missing answers score as the maximum distance from the voter, i.e. the polar opposite") and derive the concrete '1' from the polar-max voter, rather than asserting both as independent facts.

---

_Reviewed: 2026-06-15T09:05:04Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
