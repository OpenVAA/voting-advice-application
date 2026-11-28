# QSPEC-* spec i18n hardening — migrate literal English strings to t() lookups

**Filed:** 2026-05-12
**Source:** Phase 75 W-03 revision (CONTEXT D-05 step 1 — i18n locator convention)
**Home phase:** Phase 78 / CLEAN-04 (`2026-05-09-tighten-i18n-wrapper.md`)
**Effort:** ~1 plan within Phase 78 (i18n wrapper tightening + spec migration in one sweep)

## Why deferred

No `tests/tests/specs/voter/*.spec.ts` imports the translation surface today —
`grep -L "from.*translations" tests/tests/specs/voter/*.spec.ts | wc -l` returns
the full count of voter specs (0 import it). Establishing the i18n-import
pattern is a cross-cutting hygiene change that affects every QSPEC-* spec
(and the existing voter-detail.spec.ts / voter-matching.spec.ts that already
use literal strings like 'Candidate Alpha', 'opinions', etc.). Phase 78 /
CLEAN-04 i18n wrapper tightening is the durable home for the migration
sweep — Phase 75 QSPEC-01 ships with literal English strings for the boolean
labels (consistent with Phase 74 P05's `'Option A/B/C'` literal-label
convention; specs run in default `en` locale).

## Scope when picked up

1. **Identify the canonical i18n import path for spec-side `t()` lookups.**
   Likely a thin wrapper around the existing i18n surface that defaults to
   the spec's locale fixture (default `en`). The frontend uses
   `sveltekit-i18n` via `apps/frontend/src/lib/i18n/`; the spec-side wrapper
   must expose the same `common.json` keys without triggering Svelte runtime
   imports inside Playwright tests.
2. **Migrate Phase 75 QSPEC-* specs:**
   - `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` (QSPEC-01) —
     replace `getByRole('radio', { name: 'No' })` / `'Yes'` with
     `getByRole('radio', { name: t('common.answer.no') })` /
     `t('common.answer.yes')`.
   - `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` (QSPEC-02 — Plan 02a) —
     replace `'Option A'` / `'Option B'` / `'Option C'` with the equivalent
     i18n lookups for the categorical choice labels (or accept that the dev-seed
     template hard-codes English labels in `e2e.ts:522-526` — in which case
     leave categorical literals and document the asymmetry).
3. **Add an ESLint rule (or smoke grep check) forbidding `'Yes'` / `'No'` /
   `'Option [A-Z]'` literal-name selectors in opinion-question specs.** Mirrors
   the post-Phase-73 `playwright/no-raw-locators` rule at 'error'.

## Cross-references

- Phase 75 CONTEXT D-05 step 1 (i18n locator convention — `t('common.answer.{no,yes}')`)
- Phase 75 PLAN.md must_haves bullet 7 — literal English strings used per Phase 74 P05 convention
- Phase 74 P05 SUMMARY (precedent — `'Option A/B/C'` literal labels)
- Phase 78 CLEAN-04 (`2026-05-09-tighten-i18n-wrapper.md` — durable home)

## Open questions

- Should the wrapper auto-pluck the active locale from the Playwright fixture's
  baseURL search params (`?lang=fi`), or default to `en` and require explicit
  override?
- Does CLEAN-05's `--likert-only` seed modifier (operator-locked Path B in
  `2026-05-11-voter-fixture-heterogeneous-question-types.md`) also benefit from
  the i18n wrapper? Likely yes — coordinate sequencing in Phase 78.
