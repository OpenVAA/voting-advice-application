---
phase: 137
slug: e2e-preflight-integrity-assert-the-served-application
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-13
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

> Task IDs are assigned by the planner; this map binds each phase requirement to its automated
> command so the planner can attach them. Rows are keyed by requirement until plans exist.

| Req / Decision | Behaviour to validate | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|
| INTEG-04 | Foreign dev server on target port ⇒ preflight FAILS naming the mismatch | behavioural (control run 2a) | stage adversary per RESEARCH §R6.1, then `FRONTEND_PORT=<adversary port> npx playwright test -c tests/playwright.config.ts --grep <trivial>` ⇒ expect **exit 1** | ❌ W0 | ⬜ pending |
| INTEG-04 | This checkout's own server ⇒ preflight PASSES and specs proceed | behavioural (control run 2b) | `FRONTEND_PORT=<own port> yarn test:e2e --project=<one cheap project>` ⇒ **exit 0**, specs execute | ❌ W0 | ⬜ pending |
| INTEG-05 | Cannot be skipped by invocation shape | behavioural matrix | against a wrong port, run with: no flags · `--project=X` · `--grep` · `--shard=1/2` ⇒ **all exit 1** | ❌ W0 | ⬜ pending |
| INTEG-05 | Aborts *before* the first spec | behavioural | assert **no spec stdout** present in the failing run's output | ❌ W0 | ⬜ pending |
| INTEG-06 | Retired wording absent from live docs | static | `grep -rn -i "listener.*node process" CLAUDE.md tests/README.md tests/IDURA-TEST-RUNBOOK.md` ⇒ **no match** | ✅ passes today | ⬜ re-check |
| INTEG-06 | New wording present | static | grep for `FRONTEND_PORT` **and** `preflight` in each of the three files ⇒ match in each | ❌ W0 | ⬜ pending |
| D-05 | CI loops gone, both jobs | static | `grep -c "Wait for frontend" .github/workflows/main.yaml` ⇒ **0** | ❌ W0 | ⬜ pending |
| D-08 | `strictPort` present and effective | static + behavioural | `grep -n strictPort apps/frontend/vite.config.ts`; occupy the port **same-address** and confirm `yarn dev` exits non-zero | ❌ W0 | ⬜ pending |
| D-09 | Failure message carries all required fields | behavioural | inspect run-2a stderr for: expected port · expected checkout abs path · actual status · final URL · served module root · `<title>` · both remedies verbatim | ❌ W0 | ⬜ pending |
| D-09 | `lsof` line is best-effort, never fatal | behavioural | force `lsof` absent (PATH shim) ⇒ preflight still emits the full failure message and exits 1, no crash, no masking | ❌ W0 | ⬜ pending |
| D-16 | `.env` sets the dev server port | behavioural | with `FRONTEND_PORT=<free port>` in the root `.env` and NOT exported in the shell, run `yarn dev` ⇒ server listens on `<free port>`; `curl` confirms | ❌ W0 | ⬜ pending |
| D-16 | Shell still overrides `.env` | behavioural | with `.env` set to port A, run `FRONTEND_PORT=<B> yarn dev` ⇒ server listens on **B**, not A | ❌ W0 | ⬜ pending |
| D-16 | Unset var still yields 5173 | behavioural | remove `FRONTEND_PORT` from `.env` and shell ⇒ `yarn dev` listens on 5173 (no NaN) | ❌ W0 | ⬜ pending |
| D-17 | Docs describe the working hatch | static | the three live docs mention `.env` **and** the one-off prefix form; the superseded "export in the shell for both commands" caveat is absent | ❌ W0 | ⬜ pending |
| Regression | Whole suite still green | E2E | `yarn test:e2e` — **cardinal rule** | ✅ exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/global-setup.ts` (or equivalent) — the enforcement point; covers INTEG-04, INTEG-05
- [ ] The preflight clause logic module (e.g. `tests/tests/support/preflight.ts`) — clauses (a) 2xx
      after redirects, (b) the load-bearing `/@fs/<ABS_REPO_ROOT>/…/+layout.svelte` 200 probe,
      (c) `<title>` ∈ derived `dynamic.appName` set
- [ ] The staged-adversary recipe, scripted for repeatability — covers criterion 1 (D-11 option B)
- [ ] The throwaway retired-check script (D-12) — scratch only, never committed to the harness
- [ ] `137-NEGATIVE-CONTROL.md` — the durable evidence (D-13)
- [ ] `apps/frontend/vite.config.ts` converted to the `defineConfig(({ mode }) => ...)` form with `loadEnv` (D-16)
- [ ] **No test-framework install needed.**

---

## Manual-Only Verifications

| Behaviour | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| CI wait-loop removal behaves correctly on a real runner | D-05 | Failure mode is CI-only; no local reproduction exists (research could not obtain CI timing data — newest run 2026-07-26) | Push the branch and observe both the E2E job and the `e2e-visual` job reach the suite without the deleted loops; confirm the preflight's poll absorbs runner startup |
| The QUAL-1 wildcard shadow-bind is caught | INTEG-04 (bonus scenario) | Depends on a Docker container binding `*:5173` — environment-specific, not reproducible on demand | With the sibling container live, run the preflight against `localhost:5173` and confirm it FAILS despite `strictPort` having permitted our server's `[::1]` bind |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60 s for the quick command
- [ ] Two-run negative control recorded in `137-NEGATIVE-CONTROL.md` with BOTH halves of BOTH runs
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
