---
phase: 119-e2e-fixtures-helpers-seed
fixed_at: 2026-06-15T13:00:00Z
review_path: .planning/phases/119-e2e-fixtures-helpers-seed/119-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 3
skipped: 3
status: partial
---

# Phase 119: Code Review Fix Report

**Fixed at:** 2026-06-15T13:00:00Z
**Source review:** .planning/phases/119-e2e-fixtures-helpers-seed/119-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope (Critical + Warning): 6 (WR-01 … WR-06; 0 critical)
- Fixed: 3 (WR-01/WR-02 combined commit, WR-04, WR-05)
- Skipped / deferred: 3 (WR-03 false positive, WR-06 deferred, WR-05 partial — docstring-only)

Info findings (IN-01 … IN-05) were out of scope (fix_scope = critical_warning) and not attempted.

## Verification gates (all green)

Touched `packages/dev-seed/**` (help.ts, help.test.ts, seed.ts):
- `yarn workspace @openvaa/dev-seed test:unit` → **441 passed (42 files)**.
- `yarn workspace @openvaa/dev-seed lint:check` → **0 errors** (15 pre-existing `ctx` unused-var WARNINGS in untouched generators only).

Touched `tests/tests/**` (popupNotice.fixture.ts):
- `yarn typecheck:tests` → **exit 0**.
- locator-guard `yarn lint:check` (tests workspace, full turbo) → **0 errors**, all 11 tasks successful.

Working tree ends clean apart from the pre-existing unstaged `package.json` modification (left untouched per instructions). STATE.md / ROADMAP.md not modified.

## Fixed Issues

### WR-01 + WR-02: `--help` advertised non-existent `e2e` template; test pinned the stale name

**Files modified:** `packages/dev-seed/src/cli/help.ts`, `packages/dev-seed/tests/cli/help.test.ts`
**Commit:** ec1b4d866
**Applied fix:** Replaced the stale `e2e` line in the USAGE "Built-in templates" block with the actually-registered invocation names — `e2e/base` (canonical Playwright base dataset), a `perm-*` family line pointing at `templates/index.ts`, and `show-feedback-survey`. Updated `help.test.ts` so the assertion matches `/^\s+e2e\/base\s+/m` instead of the unresolvable bare `e2e`. The two were committed together because the test pin (WR-02) would otherwise break on the WR-01 fix; the dev-seed unit suite stays green (441 pass).

### WR-04: `--seed` accepted partially-numeric values via the wrong numeric guard

**Files modified:** `packages/dev-seed/src/cli/seed.ts`
**Commit:** f665b118b
**Applied fix:** Replaced `Number.isFinite(Number.parseInt(...))` (which only ever rejected `NaN`, so `--seed 12abc` was silently accepted as `12`) with a strict `/^-?\d+$/` whole-token guard run BEFORE `parseInt`. Non-integer/garbage input now exits 1 with the existing error message; valid integers (including negatives) behave exactly as before, preserving the determinism contract.

### WR-05 (partial): `popupNotice.dismiss()` locale-coupling documented

**Files modified:** `tests/tests/fixtures/shared/popupNotice.fixture.ts`
**Commit:** e30bd1f3a
**Applied fix:** Applied the reviewer's "at minimum" option — softened the fixture header's blanket "All locators are testid-anchored (locale-resilient)" claim (it now scopes that guarantee to the popup ROOT locators) and added an explicit "Locale caveat (WR-05)" block documenting that `dismiss()`'s close-button role-name regex matches the English `t('common.close')` label only, holds under the default-English E2E suite, and should later be re-anchored to a stable Alert `data-testid`. The full locale-agnostic fix would require adding a NEW production `data-testid` to the shared `Alert.svelte` close control — flagged out of scope for a fix pass by the task guidance — so it is documented as a follow-up rather than applied. No locator change was made, so the no-restricted-locators guard and `typecheck:tests` stay green.

## Skipped / Deferred Issues

### WR-03: `--likert-only` still documented in CLAUDE.md — SKIPPED (verified false positive)

**File:** `packages/dev-seed/src/cli/seed.ts` (per review; the finding targets CLAUDE.md docs)
**Reason:** False positive. The on-disk `CLAUDE.md` contains ZERO `likert-only` references (`grep -c likert-only CLAUDE.md` → 0; confirmed). Plan 119-01 already scrubbed every `--likert-only` paragraph and example. The reviewer read a stale pre-119-01 snapshot. No edit needed.
**Original issue:** `--likert-only` CLI flag was removed but CLAUDE.md (flag list, dedicated note, arg-forwarding caveat, seeding example) still documents it.

### WR-06: `default.ts` `results` block omits canonical-default keys — DEFERRED

**File:** `packages/dev-seed/src/templates/default.ts:251-260`
**Reason:** Deferred — operator-verified UNBLK-03 surface with no concrete key to add. Cross-checking `default.ts`'s `results` block against the canonical default shape in `packages/app-shared/src/settings/dynamicSettings.ts:60-68` shows the mirror is ALREADY complete: the canonical `results` defines exactly four keys (`cardContents`, `showFeedbackPopup` 180, `showSurveyPopup` 500, `sections`) and all four are present and matching in `default.ts` (it only diffs `sections` to add `'alliance'`, by design). There is no currently-omitted key to restore. The only residual is the reviewer's forward-looking "latent regression vector" if a future `results.*` default key is added — adding speculative keys now (or the richer `e2e/base` `cardContents.candidate` shape, which is a different template's choice, not a missing key) would risk regressing the operator-verified parties/candidates `/results` rendering for UNBLK-03. Deferred for running-app re-verification rather than silently altering verified seed output. The reviewer's alternative (a test asserting `default` `results` is a key-superset of the TS default) is a safe future hardening that does not touch the verified output.
**Original issue:** `mergeAppSettings` full-replaces the `results` root key, so an incomplete mirror would silently drop any future-added `results.*` default for the `default` dataset.

---

_Fixed: 2026-06-15T13:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
