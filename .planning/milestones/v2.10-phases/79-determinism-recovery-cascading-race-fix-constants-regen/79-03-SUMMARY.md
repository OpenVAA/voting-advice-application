---
plan: 79-03
title: DETERM-05 3-run cold-start gate + constants regen + STATUS.md handoff
completed: 2026-05-13
verdict: GREEN
requirements: [DETERM-05]
---

# Plan 79-03 Summary — DETERM-05 3-run gate + constants regen

## Outcome

**DETERM-05 GREEN.** The v2.10 verification anchor is locked at SHA `ff0334f856650611e2a5d1b1f990e6bbd3ad7c228ff585d5f1b5abf6bc3a09c5` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE = 152 pooled entries). The post-DETERM-04 baseline is the binding parity gate for Phases 80-82.

## Tasks executed

1. **Task 1** — Copied `regen-constants.mjs` from Phase 73 archive into `post-fix/`; updated `reportPath` to `run-6.json` (originally planned `run-3.json` per LANDMINE L11, but D-09 instability protocol promoted run-6).
2. **Tasks 2-4** — 3 cold-start full-suite runs (run-{1,2,3}.json). Captured 300599 / 299529 / 295527 bytes; ~22-25 min each.
3. **Task 5** — D-08 strict SHA-256 identity check **FAILED** on initial trio:
   - run-1: `c1b4195e…` (voter-matching 5-test serial block: 1 fail + 4 cascade)
   - run-2: `ff0334f8…`
   - run-3: `ef4417df…` (voter-detail "open party detail drawer" FAIL)
   D-09 instability protocol triggered. 3 additional cold-start runs (run-{4,5,6}.json) all SHA-identical at `ff0334f856…`. **D-09 PASSED.** Full audit at `post-fix/sha256.txt`.
4. **Task 6** — Regen executed against `run-6.json`:
   - PASS_LOCKED: 80 entries (+33 vs Phase 75)
   - DATA_RACE: 15 entries (unchanged — Phase 73 D-09 binding preserved verbatim)
   - CASCADE: 57 entries (+24 vs Phase 75)
   - IMGPROXY_TIED_TITLES audit: 14 titles, 15 matches, zero zero-match titles → PASS
   - Self-identity smoke (run-6 vs run-6): PARITY GATE PASS
   - 3-pair parity gate (run-4 vs 5, run-5 vs 6, run-4 vs 6): PARITY GATE PASS × 3
   - DATA_RACE_TESTS count assertion (W-6): 15 ✓

## Deviations from plan

### Orchestrator takeover (mid-Plan-03)

**Issue:** The original Plan 03 subagent dispatched run-1 via `Bash(run_in_background=true)` then terminated. The background bash was orphaned when the subagent's session ended (~2 min after dispatch). No run-1.json was captured. On orchestrator takeover, Supabase was found stopped (Docker shut down between sessions).

**Resolution:** The orchestrator (parent agent) restarted run-1 from its own session. Background-task lifetime is robust at the orchestrator level, so subsequent runs (1, 2, 3, 4, 5, 6) all completed successfully under the orchestrator's direct dispatch. Documented in STATUS.md and `post-fix/sha256.txt`.

**Implication:** Long-running (>10 min) `Bash(run_in_background=true)` should be dispatched at the orchestrator level for any phase where total wall-time > a single subagent's effective lifetime. Subagent termination kills its child processes.

### D-09 instability protocol triggered

**Issue:** Initial 3-run cold-start SHA-256 identity gate FAILED. Two pre-existing voter-app flakes surfaced post-DETERM-04 fix:
1. `voter-matching.spec.ts` 5-test serial block (run-1)
2. `voter-detail.spec.ts > should open party detail drawer` (run-3)

Both flakes are in the Phase 75 PASS_LOCKED roster but are NOT IMGPROXY-tied (can't be added to DATA_RACE pool per Phase 73 D-09 structural binding).

**Resolution:** Per D-09 protocol, dispatched 3 fresh cold-start runs (4, 5, 6). All 3 fresh runs SHA-identical. Used run-6 as the canonical regen source.

**Filed as v2.11+ follow-up:** `.planning/todos/pending/2026-05-13-voter-matching-detail-flakes.md`.

### Image-upload cascade (carry-forward from Plan 02)

Plan 02's DETERM-04 fix surfaced (not introduced) a pre-existing image-upload test failure (`should upload a profile image (CAND-03)`) that cascade-skips 5 downstream tests in the same serial describe block. The 5 cascaded tests landed in CASCADE pool in the Phase 79 regen. Filed as v2.11+ follow-up: `.planning/todos/pending/2026-05-13-candidate-profile-image-upload-cascade.md`.

## Artifacts produced

| Artifact | Path | Purpose |
|----------|------|---------|
| regen-constants.mjs | `post-fix/regen-constants.mjs` | D-07 copy of Phase 73 script; `reportPath = run-6.json` |
| run-1.json … run-6.json | `post-fix/run-{1..6}.json` | 6 cold-start full-suite captures |
| run-1.exit.log … run-6.exit.log | `post-fix/run-{1..6}.exit.log` | Captured exit codes (all EXIT=1 — test failures, not gate failures) |
| run-1.stderr.log … run-6.stderr.log | `post-fix/run-{1..6}.stderr.log` | Captured stderr (mostly dotenv banner; no imgproxy 502 events) |
| sha-identity.mjs | `post-fix/sha-identity.mjs` | SHA-256 identity check tool (categorizeStatus-normalised, sorted-line hash) |
| sha256.txt | `post-fix/sha256.txt` | 6-run audit + D-09 resolution narrative |
| regen-output.txt | `post-fix/regen-output.txt` | Raw 3-array output from regen-constants.mjs |
| imgproxy-audit.txt | `post-fix/imgproxy-audit.txt` | Phase 73 D-09 IMGPROXY_TIED_TITLES audit (PASS) |
| parity-gate-output.txt | `post-fix/parity-gate-output.txt` | Self-identity + 3-pair parity-gate verdicts (all PASS) |
| diff-playwright-reports.ts | `tests/scripts/diff-playwright-reports.ts:42-200` | Constants update (80/15/57) + regen header comment block |

## Cross-references

- v2.10 verification anchor: SHA `ff0334f856650611e2a5d1b1f990e6bbd3ad7c228ff585d5f1b5abf6bc3a09c5`
- Phase 75 prior anchor: 47 PASS_LOCKED + 15 DATA_RACE + 33 CASCADE = 95 entries (replaced by Phase 79's 80/15/57 = 152)
- Phase 73 D-09 structural binding: preserved verbatim (15-entry DATA_RACE pool, 14 IMGPROXY_TIED_TITLES patterns)
- Phase 79 follow-up todos: `2026-05-13-voter-matching-detail-flakes.md`, `2026-05-13-candidate-profile-image-upload-cascade.md`
