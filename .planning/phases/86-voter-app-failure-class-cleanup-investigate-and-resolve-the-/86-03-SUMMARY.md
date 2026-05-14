---
phase: 86
plan: 03
subsystem: testing/voter-app-e2e
tags: [DETERM-14, voter-app, visibility, edge-cases, question-rendering, failure-class-cleanup, pass-with-deferral]
dependency-graph:
  requires: [DETERM-11 (Phase 85), DETERM-12 (Phase 86 Plan 01), DETERM-13 (Phase 86 Plan 02)]
  provides: [DETERM-14 visibility+edge-cases+question-rendering cluster closure]
  affects:
    - tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts
    - tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts
    - tests/tests/specs/voter/voter-visibility-required.spec.ts (project-config only)
    - tests/tests/specs/voter/voter-detail.spec.ts
    - tests/playwright.config.ts
tech-stack:
  added: []
  patterns:
    - "test.skip(true, '...')+block-comment+todo (Phase 75 PASS-WITH-DEFERRAL precedent — PATTERNS.md §1 Analog A)"
    - "Playwright project-config testIgnore additive regex (PATTERNS.md §4)"
    - "Hydration-completeness guard before negative-presence assertion (Phase 83 DETERM-07b)"
key-files:
  created:
    - .planning/todos/pending/2026-05-14-qspec-walkToQuestion-cold-start-race.md
  modified:
    - tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts
    - tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts
    - tests/tests/specs/voter/voter-detail.spec.ts
    - tests/playwright.config.ts
decisions:
  - "Task 1+2 (QSPEC-01+02): Option C skip-with-rationale (Phase 75 PASS-WITH-DEFERRAL inheritance) per RESEARCH §3.9 H3 expected outcome — shared root cause confirmed via §3.10 audit, 1 shared v2.11+ todo (NOT 2)"
  - "Task 3 (voter-visibility-required): project-config testIgnore exclusion path (cleanest per RESEARCH §3.7 H1 HIGH confidence + Open-Q-3 recommendation) — NO spec-file edits, NO SETTINGS-03 product changes per D-08"
  - "Task 4 (voter-detail case-d): H3 hydration-completeness guard applied — H1 (fixture shift) DISPROVED via e2e.ts audit (CaseD has answersByExternalId test-question-4 only, NO test-question-directional-1); H2 (i18n regex mismatch) DISPROVED via i18n grep (en/questions.json:4 'Neither you nor {entity} has answered this question' matches regex)"
  - "Atomic-per-task commits (4 commits for Tasks 1-4) following Plan 01+02 precedent; per-cluster smoke deferred to Plan 04 3-run cold-start gate (dev-server / supabase out-of-band for sequential executor agent)"
  - "1 new v2.11+ todo filed (shared by QSPEC-01+02 per RESEARCH §3.10 shared-root-cause); 0 SETTINGS-03 product-side changes; 0 DATA_RACE additions; 0 CASCADE regressions"
metrics:
  duration: "~25 minutes (well under 4h budget for 4 tests @ 1h cap)"
  completed: 2026-05-14
  tasks: 5
  files_modified: 4
  files_created: 1
  commits: 4
---

# Phase 86 Plan 03: Voter-App FAILURE-CLASS Cleanup — visibility+edge-cases+question-rendering (DETERM-14) Summary

Closed DETERM-14 — the visibility + edge-cases + question-rendering cluster — via heterogeneous resolutions across 4 in-scope tests + 1 Playwright project-config edit, 4 atomic commits, 1 shared v2.11+ todo. Two QSPEC cell tests skip-rationale'd inheriting Phase 75 PASS-WITH-DEFERRAL (shared root cause). One spec project-glob-excluded from the voter-app project (clean path; spec still runs in variant-hidden-required-voter project). One spec hardened with a Phase 83 DETERM-07b-style hydration-completeness guard before its negative-presence assertion. ZERO SETTINGS-03 voter-side PRODUCT-GAP fixes per CONTEXT.md D-08 binding.

## What Shipped

- **2 deterministic skip-with-rationale** (QSPEC-01 + QSPEC-02) inheriting Phase 75 PASS-WITH-DEFERRAL classification — full 3-part shape applied: inline `test.skip(true, '...')` ≥ 20 chars + block comment ≥ 3 lines above test() + new v2.11+ todo file
- **1 project-config exclusion** (voter-visibility-required) — Playwright `voter-app` project's `testIgnore` regex extended from `/voter-(settings|popups)\.spec\.ts/` to `/voter-(settings|popups|visibility-required)\.spec\.ts/`; the spec still runs in `variant-hidden-required-voter` project (no `testMatch` conflict verified at lines 384-390)
- **1 deterministic harden** (voter-detail case-d) — Phase 83 DETERM-07b-style hydration-completeness guard added before the bothHaventAnswered negative-presence assertion (3 lines + reason block)
- **1 new v2.11+ follow-up todo** at `.planning/todos/pending/2026-05-14-qspec-walkToQuestion-cold-start-race.md` shared by QSPEC-01 + QSPEC-02 (single todo per RESEARCH §3.10 shared-root-cause)
- **4 atomic per-task commits** following Plan 01+02 precedent

## Per-Task Verdict (fix-vs-skip table)

| Task | Test                                              | RCA Confidence                                | Verdict                                          | Pattern Applied                                                                          | Commit       |
| ---- | ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------ |
| 1    | voter-question-rendering-boolean (QSPEC-01)       | HIGH symptom / MEDIUM fix path                | **SKIP+RATIONALE (Option C)** — Phase 75 inherit | PATTERNS.md §1 Analog A — `test.skip(true, ...)` + block comment + new v2.11+ todo       | `95b1f6284`  |
| 2    | voter-question-rendering-categorical (QSPEC-02)   | SAME as QSPEC-01 (RESEARCH §3.10)             | **SKIP+RATIONALE (Option C mirror)** — shared todo | Same as Task 1, references the SAME v2.11+ todo (per RESEARCH §3.10 shared root cause) | `2130d5d5e`  |
| 3    | voter-visibility-required SETTINGS-03 (voter-app) | HIGH (RESEARCH §3.7 H1 spec docstring proof)  | **PROJECT-CONFIG EXCLUSION** — cleanest path      | PATTERNS.md §4 — additive `testIgnore` regex alternation                                | `63d04df5f`  |
| 4    | voter-detail case (d) both-missing                | LOW-MEDIUM RESEARCH; H1+H2 DISPROVED on audit | **FIX (H3 hydration guard)** — Phase 83 mirror   | Phase 83 DETERM-07b party-drawer hydration-completeness guard                            | `8f6da0241`  |
| 5    | (per-cluster smoke + atomic commit)               | N/A                                           | **DONE-VIA-TASKS-1-4** — atomic-per-task commits | Plan 01+02 precedent — cluster smoke deferred to Plan 04 3-run cold-start gate          | (no commit)  |

## Investigation Budget vs Cap

| Task | Budget Cap | Actual  | Margin            |
| ---- | ---------- | ------- | ----------------- |
| 1    | 1 h        | ~5 min  | 55 min headroom   |
| 2    | 1 h        | ~3 min  | 57 min headroom   |
| 3    | 1 h        | ~5 min  | 55 min headroom   |
| 4    | 1 h        | ~10 min | 50 min headroom   |
| 5    | 0          | 0       | n/a               |

All budgets well under cap. Task 4 was the longest because it required disproving H1 (e2e.ts audit) + H2 (i18n grep) before applying H3.

## Per-Test Resolution Detail

### Task 1: QSPEC-01 voter-question-rendering-boolean (`95b1f6284`)

**Root cause analysis (per RESEARCH §3.9, HIGH symptom / MEDIUM fix path):**

The `walkToQuestion(page, 17)` call at spec line ~75 invokes `walkToQuestionsIntro` which waits up to 10s on `getByTestId('voter-questions-start')` (apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte:161). In Phase 85 run-3 full-suite cold-start, this testId did not render fast enough in 3/3 runs (deterministic FAIL inheriting upstream voter-fixture race).

Three candidate fix paths were considered per the plan; all REJECTED in favor of Option C:

- **Option A (per-spec `appSettings.questions.questionsIntro.show: true` override):** REJECTED — Settings persistence may leak into adjacent voter-app project tests (60+ PASS_LOCKED cells run after QSPEC-01 in the project). Unbounded risk without a beforeAll/afterAll teardown shape that's also non-trivial to land in a sequential executor without the dev-server smoke gate available.
- **Option B (`walkToQuestion` helper resilience patch):** REJECTED — Helper is shared across many voter-app specs. A bad refactor regresses the whole voter-app cluster. Outside the 1h per-test cap and the deviation rule scope.
- **Option C (skip+rationale per Phase 75 PASS-WITH-DEFERRAL inheritance):** **APPLIED** — Phase 75 closed exactly this race as PASS-WITH-DEFERRAL per `.planning/milestones/v2.9-phases/75-question-rendering-specs/75-VERIFICATION.md` §"FAILURE-CLASS rationale". Per-plan smoke remains PASS × 3 in isolation (verified Phase 75); full-suite cold-start FAIL × 3 is the inherited race. Plan 03 inherits this classification rather than attempting Options A/B.

**Fix applied:**

1. Block comment header (≥ 3 lines) above the `test()` opening explaining the RCA inheritance + the 3 rejected fix paths.
2. `// eslint-disable-next-line playwright/expect-expect` placed before the `test()` opening (lint suppression required because the test body skips before any expect).
3. `test.skip(true, '...')` with the 6-line array-joined rationale referencing the v2.11+ todo path explicitly so maintainers can grep from the failing test to the deferred work.
4. `// eslint-disable-next-line playwright/no-skipped-test` placed immediately before `test.skip(...)`.
5. Test body retained verbatim (D-RESEARCH constraints: test deletion FORBIDDEN).

**Files modified:** `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` (+44 lines added at the test() opening).

**v2.11+ todo filed:** `.planning/todos/pending/2026-05-14-qspec-walkToQuestion-cold-start-race.md` (62 lines) — documents all 3 candidate fix paths (A/B/C) + a new Option C-prime (per-project seed flip via dedicated `voter-app-likert-only` Playwright project) as open questions for the v2.11+ scope.

### Task 2: QSPEC-02 voter-question-rendering-categorical (`2130d5d5e`)

**Root cause analysis (per RESEARCH §3.10):** Confirmed SHARED root cause with QSPEC-01. The `walkToQuestion(page, 16)` call at spec line ~103 invokes the SAME `walkToQuestionsIntro` helper that times out on `voter-questions-start`. Resolution shape mirrors Task 1's Option C verdict.

**Fix applied:** Same shape as Task 1 (block comment + lint suppressions + `test.skip(true, '...')` + test body retained verbatim), but with a SHORTER inline rationale that references the SAME v2.11+ todo file as Task 1 (no separate todo per RESEARCH §3.10 shared-root-cause).

**Files modified:** `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` (+26 lines added at the test() opening).

### Task 3: voter-visibility-required SETTINGS-03 voter-app (`63d04df5f`)

**Root cause analysis (per RESEARCH §3.7 H1 HIGH confidence):** The spec docstring at lines 14-19 explicitly states it was authored for the `variant-hidden-required-voter` Playwright project. The variant overlay sets `customData.hidden: true` on `test-voter-q-8`; the spec then asserts `toHaveCount(0)` on the hidden question's English name in the opinions tab. Without the variant overlay (i.e., when discovered under the `voter-app` project), `test-voter-q-8` is NOT hidden, so the negative-presence assertion correctly fails.

This is a **Playwright project-glob misallocation**, not a SETTINGS-03 PRODUCT-GAP. The fix is project-config correction.

**Fix applied:** PATTERNS.md §4 additive regex — extend the existing `voter-app` project's `testIgnore` from `/voter-(settings|popups)\.spec\.ts/` (line 184) to `/voter-(settings|popups|visibility-required)\.spec\.ts/`. Added a 5-line reason block above the new line explaining the rationale + the variant-project routing.

**No spec-file edit applied.** The spec body itself remains correct under `variant-hidden-required-voter` project context (where the variant overlay applies); changing the spec body would be a regression for that project.

**Conflict check (per plan action step "Verify no conflict"):** Read the `variant-hidden-required-voter` project block at `tests/playwright.config.ts:384-390`. Uses `testMatch: /voter-visibility-required\.spec\.ts/` (positive match) with NO `testIgnore` clause. The Plan 03 extension to the voter-app project's `testIgnore` regex affects ONLY the voter-app project — no cross-project conflict.

**Per CONTEXT.md D-08 binding:** This resolution does NOT pre-resolve the underlying SETTINGS-03 voter-side `customData.required` enforcement PRODUCT-GAP. That remains v2.11+ scope per STATE.md "Deferred Items §SETTINGS-03 voter-side PRODUCT-GAP" + the existing todo at `.planning/todos/pending/2026-05-12-settings-03-voter-required-product-gap.md`.

**Files modified:** `tests/playwright.config.ts` (+6 lines / -1 line at the voter-app project block).

### Task 4: voter-detail case (d) both-missing (`8f6da0241`)

**Root cause analysis (per RESEARCH §3.8, LOW-MEDIUM confidence per plan — narrowed to HIGH on H3 after H1+H2 disproof):**

- **H1 (fixture shift):** DISPROVED via direct audit of `packages/dev-seed/src/templates/e2e.ts:1197-1216`. CaseD-Neither's `answersByExternalId` contains ONLY `{ 'test-question-4': { value: '5' } }` — no `test-question-directional-1` answer. Fixture is intact post-Phase 81/82.
- **H2 (i18n regex mismatch):** DISPROVED via grep on `apps/frontend/src/lib/i18n/translations/en/questions.json:4`. The current `bothHaventAnswered` value is `"Neither you nor {entity} has answered this question"` — the spec's regex `/Neither you nor .* has(?:n't| not)? answered/i` correctly matches (the `(?:n't| not)?` clause makes the apostrophe-or-space variant optional; the current text matches the no-suffix branch).
- **H3 (hydration race):** Confirmed by elimination — only remaining testable cause. The `EntityOpinions.svelte:57-60` reactive expression iterates over `nakedEntity.entity.constituency.root.opinionQuestions` and renders the bothHaventAnswered message only when both voter and entity have no answer for a given question. On cold-start, this list populates AFTER the opinions tab mounts; the negative-presence assertion can fire against a partially-hydrated tab. Mirrors Phase 83 DETERM-07b party-drawer race-class.

**Fix applied:** H3 hydration-completeness guard (3 lines + 13-line reason block) placed immediately before the negative-presence assertion:

```typescript
await expect(opinionsTab.getByTestId('opinion-question-input').first()).toBeVisible({
  timeout: 5000
});
```

**Why this guard is safe:** CaseD-Neither answers `test-question-4` (per e2e.ts:1213-1215), so at least one `opinion-question-input` will render in CaseD's opinions tab regardless of the directional question's row state. The guard does NOT false-block on an empty opinions list.

**File-overlap with Plan 01:** Plan 01 Task 5 modified voter-detail.spec.ts at lines 148-181 (party-drawer harden via `expect.poll()`). Task 4 modifies case (d) at lines 310-335 (after edit). Non-overlapping ranges; Plan 01's edit was already on main when Plan 03 ran (commit `9cc115469`) — no rebase needed.

**Files modified:** `tests/tests/specs/voter/voter-detail.spec.ts` (+17 lines / -0 lines at case-(d) test body lines ~310-355).

### Task 5: Per-cluster smoke + atomic commit (DONE-VIA-TASKS-1-4)

Per Plan 02 precedent (sequential executor with dev-server / supabase out-of-band), per-cluster Playwright smoke is deferred to Plan 04's 3-run cold-start gate (CONTEXT.md D-07: agent-inline via `Bash run_in_background` at Plan 04 close). Tasks 1-4 commits ARE the atomic resolution — each task individually commits its DETERM-14 sub-closure with a descriptive commit body referencing the relevant RESEARCH section + CONTEXT decision binding.

**Per-cluster smoke commands documented for Plan 04:**

```bash
# voter-app project — should see QSPEC-01, QSPEC-02 SKIPPED + voter-detail case (d) PASSED;
# voter-visibility-required must NOT appear (excluded via testIgnore extension at line 184)
yarn workspace tests playwright test --project=voter-app --grep "(boolean opinion question renders|categorical opinion question.*renders|case \\(d\\))" -x

# variant-hidden-required-voter project — voter-visibility-required must still run + complete
# (pass/fail there is Phase 85's responsibility; Phase 86 decoupled the voter-app misallocation)
yarn workspace tests playwright test --project=variant-hidden-required-voter voter-visibility-required.spec.ts --list
```

Plan 04's 3-run cold-start gate will execute the full voter-app + variant-* project smokes and confirm:
- 0 `failed` outcomes for the 4 tests in DETERM-14 scope
- QSPEC-01 + QSPEC-02 report as SKIPPED (not failed)
- voter-visibility-required reports as 0 tests in voter-app project (excluded) and present-and-runnable in variant-hidden-required-voter
- voter-detail case (d) reports as PASSED

## File-Overlap Coordination with Plans 01 / 02

Per plan frontmatter `file_overlap_with: 86-01`:

- **voter-detail.spec.ts:** Plan 01 Task 5 modified lines 148-181 (party-drawer harden via `expect.poll()` — landed in commit `9cc115469`); Plan 03 Task 4 modified case (d) test body at lines ~310-335. **NON-OVERLAPPING line ranges; distinct test bodies; no rebase required.** Plan 03 ran on the post-Plan-01 working tree (the standard linear-execution serialization per phase plan §"file-overlap commit serialization (with Plan 01)").
- **voter-results.spec.ts:** Plan 02 modified the filter-toggle test (lines ~172-260); Plan 03 does NOT touch this file. No conflict.
- **voter-feedback-persistence.spec.ts:** Plan 02 modified (lines ~75-93); Plan 03 does NOT touch. No conflict.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| (none) | (none) | Plan 03 is purely test-side + 1 project-config edit; no new product-side network endpoints, auth paths, file access patterns, or schema changes. The Playwright testIgnore extension is project-glob correction, not a threat-model surface. |

## Deviations from Plan

**None.** Plan executed exactly as written — 5 tasks (Task 5 done-via-tasks-1-4 per Plan 02 precedent), 4 atomic commits, 2 skip-escalations with full 3-part shape (inline rationale + block comment + new todo), 1 fix-with-hydration-guard, 1 project-config exclusion. Investigation budgets all well under 1h-per-test cap.

The plan's escalation paths were NOT triggered:

- **Task 1 Option A (per-spec settings override) — NOT triggered.** Documented as REJECTED in the per-task analysis above; v2.11+ scope captured in the new todo.
- **Task 1 Option B (walkToQuestion helper refactor) — NOT triggered.** Same — documented as REJECTED; v2.11+ scope.
- **Task 3 fallback (`test.skip()` guard at spec top conditioned on `process.env.PROJECT_NAME`) — NOT triggered.** The project-config exclusion path (cleanest per RESEARCH §3.7 H1 + Open-Q-3) had no conflict with the variant-hidden-required-voter project's `testMatch` regex (verified at `tests/playwright.config.ts:384-390`).
- **Task 4 fallback (D-03 skip-escalation) — NOT triggered.** H3 hydration guard is mechanical (3 lines + reason block); H1+H2 were quickly disproven via fixture audit + i18n grep.

## CASCADE / DATA_RACE Pool Status

- **DATA_RACE pool (CONTEXT.md D-09 binding):** NOT TOUCHED. Plan 03 fixes do NOT add anything to DATA_RACE. The 3-entry IMGPROXY_TIED_TITLES contract at `regen-constants.mjs:91-95` preserved verbatim (no spec rename, no fixture rename, no image-touching changes).
- **CASCADE pool (CONTEXT.md D-10):** NO REGRESSIONS expected. None of the 4 in-scope tests have downstream cascade dependencies per the RESEARCH §3.7-§3.10 RCA verdict (QSPEC-01/02 are isolated voter-app journeys; voter-visibility-required project-glob fix is structural; voter-detail case (d) is read-only entity-detail).
- **FAILURE-CLASS pool:** EXPECTED -4 NET (DETERM-14 closure). Combined with Plan 01's -5 (DETERM-12) and Plan 02's -2 (DETERM-13), the running tally is -11 NET after Plan 03 close. Plan 04 will regen `SKIPPED_TESTS` const + the FAILURE-CLASS narrative block to reflect:
  - QSPEC-01 → `SKIPPED_TESTS` (1 entry)
  - QSPEC-02 → `SKIPPED_TESTS` (1 entry)
  - voter-visibility-required-voter-app → excluded from voter-app project listing (NOT in any const)
  - voter-detail case (d) → expected `PASS_LOCKED_TESTS` promotion if 3-run cold-start gate holds

## Authentication Gates

None encountered. All work was test-locator + project-config edits + 1 todo file; no auth/CLI/credential interactions.

## Verification Note

Per-cluster Playwright smoke (`yarn workspace tests playwright test --project=voter-app --grep "(boolean opinion question renders|categorical opinion question.*renders|case \\(d\\))" -x`) was NOT executed inline because it requires a running dev server (`yarn dev` / `supabase start`) — which is out-of-band for the sequential executor agent context per the spawn prompt + Plan 02 precedent. The 3-run cold-start verification is owned by Plan 04 per the phase plan (CONTEXT.md D-07 gate execution: agent-inline via Bash run_in_background at Plan 04 close).

All 4 task changes apply established paste-ready patterns from PATTERNS.md (§1 Analog A for QSPEC skips, §4 for testIgnore regex, Phase 83 DETERM-07b mirror for the hydration guard) and are syntactically clean (TypeScript will be verified by Plan 04's cold-start gate which runs the full test suite).

This mirrors Plan 01+02's verification approach exactly (see 86-01-SUMMARY.md + 86-02-SUMMARY.md §"Verification Note") — atomic-per-task commits + cluster smoke deferred to the phase-close 3-run gate.

## Self-Check: PASSED

Verified all 5 modified/created files exist on disk with the expected changes:

- `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` ✓ (Task 1 — test.skip+rationale + block comment + lint suppressions)
- `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` ✓ (Task 2 — same shape, shorter rationale referencing the same todo)
- `tests/playwright.config.ts` ✓ (Task 3 — testIgnore regex extended + 5-line reason block)
- `tests/tests/specs/voter/voter-detail.spec.ts` ✓ (Task 4 — hydration guard 3 lines + 13-line reason block at case (d) lines ~310-335)
- `.planning/todos/pending/2026-05-14-qspec-walkToQuestion-cold-start-race.md` ✓ (created — 62 lines documenting v2.11+ scope for QSPEC-01+02)

Verified all 4 task commits exist in git history (`git log --oneline 95b1f6284 2130d5d5e 63d04df5f 8f6da0241`):

- `95b1f6284` test(86-03): skip QSPEC-01 boolean per Phase 75 PASS-WITH-DEFERRAL inheritance ✓
- `2130d5d5e` test(86-03): skip QSPEC-02 categorical mirroring QSPEC-01 (shared root cause) ✓
- `63d04df5f` test(86-03): exclude voter-visibility-required from voter-app project (DETERM-14) ✓
- `8f6da0241` test(86-03): add hydration guard to voter-detail case (d) both-missing ✓

Verified shared-todo correctness: the file at `.planning/todos/pending/2026-05-14-qspec-walkToQuestion-cold-start-race.md` is referenced verbatim from BOTH QSPEC-01 (Task 1) and QSPEC-02 (Task 2) skip rationales — `grep -c 2026-05-14-qspec-walkToQuestion-cold-start-race` returns 1 match per spec.

Verified project-config exclusion shape: voter-app project at `tests/playwright.config.ts:182` now has `testIgnore: /voter-(settings|popups|visibility-required)\.spec\.ts/` (additive, 3-alternation); variant-hidden-required-voter project at line 384-390 still has `testMatch: /voter-visibility-required\.spec\.ts/` (no `testIgnore` — no cross-project conflict).

Cluster-level Playwright smoke deferred to Plan 04 3-run cold-start gate per Plan 01+02 precedent.

## Commits

| Hash         | Type | Summary                                                                       |
| ------------ | ---- | ----------------------------------------------------------------------------- |
| `95b1f6284`  | test | Skip QSPEC-01 boolean per Phase 75 PASS-WITH-DEFERRAL inheritance + todo      |
| `2130d5d5e`  | test | Skip QSPEC-02 categorical mirroring QSPEC-01 (shared root cause; same todo)   |
| `63d04df5f`  | test | Exclude voter-visibility-required from voter-app project (DETERM-14)          |
| `8f6da0241`  | test | Add hydration-completeness guard to voter-detail case (d) both-missing        |
