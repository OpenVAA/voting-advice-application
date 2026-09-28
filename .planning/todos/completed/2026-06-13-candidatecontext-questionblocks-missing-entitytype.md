---
created: "2026-06-13T00:00:00.000Z"
title: candidateContext questionBlocks getApplicableQuestions missing entityType
area: frontend
priority: medium
files:
  - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
source: Phase 111 code review (WR-02) — pre-existing bug confirmed via git show 0e6f39f5a, deferred to preserve behaves-identically contract
resolves_phase: 123
---

## Problem

In `candidateContext.svelte.ts`, the third `$effect` in the constructor builds `nextBlocks` for
`#questionBlocks` at line 368:

```typescript
const nextBlocks = nextOpinionCats
  .map((c) => c.getApplicableQuestions({ elections, constituencies }))  // ← missing entityType
  .filter((b) => b.length > 0);
```

All three other `getApplicableQuestions` calls in the same `$effect` (lines 354, 359, 362) pass
`entityType: ENTITY_TYPE.Candidate`:

```typescript
// line 354
const nextOpinionCats = opinionQuestionCategories.getApplicableCategories({ elections, constituencies, entityType });
// line 359
const nextInfoQuestions = nextInfoCats.flatMap((c) => c.getApplicableQuestions({ elections, constituencies, entityType }));
// line 362
const nextOpinionQuestions = nextOpinionCats.flatMap((c) => c.getApplicableQuestions({ elections, constituencies, entityType }));
```

The missing `entityType` in the `questionBlocks` computation means `#questionBlocks` may include
questions that do not apply to the `Candidate` entity type, while `opinionQuestions` (line 362)
correctly filters them out. A consumer iterating `questionBlocks` entries would see more questions
than `opinionQuestions` — a discrepancy between two surfaces that are supposed to be in sync.

The bug predates Phase 111 (confirmed via `git show 0e6f39f5a`) and was preserved verbatim in the
CLASS-06 refactor. Deferred from Phase 111 to keep the "behaves-identically" migration contract.

## Solution

Add `entityType` to the `nextBlocks` map call to match all sibling calls:

```typescript
const nextBlocks = nextOpinionCats
  .map((c) => c.getApplicableQuestions({ elections, constituencies, entityType }))
  .filter((b) => b.length > 0);
```

`entityType` is already in scope at that point in the `$effect` (destructured from
`this.#appContext` / resolved from context at effect entry). Verify after the fix that the
`questionBlocks` count matches `opinionQuestions.length` in the candidate question flow.
