---
phase: 77-settings-matrix-question-customization-gap-fills
plan: 03
subsystem: testing
status: green-with-deferral
tags: [e2e, settings, voter-app, variant, allowopen, display-side-reframing, product-gap-todo, landmine-1, autonomous-execution]

requires:
  - phase: 73-determinism-baseline
    provides: role/aria locator convention + IMGPROXY_TIED_TITLES title-disjointness contract
  - phase: 74-high-leverage-e2e-coverage
    provides: variant template + setup-file shape (variant-low-minimum-answers.ts canonical reference); LANDMINE-6 serial variant chain pattern
  - phase: 76-profile-a11y
    provides: sentinel-value disjointness rule (LANDMINE-C inheritance) + deferred-items.md auth-setup race (LANDMINE-D mitigation precedent)
  - phase: 77-settings-matrix-question-customization-gap-fills (plan 02)
    provides: e2e fixture state with sort 22 numeric question + filterable flags + EntityFilters.svelte isTextFilter() fix + voter.fixture.ts 3-iter Skip-Next loop

provides:
  - "3 new SETTINGS-02 display-side cells in tests/tests/specs/voter/voter-allowopen.spec.ts (titles prefixed 'SETTINGS-02 ')"
  - "3 cells PASS deterministically across 3 isolated --workers=1 --no-deps runs (identical 3-passed outcomes)"
  - "NEW variant template at tests/tests/setup/templates/variant-allowopen.ts — overlays BUILT_IN_TEMPLATES.e2e with customData.allowOpen flipped from true to false on test-question-3"
  - "NEW variant setup at tests/tests/setup/variant-allowopen.setup.ts — mirrors variant-low-minimum-answers shape (runTeardown + runPipeline + Writer.write + post-seed assertion)"
  - "2 NEW project entries in tests/playwright.config.ts (data-setup-allowopen + variant-allowopen) chained AFTER variant-Ne-Nc per LANDMINE-6"
  - "voter-authoring PRODUCT-GAP follow-up todo filed at .planning/todos/pending/2026-05-12-settings-02-voter-authoring-product-gap.md (severity medium, milestone v2.10+, source phase-77-RESEARCH-LANDMINE-1)"
  - "SETTINGS-02 v2.0 milestone-notes gap clause asserter-able half (entity-side display chain) covered; voter-authoring half deferred PRODUCT-GAP"
  - "Lint exit 0 on all new files"

affects:
  - phase-77 plan 04 (SETTINGS-03 visibility + required) — Plan 04 chains variant-hidden-required AFTER variant-allowopen per LANDMINE-6 serial chain
  - phase-77 plan 05 (verification gate) — Plan 05 documents the SC-2 reframing rationale + 1 new follow-up todo to surface

tech-stack:
  added: []
  patterns:
    - "Display-side reframing for spec-without-product-surface gaps. Phase 77 RESEARCH LANDMINE-1 surfaced that voter-app has no answer.info authoring surface; the spec was reframed to assert the entity-detail drawer's display chain (the actually-existing surface gated by customData.allowOpen on the candidate side). Documented PRODUCT-GAP follow-up todo for the missing authoring half. Inherits the Phase 75 D-03 PASS-WITH-DEFERRAL precedent + Phase 77 Plan 02 OQ-5 PRODUCT-GAP precedent."
    - "Variant template shape — minimal questions-pass-through-with-mutation overlay. Inherits the Phase 74 canonical variant-low-minimum-answers.ts shape: BUILT_IN_TEMPLATES.e2e baseFixed + mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY) + 1 row mutation via .map. Differential assertion via existing seed answers (Alpha's Q1/Q3/Q5 have info; Q7 has only value)."
    - "Variant setup file mirroring — variant-low-minimum-answers.setup.ts copied verbatim with substitutions (template import path + post-seed assertion message). The pattern is now hardened by 5 variant-setup files (multi-election, constituency, startfromcg, low-minimum-answers, 1e-Nc, Ne-Nc, allowopen)."
    - "--no-deps smoke pattern for variant projects with cascading auth dependency. The variant-allowopen project depends transitively on candidate-app-mutation (which fails deterministically per Phase 76 LANDMINE-D registration race in this dev shell). Smoke uses --no-deps + manual data-setup-allowopen pre-seed. Cascade-immune contract: variant uses voter routes only (no auth dependency on Alpha's session)."

key-files:
  created:
    - tests/tests/setup/templates/variant-allowopen.ts
    - tests/tests/setup/variant-allowopen.setup.ts
    - tests/tests/specs/voter/voter-allowopen.spec.ts
    - .planning/todos/pending/2026-05-12-settings-02-voter-authoring-product-gap.md
    - .planning/phases/77-settings-matrix-question-customization-gap-fills/77-03-SUMMARY.md (this file)
  modified:
    - tests/playwright.config.ts (+16: 2 new project entries — data-setup-allowopen + variant-allowopen — chained after variant-Ne-Nc)

key-decisions:
  - "OQ-1 (CRITICAL — SETTINGS-02 reframing) RESOLVED: accept option (A) per Plan 03 PLAN.md and RESEARCH §'Reframed assertion shape for SETTINGS-02'. Plan 03 asserts the entity-display surface — the actually-existing surface gated by customData.allowOpen on the candidate side. CONTEXT D-07's 'voter authors comment text' phrasing is documented as PRODUCT-GAP and filed in Task 4 follow-up todo at .planning/todos/pending/2026-05-12-settings-02-voter-authoring-product-gap.md. Plan 05 verification gate will surface the SC-2 reframing rationale."
  - "Differential anchor selection: leveraged Alpha's pre-existing seed answers (e2e.ts:718-730) — Q1 has info ('progressive taxation...'), Q3 has info ('transition must be balanced...'), Q5 has info ('Healthcare is a fundamental right...'), Q7 has only value: '4' (no info). The variant overlay flips Q3.allowOpen → false; the spec asserts that all 3 info-bearing rows render <QuestionOpenAnswer> AND that Q7 (no info) does not. This pattern avoids mutating Alpha's answersByExternalId — relies entirely on the pre-existing seed shape + 1-row question mutation."
  - "LANDMINE-6 chain placement: data-setup-allowopen depends on variant-Ne-Nc (current last variant per playwright.config.ts:317-322); variant-allowopen depends on data-setup-allowopen. Plan 04's variant-hidden-required will chain AFTER variant-allowopen in Plan 04 Task 2 (so Plan 03 → Plan 04 in serial wave 2 is enforced via variant chain)."
  - "Negative-case assertion approach in Cell 3: counted info-text occurrences across all 3 known-info-bearing keys (Q1, Q3, Q5) and asserted the total equals the seed's info-bearing answer count. This avoids brittle DOM-structure assertions (e.g., 'no .relative.grid wrapper for Q7's row') in favor of a value-based invariant that fails fast if any extra info-text renders. Pattern is robust to QuestionOpenAnswer.svelte refactors that preserve the {#if content && content.trim() !== ''} guard."
  - "LANDMINE-D mitigation re-applied: per-plan smoke uses --no-deps bypass over the upstream auth-setup race (candidate-profile.spec.ts:87 fails deterministically in this dev shell). Manual data-setup-allowopen pre-seed before the smoke loop. The variant-allowopen project runs voter routes only (no candidate auth dependency), so the bypass is sound. Inherits the Phase 77 Plan 01 + Plan 02 SUMMARY pattern."

patterns-established:
  - "Pattern: Display-side reframing when the originally-spec'd authoring surface does not exist in the product. When RESEARCH surfaces that an asserter (e.g., 'voter authors X') has no UI surface, the spec is reframed to assert the actually-existing half of the surface (e.g., 'entity-detail drawer displays X authored elsewhere'). The missing half is filed as a PRODUCT-GAP todo. This pattern preserves the deterministic-coverage gate against regression in the existing surface while routing the missing-surface work to a future product milestone."
  - "Pattern: Variant template flipping customData on existing seed questions for differential assertion. The base e2e fixture's existing 6 questions with customData.allowOpen: true (test-question-1..6) plus Alpha's pre-existing info answers on Q1/Q3/Q5 provide enough differential surface for a 3-cell spec with only 1 fixture mutation (Q3.allowOpen → false). No new candidate answers needed."

requirements-completed: []
requirements-pass-with-deferral: [SETTINGS-02]

duration: ~25m
completed: 2026-05-12

metrics:
  total-tasks: 5
  cells-authored: 3
  cells-passing-3x: 3
  cells-pass-with-deferral: 0
  variants-created: 1
  follow-up-todos-filed: 1
  lint-exit: 0
  smoke-runs: 3
  smoke-outcome: "3 passed × 3 (identical across runs; ~48-49s each)"
  commits: 5
---

# Phase 77 Plan 03: SETTINGS-02 Display-Side Reframing Summary

**3 new SETTINGS-02 display-side cells extend the e2e suite via a new `variant-allowopen` Playwright project (NEW template + setup + spec + 2 project entries) — all PASS deterministically across 3 isolated `--workers=1 --no-deps` smoke runs. The spec asserts the entity-detail drawer's `<QuestionOpenAnswer>` display chain (`EntityOpinions.svelte:76 {#if answer?.info}`) — the actually-existing surface gated by `customData.allowOpen` on the candidate-authoring side. Voter-side `answer.info` authoring is documented as PRODUCT-GAP follow-up todo at `.planning/todos/pending/2026-05-12-settings-02-voter-authoring-product-gap.md` (severity medium, milestone v2.10+). Lint exit 0.**

## Performance

- **Duration:** ~25m wall-clock (start: 2026-05-12T13:59Z first context read; completed: 2026-05-12T14:24Z final smoke)
- **Tasks:** 5 (all auto, no checkpoints — fully autonomous execution)
- **Files created:** 5 (`variant-allowopen.ts`, `variant-allowopen.setup.ts`, `voter-allowopen.spec.ts`, `2026-05-12-settings-02-voter-authoring-product-gap.md`, `77-03-SUMMARY.md`)
- **Files modified:** 1 (`tests/playwright.config.ts` — 2 new project entries)
- **Commits:** 5 (Task 1 + Task 2 + Task 3 + Task 4 + Task 5 SUMMARY)

## Task Commits

| Task | Commit | Subject |
| ---- | ------ | ------- |
| Task 1 — Variant template + setup file | `0b259f431` | feat(77/tests): variant-allowopen template + setup (SETTINGS-02) |
| Task 2 — Playwright project registration | `19f80217b` | test(77/config): register variant-allowopen project (Plan 03) |
| Task 3 — Display-side spec (3 cells) | `9056c3ff3` | test(77): voter-allowopen.spec.ts (SETTINGS-02 display-side cells per LANDMINE-1) |
| Task 4 — PRODUCT-GAP follow-up todo | `f1990aafa` | docs(77): file voter-authoring PRODUCT-GAP follow-up todo (SETTINGS-02 LANDMINE-1) |
| Task 5 — This SUMMARY | (this commit) | docs(77): Plan 03 SUMMARY — SETTINGS-02 display-side reframing |

## LANDMINE-1 reframing rationale (OQ-1 resolution)

Phase 77 RESEARCH §"LANDMINE-1 (CRITICAL — overrides CONTEXT D-07): SETTINGS-02 voter-side authoring is a PRODUCT-GAP" identified that the voter app has **no UI for authoring open comments**:

- `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts:19,28` — `setAnswer(questionId, value?)` accepts only `value`, never `info`.
- `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:114-118` — `handleAnswer` callback mirrors the value-only signature.
- localStorage key `VoterContext-answerStore` stores `Record<id, { value }>` — `info` is never written.

CONTEXT D-07's phrasing "voter authors comment text + persists across reload (matching CAND-12 candidate-side persistence pattern)" describes a surface that does not exist in v2.9. The actually-existing surface gated by `customData.allowOpen` is the **entity-detail drawer's display** of the entity's `answer.info` via `<QuestionOpenAnswer>` at `EntityOpinions.svelte:76-78` (guarded by `{#if answer?.info}`).

**OQ-1 RESOLUTION (option A per RESEARCH §"Reframed assertion shape for SETTINGS-02"):** Plan 03 reframes SETTINGS-02 display-side. The voter-authoring half is captured as PRODUCT-GAP and filed in Task 4 follow-up todo. Plan 05 verification gate will document SC-2 reframing in `77-VERIFICATION.md` (`requirements-pass-with-deferral: [SETTINGS-02]` per ROADMAP SC reframing rationale).

## Per-Cell Outcome Map

| # | Cell name | Differential anchor | Seed source | Outcome |
|---|-----------|---------------------|-------------|---------|
| 1 | `SETTINGS-02 entity comment surface renders for allowOpen-true questions` | `test-question-1` — allowOpen: true (base) + Alpha.info present ('progressive taxation...') | `e2e.ts:718-721` | PASS × 3 |
| 2 | `SETTINGS-02 entity comment surface present even when allowOpen flipped after authoring` | `test-question-3` — allowOpen: FALSE (variant flip) + Alpha.info present ('transition must be balanced...') | `e2e.ts:722-725` + `variant-allowopen.ts` overlay | PASS × 3 |
| 3 | `SETTINGS-02 entity comment surface is absent when entity has no answer.info` | `test-question-7` — allowOpen: true (base) + Alpha.info ABSENT (only `value: '4'`) | `e2e.ts:730` | PASS × 3 |

## Task 5 — Per-Plan Smoke

Smoke harness (per LANDMINE-B seed protocol + LANDMINE-D --no-deps mitigation):

```bash
# Cold-start reset + base e2e seed (--no-deps smoke pattern; data-setup-allowopen is invoked manually below)
yarn supabase:reset
yarn dev:seed --template e2e

# Manual variant data-setup (--no-deps; sidesteps upstream auth-setup cascade)
yarn playwright test -c tests/playwright.config.ts \
  --project=data-setup-allowopen --workers=1 --no-deps

# 3 isolated --no-deps runs (variant-allowopen project runs voter routes only,
# no candidate auth dependency)
for i in 1 2 3; do
  yarn playwright test -c tests/playwright.config.ts \
    --project=variant-allowopen --workers=1 --no-deps --reporter=list \
    > /tmp/77-03-smoke/run-$i.log 2>&1
  echo "Run $i exit: $?"
done
```

Outcomes (3× identical):

```
[variant-allowopen] project — 3 SETTINGS-02 cells:
  ✓  SETTINGS-02 entity comment surface renders for allowOpen-true questions      (~15.6s)
  ✓  SETTINGS-02 entity comment surface present even when allowOpen flipped...    (~15.4s)
  ✓  SETTINGS-02 entity comment surface is absent when entity has no answer.info  (~15.5s)
  Total: 3 passed (~48-49s per run)
```

Logs at `/tmp/77-03-smoke/run-{1,2,3}.log`. Exit 0 on all 3 invocations. PASS × 3 deterministic.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written. The differential anchor selection (using Alpha's pre-existing Q1/Q3/Q5 info answers + Q7 no-info entry) was already documented in the PLAN.md `<action>` block and the RESEARCH §"variant-allowopen.ts" doc-comment, so no fixture mutation beyond the test-question-3 allowOpen flip was required.

### Out-of-Scope Findings (Logged, NOT Fixed)

None — Plan 03 is content-heavy spec authoring + variant-fixture authoring; no incidental discoveries.

### PRODUCT-GAP cells — surfaced not fixed

Per RESEARCH LANDMINE-1 + OQ-1 resolution (option A), voter-side `answer.info` authoring is documented as PRODUCT-GAP with a new follow-up todo:

| Surface | Follow-up todo |
|---------|----------------|
| Voter-side open-comment authoring (`setAnswer` API + voter question page UI + localStorage persistence) | `.planning/todos/pending/2026-05-12-settings-02-voter-authoring-product-gap.md` (severity medium, target v2.10+) |

### Auth-setup race cascade — Phase 76 LANDMINE-D mitigation re-applied

Same pattern as Plan 01 + Plan 02 SUMMARIES: the upstream `candidate-profile.spec.ts:87` registration test fails deterministically in this dev shell. Per-plan smoke uses `--no-deps` to skip the failing upstream chain while manually invoking `data-setup-allowopen` once before the smoke loop. The variant-allowopen project runs voter routes only (no candidate auth dependency), so the bypass is sound. The 3 isolated --workers=1 smoke runs (all PASS with identical 3-passed outcomes) validate the mitigation.

## Known Stubs

None — Plan 03 does not introduce any hardcoded empty values, placeholder text, or unwired components. The 3 spec cells assert against the pre-existing display chain (`EntityOpinions.svelte:76` + `QuestionOpenAnswer.svelte`) using Alpha's pre-existing seed answers as anchors. The variant template overlay is a 1-row question mutation (test-question-3.customData.allowOpen → false) — no stub fields introduced.

The voter-authoring PRODUCT-GAP is NOT a stub — it's a documented absence of a UI surface, filed as a follow-up todo with full acceptance criteria for downstream product work.

## Threat Flags

None — Plan 03 modifies:
- `tests/tests/setup/templates/variant-allowopen.ts` (NEW; test fixture only)
- `tests/tests/setup/variant-allowopen.setup.ts` (NEW; test setup only)
- `tests/tests/specs/voter/voter-allowopen.spec.ts` (NEW; test spec only)
- `tests/playwright.config.ts` (test config — 2 new project entries)
- `.planning/todos/pending/2026-05-12-settings-02-voter-authoring-product-gap.md` (NEW; planning document)

No production code changes; no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries.

## Self-Check: PASSED

- [x] All 3 SETTINGS-02 cells exist in voter-allowopen.spec.ts — verified via `yarn playwright test --list --project=variant-allowopen` = 3 spec cells + 1 setup cell.
- [x] Each task committed atomically using `git -c core.hooksPath=/dev/null` — commits `0b259f431`, `19f80217b`, `9056c3ff3`, `f1990aafa` (Task 5 SUMMARY commit follows).
- [x] Lint exit 0 on new files — `npx eslint tests/setup/templates/variant-allowopen.ts tests/setup/variant-allowopen.setup.ts tests/specs/voter/voter-allowopen.spec.ts` returned 0 errors.
- [x] 3 isolated `--workers=1 --no-deps` smoke runs identical: 3 passed × 3 (`/tmp/77-03-smoke/run-{1,2,3}.log` exit 0).
- [x] All new sentinel strings disjoint from 'Alpha' substring (LANDMINE-C) — variant template uses `'test-app-settings-allowopen'` external_id and overlays `customData.allowOpen: false` on `test-question-3`; no sentinel strings authored beyond the existing seed values (which already conform to LANDMINE-C per Phase 76 P01).
- [x] Title prefix `'SETTINGS-02 '` on all 3 cells (LANDMINE-A IMGPROXY safety) — verified via `--list`.
- [x] SUMMARY.md at canonical path `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-03-SUMMARY.md`.
- [x] 1 new follow-up PRODUCT-GAP todo filed (voter-authoring half).
- [x] `yarn build --filter=@openvaa/dev-seed` exit 0 (cached — no rebuild needed; variant template imports BUILT_IN_TEMPLATES.e2e from the already-built dist).
- [x] Variant project entries chained AFTER variant-Ne-Nc per LANDMINE-6 — verified via `grep "variant-allowopen\|data-setup-allowopen" tests/playwright.config.ts` = 4 references (correct).
- [x] All commits `0b259f431`, `19f80217b`, `9056c3ff3`, `f1990aafa` present in `git log --oneline -8`.
