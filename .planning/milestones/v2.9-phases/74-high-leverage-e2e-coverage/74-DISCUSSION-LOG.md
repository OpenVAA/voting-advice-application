# Phase 74: High-Leverage E2E Coverage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 74-high-leverage-e2e-coverage
**Mode:** `--auto` (single-pass, fully autonomous; recommended option auto-selected per gray area per `workflows/discuss-phase/modes/auto.md`)
**Areas discussed (all auto-selected per `--auto`):** Plan grouping, Variant fixture strategy, E2E-01 single-locale path, E2E-04 selector matrix scope, E2E-08 / CLEAN-04 ordering, E2E-05 voter-answer fixture extension, E2E-03 + E2E-06 colocation, Determinism contract + parity-gate regen, Locator + lint convention, Vite-cache wipe + end-of-phase gate, Spec file layout.

---

## Plan grouping + sequence (→ D-01)

| Option | Description | Selected |
|--------|-------------|----------|
| 1 plan per E2E-0X (8 plans) | One plan per requirement; large plan count | |
| 7 plans, E2E-05+E2E-07 bundled, verification folded in final plan | Voter-detail extension bundled (both extend same spec); verification co-located | ✓ (recommended) |
| 3 broad plans (variants / voter-flow / candidate+locale) | Larger plans; harder to parallelize | |

**Auto-selection:** 7 plans, E2E-05 + E2E-07 bundled, verification folded into final plan.
**Rationale:** ROADMAP estimate "~6-8 plans"; the bundling matches the explicit ROADMAP hint ("E2E-05 + E2E-07 may bundle since both extend voter-detail.spec.ts"). Verification co-located with the last substantive plan matches the v2.8 P72 hygiene-trio pattern.

---

## Variant fixture strategy (→ D-02, D-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Add 3 new variant projects (low-min-answers, 1e-Nc, Ne-Nc) following existing variant-multi-election shape | Mirrors Phase 59/63 convention; isolates new fixtures | ✓ (recommended) |
| Single mega-variant covering all 3 cases | Smaller Playwright project count; harder to debug | |
| Adapt existing variants in place | No new templates; conflict with existing CONF-01..CONF-06 invariants | |

**Auto-selection:** Add 3 new variant projects; reuse existing variants where the matrix cell already has a fixture (per D-05).

---

## E2E-01 single-locale path (→ D-04)

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Build/serve frontend with patched staticSettings.ts for a single-locale variant project | Closes the contract fully; requires CI plumbing | |
| (b) Component-level assertion via unit test | Out of Playwright scope; weaker contract | |
| (c) Defer single-locale assertion; assert multilocale path only; capture follow-up todo | PASS-WITH-DEFERRAL on SC #1; bounded scope | ✓ (recommended) |

**Auto-selection:** Option (c) — defer.
**Rationale:** Multilocale is the higher-risk surface (post-v2.8 code with no E2E gate today); single-locale is the lower-risk absence-of-feature case. Bounded scope keeps Phase 74 deliverable.

---

## E2E-04 selector matrix scope (→ D-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Add 4 new variant projects (one per non-default cell) | Maximum isolation; large project count | |
| Add 2 new variants + reuse 3 existing (1e×1c base, multi-election, startfromcg) | Lean; reuses existing test infra | ✓ (recommended) |
| Single matrix-driven spec with no new variants | Cannot exercise the per-cell fixture state difference | |

**Auto-selection:** Add 2 new variants (`variant-1e-Nc` + `variant-Ne-Nc`); reuse 3 existing.

---

## E2E-08 / CLEAN-04 ordering (→ D-06)

| Option | Description | Selected |
|--------|-------------|----------|
| Order A — Phase 78 first (CLEAN-04 tightens i18n wrapper, then E2E-08 covers tightened wrapper) | Cleaner direction; blocks 8 coverage gaps on 1 refactor | |
| Order B — Phase 74 first (E2E-08 covers pre-tightening wrapper; re-validates after CLEAN-04 lands) | Unblocks coverage work; tightening re-validation is mechanical | ✓ (recommended) |

**Auto-selection:** Order B.
**Rationale:** Phase 74 is content-heavy (8 reqs); CLEAN-04 is a surface change. Locking Phase 74 first avoids blocking coverage on typing cleanup.

---

## E2E-05 voter-answer fixture extension (→ D-07)

| Option | Description | Selected |
|--------|-------------|----------|
| Extend `packages/dev-seed/src/templates/e2e.ts` voter dataset to include 4-case answer mix | No new Playwright project; in-template extension | ✓ (recommended) |
| New variant template `variant-voter-detail-cases` | Isolated; adds Playwright project overhead | |
| In-spec runtime fixture mutation | Test-time mutation is hard to keep deterministic | |

**Auto-selection:** Extend the default `e2e` template.

---

## E2E-03 + E2E-06 colocation (→ D-08)

| Option | Description | Selected |
|--------|-------------|----------|
| Bundle E2E-03 + E2E-06 in 1 plan (Plan 03) | Both are voter-flow sequence tests; shared shape | ✓ (recommended) |
| Separate plans (1 per requirement) | Larger plan count; harder to land in parallel | |

**Auto-selection:** Bundle.

---

## Determinism contract + parity-gate regen (→ D-09, D-10)

| Option | Description | Selected |
|--------|-------------|----------|
| Re-run parity-script regen at end of phase regardless | Maximum verification but unnecessary if no new specs land in DATA_RACE | |
| Conditional regen — only if new variant projects added OR cold-start pass/fail changes | Aligned with Phase 73 D-09 convention; lean | ✓ (recommended) |
| Skip parity gate; rely on per-plan smoke only | Loses the end-of-phase determinism contract from Phase 73 | |

**Auto-selection:** Conditional regen (D-10).

---

## Locator + lint convention (→ D-11)

| Option | Description | Selected |
|--------|-------------|----------|
| Role/aria locators default; `getByTestId` requires inline `// reason:` | Honors Phase 73 lint-gate bump + v2.7/v2.8 convention | ✓ (recommended) |
| `getByTestId` default; semantic locators where convenient | Conflicts with `playwright/no-raw-locators` + IN-03 review finding | |

**Auto-selection:** Role/aria default.

---

## Vite-cache wipe + end-of-phase gate (→ D-12)

| Option | Description | Selected |
|--------|-------------|----------|
| Mandatory `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` before 3-run smoke | Matches Phase 73 Plan 06 + v2.8 close gotcha | ✓ (recommended) |
| Skip wipe; rely on `yarn dev:reset-with-data` alone | Risks pre-rename source carryover (v2.8 close gotcha) | |
| Wait for Phase 78 CLEAN-01 `dev:clean` script | Blocks Phase 74 verification on Phase 78; unnecessary | |

**Auto-selection:** Mandatory wipe (imperative recipe; don't wait for CLEAN-01).

---

## Spec file layout (→ D-13)

| Option | Description | Selected |
|--------|-------------|----------|
| One new spec file per E2E-0X (planner may rename) + voter-detail extension | Mirrors existing 1-spec-per-feature convention | ✓ (recommended) |
| Pack multiple E2E-0X into shared spec files | Smaller file count; weaker isolation | |
| Use only existing spec files (extend in place) | E2E-04 cell-2 + cell-4 don't have existing host specs; not viable | |

**Auto-selection:** New spec files per D-13.

---

## Claude's Discretion (recorded in CONTEXT.md `<decisions>`)

- Plan-04 split (04a scaffolding / 04b spec authoring) if per-plan ceiling exceeded.
- E2E-05 + E2E-07 single-spec extension vs. 2-file split.
- E2E-03 colocation in `voter-popups.spec.ts` vs. new file.
- Selector-matrix helper (`tests/tests/utils/selectorMatrix.ts`) vs. per-spec assertion blocks.
- `58-E2E-AUDIT.md`-style addendum for D-07's 4-case voter answers (recommended-but-not-blocking).

## Deferred Ideas (recorded in CONTEXT.md `<deferred>`)

- E2E-01 single-locale variant follow-up todo.
- Per-question visibility / must-answer (Phase 77 SETTINGS-03).
- `customData.allowOpen` (Phase 77 SETTINGS-02).
- A11y axe smoke + profile validation (Phase 76).
- i18n wrapper tightening (Phase 78 CLEAN-04; Order B re-validation).
- CR-02 voter-popups race-tolerance (Phase 78 CLEAN-05).
- Phase 73 review backlog (Phase 78 CLEAN-05).
- Permanent home for `diff-playwright-reports.ts` + CI integration (out of scope).
- Custom `expectEventually(locator, predicate)` helper (defer per `73-CONTEXT.md §"Deferred Ideas"`).
- `58-E2E-AUDIT.md` addendum for D-07.

## Reviewed Todos (not folded — already routed to other phases per STATE.md)

All 9 score ≥ 0.4 keyword-matches from `gsd-sdk query todo.match-phase 74` are mapped to OTHER phases in `.planning/STATE.md §"Deferred Items"`. Folding any of them into Phase 74 would create scope conflict. See CONTEXT.md `<deferred>` "Reviewed Todos" for the full table.
