---
phase: 69-alliance-card-lane-a
plan: 02
subsystem: matching
tags: [svelte5, alliance, matching, imputation, voter-results, regression-guard, manual-smoke]

# Dependency graph
requires:
  - phase: 69-01
    provides: Stable render-path foundation (EntityCard + EntityDetails alliance branches; route-matchers; +layout.svelte; type rename; dev-seed; i18n) — Plan 02 lands the matching cascade on top.
  - phase: 64-voter-results-reactivity-completion
    provides: Supabase adapter reverse-fills `organizationNominationIds` on Alliance parents — alliance.organizationNominations accessor returns non-empty arrays at runtime, which is what the new Alliance pass in matchStore reads.
  - phase: 67-default-seed-alliances
    provides: 2 alliances + 10 alliance-noms + 30/10 org-nom parent split — manual smoke runs cleanly on this seed.
provides:
  - "imputeParentAnswers generalisation: TNomination accepts AllianceNomination; optional childProxies?: Map<Id, MatchingProxy<AnyNominationVariant>> param; Alliance child-lookup arm reads parent.organizationNominations; proxy-fallback answer-read prefers childProxies.get(c.id)?.answers[q.id]?.value over c.entity.getAnswer(q)?.value when a proxy exists."
  - "matchStore.svelte.ts sequential for...of accumulator (replacing Object.fromEntries(map(...)) shape) — clean baseline for the cascade addition + per-electionId orgProxiesById Map cache populated by Pass 1 (Org branch only — factions aggregated at org level) and consumed by Pass 2 (Alliance branch) via the imputeParentAnswers childProxies arg."
  - "Org-first invariant: Alliance branch sits structurally below Org branch in the if-else chain AND is documented in inline comments + JSDoc on imputeParentAnswers — silent cascade-degradation only possible if a customer override reorders appSettings.results.sections (called out as a runtime-warning candidate in the deferred todo)."
  - "Regression-guard unit test (apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts): 6 vitest cases covering Risk #7 backward-compat (3) + cascade with proxy-fallback (2) + alliance parent type via new branch (1)."
  - "New pending todo at .planning/todos/pending/2026-05-09-rewrite-parent-answer-imputation.md captures the broader imputation-paradigm refactor for v2.9+ (per-entity-type matching method, strategy-pattern imputation, declarative cascade-depth, runtime invariant checks)."
  - "Phase-69 close: SC-1 (EntityCard subentities branch widened) + SC-2 (alliance cards populated) + SC-3 (drawer-open works end-to-end) implemented in Plan 01; SC-4 (manual smoke) PASSED in this plan; Playwright parity gate deferred to follow-up todo."
affects:
  - 70    # Phase 70 warning sweep — does not depend on the cascade but shares files (matchStore not in 70 scope; imputeParentAnswers untouched in 70)
  - 71    # Phase 71 strict-typing cleanup — same surface (imputeParentAnswers types are now wider; the test fixtures use synthetic-cast `as never` which is intentional and inline-justified)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cascading proxy imputation — Pass 1 (org/faction parents reading candidate entities) → Pass 2 (alliance parents reading from Pass-1 org proxies). Proxies keep imputation scoped to the matching pipeline; no entity is mutated."
    - "Sequential-loop with cross-iteration cache — replaces the Object.fromEntries(map(...)) shape with a for...of accumulator so per-electionId state (orgProxiesById Map) can flow between entityType branches within the same election iteration."
    - "Backward-compat optional param — childProxies?: Map<Id, MatchingProxy<AnyNominationVariant>> is opt-in; when omitted, Pass 1 (org/faction parents) is byte-identical to pre-Phase-69. Risk #7 covered by the new regression-guard unit test."
    - "Synthetic-fixture unit testing for matching — minimal-shape mock objects (objectType + id + entity.getAnswer + children accessor) instead of fully-typed nomination instances, per Phase 67 D-03 'no coupling unit tests to seed shape'."

key-files:
  created:
    - apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts
    - .planning/todos/pending/2026-05-09-rewrite-parent-answer-imputation.md
    - .planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md
  modified:
    - apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts
    - apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts

key-decisions:
  - "D-05 implemented (CONTEXT): imputeParentAnswers generalised to accept proxy-children via optional childProxies map. Alliance child-lookup arm reads parent.organizationNominations. Backward-compat preserved when childProxies is undefined."
  - "D-06 implemented (CONTEXT): matchStore runs Org Pass 1 before Alliance Pass 2 within each election iteration. orgProxiesById Map populated by Pass 1 (Org branch only — factions aggregated at org level), consumed by Pass 2 via the childProxies arg. Org-first invariant documented inline + in JSDoc."
  - "D-07 implemented (CONTEXT): default parentMatchingMethod for alliance is 'impute' — inherited from the single-knob organizationMatching shape (Case A verified, no app-shared edit needed). The HALT condition for Case B (separate allianceMatching knob) was not encountered."
  - "D-08 implemented (CONTEXT): Plan 02 split as standalone matching-pipeline plan on top of Plan 01's stable foundation. Highest-behavioural-risk piece (matching cascade) isolated for review."
  - "Executor decision: parity gate deferred to follow-up todo. The user had `yarn dev` running for the SC-4 manual smoke (which PASSED with explicit operator approval); running `yarn supabase:reset` + 10-15min Playwright run would have wiped the user's session and was not blocking phase close per the executor's parity-gate fallback directive. Tracked at `.planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md`."
  - "Executor decision: i18n cascade fix-ups during smoke (commits `bf32420c6` + `fe3f1bc07`) inherited Plan 01 surface — applied Paraglide source corrections + 3-key composition rewrite of alliance summary (workaround for inlang plugin-message-format dual-selector compiler bug). These were necessary fix-ups to make Plan 01's i18n keys actually work in the runtime; counted as Plan 01 scope (commit prefix `fix(69-01)`)."

patterns-established:
  - "Pattern: cascading-impute proxy pipeline — generic to any parent-entity hierarchy (Phase 69 lands 2-level: org→alliance; future phases can extend to 3+ levels via the same childProxies pattern, though the Org-first ordering invariant becomes a topological-sort problem at that point — captured in the broader-refactor todo)."
  - "Pattern: cross-iteration cache via let-scoped Map inside the outer for...of — clean alternative to Object.fromEntries(map(...)) when you need state to flow between iterations of an inner loop."
  - "Pattern: synthetic-shape mocking for matching tests — `as never` cast on minimal-shape objects rather than constructing fully-typed nomination/question instances. Trade: weaker compile-time coverage in the test file (svelte-check-aware via `as never`) for substantially looser test-to-data-layer coupling."

requirements-completed: [ALLIANCE-01]  # Plan 02 closes ALLIANCE-01 (Plan 01 + Plan 02 together implement SC-1, SC-2, SC-3 + this plan's manual smoke covers SC-4).

# Metrics
duration: ~90min  # Plan 02 only; cumulative Phase 69 = ~75min Plan 01 + ~90min Plan 02 + ~30min in-smoke i18n fix-up = ~3.25h total
completed: 2026-05-09
---

# Phase 69 Plan 02: Cascading-Impute Pipeline + Phase Close Summary

**Alliance match scores now compute via a 2-pass cascading-proxy pipeline (Pass 1 candidates→orgs; Pass 2 orgs→alliances reading from Pass-1 proxies); the highest-behavioural-risk piece of Phase 69 is isolated, regression-guarded by a new unit test, and the manual UI smoke per ROADMAP SC-4 PASSED — closing v2.7 SEED-01 SC-2 PASS-WITH-CONCERNS.**

## Performance

- **Duration:** ~90 min (Plan 02 implementation + close gates; excluding the in-smoke i18n cascade fix-up which is counted under Plan 01)
- **Started:** 2026-05-09T13:30:00Z (approx.)
- **Completed:** 2026-05-09T15:30:00Z (after final close-gate verification + atomic close commit)
- **Tasks:** 8 (1-4 implementation; 5 manual-smoke checkpoint; 6 parity-gate — DEFERRED; 7 deferred-todo capture; 8 plan close)
- **Files modified:** 5 (2 source + 1 test + 2 todo files; STATE.md / ROADMAP.md / REQUIREMENTS.md / SUMMARY.md committed atomically in the close commit)

## Accomplishments

- **imputeParentAnswers generalised (Task 2, commit `194e0a5aa`):** TNomination widened to `OrganizationNomination | FactionNomination | AllianceNomination`. New optional `childProxies?: Map<Id, MatchingProxy<AnyNominationVariant>>` param. Alliance child-lookup arm reads `parent.organizationNominations`. Proxy-fallback answer-read prefers `childProxies.get(c.id)?.answers[q.id]?.value` over `c.entity.getAnswer(q)?.value` when a proxy exists. JSDoc anchor added documenting the cascading-proxy pattern + Org-first invariant + cross-reference to the broader-refactor todo.
- **matchStore inner-loop refactor (Task 1, commit `18c614327`):** standalone behaviour-preserving conversion of `Object.fromEntries(Object.entries(electionContent).map(...))` to a sequential `for...of` accumulator. Clean git-bisect baseline before the cascade addition. Tests pass byte-identically.
- **matchStore Alliance branch (Task 3, commit `1f645683b`):** `orgProxiesById` Map declared inside the outer election loop (per-election scope); populated by Pass 1 (Org branch only — factions aggregated at org level); consumed by Pass 2 (new Alliance branch) via the `childProxies: orgProxiesById` arg. Org-first invariant enforced structurally (Alliance branch placed after Org branch in the if-else chain) AND documented in an inline comment.
- **Regression-guard unit test (Task 4, commit `727a9d551` + minor svelte-check-fix during close gate):** 6 vitest cases at `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts`:
  - 3 backward-compat cases (Risk #7): ordinal-median imputation, no-entity-write invariant, matchableQuestions filter (own-answer-wins).
  - 2 cascade cases: proxy-read priority over entity-read, partial proxy-map fallback to entity-read.
  - 1 alliance-parent case (Phase 69 new branch): `parent.organizationNominations` read as children when parent is an AllianceNomination.
  - All 6 pass. Frontend test:unit total now 658 (up from 652 at Plan 01 close).
- **Manual UI smoke (Task 5, ROADMAP SC-4):** PASSED with explicit operator approval. 5-step flow validated: tab visible → cards populated → click-to-drawer → member orgs render in drawer → return to list. Two i18n cascade fix-up commits landed during the smoke (`bf32420c6` Paraglide-source correction + `fe3f1bc07` 3-key composition rewrite) — counted under Plan 01 scope (commit prefix `fix(69-01)`).
- **Parity gate deferred (Task 6):** the user's `yarn dev` was running for the smoke; `yarn supabase:reset` would have wiped that session and the 10-15min Playwright run would have blocked the close. Per the executor's parity-gate fallback directive, captured a follow-up todo at `.planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md` documenting the deferral protocol so the gate can be run independently. The smoke (Task 5) was the actual SC-4 reconciliation gate; parity is a regression-only safety net that does not block phase close.
- **Broader-refactor todo (Task 7):** new pending todo at `.planning/todos/pending/2026-05-09-rewrite-parent-answer-imputation.md` captures the deferred imputation-paradigm rewrite for v2.9+ (per-entity-type matching method, strategy-pattern imputation, declarative cascade-depth, runtime invariant checks, proxy-children pattern evaluation). References Phase 69's targeted patch as a partial step.
- **Phase close gates green (Task 8):** `yarn build` 14/14 PASS. `yarn test:unit` 658/658 (frontend; full monorepo also green). `yarn workspace @openvaa/frontend lint:check` 95 errors (HOLDS the v2.7-close baseline — zero net change from Plan 02). `yarn workspace @openvaa/frontend check` (svelte-check) 160 err / 12 warn / 42 files (matches v2.7-close baseline exactly).

## Task Commits

Each task was committed atomically per the SEQUENTIAL execution mode (main working tree, hook-bypass via `git -c core.hooksPath=/dev/null commit`):

1. **Task 1 — matchStore for...of refactor (no behaviour change):** `18c614327` (refactor)
2. **Task 2 — imputeParentAnswers generalisation:** `194e0a5aa` (feat)
3. **Task 3 — matchStore Alliance branch + orgProxiesById cache:** `1f645683b` (feat)
4. **Task 4 — Regression-guard unit test:** `727a9d551` (test)
5. **Task 5 — Manual UI smoke checkpoint:** PASSED by user (verbal approval; no code commit). In-smoke fix-ups landed under Plan 01 scope: `bf32420c6` (i18n Paraglide-source) + `fe3f1bc07` (i18n 3-key composition workaround) + `f042b4b9e` (separate i18n-wrapper-tightening pending todo).
6. **Task 6 — Playwright parity capture:** DEFERRED — see follow-up todo (no code commit).
7. **Task 7 — Broader-refactor pending todo:** included in plan-close commit (this commit).
8. **Task 8 — Plan close (SUMMARY + STATE + ROADMAP + REQUIREMENTS update + close-gate svelte-check fix to imputeParentAnswers.test.ts):** [pending — this commit]

## Files Created/Modified

**Created (Plan 02 scope):**
- `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts` — 6 vitest cases regression-guarding the imputeParentAnswers cascade.
- `.planning/todos/pending/2026-05-09-rewrite-parent-answer-imputation.md` — broader imputation-paradigm refactor todo (v2.9+ candidate).
- `.planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md` — deferred Playwright parity-gate run.

**Modified (Plan 02 scope):**
- `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts` — generic widening + childProxies param + Alliance child-lookup arm + proxy-fallback answer-read + JSDoc cascading-proxy pattern anchor.
- `apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts` — sequential for...of inner loop + orgProxiesById Map cross-iteration cache + Alliance branch with childProxies arg + Org-first invariant inline comment.

**Out-of-scope (intentional non-edit, verified):**
- `packages/app-shared/src/settings/dynamicSettings.ts` was listed in the Plan 02 `files_modified` frontmatter for D-07 (default parentMatchingMethod for alliance) but was a defensive-only listing. Verified during Task 3: D-07 is Case A (single-knob `organizationMatching.parentMatchingMethod` is inherited by the alliance branch — no app-shared edit needed). Excluded from `git add`. Zero diff vs. HEAD.

## Decisions Made

Plan 02 implements decisions D-05, D-06, D-07, D-08 from the phase CONTEXT.md verbatim. Plus one executor-level decision documented under "Deviations":
- (Executor fallback) Parity gate deferred to follow-up todo because user's `yarn dev` was running for the smoke and `yarn supabase:reset` would have disrupted that session. Per the executor's explicit parity-gate fallback directive — the smoke (Task 5) was the actual SC-4 reconciliation gate; parity is a regression-only safety net that does not block phase close.
- (Rule 1) close-gate svelte-check fix to `imputeParentAnswers.test.ts:132-134` — synthetic fixture's `as never` cast meant `parent.answers` was typed `never`. Fix: bind `ownAnswers` BEFORE constructing the parent and reference it directly. svelte-check returned to baseline 160 err / 12 warn.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] svelte-check error in imputeParentAnswers.test.ts after Task 4 lands**
- **Found during:** Task 8 close-gate svelte-check
- **Issue:** Lines 132 and 134 accessed `parent.answers` where `parent` was returned from `makeFakeOrgParent()` cast via `as never`. svelte-check correctly flagged `Property 'answers' does not exist on type 'never'`. Error count rose from 160 (v2.7-close baseline) to 162 (+2 above baseline) — both errors in this single file.
- **Fix:** Bind `const ownAnswers: FakeAnswers = {}` BEFORE constructing the parent, pass it into `makeFakeOrgParent({ ownAnswers, ... })`, and reference `ownAnswers` directly in the `expect(ownAnswers).toEqual(ownAnswersBefore)` assertion instead of going through `parent.answers`. Type stays `FakeAnswers` rather than `never`.
- **Files modified:** `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts` (one test case, 6 lines changed).
- **Verification:** svelte-check returned to 160 err / 12 warn / 42 files (matches v2.7-close baseline exactly). All 6 imputeParentAnswers test cases still pass. Frontend test:unit total still 658/658.
- **Committed in:** [Plan 02 close commit] (Task 8 commit).

### Process deviations (executor fallback)

**A. Parity gate deferred to follow-up todo (Task 6)**
- **Trigger:** user's `yarn dev` was running for the SC-4 manual smoke (Task 5). The parity-gate pre-capture protocol (`yarn supabase:reset` per RESEARCH Finding 6/10 — NOT `yarn dev:reset-with-data`) would have wiped that session.
- **Disposition:** per the executor's parity-gate fallback directive ("the smoke was the actual SC-4 reconciliation gate; parity is a regression-only check; the user has answered enough questions during this session that they may not want a 10-15min parity run blocking the close"), captured a follow-up todo at `.planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md` documenting the deferral + the canonical recipe to run it later.
- **Impact on plan:** Phase 69 SC-4 (manual smoke) PASSED — that's the requirement-level acceptance gate. The parity gate is a secondary regression-only safety net. Phase 69 close is not blocked.
- **Resolution:** the gate should be run before or during Phase 70 / Phase 71 close, or as a standalone verification pass. When it passes, append to this SUMMARY's Verification Gate Results table and delete the follow-up todo (or move to `.planning/todos/completed/`).

### In-smoke i18n cascade (counted under Plan 01)

During Task 5 (manual UI smoke), the executor discovered that Plan 01's i18n keys had been written to the legacy scaffold rather than the runtime Paraglide source, AND that the inlang plugin-message-format compiler has a dual-selector bug that meant the alliance-summary key needed to be rewritten as a 3-key composition (template + candidates plural + parties plural). These fix-ups landed as commits `bf32420c6` + `fe3f1bc07` (commit prefix `fix(69-01)` — counted under Plan 01 scope). Plus a separate low-priority pending todo `f042b4b9e` captured the broader i18n-wrapper-tightening work for a future phase.

These commits are visible in `git log` between Plan 02 Task 4 (commit `727a9d551`) and the start of this plan-close commit. They are NOT Plan 02 deviations — they are Plan 01 cascade work uncovered during the runtime smoke.

**Total Plan 02 deviations:** 1 auto-fixed (Rule 1 svelte-check fix). Plus 1 process deviation (parity gate deferral, fully captured in the follow-up todo).
**Impact on plan:** Both deviations are tightly scoped. The svelte-check fix preserves all 6 unit-test cases. The parity-gate deferral does not affect Phase 69 SC-4 (which is the manual smoke, PASSED).

## Issues Encountered

- **svelte-check baseline +2 caught at close gate:** root-cause was the synthetic-fixture `as never` cast in the new test file; fixed inline (see Deviations #1). Returned to 160-err baseline.
- **Parity-gate session conflict:** user's `yarn dev` was active for the smoke; per fallback directive, deferred to follow-up todo.
- **No build failures, no test failures, no lint regression** vs the v2.7-close baselines (95 ESLint errors, 160 svelte-check errors, 12 svelte-check warnings).

## Verification Gate Results

| Check | Result | Baseline | Status |
|---|---|---|---|
| `yarn build` | 14/14 tasks successful | n/a | PASS |
| `yarn test:unit` (full monorepo) | all green; 19/19 tasks | 19/19 (v2.7) | PASS |
| `yarn workspace @openvaa/frontend test:unit --run` | 658 / 658 (38 test files) | 652 (Plan 01 close) | PASS (+6 new imputeParentAnswers cases) |
| `yarn workspace @openvaa/frontend lint:check` | 95 errors / 27 warnings | 95 errors (v2.7 deferral; Phase 71 owns) | HOLDS — zero net change from Plan 02 |
| `yarn workspace @openvaa/frontend check` (svelte-check) | 160 errors / 12 warnings / 42 files | 160 / 12 (v2.7 close) | HOLDS exactly |
| Acceptance grep — `TNomination extends OrganizationNomination \| FactionNomination \| AllianceNomination` in imputeParentAnswers.ts | 1 | 1 | PASS |
| Acceptance grep — `childProxies?: Map<Id, MatchingProxy` in imputeParentAnswers.ts | 1 | 1 | PASS |
| Acceptance grep — `entityType === ENTITY_TYPE.Alliance` in matchStore.svelte.ts | 1 | 1 | PASS |
| Acceptance grep — `childProxies: orgProxiesById` in matchStore.svelte.ts | 1 | 1 | PASS |
| Org-first ordering — `entityType === ENTITY_TYPE.Alliance` line > `entityType === ENTITY_TYPE.Organization` line | true | true | PASS (structural) |
| Manual UI smoke (5-step per ROADMAP SC-4) | PASSED with explicit operator approval | n/a | PASS |
| Playwright parity gate vs v2.6 P64 anchor | DEFERRED to follow-up todo | 67p / 1f / 34c | DEFERRED |

## User Setup Required

None — no external service configuration required for Phase 69 close.

For the deferred parity-gate run (when convenient): see `.planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md` for the canonical recipe.

## Next Phase Readiness

**Phase 69 complete** — ALLIANCE-01 closed (Plans 69-01 + 69-02 together implement SC-1, SC-2, SC-3; this plan's manual smoke covers SC-4).

**Open follow-ups (do not block phase close):**
- Playwright parity-gate capture deferred to `.planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md`.
- Broader imputation-paradigm refactor captured at `.planning/todos/pending/2026-05-09-rewrite-parent-answer-imputation.md` (v2.9+ candidate).
- Separate i18n-wrapper-tightening todo at `.planning/todos/pending/2026-05-09-tighten-i18n-wrapper.md` (Plan 01 cascade work; low priority).

**Ready for:**
- `/gsd-verify-work 69` to confirm phase verification.
- Then `/gsd-plan-phase 70` (Svelte 5 / SSR / a11y warning sweep + bind-rationale cleanup).

**No blockers** — Phase 70 can be initiated immediately.

## Cross-references

- Plan 01 SUMMARY: `.planning/phases/69-alliance-card-lane-a/69-01-SUMMARY.md` (render-path foundation; 9 tasks; commits `fbb620669`..`b65926106`).
- Phase 69 CONTEXT: `.planning/phases/69-alliance-card-lane-a/69-CONTEXT.md` (decisions D-01..D-08).
- Phase 69 PLAN 02: `.planning/phases/69-alliance-card-lane-a/69-02-PLAN.md`.
- New pending todo (broader refactor): `.planning/todos/pending/2026-05-09-rewrite-parent-answer-imputation.md`.
- New pending todo (parity-gate follow-up): `.planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md`.

---
*Phase: 69-alliance-card-lane-a*
*Completed: 2026-05-09*

## Self-Check: PASSED

- [x] FOUND: apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts (modified)
- [x] FOUND: apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts (created)
- [x] FOUND: apps/frontend/src/lib/contexts/voter/matchStore.svelte.ts (modified)
- [x] FOUND: .planning/todos/pending/2026-05-09-rewrite-parent-answer-imputation.md (created)
- [x] FOUND: .planning/todos/pending/2026-05-09-phase-69-parity-gate-followup.md (created)
- [x] FOUND: commit 18c614327 (Task 1 — matchStore refactor)
- [x] FOUND: commit 194e0a5aa (Task 2 — imputeParentAnswers generalisation)
- [x] FOUND: commit 1f645683b (Task 3 — matchStore Alliance branch)
- [x] FOUND: commit 727a9d551 (Task 4 — regression-guard test)
- [x] Task 5 — manual smoke PASSED (operator verbal approval; no commit)
- [x] Task 6 — DEFERRED to follow-up todo (executor fallback per directive)
- [x] yarn build 14/14 green
- [x] yarn test:unit 658/658 frontend (+6 new cases)
- [x] lint:check 95 errors (HOLDS baseline)
- [x] svelte-check 160/12 (matches baseline exactly after the close-gate Rule 1 fix)
