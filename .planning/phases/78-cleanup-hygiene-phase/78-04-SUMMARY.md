---
phase: 78-cleanup-hygiene-phase
plan: 04
subsystem: frontend-i18n
tags: [clean-04, i18n-wrapper-tightening, translationkey-union, ts-expect-error-regression-locker, t-get-alias-deletion]
requirements: [CLEAN-04]
dependency_graph:
  requires: []
  provides:
    - "Compile-time i18n key validation via TranslationKey union on `t()` entry point"
    - "Regression-locker test in translations.test.ts that fails if tightening is reverted"
    - "`assertTranslationKey()` formalized as the documented escape hatch for runtime-built keys"
  affects:
    - "apps/frontend/src/lib/i18n/wrapper.ts (signature tightening + alias delete)"
    - "apps/frontend/src/lib/i18n/utils/assertTranslationKey.ts (return type widened to TranslationKey)"
    - "apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts (I18nContext.t signature aligned)"
    - "apps/frontend/src/lib/i18n/tests/translations.test.ts (new regression-locker block)"
tech_stack:
  added: []
  patterns:
    - "@ts-expect-error regression-locker pattern for type-tightening contracts"
    - "Escape-hatch utility (`assertTranslationKey`) for runtime-built keys"
key_files:
  created:
    - .planning/phases/78-cleanup-hygiene-phase/78-04-SUMMARY.md
    - .planning/phases/78-cleanup-hygiene-phase/deferred-items.md
  modified:
    - apps/frontend/src/lib/i18n/wrapper.ts
    - apps/frontend/src/lib/i18n/utils/assertTranslationKey.ts
    - apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts
    - apps/frontend/src/lib/i18n/tests/translations.test.ts
decisions:
  - "Triage category (b) — runtime-built keys handled via the EXISTING `assertTranslationKey()` utility rather than introducing a new `t.template()` escape hatch. The utility is already in use at `+error.svelte:16` (`assertTranslationKey(\\`error.${page.status}\\`)`); widening its return type from `string` to `TranslationKey` was a one-line fix and avoided creating a parallel escape hatch."
  - "Triage category (a/c) — the i18nContext type contract (`I18nContext.t`) had a redundant declaration of `t: (key: string, …) => string` that needed to be re-aligned to `key: TranslationKey`. Treated as a single Rule 3 fix (blocking issue: the wrapper signature change cascaded into a contract mismatch) and bundled into the Task 1 commit."
  - "Source todo `2026-05-09-tighten-i18n-wrapper.md` resolved and moved to `.planning/todos/completed/` per the plan's `resolves_phase: 78` directive."
metrics:
  duration: "~5 minutes"
  completed: 2026-05-12
---

# Phase 78 Plan 04: i18n wrapper tightening (CLEAN-04) Summary

The `t()` translation wrapper now accepts only `TranslationKey` union members (compile-time validation against the 592-key auto-generated union); the unused `t.get = t` alias is deleted; and a `@ts-expect-error` regression-locker in `translations.test.ts` makes any future reversion of the tightening fail the typecheck.

## What Landed

### Task 1 — Wrapper tightening + alias delete (commit `39e331b8f`)

- **`apps/frontend/src/lib/i18n/wrapper.ts`**:
  - Added `import type { TranslationKey } from '$lib/types/generated/translationKey';`
  - Changed `export function t(key: string, …)` to `export function t(key: TranslationKey, …)`
  - Deleted `t.get = t;` (zero consumers verified via `grep -rn 't\.get' apps/frontend/src/ tests/` — the only match was the definition line itself; all other `.get*` matches are unrelated SDK calls like `dataRoot.getElection`, `document.getElementById`, etc.)
  - Expanded the JSDoc comment to document the TranslationKey contract.

### Task 1 (consumer-site triage — bundled in same commit)

The signature tightening surfaced **2 new compile errors** at consumer sites. Both were resolved inline; net delta is **0 errors** (post-tightening: 155 / 0, identical to pre-tightening post-P03 baseline).

| Site | Category | Triage |
|------|----------|--------|
| `apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts:14` | (a) Contract type | `I18nContext.t` signature still declared `key: string`; aligned to `TranslationKey`. |
| `apps/frontend/src/routes/+error.svelte:17` | (b) Runtime-built key | Uses `assertTranslationKey(\`error.${page.status}\`)`; widened the utility's return type from `string` to `TranslationKey` so it acts as the documented escape hatch. |

**No NEW escape hatch was introduced** — the existing `assertTranslationKey()` utility (already used by `+error.svelte`) was promoted to the canonical pattern for runtime-built keys. JSDoc updated to document this role.

### Task 2 — Regression-locker test (commit `5522313af`)

- **`apps/frontend/src/lib/i18n/tests/translations.test.ts`**:
  - Added `import { t } from '$lib/i18n/wrapper';` at the top.
  - Appended a new `describe('TranslationKey type safety (CLEAN-04)', …)` block with a single test `t() signature rejects non-TranslationKey strings at compile-time`.
  - Test body uses `// @ts-expect-error` on `t('definitely.not.a.real.key')`. If a future change loosens the wrapper signature back to `key: string`, the directive becomes "unused @ts-expect-error" and the typecheck fails — locking the tightening against regression.
  - Includes `expect(true).toBe(true)` smoke for vitest's "at least one assertion per test" convention; the comment explicitly documents that the **compiler is the real assertion**.

## Verification

| Gate | Pre-P04 | Post-P04 | Status |
|------|---------|----------|--------|
| `yarn workspace @openvaa/frontend check` | 155 errors / 0 warnings | 155 errors / 0 warnings | OK — baseline preserved (zero regression beyond post-P03 ceiling) |
| `yarn workspace @openvaa/frontend test:unit --run -t "TranslationKey"` | n/a (test didn't exist) | 1 passed | OK |
| `yarn workspace @openvaa/frontend test:unit --run` (full) | (Phase 78 baseline) | 38 files / **661 / 661 pass** | OK |
| `grep -q "import type { TranslationKey }" apps/frontend/src/lib/i18n/wrapper.ts` | n/a | OK | OK |
| `grep -q "key: TranslationKey" apps/frontend/src/lib/i18n/wrapper.ts` | n/a | OK | OK |
| `! grep -q "t.get = t" apps/frontend/src/lib/i18n/wrapper.ts` | n/a | OK | OK |
| `grep -q "@ts-expect-error" apps/frontend/src/lib/i18n/tests/translations.test.ts` | n/a | OK | OK |
| `yarn lint:check` | 2 errors (pre-existing) | 2 errors (pre-existing) | OK — both errors unrelated, logged to `deferred-items.md` |

### E2E-08 pairing (Order B per CONTEXT D-12 / D-16)

Ran `tests/tests/specs/voter/voter-locale-switching.spec.ts` against the tightened wrapper using `--workers=1 --project=voter-app`. Result:

```
[1/5] [data-setup] › tests/setup/data.setup.ts:76:1 › import test dataset
[2/5] [voter-app] › voter-locale-switching.spec.ts:53:3 › locale switches via route prefix @voter
[3/5] [voter-app] › voter-locale-switching.spec.ts:85:3 › locale switches via LanguageSelection widget (when present) @voter
[4/5] [data-teardown]
[5/5] [data-teardown variant]
5 passed (5.1s)
```

The Phase 74 P06 locale-switching spec re-validates green against the tightened wrapper — i18n behavior is unchanged, the tightening is purely additive at the type layer. **This is the Plan 04 / E2E-08 Order B pairing result that Plan 07's verification gate should record.**

## Consumer-Site Triage Report (per plan §Output)

- **Total NEW compile errors surfaced by tightening:** 2.
- **Inline-fixed in this plan (category a/c):** 1 — `i18nContext.type.ts` contract alignment.
- **Escape-hatch (category b):** 1 — `+error.svelte` via `assertTranslationKey()` (existing utility; return-type widened, no new utility introduced).
- **Template-built sites needing dedicated `t.template()` introduction:** 0. The single template-built site already uses `assertTranslationKey`; no other callsites in `apps/frontend/src/` triggered an error.
- **SCOPE-OVERFLOW landmine flagged?** No. The `> 10`-site triage threshold was not approached (2 sites total).
- **Genuine missing keys discovered?** None. All consumer sites use valid `TranslationKey` union members or the documented escape hatch.

## Source todo resolution

`.planning/todos/pending/2026-05-09-tighten-i18n-wrapper.md` → `.planning/todos/completed/2026-05-09-tighten-i18n-wrapper.md` (the todo's acceptance criteria — typed key parameter, `t.get` audit/delete, optional `@ts-expect-error` test, baseline preserved — are all satisfied).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Consumer-site contract alignment in `i18nContext.type.ts`**
- **Found during:** Task 1 typecheck pass.
- **Issue:** Tightening `wrapper.ts` `t()` to `key: TranslationKey` caused `i18nContext.type.ts:14` to fail with `Type '(key: TranslationKey, …) => string' is not assignable to type '(key: string, …) => string'` because `I18nContext.t` still declared `key: string`. The wrapper would not be assignable to its own context type, breaking `initI18nContext()` at the `setContext<I18nContext>(…, { t, … })` call.
- **Fix:** Re-aligned `I18nContext.t` declaration to use `TranslationKey`. Single-file, single-line change. JSDoc updated to note the Phase 78 CLEAN-04 reference.
- **Files modified:** `apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts`
- **Commit:** `39e331b8f`

**2. [Rule 2 — Critical Functionality] `assertTranslationKey()` return-type widening to TranslationKey**
- **Found during:** Task 1 typecheck pass.
- **Issue:** `+error.svelte:17` calls `t(key)` where `key` is built via `assertTranslationKey(\`error.${page.status}\`)`. Pre-tightening, the utility returned `string`, which post-tightening was no longer assignable to `t()`'s `TranslationKey` parameter.
- **Fix:** Widened the utility's return type from `string` to `TranslationKey` (with `as TranslationKey` cast inside). The utility is now the **canonical, documented escape hatch** for runtime-built keys — JSDoc explicitly describes this role and warns that the assertion is type-only (the runtime `wrapper.ts` fallback at `return key` is what catches truly missing keys).
- **Files modified:** `apps/frontend/src/lib/i18n/utils/assertTranslationKey.ts`
- **Commit:** `39e331b8f`

### Out-of-scope items logged to `deferred-items.md`

- `tests/tests/specs/candidate/candidate-required-info.spec.ts:140,152` — 2 `playwright/no-raw-locators` lint errors (Phase 77 origin). Unrelated to i18n changes; logged for follow-up.

## Pairing Note for Plan 07

Plan 07's verification gate should cross-reference this SUMMARY's `### E2E-08 pairing` section to confirm the Order B pairing direction (CLEAN-04 lands first, then E2E-08 re-validates). Both halves of the pair are now green; no follow-up action needed at Phase 78 close beyond recording the result in `78-VERIFICATION.md`.

## Follow-ups

- **None required.** The plan's optional v2.10+ follow-up — fold consumer-site cleanup into a broader sweep — is **not needed**: only 2 consumer sites surfaced and both were fixed inline.
- **Lint debt:** 2 pre-existing playwright-locator lint errors logged to `deferred-items.md`; candidate for v2.10+ test-hygiene plan, not in scope for Phase 78.

## Self-Check: PASSED

- Files claimed in SUMMARY: all 4 modified files present and contain claimed changes (verified via grep gates in `<verification>` section).
- Commits claimed: `39e331b8f` (Task 1) and `5522313af` (Task 2) both present in `git log --oneline`.
- Source todo: present at new path `.planning/todos/completed/2026-05-09-tighten-i18n-wrapper.md`; removed from `.planning/todos/pending/`.
- Baseline preservation: `yarn check` post-P04 = 155 errors / 0 warnings = post-P03 baseline (verified twice — once post-Task-1, once post-Task-2).
- Test suite: 661/661 pass; new TranslationKey-tagged test passes.
- E2E-08 pairing: 5/5 passed against tightened wrapper.
