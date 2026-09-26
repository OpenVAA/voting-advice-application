---
phase: "165"
slug: "results-navigation-redraw"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: true) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-23"
---

# Phase 165 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `165-RESEARCH.md` § Validation Architecture, which measured every
> command and file below on this worktree. Requirement IDs RNAV-01..06 are the ones
> decision D-22 registers during this phase; they map one-to-one onto the six ROADMAP
> success criteria.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3 (`environment: 'jsdom'`) for unit; `@playwright/test` 1.58.2 for E2E |
| **Config file** | `apps/frontend/vitest.config.ts` · `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` |
| **Full suite command** | `yarn test:unit`, then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` |
| **Estimated runtime** | unit ~60s · full E2E several minutes |

**Type and lint gates** (run alongside, never through a pipe — exit status is read directly):
`yarn workspace @openvaa/frontend check` · `yarn lint:check`

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/frontend test:unit` + `yarn workspace @openvaa/frontend check`
- **After every plan wave:** `yarn test:unit` + `yarn lint:check` + this phase's Playwright project
- **Before `/gsd-verify-work`:** full E2E suite green via `tests/scripts/e2e-run.sh`, **then** `visual-regression` in the pinned container per D-19
- **Max feedback latency:** ~60 seconds for the per-task loop

**The E2E Hard Rule binds every row below:** a failing E2E test is a cardinal failure, there are
no known-flaky exemptions, and a "did not run" cell counts as a failure, not a pass.

---

## Per-Task Verification Map

Mapped by requirement. Status audited 2026-09-24 by `/gsd-validate-phase 165`: unit rows re-run live (23/23); e2e rows rest on gate G-7 (171/0/0/0/0 at `9536af4e7`, no `apps`/`packages`/`tests` change since), visual on G-9 (7/0, 4/4 baselines), a11y on G-8 (18/0).

| Requirement | Behaviour | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|---|
| RNAV-01 | `(located)` load reads no URL property tracked | — | N/A | unit | `cd apps/frontend && npx vitest run "src/routes/(voters)/(located)/layout.tracking.test.ts"` | ✅ (control replaced — D-04) | ✅ green |
| RNAV-01 | The recording Proxy catches a tracked read (negative control) | — | N/A | unit | same file | ✅ | ✅ green |
| RNAV-02 | Scroll survives open / close / entity-tab switch from a scrolled start | — | N/A | e2e | `npx playwright test -c ./tests/playwright.config.ts --project=voter-results-redraw` | ✅ | ✅ green |
| RNAV-03 | `isOverlayNavigation` contract (4 param combinations) | — | N/A | unit | `cd apps/frontend && npx vitest run "src/lib/utils/viewTransition.test.ts"` | ✅ | ✅ green |
| RNAV-03 | No document VT for overlay navigations; any VT with `dialog[open]` carries no named groups | — | N/A | e2e | same project as RNAV-02 | ✅ | ✅ green |
| RNAV-04 | Every URL shape the app emits routes to the leaf page and renders one list instance | T-165-02 | Attacker-supplied segment still 404s via `etPl`/`etSg` | e2e | same project (node-identity assertions, D-18) | ✅ | ✅ green |
| RNAV-04 | Both `+page.ts` guards still fire (404 on matcher fallthrough, 307 on entity/id coupling) | T-165-02 | Second layer of segment validation preserved (D-10) | unit | `cd apps/frontend && npx vitest run "src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/page.guards.test.ts"` | ✅ | ✅ green |
| RNAV-04 | No navigation loop is reintroduced by any new URL emitter | T-165-03 | Post-88-02 force-fill stays closed (D-08, D-09) | e2e | same project | ✅ | ✅ green |
| RNAV-05 | Entity→entity swap without reopening; animated close | — | N/A | e2e | `--project=voter-results-redraw` | ✅ | ✅ green |
| RNAV-05 | Question-info drawer served by the host | — | N/A | e2e | `--project=perm-interactive-info` | ✅ (host containment assertions added in 165-05) | ✅ green |
| RNAV-05 | A hosted payload whose opener unmounts mid-close does not hang the dialog | T-165-04 | No SSR write of the host singleton | e2e | same project; assert `dialog[open]` absent after close | ✅ | ✅ green |
| RNAV-06 | No `lib/spike` import and no `results-layered` directory under `apps/frontend/src` | — | N/A | unit | `cd apps/frontend && npx vitest run "src/lib/_guards/spike-scaffolding.test.ts"` | ✅ | ✅ green |
| all | No visual regression on the two `voter-results-*` baselines | — | N/A | visual e2e | `npx playwright test -c ./tests/playwright.config.ts --project=visual-regression` — **pinned container only** | ✅ baselines exist | ✅ green |
| all | No new WCAG 2.1 AA violation on the results routes | — | N/A | a11y e2e | `--project=a11y-smoke` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `apps/frontend/src/lib/utils/viewTransition.test.ts` — RNAV-03 unit half (D-05)
- [x] `apps/frontend/src/lib/_guards/spike-scaffolding.test.ts` — RNAV-06 (D-20)
- [x] `tests/tests/specs/voter/voter-results-redraw.spec.ts` — RNAV-02/03/04/05 e2e
- [x] A new project block in `tests/playwright.config.ts` for that spec — **a spec with no project runs from no command**
- [x] A fixture for the VT log + scroll readers, composed in `tests/tests/fixtures/voter/views.ts` (the `resultsPage` rigidity contract forbids bolting them on)
- [x] The replacement negative control in `layout.tracking.test.ts` (D-04)
- [x] `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` (D-17)
- [x] Framework install: **none needed**

---

## Negative Controls (D-17 — four pairs planned; executed as NC-1..NC-7 in `165-NEGATIVE-CONTROL.md`)

Each guard must be observed failing against a realistic injected regression before it counts as a
guard. Recorded in `165-NEGATIVE-CONTROL.md` with command, exit code, counts and the injection
text verbatim. Research recommends NC-2/3/4 share one plan so the dev server starts once.

| ID | Guard | Realistic injection |
|---|---|---|
| NC-1 | loader untrack | restore the tracked `url.pathname` read in `(located)/+layout.ts` |
| NC-2 | overlay-VT skip | make `isOverlayNavigation` return `false` |
| NC-3 | name-strip | **drop the `!important`** from `html.vt-no-names *` — the two named elements carry inline `style=` attributes, so `!important` is the load-bearing token and dropping it is the mistake a real editor makes (deleting the whole rule is the easier, less realistic injection) |
| NC-4 | `noScroll` | remove `{ noScroll: true }` from the entity-tab change handler |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual-baseline diffs are *explained*, not blessed | all (D-19) | Judgement: an unexplained diff is a defect to investigate, not a baseline to re-capture | Run `--project=visual-regression` in `mcr.microsoft.com/playwright:v1.58.2-noble`, `--platform linux/amd64`. Re-capture only when the diff traces to an intended change. Reclaim disk first — ENOSPC voids the run rather than reddening it |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-24 (validate-phase audit; UAT 11/11 in `165-UAT.md`)

---

## Validation Audit 2026-09-24

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 14 map rows COVERED. Unit guards re-run live this session: `viewTransition` 5, `page.guards` 8, `spike-scaffolding` 5, `layout.tracking` 5 — 23/23. E2E/visual/a11y rows accepted from gates G-7/G-8/G-9 (`165-NEGATIVE-CONTROL.md` § 18) with `git diff --name-only 9536af4e7..HEAD -- apps packages tests` empty. Known bounds stay recorded in REQUIREMENTS.md RNAV-01..06, not re-classed as gaps.
