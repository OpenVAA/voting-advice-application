---
phase: 88
fixed_at: 2026-05-28T00:00:00Z
review_path: .planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-04-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 88-04: Code Review Fix Report

**Fixed at:** 2026-05-28T00:00:00Z
**Source review:** .planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (all warnings; 5 info findings out of scope per `fix_scope=critical_warning`)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: `TemplateQuestionInCardContent` is exported but never referenced — dead public-API surface

**Files modified:** `packages/dev-seed/src/templates/types.ts` (deleted)
**Commit:** `cb3398b92`
**Applied fix:** Deleted the entire `packages/dev-seed/src/templates/types.ts` file. Global grep confirmed zero source-code consumers (only the file's own docstring and planning docs referenced the symbol). The file is not re-exported from `packages/dev-seed/src/index.ts` or `templates/index.ts`. `baseV1.ts` works via `as const` structural typing alone — no annotation needed.

### WR-02: `entityFilters.fixture.ts:160` violates the documented rigidity contract — `.catch(() => true)` on a non-`dismissAllDialogs` helper

**Files modified:** `tests/tests/fixtures/entityFilters.fixture.ts`
**Commit:** `2fd1822f5`
**Applied fix:** Replaced `const isExpanded = await toggle.isChecked().catch(() => true);` with a two-line sequence: `await expect(toggle).toBeVisible({ timeout: 2_000 });` followed by an unguarded `const isExpanded = await toggle.isChecked();`. Used inline `2_000` literal (matching the file's existing inline-timeout convention at line 264, since the fixture has no shared `TIMEOUT` constant). Added inline comment referencing 88-04 WR-02 and the rigidity contract.

### WR-03: `entityFilters.fixture.ts:29` — `pickByTarget` has a logic bug AND is dead code, kept alive by a `void` reference

**Files modified:** `tests/tests/fixtures/entityFilters.fixture.ts`
**Commit:** `7e9b0c08e`
**Applied fix:** Deleted the `pickByTarget` function (lines 27-34 pre-fix) and the trailing `void pickByTarget;` noUnusedLocals workaround (lines 292-294 pre-fix). Verified zero callers via grep before deletion — `getFilter()` and `getOption()` both reimplement the count-aware indexer logic correctly inline. The `Target` type alias remains (still used by `getFilter`/`getOption` signatures).

### WR-04: `EntityListControls.svelte:130` — the `entity-list-filter-badge` testid is placed on a `<span>` that the fixture documents as not surviving Svelte 5 snippet compilation

**Files modified:** `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte`, `tests/tests/utils/testIds.ts`, `tests/tests/fixtures/entityFilters.fixture.ts`
**Commit:** `f52526395`
**Applied fix:** Three coordinated edits:
1. Removed the stranded `<span data-testid="entity-list-filter-badge">` wrapper around `<InfoBadge>` in the `{#snippet badge()}` at `EntityListControls.svelte:130`. The snippet now renders `<InfoBadge text={numActiveFilters} />` directly.
2. Removed the `filterBadge: 'entity-list-filter-badge'` entry from the `testIds.voter.results` registry in `testIds.ts:137`.
3. Updated the `getFilterButtonBadge` docstring in `entityFilters.fixture.ts` to note the WR-04 cleanup (previously described the workaround as ongoing; now documents the wrapper has been removed).

The fixture's `getFilterButtonBadge()` helper continues to work — it scopes to the filter button itself (which contains the badge count in its `textContent`), bypassing the testid mechanism entirely.

## Skipped Issues

None — all in-scope warnings were fixed cleanly.

---

_Fixed: 2026-05-28T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
