---
phase: 169-dependency-bump-to-latest-safe-versions
plan: 01
subsystem: infra
tags: [yarn, npmMinimalAgeGate, yarn-audit, lockfile, dependencies, turbo, prettier, supply-chain]

requires:
  - phase: 166-168
    provides: completed upstream phases (every PLAN summarised) and the 168 docs gates (validate:links --check, check:research-quotes with base-rev.txt / component-base-rev.txt)
provides:
  - "npmMinimalAgeGate: 7d in .yarnrc.yml, observed refusing a 2-day-old exact version and resolving a range to a 31.8-day-old one"
  - "scripts/lib/audit-run.mjs classifyAuditRun + the re-keyed audit gate: an empty audit is clean only on exit 0; did-not-run -> exit 2 in the gate and in --update-baseline"
  - "One in-range lockfile refresh (27a209c99): audit 11 NEW -> 0 NEW (braces accepted as a no-fix row), later groups' packages byte-identical"
  - "169-version-probe.mjs + 169-VERSION-TABLE.md (72 packages, 2026-10-03), 169-gates.sh (12 forced gates), 169-e2e.sh (one E2E run + cardinal verdict), 169-EVIDENCE.md"
  - "Measured-green group-0 tree for 169-02's Node 24 attribution: 12/12 gates 0, E2E 171/171/0/0/0"
affects: [169-02, 169-03, 169-04, 169-05, 169-06, 169-07, 169-09, 169-10, 169-13]

actuals:
  tokens: 103988   # chars/4 over the realized diff 5ed82f437..cc2016889, yarn.lock included (29608 without yarn.lock)
  tasks: 3
  commits: 9
plan_head_before: 5ed82f437ea68337a4994a914abff513351f7635
plan_head_after: cc20168892d84969ce7edf16421fe0ea713ec796

tech-stack:
  added: []
  patterns:
    - "Phase gate runner: every gate forced (TURBO_FORCE=true) and its exit status read directly into summary.tsv"
    - "Audit liveness from the audit's own exit status (classifyAuditRun), never from baseline size"
    - "Package typecheck that never writes into dist: tsc --noEmit --composite false"

key-files:
  created:
    - scripts/lib/audit-run.mjs
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-version-probe.mjs
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-VERSION-TABLE.md
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-gates.sh
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-e2e.sh
    - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-EVIDENCE.md
  modified:
    - .yarnrc.yml
    - yarn.lock
    - scripts/assert-dependency-audit.mjs
    - packages/dev-seed/tests/auditBaselineShape.test.ts
    - security/audit-baseline.json
    - packages/{app-shared,argument-condensation,core,data,filters,llm,matching,question-info}/package.json
    - 19 files reformatted by Prettier 3.9.9 (54041714e)

key-decisions:
  - "The AI SDK family (ai, @ai-sdk/*) was moved into the group-0 excluded set: @ai-sdk/provider-utils >= 3.0.35 depends on undici ^5.29.0, so its in-range refresh re-introduced undici 5 and @fastify/busboy (NEW high 1240982). Its majors stay 169-09's."
  - "braces GHSA-vfj7-8cjw-p6xm (1240992) has no fixed release (<=3.0.3 covers every version); per D-02 it was accepted by a hand-written baseline row with a rationale, not by --update-baseline. Flagged for operator review."
  - "Fixed forward a pre-existing turbo typecheck/build race (tsc --noEmit writing dist/tsconfig.tsbuildinfo after tsup cleaned dist suppressed declaration emit) with tsc --noEmit --composite false in the 8 tsup packages."
  - "169-e2e.sh refuses below 13.8 GiB free in the Docker VM (the floor the operator accepted), not the plan's 15 GiB."

patterns-established:
  - "Group gate runs go through 169-gates.sh <label>; E2E through 169-e2e.sh <label> (new label per run, evidence never overwritten)"
  - "Lockfile refresh = one bash-array yarn up -R over every lockfile name minus the owned/excluded set, then yarn dedupe; boundaries proven by byte-diffing the excluded blocks and a registry age backstop over every new name@version"

requirements-completed: [DEPS-01, DEPS-02, DEPS-15]
requirements-note: "Addressed by this plan, none marked Complete in REQUIREMENTS.md. DEPS-01 and DEPS-15 are shared with 169-13 (the shared-ID gate blocks them). DEPS-02 passed the gate (ready-ids 1/3) but was deliberately left Pending: its text says the refresh 'clears every NEW high+ finding', and the last one (braces, no fix published) was cleared by an accepted baseline row that awaits operator review."

coverage:
  - id: D1
    description: "7-day minimum release age enforced by Yarn and observed binding"
    requirement: DEPS-01
    verification:
      - kind: other
        ref: "yarn config get npmMinimalAgeGate -> 10080; scratch-project proof: yarn add globals@17.13.0 exit 1 (quarantined), yarn add globals@^17 exit 0 -> 17.12.0 (169-EVIDENCE.md § 5)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Version/age table regenerated at execution start (72 packages, verdicts, owning group)"
    requirement: DEPS-01
    verification:
      - kind: other
        ref: "node 169-version-probe.mjs --out 169-VERSION-TABLE.md --node 24.14.1 -> exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Audit gate liveness keyed on the audit's exit status in both modes, with network-blocked negative controls"
    requirement: DEPS-15
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/auditBaselineShape.test.ts#the gate proves the audit ran"
        status: pass
      - kind: other
        ref: "YARN_NPM_AUDIT_REGISTRY=http://127.0.0.1:9 YARN_HTTP_RETRY=0 node scripts/assert-dependency-audit.mjs -> exit 2 (NC-1 pre-change exit 0; NC-2..NC-4 exit 2; NC-5 3 red)"
        status: pass
    human_judgment: false
  - id: D4
    description: "One in-range lockfile refresh; later groups' packages byte-identical; audit 0 NEW"
    requirement: DEPS-02
    verification:
      - kind: other
        ref: "diff 01-t3-excluded-before.txt 01-t3-excluded-after.txt -> 0; yarn audit:deps -> exit 0, 0 new advisory(ies)"
        status: pass
    human_judgment: true
    rationale: "The braces advisory has no fixed release and was accepted by a hand-written baseline row; whether that row stands is the operator's review (169-EVIDENCE.md § 7)."
  - id: D5
    description: "Group-0 tree measured green: 12 forced gates and a full E2E run"
    verification:
      - kind: other
        ref: "bash 169-gates.sh 169-01-group0 -> exit 0, 12 rows of 0"
        status: pass
      - kind: e2e
        ref: "bash 169-e2e.sh 169-01-group0 -> exit 0; summary.json 171 passed / 0 failed / 0 flaky / 0 didNotRun"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-10-03
status: complete
---

# Phase 169 Plan 01: Group 0 — Age Gate, Audit Liveness, In-Range Refresh Summary

**Yarn now refuses releases younger than 7 days. The audit gate exits 2 when the audit cannot reach the registry, whatever the baseline holds. One in-range lockfile refresh cut the audit from 11 NEW to 0. That refresh left the packages later groups own untouched, as well as the AI SDK family, which would otherwise pull undici 5 back in. The tree then passed 12 forced gates and a full E2E run (171/171).**

## Performance

- **Duration:** 40 min
- **Started:** 2026-10-03T06:36:59Z
- **Completed:** 2026-10-03T07:17Z
- **Tasks:** 3
- **Files modified:** 37 (by `git diff --stat 5ed82f437..HEAD`)

## Accomplishments

- **Age gate (D-04).** `npmMinimalAgeGate: 7d` is set. `yarn config get` prints `10080`. In a scratch project, Yarn refused `globals@17.13.0` (2 days old) as "quarantined", and resolved `globals@^17` to 17.12.0 (31.8 days old).
- **Audit liveness (D-28).** `classifyAuditRun` in `scripts/lib/audit-run.mjs` classifies each audit run as clean (empty output, exit 0), did-not-run (empty output, any other status), or findings. Both the gate and `--update-baseline` call it.
  - NC-1 recorded the old hole: with the baseline emptied and the registry blocked, the old gate exited 0.
  - After the change, the same control exits 2 (NC-2), the real baseline exits 2 (NC-3), and `--update-baseline` exits 2 without touching the file (NC-4).
  - A perturbed classifier turns three shape-test cases red (NC-5).
- **Version/age table (D-33).** 72 packages, with verdicts current 12 · in-major 32 · major 27 · HOLD-30d 1. There is no unassigned major.
  - Holds measured today under the 30-day rule: Kit 3 and its adapters (clear 2026-10-31), Vitest 5 (clears 2026-10-03T12:24Z), `intl-messageformat` 12 and `dotenv` 18.
  - Under the 7-day rule, the newest patches of vite, eslint, supabase, `@types/node`, globals and turbo are held.
- **Group-0 refresh (D-07, D-27).** One `yarn up -R` over 794 names, then `yarn dedupe`, committed as `27a209c99`.
  - The audit went from 11 NEW / 63 accepted to 0 NEW / 6 accepted, with 62 stale ids left for 169-13.
  - The 11 excluded packages' lockfile blocks are byte-identical before and after. No manifest, `.yarnrc.yml` or `resolutions` entry changed.
  - All 405 new `name@version` pairs are at least 7 days old; the youngest is 7.32 days.
- **Measured green.** `169-01-group0` passed all 12 gates. E2E passed 171 of 171, with 0 failed, 0 flaky and 0 did-not-run, at HEAD `54041714e` after a `db:reset`.

## Task Commits

1. **Task 1: safe-version pipeline (tracer).** `0376d0821` chore(deps) age gate; `a2b05d9e1` docs(169) ledger, probe, table and runners.
2. **Task 2: audit liveness (TDD).** `78b2950d3` test(audit) RED; `06bb72877` fix(audit) GREEN.
3. **Task 3: group-0 refresh.** `27a209c99` chore(deps) lockfile refresh; `c97bc9898` chore(audit) braces no-fix row; `0c98a4621` fix(build) typecheck/build race; `54041714e` style Prettier 3.9 reformat; `cc2016889` docs(169-01) evidence.

**Plan metadata:** the SUMMARY commit follows this file.

## Files Created/Modified

- `.yarnrc.yml`: `npmMinimalAgeGate: 7d`.
- `scripts/lib/audit-run.mjs`: the pure `classifyAuditRun`.
- `scripts/assert-dependency-audit.mjs`: `runAudit` keeps the exit status and classifies it. The baseline-size liveness check is gone, and property 4 and the exit-code docs are rewritten.
- `packages/dev-seed/tests/auditBaselineShape.test.ts`: the non-empty requirement is replaced by `describe('the gate proves the audit ran')`, which has five cases and includes a real blocked-registry audit.
- `yarn.lock`: the in-range refresh.
- `security/audit-baseline.json`: one added row, braces 1240992, with a rationale.
- Eight `packages/*/package.json` files: `typecheck` becomes `tsc --noEmit --composite false`.
- 19 source files: Prettier 3.9.9 formatting only.
- Phase directory: `169-version-probe.mjs`, `169-VERSION-TABLE.md`, `169-gates.sh`, `169-e2e.sh`, `169-EVIDENCE.md` (sections 0–8).

## Decisions Made

See `key-decisions` in the frontmatter. In short:
- The AI SDK family is excluded from the refresh because it pulls undici 5 and `@fastify/busboy`.
- braces is accepted as a no-fix row under D-02.
- The typecheck race is fixed forward.
- The E2E disk floor is 13.8 GiB, as the operator accepted.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan expected `02-dedupe` at 0 on the starting tree**
- **Found during:** Task 1, the baseline gate run.
- **Issue:** `yarn dedupe --check` reported 71 dedupable descriptors on the unmodified lockfile. No workflow or script runs the check, so this is a pre-existing state, not an upstream regression. The tracer's third `<verify>` therefore exited 1 on that row.
- **Fix:** none needed here. Group 0's `yarn dedupe` brings it to 0, and `169-01-group0` shows 0. Recorded in EVIDENCE § 4 and § 7.
- **Commit:** none (no code change).

**2. [Rule 1 - Regression of the refresh] The AI SDK family re-introduced vulnerable undici 5**
- **Found during:** Task 3, step 4.
- **Issue:** `@ai-sdk/provider-utils` 3.0.39 (from 3.0.35 on) depends on `undici ^5.29.0`, which brought in `@fastify/busboy` 2.1.1. That added NEW high 1240982, which has no in-range fix.
- **Fix:** restored the pre-refresh lockfile and re-ran the refresh with `ai` and `@ai-sdk/{gateway,google,openai,provider,provider-utils}` excluded. This is the plan's step-6 "narrow the refresh" option, recorded in EVIDENCE § 3.
- **Commit:** `27a209c99`

**3. [Rule 3 - Blocking] A new advisory (braces) has no fixed version**
- **Found during:** the Task 1 re-measurement. It was published after planning.
- **Issue:** GHSA-vfj7-8cjw-p6xm covers every braces release (`<=3.0.3`), so no refresh can clear it. The plan only covered "fix exists but is under 7 days old".
- **Fix:** under D-02 (the baseline keeps no-fix rows), added the row by hand with a rationale: dev-tooling only, through micromatch 4 from vite-plugin-restart and @changesets/cli, with repo-authored patterns. No `--update-baseline` was run (PROH-169-02).
- **Commit:** `c97bc9898`. **Flagged for operator review** (EVIDENCE § 7).

**4. [Rule 1/3 - Bug] Pre-existing turbo typecheck/build race**
- **Found during:** Task 3, the `169-01-group0-attempt1` gates.
- **Issue:** `03-typecheck` and `04-lint` failed because `@openvaa/llm` and `typecheck:tests` type-checked `app-shared/dist/index.js`; `dist/index.d.ts` was missing. Two parts are confirmed:
  - The cause, by reproduction: a stale tsbuildinfo makes `tsc --emitDeclarationOnly` emit nothing.
  - The overlap, from the log: app-shared's typecheck runs alongside its build.
- **Unconfirmed:** why it fired on the first two forced runs after the refresh, and in none of 6 isolated re-runs.
- **Fix:** `tsc --noEmit --composite false` in the 8 tsup packages. Their typecheck no longer writes into `dist`, and a planted type error still fails it.
- **Commit:** `0c98a4621`

**5. [Plan step 6] Reformat for the refreshed Prettier**
- **Found during:** Task 3; `05-format` reported 19 files.
- **Fix:** `yarn format` only, committed as `54041714e`. `12-docs-rq` stayed green.

**6. [Operator ruling] E2E disk floor**
- `169-e2e.sh` refuses below 13.8 GiB (the operator-accepted floor) rather than the plan's 15 GiB.

**7. [Minor] Small differences from the plan's wording**
- The scratch age-gate project also set `enableTelemetry: false`.
- The shape test loads the classifier by dynamic `import()` cast to an interface. This is the sibling `edgeFunctionEnvGate.test.ts` pattern, and it avoids a static `.mjs` import into the typed project.

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 refresh regression, 1 blocking no-fix advisory), plus 1 planned reformat and 2 minor ones.
**Impact on plan:** every plan truth holds, except that the "0 NEW" audit result rests on one accepted no-fix row, which the operator should review. There is no scope creep beyond the typecheck race fix, which every later group's gates need.

## Issues Encountered

- zsh passes an unquoted `$LIST` as one argument, so the first `yarn up -R` failed with "Ranges aren't allowed when using --recursive" and changed nothing. It was re-run with a bash array.
- The E2E runner's GiB figure used a decimal comma under the Finnish locale. It is now printed with `LC_ALL=C` (`cc2016889`); the measurement itself was never affected.

## User Setup Required

None.

## Known Stubs

None.

## Next Phase Readiness

- 169-02 (Yarn 4.18 → Node 24) starts from a measured-green tree: 12/12 gates, E2E 171/171.
- **Operator follow-ups (EVIDENCE § 7):**
  - Review the braces baseline row.
  - Decide whether CI should enforce `yarn dedupe --check`.
- **For 169-09:** confirm the target `ai` / `@ai-sdk/*` majors no longer depend on `undici` 5.
- **For 169-04:** the docs app's vitest 4.1.11 now resolves its own nested vite 8.3.1.

## Self-Check: PASSED

- Files exist: `scripts/lib/audit-run.mjs`, the five phase-directory artefacts, `169-01-SUMMARY.md`.
- All 9 commits are in `git log`: `0376d0821`, `a2b05d9e1`, `78b2950d3`, `06bb72877`, `27a209c99`, `c97bc9898`, `0c98a4621`, `54041714e`, `cc2016889`.
- Plan verification re-run at the end:
  - `yarn config get npmMinimalAgeGate` → 10080.
  - Blocked-registry gate → exit 2.
  - `169-01-group0` summary has 12 rows, all 0.
  - `169-e2e.sh 169-01-group0` → exit 0.
  - `yarn audit:deps` → exit 0 with "0 new advisory(ies)".
  - Shape test → exit 0; dev-seed typecheck → 0.

---
*Phase: 169-dependency-bump-to-latest-safe-versions*
*Completed: 2026-10-03*
