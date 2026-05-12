# Voter-app flakes surfaced by Phase 79 DETERM-04 fix (v2.11+)

**Filed:** 2026-05-13 at Phase 79 Plan 03 close (DETERM-05 regen)
**Source:** Phase 79 D-09 instability investigation; `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/sha256.txt`
**Severity:** MEDIUM (intermittent — affects parity gate reliability, not user-facing behavior)
**Routed to:** v2.11+ candidate

## Symptom

Across 6 cold-start full-suite runs captured during Phase 79 Plan 03's gate execution, 2 distinct voter-app tests showed intermittent failure:

1. **voter-app :: `specs/voter/voter-matching.spec.ts`** — the 5-test serial block:
   - `should NOT show hidden candidate (no termsOfUseAccepted)`
   - `should confirm category intros were not shown during journey (VOTE-05 partial negative coverage)`
   - `should confirm results accessible after all questions answered (VOTE-07 partial above-threshold coverage)`
   - `should show partial-answer candidate in results with valid score`
   - `should show worst match candidate as last result` ← when this fails, the other 4 cascade-skip

   Run-1: 1 fail (`worst match`) + 4 cascade-skipped
   Runs 2, 4, 5, 6: all 5 PASS

2. **voter-app :: `specs/voter/voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs`** —
   Run-3: FAIL
   Runs 2, 4, 5, 6: PASS

Flake rate: 2 of 6 runs (~33%) showed at least one flake. The final 3 fresh runs (per D-09) were SHA-identical (`ff0334f856…`) so the v2.10 verification anchor was locked in. But the flake is real and will re-trigger D-09 on future gates.

## Why this surfaced now

Phase 79 DETERM-04 fixed the `candidate-profile.spec.ts:51` URL-predicate bug that cascade-skipped the registration test's downstream chain. Prior to the fix, the downstream voter-app tests were masked by the registration cascade (Phase 75 baseline locked 47 PASS_LOCKED; Phase 79 locked 80 PASS_LOCKED — the +33 net is mostly previously-masked tests).

Both flake surfaces are in the Phase 75 PASS_LOCKED roster, which means they were apparently SHA-identical at v2.9 Phase 73 baseline. Possibilities:
- The voter-app cold-start environment is now subtly different (post-DETERM-04 timing changes propagating somehow)
- The Phase 75 baseline was captured under conditions that masked the flake (different seed, different parallelism, different mailpit state)
- These tests were genuinely deterministic in Phase 73 and have regressed since

## Root cause hypotheses (not investigated)

1. **voter-matching `worst match` test**: results page ordering may depend on a deterministic but timing-sensitive sort key. Possibly related to candidate fetch ordering or matching score precision.
2. **voter-detail "should open party detail drawer"**: drawer-open may race with results-page hydration; the test may try to click before the entity list is fully reactive.

## Pool classification (per Phase 73 D-09 binding)

Both flakes are **NOT IMGPROXY-tied** (the test titles do not `endsWith()` any of the 14 IMGPROXY_TIED_TITLES patterns at `tests/scripts/diff-playwright-reports.ts:145-162`). Per D-09, the DATA_RACE pool MUST NOT grow — these flakes cannot be added to the pool to bypass parity-gate failure.

If the flake reproduces on a future verification gate, options:
1. **Fix the flake** (preferred) — investigate the race in the offending test
2. **Convert to deterministic skip** — mark with `test.skip()` + rationale until fixed
3. **Move to FAILURE-CLASS** (regen-constants.mjs has a "not pooled" failure-class for deterministic-failure-with-rationale entries)

## Cross-references

- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/sha256.txt` — full audit (6 runs)
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-{1,2,3,4,5,6}.json` — JSON evidence
- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/parity-gate-output.txt` — parity-gate verdicts
- Phase 73 D-09 IMGPROXY_TIED_TITLES structural binding contract: `tests/scripts/diff-playwright-reports.ts:145-162`
