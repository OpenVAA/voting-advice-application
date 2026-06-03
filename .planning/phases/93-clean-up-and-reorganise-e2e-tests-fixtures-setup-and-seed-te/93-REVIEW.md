---
phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
reviewed: 2026-06-03T00:00:00Z
depth: standard
files_reviewed: 35
files_reviewed_list:
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/src/index.ts
  - packages/dev-seed/src/cli/resolve-template.ts
  - packages/dev-seed/tests/templates/base.test.ts
  - packages/dev-seed/tests/templates/base-app-settings.test.ts
  - packages/dev-seed/tests/templates/variant-app-settings.test.ts
  - packages/dev-seed/tests/cli/likert-only.test.ts
  - tests/playwright.config.ts
  - tests/seed-test-data.ts
  - tests/tests/setup/shared/setupFromTemplate.ts
  - tests/tests/setup/shared/base.setup.ts
  - tests/tests/setup/shared/base.teardown.ts
  - tests/tests/setup/candidate/candidate-journey.setup.ts
  - tests/tests/setup/candidate/candidate-journey.teardown.ts
  - tests/tests/setup/perm/perm-localisation-positive.teardown.ts
  - tests/tests/setup/perm/perm-startfromcg.setup.ts
  - tests/tests/utils/candidateJourneyConstants.ts
  - tests/tests/utils/voterNavigation.ts
  - tests/tests/utils/testCredentials.ts
  - tests/tests/utils/testIds.ts
  - tests/tests/utils/voterIntro.ts
  - tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts
  - tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts
  - tests/tests/fixtures/candidate/perm-l10n.ts
  - tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts
  - tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts
  - tests/tests/fixtures/shared/feedbackDialog.fixture.ts
  - tests/tests/helpers/timeouts.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/specs/candidate/candidate-journey.spec.ts
  - tests/tests/specs/perm/perm-per-app-notifications.spec.ts
  - tests/tests/specs/perm/perm-disable-allow-open.spec.ts
  - tests/tests/specs/perm/perm-startfromcg.setup.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 93: Code Review Report

**Reviewed:** 2026-06-03
**Depth:** standard
**Files Reviewed:** 35
**Status:** issues_found

## Summary

Phase 93 reorganised the E2E suite + dev-seed templates into a role-based taxonomy and
unified the base seed `external_id` prefix to `test-e2e-base-`. The review concentrated on
the four substantive risk areas called out in the brief: (1) seed/teardown isolation, (2)
prefix-migration completeness, (3) the `buildMinimal`/barrel/resolver remap, and (4)
quarantined tests.

**Isolation: sound.** The previously-found 3-election cross-chain leak fix is in place and
verifiable in `playwright.config.ts`: the perm family's first setup
(`data-setup-perm-1e1cg1co`) depends on `['voter-journey', 'candidate-journey']`, and every
later perm setup chains off the previous perm *spec*, forcing the entire perm family to run
strictly after both journeys. This is the correct (perm→journey) direction that preserves
FLAG-6. The destructive `extraTeardownPrefix: ['test-', 'e2e-perm-']` preclear in every perm
setup (which deletes base `test-e2e-base-%` rows) is therefore safe in the default run because
base data is no longer needed by the time any perm setup executes. Teardown ownership is
clean: `data-teardown-base` is the sole `test-` writer/owner; all 22 perm templates carry
distinct `e2e-perm-*` prefixes (≥2 chars); no perm template emits a bare `test-` external_id.

**Prefix migration: complete.** No surviving bare `test-ca-/test-el-/test-co-/test-election-/
test-constituency-` literal targets base data in active code. The only `test-` literals
remaining in non-comment code are (a) `voterNavigation.ts` correctly migrated to
`test-e2e-base-el-reg/-el-mun/-co-reg-n/-co-mun-ne`, and (b) the intentionally-unmigrated
`INFO_QUESTION_ANSWERS` map keys (`test-qu-info-*`), which are documented internal map keys
consumed via `.replace(/^test-/, '')` to derive the `[qu-info-*]` label matcher. That
exclusion is correct and self-consistent.

**buildMinimal / barrel / resolver: correct** for the in-scope perm shapes, with one
documented sharp edge (WR-04).

The findings below are quality/maintainability concerns, not correctness blockers.

## Warnings

### WR-01: Entire `variant-app-settings.test.ts` suite is vacuously skipped with hand-stubbed dependencies

**File:** `packages/dev-seed/tests/templates/variant-app-settings.test.ts:38-189`
**Issue:** All three `describe` blocks are `describe.skip`, and the module replaces its real
imports (`E2E_BASE_APP_SETTINGS`, `mergeSettings`, the three variant templates) with no-op
stubs (`const mergeSettings = (..._args) => ({})`, `E2E_BASE_APP_SETTINGS = {}`). The file no
longer exercises any production code — it is a ~190-line always-green husk that still appears
in the vitest report as "skipped" suites, giving a false impression that variant app-settings
behaviour is under test. The stubs also mean that if someone later flips `describe.skip` →
`describe` to "re-enable" it, every assertion silently passes against `{}` rather than failing
loudly, masking the fact that the templates are gone.
**Fix:** Delete the file outright. The variant templates it targeted were deleted pre-Phase-93
(per the in-file note), and the surviving base app-settings contract is already covered by
`base-app-settings.test.ts`. A deleted file is unambiguous; a stubbed-and-skipped file is a
latent trap. If a placeholder must remain, replace the body with a single
`it.todo('variant app_settings — re-author after variant templates return')`.

### WR-02: `perm-per-app-notifications` is fully `describe.skip`ped but its 3 Playwright projects still run in the serial perm chain

**File:** `tests/tests/specs/perm/perm-per-app-notifications.spec.ts:33`
**Issue:** The spec's only `describe` is skipped (pending the runes migration — a documented,
pre-Phase-93 quarantine with a tracking todo). However `playwright.config.ts:556-572` still
declares `data-setup-perm-per-app-notifications`, `data-teardown-perm-per-app-notifications`,
and `perm-per-app-notifications` as live projects wired into the linear perm chain, and the
next chain (`perm-missing-nominations`) depends on the skipped spec project
(`dependencies: ['perm-per-app-notifications']`). The result: every full-suite run seeds +
tears down the `e2e-perm-notif-` dataset and pays the serial-chain latency for a spec that
executes zero assertions. This is wasted setup/teardown churn on the shared DB and an
isolation surface (one more app_settings-singleton clobber) with no test value.
**Fix:** This is not a Phase-93 regression, but the reorg is the right moment to address it.
Either (a) keep the spec project but repoint the *downstream* dependency from
`perm-per-app-notifications` (spec) to `data-setup-perm-per-app-notifications` so a re-enable
doesn't shift the chain, or preferably (b) drop the three notif projects from the config while
the spec is quarantined and restore them in the same PR that flips `describe.skip` →
`describe`. Cross-reference the tracking todo so the config edit and spec re-enable land
together.

### WR-03: `setupFromTemplate` empty-prefix fallback silently maps any empty-`externalIdPrefix` template onto the base teardown namespace

**File:** `tests/tests/setup/shared/setupFromTemplate.ts:166`
**Issue:** `const teardownPrefix = prefix.length >= 2 ? prefix : 'test-e2e-base-';` hardcodes
the base prefix as the fallback for *any* template whose `externalIdPrefix` is `''`. Today
only `e2e/base` has an empty prefix, so this is correct. But the fallback is silent: if a
future built-in template is authored with `externalIdPrefix: ''` and its own pre-written
literal prefix (the same pattern base uses), `setupFromTemplate` will (a) run
`runTeardown('test-e2e-base-', ...)` — wiping the *base* dataset instead of the new
template's rows, and (b) allowlist the wrong prefix in the freshness probe. The result is a
hard-to-diagnose cross-dataset wipe with no error. The coupling between "empty prefix" and
"the prefix is literally `test-e2e-base-`" is an undocumented invariant enforced only by
there being exactly one such template.
**Fix:** Make the contract explicit. Either resolve the teardown prefix from the template
itself (e.g. read the literal prefix off `template.app_settings.fixed[0].external_id` up to a
known delimiter) or guard the fallback so it only fires for the named `e2e/base` template and
throws for any *other* empty-prefix template:
```ts
const teardownPrefix =
  prefix.length >= 2 ? prefix
  : templateName === 'e2e/base' ? 'test-e2e-base-'
  : (() => { throw new Error(`Empty externalIdPrefix for '${templateName}' has no teardown-prefix fallback`); })();
```

### WR-04: `buildMinimal` opinion default answer assumes Likert-5 ids; diverges from its own categorical fallback path

**File:** `packages/dev-seed/src/templates/_helpers/buildMinimal.ts:163-177`
**Issue:** `defaultAnswerForQuestion` returns `{ value: '3' }` unconditionally for any
`singleChoiceOrdinal` question, on the documented assumption that the helper only emits
LIKERT_5_EN ordinals (id '3' = neutral). That assumption holds for questions *generated by
buildMinimal itself*, but `defaultAnswerForQuestion` is invoked over the full `questions`
array (line 311-314), and the function is otherwise written defensively (the categorical
branch at 173-177 reads `question.choices` and falls back to `''`). The ordinal branch does
NOT consult `question.choices`, so a Likert-4 or Likert-7 ordinal — or any future override
that injects a non-Likert5 ordinal into the minimal template — would seed `value: '3'`, which
may not be a valid choice id, producing a silently-malformed answer row rather than an import
error. The inconsistency (categorical branch is data-driven, ordinal branch is hardcoded) is a
foot-gun for the next author who extends `buildMinimal`.
**Fix:** Make the ordinal branch data-driven for parity with the categorical branch: pick the
median choice id from `question.choices` when present, falling back to `'3'` only when choices
are absent:
```ts
if (type === 'singleChoiceOrdinal') {
  const choices = question.choices as Array<{ id: string }> | undefined;
  if (Array.isArray(choices) && choices.length > 0) {
    return { value: choices[Math.floor((choices.length - 1) / 2)].id };
  }
  return { value: '3' };
}
```

## Info

### IN-01: `seed-test-data.ts` duplicates the seed pipeline already centralised in `setupFromTemplate`

**File:** `tests/seed-test-data.ts:21-31`
**Issue:** The standalone dev seeder re-implements the
`runPipeline → fanOutLocales → Writer.write` sequence by hand, a near-verbatim copy of
`setupFromTemplate.ts:197-200`. The two will drift (e.g. `setupFromTemplate` already gained
the app-settings external-id resolver step; this script has not). For a manual-dev convenience
wrapper this is low-risk, but it is a second source of truth for the seed sequence.
**Fix:** Have `seed-test-data.ts` call a shared seed helper, or document at the top that it
deliberately omits the post-seed app-settings resolver (acceptable because `e2e/base` only
uses `{externalId}` refs that the Writer resolves internally during Pass-5).

### IN-02: `base.ts` question-count docstring contradicts itself ("14 questions" vs enumerated 20)

**File:** `packages/dev-seed/src/templates/e2e/base.ts:600-608`
**Issue:** The header comment says "14 questions" then immediately recomputes "= 20" and
concludes the "14" is "approximate" or counts opinion-only. The dataset actually declares
20 questions (12 info incl. 3 filtered + 8 opinion). A future reader auditing counts against
this comment will be misled. The `base.test.ts` shape test does not pin the total question
count, so the stale "14" is not caught.
**Fix:** Replace the equivocating comment with the actual breakdown (12 info + 8 opinion = 20)
and add a `questions.fixed` length assertion to `base.test.ts` to lock it.

### IN-03: `sort_order` gap at 8 in `base.ts` info questions is undocumented at the gap site

**File:** `packages/dev-seed/src/templates/e2e/base.ts:702-723`
**Issue:** The `multipleText` info question is intentionally omitted, leaving a `sort_order`
gap (7 → 9). The omission is well-documented, and `ORDER BY sort_order` tolerates gaps, so
this is harmless. Flagged only because the next two questions jump to `sort_order: 9, 10, 11`
and a future author adding an info question may reuse `8` unaware of the reservation.
**Fix:** None required; the existing inline note ("The sort_order gap at 8 is harmless") is
sufficient. Optionally reserve the slot with a comment at line 723.

---

_Reviewed: 2026-06-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
