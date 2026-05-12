
## From Plan 04 (2026-05-12 execution)

- `tests/tests/specs/candidate/candidate-required-info.spec.ts:140,152` — `playwright/no-raw-locators` lint errors (2). Pre-existing from Phase 77 (commit c44cca456 / e9efd40b7); unrelated to i18n wrapper tightening. Out of scope for Plan 04 per scope-boundary rule. Suggested follow-up: surface during Plan 07 verification gate as a candidate for v2.10+ test-hygiene cleanup.

## From Plan 05 (2026-05-12 execution)

- `packages/dev-seed/tests/templates/e2e.test.ts:431` — `questions.fixed.length === 18` assertion now expects 18 but the e2e template ships 23 questions on HEAD (Phase 76 P01 added 3 info questions at sorts 19/20/21; Phase 77 P02 added test-question-number-1 at sort 22 + custom_data.filterable on text/categorical questions). Pre-existing failure on HEAD prior to Plan 05 (confirmed via `git stash` + re-run). Out of scope for Plan 05 per scope-boundary rule — Plan 05 only touched seed.ts/help.ts/likert-only.ts + voter.fixture.ts. Suggested follow-up: bump the assertion to `toBe(23)` in a v2.10+ test-hygiene sweep, or replace with a more durable `.toBeGreaterThanOrEqual(16)` invariant tied to the singleChoiceOrdinal count. Surface during Plan 07 verification gate.
