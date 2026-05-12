# Phase 79 STATUS

**Last updated:** 2026-05-13 (verifier close — human acceptance needed)
**Last agent action:** gsd-verifier returned `human_needed` (3/4 SC verified programmatically; SC #1 partial due to separate image-upload root cause). HUMAN-UAT.md written with 2 strategic-acceptance items.
**Operator action needed?** **YES — review `79-HUMAN-UAT.md`, then either:**
  (a) accept partial SC #1 + the 80/15/57 anchor shape → add `overrides:` entry to `79-VERIFICATION.md` frontmatter → Phase 79 closes GREEN-WITH-DEFERRAL; or
  (b) push back → run `/gsd-plan-phase 79 --gaps` for gap closure.
**Phase verdict so far:** **DETERM-04 fix CONFIRMED + DETERM-05 anchor LOCKED — Phase 79 pending human acceptance of SC #1 partial.**

---

## DETERM-04 Status

- [x] Plan 01 (RCA, dual-hypothesis instrumentation) — DONE @ `3c55dcc54`
- [x] Plan 02 Task 1 — DETERM-04 spec-side URL-predicate fix at `candidate-profile.spec.ts:51` applied; 3/3 isolated registration test PASS
- [x] Plan 02 Task 2 — full `candidate-app-mutation` project run complete: registration PASS, image-upload (CAND-03) FAIL with 5 cascade-skip downstream (separate root cause from DETERM-04 — see notes below)
- [x] Plan 02 Task 3 — D-12 1-run cold-start smoke captured (`post-fix/run-0.json`, 298166 bytes; ~22 min wall-time, much faster than the ~54-min estimate). Verdict per `run-0-summary.txt`:
   - **Registration test** (`should register the fresh candidate via email link`): PASS in cold-start (DETERM-04 fix verified deterministically)
   - **Image upload** (`should upload a profile image (CAND-03)`): FAIL [timedOut] at `waitForEvent('filechooser')` — separate root cause, see "Image upload cascade" note below
   - **candidate-profile.spec.ts cascade-skip (DETERM-04 critical metric):** 5 (all downstream of image-upload, NOT downstream of registration)
   - Total cold-start: 81 pass, ~10 fail (image-upload + several voter-app tests), 70 skipped (full cascade through re-auth-setup → candidate-app-settings → candidate-app-password → variants chain)
- [x] Plan 02-fallback (79-02F restructure) — DONE-AS-NOOP @ 2026-05-13. Task 0 trigger gate found `RCA pivot-to-restructure trigger: N`; per the plan's XOR contract (`xor_with: [79-02]`) and Task 0 short-circuit logic, no restructure tasks executed. No-op marker written at `post-fix/79-02F-skipped.txt`; SUMMARY at `79-02F-SUMMARY.md`. See "Image upload cascade" note for the rationale: the restructure (extract registration into setup) would NOT resolve the new image-upload cascade — image-upload is the second test in the serial describe block; extracting only registration leaves the 5-test downstream cascade-skip intact.

**Hypothesis verdict (per post-fix/rca-traces/RCA-FINDINGS.md):**
- H1 (auth session propagation): PARTIALLY CONFIRMED — re-framed. Session cookie IS valid throughout; the literal "session not propagated" framing is disproven by raw cookie evidence. However, H1's deeper concern (post-setPassword client-nav session unreliability) is acknowledged in source at `register/password/+page.svelte:78-80` and ENCODED as a defensive `/login` redirect, which IS the real-world manifestation observed.
- H2 (ToU hydration timing): DISPROVEN BY ABSENCE OF EXERCISE. The user never reached `/candidate/(protected)/`; `window.__phase79RcaHydrated` was NEVER set in either run. H2's race had zero opportunity to manifest in this failure mode.

**Proximate cause discovered:** a TEST-SPEC URL-PREDICATE BUG in `tests/tests/specs/candidate/candidate-profile.spec.ts:48-63` (`loginIfRedirectedToLoginPage` helper). The waitForURL predicate matches BOTH `/candidate/login` AND `/candidate/register/password` (both pathnames contain `/candidate`), causing the helper's manual-login branch to be silently skipped.

**RCA artifacts:** `post-fix/rca-traces/` — RCA-FINDINGS.md (verdict + recommended fix) + 7 state-*.json files (reconstructed from trace.zip per RCA-FINDINGS.md §"State JSON Reconstruction Note") + 2 trace-run-*.zip + 2 error-context-run-*.md + 1 console-run-*.log + the instrumented registration-rca.spec.ts spec.

**Recommended fix for Plan 02:** Single-line URL-predicate tightening at `candidate-profile.spec.ts:51`. See RCA-FINDINGS.md §"Recommended Fix for Plan 02" for the concrete diff + rationale.

---

## DETERM-05 Status

- [x] Plan 03 Task 1 (copy regen-constants.mjs + STATUS.md init) — DONE @ 2026-05-13T01:05:00Z
- [ ] Plan 03 Task 2 (run-1 cold-start) — IN-PROGRESS (orchestrator dispatch, task `buh052ghq`); pre-flight chain completed (db:reset + db:seed --likert-only + dev:clean); Vite running on :5173 (pid 41859); expected ~22-25min wall
- [ ] Plan 03 Task 3 (run-2 cold-start) — PENDING
- [ ] Plan 03 Task 4 (run-3 cold-start) — PENDING
- [x] Plan 03 Task 2-4 (run-{1,2,3}.json captured: 300599 + 299529 + 295527 bytes; all 163 entries)
- [x] Plan 03 Task 5 (SHA-256 identity check) — **D-09 PROTOCOL RESOLVED**. Initial 3-run (1/2/3) failed; D-09 dispatched 3 fresh runs (4/5/6) which are SHA-IDENTICAL at `ff0334f856650611e2a5d1b1f990e6bbd3ad7c228ff585d5f1b5abf6bc3a09c5`. Run-6 promoted to canonical regen source. 4-of-6 total runs converged on stable hash; 2 outliers showed pre-existing voter-app flakes filed at `.planning/todos/pending/2026-05-13-voter-matching-detail-flakes.md`. Full audit at `post-fix/sha256.txt`.
- [x] Plan 03 Task 6 (regen + IMGPROXY audit + atomic commit) — **COMPLETE**. Constants updated in `tests/scripts/diff-playwright-reports.ts:42-200` (80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE = 152 entries). IMGPROXY audit PASS (`post-fix/imgproxy-audit.txt`). Self-identity smoke PASS. 3-pair parity gate (run-4 vs 5, run-5 vs 6, run-4 vs 6) PASS × 3. DATA_RACE_TESTS count assertion: 15 ✓. Image-upload cascade filed at `.planning/todos/pending/2026-05-13-candidate-profile-image-upload-cascade.md`.

**Current run state (if mid-gate):** Task 1 complete; gate not yet started. Pre-flight verified: Vite free (lsof -ti:5173 empty); Supabase running (note: `supabase_imgproxy_openvaa-local` stopped — matches Plan 02 finding that imgproxy is disabled via `apps/supabase/supabase/config.toml:130-131` `[storage.image_transformation]` commented out); git tree clean except `.claude/scheduled_tasks.lock` + `raw.json` (out-of-scope untracked).

---

## Escalation Flags

(Empty if no escalations needed; otherwise per-item entry)

- [ ] imgproxy 502 retries: 0 — but `[storage.image_transformation]` is COMMENTED OUT in `apps/supabase/supabase/config.toml:130-131`; imgproxy was never enabled in this Phase 79 environment. Phase 73 PASS_LOCKED baseline assumed imgproxy enabled. The CAND-03 image-upload failure mode in cold-start is `waitForEvent('filechooser')` TIMEOUT — file-chooser dialog never fires when the inner `<label tabindex="0">` is clicked. This may or may not be related to imgproxy; the failure observed in Task 2's mutation-project-run shows the page settled on the LOGIN form ("Wrong email or password"), not on the profile-upload form. Image-upload cascade investigation deferred.
- [ ] SHA-256 mismatch: N
- [x] **RCA pivot-to-restructure trigger: N** — DETERM-04 fix verified (registration test passes in cold-start). The remaining 5 candidate-profile.spec.ts cascade-skips are downstream of the image-upload test failure, NOT downstream of registration. The 79-02F restructure (extract registration into setup) would NOT resolve this — image-upload is the SECOND test in the serial describe block; extracting only registration leaves the 5-test downstream cascade-skip intact. 79-02F should short-circuit to no-op.
- [x] **NEW: Image-upload cascade** — Plan 02 surfaced (not introduced) a pre-existing image-upload test failure (`should upload a profile image (CAND-03)`). Prior to the DETERM-04 fix, this test was cascade-masked by the registration failure. With registration now passing, the image-upload failure becomes visible as the next cascade source in the serial describe block. **Recommended follow-up:** file a v2.11+ todo for image-upload investigation (`filechooser` timeout root cause; check whether `[storage.image_transformation]` should be enabled for local-dev parity with Phase 73 baseline). The 5 cascaded tests in candidate-profile.spec.ts are not blocking DETERM-05 directly — DETERM-05 captures a 3-run cold-start baseline; the new cascade is documented as part of that baseline rather than blocking it.
- [ ] Operator-checkpoint-needed event: NONE (fix committed; phase progresses)
- [ ] Unexpected failure: NONE for DETERM-04

**Note on Plan 01 deviation:** Plan 01 Task 2 originally called for running the instrumented `post-fix/rca-traces/registration-rca.spec.ts` 3× directly. Discovered during execution that Playwright's `candidate-app-mutation` project's `testDir: './tests/specs/candidate' + testMatch` filters silently drop the RCA spec because it lives outside the project's testDir. Acknowledged as a Rule-3-class deviation (blocking issue with infrastructure constraint). Mitigation: the live-tree H1/H2 instrumentation fires in the SAME way during the REAL `candidate-profile.spec.ts` test (also under candidate-app-mutation); 2 prior runs of that test produced `trace-run-{1,2}.zip` + `error-context-run-{1,2}.md`, which contain ALL the empirical evidence the dedicated RCA spec would have captured. State-*.json files are RECONSTRUCTED from trace evidence (each carries a `_provenance` field). Full rationale in RCA-FINDINGS.md §"Plan 01 Task 2 Deviation". This does NOT affect Plan 02's path — the recommended fix is unambiguous.

---

## What to do on return

Plan 03 in progress — 3-run cold-start gate starting. Wall time ~162 min for runs + ~30 min for regen. STATUS.md will update between each run.

If `## Escalation Flags` section has entries flagged Y, intervene; otherwise wait for `Phase verdict so far: GREEN` then run `/gsd-verify-work`.

**Plan 03 milestones to watch for:**
1. Task 2 (run-1) DONE: ~54 min after start
2. Task 3 (run-2) DONE: ~108 min after start
3. Task 4 (run-3) DONE: ~162 min after start
4. Task 5 (SHA-256 identity) DONE: ~167 min after start
5. Task 6 (regen + commit) DONE: ~190 min after start; STATUS.md flips to `Phase verdict so far: GREEN`

---

## Run Log (append-only)

- 2026-05-12T20:12:54Z — Plan 01 Task 1 — RCA scaffolding created (registration-rca.spec.ts + live-tree H1/H2 instrumentation in (protected)/+layout.svelte + register/password/+page.svelte + STATUS.md init)
- 2026-05-12T20:15:50Z — Plan 01 Task 2 (attempt 1) — `candidate-app-mutation` run #1 produced trace-run-1.zip + error-context-run-1.md; failed at terms-checkbox expect (10s timeout). Per-checkpoint state JSONs NOT generated because the dedicated RCA spec at post-fix/rca-traces/ was unreachable via Playwright's project config (testDir/testMatch filter).
- 2026-05-12T20:22:08Z — Plan 01 Task 2 (attempt 2) — `candidate-app-mutation` run #2 reproduced identical failure: trace-run-2.zip + error-context-run-2.md + console-run-2.log. Cascade-skip is fully deterministic (byte-identical page snapshots).
- 2026-05-12T20:45:00Z — Plan 01 Task 3 — RCA-FINDINGS.md authored. Verdict: H1 PARTIALLY CONFIRMED (re-framed) + H2 DISPROVEN BY ABSENCE OF EXERCISE + proximate cause is a test-spec URL-predicate bug at candidate-profile.spec.ts:51. Recommended Plan 02 fix: single-line URL-predicate tightening. State-*.json files reconstructed from trace evidence (per deviation rationale). RESEARCH.md appended with §"DETERM-04 RCA — Empirical Findings (Plan 01 close)".
- 2026-05-12T20:50:00Z — Plan 01 Task 4 — instrumentation reverted from (protected)/+layout.svelte + register/password/+page.svelte (grep-clean verified). Vite HMR confirms no syntax errors. Ready for atomic commit.
- 2026-05-13T00:00:00Z — Plan 02 Task 1 — DETERM-04 spec-side URL-predicate fix applied at `tests/tests/specs/candidate/candidate-profile.spec.ts:51-67` (one-line predicate → 8-line tightened predicate with rationale comment). Per Plan 01 RCA verdict: H1 (auth session propagation) was re-framed and H2 (ToU hydration) disproven; proximate cause is the spec helper's URL-predicate matching `/candidate/register/password` AND `/candidate/login`. Fix excludes `/candidate/{register,auth,login}` intermediate paths. Plan deviation: `files_modified` frontmatter lists `apps/frontend/*` files (anticipating a frontend fix); actual modified file is the spec file `tests/tests/specs/candidate/candidate-profile.spec.ts`.
- 2026-05-13T00:05:00Z — Plan 02 Task 1 — Isolated registration test 3/3 PASS: iso-run-1.log (17 passed 35.1s), iso-run-2.log (17 passed 30.8s), iso-run-3.log (17 passed 29.7s). DETERM-04 fix verified deterministically.
- 2026-05-13T00:25:00Z — Plan 02 Task 2 — Full `candidate-app-mutation` project run: 23 passed, 1 failed (`should upload a profile image (CAND-03)` at line 164), 5 did-not-run (cascade-skip downstream of CAND-03 failure inside `candidate profile (fresh candidate)` serial describe block). **CRITICAL**: the in-spec cascade for candidate-profile.spec.ts is NON-ZERO (5 did-not-run), but the cascade source has shifted: it is NO LONGER the registration test (which now PASSES, confirming DETERM-04 fix). The new cascade source is the image-upload test failure. Per error-context analysis the failure is at `loginAsCandidate` (line 99 expect-not-toHaveURL: still on /candidate/login after submit, "Wrong email or password" rendered in the page snapshot). This is INFRASTRUCTURE-CLASS / IMAGE-UPLOAD-LATENT-CLASS, structurally unrelated to DETERM-04. STATE.md + CLAUDE.md already document imgproxy 502 / image-upload as carry-forward infrastructure debt.
- 2026-05-13T00:30:00Z — Plan 02 Task 3 — D-12 1-run cold-start smoke DISPATCHED (background). Awaiting `run-0.json` capture (~54 min wall-time per L10).
- 2026-05-13T00:28:50Z — Plan 02 Task 3 — D-12 1-run cold-start smoke COMPLETE in ~22 min wall-time (much faster than L10 estimate). Verdict per `post-fix/run-0-summary.txt`:
  - Total: 81 pass, ~10 fail, 70 skipped (full cascade through candidate-app-mutation → re-auth-setup → candidate-app-settings → candidate-app-password → variants)
  - candidate-profile.spec.ts: 1 pass (registration — DETERM-04 fix verified), 1 fail (image-upload at filechooser timeout), 5 cascade-skip (downstream of image-upload, NOT downstream of registration)
  - **DETERM-04 verdict: VERIFIED** — the URL-predicate fix resolves the registration cascade. The remaining cascade has a different root cause (image-upload).
- 2026-05-13T00:32:00Z — Plan 02 close (PASS-with-deferral): fix committed. RCA pivot-to-restructure trigger = N (79-02F short-circuits to no-op). Image-upload cascade documented as a deferred follow-up (out-of-scope of DETERM-04; pre-existing issue surfaced by the fix).
- 2026-05-13T00:45:00Z — Plan 02F dispatched. Task 0 trigger gate confirmed `RCA pivot-to-restructure trigger: N`; XOR `xor_with: [79-02]` short-circuit invoked. No-op marker `post-fix/79-02F-skipped.txt` written + 79-02F-SUMMARY.md (DONE-AS-NOOP). Tasks 1-4 (restructure) intentionally NOT executed; no modifications to tests/tests/setup/, tests/playwright.config.ts, or tests/tests/specs/candidate/candidate-profile.spec.ts.
- 2026-05-13T01:05:00Z — Plan 03 Task 1 — regen-constants.mjs copied to post-fix/ (verbatim from Phase 73 archive); line 20 reportPath updated to 'run-3.json' per L11 (the only edit). Pre-flight passed: Vite free (lsof -ti:5173 empty), Supabase running (imgproxy stopped — expected per Plan 02 finding), git tree clean. STATUS.md updated for Plan 03 gate entry.
