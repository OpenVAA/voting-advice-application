---
phase: 169-dependency-bump-to-latest-safe-versions
plan: 12
subsystem: infra
tags: [sveltekit, kit-3, adapter-node, adapter-static, age-rule, hold, d-03, d-15, d-32]
status: complete
outcome: HELD

requires:
  - phase: 169-11
    provides: "Actions majors landed; HEAD 7502aa5cc; ci-evidence/169-deps lease 59607e5cd"
  - phase: 169-05
    provides: "Kit 2.70.3, Vite 8.3.1, vite-plugin-svelte 7.3.1 (Kit 3's peers under Kit 2)"
  - phase: 169-02
    provides: "TypeScript 6.0.3, engines.node >=24.15.0, CI pin 24.21.0"
provides:
  - "the Kit 3 readiness verdict measured live on 2026-10-03T18:49:51Z: HOLD-AGE (age clock not met, every peer met)"
  - "three EVIDENCE section 3 hold rows (kit 2.70.3, adapter-node 5.5.7, adapter-static 3.0.10) with the re-check date 2026-10-31T17:24:31Z"
  - "pending todo 2026-10-03-sveltekit-3-held-by-the-age-rule.md (re-check date, peer table, D-32 checkpoint steps, the Vite 8 configLoader item)"
affects: [169-13]

actuals:
  tokens: 6000     # chars/4 over the realized diff 7502aa5cc..b9b2b0d4d (14089 chars) plus this summary
  tasks: 1         # Task 1 executed; Tasks 2 and 3 not applicable on HOLD (plan text)
  commits: 1       # git rev-list --count 7502aa5cc..HEAD at SUMMARY time (the SUMMARY/state commits follow)
plan_head_before: 7502aa5cc6173bf5da8c642b8d45c8d4670fe76c
plan_head_after: b9b2b0d4d8d45db4f5a85947704925d66ac5429e

tech-stack:
  added: []
  removed: []
  patterns:
    - "Readiness verdict as one artifact: the registry age clock (x.0.0 + 30 d, newest-in-major >= 7 d) and every declared peer/engine tested against the lockfile with the hoisted semver, combined into CLEARS / HOLD-AGE / HOLD-PEER"

key-files:
  created:
    - .planning/todos/pending/2026-10-03-sveltekit-3-held-by-the-age-rule.md
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-12-SUMMARY.md
  modified:
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-EVIDENCE.md

key-decisions:
  - "SvelteKit 3 / adapter-node 6 / adapter-static 4 HELD (verdict HOLD-AGE, measured 2026-10-03T18:49:51Z): each x.0.0 is 2.06 days old and is the only release in its major; they clear D-03 on 2026-10-31T17:22:34Z / 17:24:31Z / 17:21:55Z. Kit stays 2.70.3, adapters 5.5.7 / 3.0.10; nothing installed, no migrator or sv run (PROH-169-22)."
  - "Kit 3.0.0's peers are all already satisfied by the tree (vite 8.3.1 ^8.0.12, vite-plugin-svelte 7.3.1 ^7.0.0, svelte 5.57.1 ^5.57.1, typescript 6.0.3 ^6.0.0 optional, @opentelemetry/api optional and absent, engines.node >=22.17 vs declared >=24.15.0 and CI 24.21.0), so the eventual Kit 3 commit carries only Kit 3's own migration (D-15)."
  - "Task 2's D-32 operator checkpoint skipped per the plan text (verdict not CLEARS, hold already recorded); Task 3's land branch not applicable."
  - "The Vite 8 configLoader 'native' notice (169-05) is carried into the Kit 3 hold todo as a related item, to land next to the Kit 3 migration that rewrites the same config files; not changed here."
  - "DEPS-14 marked complete via its hold branch: the requirement text is 'land behind an operator checkpoint if they clear the 30-day rule on the execution date; otherwise held with a dated todo', they did not clear, and the hold is recorded with a dated todo. 169-12 is the only plan that owns DEPS-14."

requirements-completed: [DEPS-14]

duration: 5min
completed: 2026-10-03
---

# Phase 169 Plan 12: SvelteKit 3 readiness verdict — HELD by the age rule until 2026-10-31 Summary

**SvelteKit 3.0.0, adapter-node 6.0.0 and adapter-static 4.0.0 were 2.06 days old when measured live on 2026-10-03. D-03 holds them until 2026-10-31T17:24:31Z. Every Kit 3 peer is already met by the tree, so the hold is on age only. Kit stays on 2.70.3.**

## Outcome: HELD (re-check on or after 2026-10-31T17:25Z)

| Package | Held at | Newer major (published) | Clears |
|---|---|---|---|
| `@sveltejs/kit` | 2.70.3 | 3.0.0 (2026-10-01T17:22:34Z, the only 3.x) | 2026-10-31T17:22:34Z |
| `@sveltejs/adapter-node` | 5.5.7 | 6.0.0 (2026-10-01T17:24:31Z, the only 6.x) | 2026-10-31T17:24:31Z |
| `@sveltejs/adapter-static` | 3.0.10 | 4.0.0 (2026-10-01T17:21:55Z, the only 4.x) | 2026-10-31T17:21:55Z |

Peers of Kit 3.0.0 checked against `yarn.lock` with `semver` 7.8.5 (all OK):

| Peer | Range | In the tree |
|---|---|---|
| `vite` | `^8.0.12` | 8.3.1 |
| `@sveltejs/vite-plugin-svelte` | `^7.0.0` | 7.3.1 |
| `svelte` | `^5.57.1` | 5.57.1 |
| `typescript` (optional) | `^6.0.0` | 6.0.3 |
| `@opentelemetry/api` (optional) | `^1.0.0` | not installed |
| `engines.node` | `>=22.17` | declared `>=24.15.0`; CI pin 24.21.0 |

## Performance

- **Duration:** about 5 min
- **Started:** 2026-10-03T18:48Z
- **Completed:** 2026-10-03T18:53Z
- **Tasks:** 1 executed (Task 1, the tracer); Tasks 2 and 3 not applicable on HOLD
- **Files modified:** 2 (+ this summary)

## Accomplishments

- Measured the age clock live from the registry (`npm view <pkg> time --json`). For each package, the measurement
  took the `x.0.0` publish time, `clears = x.0.0 + 30 d`, and the newest release in the major that is at least 7
  days old. No such release exists yet in any of the three majors.
- Read `@sveltejs/kit@3.0.0`'s peers, peer metadata and engines, and tested each one against its lockfile
  resolution. The test used `require('semver').satisfies(v, range, { includePrerelease: true })` with the hoisted
  semver; no network tool was involved. The declared Node floor and the CI pin both satisfy `>=22.17`.
- Wrote the verdict file `tests/e2e-runs/169-gates/12-kit3-verdict.json` (gitignored, like every run artifact
  under `tests/e2e-runs/`): three package entries, a `peers` object, `verdict: HOLD-AGE`, `recheck:
  2026-10-31T17:24:31.997Z`.
- Recorded the hold in `169-EVIDENCE.md`:
  - § 1: the 169-12 re-measurement and both tables.
  - § 3: one row per held package. These replace the combined Kit-family row that 169-05 wrote.
  - § 7: a carried-forward note on the configLoader item.
- Wrote the dated todo. It holds the re-check date, the peer status (all of Kit 3's peers already landed under Kit
  2.70), the D-32 checkpoint and landing steps, and the Vite 8 configLoader follow-up as a related item.

## Task Commits

1. **Task 1: Kit 3 readiness verdict, HOLD, and the dated todo:** `b9b2b0d4d` (docs, `docs(169): record the SvelteKit 3 hold`)
2. **Task 2: operator decision (D-32):** not applicable. The plan text says to skip the checkpoint when the verdict
   is not `CLEARS`, because the hold is already recorded.
3. **Task 3: land Kit 3 or record the hold:** not applicable. Task 1's HOLD branch already recorded the hold, and
   nothing was installed.

## Verification

- Task 1 `<automated>` verify: prints `HOLD-AGE` and exits 0. Exactly one `*sveltekit-3-held-by-the-age-rule.md`
  todo exists.
- `yarn why @sveltejs/kit` shows only `@sveltejs/kit@npm:2.70.3`, in docs and frontend (Task 3's hold acceptance
  check; the major-parse check prints `kit major 2`). The adapters are `adapter-node@npm:5.5.7` and
  `adapter-static@npm:3.0.10`.
- No gates, visual run or E2E were run. The plan runs them only when Kit 3 lands. Manifests, the lockfile and the
  code are unchanged (`git diff 7502aa5cc..HEAD --stat` touches only `.planning/`).

## Decisions Made

See the `key-decisions` frontmatter. In short:

- The hold is on age only.
- The peers are ready.
- The configLoader fix rides with Kit 3.
- DEPS-14 is satisfied by its hold branch.

## Deviations from Plan

- **Todo frontmatter:** two extra fields, `re_check_trigger` and `files`, are added next to the fields the plan
  requires. The sibling 169-10 hold todo uses the same fields. The plan's required fields are all present.
- **No peer target:** no 3.x release is 7 days old yet, so the peers were measured against `@sveltejs/kit@3.0.0`,
  the only 3.x. The verdict file records this in `peersMeasuredAgainst`.

Otherwise the plan ran as written. No Rule 1-4 deviations.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- **169-13 (close-out):**
  - The nodemailer 10 Edge pin hold (169-07) clears **2026-10-04T07:51Z**. 10.0.0 cleared at 07:45:32Z and
    10.0.11 clears at 07:50:47Z. Resume steps: todo `2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md`.
  - The `ci-evidence/169-deps` lease value for the next push is **`59607e5cd6b55ed9bc94563ad9a29dd1a31662d0`**.
    169-12 pushed nothing.
  - The Kit family now has three rows in EVIDENCE § 3. The re-check is 2026-10-31T17:24:31Z, and the todo carries it.
  - The `braces` baseline row is stale and 169-13 drops it (from 169-10).
  - Other short holds in § 3 clear 2026-10-07 to 2026-10-17: vitest, daisyui, supabase CLI, vite 8.3.2, globals,
    @types/node, eslint 10.12.0, intl-messageformat, dotenv.
- **Operator:** no decision is needed now. On or after 2026-10-31 the Kit 3 todo leads to the D-32 checkpoint
  (`land-with-sv` / `land-by-hand` / `hold`).

## Self-Check: PASSED

- FOUND: `.planning/todos/pending/2026-10-03-sveltekit-3-held-by-the-age-rule.md`
- FOUND: `tests/e2e-runs/169-gates/12-kit3-verdict.json` (`verdict: HOLD-AGE`)
- FOUND: `tests/e2e-runs/169-gates/12-kit-why.txt` (Kit 2 only)
- FOUND: commit `b9b2b0d4d`
