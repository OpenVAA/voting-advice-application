---
phase: 141-package-unit-test-coverage-test-unit-invariant-guard
plan: 03
subsystem: build-tooling
status: complete
tags: [guard, ci, turbo, unit-tests, negative-control, fake-guard-removal]

requires:
  - "141-02 wiring landed (all five packages declare `test:unit`), so the guard lands green"
  - "141-01 `141-NEGATIVE-CONTROL.md` rows 2 and 3 (the BLINDNESS halves this plan pairs with)"
provides:
  - "`scripts/assert-unit-test-coverage.mjs` — standing two-check coverage guard"
  - "root `package.json` `assert:unit-coverage` script key"
  - "root `package.json` `test:unit` composed as `yarn assert:unit-coverage && turbo run test:unit`"
  - "141-NEGATIVE-CONTROL.md rows 7 and 8 (UNIT-04 and UNIT-02 CATCH halves) — all three pairs now complete"
affects:
  - "every `yarn test:unit` invocation, local and CI (`.github/workflows/main.yaml:70`)"
  - "any future workspace added under `packages/` or `apps/`"

tech-stack:
  added: []
  patterns:
    - "config-load guard family register, ported to a standalone process (`process.exit` instead of `throw`)"
    - "`lint-schema.mjs` skeleton: node-builtins-only `.mjs`, accumulate-then-exit-once, section banners"
    - "`&&`-chained root-script composition as the gate host (`lint:check`, `apps/supabase` `lint:all` precedents)"
    - "two-accumulator enumeration (matched set + anomaly set) from the teardown-prefix guard"

key-files:
  created:
    - scripts/assert-unit-test-coverage.mjs
    - .planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/deferred-items.md
  modified:
    - package.json
    - .planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md

decisions:
  - "Injection B needed one `yarn install` to observe the end-to-end direction: research run H's 'a scratch workspace needs no install to be picked up' holds for turbo's graph and for the guard, but yarn will not dispatch a script in a workspace it has never installed. Lockfile restored byte-identically."
  - "Injection E was conclusive on the first attempt, so the plan's documented alternative (narrowing the root `workspaces` array to drop `apps/*`) was not used."
  - "Added a third Check 2 assertion the plan did not specify — turbo reporting a runnable `test:unit` for a workspace declaring no such script — as the concrete mitigation for research assumption A4 (sentinel-contract drift turns the guard RED rather than blind)."
  - "`yarn format` reformatted two files unrelated to this phase (pre-existing prettier drift at HEAD). Reverted by targeted `git checkout --`; logged to deferred-items.md rather than fixed."

metrics:
  duration: "~15 min"
  completed: 2026-08-18
  tasks: 3
  commits: 3

actuals:
  tokens: 11900
  tasks: 3
  commits: 3
---

# Phase 141 Plan 03: The `test:unit` Invariant Guard — Summary

A dependency-free, build-free Node guard now sits ahead of turbo on the one command every
local run and CI pass through, asserting both directions of the coverage invariant — has
tests ⟹ declares `test:unit`, and declares `test:unit` ⟹ turbo actually executes it — and it
has been observed failing by name against seven distinct injections, including a real
package and the drift the naive implementation is green on.

## What was built

**`scripts/assert-unit-test-coverage.mjs`** (424 lines, new root `scripts/` directory).
Node built-ins only (`node:child_process`, `node:fs`, `node:path`), no build step, no
transpiler, no workspace import, no new dependency, no run-time opt-out.

- **Config** — four hoisted constants: `WORKSPACE_ROOTS` (`packages`, `apps`, D-16, with the
  comment tying it to the root `workspaces` globs), `TEST_FILE_SUFFIXES` (D-09's three
  suffixes), `PRUNED_DIRS`, and `TURBO_NONEXISTENT` (the sentinel, hoisted so the
  discriminator has one place to look).
- **Enumeration** — depth-1 scan of each root behind a named `existsSync` precondition;
  directories without a `package.json` go to a `skipped` accumulator and are named in the
  summary rather than dropped; an unparseable `package.json` or one with no `name` field
  exits 1 naming the file. Every derived list is sorted by package name before comparison
  and before printing.
- **Check 1 (declared coverage, UNIT-04)** — exact-key equality on `test:unit`; `test`,
  `test:watch` and `test:unit:watch` do not satisfy it. Reports all violations in one run.
- **Check 2 (turbo execution, UNIT-02 / D-17)** — one `execFileSync` argv-array call to
  `npx turbo run test:unit --dry=json`, wrapped so a failed capture, an unparseable payload,
  a missing `tasks` array or a zero-length executed list each exit 1 with a named message
  quoting the head of the captured output. The `command !== TURBO_NONEXISTENT` filter carries
  the phase's highest-value reason-comment.
- **Main** — both checks run and report in full before a single exit. One severity; no
  warning tier, no `--strict`, no environment read, no CLI switch, no exception roster.

**Root `package.json`** — new `"assert:unit-coverage": "node scripts/assert-unit-test-coverage.mjs"`,
and `"test:unit"` changed from `"turbo run test:unit"` to
`"yarn assert:unit-coverage && turbo run test:unit"` (D-07). The path string is written in
exactly one place, following the `apps/supabase` `lint:all` precedent.

**`141-NEGATIVE-CONTROL.md` rows 7 and 8** — the CATCH halves of UNIT-04 and UNIT-02, appended
beneath the halves plans 01 and 02 wrote (nothing reordered or rewritten). The ledger status
table now reads complete on all three pairs.

## The seven injections

| # | Injection | Result |
|---|---|---|
| A | `packages/zz-scratch/` — test file, no script | `yarn test:unit` **exit 1**, names `@openvaa/zz-scratch`, **zero turbo lines** in the output |
| B | Add `"test:unit": "vitest run"` to it | guard **exit 0**, executed 12 → 13; test runs (direct, and end-to-end at 27/27 once registered) |
| C | Remove the script, delete the test file | guard **exit 0** — the `dev-tools`/`shared-config`/`supabase-types` shape stays green |
| D | Remove `test:unit` from the real `packages/llm` | guard **exit 1**, names `@openvaa/llm` and `packages/llm` while `test:watch` remains |
| E | `tools` added to `WORKSPACE_ROOTS`, `tools/*` not in the `workspaces` globs | guard **exit 1** via Check 2, names `@openvaa/zz-tools-scratch`; Check 1 silent |
| F | Unwired scratch workspace, one payload, both variants | naive **GREEN**, discriminating **RED**; clean-tree census exactly 12 executed / 3 unwired |
| G | `test:unit` task removed from `turbo.json` | guard **exit 1**, named message quoting turbo's output — no raw stack trace, not exit 0 |

Injection A is the one that pairs literally with plan 01's Row 2: the same scratch workspace,
byte-for-byte, that left `yarn test:unit` at exit 0 / 21-of-21 successful before the guard
existed. The fail-closed property is measured, not asserted — a grep for turbo preamble, task
and summary lines over A's full output returns 0.

Injection F is the one the phase exists for: the naive presence predicate reports "0
unaccounted" over a live coverage hole for the third time in this ledger, while the shipped
check names it. Its output has now been shown not to move across a change that took five
workspaces from 0 to 140 executed tests.

## Deviations from Plan

### Auto-fixed / adapted

**1. [Rule 3 - Blocking] Injection B's end-to-end direction needed `yarn install`**
- **Found during:** Task 2
- **Issue:** After adding `"test:unit": "vitest run"` to the uninstalled scratch workspace,
  `yarn test:unit` exited 1 with `Internal Error: Package for @openvaa/zz-scratch@workspace:packages/zz-scratch not found in the project`.
  Yarn cannot dispatch a script in a workspace it has never installed. Research run H's
  measured fact ("a scratch workspace needs no `yarn install` to be picked up") holds for
  turbo's task graph and for this guard — which is exactly what makes injection A possible —
  but does not extend to executing the script.
- **Fix:** Observed the remedy direction twice: directly (`npx vitest run` inside the scratch
  workspace → 1 passed) without touching the lockfile, and end-to-end after one `yarn install`
  registered the workspace (`yarn test:unit` exit 0, `Tasks: 27 successful, 27 total`, the
  scratch test executed). Lockfile restored by removing the workspace and re-installing;
  `cmp` against the pre-injection baseline reports byte-identical and
  `git status --porcelain -- yarn.lock` returns 0 lines.
- **Recorded in:** ledger Row 7, injection B, as an explicit extension of run H
- **Commit:** `beb822d0e`

**2. [Rule 2 - Missing critical functionality] Added a third Check 2 assertion for A4**
- **Found during:** Task 1
- **Issue:** The plan mitigated research assumption A4 (turbo's `<NONEXISTENT>` sentinel is
  observed at 2.8.17 only) by asking that counts be recorded in the ledger. That records the
  risk but does not make the guard react to it: if a future turbo stopped marking missing
  scripts with the sentinel, unwired workspaces would be misread as executed and Check 2
  would go quietly green.
- **Fix:** Added the equality read backwards — the guard also fails if turbo reports a
  runnable `test:unit` command for a workspace that declares no such script. Under a changed
  sentinel contract, `dev-tools`, `shared-config` and `supabase-types` would land in that
  list, so the drift turns the guard **RED rather than blind**. The message names
  `TURBO_NONEXISTENT` and cites A4.
- **Files modified:** `scripts/assert-unit-test-coverage.mjs`
- **Commit:** `84a9a2745`

**3. [Scope boundary] `yarn format` reformatted two unrelated files**
- **Found during:** Task 1
- **Issue:** `yarn format` (needed because nothing else formats a root `.mjs`) also rewrote
  `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts` and `tests/README.md`.
  Both were committed in a state the current prettier config does not produce, so
  `yarn format:check` was already failing at HEAD `28cf7eb3d` for reasons predating this phase.
- **Fix:** Reverted by targeted `git checkout --` of those two paths only. **Not fixed** —
  out of scope. Logged to `deferred-items.md` in the phase directory.

### Not deviations, recorded for the record

- **Injection E's documented alternative was not needed.** The plan offered narrowing the root
  `workspaces` array to drop `apps/*` if the `tools` root injection proved inconclusive. It was
  conclusive on the first run, so the alternative was not used.
- **Injection F's red comes from Check 1, not Check 2.** An unwired scratch workspace declares
  no script, so "declares ⟹ executed" is vacuously satisfied and the defect belongs to the
  other direction. The two checks partition the invariant rather than duplicating it, which is
  the pairing argument made concrete — and injection E is its mirror (Check 2 fires, Check 1
  silent).

## Verification

| Check | Result |
|---|---|
| `node scripts/assert-unit-test-coverage.mjs` on the final tree | **exit 0**, summary names both checks, 0 violations, 12 executed / 3 unwired, 15 workspaces, 0 skipped |
| `yarn test:unit` | **exit 0**, `Tasks: 26 successful, 26 total` — the wave baseline preserved |
| Guard summary before any turbo line | guard summary is **line 1**; first turbo line is line 4 |
| Root script string equality (`node -e`, not grep) | both keys exact |
| No-bypass structural check | `grep -nE 'process\.(env\|argv)'` minus comment lines → **0** |
| Single-subprocess check | **1** `execFileSync(`, **0** `execSync(`, comment lines stripped |
| No-build-dependency (positive) | all three imports are `node:`-prefixed |
| No-build-dependency (behavioural) | guard **exit 0** with every `packages/*/dist` removed |
| Zero-install | no dependency added; `git status --porcelain -- yarn.lock` → 0 lines |
| Constants | `WORKSPACE_ROOTS` 2 elements, `TEST_FILE_SUFFIXES` 3 elements, `PRUNED_DIRS` and `TURBO_NONEXISTENT` present |
| Pitfall 1 reason-comment | `grep -c 'Pitfall 1'` → 1, above the Check 2 filter |
| `yarn lint:check` | **exit 0** (2 pre-existing warnings, 0 errors) |
| Tree cleanliness | `git status --porcelain` outside `.planning/` → 0 lines; `git diff --exit-code -- turbo.json scripts/assert-unit-test-coverage.mjs` → 0 |
| `packages/llm/package.json` | `git diff --exit-code` → 0, byte-identical to its post-plan-02 state |

**`yarn lint:check` does NOT lint this file.** Its output never mentions
`assert-unit-test-coverage`, confirming research Pitfall 4 by measurement: there is no root
`lint` script, and `.lintstagedrc.json`'s first glob is
`"*.{html,js,jsx,cjs,mjssvelte,ts,tsx,cts,mts,xml,yaml,yml}"` — the unseparated `mjssvelte`
token means `.mjs` matches no lint-staged pattern. The clean lint result must not be read as
coverage of the guard. `prettier --write .` via `yarn format` is its only automated formatter,
and it did format the file. `apps/supabase/scripts/lint-schema.mjs` lives with the identical
property, so this is precedented rather than novel.

**`.agents/code-review-checklist.md` discharge:** its three sections (Supabase Backend,
Supabase Adapter, Edge Functions) apply to no file this plan touches — a root Node script and
a root `package.json`. Recorded as inapplicable rather than skipped.

**No `git checkout .`, `git stash` or `git clean` was used at any point.** Every revert across
the seven injections was a targeted path removal, a targeted key restore, or a saved-copy
write-back.

## Follow-ups recorded, not fixed

- The `mjssvelte` token in `.lintstagedrc.json` — a pre-existing typo leaving every `.mjs`
  outside lint-staged (research Pitfall 4, explicitly out of scope for this phase).
- Migrating `vitest.workspace.ts` to Vitest's `test.projects` field (deprecation banner on
  every root vitest invocation).
- Extending `TEST_FILE_SUFFIXES` to `.spec.tsx` if such a file is ever added.
- Pre-existing prettier drift in two files unrelated to this phase — see
  `deferred-items.md` in this directory.

## Known Stubs

None. The guard is fully wired: it runs on the real `test:unit` path, reads the real tree,
shells the real turbo, and has been observed both green and red on real inputs.

## Threat Flags

None. This plan adds one root Node script and two `package.json` script keys; it introduces no
network endpoint, no auth path, no schema change and no new file-access pattern beyond reading
`package.json` files and directory listings inside the repository it is run from. The threat
register's `mitigate` dispositions were implemented: T-141-01 (parse wrapped, fails by name),
T-141-03 (argv-array `execFileSync`, asserted 1/0), T-141-13 (`PRUNED_DIRS` + first-hit early
return), T-141-14 (identity by `name` field, exact equality), T-141-15 (no run-time opt-out,
asserted structurally).

## Self-Check: PASSED

All five created/modified files exist on disk; all four commit hashes
(`84a9a2745`, `beb822d0e`, `8c60ec52e`, `cc9fb202c`) resolve in `git log --all`.
