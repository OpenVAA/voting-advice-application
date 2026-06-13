# v2.13 Milestone-Close Green Gate — Anchor

**Milestone:** v2.13 — Context-as-Class Migration
**Recorded:** 2026-06-13
**Requirement:** GATE-01

This document is the milestone-close anchor: the recorded green-gate result proving the
context-as-class migration (Phases 106–115) landed without regression.

## Static gates (live, repo root)

| Gate | Command | Result |
|------|---------|--------|
| Build | `yarn build` | ✅ 14/14 turbo tasks |
| Unit | `yarn vitest run` (frontend) | ✅ 766 passed / 59 files / 0 failed |
| Typecheck | `yarn svelte-check` | ✅ 151 errors (documented pre-existing baseline; 0 net-new across the milestone) |
| Lint | `yarn lint:check` | ✅ 11/11 tasks green, 0 errors (milestone lint debt cleared in Phase 115) |

## Milestone-close anchor grep gates

| Anchor invariant | Result |
|------------------|--------|
| Zero `svelte/store` imports in `apps/frontend/src/**` (test mocks/comments excepted) | ✅ 0 |
| Zero `reactive(DataRoot\|AppSettings\|Locale)` duplicate handles (excl. `_spikes-*`) | ✅ 0 |
| Zero LIVE rune-context `*Store` identifiers (excl. kept localStorage key literals, server `jobStore`, `cookieStore`, `Stored*` family) | ✅ 0 |
| Every top-level context is a class | ✅ 8/9 — `appContext`, `voterContext`, `candidateContext`, `adminContext`, `authContext`, `componentContext`, `dataContext`, `filterContext` are classes. **Documented exception:** `layoutContext` orchestrator conversion was explicitly deferred in Phase 106 (ROADMAP.md:217 — "initLayoutContext() orchestrator-class conversion deferred, recorded for the checker"); Phase 106 extracted `VideoController` into a class. Not a regression. |

## In-browser reactivity verification (manual, against the live seeded app)

The migration's central risk is reactive-accessor freeze on client-side navigation. Verified
manually against the running dev server with the `e2e/base --likert-only` seed:

- Home → intro → **election selection via client-side navigation** renders both seeded
  elections (`[el-reg] Regional Election`, `[el-mun] Municipal Election`) with an **enabled**
  Continue button. The reactive `dataRoot`/`selectedElections` path a freeze would break is
  intact.
- Zero console errors.

This confirms the CR-01 (`inheritContextMembers` live-accessor forwarding) and VoterNav
destructure-trap fixes hold end-to-end, and that the bare reactive accessors flow through the
voter orchestrator reactively.

## Full E2E suite

**Authoritative config:** the suite is historically green in CI (`CI=true` → `workers: 1,
retries: 3`) — v2.10: 82/0, v2.11: 84/0. It was run against the local Vite **dev** server here,
which is NOT the CI E2E environment.

**Status: ⏳ OPEN — automated full-E2E green must be obtained in CI / a production-preview environment.**

### Local headless dev-server runs (all RED at the same step)

| Run | Config | Result |
|-----|--------|--------|
| 1 | local default (`workers: 6, retries: 0`), fresh dev server | 7 failed, 56 did not run, 30 passed |
| 2 | local default, fresh dev server (restart) | 7 failed, 56 did not run, 30 passed |
| 3 | CI config (`CI=true` → `workers: 1, retries: 3`) | 5 failed, 2 flaky, 56 did not run, 30 passed |
| isolated | `--project=voter-journey`, fresh + warmed + seeded | 1 failed (the journey) |

**Failure signature (every run):** the `full voter journey end-to-end` test fails at the
election-selection step — `getByTestId('voter-elections-list')` not found and
`voter-elections-continue` stays disabled. Root cause in the harness: the elections page only
renders the list `{#if elections.length}`, and in the Playwright browser context
`elections.length === 0`. The dependent a11y (`questions`/`results`/`voter-detail-drawer`/
navigation-a11y) and `performance` tests fail/skip downstream of this same gate.

### Why this is assessed as a test-harness artifact, NOT a migration regression

- **Manual in-browser walk of the identical path works**: home → intro → Continue → elections
  renders both seeded elections (`[el-reg]`, `[el-mun]`) reactively via client-side navigation,
  with Continue enabled and **zero console errors**. The reactive `dataRoot`/`selectedElections`
  path a migration freeze would break is intact.
- All static gates + anchor grep gates are green.
- Matches the previously documented `elections-continue-stall` known issue ("disproven as a
  user-facing bug — test-fixture timing artifact").

### Residual uncertainty (why this is left OPEN, not declared green)

- The contradiction (`elections.length === 0` in Playwright vs 2 elections in the manual walk)
  is **not fully root-caused** — could be a test-fixture/seed/scoping/timing artifact, or a
  subtle first-render reactivity-timing issue the manual walk masked via warm state.
- A clean baseline-diff (same test on pre-113 code) was attempted but defeated by the Phase-114
  file renames (`git checkout <old> -- path` resurrects old filenames as duplicates). Not retried.
- Per the "did not run E2E counts as failure" policy, the automated gate is **NOT** claimed green.

### Required to close GATE-01

Run the full default E2E suite (voter-journey + candidate + a11y-smoke) green in CI or against a
**production-preview build** (`yarn build` + preview server) — not the Vite dev server. If it
fails there too at `elections.length === 0`, escalate to `/gsd-debug` as a genuine regression.

## Anchor commit

Static + anchor gates recorded at commit `c83f8b15a` and the Phases 113–115 commits preceding
it. Milestone intentionally **left open** at user request (2026-06-13) pending the CI/preview
E2E run.
