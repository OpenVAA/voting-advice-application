---
title: "SETTINGS-02 voter-side answer.info authoring PRODUCT-GAP"
severity: medium
milestone-candidate: v2.10+
status: pending
source: phase-77-RESEARCH-LANDMINE-1
created: 2026-05-12
phase-context: 77-settings-matrix-question-customization-gap-fills/Plan-03
related-phases: [77]
related-requirements: [SETTINGS-02]
tags: [voter-app, answer-info, product-gap, open-comments, customData.allowOpen]
---

# SETTINGS-02 voter-side `answer.info` authoring PRODUCT-GAP

**Source:** Phase 77 RESEARCH LANDMINE-1 (`.planning/phases/77-settings-matrix-question-customization-gap-fills/77-RESEARCH.md` §"LANDMINE-1 (CRITICAL — overrides CONTEXT D-07): SETTINGS-02 voter-side authoring is a PRODUCT-GAP" + §"SETTINGS-02 Persistence Path").
**Spec contract this captures:** v2.0 milestone-notes gap clause — "voter can author comment text + persists across reload" for questions with `customData.allowOpen: true`.

## Problem

The voter app today has **no UI for authoring open comments** alongside opinion-question answers. The `customData.allowOpen` field on a question only gates the **candidate-side** comment input
(`apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:294`).
On the voter side:

1. The voter `answerStore.setAnswer(questionId, value)` API accepts **only `value`**, never `info`. `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts:19,28` — the signature is `function setAnswer(questionId: string, value?: Answer['value']): void` and the update path at line 28 writes `updated[questionId] = { value }` (no `info` field).
2. The voter questions page `handleAnswer` callback at `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:114-118` mirrors that: `function handleAnswer({ question, value }: { question: AnyQuestionVariant; value?: unknown }): void { answers.setAnswer(question.id, value); }` — also `value`-only.
3. The localStorage key `VoterContext-answerStore` stores the `Answers` shape (`Record<id, { value }>`); the `info` field is never written.

Consequence: a voter cannot annotate their answers with explanatory open text, even on questions where the platform configuration enables it for candidates. Phase 77 SETTINGS-02 was therefore **reframed display-side** in Plan 03 — the spec asserts the entity-detail drawer's display chain (`<QuestionOpenAnswer>` rendering inside the opinions tab, gated by `EntityOpinions.svelte:76 {#if answer?.info}`), which IS gated by `customData.allowOpen` on the candidate-authoring side.

The voter-authoring half of the v2.0 milestone-notes clause "voter can author comment text + persists across reload" cannot be implemented without adding the voter-side authoring surface.

## Evidence (file:line citations)

- `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts:19` — `setAnswer` signature accepts only `value`, never `info`.
- `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts:28` — update path writes `updated[questionId] = { value }` (no `info` field).
- `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:114-118` — `handleAnswer` callback accepts only `value`.
- `packages/data/src/objects/questions/base/answer.type.ts` — `Answer.info?: string | null` field exists at the data layer (used by candidate-side authoring + entity-side display), unused by voter persistence.
- `apps/frontend/src/lib/components/questions/QuestionOpenAnswer.svelte:43-67` — the open-answer display component exists but is currently rendered ONLY in the entity-detail drawer (`apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte:76-78`) — not in the voter answer page.

## Acceptance Criteria (when this todo is picked up)

- [ ] Voter `answerStore.setAnswer(questionId, value, info?)` accepts an optional `info` parameter and persists it to `Answer.info`.
- [ ] The voter question page (`apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte`) renders an open-comment input (matching the candidate-app's `QuestionOpenAnswerInput` pattern at `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:289-310`) **only** when the question's `customData.allowOpen: true`.
- [ ] localStorage key `VoterContext-answerStore` round-trips `info` text across page reload (parity with the candidate-side CAND-12 persistence contract).
- [ ] New E2E cell (extending the Phase 77 P03 `voter-allowopen.spec.ts`) asserts:
  1. Voter visits a question with `allowOpen: true` → open-comment input visible.
  2. Voter types text → submits → text persists in `Answer.info`.
  3. Reload page → text still present.
  4. Voter visits a question with `allowOpen: false` → open-comment input NOT visible.
- [ ] No regression on Phase 77 P03's existing display-side cells (drawer renders entity's `answer.info` regardless of voter authoring).
- [ ] Documentation updated in `CLAUDE.md` and/or `.planning/REQUIREMENTS.md` SETTINGS-02 to reflect the full voter-authoring + display contract.

## Why now (NOT v2.9)

Per Phase 77 RESEARCH LANDMINE-1 + ROADMAP §"Phase 77 is content-heavy spec authoring + variant-fixture authoring on a stable suite — NOT new product behavior, NOT framework migration": adding the voter-side authoring surface is **feature-class work** that exceeds the coverage-phase guardrail. A dedicated voter-experience milestone in v2.10+ is the appropriate home. Phase 77 Plan 03's display-side reframing closes the asserter-able half of SETTINGS-02 today; this todo captures the remaining authoring half for downstream product work.

## Notes

- This todo is filed alongside Phase 77 Plan 03's `voter-allowopen.spec.ts` per the SETTINGS-02 reframing rationale in 77-VERIFICATION.md (Plan 05 will document SC-2 reframing).
- Implementation hint: the candidate-side authoring surface at `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:289-310` is the canonical reference — copy the `handleInfoChange` pattern + `QuestionOpenAnswerInput` wiring into the voter page.
- The reverse alternative (extend `customData.allowOpen` to ALSO gate voter display) is REJECTED per RESEARCH §"Reframed assertion shape for SETTINGS-02" option-(C) — out of v2.9 scope; would also break candidate-authored comment visibility for voters when admins toggle the flag.

## Source references

- `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-RESEARCH.md` §"LANDMINE-1" + §"SETTINGS-02 Persistence Path" + §"Reframed assertion shape for SETTINGS-02".
- `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-03-PLAN.md` Task 4.
- `.planning/REQUIREMENTS.md` §SETTINGS-02.
- `.planning/ROADMAP.md` Phase 77.

## Cross-Links

- `tests/tests/specs/voter/voter-allowopen.spec.ts` — Phase 77 P03 display-side spec; this todo is the authoring-side follow-up.
- `tests/tests/setup/templates/variant-allowopen.ts` — variant fixture for the display-side cells; future authoring-cell could reuse.
- `apps/frontend/src/lib/components/questions/QuestionOpenAnswer.svelte` — display component; voter-authoring needs the input variant (`QuestionOpenAnswerInput.svelte` per candidate-side pattern).
