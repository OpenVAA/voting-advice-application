---
phase: 147
slug: candidate-app-scan-reach-authenticated-fixture-raw-key-gate
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-27
reconstructed_from: artifacts (State B — no VALIDATION.md existed at execution time)
---

# Phase 147 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Reconstructed retroactively from `147-0{1..5}-PLAN.md`, `147-0{1..5}-SUMMARY.md`,
> `147-NEGATIVE-CONTROL.md` and `147-VERIFICATION.md`.

**Note on this phase's shape.** Phase 147's _implementation_ is test infrastructure — all 7 tracked
product files live under `tests/`. "Does the phase have tests?" is therefore the wrong question; the
right one is **"can the phase's own gates silently stop gating?"** Every gap below is of that shape:
a change that removes coverage while leaving the suite green.

---

## Test Infrastructure

| Property               | Value                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **Framework**          | Playwright 1.x (E2E, `@axe-core/playwright`) + Vitest 3.x (unit) + plain-Node guard scripts |
| **Config file**        | `tests/playwright.config.ts` · `vitest.workspace.ts` · `tests/tsconfig.json`                |
| **Quick run command**  | `yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring`                       |
| **Full suite command** | `yarn test:e2e` (150 tests, incl. the 14 candidate scans)                                   |
| **Estimated runtime**  | quick: **~0.1 s** · full E2E: ~12–15 min · `yarn lint:check`: ~2–3 min                      |

### Where each layer actually runs

| Layer                  | Config                                           | Standing command                          | In CI              |
| ---------------------- | ------------------------------------------------ | ----------------------------------------- | ------------------ |
| E2E (Playwright)       | `tests/playwright.config.ts`                     | `yarn test:e2e`                           | ✅ `main.yaml:289` |
| Unit (packages/apps)   | `vitest.workspace.ts`, via `turbo run test:unit` | `yarn test:unit`                          | ✅ `main.yaml:95`  |
| Typecheck (tests)      | `tests/tsconfig.json`                            | `yarn lint:check` → `typecheck:tests`     | ✅ `main.yaml:92`  |
| Phase-147 guards (new) | `scripts/assert-*.mjs`                           | `yarn test:e2e` **and** `yarn lint:check` | ✅ both            |
| Unit (`tests/utils`)   | `tests/vitest.config.ts`                         | — **none**                                | ❌ see Residue R1  |

---

## Sampling Rate

- **After every task commit:** `yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring` (~0.1 s)
- **After every plan wave:** `yarn lint:check` (includes both guards + `typecheck:tests`)
- **Before `/gsd-verify-work`:** `yarn test:e2e` green — 150/0/0/0/0, on a `db:reset` database, one fresh dev server
- **Max feedback latency:** **0.1 s** for the wiring/coverage invariants; full-suite otherwise

---

## Per-Task Verification Map

| Task ID      | Plan       | Wave | Requirement            | Threat Ref          | Secure Behavior                                                                                               | Test Type        | Automated Command                                                                           | File Exists | Status      |
| ------------ | ---------- | ---- | ---------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ----------- | ----------- |
| 147-01-01    | 01         | 1    | CSCAN-02/03            | T-147-SC            | Register opened with all 13 row IDs pre-written; dev server proven to be _this_ checkout                      | integration      | `devserver.sh status` + node assertion over the 13 row IDs                                  | ✅          | ✅ green    |
| 147-01-02    | 01         | 1    | CSCAN-03               | T-147-01 / T-147-03 | Catalog injections reverted; blob-hash equality proven                                                        | negative-control | `git diff --exit-code -- apps/frontend/messages apps/frontend/src/lib/i18n` + row assertion | ✅          | ✅ green    |
| 147-01-03    | 01         | 1    | CSCAN-02               | T-147-02            | WCAG defect reverted; full suite green _with defect live_ (blind half)                                        | negative-control | `git diff --exit-code -- apps/frontend/src/routes/candidate` + row assertion                | ✅          | ✅ green    |
| 147-02-01    | 02         | 2    | CSCAN-01/03            | T-147-05            | Phase assignment read from run output, never from a prediction                                                | integration      | `git diff --exit-code -- tests/playwright.config.ts && node phases.mjs --self-check`        | ✅          | ✅ green    |
| 147-02-02    | 02         | 2    | CSCAN-01               | T-147-06/07         | Ungating `auth-setup` does not perturb the default suite                                                      | integration      | `git diff --exit-code -- tests/playwright.config.ts` + row assertion                        | ✅          | ✅ green    |
| 147-02-03    | 02         | 2    | CSCAN-01/03            | T-147-08            | Both mechanisms decided against a pre-registered rule                                                         | doc-assertion    | node assertion over `147-ORDERING.md` § Decision                                            | ✅          | ✅ green    |
| 147-03-01    | 03         | 3    | CSCAN-02               | T-147-09            | Scan core extracted with **zero** reported change to voter titles                                             | regression       | `npx playwright test --project=a11y-smoke --list --reporter=json` diff                      | ✅          | ✅ green    |
| 147-03-02    | 03         | 3    | CSCAN-01/02            | T-147-10/11         | 14 authenticated scans, each carrying its own reach proof                                                     | e2e              | `npx playwright test --list` assertion + REACH-14 row (14/14 green)                         | ✅          | ✅ green    |
| 147-03-03    | 03         | 3    | CSCAN-02               | T-147-12/13         | Parity table written where the scans live; in-code records corrected                                          | doc-assertion    | node assertion over both spec files                                                         | ✅          | ✅ green    |
| 147-04-01    | 04         | 4    | CSCAN-02               | T-147-14            | Same defect now **fails** all 14 scans by rule ID + selector (catch half)                                     | negative-control | `git diff --exit-code -- apps/frontend/src/routes/candidate` + AX1-NEW row                  | ✅          | ✅ green    |
| 147-04-02    | 04         | 4    | CSCAN-03               | T-147-15            | Key caught by name while its named matcher passes in the **same** run                                         | negative-control | `git diff --exit-code -- apps/frontend/messages …` + RK1/RK2-NEW rows                       | ✅          | ✅ green    |
| 147-04-03    | 04         | 4    | CSCAN-02/03            | T-147-16/17         | Full suite 150/0/0/0/0 ×4 runs; 15/15 blob hashes byte-identical                                              | e2e              | `git diff --exit-code` (preflight, global-setup, package.json, yarn.lock) + suite           | ✅          | ✅ green    |
| 147-05-01    | 05         | 5    | CSCAN-04               | T-147-18            | REAL-04 retired as a **wording** correction; drifted citations fixed in 4 records                             | doc-assertion    | node assertion over the 4 corrected records                                                 | ✅          | ✅ green    |
| 147-05-02    | 05         | 5    | CSCAN-01..04           | T-147-19            | Four requirements ticked against **row IDs**, not prose; 12 todos filed                                       | doc-assertion    | node assertion over `.planning/REQUIREMENTS.md` Candidate section                           | ✅          | ✅ green    |
| 147-05-03    | 05         | 5    | CSCAN-01..04           | T-147-20            | Phase boundaries read honestly                                                                                | **manual**       | _(checkpoint:human-verify — see Manual-Only)_                                               | ✅          | ✅ approved |
| **147-V-G1** | _validate_ | —    | **CSCAN-04**           | —                   | Catalog union stays application-wide **by namespace**, not merely ≥400 keys                                   | guard            | `yarn assert:i18n-catalog-namespaces`                                                       | ✅          | ✅ green    |
| **147-V-G2** | _validate_ | —    | **CSCAN-02**           | —                   | `candidate-a11y-scan` stays default-on, keeps its `testMatch`/`storageState`, stays in the perm anchor's deps | guard            | `yarn assert:a11y-scan-wiring`                                                              | ✅          | ✅ green    |
| **147-V-G3** | _validate_ | —    | **CSCAN-02** (crit. 6) | —                   | Both a11y specs gate through the one shared core; neither builds its own `AxeBuilder`/`withTags`              | guard            | `yarn assert:a11y-scan-wiring`                                                              | ✅          | ✅ green    |
| **147-V-G4** | _validate_ | —    | **CSCAN-03**           | —                   | Raw-key verdict computed **and** reported (`expect.soft`) before `assertAxeGates` always runs                 | guard            | `yarn assert:a11y-scan-wiring`                                                              | ✅          | ✅ green    |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

**Sampling continuity:** no 3 consecutive tasks without an automated verify. 14 of 15 executed tasks
carry an `<automated>` block; the single exception (147-05-03) is a `checkpoint:human-verify` by design.

---

## Wave 0 Requirements

Existing infrastructure covered all phase requirements at execution time. This audit added two
standing guards (no framework install, no new dependency, Node built-ins only):

- [x] `scripts/assert-i18n-catalog-namespaces.mjs` — G1, CSCAN-04
- [x] `scripts/assert-a11y-scan-wiring.mjs` — G2/G3/G4, CSCAN-02 + CSCAN-03
- [x] Wired into `package.json`: `test:e2e` and `lint:check` (both run in CI)

---

## Gaps Found and Filled (this audit)

Each guard was proven to **catch**, not merely to pass — the phase's own catch-half/blind-half
standard applied to the guards themselves. Controls marked ⬦ were run independently by the
orchestrator _after_ the auditor returned, deliberately choosing mutations the auditor had not tried,
to check the guards were not fitted to their own controls.

| Gap | Req              | Was silent because                                                                                                                                                                                                                                           | Negative control                                                                        | Guard output                                                                                                                                                      | Reverted clean |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| G1  | CSCAN-04         | Only guard was `MIN_EXPECTED_KEYS = 400` in `rawKeyScan.ts`. The union is 598 = 161 `candidateApp.*` + 121 `adminApp.*` + 316 voter/shared — so deleting the **entire** `adminApp` namespace leaves 477 and passes                                           | delete all `adminApp*.json`                                                             | `namespace 'adminApp.*' has only 0 catalog key(s), below its floor of 50` (exit 1)                                                                                | ✅             |
| G1  | CSCAN-04         | ⬦ the two keys the phase's own controls injected against were unguarded                                                                                                                                                                                      | delete `common.required`                                                                | `required catalog key 'common.required' is missing … that control can no longer be trusted` (exit 1; 598→597)                                                     | ✅             |
| G2  | CSCAN-02         | Removing the scan from `data-setup-perm-1e1cg1co`'s deps drops 14 scans; suite reports fewer tests and **still 0 failures**. The phase's own ordering instrument (`tests/e2e-runs/147/phases.mjs`) is gitignored, so it never was a standing gate            | remove `'candidate-a11y-scan'` from the perm anchor's deps                              | `'data-setup-perm-1e1cg1co' no longer names 'candidate-a11y-scan' in its dependencies array` (exit 1)                                                             | ✅             |
| G2  | CSCAN-02         | ⬦ nothing pinned the scan to the **default-on** gate specifically                                                                                                                                                                                            | re-gate the family from `PLAYWRIGHT_NO_A11Y` (opt-out) to `!PLAYWRIGHT_VISUAL` (opt-in) | `'candidate-a11y-scan' is no longer inside the PLAYWRIGHT_NO_A11Y-gated project array … It must default-on and share the same opt-out (CSCAN-02)` (exit 1)        | ✅             |
| G2  | CSCAN-02         | Losing `a11y-smoke`'s explicit `testMatch` makes it collect the candidate spec **without** the stored session — every route 307s to login and the scan reports a clean zero about a login page ("silently wrong AND green", `playwright.config.ts:~483-496`) | remove `a11y-smoke`'s `testMatch`                                                       | `'a11y-smoke' project no longer has an explicit testMatch for a11y-smoke.spec.ts` (exit 1)                                                                        | ✅             |
| G3  | CSCAN-02 crit. 6 | Strictness parity was a one-time grep of the imports                                                                                                                                                                                                         | add a local `AxeBuilder`/`.withTags(` in `candidate-a11y.spec.ts`                       | `candidate-a11y.spec.ts constructs its own AxeBuilder or calls .withTags(...)` (exit 1)                                                                           | ✅             |
| G4  | CSCAN-03         | Reverting `assertAxeScan` to short-circuit order hides raw-key findings behind any a11y failure                                                                                                                                                              | ⬦ `expect.soft(rawKeys.findings` → throwing `expect(`                                   | `assertAxeScan's body no longer contains one of the four expected calls … this guard cannot verify the ordering invariant (CSCAN-03)` — **fails closed** (exit 1) | ✅             |

After every control: `git diff --exit-code -- tests/ apps/ packages/` clean. All 7 tracked Phase-147
product files are byte-unchanged by this audit; the only edits are two new `scripts/*.mjs` files and
the `package.json` wiring.

---

## Manual-Only Verifications

| Behavior                                                         | Requirement        | Why Manual                                                                                                                                         | Test Instructions                                                                               |
| ---------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| The catch/blind halves themselves (AX1-OLD/NEW, RK1/RK2-OLD/NEW) | CSCAN-02, CSCAN-03 | A negative control is a one-time injected-defect measurement, not a standing regression test. Making them standing would mean shipping the defects | Re-run per `147-NEGATIVE-CONTROL.md`; evidence in `tests/e2e-runs/147-{ax1,rk1,rk2}-{old,new}/` |
| Phase boundaries read honestly (147-05-03)                       | CSCAN-01..04       | `checkpoint:human-verify` — judgement about whether a record's prose overstates its evidence is not machine-checkable                              | Read `147-NEGATIVE-CONTROL.md` § _Residue A–F_ against `.planning/REQUIREMENTS.md:40`           |
| Determinism (3 consecutive full-suite runs from a reset DB)      | CSCAN-02           | Requires a dedicated dev server, `db:reset` per run, and ~45 min; not a per-commit gate                                                            | `yarn db:reset && yarn test:e2e`, ×3, per `project_e2e_execution_devserver_prereq`              |

---

## Residue

| #      | Item                                                                                                                                                                                                                                                                                                                                | Impact                                                                                                                                                                                                                                     | Disposition                                                                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1** | `tests/vitest.config.ts` is in neither `vitest.workspace.ts` nor any turbo workspace (`tests/` has no `package.json`), and `scripts/assert-unit-test-coverage.mjs` scans only `packages/*` / `apps/*`. Its three test files (`preflight.test.ts`, `tcpForward.test.ts`, `buildTestIdToken.test.ts`) run in **no** automated command | Pre-existing, **not** introduced by Phase 147. It is the same incident shape `assert-unit-test-coverage.mjs` exists for, in the one directory that guard cannot see. It is why both new guards were placed in `scripts/` rather than there | **File as a todo** — out of scope for a Phase-147 validation audit                                                                                        |
| **R2** | `assert-i18n-catalog-namespaces.mjs` reads `apps/frontend/messages/en` directly; it does not assert that this is the same directory `rawKeyScan.ts`'s `RUNTIME_CATALOG_DIR` resolves to                                                                                                                                             | Repointing the scanner's catalog dir would narrow the scan while the guard stayed green                                                                                                                                                    | Accepted; the runtime catalog is the union's strict superset per `rawKeyScan.ts`'s own docblock. Worth a follow-up that derives the path from the scanner |
| **R3** | `assert-a11y-scan-wiring.mjs` is regex-over-source, not AST or config evaluation                                                                                                                                                                                                                                                    | Fails **closed** on shape change (proven by the G4 control), so it cannot go silently green — but a semantically-equivalent restructure will trip it as a false positive needing the guard updated                                         | Accepted; matches the house style of `assert-unit-test-coverage.mjs` and is the cheapest thing that names the violation precisely                         |
| **R4** | Both guards now run inside `yarn test:e2e`, so a guard failure aborts the suite **before** the Phase-137 preflight                                                                                                                                                                                                                  | Intended (fail fast, ~0.1 s). Noted so a future reader is not surprised that an E2E invocation can fail without Playwright ever launching                                                                                                  | Accepted and documented here                                                                                                                              |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (14/15; 1 human-verify checkpoint by design)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (2 guards added and wired)
- [x] No watch-mode flags
- [x] Feedback latency < 1 s (measured: 0.085 s for both guards)
- [x] Every added guard proven to catch, not merely to pass
- [x] Zero implementation files modified (`git diff --exit-code -- tests/ apps/ packages/` clean)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-27
