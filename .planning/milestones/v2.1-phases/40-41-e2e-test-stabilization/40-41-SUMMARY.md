# Phase 40-41 Summary: E2E Test Stabilization

**Status:** Complete
**Completed:** 2026-03-26
**Tasks:** 6/6

## One-liner

Fixed all 4 remaining E2E test failures: protected layout hydration (2 interacting Svelte 5 bugs), candidate registration/password email flows, and feedback popup timing.

## What Was Done

### Session 1 (2026-03-25): Popup + Email Flows (Tasks 1-5)

**Popup timing fix (Tasks 1-3):**
- Created PopupRenderer as runes-mode wrapper component (Svelte 5 legacy-mode root layout can't detect store changes from async callbacks)
- Fixed countdown restart logic with clearTimeout + restart pattern
- Added delay<=0 guard (0 means disabled, not immediate fire)
- Fixed FeedbackPopup $state initialization

**Email/auth flow fixes (Tasks 4-5):**
- Password reset: implemented session-based flow (auth callback verifyOtp establishes session; code param was Strapi-era legacy)
- Registration invite: fixed flow to redirect to login page after password set (session from verifyOtp doesn't reliably persist through client-side navigation)

### Session 2 (2026-03-25/26): Hydration + Remaining Failures (Task 6)

**Protected layout hydration (deepest investigation):**
- Root-caused TWO interacting bugs:
  1. Svelte 5 hydration: writing multiple $state vars in .then() from $effect doesn't trigger re-renders
  2. termsAccepted initialized as undefined causes TermsOfUseForm to throw props_invalid_value (masked by bug 1)
- Fix: consolidated ready/error/showTermsOfUse into single layoutState enum (single $state write); initialized termsAccepted to false

**E2E test fixes:**
- Password test: rewrote to log in fresh instead of using stale storageState (admin.updateUserById revokes all sessions)
- Constituency overlay: added missing East Municipality test data
- Multi-election setup: added popup settings to prevent stale setting bleed-through

## Decisions

| Decision | Rationale |
|----------|-----------|
| Single layoutState enum over separate $state vars | Svelte 5 hydration bug: multiple $state writes in .then() callback don't trigger re-renders |
| termsAccepted = false (not undefined) | $bindable props validation rejects undefined |
| Password test fresh login over storageState | admin.updateUserById revokes all sessions, invalidating saved tokens |
| delay<=0 = disabled | clearTimeout+restart semantics changed 0 from no-op to immediate |
| Invite flow redirects to login (not candidate home) | Session from verifyOtp doesn't reliably persist through client-side navigation |
| Password-reset supports session-based flow (no code) | Auth callback verifyOtp establishes session; code param was Strapi-era |
| PopupRenderer runes-mode wrapper | Svelte 5 legacy-mode root layout can't detect store changes from async callbacks |

## Issues

- **Resolved:** All 4 E2E failures fixed (candidate-registration x2, candidate-profile, voter-popups)
- **Known:** Local imgproxy Docker container crashes intermittently (502 on image upload) — infrastructure issue, not code. Fix: `supabase stop && supabase start`

## Requirements Met

- EMAIL-01: Candidate registration email flow ✅
- EMAIL-02: Candidate password reset email flow ✅
- AUTH-01: Fresh candidate registration + protected routes ✅
- POP-01: Feedback popup timing ✅
