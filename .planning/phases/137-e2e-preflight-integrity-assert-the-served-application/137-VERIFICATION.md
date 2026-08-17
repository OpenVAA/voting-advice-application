---
phase: 137-e2e-preflight-integrity-assert-the-served-application
verified: 2026-08-13T12:24:51Z
status: human_needed
score: 3/4 truths verified (1 present, behavior-unverified)
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "The preflight is enforced by the harness — including on a real CI runner — so a run started against an unserved or wrong-app port aborts before the first spec executes rather than producing failures that read as app defects (ROADMAP criterion 3)."
    test: "Push/PR this branch to `main` (or otherwise trigger `.github/workflows/main.yaml`) and observe both the `e2e-tests` and `e2e-visual` jobs reach their Playwright step, pass the preflight against a real cold-started runner within the 120s budget, and show no `Wait for frontend` step in the rendered job."
    expected: "Both jobs pass the preflight and proceed to specs; no job times out at the preflight's 120s poll ceiling now that the CI wait loops (the previous cold-start absorber) have been deleted."
    why_human: "CI-only failure mode (real runner cold-start timing) that cannot be reproduced locally by construction. `git push` was explicitly not performed this session — `feat-gsd-roadmap` is 2377 commits ahead of a 1425-commits-stale `origin/main`, so discharging this locally-only via a real trigger would require opening a disproportionate 2377-commit PR. This is an operator-accepted, explicitly recorded deferral (STATE.md line 61, `137-05-SUMMARY.md` Task 2), not an oversight — but it is still unproven behavior and must be confirmed the first time this branch is PR'd to `main`, per the discharge condition already written into `137-05-SUMMARY.md`."
human_verification:
  - test: "Push/PR `feat-gsd-roadmap` to `main` (or otherwise trigger the workflow) and watch both E2E jobs run."
    expected: "Both jobs pass the preflight (no `E2E PREFLIGHT FAILED` in logs) within the 120s budget and proceed to executing specs; append the observed result as a CI section to `137-NEGATIVE-CONTROL.md` per the discharge condition already recorded in `137-05-SUMMARY.md`."
    why_human: "Real GitHub Actions runner cold-start timing cannot be reproduced locally; T-137-11 (the 120s ceiling is budget-preserving, not measured) remains an open, accepted risk until this is observed."
---

# Phase 137: E2E Preflight Integrity — Assert the Served Application Verification Report

**Phase Goal:** Every E2E run in this repo proves the page under test was served by this checkout, so no result in this milestone — or after it — can be a false green from a foreign server.
**Verified:** 2026-08-13T12:24:51Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Summary

Three of the four ROADMAP success criteria are fully achieved and independently re-confirmed against
the live tree (not merely the SUMMARY narrative). The fourth (harness enforcement) is achieved and
independently re-confirmed **for every local invocation shape** — but its CI half was deliberately not
exercised this session, for a documented, operator-accepted reason. That gap is real, was correctly
named by the plan authors themselves, and is preserved here as a human-verification item rather than
folded into a pass. This is not a code defect: every piece of evidence available locally supports that
the CI wiring is correct (no `if (process.env.CI)` bypass anywhere in the preflight path, both wait
loops actually deleted from the workflow, `globalSetup` is unconditional). What is missing is the
one thing that cannot be produced locally — a real observed pass on a GitHub Actions runner.

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP success criterion, verbatim intent) | Status | Evidence |
|---|---|---|---|
| 1 | With a foreign dev server on the target port, the preflight FAILS and names the mismatch; the retired "listener is a `node` process" check is first shown PASSING against the identical scenario | ✓ VERIFIED | `137-NEGATIVE-CONTROL.md` §4.3 (retired check exit 0 against both :5373 foreign and :5273 own server, byte-identical verdict shape) and §5.1 (committed preflight exit 1 against :5373, clause (b) named, `served module root: (not found)`). Independently re-read in full — both halves of both runs are present, with real captured stdout, not reconstructed text. §7 additionally captures the FOUND sibling adversary on :5173 caught in 2s. Code confirmed live: `probe.status !== 200` at `tests/tests/support/preflight.ts:360` (not `!== 404`), matching the documented rationale (staged adversary returned 403, found adversary returned 404). |
| 2 | With this repo's own dev server on the same port, the preflight passes and the suite proceeds | ✓ VERIFIED | `137-NEGATIVE-CONTROL.md` §5.2 (exit 0, no failure block) and §5.3 (`--project=cold-entry-dataroot` → `4 passed (5.5s)`, two real spec bodies). Independently corroborated by the Plan 05 full-suite run: `FRONTEND_PORT=5273 yarn test:e2e` → 134/134 passed, exit 0, `E2E PREFLIGHT FAILED` occurrences = 0 (`137-05-TASK1-RESULT.md`). |
| 3 | Enforced by the harness, not remembered by the operator: fires on every invocation shape and aborts before the first spec executes, including in CI | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | **Locally fully verified, CI-behaviorally unverified.** Code re-read directly (not from SUMMARY): `globalSetup: './global-setup.ts'` wired at `tests/playwright.config.ts:99`; `tests/global-setup.ts` and `tests/tests/support/preflight.ts` both greeked for `PLAYWRIGHT_NO_PREFLIGHT`/`SKIP_PREFLIGHT`/`if (process.env.CI)` → **zero matches**, confirming D-05/D-07 (no bypass, no CI early return) as shipped. `137-NEGATIVE-CONTROL.md` §6 shows all 4 invocation shapes (no-flags, `--project`, `--grep`, `--shard=1/2`) aborting with zero spec output against the adversary, and `--list` correctly exempted (covered instead by the config-load orphan-probe guard). CI wiring re-confirmed live: `grep -c "Wait for frontend" .github/workflows/main.yaml` → 0, `grep -c "seq 1 60"` → 0, `grep -c "Start frontend"` → 2 (both jobs). **What is NOT verified:** an actual pass on a real CI runner. Plan 05 Task 2 (observe CI on both jobs) was explicitly DEFERRED by operator decision — see Gaps below. |
| 4 | `CLAUDE.md` and the E2E runbook state the response-content assertion; a grep for the retired wording returns nothing; `FRONTEND_PORT`'s escape-hatch role is documented alongside it | ✓ VERIFIED | Personally re-ran the greps against the live tree (not the SUMMARY's claimed numbers): `grep -ni "listener is a.*node process"` and separately `"listener"` / `"node process"` over `CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md` → **0 matches each**. Superseded caveat grep (`"only moves playwright"` / `"moves playwright but not"` / `"must be exported in the shell for both"`) → **0 matches**. Positive content confirmed by reading each doc: `CLAUDE.md:47-55` (`#### E2E preflight (served-application gate)`), `tests/README.md:15-34` (`### Preflight` — field-by-field failure walkthrough, both remedies verbatim, both `FRONTEND_PORT` forms), `tests/IDURA-TEST-RUNBOOK.md:279` (cross-reference line). All match the D-15 doc-split decision exactly. |

**Score:** 3/4 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `tests/tests/support/preflight.ts` | Three-clause composite identity assertion, runtime-derived | ✓ VERIFIED | 394 lines, read in full. Liveness poll (follows redirects), `/@fs` absolute-path echo check (`=== 200`, never `!== 404`), title-sanity subordinate clause reading `apps/frontend/messages/*/dynamic.json` at the nested `.dynamic.appName` key. `grep -c "127.0.0.1"` → 0 (no host normalization). No hardcoded absolute path. |
| `tests/global-setup.ts` | Playwright adapter wiring the preflight into `globalSetup` | ✓ VERIFIED | 53 lines, read in full. Reads `config.projects[0]?.use?.baseURL`, derives `repoRoot` from `TESTS_DIR`, sets `deadlineMs = process.env.CI ? 120_000 : 30_000`, lets the throw propagate. No bypass logic present. |
| `tests/tests/utils/preflight.test.ts` | Unit tests driving every clause without a dev server | ✓ VERIFIED | Read in full (168 lines). **Executed personally**: `yarn vitest run --root tests --config vitest.config.ts` → `12/12 passed` (8 preflight + 4 pre-existing `buildTestIdToken.test.ts`), confirming the SUMMARY's claim rather than trusting it. |
| `tests/playwright.config.ts` | `globalSetup` wired as the unskippable enforcement point | ✓ VERIFIED | `globalSetup: './global-setup.ts'` present at line 99, exactly one match, with an adjoining comment explaining the `--list` exemption. |
| `apps/frontend/vite.config.ts` | `loadEnv` for `FRONTEND_PORT` from repo-root `.env`, `strictPort: true`, `envPrefix`/`ViteRestart` untouched | ✓ VERIFIED | Read in full (46 lines). `defineConfig(({ mode }) => {...})`, `loadEnv(mode, repoRoot, 'FRONTEND_PORT')`, `port: Number(env.FRONTEND_PORT) || 5173`, `strictPort: true` with an honest comment on what it does and does not catch (matches the D-08/D-16 wording and the code-comment claim in `137-02-SUMMARY.md`). `grep -n "envPrefix"` → no match (never added — untouched as claimed). `ViteRestart({ restart: ['../../.env'] })` present unchanged. |
| `.github/workflows/main.yaml` | Both `Wait for frontend` loops deleted, both jobs still start the frontend | ✓ VERIFIED | `grep -c "Wait for frontend"` → 0, `grep -c "seq 1 60"` → 0, `grep -c "Start frontend"` → 2. YAML parses (`yaml.safe_load` → OK). |
| `137-NEGATIVE-CONTROL.md` | Two-run, four-half negative control, adversary rebuildable from the doc alone | ✓ VERIFIED | 673 lines, read in full. Contains: the retired check's provenance quoted from archived planning prose (never existed as code — F3), the retired check's source verbatim (both readings implemented), the staged adversary's four files + launch command verbatim, all four captured run outputs (1a/1b/2a/2b(i)/2b(ii)), the invocation matrix, the FOUND sibling adversary capture, and an explicit "what is NOT discharged" section that itself names the CI gap (§8) — the phase's own evidence document does not overclaim here. |
| `CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md` | Live-doc rewrite per D-15 | ✓ VERIFIED | See Truth 4 above. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `tests/playwright.config.ts` | `tests/global-setup.ts` | `globalSetup: './global-setup.ts'` config key | WIRED | Confirmed at line 99; the module exports a default async function matching Playwright's `GlobalSetup` shape. |
| `tests/global-setup.ts` | `tests/tests/support/preflight.ts` | `import { assertServedApp } from './tests/support/preflight'` | WIRED | Confirmed at line 2; called at line 52 with `{ baseURL, repoRoot, deadlineMs }`, throw allowed to propagate (no try/catch swallowing it). |
| `apps/frontend/vite.config.ts` | root `.env` | `loadEnv(mode, repoRoot, 'FRONTEND_PORT')` | WIRED | Confirmed; `repoRoot` derived via `fileURLToPath(new URL('../../', import.meta.url))`. Precedence (shell over `.env`) measured live in `137-02-SUMMARY.md` and consistent with the vite source read cited there. |
| `.github/workflows/main.yaml` (both jobs) | preflight (implicitly, via the deleted wait loop's absence) | absence of any readiness check other than the Playwright run itself | WIRED (locally reasoned, not CI-observed) | The removed wait loops leave the preflight as the sole readiness gate for both jobs — confirmed by the diff shape (deletions only) and grep evidence. **Not yet exercised on a live runner** — this is exactly Truth 3's unverified half. |

### Probe Correctness (spot-checked directly against shipped code)

| Assertion required by the task | Result |
|---|---|
| `preflight.ts` asserts `status === 200`, not `!== 404` | Confirmed at `tests/tests/support/preflight.ts:360` — `if (probe.status !== 200) { fail(...) }`. Comment explicitly states why (`!== 404` would let a 403-answering foreign server through — measured). |
| Probe path stays inside SvelteKit's `fs.allow` | Confirmed — `PROBE_RELATIVE_PATH = 'apps/frontend/src/routes/+layout.svelte'`, with an in-code comment explaining that `/package.json`, `/yarn.lock`, `/.git/HEAD` and `/packages/**` all 403 from the correct server, and that this file was chosen because it is inside SvelteKit's `kit.files.routes` allow entry. |
| Reads nested `.dynamic.appName` | Confirmed at `readAppNames()` — `parsed.dynamic === undefined ? undefined : parsed.dynamic.appName`, not a top-level `.appName` read. |
| Never normalises `localhost` → `127.0.0.1` | Confirmed — `grep -c "127.0.0.1" tests/tests/support/preflight.ts tests/global-setup.ts` → 0 in both files. |

### Behavioral Spot-Checks (run personally this session, not taken from SUMMARY)

| Behavior | Command | Result | Status |
|---|---|---|---|
| Preflight unit tests pass against a stub HTTP server | `yarn vitest run --root tests --config vitest.config.ts` (run from `tests/`) | `Test Files 2 passed (2)`, `Tests 12 passed (12)` | ✓ PASS |
| `globalSetup` is wired, no bypass exists | `grep -n "globalSetup" tests/playwright.config.ts`; `grep -n -E "PLAYWRIGHT_NO_PREFLIGHT|SKIP_PREFLIGHT|if \(process\.env\.CI\)" tests/tests/support/preflight.ts tests/global-setup.ts` | `globalSetup: './global-setup.ts'` present; bypass grep returns nothing | ✓ PASS |
| Retired-wording / superseded-caveat greps over live docs | see Truth 4 | 0 matches each | ✓ PASS |
| CI wait-loop removal | `grep -c "Wait for frontend" .github/workflows/main.yaml`; `grep -c "seq 1 60"` | 0, 0 | ✓ PASS |
| Full E2E suite on a real CI runner | — | not run (no push performed) | ? SKIP — this is exactly the deferred human-verification item |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| INTEG-04 | 137-01, 137-03, 137-05 | Preflight asserts the served application's own response, not the listener process; proven by running it against a foreign server | ✓ SATISFIED | Truths 1 and 2 above, both independently re-confirmed. |
| INTEG-05 | 137-01, 137-02, 137-03, 137-05 | Enforced by the harness, cannot be skipped | ✓ SATISFIED locally / ⚠️ CI behavior unverified | Truth 3 above. |
| INTEG-06 | 137-04 | Runbook states the response-content check; no longer instructs the retired process-type check | ✓ SATISFIED | Truth 4 above. |

No orphaned requirements: `.planning/REQUIREMENTS.md` maps only INTEG-04/05/06 to this phase, and all three are claimed and evidenced across the five plans.

### Anti-Patterns Found

None in phase-137-touched files. Debt-marker scan (`TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER`) across all shipped/modified files (`preflight.ts`, `global-setup.ts`, `preflight.test.ts`, `playwright.config.ts`, `vite.config.ts`, `main.yaml`, `CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`) returned zero hits, except one pre-existing, unrelated `TODO` in `tests/README.md:133` about `perm-per-app-notifications` quarantine — predates this phase, out of its scope, correctly referenced rather than newly introduced.

### Honest Accounting of What Was NOT Verified (per the task's explicit ask)

- **Plan 05 Task 2 (observed CI run) was deferred by operator decision**, and this is recorded plainly:
  - `137-05-SUMMARY.md` states it in a dedicated "Task 2 — Observed CI run: DEFERRED" section with the blocker (2377 commits ahead of a 1425-commits-stale `origin/main`), the four items left unobserved, the carried risk `T-137-11`, and an explicit discharge condition.
  - `.planning/STATE.md` line 61 records the same item in the milestone's `## Deferred Items` table, tagged `deferred; operator-accepted 2026-08-13`, with the same `T-137-11` risk named.
  - `137-NEGATIVE-CONTROL.md` §8 itself states criterion 3 is "DISCHARGED **locally**" and lists CI behaviour under "What is explicitly NOT discharged by this document" — the phase's own evidence artifact does not overclaim.
- This is a genuinely honest self-report, not a rubber stamp: three separate documents independently name the same gap with matching detail, and none of them mark the phase or criterion 3 as fully passed.
- **This verifier confirms the gap is real and correctly scoped** — it is a CI-runner-timing behavioral proof, not a code-correctness gap. Every piece of evidence obtainable without an actual CI trigger (source code, config diff, local invocation matrix, targeted composition check against a fresh server) supports that the wiring is correct.

## Gaps Summary

One gap, already self-identified by the phase's own artifacts and independently confirmed here:

**Criterion 3's CI half is unproven.** The preflight's code and config wiring for CI are correct and
verified by static/local means (no bypass, both wait loops actually deleted, `globalSetup` unconditional,
CI deadline logic present at `tests/global-setup.ts:50`). What has NOT been observed is a real pass on
a GitHub Actions runner — the preflight's 120s poll ceiling is "budget-preserving, not measured"
(`T-137-11`, open, operator-accepted). This blocks nothing in this session (a 2377-commit PR to `main`
purely to discharge a verification step is correctly out of proportion), but it is a real, unclosed
loop that must be discharged the first time this branch is PR'd to `main`, per the discharge condition
already written into `137-05-SUMMARY.md`.

This is routed as a human-verification item (not a blocking `gaps_found` code defect) because the
missing evidence is a real-runner behavioral proof that cannot be produced in this session by
construction, and the deferral was made explicitly and is fully traceable.

---

_Verified: 2026-08-13T12:24:51Z_
_Verifier: Claude (gsd-verifier)_
