# QSPEC-01/02 walkToQuestion cold-start race — v2.11+ hardening

**Filed:** 2026-05-14
**Source:** Phase 86 DETERM-14 (`.planning/phases/86-voter-app-failure-class-cleanup-investigate-and-resolve-the-/86-03-PLAN.md` Tasks 1 + 2; 86-RESEARCH.md §3.9 + §3.10)
**Home phase:** v2.11+ (target phase TBD)
**Effort:** ~1 phase (cluster-wide voter-fixture hardening; same scope as the prior 2026-05-11-voter-fixture-heterogeneous-question-types.md and 2026-05-12-qspec-01-i18n-hardening.md follow-ups, but specifically for the cold-start `voter-questions-start` 10s timeout)

## Why deferred

Both QSPEC-01 (boolean) and QSPEC-02 (categorical) share a SINGLE root cause per Phase 86 RESEARCH §3.9-§3.10: the `walkToQuestion(page, N)` helper in `tests/tests/utils/voterNavigation.ts` calls `walkToQuestionsIntro` which waits up to 10s on `getByTestId('voter-questions-start')` (apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte:161). In full-suite cold-start runs, this testId either (a) does not render fast enough due to a settings-overlay race or (b) is bypassed entirely because `passThroughConstituencies` falls through to `navigateDirectlyToQuestions` (placing the voter on `/questions/<id>` instead of `/questions/<intro>`).

This is the SAME race that Phase 75 closed as PASS-WITH-DEFERRAL — see `.planning/milestones/v2.9-phases/75-question-rendering-specs/75-VERIFICATION.md` §"FAILURE-CLASS rationale". Per Phase 86 CONTEXT.md D-03 (fix-preferred-skip-acceptable, 1h investigation cap) + D-08 (no SETTINGS-03 product-fix), Phase 86 inherits the Phase 75 classification rather than attempting either of the candidate fixes:

- **Project-wide `--likert-only` seed flip** (RESEARCH §3.9 H3): would regress 60+ other voter-app PASS_LOCKED cells (the e2e template ships sort-17 categorical + sort-18 boolean which `--likert-only` strips out; spec assertions on those questions would fail).
- **Per-spec `appSettings.questions.questionsIntro.show: true` override** (H1): unbounded risk — settings persistence may leak into adjacent voter-app project tests and the override path doesn't address the deeper `passThroughConstituencies` fallback case.
- **`walkToQuestion` helper resilience** (H2): touches a helper shared by MANY voter-app specs. A bad refactor regresses the whole voter-app cluster; outside the per-test cap for Phase 86.

Per-plan smoke remains PASS × 3 in isolation per the Phase 75 verification. Only full-suite cold-start surfaces the race.

## Scope when picked up

1. **Decide which mechanism to apply:**
   - Option A (per-spec settings override) — restricted to QSPEC-01/02 only, with a beforeAll teardown to ensure no leak.
   - Option B (`walkToQuestion` helper resilience) — detect the `passThroughConstituencies` fallback path and skip the intro start CTA wait when voter is already on `/questions/<id>`.
   - Option C (per-project `voter-app` seed flip via custom Playwright project with `--likert-only`) — adds a new project scope, leaves the existing `voter-app` project + 60+ PASS_LOCKED cells untouched.
2. **Verify in isolation × 3** AND **full-suite cold-start × 3** that QSPEC-01 + QSPEC-02 become deterministic PASS.
3. **Regression check:** run the full voter-app project + variant-* project smokes 3× cold-start to confirm no PASS_LOCKED regression.
4. **Move QSPEC-01 + QSPEC-02 OUT of `SKIPPED_TESTS` const** (or the FAILURE-CLASS narrative — whichever Phase 86 Plan 04 lands).

## Cross-references

- Phase 86 CONTEXT D-03 (fix-preferred-skip-acceptable; 1h-per-test cap)
- Phase 86 CONTEXT D-08 (no SETTINGS-03 product-fix pre-resolution)
- Phase 86 RESEARCH §3.9 (QSPEC-01 RCA + H1/H2/H3 fix sketches)
- Phase 86 RESEARCH §3.10 (QSPEC-02 — confirmed shared root cause with QSPEC-01)
- Phase 75 VERIFICATION §"FAILURE-CLASS rationale" (original PASS-WITH-DEFERRAL classification + Phase 75 acceptance shape)
- `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` (Phase 75 Path B operator-locked — overlapping scope)
- `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md` (Phase 75 W-03 follow-up — i18n hardening; orthogonal to the cold-start race)
- Phase 75 P01 Option A (`walkToQuestion` 2-iter Skip-Next fallback) — already applied; this todo addresses the residual cold-start race

## Open questions

- Should Option C (per-project seed flip via a new Playwright project, e.g., `voter-app-likert-only`) be preferred over Option A or B? It isolates the `--likert-only` flip to QSPEC-01/02 + a small set of fixture-compatible specs, avoiding both the broad seed-flip regression and the shared-helper refactor.
- Is the `passThroughConstituencies` fallback path itself a latent bug worth fixing at the helper level (mirror the assertion path) even outside the QSPEC scope?
