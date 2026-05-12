# A11Y axe smoke first-run violations — cite-and-fix scope

**Date:** 2026-05-12
**Source phase:** 76-profile-a11y (Plan 04 Task 3 close)
**Scope:** Cite-and-fix the 5 WCAG 2.1 AA violations surfaced by the Phase 76 A11Y-03 axe smoke first-run baseline (`.planning/phases/76-profile-a11y/76-A11Y-BASELINE.md`).
**Effort:** ~1-2 plans (small — 3 distinct rule-IDs across 2 routes; 2 of 3 rules are shared-component fixes that resolve in both routes simultaneously).
**Source references:**
- Phase 76 ROADMAP A11Y-03 SC #3 — "Violations surfaced by the smoke are documented in a follow-up todo at .planning/todos/pending/ for cite-and-fix in a future phase (not in scope for v2.9 — wiring + first-run baseline only)" — this todo is the literal A11Y-03 deliverable.
- Phase 76 baseline artifact: `.planning/phases/76-profile-a11y/76-A11Y-BASELINE.md` — single source of truth for per-route per-rule breakdown.
- Phase 76 VERIFICATION.md SC #3 PASS on cite-and-fix scope clause.
- Phase 76 CONTEXT D-07 — 5-route smoke surface decision.
- Phase 75 P02b multi-choice deferred-todo precedent: `.planning/todos/pending/2026-05-12-qspec-02-multi-choice-categorical-variant.md`.

## Why deferred

Per ROADMAP A11Y-03 framing: "wiring + first-run baseline only". Cite-and-fix is explicitly OUT OF v2.9 scope. STATE.md carries `Cite-and-fix WCAG violations from v2.9 A11Y-03 axe smoke first-run` as a v2.10+ candidate (or as a standalone short milestone).

Phase 76 is a coverage/wiring phase — adding component-level a11y fixes (DOM restructure, aria attribute additions, button name additions) is feature-class work that exceeds the coverage-phase guardrail. A dedicated accessibility-focused milestone in v2.10 (or later) is the appropriate home.

## Baseline summary (transcribed from `76-A11Y-BASELINE.md`)

| Route                    | Violations | Rule-IDs                                                 |
|--------------------------|------------|----------------------------------------------------------|
| home                     | 0          | (none)                                                   |
| elections-selector       | 0          | (none)                                                   |
| constituencies-selector  | 0          | (none)                                                   |
| questions                | 0          | (none)                                                   |
| results                  | 2          | `aria-required-parent` × 2 nodes, `list` × 1 node        |
| voter-detail-drawer      | 3          | `aria-required-parent` × 2 nodes, `button-name` × 1 node, `list` × 1 node |
| **Total**                | **5**      | **3 distinct rule-IDs across 2 routes**                  |

Most common rule-IDs (across all routes): `aria-required-parent` (4 nodes), `list` (2 nodes), `button-name` (1 node).

## Effort sizing per rule-ID class

### `aria-required-parent` (critical, 4 nodes across results + voter-detail-drawer)

- **Effort: small (1 plan).** Rule asserts that elements with implicit roles requiring a parent role (e.g., `listitem` → `list`) are nested correctly. Likely root cause: `<li>` rendered outside `<ul>` / `<ol>`, OR `role=listitem` set on an element whose parent doesn't have `role=list`. Common in card-grid layouts where ARIA semantics drift from native HTML semantics.
- **Investigation path:** Inspect the entity-card / candidate-list rendering component. Both `results` AND `voter-detail-drawer` show this rule — likely the same shared component (entity-card list at `apps/frontend/src/lib/voter/components/entity-list/` or similar).
- **Fix shape:** Either wrap the offending elements in a proper `<ul>` / `<ol>`, OR remove the `role=listitem` ARIA override.

### `list` (serious, 2 nodes across results + voter-detail-drawer)

- **Effort: small (1 plan; possibly same plan as aria-required-parent above).** Rule asserts that elements with role `list` only contain elements with role `listitem`. Often surfaces alongside `aria-required-parent` because both indicate ARIA-list-structure breakage.
- **Investigation path:** Same component as `aria-required-parent` — likely the same fix resolves both rules simultaneously.

### `button-name` (critical, 1 node on voter-detail-drawer)

- **Effort: small (1 plan).** Rule asserts that `<button>` elements have an accessible name (visible text OR `aria-label` OR `aria-labelledby`). The drawer-specific instance is likely an icon-button (close-drawer / next-entity-arrow) without a `aria-label` for screen readers.
- **Investigation path:** Inspect the drawer component (`apps/frontend/src/lib/voter/components/voter-detail/` or similar) for icon-only buttons. Add `aria-label` strings (i18n-aware via `t('a11y.closeDrawer')` etc.).

### Total effort estimate

**1-2 plans** to resolve all 5 violations:
- **Plan A (medium-small):** Fix `aria-required-parent` + `list` in entity-card list component (likely 1 component, 1 commit, ~20-50 LOC). Re-run axe smoke; expect both `results` and `voter-detail-drawer` violations for these 2 rules to drop to 0.
- **Plan B (small):** Fix `button-name` in drawer component (1 commit, ~5-15 LOC for `aria-label` additions + i18n keys). Re-run axe smoke; expect `voter-detail-drawer` `button-name` violation to drop to 0.

OR roll both into a single Plan if the fix surfaces are co-located (same parent directory).

## Scope when picked up

1. **Read `76-A11Y-BASELINE.md`** for the full per-route per-rule breakdown + helpUrls.
2. **Triage by rule-ID + impact** (critical first: `aria-required-parent` + `button-name`; then serious: `list`).
3. **Per rule-ID:** identify root component(s) at fault via `git grep` + axe trace inspection (`yarn playwright show-trace tests/playwright-results/<axe-spec>/trace.zip`). Author Svelte-component-level fixes (additive aria attributes, restructured DOM where needed).
4. **Add regression assertions to the axe smoke** AFTER fixes land:
   ```ts
   // In a11y-smoke.spec.ts (post-fix)
   expect(results.violations.filter(v => v.id === 'aria-required-parent')).toHaveLength(0);
   expect(results.violations.filter(v => v.id === 'button-name')).toHaveLength(0);
   expect(results.violations.filter(v => v.id === 'list')).toHaveLength(0);
   ```
   These assertions land per-route as each fix completes; once all 5 violations are resolved, the smoke can assert `expect(results.violations).toHaveLength(0)` globally.
5. **Re-run the axe smoke after each fix** to verify the violation count for that rule drops to 0:
   ```bash
   PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1
   ```
6. **Update `76-A11Y-BASELINE.md`** (or author a successor `<phase>-A11Y-BASELINE.md` for the cite-and-fix phase) with the post-fix counts. The successor baseline should show 0 violations across all 5 routes.
7. **Capture the resolution outcome in a phase VERIFICATION.md** following the Phase 76 shape (5 SCs assessed; 0 follow-up todos; cite-and-fix complete).

## Why now (NOT v2.9)

Per ROADMAP A11Y-03 SC #3 explicit out-of-scope clause + ROADMAP §"Out of Scope" + STATE.md carry-forward entry: cite-and-fix is scheduled for a future milestone. v2.9 is the wiring + baseline phase. The clean separation lets the v2.9 A11Y-03 deliverable ship with verified determinism + first-run baseline (the wiring contract) without dragging in component-level fixes (the fix contract).

## Dependencies

- None architectural. Aligns with the WCAG 2.1 AA compliance commitment in CLAUDE.md ("Test accessibility - app must be WCAG 2.1 AA compliant").
- Coordinates with Phase 78 CLEAN-04 (i18n wrapper tightening) — the `button-name` fix's `aria-label` additions should use the tightened i18n wrapper (Order B precedent: land cite-and-fix BEFORE or AFTER CLEAN-04, then revalidate against the tightened wrapper).
- Coordinates with future a11y phases — the regression assertions added at the cite-and-fix close form the foundation for an opt-in WCAG AAA tier (`'wcag2aaa'` tag added to AxeBuilder.withTags) if a future a11y milestone wants tighter coverage.

## Acceptance Criteria

- [ ] All 5 violations resolved (`aria-required-parent` × 2 in results, × 2 in voter-detail-drawer; `list` × 1 in results, × 1 in voter-detail-drawer; `button-name` × 1 in voter-detail-drawer).
- [ ] Re-run axe smoke produces 0 violations across all 5 (or 6) routes.
- [ ] Regression assertions added to `tests/tests/specs/a11y/a11y-smoke.spec.ts` so future violations of the same rules fail-loud immediately.
- [ ] Successor baseline artifact authored (or `76-A11Y-BASELINE.md` updated) with post-fix counts (0 across all routes).
- [ ] Phase VERIFICATION.md authored per Phase 76 shape; cite-and-fix scope marked CLOSED; no new follow-up todos for the same surface.

## Source references

- Phase 76 ROADMAP A11Y-03 SC #3 — `.planning/ROADMAP.md` line 219.
- Phase 76 CONTEXT D-07 — 5-route surface decision.
- Phase 76 RESEARCH §"Cite-and-fix follow-up todo" — pre-execution scope sketch.
- Phase 76 VERIFICATION.md SC #3 — PASS on cite-and-fix scope clause; THIS todo cited as the deliverable.
- `76-A11Y-BASELINE.md` — per-route per-rule baseline (single source of truth).
- ROADMAP §"Out of Scope" — explicit deferral clause.

## Cross-Links

- `tests/tests/specs/a11y/a11y-smoke.spec.ts` — Phase 76 P03 smoke spec (extend with regression assertions at cite-and-fix close).
- `tests/playwright.config.ts` — `PLAYWRIGHT_A11Y` conditional-project block (no changes needed at cite-and-fix; smoke remains opt-in).
- `package.json` — `@axe-core/playwright@^4.11.3` already installed; no new deps.
- `apps/frontend/src/lib/voter/components/` — likely fix surfaces (entity-list + voter-detail-drawer components).
- ROADMAP §"v2.10+" placeholder — recommended landing milestone.
