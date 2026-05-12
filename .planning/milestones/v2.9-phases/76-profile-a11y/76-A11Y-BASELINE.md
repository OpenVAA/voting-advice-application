# Phase 76 Axe Smoke — First-Run Baseline (2026-05-12)

## Run conditions

- **Command:** `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1 --reporter=json`
- **HEAD at capture:** `f205b114f3dff28fec93e970ded0ef4b27ade171` (post-Task-2 parity-output commit; pre-Task-3 baseline commit).
- **Frontend:** vite dev server on `localhost:5173` (restarted post-vite-cache wipe + post-build).
- **Backend:** Supabase local (CLI v2.83.0); e2e template seeded via `yarn supabase:reset && yarn dev:seed --template e2e` (22 questions, 18 candidates, 22 nominations).
- **Imgproxy state at capture:** ABSENT (Supabase CLI v2.83.0 in this env does not bundle the imgproxy container; storage rendering uses raw URLs without imgproxy signing). The 5 routes scanned by the smoke do NOT depend on imgproxy-served images at the rendered moment (home/selectors/questions render no entity portraits; results renders entity-card list with portrait fallbacks; voter-detail-drawer renders portrait but axe didn't surface image-alt violations against the rendered DOM).
- **WCAG tags applied:** `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` (WCAG 2.1 AA superset per RESEARCH §Open-Question-3).
- **Axe-core version:** 4.11.4 (transitive of `@axe-core/playwright@4.11.3`).
- **Determinism check:** 2 successive PLAYWRIGHT_A11Y=1 runs produced byte-identical per-route per-rule violation counts (recorded under §"Determinism check outcome" below). Smoke is DETERMINISTIC at this HEAD.
- **Total violations across all routes:** 5 (results=2 + voter-detail-drawer=3; all other 4 routes=0).

## Per-route violation breakdown

### Route: home

(0 violations — clean baseline)

### Route: elections-selector

(0 violations — clean baseline)

### Route: constituencies-selector

(0 violations — clean baseline)

### Route: questions

(0 violations — clean baseline)

### Route: results

| Rule ID                | Impact   | Count (nodes) | helpUrl                                                                                |
|------------------------|----------|---------------|----------------------------------------------------------------------------------------|
| `aria-required-parent` | critical | 2             | https://dequeuniversity.com/rules/axe/4.11/aria-required-parent?application=playwright |
| `list`                 | serious  | 1             | https://dequeuniversity.com/rules/axe/4.11/list?application=playwright                 |

**Total: 2 violations (3 nodes).**

### Route: voter-detail-drawer

| Rule ID                | Impact   | Count (nodes) | helpUrl                                                                                |
|------------------------|----------|---------------|----------------------------------------------------------------------------------------|
| `aria-required-parent` | critical | 2             | https://dequeuniversity.com/rules/axe/4.11/aria-required-parent?application=playwright |
| `button-name`          | critical | 1             | https://dequeuniversity.com/rules/axe/4.11/button-name?application=playwright          |
| `list`                 | serious  | 1             | https://dequeuniversity.com/rules/axe/4.11/list?application=playwright                 |

**Total: 3 violations (4 nodes).**

## Determinism check outcome

Per CONTEXT D-09 axe smoke determinism contract: 2 successive `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` runs were captured and compared per-route per-rule:

| Route                    | Run 1                                               | Run 2                                               | Identical? |
|--------------------------|-----------------------------------------------------|-----------------------------------------------------|------------|
| home                     | (none)                                              | (none)                                              | YES        |
| elections-selector       | (none)                                              | (none)                                              | YES        |
| constituencies-selector  | (none)                                              | (none)                                              | YES        |
| questions                | (none)                                              | (none)                                              | YES        |
| results                  | `aria-required-parent×2, list×1`                    | `aria-required-parent×2, list×1`                    | YES        |
| voter-detail-drawer      | `aria-required-parent×2, button-name×1, list×1`     | `aria-required-parent×2, button-name×1, list×1`     | YES        |

**Verdict: 2-run AXE SMOKE DETERMINISM PASS** (per CONTEXT D-09).

## Sanitization note

Per Plan 03 T-76-03-01 input-value sanitization: this baseline records `rule-id` + `impact` + `node-count` + `helpUrl` ONLY. Raw `node.html` snippets from `axe.violations[].nodes[].html` are NOT committed — they could contain candidate display names, biographies, or other seeded fixture data. Baseline triagers can re-run the smoke and inspect attachments locally if deeper context is needed.

## Cross-route observations

- **`aria-required-parent` (critical)** appears on BOTH `results` AND `voter-detail-drawer` — same rule, likely same root cause in the candidate-list / entity-card list rendering. Fix-by-component (one Svelte component fix probably resolves both routes' instances).
- **`list` (serious)** appears on BOTH `results` AND `voter-detail-drawer` — same rule, same likely shared component. Fix-by-component pattern again.
- **`button-name` (critical)** is unique to `voter-detail-drawer` — likely the drawer-open / drawer-close icon-button needs an accessible name. Per-component fix scoped to the drawer's button surface.

The 5 total violations resolve to ~3 distinct root causes (aria-required-parent + list + button-name), because the same rules surface across multiple routes from shared component code. Cite-and-fix scope is therefore SMALLER than the 5-violation surface count suggests.

## Cite-and-fix scope

See `.planning/todos/pending/2026-05-12-a11y-axe-first-run-violations.md` for the downstream cite-and-fix scope, per-rule effort sizing, and routing recommendation (v2.10+ accessibility milestone candidate).

Per ROADMAP A11Y-03: "wiring + first-run baseline only" — violation triage is OUT OF SCOPE for v2.9 (this phase).

## Cross-Links

- Plan 03 SUMMARY (axe smoke wiring): `.planning/phases/76-profile-a11y/76-03-SUMMARY.md` — confirms infrastructure first-run counts (results=2, voter-detail-drawer=3 — match this baseline exactly).
- Plan 04 PLAN (this baseline-capture mandate): `.planning/phases/76-profile-a11y/76-04-PLAN.md` Task 3.
- Plan 03 spec source: `tests/tests/specs/a11y/a11y-smoke.spec.ts`.
- ROADMAP A11Y-03 SC #3 — "wiring + first-run baseline only".
- CONTEXT D-09 axe smoke determinism contract — "2× successive scans on the same baseline must produce identical violation lists".
