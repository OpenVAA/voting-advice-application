---
phase: 137
slug: e2e-preflight-integrity-assert-the-served-application
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-13
validated: 2026-08-14
---

# Phase 137 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `137-RESEARCH.md` § Validation Architecture. Read that section for the evidence
> behind every command below.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 (E2E) · Vitest (unit — packages **and** `tests/utils/`, see correction below) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn typecheck:tests && yarn lint:check && yarn vitest run --root tests --config vitest.config.ts` |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | quick ~30–60 s · full suite per the cardinal-rule gate |

> **⚠ CORRECTED 2026-08-13 during plan 137-01 execution — the gap below did not exist.**
>
> This section previously asserted that the `tests/` workspace has **no vitest project**, and on that
> basis adopted "behavioural validation only; do not stand up a vitest project". **That premise was
> false.** Verified during execution:
>
> - `tests/vitest.config.ts` **exists**, with `include: ['tests/utils/**/*.test.ts']`
> - `tests/tests/utils/buildTestIdToken.test.ts` is a pre-existing precedent unit test
> - `tests/eslint.config.mjs:86` already carves `**/utils/**/*.test.ts` out of the Playwright
>   test-structure rules
>
> Research reached the wrong conclusion by checking `tests/package.json`, finding no workspace
> manifest, and inferring no vitest project — missing a config that is driven with an explicit
> `--config` flag rather than through the workspace. Plan 137-01 therefore added **real unit tests**
> (`tests/tests/utils/preflight.test.ts`, 12 cases against a stub HTTP server) using the existing
> infrastructure, and created **no** new test infrastructure. This is a better outcome than the
> behavioural-only fallback, and the fallback rationale below no longer applies.
>
> **Correct invocation (matters — the obvious form silently finds nothing):**
> from the repo root use `yarn vitest run --root tests --config vitest.config.ts`. The
> `--config tests/vitest.config.ts` form resolves the include glob against the repo root and matches
> zero files. This affects the pre-existing test too, not just the new one.
>
> Behavioural validation (exit codes + static greps) remains the primary proof for the phase's
> success criteria — a mocked unit test cannot exercise a real foreign server — but it is now
> *complemented* by unit coverage of the clause logic rather than substituting for it.
---

## Sampling Rate

- **After every task commit:** `yarn typecheck:tests && yarn lint:check`
- **After every plan wave:** the static greps (INTEG-06, D-05, D-08) + one preflight PASS run
- **Before `/gsd-verify-work`:** full `yarn test:e2e` green (cardinal rule) + the complete two-run
  negative control recorded to `137-NEGATIVE-CONTROL.md`
- **Phase gate additionally requires a real CI run** — the CI wait-loop removal (D-05) is the one
  change whose failure mode is CI-only and cannot be caught locally
- **Max feedback latency:** ~60 s for the quick command

---

## Per-Task Verification Map

> Reconciled 2026-08-14 by `/gsd-validate-phase 137`. Rows were seeded at plan time (all `❌ W0`,
> all `⬜ pending`) and are now resolved against the executed phase. Static rows and unit rows were
> **re-executed in this session**; behavioural rows cite the durable evidence produced during the
> phase, since they require a live dev server and a staged adversary.

| Req / Decision | Behaviour to validate | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|
| INTEG-04 | Foreign dev server on target port ⇒ preflight FAILS naming the mismatch | behavioural (control run 2a) | stage adversary per `137-NEGATIVE-CONTROL.md` §3, then `FRONTEND_PORT=5373 npx playwright test -c tests/playwright.config.ts --grep '@__preflight_probe_no_match__' --pass-with-no-tests` ⇒ **exit 1** | ✅ `tests/tests/support/preflight.ts` | ✅ green — `137-NEGATIVE-CONTROL.md` §5.1 (exit 1, clause (b) named, `served module root: (not found)`) |
| INTEG-04 | This checkout's own server ⇒ preflight PASSES and specs proceed | behavioural (control run 2b) | `FRONTEND_PORT=5273 npx playwright test -c tests/playwright.config.ts --project=cold-entry-dataroot` ⇒ **exit 0**, specs execute | ✅ | ✅ green — §5.2 (exit 0) + §5.3 (`4 passed (5.5s)`, two real spec bodies) |
| INTEG-05 | Cannot be skipped by invocation shape | behavioural matrix | against a wrong port, run with: no flags · `--project=X` · `--grep` · `--shard=1/2` ⇒ **all exit 1** | ✅ `tests/global-setup.ts` | ✅ green — §6 invocation matrix; the `--list` exemption is documented as correct and deliberate (§6, "do not 'fix' it") |
| INTEG-05 | Aborts *before* the first spec | behavioural | assert **no spec stdout** present in the failing run's output | ✅ | ✅ green — §5.1 / §6: zero `Running N tests` lines in every failing run |
| INTEG-06 | Retired wording absent from live docs | static | `grep -rn -i "listener.*node process" CLAUDE.md tests/README.md tests/IDURA-TEST-RUNBOOK.md` ⇒ **no match** | ✅ | ✅ green — **re-run 2026-08-14**, exit 1 (no match) |
| INTEG-06 | New wording present | static | grep for `FRONTEND_PORT` **and** `preflight` in each of the three files ⇒ match in each | ✅ | ✅ green — **re-run 2026-08-14**: CLAUDE.md 1/5 · tests/README.md 3/6 · IDURA-TEST-RUNBOOK.md 2/1 |
| D-05 | CI loops gone, both jobs | static | `grep -c "Wait for frontend" .github/workflows/main.yaml` ⇒ **0** | ✅ | ✅ green — **re-run 2026-08-14**, count 0 |
| D-08 | `strictPort` present and effective | static + behavioural | `grep -n strictPort apps/frontend/vite.config.ts`; occupy the port **same-address** and confirm `yarn dev` exits non-zero | ✅ | ✅ green — static **re-run 2026-08-14** (`apps/frontend/vite.config.ts:43`); behavioural half recorded in `137-02-SUMMARY.md` |
| D-09 | Failure message carries all required fields | behavioural + unit | `yarn vitest run --root tests --config vitest.config.ts` → *carries every diagnostic field, in order, with both remedies verbatim* | ✅ `tests/tests/utils/preflight.test.ts` | ✅ green — **re-run 2026-08-14**, 12/12 passed |
| D-09 | `lsof` line is best-effort, never fatal | behavioural + unit | same suite → *renders complete and correct when lsof cannot be resolved*; plus the PATH-shimmed live run | ✅ | ✅ green — **re-run 2026-08-14**; live PATH-shim run in `137-01-SUMMARY.md` D5 |
| D-16 | `.env` sets the dev server port | behavioural | with `FRONTEND_PORT=<free port>` in the root `.env` and NOT exported in the shell, run `yarn dev` ⇒ server listens on `<free port>`; `curl` confirms | ✅ `apps/frontend/vite.config.ts:17` (`loadEnv`) | ✅ green — `137-02-SUMMARY.md` |
| D-16 | Shell still overrides `.env` | behavioural | with `.env` set to port A, run `FRONTEND_PORT=<B> yarn dev` ⇒ server listens on **B**, not A | ✅ | ✅ green — `137-02-SUMMARY.md` (`loadEnv` overlays `process.env` after the parsed file) |
| D-16 | Unset var still yields 5173 | behavioural | remove `FRONTEND_PORT` from `.env` and shell ⇒ `yarn dev` listens on 5173 (no NaN) | ✅ | ✅ green — `137-02-SUMMARY.md`; guarded by `Number(env.FRONTEND_PORT) \|\| 5173` |
| D-17 | Docs describe the working hatch | static | the three live docs mention `.env` **and** the one-off prefix form; the superseded "export in the shell for both commands" caveat is absent | ✅ | ✅ green — **re-run 2026-08-14**: both forms present; superseded caveat grep exit 1 (absent) |
| Regression | Whole suite still green | E2E | `yarn test:e2e` — **cardinal rule** | ✅ | ✅ green — `137-05-TASK1-RESULT.md`: `FRONTEND_PORT=5273 yarn test:e2e` → **134/134 passed**, exit 0, `E2E PREFLIGHT FAILED` occurrences 0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Executed-count note.** The 134/134 above is this phase's baseline. Phase 138 raised it to **135**
by shipping `eperm07-term-trigger` as a permanent LEAF regression guard. Confirmed 2026-08-14:
`npx playwright test -c ./tests/playwright.config.ts --list --grep-invert @probe` → `Total: 135 tests
in 89 files`. A later reader comparing 134 to 135 is seeing that deliberate change, not drift.

---

## Wave 0 Requirements

All delivered — `wave_0_complete: true` set 2026-08-14.

- [x] `tests/global-setup.ts` — the enforcement point; covers INTEG-04, INTEG-05
- [x] The preflight clause logic module `tests/tests/support/preflight.ts` — clauses (a) 2xx
      after redirects, (b) the load-bearing `/@fs/<ABS_REPO_ROOT>/…/+layout.svelte` 200 probe,
      (c) `<title>` ∈ derived `dynamic.appName` set
- [x] The staged-adversary recipe — delivered as a **verbatim rebuildable recipe**
      (`137-NEGATIVE-CONTROL.md` §3 "rebuildable on any machine"), *not* as a committed script.
      See the Manual-Only table below: this is a deliberate D-11/D-12 outcome, but it does mean the
      negative control is reproduced by following a document rather than by invoking one command.
- [x] The throwaway retired-check script (D-12) — scratch only, recorded verbatim at
      `137-NEGATIVE-CONTROL.md` §4.2 and correctly never committed to the harness
- [x] `137-NEGATIVE-CONTROL.md` — the durable evidence (D-13)
- [x] `apps/frontend/vite.config.ts` converted to the `defineConfig(({ mode }) => ...)` form with
      `loadEnv` (D-16) — confirmed at `:12` and `:17`
- [x] **No test-framework install needed.** Correct, and better than planned: the pre-existing
      `tests/vitest.config.ts` was found during execution and 8 real unit cases were added to it
      (see the CORRECTED note above), so the phase gained unit coverage without new infrastructure.

## Manual-Only Verifications

| Behaviour | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| CI wait-loop removal behaves correctly on a real runner | D-05 | Failure mode is CI-only; no local reproduction exists (research could not obtain CI timing data — newest run 2026-07-26) | Push the branch and observe both the E2E job and the `e2e-visual` job reach the suite without the deleted loops; confirm the preflight's poll absorbs runner startup |
| The QUAL-1 wildcard shadow-bind is caught | INTEG-04 (bonus scenario) | Depends on a Docker container binding `*:5173` — environment-specific, not reproducible on demand | With the sibling container live, run the preflight against `localhost:5173` and confirm it FAILS despite `strictPort` having permitted our server's `[::1]` bind |
| Re-running the two-run negative control end to end | INTEG-04 (criterion 1) | The adversary is a staged throwaway Vite project rebuilt from a recipe, and the retired check is a throwaway script deliberately never committed (D-11, D-12). Neither is invocable as a committed command. | Follow `137-NEGATIVE-CONTROL.md` §3 to rebuild the adversary on a free port, then §4.2 for the retired-check script; run both halves of both runs and append to the document. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags (`vitest run`, never bare `vitest`)
- [x] Feedback latency < 60 s for the quick command — measured 2026-08-14: the vitest suite
      completes in **514 ms**
- [x] Two-run negative control recorded in `137-NEGATIVE-CONTROL.md` with BOTH halves of BOTH runs
      (§4.3 blindness, §5.1/§5.2 the catch)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-08-14 (`/gsd-validate-phase 137`)

---

## Validation Audit 2026-08-14

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Manual-only (declared at plan time, irreducible) | 2 |
| Manual-only (added by this audit) | 1 |
| Rows reconciled from `⬜ pending` to `✅ green` | 15 |

**Method:** State A audit. No auditor subagent was spawned — there were no test-fillable gaps to
fill. All six static rows, both D-09 unit rows and the executed-count baseline were **re-executed in
this session** rather than read off the SUMMARY files; the eight behavioural rows cite the durable
evidence produced during the phase, because they require a live dev server and a staged adversary
that cannot be stood up from a validation pass.

**Why `nyquist_compliant: true` despite three manual-only rows.** All three are irreducible rather
than unfilled: a real GitHub Actions runner's cold-start timing cannot be reproduced locally by
construction; the QUAL-1 wildcard shadow-bind depends on a sibling Docker container that is not
summonable on demand; and the negative-control rebuild is a documented recipe by explicit design
decision (D-11, D-12), not an omission. Every behaviour that *can* be asserted by a command has one.

**The strongest coverage fact about this phase** is structural rather than tabular: the preflight
runs from `globalSetup`, so INTEG-04 and INTEG-05 are re-verified on **every future E2E invocation**
in this repo. The gate is not sampled — it is unconditional.

**Carried open (not a validation gap — tracked as T-137-11).** The CI half of criterion 3 remains
unobserved on a real runner. It is recorded in `137-05-SUMMARY.md`, `.planning/STATE.md` § Deferred
Items and `137-NEGATIVE-CONTROL.md` §8, and is dischargeable by the first PR of this branch to
`main`. `/gsd-validate-phase` cannot close it and does not claim to.
