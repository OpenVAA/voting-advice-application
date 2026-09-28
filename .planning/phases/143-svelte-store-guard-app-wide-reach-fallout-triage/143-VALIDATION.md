---
phase: 143
slug: svelte-store-guard-app-wide-reach-fallout-triage
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-22
---

# Phase 143 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `143-RESEARCH.md` § Validation Architecture, whose every command was executed in-session.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 (frontend), orchestrated by `turbo run test:unit` |
| **Config file** | `apps/frontend/vitest.config.ts` (`globals: true`, `environment: 'jsdom'`) |
| **Quick run command** | `cd apps/frontend && npx vitest run src/lib/_guards/` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~2 s quick · full unit suite minutes |

> **Cache asymmetry — load-bearing for this phase.** `turbo.json` sets `"cache": false` on `test:unit`
> but **not** on `lint`. Gate 1 is always a real run; **Gate 2 is not**. Every lint measurement that
> becomes evidence runs `TURBO_FORCE=true` (**D-02a**). `yarn lint:check --force` does **not** work —
> yarn appends the argument to the end of the `&&` chain.

---

## Sampling Rate

- **After every task commit:** `cd apps/frontend && npx vitest run src/lib/_guards/` (~2 s) — the guard
  spec is the only unit surface this phase changes.
- **After every plan wave:** `yarn test:unit` (uncached) + `TURBO_FORCE=true yarn lint:check`.
- **Before `/gsd-verify-work`:** all six gates green (**D-14**) under **D-15**'s prereq.
- **Max feedback latency:** ~2 s per task; minutes per wave.

---

## Per-Task Verification Map

> Task IDs are assigned by the planner. This map is completed at plan time and ticked during
> execution; the requirement/behaviour rows below are fixed now and must each acquire a task.

| Behaviour | Plan | Requirement | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|
| Ledger rows written **before** the first injection | 01 | ASSERT-08 | procedural gate | ledger inspection + commit order | ❌ Wave 1 | ⬜ pending |
| **Blind half** — 4 injections PASS under the reconstructed pre-115 scope | 01 | ASSERT-08 | one-time measurement, real gate | `TURBO_FORCE=true yarn lint:check` under the narrowed config | ❌ Wave 1 | ⬜ pending |
| Restore proven — tracked diff clean · untracked injection set empty · config blob hash byte-identical | 01 | ASSERT-08 | three-assertion proof | `git diff --exit-code` + `git status --porcelain` + `git hash-object` | ❌ Wave 1 | ⬜ pending |
| Pre-existing-usage inventory: both greps, HEAD recorded, per-file disposition | 01 | ASSERT-09 | one-time measurement | `git grep -n "svelte/store" -- apps/frontend/src`; `git grep -n "from 'svelte/store'" -- apps packages` | ❌ Wave 1 | ⬜ pending |
| Out-of-scope measurements recorded (`svelte/motion`, outside-`src/`) | 01 | ASSERT-08 | one-time measurement | ESLint API probes 12-13 | ❌ Wave 1 | ⬜ pending |
| Exclusion-list size **re-measured** and stated (16, 0 additions) | 01 | ASSERT-08 (SC-3) | one-time measurement | count entries at `eslint.config.mjs:23-40` | ❌ Wave 1 | ⬜ pending |
| Static import fires in 4 dirs × `.ts` | 02 | ASSERT-08 | unit (ESLint API) | `npx vitest run src/lib/_guards/eslint-store-guard.test.ts` | ⚠️ 1 of 8 today | ⬜ pending |
| Static import fires in 4 dirs × `.svelte` (svelte-eslint-parser path) | 02 | ASSERT-08 | unit (ESLint API) | same | ❌ Wave 2 (**D-04**) | ⬜ pending |
| Clean rune code stays silent (negative control, all 8 cells) | 02 | ASSERT-08 | unit (ESLint API) | same | ⚠️ 1 of 8 today | ⬜ pending |
| **Catching half** — 4 injections FAIL the real gate naming file + rule | 02 | ASSERT-08 | one-time measurement, real gate | `TURBO_FORCE=true yarn lint:check` | ❌ Wave 2 | ⬜ pending |
| `.js` under `src/` importing `svelte/store` fails | 02 | ASSERT-08 (SC-5) | unit + real gate | matrix probe + one real-gate injection | ❌ Wave 2 (**D-05**) | ⬜ pending |
| Glob widening produces **zero new violations** (re-measured, not assumed) | 02 | ASSERT-08 (SC-5) | one-time measurement | `TURBO_FORCE=true yarn lint:check` | ❌ Wave 2 (**D-05**) | ⬜ pending |
| `await import('svelte/store')` fails, in `.ts` and `.svelte` | 02 | ASSERT-08 (SC-5) | unit (ESLint API) | matrix probe filtering `no-restricted-syntax`, disambiguated **by message** | ❌ Wave 2 (**D-06**) | ⬜ pending |
| **Inherited `TSEnumDeclaration` ban survives** the `no-restricted-syntax` edit | 02 | ASSERT-08 (SC-9) | unit (ESLint API), **standing** | probe filtering `no-restricted-syntax` + `message.includes('const assertion')` | ❌ Wave 2 (**D-06a**) | ⬜ pending |
| SC-9's own two-run control: enum case RED against the naive one-entry patch, GREEN against the shipped two-entry one | 02 | ASSERT-08 (SC-9) | two-run control | same probe, run against both patches | ❌ Wave 2 (**D-06a**) | ⬜ pending |
| Five record targets corrected, `7c47b35b7` named at each | 02 | ASSERT-08/09 (SC-7) | doc review | grep each target for the commit hash | ❌ Wave 2 (**D-12**, **D-12a**) | ⬜ pending |
| Six gates green | 03 | ASSERT-08/09 (SC-8) | gate run | see table below | ❌ Wave 3 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

### Phase gate table (`143-03`, **D-14** / **D-15**)

| # | Gate | Command | Cached? | Note |
|---|------|---------|---------|------|
| 1 | unit | `yarn test:unit` | no | — |
| 2 | lint | `TURBO_FORCE=true yarn lint:check` | **yes by default — force it** | Short-circuits: a red hides the later chain steps; the ledger must say so |
| 3 | format | `yarn format:check` | no | Will flag the config edit unless `prettier --write` ran |
| 4 | build | `yarn build` | turbo-cached, harmless | — |
| 5 | typecheck | `yarn workspace @openvaa/frontend check` | no | 142.1's non-optional addition — neither lint nor build typechecks `apps/frontend/src` |
| 6 | E2E | `yarn test:e2e` **once** | no | Cardinal rule; **D-15** prereq: `yarn db:reset` + one fresh dev server on `:5173` |

---

## Wave 0 Requirements

- **No new test infrastructure is required.** `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts`
  already exists, is already discovered by `vitest run`, and already carries the correct apparatus
  (ESLint JS API + `v10_config_lookup_from_file`). **D-04** widens it in Wave 2.
- **One Wave-1 prerequisite that is not a test file:** `143-NEGATIVE-CONTROL-LEDGER.md` must exist with
  **every row written before the first injection** (**D-03** / **D-13**, the 142.1 D-19 rule). Row
  schema extends Phase 141's (`| Row | Branch exercised | Injection site | Exit | Outcome |`) with two
  columns this phase makes necessary:
  - **`HEAD`** — per row, since **D-03** puts a commit between the halves (the 142.1 precedent).
  - **`turbo verdict`** — `executing <hash>` / `replaying <hash>`, so a replayed exit 0 can never be
    credited as a measured blind GREEN (**D-02a**).

---

## Manual-Only Verifications

| Behaviour | Requirement | Why Manual | Instructions |
|---|---|---|---|
| The narrow → measure → restore window | ASSERT-08 (**D-02**) | Deliberately breaks the working tree; cannot be automated without leaving the breakage recoverable-by-script, which would weaken the restore proof | Narrow `eslint.config.mjs` `files` to the pre-115 pair · run the 4 injections through `TURBO_FORCE=true yarn lint:check` · record 4 GREEN · restore · prove with all three assertions. **No other work may interleave.** |
| E2E gate | SC-8 (**D-14**/**D-15**) | Requires a clean DB and one fresh dev server; the suite is the project's trusted signal under the cardinal rule | `yarn db:reset` · one fresh dev server on `:5173` · `yarn test:e2e` once |

---

## Validation Sign-Off

- [ ] All tasks have an automated verify or a named Wave-1 measurement
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Every ledger lint command carries `TURBO_FORCE=true`
- [ ] Restore proof uses all three assertions, not `git diff` alone
- [ ] SC-9's enum case is a **standing** matrix case, not a one-time assertion
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
