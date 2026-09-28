---
phase: 147
slug: candidate-app-scan-reach-authenticated-fixture-raw-key-gate
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-27
---

# Phase 147 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Register origin:** authored at plan time. All five PLAN files (`147-01` … `147-05`) carry a
parseable `<threat_model>` block, so this audit **verifies** the planned mitigations — it does not
retroactively construct a register. ASVS level 1, `block_on: high`.

**Scope note.** Phase 147 changed **7 tracked files, every one under `tests/`** — nothing under
`apps/` or `packages/`, no dependency added (`147-NEGATIVE-CONTROL.md` § `REV1-CLEAN`). Its threat
surface is therefore not a product-attack surface but an **evidence-integrity** surface: the phase
deliberately broke the product in the working tree to measure what the suite fails to catch, and
the dominant hazards are a botched revert shipping a real defect, and a green that was bought by a
weakened gate or an injection that never took.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| working tree → committed history | six deliberate product breakages (raw-key catalogue deletions, an `alt`-less image); a botched revert would ship a real WCAG violation and a broken message catalogue | source blobs under `apps/frontend/messages/**` and `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` |
| test suite → shared local Postgres | every suite run mutates one database and one `app_settings` singleton; a contaminated dataset silently invalidates every verdict taken against it | seeded test rows, `app_settings` singleton |
| dev server → served bytes | Paraglide compiles at server start; a verdict read without a restart is read against the pre-injection catalogue | compiled message catalogue (`en.js` and 6 locales) |
| unauthenticated runner → authenticated candidate routes | a stored session file is what crosses; a scan that silently lost it would scan the login page and report a confident zero about the wrong document | `tests/playwright/.auth/user.json` (seeded local test candidate) |
| blind half → catch half | the pairing is valid only while the instrument is provably the same blob on both sides | injected-state blob hashes |
| this phase's records → later phases' premises | a record corrected wrongly, or corrected without evidence, propagates as a false premise | planning documents, requirement tick marks |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-147-01 | Tampering | `apps/frontend/messages/**/candidateApp.questions.json`, `common.json` | high | mitigate | Each deletion reverted inside its own task, proven twice — `git diff --exit-code` at 0 **and** `git hash-object` equality against pre-injection hashes. Re-asserted phase-wide by `147-NEGATIVE-CONTROL.md` § `REV1-CLEAN`: 15/15 injected paths, range diff exit 0 and blob-hash equality at range base, HEAD and worktree — 0 differing. | closed |
| T-147-02 | Tampering | `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` | high | mitigate | Same two-proof revert; injection was additive markup only. Covered by `REV1-CLEAN` (whole phase changed 7 tracked files, all under `tests/`; nothing under `apps/` or `packages/`). `147-01-SUMMARY.md` Self-Check: `git diff --exit-code -- apps packages tests .github package.json yarn.lock` → 0; `git status --porcelain` clean. | closed |
| T-147-03 | Spoofing (of evidence) | the blind-half verdicts | high | mitigate | Compiled Paraglide export count recorded before/after each deletion and a dev-server restart required between injection and run. Recorded per row: `RK1-OLD` and `RK2-OLD` each `en.js` **598 → 597** with the named export gone (`147-NEGATIVE-CONTROL.md:215-216`, `:293`). A near-miss (single-trace false zero on the AX1 probe) was caught, re-measured across all 135 traces → 29 occurrences in 13 traces, and disclosed rather than deleted. | closed |
| T-147-04 | Denial of Service (self-inflicted) | shared local database | medium | mitigate | Every suite run in the phase taken against a `db:reset` database, asserted document-wide (`147-NEGATIVE-CONTROL.md:72`) and stamped per run (`DET-RUNS` carries a `db:reset ok <timestamp>` per run). | closed |
| T-147-05 | Tampering | `app_settings` singleton, via a co-scheduled perm setup | critical | mitigate | Phase-disjointness from every REPLACE-performing project checked by the derivation instrument **per enumerated wiring**, not asserted once for the chosen one — `147-ORDERING.md:234,250,268,285,300,318,334`, every wiring **NONE**. | closed |
| T-147-06 | Denial of Service | `test-e2e-base-ca-aa-1` candidate row, via a perm setup's `test-` pre-clear | high | mitigate | Weighed as an independent hazard, exposure recorded separately per wiring — `147-ORDERING.md`, every wiring **NONE**. | closed |
| T-147-07 | Spoofing (of evidence) | predicted phase assignments | high | mitigate | `ORD-OBSERVED`: the instrument reproduces the OBSERVED assignment of the unmodified config before any prediction is taken from it — `node tests/e2e-runs/147/phases.mjs --self-check` → 89 projects, **0 mismatches**, 80 predicted vs 80 observed; re-run at 0 against the restored config. Assignment mined from the run's own `results.json` via `observedFromRun()`, never from a hand-drawn graph. | closed |
| T-147-08 | Tampering | `tests/playwright.config.ts` | high | mitigate | Perturbation edit reverted inside the task, proven twice — `git diff --exit-code -- tests apps packages .github package.json yarn.lock` → 0 and `git hash-object` back to `fbbd85ae27895d9e19a73ad95113610dcf511c04` (`147-02-SUMMARY.md:101`, `:174`). | closed |
| T-147-09 | Spoofing | the scanned document's identity | critical | mitigate | `assertCandidateReach` — settled URL asserted inside the candidate application and not the login route, plus a per-entry marker that exists only after login; both proofs run after `reach`, not after `goto`. A redirected scan fails by name instead of reporting a confident zero. (`147-03-SUMMARY.md` § Threat Flags.) | closed |
| T-147-10 | Information Disclosure | `tests/playwright/.auth/user.json` | medium | **accept** | Session belongs to a seeded local test candidate with a known test password on a local Supabase; file is already produced under the visual opt-in and already git-ignored. Ungating changes how often it is written, not what it contains. See Accepted Risks Log `AR-147-01`. | closed (accepted) |
| T-147-11 | Tampering | the shared gates in `axeScan.ts` | high | mitigate | Both gate assertions live in one parameterless `assertAxeGates` with no per-surface relaxation knob; before/after title comparison proves the extraction changed no voter verdict; `grep -n toHaveLength candidate-a11y.spec.ts` returns nothing, so the candidate spec adds no gate of its own. | closed |
| T-147-12 | Repudiation | a scan that resolved on an unsettled surface | high | mitigate | REQUIRED data-driven `contentTestId` anchor as the last wait before settle; preview entry anchors on the success-branch article; questions entry expands every category before anchoring on a card. | closed |
| T-147-13 | Denial of Service | the default suite's wall clock | low | **accept** | Fourteen scans at ~22 s per theme; recorded as `REACH-14`'s delta against `BASE-GREEN` so the trade is visible rather than absorbed. Below the `high` block threshold. See Accepted Risks Log `AR-147-02`. | closed (accepted) |
| T-147-14 | Tampering | `apps/frontend/messages/**`, candidate `(protected)/+layout.svelte` (catch halves) | high | mitigate | Six injections, six reverts across the phase, each proven by `git diff --exit-code` **and** blob hash, plus a post-revert confirmation run for the axe half (`147-ax1-postrevert`, 5/5 passed). `REV1-CLEAN` re-asserts phase-wide. | closed |
| T-147-15 | Spoofing (of evidence) | the catch-half verdicts | critical | mitigate | Injected-state blob hashes compared against `147-01`'s recorded values **before** each run — 14/14 equal for the raw-key halves; the axe divergence disclosed with its substitute proofs rather than smoothed over. | closed |
| T-147-16 | Tampering | E2E preflight and global setup | high | mitigate | `REV1-CLEAN`: `tests/tests/support/preflight.ts` and `tests/global-setup.ts` byte-identical across the phase's full range `4adf451ed..ff37a87fc` — range diff exit 0 and hashes `389197f038e3…` / `1c4a29d3326a…` identical at base, HEAD and worktree. No green was bought by weakening the served-application gate. | closed |
| T-147-17 | Denial of Service (self-inflicted) | CI, via a non-deterministic new gate | high | mitigate | `DET-RUNS`: three consecutive full-suite runs from reset databases on one unchanged HEAD, each **150/0/0/0/0**, exit 0, preflight OK=1 FAILED=0 — four counting `E2E1-SUITE`. Nothing retried, replaced, abandoned or annotated. Recorded honestly as a **bound on failure frequency, not a proof of absence**. | closed |
| T-147-18 | Repudiation | the corrected records | high | mitigate | Every corrected claim cites the measurement it was corrected against (`147-SCOUT-INVENTORY.md` § B/§ D or a register row) and states its class; the REAL-04 correction states explicitly that it is a premise correction, not a decision change. | closed |
| T-147-19 | Information Disclosure (by omission) | the known gaps | medium | mitigate | Twelve todos filed, each with its own lever, cross-referenced from § Residue B/C/D — unscanned states and out-of-family routes filed individually rather than absorbed into a green summary. | closed |
| T-147-20 | Tampering | requirement tick marks | medium | mitigate | A tick may cite only a filled register row; the automated check rejects a tick whose cited row is absent or unfilled. Every tick cites at least one filled row by ID, machine-checked. | closed |
| T-147-SC | Tampering | npm/pip/cargo installs (supply chain) | high | mitigate | No install occurred anywhere in the phase. `git diff --exit-code 4adf451ed..HEAD -- package.json yarn.lock` exits 0; hashes `30a9c3774e2b…` / `b75c364ca876…` identical at range base, HEAD and worktree. Zero `[ASSUMED]`/`[SUS]` packages, so no legitimacy checkpoint was required. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (high) count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-147-01 | T-147-10 | `tests/playwright/.auth/user.json` holds a seeded **local test** candidate's session against a **local** Supabase, with a password already published in the test fixtures. The file is git-ignored and was already written today under the visual opt-in; ungating the fixture changes the write **frequency**, not the secret's value or blast radius. No production or shared-environment credential is involved. | 147-03 plan author (disposition `accept` recorded at plan time) | 2026-08-27 |
| AR-147-02 | T-147-13 | Fourteen added candidate scans cost ~22 s per theme of default-suite wall clock (measured: 32.1–33.4 s total across the three determinism runs). Severity **low** — below the `high` block threshold. Cost is recorded as `REACH-14`'s delta against `BASE-GREEN`, so the trade is visible in the register rather than silently absorbed. | 147-03 plan author (disposition `accept` recorded at plan time) | 2026-08-27 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-27 | 21 | 21 (19 mitigated, 2 accepted) | 0 | /gsd-secure-phase (orchestrator, ASVS L1 short-circuit) |

**Audit method.** State B (no prior SECURITY.md). Register built from the five PLAN `<threat_model>`
blocks and the SUMMARY `## Threat Flags` sections, then each mitigation traced to its recorded
evidence in `147-NEGATIVE-CONTROL.md`, `147-ORDERING.md`, and the plan summaries. Because
`threats_open: 0`, the register was authored at plan time, and `asvs_level: 1`, the workflow's
L1 short-circuit applied — grep-depth verification is sufficient at this level and no auditor
subagent was spawned.

**One recording gap, non-blocking.** `147-01-SUMMARY.md` and `147-02-SUMMARY.md` carry **no
`## Threat Flags` section** (`147-03` … `147-05` all do). Their nine threats
(T-147-01 … T-147-08 and T-147-SC) are nonetheless discharged — the evidence exists, in the
registers and in each summary's Self-Check, and is cited row by row above. The gap is in the
summary **format**, not in the mitigation. Worth tightening in the executor's summary template
rather than re-opening any threat here.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer) — 19 mitigate, 2 accept, 0 transfer
- [x] Accepted risks documented in Accepted Risks Log — AR-147-01, AR-147-02
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-27
