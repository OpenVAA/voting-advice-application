---
phase: 141
slug: package-unit-test-coverage-test-unit-invariant-guard
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-18
gate_evidence: 141-GATES.md (gates 1-8 all green at HEAD 282443a91/2fccb6b58, run 2026-08-18; gate 8 E2E 135/135, 0 failed, 0 flaky, 0 did-not-run)
---

# Phase 141 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `141-RESEARCH.md` § Validation Architecture, amended for D-16/D-17.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 (`catalog: vitest: ^3.2.4`, `.yarnrc.yml:8`); Playwright `^1.58.2` for E2E |
| **Config file** | Per-workspace `packages/*/vitest.config.ts` (present in all 5 targets); `tests/playwright.config.ts`. Root `vitest.workspace.ts` exists but is **deprecated — do not wire through it** |
| **Quick run command** | `cd packages/<p> && npx vitest run` (~0.4 s per package) |
| **Full suite command** | `yarn test:unit` (~29 s cold, ~15 s warm) |
| **Guard-load check** | `npx playwright test -c ./tests/playwright.config.ts --list` (exercises all three config-load guards without running a suite) |
| **Estimated runtime** | ~30 s unit; E2E full suite per the cardinal rule |

---

## Sampling Rate

- **After every task commit:** `yarn test:unit` (the command under change). Additionally
  `npx playwright test -c ./tests/playwright.config.ts --list` whenever `tests/` is touched.
- **After every plan wave:** `yarn test:unit` full + `yarn lint:check`
- **Before `/gsd-verify-work`:** `yarn build` → `yarn test:unit` → full `yarn test:e2e` green
  (cardinal rule), preflight-confirmed, on one fresh dev server
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

Seeded at requirement granularity; `/gsd-validate-phase` refines to task IDs once plans exist.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 141-01-01 | 01 | 1 | UNIT-03 | — | N/A | git-order property | **Refined during Gate 5** to `git merge-base --is-ancestor <record> <wiring>` (exit 0) **and** `<record> ≠ <wiring>`, replacing the seeded `git log --format='%H %ad'` timestamp comparison — dates are rebase-/amend-mutable and carry no ordering guarantee; the commit DAG does | ✅ `141-MEASUREMENT.md` | ✅ green — 10 pairs (5 packages × 2 record readings), 10 exit-0 ancestries, 10 distinct hash pairs (`141-GATES.md` Gate 5) |
| 141-02-01/02 | 02 | 2 | UNIT-01 | — | N/A | integration (pipeline) | `yarn test:unit` with a planted failing assertion in `core` **and** `matching`; expect EXIT≠0 and both filenames in output; revert | ✅ `141-NEGATIVE-CONTROL.md` Rows 1, 4, 5 | ✅ green — blindness Row 1 (exit 0), catch Rows 4+5 (5 runs, 5 non-zero exits) |
| 141-03-01 | 03 | 2 | UNIT-02 | T-141-01 | Unparsed `package.json` throws by name, never silently skips | integration (pipeline) | `npx turbo run test:unit --dry=json` filtered on `command !== '<NONEXISTENT>'`, diffed against the test-file set | ✅ `scripts/assert-unit-test-coverage.mjs` Check 2; `141-NEGATIVE-CONTROL.md` Rows 3, 6, 8 | ✅ green — discrimination Row 3, catch Rows 6+8; census 12/3 re-derived at HEAD (`141-GATES.md` Gate 2) |
| 141-03-01 | 03 | 2 | UNIT-04 | T-141-01 | Guard accepts no path argument; traversal impossible by construction | integration (guard) | `yarn test:unit` with/without scratch `packages/zz-scratch/`; expect fail-by-name, then pass | ✅ `scripts/assert-unit-test-coverage.mjs` Check 1; `141-NEGATIVE-CONTROL.md` Rows 2, 7 | ✅ green — blindness Row 2 (exit 0), catch Row 7 (4 injections, both remedy directions) |
| 141-04-01 | 04 | 1 | ASSERT-10 | — | N/A | integration (guard) | `npx playwright test -c ./tests/playwright.config.ts --list` under each of 4 injections + clean baseline + clean revert | ✅ guard exists (`tests/playwright.config.ts:138-240`, read-only per D-15); record in `141-ASSERT10-LEDGER.md` | ✅ green — 9 rows / 9 runs; blindness A+E, catch B/C/D/F; rows A and I both `Total: 143 tests in 94 files` |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**All five rows green as of the gate run at HEAD `282443a91`** (`141-GATES.md` Gates 1-7; Gate 8 green at `2fccb6b58`), which is why
`nyquist_compliant: true` is set in the front matter above. Front-matter `status`
deliberately remains `draft`: per the lifecycle comment at the top of this file, the
`draft → validated` transition is owned by `/gsd-validate-phase` §6, not by an executor,
and this plan's mandate covered `wave_0_complete` and `nyquist_compliant` only. A reader
applying audit-milestone §5.5 should note that this file is `validated`-eligible on
evidence but has not yet had that transition run.

---

## Wave 0 Requirements

- [x] `scripts/assert-unit-test-coverage.mjs` — the UNIT-04 orphaned-package guard.
      Per **D-16** it scans **both `packages/*` and `apps/*`** via a single array constant.
      *Shipped in `84a9a2745`; `WORKSPACE_ROOTS = ['packages', 'apps']` at `:80`; the guard's
      own summary reports the two roots on every run.*
- [x] The UNIT-02 turbo cross-check, folded into that same guard per **D-17**.
      **Must be demonstrated failing before the wiring lands** — see Pitfall 1 below.
      *Demonstrated: `141-NEGATIVE-CONTROL.md` Row 3 (naive variant GREEN on the unwired
      tree, discriminating variant RED) precedes the wiring commits; Row 6 records the
      7/8 → 12/3 transition with the naive variant unmoved.*
- [x] A committed per-package measurement record for UNIT-03 (plan 01 output),
      predating the wiring commits in git order.
      *`141-MEASUREMENT.md`, added by `6c10d63d0`; ancestry re-derived at `141-GATES.md` Gate 5.*
- [x] A committed four-branch injection ledger for ASSERT-10, **re-run and recorded by
      this phase** — research's ledger is a template, not a substitute (D-15).
      *`141-ASSERT10-LEDGER.md` — nine rows, nine runs, at HEAD `9b6d939a1`; the four
      catch branches are B (equality), C (containment), D (completeness), F (enumeration
      scope), with A/E/G2/I as the must-not-fire cases.*
- [x] No framework install needed — vitest, turbo and playwright are all present.

### Pitfall 1 — the cross-check that is green before the work (BLOCKING)

`turbo run test:unit --dry=json` lists **all** workspaces, including unwired ones, as
`"command": "<NONEXISTENT>"`. A naive diff of `tasks[].package` against the test-file set
therefore **passes at HEAD, before any work lands** — a fake guard of exactly the class
Phase 140 spent six plans removing. The discriminator is `command !== '<NONEXISTENT>'`.
Currently 7 executed / 8 unwired; 12 / 3 once wiring lands. **The cross-check must be
observed red against an unwired package before it is accepted as green.**

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Doc reconciliation is factually correct | ASSERT-10 / D-15 | Prose correction to `ROADMAP.md:387`, `REQUIREMENTS.md:63` and the stale `missing:` item in `140-VERIFICATION.md`; no automated oracle for "this sentence is now true" | Re-read each corrected line against `tests/playwright.config.ts:138-240` and confirm the claim matches the shipped guard |

All other phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references — all four Wave 0 items above are now `[x]`
- [x] No watch-mode flags (bare `vitest run`, never `vitest` — D-12). *The five wired
      packages all use `vitest run`; the root `test:unit:watch` script is a separate,
      deliberately-named entry point and is not in the `test:unit` path.*
- [x] Both guards observed **red** before being accepted green (negative controls).
      *Check 1 / UNIT-04: `141-NEGATIVE-CONTROL.md` Rows 2 → 7. Check 2 / UNIT-02:
      Rows 3 → 6 + 8. Teardown-prefix guard / ASSERT-10: `141-ASSERT10-LEDGER.md`
      Rows A + E → B, C, D, F. Completeness re-checked at `141-GATES.md` Gate 6.*
- [x] Feedback latency < 30s — measured `yarn test:unit` wall clock **16.947 s**
      (`141-GATES.md` Gate 1)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved on evidence — `141-GATES.md`, Gates 1-8, run 2026-08-18.
Gate 8 (the phase-completing full E2E run under the cardinal rule) is **cardinal-clean**:
135 executed / 135 passed / **0 failed / 0 flaky / 0 did-not-run** in 628.331 s, preflight
confirmed against this checkout, on one fresh dev server at port 5173 over a `yarn
db:reset` database. Counts are `report.json`'s, not the console tail's.
