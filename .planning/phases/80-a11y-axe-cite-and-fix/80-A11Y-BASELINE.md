# Phase 80 Axe Smoke — Post-Fix Baseline (2026-05-13)

## Run conditions

- **Command:** `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1 --reporter=json`
- **HEAD at capture:** `74fe9316e4b7889c446e4aad6b1fadec5a51cfdf` (Plan 01 post-Task-5b + post-Rule-1-spec-fix commit; pre-Task-6 BASELINE/VERIFICATION commit).
- **Frontend:** vite dev server on `localhost:5173` (restarted post-vite-cache wipe + post-build).
- **Backend:** Supabase local (CLI v2.83.0); e2e template seeded via `yarn db:reset && yarn db:seed --template e2e` (23 questions, 18 candidates, 22 nominations) — the canonical `db:*` form per Phase 78 CLEAN-01.
- **Imgproxy state at capture:** ABSENT (Supabase CLI v2.83.0 in this env does not bundle the imgproxy container; storage rendering uses raw URLs without imgproxy signing) — inherits Phase 76 baseline environment exactly.
- **WCAG tags applied:** `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` (WCAG 2.1 AA superset per RESEARCH §Open-Question-3, inherited from Phase 76).
- **Axe-core version:** 4.11.4 (transitive of `@axe-core/playwright@4.11.3`).
- **Determinism check:** 2 successive PLAYWRIGHT_A11Y=1 runs produced byte-identical per-route per-rule violation counts (recorded under §"Determinism check outcome" below). Smoke is DETERMINISTIC at this HEAD.
- **Total violations across all routes:** 0 (all 6 routes clean post-fix).

## Per-route violation breakdown

### Route: home

(0 violations — clean post-fix baseline)

### Route: elections-selector

(0 violations — clean post-fix baseline)

### Route: constituencies-selector

(0 violations — clean post-fix baseline)

### Route: questions

(0 violations — clean post-fix baseline)

### Route: results

(0 violations — clean post-fix baseline)

### Route: voter-detail-drawer

(0 violations — clean post-fix baseline)

## Determinism check outcome

Per CONTEXT D-09 axe smoke determinism contract: 2 successive `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` runs were captured and compared per-route per-rule:

| Route                    | Run 1   | Run 2   | Identical? |
|--------------------------|---------|---------|------------|
| home                     | (none)  | (none)  | YES        |
| elections-selector       | (none)  | (none)  | YES        |
| constituencies-selector  | (none)  | (none)  | YES        |
| questions                | (none)  | (none)  | YES        |
| results                  | (none)  | (none)  | YES        |
| voter-detail-drawer      | (none)  | (none)  | YES        |

**Verdict: 2-run AXE SMOKE DETERMINISM PASS** (per CONTEXT D-09).

## Resolved in Phase 80

| Rule ID                | Original count (nodes)                        | Phase 80 decision                                                                                                                                                                                                                                                                                                          | Modified file                                                                                                                              | Modified line                                                          | Phase 76 baseline row                                                                                  |
|------------------------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| `aria-required-parent` | 4 nodes (results × 2 + voter-detail-drawer × 2) | Task 5b (Rule 4 architectural deviation): added explicit `role="tablist"` to Tabs.svelte's `<ul>` so its `<li role="tab">` children satisfy aria-required-parent (WAI-ARIA APG tabs pattern). D-03 NavItem auto-detect retained as independent a11y improvement for candidate/admin nav surfaces. | `apps/frontend/src/lib/components/tabs/Tabs.svelte` (root cause) + `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` + `navGroupContext.ts` (D-03 nav-surface improvement) | Tabs.svelte:38–39 (role attr); NavItem.svelte:27–68; new file navGroupContext.ts | `76-A11Y-BASELINE.md` §Per-route violation breakdown: results + voter-detail-drawer                  |
| `list`                 | 2 nodes (results × 1 + voter-detail-drawer × 1) | Task 5b same fix: `role="tablist"` overrides the `<ul>`'s implicit `role="list"`, so axe's `list` rule no longer requires `<li>` children to be `listitem` — a tablist by spec contains tabs, not listitems. D-02 NavGroup hoist retained as independent a11y improvement (parent role on outer `<section>` separated from inner `<div role="list">`).                                                                                            | `apps/frontend/src/lib/components/tabs/Tabs.svelte` (root cause) + `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte` (D-02 nav-surface improvement)                  | Tabs.svelte:38–39 (role attr); NavGroup.svelte:25–47 (script + template) | `76-A11Y-BASELINE.md` §Per-route violation breakdown: results + voter-detail-drawer                  |
| `button-name`          | 1 node (voter-detail-drawer × 1)              | D-05A Button.svelte `aria-label` conditional extended to floating-icon variant + D-05B Drawer.svelte floating-icon close button text prop swapped to i18n key `t('common.closeDialog')`.                                                                                                                                  | `apps/frontend/src/lib/components/button/Button.svelte` + `apps/frontend/src/lib/components/modal/drawer/Drawer.svelte`                  | Button.svelte:183; Drawer.svelte:99                                    | `76-A11Y-BASELINE.md` §Per-route violation breakdown: voter-detail-drawer                            |

## Sanitization note

Per Plan 03 T-76-03-01 input-value sanitization (inherited verbatim): this baseline records `rule-id` + `impact` + `node-count` + `helpUrl` ONLY. Raw `node.html` snippets from `axe.violations[].nodes[].html` are NOT committed — they could contain candidate display names, biographies, or other seeded fixture data. Post-fix the violations array is empty across all 6 routes so the sanitization contract is trivially preserved; baseline triagers can re-run the smoke and inspect attachments locally if deeper context is needed for any future regression.

## Scout misdiagnosis correction

Phase 80's discuss-phase scout misdiagnosed the violation source as `NavGroup` / `NavItem` (decisions D-01 through D-04). The actual root cause for the 6 axe-baselined violations (4× aria-required-parent + 2× list across `/results` and voter-detail-drawer) was `Tabs.svelte`'s `<ul>` containing `<li role="tab">` children — a different shared component used at the results layout level.

The corrected understanding landed mid-execution as a **Rule 4 architectural deviation** (checkpoint surface; user approved Option A — add 1-line Tabs.svelte fix in-plan as Task 5b). Tasks 2–3's NavGroup / NavItem changes remain valid as independent a11y improvements for candidate / admin nav surfaces (`LanguageSelection.svelte` titled NavGroup, orphan close-buttons in `CandidateNav` / `AdminNav`); they are NOT in the current axe-baselined route set but they benefit from the architectural pattern.

The Task 5b fix (`role="tablist"`) is a single-line WCAG-spec-compliant fix (WAI-ARIA APG tabs pattern) that resolves both `aria-required-parent` (tab role → required parent role: tablist) and `list` (the `<ul>`'s implicit `role="list"` is overridden by the explicit `role="tablist"`, so axe's list-children check no longer fires).

A spec-side Rule 1 follow-on deviation (commit `74fe9316e`) re-pointed the `a11y-smoke.spec.ts` settle-wait from `getByRole('list').first()` → `getByRole('tablist').first()` (same DOM target, semantically correct role per the new attribute). This kept the spec functional after Task 5b.

## Cross-Links

- **Phase 76 backward link (D-07 contract):** `.planning/milestones/v2.9-phases/76-profile-a11y/76-A11Y-BASELINE.md` — first-run baseline (5 violations: results=2, voter-detail-drawer=3) preserved as historical evidence.
- **Phase 80 CONTEXT decisions:** `.planning/phases/80-a11y-axe-cite-and-fix/80-CONTEXT.md` D-01 through D-15.
- **Phase 80 research:** `.planning/phases/80-a11y-axe-cite-and-fix/80-RESEARCH.md` Patterns 1–3 + Pitfalls 1–6.
- **Phase 80 patterns map:** `.planning/phases/80-a11y-axe-cite-and-fix/80-PATTERNS.md`.
- **Phase 80 verification verdict:** `.planning/phases/80-a11y-axe-cite-and-fix/80-VERIFICATION.md`.
- **Cite-and-fix follow-up todo (now closed by Phase 80):** `.planning/todos/pending/2026-05-12-a11y-axe-first-run-violations.md`.
- **Phase 80 Plan 01 spec source:** `tests/tests/specs/a11y/a11y-smoke.spec.ts` (per-rule trio + global-zero regression gate).
