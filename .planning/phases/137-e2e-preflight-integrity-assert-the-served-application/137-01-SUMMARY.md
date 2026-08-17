---
phase: 137-e2e-preflight-integrity-assert-the-served-application
plan: 01
subsystem: testing
tags: [playwright, vite, sveltekit, globalSetup, preflight, e2e-integrity, lsof, vitest]

# Dependency graph
requires:
  - phase: 136-e2e-visual-regression-and-fake-guard-sweep
    provides: "the orphan-probe config-load guard (tests/playwright.config.ts:33-47) as the in-repo 'enforced, not remembered' precedent, and the FRONTEND_PORT=5174 alternate-port practice"
provides:
  - "assertServedApp() — the three-clause served-application identity assertion (liveness, /@fs absolute-path proof, title sanity), driven entirely from values derived at runtime"
  - "tests/global-setup.ts — the Playwright adapter that reads baseURL off FullConfig and lets a failure abort the run"
  - "globalSetup wiring in tests/playwright.config.ts — the unskippable enforcement point"
  - "the D-09 operator failure block, including a best-effort lsof port-squatter section"
  - "tests/tests/utils/preflight.test.ts — 8 unit tests driving every clause against a stub HTTP server, no dev server required"
affects: [137-02-vite-strictport-and-loadenv, 137-03-negative-control, 137-04-docs, 137-05-phase-gate, any phase that runs the E2E suite]

actuals:
  tokens: 7200
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Read the target, never recompute it — the preflight reads config.projects[0].use.baseURL rather than re-deriving it from FRONTEND_PORT"
    - "Poll liveness, assert identity once — the deadline applies to clause (a) only"
    - "Assert === 200, never !== 404 — foreign servers were measured returning both 403 and 404"
    - "Best-effort diagnostics: a failed decoration omits one section, never masks the real reason"

key-files:
  created:
    - tests/tests/support/preflight.ts
    - tests/global-setup.ts
    - tests/tests/utils/preflight.test.ts
  modified:
    - tests/playwright.config.ts

key-decisions:
  - "The plan's FAIL-path adversary (port 54321) does not answer 2xx at `/` in this environment, so clause (b) could not be the discriminator there; the sibling OpenVAA checkout on 5173 was used as the primary adversary instead — it is a live Vite server that passes clause (a) and is caught by clause (b) in ~1s"
  - "Unit tests were added using the repo's EXISTING vitest wiring (tests/vitest.config.ts + the tests/eslint.config.mjs carve-out), correcting an upstream research/VALIDATION claim that tests/ has no vitest project"
  - "The `observed:` line of the failure block landed in task 2 rather than task 3, so the extracted title and module root had a consumer at the moment they were produced (no dead code across a commit boundary)"

patterns-established:
  - "Preflight module split: tests/tests/support/preflight.ts holds the logic and takes its target as an argument; tests/global-setup.ts is the thin Playwright-shaped adapter. The split is what makes every clause unit-testable without a dev server."
  - "Unit tests for tests/-tree modules live in tests/tests/utils/*.test.ts — the only glob wired into tests/vitest.config.ts and the only one carved out of the Playwright eslint structure rules."

requirements-completed: [INTEG-04, INTEG-05]

coverage:
  - id: D1
    description: "A Playwright run pointed at a foreign server aborts with a named identity mismatch, exit 1, before any spec body executes"
    requirement: INTEG-04
    verification:
      - kind: integration
        ref: "FRONTEND_PORT=5173 npx playwright test -c ./tests/playwright.config.ts --grep '@__preflight_probe_no_match__' --pass-with-no-tests → exit 1 in ~1s, clause (b), zero 'Running N tests' lines"
        status: pass
      - kind: unit
        ref: "tests/tests/utils/preflight.test.ts#does not throw while extracting the module root from HTML that has none"
        status: pass
    human_judgment: false
  - id: D2
    description: "A Playwright run pointed at this checkout's own dev server passes the preflight and proceeds"
    requirement: INTEG-04
    verification:
      - kind: integration
        ref: "FRONTEND_PORT=5273 npx playwright test -c ./tests/playwright.config.ts --grep '@__preflight_probe_no_match__' --pass-with-no-tests → exit 0, no 'E2E PREFLIGHT FAILED'"
        status: pass
      - kind: unit
        ref: "tests/tests/utils/preflight.test.ts#passes when the probe returns 200 and the title is in the on-disk catalogue"
        status: pass
    human_judgment: false
  - id: D3
    description: "The gate runs from globalSetup, so no invocation shape reaches a spec without passing it; no env-var bypass and no CI early return"
    requirement: INTEG-05
    verification:
      - kind: integration
        ref: "--grep and --project=cold-entry-dataroot both abort with E2E PREFLIGHT FAILED against 5173; --list still completes without the gate (142 tests in 93 files)"
        status: pass
      - kind: other
        ref: "grep over tests/global-setup.ts + tests/tests/support/preflight.ts — no environment-keyed early return, no bypass variable"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every compared value is derived at runtime from this checkout — no hardcoded absolute path, no hardcoded app name, no host-string normalisation"
    verification:
      - kind: other
        ref: "grep -n '/Users/' and grep -c '127\\.0\\.0\\.1' over both modules → 0; no literal app name; catalogue enumerated from apps/frontend/messages/*/dynamic.json"
        status: pass
    human_judgment: false
  - id: D5
    description: "The failure block carries reason, expected port, expected checkout, observed (status/final URL/title/module root), best-effort listening process, and both remedies verbatim"
    requirement: INTEG-04
    verification:
      - kind: unit
        ref: "tests/tests/utils/preflight.test.ts#carries every diagnostic field, in order, with both remedies verbatim"
        status: pass
      - kind: unit
        ref: "tests/tests/utils/preflight.test.ts#renders complete and correct when lsof cannot be resolved"
        status: pass
      - kind: integration
        ref: "PATH-shimmed run (no resolvable lsof) against 5173 → exit 1, complete block, 'listening process:' absent, no stack frame from the helper"
        status: pass
    human_judgment: false

duration: 49min
completed: 2026-08-13
status: complete
---

# Phase 137 Plan 01: E2E Preflight Integrity Summary

**Playwright now proves, before any spec body runs, that the page under test was served by this working tree — via a `/@fs<abs repo root>/apps/frontend/src/routes/+layout.svelte` probe that must return exactly 200 and echo that absolute path back, wired as an unskippable `globalSetup` gate.**

## Performance

- **Duration:** 49 min wall clock (includes a ~26 min stall caused by a stream watchdog killing the turn between the task-3 RED and GREEN commits; no work was lost or redone)
- **Started:** 2026-08-13T07:07Z
- **Completed:** 2026-08-13T07:56Z
- **Tasks:** 3 of 3
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments

- **The identity proof works and is load-bearing.** Against the sibling OpenVAA checkout squatting port 5173 — a real Vite dev server, serving a real SvelteKit app, which passes clause (a) with a `301 → /sv/` redirect chain — the preflight aborts in ~1 s naming the mismatch and printing the foreign server's own module root (`/opt/frontend`) and the Docker process holding the port. Against this checkout's dev server on 5273 it exits 0.
- **Enforcement covers every invocation shape that runs specs.** `--grep`, `--grep` matching nothing, and `--project=cold-entry-dataroot` all abort. `--list` deliberately still works without a dev server (142 tests in 93 files, unchanged), which keeps the documented "no dropped specs" check usable.
- **Nothing is hardcoded.** Repo root from `TESTS_DIR`, probe path composed at runtime, accepted app names enumerated from `apps/frontend/messages/*/dynamic.json` at the nested `.dynamic.appName` key. No absolute path, no locale list, no app-name literal, no `localhost → 127.0.0.1` rewrite.
- **The failure message is the deliverable, not decoration.** It renders the full D-09 block — reason, expected port, expected checkout, observed (HTTP status, final URL after redirects, `<title>`, served module root), the `lsof` squatter, and both remedies verbatim — and degrades to omitting exactly one section when `lsof` is unresolvable.
- **Eight unit tests drive every clause without a dev server**, including the three failure modes a healthy checkout never reaches (title one character off, no title at all, probe target missing on disk).

## Task Commits

1. **Task 1 (tracer): end-to-end preflight, config → globalSetup → HTTP probe** — `bd344bd84` (feat)
2. **Task 2: full three-clause composite** — `85c6577e1` (test, RED) → `530b0a25a` (feat, GREEN)
3. **Task 3: the D-09 failure message** — `7fab943d1` (test, RED) → `fa30efbc4` (feat, GREEN)

No refactor commits were needed; both GREEN implementations were clean at first pass.

## Files Created/Modified

- `tests/tests/support/preflight.ts` (394 lines) — `PROBE_RELATIVE_PATH`, `PreflightOptions`, `assertServedApp()`. Contains the liveness poll, the `=== 200` + echoed-path identity proof, the catalogue-derived title sanity check, the on-disk probe-target assertion, the D-09 message builder, and the best-effort `lsof` helper.
- `tests/global-setup.ts` (53 lines) — reads `config.projects[0]?.use?.baseURL`, derives `repoRoot` from the existing `TESTS_DIR`, sets the deadline (`process.env.CI ? 120_000 : 30_000`), calls `assertServedApp` and lets the throw propagate.
- `tests/playwright.config.ts` (+14 lines) — one `globalSetup: './global-setup.ts'` key plus the comment explaining what it asserts and why `--list` is exempt.
- `tests/tests/utils/preflight.test.ts` (167 lines) — 8 vitest unit tests against a stub HTTP server.

## Decisions Made

- **Clause (b) probe fetch does not disable redirect following.** A foreign server that redirects the `/@fs` path to a 200 page is still caught, because the echoed-absolute-path check fails. This keeps one code path instead of two.
- **Clause (c) skips when the catalogue yields no names at all** (unreadable/empty messages directory) rather than failing. D-01 makes clause (c) explicitly subordinate; a catalogue read problem must not take down every E2E run when clause (b) has already proven identity.
- **The broken-preflight failure keeps the `E2E PREFLIGHT FAILED` sentinel but changes the sentence.** It reads "the preflight itself is broken; this says nothing about the server", so the sentinel every verify command greps for is preserved while the diagnosis is not misattributed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's FAIL-path adversary does not answer 2xx at `/` in this environment**

- **Found during:** Task 1 (tracer verification)
- **Issue:** The plan's verify commands and acceptance criteria assume `FRONTEND_PORT=54321` gives "local Supabase answers 200 there — a live non-Vite server, so clause (a) passes fast and clause (b) is the discriminator", and require the failure in under 10 s. Measured: port 54321 is held by the **sibling checkout's Docker container**, not this checkout's Supabase, and `http://localhost:54321/` returns **404** (its Kong routes `/rest/v1/`, not `/`). So the run fails on clause **(a)** after the full 30 s poll — a correct failure, but not the one the criterion was written to prove.
- **Fix:** Kept the plan's 54321 leg (it still exits 1 with the complete D-09 block) and added the **sibling OpenVAA checkout on port 5173** as the primary adversary. It is strictly better: a live Vite server serving a real SvelteKit app, which passes clause (a) via `301 → /sv/`, carries `<title>Valkompass</title>`, and is caught by clause (b) alone in **~1 s** — exactly the "poll was NOT applied to clause (b)" property the criterion exists to demonstrate. It is also the literal adversary the phase was written about (CONTEXT.md § Specific Ideas).
- **Files modified:** none (verification-method change only)
- **Verification:** `FRONTEND_PORT=5173 … --grep '@__preflight_probe_no_match__'` → exit 1 in 1 s, `E2E PREFLIGHT FAILED`, clause (b) reason, zero `Running N tests` lines. `FRONTEND_PORT=54321 …` → exit 1 in 31 s, clause (a) reason, all D-09 fields present.
- **Committed in:** `bd344bd84` (recorded in the commit message)
- **Note for plan 03:** the negative control's staged Vite adversary (D-11) must answer **2xx at `/`**, or it exercises clause (a) instead of clause (b). Research §R6.1 already staged it that way; this is a reminder not to substitute a port that 404s at the root.

**2. [Rule 2 - Missing critical functionality] Both `tdd="true"` tasks had no test artifact, and the upstream premise for that omission is false**

- **Found during:** Task 2 (start of the RED phase)
- **Issue:** Tasks 2 and 3 are marked `tdd="true"` with explicit `<behavior>` blocks, but the plan's `<files>` and `must_haves.artifacts` name no test file. The stated reason upstream is that the `tests/` tree has no vitest project — `137-RESEARCH.md` § Validation Architecture and `137-VALIDATION.md` both assert this, and VALIDATION.md adopts "behavioural validation only, do not stand up a vitest project" on that basis.
- **The upstream claim is wrong.** Verified this session: (a) `tests/vitest.config.ts` exists with `include: ['tests/utils/**/*.test.ts']`; (b) a precedent unit test already lives there — `tests/tests/utils/buildTestIdToken.test.ts`; (c) `tests/eslint.config.mjs:86` carves `**/utils/**/*.test.ts` out of the Playwright test-structure rules specifically so vitest files can live there. Research appears to have checked for a `tests/package.json` workspace manifest (genuinely absent) and inferred no vitest project, missing a config that is driven with an explicit `--config` flag.
- **Fix:** Added `tests/tests/utils/preflight.test.ts` using that **existing** wiring. **No new test infrastructure was created** — no new config, no change to `tests/vitest.config.ts`, no change to `tests/eslint.config.mjs`, no new dependency. The file sits in the one directory both the vitest include and the eslint carve-out already cover.
- **Files modified:** `tests/tests/utils/preflight.test.ts` (created)
- **Verification:** 12/12 vitest tests pass (8 new + 4 pre-existing). Both RED phases were genuinely red before implementation (2 failing, then 2 failing again). `yarn lint:check` exits 0.
- **Committed in:** `85c6577e1`, `7fab943d1` (RED) and `530b0a25a`, `fa30efbc4` (GREEN)
- **Two facts to carry forward:**
  - **Invocation:** the config's own header comment and the coordinator's suggested command both under-specify it. From the repo root the working invocation is `yarn vitest run --root tests --config vitest.config.ts` — `yarn vitest run --config tests/vitest.config.ts` resolves the include glob against the repo root and reports "No test files found, exiting with code 1" (this also means the pre-existing `buildTestIdToken.test.ts` is affected, not just the new file).
  - **Not Playwright-collected:** `tests/playwright.config.ts` sets `testIgnore: ['**/*.test.ts']`, so these unit tests cannot enter the Playwright suite. Confirmed: `--list` still reports **142 tests in 93 files** and `preflight.test.ts` appears zero times in the listing. The Playwright test count is unchanged.

**3. [Rule 1 - Task-boundary correction] The `observed:` line landed in task 2 rather than task 3**

- **Found during:** Task 2
- **Issue:** Task 2 requires extracting the final URL, the `<title>` and the served module root; task 3 is where the plan first renders them. Producing three values in one commit with no consumer until the next would have committed dead code.
- **Fix:** Rendered the `observed:` line in task 2's commit. Task 3 remained a substantial change (the `lsof` section, both remedies, the security constraints on interpolation).
- **Files modified:** `tests/tests/support/preflight.ts`
- **Verification:** the task 3 acceptance criterion for `observed:` still holds — it is present in every rendered failure block.
- **Committed in:** `530b0a25a`

---

**Total deviations:** 3 auto-fixed (1 × Rule 3, 1 × Rule 2, 1 × Rule 1)
**Impact on plan:** No scope creep. Deviation 1 strengthens the evidence rather than weakening a criterion — no acceptance criterion was relaxed to make anything pass. Deviation 2 adds durable coverage using infrastructure that already existed. Deviation 3 is a one-commit boundary shift within the same plan.

## Issues Encountered

- **Port 5273 had to be used for this checkout's dev server**, because the Docker container holding `*:5173` also holds `*:54321`. The container was left untouched throughout; it was only ever probed read-only over HTTP, which is precisely what made it the ideal adversary.
- **The dev server was killed mid-session** by the watchdog interrupt, which briefly turned the PASS leg red. This produced a useful incidental confirmation: with nothing listening, the preflight reports `nothing accepted a connection (fetch failed)` and correctly omits the `listening process:` section. The server was restarted and the PASS leg re-verified at exit 0.

## Known Stubs

None. Every clause is implemented and exercised; no placeholder values, no TODO/FIXME, no skipped tests.

## Threat Flags

None. No new network endpoint, auth path, or schema surface. `apps/frontend/src/routes/**` is untouched (T-137-05 acceptance holds), and `apps/frontend/vite.config.ts` has no `fs:` key — `server.fs.allow` was NOT widened (T-137-04). The `lsof` call uses `execFileSync` with an argv array and `timeout: 5000`, and the port comes from `new URL(baseURL).port` (T-137-02). The message interpolates no `process.env` value and no raw response body — verified by asserting the rendered output contains no `<html`, `<script`, or `<div` token (T-137-03).

## Verification Results

| Check | Result |
|---|---|
| `yarn typecheck:tests` | exit 0 |
| `yarn lint:check` | exit 0 (2 pre-existing warnings in untouched files) |
| `npx prettier --check` on all 4 files | clean |
| `yarn vitest run --root tests --config vitest.config.ts` | 12/12 pass |
| FAIL: `FRONTEND_PORT=5173` (foreign Vite server) | exit 1 in ~1 s, clause (b), no spec body |
| FAIL: `FRONTEND_PORT=54321` (plan-specified) | exit 1 in 31 s, clause (a), all D-09 fields |
| FAIL: `--project=cold-entry-dataroot` against 5173 | exit 1, no spec body |
| FAIL: `lsof` unresolvable on `PATH` | exit 1, complete block, section omitted |
| PASS: `FRONTEND_PORT=5273` (this checkout) | exit 0 |
| `--list` without a dev server | exit 0, 142 tests in 93 files |

## Server Cleanup

**Every server started during this plan has been killed.** One frontend dev server was started on port 5273 (twice — the first died with the watchdog interrupt, the second was started to re-verify the PASS leg). Both are gone: `lsof -nP -iTCP:5273 -sTCP:LISTEN` returns nothing, and the background task exited with 143 (SIGTERM). The Docker container on 5173/54321 belongs to a sibling checkout and was never touched — only probed read-only over HTTP.

## Self-Check: PASSED

- `tests/tests/support/preflight.ts` — FOUND (394 lines)
- `tests/global-setup.ts` — FOUND (53 lines)
- `tests/tests/utils/preflight.test.ts` — FOUND (167 lines)
- `tests/playwright.config.ts` — FOUND, contains exactly one `globalSetup` match at line 99, value `'./global-setup.ts'`
- Commits `bd344bd84`, `85c6577e1`, `530b0a25a`, `7fab943d1`, `fa30efbc4` — all FOUND in `git log`
- No modifications to `.planning/STATE.md` or `.planning/ROADMAP.md`

## Next Phase Readiness

Plans 02–05 are unblocked and each has a concrete handle:

- **Plan 02 (`strictPort` + `loadEnv`)** — the gate now catches the *consequence* of port drift; plan 02 closes the *cause*. Note that `strictPort` alone cannot catch the wildcard shadow-bind measured on this machine (RESEARCH QUAL-1) — that hole is only covered by this preflight, and the plan 02 checkpoint wording should say so.
- **Plan 03 (negative control)** — the two-run evidence is already half-collected in this plan's verification table. See deviation 1: the staged adversary must answer 2xx at `/`, or it will be caught by clause (a) and prove nothing about clause (b). The live sibling checkout on 5173 is available as the bonus adversary (RESEARCH §R6.4b) and its captured block is reproduced in this summary's Accomplishments.
- **Plan 04 (docs)** — the two remedies are rendered verbatim from `tests/tests/support/preflight.ts`; quote them from the source, not from memory.
- **Plan 05 (phase gate)** — a full-suite E2E run needs one fresh dev server on the port `FRONTEND_PORT` names, and the preflight will now say so out loud if it is missing.

**One item to carry into plan 04 or a follow-up (not a blocker, and pre-existing):** the `tests/` vitest project is not listed in the root `vitest.workspace.ts` and `tests/` is not a yarn workspace, so `yarn test:unit` does not run `tests/tests/utils/*.test.ts` — neither the new preflight tests nor the pre-existing `buildTestIdToken.test.ts`. They pass, but nothing in CI gates them today. Wiring them in is a one-line change to `vitest.workspace.ts`; it was left out of this plan because it is outside the plan's file set and outside INTEG-04/INTEG-05. **Also correct `137-VALIDATION.md` and `137-RESEARCH.md` § Validation Architecture**, both of which state that no vitest project exists for `tests/` — the premise that produced the "behavioural validation only" stance.

---
*Phase: 137-e2e-preflight-integrity-assert-the-served-application*
*Completed: 2026-08-13*
