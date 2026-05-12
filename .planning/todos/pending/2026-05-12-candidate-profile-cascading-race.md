# Candidate-profile.spec.ts cascading race (Phase 76/77/78 deferred → v2.10+)

**Filed:** 2026-05-12 at Phase 78 close (Plan 07 Task 5)
**Source:** Phase 78 P07 verification gate per RESEARCH Q2 + LANDMINE-2; inherited from Phase 76 P04 + Phase 77 P05 deferred-items
**Severity:** HIGH (blocks parity-script regen capability at every verification gate)
**Routed to:** v2.10+ candidate (alongside frontend-project-id-scoping + results-url-refactor-followups)

## Defect

`tests/tests/specs/candidate/candidate-profile.spec.ts:85-145` `should register the fresh candidate via email link` test. After registration, URL re-redirects to `/login` with "Your password is now set!" heading; the `loginIfRedirectedToLoginPage` helper attempts manual login but the subsequent Terms-of-Use checkbox never surfaces.

Because the host file uses `test.describe.configure({ mode: 'serial' })`, ALL subsequent tests in the describe block cascade-SKIP with "did not run" status, which cascades through dependent projects via Playwright's `dependencies` chain:

```
data-setup → auth-setup → candidate-app → candidate-app-mutation →
re-auth-setup → candidate-app-settings → candidate-app-password →
(all variant-* projects that depend on data-setup-variant)
```

## Empirical impact

Cold-start full-suite captures across Phase 76 + 77 + 78 verification gates document:
- Phase 75 baseline: 47 PASS_LOCKED
- Phase 76 cold-start: 4 PASS_LOCKED (43-test regression delta; 42 deterministic failures × 3 identical runs)
- Phase 77: same race active in dev shell; all 4 plans used `--no-deps` workaround
- Phase 78: race expected to persist; full-suite gate routed to operator-checkpoint (162 min total)

Until this race is resolved, NO verification phase can cleanly regenerate the parity-script constants — every regen would lock in the degraded baseline.

## Root-cause hypothesis (from Phase 76 P04 deferred-items)

The post-set-password redirect to `/login` happens before the auth session is fully propagated. The fresh session that lands at `/login` does not yet have a ToU acknowledgment cookie, so the ToU checkbox surface is skipped (or never renders) — but the helper expects the checkbox to be present.

Two candidate root causes (not yet confirmed):
1. Auth state isn't fully propagating before the redirect (race in Supabase auth session handshake)
2. ToU acknowledgment is gated on a context that hasn't yet hydrated (race in SvelteKit hydration)

## Recommended approach (v2.10+ phase)

1. Root-cause investigation phase:
   - Reproduce the race in isolation (one candidate-profile run, no full-suite)
   - Trace the auth session state vs the ToU checkbox render via Playwright's network panel + console logs
   - Identify the exact race window
2. Fix path (either-or):
   - Fix the underlying frontend bug (auth state propagation OR ToU hydration)
   - OR rewrite the test to bypass the cascade-prone serial mode (split the registration test into a setup project; downstream tests don't depend on the redirect succeeding)
3. Verification:
   - Run a 3-run cold-start full-suite gate
   - Confirm PASS_LOCKED captures the ~63 expected entries (47 Phase 75 baseline + 16 voter-fixture-race tests CLEAN-05a unblocked)
   - Regenerate parity-script constants via `node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs <run-3.json>`

## Cross-references

- `.planning/phases/76-profile-a11y/deferred-items.md` #2
- `.planning/phases/76-profile-a11y/76-VERIFICATION.md` §"Failure-Class Pool Rationale (42 deterministic failures × 3)"
- `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-05-SUMMARY.md` §Human Verification Needed item 5
- `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-VERIFICATION.md` §"3-Run Determinism Record" (DEFERRED-WITH-RATIONALE)
- `.planning/phases/78-cleanup-hygiene-phase/78-RESEARCH.md` §"Auth-Setup Race ↔ Phase 76 Deferred-Items Cross-Reference"
- `.planning/phases/78-cleanup-hygiene-phase/78-06-SUMMARY.md` §LANDMINE Cross-References (WR-04 confirmed code-quality only; does NOT resolve this cascade)
- `.planning/phases/78-cleanup-hygiene-phase/78-VERIFICATION.md` §"Out-of-Scope Items (Filed as Follow-up Todos)"
- `.planning/phases/73-determinism-baseline/73-REVIEW.md` §"Resolution at Phase 78 close" — WR-04 LANDMINE-2 callout
