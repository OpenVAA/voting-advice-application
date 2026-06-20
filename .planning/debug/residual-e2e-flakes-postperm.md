---
status: resolved
trigger: "After fixing the perm app_settings singleton contamination (commit 115325146), the OpenVAA E2E full suite runs 120 passed / 0 failed / 0 did-not-run / 5 FLAKY. CARDINAL no-flaky rule. Diagnose + fix the 5 residual flakes so the suite is green with 0 flaky (no retries). Two classes: A = voter-fixture Intro/elections-stall timing (voter-journey-mobile.spec.ts, perm-question-video.spec.ts mobile); B = a11y-smoke axe render-pressure (3 occurrences)."
created: 2026-06-20T00:00:00Z
updated: 2026-06-20T00:00:00Z
---

## Current Focus

reasoning_checkpoint:
  hypothesis: "5 flakes = THREE root causes. (A1) walk Intro-step non-waiting isVisible() probe (fixture:162) races the post-hydration render window → walk stalls on /intro → fails at fixture:231 [hits perm-question-video ×2]. (A2) feedback insert rate-limit (5/5min/client-IP) keyed on x-forwarded-for (default 'unknown') is a shared global budget across all feedback-POSTing specs+retries → genuine submit rejected 400 P0001 → Feedback.svelte's catch-less submit().then() hangs status='sending' past the 5s expect [hits voter-journey-mobile]. (B) axe scans run before the page entrance animation settles → text composited through partial ancestor opacity → transient color-contrast violations [hits 4 a11y routes]."
  confirming_evidence:
    - "A1: both perm-question-video failures' traces show frames only / and /intro; action log shows isVisible(voter-intro-start)=false then Intro click skipped then 3 downstream waits time out. Elections/Constituencies steps already use polling waitForVisible; Intro step still uses one-shot isVisible()."
    - "A2: failure trace network log = POST /rest/v1/feedback → 400 P0001 body 'Rate limit exceeded'; trigger in schema/107-feedback.sql = 5/5min/IP keyed on x-forwarded-for COALESCE 'unknown'; only 3 genuine submit sites in the suite (voter-journey ×2, voter-journey-mobile ×1) but retries multiply them; with rate-limit table cleared before each pass voter-journey-mobile = 8/8 pass."
    - "B: failing nodes fg ~#858585 on #ffffff (3.69) = darker full-opacity token at ~0.2-0.3 opacity (captured DOM shows opacity:0.2/0.3 subtree); isolated probe (no parallel pressure) = 0 violations 16/16; drawer scan already guards via getAnimations().finished (lines 220-223), other scans do not."
  falsification_test: "A1: after switching the Intro probe to polling waitForVisible, perm-question-video must pass ≥10/10. A2: after injecting a unique x-forwarded-for per feedback POST, voter-journey-mobile must pass ≥10/10 with --repeat-each (no table clearing). B: after gating every axe scan on animations-settled, a11y-smoke must pass ≥10/10. If any still flakes, the cause is mis-identified."
  fix_rationale: "A1: mirror the EXISTING Elections/Constituencies fix (polling waitForVisible) at the Intro step — same proven readiness gate, smallest change. A2: per-submission unique x-forwarded-for header via page.route gives each genuine submit its OWN rate-limit bucket (how distinct real users behave) — pure test-infra, no DB/app change, no masking (the real rate-limit logic still runs). B: extract the drawer's getAnimations().finished settle into a shared awaitAnimationsSettled(page) and run it before EVERY axe scan — a real readiness signal, not a sleep or timeout bump."
  blind_spots: "A1 was low-probability on 8 isolated single mobile runs (surfaced under repeat-each + on perm-question-video); must prove the Intro fix holds under repeat-each pressure. A2 page.route header injection must actually reach PostgREST's request.headers — verify the injected IP changes the rate-limit bucket. Final proof must be a full CI-posture suite run (retries respected) showing 0 flaky."

hypothesis: see reasoning_checkpoint above (3 root causes confirmed)
test: apply 3 fixes, then ≥10x per previously-flaky spec + full CI-posture suite
expecting: 0 failed / 0 flaky / 0 did-not-run
next_action: (1) fixture:162 Intro → waitForVisible; (2) feedback x-forwarded-for route helper applied in the 3 feedback-submitting specs; (3) shared awaitAnimationsSettled() before every a11y axe scan. Then verify.

## Symptoms

expected: Full E2E suite (yarn db:reset + CI=true yarn test:e2e, workers:1, 125 tests) runs 0 failed AND 0 flaky AND 0 did-not-run.
actual: 120 passed / 0 failed / 0 did-not-run / 5 FLAKY (passes on retry). Two classes.
errors: |
  Class A (2 specs): walk intermittently fails to advance Intro->Elections->Constituencies->/questions, timing out on voter-questions-start/category-start/question-choice at voter-journey.fixture.ts ~line 231.
  Class B (a11y-smoke, 3 occurrences): axe-core scans intermittently fail, likely scanning before page finishes rendering/animating (View Transitions layer present).
reproduction: yarn dev already on :5173. Each spec seeds own data. db:reset for clean base. Mailpit at 127.0.0.1:54324.
started: Masked before by perm app_settings singleton contamination cascade (fixed in 115325146); now the only remaining defect.

## Eliminated

- hypothesis: "Class A is a walk/elections-stall at the Elections/Constituencies step (prior elections-continue-stall.md class)"
  evidence: Trace frame-URLs for BOTH perm-question-video failures (mobile line 118 + desktop line 49) show the walk stuck on /intro (only frames seen: / and /intro). The Elections/Constituencies probes were already converted to polling waitForVisible. The stall is at the INTRO step (fixture:162), which still uses a non-waiting one-shot isVisible(). Same hazard CLASS, different (earlier) step.
  timestamp: 2026-06-20

- hypothesis: "Class B a11y flake is a View-Transitions / route-announcer race needing a reduced-motion or transition-settled gate (per bug-report hint)"
  evidence: The failures are color-contrast violations (fg #858585 / #8a8a8a on #ffffff, ~3.69:1) on election/constituency option labels and results text — these are darker full-opacity tokens composited at ~0.2-0.3 opacity (an in-flight entrance fade). Isolated probe (8x heading-only + 8x animations-settled, single page) = 0 violations every time. So it is render-pressure scan-timing (scan fires before the entrance fade settles), NOT a VT/announcer logic race and NOT a real theme defect. The fix is the SAME getAnimations().finished settle already used for the drawer scan (a11y-smoke.spec.ts:220-223), generalized to every scan.
  timestamp: 2026-06-20

## Evidence

- timestamp: 2026-06-20 (Class A repro #1 — voter-journey-mobile)
  checked: ran voter-journey-mobile --repeat-each=10 --retries=0 isolated; extracted trace.zip network log
  found: 5/10 FAILED, all at feedbackDialog.expectSuccess() — submit button stuck data-status="sending". Network log: app_settings GETs 200 (~5ms); POST /rest/v1/feedback returned 400 in 5.9ms; body {"code":"P0001","message":"Rate limit exceeded. Please try again later."}. Feedback rate-limit trigger = 5 inserts / 5 min / client IP (apps/supabase/supabase/schema/107-feedback.sql). All specs POST from the same local IP ("unknown"). 10 repeats = 10 inserts in <5min → repeats 6-10 rejected.
  implication: Two defects. (1) Test-infra: the feedback rate-limit (5/5min/IP) is a SHARED GLOBAL budget across all feedback-submitting specs (voter-journey ×2, voter-journey-mobile ×1) + repeats, with no reset/isolation. (2) App robustness: Feedback.svelte submit() does sendFeedback().then(...) with NO .catch — a REJECTED promise (rate-limit 400) leaves status='sending' until the 5s ERROR_TIMEOUT, and the test's default-5s expectSuccess window expires first. The fix must reset the rate-limit budget per spec (test-infra) so genuine submits succeed.

- timestamp: 2026-06-20 (Class A repro #2 — perm-question-video, the bug-report Class-A spec)
  checked: ran perm-question-video --repeat-each=10 --retries=0 (--no-deps, pre-seeded); extracted traces for the 2 failures
  found: 2/40 FAILED — mobile sub-test (line 118) AND desktop visibility-matrix (line 49), BOTH at walkUntilQuestionsIntro fixture:231 (questions-start/category-start/question-choice never visible). Trace action sequence: goto Home → click voter-home-start → isVisible(voter-intro-start) returned FALSE (one-shot snapshot) → Intro Continue click SKIPPED → waitForSelector elections-list (5s) timed out → constituencies (5s) timed out → questions-start (10s) timed out → FAIL. Frame URLs: only / and /intro. perm-question-video submits NO feedback, so its flake is purely the Intro stall.
  implication: ROOT CAUSE (Class A walk stall) = the INTRO step (voter-journey.fixture.ts:162) uses a non-waiting one-shot `isVisible()` probe that races the Intro page's post-hydration render window — the IDENTICAL hazard already fixed for the Elections (line 178) and Constituencies (line 189) steps via the polling `waitForVisible` helper, but never applied to the Intro step. Worse at mobile (slower render widens the window). Fix: gate the Intro Continue click on the polling waitForVisible helper.

- timestamp: 2026-06-20 (Class B repro — a11y-smoke)
  checked: ran a11y-smoke --repeat-each=10 --retries=0 (--no-deps, clean base); inspected failure axe payloads + traces
  found: 4/110 FAILED, all color-contrast: elections-selector, constituencies-selector, results, voter-detail-drawer. fg ~#858585 on bg #ffffff, ratio ~3.69 (need 4.5). relatedNodes = <div class="drawer bg-base-100">. Offending nodes = election option label spans ([el-reg] Regional Election / [el-mun] Municipal Election) + results text. Captured DOM showed opacity:0.2 / opacity:0.3 on subtree (entrance fade in-flight). Isolated probe (no parallel pressure): 0 violations 8/8 heading-only AND 8/8 animations-settled — confirms transient, full-opacity tokens pass.
  implication: ROOT CAUSE (Class B) = axe scans fire after a heading is visible but BEFORE the page entrance fade/animation settles, compositing label/text color through partial ancestor opacity → phantom contrast failures. The drawer scan already guards this (getAnimations({subtree:true}).finished, lines 220-223); the OTHER scans (3 unlocated route runners + questions + results) do NOT. Fix: extract a shared awaitAnimationsSettled(page) gate and run it before EVERY axe scan.

## Resolution

root_cause: |
  THREE root causes across the 5 flakes (two are one shared walk defect):
  (A1 — walk Intro stall, hits perm-question-video ×2 and any walk consumer) voter-journey.fixture.ts:162 probes the Intro "Continue" button with a non-waiting one-shot `isVisible()` that races the Intro page's post-hydration render window; on a miss the click is skipped and the walk falls through to fail at fixture:231. Same hazard already fixed for Elections/Constituencies steps but not Intro.
  (A2 — feedback rate-limit, hits voter-journey-mobile) the DB feedback insert is rate-limited to 5/5min/client-IP; all specs POST from the same local IP, so once the shared budget is exhausted the genuine submit is rejected 400 P0001 and (because Feedback.svelte's submit().then() has no .catch) the button hangs in 'sending' until the 5s error-timeout, past the test's 5s expectSuccess window.
  (B — a11y axe render-pressure) axe scans run before the page entrance animation settles, compositing text color through partial ancestor opacity → transient color-contrast violations; only the drawer scan currently guards this.
fix: |
  All three fixes are TEST-INFRA only (tests/**) — no app/product or DB code touched.
  (A1 — walk Intro stall) tests/tests/fixtures/voter/voter-journey.fixture.ts: replaced the non-waiting one-shot `isVisible()` Intro-Continue probe with a deterministic readiness race — `introStart.or(electionsListProbe).first().waitFor({visible})` (resolves when EITHER the Intro Continue button paints OR the page has auto-redirected to the elections selector), then a short polling `waitForVisible(introStart, TIMEOUTS.element)` re-check before clicking. No fixed sleep, no penalty on the auto-redirect path. Mirrors the existing Elections/Constituencies waitForVisible fix.
  (A2 — feedback rate-limit) tests/tests/fixtures/shared/feedbackDialog.fixture.ts: new exported `isolateFeedbackRateLimit(page)` installs a `page.route('**/rest/v1/feedback')` handler that stamps a unique `x-forwarded-for` (RFC-5737 TEST-NET-3 203.0.113.x) per request, so each genuine feedback submit lands in its OWN 5/5min rate-limit bucket (how distinct real users behave) — the real rate-limit logic still runs, nothing masked. Wired into the 3 feedback-submitting specs: voter-journey-mobile.spec.ts, voter-journey.spec.ts (×2 submits).
  (B — a11y axe render-pressure) tests/tests/specs/a11y/a11y-smoke.spec.ts: new shared `awaitAnimationsSettled(page)` awaits every FINITE (non-looping) Web Animation on the document (document.documentElement.getAnimations({subtree:true}), excluding infinite-endTime loops like the progress/match bar so it can't hang). Called before EVERY axe scan (3 unlocated route runners ×{light,dark}, questions, results, drawer). Replaces the drawer's prior dialog-subtree-only inline settle.
verification: |
  Per-spec isolation (CI=true, --retries=0, --repeat-each=10, --workers=1):
    - a11y-smoke: 110 passed / 0 failed (10×11 tests) — all 4 previously-flaky routes (elections-selector, constituencies-selector, results, voter-detail-drawer) green.
    - perm-question-video: 40 passed / 0 failed (10×4 tests) — Intro stall (was 2/40) gone.
    - voter-journey-mobile: 10 passed / 0 failed (was 5/10) — feedback rate-limit gone; rate-limit table post-run = 10 distinct buckets each count=1 (proves per-submit IP isolation).
    - voter-journey: 5 passed / 0 failed (5x) — no regression from feedback isolation.
  Full CI-posture suite (yarn db:reset + CI=true yarn test:e2e, retries=3 available, workers=1, 125 tests):
    125 passed / 0 failed / 0 FLAKY / 0 did-not-run, 0 retries used (every test green on first attempt). 10.1m.
  NOTE: an interim iteration of awaitAnimationsSettled used a document-wide settle WITHOUT the infinite-animation filter, which hung the drawer scan 10/10 (90s page.evaluate timeout on the looping match bar's never-resolving .finished). Fixed by filtering to finite-endTime animations; re-verified green.
files_changed:
  - tests/tests/fixtures/voter/voter-journey.fixture.ts
  - tests/tests/fixtures/shared/feedbackDialog.fixture.ts
  - tests/tests/specs/voter/voter-journey-mobile.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/specs/a11y/a11y-smoke.spec.ts
