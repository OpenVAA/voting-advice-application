---
title: "SETTINGS-03 voter-side required-info-question enforcement PRODUCT-GAP"
severity: medium
milestone-candidate: v2.10+
status: pending
source: phase-77-RESEARCH-LANDMINE-3
created: 2026-05-12
phase-context: 77-settings-matrix-question-customization-gap-fills/Plan-04
related-phases: [77]
related-requirements: [SETTINGS-03]
tags: [voter-app, required-info, product-gap, customData.required, profileComplete]
---

# SETTINGS-03 voter-side `customData.required` enforcement PRODUCT-GAP

**Source:** Phase 77 RESEARCH LANDMINE-3 (`.planning/phases/77-settings-matrix-question-customization-gap-fills/77-RESEARCH.md` §"LANDMINE-3 (CRITICAL — overrides CONTEXT D-08): Voter-side `customData.required` is a PRODUCT-GAP" + §"SETTINGS-03 Candidate-side vs. Voter-side Surface Audit").
**Spec contract this captures:** SETTINGS-03 success-criterion clause "required-but-unanswered questions block navigation to results" — voter-side half.

## Problem

The voter app today has **no required-info-question gating surface**. CLAUDE.md's "Context Destructuring Rule (Svelte 5)" mentions `requiredInfoQuestions` and `unansweredOpinionQuestions` as reactive accessors — but on closer reading those mentions refer to the **candidate context**, not the voter context. Verified with two greps:

```
$ grep -n "requiredInfoQuestions\|unansweredRequiredInfo\|profileComplete" \
       apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts \
       apps/frontend/src/lib/contexts/voter/voterContext.type.ts
# 0 matches — voter context exposes neither the derivation nor the type.

$ grep -n "requiredInfoQuestions\|unansweredRequiredInfo\|profileComplete" \
       apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
# Multiple matches — candidate context exposes the full derivation at lines 347-368.
```

On the **candidate side**, `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:347-368` derives:
- `requiredInfoQuestions = _infoQuestions.filter((q) => !customData.locked && customData.required)`
- `unansweredRequiredInfoQuestions = requiredInfoQuestions.filter((q) => isEmptyValue(savedData.answers?.[q.id]?.value))`
- `profileComplete = unansweredRequiredInfoQuestions.length === 0 && unansweredOpinionQuestions.length === 0`

Consumers like `apps/frontend/src/routes/candidate/(protected)/+page.svelte:129,144` use `unansweredRequiredInfoQuestions?.length !== 0` to disable the Questions / Preview buttons. The candidate app HAS a meaningful surface to assert against.

The **voter side** has NO analog. The voter's "must-answer" enforcement is the `matching.minimumAnswers` threshold at `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:312-322` — which is a global numeric floor across all opinion questions, NOT per-question `customData.required` enforcement. That threshold is already covered by Phase 74 E2E-02 (`tests/tests/specs/voter/voter-browse-without-match.spec.ts` under the `variant-low-minimum-answers` project) and is a different mechanism.

Consequence: the voter app today cannot ENFORCE that the voter has answered specific required info questions before viewing results. Phase 77 Plan 04 therefore covers only the **candidate-required** cell (under `variant-hidden-required-candidate`) and the **voter-hidden** cell (under `variant-hidden-required-voter`); the **voter-required** cell is PASS-WITH-DEFERRAL.

## Evidence (file:line citations)

- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — full file scan returns 0 hits for `requiredInfoQuestions` / `unansweredRequiredInfo*` / `profileComplete`.
- `apps/frontend/src/lib/contexts/voter/voterContext.type.ts` — same: 0 hits.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:347-368` — the candidate-side analog Phase 77 Plan 04 candidate-required cell asserts against.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts:160,168` — `unansweredRequiredInfoQuestions: Array<AnyQuestionVariant>` + `profileComplete: boolean` declared on the candidate context type.
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:312-322` — the only voter-side "must-answer" gate (`matching.minimumAnswers` threshold) — covered by Phase 74 E2E-02 (different mechanism).
- `apps/frontend/src/routes/candidate/(protected)/+page.svelte:129,144` — candidate-side consumer; voter-side has no comparable consumer.

## Acceptance Criteria (when this todo is picked up)

- [ ] Voter context exposes `requiredInfoQuestions` / `unansweredRequiredInfoQuestions` symbols analogous to `candidateContext.svelte.ts:347-358`. Type updated in `voterContext.type.ts`.
- [ ] Voter-side gating: at least ONE of the voter-app's navigation paths (results CTA, "show results" button, or an explicit results-page redirect-gate) honors `unansweredRequiredInfoQuestions.length === 0` as a precondition.
- [ ] CLAUDE.md "Context Destructuring Rule (Svelte 5)" voter-side reactive-accessor list is updated to include the new symbols.
- [ ] New E2E cell (extending the Phase 77 P04 `voter-visibility-required.spec.ts` OR a new dedicated `voter-required-info.spec.ts` under `variant-hidden-required-voter`) asserts:
  1. Voter walks /questions → encounters a required-info question (e.g., `test-question-displayname` flipped to `customData.required: true` in `variant-hidden-required.ts`).
  2. Voter leaves the required-info question unanswered.
  3. Attempts to navigate to /results → either redirected back OR the CTA is disabled.
- [ ] No regression on Phase 77 P04's existing voter-hidden cell or candidate-required cell.
- [ ] Documentation updated in `CLAUDE.md` and `.planning/REQUIREMENTS.md` SETTINGS-03 to reflect that voter + candidate sides BOTH enforce required-info questions.

## Why now (NOT v2.9)

Per Phase 77 RESEARCH LANDMINE-3 + ROADMAP §"Phase 77 is content-heavy spec authoring + variant-fixture authoring on a stable suite — NOT new product behavior, NOT framework migration": adding the voter-side required-info gating surface is **feature-class work** that exceeds the coverage-phase guardrail. A dedicated voter-experience milestone in v2.10+ is the appropriate home. Phase 77 Plan 04 closes the asserter-able half of SETTINGS-03 today (voter-hidden + candidate-required); this todo captures the remaining voter-required half for downstream product work.

## Notes

- This todo is filed alongside Phase 77 Plan 04's `voter-visibility-required.spec.ts` + `candidate-required-info.spec.ts` per the SETTINGS-03 reframing rationale (Plan 05 will document SC-3 partial-coverage rationale in `77-VERIFICATION.md`).
- Implementation hint: the candidate-side `requiredInfoQuestions` derivation at `candidateContext.svelte.ts:347-358` is the canonical reference — port the `$derived` chain into `voterContext.svelte.ts` after the existing `_infoQuestions` definition, then expose via the context return object.
- The voter-required-info enforcement clause in SETTINGS-03 is partially redundant with `matching.minimumAnswers` for opinion questions; the gap is specifically for **info** questions (which the minimumAnswers threshold does not cover).
- Phase 77 Plan 04 variant fixture (`tests/tests/setup/templates/variant-hidden-required.ts`) already flips `customData.required: true` on `test-question-displayname` AND deletes Alpha's answer for that question. When the voter-side enforcement lands, the variant overlay can be reused without modification — a voter who visits the variant project would encounter the unanswered required info question and trigger the new gating surface.

## Source references

- `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-RESEARCH.md` §"LANDMINE-3" + §"SETTINGS-03 Candidate-side vs. Voter-side Surface Audit".
- `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-CONTEXT.md` §D-08.
- `.planning/phases/77-settings-matrix-question-customization-gap-fills/77-04-PLAN.md` Task 5.
- `.planning/REQUIREMENTS.md` §SETTINGS-03.
- `.planning/ROADMAP.md` Phase 77.

## Cross-Links

- `tests/tests/specs/voter/voter-visibility-required.spec.ts` — Phase 77 P04 voter-hidden cell (lands today); voter-required cell is this todo.
- `tests/tests/specs/candidate/candidate-required-info.spec.ts` — Phase 77 P04 candidate-required cell (lands today); voter-required cell is the analog this todo seeks to add.
- `tests/tests/setup/templates/variant-hidden-required.ts` — variant fixture for both SETTINGS-03 sides; voter-required cell can reuse without modification once the voter-side enforcement surface exists.
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:215-230` — voter-context filter chain where the new `requiredInfoQuestions` derivation would land.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:347-368` — canonical candidate-side reference for the derivation pattern to port.
