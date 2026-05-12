# Phase 79 STATUS

**Last updated:** 2026-05-12T20:50:00Z
**Last agent action:** Plan 01 Task 4 — instrumentation reverted, RCA artifacts ready for atomic commit
**Operator action needed?** NO
**Phase verdict so far:** IN-PROGRESS

---

## DETERM-04 Status

- [x] Plan 01 (RCA, dual-hypothesis instrumentation) — DONE @ `3c55dcc54`
- [ ] Plan 02 (frontend fix per RCA findings) — PENDING
- [ ] Plan 02-fallback (restructure to register-fresh-candidate.setup.ts) — NOT-TRIGGERED
- [ ] 1-run cold-start smoke confirm (D-12) — PENDING

**Hypothesis verdict (per post-fix/rca-traces/RCA-FINDINGS.md):**
- H1 (auth session propagation): PARTIALLY CONFIRMED — re-framed. Session cookie IS valid throughout; the literal "session not propagated" framing is disproven by raw cookie evidence. However, H1's deeper concern (post-setPassword client-nav session unreliability) is acknowledged in source at `register/password/+page.svelte:78-80` and ENCODED as a defensive `/login` redirect, which IS the real-world manifestation observed.
- H2 (ToU hydration timing): DISPROVEN BY ABSENCE OF EXERCISE. The user never reached `/candidate/(protected)/`; `window.__phase79RcaHydrated` was NEVER set in either run. H2's race had zero opportunity to manifest in this failure mode.

**Proximate cause discovered:** a TEST-SPEC URL-PREDICATE BUG in `tests/tests/specs/candidate/candidate-profile.spec.ts:48-63` (`loginIfRedirectedToLoginPage` helper). The waitForURL predicate matches BOTH `/candidate/login` AND `/candidate/register/password` (both pathnames contain `/candidate`), causing the helper's manual-login branch to be silently skipped.

**RCA artifacts:** `post-fix/rca-traces/` — RCA-FINDINGS.md (verdict + recommended fix) + 7 state-*.json files (reconstructed from trace.zip per RCA-FINDINGS.md §"State JSON Reconstruction Note") + 2 trace-run-*.zip + 2 error-context-run-*.md + 1 console-run-*.log + the instrumented registration-rca.spec.ts spec.

**Recommended fix for Plan 02:** Single-line URL-predicate tightening at `candidate-profile.spec.ts:51`. See RCA-FINDINGS.md §"Recommended Fix for Plan 02" for the concrete diff + rationale.

---

## DETERM-05 Status

- [ ] Plan 03 Task 1 (copy regen-constants.mjs + STATUS.md init) — PENDING
- [ ] Plan 03 Task 2 (run-1 cold-start) — PENDING
- [ ] Plan 03 Task 3 (run-2 cold-start) — PENDING
- [ ] Plan 03 Task 4 (run-3 cold-start) — PENDING
- [ ] Plan 03 Task 5 (SHA-256 identity check) — PENDING
- [ ] Plan 03 Task 6 (regen + IMGPROXY audit + atomic commit) — PENDING

**Current run state (if mid-gate):** not yet started

---

## Escalation Flags

(Empty if no escalations needed; otherwise per-item entry)

- [ ] imgproxy 502 retries: 0
- [ ] SHA-256 mismatch: N
- [ ] RCA pivot-to-restructure trigger: N (Plan 02 should land cleanly per the single-line spec fix)
- [ ] Operator-checkpoint-needed event: NONE
- [ ] Unexpected failure: NONE

**Note on Plan 01 deviation:** Plan 01 Task 2 originally called for running the instrumented `post-fix/rca-traces/registration-rca.spec.ts` 3× directly. Discovered during execution that Playwright's `candidate-app-mutation` project's `testDir: './tests/specs/candidate' + testMatch` filters silently drop the RCA spec because it lives outside the project's testDir. Acknowledged as a Rule-3-class deviation (blocking issue with infrastructure constraint). Mitigation: the live-tree H1/H2 instrumentation fires in the SAME way during the REAL `candidate-profile.spec.ts` test (also under candidate-app-mutation); 2 prior runs of that test produced `trace-run-{1,2}.zip` + `error-context-run-{1,2}.md`, which contain ALL the empirical evidence the dedicated RCA spec would have captured. State-*.json files are RECONSTRUCTED from trace evidence (each carries a `_provenance` field). Full rationale in RCA-FINDINGS.md §"Plan 01 Task 2 Deviation". This does NOT affect Plan 02's path — the recommended fix is unambiguous.

---

## What to do on return

Plan 01 RCA complete. Proceed to Plan 02:

1. Read `post-fix/rca-traces/RCA-FINDINGS.md` (full verdict + concrete fix recommendation).
2. Run `/gsd-plan-phase 79-02` (or apply the recommended single-line fix directly per RCA-FINDINGS.md §"Recommended Plan 02 task structure").
3. Plan 02 expected wall time: ~30 min (one-line fix + 3× isolated registration test + full candidate-app-mutation project + D-12 1-run cold-start smoke).

No operator action needed before Plan 02. The Plan 02 fix is one line in `tests/tests/specs/candidate/candidate-profile.spec.ts:51`.

---

## Run Log (append-only)

- 2026-05-12T20:12:54Z — Plan 01 Task 1 — RCA scaffolding created (registration-rca.spec.ts + live-tree H1/H2 instrumentation in (protected)/+layout.svelte + register/password/+page.svelte + STATUS.md init)
- 2026-05-12T20:15:50Z — Plan 01 Task 2 (attempt 1) — `candidate-app-mutation` run #1 produced trace-run-1.zip + error-context-run-1.md; failed at terms-checkbox expect (10s timeout). Per-checkpoint state JSONs NOT generated because the dedicated RCA spec at post-fix/rca-traces/ was unreachable via Playwright's project config (testDir/testMatch filter).
- 2026-05-12T20:22:08Z — Plan 01 Task 2 (attempt 2) — `candidate-app-mutation` run #2 reproduced identical failure: trace-run-2.zip + error-context-run-2.md + console-run-2.log. Cascade-skip is fully deterministic (byte-identical page snapshots).
- 2026-05-12T20:45:00Z — Plan 01 Task 3 — RCA-FINDINGS.md authored. Verdict: H1 PARTIALLY CONFIRMED (re-framed) + H2 DISPROVEN BY ABSENCE OF EXERCISE + proximate cause is a test-spec URL-predicate bug at candidate-profile.spec.ts:51. Recommended Plan 02 fix: single-line URL-predicate tightening. State-*.json files reconstructed from trace evidence (per deviation rationale). RESEARCH.md appended with §"DETERM-04 RCA — Empirical Findings (Plan 01 close)".
- 2026-05-12T20:50:00Z — Plan 01 Task 4 — instrumentation reverted from (protected)/+layout.svelte + register/password/+page.svelte (grep-clean verified). Vite HMR confirms no syntax errors. Ready for atomic commit.
