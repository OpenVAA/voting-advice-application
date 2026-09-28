---
phase: 131-e2e-reliability-hardening-deferred-flake-race-triage
plan: 04
subsystem: testing
tags: [playwright, e2e, triage, feedback-modal, bind-this-keep-mounted, popup-hydration, stale-closure, supabase-multi-project]

# Dependency graph
requires:
  - phase: 131-e2e-reliability-hardening-deferred-flake-race-triage
    plan: 03
    provides: cold-entry-dataroot 3x resolver evidence (Phase-117 gate) cited for the todo #3 cold-deeplink half
  - phase: 117-dataroot-version-bridge
    provides: dataRoot #version-bridge fix resolving the shared cold-deeplink /results hydration race (todo #3 root cause)
provides:
  - "Todo #3 (popup-hydration LAYOUT-03) CLOSED-AS-STALE: popup-through-root-layout-slot parity confirmed (survey 3x + popupNotice probe), race resolved by Phase 117"
  - "Todo #4 (feedback-persistence) FIXED: the one genuine coverage-parity gap closed — new HARD text-persists-across-cancel-then-reopen assertion (OQ-7.1 = ADD), 3x green"
  - "Isolated perm-spec recipe: --project=<perm> --no-deps + out-of-band `yarn db:seed --template <t>` (mirrors _probes discipline) — avoids running the whole upstream perm serial-DAG per iteration"
  - "Multi-supabase-project hazard documented: NEVER `npx supabase start` from repo root (boots the foreign root `supabase/` project-id, steals :54322 from openvaa-local, empties storage.buckets)"
affects: [131-05, phase-132-full-suite-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Isolated mid-chain perm-spec run: --project=<perm> --no-deps with out-of-band `yarn db:seed --template <t>` (== the setup's setupFromTemplate — same @openvaa/dev-seed pipeline)"
    - "Feedback keep-mounted contract asserted on the DURABLE textarea VALUE across cancel/reopen (not the transient close-transition DOM count that the old H1/H4 investigations chased)"
    - "Storage-502-wedge recovery uses `yarn db:*` ONLY (yarn db:stop/start + reset); bare `npx supabase start` from repo root is FORBIDDEN (foreign-project port theft)"

key-files:
  created:
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/post-fix/131-feedback-survey-3x.txt
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/post-fix/131-popup-probe.txt
  modified:
    - tests/tests/specs/perm/perm-show-feedback-survey.spec.ts
    - .planning/todos/completed/2026-05-16-voter-popup-hydration-layout-03-deeplink.md
    - .planning/todos/completed/2026-05-16-voter-feedback-persistence-second-pass.md
    - .planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/131-DISCUSSION-POINTS.md

key-decisions:
  - "OQ-7.1 = ADD: the text-persists-across-cancel-then-reopen contract is a load-bearing PRODUCT invariant (FeedbackModal.svelte:62 bind:this keep-mounted + cancel-doesn't-reset; only send resets) — added a HARD E2E assertion rather than closing with a drop-rationale"
  - "Todo #3 CLOSED-AS-STALE on 3x-green + explicit probe execution; parity confirmed by reading the current covering specs (no assertion added)"
  - "Ran the mid-chain perm spec ISOLATED (--no-deps + out-of-band seed) instead of the plan's grep-with-deps command, which would execute the entire upstream perm serial-DAG per iteration"
  - "Consolidated to a single 3x run covering both retained popup-parity tests (Task 1) AND the new persistence test (Task 2), since they share one describe/evidence file"

patterns-established:
  - "Assert kept-mounted-form persistence via textarea toHaveValue across cancel→reopen — the actual contract, immune to the close-transition-DOM-count locator collision"
  - "Isolate a mid-chain perm spec with --no-deps + `yarn db:seed --template <t>` to skip the upstream perm chain"

requirements-completed: [HARDN-01]

coverage:
  - id: D-02-todo4
    description: "Todo #4 feedback text-persistence parity gap CLOSED by a NEW HARD assertion (OQ-7.1 = ADD); proven 3x cold-start green"
    requirement: HARDN-01
    verification:
      - kind: e2e
        ref: "perm-show-feedback-survey.spec.ts test 1b (fill→cancel→toBeHidden→reopen→toHaveValue; 3x cold-start, 6 tests each) -> post-fix/131-feedback-survey-3x.txt"
        status: pass
    human_judgment: true
  - id: D-02-todo3
    description: "Todo #3 popup-hydration LAYOUT-03 CLOSED-AS-STALE: popup-through-root-layout-slot parity confirmed on /results; 3x green + explicit probe execution"
    requirement: HARDN-01
    verification:
      - kind: e2e
        ref: "perm-show-feedback-survey.spec.ts tests 2/3 (feedback+survey popup surface + dismiss-persist; 3x) + popupNotice.probe.spec.ts (--project=_probes, 2 passed) -> post-fix/131-feedback-survey-3x.txt + post-fix/131-popup-probe.txt"
        status: pass
    human_judgment: false

# Metrics
duration: ~70min
completed: 2026-07-22
status: complete
---

# Phase 131 Plan 04: Popup/Feedback Cold-Deeplink Cluster (todos #3 + #4) Summary

**Closed the popup/feedback half of the cold-deeplink cluster — todo #3 (popup-hydration LAYOUT-03) CLOSED-AS-STALE and todo #4 (feedback-persistence) FIXED — resolving the phase's one genuine coverage-parity risk by ADDing a new HARD `text-persists-across-cancel-then-reopen` assertion (OQ-7.1 decision: the FeedbackModal `bind:this` keep-mounted design is a load-bearing product invariant), proven 3x cold-start green alongside the retained popup-through-layout-slot parity + an explicitly-executed popupNotice probe.**

## Performance

- **Duration:** ~70 min (dominated by cold-start E2E: perm-show-feedback-survey ~2.5m/run x3 + validation + probe ~1.3m, plus a multi-supabase-project environment recovery)
- **Completed:** 2026-07-22
- **Tasks:** 2
- **Files:** 6 (2 created evidence, 1 spec modified, 2 todos moved+stamped, 1 DISCUSSION-POINTS)

## Accomplishments

- **Todo #4 (feedback-persistence) FIXED — the phase's one genuine parity gap closed (OQ-7.1 = ADD).** Read the current product code and confirmed the contract is load-bearing and intact: `FeedbackModal.svelte:62` keeps `<Feedback bind:this={feedbackRef}>` mounted across close, and the cancel path (`feedback-cancel` → `closeFeedback()` → `modalRef.closeModal()`) does NOT reset — only a successful *send* resets (`onSent` → `feedbackRef.reset()`). So typed feedback survives an accidental cancel. Added a new HARD assertion (test 1b) in `perm-show-feedback-survey.spec.ts`: voter intro → open header feedback modal → `fill()` known text into `feedback-description` → click `feedback-cancel` → assert `feedback-form` `toBeHidden` → reopen → assert the textarea still `toHaveValue(...)`. HARD assertions only, testid-only, no `app_settings` mutation. This assertion targets the DURABLE textarea value — sidestepping the transient close-transition DOM-count locator collision that the old H1/H4 investigations (dialog-wrapper / form-element `toHaveCount(0)`) got stuck on.
- **Todo #3 (popup-hydration LAYOUT-03) CLOSED-AS-STALE.** The cold-deeplink `/results` hydration race (main slot stuck at `Loading…`) was resolved by Phase 117's `dataRoot` `#version`-bridge fix (the recommended "fix the shared upstream loader race FIRST" pickup). Parity CONFIRMED: `perm-show-feedback-survey` tests 2/3 assert feedback + survey popup surface + placement/timing/once/no-double-pop/dismiss-persistence on `/results` (3x green), and the `popupNotice.probe` was **explicitly executed and passed** via `--project=_probes --grep popupNotice` (2 passed) — NOT a silent did-not-run (Pitfall 4: `@probe` is excluded from the default `--grep-invert @probe` run).
- **3x cold-start pass/pass/pass** (6 tests each incl. the new test 1b) — `post-fix/131-feedback-survey-3x.txt`. **Probe 2 passed** — `post-fix/131-popup-probe.txt`.
- **Both todos terminally disposed and moved to `todos/completed/`;** DISCUSSION-POINTS §3.2 / §3.6 / §7.1 ticked, §6 rows #3/#4 filled.

## Task Commits

1. **Task 2 substantive (spec assertion + consolidated 3x/probe evidence)** — `b4c860153` (test)
2. **Tasks 1+2 dispositions (todos #3 CLOSED-AS-STALE + #4 FIXED + ledger)** — `116d549aa` (docs)

_Commits are split by concern rather than strictly per-task: Task 1 and Task 2 share one describe/evidence file and one DISCUSSION ledger, so the code+evidence landed together (commit 1) and both dispositions together (commit 2)._

## Files Created/Modified

- `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` — new HARD test 1b (feedback text persists across cancel then reopen)
- `post-fix/131-feedback-survey-3x.txt` — 3x cold-start (6 each) + validation + the environment-fix note
- `post-fix/131-popup-probe.txt` — popupNotice probe explicitly executed (2 passed)
- `.planning/todos/completed/2026-05-16-voter-popup-hydration-layout-03-deeplink.md` — CLOSED-AS-STALE, moved from pending/
- `.planning/todos/completed/2026-05-16-voter-feedback-persistence-second-pass.md` — FIXED, moved from pending/
- `131-DISCUSSION-POINTS.md` — §3.2/§3.6/§7.1 ticked; §6 rows #3/#4 filled

## Decisions Made

- **OQ-7.1 = ADD (not close-with-rationale).** The keep-mounted `bind:this` design is present in current code and preserves user-typed feedback across an accidental cancel — a genuine UX invariant, so it warrants an E2E assertion. Prohibition P1 (no silent close over the gap) honored: the gap is closed by the added assertion, not papered over.
- **Isolated `--no-deps` + out-of-band seed** rather than the plan's `--grep` command (see Deviations) — `perm-show-feedback-survey` sits mid-chain in the perm serial-DAG, so running it with dependencies would execute the entire upstream chain (localisation → answers-locked → hide-hero) per iteration.
- **Single consolidated 3x run** covering both tasks' assertions (the new test lives in the same describe as the retained popup-parity tests), rather than 3x-before + 3x-after (6 runs).
- **Parity for todo #3 confirmed by reading the current covering specs** — no assertion added; the popup-through-layout-slot contract is fully covered today.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Foreign supabase project stole port :54322 and emptied storage.buckets**
- **Found during:** Task 1/2 first 3x attempt (all 3 runs: 1 failed / 5 did-not-run)
- **Issue:** The initial storage-502-wedge recovery branch ran `npx supabase start` from the repo root. The repo has TWO supabase configs — a root-level `supabase/` (CLI project-id `voting-advice-application-gsd`, from the dir name) and the real dev workspace `apps/supabase/` (project-id `openvaa-local`). Bare `npx supabase start` booted the FOREIGN root project, which grabbed `0.0.0.0:54322` and starved the `openvaa-local` DB the frontend + tests actually use; `storage.buckets` went empty and every run failed on the base-seed portrait upload (test 1 fails → serial cascade).
- **Fix:** `npx supabase stop` (foreign) + `yarn db:stop && yarn db:start && yarn db:reset` (openvaa-local) re-provisioned both buckets (`Creating Storage bucket: public-assets`). Rewrote the recovery branch to use `yarn db:*` ONLY — never bare `npx supabase` from repo root. Re-ran the 3x clean against the correct instance (pass/pass/pass).
- **Files modified:** run harness (scratchpad) + the evidence-file environment-fix preamble only; no repo code.
- **Verification:** All clean re-do runs reported `public-assets bucket present: 1` and 6 passed.

**2. [Rule 3 - Blocking / efficiency] Isolated `--no-deps` + out-of-band seed instead of the plan's grep-with-deps command**
- **Found during:** Task 1 pre-run recipe validation
- **Issue:** The plan's verify command (`--grep "perm-show-feedback-survey"`) targets a mid-chain perm project whose dependency graph pulls the ENTIRE upstream perm serial-DAG (`--list` showed the whole chain), making a 3x run very expensive and coupling the seed to fragile grep-vs-dependency behavior.
- **Fix:** Ran the spec ISOLATED via `--project=perm-show-feedback-survey --no-deps` with the seed provided out-of-band by `yarn db:seed --template show-feedback-survey` — functionally equivalent to the setup project's `setupFromTemplate('show-feedback-survey')` (same `@openvaa/dev-seed` pipeline), and mirroring the documented `_probes` out-of-band-seed + isolated-run discipline. Validated 1x (6 passed) before the 3x.
- **Files modified:** run harness only; no repo code, no contract change.
- **Verification:** Isolated runs seeded correctly and exercised all 6 tests (incl. /results popup tests) 3x green.

**3. [Deviation - documented] RUN 3 first attempt cut short by a 10-min shell-wrapper timeout mid-playwright** (not a test failure) — re-ran RUN 3 cleanly (6 passed); the partial block is annotated in the evidence file.

**Total deviations:** 3 (2 blocking auto-fixed — both environment/harness; 1 documented harness note). None altered the contracts under test or product code. No scope creep.

## Issues Encountered

- **Multi-supabase-project port theft** (see Deviation 1) — the root `supabase/` dir + `apps/supabase/` workspace resolve to different CLI project-ids; only `yarn db:*` targets the correct `openvaa-local` instance. Recommend Plan 05 reuse the `yarn db:*`-only recovery and never `npx supabase start` from repo root.
- **Storage-502-wedge recurred on nearly every `db:reset`** (runs 2/3 both needed recovery) — the `yarn db:stop/start` + `db:reset` branch re-provisions buckets reliably.

## User Setup Required

None. The correct `openvaa-local` supabase instance + the `:5173` dev server are left running for Plan 05's E2E evidence.

## Next Phase Readiness

- All 4 deferred cold-deeplink/parity todos now terminally disposed across Plans 03-04; only Plan 05 (phase closeout) remains.
- No new `test.skip` introduced; the single spec change is one added HARD assertion. Product code untouched.
- The one genuine coverage-parity gap (todo #4) is closed WITHOUT dropping the contract (prohibition P1 honored).

## Known Stubs

None — no stub/placeholder/TODO patterns introduced; the added assertion wires real fill/cancel/reopen interactions against live testids.

## Self-Check: PASSED

- All 6 created/modified files verified present on disk; test 1b present in the spec.
- Both task commits (`b4c860153`, `116d549aa`) verified in git log.
- Both todos confirmed moved (not copied): neither remains in `.planning/todos/pending/`.

---
*Phase: 131-e2e-reliability-hardening-deferred-flake-race-triage*
*Completed: 2026-07-22*
