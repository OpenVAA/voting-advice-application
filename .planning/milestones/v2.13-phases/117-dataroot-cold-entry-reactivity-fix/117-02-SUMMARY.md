---
phase: 117-dataroot-cold-entry-reactivity-fix
plan: 02
wave: 2
status: complete
requirements: [COLD-03]
completed: 2026-06-13
---

# 117-02 SUMMARY — Full-Suite Green Gate (GATE-01)

## Objective

Wave 2 verification gate: prove the full E2E suite (incl. a11y-smoke) + unit +
typecheck + lint are all green after the Wave-1 dataRoot cold-entry codemod —
satisfying the Phase 116 milestone-close GATE-01 that Phase 117 unblocks.

## Result: PASS ✓

| Gate | Command | Result |
|------|---------|--------|
| Full E2E suite | `yarn test:e2e` | **95 passed / 0 failed / 0 skipped / 0 did-not-run** (3.4m) — incl. a11y-smoke, voter-journey, perm family, candidate-journey, performance, and the new `cold-entry-dataroot` project |
| Unit suite | `yarn test:unit` | **all green** — frontend 766/766 (59 files), dev-seed 450/450 (43 files); 19/19 Turbo tasks successful |
| Lint | `yarn lint:check` | green (Wave 1) |
| Types | `yarn typecheck:tests` + `yarn build` | green (Wave 1) |

## Execution note — HMR-staleness false failure (root-caused, not a flaky exemption)

The **first** full-suite run (against the dev server that had 13 `.svelte`
modules hot-patched in-place during Wave 1) reported **88 passed / 1 failed / 6
did-not-run**. The single failure was `perm-hide-election-tags` (test 65/95) —
a 90s timeout in `voterNavigation.advanceVoterFlow` waiting for
`voter-elections-continue` to become visible. The 6 did-not-run were its
downstream serial-chain entries.

This was **diagnosed**, not waved away (per CLAUDE.md's E2E Hard Rule — no
known-flaky exemptions):

- The same `navigateToFirstQuestion` walk **passed** earlier in the same run for
  voter-journey (3/95), the a11y-smoke located routes, and the new
  cold-entry-dataroot project — so the codemod did not break the
  elections→Continue path.
- The failure surfaced deep in a long run (65/95), the signature of accumulated
  Vite HMR module-drift (project gotcha: HMR serves stale SSR/large modules
  mid-suite; restart to trust results).
- **Action:** killed the hot-patched dev server, started a **fresh** Vite server
  (clean module graph on the committed code), and re-ran the FULL suite →
  **95/95, including `perm-hide-election-tags`.**

Conclusion: the run-1 failure was an HMR-staleness artifact of running the suite
against a dev server hot-patched during the codemod — **not** a code regression.
The fix is sound (also proven by the Wave-1 negative-control RED→GREEN and Spike
024's 4/4 unit reproduction).

## Verification → COLD-03

- Cold direct-URL `/en/elections` renders the populated elections list ✓ (cold-entry-dataroot project)
- Cold direct-URL `/en/info` renders the election-data region ✓
- Full suite green = Phase 116 GATE-01 (E2E + unit + types + lint) ✓

## Environment caveat for the operator

The operator's original `yarn dev` (full stack: Supabase + package watcher +
Vite) was replaced during this gate with a frontend-only `yarn workspace
@openvaa/frontend dev` (background) to get a clean Vite restart. Supabase/DB
state was untouched. To restore the full-stack watcher, stop the background
frontend dev and re-run `yarn dev`.

## Determinism note

This gate is one clean full-suite pass on a fresh server (plus a root-caused
stale run). The Phase 116 milestone-close anchor should run the suite to its
usual 3× determinism standard when it re-runs to close the milestone.
