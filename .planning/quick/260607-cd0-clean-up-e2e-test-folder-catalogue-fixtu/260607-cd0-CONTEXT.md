# Quick Task 260607-cd0: Clean up e2e test folder - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Task Boundary

Clean up the e2e test folder (`tests/tests/`). Three explicit sub-goals:
1. Catalogue all fixtures, helpers, and utils by which specs use them.
2. Check which have overlap (functional duplication / near-duplicates).
3. Deprecate duplicates — **deferred to a follow-up run** (see decisions).

This run is **analysis only**: it produces report artifacts, deletes/rewrites nothing.

</domain>

<decisions>
## Implementation Decisions

### Execution shape — LOCKED
- **Report, then checkpoint.** This task delivers (a) a CATALOGUE mapping every
  fixture/helper/util/setup module → the specs that import it, (b) an OVERLAP /
  duplication analysis, and (c) a concrete *proposed* deprecation plan.
- **No source code is deleted or rewritten in this run.** The user reviews the
  report; actual consolidation happens in a separate follow-up run.

### Scope — LOCKED
- In scope for catalogue + overlap analysis: `tests/tests/fixtures/`,
  `tests/tests/helpers/`, `tests/tests/utils/`, AND `tests/tests/setup/`.
- Also produce a **stray-artifact cleanup proposal** (do NOT delete now) for
  non-code clutter: tracked/stale output dirs (`tests/playwright-results/`,
  `tests/playwright-results-cell4/`, `tests/playwright-report/`),
  `tests/.planning/`, `tests/TEMP.md`, `tests/IDURA-TEST-RUNBOOK.md`. Verify
  gitignore status of each before recommending deletion vs. .gitignore addition.

### Deprecation mechanism — LOCKED (applies to the FOLLOW-UP run, not this one)
- "Deprecate duplicates" = **consolidate**: merge each duplicate into ONE
  canonical module, rewrite all spec imports to point at it, delete the
  redundant file. (Not @deprecated shims; not delete-unused-only.)
- The proposed plan in this run's report must be written so the follow-up can
  execute it mechanically: name the canonical target, list the files to delete,
  list every import site to rewrite.

### Claude's Discretion
- Output location/format of the report artifacts (default: in this quick-task
  directory; planner may also propose promoting a cleaned catalogue into
  `tests/tests/helpers/README.md` as part of the follow-up).
- The taxonomy used to classify "fixture vs helper vs util vs setup" and the
  exact definition of "duplicate" (exact-copy vs near-identical vs
  functionally-overlapping) — research informs this; surface it explicitly in
  the report.
- Whether the helpers/ vs utils/ folder split should be unified — decide from
  the findings and present as a recommendation, not a foregone conclusion.

</decisions>

<specifics>
## Specific Ideas

Overlap signals already spotted during scouting (to confirm/expand, not assume):
- `helpers/navigation.helper.ts` vs `utils/voterNavigation.ts` vs
  `utils/buildRoute.ts` + `utils/paths.ts` — navigation/route concerns split
  across both helpers/ and utils/.
- `utils/emailHelper.ts` vs `fixtures/shared/emailBucket.fixture.ts` — email/Inbucket.
- `utils/translations.ts` vs `fixtures/candidate/perm-l10n.ts` — translation/i18n.
- `utils/voterIntro.ts` vs `fixtures/voter/voterIntroPage.fixture.ts` — voter intro.
- The `helpers/` vs `utils/` split itself: two buckets for shared non-fixture code.

Current inventory (scouted 2026-06-07): 26 fixtures, 8 helpers files, 13 utils
files, setup across 4 sub-dirs, 28 specs across a11y/candidate/perf/perm/visual/voter.

</specifics>

<canonical_refs>
## Canonical References

- `tests/tests/helpers/README.md` — existing helper-folder convention doc.
- `.planning/debug/phase93-e2e-regression-clusters.md` — recent e2e infra context.
- `CLAUDE.md` testing section + `tests/IDURA-TEST-RUNBOOK.md`.

</canonical_refs>
